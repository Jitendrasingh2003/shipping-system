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
  manageRefund
} = require('../controllers/shipmentController');
const { protect, authorize } = require('../middleware/auth');

// Public route to track package without logging in
router.get('/track/:trackingId', getShipmentByTrackingId);

// Customer only routes
router.post('/book', protect, authorize('customer'), bookShipment);
router.post('/calculate-eta', protect, authorize('customer'), estimateEta);
router.post('/recommend-route', protect, authorize('customer'), recommendRoute);
router.get('/customer', protect, authorize('customer'), getCustomerShipments);
router.put('/:shipmentId/cancel', protect, authorize('customer', 'admin'), cancelShipment);
router.post('/:shipmentId/rate', protect, authorize('customer'), rateShipment);
router.post('/:shipmentId/reorder', protect, authorize('customer'), reOrderShipment);

// Staff only routes
router.get('/staff', protect, authorize('staff'), getStaffShipments);
router.post('/:shipmentId/delivery-photo', protect, authorize('staff', 'admin'), uploadDeliveryPhoto);

// Admin only routes
router.get('/all', protect, authorize('admin'), getAllShipments);
router.put('/:shipmentId/assign', protect, authorize('admin'), assignShipment);
router.post('/bulk-assign', protect, authorize('admin'), bulkAssignShipments);
router.get('/staff-performance', protect, authorize('admin'), getStaffPerformance);
router.put('/users/:userId/block', protect, authorize('admin'), blockUnblockUser);
router.put('/:shipmentId/refund', protect, authorize('admin'), manageRefund);

// Shared Admin/Staff status updater
router.put('/:shipmentId/status', protect, authorize('admin', 'staff'), updateShipmentStatus);

// Support Ticket Routes
router.get('/tickets', protect, authorize('admin', 'customer', 'staff'), getUserTickets);
router.post('/tickets', protect, authorize('customer', 'staff'), createUserTicket);
router.put('/tickets/:ticketId/resolve', protect, authorize('admin'), resolveUserTicket);

module.exports = router;
