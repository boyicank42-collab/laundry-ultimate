import { useState } from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useOutlet } from '../contexts/OutletContext';
import { useTheme } from '../contexts/ThemeContext';
import ThemeToggle from './ThemeToggle';
import OfflineIndicator from './OfflineIndicator';
import { LanguageToggle } from '../contexts/LanguageContext';
import { 
  LayoutDashboard, ShoppingCart, Users, FileText, Settings, LogOut,
  Store, Package, UserCog, Wifi, Send, BarChart3, Zap, TrendingUp,
  Menu, ChevronLeft, DollarSign, MessageCircle, Bot, Clock, Award, Truck,
  Database, Star, Shield, Globe, Key, Sparkles, Crown, Gem
} from 'lucide-react';

const LayoutUltimate = () => {
  const { user, logout } = useAuth();
  const { outlets, currentOutlet, setCurrentOutlet } = useOutlet();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const menuItems = [
    { path: '/dashboard', icon: LayoutDashboard, label: 'Dashboard', section: 'main', badge: 'Live' },
    { path: '/transactions', icon: ShoppingCart, label: 'Transaksi', section: 'main' },
    { path: '/customers', icon: Users, label: 'Pelanggan', section: 'main' },
    { path: '/employees', icon: UserCog, label: 'Karyawan', section: 'management' },
    { path: '/inventory', icon: Package, label: 'Stok', section: 'management' },
    { path: '/outlets', icon: Store, label: 'Multi Outlet', section: 'management' },
    { path: '/operational-cost', icon: DollarSign, label: 'Biaya Operasional', section: 'management' },
    { path: '/membership', icon: Award, label: 'Membership', section: 'management', badge: 'Poin' },
    { path: '/profit-loss', icon: TrendingUp, label: 'Laba Rugi', section: 'reports' },
    { path: '/peak-hour', icon: Clock, label: 'Peak Hour', section: 'reports' },
    { path: '/iot', icon: Wifi, label: 'IoT Mesin', section: 'advanced', badge: '14' },
    { path: '/whatsapp', icon: Send, label: 'WA Broadcast', section: 'advanced' },
    { path: '/chatbot', icon: Bot, label: 'Chatbot WA', section: 'advanced' },
    { path: '/reports', icon: FileText, label: 'Laporan Premium', section: 'advanced' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics AI', section: 'advanced', badge: 'AI' },
    { path: '/pickup', icon: Truck, label: 'Pickup Delivery', section: 'advanced' },
    { path: '/ratings', icon: Star, label: 'Rating', section: 'advanced' },
    { path: '/settings', icon: Settings, label: 'Pengaturan', section: 'settings' },
    { path: '/backup', icon: Database, label: 'Backup', section: 'settings' },
    { path: '/2fa', icon: Shield, label: '2FA', section: 'settings' },
    { path: '/license', icon: Key, label: 'Lisensi', section: 'settings' },
  ];

  const sections = { main: 'UTAMA', management: 'MANAJEMEN', reports: 'LAPORAN', advanced: 'ULTIMATE', settings: 'PENGATURAN' };

  return (
    <div className="flex h-screen bg-gray-900">
      {/* Sidebar Dark - Premium Badge sudah dihapus dari sini */}
      <aside className={`${collapsed ? 'w-20' : 'w-72'} bg-gray-900 shadow-2xl transition-all duration-300 overflow-y-auto relative border-r border-gray-800`}>
        {/* Logo Area */}
        <div className="p-5 border-b border-gray-800">
          <div className="flex justify-between items-center">
            {!collapsed && (
              <div className="flex items-center gap-3">
                <div className="p-2 bg-gradient-to-br from-blue-600 to-purple-600 rounded-xl shadow-lg">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h1 className="text-lg font-bold text-white">
                    LaundryUltimate
                  </h1>
                  <p className="text-[10px] text-gray-400">Enterprise v3.0</p>
                </div>
              </div>
            )}
            <button onClick={() => setCollapsed(!collapsed)} className="p-2 rounded-lg hover:bg-gray-800 transition-all text-gray-400">
              {collapsed ? <Menu className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
            </button>
          </div>
        </div>
        
        {/* Outlet Selector */}
        {!collapsed && (
          <div className="p-4 border-b border-gray-800 bg-gray-900/50">
            <label className="text-[10px] text-gray-400 uppercase tracking-wider block mb-2">Outlet Aktif</label>
            <select 
              value={currentOutlet?.id || ''} 
              onChange={(e) => { 
                const outlet = outlets.find(o => o.id === e.target.value); 
                setCurrentOutlet(outlet || null); 
              }} 
              className="w-full px-3 py-2 border border-gray-700 rounded-xl text-sm bg-gray-800 text-white focus:ring-2 focus:ring-blue-500"
            >
              {outlets.map(outlet => <option key={outlet.id} value={outlet.id}>{outlet.name}</option>)}
              {outlets.length === 0 && <option>Outlet Pusat</option>}
            </select>
          </div>
        )}
        
        {/* Navigation */}
        <nav className="p-4 pb-20">
          {Object.entries(sections).map(([key, label]) => (
            <div key={key}>
              {!collapsed && <p className="text-[10px] text-gray-500 uppercase tracking-wider mt-4 mb-2 px-3">{label}</p>}
              {menuItems.filter(item => item.section === key).map((item) => (
                <Link 
                  key={item.path} 
                  to={item.path} 
                  className="flex items-center gap-3 px-3 py-2.5 text-gray-300 rounded-xl hover:bg-gray-800 transition-all mb-1 group"
                >
                  <item.icon className="h-5 w-5 group-hover:scale-110 transition-transform" />
                  {!collapsed && (
                    <>
                      <span className="text-sm font-medium">{item.label}</span>
                      {item.badge && (
                        <span className="ml-auto text-[10px] px-1.5 py-0.5 bg-gray-800 text-blue-400 rounded-full">
                          {item.badge}
                        </span>
                      )}
                    </>
                  )}
                </Link>
              ))}
            </div>
          ))}
          
          <div className="pt-4 mt-4 border-t border-gray-800">
            <button 
              onClick={handleLogout} 
              className="w-full flex items-center gap-3 px-3 py-2.5 text-red-400 rounded-xl hover:bg-red-900/20 transition-all group"
            >
              <LogOut className="h-5 w-5 group-hover:scale-110 transition-transform" />
              {!collapsed && <span className="text-sm font-medium">Logout</span>}
            </button>
          </div>
        </nav>
      </aside>
      
      {/* Main Content */}
      <main className="flex-1 overflow-auto bg-gray-900 flex flex-col">
        {/* Header Bar */}
        <div className="sticky top-0 z-10 bg-gray-900/95 backdrop-blur-md p-4 border-b border-gray-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl shadow-lg">
              <Gem className="h-4 w-4 text-white" />
            </div>
            <div>
              <h2 className="text-sm font-semibold text-white">Welcome back, {user?.name}</h2>
              <p className="text-[10px] text-gray-400">{new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <LanguageToggle />
            <OfflineIndicator />
            <ThemeToggle />
          </div>
        </div>
        
        {/* Page Content */}
        <div className="flex-1 p-6">
          <Outlet />
        </div>

        {/* Footer - Nama PT dipindahkan ke sini */}
        <footer className="border-t border-gray-800 py-3 px-6 text-center">
          <p className="text-[10px] text-gray-500">
            © 2026 PT SALSADILA MAHA KARYA. All rights reserved. | LaundryUltimate Enterprise v3.0
          </p>
        </footer>
      </main>
    </div>
  );
};

export default LayoutUltimate;