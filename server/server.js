require('dotenv').config();
const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const bcrypt = require('bcryptjs');
const { v4: uuidv4 } = require('uuid');

const connectMongoDB = require('./config/db.mongo');
const { connectMySQL, initTables, checkMySQLActive, getMySQLPool } = require('./config/db.mysql');
const UserMongo = require('./models/User.mongo');
const errorHandler = require('./middleware/errorHandler');
const { generalLimiter } = require('./middleware/rateLimiter');

// Routes
const authRoutes = require('./routes/authRoutes');
const shipmentRoutes = require('./routes/shipmentRoutes');
const paymentRoutes = require('./routes/paymentRoutes');
const dashboardRoutes = require('./routes/dashboardRoutes');
const notificationRoutes = require('./routes/notificationRoutes');
const chatRoutes = require('./routes/chatRoutes');
const logisticsRoutes = require('./routes/logisticsRoutes');

const app = express();
const server = http.createServer(app);

// Socket.IO Setup
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL || 'http://localhost:5173',
    methods: ['GET', 'POST'],
    credentials: true,
  },
});

app.set('io', io);

io.on('connection', (socket) => {
  console.log(`🔌 Socket Connected: ${socket.id}`);

  // User join room for notifications
  socket.on('join:user', (userId) => {
    socket.join(`user:${userId}`);
    console.log(`👤 User joined private room: user:${userId}`);
  });

  // Shipment track room
  socket.on('join:shipment', (trackingId) => {
    socket.join(`shipment:${trackingId}`);
    console.log(`📦 Tracker client joined shipment room: shipment:${trackingId}`);
  });

  // Support chat room join
  socket.on('chat:join', (roomId) => {
    socket.join(`chat:${roomId}`);
    console.log(`💬 User joined chat room: chat:${roomId}`);
  });

  // Support chat message handler
  socket.on('chat:send_message', async (data) => {
    try {
      const ChatMessage = require('./models/ChatMessage');
      const chatMsg = new ChatMessage({
        roomId: data.roomId,
        senderId: data.senderId,
        senderName: data.senderName,
        senderRole: data.senderRole,
        message: data.message
      });
      await chatMsg.save();

      // Broadcast message to everyone in the specific chat room
      io.to(`chat:${data.roomId}`).emit('chat:message', chatMsg);

      // Notify other active dashboard roles about a new message alert
      socket.broadcast.emit('chat:new_message_alert', {
        roomId: data.roomId,
        senderName: data.senderName,
        message: data.message
      });

      // ---- AI Chatbot Auto-Reply ----
      if (data.senderRole === 'customer' && data.chatMode === 'ai') {
        const { getAiChatResponse } = require('./utils/aiHelper');
        const aiMessageText = await getAiChatResponse(data.message, data.roomId);

        const aiMsg = new ChatMessage({
          roomId: data.roomId,
          senderId: 'ai-assistant',
          senderName: 'Marine Bytes AI Assistant',
          senderRole: 'staff',
          message: aiMessageText
        });
        await aiMsg.save();

        // Broadcast AI reply to room with a slight typing delay
        setTimeout(() => {
          io.to(`chat:${data.roomId}`).emit('chat:message', aiMsg);
        }, 800);
      }
    } catch (err) {
      console.error('Socket chat error:', err.message);
    }
  });

  socket.on('disconnect', () => {
    console.log(`🔌 Socket Disconnected: ${socket.id}`);
  });
});

// Middleware
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true
}));
app.use(morgan('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Apply rate limiter
app.use('/api', generalLimiter);

// Mount APIs
app.use('/api/auth', authRoutes);
app.use('/api/shipments', shipmentRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/logistics', logisticsRoutes);

// Health Check
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Marine Bytes API is running smoothly! 🚀',
    mysqlActive: checkMySQLActive(),
    timestamp: new Date()
  });
});

// 404 Route
app.use((req, res) => {
  res.status(404).json({ success: false, message: `API Endpoint ${req.originalUrl} not found` });
});

// Error Handler Middleware
app.use(errorHandler);

// Helper: Seed Demo Accounts if Database Empty
// Start Server
const PORT = process.env.PORT || 5000;

const startServer = async () => {
  // 1. MongoDB Connect (Fatal if down)
  await connectMongoDB();

  // 2. MySQL Connect (Non-Fatal fallback)
  const mysqlPool = await connectMySQL();
  if (mysqlPool) {
    await initTables();
  }

  // 3. Seed Users & Shipments
  const { runDatabaseSeeder } = require('./utils/seeder');
  await runDatabaseSeeder();

  server.listen(PORT, () => {
    console.log(`\n🚀 Marine Bytes Server running on port ${PORT}`);
    console.log(`📡 API URL: http://localhost:${PORT}/api`);
    console.log(`\n📋 Seeded Demo Credentials:`);
    console.log(`   Admin:    admin@shiptrack.com    / Admin@123`);
    console.log(`   Staff:    staff1@shiptrack.com   / Staff@123`);
    console.log(`   Customer: customer1@shiptrack.com / Customer@123\n`);
  });
};

if (process.env.NODE_ENV !== 'test') {
  startServer().catch(console.error);
}

module.exports = app;
