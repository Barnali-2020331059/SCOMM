const express = require('express');
const { stripeWebhook, createCheckoutSession } = require('../controllers/stripeController');
const { authenticate } = require('../middleware/auth');

const stripeRouter = express.Router();

// express.raw() is required here — Stripe needs the raw body to verify the signature
stripeRouter.post('/webhook', express.raw({ type: 'application/json' }), stripeWebhook);
stripeRouter.post('/create-checkout-session', express.json(), authenticate, createCheckoutSession);

module.exports = stripeRouter;