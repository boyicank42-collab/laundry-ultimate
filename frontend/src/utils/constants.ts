export const SERVICE_TYPES = {
  KILOAN: { label: 'Cuci Kering', price: 8000, unit: 'kg' },
  SATUAN: { label: 'Cuci Setrika', price: 12000, unit: 'kg' },
  EXPRESS: { label: 'Express (1 Hari)', price: 20000, unit: 'kg' },
  BEDCOVER: { label: 'Bedcover', price: 50000, unit: 'pcs' },
  SEPATU: { label: 'Cuci Sepatu', price: 35000, unit: 'pasang' },
};

export const ORDER_STATUS = {
  PENDING: { label: 'Pending', color: 'bg-yellow-100 text-yellow-800' },
  PROGRESS: { label: 'Proses', color: 'bg-blue-100 text-blue-800' },
  READY: { label: 'Siap', color: 'bg-green-100 text-green-800' },
  COMPLETED: { label: 'Selesai', color: 'bg-gray-100 text-gray-800' },
  CANCELLED: { label: 'Batal', color: 'bg-red-100 text-red-800' },
};

export const PAYMENT_STATUS = {
  UNPAID: { label: 'Belum Bayar', color: 'bg-red-100 text-red-800' },
  PAID: { label: 'Lunas', color: 'bg-green-100 text-green-800' },
  PARTIAL: { label: 'DP', color: 'bg-yellow-100 text-yellow-800' },
};