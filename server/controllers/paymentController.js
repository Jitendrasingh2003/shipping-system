const Razorpay = require('razorpay');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');
const Shipment = require('../models/Shipment');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const { getMySQLPool, checkMySQLActive } = require('../config/db.mysql');
const PaymentMongo = require('../models/Payment.mongo');

// Initialize Razorpay
// If credentials are placeholders, we operate in mock simulation mode.
const isMockMode = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder';

let razorpayInstance = null;
if (!isMockMode) {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  } catch (err) {
    console.error("Razorpay initialization failed, defaulting to simulation mode:", err.message);
  }
}

// Cost calculation logic
const calculateShipmentCost = async (weight, shipmentType) => {
  let rates = {
    base_fare: 150.0,
    tax_rate: 18.0,
    per_kg_fare: 50.0,
    express_multiplier: 1.5,
    air_multiplier: 2.5,
    ocean_multiplier: 0.8
  };

  try {
    if (checkMySQLActive()) {
      const mysqlPool = getMySQLPool();
      const [rows] = await mysqlPool.query('SELECT * FROM rates');
      if (rows && rows.length > 0) {
        const dbRates = {};
        rows.forEach(r => {
          dbRates[r.rate_key] = parseFloat(r.rate_value);
        });
        rates = { ...rates, ...dbRates };
      }
    }
  } catch (err) {
    console.error("Failed to fetch rates from MySQL for billing, using defaults/in-memory:", err.message);
  }

  const basePrice = rates.base_fare || 150.0;
  const perKgRate = rates.per_kg_fare || 50.0;
  const taxPercent = rates.tax_rate || 18.0;

  let multiplier = 1.0;
  if (shipmentType === 'Express') multiplier = rates.express_multiplier || 1.5;
  else if (shipmentType === 'Air') multiplier = rates.air_multiplier || 2.5;
  else if (shipmentType === 'Ocean') multiplier = rates.ocean_multiplier || 0.8;

  const costBeforeTax = (basePrice + (weight * perKgRate)) * multiplier;
  const cost = costBeforeTax * (1 + (taxPercent / 100));
  return Math.round(cost * 100) / 100; // round to 2 decimals
};

