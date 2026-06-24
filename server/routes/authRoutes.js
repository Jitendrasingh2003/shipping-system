// Trigger nodemon restart
const express = require('express');
const router = express.Router();
const { 
  register, 
  login, 
  getMe, 
  getAllStaff,
  getUserAddresses,
  createUserAddress,
  deleteUserAddress,
  sendOtp
} = require('../controllers/authController');
const { protect, authorize } = require('../middleware/auth');
const { authLimiter } = require('../middleware/rateLimiter');

// Public auth routes
router.post('/register', authLimiter, register);
router.post('/login', authLimiter, login);
router.post('/send-otp', authLimiter, sendOtp);

// Protected routes
router.get('/me', protect, getMe);
router.get('/staff', protect, authorize('admin'), getAllStaff);

// Address Management
router.get('/addresses', protect, getUserAddresses);
router.post('/addresses', protect, createUserAddress);
router.delete('/addresses/:addressId', protect, deleteUserAddress);

module.exports = router;
