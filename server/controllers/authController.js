const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');
const { getMySQLPool, checkMySQLActive } = require('../config/db.mysql');
const UserMongo = require('../models/User.mongo');

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
    
    // Check if user already exists
    let existingUser = null;

    if (checkMySQLActive()) {
      const mysqlPool = getMySQLPool();
      const [rows] = await mysqlPool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
      if (rows.length > 0) existingUser = rows[0];
    } else {
      existingUser = await UserMongo.findOne({ email: email.toLowerCase() });
    }

    if (existingUser) {
      return res.status(400).json({ success: false, message: 'User already exists with this email.' });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    const userId = uuidv4();

    // Save User
    if (checkMySQLActive()) {
      const mysqlPool = getMySQLPool();
      await mysqlPool.query(
        'INSERT INTO users (id, name, email, password, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
        [userId, name, email.toLowerCase(), hashedPassword, userRole, phone]
      );
    } else {
      await UserMongo.create({
        _id: userId,
        name,
        email: email.toLowerCase(),
        password: hashedPassword,
        role: userRole,
        phone
      });
    }

    const token = generateToken(userId, userRole);

    res.status(201).json({
      success: true,
      message: 'Registration successful!',
      token,
      user: { id: userId, name, email, role: userRole, phone }
    });
  } catch (error) {
    next(error);
  }
};

// Login User
const login = async (req, res, next) => {
  const { email, password } = req.body;

  try {
    let user = null;

    if (checkMySQLActive()) {
      const mysqlPool = getMySQLPool();
      const [rows] = await mysqlPool.query('SELECT * FROM users WHERE email = ?', [email.toLowerCase()]);
      if (rows.length > 0) user = rows[0];
    } else {
      const mongoUser = await UserMongo.findOne({ email: email.toLowerCase() });
      if (mongoUser) {
        user = {
          id: mongoUser._id.toString(),
          name: mongoUser.name,
          email: mongoUser.email,
          password: mongoUser.password,
          role: mongoUser.role,
          phone: mongoUser.phone
        };
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

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
    let staffList = [];
    if (checkMySQLActive()) {
      const mysqlPool = getMySQLPool();
      const [rows] = await mysqlPool.query("SELECT id, name, email, phone FROM users WHERE role = 'staff'");
      staffList = rows;
    } else {
      const mongoStaff = await UserMongo.find({ role: 'staff' }).select('name email phone');
      staffList = mongoStaff.map(s => ({
        id: s._id.toString(),
        name: s.name,
        email: s.email,
        phone: s.phone
      }));
    }

    res.status(200).json({ success: true, staff: staffList });
  } catch (error) {
    next(error);
  }
};

// Address Management
const getUserAddresses = async (req, res, next) => {
  const Address = require('../models/Address');
  try {
    const addresses = await Address.find({ userId: req.user.id }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, addresses });
  } catch (error) {
    next(error);
  }
};

const createUserAddress = async (req, res, next) => {
  const Address = require('../models/Address');
  const { name, phone, address, city, pincode } = req.body;
  try {
    const newAddr = new Address({
      userId: req.user.id,
      name,
      phone,
      address,
      city,
      pincode
    });
    await newAddr.save();
    res.status(201).json({ success: true, address: newAddr });
  } catch (error) {
    next(error);
  }
};

const deleteUserAddress = async (req, res, next) => {
  const Address = require('../models/Address');
  const { addressId } = req.params;
  try {
    const deleted = await Address.findOneAndDelete({ _id: addressId, userId: req.user.id });
    if (!deleted) {
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
