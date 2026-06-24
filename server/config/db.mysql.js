const mysql = require('mysql2/promise');

let pool = null;
let isMySQLConnected = false;

const connectMySQL = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD !== undefined ? process.env.MYSQL_PASSWORD : 'root',
      database: process.env.MYSQL_DATABASE || 'smartship',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });

    const connection = await pool.getConnection();
    console.log('🐬 MySQL Connected successfully!');
    connection.release();
    isMySQLConnected = true;
    return pool;
  } catch (error) {
    console.error(`❌ MySQL Connection FAILED: ${error.message}`);
    isMySQLConnected = false;
    pool = null;
    throw error; // Fatal — server will not start without MySQL
  }
};

const initTables = async () => {
  if (!pool || !isMySQLConnected) return;

  try {
    const connection = await pool.getConnection();

    // USERS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) NOT NULL UNIQUE,
        password VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'customer',
        phone VARCHAR(50) DEFAULT '',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // PAYMENTS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS payments (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        order_id VARCHAR(255) NOT NULL,
        payment_id VARCHAR(255) DEFAULT NULL,
        signature VARCHAR(255) DEFAULT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        currency VARCHAR(10) DEFAULT 'INR',
        status VARCHAR(50) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // WAREHOUSES
    await connection.query(`
      CREATE TABLE IF NOT EXISTS warehouses (
        id VARCHAR(36) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        location VARCHAR(255) NOT NULL,
        capacity DOUBLE NOT NULL,
        current_load DOUBLE DEFAULT 0.0,
        manager_name VARCHAR(255) DEFAULT 'Warehouse Manager',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // FLEET
    await connection.query(`
      CREATE TABLE IF NOT EXISTS fleet (
        id VARCHAR(36) PRIMARY KEY,
        vehicle_number VARCHAR(50) UNIQUE NOT NULL,
        vehicle_type VARCHAR(50) NOT NULL,
        status VARCHAR(50) DEFAULT 'Idle',
        driver_name VARCHAR(255) NOT NULL,
        capacity DOUBLE NOT NULL,
        current_route VARCHAR(255) DEFAULT 'Unassigned',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // RATES
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rates (
        id VARCHAR(36) PRIMARY KEY,
        rate_key VARCHAR(255) UNIQUE NOT NULL,
        rate_value DOUBLE NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // SHIPMENTS (history stored as JSON text)
    await connection.query(`
      CREATE TABLE IF NOT EXISTS shipments (
        id VARCHAR(36) PRIMARY KEY,
        tracking_id VARCHAR(100) NOT NULL UNIQUE,
        sender_id VARCHAR(36) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        recipient_name VARCHAR(255) NOT NULL,
        recipient_address TEXT NOT NULL,
        origin_city VARCHAR(255) NOT NULL,
        destination_city VARCHAR(255) NOT NULL,
        weight DOUBLE NOT NULL,
        dim_length DOUBLE NOT NULL DEFAULT 0,
        dim_width DOUBLE NOT NULL DEFAULT 0,
        dim_height DOUBLE NOT NULL DEFAULT 0,
        shipment_type VARCHAR(50) DEFAULT 'Standard',
        status VARCHAR(100) DEFAULT 'Pending Payment',
        assigned_staff_id VARCHAR(36) DEFAULT NULL,
        assigned_staff_name VARCHAR(255) DEFAULT NULL,
        estimated_delivery_days DOUBLE DEFAULT NULL,
        payment_status VARCHAR(50) DEFAULT 'Pending',
        payment_id VARCHAR(255) DEFAULT NULL,
        history JSON DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      )
    `);

    // INVOICES
    await connection.query(`
      CREATE TABLE IF NOT EXISTS invoices (
        id VARCHAR(36) PRIMARY KEY,
        invoice_number VARCHAR(100) NOT NULL UNIQUE,
        shipment_id VARCHAR(36) NOT NULL,
        user_id VARCHAR(36) NOT NULL,
        amount DECIMAL(10, 2) NOT NULL,
        payment_id VARCHAR(255) NOT NULL,
        billing_name VARCHAR(255) DEFAULT '',
        billing_email VARCHAR(255) DEFAULT '',
        billing_phone VARCHAR(50) DEFAULT '',
        billing_address TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // NOTIFICATIONS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS notifications (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        type VARCHAR(100) DEFAULT 'general',
        is_read TINYINT(1) DEFAULT 0,
        shipment_id VARCHAR(36) DEFAULT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // ADDRESSES
    await connection.query(`
      CREATE TABLE IF NOT EXISTS addresses (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        name VARCHAR(255) NOT NULL,
        phone VARCHAR(50) NOT NULL,
        address TEXT NOT NULL,
        city VARCHAR(255) NOT NULL,
        pincode VARCHAR(20) NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // TICKETS
    await connection.query(`
      CREATE TABLE IF NOT EXISTS tickets (
        id VARCHAR(36) PRIMARY KEY,
        user_id VARCHAR(36) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        category VARCHAR(100) DEFAULT 'General',
        title VARCHAR(255) NOT NULL,
        message TEXT NOT NULL,
        status VARCHAR(50) DEFAULT 'open',
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // CHAT MESSAGES
    await connection.query(`
      CREATE TABLE IF NOT EXISTS chat_messages (
        id VARCHAR(36) PRIMARY KEY,
        room_id VARCHAR(100) NOT NULL,
        sender_id VARCHAR(100) NOT NULL,
        sender_name VARCHAR(255) NOT NULL,
        sender_role VARCHAR(50) NOT NULL,
        message TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);

    // Ensure signature column exists in shipments table
    try {
      await connection.query('ALTER TABLE shipments ADD COLUMN signature LONGTEXT DEFAULT NULL');
      console.log('📝 MySQL: Added signature column to shipments table.');
    } catch (err) {
      if (err.errno !== 1060) {
        console.error('❌ Failed to alter shipments table:', err.message);
      }
    }

    // Ensure sender_phone column exists in shipments table
    try {
      await connection.query('ALTER TABLE shipments ADD COLUMN sender_phone VARCHAR(50) DEFAULT NULL');
      console.log('📝 MySQL: Added sender_phone column to shipments table.');
    } catch (err) {
      if (err.errno !== 1060) {
        console.error('❌ Failed to alter shipments table for sender_phone:', err.message);
      }
    }

    // Ensure item_description column exists in shipments table
    try {
      await connection.query('ALTER TABLE shipments ADD COLUMN item_description TEXT DEFAULT NULL');
      console.log('📝 MySQL: Added item_description column to shipments table.');
    } catch (err) {
      if (err.errno !== 1060) {
        console.error('❌ Failed to alter shipments table for item_description:', err.message);
      }
    }

    // Ensure is_metal column exists in shipments table
    try {
      await connection.query('ALTER TABLE shipments ADD COLUMN is_metal TINYINT(1) DEFAULT 0');
      console.log('📝 MySQL: Added is_metal column to shipments table.');
    } catch (err) {
      if (err.errno !== 1060) {
        console.error('❌ Failed to alter shipments table for is_metal:', err.message);
      }
    }

    // Ensure origin_country column exists in shipments table
    try {
      await connection.query('ALTER TABLE shipments ADD COLUMN origin_country VARCHAR(255) DEFAULT "India"');
      console.log('📝 MySQL: Added origin_country column to shipments table.');
    } catch (err) {
      if (err.errno !== 1060) {
        console.error('❌ Failed to alter shipments table for origin_country:', err.message);
      }
    }

    // Ensure destination_country column exists in shipments table
    try {
      await connection.query('ALTER TABLE shipments ADD COLUMN destination_country VARCHAR(255) DEFAULT "India"');
      console.log('📝 MySQL: Added destination_country column to shipments table.');
    } catch (err) {
      if (err.errno !== 1060) {
        console.error('❌ Failed to alter shipments table for destination_country:', err.message);
      }
    }

    // Ensure govt_id_proof column exists in shipments table
    try {
      await connection.query('ALTER TABLE shipments ADD COLUMN govt_id_proof VARCHAR(255) DEFAULT NULL');
      console.log('📝 MySQL: Added govt_id_proof column to shipments table.');
    } catch (err) {
      if (err.errno !== 1060) {
      }
    }

    // Ensure screenshot column exists in tickets table
    try {
      await connection.query('ALTER TABLE tickets ADD COLUMN screenshot LONGTEXT DEFAULT NULL');
      console.log('📝 MySQL: Added screenshot column to tickets table.');
    } catch (err) {
      if (err.errno !== 1060) {
        console.error('❌ Failed to alter tickets table for screenshot:', err.message);
      }
    }

    // Ensure sender_role column exists in tickets table
    try {
      await connection.query("ALTER TABLE tickets ADD COLUMN sender_role VARCHAR(50) DEFAULT 'customer'");
      console.log('📝 MySQL: Added sender_role column to tickets table.');
    } catch (err) {
      if (err.errno !== 1060) {
        console.error('❌ Failed to alter tickets table for sender_role:', err.message);
      }
    }

    console.log('🐬 MySQL: All tables checked/created successfully.');
    connection.release();
  } catch (error) {
    console.error(`❌ Error initializing MySQL tables: ${error.message}`);
    throw error;
  }
};

const getMySQLPool = () => pool;
const checkMySQLActive = () => isMySQLConnected;

module.exports = {
  connectMySQL,
  initTables,
  getMySQLPool,
  checkMySQLActive
};
