const { getMySQLPool } = require('../config/db.mysql');
const { v4: uuidv4 } = require('uuid');

// --- WAREHOUSE CONTROLLERS ---

const getWarehouses = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM warehouses ORDER BY name ASC');
    const warehouses = rows.map(r => ({
      id: r.id,
      name: r.name,
      location: r.location,
      capacity: r.capacity,
      currentLoad: r.current_load,
      managerName: r.manager_name,
      createdAt: r.created_at
    }));
    res.status(200).json({ success: true, warehouses });
  } catch (error) {
    next(error);
  }
};

const createWarehouse = async (req, res, next) => {
  const { name, location, capacity, managerName } = req.body;
  if (!name || !location || !capacity) {
    return res.status(400).json({ success: false, message: 'Please provide name, location, and capacity.' });
  }
  try {
    const pool = getMySQLPool();
    const id = uuidv4();
    await pool.query(
      'INSERT INTO warehouses (id, name, location, capacity, current_load, manager_name) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, location, parseFloat(capacity), 0.0, managerName || 'Warehouse Manager']
    );
    res.status(201).json({
      success: true,
      message: 'Warehouse successfully registered.',
      warehouse: { id, name, location, capacity: parseFloat(capacity), currentLoad: 0.0, managerName }
    });
  } catch (error) {
    next(error);
  }
};

const deleteWarehouse = async (req, res, next) => {
  const { id } = req.params;
  try {
    const pool = getMySQLPool();
    await pool.query('DELETE FROM warehouses WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Warehouse removed successfully.' });
  } catch (error) {
    next(error);
  }
};

// --- FLEET CONTROLLERS ---

const getFleet = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM fleet ORDER BY vehicle_number ASC');
    const fleet = rows.map(r => ({
      id: r.id,
      vehicleNumber: r.vehicle_number,
      vehicleType: r.vehicle_type,
      status: r.status,
      driverName: r.driver_name,
      capacity: r.capacity,
      currentRoute: r.current_route,
      createdAt: r.created_at
    }));
    res.status(200).json({ success: true, fleet });
  } catch (error) {
    next(error);
  }
};

const createFleet = async (req, res, next) => {
  const { vehicleNumber, vehicleType, driverName, capacity } = req.body;
  if (!vehicleNumber || !vehicleType || !driverName || !capacity) {
    return res.status(400).json({ success: false, message: 'Please provide all vehicle parameters.' });
  }
  try {
    const pool = getMySQLPool();
    const id = uuidv4();
    await pool.query(
      'INSERT INTO fleet (id, vehicle_number, vehicle_type, status, driver_name, capacity, current_route) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, vehicleNumber, vehicleType, 'Idle', driverName, parseFloat(capacity), 'Unassigned']
    );
    res.status(201).json({
      success: true,
      message: 'Vehicle registered in fleet.',
      vehicle: { id, vehicleNumber, vehicleType, status: 'Idle', driverName, capacity: parseFloat(capacity), currentRoute: 'Unassigned' }
    });
  } catch (error) {
    next(error);
  }
};

const updateFleet = async (req, res, next) => {
  const { id } = req.params;
  const { status, currentRoute } = req.body;
  try {
    const pool = getMySQLPool();
    await pool.query(
      'UPDATE fleet SET status = ?, current_route = ? WHERE id = ?',
      [status, currentRoute || 'Unassigned', id]
    );
    res.status(200).json({ success: true, message: 'Vehicle status updated.' });
  } catch (error) {
    next(error);
  }
};

const deleteFleet = async (req, res, next) => {
  const { id } = req.params;
  try {
    const pool = getMySQLPool();
    await pool.query('DELETE FROM fleet WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Vehicle deleted from fleet.' });
  } catch (error) {
    next(error);
  }
};

// --- RATES CONTROLLERS ---

const getRates = async (req, res, next) => {
  try {
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM rates');
    const rates = {};
    rows.forEach(r => { rates[r.rate_key] = r.rate_value; });
    res.status(200).json({ success: true, rates });
  } catch (error) {
    next(error);
  }
};

const updateRates = async (req, res, next) => {
  const { rates } = req.body;
  if (!rates || typeof rates !== 'object') {
    return res.status(400).json({ success: false, message: 'Invalid rates parameter.' });
  }
  try {
    const pool = getMySQLPool();
    for (const [key, value] of Object.entries(rates)) {
      const id = uuidv4();
      await pool.query(
        'INSERT INTO rates (id, rate_key, rate_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rate_value = ?',
        [id, key, parseFloat(value), parseFloat(value)]
      );
    }
    res.status(200).json({ success: true, message: 'Logistics tariff rates updated.' });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getWarehouses,
  createWarehouse,
  deleteWarehouse,
  getFleet,
  createFleet,
  updateFleet,
  deleteFleet,
  getRates,
  updateRates
};
