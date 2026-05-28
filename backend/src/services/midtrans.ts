import midtransClient from 'midtrans-client';

const snap = new midtransClient.Snap({
  isProduction: false,
  serverKey: process.env.MIDTRANS_SERVER_KEY,
  clientKey: process.env.MIDTRANS_CLIENT_KEY
});

export async function createPayment(transaction: any) {
  // Total item = pricePerUnit x weight (tanpa PPN dan diskon)
  const grossAmount = transaction.pricePerUnit * (transaction.weight || 1);
  
  const parameter = {
    transaction_details: {
      order_id: transaction.invoiceCode,
      gross_amount: grossAmount
    },
    credit_card: {
      secure: true
    },
    customer_details: {
      first_name: transaction.customer.name || 'Customer',
      phone: transaction.customer.phone || '',
      email: transaction.customer.email || 'customer@test.com'
    },
    item_details: [
      {
        id: transaction.serviceType,
        price: transaction.pricePerUnit,
        quantity: transaction.weight || 1,
        name: `Laundry ${transaction.serviceType}`
      }
    ]
  };
  
  console.log('Midtrans Param:', JSON.stringify(parameter, null, 2));
  
  const payment = await snap.createTransaction(parameter);
  return payment;
}

export { snap };