const ChatMessage = require('../models/ChatMessage');

const getActiveChats = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ success: false, message: 'Unauthorized access.' });
    }

    // Get unique active rooms grouped by roomId
    const activeRooms = await ChatMessage.aggregate([
      { $sort: { createdAt: -1 } },
      {
        $group: {
          _id: '$roomId',
          lastMessage: { $first: '$message' },
          senderName: { $first: '$senderName' },
          senderRole: { $first: '$senderRole' },
          updatedAt: { $first: '$createdAt' }
        }
      },
      { $sort: { updatedAt: -1 } }
    ]);

    res.status(200).json({ success: true, chats: activeRooms });
  } catch (error) {
    next(error);
  }
};

const getChatHistory = async (req, res, next) => {
  const { roomId } = req.params;
  try {
    // Validate ownership: Customers can only fetch their own chat history
    if (req.user.role === 'customer' && roomId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access.' });
    }

    const messages = await ChatMessage.find({ roomId }).sort({ createdAt: 1 });
    res.status(200).json({ success: true, messages });
  } catch (error) {
    next(error);
  }
};

const askAi = async (req, res, next) => {
  const { message } = req.body;
  try {
    const { getAiChatResponse } = require('../utils/aiHelper');
    const response = await getAiChatResponse(message, req.user.id);
    res.status(200).json({ success: true, response });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getActiveChats,
  getChatHistory,
  askAi
};
