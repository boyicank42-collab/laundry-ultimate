import midtransClient from 'midtrans-client';

// Core API
const core = new midtransClient.CoreApi({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Snap API (untuk payment page)
const snap = new midtransClient.Snap({
  isProduction: process.env.MIDTRANS_IS_PRODUCTION === 'true',
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

// Generate payment link
export async function createPayment(transaction: any) {
  const parameter = {
    transaction_details: {
      order_id: transaction.invoiceCode,
      gross_amount: Math.round(transaction.total)
    },
    credit_card: {
      secure: true
    },
    customer_details: {
      first_name: transaction.customer.name,
      phone: transaction.customer.phone,
      email: transaction.customer.email || `${transaction.customer.phone}@laundry.com`
    },
    item_details: [
      {
        id: transaction.serviceType,
        price: Math.round(transaction.pricePerUnit),
        quantity: transaction.weight || 1,
        name: `Laundry ${transaction.serviceType}`
      }
    ]
  };
  
  const payment = await snap.createTransaction(parameter);
  return payment;
}

// Get payment status
export async function getPaymentStatus(orderId: string) {
  const status = await core.transaction.status(orderId);
  return status;
}

// Handle webhook
export async function handleWebhook(notification: any) {
  const statusResponse = await core.transaction.notification(notification);
  return statusResponse;
}

export { core, snap };