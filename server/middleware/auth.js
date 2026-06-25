const jwt = require('jsonwebtoken');
const { getMySQLPool } = require('../config/db.mysql');

const protect = async (req, res, next) => {
  let token;
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access denied. No token provided.' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartship_jwt_super_secret_signing_key_2026');
    const pool = getMySQLPool();
    const [rows] = await pool.query(
      'SELECT id, name, email, role, phone, is_blocked FROM users WHERE id = ?',
      [decoded.id]
    );

    if (rows.length === 0) {
      return res.status(401).json({ success: false, message: 'User not found or session invalid.' });
    }

    if (rows[0].is_blocked === 1 || rows[0].is_blocked === true) {
      return res.status(403).json({ success: false, message: 'Access denied. Your account has been blocked.' });
    }

    req.user = rows[0];
    next();
  } catch (err) {
    return res.status(401).json({ success: false, message: 'Token invalid or expired.' });
  }
};

const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Access denied. Role '${req.user?.role || 'Guest'}' is not authorized to access this resource.`
      });
    }
    next();
  };
};

module.exports = { protect, authorize };
