const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const UserMongo = require('../models/User.mongo');
const Shipment = require('../models/Shipment');
const Invoice = require('../models/Invoice');
const Notification = require('../models/Notification');
const PaymentMongo = require('../models/Payment.mongo');
const { getMySQLPool, checkMySQLActive } = require('../config/db.mysql');

const CITIES = ['Mumbai', 'Delhi', 'Bangalore', 'Chennai', 'Kolkata', 'Hyderabad', 'Pune', 'Ahmedabad', 'Jaipur', 'Surat'];
const SHIPMENT_TYPES = ['Standard', 'Express', 'Air', 'Ocean'];

const getFallbackDeliveryTime = (origin, destination, type, weight) => {
  const distMultiplier = Math.abs(origin.length - destination.length) + 3;
  let baseDays = distMultiplier * 0.8;
  if (type === 'Air') baseDays *= 0.3;
  else if (type === 'Express') baseDays *= 0.6;
  else if (type === 'Ocean') baseDays *= 1.8;
  return Math.max(1.0, Math.round((baseDays + weight * 0.005 + 0.5) * 10) / 10);
};

const runDatabaseSeeder = async () => {
  try {
    // 1. Seed/Fetch Users
    const demoUsers = [
      { name: 'System Admin', email: 'admin@shiptrack.com', password: 'Admin@123', role: 'admin', phone: '9876543210' },
      { name: 'Delivery Staff 1', email: 'staff1@shiptrack.com', password: 'Staff@123', role: 'staff', phone: '9876543211' },
      { name: 'John Customer', email: 'customer1@shiptrack.com', password: 'Customer@123', role: 'customer', phone: '9876543212' }
    ];

    let seededUsers = {};

    if (checkMySQLActive()) {
      const mysqlPool = getMySQLPool();
      const [rows] = await mysqlPool.query('SELECT * FROM users');
      
      if (rows.length === 0) {
        console.log('🌱 Seeding demo users to MySQL...');
        for (const user of demoUsers) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(user.password, salt);
          const id = uuidv4();
          await mysqlPool.query(
            'INSERT INTO users (id, name, email, password, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
            [id, user.name, user.email, hashedPassword, user.role, user.phone]
          );
          seededUsers[user.role] = { id, name: user.name, email: user.email };
        }
      } else {
        rows.forEach(r => {
          seededUsers[r.role] = { id: r.id, name: r.name, email: r.email };
        });
      }
    } else {
      const count = await UserMongo.countDocuments();
      if (count === 0) {
        console.log('🌱 Seeding demo users to MongoDB...');
        for (const user of demoUsers) {
          const salt = await bcrypt.genSalt(10);
          const hashedPassword = await bcrypt.hash(user.password, salt);
          const id = uuidv4();
          const doc = await UserMongo.create({
            _id: id,
            name: user.name,
            email: user.email,
            password: hashedPassword,
            role: user.role,
            phone: user.phone
          });
          seededUsers[user.role] = { id: doc._id.toString(), name: doc.name, email: doc.email };
        }
      } else {
        const mongoUsers = await UserMongo.find({});
        mongoUsers.forEach(mu => {
          seededUsers[mu.role] = { id: mu._id.toString(), name: mu.name, email: mu.email };
        });
      }
    }

    // 2. Check if we need to seed Shipments & Invoices
    const shipmentCount = await Shipment.countDocuments();
    if (shipmentCount > 0) {
      console.log('✔ Database already has shipment records. Skipping shipment seed.');
      return;
    }

    console.log('🌱 Seeding dummy shipments, payments, and invoices...');

    const customer = seededUsers['customer'];
    const staff = seededUsers['staff'];

    const mockShipments = [
      {
        recipientName: 'Aarav Sharma',
        recipientAddress: 'Flat 402, Green Glen Layout, Bangalore',
        originCity: 'Mumbai',
        destinationCity: 'Bangalore',
        weight: 12.5,
        dimensions: { length: 30, width: 20, height: 15 },
        shipmentType: 'Express',
        status: 'Delivered',
        paymentStatus: 'Paid'
      },
      {
        recipientName: 'Ishaan Patel',
        recipientAddress: 'Sector 15, Noida, Delhi NCR',
        originCity: 'Kolkata',
        destinationCity: 'Delhi',
        weight: 3.2,
        dimensions: { length: 15, width: 15, height: 10 },
        shipmentType: 'Air',
        status: 'Delivered',
        paymentStatus: 'Paid'
      },
      {
        recipientName: 'Diya Nair',
        recipientAddress: 'Road No 4, Jubilee Hills, Hyderabad',
        originCity: 'Chennai',
        destinationCity: 'Hyderabad',
        weight: 25.0,
        dimensions: { length: 50, width: 40, height: 30 },
        shipmentType: 'Standard',
        status: 'In Transit',
        paymentStatus: 'Paid',
        assignStaff: true
      },
      {
        recipientName: 'Kabir Mehta',
        recipientAddress: 'Model Town, Jalandhar, Punjab',
        originCity: 'Jaipur',
        destinationCity: 'Delhi',
        weight: 8.5,
        dimensions: { length: 25, width: 25, height: 20 },
        shipmentType: 'Express',
        status: 'Out for Delivery',
        paymentStatus: 'Paid',
        assignStaff: true
      },
      {
        recipientName: 'Ananya Gupta',
        recipientAddress: 'Link Road, Andheri West, Mumbai',
        originCity: 'Ahmedabad',
        destinationCity: 'Mumbai',
        weight: 1.5,
        dimensions: { length: 10, width: 10, height: 5 },
        shipmentType: 'Air',
        status: 'Booked',
        paymentStatus: 'Paid'
      },
      {
        recipientName: 'Rohan Deshmukh',
        recipientAddress: 'Senapati Bapat Road, Pune',
        originCity: 'Surat',
        destinationCity: 'Pune',
        weight: 45.0,
        dimensions: { length: 60, width: 50, height: 40 },
        shipmentType: 'Ocean',
        status: 'Pending Payment',
        paymentStatus: 'Pending'
      }
    ];

    for (let i = 0; i < mockShipments.length; i++) {
      const mock = mockShipments[i];
      const trackingId = `TRK-${Date.now().toString().slice(-6)}-${100 + i}`;
      const predictedDays = getFallbackDeliveryTime(mock.originCity, mock.destinationCity, mock.shipmentType, mock.weight);

      // Create history trail
      const history = [];
      if (mock.status === 'Pending Payment') {
        history.push({
          status: 'Pending Payment',
          location: mock.originCity,
          timestamp: new Date(Date.now() - 3600000),
          updatedBy: customer.name
        });
      } else {
        // Start history
        history.push({
          status: 'Pending Payment',
          location: mock.originCity,
          timestamp: new Date(Date.now() - 86400000 * 3),
          updatedBy: customer.name
        });
        history.push({
          status: 'Booked',
          location: mock.originCity,
          timestamp: new Date(Date.now() - 86400000 * 2.8),
          updatedBy: customer.name
        });

        if (mock.status === 'Picked up' || mock.status === 'In Transit' || mock.status === 'Out for Delivery' || mock.status === 'Delivered') {
          history.push({
            status: 'Picked up',
            location: mock.originCity + ' Warehouse',
            timestamp: new Date(Date.now() - 86400000 * 2),
            updatedBy: 'System'
          });
        }
        if (mock.status === 'In Transit' || mock.status === 'Out for Delivery' || mock.status === 'Delivered') {
          history.push({
            status: 'In Transit',
            location: 'National highway toll node',
            timestamp: new Date(Date.now() - 86400000 * 1),
            updatedBy: staff.name
          });
        }
        if (mock.status === 'Out for Delivery' || mock.status === 'Delivered') {
          history.push({
            status: 'Out for Delivery',
            location: mock.destinationCity + ' Hub',
            timestamp: new Date(Date.now() - 3600000 * 3),
            updatedBy: staff.name
          });
        }
        if (mock.status === 'Delivered') {
          history.push({
            status: 'Delivered',
            location: mock.recipientAddress,
            timestamp: new Date(Date.now() - 3600000 * 0.5),
            updatedBy: staff.name
          });
        }
      }

      const shipmentDoc = new Shipment({
        trackingId,
        senderId: customer.id,
        senderName: customer.name,
        recipientName: mock.recipientName,
        recipientAddress: mock.recipientAddress,
        originCity: mock.originCity,
        destinationCity: mock.destinationCity,
        weight: mock.weight,
        dimensions: mock.dimensions,
        shipmentType: mock.shipmentType,
        status: mock.status,
        estimatedDeliveryDays: predictedDays,
        paymentStatus: mock.paymentStatus,
        assignedStaffId: mock.assignStaff ? staff.id : null,
        assignedStaffName: mock.assignStaff ? staff.name : null,
        history
      });

      const savedShipment = await shipmentDoc.save();

      // Seed payment and invoice if paid
      if (mock.paymentStatus === 'Paid') {
        const orderId = `order_mock_${Date.now()}_${i}`;
        const paymentId = `pay_mock_${Date.now()}_${i}`;
        const amount = 150 + (mock.weight * 50);

        if (checkMySQLActive()) {
          const mysqlPool = getMySQLPool();
          await mysqlPool.query(
            'INSERT INTO payments (id, user_id, order_id, payment_id, status, amount) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), customer.id, orderId, paymentId, 'paid', amount]
          );
        } else {
          await PaymentMongo.create({
            userId: customer.id,
            orderId,
            paymentId,
            amount,
            status: 'paid'
          });
        }

        const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${100 + i}`;
        await Invoice.create({
          invoiceNumber,
          shipmentId: savedShipment.id,
          userId: customer.id,
          amount,
          paymentId,
          billingDetails: {
            name: customer.name,
            email: customer.email,
            phone: '9876543212',
            address: mock.recipientAddress
          }
        });
      }
    }

    // 3. Seed Logistics Data in MySQL (Optional / Fallback checks)
    if (checkMySQLActive()) {
      const mysqlPool = getMySQLPool();

      // Seed Warehouses
      const [warehouseRows] = await mysqlPool.query('SELECT COUNT(*) as count FROM warehouses');
      if (warehouseRows[0].count === 0) {
        console.log('🌱 Seeding demo warehouses to MySQL...');
        const mockWarehouses = [
          { name: 'Mumbai Central Cargo Hub', location: 'JNPT Port Area, Navi Mumbai', capacity: 50000.0, current_load: 12450.0, manager: 'Ramesh K.' },
          { name: 'Delhi NCR Fulfillment Center', location: 'Okhla Industrial Area Phase-III, New Delhi', capacity: 35000.0, current_load: 8320.0, manager: 'Sanjay Dutt' },
          { name: 'Bangalore Air Cargo Terminal', location: 'Devanahalli, near KIAL, Bangalore', capacity: 25000.0, current_load: 18200.0, manager: 'Anita Roy' }
        ];
        for (const w of mockWarehouses) {
          await mysqlPool.query(
            'INSERT INTO warehouses (id, name, location, capacity, current_load, manager_name) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), w.name, w.location, w.capacity, w.current_load, w.manager]
          );
        }
      }

      // Seed Fleet
      const [fleetRows] = await mysqlPool.query('SELECT COUNT(*) as count FROM fleet');
      if (fleetRows[0].count === 0) {
        console.log('🌱 Seeding demo fleet to MySQL...');
        const mockFleet = [
          { num: 'MH-03-TC-1234', type: 'Truck', status: 'In Transit', driver: 'Vikram Singh', cap: 12000.0, route: 'Mumbai → Bangalore' },
          { num: 'DL-01-AB-9876', type: 'Delivery Van', status: 'Idle', driver: 'Amit Verma', cap: 1500.0, route: 'Unassigned' },
          { num: 'KA-51-MM-5555', type: 'Truck', status: 'Maintenance', driver: 'Rajesh Gowda', cap: 8000.0, route: 'Unassigned' },
          { num: 'IN-CARGO-901', type: 'Cargo Plane', status: 'In Transit', driver: 'Capt. Sandeep Sen', cap: 85000.0, route: 'Delhi → Kolkata' }
        ];
        for (const f of mockFleet) {
          await mysqlPool.query(
            'INSERT INTO fleet (id, vehicle_number, vehicle_type, status, driver_name, capacity, current_route) VALUES (?, ?, ?, ?, ?, ?, ?)',
            [uuidv4(), f.num, f.type, f.status, f.driver, f.cap, f.route]
          );
        }
      }

      // Seed Rates
      const [ratesRows] = await mysqlPool.query('SELECT COUNT(*) as count FROM rates');
      if (ratesRows[0].count === 0) {
        console.log('🌱 Seeding demo rates to MySQL...');
        const mockRates = [
          { key: 'base_fare', value: 150.0, desc: 'Base charge for any new shipment booking' },
          { key: 'tax_rate', value: 18.0, desc: 'Service GST percentage applied on checkout' },
          { key: 'per_kg_fare', value: 50.0, desc: 'Additional charge per kilogram of shipment weight' },
          { key: 'express_multiplier', value: 1.5, desc: 'Price multiplier for Express delivery' },
          { key: 'air_multiplier', value: 2.5, desc: 'Price multiplier for Air shipping channels' },
          { key: 'ocean_multiplier', value: 0.8, desc: 'Price discount/multiplier for Ocean shipping channels' }
        ];
        for (const r of mockRates) {
          await mysqlPool.query(
            'INSERT INTO rates (id, rate_key, rate_value, description) VALUES (?, ?, ?, ?)',
            [uuidv4(), r.key, r.value, r.desc]
          );
        }
      }
    }

    console.log('✅ Dummy database seeding complete! 15+ mock shipments, invoices, and payment logs seeded.');
  } catch (err) {
    console.error('❌ Seeder error: ', err.message);
  }
};

module.exports = { runDatabaseSeeder };
