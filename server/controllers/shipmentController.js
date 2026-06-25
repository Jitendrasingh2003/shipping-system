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
  customerRating: row.customer_rating,
  customerFeedback: row.customer_feedback,
  deliveryPhoto: row.delivery_photo,
  deliveryOtp: row.delivery_otp,
  refundStatus: row.refund_status,
  pickupDate: row.pickup_date,
  consignmentCategory: row.consignment_category,
  declaredValue: row.declared_value !== null ? parseFloat(row.declared_value) : 0.0,
  recipientPhone: row.recipient_phone,
  customsDescription: row.customs_description,
  fleetVehicleId: row.fleet_vehicle_id,
  fleetVehicleName: row.fleet_vehicle_name,
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
    govtIdProof,
    pickupDate,
    consignmentCategory,
    declaredValue,
    recipientPhone,
    customsDescription,
    fleetVehicleId
  } = req.body;

  try {
    const pool = getMySQLPool();
    const trackingId = `TRK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const senderId = req.user.id;
    const senderName = req.user.name;
    const estimatedDeliveryDays = getFallbackDeliveryTime(originCity, destinationCity, shipmentType, parseFloat(weight));
    const id = uuidv4();

    // Look up fleet vehicle name if fleetVehicleId provided
    let fleetVehicleName = null;
    if (fleetVehicleId) {
      const [fleetRows] = await pool.query('SELECT vehicle_number, vehicle_type FROM fleet WHERE id = ?', [fleetVehicleId]);
      if (fleetRows.length > 0) {
        fleetVehicleName = `${fleetRows[0].vehicle_type} - ${fleetRows[0].vehicle_number}`;
      }
    }

    const history = JSON.stringify([{
      status: 'Pending Payment',
      location: originCity,
      timestamp: new Date(),
      updatedBy: senderName,
      fleetVehicle: fleetVehicleName
    }]);

    await pool.query(
      `INSERT INTO shipments 
        (id, tracking_id, sender_id, sender_name, sender_phone, recipient_name, recipient_address, 
         origin_country, origin_city, destination_country, destination_city,
         weight, dim_length, dim_width, dim_height, shipment_type, status, estimated_delivery_days, payment_status, history,
         item_description, is_metal, govt_id_proof, pickup_date, consignment_category, declared_value, recipient_phone, customs_description,
         fleet_vehicle_id, fleet_vehicle_name)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Payment', ?, 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        id, trackingId, senderId, senderName, senderPhone || '', recipientName, recipientAddress, 
        originCountry || 'India', originCity, destinationCountry || 'India', destinationCity,
        parseFloat(weight), parseFloat(length), parseFloat(width), parseFloat(height), shipmentType, 
        estimatedDeliveryDays, history, itemDescription || '', isMetal ? 1 : 0, govtIdProof || '',
        pickupDate ? new Date(pickupDate) : new Date(),
        consignmentCategory || 'Parcel',
        declaredValue ? parseFloat(declaredValue) : 0.0,
        recipientPhone || '',
        customsDescription || null,
        fleetVehicleId || null,
        fleetVehicleName
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
  const { status, location, signature, otp } = req.body;

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

    // OTP validation if status is Delivered
    if (status === 'Delivered') {
      const rawShipment = rows[0];
      if (rawShipment.delivery_otp) {
        if (!otp || String(otp).trim() !== String(rawShipment.delivery_otp).trim()) {
          return res.status(400).json({ success: false, message: 'Invalid delivery confirmation OTP.' });
        }
      }
    }

    const history = shipment.history;
    history.push({
      status,
      location: location || 'Transit Node',
      timestamp: new Date(),
      updatedBy: `${req.user.role.toUpperCase()} (${req.user.name})`
    });

    let generatedOtp = null;
    if (status === 'Out for Delivery') {
      generatedOtp = Math.floor(100000 + Math.random() * 900000).toString();
      await pool.query(
        'UPDATE shipments SET status = ?, history = ?, delivery_otp = ? WHERE id = ?',
        [status, JSON.stringify(history), generatedOtp, shipmentId]
      );
    } else if (signature) {
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
        } else if (status === 'Out for Delivery') {
          smsMessage = `Alert from Marine Bytes: Your parcel ${shipment.trackingId} is Out for Delivery. Share OTP ${generatedOtp} with delivery agent to confirm delivery.`;
          emailSubject = `Shipment Out for Delivery: ${shipment.trackingId}`;
          emailBody = `Dear Customer,\n\nYour parcel with tracking ID ${shipment.trackingId} is out for delivery. Share verification OTP ${generatedOtp} with the delivery agent to confirm receipt.\n\nThank you for choosing Marine Bytes!`;
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

// Cancel Shipment (Customer — only Booked or Pending Payment)
const cancelShipment = async (req, res, next) => {
  const { shipmentId } = req.params;
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM shipments WHERE id = ?', [shipmentId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }
    const shipment = rowToShipment(rows[0]);

    // Only allow cancel if sender owns it and status is cancellable
    if (shipment.senderId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    const cancellableStatuses = ['Pending Payment', 'Booked'];
    if (!cancellableStatuses.includes(shipment.status)) {
      return res.status(400).json({ success: false, message: `Cannot cancel a shipment that is already "${shipment.status}".` });
    }

    const history = shipment.history;
    history.push({
      status: 'Cancelled',
      location: shipment.originCity,
      timestamp: new Date(),
      updatedBy: req.user.name
    });

    const isPaid = rows[0].payment_status === 'Paid';
    const refundStatusVal = isPaid ? 'Pending' : 'None';

    await pool.query(
      "UPDATE shipments SET status = 'Cancelled', history = ?, refund_status = ? WHERE id = ?",
      [JSON.stringify(history), refundStatusVal, shipmentId]
    );

    // Notification
    await pool.query(
      'INSERT INTO notifications (id, user_id, title, message, type, shipment_id) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), shipment.senderId, 'Shipment Cancelled',
       `Your shipment ${shipment.trackingId} has been cancelled.${isPaid ? ' Refund is pending administrator approval.' : ''}`, 'general', shipmentId]
    );

    res.status(200).json({ success: true, message: `Shipment cancelled successfully.${isPaid ? ' Refund request created.' : ''}` });
  } catch (error) {
    next(error);
  }
};

// Rate Shipment (Customer — only Delivered)
const rateShipment = async (req, res, next) => {
  const { shipmentId } = req.params;
  const { rating, feedback } = req.body;
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM shipments WHERE id = ?', [shipmentId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }
    const shipment = rowToShipment(rows[0]);

    if (shipment.senderId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }
    if (shipment.status !== 'Delivered') {
      return res.status(400).json({ success: false, message: 'You can only rate a delivered shipment.' });
    }
    const ratingVal = Math.min(5, Math.max(1, parseInt(rating)));

    await pool.query(
      'UPDATE shipments SET customer_rating = ?, customer_feedback = ? WHERE id = ?',
      [ratingVal, feedback || '', shipmentId]
    );

    res.status(200).json({ success: true, message: 'Rating submitted. Thank you!' });
  } catch (error) {
    next(error);
  }
};

