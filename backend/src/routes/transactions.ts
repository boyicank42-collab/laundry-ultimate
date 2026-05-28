import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

router.get('/', authenticate, async (req, res) => {
  try {
    const transactions = await prisma.transaction.findMany({
      include: { customer: true, user: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(transactions);
  } catch (error) {
    console.error('Fetch error:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Fungsi untuk auto-create dan update membership
async function updateMembership(customerId: string, amount: number, transactionId: string) {
  // Cari atau buat membership
  let membership = await prisma.membership.findUnique({
    where: { customerId }
  });
  
  if (!membership) {
    membership = await prisma.membership.create({
      data: { customerId, level: 'SILVER', points: 0, totalSpent: 0 }
    });
    console.log(`✅ Membership created for customer ${customerId}`);
  }
  
  // Hitung poin (1 poin per Rp 1000)
  const pointsEarned = Math.floor(amount / 1000);
  const newPoints = membership.points + pointsEarned;
  const newTotalSpent = membership.totalSpent + amount;
  
  // Tentukan level berdasarkan total belanja
  let level = membership.level;
  if (newTotalSpent >= 1000000) level = 'PLATINUM';
  else if (newTotalSpent >= 500000) level = 'GOLD';
  
  // Update membership
  await prisma.membership.update({
    where: { id: membership.id },
    data: { points: newPoints, totalSpent: newTotalSpent, level }
  });
  
  // Catat transaksi poin
  await prisma.membershipTransaction.create({
    data: {
      membershipId: membership.id,
      type: 'EARN',
      points: pointsEarned,
      description: `Transaksi ${transactionId} - Rp ${amount.toLocaleString()}`
    }
  });
  
  console.log(`✅ Points added: +${pointsEarned} (Total: ${newPoints}), Level: ${level}`);
}

router.post('/', authenticate, async (req, res) => {
  try {
    let { customerId, customerName, customerPhone, weight, serviceType, pricePerUnit, discount, notes, paymentMethod } = req.body;
    
    if (!customerId && !customerPhone) {
      return res.status(400).json({ error: 'Customer ID or phone required' });
    }
    
    if (!weight || weight <= 0) {
      return res.status(400).json({ error: 'Weight must be greater than 0' });
    }
    
    let finalCustomerId = customerId;
    
    // Auto-registrasi customer
    if (!customerId && customerPhone) {
      let existingCustomer = await prisma.customer.findFirst({
        where: { phone: customerPhone }
      });
      
      if (!existingCustomer) {
        existingCustomer = await prisma.customer.create({
          data: {
            name: customerName || `Pelanggan ${customerPhone.slice(-4)}`,
            phone: customerPhone,
            totalSpent: 0,
            totalOrders: 0
          }
        });
        console.log(`✅ Auto-registered customer: ${existingCustomer.name}`);
      }
      finalCustomerId = existingCustomer.id;
    }
    
    const subtotal = weight * pricePerUnit;
    const tax = 0;
    const total = subtotal - (discount || 0);
    const invoiceCode = `INV/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    let validPaymentMethod: 'CASH' | 'TRANSFER' | 'QRIS' | 'DEBIT' = 'CASH';
    let paymentStatus = 'UNPAID';
    
    if (paymentMethod === 'CASH') {
      validPaymentMethod = 'CASH';
      paymentStatus = 'PAID';
    } else if (paymentMethod === 'QRIS') {
      validPaymentMethod = 'QRIS';
    } else if (paymentMethod === 'TRANSFER') {
      validPaymentMethod = 'TRANSFER';
    } else if (paymentMethod === 'ONLINE') {
      validPaymentMethod = 'TRANSFER';
    }
    
    const transaction = await prisma.transaction.create({
      data: {
        invoiceCode,
        customerId: finalCustomerId,
        userId: req.user!.id,
        weight,
        serviceType,
        pricePerUnit,
        subtotal,
        discount: discount || 0,
        tax: 0,
        total,
        notes: notes || '',
        items: [],
        paymentMethod: validPaymentMethod,
        paymentStatus: paymentStatus
      },
      include: { customer: true }
    });
    
    // Update customer stats
    await prisma.customer.update({
      where: { id: finalCustomerId },
      data: {
        totalSpent: { increment: total },
        totalOrders: { increment: 1 }
      }
    });
    
    // AUTO-CREATE & UPDATE MEMBERSHIP
    await updateMembership(finalCustomerId, total, transaction.id);
    
    console.log(`✅ Transaction created: ${invoiceCode} - Total: Rp ${total}`);
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('❌ Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    await prisma.transaction.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update status' });
  }
});

router.patch('/:id/payment', authenticate, async (req, res) => {
  try {
    const { paymentStatus, paymentMethod } = req.body;
    await prisma.transaction.update({
      where: { id: req.params.id },
      data: { paymentStatus, paymentMethod }
    });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// Offline sync endpoint
router.post('/offline-sync', authenticate, async (req, res) => {
  try {
    const { customerId, customerName, customerPhone, weight, serviceType, pricePerUnit, discount, notes, paymentMethod } = req.body;
    
    // Validasi dan proses transaksi (sama seperti POST biasa)
    let finalCustomerId = customerId;
    
    if (!customerId && customerPhone) {
      let existingCustomer = await prisma.customer.findFirst({
        where: { phone: customerPhone }
      });
      
      if (!existingCustomer) {
        existingCustomer = await prisma.customer.create({
          data: {
            name: customerName || `Pelanggan ${customerPhone.slice(-4)}`,
            phone: customerPhone,
            totalSpent: 0,
            totalOrders: 0
          }
        });
      }
      finalCustomerId = existingCustomer.id;
    }
    
    const subtotal = weight * pricePerUnit;
    const total = subtotal - (discount || 0);
    const invoiceCode = `INV/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const transaction = await prisma.transaction.create({
      data: {
        invoiceCode,
        customerId: finalCustomerId,
        userId: req.user!.id,
        weight,
        serviceType,
        pricePerUnit,
        subtotal,
        discount: discount || 0,
        tax: 0,
        total,
        notes: notes || '',
        items: [],
        paymentMethod: 'CASH',
        paymentStatus: 'PAID'
      },
      include: { customer: true }
    });
    
    await prisma.customer.update({
      where: { id: finalCustomerId },
      data: {
        totalSpent: { increment: total },
        totalOrders: { increment: 1 }
      }
    });
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Offline sync error:', error);
    res.status(500).json({ error: 'Failed to sync offline transaction' });
  }
});

export default router;