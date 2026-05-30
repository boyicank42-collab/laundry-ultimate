import { useEffect, useState } from 'react';
import api from '../services/api';
import { Package, Plus, Edit, Trash2, AlertTriangle, TrendingDown, TrendingUp, X, Save, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';

interface InventoryItem {
  id: string;
  name: string;
  category: string;
  stock: number;
  minStock: number;
  unit: string;
  price: number;
  createdAt: string;
  updatedAt: string;
}

const categoryOptions = [
  { value: 'DETERGENT', label: 'Deterjen' },
  { value: 'FABRIC_SOFTENER', label: 'Pewangi' },
  { value: 'PACKAGING', label: 'Plastik/Kemasan' },
  { value: 'OTHER', label: 'Lainnya' }
];

const unitOptions = [
  { value: 'kg', label: 'kg' },
  { value: 'liter', label: 'liter' },
  { value: 'pcs', label: 'pcs' },
  { value: 'pack', label: 'pack' },
  { value: 'gram', label: 'gram' }
];

const Inventory = () => {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    category: 'DETERGENT',
    stock: 0,
    minStock: 10,
    unit: 'kg',
    price: 0
  });

  useEffect(() => {
    fetchInventory();
  }, []);

  const fetchInventory = async () => {
    setLoading(true);
    try {
      const response = await api.get('/inventory');
      setItems(response.data);
    } catch (error) {
      console.error('Fetch inventory error:', error);
      toast.error('Gagal memuat data inventaris');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    await fetchInventory();
    toast.success('Data inventaris direfresh');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      toast.error('Nama item harus diisi');
      return;
    }
    if (formData.stock < 0) {
      toast.error('Stok tidak boleh negatif');
      return;
    }
    if (formData.price < 0) {
      toast.error('Harga tidak boleh negatif');
      return;
    }
    
    try {
      if (editingItem) {
        await api.put(`/inventory/${editingItem.id}`, formData);
        toast.success('Item berhasil diupdate');
      } else {
        await api.post('/inventory', formData);
        toast.success('Item berhasil ditambahkan');
      }
      setIsModalOpen(false);
      setEditingItem(null);
      setFormData({ name: '', category: 'DETERGENT', stock: 0, minStock: 10, unit: 'kg', price: 0 });
      fetchInventory();
    } catch (error: any) {
      console.error('Submit error:', error);
      toast.error(error.response?.data?.details || 'Gagal menyimpan item');
    }
  };

  const handleDelete = async (id: string, name: string) => {
    if (confirm(`Hapus item "${name}"? Data akan dihapus permanen.`)) {
      try {
        await api.delete(`/inventory/${id}`);
        toast.success('Item berhasil dihapus');
        fetchInventory();
      } catch (error) {
        toast.error('Gagal menghapus item');
      }
    }
  };

  const lowStockItems = items.filter(item => item.stock <= item.minStock);
  const totalValue = items.reduce((sum, item) => sum + (item.stock * item.price), 0);

  const getCategoryLabel = (category: string) => {
    const found = categoryOptions.find(c => c.value === category);
    return found ? found.label : category;
  };

  const getUnitLabel = (unit: string) => {
    const found = unitOptions.find(u => u.value === unit);
    return found ? found.label : unit;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Stok & Inventaris</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Kelola stok deterjen, pewangi, perlengkapan</p>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={handleRefresh} 
            disabled={refreshing}
            className="bg-gray-200 dark:bg-gray-700 p-2 rounded-lg hover:bg-gray-300 transition-all"
          >
            <RefreshCw className={`h-5 w-5 ${refreshing ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => {
              setEditingItem(null);
              setFormData({ name: '', category: 'DETERGENT', stock: 0, minStock: 10, unit: 'kg', price: 0 });
              setIsModalOpen(true);
            }}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 transition-all active:scale-95"
          >
            <Plus className="h-5 w-5" /> Tambah Item
          </button>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Total Item</p>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{items.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Total Nilai Stok</p>
          <p className="text-2xl font-bold text-green-600">Rp {totalValue.toLocaleString()}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Low Stock</p>
          <p className="text-2xl font-bold text-yellow-600">{lowStockItems.length} item</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Status</p>
          <p className="text-2xl font-bold text-green-600">{lowStockItems.length === 0 ? 'Aman' : 'Perlu Order'}</p>
        </div>
      </div>

      {/* Alert Low Stock */}
      {lowStockItems.length > 0 && (
        <div className="bg-yellow-50 dark:bg-yellow-900/30 border-l-4 border-yellow-400 p-4 rounded-lg">
          <div className="flex items-center gap-2">
            <AlertTriangle className="text-yellow-600 dark:text-yellow-500" />
            <span className="font-semibold text-yellow-800 dark:text-yellow-300">Peringatan: {lowStockItems.length} item stok menipis!</span>
          </div>
          <p className="text-yellow-700 dark:text-yellow-400 text-sm mt-1">Segera lakukan pembelian ulang untuk item dengan status Low Stock.</p>
        </div>
      )}

      {/* Items Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b">
              <tr>
                <th className="text-left px-6 py-3">Item</th>
                <th className="text-left px-6 py-3">Kategori</th>
                <th className="text-center px-6 py-3">Stok</th>
                <th className="text-center px-6 py-3">Min Stok</th>
                <th className="text-right px-6 py-3">Harga</th>
                <th className="text-center px-6 py-3">Status</th>
                <th className="text-center px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={7} className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                 </td></tr>
              ) : items.length === 0 ? (
                <tr><td colSpan={7} className="text-center py-8 text-gray-500">
                  <Package className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                  Belum ada data inventaris
                 </td></tr>
              ) : (
                items.map((item) => {
                  const isLowStock = item.stock <= item.minStock;
                  return (
                    <tr key={item.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/50">
                      <td className="px-6 py-4 font-medium">{item.name}</td>
                      <td className="px-6 py-4">{getCategoryLabel(item.category)}</td>
                      <td className="px-6 py-4 text-center">{item.stock} {getUnitLabel(item.unit)}</td>
                      <td className="px-6 py-4 text-center">{item.minStock} {getUnitLabel(item.unit)}</td>
                      <td className="px-6 py-4 text-right">Rp {item.price.toLocaleString()}</td>
                      <td className="px-6 py-4 text-center">
                        {isLowStock ? (
                          <span className="px-2 py-1 bg-red-100 text-red-800 rounded-full text-xs flex items-center gap-1 w-fit mx-auto">
                            <TrendingDown className="h-3 w-3" /> Low Stock
                          </span>
                        ) : (
                          <span className="px-2 py-1 bg-green-100 text-green-800 rounded-full text-xs flex items-center gap-1 w-fit mx-auto">
                            <TrendingUp className="h-3 w-3" /> Aman
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        <button 
                          onClick={() => { 
                            setEditingItem(item); 
                            setFormData({ 
                              name: item.name, 
                              category: item.category, 
                              stock: item.stock, 
                              minStock: item.minStock, 
                              unit: item.unit, 
                              price: item.price 
                            }); 
                            setIsModalOpen(true); 
                          }} 
                          className="text-blue-600 mr-3 hover:text-blue-800 transition-colors"
                          title="Edit"
                        >
                          <Edit className="h-5 w-5" />
                        </button>
                        <button 
                          onClick={() => handleDelete(item.id, item.name)} 
                          className="text-red-600 hover:text-red-800 transition-colors"
                          title="Hapus"
                        >
                          <Trash2 className="h-5 w-5" />
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

      {/* Modal Tambah/Edit Item */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md max-h-[90vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold dark:text-white">
                {editingItem ? 'Edit Item' : 'Tambah Item'}
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
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Nama Item *</label>
                <input 
                  type="text" 
                  value={formData.name} 
                  onChange={e => setFormData({...formData, name: e.target.value})} 
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" 
                  required 
                  placeholder="Contoh: Deterjen Bubuk"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-1 dark:text-gray-300">Kategori</label>
                <select 
                  value={formData.category} 
                  onChange={e => setFormData({...formData, category: e.target.value})} 
                  className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                >
                  {categoryOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                </select>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Stok</label>
                  <input 
                    type="number" 
                    value={formData.stock} 
                    onChange={e => setFormData({...formData, stock: parseInt(e.target.value) || 0})} 
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" 
                    required 
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Minimum Stok</label>
                  <input 
                    type="number" 
                    value={formData.minStock} 
                    onChange={e => setFormData({...formData, minStock: parseInt(e.target.value) || 0})} 
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" 
                    required 
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Satuan</label>
                  <select 
                    value={formData.unit} 
                    onChange={e => setFormData({...formData, unit: e.target.value})} 
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600"
                  >
                    {unitOptions.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1 dark:text-gray-300">Harga Satuan (Rp)</label>
                  <input 
                    type="number" 
                    value={formData.price} 
                    onChange={e => setFormData({...formData, price: parseInt(e.target.value) || 0})} 
                    className="w-full p-2 border rounded-lg dark:bg-gray-700 dark:border-gray-600" 
                    required 
                  />
                </div>
              </div>
              
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg mt-2">
                <p className="text-sm text-blue-700 dark:text-blue-300">
                  💡 <strong>Tips:</strong> Set data akan tersimpan permanen di database.
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

export default Inventory;