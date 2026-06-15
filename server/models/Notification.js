const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true }, // User UUID or 'admin' / 'staff' / 'all'
  title: { type: String, required: true },
  message: { type: String, required: true },
  type: { type: String, enum: ['shipment_booked', 'status_update', 'payment_success', 'general'], default: 'general' },
  isRead: { type: Boolean, default: false },
  shipmentId: { type: String, default: null }
}, { timestamps: true });

module.exports = mongoose.model('Notification', notificationSchema);
