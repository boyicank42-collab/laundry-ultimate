import webpush from 'web-push';
import { prisma } from '../index.js';

// VAPID Keys (generate once)
const vapidKeys = {
  publicKey: 'BPf3xKZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZxZx',
  privateKey: 'xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx'
};

// Configure web-push
webpush.setVapidDetails(
  'mailto:support@laundryultimate.com',
  vapidKeys.publicKey,
  vapidKeys.privateKey
);

// Subscribe user to push notifications
export async function subscribeUser(subscription: any, userId: string) {
  try {
    await prisma.pushSubscription.upsert({
      where: { userId },
      update: { subscription: JSON.stringify(subscription), updatedAt: new Date() },
      create: { userId, subscription: JSON.stringify(subscription) }
    });
    return { success: true };
  } catch (error) {
    console.error('Subscribe error:', error);
    return { success: false };
  }
}

// Send push notification to user
export async function sendPushNotification(userId: string, title: string, body: string, data?: any) {
  try {
    const subscription = await prisma.pushSubscription.findUnique({
      where: { userId }
    });
    
    if (!subscription) return { success: false, error: 'No subscription found' };
    
    const payload = JSON.stringify({
      title,
      body,
      icon: '/icon-192.png',
      badge: '/badge.png',
      data: data || {},
      timestamp: Date.now()
    });
    
    const result = await webpush.sendNotification(
      JSON.parse(subscription.subscription),
      payload
    );
    
    return { success: true, result };
  } catch (error) {
    console.error('Push notification error:', error);
    return { success: false, error };
  }
}

// Send notification when order status changes
export async function notifyOrderStatus(customerId: string, invoiceCode: string, status: string) {
  const statusMessages = {
    PENDING: 'Menunggu diproses',
    PROGRESS: 'Laundry Anda sedang dicuci',
    READY: 'Laundry Anda siap diambil',
    COMPLETED: 'Transaksi selesai, terima kasih!'
  };
  
  const message = statusMessages[status as keyof typeof statusMessages] || `Status: ${status}`;
  
  await sendPushNotification(customerId, `Status Laundry ${invoiceCode}`, message, {
    type: 'order_status',
    invoiceCode,
    status
  });
}

// Broadcast to all customers
export async function broadcastToAll(title: string, body: string, data?: any) {
  const subscriptions = await prisma.pushSubscription.findMany();
  
  let sent = 0;
  let failed = 0;
  
  for (const sub of subscriptions) {
    const result = await sendPushNotification(sub.userId, title, body, data);
    if (result.success) sent++;
    else failed++;
  }
  
  return { sent, failed };
}