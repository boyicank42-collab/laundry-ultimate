import { useEffect, useState } from 'react';
import { Wifi, WifiOff, Cloud, CloudOff } from 'lucide-react';
import { isOnline, syncOfflineTransactions, getPendingCount, initOfflineListener } from '../services/offlineService';
import toast from 'react-hot-toast';

const OfflineIndicator = () => {
  const [online, setOnline] = useState(isOnline());
  const [pendingCount, setPendingCount] = useState(0);
  const [syncing, setSyncing] = useState(false);

  useEffect(() => {
    // Update pending count setiap 5 detik
    const interval = setInterval(() => {
      setPendingCount(getPendingCount());
    }, 5000);
    
    // Setup listener koneksi
    initOfflineListener((status) => {
      setOnline(status);
      if (status) {
        toast.success('Koneksi pulih! Menyinkronkan data...');
        handleSync();
      } else {
        toast.error('Koneksi terputus! Transaksi akan disimpan secara lokal.');
      }
    });
    
    return () => clearInterval(interval);
  }, []);

  const handleSync = async () => {
    if (!online || syncing) return;
    setSyncing(true);
    const { synced, failed } = await syncOfflineTransactions();
    if (synced > 0) {
      toast.success(`${synced} transaksi berhasil disinkronkan`);
    }
    if (failed > 0) {
      toast.error(`${failed} transaksi gagal disinkronkan`);
    }
    setPendingCount(getPendingCount());
    setSyncing(false);
  };

  if (online && pendingCount === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-green-100 dark:bg-green-900/30 rounded-full text-green-700 dark:text-green-400 text-sm">
        <Wifi className="h-4 w-4" />
        <span>Online</span>
      </div>
    );
  }

  if (!online) {
    return (
      <div className="flex items-center gap-2 px-3 py-1 bg-red-100 dark:bg-red-900/30 rounded-full text-red-700 dark:text-red-400 text-sm">
        <WifiOff className="h-4 w-4" />
        <span>Offline</span>
        {pendingCount > 0 && (
          <span className="ml-1 bg-red-500 text-white px-1.5 py-0.5 rounded-full text-xs">
            {pendingCount}
          </span>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/30 rounded-full text-yellow-700 dark:text-yellow-400 text-sm">
      <Cloud className="h-4 w-4" />
      <span>Pending Sync</span>
      <span className="ml-1 bg-yellow-500 text-white px-1.5 py-0.5 rounded-full text-xs">
        {pendingCount}
      </span>
      <button 
        onClick={handleSync} 
        disabled={syncing}
        className="ml-2 text-xs underline hover:no-underline disabled:opacity-50"
      >
        {syncing ? 'Syncing...' : 'Sync Now'}
      </button>
    </div>
  );
};

export default OfflineIndicator;