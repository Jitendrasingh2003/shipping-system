const jwt = require('jsonwebtoken');
const { getMySQLPool, checkMySQLActive } = require('../config/db.mysql');
const UserMongo = require('../models/User.mongo');

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
    let user = null;

    if (checkMySQLActive()) {
      const mysqlPool = getMySQLPool();
      const [rows] = await mysqlPool.query(
        'SELECT id, name, email, role, phone FROM users WHERE id = ?',
        [decoded.id]
      );
      if (rows.length > 0) {
        user = rows[0];
      }
    } else {
      const mongoUser = await UserMongo.findById(decoded.id);
      if (mongoUser) {
        user = {
          id: mongoUser._id.toString(),
          name: mongoUser.name,
          email: mongoUser.email,
          role: mongoUser.role,
          phone: mongoUser.phone
        };
      }
    }

    if (!user) {
      return res.status(401).json({ success: false, message: 'User not found or session invalid.' });
    }

    req.user = user;
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
