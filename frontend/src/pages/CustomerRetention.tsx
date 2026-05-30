import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useOutlet } from '../contexts/OutletContext';
import { 
  Users, UserCheck, UserPlus, UserX, TrendingUp, TrendingDown,
  Calendar, Award, Crown, Star, Zap, Download, RefreshCw,
  BarChart3, PieChart, Activity, Clock
} from 'lucide-react';
import { format, subDays, subMonths, differenceInDays } from 'date-fns';
import { id } from 'date-fns/locale';
import toast from 'react-hot-toast';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart as RePieChart, Pie, Cell } from 'recharts';

interface RetentionData {
  loyalCustomers: number;
  newCustomers: number;
  inactiveCustomers: number;
  totalCustomers: number;
  retentionRate: number;
  churnRate: number;
  customerSegments: Array<{ name: string; value: number; color: string }>;
  monthlyTrend: Array<{ month: string; new: number; loyal: number }>;
  topCustomers: Array<{ id: string; name: string; phone: string; totalOrders: number; totalSpent: number; lastOrder: string }>;
}

const CustomerRetention = () => {
  const { token } = useAuth();
  const { currentOutlet } = useOutlet();
  const [data, setData] = useState<RetentionData | null>(null);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState('30'); // days

  useEffect(() => {
    fetchRetentionData();
  }, [currentOutlet, period]);

  const fetchRetentionData = async () => {
    setLoading(true);
    try {
      const response = await api.get('/reports/customer-retention', {
        params: { outletId: currentOutlet?.id, days: period }
      });
      setData(response.data);
    } catch (error) {
      console.error('Failed to fetch retention data:', error);
      toast.error('Gagal memuat data retensi pelanggan');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = async () => {
    try {
      const response = await api.get('/reports/customer-retention/export', {
        params: { outletId: currentOutlet?.id, days: period },
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `customer_retention_${format(new Date(), 'yyyy-MM-dd')}.xlsx`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Laporan berhasil diunduh');
    } catch (error) {
      toast.error('Gagal mengunduh laporan');
    }
  };

  const COLORS = ['#10b981', '#3b82f6', '#ef4444', '#f59e0b', '#8b5cf6'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const statCards = [
    { 
      title: 'Total Pelanggan', 
      value: data?.totalCustomers || 0, 
      icon: Users, 
      color: 'bg-blue-500',
      bg: 'bg-blue-100 dark:bg-blue-900/30 text-blue-600'
    },
    { 
      title: 'Pelanggan Setia', 
      value: data?.loyalCustomers || 0, 
      icon: Crown, 
      color: 'bg-yellow-500',
      bg: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600',
      subtitle: 'Transaksi > 5x'
    },
    { 
      title: 'Pelanggan Baru', 
      value: data?.newCustomers || 0, 
      icon: UserPlus, 
      color: 'bg-green-500',
      bg: 'bg-green-100 dark:bg-green-900/30 text-green-600',
      subtitle: '30 hari terakhir'
    },
    { 
      title: 'Tidak Aktif', 
      value: data?.inactiveCustomers || 0, 
      icon: UserX, 
      color: 'bg-red-500',
      bg: 'bg-red-100 dark:bg-red-900/30 text-red-600',
      subtitle: '> 60 hari'
    },
  ];

  const rateCards = [
    {
      title: 'Retention Rate',
      value: `${data?.retentionRate || 0}%`,
      icon: UserCheck,
      color: 'text-green-600',
      bg: 'bg-green-100 dark:bg-green-900/30',
      trend: '+5% dari bulan lalu'
    },
    {
      title: 'Churn Rate',
      value: `${data?.churnRate || 0}%`,
      icon: UserX,
      color: 'text-red-600',
      bg: 'bg-red-100 dark:bg-red-900/30',
      trend: '-2% dari bulan lalu'
    }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users className="h-6 w-6 text-blue-600" /> Customer Retention
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            Analisis loyalitas dan retensi pelanggan
          </p>
        </div>
        <div className="flex gap-2">
          <select value={period} onChange={(e) => setPeriod(e.target.value)} className="px-3 py-2 border rounded-lg dark:bg-gray-700">
            <option value="30">30 Hari Terakhir</option>
            <option value="60">60 Hari Terakhir</option>
            <option value="90">90 Hari Terakhir</option>
            <option value="180">6 Bulan Terakhir</option>
            <option value="365">1 Tahun Terakhir</option>
          </select>
          <button onClick={fetchRetentionData} className="px-3 py-2 bg-gray-200 dark:bg-gray-700 rounded-lg flex items-center gap-2">
            <RefreshCw className="h-4 w-4" /> Refresh
          </button>
          <button onClick={handleExport} className="px-3 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
            <Download className="h-4 w-4" /> Export
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-5 border cursor-pointer active:scale-[0.98]">
            <div className="flex justify-between items-start">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{card.title}</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white mt-1">{card.value}</p>
                {card.subtitle && <p className="text-xs text-gray-400 mt-1">{card.subtitle}</p>}
              </div>
              <div className={`p-3 rounded-full ${card.bg}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Rate Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {rateCards.map((card, idx) => (
          <div key={idx} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-5 border">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-gray-500 dark:text-gray-400 text-sm">{card.title}</p>
                <p className={`text-3xl font-bold ${card.color} mt-1`}>{card.value}</p>
                <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
                  <TrendingUp className="h-3 w-3 text-green-600" /> {card.trend}
                </p>
              </div>
              <div className={`p-3 rounded-full ${card.bg}`}>
                <card.icon className="h-6 w-6" />
              </div>
            </div>
            <div className="mt-3">
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div className={`h-2 rounded-full ${idx === 0 ? 'bg-green-500' : 'bg-red-500'}`} style={{ width: `${idx === 0 ? data?.retentionRate || 0 : data?.churnRate || 0}%` }}></div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Customer Trend */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" /> Tren Pelanggan
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={data?.monthlyTrend || []}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="month" />
              <YAxis />
              <Tooltip />
              <Line type="monotone" dataKey="new" stroke="#10b981" strokeWidth={2} name="Pelanggan Baru" />
              <Line type="monotone" dataKey="loyal" stroke="#3b82f6" strokeWidth={2} name="Pelanggan Setia" />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Customer Segments */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
          <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <PieChart className="h-5 w-5 text-purple-600" /> Segmen Pelanggan
          </h3>
          <ResponsiveContainer width="100%" height={300}>
            <RePieChart>
              <Pie
                data={data?.customerSegments || []}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                label
              >
                {(data?.customerSegments || []).map((entry: any, index: number) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </RePieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-4">
            {(data?.customerSegments || []).map((segment, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: COLORS[idx % COLORS.length] }}></div>
                <span className="text-sm">{segment.name}: {segment.value} pelanggan</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Top Customers */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
        <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <Award className="h-5 w-5 text-yellow-500" /> Top 10 Pelanggan Setia
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50">
              <tr>
                <th className="text-left px-4 py-3">Nama</th>
                <th className="text-left px-4 py-3">No. HP</th>
                <th className="text-center px-4 py-3">Total Order</th>
                <th className="text-right px-4 py-3">Total Belanja</th>
                <th className="text-left px-4 py-3">Terakhir Order</th>
              </tr>
            </thead>
            <tbody>
              {data?.topCustomers?.map((customer) => (
                <tr key={customer.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-4 py-3 font-medium">{customer.name}</td>
                  <td className="px-4 py-3">{customer.phone}</td>
                  <td className="px-4 py-3 text-center">{customer.totalOrders} kali</td>
                  <td className="px-4 py-3 text-right font-semibold text-green-600">Rp {customer.totalSpent.toLocaleString()}</td>
                  <td className="px-4 py-3 text-sm text-gray-500">{format(new Date(customer.lastOrder), 'dd MMM yyyy', { locale: id })}</td>
                </tr>
              ))}
              {(!data?.topCustomers || data.topCustomers.length === 0) && (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Belum ada data pelanggan</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Retention Tips */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-semibold flex items-center gap-2"><Zap className="h-5 w-5 text-yellow-300" /> Tips Meningkatkan Retensi Pelanggan</h3>
            <ul className="mt-3 space-y-2 text-sm opacity-90">
              <li>✅ • Berikan program loyalitas (poin member)</li>
              <li>✅ • Kirim notifikasi promo khusus pelanggan setia via WhatsApp</li>
              <li>✅ • Tawarkan diskon untuk pelanggan yang sudah lama tidak transaksi</li>
              <li>✅ • Layanan antar jemput gratis untuk pelanggan dengan transaksi rutin</li>
            </ul>
          </div>
          <div className="bg-white/20 rounded-lg px-4 py-2 text-center">
            <p className="text-2xl font-bold">{data?.retentionRate || 0}%</p>
            <p className="text-xs opacity-80">Retention Rate</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CustomerRetention;