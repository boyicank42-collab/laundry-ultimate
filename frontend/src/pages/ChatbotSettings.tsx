import { useEffect, useState, useRef } from 'react';
import api from '../services/api';
import { Bot, MessageCircle, Send, History, Settings as SettingsIcon, Bell, Zap, Activity, Database, Volume2, VolumeX } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

const ChatbotSettings = () => {
  const [config, setConfig] = useState({ enabled: true, welcomeMsg: '' });
  const [logs, setLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [testPhone, setTestPhone] = useState('');
  const [testMessage, setTestMessage] = useState('');
  const [testReply, setTestReply] = useState('');
  const [sending, setSending] = useState(false);
  const [showLogs, setShowLogs] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [lastCount, setLastCount] = useState(0);
  const [newMessageCount, setNewMessageCount] = useState(0);
  const audioRef = useRef(null);

  // Load sound
  useEffect(() => {
    audioRef.current = new Audio('https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3');
    audioRef.current.volume = 0.5;
  }, []);

  const playSound = () => {
    if (soundEnabled && audioRef.current) {
      audioRef.current.play().catch(e => console.log('Sound play failed:', e));
    }
  };

  const showNotification = (message: string, sender: string) => {
    // Toast notification
    toast.success(`📩 Pesan baru dari ${sender}: ${message.substring(0, 50)}...`, {
      duration: 5000,
      position: 'top-right',
      icon: '💬'
    });
    
    // Browser notification (if permission granted)
    if (Notification.permission === 'granted') {
      new Notification('Pesan Masuk dari WhatsApp', {
        body: `${sender}: ${message.substring(0, 100)}`,
        icon: '/vite.svg'
      });
    } else if (Notification.permission !== 'denied') {
      Notification.requestPermission();
    }
  };

  const fetchConfig = async () => {
    try {
      const res = await api.get('/chatbot/config');
      setConfig(res.data);
    } catch (error) {
      console.error('Failed to fetch config:', error);
    }
  };

  const fetchLogs = async () => {
    try {
      const res = await api.get('/chatbot/logs');
      const newLogs = res.data;
      
      // Check for new messages
      if (logs.length > 0 && newLogs.length > logs.length) {
        const newMessages = newLogs.slice(0, newLogs.length - logs.length);
        for (const msg of newMessages) {
          if (msg.message && !msg.message.includes('*MENU') && !msg.message.includes('Balasan')) {
            playSound();
            showNotification(msg.message, msg.phoneNumber);
            setNewMessageCount(prev => prev + 1);
          }
        }
      }
      
      setLogs(newLogs);
      setLastCount(newLogs.length);
    } catch (error) {
      console.error('Failed to fetch logs:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto-refresh every 5 seconds
  useEffect(() => {
    fetchConfig();
    fetchLogs();
    
    const interval = setInterval(() => {
      fetchLogs();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Reset new message count after viewing
  useEffect(() => {
    if (showLogs) {
      setNewMessageCount(0);
    }
  }, [showLogs]);

  const saveConfig = async () => {
    try {
      await api.put('/chatbot/config', config);
      toast.success('Konfigurasi chatbot disimpan');
    } catch (error) {
      toast.error('Gagal menyimpan konfigurasi');
    }
  };

  const testChatbot = async () => {
    if (!testMessage) {
      toast.error('Masukkan pesan test');
      return;
    }
    setSending(true);
    try {
      const res = await api.post('/chatbot/webhook', {
        sender: testPhone || '081221723399',
        message: testMessage,
        name: 'Test User'
      });
      setTestReply(res.data.reply || 'Chatbot merespon!');
      toast.success('Chatbot merespon!');
      fetchLogs();
    } catch (error) {
      toast.error('Gagal test chatbot');
    } finally {
      setSending(false);
    }
  };

  const getIntentIcon = (intent: string) => {
    switch(intent) {
      case 'status_check': return <Activity className="h-3 w-3 text-blue-500" />;
      case 'price_info': return <Zap className="h-3 w-3 text-yellow-500" />;
      case 'promo': return <Bell className="h-3 w-3 text-green-500" />;
      case 'register': return <Database className="h-3 w-3 text-purple-500" />;
      default: return <MessageCircle className="h-3 w-3 text-gray-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Bot className="h-6 w-6 text-blue-600" /> Chatbot WhatsApp
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Otomatis balas pesan WhatsApp pelanggan 24 jam</p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setSoundEnabled(!soundEnabled)} className={`px-3 py-2 rounded-lg flex items-center gap-2 ${soundEnabled ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
            {soundEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
            {soundEnabled ? 'Suara On' : 'Suara Off'}
          </button>
          <button onClick={() => setShowLogs(!showLogs)} className="bg-gray-200 dark:bg-gray-700 px-4 py-2 rounded-lg flex items-center gap-2 relative">
            <History className="h-4 w-4" />
            {showLogs ? 'Sembunyikan Log' : 'Lihat Log'}
            {!showLogs && newMessageCount > 0 && (
              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                {newMessageCount}
              </span>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Status Chatbot</p>
          <p className="text-2xl font-bold text-green-600">{config.enabled ? '✅ Aktif' : '❌ Nonaktif'}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Total Interaksi</p>
          <p className="text-2xl font-bold">{logs.length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Hari Ini</p>
          <p className="text-2xl font-bold">{logs.filter(l => format(new Date(l.createdAt), 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd')).length}</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border">
          <p className="text-gray-500 text-sm">Unique Users</p>
          <p className="text-2xl font-bold">{new Set(logs.map(l => l.phoneNumber)).size}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><SettingsIcon className="h-5 w-5 text-blue-600" /> Konfigurasi Chatbot</h3>
          <div className="space-y-4">
            <label className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span>Aktifkan Chatbot</span>
              <input type="checkbox" checked={config.enabled} onChange={(e) => setConfig({...config, enabled: e.target.checked})} className="toggle" />
            </label>
            <div>
              <label className="block text-sm font-medium mb-1">Pesan Sambutan (Welcome Message)</label>
              <textarea rows={3} value={config.welcomeMsg} onChange={(e) => setConfig({...config, welcomeMsg: e.target.value})} className="w-full p-2 border rounded-lg dark:bg-gray-700" />
              <p className="text-xs text-gray-400 mt-1">Pesan ini akan dikirim saat pelanggan pertama kali chat</p>
            </div>
            <button onClick={saveConfig} className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700">Simpan Konfigurasi</button>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Send className="h-5 w-5 text-green-600" /> Test Chatbot</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-1">Nomor WhatsApp (opsional)</label>
              <input type="tel" value={testPhone} onChange={(e) => setTestPhone(e.target.value)} placeholder="081221723399" className="w-full p-2 border rounded-lg dark:bg-gray-700" />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Pesan Test</label>
              <div className="flex gap-2">
                <input type="text" value={testMessage} onChange={(e) => setTestMessage(e.target.value)} placeholder="Contoh: MENU, harga, PROMO, DAFTAR" className="flex-1 p-2 border rounded-lg dark:bg-gray-700" />
                <button onClick={testChatbot} disabled={sending} className="bg-green-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
                  <Send className="h-4 w-4" /> Kirim
                </button>
              </div>
            </div>
            {testReply && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                <p className="text-sm text-blue-700 dark:text-blue-300">🤖 Balasan Chatbot:</p>
                <p className="text-sm mt-1 whitespace-pre-wrap">{testReply}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
        <h3 className="font-semibold mb-4 flex items-center gap-2"><MessageCircle className="h-5 w-5 text-purple-600" /> Perintah yang Didukung</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"><code className="text-sm font-mono">MENU</code><p className="text-xs text-gray-500 mt-1">Lihat layanan & harga</p></div>
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"><code className="text-sm font-mono">HARGA</code><p className="text-xs text-gray-500 mt-1">Info harga layanan</p></div>
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"><code className="text-sm font-mono">PROMO</code><p className="text-xs text-gray-500 mt-1">Info promo spesial</p></div>
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"><code className="text-sm font-mono">DAFTAR</code><p className="text-xs text-gray-500 mt-1">Registrasi pelanggan</p></div>
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"><code className="text-sm font-mono">BANTUAN</code><p className="text-xs text-gray-500 mt-1">Menu bantuan</p></div>
          <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg"><code className="text-sm font-mono">INVOICE/INV/202605/XXXX</code><p className="text-xs text-gray-500 mt-1">Cek status laundry</p></div>
        </div>
      </div>

      {showLogs && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 border">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><History className="h-5 w-5 text-purple-600" /> Log Interaksi ({logs.length})</h3>
          <div className="space-y-2 max-h-96 overflow-y-auto">
            {logs.map((log: any) => (
              <div key={log.id} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all">
                <div className="flex justify-between text-xs text-gray-400">
                  <span className="font-mono">{log.phoneNumber}</span>
                  <span>{format(new Date(log.createdAt), 'dd MMM yyyy HH:mm:ss', { locale: id })}</span>
                </div>
                <div className="mt-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">📱 {log.message}</p>
                  <p className="text-sm text-blue-600 dark:text-blue-400 flex items-center gap-1 mt-1 bg-blue-50 dark:bg-blue-900/20 p-2 rounded">
                    {getIntentIcon(log.intent)} 🤖 {log.reply}
                  </p>
                </div>
              </div>
            ))}
            {logs.length === 0 && <p className="text-center text-gray-500 py-4">Belum ada interaksi</p>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatbotSettings;