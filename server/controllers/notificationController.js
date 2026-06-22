const { getMySQLPool } = require('../config/db.mysql');

const getNotifications = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query(
      `SELECT * FROM notifications 
       WHERE user_id = ? OR user_id = ? OR user_id = 'all'
       ORDER BY created_at DESC LIMIT 30`,
      [req.user.id, req.user.role]
    );
    const notifications = rows.map(r => ({
      id: r.id,
      userId: r.user_id,
      title: r.title,
      message: r.message,
      type: r.type,
      isRead: r.is_read === 1,
      shipmentId: r.shipment_id,
      createdAt: r.created_at
    }));
    res.status(200).json({ success: true, notifications });
  } catch (error) {
    next(error);
  }
};

const markAsRead = async (req, res, next) => {
  const { notificationId } = req.params;
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT id FROM notifications WHERE id = ?', [notificationId]);
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: 'Notification not found.' });
    }
    await pool.query('UPDATE notifications SET is_read = 1 WHERE id = ?', [notificationId]);
    res.status(200).json({ success: true, message: 'Notification marked as read.' });
  } catch (error) {
    next(error);
  }
};

const markAllAsRead = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    await pool.query('UPDATE notifications SET is_read = 1 WHERE user_id = ? AND is_read = 0', [req.user.id]);
    res.status(200).json({ success: true, message: 'All notifications marked as read.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getNotifications,
  markAsRead,
  markAllAsRead
};
