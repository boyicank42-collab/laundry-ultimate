import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useOutlet } from '../contexts/OutletContext';
import { Clock, Calendar, TrendingUp, Download, RefreshCw, Zap, AlertTriangle, DollarSign, BarChart3, TrendingDown } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Cell } from 'recharts';
import toast from 'react-hot-toast';

const PeakHourAnalysis = () => {
  const { token } = useAuth();
  const { currentOutlet } = useOutlet();
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('week');

  useEffect(() => {
    fetchData();
  }, [currentOutlet, period]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const res = await api.get('/reports/peak-hour', {
        params: { outletId: currentOutlet?.id, period }
      });
      setData(res.data);
    } catch (error) {
      console.error('Error fetching peak hour:', error);
      toast.error('Gagal memuat data peak hour');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (!data) return;
    const exportData = {
      period,
      totalTransactions: data.totalTransactions,
      totalRevenue: data.totalRevenue,
      peakHour: data.peakHour,
      peakDay: data.peakDay,
      hourlyDistribution: data.hourlyDistribution,
      dailyDistribution: data.dailyDistribution
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `peak_hour_analysis_${period}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Data berhasil diekspor');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const maxCount = Math.max(...(data?.hourlyDistribution?.map((h: any) => h.count) || [0]));

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Clock className="h-6 w-6 text-blue-600" /> Peak Hour Intelligence
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Analisis cerdas jam sibuk untuk optimalisasi operasional laundry</p>
        </div>
        <div className="flex gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-3 py-2 border rounded-lg dark:bg-gray-700">
            <option value="week">7 Hari Terakhir</option>
            <option value="month">30 Hari Terakhir</option>
            <option value="all">Semua Data</option>
          </select>
          <button onClick={fetchData} className="bg-gray-200 dark:bg-gray-700 p-2 rounded-lg"><RefreshCw className="h-4 w-4" /></button>
          <button onClick={handleExport} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2"><Download className="h-4 w-4" /> Export</button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <p className="text-gray-500 text-sm">Total Transaksi</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{data?.totalTransactions || 0}</p>
          <p className="text-xs text-gray-400">periode ini</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <p className="text-gray-500 text-sm">Total Pendapatan</p>
          <p className="text-2xl font-bold text-green-600">Rp {(data?.totalRevenue || 0).toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <p className="text-gray-500 text-sm">Jam Sibuk</p>
          <p className="text-2xl font-bold text-yellow-600">{data?.peakHour?.time || '-'}</p>
          <p className="text-xs text-gray-400">{data?.peakHour?.count || 0} transaksi</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <p className="text-gray-500 text-sm">Hari Sibuk</p>
          <p className="text-2xl font-bold text-purple-600">{data?.peakDay?.day || '-'}</p>
          <p className="text-xs text-gray-400">{data?.peakDay?.count || 0} transaksi</p>
        </div>
      </div>

      {/* Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Distribusi Transaksi per Jam</h3>
          <div className="text-right">
            <p className="text-sm text-gray-500">Rata-rata per jam</p>
            <p className="text-xl font-bold text-blue-600">{data?.avgPerHour || 0} transaksi</p>
          </div>
        </div>
        {data?.hourlyDistribution && data.hourlyDistribution.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={data.hourlyDistribution}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="hour" tickFormatter={(h) => `${h}:00`} />
              <YAxis />
              <Tooltip formatter={(value) => [`${value} transaksi`, 'Jumlah']} />
              <Bar dataKey="count" fill="#3b82f6" radius={[8,8,0,0]}>
                {data.hourlyDistribution.map((entry: any, idx: number) => (
                  <Cell key={idx} fill={entry.count === data?.peakHour?.count ? '#f59e0b' : '#3b82f6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        ) : (
          <div className="h-80 flex items-center justify-center text-gray-500">Belum ada data transaksi</div>
        )}
        <div className="mt-4 text-center text-sm text-gray-500">
          <span className="inline-flex items-center gap-1"><div className="w-3 h-3 bg-blue-500 rounded-full"></div> Transaksi</span>
          {data?.peakHour && data.peakHour.count > 0 && (
            <span className="ml-4 inline-flex items-center gap-1"><div className="w-3 h-3 bg-yellow-500 rounded-full"></div> Puncak ({data.peakHour.time})</span>
          )}
        </div>
      </div>

      {/* Daily Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Calendar className="h-5 w-5 text-green-600" /> Distribusi per Hari</h3>
          {data?.dailyDistribution && data.dailyDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={data.dailyDistribution} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="day" type="category" width={80} />
                <Tooltip formatter={(value) => [`${value} transaksi`, 'Jumlah']} />
                <Bar dataKey="count" fill="#10b981" radius={[0, 8, 8, 0]}>
                  {data.dailyDistribution.map((entry: any, idx: number) => (
                    <Cell key={idx} fill={entry.count === data?.peakDay?.count ? '#f59e0b' : '#10b981'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">Belum ada data</div>
          )}
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><DollarSign className="h-5 w-5 text-green-600" /> Pendapatan per Hari</h3>
          {data?.dailyDistribution && data.dailyDistribution.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={data.dailyDistribution}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(v) => `Rp ${(v/1000).toFixed(0)}k`} />
                <Tooltip formatter={(value) => [`Rp ${value.toLocaleString()}`, 'Pendapatan']} />
                <Line type="monotone" dataKey="revenue" stroke="#8b5cf6" strokeWidth={3} dot={{ r: 5, fill: '#8b5cf6' }} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-64 flex items-center justify-center text-gray-500">Belum ada data</div>
          )}
        </div>
      </div>

      {/* Hour Details */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-blue-500" /> Detail per Jam</h3>
        {data?.hourlyDistribution && data.hourlyDistribution.length > 0 ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 max-h-80 overflow-y-auto">
            {data.hourlyDistribution.map((hour: any) => (
              <div key={hour.hour} className={`p-3 rounded-xl text-center transition-all ${hour.hour === data?.peakHour?.hour ? 'bg-yellow-100 dark:bg-yellow-900/30 border-2 border-yellow-500' : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100'}`}>
                <p className="text-lg font-bold">{hour.hour}:00</p>
                <p className="text-2xl font-bold text-blue-600">{hour.count}</p>
                <p className="text-xs text-gray-500">transaksi</p>
                <div className="w-full bg-gray-200 rounded-full h-1 mt-2">
                  <div className="bg-blue-500 h-1 rounded-full" style={{ width: `${(hour.count / maxCount) * 100}%` }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 text-gray-500">Belum ada data transaksi</div>
        )}
      </div>

      {/* Recommendation */}
      <div className={`rounded-xl p-6 border-2 ${data?.totalTransactions === 0 ? 'bg-gray-50 dark:bg-gray-700' : 'bg-gradient-to-r from-blue-600 to-purple-600 text-white'}`}>
        <div className="flex items-start gap-4">
          <div className="p-3 bg-white/20 rounded-full"><Zap className="h-6 w-6" /></div>
          <div>
            <h3 className="text-lg font-semibold">💡 Rekomendasi Operasional</h3>
            <p className="mt-2 text-sm opacity-90">{data?.recommendation || 'Lakukan minimal 10 transaksi untuk analisis yang lebih akurat.'}</p>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border">
          <p className="text-2xl font-bold text-yellow-600">{data?.slowHour?.time || '-'}</p>
          <p className="text-xs text-gray-500">Jam Paling Sepi</p>
          <p className="text-sm">{data?.slowHour?.count || 0} transaksi</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border">
          <p className="text-2xl font-bold text-green-600">{data?.peakDay?.day || '-'}</p>
          <p className="text-xs text-gray-500">Hari Tersibuk</p>
          <p className="text-sm">{data?.peakDay?.count || 0} transaksi</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border">
          <p className="text-2xl font-bold text-purple-600">Rp {Math.round((data?.totalRevenue || 0) / (data?.totalTransactions || 1)).toLocaleString()}</p>
          <p className="text-xs text-gray-500">Rata-rata per Transaksi</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 text-center border">
          <p className="text-2xl font-bold text-orange-600">{data?.avgPerHour || 0}</p>
          <p className="text-xs text-gray-500">Rata-rata per Jam</p>
        </div>
      </div>
    </div>
  );
};

export default PeakHourAnalysis;