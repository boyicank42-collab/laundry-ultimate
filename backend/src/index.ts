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
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173', credentials: true }
});

app.use(helmet());
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());

// API Routes
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
    timestamp: new Date().toISOString()
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

// WebSocket connections
// Di dalam file index.ts, cari bagian io.on('connection')
// Tambahkan kode ini:

io.on('connection', (socket) => {
  console.log('📡 Client connected:', socket.id);

  socket.on('join-outlet', (outlet) => socket.join(`outlet-${outlet}`));

  // Join device room untuk real-time timer
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

const PORT = process.env.PORT || 5002;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 ========================================`);
  console.log(`   LAUNDRY ULTIMATE ENTERPRISE v3.0`);
  console.log(`   ========================================`);
  console.log(`   Backend running on http://localhost:${PORT}`);
  console.log(`   Test API: http://localhost:${PORT}/api/test`);
  console.log(`   Cron job: Timer update every minute`);
  console.log(`   ========================================\n`);
});