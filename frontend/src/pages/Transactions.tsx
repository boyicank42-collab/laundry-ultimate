import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Search, Plus, Eye, CheckCircle, DollarSign, RefreshCw, ChevronLeft, ChevronRight, Edit2, Save, CreditCard, WifiOff } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';
import { isOnline, saveOfflineTransaction, getPendingCount } from '../services/offlineService';
import ThermalReceiptWrapper from '../components/ThermalReceipt';

interface Transaction {
  id: string;
  invoiceCode: string;
  customer: { id: string; name: string; phone: string };
  serviceType: string;
  weight: number;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  status: string;
  paymentStatus: string;
  pricePerUnit: number;
  createdAt: string;
  notes: string;
}

interface Customer {
  id: string;
  name: string;
  phone: string;
}

const Transactions = () => {
  const { token } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [editPriceMode, setEditPriceMode] = useState(false);
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('CASH');
  const [offlinePending, setOfflinePending] = useState(0);
  const [formData, setFormData] = useState({
    customerId: '',
    serviceType: 'KILOAN',
    weight: 0,
    pricePerUnit: 8000,
    discount: 0,
    notes: ''
  });
  const [weightInput, setWeightInput] = useState('');

  const itemsPerPage = 10;
  const defaultPrices: Record<string, number> = {
    KILOAN: 8000,
    SATUAN: 12000,
    EXPRESS: 20000,
    BEDCOVER: 50000,
    SEPATU: 35000
  };

  // ============================================================
  // FUNGSI KONVERSI KOMA KE TITIK (REAL)
  // ============================================================
  const convertWeightToNumber = (value: string): number => {
    if (!value) return 0;
    // Ganti koma dengan titik
    let cleanValue = value.replace(/,/g, '.');
    // Hapus karakter selain angka dan titik
    cleanValue = cleanValue.replace(/[^0-9.]/g, '');
    // Pastikan hanya satu titik
    const parts = cleanValue.split('.');
    if (parts.length > 2) {
      cleanValue = parts[0] + '.' + parts.slice(1).join('');
    }
    const result = parseFloat(cleanValue);
    return isNaN(result) ? 0 : result;
  };
  // ============================================================

  const handleWeightChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawValue = e.target.value;
    setWeightInput(rawValue);
    const numericValue = convertWeightToNumber(rawValue);
    setFormData({ ...formData, weight: numericValue });
  };

  useEffect(() => {
    fetchTransactions();
    fetchCustomers();
    setOfflinePending(getPendingCount());
    
    const interval = setInterval(() => {
      setOfflinePending(getPendingCount());
    }, 5000);
    
    return () => clearInterval(interval);
  }, [search, statusFilter, paymentFilter]);

  const fetchTransactions = async () => {
    try {
      const res = await api.get('/transactions');
      setTransactions(res.data);
    } catch (error) {
      toast.error('Gagal memuat transaksi');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const handleServiceTypeChange = (serviceType: string) => {
    setFormData({
      ...formData,
      serviceType,
      pricePerUnit: editPriceMode ? formData.pricePerUnit : defaultPrices[serviceType]
    });
  };

  // ============================================================
  // HANDLE SUBMIT DENGAN KONVERSI BERAT
  // ============================================================
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.customerId) {
      toast.error('Pilih pelanggan terlebih dahulu');
      return;
    }
    
    // Konversi berat dari input (support koma dan titik)
    let weightValue = weightInput;
    if (weightValue) {
      weightValue = weightValue.replace(/,/g, '.');
    }
    const finalWeight = parseFloat(weightValue);
    
    if (isNaN(finalWeight) || finalWeight <= 0) {
      toast.error('Berat harus lebih dari 0 (contoh: 1.5 atau 1,5)');
      return;
    }
    
    const submitData = { ...formData, weight: finalWeight };
    
    if (!isOnline()) {
      const transactionData = { ...submitData, paymentMethod: selectedPaymentMethod, timestamp: Date.now() };
      const offlineId = saveOfflineTransaction(transactionData);
      toast.success(`📱 Transaksi disimpan OFFLINE. Akan sync saat online.`);
      setIsModalOpen(false);
      setFormData({ customerId: '', serviceType: 'KILOAN', weight: 0, pricePerUnit: 8000, discount: 0, notes: '' });
      setWeightInput('');
      setEditPriceMode(false);
      setSelectedPaymentMethod('CASH');
      setOfflinePending(getPendingCount());
      return;
    }
    
    try {
      const transactionData = { ...submitData, paymentMethod: selectedPaymentMethod };
      const res = await api.post('/transactions', transactionData);
      toast.success('Transaksi berhasil ditambahkan');
      
      if (selectedPaymentMethod === 'ONLINE') {
        toast.loading('Mempersiapkan pembayaran...');
        const paymentRes = await api.post('/payment/create', { transactionId: res.data.id });
        toast.dismiss();
        window.open(paymentRes.data.paymentUrl, '_blank');
      }
      
      setIsModalOpen(false);
      setFormData({ customerId: '', serviceType: 'KILOAN', weight: 0, pricePerUnit: 8000, discount: 0, notes: '' });
      setWeightInput('');
      setEditPriceMode(false);
      setSelectedPaymentMethod('CASH');
      fetchTransactions();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Gagal menambah transaksi');
    }
  };
  // ============================================================

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/transactions/${id}/status`, { status });
      toast.success('Status transaksi diupdate');
      fetchTransactions();
    } catch (error) {
      toast.error('Gagal update status');
    }
  };

  const updatePayment = async (id: string, paymentStatus: string) => {
    try {
      await api.patch(`/transactions/${id}/payment`, { paymentStatus, paymentMethod: 'CASH' });
      toast.success('Status pembayaran diupdate');
      fetchTransactions();
    } catch (error) {
      toast.error('Gagal update pembayaran');
    }
  };

  const simulatePayment = async (transaction: Transaction) => {
    try {
      await api.patch(`/transactions/${transaction.id}/payment`, { 
        paymentStatus: 'PAID', 
        paymentMethod: 'QRIS' 
      });
      toast.success('✅ Simulasi pembayaran sukses! Status menjadi LUNAS');
      setSelectedTransaction(null);
      fetchTransactions();
    } catch (error) {
      toast.error('Gagal simulasi pembayaran');
    }
  };

  const handleOnlinePayment = async (transaction: Transaction) => {
    try {
      toast.loading('Mempersiapkan pembayaran...');
      const res = await api.post('/payment/create', { transactionId: transaction.id });
      toast.dismiss();
      window.open(res.data.paymentUrl, '_blank');
    } catch (error) {
      toast.dismiss();
      toast.error('Gagal membuat pembayaran online');
    }
  };

  const calculateTotal = () => {
    const weightNumber = convertWeightToNumber(weightInput);
    const subtotal = weightNumber * formData.pricePerUnit;
    const total = subtotal - formData.discount;
    return { subtotal, total };
  };

  const { subtotal, total } = calculateTotal();

  const filteredTransactions = transactions.filter(trx => {
    let match = true;
    if (search) match = match && (trx.invoiceCode?.toLowerCase().includes(search.toLowerCase()) || trx.customer?.name?.toLowerCase().includes(search.toLowerCase()));
    if (statusFilter) match = match && trx.status === statusFilter;
    if (paymentFilter) match = match && trx.paymentStatus === paymentFilter;
    return match;
  });

  const paginatedTransactions = filteredTransactions.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage);

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      PROGRESS: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      READY: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      COMPLETED: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      CANCELLED: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const getPaymentBadge = (status: string) => {
    const styles: Record<string, string> = {
      UNPAID: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      PAID: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      PARTIAL: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400'
    };
    return styles[status] || 'bg-gray-100 text-gray-800';
  };

  const totalRevenue = transactions.reduce((sum, t) => sum + (t.paymentStatus === 'PAID' ? t.total : 0), 0);
  const pendingCount = transactions.filter(t => t.status === 'PENDING').length;
  const todayCount = transactions.filter(t => format(new Date(t.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transaksi Laundry</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola transaksi laundry dengan harga fleksibel</p>
        </div>
        <div className="flex gap-2">
          {!isOnline() && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-700 dark:text-red-400 text-sm">
              <WifiOff className="h-4 w-4" />
              <span>Offline Mode</span>
              {offlinePending > 0 && (
                <span className="ml-1 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs">
                  {offlinePending}
                </span>
              )}
            </div>
          )}
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-95">
            <Plus className="h-5 w-5" /> Transaksi Baru
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Total Pendapatan</p>
          <p className="text-2xl font-bold text-green-600">Rp {totalRevenue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Transaksi Hari Ini</p>
          <p className="text-2xl font-bold text-blue-600">{todayCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Pending Order</p>
          <p className="text-2xl font-bold text-yellow-600">{pendingCount}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Total Transaksi</p>
          <p className="text-2xl font-bold text-purple-600">{transactions.length}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <input type="text" placeholder="Cari invoice / pelanggan..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-10 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:text-white" />
        </div>
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800">
          <option value="">Semua Status</option>
          <option value="PENDING">Pending</option>
          <option value="PROGRESS">Proses</option>
          <option value="READY">Siap</option>
          <option value="COMPLETED">Selesai</option>
          <option value="CANCELLED">Batal</option>
        </select>
        <select value={paymentFilter} onChange={(e) => setPaymentFilter(e.target.value)} className="px-4 py-2 border rounded-lg bg-white dark:bg-gray-800">
          <option value="">Semua Pembayaran</option>
          <option value="UNPAID">Belum Bayar</option>
          <option value="PAID">Lunas</option>
          <option value="PARTIAL">DP</option>
        </select>
        <button onClick={() => { setSearch(''); setStatusFilter(''); setPaymentFilter(''); }} className="px-4 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg">
          <RefreshCw className="h-4 w-4" />
        </button>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-x-auto border">
        <table className="w-full min-w-[800px]">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold">Invoice</th>
              <th className="text-left px-6 py-3">Tanggal</th>
              <th className="text-left px-6 py-3">Pelanggan</th>
              <th className="text-left px-6 py-3">Layanan</th>
              <th className="text-right px-6 py-3">Total</th>
              <th className="text-center px-6 py-3">Status</th>
              <th className="text-center px-6 py-3">Pembayaran</th>
              <th className="text-center px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={8} className="text-center py-12"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></td></tr>
            ) : paginatedTransactions.length === 0 ? (
              <tr><td colSpan={8} className="text-center py-12 text-gray-500">Belum ada transaksi</td></tr>
            ) : (
              paginatedTransactions.map((trx) => (
                <tr key={trx.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 font-medium text-blue-600">{trx.invoiceCode}</td>
                  <td className="px-6 py-4 text-sm">{format(new Date(trx.createdAt), 'dd/MM/yyyy HH:mm', { locale: id })}</td>
                  <td className="px-6 py-4"><p className="font-medium">{trx.customer?.name}</p><p className="text-xs text-gray-500">{trx.customer?.phone}</p></td>
                  <td className="px-6 py-4">{trx.serviceType}</td>
                  <td className="text-right font-semibold">Rp {trx.total?.toLocaleString() || 0}</td>
                  <td className="text-center">
                    <select value={trx.status} onChange={(e) => updateStatus(trx.id, e.target.value)} className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadge(trx.status)} border-0 cursor-pointer`}>
                      <option value="PENDING">Pending</option>
                      <option value="PROGRESS">Proses</option>
                      <option value="READY">Siap</option>
                      <option value="COMPLETED">Selesai</option>
                      <option value="CANCELLED">Batal</option>
                    </select>
                  </td>
                  <td className="text-center">
                    <select value={trx.paymentStatus} onChange={(e) => updatePayment(trx.id, e.target.value)} className={`px-2 py-1 rounded-full text-xs font-semibold ${getPaymentBadge(trx.paymentStatus)} border-0 cursor-pointer`}>
                      <option value="UNPAID">Belum Bayar</option>
                      <option value="PAID">Lunas</option>
                      <option value="PARTIAL">DP</option>
                    </select>
                  </td>
                  <td className="text-center">
                    <button onClick={() => setSelectedTransaction(trx)} className="text-blue-600"><Eye className="h-5 w-5" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex justify-center gap-2 mt-4">
          <button onClick={() => setCurrentPage(p => Math.max(1, p-1))} disabled={currentPage === 1} className="p-2 rounded-lg border disabled:opacity-50"><ChevronLeft className="h-4 w-4" /></button>
          <span className="px-4 py-2 text-sm">Halaman {currentPage} dari {totalPages}</span>
          <button onClick={() => setCurrentPage(p => Math.min(totalPages, p+1))} disabled={currentPage === totalPages} className="p-2 rounded-lg border disabled:opacity-50"><ChevronRight className="h-4 w-4" /></button>
        </div>
      )}

      {/* Modal Tambah Transaksi */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">Transaksi Baru</h2>
              {!isOnline() && (
                <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full flex items-center gap-1">
                  <WifiOff className="h-3 w-3" /> Offline Mode
                </span>
              )}
              <button onClick={() => setEditPriceMode(!editPriceMode)} className="text-sm flex items-center gap-1 text-blue-600">
                {editPriceMode ? <Save className="h-4 w-4" /> : <Edit2 className="h-4 w-4" />}
                {editPriceMode ? 'Simpan Harga' : 'Edit Harga Manual'}
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Pelanggan</label>
                <select value={formData.customerId} onChange={(e) => setFormData({...formData, customerId: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700" required>
                  <option value="">Pilih Pelanggan</option>
                  {customers.map(c => (<option key={c.id} value={c.id}>{c.name} - {c.phone}</option>))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Jenis Layanan</label>
                <select value={formData.serviceType} onChange={(e) => handleServiceTypeChange(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700">
                  <option value="KILOAN">Cuci Kering (Rp 8.000/kg)</option>
                  <option value="SATUAN">Cuci Setrika (Rp 12.000/kg)</option>
                  <option value="EXPRESS">Express 1 Hari (Rp 20.000/kg)</option>
                  <option value="BEDCOVER">Bedcover (Rp 50.000/pcs)</option>
                  <option value="SEPATU">Cuci Sepatu (Rp 35.000/pasang)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Harga per Unit</label>
                <div className="flex items-center gap-2">
                  <span className="text-gray-500">Rp</span>
                  <input type="number" value={formData.pricePerUnit} onChange={(e) => setFormData({...formData, pricePerUnit: parseInt(e.target.value) || 0})} disabled={!editPriceMode} className={`w-full p-2 border rounded-lg dark:bg-gray-700 ${!editPriceMode ? 'bg-gray-100 dark:bg-gray-600' : 'bg-yellow-50 dark:bg-yellow-900/20 border-yellow-400'}`} />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Berat (kg)</label>
                <input 
                  type="text" 
                  inputMode="decimal"
                  placeholder="Contoh: 1.5 atau 1,5"
                  value={weightInput} 
                  onChange={handleWeightChange} 
                  className="w-full p-2 border rounded-lg dark:bg-gray-700" 
                  required 
                />
                <p className="text-xs text-gray-500 mt-1">Gunakan titik (.) atau koma (,) untuk desimal</p>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Diskon (Rp)</label>
                <input type="number" value={formData.discount} onChange={(e) => setFormData({...formData, discount: parseFloat(e.target.value) || 0})} className="w-full p-2 border rounded-lg dark:bg-gray-700" />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">Metode Pembayaran</label>
                <div className="grid grid-cols-2 gap-2">
                  <button type="button" onClick={() => setSelectedPaymentMethod('CASH')} className={`p-3 rounded-lg border flex items-center justify-center gap-2 ${selectedPaymentMethod === 'CASH' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>💰 Tunai</button>
                  <button type="button" onClick={() => setSelectedPaymentMethod('QRIS')} className={`p-3 rounded-lg border flex items-center justify-center gap-2 ${selectedPaymentMethod === 'QRIS' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>📱 QRIS</button>
                  <button type="button" onClick={() => setSelectedPaymentMethod('TRANSFER')} className={`p-3 rounded-lg border flex items-center justify-center gap-2 ${selectedPaymentMethod === 'TRANSFER' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>🏦 Transfer Bank</button>
                  <button type="button" onClick={() => setSelectedPaymentMethod('ONLINE')} className={`p-3 rounded-lg border flex items-center justify-center gap-2 ${selectedPaymentMethod === 'ONLINE' ? 'border-blue-500 bg-blue-50' : 'border-gray-200'}`}>💳 Bayar Online</button>
                </div>
                {!isOnline() && selectedPaymentMethod === 'ONLINE' && (
                  <p className="text-xs text-red-500 mt-1">⚠️ Mode offline, pembayaran online tidak tersedia</p>
                )}
              </div>

              <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg space-y-2">
                <div className="flex justify-between"><span>Subtotal:</span><span>Rp {subtotal.toLocaleString()}</span></div>
                <div className="flex justify-between text-red-500"><span>Diskon:</span><span>-Rp {formData.discount.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t"><span>Total:</span><span className="text-blue-600">Rp {total.toLocaleString()}</span></div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-1">Catatan</label>
                <textarea rows={2} value={formData.notes} onChange={(e) => setFormData({...formData, notes: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700" placeholder="Catatan khusus..." />
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700">
                  {!isOnline() ? '📱 Simpan Offline' : 'Simpan Transaksi'}
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-300 dark:bg-gray-600 dark:text-white p-2 rounded-lg">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Detail Transaksi */}
      {selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl w-full max-w-md p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Detail Transaksi</h2>
              <button onClick={() => setSelectedTransaction(null)} className="text-gray-500">X</button>
            </div>
            <div className="space-y-3">
              <div className="border-b pb-2"><p className="text-sm text-gray-500">No. Invoice</p><p className="font-mono font-semibold text-blue-600">{selectedTransaction.invoiceCode}</p></div>
              <div><p className="text-sm text-gray-500">Pelanggan</p><p className="font-medium">{selectedTransaction.customer?.name}</p><p className="text-sm text-gray-500">{selectedTransaction.customer?.phone}</p></div>
              <div><p className="text-sm text-gray-500">Layanan</p><p>{selectedTransaction.serviceType}</p></div>
              <div><p className="text-sm text-gray-500">Berat</p><p>{selectedTransaction.weight} kg</p></div>
              <div><p className="text-sm text-gray-500">Harga per Unit</p><p>Rp {selectedTransaction.pricePerUnit?.toLocaleString()}</p></div>
              <div className="border-t pt-2">
                <div className="flex justify-between"><span>Subtotal</span><span>Rp {selectedTransaction.subtotal?.toLocaleString()}</span></div>
                <div className="flex justify-between"><span>Diskon</span><span>-Rp {selectedTransaction.discount?.toLocaleString()}</span></div>
                <div className="flex justify-between font-bold text-lg mt-2"><span>Total</span><span>Rp {selectedTransaction.total?.toLocaleString()}</span></div>
              </div>
              <div className="flex flex-wrap gap-2 pt-2">
                <button onClick={() => { updateStatus(selectedTransaction.id, 'COMPLETED'); setSelectedTransaction(null); }} className="flex-1 bg-green-600 text-white py-2 rounded-lg"><CheckCircle className="h-4 w-4 inline mr-1" /> Selesai</button>
                <button onClick={() => { updatePayment(selectedTransaction.id, 'PAID'); setSelectedTransaction(null); }} className="flex-1 bg-blue-600 text-white py-2 rounded-lg"><DollarSign className="h-4 w-4 inline mr-1" /> Bayar Tunai</button>
                <button onClick={() => handleOnlinePayment(selectedTransaction)} className="flex-1 bg-purple-600 text-white py-2 rounded-lg"><CreditCard className="h-4 w-4 inline mr-1" /> Bayar Online</button>
                <button onClick={() => simulatePayment(selectedTransaction)} className="flex-1 bg-yellow-600 text-white py-2 rounded-lg">🧪 Simulasi Bayar (Test)</button>
                <ThermalReceiptWrapper 
                  data={{
                    invoiceCode: selectedTransaction.invoiceCode,
                    date: format(new Date(selectedTransaction.createdAt), 'dd/MM/yyyy HH:mm'),
                    customerName: selectedTransaction.customer?.name || '-',
                    customerPhone: selectedTransaction.customer?.phone || '-',
                    serviceType: selectedTransaction.serviceType,
                    weight: selectedTransaction.weight,
                    pricePerUnit: selectedTransaction.pricePerUnit,
                    subtotal: selectedTransaction.subtotal,
                    discount: selectedTransaction.discount,
                    total: selectedTransaction.total,
                    paymentMethod: (selectedTransaction as any).paymentMethod || 'CASH',
                    paymentStatus: selectedTransaction.paymentStatus,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Transactions;