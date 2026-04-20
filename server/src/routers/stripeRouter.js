const express = require('express');
const { stripeWebhook, createCheckoutSession, markPaidManually } = require('../controllers/stripeController');
const { authenticate } = require('../middleware/auth');

const stripeRouter = express.Router();

// Raw body required for Stripe webhook signature verification
// MUST be registered before bodyParser in app.js
stripeRouter.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);

// Create Stripe checkout session (called by Pay button on OrderDetail)
stripeRouter.post('/create-checkout-session', express.json(), authenticate, createCheckoutSession);

// Manual payment confirmation fallback (called by OrderDetail after Stripe redirect)
stripeRouter.post('/confirm-payment', express.json(), authenticate, markPaidManually);

module.exports = stripeRouter;