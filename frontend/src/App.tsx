import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './contexts/AuthContext';
import { OutletProvider } from './contexts/OutletContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { LanguageProvider } from './contexts/LanguageContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import LayoutUltimate from './components/LayoutUltimate';
import DashboardUltimate from './pages/DashboardUltimate';
import Transactions from './pages/Transactions';
import Customers from './pages/Customers';
import Employees from './pages/Employees';
import Inventory from './pages/Inventory';
import Outlets from './pages/Outlets';
import IoTDevices from './pages/IoTDevices';
import WABroadcast from './pages/WABroadcast';
import ReportsPremium from './pages/ReportsPremium';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import ProfitLoss from './pages/ProfitLoss';
import OperationalCost from './pages/OperationalCost';
import ChatbotSettings from './pages/ChatbotSettings';
import PeakHourAnalysis from './pages/PeakHourAnalysis';
import Membership from './pages/Membership';
import PickupDelivery from './pages/PickupDelivery';
import BackupRestore from './pages/BackupRestore';
import RatingReview from './pages/RatingReview';
import TwoFactorAuth from './pages/TwoFactorAuth';
import License from './pages/License';

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <OutletProvider>
          <ThemeProvider>
            <LanguageProvider>
              <Toaster position="top-right" />
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<PrivateRoute />}>
                  <Route element={<LayoutUltimate />}>
                    <Route path="/" element={<Navigate to="/dashboard" />} />
                    <Route path="/dashboard" element={<DashboardUltimate />} />
                    <Route path="/transactions" element={<Transactions />} />
                    <Route path="/customers" element={<Customers />} />
                    <Route path="/employees" element={<Employees />} />
                    <Route path="/inventory" element={<Inventory />} />
                    <Route path="/outlets" element={<Outlets />} />
                    <Route path="/iot" element={<IoTDevices />} />
                    <Route path="/whatsapp" element={<WABroadcast />} />
                    <Route path="/reports" element={<ReportsPremium />} />
                    <Route path="/analytics" element={<Analytics />} />
                    <Route path="/settings" element={<Settings />} />
                    <Route path="/profit-loss" element={<ProfitLoss />} />
                    <Route path="/operational-cost" element={<OperationalCost />} />
                    <Route path="/chatbot" element={<ChatbotSettings />} />
                    <Route path="/peak-hour" element={<PeakHourAnalysis />} />
                    <Route path="/membership" element={<Membership />} />
                    <Route path="/pickup" element={<PickupDelivery />} />
                    <Route path="/backup" element={<BackupRestore />} />
                    <Route path="/ratings" element={<RatingReview />} />
                    <Route path="/2fa" element={<TwoFactorAuth />} />
                    <Route path="/license" element={<License />} />
                  </Route>
                </Route>
              </Routes>
            </LanguageProvider>
          </ThemeProvider>
        </OutletProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;