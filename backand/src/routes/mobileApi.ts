import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// Customer login via phone number
router.post('/customer/login', async (req, res) => {
  try {
    const { phone } = req.body;
    
    let customer = await prisma.customer.findUnique({
      where: { phone },
      include: { membership: true }
    });
    
    if (!customer) {
      customer = await prisma.customer.create({
        data: {
          name: `Pelanggan ${phone.slice(-4)}`,
          phone,
          totalSpent: 0,
          totalOrders: 0
        },
        include: { membership: true }
      });
    }
    
    // Generate simple token for mobile
    const token = Buffer.from(`${customer.id}:${Date.now()}`).toString('base64');
    
    res.json({
      success: true,
      token,
      customer: {
        id: customer.id,
        name: customer.name,
        phone: customer.phone,
        points: customer.membership?.points || 0,
        level: customer.membership?.level || 'SILVER'
      }
    });
  } catch (error) {
    res.status(500).json({ error: 'Login failed' });
  }
});

// Get customer transactions
router.get('/customer/transactions', authenticate, async (req, res) => {
  try {
    const customerId = req.user?.id;
    const transactions = await prisma.transaction.findMany({
      where: { customerId },
      include: { customer: true },
      orderBy: { createdAt: 'desc' },
      take: 20
    });
    res.json(transactions);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get transactions' });
  }
});

// Track order status
router.get('/track/:invoiceCode', async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { invoiceCode: req.params.invoiceCode },
      include: { customer: true, pickupDelivery: true }
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    const statusMap = {
      PENDING: { status: 'pending', message: 'Menunggu diproses', step: 1 },
      PROGRESS: { status: 'progress', message: 'Sedang dicuci', step: 2 },
      READY: { status: 'ready', message: 'Siap diambil', step: 3 },
      COMPLETED: { status: 'completed', message: 'Selesai', step: 4 },
      CANCELLED: { status: 'cancelled', message: 'Dibatalkan', step: 0 }
    };
    
    res.json({
      invoiceCode: transaction.invoiceCode,
      status: statusMap[transaction.status] || statusMap.PENDING,
      total: transaction.total,
      createdAt: transaction.createdAt,
      pickup: transaction.pickupDelivery
    });
  } catch (error) {
    res.status(500).json({ error: 'Failed to track order' });
  }
});

// Get customer points & membership
router.get('/customer/membership', authenticate, async (req, res) => {
  try {
    const membership = await prisma.membership.findUnique({
      where: { customerId: req.user?.id },
      include: { transactions: { take: 10, orderBy: { createdAt: 'desc' } } }
    });
    res.json(membership || { points: 0, level: 'SILVER', totalSpent: 0 });
  } catch (error) {
    res.status(500).json({ error: 'Failed to get membership' });
  }
});

// Create pickup request from mobile
router.post('/pickup/request', authenticate, async (req, res) => {
  try {
    const { address, pickupDate, notes } = req.body;
    
    const pickup = await prisma.pickupDelivery.create({
      data: {
        customerId: req.user!.id,
        address,
        pickupDate: new Date(pickupDate),
        notes,
        status: 'PENDING'
      }
    });
    
    res.json({ success: true, pickup });
  } catch (error) {
    res.status(500).json({ error: 'Failed to create pickup request' });
  }
});

// Submit rating & review
router.post('/rating', authenticate, async (req, res) => {
  try {
    const { transactionId, rating, review } = req.body;
    
    await prisma.$executeRaw`
      INSERT INTO ratings (transaction_id, customer_id, rating, review, created_at)
      VALUES (${transactionId}, ${req.user?.id}, ${rating}, ${review}, NOW())
    `;
    
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to submit rating' });
  }
});

export default router;