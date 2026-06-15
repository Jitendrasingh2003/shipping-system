const mongoose = require('mongoose');

const paymentSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  orderId: { type: String, required: true },
  paymentId: { type: String, default: null },
  signature: { type: String, default: null },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: { type: String, enum: ['pending', 'paid', 'failed'], default: 'pending' }
}, { timestamps: true });

module.exports = mongoose.model('PaymentMongo', paymentSchema);
