const Chat = require('../models/Chat');

// @desc    Send message to Margaret AI
// @route   POST /api/margaret/chat
// @access  Private
exports.sendMessageToMargaret = async (req, res) => {
  try {
    const { userId, message, sleepPlanId, childAge, childMonths } = req.body;

    // Validate user is sending their own message
    if (userId !== req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to send messages for another user'
      });
    }

    // Find existing chat or create a new one
    let chat = await Chat.findOne({ userId });

    if (!chat) {
      chat = new Chat({
        userId,
        sleepPlanId,
        childAge,
        childMonths,
        messages: []
      });
    }

    // Add user message to chat
    chat.messages.push({
      sender: 'user',
      message
    });

    // Generate Margaret's response based on the message
    const margaretResponse = generateMargaretResponse(message, childAge, childMonths);

    // Add Margaret's response to chat
    chat.messages.push({
      sender: 'margaret',
      message: margaretResponse
    });

    // Save the chat
    await chat.save();

    res.status(200).json({
      status: 'success',
      data: {
        message: margaretResponse,
        chatId: chat._id
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Get chat history for a user
// @route   GET /api/margaret/chat/:userId
// @access  Private
exports.getChatHistory = async (req, res) => {
  try {
    // Validate user is accessing their own chat history
    if (req.params.userId !== req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to access this chat history'
      });
    }

    const chat = await Chat.findOne({ userId: req.params.userId });

    if (!chat) {
      return res.status(200).json({
        status: 'success',
        data: { messages: [] }
      });
    }

    res.status(200).json({
      status: 'success',
      data: chat
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// @desc    Clear chat history for a user
// @route   DELETE /api/margaret/chat/:userId
// @access  Private
exports.clearChatHistory = async (req, res) => {
  try {
    // Validate user is clearing their own chat history
    if (req.params.userId !== req.user.id) {
      return res.status(401).json({
        status: 'error',
        message: 'Not authorized to clear this chat history'
      });
    }

    await Chat.findOneAndDelete({ userId: req.params.userId });

    res.status(200).json({
      status: 'success',
      message: 'Chat history cleared successfully'
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};

// Helper function to generate Margaret's responses
// In a real application, this would be connected to an AI service
function generateMargaretResponse(message, childAge, childMonths) {
  // Simple response generation based on keywords in the message
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('sleep') && lowerMessage.includes('not')) {
    return `Based on what you've shared about your ${childAge}-year ${childMonths}-month old, I recommend establishing a consistent bedtime routine. Start with a warm bath, followed by quiet activities like reading. Keep the room dark and at a comfortable temperature. Consistency is key to helping your child's body recognize when it's time to sleep.`;
  }
  
  if (lowerMessage.includes('nap')) {
    return `For a ${childAge}-year ${childMonths}-month old child, typically 1-2 naps per day totaling 2-3 hours is appropriate. Try to schedule naps at the same time each day, and create a brief pre-nap routine to signal it's time to rest.`;
  }
  
  if (lowerMessage.includes('night') && lowerMessage.includes('wake')) {
    return `Night wakings are common at this age. When your ${childAge}-year ${childMonths}-month old wakes up, keep interactions minimal and lights dim. Gently reassure them, but avoid creating new sleep associations like rocking or feeding to sleep. Gradually increase the time between your responses to encourage self-soothing.`;
  }
  
  if (lowerMessage.includes('routine')) {
    return `A good bedtime routine for your ${childAge}-year ${childMonths}-month old might include: bath time, changing into pajamas, brushing teeth, reading 1-2 short books, singing a lullaby, and saying goodnight. The entire routine should last about 30 minutes and be consistent each night.`;
  }
  
  // Default response if no keywords match
  return `Thank you for sharing about your ${childAge}-year ${childMonths}-month old. Every child is unique in their sleep needs. Based on your child's age, they typically need 12-14 hours of sleep in a 24-hour period. Would you like specific advice about bedtime routines, nap schedules, or night wakings?`;
}
