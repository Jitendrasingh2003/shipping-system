const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getMySQLPool } = require('../config/db.mysql');

// In-memory store for OTPs
// Format: { [emailOrPhone]: { otp, expires } }
const tempOtps = {};

// Send OTP simulation
const sendOtp = async (req, res, next) => {
  const { email, phone, method } = req.body;

  try {
    if (!email || !phone || !method) {
      return res.status(400).json({ success: false, message: 'Email, phone and method are required.' });
    }

    if (method !== 'email' && method !== 'sms') {
      return res.status(400).json({ success: false, message: 'Invalid verification method.' });
    }

    // Generate random 6-digit OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiryTime = Date.now() + 5 * 60 * 1000; // 5 minutes

    const key = method === 'email' ? email.toLowerCase() : phone;
    tempOtps[key] = { otp, expires: expiryTime };

    // Trigger simulation
    const { sendSMSAlert, sendEmailAlert } = require('../utils/communication');
    if (method === 'email') {
      sendEmailAlert(
        email.toLowerCase(),
        'Marine Bytes Registration OTP',
        `Dear Customer,\n\nYour 6-digit OTP code for registration is: ${otp}.\n\nThis OTP is valid for 5 minutes.`
      );
    } else {
      sendSMSAlert(
        phone,
        `Your Marine Bytes registration verification code is: ${otp}. Valid for 5 minutes.`
      );
    }

    res.status(200).json({
      success: true,
      message: `OTP sent successfully to your registered ${method === 'email' ? 'email' : 'mobile number'}.`
    });
  } catch (error) {
    next(error);
  }
};

// Helper: Generate Token
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'smartship_jwt_super_secret_signing_key_2026',
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );
};

// Register User
const register = async (req, res, next) => {
  const { name, email, password, role = 'customer', phone = '', otp } = req.body;

  try {
    const userRole = ['admin', 'staff', 'customer'].includes(role) ? role : 'customer';
    const pool = getMySQLPool();

    // Verify OTP for customer registrations
    if (userRole === 'customer' && process.env.NODE_ENV !== 'test') {
      if (!otp) {
        return res.status(400).json({ success: false, message: 'Verification OTP is required.' });
      }

      const emailKey = email.toLowerCase();
      const phoneKey = phone;

      let verified = false;

      // Check email OTP
      if (tempOtps[emailKey] && tempOtps[emailKey].otp === otp && tempOtps[emailKey].expires > Date.now()) {
        delete tempOtps[emailKey];
        verified = true;
      }
      // Check phone OTP
      else if (tempOtps[phoneKey] && tempOtps[phoneKey].otp === otp && tempOtps[phoneKey].expires > Date.now()) {
        delete tempOtps[phoneKey];
        verified = true;
      }

      if (!verified) {
        return res.status(400).json({ success: false, message: 'Invalid or expired verification OTP.' });
      }
    }

    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    if (rows.length > 0) {
      return res.status(400).json({ success: false, message: 'User already exists with this email.' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = uuidv4();

    await pool.query(
      'INSERT INTO users (id, name, email, password, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
      [userId, name, email.toLowerCase(), hashedPassword, userRole, phone]
    );

    const token = generateToken(userId, userRole);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: { id: userId, name, email: email.toLowerCase(), role: userRole, phone }
    });
  } catch (error) {
    next(error);
  }
};

// Login User
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
    
    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const user = rows[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    const token = generateToken(user.id, user.role);

    res.status(200).json({
      success: true,
      message: 'Login successful!',
      token,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        phone: user.phone
      }
    });
  } catch (error) {
    next(error);
  }
};

// Get Me
const getMe = async (req, res) => {
  res.status(200).json({
    success: true,
    user: req.user
  });
};

// Get All Staff Members (for Admin assignment dropdown)
const getAllStaff = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query("SELECT id, name, email, phone, is_blocked AS isBlocked FROM users WHERE role = 'staff'");
    res.status(200).json({ success: true, staff: rows });
  } catch (error) {
    next(error);
  }
};

// Address Management
const getUserAddresses = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query(
      'SELECT * FROM addresses WHERE user_id = ? ORDER BY created_at DESC',
      [req.user.id]
    );
    res.status(200).json({ success: true, addresses: rows });
  } catch (error) {
    next(error);
  }
};

const createUserAddress = async (req, res, next) => {
  const { name, phone, address, city, pincode } = req.body;
  try {
    const pool = getMySQLPool();
    const id = uuidv4();
    await pool.query(
      'INSERT INTO addresses (id, user_id, name, phone, address, city, pincode) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, req.user.id, name, phone, address, city, pincode]
    );
    res.status(201).json({
      success: true,
      address: { id, userId: req.user.id, name, phone, address, city, pincode }
    });
  } catch (error) {
    next(error);
  }
};

const deleteUserAddress = async (req, res, next) => {
  const { addressId } = req.params;
  try {
    const pool = getMySQLPool();
    const [result] = await pool.query(
      'DELETE FROM addresses WHERE id = ? AND user_id = ?',
      [addressId, req.user.id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: 'Address not found or unauthorized.' });
    }
    res.status(200).json({ success: true, message: 'Address deleted successfully.' });
  } catch (error) {
    next(error);
  }
};

