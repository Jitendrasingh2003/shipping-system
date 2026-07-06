const { getMySQLPool } = require('../config/db.mysql');

/**
 * Middleware to enforce plan limits on shipments creation
 */
const enforceShipmentLimit = async (req, res, next) => {
  try {
    if (!req.tenant) return next(); // If no tenant context, proceed (default admin / public)

    const pool = getMySQLPool();
    const tenantId = req.tenant.id;

    // Get current calendar month start time
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const [shipmentCount] = await pool.query(
      'SELECT COUNT(*) as count FROM shipments WHERE tenant_id = ? AND created_at >= ?',
      [tenantId, startOfMonth]
    );

    const currentCount = shipmentCount[0].count;
    const maxAllowed = req.tenant.max_shipments_per_month;

    if (currentCount >= maxAllowed) {
      return res.status(403).json({
        success: false,
        message: `Monthly shipment limit reached (${currentCount}/${maxAllowed}). Please upgrade your plan to continue booking shipments.`,
        code: 'SHIPMENT_LIMIT_REACHED'
      });
    }

    next();
  } catch (error) {
    console.error('Shipment limit enforcement error:', error.message);
    next(); // Proceed to avoid blocking operations on middleware errors
  }
};

/**
 * Middleware to enforce plan limits on team/staff members creation
 */
const enforceUserLimit = async (req, res, next) => {
  try {
    if (!req.tenant) return next();

    const pool = getMySQLPool();
    const tenantId = req.tenant.id;

    const [userCount] = await pool.query(
      "SELECT COUNT(*) as count FROM users WHERE tenant_id = ? AND role != 'admin'",
      [tenantId]
    );

    const currentCount = userCount[0].count;
    const maxAllowed = req.tenant.max_users;

    // Check limit if registering a team member/staff/customer under this tenant
    // (Admin does not count towards the limit)
    const { role } = req.body;
    if (role !== 'admin' && currentCount >= maxAllowed) {
      return res.status(403).json({
        success: false,
        message: `User registration limit reached (${currentCount}/${maxAllowed}). Please upgrade your plan to register more members/staff.`,
        code: 'USER_LIMIT_REACHED'
      });
    }

    next();
  } catch (error) {
    console.error('User limit enforcement error:', error.message);
    next();
  }
};

module.exports = { enforceShipmentLimit, enforceUserLimit };
