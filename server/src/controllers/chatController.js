const Groq = require('groq-sdk');
const createError = require('http-errors');
const Product = require('../models/productModel');
const Order = require('../models/orderModel');
const { successResponse } = require('./responseController');
const { clientURL, stripeSecretKey } = require('../secret');
const stripe = require('stripe')(stripeSecretKey);

// ─── Multi-key Groq client with automatic rotation ───────────────────────────
// Add keys to .env as GROQ_API_KEY_1, GROQ_API_KEY_2, etc.
// Falls back to GROQ_API_KEY if numbered keys not set
const buildGroqClients = () => {
    const keys = [];
    for (let i = 1; i <= 10; i++) {
        const key = process.env[`GROQ_API_KEY_${i}`];
        if (key) keys.push(key);
    }
    if (!keys.length && process.env.GROQ_API_KEY) keys.push(process.env.GROQ_API_KEY);
    if (!keys.length) throw new Error('No Groq API keys configured');
    return keys.map((k) => new Groq({ apiKey: k }));
};

const groqClients = buildGroqClients();
let currentKeyIndex = 0;

const callGroq = async (params, attempt = 0) => {
    if (attempt >= groqClients.length) {
        throw new Error('All Groq API keys are rate limited. Please try again in a minute.');
    }
    try {
        return await groqClients[currentKeyIndex].chat.completions.create(params);
    } catch (err) {
        const isRateLimit =
            err?.status === 429 ||
            err?.error?.code === 'rate_limit_exceeded' ||
            String(err?.message).toLowerCase().includes('rate_limit') ||
            String(err?.message).toLowerCase().includes('tokens per minute');
        if (isRateLimit) {
            console.warn(`Groq key ${currentKeyIndex + 1} rate limited → switching to key ${((currentKeyIndex + 1) % groqClients.length) + 1}`);
            currentKeyIndex = (currentKeyIndex + 1) % groqClients.length;
            return callGroq(params, attempt + 1);
        }
        throw err;
    }
};

// ─── Use smarter model — better instruction following ─────────────────────────
const MODEL = 'openai/gpt-oss-120b';
const MAX_HISTORY_MESSAGES = 10;
const MAX_ITERATIONS = 20;
const CONFIRM_RE = /\b(yes|confirm|confirmed|go ahead|proceed|place it|place the order|ok|okay|sure|do it)\b/i;

