const express = require('express');
const router = express.Router();
const chatController = require('../controllers/chatController');
const { protect } = require('../middleware/authMiddleware');

// Get all clinics for inbox (or pet owners if user is a clinic)
router.get('/clinics', protect, chatController.getAllClinics);

// Conversation routes
router.get('/conversations', protect, chatController.getConversations);
router.post('/conversations', protect, chatController.startConversation);

// Message routes
router.get('/conversations/:conversationId/messages', protect, chatController.getMessages);
router.post('/conversations/:conversationId/messages', protect, chatController.sendMessage);

module.exports = router; 