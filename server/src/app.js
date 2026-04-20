const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const bodyParser = require('body-parser');
const createError = require('http-errors');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
const path = require('path');

const userRouter = require('./routers/userRouter');
const seedRouter = require('./routers/seedRouter');
const productRouter = require('./routers/productRouter');
const orderRouter = require('./routers/orderRouter');
const chatRouter = require('./routers/chatRouter');
const stripeRouter = require('./routers/stripeRouter');
const notificationRouter = require('./routers/notificationRouter');

const { clientURL } = require('./secret');
const { errorResponse } = require('./controllers/responseController');

const app = express();

// ── Static files ──────────────────────────────────────────────────────────────
app.use('/images', express.static(path.join(__dirname, '../public/images')));

// ── Stripe webhook MUST come before bodyParser (needs raw body) ───────────────
app.use('/api/stripe', stripeRouter);

// ── Middleware ────────────────────────────────────────────────────────────────
const rateLimiter = rateLimit({
    windowMs: 1 * 60 * 1000,
    max: 200,
    message: 'Too many requests',
});

app.use((req, res, next) => {
    const ts = new Date().toISOString();
    console.log(`[${ts}] ${req.method} ${req.url}`);
    next();
});
app.use(morgan('dev'));
app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }));
app.use(cors({
    origin: [clientURL, 'http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
}));
app.use(bodyParser.json({ limit: '5mb' }));
app.use(bodyParser.urlencoded({ extended: true, limit: '5mb' }));
app.use(rateLimiter);

// ── Routes ────────────────────────────────────────────────────────────────────
app.use('/api/users', userRouter);
app.use('/api/seed', seedRouter);
app.use('/api/products', productRouter);
app.use('/api/orders', orderRouter);
app.use('/api/chat', chatRouter);
app.use('/api/notifications', notificationRouter);

// ── Error handlers ────────────────────────────────────────────────────────────
app.use((req, res, next) => {
    next(createError(404, 'Route not found'));
});

app.use((err, req, res, next) => {
    return errorResponse(res, {
        status: err.status || 500,
        message: err.message || 'Internal server error',
    });
});

module.exports = app;