// Re-Order: Clone a past shipment as new Pending Payment
const reOrderShipment = async (req, res, next) => {
  const { shipmentId } = req.params;
  const { pickupDate } = req.body;
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM shipments WHERE id = ?', [shipmentId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Original shipment not found.' });
    }
    const orig = rows[0];

    // Only owner can reorder
    if (orig.sender_id !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    const newId = uuidv4();
    const newTrackingId = `TRK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const history = JSON.stringify([{
      status: 'Pending Payment',
      location: orig.origin_city,
      timestamp: new Date(),
      updatedBy: req.user.name
    }]);

    await pool.query(
      `INSERT INTO shipments 
        (id, tracking_id, sender_id, sender_name, sender_phone, recipient_name, recipient_address,
         origin_country, origin_city, destination_country, destination_city,
         weight, dim_length, dim_width, dim_height, shipment_type, status,
         estimated_delivery_days, payment_status, history, item_description, is_metal, govt_id_proof, pickup_date,
         consignment_category, declared_value, recipient_phone, customs_description)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Pending Payment', ?, 'Pending', ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        newId, newTrackingId, req.user.id, req.user.name, orig.sender_phone || '',
        orig.recipient_name, orig.recipient_address,
        orig.origin_country, orig.origin_city, orig.destination_country, orig.destination_city,
        orig.weight, orig.dim_length, orig.dim_width, orig.dim_height, orig.shipment_type,
        orig.estimated_delivery_days, history,
        orig.item_description || '', orig.is_metal || 0, orig.govt_id_proof || '',
        pickupDate ? new Date(pickupDate) : new Date(),
        orig.consignment_category || 'Parcel',
        orig.declared_value !== null ? parseFloat(orig.declared_value) : 0.0,
        orig.recipient_phone || '',
        orig.customs_description || null
      ]
    );

    const [newRows] = await pool.query('SELECT * FROM shipments WHERE id = ?', [newId]);
    res.status(201).json({
      success: true,
      message: 'Shipment re-ordered successfully. Proceed to payment.',
      shipment: rowToShipment(newRows[0])
    });
  } catch (error) {
    next(error);
  }
};

