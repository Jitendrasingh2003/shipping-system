const { getMySQLPool } = require('../config/db.mysql');
const { v4: uuidv4 } = require('uuid');
const { sendSMSAlert, sendEmailAlert } = require('../utils/communication');

// Helper to estimate delivery days using local routing formula
const getFallbackDeliveryTime = (origin, destination, type, weight) => {
  const distMultiplier = Math.abs(origin.length - destination.length) + 3;
  let baseDays = distMultiplier * 0.8;
  if (type === 'Air') baseDays *= 0.3;
  else if (type === 'Express') baseDays *= 0.6;
  else if (type === 'Ocean') baseDays *= 1.8;
  const weightFactor = weight * 0.005;
  return Math.max(1.0, Math.round((baseDays + weightFactor + 0.5) * 10) / 10);
};

// Map DB row to clean shipment object
const rowToShipment = (row) => ({
  id: row.id,
  trackingId: row.tracking_id,
  senderId: row.sender_id,
  senderName: row.sender_name,
  senderPhone: row.sender_phone,
  recipientName: row.recipient_name,
  recipientAddress: row.recipient_address,
  originCountry: row.origin_country,
  originCity: row.origin_city,
  destinationCountry: row.destination_country,
  destinationCity: row.destination_city,
  weight: row.weight,
  dimensions: { length: row.dim_length, width: row.dim_width, height: row.dim_height },
  shipmentType: row.shipment_type,
  status: row.status,
  assignedStaffId: row.assigned_staff_id,
  assignedStaffName: row.assigned_staff_name,
  estimatedDeliveryDays: row.estimated_delivery_days,
  paymentStatus: row.payment_status,
  paymentId: row.payment_id,
  history: row.history ? (typeof row.history === 'string' ? JSON.parse(row.history) : row.history) : [],
  signature: row.signature,
  itemDescription: row.item_description,
  isMetal: row.is_metal === 1 || row.is_metal === true,
  govtIdProof: row.govt_id_proof,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

// Create / Book Shipment (status: 'Pending Payment')
const bookShipment = async (req, res, next) => {
  const { 
    recipientName, 
    recipientAddress, 
    originCountry,
    originCity, 
    destinationCountry,
    destinationCity, 
    weight, 
    length, 
    width, 
    height, 
    shipmentType,
    senderPhone,
    itemDescription,
    isMetal,
    govtIdProof
  } = req.body;

  try {
    const pool = getMySQLPool();
    const trackingId = `TRK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const senderId = req.user.id;
    const senderName = req.user.name;
    const estimatedDeliveryDays = getFallbackDeliveryTime(originCity, destinationCity, shipmentType, parseFloat(weight));
    const id = uuidv4();
    const history = JSON.stringify([{
      status: 'Pending Payment',
      location: originCity,
      timestamp: new Date(),
      updatedBy: senderName
    }]);

    await pool.query(
      `INSERT INTO shipments 
        (id, tracking_id, sender_id, sender_name, sender_phone, recipient_name, recipient_address, 
         origin_country, origin_city, destination_country, destination_city,
         weight, dim_length, dim_width, dim_height, shipment_type, status, estimated_delivery_days, payment_status, history,
         item_description, is_metal, govt_id_proof)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Payment', ?, 'Pending', ?, ?, ?, ?)`,
      [
        id, trackingId, senderId, senderName, senderPhone || '', recipientName, recipientAddress, 
        originCountry || 'India', originCity, destinationCountry || 'India', destinationCity,
        parseFloat(weight), parseFloat(length), parseFloat(width), parseFloat(height), shipmentType, 
        estimatedDeliveryDays, history, itemDescription || '', isMetal ? 1 : 0, govtIdProof || ''
      ]
    );

    const [rows] = await pool.query('SELECT * FROM shipments WHERE id = ?', [id]);
    res.status(201).json({
      success: true,
      message: 'Shipment booking created. Awaiting payment.',
      shipment: rowToShipment(rows[0])
    });
  } catch (error) {
    next(error);
  }
};

// Get Shipment by Tracking ID (Publicly accessible)
const getShipmentByTrackingId = async (req, res, next) => {
  const { trackingId } = req.params;
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM shipments WHERE tracking_id = ?', [trackingId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }
    res.status(200).json({ success: true, shipment: rowToShipment(rows[0]) });
  } catch (error) {
    next(error);
  }
};

