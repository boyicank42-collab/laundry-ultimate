import { useEffect, useState } from 'react';
import api from '../services/api';
import { Users, Plus, Edit, Trash2, Phone, Mail, MapPin, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
  email: string;
  totalSpent: number;
  totalOrders: number;
}

const Customers = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [search, setSearch] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    email: ''
  });

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get(`/customers?search=${search}`);
      setCustomers(response.data);
    } catch (error) {
      toast.error('Gagal memuat data pelanggan');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchCustomers();
    setRefreshing(false);
    toast.success('Data pelanggan direfresh!');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await api.put(`/customers/${editingCustomer.id}`, formData);
        toast.success('Pelanggan berhasil diupdate');
      } else {
        await api.post('/customers', formData);
        toast.success('Pelanggan berhasil ditambahkan');
      }
      setIsModalOpen(false);
      setEditingCustomer(null);
      setFormData({ name: '', phone: '', address: '', email: '' });
      fetchCustomers();
    } catch (error) {
      toast.error('Gagal menyimpan data');
    }
  };

  const handleDelete = async (id: string) => {
    if (confirm('Yakin ingin menghapus pelanggan ini?')) {
      try {
        await api.delete(`/customers/${id}`);
        toast.success('Pelanggan berhasil dihapus');
        fetchCustomers();
      } catch (error) {
        toast.error('Gagal menghapus pelanggan');
      }
    }
  };

  const openEditModal = (customer: Customer) => {
    setEditingCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      email: customer.email || ''
    });
    setIsModalOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Data Pelanggan</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola data pelanggan laundry Anda</p>
        </div>
        <div className="flex gap-2">
          <button onClick={handleRefresh} disabled={refreshing} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all">
            <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} /> {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <button onClick={() => { setEditingCustomer(null); setFormData({ name: '', phone: '', address: '', email: '' }); setIsModalOpen(true); }} className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus className="h-5 w-5" /> Tambah Pelanggan
          </button>
        </div>
      </div>

      <div className="relative">
        <input type="text" placeholder="Cari pelanggan..." value={search} onChange={(e) => setSearch(e.target.value)} className="w-full pl-4 pr-4 py-2 border rounded-lg bg-white dark:bg-gray-800 dark:text-white" />
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b">
            <tr>
              <th className="text-left px-6 py-3">Nama</th>
              <th className="text-left px-6 py-3">Kontak</th>
              <th className="text-left px-6 py-3">Alamat</th>
              <th className="text-center px-6 py-3">Total Order</th>
              <th className="text-right px-6 py-3">Total Belanja</th>
              <th className="text-center px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></td></tr>
            ) : customers.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Belum ada data pelanggan</td></tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td className="px-6 py-4 font-medium">{customer.name}</td>
                  <td className="px-6 py-4">{customer.phone && <p className="text-sm">{customer.phone}</p>}{customer.email && <p className="text-xs text-gray-500">{customer.email}</p>}</td>
                  <td className="px-6 py-4 text-sm">{customer.address || '-'}</td>
                  <td className="px-6 py-4 text-center">{customer.totalOrders}</td>
                  <td className="px-6 py-4 text-right font-semibold">Rp {customer.totalSpent.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button onClick={() => openEditModal(customer)} className="text-blue-600 mr-2"><Edit className="h-4 w-4" /></button>
                    <button onClick={() => handleDelete(customer.id)} className="text-red-600"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal sama seperti sebelumnya */}
      {isModalOpen && (<div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"><div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6"><h2 className="text-xl font-bold mb-4">{editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h2><form onSubmit={handleSubmit} className="space-y-4"><input type="text" placeholder="Nama Lengkap" className="w-full p-2 border rounded-lg" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} required /><input type="tel" placeholder="No Telepon" className="w-full p-2 border rounded-lg" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} /><input type="email" placeholder="Email" className="w-full p-2 border rounded-lg" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} /><textarea placeholder="Alamat" rows={3} className="w-full p-2 border rounded-lg" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} /><div className="flex gap-3 pt-4"><button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded-lg">Simpan</button><button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-300 p-2 rounded-lg">Batal</button></div></form></div></div>)}
    </div>
  );
};

export default Customers;