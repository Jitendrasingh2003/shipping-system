require('dotenv').config();
const mysql = require('mysql2/promise');

const checkDatabase = async () => {
  console.log('==================================================');
  console.log('🐬 Marine Bytes - MySQL Database Inspector');
  console.log('==================================================');
  console.log(`Connecting to: ${process.env.MYSQL_HOST || 'localhost'}:${process.env.MYSQL_PORT || 3306} (${process.env.MYSQL_DATABASE || 'smartship'})\n`);

  let connection;
  try {
    connection = await mysql.createConnection({
      host: process.env.MYSQL_HOST || 'localhost',
      port: process.env.MYSQL_PORT || 3306,
      user: process.env.MYSQL_USER || 'root',
      password: process.env.MYSQL_PASSWORD !== undefined ? process.env.MYSQL_PASSWORD : 'root',
      database: process.env.MYSQL_DATABASE || 'smartship'
    });

    console.log('✅ Connection Successful!');

    // Show Tables
    const [tables] = await connection.query('SHOW TABLES');
    const tableNames = tables.map(t => Object.values(t)[0]);
    console.log(`\nFound ${tableNames.length} tables:`, tableNames.join(', '));

    console.log('\n--------------------------------------------------');
    console.log('📊 Table Record Counts:');
    console.log('--------------------------------------------------');
    for (const table of tableNames) {
      const [[{ count }]] = await connection.query(`SELECT COUNT(*) as count FROM \`${table}\``);
      console.log(`  - ${table.padEnd(20)}: ${count} records`);
    }

    console.log('\n--------------------------------------------------');
    console.log('🔑 Registered Users (Admin/Staff/Customers):');
    console.log('--------------------------------------------------');
    const [users] = await connection.query('SELECT name, email, role, phone FROM users');
    users.forEach(user => {
      console.log(`  - [${user.role.toUpperCase()}] ${user.name} | ${user.email} (${user.phone || 'No Phone'})`);
    });

    console.log('\n--------------------------------------------------');
    console.log('📦 Recent Shipments (Top 5):');
    console.log('--------------------------------------------------');
    const [shipments] = await connection.query('SELECT tracking_id, sender_name, recipient_name, origin_city, destination_city, status FROM shipments ORDER BY created_at DESC LIMIT 5');
    if (shipments.length === 0) {
      console.log('  No shipments found.');
    } else {
      shipments.forEach(s => {
        console.log(`  - [${s.tracking_id}] ${s.sender_name} ➔ ${s.recipient_name} | Route: ${s.origin_city} ➔ ${s.destination_city} | Status: ${s.status}`);
      });
    }

    console.log('\n==================================================');
  } catch (error) {
    console.error('❌ Database connection or query failed:');
    console.error(error.message);
  } finally {
    if (connection) {
      await connection.end();
    }
  }
};

checkDatabase();
