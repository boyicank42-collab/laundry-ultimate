import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'id' | 'en';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Record<string, string>> = {
  id: {
    // General
    'app.name': 'Laundry Ultimate',
    'welcome': 'Selamat datang',
    'logout': 'Keluar',
    'login': 'Masuk',
    'dashboard': 'Dashboard',
    'transactions': 'Transaksi',
    'customers': 'Pelanggan',
    'employees': 'Karyawan',
    'inventory': 'Stok & Inventaris',
    'outlets': 'Multi Outlet',
    'operational_cost': 'Biaya Operasional',
    'profit_loss': 'Laporan Laba Rugi',
    'peak_hour': 'Analisis Jam Sibuk',
    'iot': 'IoT Mesin',
    'wa_broadcast': 'WA Broadcast',
    'chatbot': 'Chatbot WA',
    'premium_reports': 'Laporan Premium',
    'analytics': 'Analytics',
    'membership': 'Membership',
    'pickup_delivery': 'Pickup Delivery',
    'backup': 'Backup & Restore',
    'settings': 'Pengaturan',
    
    // Actions
    'save': 'Simpan',
    'cancel': 'Batal',
    'delete': 'Hapus',
    'edit': 'Edit',
    'add': 'Tambah',
    'search': 'Cari',
    'refresh': 'Refresh',
    'export': 'Ekspor',
    'print': 'Cetak',
    
    // Status
    'pending': 'Pending',
    'progress': 'Proses',
    'ready': 'Siap',
    'completed': 'Selesai',
    'cancelled': 'Batal',
    'paid': 'Lunas',
    'unpaid': 'Belum Bayar',
    'partial': 'DP',
    
    // Messages
    'load_failed': 'Gagal memuat data',
    'save_success': 'Data berhasil disimpan',
    'delete_success': 'Data berhasil dihapus',
    'confirm_delete': 'Yakin ingin menghapus data ini?',
    'network_error': 'Koneksi bermasalah',
    'session_expired': 'Sesi habis, silakan login ulang',
    
    // Transactions
    'invoice': 'No. Invoice',
    'date': 'Tanggal',
    'customer': 'Pelanggan',
    'service_type': 'Jenis Layanan',
    'weight': 'Berat (kg)',
    'subtotal': 'Subtotal',
    'discount': 'Diskon',
    'total': 'Total',
    'payment_method': 'Metode Pembayaran',
    'cash': 'Tunai',
    'qris': 'QRIS',
    'transfer': 'Transfer Bank',
    'online_payment': 'Bayar Online',
    'notes': 'Catatan',
    
    // Units
    'kg': 'kg',
    'pcs': 'pcs',
    'gram': 'gram',
    
    // Days
    'monday': 'Senin',
    'tuesday': 'Selasa',
    'wednesday': 'Rabu',
    'thursday': 'Kamis',
    'friday': 'Jumat',
    'saturday': 'Sabtu',
    'sunday': 'Minggu'
  },
  en: {
    // General
    'app.name': 'Laundry Ultimate',
    'welcome': 'Welcome',
    'logout': 'Logout',
    'login': 'Login',
    'dashboard': 'Dashboard',
    'transactions': 'Transactions',
    'customers': 'Customers',
    'employees': 'Employees',
    'inventory': 'Inventory',
    'outlets': 'Multi Outlet',
    'operational_cost': 'Operational Cost',
    'profit_loss': 'Profit & Loss',
    'peak_hour': 'Peak Hour Analysis',
    'iot': 'IoT Machines',
    'wa_broadcast': 'WA Broadcast',
    'chatbot': 'WA Chatbot',
    'premium_reports': 'Premium Reports',
    'analytics': 'Analytics',
    'membership': 'Membership',
    'pickup_delivery': 'Pickup & Delivery',
    'backup': 'Backup & Restore',
    'settings': 'Settings',
    
    // Actions
    'save': 'Save',
    'cancel': 'Cancel',
    'delete': 'Delete',
    'edit': 'Edit',
    'add': 'Add',
    'search': 'Search',
    'refresh': 'Refresh',
    'export': 'Export',
    'print': 'Print',
    
    // Status
    'pending': 'Pending',
    'progress': 'In Progress',
    'ready': 'Ready',
    'completed': 'Completed',
    'cancelled': 'Cancelled',
    'paid': 'Paid',
    'unpaid': 'Unpaid',
    'partial': 'Partial',
    
    // Messages
    'load_failed': 'Failed to load data',
    'save_success': 'Data saved successfully',
    'delete_success': 'Data deleted successfully',
    'confirm_delete': 'Are you sure you want to delete this data?',
    'network_error': 'Connection error',
    'session_expired': 'Session expired, please login again',
    
    // Transactions
    'invoice': 'Invoice No',
    'date': 'Date',
    'customer': 'Customer',
    'service_type': 'Service Type',
    'weight': 'Weight (kg)',
    'subtotal': 'Subtotal',
    'discount': 'Discount',
    'total': 'Total',
    'payment_method': 'Payment Method',
    'cash': 'Cash',
    'qris': 'QRIS',
    'transfer': 'Bank Transfer',
    'online_payment': 'Pay Online',
    'notes': 'Notes',
    
    // Units
    'kg': 'kg',
    'pcs': 'pcs',
    'gram': 'gram',
    
    // Days
    'monday': 'Monday',
    'tuesday': 'Tuesday',
    'wednesday': 'Wednesday',
    'thursday': 'Thursday',
    'friday': 'Friday',
    'saturday': 'Saturday',
    'sunday': 'Sunday'
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>(() => {
    const saved = localStorage.getItem('language') as Language;
    return saved || 'id';
  });

  useEffect(() => {
    localStorage.setItem('language', language);
    document.documentElement.lang = language;
  }, [language]);

  const t = (key: string): string => {
    return translations[language][key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};

// Language Toggle Component
export const LanguageToggle = () => {
  const { language, setLanguage, t } = useLanguage();
  
  return (
    <button
      onClick={() => setLanguage(language === 'id' ? 'en' : 'id')}
      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
    >
      <span className="text-sm font-medium">{language === 'id' ? '🇮🇩 ID' : '🇬🇧 EN'}</span>
    </button>
  );
};