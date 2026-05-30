import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useOutlet } from '../contexts/OutletContext';
import { 
  Users, ShoppingBag, DollarSign, Clock, TrendingUp, TrendingDown, 
  Zap, Calendar, Download, BarChart3, LineChart as LineChartIcon,
  PieChart as PieChartIcon, RefreshCw
} from 'lucide-react';
import { 
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { format, subDays, startOfMonth } from 'date-fns';
import toast from 'react-hot-toast';

const DashboardUltimate = () => {
  const { token } = useAuth();
  const { currentOutlet } = useOutlet();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [dateRange, setDateRange] = useState({
    start: format(startOfMonth(new Date()), 'yyyy-MM-dd'),
    end: format(new Date(), 'yyyy-MM-dd')
  });
  const [chartType, setChartType] = useState<'line' | 'bar' | 'area'>('line');

  useEffect(() => {
    fetchDashboardStats();
  }, [currentOutlet, dateRange]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    try {
      // Gunakan endpoint /dashboard/stats (bukan /dashboard/advanced)
      const response = await api.get('/dashboard/stats', {
        params: { 
          outletId: currentOutlet?.id,
          startDate: dateRange.start,
          endDate: dateRange.end
        }
      });
      
      // Response data dari API
      const data = response.data.data || response.data;
      setStats({
        totalCustomers: data.totalCustomers || 0,
        totalTransactions: data.totalTransactions || 0,
        totalRevenue: data.totalRevenue || 0,
        pendingOrders: data.pendingOrders || 0,
        todayTransactions: data.todayTransactions || 0,
        todayRevenue: data.todayRevenue || 0,
        dailyRevenue: data.dailyRevenue || [],
        outletComparison: data.outletComparison || [],
        serviceDistribution: data.serviceDistribution || [],
        recentTransactions: data.recentTransactions || []
      });
    } catch (error: any) {
      console.error('Failed to fetch dashboard stats:', error);
      toast.error(error.response?.data?.message || 'Gagal memuat data dashboard');
      // Set default empty data
      setStats({
        totalCustomers: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        pendingOrders: 0,
        todayTransactions: 0,
        todayRevenue: 0,
        dailyRevenue: [],
        outletComparison: [],
        serviceDistribution: [],
        recentTransactions: []
      });
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchDashboardStats();
    setRefreshing(false);
    toast.success('Dashboard berhasil direfresh!');
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/dashboard/export', {
        params: {
          startDate: dateRange.start,
          endDate: dateRange.end,
          outletId: currentOutlet?.id
        },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `dashboard_report_${dateRange.start}_${dateRange.end}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Laporan berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh laporan');
    }
  };

  const quickRanges = [
    { label: 'Hari Ini', get: () => ({ start: format(new Date(), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
    { label: '7 Hari', get: () => ({ start: format(subDays(new Date(), 7), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
    { label: '30 Hari', get: () => ({ start: format(subDays(new Date(), 30), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
    { label: 'Bulan Ini', get: () => ({ start: format(startOfMonth(new Date()), 'yyyy-MM-dd'), end: format(new Date(), 'yyyy-MM-dd') }) },
  ];

  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (loading && !refreshing) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { title: 'Total Pelanggan', value: stats?.totalCustomers || 0, icon: Users, iconBg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600' },
    { title: 'Total Transaksi', value: stats?.totalTransactions || 0, icon: ShoppingBag, iconBg: 'bg-green-100 dark:bg-green-900/30 text-green-600' },
    { title: 'Pendapatan', value: `Rp ${(stats?.totalRevenue || 0).toLocaleString()}`, icon: DollarSign, iconBg: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600' },
    { title: 'Pending Order', value: stats?.pendingOrders || 0, icon: Clock, iconBg: 'bg-red-100 dark:bg-red-900/30 text-red-600' },
  ];

  const renderChart = () => {
    const data = stats?.dailyRevenue || [];
    if (data.length === 0) {
      return <div className="flex justify-center items-center h-full text-gray-500">Tidak ada data untuk periode ini</div>;
    }
    if (chartType === 'line') {
      return (
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => `Rp ${(value || 0).toLocaleString()}`} />
          <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
        </LineChart>
      );
    } else if (chartType === 'bar') {
      return (
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => `Rp ${(value || 0).toLocaleString()}`} />
          <Bar dataKey="revenue" fill="#10b981" />
        </BarChart>
      );
    } else {
      return (
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip formatter={(value) => `Rp ${(value || 0).toLocaleString()}`} />
          <Area type="monotone" dataKey="revenue" stroke="#8b5cf6" fill="#8b5cf680" />
        </AreaChart>
      );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Ultimate Dashboard</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {currentOutlet?.name || 'Semua Outlet'} | Analisis interaktif dengan filter tanggal
          </p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
          >
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> 
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button 
            onClick={handleExport} 
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all"
          >
            <Download className="h-4 w-4" /> Export Data
          </button>
          <div className="bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-3 py-1 rounded-full text-sm flex items-center gap-1">
            <Zap className="h-4 w-4" /> AI Active
          </div>
        </div>
      </div>

      {/* Date Range Filter */}
      <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border flex flex-wrap gap-4 items-center">
        <Calendar className="h-5 w-5 text-gray-400" />
        <div className="flex gap-2 flex-wrap">
          {quickRanges.map((range, idx) => (
            <button 
              key={idx} 
              onClick={() => setDateRange(range.get())} 
              className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 transition-all"
            >
              {range.label}
            </button>
          ))}
        </div>
        <input 
          type="date" 
          value={dateRange.start} 
          onChange={(e) => setDateRange({...dateRange, start: e.target.value})} 
          className="px-3 py-1.5 border rounded-lg dark:bg-gray-700" 
        />
        <span>s/d</span>
        <input 
          type="date" 
          value={dateRange.end} 
          onChange={(e) => setDateRange({...dateRange, end: e.target.value})} 
          className="px-3 py-1.5 border rounded-lg dark:bg-gray-700" 
        />
        <button 
          onClick={fetchDashboardStats} 
          className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700"
        >
          Filter
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-5 border cursor-pointer active:scale-[0.98]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
              </div>
              <div className={`p-3 rounded-full ${card.iconBg}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Chart Type Selector */}
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Trend Pendapatan</h3>
        <div className="flex gap-2">
          <button 
            onClick={() => setChartType('line')} 
            className={`p-2 rounded-lg transition-all ${chartType === 'line' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
          >
            <LineChartIcon className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setChartType('bar')} 
            className={`p-2 rounded-lg transition-all ${chartType === 'bar' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
          >
            <BarChart3 className="h-4 w-4" />
          </button>
          <button 
            onClick={() => setChartType('area')} 
            className={`p-2 rounded-lg transition-all ${chartType === 'area' ? 'bg-blue-600 text-white' : 'bg-gray-100 dark:bg-gray-700'}`}
          >
            <PieChartIcon className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Revenue Chart */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
        <ResponsiveContainer width="100%" height={350}>
          {renderChart()}
        </ResponsiveContainer>
      </div>

      {/* Comparison Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Performa per Outlet</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats?.outletComparison || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis />
              <Tooltip formatter={(value) => `Rp ${(value || 0).toLocaleString()}`} />
              <Bar dataKey="revenue" fill="#10b981" />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Distribusi Layanan</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie 
                data={stats?.serviceDistribution || []} 
                cx="50%" 
                cy="50%" 
                innerRadius={60} 
                outerRadius={100} 
                fill="#8884d8" 
                dataKey="value" 
                label
              >
                {(stats?.serviceDistribution || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Recent Transactions */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4">
          Transaksi Terbaru ({dateRange.start} s/d {dateRange.end})
        </h3>
        <div className="space-y-3 max-h-80 overflow-y-auto">
          {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
            stats.recentTransactions.slice(0, 10).map((trx: any) => (
              <div key={trx.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">{trx.invoiceCode || trx.invoice}</p>
                  <p className="text-sm text-gray-500">{trx.customer?.name || trx.customerName || '-'}</p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900 dark:text-white">Rp {(trx.total || 0).toLocaleString()}</p>
                  <p className="text-xs text-gray-400">
                    {trx.createdAt ? format(new Date(trx.createdAt), 'dd MMM yyyy HH:mm') : '-'}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center text-gray-500 py-8">Belum ada transaksi untuk periode ini</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DashboardUltimate;