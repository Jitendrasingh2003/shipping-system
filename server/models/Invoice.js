const mongoose = require('mongoose');

const invoiceSchema = new mongoose.Schema({
  invoiceNumber: { type: String, required: true, unique: true },
  shipmentId: { type: String, required: true },
  userId: { type: String, required: true },
  amount: { type: Number, required: true },
  paymentId: { type: String, required: true },
  billingDetails: {
    name: { type: String, required: true },
    email: { type: String, required: true },
    phone: { type: String, default: '' },
    address: { type: String, default: '' }
  }
}, { timestamps: true });

module.exports = mongoose.model('Invoice', invoiceSchema);
