import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Store, Plus, Edit, Trash2, Phone, MapPin, User, Building, RefreshCw, X, Save } from 'lucide-react';
import toast from 'react-hot-toast';

interface Outlet {
  id: string;
  name: string;
  address: string;
  phone: string;
  manager: string;
  createdAt: string;
}

const Outlets = () => {
  const { token } = useAuth();
  const [outlets, setOutlets] = useState<Outlet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingOutlet, setEditingOutlet] = useState<Outlet | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    phone: '',
    manager: ''
  });

  useEffect(() => {
    fetchOutlets();
  }, []);

  const fetchOutlets = async () => {
    setLoading(true);
    try {
      const response = await api.get('/outlets');
      setOutlets(response.data);
    } catch (error) {
      console.error('Fetch outlets error:', error);
      toast.error('Gagal memuat data outlet');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchOutlets();
    toast.success('Data outlet direfresh');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nama outlet harus diisi');
      return;
    }
    if (!formData.address.trim()) {
      toast.error('Alamat outlet harus diisi');
      return;
    }

    try {
      if (editingOutlet) {
        await api.put(`/outlets/${editingOutlet.id}`, formData);
        toast.success('Outlet berhasil diupdate');
      } else {
        await api.post('/outlets', formData);
        toast.success('Outlet berhasil ditambahkan');
      }
      setIsModalOpen(false);
      setEditingOutlet(null);
      setFormData({ name: '', address: '', phone: '', manager: '' });
      fetchOutlets();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.details || 'Gagal menyimpan outlet');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus outlet "${name}"?`)) {
      try {
        await api.delete(`/outlets/${id}`);
        toast.success('Outlet berhasil dihapus');
        fetchOutlets();
      } catch (error) {
        toast.error('Gagal menghapus outlet');
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Multi Outlet</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola cabang dan outlet laundry</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="bg-gray-200 dark:bg-gray-700 p-2 rounded-lg hover:bg-gray-300 transition-all"
            title="Refresh"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingOutlet(null);
              setFormData({ name: '', address: '', phone: '', manager: '' });
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="h-5 w-5" /> Tambah Outlet
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Total Outlet</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{outlets.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Aktif</p>
          <p className="text-2xl font-bold text-green-600">{outlets.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Total Karyawan</p>
          <p className="text-2xl font-bold text-blue-600">-</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Total Transaksi</p>
          <p className="text-2xl font-bold text-purple-600">-</p>
        </div>
      </div>

      {/* Outlets Grid */}
      {loading ? (
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : outlets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-12 text-center border">
          <Store className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">Belum ada outlet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">Tambahkan outlet pertama Anda untuk mulai mengelola cabang.</p>
          <button
            onClick={() => {
              setEditingOutlet(null);
              setFormData({ name: '', address: '', phone: '', manager: '' });
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 mx-auto transition-all"
          >
            <Plus className="h-5 w-5" /> Tambah Outlet
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {outlets.map((outlet) => (
            <div 
              key={outlet.id} 
              className="bg-white dark:bg-gray-800 rounded-xl shadow-sm hover:shadow-md transition-all duration-200 p-5 border border-gray-100 dark:border-gray-700 group"
            >
              <div className="flex justify-between items-start">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                    <Store className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-gray-900 dark:text-white text-lg">{outlet.name}</h3>
                    <p className="text-xs text-gray-500">ID: {outlet.id.slice(0, 8)}</p>
                  </div>
                </div>
                <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={() => {
                      setEditingOutlet(outlet);
                      setFormData({
                        name: outlet.name,
                        address: outlet.address,
                        phone: outlet.phone || '',
                        manager: outlet.manager || ''
                      });
                      setIsModalOpen(true);
                    }}
                    className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={() => handleDelete(outlet.id, outlet.name)}
                    className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                    title="Hapus"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <div className="mt-4 space-y-2">
                <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                  <MapPin className="h-4 w-4 flex-shrink-0" />
                  <span className="break-words">{outlet.address}</span>
                </p>
                {outlet.phone && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <Phone className="h-4 w-4" /> {outlet.phone}
                  </p>
                )}
                {outlet.manager && (
                  <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2">
                    <User className="h-4 w-4" /> Manager: {outlet.manager}
                  </p>
                )}
              </div>
              
              <div className="mt-4 pt-3 border-t dark:border-gray-700 flex gap-2">
                <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 px-2 py-1 rounded-full">
                  Aktif
                </span>
                <span className="text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 px-2 py-1 rounded-full">
                  Cabang
                </span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Tambah/Edit Outlet */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">
                {editingOutlet ? 'Edit Outlet' : 'Tambah Outlet'}
              </h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-gray-500 hover:text-gray-700 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nama Outlet *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" 
                  required 
                  placeholder="Contoh: Outlet Pusat"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Alamat *</label>
                <textarea 
                  value={formData.address} 
                  onChange={e => setFormData({...formData, address: e.target.value})} 
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" 
                  rows={3}
                  required 
                  placeholder="Jl. Merdeka No. 123, Jakarta"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nomor Telepon</label>
                <input 
                  type="tel" 
                  value={formData.phone} 
                  onChange={e => setFormData({...formData, phone: e.target.value})} 
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" 
                  placeholder="021-5551234"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nama Manager</label>
                <input 
                  type="text" 
                  value={formData.manager} 
                  onChange={e => setFormData({...formData, manager: e.target.value})} 
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" 
                  placeholder="Nama manager outlet"
                />
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-2">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 Outlet akan ditampilkan di menu Multi Outlet dan dapat dipilih sebagai outlet aktif.
                </p>
              </div>
              
              <div className="flex gap-3 pt-4">
                <button 
                  type="submit" 
                  className="flex-1 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-all flex items-center justify-center gap-2"
                >
                  <Save className="h-4 w-4" /> Simpan
                </button>
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)} 
                  className="flex-1 bg-gray-300 dark:bg-gray-600 dark:text-white p-2 rounded-lg hover:bg-gray-400 transition-all"
                >
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

export default Outlets;