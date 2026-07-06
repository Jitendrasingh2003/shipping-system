const { getMySQLPool } = require('../config/db.mysql');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { v4: uuidv4 } = require('uuid');

// ============================================================
// SUPER ADMIN LOGIN
// ============================================================
const superAdminLogin = async (req, res, next) => {
  const { email, password } = req.body;
  try {
    const SUPER_ADMIN_EMAIL = process.env.SUPER_ADMIN_EMAIL || 'superadmin@smartship.io';
    const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD || 'SuperAdmin@123';

    if (email !== SUPER_ADMIN_EMAIL || password !== SUPER_ADMIN_PASSWORD) {
      return res.status(401).json({ success: false, message: 'Invalid super admin credentials.' });
    }

    const token = jwt.sign(
      { id: 'super-admin', role: 'superadmin', isSuperAdmin: true },
      process.env.JWT_SECRET || 'smartship_jwt_super_secret_signing_key_2026',
      { expiresIn: '1d' }
    );

    res.json({
      success: true,
      message: 'Super Admin login successful.',
      token,
      user: { id: 'super-admin', name: 'Super Admin', email: SUPER_ADMIN_EMAIL, role: 'superadmin' }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET ALL TENANTS
// ============================================================
const getAllTenants = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    const [tenants] = await pool.query(`
      SELECT 
        t.id, t.name, t.slug, t.owner_email, t.plan, t.plan_status, 
        t.is_active, t.trial_ends_at, t.created_at,
        COUNT(DISTINCT u.id) as total_users,
        COUNT(DISTINCT s.id) as total_shipments
      FROM tenants t
      LEFT JOIN users u ON u.tenant_id = t.id
      LEFT JOIN shipments s ON s.tenant_id = t.id
      GROUP BY t.id
      ORDER BY t.created_at DESC
    `);

    const stats = {
      total: tenants.length,
      active: tenants.filter(t => t.plan_status === 'active').length,
      trial: tenants.filter(t => t.plan === 'trial').length,
      suspended: tenants.filter(t => t.plan_status === 'suspended').length,
    };

    res.json({ success: true, tenants, stats });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// GET SINGLE TENANT DETAIL
// ============================================================
const getTenantDetail = async (req, res, next) => {
  const { tenantId } = req.params;
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM tenants WHERE id = ?', [tenantId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Tenant not found.' });

    const [users] = await pool.query(
      'SELECT id, name, email, role, created_at FROM users WHERE tenant_id = ?',
      [tenantId]
    );
    const [shipments] = await pool.query(
      'SELECT COUNT(*) as count FROM shipments WHERE tenant_id = ?',
      [tenantId]
    );

    res.json({
      success: true,
      tenant: rows[0],
      users,
      shipmentCount: shipments[0].count
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// UPDATE TENANT PLAN
// ============================================================
const updateTenantPlan = async (req, res, next) => {
  const { tenantId } = req.params;
  const { plan, planStatus, maxUsers, maxShipmentsPerMonth } = req.body;

  const PLAN_LIMITS = {
    trial:      { maxUsers: 2,         maxShipments: 50 },
    basic:      { maxUsers: 5,         maxShipments: 500 },
    pro:        { maxUsers: 20,        maxShipments: 2000 },
    enterprise: { maxUsers: 999999,    maxShipments: 999999 }
  };

  try {
    const pool = getMySQLPool();
    const limits = PLAN_LIMITS[plan] || PLAN_LIMITS['basic'];

    await pool.query(
      `UPDATE tenants SET 
        plan = ?, 
        plan_status = ?,
        max_users = ?,
        max_shipments_per_month = ?
       WHERE id = ?`,
      [
        plan || 'basic',
        planStatus || 'active',
        maxUsers || limits.maxUsers,
        maxShipmentsPerMonth || limits.maxShipments,
        tenantId
      ]
    );

    res.json({ success: true, message: `Tenant plan updated to ${plan} successfully.` });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// TOGGLE TENANT ACTIVE STATUS
// ============================================================
const toggleTenantStatus = async (req, res, next) => {
  const { tenantId } = req.params;
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT is_active FROM tenants WHERE id = ?', [tenantId]);
    if (rows.length === 0) return res.status(404).json({ success: false, message: 'Tenant not found.' });

    const newStatus = rows[0].is_active ? 0 : 1;
    await pool.query('UPDATE tenants SET is_active = ? WHERE id = ?', [newStatus, tenantId]);

    res.json({
      success: true,
      message: `Tenant ${newStatus ? 'activated' : 'suspended'} successfully.`,
      isActive: Boolean(newStatus)
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// PLATFORM REVENUE OVERVIEW
// ============================================================
const getRevenueOverview = async (req, res, next) => {
  try {
    const pool = getMySQLPool();

    const PLAN_PRICES = { trial: 0, basic: 999, pro: 2999, enterprise: 15000 };

    const [tenants] = await pool.query(
      "SELECT plan, COUNT(*) as count FROM tenants WHERE plan_status = 'active' GROUP BY plan"
    );

    let mrr = 0;
    const breakdown = {};
    tenants.forEach(row => {
      const price = PLAN_PRICES[row.plan] || 0;
      mrr += price * row.count;
      breakdown[row.plan] = { count: row.count, revenue: price * row.count };
    });

    const [totalShipments] = await pool.query('SELECT COUNT(*) as count FROM shipments');
    const [totalUsers] = await pool.query('SELECT COUNT(*) as count FROM users');

    res.json({
      success: true,
      revenue: {
        mrr,
        arr: mrr * 12,
        breakdown,
        totalShipments: totalShipments[0].count,
        totalUsers: totalUsers[0].count
      }
    });
  } catch (error) {
    next(error);
  }
};

// ============================================================
// DELETE TENANT (Hard delete — careful!)
// ============================================================
const deleteTenant = async (req, res, next) => {
  const { tenantId } = req.params;
  try {
    const pool = getMySQLPool();
    await pool.query('DELETE FROM users WHERE tenant_id = ?', [tenantId]);
    await pool.query('DELETE FROM shipments WHERE tenant_id = ?', [tenantId]);
    await pool.query('DELETE FROM tenants WHERE id = ?', [tenantId]);

    res.json({ success: true, message: 'Tenant and all associated data deleted permanently.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  superAdminLogin,
  getAllTenants,
  getTenantDetail,
  updateTenantPlan,
  toggleTenantStatus,
  getRevenueOverview,
  deleteTenant
};
