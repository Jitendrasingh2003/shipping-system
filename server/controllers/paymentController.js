const Razorpay = require('razorpay');
const crypto = require('crypto');
const PDFDocument = require('pdfkit');
const { v4: uuidv4 } = require('uuid');
const { getMySQLPool } = require('../config/db.mysql');
const { sendEmailInvoice } = require('../utils/communication');

// Initialize Razorpay
const isMockMode = !process.env.RAZORPAY_KEY_ID || process.env.RAZORPAY_KEY_ID === 'rzp_test_placeholder';

let razorpayInstance = null;
if (!isMockMode) {
  try {
    razorpayInstance = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET
    });
  } catch (err) {
    console.error('Razorpay initialization failed, defaulting to simulation mode:', err.message);
  }
}

// Map DB row to shipment object
const rowToShipment = (row) => ({
  id: row.id,
  trackingId: row.tracking_id,
  senderId: row.sender_id,
  senderName: row.sender_name,
  recipientName: row.recipient_name,
  recipientAddress: row.recipient_address,
  originCountry: row.origin_country || 'India',
  originCity: row.origin_city,
  destinationCountry: row.destination_country || 'India',
  destinationCity: row.destination_city,
  weight: row.weight,
  dimensions: { length: row.dim_length, width: row.dim_width, height: row.dim_height },
  shipmentType: row.shipment_type,
  status: row.status,
  paymentStatus: row.payment_status,
  paymentId: row.payment_id,
  history: row.history ? (typeof row.history === 'string' ? JSON.parse(row.history) : row.history) : [],
  signature: row.signature,
  createdAt: row.created_at
});

const getCurrencyForCountries = (origin, dest) => {
  const o = (origin || '').toLowerCase();
  const d = (dest || '').toLowerCase();
  if (o === 'india' && d === 'india') return 'INR';
  
  const target = o !== 'india' ? o : d;
  if (target.includes('united states') || target.includes('us')) return 'USD';
  if (target.includes('united kingdom') || target.includes('gb') || target.includes('uk')) return 'GBP';
  if (target.includes('united arab emirates') || target.includes('uae')) return 'AED';
  if (target.includes('australia')) return 'AUD';
  return 'USD';
};

const getCurrencySymbol = (currency) => {
  if (currency === 'USD') return '$';
  if (currency === 'GBP') return '£';
  if (currency === 'AED') return 'د.إ';
  if (currency === 'AUD') return 'A$';
  return '₹';
};

// Cost calculation logic
const calculateShipmentCost = async (weight, shipmentType, originCountry, destinationCountry) => {
  let rates = {
    base_fare: 150.0,
    tax_rate: 18.0,
    per_kg_fare: 50.0,
    express_multiplier: 1.5,
    air_multiplier: 2.5,
    ocean_multiplier: 0.8
  };

  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM rates');
    if (rows && rows.length > 0) {
      rows.forEach(r => { rates[r.rate_key] = parseFloat(r.rate_value); });
    }
  } catch (err) {
    console.error('Failed to fetch rates from MySQL, using defaults:', err.message);
  }

  const basePrice = rates.base_fare || 150.0;
  const perKgRate = rates.per_kg_fare || 50.0;
  const taxPercent = rates.tax_rate || 18.0;

  let multiplier = 1.0;
  if (shipmentType === 'Express') multiplier = rates.express_multiplier || 1.5;
  else if (shipmentType === 'Air') multiplier = rates.air_multiplier || 2.5;
  else if (shipmentType === 'Ocean') multiplier = rates.ocean_multiplier || 0.8;

  const costBeforeTax = (basePrice + (weight * perKgRate)) * multiplier;
  const costInINR = costBeforeTax * (1 + (taxPercent / 100));

  const currency = getCurrencyForCountries(originCountry, destinationCountry);
  let conversionRate = 1.0;
  if (currency === 'USD') conversionRate = 0.012;
  else if (currency === 'GBP') conversionRate = 0.0095;
  else if (currency === 'AED') conversionRate = 0.044;
  else if (currency === 'AUD') conversionRate = 0.018;

  const cost = costInINR * conversionRate;
  return {
    amount: Math.round(cost * 100) / 100,
    currency
  };
};

