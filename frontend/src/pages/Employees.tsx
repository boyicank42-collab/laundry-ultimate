import { useEffect, useState } from 'react';
import api from '../services/api';
import { Plus, Edit, Trash2, User, Phone, Mail, Briefcase, Calendar, RefreshCw, X, Save, DollarSign, Clock } from 'lucide-react';
import toast from 'react-hot-toast';

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  role: string;
  outlet: string;
  shift: string;
  salary: number;
  createdAt: string;
}

const Employees = () => {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: 'KASIR',
    outlet: 'Pusat',
    shift: 'Pagi',
    salary: 0
  });

  useEffect(() => {
    fetchEmployees();
  }, []);

  const fetchEmployees = async () => {
    setLoading(true);
    try {
      const res = await api.get('/employees');
      setEmployees(res.data);
    } catch (error) {
      console.error('Fetch error:', error);
      toast.error('Gagal memuat karyawan');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchEmployees();
    toast.success('Data karyawan direfresh');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name) {
      toast.error('Nama karyawan harus diisi');
      return;
    }
    if (!formData.email) {
      toast.error('Email harus diisi');
      return;
    }
    try {
      if (editingEmployee) {
        await api.put(`/employees/${editingEmployee.id}`, formData);
        toast.success('Karyawan berhasil diupdate');
      } else {
        await api.post('/employees', formData);
        toast.success('Karyawan berhasil ditambahkan');
      }
      setIsModalOpen(false);
      setEditingEmployee(null);
      setFormData({ name: '', email: '', phone: '', role: 'KASIR', outlet: 'Pusat', shift: 'Pagi', salary: 0 });
      fetchEmployees();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.details || 'Gagal menyimpan karyawan');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus karyawan "${name}"?`)) {
      try {
        await api.delete(`/employees/${id}`);
        toast.success('Karyawan berhasil dihapus');
        fetchEmployees();
      } catch (error) {
        toast.error('Gagal menghapus karyawan');
      }
    }
  };

  const getRoleColor = (role: string) => {
    switch(role) {
      case 'ADMIN': return 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400';
      case 'KASIR': return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
      case 'OWNER': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getShiftColor = (shift: string) => {
    switch(shift) {
      case 'Pagi': return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'Siang': return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      case 'Malam': return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Manajemen Karyawan</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola data karyawan dan shift</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className="bg-gray-200 dark:bg-gray-700 p-2 rounded-lg hover:bg-gray-300 transition-all">
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button onClick={() => { setEditingEmployee(null); setFormData({ name: '', email: '', phone: '', role: 'KASIR', outlet: 'Pusat', shift: 'Pagi', salary: 0 }); setIsModalOpen(true); }} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-95">
            <Plus className="h-5 w-5" /> Tambah Karyawan
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>
      ) : employees.length === 0 ? (
        <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl border">
          <User className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-500 dark:text-gray-400">Belum ada data karyawan</p>
          <button onClick={() => setIsModalOpen(true)} className="mt-4 text-blue-600 hover:underline">Tambah karyawan pertama</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {employees.map((emp) => (
            <div key={emp.id} className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all p-5 border">
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-lg">
                    {emp.name?.charAt(0) || 'K'}
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white">{emp.name}</h3>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getRoleColor(emp.role)}`}>{emp.role}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${getShiftColor(emp.shift)}`}>{emp.shift}</span>
                    </div>
                  </div>
                </div>
                <div className="flex gap-1">
                  <button onClick={() => { setEditingEmployee(emp); setFormData({ name: emp.name, email: emp.email, phone: emp.phone || '', role: emp.role, outlet: emp.outlet, shift: emp.shift, salary: emp.salary }); setIsModalOpen(true); }} className="p-1 text-gray-400 hover:text-blue-600"><Edit className="h-4 w-4" /></button>
                  <button onClick={() => handleDelete(emp.id, emp.name)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
                </div>
              </div>
              <div className="mt-4 space-y-2 border-t dark:border-gray-700 pt-4">
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"><Phone className="h-4 w-4" /> {emp.phone || '-'}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"><Mail className="h-4 w-4" /> {emp.email}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"><Briefcase className="h-4 w-4" /> {emp.outlet || 'Pusat'}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2"><DollarSign className="h-4 w-4" /> Rp {emp.salary?.toLocaleString() || 0}/bulan</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">{editingEmployee ? 'Edit Karyawan' : 'Tambah Karyawan'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-gray-500 hover:text-gray-700"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Nama Lengkap *</label><input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700" required /></div>
              <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Email *</label><input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700" required /></div>
              <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">No Telepon</label><input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700" /></div>
              <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Role</label><select value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700"><option value="ADMIN">Admin</option><option value="KASIR">Kasir</option><option value="OWNER">Owner</option></select></div>
              <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Shift</label><select value={formData.shift} onChange={e => setFormData({...formData, shift: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700"><option value="Pagi">Pagi (08-16)</option><option value="Siang">Siang (12-20)</option><option value="Malam">Malam (16-00)</option></select></div>
              <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Outlet</label><input type="text" value={formData.outlet} onChange={e => setFormData({...formData, outlet: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700" /></div>
              <div><label className="block text-sm font-medium mb-1 dark:text-gray-300">Gaji Pokok</label><input type="number" value={formData.salary} onChange={e => setFormData({...formData, salary: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded-lg dark:bg-gray-700" /></div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg"><p className="text-sm text-blue-700 dark:text-blue-300">💡 Password default: 123456</p></div>
              <div className="flex gap-3 pt-4"><button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"><Save className="h-4 w-4" /> Simpan</button><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-300 dark:bg-gray-600 p-2 rounded-lg">Batal</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Employees;