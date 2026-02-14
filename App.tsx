import React, { Suspense, useEffect } from 'react';
import { HashRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AppProvider, useApp } from './src/context/AppContext';
import { Sidebar } from './src/components/Layout/Sidebar';
import { Header } from './src/components/Layout/Header';
import { Loader2 } from 'lucide-react';
import { LazyDashboard, LazyEvents, LazySales, LazyTableLayout, LazyEntrance, LazyStaff, LazyCustomers, LazyReports, LazyOrganizations, LazySaaSFinance, LazyWrapper } from './src/utils/lazy-loading';
import { Login } from './src/pages/Login';
import { AnnouncementPopup } from './src/components/Layout/AnnouncementPopup';
import { Lock, Phone, CreditCard } from 'lucide-react';
import { rateLimit, sanitizeInput } from './src/utils/auth';

// Protected Route Wrapper
const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useApp();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
};

// License Blocker Component
const LicenseOverlay: React.FC = () => {
    const { isLicenseExpired, user, logout } = useApp();
    
    // Super Admin etkilenmez
    if (!isLicenseExpired || user?.role === 'super_admin') return null;

    return (
        <div className="fixed inset-0 z-[100] bg-slate-900/90 backdrop-blur-xl flex items-center justify-center p-6">
            <div className="bg-white rounded-[2.5rem] max-w-lg w-full p-10 text-center shadow-2xl relative overflow-hidden animate-in zoom-in-95 duration-500">
                <div className="absolute top-0 left-0 w-full h-2 bg-red-500"></div>
                
                <div className="w-24 h-24 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Lock size={48} className="text-red-500" />
                </div>
                
                <h2 className="text-3xl font-black text-slate-900 mb-2">Hizmet Süreniz Doldu</h2>
                <p className="text-slate-500 font-medium mb-8">
                    Üyeliğinizin kullanım süresi sona ermiştir. Sisteme erişmek ve işlem yapmaya devam etmek için lütfen hizmet sağlayıcınızla iletişime geçiniz.
                </p>

                <div className="bg-slate-50 rounded-2xl p-6 mb-8 border border-slate-100">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">İLETİŞİM KANALLARI</p>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 text-slate-700 font-bold">
                            <Phone size={18} className="text-blue-500" />
                            <span>0850 123 45 67</span>
                        </div>
                        <div className="flex items-center gap-3 text-slate-700 font-bold">
                            <CreditCard size={18} className="text-emerald-500" />
                            <span>satis@biletpro.com</span>
                        </div>
                    </div>
                </div>

                <button 
                    onClick={logout}
                    className="w-full py-4 rounded-xl font-black text-sm bg-slate-900 text-white hover:bg-slate-800 transition-all"
                >
                    ÇIKIŞ YAP
                </button>
            </div>
        </div>
    );
};

// Layout Component
const Layout: React.FC = () => {
  return (
    <div className="flex min-h-screen bg-slate-50 font-sans">
      <LicenseOverlay />
      <AnnouncementPopup /> {/* DUYURU POPUP EKLENDİ */}
      <Sidebar />
      <div className="flex-1 flex flex-col md:ml-64 transition-all duration-300">
        <Header />
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-slate-50/50">
          <Outlet />
        </main>
      </div>
    </div>
  );
};

const AppRoutes: React.FC = () => {
  return (
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route path="/" element={
          <RequireAuth>
            <Layout />
          </RequireAuth>
        }>
          <Route index element={<LazyWrapper><LazyDashboard /></LazyWrapper>} />
          <Route path="organizations" element={<LazyWrapper><LazyOrganizations /></LazyWrapper>} />
          <Route path="saas-finance" element={<LazyWrapper><LazySaaSFinance /></LazyWrapper>} />
          <Route path="events" element={<LazyWrapper><LazyEvents /></LazyWrapper>} />
          <Route path="layout" element={<LazyWrapper><LazyTableLayout /></LazyWrapper>} />
          <Route path="sales" element={<LazyWrapper><LazySales /></LazyWrapper>} />
          <Route path="customers" element={<LazyWrapper><LazyCustomers /></LazyWrapper>} />
          <Route path="entrance" element={<LazyWrapper><LazyEntrance /></LazyWrapper>} />
          <Route path="staff" element={<LazyWrapper><LazyStaff /></LazyWrapper>} />
          <Route path="reports" element={<LazyWrapper><LazyReports /></LazyWrapper>} />
        </Route>
      </Routes>
  );
};

const App: React.FC = () => {
  return (
    <AppProvider>
      <Router>
        <AppRoutes />
      </Router>
    </AppProvider>
  );
};

export default App;