const updateProfile = async (req, res, next) => {
  const { name, phone } = req.body;
  try {
    const pool = getMySQLPool();
    const updates = [];
    const values = [];
    if (name) { updates.push('name = ?'); values.push(name); }
    if (phone !== undefined) { updates.push('phone = ?'); values.push(phone); }
    if (updates.length === 0) {
      return res.status(400).json({ success: false, message: 'No fields to update.' });
    }
    values.push(req.user.id);
    await pool.query(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`, values);
    const [rows] = await pool.query('SELECT id, name, email, role, phone FROM users WHERE id = ?', [req.user.id]);
    res.status(200).json({ success: true, message: 'Profile updated successfully.', user: rows[0] });
  } catch (error) {
    next(error);
  }
};

const changePassword = async (req, res, next) => {
  const { currentPassword, newPassword } = req.body;
  if (!currentPassword || !newPassword) {
    return res.status(400).json({ success: false, message: 'Current and new password are required.' });
  }
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM users WHERE id = ?', [req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    const isMatch = await bcrypt.compare(currentPassword, rows[0].password);
    if (!isMatch) return res.status(400).json({ success: false, message: 'Current password is incorrect.' });
    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);
    await pool.query('UPDATE users SET password = ? WHERE id = ?', [hashed, req.user.id]);
    res.status(200).json({ success: true, message: 'Password changed successfully.' });
  } catch (error) {
    next(error);
  }
};

const getReferralInfo = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    const userId = req.user.id;
    let [userRows] = await pool.query('SELECT referral_code, reward_points FROM users WHERE id = ?', [userId]);
    if (userRows.length === 0) return res.status(404).json({ success: false, message: 'User not found.' });
    let referralCode = userRows[0].referral_code;
    if (!referralCode) {
      referralCode = 'SMT' + userId.slice(0, 6).toUpperCase();
      await pool.query('UPDATE users SET referral_code = ? WHERE id = ?', [referralCode, userId]);
    }
    const [referrals] = await pool.query(
      'SELECT * FROM referrals WHERE user_id = ? ORDER BY created_at DESC', [userId]
    );
    const [rewards] = await pool.query(
      'SELECT * FROM rewards WHERE user_id = ? ORDER BY created_at DESC', [userId]
    );
    const totalPoints = userRows[0].reward_points || 0;
    res.status(200).json({
      success: true,
      referralCode,
      totalPoints,
      referrals,
      rewards
    });
  } catch (error) {
    next(error);
  }
};

const applyReferral = async (req, res, next) => {
  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: 'Referral code is required.' });
  try {
    const pool = getMySQLPool();
    const [refereeRows] = await pool.query('SELECT id, name, referral_code FROM users WHERE referral_code = ?', [code]);
    if (refereeRows.length === 0) return res.status(404).json({ success: false, message: 'Invalid referral code.' });
    const referee = refereeRows[0];
    if (referee.id === req.user.id) return res.status(400).json({ success: false, message: 'Cannot use your own referral code.' });
    const [existing] = await pool.query('SELECT * FROM referrals WHERE referred_email = (SELECT email FROM users WHERE id = ?)', [req.user.id]);
    if (existing.length > 0) return res.status(400).json({ success: false, message: 'Referral already applied.' });
    const referralId = uuidv4();
    const rewardId = uuidv4();
    const points = 100;
    await pool.query(
      'INSERT INTO referrals (id, user_id, referral_code, referred_email, referred_name, reward_earned, status) VALUES (?, ?, ?, (SELECT email FROM users WHERE id = ?), (SELECT name FROM users WHERE id = ?), ?, ?)',
      [referralId, referee.id, code, req.user.id, req.user.id, points, 'completed']
    );
    await pool.query(
      'INSERT INTO rewards (id, user_id, points, reward_type, description) VALUES (?, ?, ?, ?, ?)',
      [rewardId, referee.id, points, 'referral', `Referred user earned you ${points} reward points.`]
    );
    await pool.query('UPDATE users SET reward_points = reward_points + ? WHERE id = ?', [points, referee.id]);
    await pool.query(
      'INSERT INTO rewards (id, user_id, points, reward_type, description) VALUES (?, ?, ?, ?, ?)',
      [uuidv4(), req.user.id, 25, 'signup_bonus', 'Welcome! You earned 25 points for joining via referral.']
    );
    await pool.query('UPDATE users SET reward_points = reward_points + 25 WHERE id = ?', [req.user.id]);
    res.status(200).json({ success: true, message: 'Referral applied! You both earned rewards.', points });
  } catch (error) {
    next(error);
  }
};

const claimReward = async (req, res, next) => {
  const { rewardId } = req.params;
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM rewards WHERE id = ? AND user_id = ?', [rewardId, req.user.id]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Reward not found.' });
    if (rows[0].claimed) return res.status(400).json({ success: false, message: 'Reward already claimed.' });
    await pool.query('UPDATE rewards SET claimed = 1 WHERE id = ?', [rewardId]);
    res.status(200).json({ success: true, message: 'Reward claimed successfully.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
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
};