// ─── Tool definitions ─────────────────────────────────────────────────────────
const TOOLS = [
    {
        type: 'function',
        function: {
            name: 'search_products',
            description: 'Search SCOMM store products. YOU MUST call this tool for ANY product-related question. NEVER answer product questions from memory.',
            parameters: {
                type: 'object',
                properties: {
                    query: { type: 'string', description: 'Product name, type, or keyword' },
                    category: {
                        type: 'string',
                        enum: ['Electronics', 'Fashion', 'Home & Living', 'Sports', 'Beauty', 'Books'],
                    },
                    max_price: { type: 'number' },
                    min_price: { type: 'number' },
                    limit: { type: 'number', description: 'Max results, default 5' },
                },
                required: [],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_product_details',
            description: 'Get full details of a specific SCOMM product by its ID.',
            parameters: {
                type: 'object',
                properties: {
                    product_id: { type: 'string' },
                },
                required: ['product_id'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_my_orders',
            description: 'Get orders placed by the current logged-in user.',
            parameters: {
                type: 'object',
                properties: { limit: { type: 'number' } },
                required: [],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'get_order_details',
            description: 'Get details of a specific order by ID.',
            parameters: {
                type: 'object',
                properties: { order_id: { type: 'string' } },
                required: ['order_id'],
            },
        },
    },
    {
        type: 'function',
        function: {
            name: 'create_order',
            description: 'Place an order. Only call after user explicitly confirms with yes/confirm.',
            parameters: {
                type: 'object',
                properties: {
                    items: {
                        type: 'array',
                        items: {
                            type: 'object',
                            properties: {
                                product_id: { type: 'string' },
                                qty: { type: 'number' },
                            },
                            required: ['product_id', 'qty'],
                        },
                    },
                    shipping_address: {
                        type: 'object',
                        properties: {
                            fullName: { type: 'string' },
                            address: { type: 'string' },
                            city: { type: 'string' },
                            postalCode: { type: 'string' },
                            country: { type: 'string' },
                            phone: { type: 'string' },
                        },
                        required: ['fullName', 'address', 'city', 'country'],
                    },
                },
                required: ['items', 'shipping_address'],
            },
        },
    },
];

// ─── Tool handlers ────────────────────────────────────────────────────────────

const handleSearchProducts = async (input) => {
    const filter = { countInStock: { $gt: 0 } };
    if (input.category) filter.category = input.category;
    if (input.min_price != null || input.max_price != null) {
        filter.price = {};
        if (input.min_price != null) filter.price.$gte = Number(input.min_price);
        if (input.max_price != null) filter.price.$lte = Number(input.max_price);
    }
    if (input.query) {
        filter.$or = [
            { name: { $regex: input.query, $options: 'i' } },
            { description: { $regex: input.query, $options: 'i' } },
            { brand: { $regex: input.query, $options: 'i' } },
            { category: { $regex: input.query, $options: 'i' } },
        ];
    }

    const limit = Math.min(input.limit || 5, 8);
    let products = await Product.find(filter).limit(limit).sort({ rating: -1 });

    // Fallback 1: try individual words
    if (!products.length && input.query) {
        const words = input.query.split(/\s+/).filter((w) => w.length > 2);
        if (words.length > 1) {
            const wordFilter = {
                countInStock: { $gt: 0 },
                $or: words.flatMap((w) => [
                    { name: { $regex: w, $options: 'i' } },
                    { description: { $regex: w, $options: 'i' } },
                    { brand: { $regex: w, $options: 'i' } },
                ]),
            };
            if (input.category) wordFilter.category = input.category;
            products = await Product.find(wordFilter).limit(limit).sort({ rating: -1 });
        }
    }

    // Fallback 2: top-rated from category
    if (!products.length && input.category) {
        products = await Product.find({ category: input.category, countInStock: { $gt: 0 } })
            .limit(limit)
            .sort({ rating: -1 });
    }

    // Fallback 3: all top-rated products
    if (!products.length) {
        products = await Product.find({ countInStock: { $gt: 0 } }).limit(5).sort({ rating: -1 });
    }

    if (!products.length) return { found: false, message: 'No products in store.' };

    return products.map((p) => ({
        id: String(p._id),
        name: p.name,
        brand: p.brand,
        category: p.category,
        price: p.price,
        rating: p.rating,
        countInStock: p.countInStock,
        description: p.description?.slice(0, 100),
        image: p.image,
        // url is used by the AI to reference products — internal path only
        url: `/product/${p._id}`,
    }));
};

const handleGetProductDetails = async (input) => {
    const product = await Product.findById(input.product_id);
    if (!product) return { error: 'Product not found' };
    return {
        id: String(product._id),
        name: product.name,
        brand: product.brand,
        category: product.category,
        price: product.price,
        rating: product.rating,
        numReviews: product.numReviews,
        countInStock: product.countInStock,
        description: product.description?.slice(0, 200),
        image: product.image,
        url: `/product/${product._id}`,
    };
};

const handleGetMyOrders = async (userId, input) => {
    const orders = await Order.find({ user: userId })
        .sort({ createdAt: -1 })
        .limit(Math.min(input.limit || 5, 5));
    if (!orders.length) return { found: false, message: 'No orders found.' };
    return orders.map((o) => ({
        id: String(o._id),
        status: o.status,
        isPaid: o.isPaid,
        totalPrice: o.totalPrice,
        createdAt: o.createdAt,
        items: o.orderItems.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
    }));
};

const handleGetOrderDetails = async (userId, input) => {
    const order = await Order.findById(input.order_id);
    if (!order) return { error: 'Order not found' };
    if (String(order.user) !== String(userId)) return { error: 'Not authorized' };
    return {
        id: String(order._id),
        status: order.status,
        isPaid: order.isPaid,
        paidAt: order.paidAt,
        isDelivered: order.isDelivered,
        totalPrice: order.totalPrice,
        itemsPrice: order.itemsPrice,
        shippingPrice: order.shippingPrice,
        taxPrice: order.taxPrice,
        shippingAddress: order.shippingAddress,
        items: order.orderItems.map((i) => ({ name: i.name, qty: i.qty, price: i.price })),
        createdAt: order.createdAt,
    };
};

const handleCreateOrder = async (userId, input) => {
    const mongoose = require('mongoose');
    const session = await mongoose.startSession();
    session.startTransaction();
    try {
        let itemsPrice = 0;
        const resolvedItems = [];
        const stripeLineItems = [];

        for (const item of input.items) {
            const product = await Product.findById(item.product_id).session(session);
            if (!product) throw new Error(`Product not found: ${item.product_id}`);
            if (product.countInStock < item.qty)
                throw new Error(`Only ${product.countInStock} left in stock for "${product.name}"`);

            itemsPrice += product.price * item.qty;
            resolvedItems.push({
                product: product._id,
                name: product.name,
                image: product.image,
                price: product.price,
                qty: item.qty,
                category: product.category,
            });
            stripeLineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: product.name,
                        images: product.image?.startsWith('http') ? [product.image] : [],
                    },
                    unit_amount: Math.round(product.price * 100),
                },
                quantity: item.qty,
            });
            product.countInStock -= item.qty;
            await product.save({ session });
        }

        const shippingPrice = itemsPrice > 100 ? 0 : 9.99;
        const taxPrice = Math.round(itemsPrice * 0.08 * 100) / 100;
        const totalPrice = Math.round((itemsPrice + shippingPrice + taxPrice) * 100) / 100;

        const [order] = await Order.create(
            [{
                user: userId,
                orderItems: resolvedItems,
                shippingAddress: input.shipping_address,
                paymentMethod: 'card',
                itemsPrice,
                shippingPrice,
                taxPrice,
                totalPrice,
            }],
            { session },
        );

        if (shippingPrice > 0) {
            stripeLineItems.push({
                price_data: {
                    currency: 'usd',
                    product_data: { name: 'Shipping' },
                    unit_amount: Math.round(shippingPrice * 100),
                },
                quantity: 1,
            });
        }

        const stripeSession = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: stripeLineItems,
            mode: 'payment',
            success_url: `${clientURL}/orders/${order._id}?paid=true`,
            cancel_url: `${clientURL}/orders/${order._id}?cancelled=true`,
            metadata: { orderId: String(order._id) },
        });

        await session.commitTransaction();
        session.endSession();

        return {
            success: true,
            orderId: String(order._id),
            itemsPrice,
            shippingPrice,
            taxPrice,
            totalPrice,
            checkoutUrl: stripeSession.url,
        };
    } catch (err) {
        await session.abortTransaction();
        session.endSession();
        return { error: err.message };
    }
};

