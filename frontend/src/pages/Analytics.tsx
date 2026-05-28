import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useOutlet } from '../contexts/OutletContext';
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingBag, Clock, Zap, Award, Calendar, Target, BarChart3, PieChart, Activity } from 'lucide-react';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart as RePieChart, Pie, Cell } from 'recharts';

const Analytics = () => {
  const { token } = useAuth();
  const { currentOutlet } = useOutlet();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('6months');

  useEffect(() => {
    fetchAnalytics();
  }, [currentOutlet, period]);

  const fetchAnalytics = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/analytics', {
        params: { outletId: currentOutlet?.id, period }
      });
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch analytics:', error);
      toast.error('Gagal memuat data analytics');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const predictions = data?.predictions || [];
  const insights = data?.insights || {};
  const serviceDistribution = data?.serviceDistribution || [];
  const monthlyTrend = data?.monthlyTrend || [];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-blue-600" /> Analytics & Prediksi AI
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Analisis data dan prediksi pendapatan dengan kecerdasan buatan</p>
        </div>
        <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-3 py-2 border rounded-lg dark:bg-gray-700">
          <option value="3months">3 Bulan Terakhir</option>
          <option value="6months">6 Bulan Terakhir</option>
          <option value="12months">1 Tahun Terakhir</option>
        </select>
      </div>

      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-5 text-white">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <div className="flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-300" /><span className="text-sm opacity-80">AI Prediction Engine</span></div>
            <p className="text-2xl font-bold mt-1">Model prediksi akurasi {data?.accuracy || 85}%</p>
            <p className="text-sm opacity-80 mt-1">Berdasarkan data {data?.totalTransactions || 0} transaksi</p>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
            <p className="text-2xl font-bold">+{data?.projectedGrowth || 0}%</p>
            <p className="text-xs opacity-80">Proyeksi growth</p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {predictions.length > 0 ? predictions.slice(0, 3).map((pred: any, idx: number) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border hover:shadow-md transition-all cursor-pointer">
            <p className="text-gray-500 dark:text-gray-400 text-sm">{pred.month}</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">Rp {pred.predicted?.toLocaleString() || 0}</p>
            <p className={`text-sm mt-2 flex items-center gap-1 ${(pred.growth || 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {(pred.growth || 0) >= 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
              {(pred.growth || 0) >= 0 ? `+${pred.growth}%` : `${pred.growth}%`}
            </p>
            <div className="mt-3 h-1 bg-gray-200 dark:bg-gray-700 rounded-full"><div className="w-3/4 h-1 bg-green-500 rounded-full"></div></div>
            <p className="text-xs text-gray-400 mt-2">Prediksi berdasarkan {pred.basedOn || 0} transaksi</p>
          </div>
        )) : (
          <div className="col-span-3 text-center py-8 text-gray-500">Belum ada data untuk prediksi</div>
        )}
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30"><Award className="h-5 w-5 text-yellow-600" /></div><div><p className="text-gray-500 text-xs">Pelanggan Teratas</p><p className="font-semibold">{insights?.topCustomer?.name || '-'}</p><p className="text-xs text-gray-400">{insights?.topCustomer?.totalOrders || 0} transaksi</p></div></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-orange-100 dark:bg-orange-900/30"><Clock className="h-5 w-5 text-orange-600" /></div><div><p className="text-gray-500 text-xs">Jam Sibuk</p><p className="font-semibold">{insights?.peakHour || '-'}</p><p className="text-xs text-gray-400">{insights?.peakHourPercentage || 0}% transaksi</p></div></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><Calendar className="h-5 w-5 text-green-600" /></div><div><p className="text-gray-500 text-xs">Hari Terbaik</p><p className="font-semibold">{insights?.bestDay || '-'}</p><p className="text-xs text-gray-400">Rata-rata {insights?.bestDayAvg || 0} transaksi</p></div></div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3"><div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Target className="h-5 w-5 text-purple-600" /></div><div><p className="text-gray-500 text-xs">Layanan Favorit</p><p className="font-semibold">{insights?.favoriteService || '-'}</p><p className="text-xs text-gray-400">{insights?.favoriteServicePercentage || 0}% dari total</p></div></div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Activity className="h-5 w-5 text-blue-600" /> Tren Pendapatan & Prediksi</h3>
          {monthlyTrend.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={monthlyTrend}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="actual" stroke="#3b82f6" strokeWidth={2} name="Aktual" />
                <Line type="monotone" dataKey="predicted" stroke="#f59e0b" strokeWidth={2} strokeDasharray="5 5" name="Prediksi" />
              </LineChart>
            </ResponsiveContainer>
          ) : (<div className="h-72 flex items-center justify-center text-gray-500">Belum ada data</div>)}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><PieChart className="h-5 w-5 text-purple-600" /> Distribusi Layanan</h3>
          {serviceDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <RePieChart>
                <Pie data={serviceDistribution} cx="50%" cy="50%" innerRadius={60} outerRadius={100} fill="#8884d8" dataKey="value" label>
                  {serviceDistribution.map((entry: any, index: number) => (<Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />))}
                </Pie>
                <Tooltip />
              </RePieChart>
            </ResponsiveContainer>
          ) : (<div className="h-72 flex items-center justify-center text-gray-500">Belum ada data</div>)}
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {serviceDistribution.map((item: any, idx: number) => (
              <div key={idx} className="flex items-center gap-2"><div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div><span className="text-sm">{item.name}: {item.percentage || 0}%</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="bg-yellow-50 dark:bg-yellow-900/20 border-l-4 border-yellow-400 p-4 rounded-lg">
        <div className="flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-600" /><span className="font-semibold text-yellow-800 dark:text-yellow-300">Rekomendasi AI</span></div>
        <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">{data?.recommendation || 'Belum ada data yang cukup untuk rekomendasi.'}</p>
      </div>
    </div>
  );
};

export default Analytics;