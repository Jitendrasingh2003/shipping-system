// Trigger 
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
  sendOtp,
  updateProfile,
  changePassword,
  getReferralInfo,
  applyReferral,
  claimReward
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

// Profile Management
router.put('/profile', protect, updateProfile);
router.put('/change-password', protect, changePassword);

// Referral & Rewards
router.get('/referral', protect, getReferralInfo);
router.post('/referral/apply', protect, applyReferral);
router.put('/rewards/:rewardId/claim', protect, claimReward);

// Address Management
router.get('/addresses', protect, getUserAddresses);
router.post('/addresses', protect, createUserAddress);
router.delete('/addresses/:addressId', protect, deleteUserAddress);

module.exports = router;