// Generate dynamic PDF receipt binary as buffer
const generatePdfBuffer = (invoice, shipment) => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ margin: 50 });
      const chunks = [];
      doc.on('data', chunk => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', err => reject(err));

      doc.fillColor('#1e3a8a').fontSize(24).text('Marine Bytes Logistics', 50, 50);
      doc.fillColor('#4b5563').fontSize(10).text('AI-Powered Shipping & Logistics', 50, 80);

      doc.fillColor('#1f2937').fontSize(12).text(`INVOICE: ${invoice.invoiceNumber}`, 400, 50, { align: 'right' });
      doc.fontSize(10).text(`Date: ${new Date(invoice.createdAt || new Date()).toLocaleDateString()}`, 400, 70, { align: 'right' });
      doc.text(`Payment ID: ${invoice.paymentId}`, 400, 85, { align: 'right' });
      doc.text(`Tracking ID: ${shipment.trackingId}`, 400, 100, { align: 'right' });

      doc.moveDown(2);
      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, 125).lineTo(550, 125).stroke();

      doc.moveDown(1.5);
      doc.fillColor('#1e3a8a').fontSize(12).text('BILL TO:', 50, 145);
      doc.fillColor('#1f2937').fontSize(10);
      doc.text(`Name: ${invoice.billingDetails?.name || invoice.billing_name}`, 50, 165);
      doc.text(`Email: ${invoice.billingDetails?.email || invoice.billing_email}`, 50, 180);
      doc.text(`Phone: ${invoice.billingDetails?.phone || invoice.billing_phone}`, 50, 195);

      doc.fillColor('#1e3a8a').fontSize(12).text('SHIPMENT PATH:', 300, 145);
      doc.fillColor('#1f2937').fontSize(10);
      doc.text(`Origin City: ${shipment.originCity}`, 300, 165);
      doc.text(`Destination City: ${shipment.destinationCity}`, 300, 180);
      doc.text(`Recipient: ${shipment.recipientName}`, 300, 195);
      doc.text(`Address: ${shipment.recipientAddress}`, 300, 210, { width: 250 });

      doc.moveDown(2.5);
      doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, 240).lineTo(550, 240).stroke();

      doc.moveDown(1.5);
      doc.fillColor('#1e3a8a').fontSize(12).text('SHIPMENT SPECIFICATIONS:', 50, 260);
      doc.fillColor('#4b5563').fontSize(10);
      doc.text('Description', 50, 290);
      doc.text('Service Type', 250, 290, { width: 100, align: 'center' });
      doc.text('Weight', 350, 290, { width: 80, align: 'center' });
      doc.text('Total Price', 450, 290, { width: 100, align: 'right' });

      doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(50, 305).lineTo(550, 305).stroke();

      const symbol = getCurrencySymbol(invoice.currency || 'INR');

      doc.fillColor('#1f2937').fontSize(10);
      doc.text(`Package Logistics [${shipment.dimensions?.length || 10}x${shipment.dimensions?.width || 10}x${shipment.dimensions?.height || 10} cm]`, 50, 315);
      doc.text(shipment.shipmentType, 250, 315, { width: 100, align: 'center' });
      doc.text(`${shipment.weight} kg`, 350, 315, { width: 80, align: 'center' });
      doc.text(`${symbol} ${parseFloat(invoice.amount).toFixed(2)}`, 450, 315, { width: 100, align: 'right' });

      doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(50, 335).lineTo(550, 335).stroke();
      doc.fillColor('#1e3a8a').fontSize(14).text(`GRAND TOTAL: ${symbol} ${parseFloat(invoice.amount).toFixed(2)}`, 50, 360, { align: 'right' });
      doc.fillColor('#9ca3af').fontSize(8).text('Thank you for shipping with Marine Bytes!', 50, 500, { align: 'center' });
      doc.text('This is an electronically generated receipt and requires no physical signature.', 50, 515, { align: 'center' });

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
};

