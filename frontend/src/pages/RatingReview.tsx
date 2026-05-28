import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Star, Star as StarOutline, User, Calendar, MessageSquare, ThumbsUp, Award } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Rating {
  id: string;
  transactionId: string;
  customerId: string;
  customer: { name: string; phone: string };
  rating: number;
  review: string;
  response?: string;
  createdAt: string;
}

interface Transaction {
  id: string;
  invoiceCode: string;
  total: number;
  createdAt: string;
  customer: { name: string };
  hasRated: boolean;
}

const RatingReview = () => {
  const { token } = useAuth();
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [pendingTransactions, setPendingTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRating, setSelectedRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [stats, setStats] = useState({ average: 0, total: 0, distribution: [0,0,0,0,0] });

  useEffect(() => {
    fetchRatings();
    fetchPendingTransactions();
    fetchStats();
  }, []);

  const fetchRatings = async () => {
    try {
      const res = await api.get('/ratings');
      setRatings(res.data);
    } catch (error) {
      toast.error('Gagal memuat rating');
    } finally {
      setLoading(false);
    }
  };

  const fetchPendingTransactions = async () => {
    try {
      const res = await api.get('/transactions/completed');
      const filtered = res.data.filter((t: Transaction) => !t.hasRated);
      setPendingTransactions(filtered);
    } catch (error) {
      console.error('Failed to fetch pending:', error);
    }
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/ratings/stats');
      setStats(res.data);
    } catch (error) {
      console.error('Failed to fetch stats:', error);
    }
  };

  const submitRating = async () => {
    if (!selectedTransaction) return;
    if (selectedRating === 0) {
      toast.error('Pilih rating terlebih dahulu');
      return;
    }
    
    try {
      await api.post('/ratings', {
        transactionId: selectedTransaction.id,
        rating: selectedRating,
        review: reviewText
      });
      toast.success('Rating berhasil dikirim! Terima kasih atas feedback Anda.');
      setShowModal(false);
      setSelectedRating(0);
      setReviewText('');
      setSelectedTransaction(null);
      fetchRatings();
      fetchPendingTransactions();
      fetchStats();
    } catch (error) {
      toast.error('Gagal mengirim rating');
    }
  };

  const renderStars = (rating: number, interactive = false, onClick?: (rating: number) => void) => {
    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map((star) => (
          <button
            key={star}
            onClick={() => interactive && onClick && onClick(star)}
            className={`${interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}`}
          >
            {star <= rating ? (
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
            ) : (
              <StarOutline className="h-5 w-5 text-gray-300" />
            )}
          </button>
        ))}
      </div>
    );
  };

  const averageStars = stats.average || 0;
  const totalRatings = stats.total || 0;
  const distribution = stats.distribution || [0,0,0,0,0];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Star className="h-6 w-6 text-yellow-500" /> Rating & Review
          </h1>
          <p className="text-gray-500">Lihat dan kelola ulasan pelanggan</p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border text-center">
          <p className="text-gray-500 text-sm">Rating Rata-rata</p>
          <p className="text-4xl font-bold text-yellow-500 mt-2">{averageStars.toFixed(1)}</p>
          <div className="flex justify-center mt-2">{renderStars(Math.round(averageStars))}</div>
          <p className="text-sm text-gray-400 mt-2">dari {totalRatings} ulasan</p>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border md:col-span-2">
          <p className="text-gray-500 text-sm mb-3">Distribusi Rating</p>
          {[5,4,3,2,1].map((star, idx) => {
            const count = distribution[5-star];
            const percentage = totalRatings > 0 ? (count / totalRatings) * 100 : 0;
            return (
              <div key={star} className="flex items-center gap-3 mb-2">
                <div className="flex items-center gap-1 w-12">{star} <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" /></div>
                <div className="flex-1 h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-400 rounded-full" style={{ width: `${percentage}%` }}></div>
                </div>
                <div className="w-12 text-sm text-gray-500">{count}</div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Pending Reviews */}
      {pendingTransactions.length > 0 && (
        <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4">
          <h3 className="font-semibold text-blue-800 dark:text-blue-300 mb-3">Menunggu Ulasan Anda</h3>
          <div className="space-y-2">
            {pendingTransactions.slice(0, 3).map((t) => (
              <div key={t.id} className="flex justify-between items-center p-3 bg-white dark:bg-gray-800 rounded-lg">
                <div><p className="font-medium">{t.invoiceCode}</p><p className="text-sm text-gray-500">Rp {t.total.toLocaleString()}</p></div>
                <button onClick={() => { setSelectedTransaction(t); setShowModal(true); }} className="bg-yellow-500 text-white px-4 py-2 rounded-lg text-sm hover:bg-yellow-600">Beri Rating</button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ratings List */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border">
        <div className="p-4 border-b"><h3 className="font-semibold">Ulasan Pelanggan</h3></div>
        <div className="divide-y">
          {loading ? (
            <div className="p-8 text-center">Loading...</div>
          ) : ratings.length === 0 ? (
            <div className="p-8 text-center text-gray-500">Belum ada ulasan</div>
          ) : (
            ratings.map((rating) => (
              <div key={rating.id} className="p-4">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-2">
                    <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                      {rating.customer?.name?.charAt(0) || 'P'}
                    </div>
                    <div>
                      <p className="font-medium">{rating.customer?.name}</p>
                      <div className="flex items-center gap-2 text-sm text-gray-500">
                        {renderStars(rating.rating)} 
                        <span>{format(new Date(rating.createdAt), 'dd MMM yyyy', { locale: id })}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <ThumbsUp className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <p className="mt-2 text-gray-700 dark:text-gray-300">{rating.review}</p>
                {rating.response && (
                  <div className="mt-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                    <p className="text-sm font-medium text-blue-700 dark:text-blue-300">Balasan Admin:</p>
                    <p className="text-sm text-blue-600 dark:text-blue-400">{rating.response}</p>
                  </div>
                )}
              </div>
            ))
          )}
        </div>
      </div>

      {/* Rating Modal */}
      {showModal && selectedTransaction && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Beri Rating</h2>
            <p className="text-gray-500 mb-2">Transaksi: {selectedTransaction.invoiceCode}</p>
            <div className="flex justify-center py-4">{renderStars(selectedRating, true, setSelectedRating)}</div>
            <textarea rows={4} placeholder="Tulis ulasan Anda..." value={reviewText} onChange={(e) => setReviewText(e.target.value)} className="w-full p-3 border rounded-lg resize-none" />
            <div className="flex gap-3 mt-4">
              <button onClick={submitRating} className="flex-1 bg-yellow-500 text-white p-2 rounded-lg hover:bg-yellow-600">Kirim Rating</button>
              <button onClick={() => { setShowModal(false); setSelectedRating(0); setReviewText(''); }} className="flex-1 bg-gray-300 p-2 rounded-lg">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RatingReview;