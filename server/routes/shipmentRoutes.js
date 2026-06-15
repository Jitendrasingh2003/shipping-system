const express = require('express');
const router = express.Router();
const {
  bookShipment,
  getShipmentByTrackingId,
  getCustomerShipments,
  getStaffShipments,
  getAllShipments,
  assignShipment,
  updateShipmentStatus,
  predictEta,
  getUserTickets,
  createUserTicket,
  resolveUserTicket
} = require('../controllers/shipmentController');
const { protect, authorize } = require('../middleware/auth');

// Public route to track package without logging in
router.get('/track/:trackingId', getShipmentByTrackingId);

// Customer only routes
router.post('/book', protect, authorize('customer'), bookShipment);
router.post('/predict-eta', protect, authorize('customer'), predictEta);
router.get('/customer', protect, authorize('customer'), getCustomerShipments);

// Staff only routes
router.get('/staff', protect, authorize('staff'), getStaffShipments);

// Admin only routes
router.get('/all', protect, authorize('admin'), getAllShipments);
router.put('/:shipmentId/assign', protect, authorize('admin'), assignShipment);

// Shared Admin/Staff status updater
router.put('/:shipmentId/status', protect, authorize('admin', 'staff'), updateShipmentStatus);

// Support Ticket Routes
router.get('/tickets', protect, authorize('admin', 'customer'), getUserTickets);
router.post('/tickets', protect, authorize('customer'), createUserTicket);
router.put('/tickets/:ticketId/resolve', protect, authorize('admin'), resolveUserTicket);

module.exports = router;
