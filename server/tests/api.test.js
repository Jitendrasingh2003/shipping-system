const request = require('supertest');
const mongoose = require('mongoose');
const app = require('../server');
const UserMongo = require('../models/User.mongo');
const Shipment = require('../models/Shipment');

beforeAll(async () => {
  // Wait for mongoose to establish connection if not already
  if (mongoose.connection.readyState === 0) {
    await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/smartship');
  }
});

afterAll(async () => {
  // Clean up connections
  await UserMongo.deleteMany({});
  await Shipment.deleteMany({});
  await mongoose.connection.close();
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

  test('POST /api/shipments/predict-eta - Get Delivery Days Estimation', async () => {
    const res = await request(app)
      .post('/api/shipments/predict-eta')
      .set('Authorization', `Bearer ${authToken}`)
      .send({
        origin: 'Mumbai',
        destination: 'Delhi',
        weight: 5.5,
        shipmentType: 'Express'
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.predicted_delivery_days).toBeDefined();
    expect(typeof res.body.predicted_delivery_days).toBe('number');
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
    
    shipmentId = res.body.shipment._id;
  });
});
