const mongoose = require('mongoose');

const addressSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  address: { type: String, required: true },
  city: { type: String, required: true },
  pincode: { type: String, required: true }
}, { timestamps: true });

module.exports = mongoose.model('Address', addressSchema);
