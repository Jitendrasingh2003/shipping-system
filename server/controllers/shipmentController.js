const Shipment = require('../models/Shipment');
const Notification = require('../models/Notification');
const { v4: uuidv4 } = require('uuid');

// Helper to estimate delivery days using local routing formula
const getFallbackDeliveryTime = (origin, destination, type, weight) => {
  // Rough distance-like proxy based on length of names
  const distMultiplier = Math.abs(origin.length - destination.length) + 3;
  let baseDays = distMultiplier * 0.8;
  
  if (type === 'Air') baseDays *= 0.3;
  else if (type === 'Express') baseDays *= 0.6;
  else if (type === 'Ocean') baseDays *= 1.8;
  
  const weightFactor = weight * 0.005;
  return Math.max(1.0, Math.round((baseDays + weightFactor + 0.5) * 10) / 10);
};

// Create / Book Shipment (Initiates flow, status: 'Pending Payment')
const bookShipment = async (req, res, next) => {
  const { 
    recipientName, 
    recipientAddress, 
    originCity, 
    destinationCity, 
    weight, 
    length, 
    width, 
    height, 
    shipmentType 
  } = req.body;

  try {
    const trackingId = `TRK-${Date.now().toString().slice(-6)}-${Math.floor(100 + Math.random() * 900)}`;
    const senderId = req.user.id;
    const senderName = req.user.name;
    const currentDayOfWeek = new Date().getDay(); // 0 is Sunday, 1 is Monday...

    // Calculate estimated delivery days locally using the routing formula
    const estimatedDeliveryDays = getFallbackDeliveryTime(originCity, destinationCity, shipmentType, parseFloat(weight));

    // 2. Save shipment draft (Pending Payment)
    const shipment = new Shipment({
      trackingId,
      senderId,
      senderName,
      recipientName,
      recipientAddress,
      originCity,
      destinationCity,
      weight: parseFloat(weight),
      dimensions: {
        length: parseFloat(length),
        width: parseFloat(width),
        height: parseFloat(height)
      },
      shipmentType,
      status: 'Pending Payment',
      estimatedDeliveryDays,
      paymentStatus: 'Pending',
      history: [{
        status: 'Pending Payment',
        location: originCity,
        timestamp: new Date(),
        updatedBy: senderName
      }]
    });

    await shipment.save();

    res.status(201).json({
      success: true,
      message: 'Shipment booking created. Awaiting payment.',
      shipment
    });
  } catch (error) {
    next(error);
  }
};

// Get Shipment by Tracking ID (Publicly accessible)
const getShipmentByTrackingId = async (req, res, next) => {
  const { trackingId } = req.params;

  try {
    const shipment = await Shipment.findOne({ trackingId });
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    res.status(200).json({ success: true, shipment });
  } catch (error) {
    next(error);
  }
};

// Get Customer Shipments
const getCustomerShipments = async (req, res, next) => {
  try {
    const shipments = await Shipment.find({ senderId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, shipments });
  } catch (error) {
    next(error);
  }
};

// Get Staff Assigned Deliveries
const getStaffShipments = async (req, res, next) => {
  try {
    const shipments = await Shipment.find({ assignedStaffId: req.user.id }).sort({ updatedAt: -1 });
    res.status(200).json({ success: true, shipments });
  } catch (error) {
    next(error);
  }
};

// Get All Shipments (Admin)
const getAllShipments = async (req, res, next) => {
  try {
    const shipments = await Shipment.find({}).sort({ createdAt: -1 });
    res.status(200).json({ success: true, shipments });
  } catch (error) {
    next(error);
  }
};

// Assign Shipment to Staff (Admin only)
const assignShipment = async (req, res, next) => {
  const { shipmentId } = req.params;
  const { staffId, staffName } = req.body;

  try {
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    shipment.assignedStaffId = staffId;
    shipment.assignedStaffName = staffName;
    
    // Add history item
    shipment.history.push({
      status: shipment.status,
      location: 'Warehouse / Dispatch Center',
      timestamp: new Date(),
      updatedBy: `Admin (${req.user.name})`
    });

    await shipment.save();

    // Create notification for staff
    await Notification.create({
      userId: staffId,
      title: 'New Shipment Assigned',
      message: `Shipment ${shipment.trackingId} has been assigned to you for delivery.`,
      type: 'general',
      shipmentId: shipment.id
    });

    res.status(200).json({
      success: true,
      message: `Shipment successfully assigned to ${staffName}.`,
      shipment
    });
  } catch (error) {
    next(error);
  }
};

