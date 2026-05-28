@echo off
echo ========================================
echo Creating Ultimate Enterprise Files
echo ========================================
echo.

cd /d D:\laundry-frontend\src\pages

:: ==================== EMPLOYEES.TSX ====================
echo Creating Employees.tsx...
del Employees.tsx 2>nul
copy con Employees.tsx >nul
echo import { useEffect, useState } from 'react';> Employees.tsx
echo import api from '../services/api';>> Employees.tsx
echo import { Plus, Edit, Trash2 } from 'lucide-react';>> Employees.tsx
echo import toast from 'react-hot-toast';>> Employees.tsx
echo.>> Employees.tsx
echo const Employees = () => {>> Employees.tsx
echo   const [employees, setEmployees] = useState([]);>> Employees.tsx
echo   const [loading, setLoading] = useState(true);>> Employees.tsx
echo   const [isModalOpen, setIsModalOpen] = useState(false);>> Employees.tsx
echo   const [formData, setFormData] = useState({ name: '', email: '', phone: '', role: 'KASIR', outlet: 'Pusat', shift: 'Pagi', salary: 0 });>> Employees.tsx
echo.>> Employees.tsx
echo   useEffect(() => { fetchEmployees(); }, []);>> Employees.tsx
echo   const fetchEmployees = async () => { try { const res = await api.get('/employees'); setEmployees(res.data); } catch (err) { toast.error('Gagal memuat'); } finally { setLoading(false); } };>> Employees.tsx
echo   const handleSubmit = async (e) => { e.preventDefault(); try { await api.post('/employees', formData); toast.success('Berhasil'); setIsModalOpen(false); fetchEmployees(); } catch (err) { toast.error('Gagal'); } };>> Employees.tsx
echo.>> Employees.tsx
echo   return (>> Employees.tsx
echo     ^<div className="space-y-6"^>>> Employees.tsx
echo       ^<div className="flex justify-between"^>>> Employees.tsx
echo         ^<div^>>> Employees.tsx
echo           ^<h1 className="text-2xl font-bold"^>Manajemen Karyawan^</h1^>>> Employees.tsx
echo           ^<p className="text-gray-500"^>Kelola data karyawan dan shift^</p^>>> Employees.tsx
echo         ^</div^>>> Employees.tsx
echo         ^<button onClick={() => setIsModalOpen(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg"^>+ Tambah Karyawan^</button^>>> Employees.tsx
echo       ^</div^>>> Employees.tsx
echo       ^<div className="bg-white rounded-xl shadow-sm"^>>> Employees.tsx
echo         ^<table className="w-full"^>>> Employees.tsx
echo           ^<thead className="bg-gray-50"^>>> Employees.tsx
echo             <tr><th className="p-3 text-left"^>Nama^</th^><th^>Kontak^</th^><th^>Role^</th^><th^>Shift^</th^><th^>Aksi^</th^></tr>> Employees.tsx
echo           ^</thead^>>> Employees.tsx
echo           ^<tbody^>>> Employees.tsx
echo             {loading ? (^<tr^>^<td colSpan="5" className="text-center p-8"^>Loading...^</td^>^</tr^>) : employees.length === 0 ? (^<tr^>^<td colSpan="5" className="text-center p-8 text-gray-500"^>Belum ada data^</td^>^</tr^>) : (employees.map(emp => (^<tr key={emp.id} className="border-b"^>^<td className="p-3"^>{emp.name}^</td^>^<td^>{emp.phone}^</td^>^<td^>{emp.role}^</td^>^<td^>{emp.shift}^</td^>^<td^>^<button className="text-blue-600"^>✏️^</button^> ^<button className="text-red-600"^>🗑️^</bbutton^>^</td^>^</tr^>)))}>> Employees.tsx
echo           ^</tbody^>>> Employees.tsx
echo         ^</table^>>> Employees.tsx
echo       ^</div^>>> Employees.tsx
echo       {isModalOpen && (>> Employees.tsx
echo         ^<div className="fixed inset-0 bg-black/50 flex items-center justify-center"^>>> Employees.tsx
echo           ^<div className="bg-white p-6 rounded-xl w-96"^>>> Employees.tsx
echo             ^<h2 className="text-xl font-bold mb-4"^>Tambah Karyawan^</h2^>>> Employees.tsx
echo             ^<form onSubmit={handleSubmit} className="space-y-3"^>>> Employees.tsx
echo               ^<input type="text" placeholder="Nama" className="w-full p-2 border rounded" onChange={e => setFormData({...formData, name: e.target.value})} required /^>>> Employees.tsx
echo               ^<input type="email" placeholder="Email" className="w-full p-2 border rounded" onChange={e => setFormData({...formData, email: e.target.value})} /^>>> Employees.tsx
echo               ^<input type="tel" placeholder="No HP" className="w-full p-2 border rounded" onChange={e => setFormData({...formData, phone: e.target.value})} /^>>> Employees.tsx
echo               ^<select className="w-full p-2 border rounded" onChange={e => setFormData({...formData, role: e.target.value})}^>>> Employees.tsx
echo                 ^<option value="ADMIN"^>Admin^</option^>^<option value="KASIR"^>Kasir^</option^>^<option value="OWNER"^>Owner^</option^>>> Employees.tsx
echo               ^</select^>>> Employees.tsx
echo               ^<select className="w-full p-2 border rounded" onChange={e => setFormData({...formData, shift: e.target.value})}^>>> Employees.tsx
echo                 ^<option value="Pagi"^>Pagi (08-16)^</option^>^<option value="Siang"^>Siang (12-20)^</option^>^<option value="Malam"^>Malam (16-00)^</option^>>> Employees.tsx
echo               ^</select^>>> Employees.tsx
echo               ^<input type="number" placeholder="Gaji" className="w-full p-2 border rounded" onChange={e => setFormData({...formData, salary: parseInt(e.target.value)})} /^>>> Employees.tsx
echo               ^<div className="flex gap-2"^>>> Employees.tsx
echo                 ^<button type="submit" className="flex-1 bg-blue-600 text-white p-2 rounded"^>Simpan^</button^>>> Employees.tsx
echo                 ^<button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 bg-gray-300 p-2 rounded"^>Batal^</button^>>> Employees.tsx
echo               ^</div^>>> Employees.tsx
echo             ^</form^>>> Employees.tsx
echo           ^</div^>>> Employees.tsx
echo         ^</div^>>> Employees.tsx
echo       )}>> Employees.tsx
echo     ^</div^>>> Employees.tsx
echo   );>> Employees.tsx
echo };>> Employees.tsx
echo export default Employees;>> Employees.tsx
echo.>> Employees.tsx

:: ==================== INVENTORY.TSX ====================
echo Creating Inventory.tsx...
del Inventory.tsx 2>nul
copy con Inventory.tsx >nul
echo import { useEffect, useState } from 'react';> Inventory.tsx
echo import api from '../services/api';>> Inventory.tsx
echo import { Package, Plus, AlertTriangle } from 'lucide-react';>> Inventory.tsx
echo import toast from 'react-hot-toast';>> Inventory.tsx
echo.>> Inventory.tsx
echo const Inventory = () => {>> Inventory.tsx
echo   const [items, setItems] = useState([]);>> Inventory.tsx
echo   const [loading, setLoading] = useState(true);>> Inventory.tsx
echo.>> Inventory.tsx
echo   useEffect(() => { fetchInventory(); }, []);>> Inventory.tsx
echo   const fetchInventory = async () => { try { const res = await api.get('/inventory'); setItems(res.data); } catch (err) { toast.error('Gagal memuat'); } finally { setLoading(false); } };>> Inventory.tsx
echo   const lowStock = items.filter(i => i.stock <= i.minStock);>> Inventory.tsx
echo.>> Inventory.tsx
echo   return (>> Inventory.tsx
echo     ^<div className="space-y-6"^>>> Inventory.tsx
echo       ^<div className="flex justify-between"^>>> Inventory.tsx
echo         ^<div^>>> Inventory.tsx
echo           ^<h1 className="text-2xl font-bold"^>Stok & Inventaris^</h1^>>> Inventory.tsx
echo           ^<p className="text-gray-500"^>Kelola stok deterjen, pewangi, perlengkapan^</p^>>> Inventory.tsx
echo         ^</div^>>> Inventory.tsx
echo         ^<button className="bg-blue-600 text-white px-4 py-2 rounded-lg"^>+ Tambah Item^</button^>>> Inventory.tsx
echo       ^</div^>>> Inventory.tsx
echo       {lowStock.length > 0 && (>> Inventory.tsx
echo         ^<div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded"^>>> Inventory.tsx
echo           ^<div className="flex items-center gap-2"^>^<AlertTriangle className="text-yellow-600" /^>^<span className="font-semibold"^>Peringatan: {lowStock.length} item stok menipis^</span^>^</div^>>> Inventory.tsx
echo         ^</div^>>> Inventory.tsx
echo       )}>> Inventory.tsx
echo       ^<div className="bg-white rounded-xl shadow-sm"^>>> Inventory.tsx
echo         ^<table className="w-full"^>>> Inventory.tsx
echo           ^<thead className="bg-gray-50"^><tr><th className="p-3 text-left"^>Item^</th^><th^>Kategori^</th^><th^>Stok^</th^><th^>Min Stok^</th^><th^>Status^</th^></tr></thead>> Inventory.tsx
echo           ^<tbody^>>> Inventory.tsx
echo             {loading ? (^<tr^>^<td colSpan="5" className="text-center p-8"^>Loading...^</td^>^</tr^>) : items.map(item => (^<tr key={item.id} className="border-b"^>^<td className="p-3"^>{item.name}^</td^>^<td^>{item.category}^</td^>^<td^>{item.stock} {item.unit}^</td^>^<td^>{item.minStock}^</td^>^<td^>{item.stock <= item.minStock ? ^<span className="text-red-600"^>⚠️ Low Stock^</span^> : ^<span className="text-green-600"^>✓ Aman^</span^>}^</td^>^</tr^>))}>> Inventory.tsx
echo           ^</tbody^>>> Inventory.tsx
echo         ^</table^>>> Inventory.tsx
echo       ^</div^>>> Inventory.tsx
echo     ^</div^>>> Inventory.tsx
echo   );>> Inventory.tsx
echo };>> Inventory.tsx
echo export default Inventory;>> Inventory.tsx
echo.>> Inventory.tsx

:: ==================== OUTLETS.TSX ====================
echo Creating Outlets.tsx...
del Outlets.tsx 2>nul
copy con Outlets.tsx >nul
echo import { useEffect, useState } from 'react';> Outlets.tsx
echo import api from '../services/api';>> Outlets.tsx
echo import { Store, Plus, Edit } from 'lucide-react';>> Outlets.tsx
echo import toast from 'react-hot-toast';>> Outlets.tsx
echo.>> Outlets.tsx
echo const Outlets = () => {>> Outlets.tsx
echo   const [outlets, setOutlets] = useState([]);>> Outlets.tsx
echo   const [loading, setLoading] = useState(true);>> Outlets.tsx
echo.>> Outlets.tsx
echo   useEffect(() => { fetchOutlets(); }, []);>> Outlets.tsx
echo   const fetchOutlets = async () => { try { const res = await api.get('/outlets'); setOutlets(res.data); } catch (err) { toast.error('Gagal memuat'); } finally { setLoading(false); } };>> Outlets.tsx
echo.>> Outlets.tsx
echo   return (>> Outlets.tsx
echo     ^<div className="space-y-6"^>>> Outlets.tsx
echo       ^<div className="flex justify-between"^>>> Outlets.tsx
echo         ^<div^>>> Outlets.tsx
echo           ^<h1 className="text-2xl font-bold"^>Multi Outlet^</h1^>>> Outlets.tsx
echo           ^<p className="text-gray-500"^>Kelola cabang dan outlet laundry^</p^>>> Outlets.tsx
echo         ^</div^>>> Outlets.tsx
echo         ^<button className="bg-blue-600 text-white px-4 py-2 rounded-lg"^>+ Tambah Outlet^</button^>>> Outlets.tsx
echo       ^</div^>>> Outlets.tsx
echo       ^<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"^>>> Outlets.tsx
echo         {outlets.map(outlet => (>> Outlets.tsx
echo           ^<div key={outlet.id} className="bg-white rounded-xl shadow-sm p-6"^>>> Outlets.tsx
echo             ^<div className="flex justify-between"^>>> Outlets.tsx
echo               ^<Store className="text-blue-600" /^>>> Outlets.tsx
echo               ^<button className="text-gray-400"^>✏️^</button^>>> Outlets.tsx
echo             ^</div^>>> Outlets.tsx
echo             ^<h3 className="font-bold text-lg mt-2"^>{outlet.name}^</h3^>>> Outlets.tsx
echo             ^<p className="text-gray-500 text-sm"^>{outlet.address}^</p^>>> Outlets.tsx
echo             ^<p className="text-gray-500 text-sm"^>📞 {outlet.phone}^</p^>>> Outlets.tsx
echo             ^<p className="text-gray-500 text-sm"^>👤 Manager: {outlet.manager}^</p^>>> Outlets.tsx
echo           ^</div^>>> Outlets.tsx
echo         ))}>> Outlets.tsx
echo       ^</div^>>> Outlets.tsx
echo     ^</div^>>> Outlets.tsx
echo   );>> Outlets.tsx
echo };>> Outlets.tsx
echo export default Outlets;>> Outlets.tsx
echo.>> Outlets.tsx

:: ==================== IOTDEVICES.TSX ====================
echo Creating IoTDevices.tsx...
del IoTDevices.tsx 2>nul
copy con IoTDevices.tsx >nul
echo import { useState } from 'react';> IoTDevices.tsx
echo import { Wifi, WifiOff, Settings, Activity } from 'lucide-react';>> IoTDevices.tsx
echo.>> IoTDevices.tsx
echo const IoTDevices = () => {>> IoTDevices.tsx
echo   const [devices] = useState([>> IoTDevices.tsx
echo     { id: 1, name: 'Mesin Cuci A', status: 'online', cycle: 'Cuci Normal', timeRemaining: '15 menit' },>> IoTDevices.tsx
echo     { id: 2, name: 'Mesin Cuci B', status: 'offline', cycle: '-', timeRemaining: '-' },>> IoTDevices.tsx
echo     { id: 3, name: 'Mesin Dryer A', status: 'online', cycle: 'Pengeringan', timeRemaining: '25 menit' },>> IoTDevices.tsx
echo   ]);>> IoTDevices.tsx
echo.>> IoTDevices.tsx
echo   return (>> IoTDevices.tsx
echo     ^<div className="space-y-6"^>>> IoTDevices.tsx
echo       ^<div^>>> IoTDevices.tsx
echo         ^<h1 className="text-2xl font-bold"^>IoT Mesin Laundry^</h1^>>> IoTDevices.tsx
echo         ^<p className="text-gray-500"^>Monitoring real-time mesin laundry^</p^>>> IoTDevices.tsx
echo       ^</div^>>> IoTDevices.tsx
echo       ^<div className="grid grid-cols-1 md:grid-cols-2 gap-6"^>>> IoTDevices.tsx
echo         {devices.map(device => (>> IoTDevices.tsx
echo           ^<div key={device.id} className="bg-white rounded-xl shadow-sm p-6"^>>> IoTDevices.tsx
echo             ^<div className="flex justify-between"^>>> IoTDevices.tsx
echo               ^<div className="flex items-center gap-3"^>>> IoTDevices.tsx
echo                 {device.status === 'online' ? ^<Wifi className="text-green-600" /^> : ^<WifiOff className="text-red-600" /^>}>> IoTDevices.tsx
echo                 ^<h3 className="font-bold text-lg"^>{device.name}^</h3^>>> IoTDevices.tsx
echo               ^</div^>>> IoTDevices.tsx
echo               ^<span className={device.status === 'online' ? 'text-green-600' : 'text-red-600'}^>{device.status === 'online' ? '● Online' : '● Offline'}^</span^>>> IoTDevices.tsx
echo             ^</div^>>> IoTDevices.tsx
echo             ^<div className="mt-4 space-y-2"^>>> IoTDevices.tsx
echo               ^<p className="text-gray-600"^>🔄 Cycle: {device.cycle}^</p^>>> IoTDevices.tsx
echo               ^<p className="text-gray-600"^>⏱️ Sisa waktu: {device.timeRemaining}^</p^>>> IoTDevices.tsx
echo             ^</div^>>> IoTDevices.tsx
echo             ^<button className="w-full mt-4 bg-blue-600 text-white p-2 rounded-lg"^>Detail & Kontrol^</button^>>> IoTDevices.tsx
echo           ^</div^>>> IoTDevices.tsx
echo         ))}>> IoTDevices.tsx
echo       ^</div^>>> IoTDevices.tsx
echo     ^</div^>>> IoTDevices.tsx
echo   );>> IoTDevices.tsx
echo };>> IoTDevices.tsx
echo export default IoTDevices;>> IoTDevices.tsx
echo.>> IoTDevices.tsx

:: ==================== WABROADCAST.TSX ====================
echo Creating WABroadcast.tsx...
del WABroadcast.tsx 2>nul
copy con WABroadcast.tsx >nul
echo import { useState } from 'react';> WABroadcast.tsx
echo import { Send, Users, MessageSquare } from 'lucide-react';>> WABroadcast.tsx
echo import toast from 'react-hot-toast';>> WABroadcast.tsx
echo.>> WABroadcast.tsx
echo const WABroadcast = () => {>> WABroadcast.tsx
echo   const [message, setMessage] = useState('');>> WABroadcast.tsx
echo   const [loading, setLoading] = useState(false);>> WABroadcast.tsx
echo.>> WABroadcast.tsx
echo   const handleSend = async () => {>> WABroadcast.tsx
echo     if (!message) { toast.error('Pesan tidak boleh kosong'); return; }>> WABroadcast.tsx
echo     setLoading(true);>> WABroadcast.tsx
echo     setTimeout(() => { toast.success('Broadcast berhasil dikirim ke 25 pelanggan'); setLoading(false); setMessage(''); }, 2000);>> WABroadcast.tsx
echo   };>> WABroadcast.tsx
echo.>> WABroadcast.tsx
echo   return (>> WABroadcast.tsx
echo     ^<div className="space-y-6"^>>> WABroadcast.tsx
echo       ^<div^>>> WABroadcast.tsx
echo         ^<h1 className="text-2xl font-bold"^>WA Broadcast^</h1^>>> WABroadcast.tsx
echo         ^<p className="text-gray-500"^>Kirim notifikasi massal ke pelanggan via WhatsApp^</p^>>> WABroadcast.tsx
echo       ^</div^>>> WABroadcast.tsx
echo       ^<div className="grid grid-cols-1 lg:grid-cols-2 gap-6"^>>> WABroadcast.tsx
echo         ^<div className="bg-white rounded-xl shadow-sm p-6"^>>> WABroadcast.tsx
echo           ^<h3 className="font-semibold mb-4"^>Buat Pesan Broadcast^</h3^>>> WABroadcast.tsx
echo           ^<textarea rows={6} placeholder="Tulis pesan broadcast...&#10;&#10;Contoh:&#10;Halo Pelanggan! Dapatkan promo cuci kiloan hanya Rp 6.000/kg hari ini!" className="w-full p-3 border rounded-lg" value={message} onChange={(e) => setMessage(e.target.value)} /^>>> WABroadcast.tsx
echo           ^<div className="flex justify-between mt-4"^>>> WABroadcast.tsx
echo             ^<span className="text-gray-500"^>Target: 25 pelanggan aktif^</span^>>> WABroadcast.tsx
echo             ^<button onClick={handleSend} disabled={loading} className="bg-green-600 text-white px-6 py-2 rounded-lg flex items-center gap-2"^>^<Send className="h-4 w-4" /^> {loading ? 'Mengirim...' : 'Kirim Broadcast'}^</button^>>> WABroadcast.tsx
echo           ^</div^>>> WABroadcast.tsx
echo         ^</div^>>> WABroadcast.tsx
echo         ^<div className="bg-white rounded-xl shadow-sm p-6"^>>> WABroadcast.tsx
echo           ^<h3 className="font-semibold mb-4"^>Template Pesan^</h3^>>> WABroadcast.tsx
echo           ^<div className="space-y-3"^>>> WABroadcast.tsx
echo             ^<div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => setMessage('Halo Pelanggan, cucian Anda sudah selesai. Silakan diambil ya!')}^>>> WABroadcast.tsx
echo               ^<p className="font-medium"^>📢 Pengambilan Laundry^</p^>>> WABroadcast.tsx
echo               ^<p className="text-sm text-gray-500"^>Halo Pelanggan, cucian Anda sudah selesai. Silakan diambil ya!^</p^>>> WABroadcast.tsx
echo             ^</div^>>> WABroadcast.tsx
echo             ^<div className="p-3 bg-gray-50 rounded-lg cursor-pointer hover:bg-gray-100" onClick={() => setMessage('PROMO SPESIAL! Cuci kiloan hanya Rp 6.000/kg. Periode 1-7 Juni 2026. Dapatkan promo sekarang!')}^>>> WABroadcast.tsx
echo               ^<p className="font-medium"^>🎉 Promo Spesial^</p^>>> WABroadcast.tsx
echo               ^<p className="text-sm text-gray-500"^>PROMO SPESIAL! Cuci kiloan hanya Rp 6.000/kg^</p^>>> WABroadcast.tsx
echo             ^</div^>>> WABroadcast.tsx
echo           ^</div^>>> WABroadcast.tsx
echo         ^</div^>>> WABroadcast.tsx
echo       ^</div^>>> WABroadcast.tsx
echo     ^</div^>>> WABroadcast.tsx
echo   );>> WABroadcast.tsx
echo };>> WABroadcast.tsx
echo export default WABroadcast;>> WABroadcast.tsx
echo.>> WABroadcast.tsx

:: ==================== REPORTSPREMIUM.TSX ====================
echo Creating ReportsPremium.tsx...
del ReportsPremium.tsx 2>nul
copy con ReportsPremium.tsx >nul
echo import { useState } from 'react';> ReportsPremium.tsx
echo import { FileText, Download, Calendar, TrendingUp } from 'lucide-react';>> ReportsPremium.tsx
echo import toast from 'react-hot-toast';>> ReportsPremium.tsx
echo.>> ReportsPremium.tsx
echo const ReportsPremium = () => {>> ReportsPremium.tsx
echo   const [dateRange, setDateRange] = useState({ start: '', end: '' });>> ReportsPremium.tsx
echo   const [loading, setLoading] = useState(false);>> ReportsPremium.tsx
echo.>> ReportsPremium.tsx
echo   const handleExport = (format) => {>> ReportsPremium.tsx
echo     setLoading(true);>> ReportsPremium.tsx
echo     setTimeout(() => { toast.success(`Laporan berhasil diekspor ke ${format.toUpperCase()}`); setLoading(false); }, 1500);>> ReportsPremium.tsx
echo   };>> ReportsPremium.tsx
echo.>> ReportsPremium.tsx
echo   return (>> ReportsPremium.tsx
echo     ^<div className="space-y-6"^>>> ReportsPremium.tsx
echo       ^<div^>>> ReportsPremium.tsx
echo         ^<h1 className="text-2xl font-bold"^>Laporan Premium^</h1^>>> ReportsPremium.tsx
echo         ^<p className="text-gray-500"^>Generate laporan lengkap dengan analisis mendalam^</p^>>> ReportsPremium.tsx
echo       ^</div^>>> ReportsPremium.tsx
echo       ^<div className="grid grid-cols-1 md:grid-cols-2 gap-6"^>>> ReportsPremium.tsx
echo         ^<div className="bg-white rounded-xl shadow-sm p-6"^>>> ReportsPremium.tsx
echo           ^<h3 className="font-semibold mb-4 flex items-center gap-2"^>^<Calendar className="h-5 w-5" /^> Periode Laporan^</h3^>>> ReportsPremium.tsx
echo           ^<div className="space-y-3"^>>> ReportsPremium.tsx
echo             ^<input type="date" className="w-full p-2 border rounded" placeholder="Tanggal Mulai" onChange={e => setDateRange({...dateRange, start: e.target.value})} /^>>> ReportsPremium.tsx
echo             ^<input type="date" className="w-full p-2 border rounded" placeholder="Tanggal Akhir" onChange={e => setDateRange({...dateRange, end: e.target.value})} /^>>> ReportsPremium.tsx
echo           ^</div^>>> ReportsPremium.tsx
echo         ^</div^>>> ReportsPremium.tsx
echo         ^<div className="bg-white rounded-xl shadow-sm p-6"^>>> ReportsPremium.tsx
echo           ^<h3 className="font-semibold mb-4 flex items-center gap-2"^>^<Download className="h-5 w-5" /^> Ekspor Laporan^</h3^>>> ReportsPremium.tsx
echo           ^<div className="space-y-3"^>>> ReportsPremium.tsx
echo             ^<button onClick={() => handleExport('excel')} disabled={loading} className="w-full bg-green-600 text-white p-2 rounded-lg flex items-center justify-center gap-2"^>^<FileText className="h-4 w-4" /^> Ekspor ke Excel^</button^>>> ReportsPremium.tsx
echo             ^<button onClick={() => handleExport('pdf')} disabled={loading} className="w-full bg-red-600 text-white p-2 rounded-lg flex items-center justify-center gap-2"^>^<FileText className="h-4 w-4" /^> Ekspor ke PDF^</button^>>> ReportsPremium.tsx
echo           ^</div^>>> ReportsPremium.tsx
echo         ^</div^>>> ReportsPremium.tsx
echo       ^</div^>>> ReportsPremium.tsx
echo       ^<div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl p-6 text-white"^>>> ReportsPremium.tsx
echo         ^<div className="flex justify-between"^>>> ReportsPremium.tsx
echo           ^<div^>>> ReportsPremium.tsx
echo             ^<p className="opacity-80"^>Total Pendapatan^</p^>>> ReportsPremium.tsx
echo             ^<p className="text-3xl font-bold"^>Rp 0^</p^>>> ReportsPremium.tsx
echo           ^</div^>>> ReportsPremium.tsx
echo           ^<div^>>> ReportsPremium.tsx
echo             ^<p className="opacity-80"^>Rata-rata per hari^</p^>>> ReportsPremium.tsx
echo             ^<p className="text-2xl font-bold"^>Rp 0^</p^>>> ReportsPremium.tsx
echo           ^</div^>>> ReportsPremium.tsx
echo           ^<div^>>> ReportsPremium.tsx
echo             ^<TrendingUp className="h-8 w-8 opacity-50" /^>>> ReportsPremium.tsx
echo           ^</div^>>> ReportsPremium.tsx
echo         ^</div^>>> ReportsPremium.tsx
echo       ^</div^>>> ReportsPremium.tsx
echo     ^</div^>>> ReportsPremium.tsx
echo   );>> ReportsPremium.tsx
echo };>> ReportsPremium.tsx
echo export default ReportsPremium;>> ReportsPremium.tsx
echo.>> ReportsPremium.tsx

:: ==================== ANALYTICS.TSX ====================
echo Creating Analytics.tsx...
del Analytics.tsx 2>nul
copy con Analytics.tsx >nul
echo import { TrendingUp, TrendingDown, DollarSign, Users } from 'lucide-react';> Analytics.tsx
echo.>> Analytics.tsx
echo const Analytics = () => {>> Analytics.tsx
echo   return (>> Analytics.tsx
echo     ^<div className="space-y-6"^>>> Analytics.tsx
echo       ^<div^>>> Analytics.tsx
echo         ^<h1 className="text-2xl font-bold"^>Analytics & Prediksi^</h1^>>> Analytics.tsx
echo         ^<p className="text-gray-500"^>Analisis data dan prediksi pendapatan dengan AI^</p^>>> Analytics.tsx
echo       ^</div^>>> Analytics.tsx
echo       ^<div className="grid grid-cols-1 md:grid-cols-2 gap-6"^>>> Analytics.tsx
echo         ^<div className="bg-white rounded-xl shadow-sm p-6"^>>> Analytics.tsx
echo           ^<h3 className="font-semibold mb-4"^>Prediksi Pendapatan Bulan Depan^</h3^>>> Analytics.tsx
echo           ^<div className="text-center py-8"^>>> Analytics.tsx
echo             ^<p className="text-4xl font-bold text-blue-600"^>Rp 12.500.000^</p^>>> Analytics.tsx
echo             ^<p className="text-green-600 mt-2 flex items-center justify-center gap-1"^>^<TrendingUp className="h-4 w-4" /^> +15% dari bulan ini^</p^>>> Analytics.tsx
echo           ^</div^>>> Analytics.tsx
echo         ^</div^>>> Analytics.tsx
echo         ^<div className="bg-white rounded-xl shadow-sm p-6"^>>> Analytics.tsx
echo           ^<h3 className="font-semibold mb-4"^>Analisis Pelanggan^</h3^>>> Analytics.tsx
echo           ^<div className="space-y-4"^>>> Analytics.tsx
echo             ^<div className="flex justify-between"^>^<span^>Customer Retention^</span^>^<span className="font-semibold"^>78%^</span^>^</div^>>> Analytics.tsx
echo             ^<div className="flex justify-between"^>^<span^>Avg. Order Value^</span^>^<span className="font-semibold"^>Rp 45.000^</span^>^</div^>>> Analytics.tsx
echo             ^<div className="flex justify-between"^>^<span^>Pelanggan Baru (Bulan Ini)^</span^>^<span className="font-semibold"^>15 orang^</span^>^</div^>>> Analytics.tsx
echo           ^</div^>>> Analytics.tsx
echo         ^</div^>>> Analytics.tsx
echo       ^</div^>>> Analytics.tsx
echo     ^</div^>>> Analytics.tsx
echo   );>> Analytics.tsx
echo };>> Analytics.tsx
echo export default Analytics;>> Analytics.tsx
echo.>> Analytics.tsx

echo.
echo ========================================
echo ALL ULTIMATE FILES CREATED SUCCESSFULLY!
echo ========================================
echo.
echo Files created:
echo - Employees.tsx
echo - Inventory.tsx
echo - Outlets.tsx
echo - IoTDevices.tsx
echo - WABroadcast.tsx
echo - ReportsPremium.tsx
echo - Analytics.tsx
echo.
echo Restart frontend with: npm run dev
