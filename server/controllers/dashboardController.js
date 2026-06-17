const Shipment = require('../models/Shipment');
const Invoice = require('../models/Invoice');
const UserMongo = require('../models/User.mongo');
const { getMySQLPool, checkMySQLActive } = require('../config/db.mysql');

const getDashboardStats = async (req, res, next) => {
  const { role, id: userId } = req.user;

  try {
    if (role === 'admin') {
      // 1. Admin Stats
      const totalShipmentsCount = await Shipment.countDocuments();
      const statusBreakdown = await Shipment.aggregate([
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      
      const typeBreakdown = await Shipment.aggregate([
        { $group: { _id: '$shipmentType', count: { $sum: 1 } } }
      ]);

      const totalRevenueResult = await Invoice.aggregate([
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalRevenue = totalRevenueResult.length > 0 ? totalRevenueResult[0].total : 0;

      // User registrations counts
      let totalUsersCount = 0;
      let rolesDistribution = { admin: 0, staff: 0, customer: 0 };

      if (checkMySQLActive()) {
        const mysqlPool = getMySQLPool();
        const [rows] = await mysqlPool.query(
          "SELECT role, COUNT(*) as count FROM users GROUP BY role"
        );
        rows.forEach(r => {
          rolesDistribution[r.role] = parseInt(r.count);
          totalUsersCount += parseInt(r.count);
        });
      } else {
        const usersGrouped = await UserMongo.aggregate([
          { $group: { _id: '$role', count: { $sum: 1 } } }
        ]);
        usersGrouped.forEach(ug => {
          rolesDistribution[ug._id] = ug.count;
          totalUsersCount += ug.count;
        });
      }

      // Recent shipments
      const recentShipments = await Shipment.find().sort({ createdAt: -1 }).limit(5);

      res.status(200).json({
        success: true,
        stats: {
          totalShipments: totalShipmentsCount,
          totalRevenue,
          totalUsers: totalUsersCount,
          usersBreakdown: rolesDistribution,
          statusBreakdown: statusBreakdown.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {}),
          typeBreakdown: typeBreakdown.reduce((acc, curr) => {
            acc[curr._id] = curr.count;
            return acc;
          }, {}),
          recentShipments
        }
      });

    } else if (role === 'staff') {
      // 2. Staff Stats
      const totalAssigned = await Shipment.countDocuments({ assignedStaffId: userId });
      const pendingAssigned = await Shipment.countDocuments({ 
        assignedStaffId: userId, 
        status: { $in: ['Booked', 'Picked up', 'In Transit', 'Out for Delivery'] } 
      });
      const completedAssigned = await Shipment.countDocuments({ 
        assignedStaffId: userId, 
        status: 'Delivered' 
      });

      const recentTasks = await Shipment.find({ assignedStaffId: userId })
        .sort({ updatedAt: -1 })
        .limit(5);

      res.status(200).json({
        success: true,
        stats: {
          totalAssigned,
          pendingAssigned,
          completedAssigned,
          recentTasks
        }
      });

    } else {
      // 3. Customer Stats
      const totalBooked = await Shipment.countDocuments({ senderId: userId });
      const activeShipments = await Shipment.countDocuments({
        senderId: userId,
        status: { $in: ['Booked', 'Picked up', 'In Transit', 'Out for Delivery'] }
      });
      
      const totalSpentResult = await Invoice.aggregate([
        { $match: { userId } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]);
      const totalSpent = totalSpentResult.length > 0 ? totalSpentResult[0].total : 0;

      const recentShipments = await Shipment.find({ senderId: userId })
        .sort({ createdAt: -1 })
        .limit(5);

      // Spend history last 6 months
      const sixMonthsAgo = new Date();
      sixMonthsAgo.setDate(1); // Prevent month overflow bug
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 5);
      sixMonthsAgo.setHours(0, 0, 0, 0);

      const spendHistoryAgg = await Invoice.aggregate([
        { 
          $match: { 
            userId,
            createdAt: { $gte: sixMonthsAgo }
          } 
        },
        {
          $group: {
            _id: { 
              year: { $year: '$createdAt' }, 
              month: { $month: '$createdAt' } 
            },
            total: { $sum: '$amount' }
          }
        }
      ]);

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const spendHistory = [];
      for (let i = 5; i >= 0; i--) {
        const d = new Date();
        d.setDate(1); // Prevent month overflow bug
        d.setMonth(d.getMonth() - i);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const mName = monthNames[d.getMonth()];
        
        const found = spendHistoryAgg.find(item => item._id.year === y && item._id.month === m);
        spendHistory.push({
          month: `${mName} ${y.toString().slice(-2)}`,
          amount: found ? found.total : 0
        });
      }

      // Shipment type breakdown
      const typeBreakdownAgg = await Shipment.aggregate([
        { $match: { senderId: userId } },
        { $group: { _id: '$shipmentType', count: { $sum: 1 } } }
      ]);
      const typeBreakdown = { Standard: 0, Express: 0, Air: 0, Ocean: 0 };
      typeBreakdownAgg.forEach(item => {
        if (typeBreakdown[item._id] !== undefined) {
          typeBreakdown[item._id] = item.count;
        }
      });

      // Shipment status breakdown
      const statusBreakdownAgg = await Shipment.aggregate([
        { $match: { senderId: userId } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]);
      const statusBreakdown = {
        'Booked': 0,
        'Picked up': 0,
        'In Transit': 0,
        'Out for Delivery': 0,
        'Delivered': 0,
        'Pending Payment': 0,
        'Cancelled': 0
      };
      statusBreakdownAgg.forEach(item => {
        if (statusBreakdown[item._id] !== undefined) {
          statusBreakdown[item._id] = item.count;
        }
      });

      res.status(200).json({
        success: true,
        stats: {
          totalBooked,
          activeShipments,
          totalSpent,
          recentShipments,
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

module.exports = {
  getDashboardStats
};
