const express = require('express');
const router = express.Router();
const {
  getWarehouses,
  createWarehouse,
  deleteWarehouse,
  getFleet,
  createFleet,
  updateFleet,
  deleteFleet,
  getRates,
  updateRates
} = require('../controllers/logisticsController');
const { protect, authorize } = require('../middleware/auth');

// All logistics routes require protection
router.use(protect);

// Warehouses
router.get('/warehouses', authorize('admin', 'staff', 'customer'), getWarehouses);
router.post('/warehouses', authorize('admin'), createWarehouse);
router.delete('/warehouses/:id', authorize('admin'), deleteWarehouse);

// Fleet
router.get('/fleet', authorize('admin', 'staff'), getFleet);
router.get('/fleet/available', authorize('admin', 'staff', 'customer'), getFleet);
router.post('/fleet', authorize('admin'), createFleet);
router.put('/fleet/:id', authorize('admin', 'staff'), updateFleet);
router.delete('/fleet/:id', authorize('admin'), deleteFleet);

// Rates
router.get('/rates', authorize('admin', 'staff', 'customer'), getRates);
router.post('/rates', authorize('admin'), updateRates);

module.exports = router;