// Create Razorpay Order
const createOrder = async (req, res, next) => {
  const { shipmentId } = req.body;

  try {
    const pool = getMySQLPool();
    const [srows] = await pool.query('SELECT * FROM shipments WHERE id = ?', [shipmentId]);
    if (srows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }
    const shipment = rowToShipment(srows[0]);

    const { amount, currency } = await calculateShipmentCost(
      shipment.weight,
      shipment.shipmentType,
      shipment.originCountry,
      shipment.destinationCountry
    );
    const receiptId = `rcpt_${shipment.trackingId}`;

    let order = null;
    if (currency === 'INR') {
      const amountInPaise = Math.round(amount * 100);
      if (!isMockMode && razorpayInstance) {
        try {
          order = await razorpayInstance.orders.create({ amount: amountInPaise, currency, receipt: receiptId });
        } catch (err) {
          console.warn('Razorpay order creation failed, using mock:', err.message);
        }
      }

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
    } else {
      order = {
        id: `order_intl_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
        amount: amount,
        currency,
        receipt: receiptId,
        status: 'created',
        isInternational: true,
        isMock: true
      };
    }

    // Save pending payment record
    await pool.query(
      'INSERT INTO payments (id, user_id, order_id, status, amount, currency) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), req.user.id, order.id, 'pending', amount, currency]
    );

    res.status(200).json({
      success: true,
      order,
      keyId: isMockMode ? 'mock_key_id' : process.env.RAZORPAY_KEY_ID,
      amount,
      currency,
      isMock: isMockMode || order.isMock
    });
  } catch (error) {
    next(error);
  }
};

// Verify Payment Signature
const verifyPayment = async (req, res, next) => {
  const { shipmentId, razorpay_order_id, razorpay_payment_id, razorpay_signature, isMock, gateway } = req.body;

  try {
    const pool = getMySQLPool();
    const [srows] = await pool.query('SELECT * FROM shipments WHERE id = ?', [shipmentId]);
    if (srows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }
    const shipment = rowToShipment(srows[0]);

    let verified = false;
    const { amount, currency } = await calculateShipmentCost(
      shipment.weight,
      shipment.shipmentType,
      shipment.originCountry,
      shipment.destinationCountry
    );

    if (currency !== 'INR') {
      verified = true;
    } else if (isMock || isMockMode) {
      verified = true;
    } else {
      const body = razorpay_order_id + '|' + razorpay_payment_id;
      const expectedSignature = crypto
        .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
        .update(body.toString())
        .digest('hex');
      if (expectedSignature === razorpay_signature) verified = true;
    }

    if (!verified) {
      return res.status(400).json({ success: false, message: 'Payment signature validation failed.' });
    }

    const paymentId = razorpay_payment_id || `pay_${(gateway || 'mock').toLowerCase()}_${Date.now()}`;

    // Update payment record
    await pool.query(
      'UPDATE payments SET status = ?, payment_id = ?, signature = ? WHERE order_id = ?',
      ['paid', paymentId, razorpay_signature || 'mock_sig', razorpay_order_id]
    );

    // Update shipment
    const history = shipment.history;
    history.push({
      status: 'Booked',
      location: shipment.originCity,
      timestamp: new Date(),
      updatedBy: req.user.name
    });
    await pool.query(
      "UPDATE shipments SET payment_status = 'Paid', payment_id = ?, status = 'Booked', history = ? WHERE id = ?",
      [paymentId, JSON.stringify(history), shipmentId]
    );

    // Generate invoice
    const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const invoiceId = uuidv4();
    await pool.query(
      `INSERT INTO invoices (id, invoice_number, shipment_id, user_id, amount, payment_id, currency, billing_name, billing_email, billing_phone, billing_address)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [invoiceId, invoiceNumber, shipmentId, req.user.id, amount, paymentId, currency,
       req.user.name, req.user.email, req.user.phone || 'N/A', shipment.recipientAddress]
    );

    // Generate and send simulated invoice email
    try {
      const mockInvoice = {
        invoiceNumber,
        createdAt: new Date(),
        paymentId,
        amount,
        currency
      };
      const pdfBuffer = await generatePdfBuffer(mockInvoice, shipment);
      sendEmailInvoice(req.user.email, invoiceNumber, pdfBuffer);
    } catch (pdfErr) {
      console.error('Failed to generate/email PDF invoice simulation:', pdfErr.message);
    }

    // Notification
    const io = req.app.get('io');
    const symbol = getCurrencySymbol(currency);
    if (io) {
      io.to(`user:${req.user.id}`).emit('notification', {
        title: 'Payment Successful',
        message: `Your payment of ${symbol}${amount} was received. Shipment ${shipment.trackingId} is booked.`
      });
    }
    await pool.query(
      'INSERT INTO notifications (id, user_id, title, message, type, shipment_id) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), req.user.id, 'Payment Verified',
       `Payment for shipment ${shipment.trackingId} has been successfully verified. Your shipment is now Booked.`,
       'payment_success', shipmentId]
    );

    const [updated] = await pool.query('SELECT * FROM shipments WHERE id = ?', [shipmentId]);
    res.status(200).json({
      success: true,
      message: 'Payment verified and shipment booked successfully!',
      invoiceNumber,
      shipment: rowToShipment(updated[0])
    });
  } catch (error) {
    next(error);
  }
};

