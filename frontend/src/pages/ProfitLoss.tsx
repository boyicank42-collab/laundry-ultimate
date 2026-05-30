import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { DollarSign, TrendingUp, TrendingDown, Calendar, Download, FileText, Printer, Share2, PieChart } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface ProfitLossData {
  revenue: {
    total: number;
    byService: Record<string, number>;
    daily: Array<{ date: string; amount: number }>;
  };
  cost: {
    total: number;
    byCategory: Record<string, number>;
    details: Array<{ category: string; description: string; amount: number; date: string }>;
  };
  profit: {
    gross: number;
    net: number;
    margin: number;
  };
  period: {
    start: string;
    end: string;
  };
}

const ProfitLoss = () => {
  const { token } = useAuth();
  const [data, setData] = useState<ProfitLossData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState({ start: '', end: '' });
  const [exportLoading, setExportLoading] = useState(false);

  useEffect(() => {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth(), 1);
    setPeriod({
      start: format(firstDay, 'yyyy-MM-dd'),
      end: format(today, 'yyyy-MM-dd')
    });
  }, []);

  useEffect(() => {
    if (period.start && period.end) {
      fetchProfitLoss();
    }
  }, [period]);

  const fetchProfitLoss = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/profit-loss', { params: period });
      setData(res.data);
    } catch (error) {
      toast.error('Gagal memuat laporan laba rugi');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async (format: 'excel' | 'pdf') => {
    setExportLoading(true);
    try {
      const res = await api.get('/reports/export', {
        params: { ...period, format },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `laporan_laba_rugi_${period.start}_${period.end}.${format}`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success(`Laporan berhasil diekspor ke ${format.toUpperCase()}`);
    } catch (error) {
      toast.error('Gagal mengekspor laporan');
    } finally {
      setExportLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Laporan Laba Rugi</h1>
          <p className="text-gray-500 dark:text-gray-400">Analisis pendapatan, biaya, dan keuntungan</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => handleExport('excel')} disabled={exportLoading} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><FileText className="h-4 w-4" /> Excel</button>
          <button onClick={() => handleExport('pdf')} disabled={exportLoading} className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><FileText className="h-4 w-4" /> PDF</button>
          <button className="bg-gray-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Printer className="h-4 w-4" /> Print</button>
        </div>
      </div>

      {/* Date Range */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border flex flex-wrap gap-4 items-center">
        <Calendar className="h-5 w-5 text-gray-400" />
        <input type="date" value={period.start} onChange={(e) => setPeriod({...period, start: e.target.value})} className="px-3 py-2 border rounded-lg dark:bg-gray-700" />
        <span>s/d</span>
        <input type="date" value={period.end} onChange={(e) => setPeriod({...period, end: e.target.value})} className="px-3 py-2 border rounded-lg dark:bg-gray-700" />
        <button onClick={fetchProfitLoss} className="bg-blue-600 text-white px-4 py-2 rounded-lg">Tampilkan</button>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-green-200 dark:border-green-800">
          <div className="flex justify-between"><p className="text-gray-500">Total Pendapatan</p><DollarSign className="text-green-600" /></div>
          <p className="text-3xl font-bold text-green-600">Rp {data?.revenue.total.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-2">dari {data?.revenue.daily.length} hari transaksi</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-red-200 dark:border-red-800">
          <div className="flex justify-between"><p className="text-gray-500">Total Biaya</p><TrendingDown className="text-red-600" /></div>
          <p className="text-3xl font-bold text-red-600">Rp {data?.cost.total.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-2">operasional & produksi</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-blue-200 dark:border-blue-800">
          <div className="flex justify-between"><p className="text-gray-500">Laba Bersih</p><TrendingUp className="text-blue-600" /></div>
          <p className="text-3xl font-bold text-blue-600">Rp {data?.profit.net.toLocaleString()}</p>
          <p className="text-sm text-gray-400 mt-2">margin {data?.profit.margin}%</p>
        </div>
      </div>

      {/* Detail */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-600" /> Detail Pendapatan</h3>
          <div className="space-y-3">
            {data?.revenue.byService && Object.entries(data.revenue.byService).map(([key, value]) => (
              <div key={key} className="flex justify-between items-center p-2 border-b"><span>{key}</span><span className="font-semibold">Rp {value.toLocaleString()}</span></div>
            ))}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><TrendingDown className="h-5 w-5 text-red-600" /> Detail Biaya</h3>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {data?.cost.details?.map((cost, idx) => (
              <div key={idx} className="flex justify-between items-center p-2 border-b"><div><span className="font-medium">{cost.category}</span><p className="text-xs text-gray-400">{cost.description}</p></div><span className="font-semibold">Rp {cost.amount.toLocaleString()}</span></div>
            ))}
          </div>
        </div>
      </div>

      {/* Profit Summary */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div><p className="opacity-80 text-sm">Gross Profit</p><p className="text-xl font-bold">Rp {data?.profit.gross.toLocaleString()}</p></div>
          <div><p className="opacity-80 text-sm">Net Profit</p><p className="text-xl font-bold">Rp {data?.profit.net.toLocaleString()}</p></div>
          <div><p className="opacity-80 text-sm">Profit Margin</p><p className="text-xl font-bold">{data?.profit.margin}%</p></div>
          <div><p className="opacity-80 text-sm">Periode</p><p className="text-sm">{period.start} s/d {period.end}</p></div>
        </div>
      </div>
    </div>
  );
};

export default ProfitLoss;