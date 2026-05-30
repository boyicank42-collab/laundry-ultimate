import { useEffect, useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { Users, Search, Plus, Edit, Trash2, Phone, Mail, MapPin } from 'lucide-react';
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
  const { token } = useAuth();
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
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
    try {
      const response = await axios.get(`/api/customers?search=${search}`);
      setCustomers(response.data);
    } catch (error) {
      toast.error('Gagal memuat data pelanggan');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingCustomer) {
        await axios.put(`/api/customers/${editingCustomer.id}`, formData);
        toast.success('Pelanggan berhasil diupdate');
      } else {
        await axios.post('/api/customers', formData);
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
        await axios.delete(`/api/customers/${id}`);
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
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Data Pelanggan</h1>
          <p className="text-gray-500 mt-1">Kelola data pelanggan laundry Anda</p>
        </div>
        <button
          onClick={() => {
            setEditingCustomer(null);
            setFormData({ name: '', phone: '', address: '', email: '' });
            setIsModalOpen(true);
          }}
          className="btn-primary flex items-center gap-2"
        >
          <Plus className="h-5 w-5" />
          Tambah Pelanggan
        </button>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
        <input
          type="text"
          placeholder="Cari pelanggan..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent"
        />
      </div>

      {/* Customers Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Nama</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Kontak</th>
              <th className="text-left px-6 py-3 text-sm font-semibold text-gray-600">Alamat</th>
              <th className="text-center px-6 py-3 text-sm font-semibold text-gray-600">Total Order</th>
              <th className="text-right px-6 py-3 text-sm font-semibold text-gray-600">Total Belanja</th>
              <th className="text-center px-6 py-3 text-sm font-semibold text-gray-600">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mx-auto"></div>
                </td>
              </tr>
            ) : customers.length === 0 ? (
              <tr>
                <td colSpan={6} className="text-center py-8 text-gray-500">
                  Belum ada data pelanggan
                </td>
              </tr>
            ) : (
              customers.map((customer) => (
                <tr key={customer.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4">
                    <p className="font-medium text-gray-800">{customer.name}</p>
                  </td>
                  <td className="px-6 py-4">
                    {customer.phone && <p className="text-sm flex items-center gap-1"><Phone className="h-3 w-3" /> {customer.phone}</p>}
                    {customer.email && <p className="text-sm text-gray-500 flex items-center gap-1 mt-1"><Mail className="h-3 w-3" /> {customer.email}</p>}
                  </td>
                  <td className="px-6 py-4">
                    {customer.address && <p className="text-sm text-gray-600 flex items-center gap-1"><MapPin className="h-3 w-3" /> {customer.address}</p>}
                  </td>
                  <td className="px-6 py-4 text-center">{customer.totalOrders}</td>
                  <td className="px-6 py-4 text-right font-semibold">Rp {customer.totalSpent.toLocaleString()}</td>
                  <td className="px-6 py-4 text-center">
                    <button
                      onClick={() => openEditModal(customer)}
                      className="text-blue-600 hover:text-blue-800 mr-3"
                    >
                      <Edit className="h-5 w-5" />
                    </button>
                    <button
                      onClick={() => handleDelete(customer.id)}
                      className="text-red-600 hover:text-red-800"
                    >
                      <Trash2 className="h-5 w-5" />
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">{editingCustomer ? 'Edit Pelanggan' : 'Tambah Pelanggan'}</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nama Lengkap *</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Nomor Telepon</label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Alamat</label>
                <textarea
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  rows={3}
                  className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 btn-primary">Simpan</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 btn-secondary">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Customers;