const express = require('express');
const { streamNotifications } = require('../controllers/notificationController');
const { authenticate } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/admin');

const notificationRouter = express.Router();

// Only admins can connect to the SSE stream
notificationRouter.get('/stream', authenticate, requireAdmin, streamNotifications);

module.exports = notificationRouter;