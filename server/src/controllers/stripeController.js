const { stripeWebhookSecret, stripeSecretKey, clientURL } = require('../secret');
const stripe = require('stripe')(stripeSecretKey);
const Order = require('../models/orderModel');
const createError = require('http-errors');
const { successResponse } = require('./responseController');

const buildAbsoluteImage = (imagePath = '', req) => {
    if (!imagePath) return null;
    if (/^https?:\/\//i.test(imagePath)) return imagePath;
    const base = `${req.protocol}://${req.get('host')}`;
    return `${base}${imagePath.startsWith('/') ? imagePath : `/${imagePath}`}`;
};

// ─── Stripe webhook — marks order as paid when payment completes ──────────────
// Requires raw body — handled by express.raw() in stripeRouter
const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
    } catch (err) {
        console.error('Stripe webhook signature error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    console.log(`[Stripe webhook] Event: ${event.type}`);

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        if (orderId) {
            try {
                const updated = await Order.findByIdAndUpdate(
                    orderId,
                    {
                        isPaid: true,
                        paidAt: new Date(),
                        status: 'processing',
                        'paymentResult.id': session.payment_intent,
                        'paymentResult.status': session.payment_status,
                        'paymentResult.email': session.customer_details?.email,
                    },
                    { new: true },
                );
                if (updated) {
                    console.log(`[Stripe webhook] Order ${orderId} marked as PAID ✓`);
                } else {
                    console.warn(`[Stripe webhook] Order ${orderId} not found`);
                }
            } catch (err) {
                console.error(`[Stripe webhook] Failed to update order ${orderId}:`, err.message);
            }
        }
    }

    res.json({ received: true });
};

// ─── Create checkout session (for Pay button on OrderDetail page) ─────────────
const createCheckoutSession = async (req, res, next) => {
    try {
        if (!stripeSecretKey) throw createError(500, 'Stripe is not configured on server');
        const { orderId } = req.body || {};
        if (!orderId) throw createError(400, 'orderId is required');

        const order = await Order.findById(orderId);
        if (!order) throw createError(404, 'Order not found');
        if (String(order.user) !== String(req.user._id) && !req.user.isAdmin) {
            throw createError(403, 'Not allowed to pay this order');
        }
        if (order.isPaid) throw createError(400, 'Order is already paid');

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: order.orderItems.map((item) => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                        images: buildAbsoluteImage(item.image, req)
                            ? [buildAbsoluteImage(item.image, req)]
                            : [],
                    },
                    unit_amount: Math.round(Number(item.price || 0) * 100),
                },
                quantity: Number(item.qty || 1),
            })),
            metadata: { orderId: String(order._id) },
            // Include session ID so OrderDetail can confirm payment on redirect
            success_url: `${clientURL}/orders/${order._id}?stripe_session={CHECKOUT_SESSION_ID}`,
            cancel_url: `${clientURL}/orders/${order._id}?cancelled=true`,
        });

        return successResponse(res, {
            payload: {
                url: session.url,
                sessionId: session.id,
            },
        });
    } catch (error) {
        next(error);
    }
};

// ─── Manual pay confirmation — fallback when webhook isn't running locally ─────
// Called by OrderDetail after Stripe redirects back with ?stripe_session=...
const markPaidManually = async (req, res, next) => {
    try {
        const { orderId, stripeSessionId } = req.body;
        if (!orderId) return res.status(400).json({ success: false, message: 'orderId is required' });

        // Verify the Stripe session actually completed
        if (stripeSessionId && stripeSecretKey) {
            try {
                const session = await stripe.checkout.sessions.retrieve(stripeSessionId);
                if (session.payment_status !== 'paid') {
                    return res.status(400).json({ success: false, message: 'Payment not completed' });
                }
            } catch (err) {
                console.warn('[markPaidManually] Could not verify Stripe session:', err.message);
            }
        }

        const order = await Order.findById(orderId);
        if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

        // Only update if not already paid
        if (!order.isPaid) {
            order.isPaid = true;
            order.paidAt = new Date();
            order.status = 'processing';
            if (stripeSessionId) {
                order.paymentResult = { id: stripeSessionId, status: 'paid' };
            }
            await order.save();
            console.log(`[markPaidManually] Order ${orderId} marked as PAID ✓`);
        }

        return res.json({ success: true, order });
    } catch (err) {
        next(err);
    }
};

module.exports = { stripeWebhook, createCheckoutSession, markPaidManually };