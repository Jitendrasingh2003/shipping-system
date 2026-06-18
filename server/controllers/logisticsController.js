const { getMySQLPool, checkMySQLActive } = require('../config/db.mysql');
const { v4: uuidv4 } = require('uuid');

// In-memory fallbacks when MySQL is down
let fallbackWarehouses = [
  { id: 'wh-1', name: 'Mumbai Central Cargo Hub (Mock)', location: 'JNPT Port Area, Navi Mumbai', capacity: 50000.0, currentLoad: 12450.0, managerName: 'Ramesh K.' },
  { id: 'wh-2', name: 'Delhi NCR Fulfillment Center (Mock)', location: 'Okhla Industrial Area Phase-III, New Delhi', capacity: 35000.0, currentLoad: 8320.0, managerName: 'Sanjay Dutt' },
  { id: 'wh-3', name: 'Bangalore Air Cargo Terminal (Mock)', location: 'Devanahalli, near KIAL, Bangalore', capacity: 25000.0, currentLoad: 18200.0, managerName: 'Anita Roy' }
];

let fallbackFleet = [
  { id: 'fl-1', vehicleNumber: 'MH-03-TC-1234', vehicleType: 'Truck', status: 'In Transit', driverName: 'Vikram Singh', capacity: 12000.0, currentRoute: 'Mumbai → Bangalore' },
  { id: 'fl-2', vehicleNumber: 'DL-01-AB-9876', vehicleType: 'Delivery Van', status: 'Idle', driverName: 'Amit Verma', capacity: 1500.0, currentRoute: 'Unassigned' },
  { id: 'fl-3', vehicleNumber: 'KA-51-MM-5555', vehicleType: 'Truck', status: 'Maintenance', driverName: 'Rajesh Gowda', capacity: 8000.0, currentRoute: 'Unassigned' },
  { id: 'fl-4', vehicleNumber: 'IN-CARGO-901', vehicleType: 'Cargo Plane', status: 'In Transit', driverName: 'Capt. Sandeep Sen', capacity: 85000.0, currentRoute: 'Delhi → Kolkata' }
];

let fallbackRates = {
  base_fare: 150.0,
  tax_rate: 18.0,
  per_kg_fare: 50.0,
  express_multiplier: 1.5,
  air_multiplier: 2.5,
  ocean_multiplier: 0.8
};

// --- WAREHOUSE CONTROLLERS ---

const getWarehouses = async (req, res, next) => {
  try {
    if (!checkMySQLActive() || !getMySQLPool()) {
      // Return local memory data if MySQL is not available
      return res.status(200).json({ success: true, warehouses: fallbackWarehouses, isMock: true });
    }
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
    if (!checkMySQLActive() || !getMySQLPool()) {
      const id = uuidv4();
      const newWh = { id, name, location, capacity: parseFloat(capacity), currentLoad: 0.0, managerName: managerName || 'Warehouse Manager' };
      fallbackWarehouses.push(newWh);
      return res.status(201).json({
        success: true,
        message: 'Warehouse registered in-memory (MySQL connection inactive).',
        warehouse: newWh
      });
    }

    const id = uuidv4();
    const pool = getMySQLPool();
    await pool.query(
      'INSERT INTO warehouses (id, name, location, capacity, current_load, manager_name) VALUES (?, ?, ?, ?, ?, ?)',
      [id, name, location, parseFloat(capacity), 0.0, managerName || 'Warehouse Manager']
    );

    res.status(201).json({
      success: true,
      message: 'Warehouse successfully registered in MySQL.',
      warehouse: { id, name, location, capacity: parseFloat(capacity), currentLoad: 0.0, managerName }
    });
  } catch (error) {
    next(error);
  }
};

