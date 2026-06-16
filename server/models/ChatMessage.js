const mongoose = require('mongoose');

const chatMessageSchema = new mongoose.Schema({
  roomId: { type: String, required: true }, // For customers, this is their userId
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  senderRole: { type: String, required: true, enum: ['customer', 'admin', 'staff'] },
  message: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('ChatMessage', chatMessageSchema);
