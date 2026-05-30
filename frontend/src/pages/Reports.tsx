import { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../contexts/AuthContext';
import { FileText, Download, Calendar, TrendingUp, Package, DollarSign } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';

const Reports = () => {
  const { token } = useAuth();
  const [startDate, setStartDate] = useState(format(new Date().setDate(1), 'yyyy-MM-dd'));
  const [endDate, setEndDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<any>(null);

  const generateReport = async (format: 'json' | 'excel') => {
    setLoading(true);
    try {
      if (format === 'excel') {
        const response = await axios.get('/api/reports/transactions', {
          params: { startDate, endDate, format: 'excel' },
          responseType: 'blob'
        });
        
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', `laporan_transaksi_${startDate}_${endDate}.xlsx`);
        document.body.appendChild(link);
        link.click();
        link.remove();
        toast.success('Laporan berhasil diunduh');
      } else {
        const response = await axios.get('/api/reports/transactions', {
          params: { startDate, endDate, format: 'json' }
        });
        setSummary(response.data.summary);
        toast.success('Laporan berhasil dimuat');
      }
    } catch (error) {
      toast.error('Gagal menghasilkan laporan');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Laporan</h1>
        <p className="text-gray-500 mt-1">Generate dan ekspor laporan transaksi</p>
      </div>

      {/* Filter Section */}
      <div className="bg-white rounded-xl shadow-sm p-6">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Filter Laporan</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Mulai</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Tanggal Akhir</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-3 py-2 border rounded-lg"
            />
          </div>
        </div>
        
        <div className="flex gap-3">
          <button
            onClick={() => generateReport('json')}
            disabled={loading}
            className="btn-primary flex items-center gap-2"
          >
            <FileText className="h-5 w-5" />
            Lihat Ringkasan
          </button>
          <button
            onClick={() => generateReport('excel')}
            disabled={loading}
            className="btn-secondary flex items-center gap-2"
          >
            <Download className="h-5 w-5" />
            Ekspor Excel
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      {summary && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="bg-blue-100 p-3 rounded-full">
                  <Package className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Transaksi</p>
                  <p className="text-2xl font-bold">{summary.totalTransactions}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="bg-green-100 p-3 rounded-full">
                  <DollarSign className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Total Pendapatan</p>
                  <p className="text-2xl font-bold">Rp {summary.totalRevenue?.toLocaleString()}</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center gap-3">
                <div className="bg-yellow-100 p-3 rounded-full">
                  <TrendingUp className="h-6 w-6 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">Rata-rata per Transaksi</p>
                  <p className="text-2xl font-bold">Rp {summary.averageValue?.toLocaleString()}</p>
                </div>
              </div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="bg-white rounded-xl shadow-sm p-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Status Transaksi</h3>
            <div className="space-y-3">
              {Object.entries(summary.byStatus || {}).map(([status, count]) => (
                <div key={status} className="flex justify-between items-center">
                  <span className="text-gray-600">{status}</span>
                  <span className="font-semibold">{count as number} transaksi</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Reports;