const deleteWarehouse = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!checkMySQLActive() || !getMySQLPool()) {
      fallbackWarehouses = fallbackWarehouses.filter(w => w.id !== id);
      return res.status(200).json({ success: true, message: 'Warehouse removed from in-memory registry.' });
    }

    const pool = getMySQLPool();
    await pool.query('DELETE FROM warehouses WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Warehouse removed successfully from MySQL.' });
  } catch (error) {
    next(error);
  }
};

// --- FLEET CONTROLLERS ---

const getFleet = async (req, res, next) => {
  try {
    if (!checkMySQLActive() || !getMySQLPool()) {
      return res.status(200).json({ success: true, fleet: fallbackFleet, isMock: true });
    }
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
    if (!checkMySQLActive() || !getMySQLPool()) {
      const id = uuidv4();
      const newVehicle = { id, vehicleNumber, vehicleType, status: 'Idle', driverName, capacity: parseFloat(capacity), currentRoute: 'Unassigned' };
      fallbackFleet.push(newVehicle);
      return res.status(201).json({
        success: true,
        message: 'Vehicle registered in-memory (MySQL connection inactive).',
        vehicle: newVehicle
      });
    }

    const id = uuidv4();
    const pool = getMySQLPool();
    await pool.query(
      'INSERT INTO fleet (id, vehicle_number, vehicle_type, status, driver_name, capacity, current_route) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [id, vehicleNumber, vehicleType, 'Idle', driverName, parseFloat(capacity), 'Unassigned']
    );

    res.status(201).json({
      success: true,
      message: 'Vehicle registered in MySQL fleet registry.',
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
    if (!checkMySQLActive() || !getMySQLPool()) {
      const vehicle = fallbackFleet.find(f => f.id === id);
      if (vehicle) {
        vehicle.status = status;
        vehicle.currentRoute = currentRoute || 'Unassigned';
      }
      return res.status(200).json({ success: true, message: 'Vehicle status updated in-memory.' });
    }

    const pool = getMySQLPool();
    await pool.query(
      'UPDATE fleet SET status = ?, current_route = ? WHERE id = ?',
      [status, currentRoute || 'Unassigned', id]
    );

    res.status(200).json({ success: true, message: 'Vehicle registry status updated in MySQL.' });
  } catch (error) {
    next(error);
  }
};

const deleteFleet = async (req, res, next) => {
  const { id } = req.params;

  try {
    if (!checkMySQLActive() || !getMySQLPool()) {
      fallbackFleet = fallbackFleet.filter(f => f.id !== id);
      return res.status(200).json({ success: true, message: 'Vehicle deleted from in-memory registry.' });
    }

    const pool = getMySQLPool();
    await pool.query('DELETE FROM fleet WHERE id = ?', [id]);
    res.status(200).json({ success: true, message: 'Vehicle deleted from MySQL fleet registry.' });
  } catch (error) {
    next(error);
  }
};

// --- RATES CONTROLLERS ---

const getRates = async (req, res, next) => {
  try {
    if (!checkMySQLActive() || !getMySQLPool()) {
      return res.status(200).json({ success: true, rates: fallbackRates, isMock: true });
    }
    const pool = getMySQLPool();
    const [rows] = await pool.query('SELECT * FROM rates');
    
    const rates = {};
    rows.forEach(r => {
      rates[r.rate_key] = r.rate_value;
    });

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
    if (!checkMySQLActive() || !getMySQLPool()) {
      Object.assign(fallbackRates, rates);
      return res.status(200).json({ success: true, message: 'Logistics tariff rates updated in-memory.' });
    }

    const pool = getMySQLPool();
    for (const [key, value] of Object.entries(rates)) {
      const id = uuidv4();
      await pool.query(
        'INSERT INTO rates (id, rate_key, rate_value) VALUES (?, ?, ?) ON DUPLICATE KEY UPDATE rate_value = ?',
        [id, key, parseFloat(value), parseFloat(value)]
      );
    }

    res.status(200).json({ success: true, message: 'Logistics tariff rates updated in MySQL.' });
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
