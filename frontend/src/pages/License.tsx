import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Key, Shield, CheckCircle, XCircle, Copy, RefreshCw, Package, User, Calendar, AlertTriangle } from 'lucide-react';
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
  const [allLicenses, setAllLicenses] = useState<any[]>([]);
  const [showManage, setShowManage] = useState(false);

  useEffect(() => {
    fetchLicenseStatus();
    fetchHardwareId();
    if (user?.role === 'ADMIN') {
      fetchAllLicenses();
    }
  }, []);

  const fetchLicenseStatus = async () => {
    setLoading(true);
    try {
      const res = await api.get('/license');
      console.log('License data from DB:', res.data);
      
      if (res.data.success && res.data.data && res.data.data.length > 0) {
        const activeLicense = res.data.data.find((l: any) => l.isActive === true);
        if (activeLicense) {
          setLicenseInfo({
            active: true,
            package: activeLicense.packageType,
            customer: activeLicense.customerName,
            expiry: activeLicense.expiryDate,
            licenseKey: activeLicense.licenseKey,
            hardwareId: activeLicense.hardwareId,
            message: 'Lisensi aktif'
          });
        } else {
          setLicenseInfo({ 
            active: false, 
            message: 'Tidak ada lisensi aktif. Silakan aktivasi lisensi.' 
          });
        }
      } else {
        setLicenseInfo({ 
          active: false, 
          message: 'Belum ada lisensi. Silakan aktivasi lisensi.' 
        });
      }
    } catch (error) {
      console.error('Failed to fetch license:', error);
      setLicenseInfo({ 
        active: false, 
        message: 'Gagal memuat lisensi. Periksa koneksi ke server.' 
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchAllLicenses = async () => {
    try {
      const res = await api.get('/license');
      if (res.data.success) {
        setAllLicenses(res.data.data);
      }
    } catch (error) {
      console.error('Failed to fetch all licenses:', error);
    }
  };

  const fetchHardwareId = async () => {
    try {
      const res = await api.get('/license/hardware-id');
      setHardwareId(res.data.hardwareId);
    } catch (error) {
      console.error('Failed to fetch hardware ID:', error);
      setHardwareId('HARDWARE-ID-DEFAULT');
    }
  };

  const activateLicense = async () => {
    if (!licenseKey) {
      toast.error('Masukkan kode lisensi');
      return;
    }
    
    toast.loading('Memverifikasi lisensi...', { id: 'activate' });
    
    try {
      const res = await api.post('/license/activate', { 
        licenseKey,
        hardwareId: hardwareId 
      });
      
      if (res.data.success) {
        toast.success('Lisensi berhasil diaktifkan!', { id: 'activate' });
        fetchLicenseStatus();
        setShowActivate(false);
        setLicenseKey('');
      } else {
        toast.error(res.data.error || 'Gagal mengaktifkan lisensi', { id: 'activate' });
      }
    } catch (error: any) {
      const errorMsg = error.response?.data?.error || 'Gagal mengaktifkan lisensi';
      toast.error(errorMsg, { id: 'activate' });
    }
  };

  const generateLicense = async () => {
    if (!customerName) {
      toast.error('Masukkan nama customer');
      return;
    }
    
    toast.loading('Membuat lisensi...', { id: 'generate' });
    
    try {
      const res = await api.post('/license/generate', {
        packageType: selectedPackage,
        customerName: customerName,
        expiryDate: expiryDate,
        hardwareId: 'PENDING-ACTIVATION'
      });
      
      if (res.data.success) {
        setGeneratedKey(res.data.data.licenseKey);
        toast.success('Lisensi berhasil dibuat!', { id: 'generate' });
        fetchAllLicenses();
        setCustomerName('');
        setExpiryDate('2027-12-31');
      } else {
        toast.error(res.data.error || 'Gagal membuat lisensi', { id: 'generate' });
      }
    } catch (error: any) {
      toast.error(error.response?.data?.error || 'Gagal membuat lisensi', { id: 'generate' });
    }
  };

  const deleteLicense = async (id: string) => {
    if (!confirm('Yakin ingin menghapus lisensi ini?')) return;
    
    try {
      await api.delete(`/license/${id}`);
      toast.success('Lisensi berhasil dihapus');
      fetchAllLicenses();
      fetchLicenseStatus();
    } catch (error) {
      toast.error('Gagal menghapus lisensi');
    }
  };

  const copyLicenseKey = () => {
    navigator.clipboard.writeText(generatedKey);
    toast.success('Kode lisensi disalin');
  };

  const copyExistingKey = (key: string) => {
    navigator.clipboard.writeText(key);
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
          <button 
            onClick={() => setShowActivate(true)} 
            className="bg-blue-600 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-blue-700 transition"
          >
            <Key className="h-4 w-4" /> Aktivasi Lisensi
          </button>
        )}
      </div>

      {/* License Status Card */}
      <div className={`rounded-xl p-6 border ${licenseInfo?.active ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
        <div className="flex items-center gap-3 mb-4">
          {licenseInfo?.active ? (
            <CheckCircle className="h-8 w-8 text-green-600" />
          ) : (
            <XCircle className="h-8 w-8 text-red-600" />
          )}
          <div>
            <h2 className="text-xl font-bold">
              {licenseInfo?.active ? 'Lisensi Aktif' : 'Lisensi Tidak Aktif'}
            </h2>
            <p className={licenseInfo?.active ? 'text-green-600' : 'text-red-600'}>
              {licenseInfo?.message || 'Silakan aktivasi lisensi'}
            </p>
          </div>
        </div>
        
        {licenseInfo?.active && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4 pt-4 border-t border-green-200">
            <div className="flex items-center gap-2">
              <Package className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Paket</p>
                <p className="font-semibold">{licenseInfo.package || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <User className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Customer</p>
                <p className="font-semibold">{licenseInfo.customer || '-'}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-blue-600" />
              <div>
                <p className="text-sm text-gray-500">Berlaku sampai</p>
                <p className="font-semibold">
                  {licenseInfo.expiry ? new Date(licenseInfo.expiry).toLocaleDateString('id-ID') : '-'}
                </p>
              </div>
            </div>
          </div>
        )}
        
        {!licenseInfo?.active && (
          <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
            <p className="text-sm text-yellow-700 flex items-center gap-2">
              <AlertTriangle className="h-4 w-4" />
              Untuk mengaktifkan software, silakan masukkan kode lisensi yang valid.
            </p>
          </div>
        )}
      </div>

      {/* Hardware ID */}
      <div className="bg-white rounded-xl p-6 border">
        <h3 className="font-semibold mb-2 flex items-center gap-2">
          <Shield className="h-5 w-5" /> Hardware ID
        </h3>
        <p className="text-sm text-gray-500 mb-2">ID unik untuk komputer ini:</p>
        <code className="block bg-gray-100 p-3 rounded-lg text-sm font-mono break-all">
          {hardwareId || 'Loading...'}
        </code>
        <p className="text-xs text-gray-400 mt-2">
          Hardware ID digunakan untuk mengikat lisensi ke komputer tertentu.
        </p>
      </div>

      {/* Admin: Manage All Licenses */}
      {user?.role === 'ADMIN' && (
        <div className="bg-white rounded-xl p-6 border">
          <button 
            onClick={() => setShowManage(!showManage)}
            className="flex items-center justify-between w-full"
          >
            <h3 className="font-semibold flex items-center gap-2">
              <Key className="h-5 w-5" /> Manajemen Lisensi (Admin)
            </h3>
            <span>{showManage ? '▲' : '▼'}</span>
          </button>
          
          {showManage && (
            <div className="mt-4 space-y-4">
              {/* Generate New License */}
              <div className="bg-gradient-to-r from-blue-50 to-green-50 p-4 rounded-lg border-2 border-blue-200">
                <h4 className="font-bold text-lg mb-3 flex items-center gap-2">
                  <Key className="h-5 w-5 text-blue-600" />
                  Generate Lisensi Baru
                </h4>
                <p className="text-sm text-gray-600 mb-3">
                  Buat kode lisensi baru untuk diberikan ke customer.
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3 mb-3">
                  <select 
                    value={selectedPackage} 
                    onChange={(e) => setSelectedPackage(e.target.value)} 
                    className="p-2 border rounded-lg bg-white"
                  >
                    <option value="BASIC">Basic</option>
                    <option value="PRO">Pro</option>
                    <option value="ULTIMATE">Ultimate</option>
                    <option value="ENTERPRISE">Enterprise</option>
                  </select>
                  <input 
                    type="text" 
                    placeholder="Nama Customer" 
                    value={customerName} 
                    onChange={(e) => setCustomerName(e.target.value)} 
                    className="p-2 border rounded-lg bg-white"
                  />
                  <input 
                    type="date" 
                    value={expiryDate} 
                    onChange={(e) => setExpiryDate(e.target.value)} 
                    className="p-2 border rounded-lg bg-white"
                  />
                  <button 
                    onClick={generateLicense} 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition flex items-center justify-center gap-2 font-semibold"
                  >
                    <RefreshCw className="h-4 w-4" /> Generate Lisensi
                  </button>
                </div>
                
                {generatedKey && (
                  <div className="mt-4 p-4 bg-green-100 rounded-lg border-2 border-green-300">
                    <p className="text-sm font-bold text-green-800 mb-2">✅ LISENSI BERHASIL DIBUAT!</p>
                    <p className="text-xs text-gray-600 mb-1">Kode Lisensi untuk Customer:</p>
                    <code className="block bg-white p-3 rounded-lg text-base font-mono break-all border">
                      {generatedKey}
                    </code>
                    <div className="flex gap-2 mt-3">
                      <button 
                        onClick={copyLicenseKey} 
                        className="bg-blue-600 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-blue-700 transition flex items-center gap-1"
                      >
                        <Copy className="h-3 w-3" /> Salin Kode
                      </button>
                      <button 
                        onClick={() => setGeneratedKey('')} 
                        className="bg-gray-500 text-white px-3 py-1.5 rounded-lg text-sm hover:bg-gray-600 transition"
                      >
                        Tutup
                      </button>
                    </div>
                  </div>
                )}
              </div>
              
              {/* List All Licenses */}
              {allLicenses.length > 0 && (
                <div className="bg-white p-4 rounded-lg border">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Package className="h-4 w-4" /> Daftar Lisensi ({allLicenses.length})
                  </h4>
                  <div className="space-y-2 max-h-80 overflow-y-auto">
                    {allLicenses.map((lic: any) => (
                      <div key={lic.id} className="border rounded-lg p-3 bg-gray-50">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${lic.isActive ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                                {lic.isActive ? 'AKTIF' : 'BELUM AKTIF'}
                              </span>
                              <span className="text-xs font-semibold text-blue-600">{lic.packageType}</span>
                            </div>
                            <p className="font-medium text-gray-800">{lic.customerName}</p>
                            <p className="text-xs text-gray-500 font-mono">{lic.licenseKey}</p>
                            <p className="text-xs text-gray-400">
                              Berlaku: {new Date(lic.expiryDate).toLocaleDateString('id-ID')}
                            </p>
                          </div>
                          <div className="flex gap-2">
                            <button 
                              onClick={() => copyExistingKey(lic.licenseKey)}
                              className="text-blue-600 hover:text-blue-700 text-sm p-1"
                              title="Salin kode"
                            >
                              <Copy className="h-4 w-4" />
                            </button>
                            <button 
                              onClick={() => deleteLicense(lic.id)}
                              className="text-red-600 hover:text-red-700 text-sm p-1"
                              title="Hapus lisensi"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {allLicenses.length === 0 && (
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200 text-center">
                  <p className="text-yellow-700">Belum ada lisensi yang dibuat.</p>
                  <p className="text-sm text-yellow-600 mt-1">Gunakan form di atas untuk membuat lisensi pertama.</p>
                </div>
              )}
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
            <input 
              type="text" 
              placeholder="Contoh: A1B2C3D4E5F6G7H8I9J0" 
              value={licenseKey} 
              onChange={(e) => setLicenseKey(e.target.value.toUpperCase())} 
              className="w-full p-3 border rounded-lg mb-4 font-mono text-sm"
              autoFocus
            />
            <div className="text-xs text-gray-400 mb-4">
              Hardware ID: <span className="font-mono">{hardwareId?.substring(0, 20)}...</span>
            </div>
            <div className="flex gap-3">
              <button 
                onClick={activateLicense} 
                className="flex-1 bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition"
              >
                Aktivasi
              </button>
              <button 
                onClick={() => setShowActivate(false)} 
                className="flex-1 bg-gray-300 p-2 rounded-lg hover:bg-gray-400 transition"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default License;