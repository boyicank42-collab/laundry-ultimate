import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Truck, MapPin, Calendar, Clock, Package, User, Phone, CheckCircle, XCircle, Plus, RefreshCw } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface PickupDelivery {
  id: string;
  customerId: string;
  customer: { name: string; phone: string };
  address: string;
  pickupDate: string;
  deliveryDate: string;
  status: string;
  courierId: string;
  courier: { name: string };
  notes: string;
  deliveryFee: number;
}

const PickupDelivery = () => {
  const { token } = useAuth();
  const [pickups, setPickups] = useState<PickupDelivery[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [formData, setFormData] = useState({
    customerId: '',
    address: '',
    pickupDate: '',
    notes: '',
    deliveryFee: 0
  });

  useEffect(() => {
    fetchPickups();
    fetchCustomers();
  }, []);

  const fetchPickups = async () => {
    try {
      const res = await api.get('/pickup');
      setPickups(res.data);
    } catch (error) {
      toast.error('Gagal memuat data pickup');
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const res = await api.get('/customers');
      setCustomers(res.data);
    } catch (error) {
      console.error('Failed to fetch customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.customerId || !formData.address || !formData.pickupDate) {
      toast.error('Lengkapi semua field');
      return;
    }
    try {
      await api.post('/pickup', formData);
      toast.success('Permintaan pickup berhasil dibuat');
      setIsModalOpen(false);
      setFormData({ customerId: '', address: '', pickupDate: '', notes: '', deliveryFee: 0 });
      fetchPickups();
    } catch (error) {
      toast.error('Gagal membuat permintaan pickup');
    }
  };

  const updateStatus = async (id: string, status: string) => {
    try {
      await api.patch(`/pickup/${id}/status`, { status });
      toast.success(`Status berhasil diupdate menjadi ${status}`);
      fetchPickups();
    } catch (error) {
      toast.error('Gagal update status');
    }
  };

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'ASSIGNED': return 'bg-blue-100 text-blue-800';
      case 'PICKED': return 'bg-purple-100 text-purple-800';
      case 'DELIVERED': return 'bg-green-100 text-green-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100';
    }
  };

  const getStatusLabel = (status: string) => {
    switch(status) {
      case 'PENDING': return '⏳ Menunggu Kurir';
      case 'ASSIGNED': return '🚚 Kurir Ditugaskan';
      case 'PICKED': return '📦 Sudah Dijemput';
      case 'DELIVERED': return '✅ Selesai Diantar';
      case 'CANCELLED': return '❌ Dibatalkan';
      default: return status;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Truck className="h-6 w-6 text-blue-600" /> Pickup & Delivery
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola antar jemput laundry pelanggan</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchPickups} className="bg-gray-200 dark:bg-gray-700 p-2 rounded-lg"><RefreshCw className="h-5 w-5" /></button>
          <button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Plus className="h-5 w-5" /> Request Pickup
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50">
            <tr>
              <th className="text-left px-6 py-3">Pelanggan</th>
              <th className="text-left px-6 py-3">Alamat</th>
              <th className="text-left px-6 py-3">Tanggal Pickup</th>
              <th className="text-center px-6 py-3">Status</th>
              <th className="text-right px-6 py-3">Biaya</th>
              <th className="text-center px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></td></tr>
            ) : pickups.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Belum ada permintaan pickup</td></tr>
            ) : (
              pickups.map((pickup) => (
                <tr key={pickup.id} className="border-b hover:bg-gray-50">
                  <td className="px-6 py-4"><p className="font-medium">{pickup.customer?.name}</p><p className="text-xs text-gray-500">{pickup.customer?.phone}</p></td>
                  <td className="px-6 py-4 text-sm">{pickup.address}</td>
                  <td className="px-6 py-4 text-sm">{format(new Date(pickup.pickupDate), 'dd MMM yyyy HH:mm')}</td>
                  <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs ${getStatusBadge(pickup.status)}`}>{getStatusLabel(pickup.status)}</span></td>
                  <td className="px-6 py-4 text-right">Rp {pickup.deliveryFee?.toLocaleString() || 0}</td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex gap-2 justify-center">
                      {pickup.status === 'PENDING' && <button onClick={() => updateStatus(pickup.id, 'ASSIGNED')} className="text-blue-600 text-sm">Assign</button>}
                      {pickup.status === 'ASSIGNED' && <button onClick={() => updateStatus(pickup.id, 'PICKED')} className="text-purple-600 text-sm">Jemput</button>}
                      {pickup.status === 'PICKED' && <button onClick={() => updateStatus(pickup.id, 'DELIVERED')} className="text-green-600 text-sm">Diantar</button>}
                      {pickup.status !== 'CANCELLED' && pickup.status !== 'DELIVERED' && <button onClick={() => updateStatus(pickup.id, 'CANCELLED')} className="text-red-600 text-sm">Batal</button>}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Request Pickup Laundry</h2>
            <form onSubmit={handleSubmit} className="space-y-4">
              <select value={formData.customerId} onChange={e => setFormData({...formData, customerId: e.target.value})} className="w-full p-2 border rounded-lg" required>
                <option value="">Pilih Pelanggan</option>
                {customers.map(c => <option key={c.id} value={c.id}>{c.name} - {c.phone}</option>)}
              </select>
              <textarea placeholder="Alamat Lengkap" rows={2} value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} className="w-full p-2 border rounded-lg" required />
              <input type="datetime-local" value={formData.pickupDate} onChange={e => setFormData({...formData, pickupDate: e.target.value})} className="w-full p-2 border rounded-lg" required />
              <input type="number" placeholder="Biaya Antar (Rp)" value={formData.deliveryFee} onChange={e => setFormData({...formData, deliveryFee: parseInt(e.target.value) || 0})} className="w-full p-2 border rounded-lg" />
              <textarea placeholder="Catatan (opsional)" rows={2} value={formData.notes} onChange={e => setFormData({...formData, notes: e.target.value})} className="w-full p-2 border rounded-lg" />
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded-lg">Buat Request</button>
                <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-300 p-2 rounded-lg">Batal</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default PickupDelivery;