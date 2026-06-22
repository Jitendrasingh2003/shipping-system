const request = require('supertest');
const app = require('../server');
const { connectMySQL, initTables, getMySQLPool } = require('../config/db.mysql');

let pool;

beforeAll(async () => {
  await connectMySQL();
  await initTables();
  pool = getMySQLPool();
});

afterAll(async () => {
  // Clean up connections and test data
  if (pool) {
    try {
      await pool.query('DELETE FROM shipments WHERE sender_id IN (SELECT id FROM users WHERE email LIKE "test_%@example.com")');
      await pool.query('DELETE FROM users WHERE email LIKE "test_%@example.com"');
    } catch (err) {
      console.error('Error during test cleanup:', err.message);
    }
    // We do not call pool.end() if the server is still running/reusing it, 
    // but in test environment, pool is created specifically for the test.
    // However, server has its own reference to the pool, so closing pool might raise warning or error.
    // Let's check. Actually, calling pool.end() is fine if we are exiting the test run.
    try {
      await pool.end();
    } catch (err) {
      // Ignore
    }
  }
});

describe('SmartShip End-to-End API Integration tests', () => {
  let authToken = '';
  let customerId = '';
  let shipmentId = '';
  const testEmail = `test_${Date.now()}@example.com`;

  test('POST /api/auth/register - Register Customer Account', async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Customer',
        email: testEmail,
        password: 'Password123',
        phone: '1234567890'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
    expect(res.body.user.role).toBe('customer');
    
    authToken = res.body.token;
    customerId = res.body.user.id;
  });

  test('POST /api/auth/login - Login Customer Account', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({
        email: testEmail,
        password: 'Password123'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.token).toBeDefined();
  });

  test('POST /api/shipments/calculate-eta - Get Delivery Days Estimation', async () => {
    const res = await request(app)
      .post('/api/shipments/calculate-eta')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        origin: 'Mumbai',
        destination: 'Delhi',
        weight: 5.5,
        shipmentType: 'Express'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.estimated_delivery_days).toBeDefined();
    expect(typeof res.body.estimated_delivery_days).toBe('number');
  });

  test('POST /api/shipments/book - Book Shipment (Draft Awaiting Payment)', async () => {
    const res = await request(app)
      .post('/api/shipments/book')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        recipientName: 'Alice Recipient',
        recipientAddress: '123 Test Street, New Delhi',
        originCity: 'Mumbai',
        destinationCity: 'Delhi',
        weight: 5.5,
        length: 20,
        width: 20,
        height: 15,
        shipmentType: 'Express'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.shipment.status).toBe('Pending Payment');
    expect(res.body.shipment.paymentStatus).toBe('Pending');
    
    shipmentId = res.body.shipment.id;
  });
});