// Get Customer Shipments
const getCustomerShipments = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM shipments WHERE sender_id = ? ORDER BY created_at DESC', [req.user.id]);
    res.status(200).json({ success: true, shipments: rows.map(rowToShipment) });
  } catch (error) {
    next(error);
  }
};

// Get Staff Assigned Deliveries
const getStaffShipments = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM shipments WHERE assigned_staff_id = ? ORDER BY updated_at DESC', [req.user.id]);
    res.status(200).json({ success: true, shipments: rows.map(rowToShipment) });
  } catch (error) {
    next(error);
  }
};

// Get All Shipments (Admin)
const getAllShipments = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM shipments ORDER BY created_at DESC');
    res.status(200).json({ success: true, shipments: rows.map(rowToShipment) });
  } catch (error) {
    next(error);
  }
};

// Assign Shipment to Staff (Admin only)
const assignShipment = async (req, res, next) => {
  const { shipmentId } = req.params;
  const { staffId, staffName } = req.body;

  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM shipments WHERE id = ?', [shipmentId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    const shipment = rowToShipment(rows[0]);
    const history = shipment.history;
    history.push({
      status: shipment.status,
      location: 'Warehouse / Dispatch Center',
      timestamp: new Date(),
      updatedBy: `Admin (${req.user.name})`
    });

    await pool.query(
      'UPDATE shipments SET assigned_staff_id = ?, assigned_staff_name = ?, history = ? WHERE id = ?',
      [staffId, staffName, JSON.stringify(history), shipmentId]
    );

    // Notification for staff
    await pool.query(
      'INSERT INTO notifications (id, user_id, title, message, type, shipment_id) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), staffId, 'New Shipment Assigned',
       `Shipment ${shipment.trackingId} has been assigned to you for delivery.`, 'general', shipmentId]
    );

    const [updated] = await pool.query('SELECT * FROM shipments WHERE id = ?', [shipmentId]);
    res.status(200).json({
      success: true,
      message: `Shipment successfully assigned to ${staffName}.`,
      shipment: rowToShipment(updated[0])
    });
  } catch (error) {
    next(error);
  }
};

// Update Shipment Status (Staff or Admin)
const updateShipmentStatus = async (req, res, next) => {
  const { shipmentId } = req.params;
  const { status, location, signature } = req.body;

  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM shipments WHERE id = ?', [shipmentId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    const shipment = rowToShipment(rows[0]);

    if (req.user.role === 'staff' && shipment.assignedStaffId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not assigned to this shipment.' });
    }

    const history = shipment.history;
    history.push({
      status,
      location: location || 'Transit Node',
      timestamp: new Date(),
      updatedBy: `${req.user.role.toUpperCase()} (${req.user.name})`
    });

    if (signature) {
      await pool.query(
        'UPDATE shipments SET status = ?, history = ?, signature = ? WHERE id = ?',
        [status, JSON.stringify(history), signature, shipmentId]
      );
    } else {
      await pool.query(
        'UPDATE shipments SET status = ?, history = ? WHERE id = ?',
        [status, JSON.stringify(history), shipmentId]
      );
    }

    // Send simulated Twilio SMS and Nodemailer email alert
    try {
      const [urows] = await pool.query('SELECT phone, email FROM users WHERE id = ?', [shipment.senderId]);
      const customerPhone = (urows && urows.length > 0) ? urows[0].phone : '';
      const customerEmail = (urows && urows.length > 0) ? urows[0].email : '';

      if (customerPhone || customerEmail) {
        let smsMessage = '';
        let emailSubject = '';
        let emailBody = '';

        if (status === 'In Transit') {
          smsMessage = `Alert from Marine Bytes: Your parcel ${shipment.trackingId} is now In Transit.`;
          emailSubject = `Shipment In Transit: ${shipment.trackingId}`;
          emailBody = `Dear Customer,\n\nYour parcel with tracking ID ${shipment.trackingId} is now in transit to the destination.\n\nThank you for choosing Marine Bytes!`;
        } else if (status === 'Delivered') {
          smsMessage = `Alert from Marine Bytes: Your parcel ${shipment.trackingId} has successfully reached its destination and been delivered.`;
          emailSubject = `Shipment Delivered: ${shipment.trackingId}`;
          emailBody = `Dear Customer,\n\nWe are pleased to inform you that your parcel with tracking ID ${shipment.trackingId} has successfully reached the destination and has been delivered.\n\nThank you for choosing Marine Bytes!`;
        } else {
          smsMessage = `Alert from Marine Bytes: Your parcel ${shipment.trackingId} status has changed to [${status}] at [${location || 'Transit Node'}].`;
          emailSubject = `Shipment Update: ${shipment.trackingId} is now ${status}`;
          emailBody = `Dear Customer,\n\nYour shipment with tracking ID ${shipment.trackingId} has been updated to status: "${status}" at "${location || 'Transit Node'}".\n\nThank you for choosing Marine Bytes!`;
        }

        if (customerPhone) {
          sendSMSAlert(customerPhone, smsMessage);
        }
        if (customerEmail) {
          sendEmailAlert(customerEmail, emailSubject, emailBody);
        }
      }
    } catch (commErr) {
      console.error('Failed to dispatch simulated notifications:', commErr.message);
    }

    // Socket event
    const io = req.app.get('io');
    if (io) {
      io.to(`shipment:${shipment.trackingId}`).emit('status-update', {
        trackingId: shipment.trackingId,
        status,
        location: location || 'Transit Node',
        timestamp: new Date()
      });
      io.to(`user:${shipment.senderId}`).emit('notification', {
        title: 'Shipment Status Update',
        message: `Your shipment ${shipment.trackingId} is now: ${status}`
      });
    }

    // Notification record
    await pool.query(
      'INSERT INTO notifications (id, user_id, title, message, type, shipment_id) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), shipment.senderId, 'Shipment Status Updated',
       `Your package ${shipment.trackingId} status has changed to: ${status} (${location || 'Transit Node'})`,
       'status_update', shipmentId]
    );

    const [updated] = await pool.query('SELECT * FROM shipments WHERE id = ?', [shipmentId]);
    res.status(200).json({
      success: true,
      message: `Shipment status updated to: ${status}`,
      shipment: rowToShipment(updated[0])
    });
  } catch (error) {
    next(error);
  }
};

