const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');
const { getMySQLPool } = require('../config/db.mysql');

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
    const pool = getMySQLPool();

    // ── 1. Seed Users ───────────────────────────────────────────
    const [existingUsers] = await pool.query('SELECT COUNT(*) AS count FROM users');
    let seededUsers = {};

    if (existingUsers[0].count === 0) {
      console.log('🌱 Seeding demo users to MySQL...');
      const demoUsers = [
        { name: 'System Admin',     email: 'admin@shiptrack.com',    password: 'Admin@123',    role: 'admin',    phone: '9876543210' },
        { name: 'Delivery Staff 1', email: 'staff1@shiptrack.com',   password: 'Staff@123',    role: 'staff',    phone: '9876543211' },
        { name: 'John Customer',    email: 'customer1@shiptrack.com', password: 'Customer@123', role: 'customer', phone: '9876543212' }
      ];
      for (const user of demoUsers) {
        const id = uuidv4();
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(user.password, salt);
        await pool.query(
          'INSERT INTO users (id, name, email, password, role, phone) VALUES (?, ?, ?, ?, ?, ?)',
          [id, user.name, user.email, hashedPassword, user.role, user.phone]
        );
        seededUsers[user.role] = { id, name: user.name, email: user.email };
      }
    } else {
      const [rows] = await pool.query('SELECT id, name, email, role FROM users');
      rows.forEach(r => { seededUsers[r.role] = { id: r.id, name: r.name, email: r.email }; });
    }

    // ── 2. Seed Shipments, Invoices, Notifications ───────────────
    const [[{ count: shipmentCount }]] = await pool.query('SELECT COUNT(*) AS count FROM shipments');
    if (shipmentCount > 0) {
      console.log('✔ Database already has shipment records. Skipping shipment seed.');
    } else {
      console.log('🌱 Seeding dummy shipments, payments, and invoices...');
      const customer = seededUsers['customer'];
      const staff = seededUsers['staff'];

      const mockShipments = [
        {
          recipientName: 'Aarav Sharma',
          recipientAddress: 'Flat 402, Green Glen Layout, Bangalore',
          originCity: 'Mumbai', destinationCity: 'Bangalore',
          weight: 12.5, dims: [30, 20, 15], shipmentType: 'Express',
          status: 'Delivered', paymentStatus: 'Paid', assignStaff: true
        },
        {
          recipientName: 'Ishaan Patel',
          recipientAddress: 'Sector 15, Noida, Delhi NCR',
          originCity: 'Kolkata', destinationCity: 'Delhi',
          weight: 3.2, dims: [15, 15, 10], shipmentType: 'Air',
          status: 'Delivered', paymentStatus: 'Paid', assignStaff: true
        },
        {
          recipientName: 'Diya Nair',
          recipientAddress: 'Road No 4, Jubilee Hills, Hyderabad',
          originCity: 'Chennai', destinationCity: 'Hyderabad',
          weight: 25.0, dims: [50, 40, 30], shipmentType: 'Standard',
          status: 'In Transit', paymentStatus: 'Paid', assignStaff: true
        },
        {
          recipientName: 'Kabir Mehta',
          recipientAddress: 'Model Town, Jalandhar, Punjab',
          originCity: 'Jaipur', destinationCity: 'Delhi',
          weight: 8.5, dims: [25, 25, 20], shipmentType: 'Express',
          status: 'Out for Delivery', paymentStatus: 'Paid', assignStaff: true
        },
        {
          recipientName: 'Ananya Gupta',
          recipientAddress: 'Link Road, Andheri West, Mumbai',
          originCity: 'Ahmedabad', destinationCity: 'Mumbai',
          weight: 1.5, dims: [10, 10, 5], shipmentType: 'Air',
          status: 'Booked', paymentStatus: 'Paid', assignStaff: false
        },
        {
          recipientName: 'Rohan Deshmukh',
          recipientAddress: 'Senapati Bapat Road, Pune',
          originCity: 'Surat', destinationCity: 'Pune',
          weight: 45.0, dims: [60, 50, 40], shipmentType: 'Ocean',
          status: 'Pending Payment', paymentStatus: 'Pending', assignStaff: false
        },
        {
          recipientName: 'Priya Verma',
          recipientAddress: 'Gomti Nagar, Lucknow',
          originCity: 'Delhi', destinationCity: 'Lucknow',
          weight: 5.0, dims: [20, 20, 15], shipmentType: 'Standard',
          status: 'Picked up', paymentStatus: 'Paid', assignStaff: true
        },
        {
          recipientName: 'Arjun Khanna',
          recipientAddress: 'Marine Lines, Mumbai',
          originCity: 'Pune', destinationCity: 'Mumbai',
          weight: 2.0, dims: [12, 10, 8], shipmentType: 'Express',
          status: 'Delivered', paymentStatus: 'Paid', assignStaff: true
        }
      ];

      for (let i = 0; i < mockShipments.length; i++) {
        const mock = mockShipments[i];
        const shipmentId = uuidv4();
        const trackingId = `TRK-${Date.now().toString().slice(-6)}-${100 + i}`;
        const estDays = getFallbackDeliveryTime(mock.originCity, mock.destinationCity, mock.shipmentType, mock.weight);

        // Build history trail
        const history = [];
        const baseTime = Date.now() - 86400000 * 3;
        history.push({ status: 'Pending Payment', location: mock.originCity, timestamp: new Date(baseTime), updatedBy: customer.name });

        if (mock.status !== 'Pending Payment') {
          history.push({ status: 'Booked', location: mock.originCity, timestamp: new Date(baseTime + 3600000 * 2), updatedBy: customer.name });
        }
        if (['Picked up', 'In Transit', 'Out for Delivery', 'Delivered'].includes(mock.status)) {
          history.push({ status: 'Picked up', location: mock.originCity + ' Warehouse', timestamp: new Date(baseTime + 86400000), updatedBy: 'System' });
        }
        if (['In Transit', 'Out for Delivery', 'Delivered'].includes(mock.status)) {
          history.push({ status: 'In Transit', location: 'National Highway Transit Hub', timestamp: new Date(baseTime + 86400000 * 2), updatedBy: staff ? staff.name : 'Staff' });
        }
        if (['Out for Delivery', 'Delivered'].includes(mock.status)) {
          history.push({ status: 'Out for Delivery', location: mock.destinationCity + ' Hub', timestamp: new Date(baseTime + 86400000 * 2.5), updatedBy: staff ? staff.name : 'Staff' });
        }
        if (mock.status === 'Delivered') {
          history.push({ status: 'Delivered', location: mock.recipientAddress, timestamp: new Date(baseTime + 86400000 * 3), updatedBy: staff ? staff.name : 'Staff' });
        }

        await pool.query(
          `INSERT INTO shipments 
            (id, tracking_id, sender_id, sender_name, recipient_name, recipient_address, origin_city, destination_city,
             weight, dim_length, dim_width, dim_height, shipment_type, status, payment_status,
             assigned_staff_id, assigned_staff_name, estimated_delivery_days, history)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            shipmentId, trackingId, customer.id, customer.name,
            mock.recipientName, mock.recipientAddress, mock.originCity, mock.destinationCity,
            mock.weight, mock.dims[0], mock.dims[1], mock.dims[2],
            mock.shipmentType, mock.status, mock.paymentStatus,
            mock.assignStaff && staff ? staff.id : null,
            mock.assignStaff && staff ? staff.name : null,
            estDays,
            JSON.stringify(history)
          ]
        );

        // Seed payment & invoice for paid shipments
        if (mock.paymentStatus === 'Paid') {
          const orderId = `order_mock_${Date.now()}_${i}`;
          const paymentId = `pay_mock_${Date.now()}_${i}`;
          const amount = parseFloat((150 + (mock.weight * 50) * 1.18).toFixed(2));

          await pool.query(
            'INSERT INTO payments (id, user_id, order_id, payment_id, status, amount) VALUES (?, ?, ?, ?, ?, ?)',
            [uuidv4(), customer.id, orderId, paymentId, 'paid', amount]
          );

          const invoiceNumber = `INV-${Date.now().toString().slice(-6)}-${100 + i}`;
          await pool.query(
            `INSERT INTO invoices (id, invoice_number, shipment_id, user_id, amount, payment_id, billing_name, billing_email, billing_phone, billing_address)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [uuidv4(), invoiceNumber, shipmentId, customer.id, amount, paymentId,
             customer.name, customer.email, '9876543212', mock.recipientAddress]
          );
        }

        // Seed a notification for each shipment
        await pool.query(
          'INSERT INTO notifications (id, user_id, title, message, type, shipment_id) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), customer.id, `Shipment ${trackingId} Update`,
           `Your shipment ${trackingId} is currently: ${mock.status}`,
           'status_update', shipmentId]
        );
      }
    }

    // ── 3. Seed Warehouses ─────────────────────────────────────
    const [[{ count: whCount }]] = await pool.query('SELECT COUNT(*) AS count FROM warehouses');
    if (whCount === 0) {
      console.log('🌱 Seeding demo warehouses...');
      const warehouses = [
        { name: 'Mumbai Central Cargo Hub',       location: 'JNPT Port Area, Navi Mumbai',            cap: 50000, load: 12450, mgr: 'Ramesh K.' },
        { name: 'Delhi NCR Fulfillment Center',   location: 'Okhla Industrial Area Phase-III, New Delhi', cap: 35000, load: 8320,  mgr: 'Sanjay Dutt' },
        { name: 'Bangalore Air Cargo Terminal',   location: 'Devanahalli, near KIAL, Bangalore',       cap: 25000, load: 18200, mgr: 'Anita Roy' },
        { name: 'Chennai Port Cargo Facility',    location: 'Ennore Port Complex, Chennai',            cap: 40000, load: 9500,  mgr: 'Suresh Rajan' },
        { name: 'Hyderabad Express Hub',          location: 'Patancheru Industrial Area, Hyderabad',   cap: 20000, load: 7200,  mgr: 'Kavita Sharma' }
      ];
      for (const w of warehouses) {
        await pool.query(
          'INSERT INTO warehouses (id, name, location, capacity, current_load, manager_name) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), w.name, w.location, w.cap, w.load, w.mgr]
        );
      }
    }

    // ── 4. Seed Fleet ─────────────────────────────────────────
    const [[{ count: fleetCount }]] = await pool.query('SELECT COUNT(*) AS count FROM fleet');
    if (fleetCount === 0) {
      console.log('🌱 Seeding demo fleet...');
      const fleet = [
        { num: 'MH-03-TC-1234', type: 'Truck',             status: 'In Transit',  driver: 'Vikram Singh',      cap: 12000, route: 'Mumbai to Bangalore' },
        { num: 'DL-01-AB-9876', type: 'Delivery Van',      status: 'Idle',        driver: 'Amit Verma',        cap: 1500,  route: 'Unassigned' },
        { num: 'KA-51-MM-5555', type: 'Truck',             status: 'Maintenance', driver: 'Rajesh Gowda',      cap: 8000,  route: 'Unassigned' },
        { num: 'IN-CARGO-901',  type: 'Cargo Plane',       status: 'In Transit',  driver: 'Capt. Sandeep Sen',  cap: 85000, route: 'Delhi to Kolkata' },
        { num: 'TN-22-XY-4321', type: 'Delivery Van',      status: 'Idle',        driver: 'Pradeep Nair',      cap: 2000,  route: 'Unassigned' },
        { num: 'GJ-05-BZ-7890', type: 'Truck',             status: 'Idle',        driver: 'Haresh Patel',      cap: 15000, route: 'Unassigned' },
        { num: 'AI-BOE-787',    type: 'Cargo Plane',       status: 'Idle',        driver: 'Capt. Raj Kapoor',   cap: 102000, route: 'Mumbai to New York' },
        { num: 'AI-AIR-330',    type: 'Cargo Plane',       status: 'In Transit',  driver: 'Capt. Anita Sharma',  cap: 70000, route: 'Delhi to London' },
        { num: 'MV-BH-01',      type: 'Container Vessel',   status: 'In Transit',  driver: 'Capt. Rahul Verma',   cap: 120000, route: 'Mumbai Port to Dubai Jebel Ali' },
        { num: 'MV-AC-02',      type: 'Container Vessel',   status: 'In Transit',  driver: 'Capt. Priya Singh',   cap: 98000, route: 'Chennai Port to Singapore Terminal' },
        { num: 'MV-PS-03',      type: 'Container Vessel',   status: 'Idle',        driver: 'Capt. Arjun Nair',    cap: 150000, route: 'Kochi Port to Rotterdam Terminal' },
        { num: 'MV-EC-04',      type: 'Container Vessel',   status: 'Maintenance', driver: 'Capt. Meera Devi',    cap: 85000, route: 'Unassigned' }
      ];
      for (const f of fleet) {
        await pool.query(
          'INSERT INTO fleet (id, vehicle_number, vehicle_type, status, driver_name, capacity, current_route) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), f.num, f.type, f.status, f.driver, f.cap, f.route]
        );
      }
    }

    // ── 5. Seed Rates ─────────────────────────────────────────
    const [[{ count: ratesCount }]] = await pool.query('SELECT COUNT(*) AS count FROM rates');
    if (ratesCount === 0) {
      console.log('🌱 Seeding demo rates...');
      const ratesData = [
        { key: 'base_fare',           value: 150.0, desc: 'Base charge for any new shipment booking' },
        { key: 'tax_rate',            value: 18.0,  desc: 'Service GST percentage applied on checkout' },
        { key: 'per_kg_fare',         value: 50.0,  desc: 'Additional charge per kilogram of shipment weight' },
        { key: 'express_multiplier',  value: 1.5,   desc: 'Price multiplier for Express delivery' },
        { key: 'air_multiplier',      value: 2.5,   desc: 'Price multiplier for Air shipping channels' },
        { key: 'ocean_multiplier',    value: 0.8,   desc: 'Price discount/multiplier for Ocean shipping channels' }
      ];
      for (const r of ratesData) {
        await pool.query(
          'INSERT INTO rates (id, rate_key, rate_value, description) VALUES (?, ?, ?, ?)',
          [uuidv4(), r.key, r.value, r.desc]
        );
      }
    }

    // ── 6. Seed Saved Addresses for Customer ─────────────────
    const [[{ count: addrCount }]] = await pool.query('SELECT COUNT(*) AS count FROM addresses');
    if (addrCount === 0 && seededUsers['customer']) {
      console.log('🌱 Seeding demo saved addresses...');
      const customerId = seededUsers['customer'].id;
      const addresses = [
        { name: 'Home',   phone: '9876543212', address: '12A, Sector 21, Dwarka, New Delhi', city: 'Delhi',     pincode: '110075' },
        { name: 'Office', phone: '9876543299', address: 'Tower B, Cybercity, DLF Phase-2, Gurugram', city: 'Gurugram', pincode: '122002' }
      ];
      for (const a of addresses) {
        await pool.query(
          'INSERT INTO addresses (id, user_id, name, phone, address, city, pincode) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), customerId, a.name, a.phone, a.address, a.city, a.pincode]
        );
      }
    }

    // ── 7. Seed Support Tickets ──────────────────────────────
    const [[{ count: ticketCount }]] = await pool.query('SELECT COUNT(*) AS count FROM tickets');
    if (ticketCount === 0 && seededUsers['customer']) {
      console.log('🌱 Seeding demo support tickets...');
      const customerId = seededUsers['customer'].id;
      const customerName = seededUsers['customer'].name;
      const tickets = [
        { title: 'Package delayed by 2 days',   message: 'My shipment was supposed to arrive yesterday but still no update.',         category: 'Delay',          status: 'open' },
        { title: 'Invoice amount incorrect',     message: 'I was charged extra for the standard shipping. Please look into this.',    category: 'Billing',        status: 'resolved' },
        { title: 'Package arrived with damage',  message: 'The outer box of my shipment was crushed. Some items inside are broken.', category: 'Damage package', status: 'open' }
      ];
      for (const t of tickets) {
        await pool.query(
          'INSERT INTO tickets (id, user_id, sender_name, category, title, message, status) VALUES (?, ?, ?, ?, ?, ?, ?)',
          [uuidv4(), customerId, customerName, t.category, t.title, t.message, t.status]
        );
      }
    }

    // ── 8. Seed Demo Chat Messages ───────────────────────────
    const [[{ count: chatCount }]] = await pool.query('SELECT COUNT(*) AS count FROM chat_messages');
    if (chatCount === 0 && seededUsers['customer']) {
      console.log('🌱 Seeding demo chat messages...');
      const customer = seededUsers['customer'];
      const admin = seededUsers['admin'];
      const roomId = customer.id;
      const chatMessages = [
        { senderId: customer.id,  senderName: customer.name, role: 'customer', msg: 'Hello, I need help tracking my shipment TRK-001.' },
        { senderId: admin ? admin.id : 'ai-assistant', senderName: 'Marine Bytes AI Assistant', role: 'staff', msg: 'Hi! I can help you. Please share the tracking ID and I will look it up.' },
        { senderId: customer.id,  senderName: customer.name, role: 'customer', msg: 'The tracking ID is TRK-563-100.' },
        { senderId: admin ? admin.id : 'ai-assistant', senderName: 'Marine Bytes AI Assistant', role: 'staff', msg: 'Your shipment TRK-563-100 is currently In Transit. Estimated delivery is tomorrow.' }
      ];
      for (let i = 0; i < chatMessages.length; i++) {
        const cm = chatMessages[i];
        await pool.query(
          'INSERT INTO chat_messages (id, room_id, sender_id, sender_name, sender_role, message) VALUES (?, ?, ?, ?, ?, ?)',
          [uuidv4(), roomId, cm.senderId, cm.senderName, cm.role, cm.msg]
        );
      }
    }

    console.log('✅ MySQL seeding complete! All demo data loaded successfully.');
  } catch (err) {
    console.error('❌ Seeder error:', err.message);
  }
};

module.exports = { runDatabaseSeeder };
