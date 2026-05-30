import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';

const router = Router();

// GET all transactions
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
  let membership = await prisma.membership.findUnique({
    where: { customerId }
  });
  
  if (!membership) {
    membership = await prisma.membership.create({
      data: { customerId, level: 'SILVER', points: 0, totalSpent: 0 }
    });
    console.log(`✅ Membership created for customer ${customerId}`);
  }
  
  const pointsEarned = Math.floor(amount / 1000);
  const newPoints = membership.points + pointsEarned;
  const newTotalSpent = membership.totalSpent + amount;
  
  let level = membership.level;
  if (newTotalSpent >= 1000000) level = 'PLATINUM';
  else if (newTotalSpent >= 500000) level = 'GOLD';
  
  await prisma.membership.update({
    where: { id: membership.id },
    data: { points: newPoints, totalSpent: newTotalSpent, level }
  });
  
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

// ============================================================
// ========== FUNGSI KONVERSI WEIGHT (KOMA KE TITIK) ==========
// ============================================================
function convertWeight(weight: any): number {
  if (weight === undefined || weight === null) {
    return 0;
  }
  
  // Ubah ke string
  let weightStr = String(weight);
  
  // Ganti koma dengan titik
  weightStr = weightStr.replace(/,/g, '.');
  
  // Hapus semua karakter selain angka dan titik
  weightStr = weightStr.replace(/[^0-9.]/g, '');
  
  // Parse ke float
  const result = parseFloat(weightStr);
  
  console.log(`📦 Weight conversion: input=${weight} -> output=${result}`);
  
  return isNaN(result) ? 0 : result;
}
// ============================================================

// POST create transaction
router.post('/', authenticate, async (req, res) => {
  try {
    let { 
      customerId, 
      customerName, 
      customerPhone, 
      weight, 
      serviceType, 
      pricePerUnit, 
      discount, 
      notes, 
      paymentMethod 
    } = req.body;
    
    // Validasi user authentication
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    console.log('📝 Creating transaction for user:', userId);
    
    // Validasi customer
    if (!customerId && !customerPhone) {
      return res.status(400).json({ error: 'Customer ID or phone required' });
    }
    
    // ============================================================
    // ========== KONVERSI WEIGHT - SUPPORT KOMA (,) ==========
    // ============================================================
    const finalWeight = convertWeight(weight);
    
    if (finalWeight <= 0) {
      return res.status(400).json({ 
        error: 'Berat harus lebih dari 0',
        hint: 'Gunakan titik (.) atau koma (,). Contoh: 1.5 atau 1,5'
      });
    }
    // ============================================================
    
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
    
    const subtotal = finalWeight * pricePerUnit;
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
    
    // Cek apakah user ID valid
    const userExists = await prisma.user.findUnique({
      where: { id: userId }
    });
    
    if (!userExists) {
      console.error('User not found:', userId);
      return res.status(400).json({ error: 'Invalid user ID' });
    }
    
    const transaction = await prisma.transaction.create({
      data: {
        invoiceCode,
        customerId: finalCustomerId,
        userId: userId,
        weight: finalWeight,
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
    
    console.log(`✅ Transaction created: ${invoiceCode} - Weight: ${finalWeight}kg - Total: Rp ${total}`);
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('❌ Create transaction error:', error);
    res.status(500).json({ error: 'Failed to create transaction', details: error.message });
  }
});

// PATCH update transaction status
router.patch('/:id/status', authenticate, async (req, res) => {
  try {
    const { status } = req.body;
    await prisma.transaction.update({
      where: { id: req.params.id },
      data: { status }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Status update error:', error);
    res.status(500).json({ error: 'Failed to update status' });
  }
});

// PATCH update payment status
router.patch('/:id/payment', authenticate, async (req, res) => {
  try {
    const { paymentStatus, paymentMethod } = req.body;
    await prisma.transaction.update({
      where: { id: req.params.id },
      data: { paymentStatus, paymentMethod }
    });
    res.json({ success: true });
  } catch (error) {
    console.error('Payment update error:', error);
    res.status(500).json({ error: 'Failed to update payment' });
  }
});

// Offline sync endpoint
router.post('/offline-sync', authenticate, async (req, res) => {
  try {
    const { 
      customerId, 
      customerName, 
      customerPhone, 
      weight, 
      serviceType, 
      pricePerUnit, 
      discount, 
      notes, 
      paymentMethod 
    } = req.body;
    
    if (!req.user || !req.user.id) {
      return res.status(401).json({ error: 'User not authenticated' });
    }
    
    const userId = req.user.id;
    const finalWeight = convertWeight(weight);
    
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
    
    const subtotal = finalWeight * pricePerUnit;
    const total = subtotal - (discount || 0);
    const invoiceCode = `INV/${new Date().getFullYear()}${String(new Date().getMonth() + 1).padStart(2, '0')}/${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    const transaction = await prisma.transaction.create({
      data: {
        invoiceCode,
        customerId: finalCustomerId,
        userId: userId,
        weight: finalWeight,
        serviceType,
        pricePerUnit,
        subtotal,
        discount: discount || 0,
        tax: 0,
        total,
        notes: notes || '',
        items: [],
        paymentMethod: paymentMethod === 'CASH' ? 'CASH' : 'TRANSFER',
        paymentStatus: paymentMethod === 'CASH' ? 'PAID' : 'UNPAID'
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
    
    console.log(`✅ Offline transaction synced: ${invoiceCode}`);
    
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Offline sync error:', error);
    res.status(500).json({ error: 'Failed to sync offline transaction' });
  }
});

export default router;