import { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { useLanguage } from '../contexts/LanguageContext';
import { 
  User, Globe, Shield, Printer, Database, Key, Bell, Smartphone,
  Save, RefreshCw, Copy, Check, Heart, Building, Phone, Mail, 
  MessageCircle, ExternalLink, Moon, Sun, Monitor, AlertCircle,
  Download, Trash2, Clock, Wifi, Zap, Award, Crown, Star, TrendingUp,
  Package, ShoppingCart, Users, Truck, Bot, MessageSquare, QrCode,
  LayoutDashboard, DollarSign, Calendar as CalendarIcon
} from 'lucide-react';
import toast from 'react-hot-toast';
import api from '../services/api';

const Settings = () => {
  const { user } = useAuth();
  const { theme, setTheme, resolvedTheme } = useTheme();
  const { language, setLanguage } = useLanguage();
  const [activeTab, setActiveTab] = useState('profile');
  const [hardwareId, setHardwareId] = useState('');
  const [licenseInfo, setLicenseInfo] = useState<any>(null);
  const [backups, setBackups] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    totalCustomers: 0,
    totalTransactions: 0,
    totalRevenue: 0,
    iotOnline: 0,
    iotTotal: 14
  });

  useEffect(() => {
    fetchHardwareId();
    fetchLicenseStatus();
    fetchBackups();
    fetchDashboardStats();
  }, []);

  const fetchHardwareId = async () => {
    try {
      const res = await api.get('/license/hardware-id');
      setHardwareId(res.data.hardwareId);
    } catch (error) {
      console.error('Failed to fetch hardware ID:', error);
    }
  };

  const fetchLicenseStatus = async () => {
    try {
      const res = await api.get('/license/status');
      setLicenseInfo(res.data);
    } catch (error) {
      console.error('Failed to fetch license:', error);
    }
  };

  const fetchBackups = async () => {
    try {
      const res = await api.get('/backup/list');
      setBackups(res.data);
    } catch (error) {
      console.error('Failed to fetch backups:', error);
    }
  };

  const fetchDashboardStats = async () => {
    try {
      const [customersRes, transactionsRes, devicesRes] = await Promise.all([
        api.get('/customers'),
        api.get('/transactions'),
        api.get('/devices')
      ]);
      
      const totalRevenue = transactionsRes.data.reduce((sum: number, t: any) => sum + (t.paymentStatus === 'PAID' ? t.total : 0), 0);
      const iotOnline = devicesRes.data.filter((d: any) => d.status === 'ONLINE' || d.status === 'BUSY').length;
      
      setDashboardStats({
        totalCustomers: customersRes.data.length,
        totalTransactions: transactionsRes.data.length,
        totalRevenue: totalRevenue,
        iotOnline: iotOnline,
        iotTotal: devicesRes.data.length || 14
      });
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast.success(`${label} disalin!`);
  };

  const handleBackup = async () => {
    setLoading(true);
    try {
      const res = await api.post('/backup/create');
      toast.success(`Backup berhasil: ${res.data.backupName}`);
      fetchBackups();
    } catch (error) {
      toast.error('Gagal membuat backup');
    } finally {
      setLoading(false);
    }
  };

  const downloadBackup = async (filename: string) => {
    window.open(`/api/backup/download/${filename}`, '_blank');
    toast.success('Download dimulai');
  };

  const deleteBackup = async (filename: string) => {
    if (confirm(`Hapus backup ${filename}?`)) {
      try {
        await api.delete(`/backup/${filename}`);
        toast.success('Backup dihapus');
        fetchBackups();
      } catch (error) {
        toast.error('Gagal hapus backup');
      }
    }
  };

  const tabs = [
    { id: 'profile', label: 'Profil', icon: User, desc: 'Kelola data profil Anda' },
    { id: 'appearance', label: 'Tampilan', icon: Globe, desc: 'Mode terang/gelap' },
    { id: 'language', label: 'Bahasa', icon: Globe, desc: 'Indonesia / English' },
    { id: 'security', label: 'Keamanan', icon: Shield, desc: 'Password & 2FA' },
    { id: 'printer', label: 'Printer', icon: Printer, desc: 'Pengaturan printer thermal' },
    { id: 'backup', label: 'Backup', icon: Database, desc: 'Backup & Restore database' },
    { id: 'license', label: 'Lisensi', icon: Key, desc: 'Informasi lisensi software' },
  ];

  const companyInfo = {
    name: 'PT SALSADILA MAHA KARYA',
    email: 'support@salsadilamahakarya.com',
    phone: '081221723399',
    whatsapp: '081221723399',
    website: 'https://salsadilamahakarya.com',
    address: 'Jl. Merdeka No. 123, Jakarta Pusat',
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Zap className="h-6 w-6 text-yellow-500" />
            Pengaturan Ultimate
            <span className="text-xs bg-gradient-to-r from-blue-600 to-purple-600 text-white px-2 py-1 rounded-full ml-2">Enterprise v3.0</span>
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Konfigurasi sistem dan preferensi aplikasi</p>
        </div>
        <div className="flex gap-2">
          <div className="px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-700 dark:text-green-400 text-sm flex items-center gap-1">
            <Award className="h-4 w-4" /> License: {licenseInfo?.active ? 'Active' : 'Trial'}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2"><Users className="h-5 w-5 text-blue-500" /><p className="text-gray-500 text-sm">Total Pelanggan</p></div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.totalCustomers}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2"><ShoppingCart className="h-5 w-5 text-green-500" /><p className="text-gray-500 text-sm">Total Transaksi</p></div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{dashboardStats.totalTransactions}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2"><DollarSign className="h-5 w-5 text-yellow-500" /><p className="text-gray-500 text-sm">Pendapatan</p></div>
          <p className="text-2xl font-bold text-green-600">Rp {dashboardStats.totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <div className="flex items-center gap-2"><Wifi className="h-5 w-5 text-purple-500" /><p className="text-gray-500 text-sm">IoT Online</p></div>
          <p className="text-2xl font-bold text-purple-600">{dashboardStats.iotOnline}/{dashboardStats.iotTotal}</p>
        </div>
      </div>

      <div className="flex flex-col lg:flex-row gap-6">
        <div className="w-full lg:w-72 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-4 border">
          {tabs.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)} className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-all ${activeTab === tab.id ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-md' : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
              <tab.icon className="h-5 w-5" />
              <div className="text-left flex-1"><div className="font-medium">{tab.label}</div><div className="text-xs opacity-70">{tab.desc}</div></div>
              {activeTab === tab.id && <Crown className="h-3 w-3" />}
            </button>
          ))}
        </div>

        <div className="flex-1 bg-white dark:bg-gray-800 rounded-xl shadow-lg p-6 border">
          {activeTab === 'profile' && (
            <div className="space-y-5">
              <div className="flex justify-between items-start"><div><h3 className="text-lg font-semibold">Informasi Akun</h3><p className="text-sm text-gray-500">Kelola data profil Anda</p></div><div className="bg-gradient-to-r from-blue-500 to-purple-500 w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold">{user?.name?.charAt(0) || 'A'}</div></div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4"><div><label className="block text-sm font-medium mb-1">Nama Lengkap</label><input type="text" defaultValue={user?.name} className="w-full p-2 border rounded-lg dark:bg-gray-700" /></div><div><label className="block text-sm font-medium mb-1">Username</label><input type="text" defaultValue={user?.username} className="w-full p-2 border rounded-lg bg-gray-100" disabled /></div><div><label className="block text-sm font-medium mb-1">Email</label><input type="email" defaultValue={user?.email} className="w-full p-2 border rounded-lg dark:bg-gray-700" /></div><div><label className="block text-sm font-medium mb-1">Role</label><input type="text" defaultValue={user?.role} className="w-full p-2 border rounded-lg bg-gray-100" disabled /></div><div><label className="block text-sm font-medium mb-1">Outlet</label><input type="text" defaultValue={user?.outlet || 'Pusat'} className="w-full p-2 border rounded-lg dark:bg-gray-700" /></div></div>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 flex items-center gap-2"><Save className="h-4 w-4" /> Simpan Perubahan</button>
            </div>
          )}

          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold">Mode Tampilan</h3>
              <div className="grid grid-cols-3 gap-4">
                <button onClick={() => setTheme('light')} className={`p-4 rounded-xl border-2 ${theme === 'light' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} flex flex-col items-center gap-2`}><Sun className="h-8 w-8" /> Light {theme === 'light' && <Check className="h-4 w-4 text-blue-500" />}</button>
                <button onClick={() => setTheme('dark')} className={`p-4 rounded-xl border-2 ${theme === 'dark' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} flex flex-col items-center gap-2`}><Moon className="h-8 w-8" /> Dark {theme === 'dark' && <Check className="h-4 w-4 text-blue-500" />}</button>
                <button onClick={() => setTheme('system')} className={`p-4 rounded-xl border-2 ${theme === 'system' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} flex flex-col items-center gap-2`}><Monitor className="h-8 w-8" /> System {theme === 'system' && <Check className="h-4 w-4 text-blue-500" />}</button>
              </div>
              <div className="p-4 bg-gray-50 rounded-lg"><p className="text-sm">Mode saat ini: <span className="font-semibold text-blue-600">{resolvedTheme === 'light' ? '☀️ Light Mode' : '🌙 Dark Mode'}</span></p></div>
            </div>
          )}

          {activeTab === 'language' && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold">Pilih Bahasa / Select Language</h3>
              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setLanguage('id')} className={`p-4 rounded-xl border-2 ${language === 'id' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} flex flex-col items-center gap-2`}><span className="text-4xl">🇮🇩</span> Bahasa Indonesia {language === 'id' && <Check className="h-4 w-4 text-blue-500" />}</button>
                <button onClick={() => setLanguage('en')} className={`p-4 rounded-xl border-2 ${language === 'en' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'} flex flex-col items-center gap-2`}><span className="text-4xl">🇬🇧</span> English {language === 'en' && <Check className="h-4 w-4 text-blue-500" />}</button>
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold">Keamanan Akun</h3>
              <div><label className="block text-sm font-medium mb-1">Password Lama</label><input type="password" className="w-full max-w-md p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Password Baru</label><input type="password" className="w-full max-w-md p-2 border rounded-lg" /></div>
              <div><label className="block text-sm font-medium mb-1">Konfirmasi Password</label><input type="password" className="w-full max-w-md p-2 border rounded-lg" /></div>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg">Ubah Password</button>
              <div className="p-4 bg-yellow-50 rounded-lg"><AlertCircle className="h-4 w-4 inline mr-2 text-yellow-600" /><span className="text-sm">Gunakan minimal 8 karakter dengan kombinasi huruf, angka, dan simbol.</span></div>
            </div>
          )}

          {activeTab === 'printer' && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold">Pengaturan Printer Thermal</h3>
              <div><label className="block text-sm font-medium mb-1">Tipe Printer</label><select className="w-full max-w-md p-2 border rounded-lg"><option>Thermal Printer (58mm)</option><option>Thermal Printer (80mm)</option></select></div>
              <div><label className="block text-sm font-medium mb-1">Port / Koneksi</label><select className="w-full max-w-md p-2 border rounded-lg"><option>USB (Auto-detect)</option><option>Network (Ethernet)</option><option>Bluetooth</option></select></div>
              <div><label className="flex items-center gap-2"><input type="checkbox" className="rounded" /> Cetak struk otomatis setelah transaksi</label></div>
              <button className="bg-blue-600 text-white px-6 py-2 rounded-lg">Simpan Pengaturan</button>
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold">Backup & Restore Database</h3>
              <button onClick={handleBackup} disabled={loading} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Download className="h-4 w-4" /> {loading ? 'Processing...' : 'Backup Sekarang'}</button>
              {backups.length > 0 && (
                <div className="mt-4"><h4 className="font-medium mb-2">Riwayat Backup</h4><div className="space-y-2 max-h-64 overflow-y-auto">{backups.map((b) => (<div key={b.name} className="flex justify-between items-center p-3 bg-gray-50 rounded-lg"><div><p className="font-medium text-sm">{b.name}</p><p className="text-xs text-gray-500">{new Date(b.createdAt).toLocaleString()} • {(b.size / 1024).toFixed(2)} KB</p></div><div className="flex gap-2"><button onClick={() => downloadBackup(b.name)} className="text-blue-600 text-sm">Download</button><button onClick={() => deleteBackup(b.name)} className="text-red-600 text-sm">Hapus</button></div></div>))}</div></div>
              )}
              <p className="text-xs text-gray-400">* Backup otomatis setiap hari pukul 02:00</p>
            </div>
          )}

          {activeTab === 'license' && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold">Informasi Lisensi</h3>
              <div className="p-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg"><div className="flex justify-between items-center"><div><p className="text-sm text-gray-500">Status Lisensi</p><p className={`text-xl font-bold ${licenseInfo?.active ? 'text-green-600' : 'text-red-600'}`}>{licenseInfo?.active ? '✅ AKTIF' : '❌ TIDAK AKTIF'}</p></div><Award className="h-8 w-8 text-yellow-500" /></div></div>
              <div className="p-3 bg-gray-100 rounded-lg"><p className="text-sm font-medium mb-1">🔑 Hardware ID:</p><code className="text-xs font-mono break-all">{hardwareId || 'Loading...'}</code><button onClick={() => copyToClipboard(hardwareId, 'Hardware ID')} className="mt-2 text-sm text-blue-600 flex items-center gap-1"><Copy className="h-3 w-3" /> Salin Hardware ID</button></div>
            </div>
          )}

          <div className="mt-8 pt-6 border-t">
            <div className="flex flex-col items-center text-center space-y-3">
              <div className="flex items-center gap-2"><Heart className="h-5 w-5 text-red-500 fill-red-500" /><span className="text-sm text-gray-500">Powered by</span><span className="font-bold text-gray-900 dark:text-white">{companyInfo.name}</span></div>
              <p className="text-xs text-gray-400">© 2024-2025 {companyInfo.name}. All rights reserved. | Laundry Ultimate Enterprise v3.0</p>
              <div className="flex items-center gap-4 flex-wrap justify-center">
                <div className="flex items-center gap-2 text-sm text-gray-600"><Building className="h-4 w-4" /> {companyInfo.name}</div>
                <div className="flex items-center gap-2 text-sm text-gray-600"><Phone className="h-4 w-4" /> {companyInfo.phone}</div>
                <div className="flex items-center gap-2 text-sm text-gray-600"><Mail className="h-4 w-4" /> {companyInfo.email}</div>
              </div>
              <div className="flex items-center gap-3 mt-2">
                <button onClick={() => copyToClipboard(companyInfo.phone, 'WhatsApp')} className="flex items-center gap-2 px-3 py-1.5 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm transition-all"><MessageCircle className="h-4 w-4" /> WhatsApp</button>
                <button onClick={() => window.open('https://wa.me/6281221723399', '_blank')} className="flex items-center gap-2 px-3 py-1.5 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm transition-all"><ExternalLink className="h-4 w-4" /> Hubungi Kami</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;