// Update Shipment Status (Staff or Admin)
const updateShipmentStatus = async (req, res, next) => {
  const { shipmentId } = req.params;
  const { status, location } = req.body;

  try {
    const shipment = await Shipment.findById(shipmentId);
    if (!shipment) {
      return res.status(404).json({ success: false, message: 'Shipment not found.' });
    }

    // Security check: staff can only update their assigned shipments
    if (req.user.role === 'staff' && shipment.assignedStaffId !== req.user.id) {
      return res.status(403).json({ success: false, message: 'Access denied. You are not assigned to this shipment.' });
    }

    shipment.status = status;
    shipment.history.push({
      status,
      location: location || 'Transit Node',
      timestamp: new Date(),
      updatedBy: `${req.user.role.toUpperCase()} (${req.user.name})`
    });

    await shipment.save();

    // 1. Emit socket event for real-time tracking page updates
    const io = req.app.get('io');
    if (io) {
      io.to(`shipment:${shipment.trackingId}`).emit('status-update', {
        trackingId: shipment.trackingId,
        status,
        location: location || 'Transit Node',
        timestamp: new Date()
      });
      
      // Also notify customer user room directly
      io.to(`user:${shipment.senderId}`).emit('notification', {
        title: 'Shipment Status Update',
        message: `Your shipment ${shipment.trackingId} is now: ${status}`
      });
    }

    // 2. Create in-app Notification record in DB
    await Notification.create({
      userId: shipment.senderId,
      title: 'Shipment Status Updated',
      message: `Your package ${shipment.trackingId} status has changed to: ${status} (${location || 'Transit Node'})`,
      type: 'status_update',
      shipmentId: shipment.id
    });

    res.status(200).json({
      success: true,
      message: `Shipment status updated to: ${status}`,
      shipment
    });
  } catch (error) {
    next(error);
  }
};

// Estimate ETA without booking (For live preview in customer dashboard)
const estimateEta = async (req, res, next) => {
  const { origin, destination, weight, shipmentType } = req.body;

  try {
    const estimatedDeliveryDays = getFallbackDeliveryTime(origin, destination, shipmentType, parseFloat(weight) || 1.0);

    res.status(200).json({
      success: true,
      estimated_delivery_days: estimatedDeliveryDays
    });
  } catch (error) {
    next(error);
  }
};

// Support Ticket Management
const getUserTickets = async (req, res, next) => {
  const Ticket = require('../models/Ticket');
  try {
    let tickets;
    if (req.user.role === 'admin') {
      tickets = await Ticket.find({}).sort({ createdAt: -1 });
    } else {
      tickets = await Ticket.find({ userId: req.user.id }).sort({ createdAt: -1 });
    }
    res.status(200).json({ success: true, tickets });
  } catch (error) {
    next(error);
  }
};

const createUserTicket = async (req, res, next) => {
  const Ticket = require('../models/Ticket');
  const { title, message, category } = req.body;
  try {
    const ticket = new Ticket({
      userId: req.user.id,
      senderName: req.user.name,
      title,
      message,
      category
    });
    await ticket.save();
    res.status(201).json({ success: true, ticket });
  } catch (error) {
    next(error);
  }
};

const resolveUserTicket = async (req, res, next) => {
  const Ticket = require('../models/Ticket');
  const { ticketId } = req.params;
  try {
    const ticket = await Ticket.findById(ticketId);
    if (!ticket) {
      return res.status(404).json({ success: false, message: 'Ticket not found.' });
    }
    ticket.status = 'resolved';
    await ticket.save();
    res.status(200).json({ success: true, message: 'Ticket marked resolved.', ticket });
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

    res.status(200).json({
      success: true,
      recommendation
    });
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
