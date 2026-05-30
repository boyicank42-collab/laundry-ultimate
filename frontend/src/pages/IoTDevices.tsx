import { useState, useEffect, useRef } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { useOutlet } from '../contexts/OutletContext';
import { 
  Wifi, WifiOff, Activity, Play, Square, Clock, Thermometer, 
  Droplet, Zap, AlertTriangle, Settings, RefreshCw, Power, 
  Wrench, Plus, Trash2, Database, Calendar
} from 'lucide-react';
import toast from 'react-hot-toast';

interface Device {
  id: string;
  name: string;
  type: 'WASHER' | 'DRYER';
  status: 'ONLINE' | 'BUSY' | 'OFFLINE' | 'MAINTENANCE';
  cycle: string;
  timeRemaining: number;
  temperature: number;
  currentLoad: number;
  lastMaintenance: string;
  outletId: string;
}

const IoTDevices = () => {
  const { token } = useAuth();
  const { currentOutlet } = useOutlet();
  const [devices, setDevices] = useState<Device[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAutoRefreshing, setIsAutoRefreshing] = useState(true);
  const [showTimerModal, setShowTimerModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [timerDevice, setTimerDevice] = useState<Device | null>(null);
  const [maintenanceDevice, setMaintenanceDevice] = useState<Device | null>(null);
  const [maintenanceDate, setMaintenanceDate] = useState('');
  const [newDeviceName, setNewDeviceName] = useState('');
  const [newDeviceType, setNewDeviceType] = useState<'WASHER' | 'DRYER'>('WASHER');
  const [localTimers, setLocalTimers] = useState<Record<string, number>>({});
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const autoRefreshRef = useRef<NodeJS.Timeout | null>(null);

  const fetchDevices = async () => {
    try {
      const response = await api.get('/devices');
      setDevices(response.data);
      const timers: Record<string, number> = {};
      response.data.forEach((device: Device) => {
        if (device.status === 'BUSY' && device.timeRemaining > 0) {
          timers[device.id] = device.timeRemaining;
        }
      });
      setLocalTimers(timers);
    } catch (error) {
      console.error('Fetch devices error:', error);
    } finally {
      setLoading(false);
    }
  };

  // Auto refresh every 5 seconds (indikator software hidup)
  useEffect(() => {
    fetchDevices();
    
    if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    
    autoRefreshRef.current = setInterval(() => {
      fetchDevices();
    }, 5000);
    
    return () => {
      if (autoRefreshRef.current) clearInterval(autoRefreshRef.current);
    };
  }, []);

  // Real-time timer countdown every second
  useEffect(() => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    
    intervalRef.current = setInterval(() => {
      setLocalTimers(prev => {
        const newTimers = { ...prev };
        let hasChanges = false;
        Object.keys(newTimers).forEach(deviceId => {
          if (newTimers[deviceId] > 0) {
            newTimers[deviceId] -= 1;
            hasChanges = true;
            if (newTimers[deviceId] <= 0) {
              delete newTimers[deviceId];
              const device = devices.find(d => d.id === deviceId);
              if (device) {
                api.post(`/devices/${deviceId}/stop`).catch(console.error);
                toast.success(`${device.name} selesai!`);
                setDevices(prevDevices => 
                  prevDevices.map(d => d.id === deviceId ? { ...d, status: 'ONLINE', cycle: 'Siap', timeRemaining: 0 } : d)
                );
              }
            }
          }
        });
        return hasChanges ? newTimers : prev;
      });
    }, 1000);
    
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [devices]);

  const getLocalTimeRemaining = (device: Device) => {
    if (device.status === 'BUSY') {
      return localTimers[device.id] !== undefined ? localTimers[device.id] : device.timeRemaining;
    }
    return 0;
  };

  const startDevice = async (deviceId: string, minutes: number, cycleName: string, temperature: number) => {
    const seconds = minutes * 60;
    try {
      await api.post(`/devices/${deviceId}/start`, { cycleType: cycleName, duration: seconds, temperature: temperature });
      setLocalTimers(prev => ({ ...prev, [deviceId]: seconds }));
      toast.success(`${cycleName} dimulai - ${minutes} menit`);
      fetchDevices();
    } catch (error) {
      toast.error('Gagal memulai mesin');
    }
  };

  const stopDevice = async (deviceId: string, deviceName: string) => {
    try {
      await api.post(`/devices/${deviceId}/stop`);
      setLocalTimers(prev => { const newTimers = { ...prev }; delete newTimers[deviceId]; return newTimers; });
      toast.success(`${deviceName} dihentikan`);
      fetchDevices();
    } catch (error) {
      toast.error('Gagal menghentikan mesin');
    }
  };

  const powerOnDevice = async (deviceId: string, deviceName: string) => {
    try {
      await api.post(`/devices/${deviceId}/poweron`);
      toast.success(`${deviceName} dinyalakan`);
      fetchDevices();
    } catch (error) {
      toast.error('Gagal menyalakan mesin');
    }
  };

  const scheduleMaintenance = async () => {
    if (!maintenanceDevice) return;
    if (!maintenanceDate) { toast.error('Pilih tanggal maintenance'); return; }
    try {
      await api.post(`/devices/${maintenanceDevice.id}/maintenance`, { date: maintenanceDate });
      toast.success(`Maintenance ${maintenanceDevice.name} dijadwalkan`);
      setShowMaintenanceModal(false);
      setMaintenanceDevice(null);
      setMaintenanceDate('');
      fetchDevices();
    } catch (error) {
      toast.error('Gagal menjadwalkan maintenance');
    }
  };

  const completeMaintenance = async (deviceId: string, deviceName: string) => {
    if (confirm(`Selesaikan maintenance untuk ${deviceName}?`)) {
      try {
        await api.post(`/devices/${deviceId}/repair`);
        toast.success(`${deviceName} selesai maintenance`);
        fetchDevices();
      } catch (error) {
        toast.error('Gagal menyelesaikan maintenance');
      }
    }
  };

  const updateTimer = async () => {
    if (!timerDevice) return;
    const seconds = timerSeconds * 60;
    try {
      await api.put(`/devices/${timerDevice.id}/timer`, {
        timeRemaining: seconds,
        status: seconds > 0 ? 'BUSY' : 'ONLINE',
        cycle: seconds > 0 ? 'Manual Setting' : 'Siap',
        temperature: 30
      });
      if (seconds > 0) {
        setLocalTimers(prev => ({ ...prev, [timerDevice.id]: seconds }));
      } else {
        setLocalTimers(prev => { const newTimers = { ...prev }; delete newTimers[timerDevice.id]; return newTimers; });
      }
      toast.success(`Timer ${timerDevice.name} diatur menjadi ${timerSeconds} menit`);
      setShowTimerModal(false);
      setTimerSeconds(0);
      setTimerDevice(null);
      fetchDevices();
    } catch (error) {
      toast.error('Gagal mengatur waktu');
    }
  };

  const addDevice = async () => {
    if (!newDeviceName.trim()) { toast.error('Nama mesin tidak boleh kosong'); return; }
    try {
      await api.post('/devices', { name: newDeviceName, type: newDeviceType, outletId: currentOutlet?.id || '1' });
      toast.success('Mesin berhasil ditambahkan');
      setShowAddModal(false);
      setNewDeviceName('');
      fetchDevices();
    } catch (error) {
      toast.error('Gagal menambah mesin');
    }
  };

  const deleteDevice = async (deviceId: string, deviceName: string) => {
    if (confirm(`Yakin ingin menghapus ${deviceName}?`)) {
      try {
        await api.delete(`/devices/${deviceId}`);
        toast.success('Mesin dihapus');
        fetchDevices();
      } catch (error) {
        toast.error('Gagal menghapus mesin');
      }
    }
  };

  const formatTime = (seconds: number) => {
    if (seconds <= 0) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressPercent = (device: Device) => {
    if (device.status !== 'BUSY') return 0;
    let totalSeconds = 0;
    if (device.type === 'WASHER') {
      if (device.cycle.includes('Cepat')) totalSeconds = 15 * 60;
      else if (device.cycle.includes('Berat')) totalSeconds = 35 * 60;
      else totalSeconds = 25 * 60;
    } else {
      if (device.cycle.includes('Cepat')) totalSeconds = 10 * 60;
      else if (device.cycle.includes('Ekstra')) totalSeconds = 30 * 60;
      else totalSeconds = 20 * 60;
    }
    const remaining = getLocalTimeRemaining(device);
    const elapsed = totalSeconds - remaining;
    return Math.min(100, Math.max(0, (elapsed / totalSeconds) * 100));
  };

  const getStatusStyle = (status: string) => {
    switch(status) {
      case 'ONLINE': return { bg: 'bg-green-100 dark:bg-green-900/30', text: 'text-green-700 dark:text-green-400', dot: 'bg-green-500', label: 'Online', icon: <Wifi className="h-4 w-4" /> };
      case 'BUSY': return { bg: 'bg-blue-100 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500', label: 'Berjalan', icon: <Activity className="h-4 w-4" /> };
      case 'OFFLINE': return { bg: 'bg-red-100 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500', label: 'Offline', icon: <WifiOff className="h-4 w-4" /> };
      case 'MAINTENANCE': return { bg: 'bg-yellow-100 dark:bg-yellow-900/30', text: 'text-yellow-700 dark:text-yellow-400', dot: 'bg-yellow-500', label: 'Maintenance', icon: <Settings className="h-4 w-4" /> };
      default: return { bg: 'bg-gray-100 dark:bg-gray-700', text: 'text-gray-700', dot: 'bg-gray-500', label: 'Unknown', icon: <AlertTriangle className="h-4 w-4" /> };
    }
  };

  const washers = devices.filter(d => d.type === 'WASHER');
  const dryers = devices.filter(d => d.type === 'DRYER');
  const onlineCount = devices.filter(d => d.status === 'ONLINE' || d.status === 'BUSY').length;

  if (loading) {
    return <div className="flex justify-center items-center h-96"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  const DeviceCard = ({ device, type }: { device: Device; type: 'washer' | 'dryer' }) => {
    const style = getStatusStyle(device.status);
    const remaining = getLocalTimeRemaining(device);
    const progress = getProgressPercent(device);
    const isBusy = device.status === 'BUSY';
    const isMaintenance = device.status === 'MAINTENANCE';

    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-4 border hover:shadow-md transition-all h-full flex flex-col">
        <div className="flex justify-between items-start">
          <div className="flex items-center gap-2">
            <div className={`p-2 rounded-lg ${style.bg}`}>{style.icon}</div>
            <div>
              <h3 className="font-semibold text-gray-900 dark:text-white">{device.name}</h3>
              <div className="flex items-center gap-1 mt-0.5">
                <span className={`h-2 w-2 rounded-full ${style.dot}`}></span>
                <span className={`text-xs ${style.text}`}>{style.label}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-1">
            <button onClick={() => { setTimerDevice(device); setTimerSeconds(Math.ceil(remaining / 60)); setShowTimerModal(true); }} className="p-1 text-gray-400 hover:text-green-600"><Clock className="h-4 w-4" /></button>
            <button onClick={() => { setMaintenanceDevice(device); setMaintenanceDate(''); setShowMaintenanceModal(true); }} className="p-1 text-gray-400 hover:text-purple-600"><Calendar className="h-4 w-4" /></button>
            <button onClick={() => deleteDevice(device.id, device.name)} className="p-1 text-gray-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button>
          </div>
        </div>

        <div className="mt-3 space-y-1 flex-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2"><Activity className="h-3 w-3" /> {device.cycle}</p>
          {isBusy && (
            <>
              <div className="flex justify-between items-center text-sm mt-2">
                <span className="text-gray-500 dark:text-gray-400">Sisa waktu</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-lg">{formatTime(remaining)}</span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mt-1 overflow-hidden">
                <div className="h-full rounded-full transition-all duration-1000 ease-linear bg-gradient-to-r from-blue-500 to-purple-500" style={{ width: `${progress}%` }} />
              </div>
            </>
          )}
          {isMaintenance && (
            <div className="mt-2 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <p className="text-xs text-yellow-700 dark:text-yellow-400">Last maintenance: {new Date(device.lastMaintenance).toLocaleDateString()}</p>
            </div>
          )}
          <p className="text-sm text-gray-600 dark:text-gray-400 flex items-center gap-2 mt-2"><Thermometer className="h-3 w-3" /> {device.temperature > 0 ? `${device.temperature}°C` : '-'}</p>
        </div>

        {device.status === 'ONLINE' && (
          <div className="mt-3 flex gap-2">
            {type === 'washer' ? (
              <>
                <button onClick={() => startDevice(device.id, 15, 'Cuci Cepat', 35)} className="flex-1 bg-yellow-500 text-white text-xs py-1.5 rounded">⚡ 15m</button>
                <button onClick={() => startDevice(device.id, 25, 'Cuci Normal', 30)} className="flex-1 bg-blue-600 text-white text-xs py-1.5 rounded">🔄 25m</button>
                <button onClick={() => startDevice(device.id, 35, 'Cuci Berat', 40)} className="flex-1 bg-purple-600 text-white text-xs py-1.5 rounded">💪 35m</button>
              </>
            ) : (
              <>
                <button onClick={() => startDevice(device.id, 10, 'Kering Cepat', 70)} className="flex-1 bg-yellow-500 text-white text-xs py-1.5 rounded">⚡ 10m</button>
                <button onClick={() => startDevice(device.id, 20, 'Kering Normal', 60)} className="flex-1 bg-orange-600 text-white text-xs py-1.5 rounded">🔄 20m</button>
                <button onClick={() => startDevice(device.id, 30, 'Kering Ekstra', 65)} className="flex-1 bg-red-600 text-white text-xs py-1.5 rounded">🔥 30m</button>
              </>
            )}
          </div>
        )}
        {device.status === 'BUSY' && (
          <button onClick={() => stopDevice(device.id, device.name)} className="w-full mt-3 bg-red-600 text-white text-sm py-1.5 rounded">Stop</button>
        )}
        {device.status === 'OFFLINE' && (
          <button onClick={() => powerOnDevice(device.id, device.name)} className="w-full mt-3 bg-green-600 text-white text-sm py-1.5 rounded">Hidupkan</button>
        )}
        {device.status === 'MAINTENANCE' && (
          <button onClick={() => completeMaintenance(device.id, device.name)} className="w-full mt-3 bg-blue-600 text-white text-sm py-1.5 rounded">Selesai Maintenance</button>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">IoT Mesin Laundry</h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Monitoring {devices.length} mesin | Auto refresh setiap 5 detik</p>
        </div>
        <div className="flex gap-2">
          <div className="flex items-center gap-2 px-3 py-2 bg-green-100 dark:bg-green-900/30 rounded-lg">
            <RefreshCw className="h-4 w-4 animate-spin text-green-600" />
            <span className="text-sm text-green-600 dark:text-green-400">Live</span>
          </div>
          <button onClick={fetchDevices} className="px-3 py-2 bg-blue-600 text-white rounded-lg flex items-center gap-2">
            <Database className="h-4 w-4" /> Sync
          </button>
          <button onClick={() => setShowAddModal(true)} className="px-3 py-2 bg-green-600 text-white rounded-lg flex items-center gap-2">
            <Plus className="h-4 w-4" /> Tambah Mesin
          </button>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border"><p className="text-gray-500 text-sm">Total Mesin</p><p className="text-2xl font-bold">{devices.length}</p><p className="text-xs text-gray-400">{washers.length} Cuci + {dryers.length} Dryer</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border"><p className="text-gray-500 text-sm">Online</p><p className="text-2xl font-bold text-green-600">{onlineCount}</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border"><p className="text-gray-500 text-sm">Berjalan</p><p className="text-2xl font-bold text-blue-600">{devices.filter(d => d.status === 'BUSY').length}</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border"><p className="text-gray-500 text-sm">Maintenance</p><p className="text-2xl font-bold text-yellow-600">{devices.filter(d => d.status === 'MAINTENANCE').length}</p></div>
      </div>

      <div>
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Droplet className="h-5 w-5 text-blue-500" /> Mesin Cuci ({washers.length} Unit)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {washers.map(device => <DeviceCard key={device.id} device={device} type="washer" />)}
        </div>
      </div>

      <div className="mt-8">
        <h2 className="text-xl font-semibold mb-4 flex items-center gap-2"><Zap className="h-5 w-5 text-orange-500" /> Mesin Dryer ({dryers.length} Unit)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {dryers.map(device => <DeviceCard key={device.id} device={device} type="dryer" />)}
        </div>
      </div>

      {/* Modals */}
      {showTimerModal && timerDevice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Set Timer - {timerDevice.name}</h2>
            <p className="text-sm text-gray-500 mb-2">Current: {Math.ceil(getLocalTimeRemaining(timerDevice) / 60)} menit</p>
            <input type="number" value={timerSeconds} onChange={(e) => setTimerSeconds(parseInt(e.target.value) || 0)} placeholder="Durasi (menit)" className="w-full p-2 border rounded-lg dark:bg-gray-700" />
            <div className="flex gap-3 pt-4">
              <button onClick={updateTimer} className="flex-1 bg-blue-600 text-white p-2 rounded-lg">Set Timer</button>
              <button onClick={() => { setShowTimerModal(false); setTimerSeconds(0); }} className="flex-1 bg-gray-300 dark:bg-gray-600 p-2 rounded-lg">Batal</button>
            </div>
          </div>
        </div>
      )}

      {showMaintenanceModal && maintenanceDevice && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Jadwalkan Maintenance - {maintenanceDevice.name}</h2>
            <input type="date" value={maintenanceDate} onChange={(e) => setMaintenanceDate(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700 mb-4" />
            <div className="flex gap-3">
              <button onClick={scheduleMaintenance} className="flex-1 bg-purple-600 text-white p-2 rounded-lg">Jadwalkan</button>
              <button onClick={() => { setShowMaintenanceModal(false); setMaintenanceDevice(null); }} className="flex-1 bg-gray-300 dark:bg-gray-600 p-2 rounded-lg">Batal</button>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Tambah Mesin Baru</h2>
            <div className="space-y-4">
              <input type="text" placeholder="Nama Mesin" value={newDeviceName} onChange={(e) => setNewDeviceName(e.target.value)} className="w-full p-2 border rounded-lg dark:bg-gray-700" />
              <select value={newDeviceType} onChange={(e) => setNewDeviceType(e.target.value as 'WASHER' | 'DRYER')} className="w-full p-2 border rounded-lg">
                <option value="WASHER">Mesin Cuci</option>
                <option value="DRYER">Mesin Dryer</option>
              </select>
              <div className="flex gap-3 pt-4">
                <button onClick={addDevice} className="flex-1 bg-blue-600 text-white p-2 rounded-lg">Tambah</button>
                <button onClick={() => setShowAddModal(false)} className="flex-1 bg-gray-300 dark:bg-gray-600 p-2 rounded-lg">Batal</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IoTDevices;