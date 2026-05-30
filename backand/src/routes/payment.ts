import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import { snap } from '../services/midtrans.js';

const router = Router();

// Create payment token/URL
router.post('/create', authenticate, async (req, res) => {
  try {
    const { transactionId } = req.body;
    
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: { customer: true }
    });
    
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    
    // ============================================================
    // SOLUSI UNTUK BERAT DESIMAL (1.5 kg, 2.75 kg, dll)
    // ============================================================
    const weightKg = transaction.weight || 1;
    const weightInt = Math.floor(weightKg); // Bagian bulat (1 kg)
    const weightDecimal = parseFloat((weightKg - weightInt).toFixed(2)); // Bagian desimal (0.5 kg)
    
    const itemDetails: any[] = [];
    
    // Item untuk berat bulat (integer) - AMAN UNTUK MIDTRANS
    if (weightInt > 0) {
      itemDetails.push({
        id: `${transaction.serviceType}_${weightInt}kg`,
        price: transaction.pricePerUnit,
        quantity: weightInt,
        name: `${transaction.serviceType} - ${weightInt} kg`
      });
    }
    
    // Item untuk sisa berat desimal (dijadikan 1 item dengan harga proporsional)
    if (weightDecimal > 0) {
      const decimalPrice = Math.round(transaction.pricePerUnit * weightDecimal);
      itemDetails.push({
        id: `${transaction.serviceType}_${weightDecimal}kg`,
        price: decimalPrice,
        quantity: 1,
        name: `${transaction.serviceType} - ${weightDecimal} kg (${Math.round(weightDecimal * 1000)} gram)`
      });
    }
    
    console.log('📦 Weight breakdown:', {
      original: weightKg,
      integer: weightInt,
      decimal: weightDecimal,
      items: itemDetails,
      total: transaction.total
    });
    
    const parameter = {
      transaction_details: {
        order_id: transaction.invoiceCode,
        gross_amount: Math.round(transaction.total)
      },
      credit_card: { secure: true },
      customer_details: {
        first_name: transaction.customer.name || 'Customer',
        phone: transaction.customer.phone || '08123456789',
        email: transaction.customer.email || 'customer@test.com'
      },
      item_details: itemDetails
    };
    // ============================================================
    
    console.log('📦 Midtrans parameter:', JSON.stringify(parameter, null, 2));
    
    const payment = await snap.createTransaction(parameter);
    
    res.json({ 
      success: true, 
      paymentUrl: payment.redirect_url,
      token: payment.token 
    });
  } catch (error) {
    console.error('❌ Payment error:', error);
    res.status(500).json({ error: 'Failed to create payment', details: error.message });
  }
});

// WEBHOOK untuk Midtrans (tanpa authentication karena dari server Midtrans)
router.post('/callback', async (req, res) => {
  try {
    const notification = req.body;
    console.log('🔔 [WEBHOOK] Received from Midtrans:', JSON.stringify(notification, null, 2));
    
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    const paymentType = notification.payment_type;
    
    console.log(`📝 Order ID: ${orderId}, Status: ${transactionStatus}, Fraud: ${fraudStatus}, Type: ${paymentType}`);
    
    // Mapping status Midtrans ke status aplikasi
    let paymentStatus = 'UNPAID';
    let orderStatus = 'PENDING';
    
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        paymentStatus = 'PAID';
        orderStatus = 'COMPLETED';
        console.log(`✅ Payment capture accepted for ${orderId}`);
      } else {
        paymentStatus = 'UNPAID';
        orderStatus = 'CANCELLED';
        console.log(`❌ Payment capture denied for ${orderId}`);
      }
    } else if (transactionStatus === 'settlement') {
      paymentStatus = 'PAID';
      orderStatus = 'COMPLETED';
      console.log(`✅ Payment settlement for ${orderId}`);
    } else if (transactionStatus === 'pending') {
      paymentStatus = 'UNPAID';
      orderStatus = 'PENDING';
      console.log(`⏳ Payment pending for ${orderId}`);
    } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
      paymentStatus = 'UNPAID';
      orderStatus = 'CANCELLED';
      console.log(`❌ Payment failed for ${orderId}`);
    }
    
    // UPDATE DATABASE - Mengubah status transaksi
    const updatedTransaction = await prisma.transaction.update({
      where: { invoiceCode: orderId },
      data: { 
        paymentStatus: paymentStatus,
        paymentMethod: paymentType || 'MIDTRANS',
        status: orderStatus,
      }
    });
    
    console.log(`✅ [DB] Transaction ${orderId} updated: paymentStatus=${paymentStatus}, status=${orderStatus}`);
    
    // UPDATE CUSTOMER TOTAL SPENT (jika pembayaran sukses)
    if (paymentStatus === 'PAID') {
      await prisma.customer.update({
        where: { id: updatedTransaction.customerId },
        data: {
          totalSpent: { increment: updatedTransaction.total },
          totalOrders: { increment: 1 }
        }
      });
      console.log(`✅ Customer total spent updated for order ${orderId}`);
    }
    
    // Kirim response sukses ke Midtrans
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ [WEBHOOK] Error:', error.message);
    res.status(200).send('OK');
  }
});

// Endpoint notification (sama dengan callback untuk kompatibilitas)
router.post('/notification', async (req, res) => {
  try {
    const notification = req.body;
    console.log('🔔 [NOTIFICATION] Received:', JSON.stringify(notification, null, 2));
    
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    const paymentType = notification.payment_type;
    
    let paymentStatus = 'UNPAID';
    let orderStatus = 'PENDING';
    
    if (transactionStatus === 'capture' && fraudStatus === 'accept') {
      paymentStatus = 'PAID';
      orderStatus = 'COMPLETED';
    } else if (transactionStatus === 'settlement') {
      paymentStatus = 'PAID';
      orderStatus = 'COMPLETED';
    } else if (transactionStatus === 'pending') {
      paymentStatus = 'UNPAID';
      orderStatus = 'PENDING';
    } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
      paymentStatus = 'UNPAID';
      orderStatus = 'CANCELLED';
    }
    
    await prisma.transaction.update({
      where: { invoiceCode: orderId },
      data: { 
        paymentStatus: paymentStatus,
        paymentMethod: paymentType || 'MIDTRANS',
        status: orderStatus,
      }
    });
    
    console.log(`✅ [NOTIFICATION] Transaction ${orderId} updated to ${paymentStatus}`);
    
    res.status(200).send('OK');
  } catch (error) {
    console.error('❌ [NOTIFICATION] Error:', error.message);
    res.status(200).send('OK');
  }
});

// Get payment status
router.get('/status/:orderId', authenticate, async (req, res) => {
  try {
    const status = await snap.transaction.status(req.params.orderId);
    res.json(status);
  } catch (error) {
    console.error('❌ Status error:', error.message);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;