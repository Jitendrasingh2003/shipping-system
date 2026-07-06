const express = require('express');
const router = express.Router();
const {
  superAdminLogin,
  getAllTenants,
  getTenantDetail,
  updateTenantPlan,
  toggleTenantStatus,
  getRevenueOverview,
  deleteTenant
} = require('../controllers/superAdminController');

// Super admin JWT verify middleware
const jwt = require('jsonwebtoken');
const superAdminProtect = (req, res, next) => {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET || 'smartship_jwt_super_secret_signing_key_2026');
    if (!decoded.isSuperAdmin) {
      return res.status(403).json({ success: false, message: 'Super admin access required.' });
    }
    req.superAdmin = decoded;
    next();
  } catch {
    return res.status(401).json({ success: false, message: 'Invalid or expired token.' });
  }
};

// ── Auth ────────────────────────────────────────────────────
router.post('/login', superAdminLogin);

// ── Dashboard ───────────────────────────────────────────────
router.get('/tenants', superAdminProtect, getAllTenants);
router.get('/tenants/:tenantId', superAdminProtect, getTenantDetail);
router.put('/tenants/:tenantId/plan', superAdminProtect, updateTenantPlan);
router.patch('/tenants/:tenantId/toggle', superAdminProtect, toggleTenantStatus);
router.delete('/tenants/:tenantId', superAdminProtect, deleteTenant);
router.get('/revenue', superAdminProtect, getRevenueOverview);

module.exports = router;
