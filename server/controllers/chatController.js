const { getMySQLPool } = require('../config/db.mysql');

const getActiveChats = async (req, res, next) => {
  try {
    if (req.user.role !== 'admin' && req.user.role !== 'staff') {
      return res.status(403).json({ success: false, message: 'Unauthorized access.' });
    }

    const pool = getMySQLPool();
    // Get unique rooms with their latest message
    const [rows] = await pool.query(`
      SELECT 
        room_id AS _id,
        SUBSTRING_INDEX(GROUP_CONCAT(message ORDER BY created_at DESC SEPARATOR '|||'), '|||', 1) AS lastMessage,
        SUBSTRING_INDEX(GROUP_CONCAT(sender_name ORDER BY created_at DESC SEPARATOR '|||'), '|||', 1) AS senderName,
        SUBSTRING_INDEX(GROUP_CONCAT(sender_role ORDER BY created_at DESC SEPARATOR '|||'), '|||', 1) AS senderRole,
        MAX(created_at) AS updatedAt
      FROM chat_messages
      GROUP BY room_id
      ORDER BY updatedAt DESC
    `);

    res.status(200).json({ success: true, chats: rows });
  } catch (error) {
    next(error);
  }
};

const getChatHistory = async (req, res, next) => {
  const { roomId } = req.params;
  try {
    if (req.user.role === 'customer' && roomId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access.' });
    }

    const pool = getMySQLPool();
    const [rows] = await pool.query(
      'SELECT * FROM chat_messages WHERE room_id = ? ORDER BY created_at ASC',
      [roomId]
    );
    const messages = rows.map(r => ({
      id: r.id,
      roomId: r.room_id,
      senderId: r.sender_id,
      senderName: r.sender_name,
      senderRole: r.sender_role,
      message: r.message,
      createdAt: r.created_at
    }));
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
