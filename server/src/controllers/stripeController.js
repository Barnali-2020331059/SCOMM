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

// NOTE: This route needs raw body — handled in stripeRouter with express.raw()
const stripeWebhook = async (req, res) => {
    const sig = req.headers['stripe-signature'];
    let event;

    try {
        event = stripe.webhooks.constructEvent(req.body, sig, stripeWebhookSecret);
    } catch (err) {
        console.error('Stripe webhook signature error:', err.message);
        return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    if (event.type === 'checkout.session.completed') {
        const session = event.data.object;
        const orderId = session.metadata?.orderId;
        if (orderId) {
            await Order.findByIdAndUpdate(orderId, {
                isPaid: true,
                paidAt: new Date(),
                status: 'processing',
                'paymentResult.id': session.payment_intent,
                'paymentResult.status': session.payment_status,
            });
            console.log(`Order ${orderId} marked as paid`);
        }
    }

    res.json({ received: true });
};

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

        const session = await stripe.checkout.sessions.create({
            mode: 'payment',
            payment_method_types: ['card'],
            line_items: order.orderItems.map((item) => ({
                price_data: {
                    currency: 'usd',
                    product_data: {
                        name: item.name,
                        images: buildAbsoluteImage(item.image, req) ? [buildAbsoluteImage(item.image, req)] : [],
                    },
                    unit_amount: Math.round(Number(item.price || 0) * 100),
                },
                quantity: Number(item.qty || 1),
            })),
            metadata: { orderId: String(order._id) },
            success_url: `${clientURL}/orders/${order._id}?paid=1`,
            cancel_url: `${clientURL}/orders/${order._id}?canceled=1`,
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

module.exports = { stripeWebhook, createCheckoutSession };