// Upload Delivery Photo (Staff — proof of delivery)
const uploadDeliveryPhoto = async (req, res, next) => {
  const { shipmentId } = req.params;
  const { photoBase64 } = req.body;
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM shipments WHERE id = ?', [shipmentId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }
    const shipment = rowToShipment(rows[0]);

    if (shipment.assignedStaffId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ success: false, message: 'Access denied.' });
    }

    await pool.query(
      'UPDATE shipments SET delivery_photo = ? WHERE id = ?',
      [photoBase64 || null, shipmentId]
    );

    res.status(200).json({ success: true, message: 'Delivery photo saved successfully.' });
  } catch (error) {
    next(error);
  }
};

// Get Staff Performance (Admin only)
const getStaffPerformance = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    const [staffRows] = await pool.query("SELECT id, name, email, phone FROM users WHERE role = 'staff'");

    const performance = await Promise.all(staffRows.map(async (staff) => {
      const [totalRes] = await pool.query(
        'SELECT COUNT(*) as total FROM shipments WHERE assigned_staff_id = ?', [staff.id]
      );
      const [deliveredRes] = await pool.query(
        "SELECT COUNT(*) as delivered FROM shipments WHERE assigned_staff_id = ? AND status = 'Delivered'", [staff.id]
      );
      const [avgRatingRes] = await pool.query(
        'SELECT AVG(customer_rating) as avgRating FROM shipments WHERE assigned_staff_id = ? AND customer_rating IS NOT NULL', [staff.id]
      );
      const [activeRes] = await pool.query(
        "SELECT COUNT(*) as active FROM shipments WHERE assigned_staff_id = ? AND status NOT IN ('Delivered', 'Cancelled', 'Pending Payment')", [staff.id]
      );

      const total = totalRes[0].total || 0;
      const delivered = deliveredRes[0].delivered || 0;
      const avgRating = avgRatingRes[0].avgRating ? parseFloat(avgRatingRes[0].avgRating).toFixed(1) : null;
      const active = activeRes[0].active || 0;
      const successRate = total > 0 ? Math.round((delivered / total) * 100) : 0;

      return {
        id: staff.id,
        name: staff.name,
        email: staff.email,
        phone: staff.phone,
        totalAssigned: total,
        delivered,
        active,
        successRate,
        avgRating
      };
    }));

    res.status(200).json({ success: true, performance });
  } catch (error) {
    next(error);
  }
};

// Bulk Assign Shipments (Admin only)
const bulkAssignShipments = async (req, res, next) => {
  const { shipmentIds, staffId, staffName } = req.body;
  if (!Array.isArray(shipmentIds) || shipmentIds.length === 0) {
    return res.status(400).json({ success: false, message: 'No shipment IDs provided.' });
  }

  try {
    const pool = getMySQLPool();
    let assignedCount = 0;

    for (const shipmentId of shipmentIds) {
      const [rows] = await pool.query('SELECT * FROM shipments WHERE id = ?', [shipmentId]);
      if (rows.length === 0) continue;
      const shipment = rowToShipment(rows[0]);

      const history = shipment.history;
      history.push({
        status: shipment.status,
        location: 'Warehouse / Dispatch Center',
        timestamp: new Date(),
        updatedBy: `Admin (${req.user.name}) — Bulk Assign`
      });

      await pool.query(
        'UPDATE shipments SET assigned_staff_id = ?, assigned_staff_name = ?, history = ? WHERE id = ?',
        [staffId, staffName, JSON.stringify(history), shipmentId]
      );

      await pool.query(
        'INSERT INTO notifications (id, user_id, title, message, type, shipment_id) VALUES (?, ?, ?, ?, ?, ?)',
        [uuidv4(), staffId, 'New Shipment Assigned (Bulk)',
         `Shipment ${shipment.trackingId} has been assigned to you.`, 'general', shipmentId]
      );
      assignedCount++;
    }

    res.status(200).json({
      success: true,
      message: `${assignedCount} shipment(s) successfully assigned to ${staffName}.`,
      assignedCount
    });
  } catch (error) {
    next(error);
  }
};

// Block / Unblock User (Admin only)
const blockUnblockUser = async (req, res, next) => {
  const { userId } = req.params;
  const { blocked } = req.body; // boolean
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [userId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'User not found.' });
    }
    await pool.query('UPDATE users SET is_blocked = ? WHERE id = ?', [blocked ? 1 : 0, userId]);
    res.status(200).json({
      success: true,
      message: `User has been ${blocked ? 'blocked' : 'unblocked'} successfully.`
    });
  } catch (error) {
    next(error);
  }
};

