const express = require('express');
const { chat } = require('../controllers/chatController');
const { authenticate } = require('../middleware/auth');

const chatRouter = express.Router();

// Chat is available only for authenticated users.
chatRouter.post('/', authenticate, chat);

module.exports = chatRouter;