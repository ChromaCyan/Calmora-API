const express = require('express');
const router = express.Router();
const { verifyToken, isPatient, isSpecialist } = require('../middleware/authMiddleware');
const chatController = require('../controller/chatController');

// Protect the routes by applying the middleware
router.post('/send-message', verifyToken, chatController.sendMessage);
router.get('/chat-list', verifyToken, chatController.getChatList);
router.get('/chat-history/:chatId', verifyToken, chatController.getChatHistory);

module.exports = router;
