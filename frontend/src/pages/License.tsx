import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Key, Shield, CheckCircle, XCircle, Copy, RefreshCw, Package, User, Calendar } from 'lucide-react';
import toast from 'react-hot-toast';

const License = () => {
  const { user } = useAuth();
  const [licenseInfo, setLicenseInfo] = useState<any>({ active: false });
  const [loading, setLoading] = useState(true);
  const [licenseKey, setLicenseKey] = useState('');
  const [showActivate, setShowActivate] = useState(false);
  const [hardwareId, setHardwareId] = useState('');
  const [selectedPackage, setSelectedPackage] = useState('ULTIMATE');
  const [customerName, setCustomerName] = useState('');
  const [expiryDate, setExpiryDate] = useState('2027-12-31');
  const [generatedKey, setGeneratedKey] = useState('');

  useEffect(() => {
    fetchLicenseStatus();
    fetchHardwareId();
  }, []);

  const fetchLicenseStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/license/status');
      setLicenseInfo(res.data);
    } catch (error) {
      console.error('Failed to fetch license:', error);
      setLicenseInfo({ active: false, message: 'Gagal memuat lisensi' });
    } finally {
      setLoading(false);
    }
  };

  const fetchHardwareId = async () => {
    try {
      const res = await api.get('/license/hardware-id');
      setHardwareId(res.data.hardwareId);
    } catch (error) {
      console.error('Failed to fetch hardware ID:', error);
    }
  };

  const activateLicense = async () => {
    if (!licenseKey) {
      toast.error('Masukkan kode lisensi');
      return;
    }
    try {
      const res = await api.post('/license/activate', { licenseKey });
      if (res.data.success) {
        toast.success('Lisensi berhasil diaktifkan!');
        fetchLicenseStatus();
        setShowActivate(false);
        setLicenseKey('');
      } else {
        toast.error(res.data.message);
      }
    } catch (error) {
      toast.error('Gagal mengaktifkan lisensi');
    }
  };

  const generateLicense = async () => {
    if (!customerName) {
      toast.error('Masukkan nama customer');
      return;
    }
    try {
      const res = await api.post('/license/generate', {
        packageType: selectedPackage,
        customerName,
        expiryDate
      });
      setGeneratedKey(res.data.licenseKey);
      toast.success('Lisensi berhasil dibuat');
    } catch (error) {
      toast.error('Gagal membuat lisensi');
    }
  };

  const copyLicenseKey = () => {
    navigator.clipboard.writeText(generatedKey);
    toast.success('Kode lisensi disalin');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Key className="h-6 w-6 text-blue-600" /> Lisensi Software
          </h1>
          <p className="text-gray-500">Kelola lisensi dan aktivasi software</p>
        </div>
        {!licenseInfo?.active && (
          <button onClick={() => setShowActivate(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2">
            <Key className="h-4 w-4" /> Aktivasi Lisensi
          </button>
        )}
      </div>

      {/* License Status Card */}
      <div className={`rounded-xl p-6 border ${licenseInfo?.active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          {licenseInfo?.active ? <CheckCircle className="h-8 w-8 text-green-600" /> : <XCircle className="h-8 w-8 text-red-600" />}
          <div>
            <h2 className="text-xl font-bold">{licenseInfo?.active ? 'Lisensi Aktif' : 'Lisensi Tidak Aktif'}</h2>
            <p className="text-gray-600">{licenseInfo?.message || 'Silakan aktivasi lisensi'}</p>
          </div>
        </div>
        {licenseInfo?.active && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t">
            <div className="flex items-center gap-2"><Package className="h-5 w-5 text-blue-600" /><div><p className="text-sm text-gray-500">Paket</p><p className="font-semibold">{licenseInfo.package}</p></div></div>
            <div className="flex items-center gap-2"><User className="h-5 w-5 text-blue-600" /><div><p className="text-sm text-gray-500">Customer</p><p className="font-semibold">{licenseInfo.customer}</p></div></div>
            <div className="flex items-center gap-2"><Calendar className="h-5 w-5 text-blue-600" /><div><p className="text-sm text-gray-500">Berlaku sampai</p><p className="font-semibold">{licenseInfo.expiry ? new Date(licenseInfo.expiry).toLocaleDateString() : '-'}</p></div></div>
          </div>
        )}
      </div>

      {/* Hardware ID */}
      <div className="bg-white rounded-xl p-6 border">
        <h3 className="font-semibold mb-2 flex items-center gap-2"><Shield className="h-5 w-5" /> Hardware ID</h3>
        <p className="text-sm text-gray-500 mb-2">ID unik untuk komputer ini:</p>
        <code className="block bg-gray-100 p-3 rounded-lg text-sm font-mono break-all">{hardwareId || 'Loading...'}</code>
      </div>

      {/* Admin Generate License */}
      {user?.role === 'ADMIN' && (
        <div className="bg-white rounded-xl p-6 border">
          <h3 className="font-semibold mb-4 flex items-center gap-2"><Key className="h-5 w-5" /> Generate Lisensi (Admin)</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
            <select value={selectedPackage} onChange={(e) => setSelectedPackage(e.target.value)} className="p-2 border rounded-lg">
              <option value="BASIC">Basic</option>
              <option value="PRO">Pro</option>
              <option value="ULTIMATE">Ultimate</option>
              <option value="ENTERPRISE">Enterprise</option>
            </select>
            <input type="text" placeholder="Nama Customer" value={customerName} onChange={(e) => setCustomerName(e.target.value)} className="p-2 border rounded-lg" />
            <input type="date" value={expiryDate} onChange={(e) => setExpiryDate(e.target.value)} className="p-2 border rounded-lg" />
          </div>
          <button onClick={generateLicense} className="bg-green-600 text-white px-4 py-2 rounded-lg">Generate Lisensi</button>
          {generatedKey && (
            <div className="mt-4 p-3 bg-gray-100 rounded-lg">
              <p className="text-sm font-medium mb-1">Kode Lisensi:</p>
              <code className="block text-xs font-mono break-all">{generatedKey}</code>
              <button onClick={copyLicenseKey} className="mt-2 text-sm text-blue-600 flex items-center gap-1"><Copy className="h-3 w-3" /> Salin</button>
            </div>
          )}
        </div>
      )}

      {/* Activation Modal */}
      {showActivate && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Aktivasi Lisensi</h2>
            <p className="text-gray-500 mb-4">Masukkan kode lisensi yang Anda terima</p>
            <input type="text" placeholder="XXXXX-XXXXX-XXXXX-XXXXX" value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} className="w-full p-3 border rounded-lg mb-4 font-mono" />
            <div className="flex gap-3">
              <button onClick={activateLicense} className="flex-1 bg-blue-600 text-white p-2 rounded-lg">Aktivasi</button>
              <button onClick={() => setShowActivate(false)} className="flex-1 bg-gray-300 p-2 rounded-lg">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default License;