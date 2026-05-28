import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import dotenv from 'dotenv';
import { Server } from 'socket.io';
import { createServer } from 'http';
import { PrismaClient } from '@prisma/client';
import cron from 'node-cron';
import authRoutes from './routes/auth.js';
import transactionRoutes from './routes/transactions.js';
import customerRoutes from './routes/customers.js';
import reportRoutes from './routes/reports.js';
import dashboardRoutes from './routes/dashboard.js';
import employeeRoutes from './routes/employees.js';
import inventoryRoutes from './routes/inventory.js';
import outletRoutes from './routes/outlets.js';
import deviceRoutes from './routes/devices.js';
import operationalCostRoutes from './routes/operationalCost.js';
import waBroadcastRoutes from './routes/waBroadcast.js';
import chatbotRoutes from './routes/chatbot.js';
import paymentRoutes from './routes/payment.js';
import membershipRoutes from './routes/membership.js';
import pickupRoutes from './routes/pickupDelivery.js';
import backupRoutes from './routes/backup.js';
import mobileApiRoutes from './routes/mobileApi.js';
import activityLogRoutes from './routes/activityLog.js';
import ratingRoutes from './routes/rating.js';
import licenseRoutes from './routes/license.js';

dotenv.config();

export const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);

// ============ MIDTRANS WEBHOOK (DI LUAR MIDDLEWARE) ============
app.use('/api/payment/notification', express.raw({ type: 'application/json' }));
app.use('/api/payment/callback', express.raw({ type: 'application/json' }));

app.post('/api/payment/notification', async (req, res) => {
  try {
    const notification = JSON.parse(req.body);
    console.log('📢 [WEBHOOK] Midtrans notification:', notification);
    
    const { order_id, transaction_status, payment_type } = notification;
    
    let paymentStatus = 'PENDING';
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      paymentStatus = 'LUNAS';
    } else if (transaction_status === 'deny' || transaction_status === 'expire' || transaction_status === 'cancel') {
      paymentStatus = 'BATAL';
    }
    
    await prisma.transaction.update({
      where: { invoice: order_id },
      data: { 
        paymentStatus: paymentStatus,
        paymentMethod: payment_type,
        paidAt: paymentStatus === 'LUNAS' ? new Date() : null
      }
    });
    
    console.log(`✅ Transaksi ${order_id} updated to ${paymentStatus}`);
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Webhook error:', error);
    res.sendStatus(500);
  }
});

app.post('/api/payment/callback', async (req, res) => {
  try {
    const notification = JSON.parse(req.body);
    console.log('📢 [CALLBACK] Midtrans notification:', notification);
    
    const { order_id, transaction_status, payment_type } = notification;
    
    let paymentStatus = 'PENDING';
    if (transaction_status === 'capture' || transaction_status === 'settlement') {
      paymentStatus = 'LUNAS';
    } else if (transaction_status === 'deny' || transaction_status === 'expire' || transaction_status === 'cancel') {
      paymentStatus = 'BATAL';
    }
    
    await prisma.transaction.update({
      where: { invoice: order_id },
      data: { 
        paymentStatus: paymentStatus,
        paymentMethod: payment_type,
        paidAt: paymentStatus === 'LUNAS' ? new Date() : null
      }
    });
    
    console.log(`✅ Transaksi ${order_id} updated to ${paymentStatus}`);
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ Callback error:', error);
    res.sendStatus(500);
  }
});

// ============ CORS CONFIG (DIPERBAIKI) ============
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5002',
  'https://laundry-ultimate-final.vercel.app',
  'https://laundry-ultimate-final.vercel.app/',
  /\.vercel\.app$/  // Allow all vercel.app subdomains
];

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl)
    if (!origin) return callback(null, true);
    if (allowedOrigins.some(allowed => allowed === origin || (allowed instanceof RegExp && allowed.test(origin)))) {
      callback(null, true);
    } else {
      console.log('🚫 CORS blocked origin:', origin);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS', 'PATCH'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept']
}));

