const express = require('express');
const router = express.Router();
const { 
  sendMessageToMargaret, 
  getChatHistory, 
  clearChatHistory 
} = require('../controllers/margaretController');
const { protect } = require('../middleware/auth');

// All routes are protected
router.post('/chat', protect, sendMessageToMargaret);
router.get('/chat/:userId', protect, getChatHistory);
router.delete('/chat/:userId', protect, clearChatHistory);

module.exports = router;
