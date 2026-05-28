import { useEffect, useState } from 'react';
import api from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import { Award, Crown, Star, Gift, TrendingUp, Calendar, Zap, Coins, Medal, Diamond, Users } from 'lucide-react';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { id } from 'date-fns/locale';

interface Membership {
  id: string;
  customerId: string;
  level: string;
  points: number;
  totalSpent: number;
  birthday: string;
  joinedAt: string;
  customer: { name: string; phone: string; email: string };
  transactions: Array<{ type: string; points: number; description: string; createdAt: string }>;
}

const MembershipPage = () => {
  const { token } = useAuth();
  const [memberships, setMemberships] = useState<Membership[]>([]);
  const [selectedMember, setSelectedMember] = useState<Membership | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [redeemPoints, setRedeemPoints] = useState(0);
  const [showRedeemModal, setShowRedeemModal] = useState(false);

  useEffect(() => {
    fetchMemberships();
  }, [search]);

  const fetchMemberships = async () => {
    try {
      const res = await api.get('/membership/all');
      setMemberships(res.data);
    } catch (error) {
      toast.error('Gagal memuat data membership');
    } finally {
      setLoading(false);
    }
  };

  const getLevelIcon = (level: string) => {
    switch(level) {
      case 'SILVER': return <Medal className="h-5 w-5 text-gray-400" />;
      case 'GOLD': return <Star className="h-5 w-5 text-yellow-500" />;
      case 'PLATINUM': return <Diamond className="h-5 w-5 text-blue-500" />;
      default: return <Award className="h-5 w-5" />;
    }
  };

  const getLevelColor = (level: string) => {
    switch(level) {
      case 'SILVER': return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'GOLD': return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'PLATINUM': return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400';
      default: return 'bg-gray-100';
    }
  };

  const getNextLevel = (currentLevel: string, totalSpent: number) => {
    if (currentLevel === 'SILVER' && totalSpent >= 500000) return { level: 'GOLD', need: 0 };
    if (currentLevel === 'SILVER') return { level: 'GOLD', need: 500000 - totalSpent };
    if (currentLevel === 'GOLD' && totalSpent >= 1000000) return { level: 'PLATINUM', need: 0 };
    if (currentLevel === 'GOLD') return { level: 'PLATINUM', need: 1000000 - totalSpent };
    return { level: 'MAX', need: 0 };
  };

  const handleRedeem = async (customerId: string) => {
    if (redeemPoints <= 0) {
      toast.error('Masukkan jumlah poin yang akan ditukar');
      return;
    }
    try {
      const res = await api.post('/membership/redeem', {
        customerId,
        points: redeemPoints,
        transactionId: 'MANUAL_REDEEM'
      });
      toast.success(`Berhasil menukar ${redeemPoints} poin! Diskon Rp ${res.data.discount.toLocaleString()}`);
      setShowRedeemModal(false);
      setRedeemPoints(0);
      fetchMemberships();
    } catch (error) {
      toast.error('Gagal menukar poin');
    }
  };

  const filteredMemberships = memberships.filter(m => 
    m.customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
    m.customer?.phone?.includes(search)
  );

  const totalPoints = memberships.reduce((sum, m) => sum + m.points, 0);
  const totalMembers = memberships.length;
  const platinumCount = memberships.filter(m => m.level === 'PLATINUM').length;
  const goldCount = memberships.filter(m => m.level === 'GOLD').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Award className="h-6 w-6 text-yellow-500" /> Membership & Loyalty
          </h1>
          <p className="text-gray-500 dark:text-gray-400">Kelola poin member dan reward pelanggan setia</p>
        </div>
        <div className="relative">
          <input type="text" placeholder="Cari member..." value={search} onChange={(e) => setSearch(e.target.value)} className="px-4 py-2 border rounded-lg w-64 dark:bg-gray-700" />
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border"><p className="text-gray-500 text-sm">Total Member</p><p className="text-2xl font-bold">{totalMembers}</p><p className="text-xs text-gray-400">aktif</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border"><p className="text-gray-500 text-sm">Total Poin Beredar</p><p className="text-2xl font-bold text-green-600">{totalPoints.toLocaleString()}</p><p className="text-xs text-gray-400">poin</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border"><p className="text-gray-500 text-sm">Member Platinum</p><p className="text-2xl font-bold text-blue-600">{platinumCount}</p><p className="text-xs text-gray-400">+{Math.round((platinumCount/totalMembers)*100)}%</p></div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-sm border"><p className="text-gray-500 text-sm">Member Gold</p><p className="text-2xl font-bold text-yellow-600">{goldCount}</p><p className="text-xs text-gray-400">+{Math.round((goldCount/totalMembers)*100)}%</p></div>
      </div>

      {/* Members Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden border">
        <table className="w-full">
          <thead className="bg-gray-50 dark:bg-gray-700/50 border-b">
            <tr>
              <th className="text-left px-6 py-3">Member</th>
              <th className="text-left px-6 py-3">Level</th>
              <th className="text-center px-6 py-3">Poin</th>
              <th className="text-right px-6 py-3">Total Belanja</th>
              <th className="text-center px-6 py-3">Bergabung</th>
              <th className="text-center px-6 py-3">Aksi</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={6} className="text-center py-8"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div></td></tr>
            ) : filteredMemberships.length === 0 ? (
              <tr><td colSpan={6} className="text-center py-8 text-gray-500">Belum ada member</td></tr>
            ) : (
              filteredMemberships.map((member) => {
                const nextLevel = getNextLevel(member.level, member.totalSpent);
                return (
                  <tr key={member.id} className="border-b hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer" onClick={() => setSelectedMember(member)}>
                    <td className="px-6 py-4"><p className="font-medium">{member.customer?.name}</p><p className="text-xs text-gray-500">{member.customer?.phone}</p></td>
                    <td className="px-6 py-4"><span className={`px-2 py-1 rounded-full text-xs flex items-center gap-1 w-fit ${getLevelColor(member.level)}`}>{getLevelIcon(member.level)} {member.level}</span></td>
                    <td className="px-6 py-4 text-center font-semibold text-blue-600">{member.points.toLocaleString()}</td>
                    <td className="px-6 py-4 text-right font-semibold">Rp {member.totalSpent.toLocaleString()}</td>
                    <td className="px-6 py-4 text-center text-sm text-gray-500">{format(new Date(member.joinedAt), 'dd/MM/yyyy')}</td>
                    <td className="px-6 py-4 text-center"><button onClick={(e) => { e.stopPropagation(); setSelectedMember(member); setShowRedeemModal(true); }} className="bg-green-600 text-white px-3 py-1 rounded-lg text-sm hover:bg-green-700">Tukar Poin</button></td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Modal Detail Member */}
      {selectedMember && !showRedeemModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50" onClick={() => setSelectedMember(null)}>
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-2xl max-h-[80vh] overflow-y-auto p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex justify-between items-center mb-4"><h2 className="text-xl font-bold">Detail Member</h2><button onClick={() => setSelectedMember(null)} className="text-gray-500">✕</button></div>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Nama</p><p className="font-semibold">{selectedMember.customer?.name}</p></div>
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">No. HP</p><p className="font-semibold">{selectedMember.customer?.phone}</p></div>
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Level</p><p className="font-semibold flex items-center gap-1">{getLevelIcon(selectedMember.level)} {selectedMember.level}</p></div>
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Total Poin</p><p className="font-semibold text-blue-600 text-xl">{selectedMember.points.toLocaleString()}</p></div>
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Total Belanja</p><p className="font-semibold text-green-600">Rp {selectedMember.totalSpent.toLocaleString()}</p></div>
              <div className="p-3 bg-gray-50 rounded-lg"><p className="text-xs text-gray-500">Bergabung</p><p className="font-semibold">{format(new Date(selectedMember.joinedAt), 'dd MMMM yyyy', { locale: id })}</p></div>
            </div>
            <h3 className="font-semibold mt-4 mb-2">Riwayat Poin</h3>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {selectedMember.transactions?.map((trx, idx) => (
                <div key={idx} className="flex justify-between items-center p-2 border-b">
                  <div><p className="text-sm">{trx.description}</p><p className="text-xs text-gray-400">{format(new Date(trx.createdAt), 'dd MMM yyyy HH:mm')}</p></div>
                  <div className={`font-semibold ${trx.points > 0 ? 'text-green-600' : 'text-red-600'}`}>{trx.points > 0 ? `+${trx.points}` : `${trx.points}`} poin</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Modal Redeem Poin */}
      {showRedeemModal && selectedMember && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-xl w-full max-w-md p-6">
            <h2 className="text-xl font-bold mb-4">Tukar Poin - {selectedMember.customer?.name}</h2>
            <p className="text-gray-500 mb-2">Poin tersedia: <span className="font-bold text-blue-600">{selectedMember.points.toLocaleString()}</span></p>
            <p className="text-sm text-gray-400 mb-4">1 poin = Rp 100 diskon</p>
            <input type="number" value={redeemPoints} onChange={(e) => setRedeemPoints(parseInt(e.target.value) || 0)} placeholder="Jumlah poin" className="w-full p-2 border rounded-lg mb-4" />
            <p className="text-sm mb-4">Diskon yang didapat: <span className="font-bold text-green-600">Rp {(redeemPoints * 100).toLocaleString()}</span></p>
            <div className="flex gap-3">
              <button onClick={() => handleRedeem(selectedMember.customerId)} className="flex-1 bg-green-600 text-white p-2 rounded-lg">Tukar</button>
              <button onClick={() => { setShowRedeemModal(false); setRedeemPoints(0); }} className="flex-1 bg-gray-300 p-2 rounded-lg">Batal</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MembershipPage;