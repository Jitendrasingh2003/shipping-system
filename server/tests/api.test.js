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
  let staffToken = '';
  let adminToken = '';
  let customerTicketId = '';
  let staffTicketId = '';
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

  test('POST /api/shipments/book - Book International Shipment with new fields', async () => {
    const res = await request(app)
      .post('/api/shipments/book')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        recipientName: 'International Recipient',
        recipientAddress: '456 Broadway, New York, US',
        originCountry: 'India',
        originCity: 'Mumbai',
        destinationCountry: 'United States',
        destinationCity: 'New York',
        weight: 12.0,
        length: 30,
        width: 30,
        height: 25,
        shipmentType: 'Air',
        senderPhone: '+91 9999999999',
        itemDescription: 'Industrial metal gears',
        isMetal: true,
        govtIdProof: 'A12345678'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.shipment.originCountry).toBe('India');
    expect(res.body.shipment.destinationCountry).toBe('United States');
    expect(res.body.shipment.senderPhone).toBe('+91 9999999999');
    expect(res.body.shipment.itemDescription).toBe('Industrial metal gears');
    expect(res.body.shipment.isMetal).toBe(true);
    expect(res.body.shipment.govtIdProof).toBe('A12345678');
  });

  test('POST /api/auth/register - Register Staff and Admin accounts for testing tickets', async () => {
    // Staff
    const staffRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Staff',
        email: `staff_${Date.now()}@example.com`,
        password: 'Password123',
        role: 'staff'
      });
    expect(staffRes.status).toBe(201);
    staffToken = staffRes.body.token;

    // Admin
    const adminRes = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Test Admin',
        email: `admin_${Date.now()}@example.com`,
        password: 'Password123',
        role: 'admin'
      });
    expect(adminRes.status).toBe(201);
    adminToken = adminRes.body.token;
  });

  test('POST /api/shipments/tickets - Customer submits a bug ticket with screenshot', async () => {
    const res = await request(app)
      .post('/api/shipments/tickets')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        title: 'Customer Dashboard Lag',
        message: 'The page takes 5s to load',
        category: 'Bug',
        screenshot: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg=='
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.ticket.id).toBeDefined();
    expect(res.body.ticket.senderRole).toBe('customer');
    expect(res.body.ticket.screenshot).toBeDefined();
    customerTicketId = res.body.ticket.id;
  });

  test('POST /api/shipments/tickets - Staff submits a bug ticket', async () => {
    const res = await request(app)
      .post('/api/shipments/tickets')
      .set('Authorization', `Bearer ${staffToken}`)
      .send({
        title: 'Scanner malfunctioning',
        message: 'Cannot parse QR codes',
        category: 'Bug',
        screenshot: null
      });
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.ticket.id).toBeDefined();
    expect(res.body.ticket.senderRole).toBe('staff');
    staffTicketId = res.body.ticket.id;
  });

  test('GET /api/shipments/tickets - Customer gets only their tickets', async () => {
    const res = await request(app)
      .get('/api/shipments/tickets')
      .set('Authorization', `Bearer ${authToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.tickets.length).toBeGreaterThanOrEqual(1);
    // Customer should not see the staff ticket
    const hasStaffTicket = res.body.tickets.some(t => t.id === staffTicketId);
    expect(hasStaffTicket).toBe(false);
  });

  test('GET /api/shipments/tickets - Admin gets all tickets', async () => {
    const res = await request(app)
      .get('/api/shipments/tickets')
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    const hasCustomerTicket = res.body.tickets.some(t => t.id === customerTicketId);
    const hasStaffTicket = res.body.tickets.some(t => t.id === staffTicketId);
    expect(hasCustomerTicket).toBe(true);
    expect(hasStaffTicket).toBe(true);
  });

  test('PUT /api/shipments/tickets/:ticketId/resolve - Admin resolves ticket', async () => {
    const res = await request(app)
      .put(`/api/shipments/tickets/${customerTicketId}/resolve`)
      .set('Authorization', `Bearer ${adminToken}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

