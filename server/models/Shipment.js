const mongoose = require('mongoose');

const historySchema = new mongoose.Schema({
  status: { type: String, required: true },
  location: { type: String, default: '' },
  timestamp: { type: Date, default: Date.now },
  updatedBy: { type: String, default: 'System' }
}, { _id: false });

const shipmentSchema = new mongoose.Schema({
  trackingId: { type: String, required: true, unique: true },
  senderId: { type: String, required: true },
  senderName: { type: String, required: true },
  recipientName: { type: String, required: true },
  recipientAddress: { type: String, required: true },
  originCity: { type: String, required: true },
  destinationCity: { type: String, required: true },
  weight: { type: Number, required: true },
  dimensions: {
    length: { type: Number, required: true },
    width: { type: Number, required: true },
    height: { type: Number, required: true }
  },
  shipmentType: { type: String, enum: ['Standard', 'Express', 'Air', 'Ocean'], default: 'Standard' },
  status: { 
    type: String, 
    enum: ['Pending Payment', 'Booked', 'Picked up', 'In Transit', 'Out for Delivery', 'Delivered', 'Cancelled'], 
    default: 'Pending Payment' 
  },
  assignedStaffId: { type: String, default: null },
  assignedStaffName: { type: String, default: null },
  estimatedDeliveryDays: { type: Number, default: null },
  paymentStatus: { type: String, enum: ['Pending', 'Paid', 'Failed'], default: 'Pending' },
  paymentId: { type: String, default: null },
  history: [historySchema]
}, { timestamps: true });

module.exports = mongoose.model('Shipment', shipmentSchema);
