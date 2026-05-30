import { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, TrendingDown, Calendar, Zap, Droplet, Package, Users, Home, Wrench, MoreVertical, RefreshCw, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Cost {
  id: string;
  category: string;
  description: string;
  amount: number;
  date: string;
}

interface Employee {
  id: string;
  name: string;
  role: string;
  salary: number;
  shift: string;
}

const categoryConfig: Record<string, { label: string; icon: JSX.Element; color: string }> = {
  ELECTRICITY: { label: 'Listrik', icon: <Zap className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400' },
  WATER: { label: 'Air', icon: <Droplet className="h-4 w-4" />, color: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' },
  DETERGENT: { label: 'Deterjen', icon: <Package className="h-4 w-4" />, color: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' },
  FABRIC_SOFTENER: { label: 'Pewangi', icon: <Package className="h-4 w-4" />, color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' },
  SALARY: { label: 'Gaji Karyawan', icon: <Users className="h-4 w-4" />, color: 'bg-indigo-100 text-indigo-700 dark:bg-indigo-900/30 dark:text-indigo-400' },
  RENT: { label: 'Sewa Tempat', icon: <Home className="h-4 w-4" />, color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400' },
  MAINTENANCE: { label: 'Maintenance', icon: <Wrench className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
  OTHER: { label: 'Lainnya', icon: <MoreVertical className="h-4 w-4" />, color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
};

const OperationalCost = () => {
  const [costs, setCosts] = useState<Cost[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCost, setEditingCost] = useState<Cost | null>(null);
  const [totalCost, setTotalCost] = useState(0);
  const [filterMonth, setFilterMonth] = useState(format(new Date(), 'yyyy-MM'));
  const [selectedEmployeeId, setSelectedEmployeeId] = useState('');
  const [formData, setFormData] = useState({
    category: 'OTHER',
    description: '',
    amount: 0,
    date: format(new Date(), 'yyyy-MM-dd')
  });

  useEffect(() => {
    fetchCosts();
    fetchEmployees();
  }, [filterMonth]);

  const fetchCosts = async () => {
    setLoading(true);
    try {
      const res = await api.get('/operational-cost', { params: { month: filterMonth } });
      setCosts(res.data);
      const total = res.data.reduce((sum: number, cost: Cost) => sum + cost.amount, 0);
      setTotalCost(total);
    } catch (error) {
      console.error('Fetch costs error:', error);
      toast.error('Gagal memuat biaya operasional');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (error) {
      console.error('Failed to fetch employees:', error);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCosts();
    toast.success('Data biaya operasional direfresh');
  };

  const handleCategoryChange = (category: string) => {
    setFormData({ ...formData, category });
    if (category !== 'SALARY') {
      setSelectedEmployeeId('');
    }
  };

  const handleEmployeeSelect = (employeeId: string) => {
    setSelectedEmployeeId(employeeId);
    const employee = employees.find(e => e.id === employeeId);
    if (employee) {
      setFormData({
        ...formData,
        category: 'SALARY',
        description: `Gaji ${employee.name} (${employee.role}) - ${format(new Date(formData.date), 'MMMM yyyy', { locale: id })}`,
        amount: employee.salary
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.amount <= 0) {
      toast.error('Jumlah biaya harus lebih dari 0');
      return;
    }
    if (formData.category === 'SALARY' && !selectedEmployeeId) {
      toast.error('Pilih karyawan terlebih dahulu');
      return;
    }
    try {
      if (editingCost) {
        await api.put(`/operational-cost/${editingCost.id}`, formData);
        toast.success('Biaya berhasil diupdate');
      } else {
        await api.post('/operational-cost', formData);
        toast.success('Biaya berhasil ditambahkan');
      }
      setIsModalOpen(false);
      setEditingCost(null);
      setFormData({ category: 'OTHER', description: '', amount: 0, date: format(new Date(), 'yyyy-MM-dd') });
      setSelectedEmployeeId('');
      fetchCosts();
    } catch (error) {
      console.error('Submit error:', error);
      toast.error('Gagal menyimpan biaya');
    }
  };

  const handleDelete = async (id: string, description: string) => {
    if (confirm(`Hapus biaya "${description}"?`)) {
      try {
        await api.delete(`/operational-cost/${id}`);
        toast.success('Biaya dihapus');
        fetchCosts();
      } catch (error) {
        toast.error('Gagal menghapus biaya');
      }
    }
  };

  const costsByCategory = costs.reduce((acc, cost) => {
    acc[cost.category] = (acc[cost.category] || 0) + cost.amount;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Biaya Operasional</h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola biaya listrik, air, deterjen, gaji karyawan, dll</p>
        </div>
        <div className="flex gap-2">
          <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className="px-3 py-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
          <button onClick={handleRefresh} disabled={refreshing} className="bg-gray-200 dark:bg-gray-700 p-2 rounded-lg hover:bg-gray-300 transition-all" title="Refresh">
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => { setEditingCost(null); setFormData({ category: 'OTHER', description: '', amount: 0, date: format(new Date(), 'yyyy-MM-dd') }); setSelectedEmployeeId(''); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-95">
            <Plus className="h-4 w-4" /> Tambah Biaya
          </button>
        </div>
      </div>

      {/* Total Cost Card */}
      <div className="bg-gradient-to-r from-red-500 to-red-600 rounded-xl p-6 text-white shadow-lg">
        <div className="flex justify-between items-center">
          <div>
            <p className="opacity-80 text-sm">Total Biaya {format(new Date(filterMonth), 'MMMM yyyy', { locale: id })}</p>
            <p className="text-3xl font-bold mt-1">Rp {totalCost.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-white/20 rounded-full"><TrendingDown className="h-6 w-6" /></div>
        </div>
      </div>

      {/* Category Summary Cards */}
      {Object.keys(costsByCategory).length > 0 && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Object.entries(costsByCategory).map(([category, amount]) => {
            const config = categoryConfig[category] || categoryConfig.OTHER;
            return (
              <div key={category} className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
                <div className="flex items-center gap-2">
                  <div className={`p-2 rounded-lg ${config.color}`}>{config.icon}</div>
                  <span className="font-medium text-gray-900 dark:text-white">{config.label}</span>
                </div>
                <p className="text-xl font-bold mt-2 text-gray-900 dark:text-white">Rp {amount.toLocaleString()}</p>
              </div>
            );
          })}
        </div>
      )}

      {/* Costs Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b">
              <tr>
                <th className="text-left px-6 py-3">Tanggal</th>
                <th className="text-left px-6 py-3">Kategori</th>
                <th className="text-left px-6 py-3">Deskripsi</th>
                <th className="text-right px-6 py-3">Jumlah</th>
                <th className="text-center px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></td></tr>
              ) : costs.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-8 text-gray-500">Belum ada data biaya operasional</td></tr>
              ) : (
                costs.map((cost) => {
                  const config = categoryConfig[cost.category] || categoryConfig.OTHER;
                  return (
                    <tr key={cost.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4">{format(new Date(cost.date), 'dd/MM/yyyy')}</td>
                      <td className="px-6 py-4">
                        <span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${config.color}`}>
                          {config.icon} {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-4">{cost.description}</td>
                      <td className="px-6 py-4 text-right font-semibold">Rp {cost.amount.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        <button onClick={() => { setEditingCost(cost); setFormData({ category: cost.category, description: cost.description, amount: cost.amount, date: cost.date.split('T')[0] }); setIsModalOpen(true); }} className="text-blue-600 mr-2 hover:text-blue-800 transition-colors" title="Edit">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button onClick={() => handleDelete(cost.id, cost.description)} className="text-red-600 hover:text-red-800 transition-colors" title="Hapus">
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Tambah/Edit Biaya */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">{editingCost ? 'Edit Biaya' : 'Tambah Biaya'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Kategori</label>
                <select value={formData.category} onChange={(e) => handleCategoryChange(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600">
                  {Object.entries(categoryConfig).map(([key, val]) => (
                    <option key={key} value={key}>{val.label}</option>
                  ))}
                </select>
              </div>

              {/* Dropdown Karyawan (khusus kategori Gaji) */}
              {formData.category === 'SALARY' && (
                <div>
                  <label className="block text-sm font-medium mb-2 dark:text-gray-300">Pilih Karyawan</label>
                  <div className="space-y-2 max-h-60 overflow-y-auto border rounded-lg p-2 dark:border-gray-600">
                    {!employees || employees.length === 0 ? (
                      <p className="text-sm text-gray-500 text-center py-4">
                        Belum ada data karyawan. <a href="/employees" className="text-blue-600 ml-1">Tambah karyawan</a> dulu.
                      </p>
                    ) : (
                      employees.filter(emp => emp && emp.id).map(emp => (
                        <label key={emp.id} className={`flex items-center justify-between p-3 rounded-lg cursor-pointer transition-all ${selectedEmployeeId === emp.id ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-500' : 'hover:bg-gray-50 dark:hover:bg-gray-700 border border-transparent'}`}>
                          <div className="flex items-center gap-3 flex-1">
                            <input type="radio" name="employee" value={emp.id} checked={selectedEmployeeId === emp.id} onChange={() => handleEmployeeSelect(emp.id)} className="text-blue-600" />
                            <div>
                              <p className="font-medium text-sm text-gray-900 dark:text-white">{emp.name || '-'}</p>
                              <p className="text-xs text-gray-500">{emp.role || '-'} • {emp.shift || '-'} shift</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className="font-semibold text-sm text-gray-900 dark:text-white">Rp {(emp.salary || 0).toLocaleString()}</p>
                            <p className="text-xs text-gray-400">/bulan</p>
                          </div>
                        </label>
                      ))
                    )}
                  </div>
                  <p className="text-xs text-gray-400 mt-2">*Pilih karyawan, maka deskripsi dan jumlah akan terisi otomatis</p>
                </div>
              )}

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Deskripsi</label>
                <input type="text" placeholder="Contoh: Tagihan listrik Mei 2026" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Jumlah (Rp)</label>
                <input type="number" value={formData.amount} onChange={e => setFormData({ ...formData, amount: parseInt(e.target.value) || 0 })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" required />
              </div>

              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Tanggal</label>
                <input type="date" value={formData.date} onChange={e => setFormData({ ...formData, date: e.target.value })} className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" />
              </div>

              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-2">
                <p className="text-sm text-blue-700 dark:text-blue-300">💡 Biaya operasional akan mempengaruhi laporan laba rugi.</p>
              </div>

              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2">
                  <Save className="h-4 w-4" /> Simpan
                </button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-300 dark:bg-gray-600 dark:text-white p-2 rounded-lg hover:bg-gray-400 transition-all">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default OperationalCost;