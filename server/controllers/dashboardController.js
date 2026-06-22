const { getMySQLPool } = require('../config/db.mysql');

const getDashboardStats = async (req, res, next) => {
  const { role, id: userId } = req.user;
  const pool = getMySQLPool();

  try {
    if (role === 'admin') {
      // Total shipments
      const [[{ totalShipments }]] = await pool.query('SELECT COUNT(*) AS totalShipments FROM shipments');

      // Status breakdown
      const [statusRows] = await pool.query('SELECT status, COUNT(*) AS count FROM shipments GROUP BY status');
      const statusBreakdown = {};
      statusRows.forEach(r => { statusBreakdown[r.status] = r.count; });

      // Type breakdown
      const [typeRows] = await pool.query('SELECT shipment_type AS type, COUNT(*) AS count FROM shipments GROUP BY shipment_type');
      const typeBreakdown = {};
      typeRows.forEach(r => { typeBreakdown[r.type] = r.count; });

      // Total revenue
      const [[{ totalRevenue }]] = await pool.query('SELECT COALESCE(SUM(amount), 0) AS totalRevenue FROM invoices');

      // Users breakdown
      const [userRows] = await pool.query('SELECT role, COUNT(*) AS count FROM users GROUP BY role');
      const rolesDistribution = { admin: 0, staff: 0, customer: 0 };
      let totalUsers = 0;
      userRows.forEach(r => {
        rolesDistribution[r.role] = parseInt(r.count);
        totalUsers += parseInt(r.count);
      });

      // Recent shipments
      const [recentRows] = await pool.query('SELECT * FROM shipments ORDER BY created_at DESC LIMIT 5');
      const recentShipments = recentRows.map(rowToShipment);

      res.status(200).json({
        success: true,
        stats: {
          totalShipments,
          totalRevenue: parseFloat(totalRevenue),
          totalUsers,
          usersBreakdown: rolesDistribution,
          statusBreakdown,
          typeBreakdown,
          recentShipments
        }
      });

    } else if (role === 'staff') {
      const [[{ totalAssigned }]] = await pool.query(
        'SELECT COUNT(*) AS totalAssigned FROM shipments WHERE assigned_staff_id = ?', [userId]
      );
      const [[{ pendingAssigned }]] = await pool.query(
        `SELECT COUNT(*) AS pendingAssigned FROM shipments 
         WHERE assigned_staff_id = ? AND status IN ('Booked','Picked up','In Transit','Out for Delivery')`, [userId]
      );
      const [[{ completedAssigned }]] = await pool.query(
        "SELECT COUNT(*) AS completedAssigned FROM shipments WHERE assigned_staff_id = ? AND status = 'Delivered'", [userId]
      );
      const [recentRows] = await pool.query(
        'SELECT * FROM shipments WHERE assigned_staff_id = ? ORDER BY updated_at DESC LIMIT 5', [userId]
      );

      res.status(200).json({
        success: true,
        stats: {
          totalAssigned,
          pendingAssigned,
          completedAssigned,
          recentTasks: recentRows.map(rowToShipment)
        }
      });

    } else {
      // Customer stats
      const [[{ totalBooked }]] = await pool.query(
        'SELECT COUNT(*) AS totalBooked FROM shipments WHERE sender_id = ?', [userId]
      );
      const [[{ activeShipments }]] = await pool.query(
        `SELECT COUNT(*) AS activeShipments FROM shipments 
         WHERE sender_id = ? AND status IN ('Booked','Picked up','In Transit','Out for Delivery')`, [userId]
      );
      const [[{ totalSpent }]] = await pool.query(
        'SELECT COALESCE(SUM(amount), 0) AS totalSpent FROM invoices WHERE user_id = ?', [userId]
      );
      const [recentRows] = await pool.query(
        'SELECT * FROM shipments WHERE sender_id = ? ORDER BY created_at DESC LIMIT 5', [userId]
      );

      // Spend history last 6 months
      const [spendRows] = await pool.query(`
        SELECT YEAR(created_at) AS year, MONTH(created_at) AS month, SUM(amount) AS total
        FROM invoices
        WHERE user_id = ? AND created_at >= DATE_SUB(CURDATE(), INTERVAL 6 MONTH)
        GROUP BY YEAR(created_at), MONTH(created_at)
      `, [userId]);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const spendHistory = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1);
        d.setMonth(d.getMonth() - i);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const found = spendRows.find(r => parseInt(r.year) === y && parseInt(r.month) === m);
        spendHistory.push({
          month: `${monthNames[d.getMonth()]} ${y.toString().slice(-2)}`,
          amount: found ? parseFloat(found.total) : 0
        });
      }

      // Shipment type breakdown
      const [typeRows] = await pool.query(
        'SELECT shipment_type AS type, COUNT(*) AS count FROM shipments WHERE sender_id = ? GROUP BY shipment_type', [userId]
      );
      const typeBreakdown = { Standard: 0, Express: 0, Air: 0, Ocean: 0 };
      typeRows.forEach(r => { if (typeBreakdown[r.type] !== undefined) typeBreakdown[r.type] = r.count; });

      // Status breakdown
      const [statusRows] = await pool.query(
        'SELECT status, COUNT(*) AS count FROM shipments WHERE sender_id = ? GROUP BY status', [userId]
      );
      const statusBreakdown = {
        'Booked': 0, 'Picked up': 0, 'In Transit': 0,
        'Out for Delivery': 0, 'Delivered': 0, 'Pending Payment': 0, 'Cancelled': 0
      };
      statusRows.forEach(r => { if (statusBreakdown[r.status] !== undefined) statusBreakdown[r.status] = r.count; });

      res.status(200).json({
        success: true,
        stats: {
          totalBooked,
          activeShipments,
          totalSpent: parseFloat(totalSpent),
          recentShipments: recentRows.map(rowToShipment),
          spendHistory,
          typeBreakdown,
          statusBreakdown
        }
      });
    }
  } catch (error) {
    next(error);
  }
};

// Shared row mapper
const rowToShipment = (row) => ({
  id: row.id,
  trackingId: row.tracking_id,
  senderId: row.sender_id,
  senderName: row.sender_name,
  recipientName: row.recipient_name,
  recipientAddress: row.recipient_address,
  originCity: row.origin_city,
  destinationCity: row.destination_city,
  weight: row.weight,
  dimensions: { length: row.dim_length, width: row.dim_width, height: row.dim_height },
  shipmentType: row.shipment_type,
  status: row.status,
  assignedStaffId: row.assigned_staff_id,
  assignedStaffName: row.assigned_staff_name,
  estimatedDeliveryDays: row.estimated_delivery_days,
  paymentStatus: row.payment_status,
  paymentId: row.payment_id,
  history: row.history ? (typeof row.history === 'string' ? JSON.parse(row.history) : row.history) : [],
  signature: row.signature,
  createdAt: row.created_at,
  updatedAt: row.updated_at
});

module.exports = { getDashboardStats };
