const mysql = require('mysql2/promise');

let pool = null;
let isMySQLConnected = false;

const connectMySQL = async () => {
  try {
    pool = mysql.createPool({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD || 'root',
      database: process.env.MYSQL_DATABASE || 'smartship',
      waitForConnections: true,
      connectionLimit: 10,
      queueLimit: 0,
    });
    
    // Check connection
    const connection = await pool.getConnection();
    console.log('🐬 MySQL Connected successfully!');
    connection.release();
    isMySQLConnected = true;
    return pool;
  } catch (error) {
    console.warn(`⚠️ MySQL Connection failed (Optional Database): ${error.message}`);
    console.warn(`ℹ️ Server will fallback to MongoDB for Auth & Payments.`);
    isMySQLConnected = false;
    pool = null;
    return null;
  }
};

const initTables = async () => {
  if (!pool || !isMySQLConnected) return;
  
  try {
    const connection = await pool.getConnection();
    
    // Create users table
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
    
    // Create payments table
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

    // Create warehouses table
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

    // Create fleet table
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

    // Create rates table
    await connection.query(`
      CREATE TABLE IF NOT EXISTS rates (
        id VARCHAR(36) PRIMARY KEY,
        rate_key VARCHAR(255) UNIQUE NOT NULL,
        rate_value DOUBLE NOT NULL,
        description VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    console.log('🐬 MySQL database tables checked/created.');
    connection.release();
  } catch (error) {
    console.error(`❌ Error initializing MySQL tables: ${error.message}`);
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