// Create Razorpay Order
const createOrder = async (req, res, next) => {
  const { shipmentId } = req.body;

  try {
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    const amount = await calculateShipmentCost(shipment.weight, shipment.shipmentType);
    const amountInPaise = Math.round(amount * 100); // Razorpay processes in paise
    const currency = 'INR';
    const receiptId = `rcpt_${shipment.trackingId}`;

    let order = null;

    if (!isMockMode && razorpayInstance) {
      try {
        order = await razorpayInstance.orders.create({
          amount: amountInPaise,
          currency,
          receipt: receiptId
        });
      } catch (err) {
        console.warn("Failed to create Razorpay order on cloud, falling back to mock order: ", err.message);
      }
    }

    // Fallback/Simulation Order structure
    if (!order) {
      order = {
        id: `order_mock_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        amount: amountInPaise,
        currency,
        receipt: receiptId,
        status: 'created',
        isMock: true
      };
    }

    // Save pending payment record
    const paymentRecordId = uuidv4();
    if (checkMySQLActive()) {
      const mysqlPool = getMySQLPool();
      await mysqlPool.query(
        'INSERT INTO payments (id, user_id, order_id, status, amount, currency) VALUES (?, ?, ?, ?, ?, ?)',
        [paymentRecordId, req.user.id, order.id, 'pending', amount, currency]
      );
    } else {
      await PaymentMongo.create({
        userId: req.user.id,
        orderId: order.id,
        amount,
        currency,
        status: 'pending'
      });
    }

    res.status(200).json({
      success: true,
      order,
      keyId: isMockMode ? 'mock_key_id' : process.env.RAZORPAY_KEY_ID,
      amount,
      isMock: isMockMode || order.isMock
    });
  } catch (error) {
    next(error);
  }
};

// Verify Payment Signature
const verifyPayment = async (req, res, next) => {
  const { shipmentId, razorpay_order_id, razorpay_payment_id, razorpay_signature, isMock } = req.body;

  try {
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    let verified = false;

    // Check if it's a simulated payment or credentials are not active
    if (isMock || isMockMode) {
      verified = true;
    } else {
      // Real verify
      const body = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');

      if (expectedSignature === razorpay_signature) {
        verified = true;
      }
    }

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Payment signature validation failed.' });
    }

    // Update payment record in database to 'paid'
    const paymentId = razorpay_payment_id || `pay_mock_${Date.now()}`;
    const amount = await calculateShipmentCost(shipment.weight, shipment.shipmentType);

    if (checkMySQLActive()) {
      const mysqlPool = getMySQLPool();
      await mysqlPool.query(
        'UPDATE payments SET status = ?, payment_id = ?, signature = ? WHERE order_id = ?',
        ['paid', paymentId, razorpay_signature || 'mock_sig', razorpay_order_id]
      );
    } else {
      await PaymentMongo.findOneAndUpdate(
        { orderId: razorpay_order_id },
        { status: 'paid', paymentId, signature: razorpay_signature || 'mock_sig' }
      );
    }

    // Update Shipment record
    shipment.paymentStatus = 'Paid';
    shipment.paymentId = paymentId;
    shipment.status = 'Booked';
    shipment.history.push({
      status: 'Booked',
      location: shipment.originCity,
      timestamp: new Date(),
      updatedBy: req.user.name
    });
    await shipment.save();

    // Auto-generate invoice in MongoDB
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const invoice = new Invoice({
      invoiceNumber,
      shipmentId: shipment.id,
      userId: req.user.id,
      amount,
      paymentId,
      billingDetails: {
        name: req.user.name,
        email: req.user.email,
        phone: req.user.phone || 'N/A',
        address: shipment.recipientAddress
      }
    });
    await invoice.save();

    // Trigger realtime notification to users
    const io = req.app.get('io');
    if (io) {
      io.to(`user:${req.user.id}`).emit('notification', {
        title: 'Payment Successful',
        message: `Your payment of ₹${amount} was received. Shipment ${shipment.trackingId} is booked.`
      });
    }

    await Notification.create({
      userId: req.user.id,
      title: 'Payment Verified',
      message: `Payment for shipment ${shipment.trackingId} has been successfully verified. Your shipment is now Booked.`,
      type: 'payment_success',
      shipmentId: shipment.id
    });

    res.status(200).json({
      success: true,
      message: 'Payment verified and shipment booked successfully!',
      invoiceNumber,
      shipment
    });
  } catch (error) {
    next(error);
  }
};

// Generate Invoice PDF on the fly
const downloadInvoicePdf = async (req, res, next) => {
  const { invoiceNumber } = req.params;

  try {
    const invoice = await Invoice.findOne({ invoiceNumber });
    if (!invoice) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }

    const shipment = await Shipment.findById(invoice.shipmentId);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Associated shipment not found.' });
    }

    // Verify ownership (only admin or the sender can download)
    if (req.user.role !== 'admin' && req.user.id !== invoice.userId) {
      return res.status(403).json({ success: false, message: 'Unauthorized access.' });
    }

    const doc = new PDFDocument({ margin: 50 });

    // Stream the PDF directly as response
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoiceNumber}.pdf`);
    doc.pipe(res);

    // --- Header ---
    doc.fillColor('#1e3a8a').fontSize(24).text('Marine Bytes Logistics', 50, 50);
    doc.fillColor('#4b5563').fontSize(10).text('AI-Powered Shipping & Logistics', 50, 80);
    
    // Invoice Metadata
    doc.fillColor('#1f2937').fontSize(12).text(`INVOICE: ${invoiceNumber}`, 400, 50, { align: 'right' });
    doc.fontSize(10).text(`Date: ${new Date(invoice.createdAt).toLocaleDateString()}`, 400, 70, { align: 'right' });
    doc.text(`Payment ID: ${invoice.paymentId}`, 400, 85, { align: 'right' });
    doc.text(`Tracking ID: ${shipment.trackingId}`, 400, 100, { align: 'right' });

    doc.moveDown(2);
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, 125).lineTo(550, 125).stroke();

    // --- Billing Info ---
    doc.moveDown(1.5);
    doc.fillColor('#1e3a8a').fontSize(12).text('BILL TO:', 50, 145);
    doc.fillColor('#1f2937').fontSize(10);
    doc.text(`Name: ${invoice.billingDetails.name}`, 50, 165);
    doc.text(`Email: ${invoice.billingDetails.email}`, 50, 180);
    doc.text(`Phone: ${invoice.billingDetails.phone}`, 50, 195);
    
    // Route Info
    doc.fillColor('#1e3a8a').fontSize(12).text('SHIPMENT PATH:', 300, 145);
    doc.fillColor('#1f2937').fontSize(10);
    doc.text(`Origin City: ${shipment.originCity}`, 300, 165);
    doc.text(`Destination City: ${shipment.destinationCity}`, 300, 180);
    doc.text(`Recipient: ${shipment.recipientName}`, 300, 195);
    doc.text(`Address: ${shipment.recipientAddress}`, 300, 210, { width: 250 });

    doc.moveDown(2.5);
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, 240).lineTo(550, 240).stroke();

    // --- Order Details Table ---
    doc.moveDown(1.5);
    doc.fillColor('#1e3a8a').fontSize(12).text('SHIPMENT SPECIFICATIONS:', 50, 260);
    
    // Table Header
    doc.fillColor('#4b5563').fontSize(10);
    doc.text('Description', 50, 290);
    doc.text('Service Type', 250, 290, { width: 100, align: 'center' });
    doc.text('Weight', 350, 290, { width: 80, align: 'center' });
    doc.text('Total Price', 450, 290, { width: 100, align: 'right' });
    
    doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(50, 305).lineTo(550, 305).stroke();

    // Table Row
    doc.fillColor('#1f2937').fontSize(10);
    doc.text(`Package Logistics [${shipment.dimensions.length}x${shipment.dimensions.width}x${shipment.dimensions.height} cm]`, 50, 315);
    doc.text(shipment.shipmentType, 250, 315, { width: 100, align: 'center' });
    doc.text(`${shipment.weight} kg`, 350, 315, { width: 80, align: 'center' });
    doc.text(`INR ${invoice.amount.toFixed(2)}`, 450, 315, { width: 100, align: 'right' });

    doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(50, 335).lineTo(550, 335).stroke();

    // Grand Total
    doc.moveDown(2);
    doc.fillColor('#1e3a8a').fontSize(14).text(`GRAND TOTAL: INR ${invoice.amount.toFixed(2)}`, 50, 360, { align: 'right' });

    // --- Footer ---
    doc.moveDown(4);
    doc.fillColor('#9ca3af').fontSize(8).text('Thank you for shipping with Marine Bytes!', 50, 500, { align: 'center' });
    doc.text('This is an electronically generated receipt and requires no physical signature.', 50, 515, { align: 'center' });

    doc.end();

  } catch (error) {
    next(error);
  }
};

// Get Invoices List
const getInvoices = async (req, res, next) => {
  try {
    let invoices;
    if (req.user.role === 'admin') {
      invoices = await Invoice.find({}).sort({ createdAt: -1 });
    } else {
      invoices = await Invoice.find({ userId: req.user.id }).sort({ createdAt: -1 });
    }
    res.status(200).json({ success: true, invoices });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  createOrder,
  verifyPayment,
  downloadInvoicePdf,
  getInvoices
};
