import api from './api';

// Interface untuk transaksi offline
interface OfflineTransaction {
  id: string;
  data: any;
  timestamp: number;
  status: 'pending' | 'synced' | 'failed';
  requiresOnlinePayment?: boolean;
}

// Key untuk localStorage
const STORAGE_KEY = 'offline_transactions';
const PENDING_PAYMENT_KEY = 'pending_online_payments';

// Cek status koneksi
export const isOnline = (): boolean => {
  return navigator.onLine;
};

// Simpan transaksi ke offline storage
export const saveOfflineTransaction = (transactionData: any, requiresOnlinePayment: boolean = false): string => {
  const offlineId = `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  const transactions = getOfflineTransactions();
  
  transactions.push({
    id: offlineId,
    data: { ...transactionData, requiresOnlinePayment },
    timestamp: Date.now(),
    status: 'pending',
    requiresOnlinePayment
  });
  
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  
  // Jika butuh payment online, tambahkan ke queue khusus
  if (requiresOnlinePayment) {
    addToPendingPaymentQueue(offlineId, transactionData);
  }
  
  return offlineId;
};

// Ambil semua transaksi offline
export const getOfflineTransactions = (): OfflineTransaction[] => {
  const stored = localStorage.getItem(STORAGE_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Hapus transaksi offline setelah sync
export const removeOfflineTransaction = (id: string) => {
  const transactions = getOfflineTransactions();
  const filtered = transactions.filter(t => t.id !== id);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
};

// Update status transaksi offline
export const updateOfflineTransactionStatus = (id: string, status: 'synced' | 'failed') => {
  const transactions = getOfflineTransactions();
  const index = transactions.findIndex(t => t.id === id);
  if (index !== -1) {
    transactions[index].status = status;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  }
};

// Tambah ke queue pending payment online
const addToPendingPaymentQueue = (offlineId: string, transactionData: any) => {
  const pending = getPendingOnlinePayments();
  pending.push({
    offlineId,
    transactionId: null,
    data: transactionData,
    customerPhone: transactionData.customerPhone,
    total: transactionData.weight * transactionData.pricePerUnit,
    createdAt: Date.now()
  });
  localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(pending));
};

// Ambil queue pending payment online
export const getPendingOnlinePayments = (): any[] => {
  const stored = localStorage.getItem(PENDING_PAYMENT_KEY);
  return stored ? JSON.parse(stored) : [];
};

// Hapus dari queue setelah payment link dibuat
export const removeFromPendingPaymentQueue = (offlineId: string) => {
  const pending = getPendingOnlinePayments();
  const filtered = pending.filter(p => p.offlineId !== offlineId);
  localStorage.setItem(PENDING_PAYMENT_KEY, JSON.stringify(filtered));
};

// Sinkronisasi transaksi offline ke server
export const syncOfflineTransactions = async (): Promise<{ synced: number; failed: number }> => {
  const transactions = getOfflineTransactions();
  const pendingTransactions = transactions.filter(t => t.status === 'pending');
  
  let synced = 0;
  let failed = 0;
  
  for (const transaction of pendingTransactions) {
    try {
      // Kirim transaksi ke server
      const res = await api.post('/transactions/offline-sync', transaction.data);
      
      // Jika transaksi butuh payment online, buat payment link
      if (transaction.requiresOnlinePayment && res.data.id) {
        try {
          const paymentRes = await api.post('/payment/create', { transactionId: res.data.id });
          // Kirim link WA ke pelanggan
          if (transaction.data.customerPhone) {
            await api.post('/wa-broadcast/send-single', {
              target: transaction.data.customerPhone,
              message: `Halo! Pembayaran laundry Anda dapat dilakukan melalui link berikut:\n${paymentRes.data.paymentUrl}\n\nTotal: Rp ${transaction.data.weight * transaction.data.pricePerUnit}\n\nTerima kasih!`
            });
          }
        } catch (paymentError) {
          console.error('Payment creation failed:', paymentError);
        }
      }
      
      updateOfflineTransactionStatus(transaction.id, 'synced');
      removeFromPendingPaymentQueue(transaction.id);
      synced++;
    } catch (error) {
      updateOfflineTransactionStatus(transaction.id, 'failed');
      failed++;
    }
  }
  
  // Hapus yang sudah synced
  const remaining = getOfflineTransactions().filter(t => t.status !== 'synced');
  localStorage.setItem(STORAGE_KEY, JSON.stringify(remaining));
  
  return { synced, failed };
};

// Buat payment link untuk transaksi pending online
export const createPaymentForPendingTransaction = async (offlineId: string, transactionId: string) => {
  const pending = getPendingOnlinePayments();
  const payment = pending.find(p => p.offlineId === offlineId);
  if (payment && payment.data.customerPhone) {
    const paymentRes = await api.post('/payment/create', { transactionId });
    await api.post('/wa-broadcast/send-single', {
      target: payment.data.customerPhone,
      message: `Link pembayaran laundry Anda:\n${paymentRes.data.paymentUrl}\n\nTotal: Rp ${payment.data.weight * payment.data.pricePerUnit}`
    });
    removeFromPendingPaymentQueue(offlineId);
    return paymentRes.data;
  }
  return null;
};

// Setup event listener untuk koneksi
export const initOfflineListener = (onStatusChange: (isOnline: boolean) => void) => {
  window.addEventListener('online', () => {
    onStatusChange(true);
    syncOfflineTransactions();
  });
  
  window.addEventListener('offline', () => {
    onStatusChange(false);
  });
  
  onStatusChange(isOnline());
};

// Dapatkan jumlah transaksi pending
export const getPendingCount = (): number => {
  return getOfflineTransactions().filter(t => t.status === 'pending').length;
};

// Dapatkan jumlah pending online payment
export const getPendingOnlineCount = (): number => {
  return getPendingOnlinePayments().length;
};