app.use(helmet({
  crossOriginResourcePolicy: { policy: "cross-origin" }
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============ API ROUTES ============
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/reports', reportRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/outlets', outletRoutes);
app.use('/api/devices', deviceRoutes);
app.use('/api/operational-cost', operationalCostRoutes);
app.use('/api/wa-broadcast', waBroadcastRoutes);
app.use('/api/chatbot', chatbotRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/membership', membershipRoutes);
app.use('/api/pickup', pickupRoutes);
app.use('/api/backup', backupRoutes);
app.use('/api/mobile', mobileApiRoutes);
app.use('/api/activity-logs', activityLogRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/license', licenseRoutes);

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Laundry Ultimate Enterprise Backend',
    version: '3.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    cors: 'enabled'
  });
});

// ============ CRON JOB FOR IoT TIMER (SETIAP MENIT) ============
console.log('⏰ Initializing cron job for IoT timers...');

cron.schedule('* * * * *', async () => {
  try {
    const busyDevices = await prisma.device.findMany({
      where: { status: 'BUSY', timeRemaining: { gt: 0 } }
    });

    if (busyDevices.length === 0) return;

    console.log(`⏰ [CRON] Updating ${busyDevices.length} devices...`);

    for (const device of busyDevices) {
      const newTime = device.timeRemaining - 1;
      if (newTime <= 0) {
        await prisma.device.update({
          where: { id: device.id },
          data: {
            status: 'ONLINE',
            cycle: 'Siap',
            timeRemaining: 0,
            temperature: 0,
            currentLoad: 0
          }
        });
        console.log(`✅ [CRON] ${device.name} FINISHED!`);
      } else {
        await prisma.device.update({
          where: { id: device.id },
          data: { timeRemaining: newTime }
        });
        console.log(`⏰ [CRON] ${device.name}: ${newTime} menit tersisa`);
      }
    }
  } catch (error) {
    console.error('❌ Cron error:', error);
  }
});

console.log('✅ Cron job registered: Timer akan update setiap menit');

// ============ WEBSOCKET (SOCKET.IO) ============
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    credentials: true
  }
});

io.on('connection', (socket) => {
  console.log('📡 Client connected:', socket.id);

  socket.on('join-outlet', (outlet) => socket.join(`outlet-${outlet}`));
  socket.on('join-device', (deviceId) => {
    socket.join(`device-${deviceId}`);
    console.log(`📡 Client joined device: ${deviceId}`);
  });
  socket.on('disconnect', () => console.log('📡 Client disconnected:', socket.id));
});

// Broadcast timer update setiap detik
setInterval(async () => {
  try {
    const busyDevices = await prisma.device.findMany({
      where: { status: 'BUSY', timeRemaining: { gt: 0 } }
    });

    for (const device of busyDevices) {
      const newTime = device.timeRemaining - 1;
      if (newTime <= 0) {
        await prisma.device.update({
          where: { id: device.id },
          data: { status: 'ONLINE', cycle: 'Siap', timeRemaining: 0, temperature: 0, currentLoad: 0 }
        });
        io.to(`device-${device.id}`).emit('timer-update', { deviceId: device.id, timeRemaining: 0, status: 'ONLINE' });
        io.to(`device-${device.id}`).emit('device-finished', { deviceId: device.id, name: device.name });
      } else {
        await prisma.device.update({
          where: { id: device.id },
          data: { timeRemaining: newTime }
        });
        io.to(`device-${device.id}`).emit('timer-update', { deviceId: device.id, timeRemaining: newTime });
      }
    }
  } catch (error) {
    console.error('Timer broadcast error:', error);
  }
}, 1000);

export { io };

// ============ START SERVER ============
const PORT = process.env.PORT || 5002;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 ========================================`);
  console.log(`   LAUNDRY ULTIMATE ENTERPRISE v3.0`);
  console.log(`   ========================================`);
  console.log(`   Backend running on http://localhost:${PORT}`);
  console.log(`   Test API: http://localhost:${PORT}/api/test`);
  console.log(`   Webhook: http://localhost:${PORT}/api/payment/notification`);
  console.log(`   Callback: http://localhost:${PORT}/api/payment/callback`);
  console.log(`   CORS: Enabled for Vercel & Localhost`);
  console.log(`   Cron job: Timer update every minute`);
  console.log(`   ========================================\n`);
});