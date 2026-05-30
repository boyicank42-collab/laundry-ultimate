import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Database, Download, Trash2, RefreshCw, Save, Clock, Calendar, HardDrive, AlertCircle, CheckCircle, Upload, Cloud } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Backup {
  name: string;
  size: number;
  createdAt: string;
  type: string;
}

interface BackupStats {
  totalBackups: number;
  totalSize: number;
  lastBackup: string | null;
  autoBackupEnabled: boolean;
}

const BackupRestore = () => {
  const { token } = useAuth();
  const [backups, setBackups] = useState<Backup[]>([]);
  const [stats, setStats] = useState<BackupStats>({
    totalBackups: 0,
    totalSize: 0,
    lastBackup: null,
    autoBackupEnabled: true
  });
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [restoring, setRestoring] = useState(false);

  useEffect(() => {
    fetchBackups();
    fetchStats();
  }, []);

  const fetchBackups = async () => {
    try {
      const res = await api.get('/backup/list');
      setBackups(res.data);
      const totalSize = res.data.reduce((sum: number, b: Backup) => sum + b.size, 0);
      const lastBackup = res.data.length > 0 ? res.data[0].createdAt : null;
      setStats(prev => ({ ...prev, totalBackups: res.data.length, totalSize: totalSize, lastBackup: lastBackup }));
    } catch (error) {
      toast.error('Gagal memuat daftar backup');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/backup/stats');
      setStats(prev => ({ ...prev, ...res.data }));
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const createBackup = async () => {
    try {
      const res = await api.post('/backup/create');
      toast.success('Backup berhasil dibuat: ' + res.data.backupName);
      fetchBackups();
    } catch (error) {
      toast.error('Gagal membuat backup');
    }
  };

  const downloadBackup = async (filename: string) => {
    try {
      window.open('/api/backup/download/' + filename, '_blank');
      toast.success('Download dimulai');
    } catch (error) {
      toast.error('Gagal download backup');
    }
  };

  const deleteBackup = async (filename: string) => {
    if (confirm('Hapus backup ' + filename + '?')) {
      try {
        await api.delete('/backup/' + filename);
        toast.success('Backup dihapus');
        fetchBackups();
      } catch (error) {
        toast.error('Gagal hapus backup');
      }
    }
  };

  const restoreBackup = async (filename: string) => {
    if (confirm('Restore backup ' + filename + '? Semua data saat ini akan diganti.')) {
      setRestoring(true);
      try {
        await api.post('/backup/restore', { filename });
        toast.success('Backup berhasil direstore');
        setTimeout(() => { window.location.reload(); }, 2000);
      } catch (error) {
        toast.error('Gagal restore backup');
      } finally {
        setRestoring(false);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.name.endsWith('.json') && !file.name.endsWith('.zip')) {
      toast.error('Hanya file .json atau .zip yang didukung');
      return;
    }
    setUploading(true);
    const formData = new FormData();
    formData.append('backup', file);
    try {
      await api.post('/backup/upload', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
      toast.success('Backup berhasil diupload');
      fetchBackups();
    } catch (error) {
      toast.error('Gagal upload backup');
    } finally {
      setUploading(false);
    }
  };

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(2) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(2) + ' MB';
  };

  const formatDate = (date: string) => {
    return format(new Date(date), 'dd MMM yyyy HH:mm:ss', { locale: id });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Database className="h-6 w-6 text-blue-600" /> Backup & Restore
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">Backup dan pulihkan database dengan mudah</p>
        </div>
        <div className="flex gap-2">
          <button onClick={fetchBackups} className="bg-gray-200 dark:bg-gray-700 p-2 rounded-lg">
            <RefreshCw className="h-5 w-5" />
          </button>
          <label className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 cursor-pointer">
            <Upload className="h-4 w-4" /> Upload Backup
            <input type="file" accept=".json,.zip" onChange={handleFileUpload} disabled={uploading} className="hidden" />
          </label>
          <button onClick={createBackup} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Save className="h-4 w-4" /> Backup Sekarang
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30"><Database className="h-5 w-5 text-blue-600" /></div>
            <div><p className="text-gray-500 text-sm">Total Backup</p><p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBackups}</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-100 dark:bg-green-900/30"><HardDrive className="h-5 w-5 text-green-600" /></div>
            <div><p className="text-gray-500 text-sm">Total Ukuran</p><p className="text-2xl font-bold text-green-600">{formatSize(stats.totalSize)}</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/30"><Clock className="h-5 w-5 text-yellow-600" /></div>
            <div><p className="text-gray-500 text-sm">Terakhir Backup</p><p className="text-sm font-semibold text-gray-900 dark:text-white">{stats.lastBackup ? formatDate(stats.lastBackup) : 'Belum pernah'}</p></div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30"><Calendar className="h-5 w-5 text-purple-600" /></div>
            <div><p className="text-gray-500 text-sm">Auto Backup</p><p className="text-2xl font-bold text-purple-600">{stats.autoBackupEnabled ? '✅ Aktif' : '❌ Nonaktif'}</p></div>
          </div>
        </div>
      </div>

      {/* Info Box */}
      <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 p-4 rounded-lg">
        <div className="flex items-center gap-2">
          <AlertCircle className="h-5 w-5 text-blue-600" />
          <span className="font-semibold text-blue-800 dark:text-blue-300">Informasi Backup</span>
        </div>
        <p className="text-blue-700 dark:text-blue-400 text-sm mt-1">• Backup otomatis dilakukan setiap hari pukul 02:00 pagi</p>
        <p className="text-blue-700 dark:text-blue-400 text-sm">• File backup disimpan di folder /backups</p>
        <p className="text-blue-700 dark:text-blue-400 text-sm">• Restore akan mengganti semua data saat ini</p>
      </div>

      {/* Backups Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700/50 border-b">
              <tr>
                <th className="text-left px-6 py-3">Nama File</th>
                <th className="text-left px-6 py-3">Tanggal</th>
                <th className="text-left px-6 py-3">Ukuran</th>
                <th className="text-left px-6 py-3">Tipe</th>
                <th className="text-center px-6 py-3">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></td></tr>
              ) : backups.length === 0 ? (
                <tr><td colSpan={5} className="text-center py-12">
                  <Database className="h-16 w-16 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">Belum ada backup</p>
                  <button onClick={createBackup} className="mt-3 text-blue-600 hover:underline">Buat backup pertama</button>
                </td></tr>
              ) : (
                backups.map((backup) => (
                  <tr key={backup.name} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td className="px-6 py-4 font-mono text-sm">{backup.name}</td>
                    <td className="px-6 py-4 text-sm">{formatDate(backup.createdAt)}</td>
                    <td className="px-6 py-4 text-sm">{formatSize(backup.size)}</td>
                    <td className="px-6 py-4"><span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full text-xs">{backup.type || 'manual'}</span></td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex gap-2 justify-center">
                        <button onClick={() => downloadBackup(backup.name)} className="text-blue-600 hover:text-blue-800" title="Download">
                          <Download className="h-5 w-5" />
                        </button>
                        <button onClick={() => restoreBackup(backup.name)} disabled={restoring} className="text-green-600 hover:text-green-800" title="Restore">
                          <RefreshCw className={`h-5 w-5 ${restoring ? 'animate-spin' : ''}`} />
                        </button>
                        <button onClick={() => deleteBackup(backup.name)} className="text-red-600 hover:text-red-800" title="Hapus">
                          <Trash2 className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Schedule Info */}
      <div className="bg-gradient-to-r from-gray-50 to-gray-100 dark:from-gray-800 dark:to-gray-700 rounded-xl p-5 border">
        <div className="flex justify-between items-center flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <Cloud className="h-6 w-6 text-blue-600" />
            <div>
              <h3 className="font-semibold">Backup Terjadwal</h3>
              <p className="text-sm text-gray-500">Backup otomatis setiap hari pukul 02:00 pagi</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="text-sm">Sistem berjalan normal</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BackupRestore;