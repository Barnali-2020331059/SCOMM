require('dotenv').config();

const serverPort = process.env.SERVER_PORT || 3002;
const mongodbURL = process.env.MONGODB_ATLAS_URL || 'mongodb://localhost:27017/SCOMM';
const defaultImagePath = process.env.DEFAULT_USER_IMAGE_PATH || '/images/users/default.jpg';
const jwtActivationKey = process.env.JWT_ACTIVATION_KEY || 'AKDDHGHJFGJHD&*&^*&!@&';
const smtpUsername = process.env.SMTP_USERNAME || '';
const smtpPassword = process.env.SMTP_PASSWORD || '';
const clientURL = process.env.CLIENT_URL || 'http://localhost:5173';
const jwtSecret = process.env.JWT_SECRET || 'scomm-dev-secret-change-in-production';
const openaiApiKey = process.env.OPENAI_API_KEY || '';
const groqApiKey = process.env.GROQ_API_KEY || '';
const stripeSecretKey = process.env.STRIPE_SECRET_KEY || '';
const stripeWebhookSecret = process.env.STRIPE_WEBHOOK_SECRET || '';

module.exports = {
    serverPort,
    mongodbURL,
    defaultImagePath,
    jwtActivationKey,
    smtpUsername,
    smtpPassword,
    clientURL,
    jwtSecret,
    openaiApiKey,
    groqApiKey,
    stripeSecretKey,
    stripeWebhookSecret,
};