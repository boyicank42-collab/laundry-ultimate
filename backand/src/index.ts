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
import { authenticate } from './middleware/auth.js';

dotenv.config();

export const prisma = new PrismaClient();
const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: { origin: 'http://localhost:5173', credentials: true }
});

// ============================================================
// ============ MIDTRANS WEBHOOK (TANPA AUTHENTICATE) ============
// ============================================================
// Raw body parser KHUSUS untuk webhook (sebelum express.json)
app.use('/api/payment/notification', express.raw({ type: 'application/json' }));
app.use('/api/payment/callback', express.raw({ type: 'application/json' }));

// Fungsi mapping payment method dari Midtrans ke enum database
function mapPaymentMethod(paymentType: string): string {
  const mapping: { [key: string]: string } = {
    'credit_card': 'CREDIT_CARD',
    'bank_transfer': 'TRANSFER',
    'qris': 'QRIS',
    'gopay': 'GOPAY',
    'shopeepay': 'SHOPEEPAY',
    'bca_klikpay': 'BCA_KLIKPAY',
    'bca_klikbca': 'BCA_KLIKBCA',
    'echannel': 'ECHANNEL',
    'bri_epay': 'BRI_EPAY',
    'cimb_clicks': 'CIMB_CLICKS',
    'danamon_online': 'DANAMON_ONLINE',
    'akulaku': 'AKULAKU',
    'cash': 'CASH',
    'debit': 'DEBIT'
  };
  return mapping[paymentType] || 'TRANSFER';
}

// Endpoint NOTIFICATION - Menerima notifikasi dari Midtrans
app.post('/api/payment/notification', async (req, res) => {
  try {
    console.log('📢 [WEBHOOK] Notification received');
    
    let notification;
    if (Buffer.isBuffer(req.body)) {
      notification = JSON.parse(req.body.toString('utf8'));
    } else if (typeof req.body === 'string') {
      notification = JSON.parse(req.body);
    } else {
      notification = req.body;
    }
    
    console.log('📢 [WEBHOOK] Data:', JSON.stringify(notification, null, 2));
    
    const { order_id, transaction_status, payment_type, fraud_status } = notification;
    
    if (!order_id) {
      return res.status(200).send('OK');
    }
    
    let paymentStatus = 'UNPAID';
    let orderStatus = 'PENDING';
    
    if (transaction_status === 'capture' && fraud_status === 'accept') {
      paymentStatus = 'PAID';
      orderStatus = 'COMPLETED';
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'PAID';
      orderStatus = 'COMPLETED';
    } else if (transaction_status === 'pending') {
      paymentStatus = 'UNPAID';
      orderStatus = 'PENDING';
    } else if (transaction_status === 'deny' || transaction_status === 'expire' || transaction_status === 'cancel') {
      paymentStatus = 'UNPAID';
      orderStatus = 'CANCELLED';
    }
    
    const mappedPaymentMethod = mapPaymentMethod(payment_type);
    
    const updatedTransaction = await prisma.transaction.update({
      where: { invoiceCode: order_id },
      data: { 
        paymentStatus: paymentStatus,
        paymentMethod: mappedPaymentMethod,
        status: orderStatus,
      }
    });
    
    console.log(`✅ [WEBHOOK] ${order_id} -> ${paymentStatus}`);
    
    if (paymentStatus === 'PAID') {
      await prisma.customer.update({
        where: { id: updatedTransaction.customerId },
        data: {
          totalSpent: { increment: updatedTransaction.total },
          totalOrders: { increment: 1 }
        }
      });
      console.log(`✅ Customer total spent updated`);
    }
    
    io.emit('payment-updated', { order_id, paymentStatus, orderStatus });
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ [WEBHOOK] Error:', error.message);
    res.status(200).send('OK');
  }
});

// Endpoint CALLBACK - Menerima notifikasi dari Midtrans (alternatif)
app.post('/api/payment/callback', async (req, res) => {
  try {
    console.log('📢 [WEBHOOK] Callback received');
    
    let notification;
    if (Buffer.isBuffer(req.body)) {
      notification = JSON.parse(req.body.toString('utf8'));
    } else if (typeof req.body === 'string') {
      notification = JSON.parse(req.body);
    } else {
      notification = req.body;
    }
    
    console.log('📢 [WEBHOOK] Data:', JSON.stringify(notification, null, 2));
    
    const { order_id, transaction_status, payment_type, fraud_status } = notification;
    
    if (!order_id) {
      return res.status(200).send('OK');
    }
    
    let paymentStatus = 'UNPAID';
    let orderStatus = 'PENDING';
    
    if (transaction_status === 'capture' && fraud_status === 'accept') {
      paymentStatus = 'PAID';
      orderStatus = 'COMPLETED';
    } else if (transaction_status === 'settlement') {
      paymentStatus = 'PAID';
      orderStatus = 'COMPLETED';
    } else if (transaction_status === 'pending') {
      paymentStatus = 'UNPAID';
      orderStatus = 'PENDING';
    } else if (transaction_status === 'deny' || transaction_status === 'expire' || transaction_status === 'cancel') {
      paymentStatus = 'UNPAID';
      orderStatus = 'CANCELLED';
    }
    
    const mappedPaymentMethod = mapPaymentMethod(payment_type);
    
    const updatedTransaction = await prisma.transaction.update({
      where: { invoiceCode: order_id },
      data: { 
        paymentStatus: paymentStatus,
        paymentMethod: mappedPaymentMethod,
        status: orderStatus,
      }
    });
    
    console.log(`✅ [WEBHOOK] ${order_id} -> ${paymentStatus}`);
    
    if (paymentStatus === 'PAID') {
      await prisma.customer.update({
        where: { id: updatedTransaction.customerId },
        data: {
          totalSpent: { increment: updatedTransaction.total },
          totalOrders: { increment: 1 }
        }
      });
      console.log(`✅ Customer total spent updated`);
    }
    
    io.emit('payment-updated', { order_id, paymentStatus, orderStatus });
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ [WEBHOOK] Error:', error.message);
    res.status(200).send('OK');
  }
});

