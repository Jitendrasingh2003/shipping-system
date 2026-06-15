const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  getAllStaff,
  getUserAddresses,
  createUserAddress,
  deleteUserAddress
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Public auth routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);

// Protected routes
router.get('/me', protect, getMe);
router.get('/staff', protect, authorize('admin'), getAllStaff);

// Address Management
router.get('/addresses', protect, getUserAddresses);
router.post('/addresses', protect, createUserAddress);
router.delete('/addresses/:addressId', protect, deleteUserAddress);

module.exports = router;
