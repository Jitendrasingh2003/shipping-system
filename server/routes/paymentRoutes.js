const express = require('express');
const router = express.Router();
const {
  createOrder,
  verifyPayment,
  downloadInvoicePdf,
  getInvoices
} = require('../controllers/paymentController');
const { protect } = require('../middleware/auth');

router.post('/order', protect, createOrder);
router.post('/verify', protect, verifyPayment);
router.get('/invoice/:invoiceNumber/download', protect, downloadInvoicePdf);
router.get('/invoices', protect, getInvoices);

module.exports = router;
