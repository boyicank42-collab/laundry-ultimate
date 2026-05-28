import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Download, Calendar, TrendingUp, DollarSign, Package, Users, Printer, Share2, BarChart3, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { format, subDays, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';

const ReportsPremium = () => {
  const { token } = useAuth();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [reportType, setReportType] = useState('all');

  useEffect(() => {
    fetchSummary();
  }, [dateRange]);

  const fetchSummary = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/summary', {
        params: { startDate: dateRange.start, endDate: dateRange.end }
      });
      setData(res.data);
    } catch (error) {
      console.error('Failed to fetch summary:', error);
      toast.error('Gagal memuat data laporan');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    try {
      const res = await api.get('/reports/export', {
        params: { startDate: dateRange.start, endDate: dateRange.end, format },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan_${dateRange.start}_${dateRange.end}.${format === 'excel' ? 'xlsx' : 'pdf'}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Laporan berhasil diekspor ke ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Gagal mengekspor laporan');
    }
  };

  const quickRanges = [
    { label: 'Hari Ini', get: () => ({ start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
    { label: '7 Hari', get: () => ({ start: format(subDays(new Date(), 7), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
    { label: '30 Hari', get: () => ({ start: format(subDays(new Date(), 30), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
    { label: 'Bulan Ini', get: () => ({ start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  ];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan Premium</h1>
          <p className="text-gray-500 dark:text-gray-400">Generate laporan lengkap dengan data real dari database</p>
        </div>
        <button onClick={fetchSummary} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
          <RefreshCw className="h-4 w-4" /> Refresh Data
        </button>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border flex flex-wrap gap-4 items-center">
        <Calendar className="h-5 w-5 text-gray-400" />
        <div className="flex gap-2">
          {quickRanges.map((range, idx) => (
            <button key={idx} onClick={() => setDateRange(range.get())} className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200">
              {range.label}
            </button>
          ))}
        </div>
        <input type="date" value={dateRange.start} onChange={(e) => setDateRange({...dateRange, start: e.target.value})} className="px-3 py-1.5 border rounded-lg dark:bg-gray-700" />
        <span>s/d</span>
        <input type="date" value={dateRange.end} onChange={(e) => setDateRange({...dateRange, end: e.target.value})} className="px-3 py-1.5 border rounded-lg dark:bg-gray-700" />
        <button onClick={fetchSummary} className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700">Terapkan</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <p className="text-gray-500 text-sm">Total Pendapatan</p>
          <p className="text-2xl font-bold text-green-600">Rp {(data?.revenue || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{data?.transactionCount || 0} transaksi</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <p className="text-gray-500 text-sm">Total Biaya</p>
          <p className="text-2xl font-bold text-red-600">Rp {(data?.cost || 0).toLocaleString()}</p>
          <p className="text-xs text-gray-400 mt-1">{data?.costCount || 0} item biaya</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <p className="text-gray-500 text-sm">Laba Bersih</p>
          <p className={`text-2xl font-bold ${(data?.profit || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            Rp {(data?.profit || 0).toLocaleString()}
          </p>
          <p className="text-xs text-gray-400 mt-1">margin {data?.margin || 0}%</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <p className="text-gray-500 text-sm">Periode</p>
          <p className="text-sm font-medium">{dateRange.start} s/d {dateRange.end}</p>
        </div>
      </div>

      {/* Export Options */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><Download className="h-5 w-5 text-green-600" /> Ekspor Laporan</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <button onClick={() => handleExport('excel')} className="bg-green-600 hover:bg-green-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-all">
            <FileText className="h-5 w-5" /> Excel
          </button>
          <button onClick={() => handleExport('pdf')} className="bg-red-600 hover:bg-red-700 text-white p-3 rounded-lg flex items-center justify-center gap-2 transition-all">
            <FileText className="h-5 w-5" /> PDF
          </button>
          <button className="bg-gray-600 hover:bg-gray-700 text-white p-3 rounded-lg flex items-center justify-center gap-2">
            <Printer className="h-5 w-5" /> Print
          </button>
          <button className="bg-blue-600 hover:bg-blue-700 text-white p-3 rounded-lg flex items-center justify-center gap-2">
            <Share2 className="h-5 w-5" /> Bagikan
          </button>
        </div>
      </div>

      {/* Info Alert */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-lg">
        <p className="text-sm text-blue-700 dark:text-blue-300">
          📊 Data yang ditampilkan adalah data REAL dari database. 
          Gunakan filter tanggal untuk melihat laporan periode tertentu.
        </p>
      </div>
    </div>
  );
};

export default ReportsPremium;