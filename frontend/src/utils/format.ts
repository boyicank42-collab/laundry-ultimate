export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
};

export const formatDate = (date: string | Date): string => {
  return new Intl.DateTimeFormat('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(date));
};

export const formatInvoiceCode = (code: string): string => {
  return code;
};

export const formatPhoneNumber = (phone: string): string => {
  return phone.replace(/[^0-9]/g, '');
};