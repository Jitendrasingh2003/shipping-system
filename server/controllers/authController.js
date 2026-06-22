const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getMySQLPool } = require('../config/db.mysql');

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
  const { name, email, password, role = 'customer', phone = '' } = req.body;

  try {
    const userRole = ['admin', 'staff', 'customer'].includes(role) ? role : 'customer';
    const pool = getMySQLPool();

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
    const [rows] = await pool.query("SELECT id, name, email, phone FROM users WHERE role = 'staff'");
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

module.exports = {
  register,
  login,
  getMe,
  getAllStaff,
  getUserAddresses,
  createUserAddress,
  deleteUserAddress
};
