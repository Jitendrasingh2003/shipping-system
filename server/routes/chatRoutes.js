const express = require('express');
const router = express.Router();
const { getActiveChats, getChatHistory, askAi } = require('../controllers/chatController');
const { protect } = require('../middleware/auth');

// Protected chat routes
router.get('/active', protect, getActiveChats);
router.get('/history/:roomId', protect, getChatHistory);
router.post('/ai', protect, askAi);

module.exports = router;
