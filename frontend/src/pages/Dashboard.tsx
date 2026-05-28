import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { 
  Users, 
  ShoppingBag, 
  DollarSign, 
  Clock,
  TrendingUp,
  Package
} from 'lucide-react';
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer
} from 'recharts';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface DashboardStats {
  totalCustomers: number;
  totalTransactions: number;
  totalRevenue: number;
  todayTransactions: number;
  pendingOrders: number;
  recentTransactions: any[];
  monthlyRevenue: Array<{ month: string; revenue: number }>;
}

const Dashboard = () => {
  const { token } = useAuth();
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    try {
      const response = await axios.get('http://localhost:5002/api/dashboard/stats', {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      setStats(response.data);
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
      // Set default empty stats jika error
      setStats({
        totalCustomers: 0,
        totalTransactions: 0,
        totalRevenue: 0,
        todayTransactions: 0,
        pendingOrders: 0,
        recentTransactions: [],
        monthlyRevenue: []
      });
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  const statCards = [
    {
      title: 'Total Pelanggan',
      value: stats?.totalCustomers || 0,
      icon: Users,
      color: 'bg-blue-500',
      trend: '+0%'
    },
    {
      title: 'Total Transaksi',
      value: stats?.totalTransactions || 0,
      icon: ShoppingBag,
      color: 'bg-green-500',
      trend: '+0%'
    },
    {
      title: 'Pendapatan',
      value: `Rp ${(stats?.totalRevenue || 0).toLocaleString()}`,
      icon: DollarSign,
      color: 'bg-yellow-500',
      trend: '+0%'
    },
    {
      title: 'Pending Order',
      value: stats?.pendingOrders || 0,
      icon: Clock,
      color: 'bg-red-500',
      trend: '0%'
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Dashboard</h1>
        <p className="text-gray-500 mt-1">Selamat datang di sistem laundry enterprise</p>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {statCards.map((card, index) => (
          <div key={index} className="bg-white rounded-xl shadow-sm p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-gray-500 text-sm">{card.title}</p>
                <p className="text-2xl font-bold text-gray-800 mt-1">{card.value}</p>
                <p className="text-green-600 text-sm mt-2">{card.trend}</p>
              </div>
              <div className={`${card.color} p-3 rounded-full`}>
                <card.icon className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Chart */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Trend Pendapatan</h3>
          {stats?.monthlyRevenue && stats.monthlyRevenue.length > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={stats.monthlyRevenue}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="revenue" stroke="#3b82f6" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-300 flex items-center justify-center text-gray-500">
              Belum ada data pendapatan
            </div>
          )}
        </div>

        {/* Recent Transactions */}
        <div className="bg-white rounded-xl shadow-sm p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Transaksi Terbaru</h3>
          <div className="space-y-3">
            {stats?.recentTransactions && stats.recentTransactions.length > 0 ? (
              stats.recentTransactions.slice(0, 5).map((trx) => (
                <div key={trx.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-800">{trx.invoiceCode}</p>
                    <p className="text-sm text-gray-500">{trx.customer?.name || 'Pelanggan'}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-gray-800">Rp {trx.total?.toLocaleString() || 0}</p>
                    <p className="text-xs text-gray-400">
                      {trx.createdAt ? format(new Date(trx.createdAt), 'dd MMM HH:mm', { locale: id }) : '-'}
                    </p>
                  </div>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">Belum ada transaksi</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;