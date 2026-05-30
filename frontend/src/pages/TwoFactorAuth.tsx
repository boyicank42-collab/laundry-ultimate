import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Shield, Smartphone, Key, CheckCircle, AlertCircle, RefreshCw, Copy, QrCode } from 'lucide-react';
import toast from 'react-hot-toast';

interface TwoFactorAuthProps {
  onVerified?: () => void;
}

const TwoFactorAuth = ({ onVerified }: TwoFactorAuthProps) => {
  const { user, token } = useAuth();
  const [is2FAEnabled, setIs2FAEnabled] = useState(false);
  const [qrCode, setQrCode] = useState('');
  const [secret, setSecret] = useState('');
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [verificationCode, setVerificationCode] = useState('');
  const [loading, setLoading] = useState(true);
  const [setupMode, setSetupMode] = useState(false);
  const [recoveryMode, setRecoveryMode] = useState(false);
  const [backupCodeInput, setBackupCodeInput] = useState('');

  useEffect(() => {
    check2FAStatus();
  }, []);

  const check2FAStatus = async () => {
    try {
      const res = await api.get('/auth/2fa/status');
      setIs2FAEnabled(res.data.enabled);
    } catch (error) {
      console.error('Failed to check 2FA status:', error);
    } finally {
      setLoading(false);
    }
  };

  const setup2FA = async () => {
    try {
      const res = await api.post('/auth/2fa/setup');
      setQrCode(res.data.qrCode);
      setSecret(res.data.secret);
      setBackupCodes(res.data.backupCodes);
      setSetupMode(true);
      toast.success('Scan QR code dengan aplikasi authenticator');
    } catch (error) {
      toast.error('Gagal setup 2FA');
    }
  };

  const verifyAndEnable = async () => {
    if (!verificationCode) {
      toast.error('Masukkan kode verifikasi');
      return;
    }
    try {
      await api.post('/auth/2fa/verify', { code: verificationCode });
      toast.success('2FA berhasil diaktifkan!');
      setIs2FAEnabled(true);
      setSetupMode(false);
      setVerificationCode('');
      check2FAStatus();
      if (onVerified) onVerified();
    } catch (error) {
      toast.error('Kode verifikasi salah');
    }
  };

  const disable2FA = async () => {
    if (confirm('Yakin ingin menonaktifkan 2FA? Ini akan mengurangi keamanan akun Anda.')) {
      try {
        await api.post('/auth/2fa/disable');
        toast.success('2FA berhasil dinonaktifkan');
        setIs2FAEnabled(false);
        check2FAStatus();
      } catch (error) {
        toast.error('Gagal menonaktifkan 2FA');
      }
    }
  };

  const verifyRecovery = async () => {
    if (!backupCodeInput) {
      toast.error('Masukkan backup code');
      return;
    }
    try {
      await api.post('/auth/2fa/recovery', { code: backupCodeInput });
      toast.success('Verifikasi berhasil! Silakan login ulang.');
      setTimeout(() => {
        window.location.href = '/login';
      }, 2000);
    } catch (error) {
      toast.error('Backup code salah');
    }
  };

  const copyBackupCodes = () => {
    const codes = backupCodes.join('\n');
    navigator.clipboard.writeText(codes);
    toast.success('Backup codes disalin ke clipboard');
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div></div>;
  }

  if (recoveryMode) {
    return (
      <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <Shield className="h-12 w-12 text-red-500 mx-auto mb-3" />
          <h2 className="text-2xl font-bold">Verifikasi 2FA</h2>
          <p className="text-gray-500 mt-2">Masukkan backup code untuk mengakses akun Anda</p>
        </div>
        <input type="text" placeholder="Backup Code (contoh: XXXXX-XXXXX)" value={backupCodeInput} onChange={(e) => setBackupCodeInput(e.target.value)} className="w-full p-3 border rounded-lg mb-4" />
        <button onClick={verifyRecovery} className="w-full bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700">Verifikasi</button>
      </div>
    );
  }

  if (setupMode) {
    return (
      <div className="max-w-2xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
        <div className="text-center mb-6">
          <QrCode className="h-12 w-12 text-blue-500 mx-auto mb-3" />
          <h2 className="text-2xl font-bold">Setup 2FA</h2>
          <p className="text-gray-500 mt-2">Scan QR code dengan Google Authenticator atau aplikasi sejenis</p>
        </div>
        <div className="flex justify-center mb-6">
          <img src={qrCode} alt="QR Code" className="w-48 h-48 border p-2 rounded-lg" />
        </div>
        <div className="bg-gray-50 dark:bg-gray-700 p-4 rounded-lg mb-6">
          <p className="text-sm text-gray-500 mb-2">Atau masukkan kode manual:</p>
          <code className="block text-center font-mono text-lg bg-gray-100 dark:bg-gray-800 p-2 rounded">{secret}</code>
        </div>
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">Kode Verifikasi</label>
          <input type="text" placeholder="Masukkan 6 digit kode" value={verificationCode} onChange={(e) => setVerificationCode(e.target.value)} className="w-full p-3 border rounded-lg" />
        </div>
        <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 rounded-lg p-4 mb-6">
          <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-300 mb-2">⚠️ Simpan Backup Codes!</p>
          <div className="bg-white dark:bg-gray-800 p-3 rounded font-mono text-sm">
            {backupCodes.map((code, i) => <div key={i}>{code}</div>)}
          </div>
          <button onClick={copyBackupCodes} className="mt-2 text-sm text-blue-600 flex items-center gap-1"><Copy className="h-3 w-3" /> Salin backup codes</button>
        </div>
        <div className="flex gap-3">
          <button onClick={verifyAndEnable} className="flex-1 bg-green-600 text-white p-3 rounded-lg hover:bg-green-700">Aktifkan 2FA</button>
          <button onClick={() => setSetupMode(false)} className="flex-1 bg-gray-300 dark:bg-gray-600 p-3 rounded-lg">Batal</button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg p-8">
      <div className="text-center mb-6">
        <Shield className={`h-12 w-12 mx-auto mb-3 ${is2FAEnabled ? 'text-green-500' : 'text-gray-400'}`} />
        <h2 className="text-2xl font-bold">Two-Factor Authentication</h2>
        <p className="text-gray-500 mt-2">Tingkatkan keamanan akun Anda</p>
      </div>
      <div className={`p-4 rounded-lg mb-6 ${is2FAEnabled ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'}`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {is2FAEnabled ? <CheckCircle className="h-5 w-5 text-green-500" /> : <AlertCircle className="h-5 w-5 text-gray-400" />}
            <span>Status: {is2FAEnabled ? 'Aktif' : 'Nonaktif'}</span>
          </div>
          {is2FAEnabled ? (
            <button onClick={disable2FA} className="text-red-600 text-sm hover:underline">Nonaktifkan</button>
          ) : (
            <button onClick={setup2FA} className="text-blue-600 text-sm hover:underline">Setup 2FA</button>
          )}
        </div>
      </div>
      {is2FAEnabled && (
        <div className="border-t pt-4 mt-4">
          <p className="text-sm text-gray-500 mb-3 flex items-center gap-2"><Smartphone className="h-4 w-4" /> Aplikasi Authenticator:</p>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>• Google Authenticator</li>
            <li>• Microsoft Authenticator</li>
            <li>• Authy</li>
          </ul>
          <button onClick={() => setRecoveryMode(true)} className="mt-4 text-sm text-blue-600 hover:underline">Lupa akses ke authenticator?</button>
        </div>
      )}
    </div>
  );
};

export default TwoFactorAuth;