// Generate Invoice PDF
const downloadInvoicePdf = async (req, res, next) => {
  const { invoiceNumber } = req.params;

  try {
    const pool = getMySQLPool();
    const [irows] = await pool.query('SELECT * FROM invoices WHERE invoice_number = ?', [invoiceNumber]);
    if (irows.length === 0) {
      return res.status(404).json({ success: false, message: 'Invoice not found.' });
    }
    const invoice = irows[0];

    const [srows] = await pool.query('SELECT * FROM shipments WHERE id = ?', [invoice.shipment_id]);
    if (srows.length === 0) {
      return res.status(404).json({ success: false, message: 'Associated shipment not found.' });
    }
    const shipment = rowToShipment(srows[0]);

    if (req.user.role !== 'admin' && req.user.id !== invoice.user_id) {
      return res.status(403).json({ success: false, message: 'Unauthorized access.' });
    }

    const doc = new PDFDocument({ margin: 50 });
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', `attachment; filename=Invoice-${invoiceNumber}.pdf`);
    doc.pipe(res);

    doc.fillColor('#1e3a8a').fontSize(24).text('Marine Bytes Logistics', 50, 50);
    doc.fillColor('#4b5563').fontSize(10).text('AI-Powered Shipping & Logistics', 50, 80);

    doc.fillColor('#1f2937').fontSize(12).text(`INVOICE: ${invoiceNumber}`, 400, 50, { align: 'right' });
    doc.fontSize(10).text(`Date: ${new Date(invoice.created_at).toLocaleDateString()}`, 400, 70, { align: 'right' });
    doc.text(`Payment ID: ${invoice.payment_id}`, 400, 85, { align: 'right' });
    doc.text(`Tracking ID: ${shipment.trackingId}`, 400, 100, { align: 'right' });

    doc.moveDown(2);
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, 125).lineTo(550, 125).stroke();

    doc.moveDown(1.5);
    doc.fillColor('#1e3a8a').fontSize(12).text('BILL TO:', 50, 145);
    doc.fillColor('#1f2937').fontSize(10);
    doc.text(`Name: ${invoice.billing_name}`, 50, 165);
    doc.text(`Email: ${invoice.billing_email}`, 50, 180);
    doc.text(`Phone: ${invoice.billing_phone}`, 50, 195);

    doc.fillColor('#1e3a8a').fontSize(12).text('SHIPMENT PATH:', 300, 145);
    doc.fillColor('#1f2937').fontSize(10);
    doc.text(`Origin City: ${shipment.originCity}`, 300, 165);
    doc.text(`Destination City: ${shipment.destinationCity}`, 300, 180);
    doc.text(`Recipient: ${shipment.recipientName}`, 300, 195);
    doc.text(`Address: ${shipment.recipientAddress}`, 300, 210, { width: 250 });

    doc.moveDown(2.5);
    doc.strokeColor('#e5e7eb').lineWidth(1).moveTo(50, 240).lineTo(550, 240).stroke();

    doc.moveDown(1.5);
    doc.fillColor('#1e3a8a').fontSize(12).text('SHIPMENT SPECIFICATIONS:', 50, 260);
    doc.fillColor('#4b5563').fontSize(10);
    doc.text('Description', 50, 290);
    doc.text('Service Type', 250, 290, { width: 100, align: 'center' });
    doc.text('Weight', 350, 290, { width: 80, align: 'center' });
    doc.text('Total Price', 450, 290, { width: 100, align: 'right' });

    doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(50, 305).lineTo(550, 305).stroke();

    const symbol = getCurrencySymbol(invoice.currency || 'INR');

    doc.fillColor('#1f2937').fontSize(10);
    doc.text(`Package Logistics [${shipment.dimensions.length}x${shipment.dimensions.width}x${shipment.dimensions.height} cm]`, 50, 315);
    doc.text(shipment.shipmentType, 250, 315, { width: 100, align: 'center' });
    doc.text(`${shipment.weight} kg`, 350, 315, { width: 80, align: 'center' });
    doc.text(`${symbol} ${parseFloat(invoice.amount).toFixed(2)}`, 450, 315, { width: 100, align: 'right' });

    doc.strokeColor('#e5e7eb').lineWidth(0.5).moveTo(50, 335).lineTo(550, 335).stroke();
    doc.fillColor('#1e3a8a').fontSize(14).text(`GRAND TOTAL: ${symbol} ${parseFloat(invoice.amount).toFixed(2)}`, 50, 360, { align: 'right' });
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
    const pool = getMySQLPool();
    let rows;
    if (req.user.role === 'admin') {
      [rows] = await pool.query('SELECT * FROM invoices ORDER BY created_at DESC');
    } else {
      [rows] = await pool.query('SELECT * FROM invoices WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    }
    const invoices = rows.map(r => ({
      id: r.id,
      invoiceNumber: r.invoice_number,
      shipmentId: r.shipment_id,
      userId: r.user_id,
      amount: parseFloat(r.amount),
      paymentId: r.payment_id,
      currency: r.currency || 'INR',
      billingDetails: { name: r.billing_name, email: r.billing_email, phone: r.billing_phone, address: r.billing_address },
      createdAt: r.created_at
    }));
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