// ─── Execute tool ─────────────────────────────────────────────────────────────
const executeTool = async (name, args, userId, latestUserMessage = '') => {
    console.log("Executing Tool:", name, args); // ✅ DEBUG LOG
    let result;

    switch (name) {
        case 'search_products': return handleSearchProducts(args);
        case 'get_product_details': return handleGetProductDetails(args);
        case 'get_my_orders':
            if (!userId) return { error: 'User must be logged in.' };
            return handleGetMyOrders(userId, args);
        case 'get_order_details':
            if (!userId) return { error: 'User must be logged in.' };
            return handleGetOrderDetails(userId, args);
        case 'create_order':
            if (!userId) return { error: 'User must be logged in.' };
            if (!CONFIRM_RE.test(latestUserMessage))
                return { error: 'Awaiting confirmation. Ask user to reply "yes, confirm".' };
            return handleCreateOrder(userId, args);
        default:
            result = { error: `Unknown tool: ${name}` };
    }
    console.log("Tool Result:", result); // ✅ DEBUG LOG
    return result;
};

// ─── System prompt ────────────────────────────────────────────────────────────
const buildSystemPrompt = (user) => `You are SCOMM Assistant — an AI shopping agent for SCOMM Store.
${user ? `Logged-in user: ${user.name}.` : 'Guest user.'}

ABSOLUTE RULES — never break these:
1. You MUST call search_products for ANY product question before responding. No exceptions.
2. ONLY recommend products returned by search_products. NEVER mention brands or products not in the results.
3. When listing products use EXACTLY this format for each item (one per line):
   **[name]** — $[price] ⭐[rating] — [one short reason] [PRODUCT:[id]]
   Example: **Aurora Headphones** — $249 ⭐4.8 — Great noise cancellation [PRODUCT:507f1f77bcf86cd799439011]
4. The [PRODUCT:id] tag is mandatory for every product — the system uses it to show product cards.
5. Do NOT include any URLs, external links, or website addresses in your text.
6. Do NOT show raw tags, function names, JSON, or technical syntax to the user.
7. For ordering:
   a. Show a clean summary: each item with price×qty, subtotal, shipping ($9.99 or FREE over $100), 8% tax, total
   b. Ask "Shall I place this order? Reply **yes, confirm** to proceed."
   c. If no shipping address provided, ask for: full name, street address, city, postal code, country
   d. Call create_order ONLY after explicit confirmation
8. Keep responses friendly and concise.
9. You MUST ONLY reference and tag products that are directly relevant to the user's latest request.
10. NEVER include or mention products from previous searches unless the user explicitly asks.
11. If the user asks about a single product, ONLY show that product — no additional items.
12. If no relevant products are found, say so clearly instead of showing unrelated items.

Store: Electronics, Fashion, Home & Living, Sports, Beauty, Books. Free shipping over $100, else $9.99. 8% tax. 30-day returns.`;

// ─── Trim history ─────────────────────────────────────────────────────────────
const trimHistory = (messages) => {
    if (messages.length <= MAX_HISTORY_MESSAGES) return messages;
    return [messages[0], ...messages.slice(-(MAX_HISTORY_MESSAGES - 1))];
};