// Refund Management (Admin only)
const manageRefund = async (req, res, next) => {
  const { shipmentId } = req.params;
  const { action } = req.body; // 'Approve' or 'Reject'
  if (!['Approve', 'Reject'].includes(action)) {
    return res.status(400).json({ success: false, message: 'Invalid action. Must be Approve or Reject.' });
  }

  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM shipments WHERE id = ?', [shipmentId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }
    const shipment = rowToShipment(rows[0]);

    if (shipment.refundStatus !== 'Pending') {
      return res.status(400).json({ success: false, message: `Refund is not pending. Current status: ${shipment.refundStatus}` });
    }

    const nextRefundStatus = action === 'Approve' ? 'Approved' : 'Rejected';
    const history = shipment.history;
    history.push({
      status: shipment.status,
      location: shipment.originCity || 'Finance Office',
      timestamp: new Date(),
      updatedBy: `Admin (${req.user.name}) — Refund ${nextRefundStatus}`
    });

    await pool.query(
      'UPDATE shipments SET refund_status = ?, history = ? WHERE id = ?',
      [nextRefundStatus, JSON.stringify(history), shipmentId]
    );

    // Create notification for customer
    await pool.query(
      'INSERT INTO notifications (id, user_id, title, message, type, shipment_id) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), shipment.senderId, `Refund Request ${nextRefundStatus}`,
       `Your refund request for shipment ${shipment.trackingId} has been ${nextRefundStatus.toLowerCase()} by the administrator.`, 'general', shipmentId]
    );

    res.status(200).json({
      success: true,
      message: `Refund successfully ${nextRefundStatus.toLowerCase()}.`,
      refundStatus: nextRefundStatus
    });
  } catch (error) {
    next(error);
  }
};

const requestReturn = async (req, res, next) => {
  const { shipmentId, reason, pickupAddress, pickupDate } = req.body;
  if (!shipmentId || !reason || !pickupAddress) {
    return res.status(400).json({ success: false, message: 'Shipment ID, reason, and pickup address are required.' });
  }
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM shipments WHERE id = ? AND sender_id = ?', [shipmentId, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Shipment not found or unauthorized.' });
    const shipment = rowToShipment(rows[0]);
    if (shipment.status !== 'Delivered') return res.status(400).json({ success: false, message: 'Only delivered shipments can be returned.' });
    const [existing] = await pool.query('SELECT * FROM returns WHERE shipment_id = ?', [shipmentId]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'Return already requested for this shipment.' });
    const id = uuidv4();
    await pool.query(
      'INSERT INTO returns (id, shipment_id, user_id, reason, pickup_address, pickup_date, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, shipmentId, req.user.id, reason, pickupAddress, pickupDate || null, 'requested']
    );
    await pool.query(
      'INSERT INTO notifications (id, user_id, title, message, type, shipment_id) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), req.user.id, 'Return Request Submitted',
       `Return request for shipment ${shipment.trackingId} has been submitted. We will contact you soon.`, 'general', shipmentId]
    );
    res.status(201).json({ success: true, message: 'Return request submitted successfully.', returnId: id });
  } catch (error) {
    next(error);
  }
};

const getCustomerReturns = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query(
      `SELECT r.*, s.tracking_id, s.shipment_type, s.origin_city, s.destination_city, s.status as shipment_status
       FROM returns r JOIN shipments s ON r.shipment_id = s.id
       WHERE r.user_id = ? ORDER BY r.created_at DESC`, [req.user.id]
    );
    res.status(200).json({ success: true, returns: rows });
  } catch (error) {
    next(error);
  }
};

const updateReturnStatus = async (req, res, next) => {
  const { returnId } = req.params;
  const { status, adminNotes } = req.body;
  if (!['approved', 'rejected', 'picked_up', 'completed'].includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status.' });
  }
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM returns WHERE id = ?', [returnId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Return not found.' });
    await pool.query(
      'UPDATE returns SET status = ?, admin_notes = ? WHERE id = ?',
      [status, adminNotes || null, returnId]
    );
    const ret = rows[0];
    await pool.query(
      'INSERT INTO notifications (id, user_id, title, message, type, shipment_id) VALUES (?, ?, ?, ?, ?, ?)',
      [uuidv4(), ret.user_id, `Return ${status}`,
       `Your return request has been ${status}. ${adminNotes ? 'Notes: ' + adminNotes : ''}`, 'general', ret.shipment_id]
    );
    res.status(200).json({ success: true, message: `Return ${status} successfully.` });
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
  recommendRoute,
  cancelShipment,
  rateShipment,
  reOrderShipment,
  uploadDeliveryPhoto,
  getStaffPerformance,
  bulkAssignShipments,
  blockUnblockUser,
  manageRefund,
  requestReturn,
  getCustomerReturns,
  updateReturnStatus
};