// Estimate ETA without booking
const estimateEta = async (req, res, next) => {
  const { origin, destination, weight, shipmentType } = req.body;
  try {
    const estimatedDeliveryDays = getFallbackDeliveryTime(origin, destination, shipmentType, parseFloat(weight) || 1.0);
    res.status(200).json({ success: true, estimated_delivery_days: estimatedDeliveryDays });
  } catch (error) {
    next(error);
  }
};

// Support Ticket Management
const getUserTickets = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    let rows;
    if (req.user.role === 'admin') {
      [rows] = await pool.query('SELECT * FROM tickets ORDER BY created_at DESC');
    } else {
      [rows] = await pool.query('SELECT * FROM tickets WHERE user_id = ? ORDER BY created_at DESC', [req.user.id]);
    }
    res.status(200).json({ success: true, tickets: rows });
  } catch (error) {
    next(error);
  }
};

const createUserTicket = async (req, res, next) => {
  const { title, message, category, screenshot } = req.body;
  try {
    const pool = getMySQLPool();
    const id = uuidv4();
    const senderRole = req.user.role || 'customer';
    await pool.query(
      'INSERT INTO tickets (id, user_id, sender_name, sender_role, category, title, message, screenshot) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, req.user.name, senderRole, category || 'General', title, message, screenshot || null]
    );
    res.status(201).json({ success: true, ticket: { id, userId: req.user.id, title, message, category, status: 'open', senderRole, screenshot } });
  } catch (error) {
    next(error);
  }
};

const resolveUserTicket = async (req, res, next) => {
  const { ticketId } = req.params;
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM tickets WHERE id = ?', [ticketId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }
    await pool.query("UPDATE tickets SET status = 'resolved' WHERE id = ?", [ticketId]);
    res.status(200).json({ success: true, message: 'Ticket marked resolved.' });
  } catch (error) {
    next(error);
  }
};

// AI route & shipping method recommendation
const recommendRoute = async (req, res, next) => {
  const { origin, destination, weight, urgency } = req.body;
  try {
    const { getAiRouteRecommendation } = require('../utils/aiHelper');
    const recommendation = await getAiRouteRecommendation(origin, destination, weight, urgency || 'Standard');
    res.status(200).json({ success: true, recommendation });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  bookShipment,
  getShipmentByTrackingId,
  getCustomerShipments,
  getStaffShipments,
  getAllShipments,
  assignShipment,
  updateShipmentStatus,
  estimateEta,
  getUserTickets,
  createUserTicket,
  resolveUserTicket,
  recommendRoute
};
