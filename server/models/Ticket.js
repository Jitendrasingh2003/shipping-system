const mongoose = require('mongoose');

const ticketSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  senderName: { type: String, required: true },
  category: { 
    type: String, 
    enum: ['Damage package', 'Delay', 'Billing', 'General'], 
    default: 'General' 
  },
  title: { type: String, required: true },
  message: { type: String, required: true },
  status: { type: String, enum: ['open', 'resolved'], default: 'open' }
}, { timestamps: true });

module.exports = mongoose.model('Ticket', ticketSchema);
