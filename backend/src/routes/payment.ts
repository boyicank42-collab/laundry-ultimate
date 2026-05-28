import { Router } from 'express';
import { prisma } from '../index.js';
import { authenticate } from '../middleware/auth.js';
import { snap } from '../services/midtrans.js';

const router = Router();

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
    
    const grossAmount = transaction.pricePerUnit * (transaction.weight || 1);
    
    const parameter = {
      transaction_details: {
        order_id: transaction.invoiceCode,
        gross_amount: grossAmount
      },
      credit_card: { secure: true },
      customer_details: {
        first_name: transaction.customer.name,
        phone: transaction.customer.phone,
        email: transaction.customer.email || 'customer@test.com'
      },
      item_details: [{
        id: transaction.serviceType,
        price: transaction.pricePerUnit,
        quantity: transaction.weight || 1,
        name: `Laundry ${transaction.serviceType}`
      }]
    };
    
    const payment = await snap.createTransaction(parameter);
    
    res.json({ 
      success: true, 
      paymentUrl: payment.redirect_url,
      token: payment.token 
    });
  } catch (error) {
    console.error('Payment error:', error);
    res.status(500).json({ error: 'Failed to create payment' });
  }
});

// WEBHOOK untuk Midtrans - endpoint yang benar
router.post('/callback', async (req, res) => {
  try {
    const notification = req.body;
    console.log('🔔 Webhook received:', JSON.stringify(notification, null, 2));
    
    const orderId = notification.order_id;
    const transactionStatus = notification.transaction_status;
    const fraudStatus = notification.fraud_status;
    
    console.log(`Order ID: ${orderId}, Status: ${transactionStatus}, Fraud: ${fraudStatus}`);
    
    if (transactionStatus === 'capture') {
      if (fraudStatus === 'accept') {
        await prisma.transaction.update({
          where: { invoiceCode: orderId },
          data: { paymentStatus: 'PAID' }
        });
        console.log(`✅ Payment confirmed for ${orderId}`);
      }
    } else if (transactionStatus === 'settlement') {
      await prisma.transaction.update({
        where: { invoiceCode: orderId },
        data: { paymentStatus: 'PAID' }
      });
      console.log(`✅ Payment settled for ${orderId}`);
    } else if (transactionStatus === 'deny' || transactionStatus === 'cancel' || transactionStatus === 'expire') {
      await prisma.transaction.update({
        where: { invoiceCode: orderId },
        data: { paymentStatus: 'UNPAID' }
      });
      console.log(`❌ Payment failed for ${orderId}`);
    }
    
    res.sendStatus(200);
  } catch (error) {
    console.error('Webhook error:', error);
    res.sendStatus(500);
  }
});

router.get('/status/:orderId', authenticate, async (req, res) => {
  try {
    const status = await snap.transaction.status(req.params.orderId);
    res.json(status);
  } catch (error) {
    res.status(500).json({ error: 'Failed to get status' });
  }
});

export default router;