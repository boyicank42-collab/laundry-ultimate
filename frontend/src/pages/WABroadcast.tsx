import { useEffect, useState } from 'react';
import api from '../services/api';
import { Send, Users, MessageSquare, Phone, Copy, Check, Zap, TrendingUp, History, Calendar, Clock, AlertCircle } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Broadcast {
  id: string;
  message: string;
  targetCount: number;
  sentCount: number;
  status: string;
  createdAt: string;
}

interface WALog {
  id: string;
  phoneNumber: string;
  message: string;
  status: string;
  sentAt: string;
}

const WABroadcast = () => {
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [broadcasts, setBroadcasts] = useState<Broadcast[]>([]);
  const [logs, setLogs] = useState<WALog[]>([]);
  const [showLogs, setShowLogs] = useState(false);
  const [targetType, setTargetType] = useState('all');
  const [customPhones, setCustomPhones] = useState('');

  useEffect(() => {
    fetchBroadcasts();
    fetchLogs();
  }, []);

  const fetchBroadcasts = async () => {
    try {
      const res = await api.get('/wa-broadcast');
      setBroadcasts(res.data);
    } catch (error) {
      console.error('Failed to fetch broadcasts:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/wa-broadcast/logs');
      setLogs(res.data);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) {
      toast.error('Pesan tidak boleh kosong');
      return;
    }
    
    let phoneNumbers = [];
    if (targetType === 'custom') {
      phoneNumbers = customPhones.split(',').map(p => p.trim()).filter(p => p);
      if (phoneNumbers.length === 0) {
        toast.error('Masukkan nomor telepon valid');
        return;
      }
    }
    
    setLoading(true);
    try {
      await api.post('/wa-broadcast/send', {
        message,
        phoneNumbers: targetType === 'custom' ? phoneNumbers : null
      });
      toast.success(`Broadcast berhasil dikirim ke ${targetType === 'all' ? 'semua pelanggan' : phoneNumbers.length + ' nomor'}`);
      setMessage('');
      setCustomPhones('');
      fetchBroadcasts();
      fetchLogs();
    } catch (error) {
      toast.error('Gagal mengirim broadcast');
    } finally {
      setLoading(false);
    }
  };

  const templates = [
    { id: 1, title: '📢 Laundry Selesai', msg: 'Halo {name}, cucian Anda sudah selesai. Silakan diambil di outlet kami. Terima kasih!' },
    { id: 2, title: '🎉 Promo Spesial', msg: 'PROMO SPESIAL! Cuci kiloan hanya Rp 6.000/kg. Periode terbatas. Dapatkan promo sekarang!' },
    { id: 3, title: '💝 Thank You', msg: 'Terima kasih telah menggunakan jasa laundry kami. Rating 5 bintang sangat membantu kami ❤️' },
    { id: 4, title: '📈 Laporan Bulanan', msg: 'Laporan bulan ini: Anda telah melakukan 5 transaksi dengan total Rp 225.000. Terima kasih!' },
  ];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">WhatsApp Broadcast</h1>
          <p className="text-gray-500 dark:text-gray-400">Kirim notifikasi massal ke pelanggan via WhatsApp</p>
        </div>
        <button onClick={() => setShowLogs(!showLogs)} className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2">
          <History className="h-4 w-4" /> {showLogs ? 'Sembunyikan Log' : 'Lihat Log'}
        </button>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border"><p className="text-gray-500 text-sm">Total Broadcast</p><p className="text-2xl font-bold">{broadcasts.length}</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border"><p className="text-gray-500 text-sm">Total Terkirim</p><p className="text-2xl font-bold text-green-600">{broadcasts.reduce((sum, b) => sum + b.sentCount, 0)}</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border"><p className="text-gray-500 text-sm">Success Rate</p><p className="text-2xl font-bold text-blue-600">98.5%</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border"><p className="text-gray-500 text-sm">Pelanggan Active</p><p className="text-2xl font-bold text-purple-600">156</p></div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Compose Message Card */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Send className="h-5 w-5 text-green-600" /> Buat Pesan Broadcast</h3>
          
          <div className="mb-4">
            <label className="block text-sm font-medium mb-2">Target Penerima</label>
            <div className="flex gap-3">
              <label className="flex items-center gap-2"><input type="radio" name="target" value="all" checked={targetType === 'all'} onChange={() => setTargetType('all')} className="text-blue-600" /> Semua Pelanggan</label>
              <label className="flex items-center gap-2"><input type="radio" name="target" value="custom" checked={targetType === 'custom'} onChange={() => setTargetType('custom')} className="text-blue-600" /> Nomor Tertentu</label>
            </div>
          </div>
          
          {targetType === 'custom' && (
            <div className="mb-4">
              <textarea rows={2} placeholder="Masukkan nomor telepon (pisahkan dengan koma)&#10;Contoh: 081234567890, 081298765432" value={customPhones} onChange={(e) => setCustomPhones(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700" />
            </div>
          )}
          
          <textarea rows={6} placeholder="Tulis pesan broadcast...&#10;&#10;Tips: Gunakan {name} untuk menyebut nama pelanggan" className="w-full p-3 border rounded-lg resize-none" value={message} onChange={(e) => setMessage(e.target.value)} />
          
          <div className="flex justify-between items-center mt-4">
            <span className="text-sm text-gray-500">{message.length} karakter</span>
            <button onClick={handleSend} disabled={loading} className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg flex items-center gap-2">
              <Send className="h-4 w-4" /> {loading ? 'Mengirim...' : 'Kirim Broadcast'}
            </button>
          </div>
        </div>

        {/* Templates */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><MessageSquare className="h-5 w-5 text-blue-600" /> Template Pesan</h3>
          <div className="space-y-3">
            {templates.map((template) => (
              <div key={template.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-600 transition-all" onClick={() => setMessage(template.msg)}>
                <p className="font-medium">{template.title}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{template.msg}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Recent Broadcasts */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><History className="h-5 w-5 text-purple-600" /> Riwayat Broadcast</h3>
        <div className="space-y-3">
          {broadcasts.slice(0, 5).map((broadcast) => (
            <div key={broadcast.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div><p className="text-sm line-clamp-1">{broadcast.message.substring(0, 100)}</p><p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><Calendar className="h-3 w-3" /> {format(new Date(broadcast.createdAt), 'dd MMM yyyy HH:mm', { locale: id })}</p></div>
              <div className="text-right"><p className="text-sm font-semibold">{broadcast.sentCount}/{broadcast.targetCount}</p><p className="text-xs text-gray-400">terkirim</p></div>
            </div>
          ))}
        </div>
      </div>

      {/* Logs Modal */}
      {showLogs && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-3xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Log Pengiriman WA</h2><button onClick={() => setShowLogs(false)} className="text-gray-500">✕</button></div>
            <div className="space-y-2">
              {logs.map((log) => (
                <div key={log.id} className="flex justify-between items-center p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                  <div><p className="font-medium">{log.phoneNumber}</p><p className="text-xs text-gray-400">{format(new Date(log.sentAt), 'dd MMM yyyy HH:mm:ss')}</p></div>
                  <div><span className="text-xs text-green-600">✓ Terkirim</span></div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default WABroadcast;