// ─── Extract [PRODUCT:id] tags from AI text ───────────────────────────────────
const PRODUCT_TAG_RE = /\[PRODUCT:([a-f0-9]{24})\]/gi;

const extractProductIds = (text) => {
    const ids = [];
    let match;
    while ((match = PRODUCT_TAG_RE.exec(text)) !== null) {
        if (!ids.includes(match[1])) ids.push(match[1]);
    }
    return ids;
};

// ─── Strip all internal tags and leaked syntax from text ─────────────────────
const sanitizeText = (text) => {
    return text
        // Remove [PRODUCT:id] tags
        .replace(/\[PRODUCT:[a-f0-9]{24}\]/gi, '')
        // Remove {{PRODUCT_ID:...}} legacy tags
        .replace(/\{\{PRODUCT_ID:[^}]+\}\}/gi, '')
        // Remove leaked function call syntax like <function=...>{...}</function>
        .replace(/<function=[^>]+>[\s\S]*?<\/function>/gi, '')
        // Remove raw JSON-like blobs that start with { and have quotes
        .replace(/\{"[^}]{0,200}"\}/g, '')
        // Remove bare URLs (we show product cards instead)
        .replace(/https?:\/\/[^\s)>]+/gi, '')
        // Clean up multiple spaces/newlines left behind
        .replace(/[ \t]{2,}/g, ' ')
        .replace(/\n{3,}/g, '\n\n')
        .trim();
};

// ─── Main chat handler ────────────────────────────────────────────────────────
const chat = async (req, res, next) => {
    try {
        const { messages } = req.body;
        if (!Array.isArray(messages) || !messages.length) {
            throw createError(400, 'messages array is required');
        }

        const userId = req.user?._id || null;
        const user = req.user || null;
        const latestUserMessage =
            [...messages].reverse().find((m) => m.role === 'user')?.content || '';

        const trimmed = trimHistory(messages);
        let currentMessages = trimmed.map((m) => ({ role: m.role, content: m.content }));

        let finalText = '';
        let allSearchedProducts = [];
        let checkoutUrl = null;

        for (let i = 0; i < MAX_ITERATIONS; i++) {
            const response = await callGroq({
                model: MODEL,
                max_tokens: 700,
                temperature: 0.2, // lower = more obedient to instructions
                messages: [
                    { role: 'system', content: buildSystemPrompt(user) },
                    ...currentMessages,
                ],
                tools: TOOLS,
                tool_choice: 'auto',
            });

            const choice = response.choices[0];
            const assistantMessage = choice.message;

            console.log("Assistant Message:", assistantMessage); // ✅ DEBUG LOG


            if (assistantMessage.content) finalText = assistantMessage.content;
            if (!assistantMessage.tool_calls?.length) break;

            currentMessages.push({
                role: 'assistant',
                content: assistantMessage.content || '',
                tool_calls: assistantMessage.tool_calls,
            });

            for (const toolCall of assistantMessage.tool_calls) {

                console.log(
                    "Tool Call:",
                    toolCall.function.name,
                    toolCall.function.arguments
                ); // ✅ DEBUG LOG

                let args = {};
                try { args = JSON.parse(toolCall.function.arguments); } catch { /* ignore */ }

                const result = await executeTool(toolCall.function.name, args, userId, latestUserMessage);

                // Collect all products from tool results
                if (Array.isArray(result)) {
                    allSearchedProducts = [...allSearchedProducts, ...result];
                } else if (result?.id && result?.name) {
                    allSearchedProducts.push(result);
                }

                if (toolCall.function.name === 'create_order' && result?.checkoutUrl) {
                    checkoutUrl = result.checkoutUrl;
                }

                currentMessages.push({
                    role: 'tool',
                    tool_call_id: toolCall.id,
                    content: JSON.stringify(result),
                });
            }
        }

        console.log("Final Raw Text:", finalText); // ✅ DEBUG LOG

        // Build product map
        const productMap = new Map(allSearchedProducts.map((p) => [String(p.id || p._id), p]));

        // Extract products the AI tagged in its response
        // Reset regex lastIndex before use
        PRODUCT_TAG_RE.lastIndex = 0;
        const mentionedIds = extractProductIds(finalText);
        let productsToShow = mentionedIds.map((id) => productMap.get(id)).filter(Boolean);

        // Fallback: show all searched products if none were tagged
        if (!productsToShow.length && allSearchedProducts.length > 0) {
            productsToShow = allSearchedProducts.slice(0, 5);
        }

        // Clean the text — remove all tags, leaked syntax, bare URLs
        const cleanedText = sanitizeText(finalText);

        return successResponse(res, {
            payload: {
                message: cleanedText,
                products: productsToShow,
                checkoutUrl: checkoutUrl || null,
            },
        });
    } catch (error) {
        next(error);
    }
};

module.exports = { chat };