// ============================================================
// ============ CHATBOT WEBHOOK (TANPA AUTHENTICATE) ============
// ============================================================
// Tambahkan raw parser KHUSUS untuk webhook chatbot
app.use('/api/chatbot/webhook', express.raw({ type: 'application/json' }));

// Import chatbot webhook routes
import chatbotWebhook from './routes/chatbotWebhook.js';
app.use('/api/chatbot', chatbotWebhook);

// ============================================================
// ============ MIDDLEWARE (SETELAH SEMUA WEBHOOK) ============
// ============================================================
app.use(helmet({
  crossOriginResourcePolicy: false,
}));
app.use(cors({ origin: 'http://localhost:5173', credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ============================================================
// ============ API ROUTES (DENGAN AUTHENTICATE) ============
// ============================================================
app.use('/api/auth', authRoutes);
app.use('/api/transactions', authenticate, transactionRoutes);
app.use('/api/customers', authenticate, customerRoutes);
app.use('/api/reports', authenticate, reportRoutes);
app.use('/api/dashboard', authenticate, dashboardRoutes);
app.use('/api/employees', authenticate, employeeRoutes);
app.use('/api/inventory', authenticate, inventoryRoutes);
app.use('/api/outlets', authenticate, outletRoutes);
app.use('/api/devices', authenticate, deviceRoutes);
app.use('/api/operational-cost', authenticate, operationalCostRoutes);
app.use('/api/wa-broadcast', authenticate, waBroadcastRoutes);
app.use('/api/chatbot', authenticate, chatbotRoutes);
app.use('/api/payment', authenticate, paymentRoutes);
app.use('/api/membership', authenticate, membershipRoutes);
app.use('/api/pickup', authenticate, pickupRoutes);
app.use('/api/backup', authenticate, backupRoutes);
app.use('/api/mobile', authenticate, mobileApiRoutes);
app.use('/api/activity-logs', authenticate, activityLogRoutes);
app.use('/api/ratings', authenticate, ratingRoutes);
app.use('/api/license', authenticate, licenseRoutes);

// ============ TEST ENDPOINT (tanpa auth) ============
app.get('/api/test', (req, res) => {
  res.json({
    message: 'Laundry Ultimate Enterprise Backend',
    version: '3.0',
    status: 'running',
    timestamp: new Date().toISOString(),
    webhook: {
      notification: '/api/payment/notification',
      callback: '/api/payment/callback'
    }
  });
});

// ============================================================
// ============ CRON JOB ============
// ============================================================
console.log('⏰ Initializing cron job for IoT timers...');

cron.schedule('* * * * *', async () => {
  try {
    const busyDevices = await prisma.device.findMany({
      where: { status: 'BUSY', timeRemaining: { gt: 0 } }
    });
    if (busyDevices.length === 0) return;
    
    for (const device of busyDevices) {
      const newTime = device.timeRemaining - 1;
      if (newTime <= 0) {
        await prisma.device.update({
          where: { id: device.id },
          data: { status: 'ONLINE', cycle: 'Siap', timeRemaining: 0, temperature: 0, currentLoad: 0 }
        });
        console.log(`✅ [CRON] ${device.name} FINISHED!`);
      } else {
        await prisma.device.update({
          where: { id: device.id },
          data: { timeRemaining: newTime }
        });
      }
    }
  } catch (error) {
    console.error('❌ Cron error:', error);
  }
});

console.log('✅ Cron job registered');

// ============================================================
// ============ WEBSOCKET ============
// ============================================================
io.on('connection', (socket) => {
  console.log('📡 Client connected:', socket.id);
  socket.on('join-outlet', (outlet) => socket.join(`outlet-${outlet}`));
  socket.on('join-device', (deviceId) => socket.join(`device-${deviceId}`));
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
          data: { status: 'ONLINE', cycle: 'Siap', timeRemaining: 0 }
        });
        io.to(`device-${device.id}`).emit('device-finished', { deviceId: device.id, name: device.name });
      }
      io.to(`device-${device.id}`).emit('timer-update', { deviceId: device.id, timeRemaining: newTime > 0 ? newTime : 0 });
    }
  } catch (error) {
    console.error('Timer broadcast error:', error);
  }
}, 1000);

export { io };

// ============================================================
// ============ START SERVER ============
// ============================================================
const PORT = process.env.PORT || 5002;
httpServer.listen(PORT, () => {
  console.log(`\n🚀 ========================================`);
  console.log(`   LAUNDRY ULTIMATE ENTERPRISE v3.0`);
  console.log(`   ========================================`);
  console.log(`   Backend running on http://localhost:${PORT}`);
  console.log(`   Test API: http://localhost:${PORT}/api/test`);
  console.log(`   Webhook: http://localhost:${PORT}/api/payment/notification`);
  console.log(`   Callback: http://localhost:${PORT}/api/payment/callback`);
  console.log(`   ========================================\n`);
});