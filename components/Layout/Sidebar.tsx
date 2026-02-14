
import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, CalendarDays, Armchair, QrCode, FileBarChart, LogOut, Ticket, Users, X, UserCheck, Settings, PenTool, LayoutGrid, Building2, Clock, AlertTriangle, Wallet, PieChart, Landmark, TrendingUp, Code2 } from 'lucide-react';
import { useApp } from '../../context/AppContext';

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const { logout, user, isMobileMenuOpen, closeMobileMenu, organizations, licenseDaysLeft } = useApp();

  const userOrg = organizations.find(o => o.id === user?.organizationId);

  // --- 1. PATRON MENÜSÜ (SAAS ANALYST & ADMIN) ---
  const superAdminNavItems = [
    { 
      path: '/', 
      icon: PieChart, 
      label: 'Genel Bakış & Analiz'
    },
    { 
      path: '/organizations', 
      icon: Building2, 
      label: 'Müşteri Yönetimi' 
    },
    { 
      path: '/saas-finance', 
      icon: Landmark, 
      label: 'Finans & Muhasebe'
    },
    {
      path: '/staff',
      icon: Users,
      label: 'Sistem Yöneticileri' 
    }
  ];

  // --- 2. MÜŞTERİ MENÜSÜ (EVENT ORGANIZER) ---
  const clientNavItems = [
    { 
      path: '/', 
      icon: LayoutDashboard, 
      label: 'Kontrol Paneli',
      permission: 'VIEW_DASHBOARD'
    },
    { 
      path: '/events', 
      icon: CalendarDays, 
      label: 'Etkinlikler',
      permission: 'MANAGE_EVENTS' 
    },
    { 
      path: '/layout', 
      icon: LayoutGrid, 
      label: 'Masa Düzeni',
      permission: 'MANAGE_EVENTS'
    },
    { 
      path: '/sales', 
      icon: Armchair, 
      label: 'Bilet Satış',
      permission: 'VIEW_SALES'
    },
    {
      path: '/customers',
      icon: UserCheck,
      label: 'Müşteriler',
      permission: 'VIEW_CUSTOMERS'
    },
    { 
      path: '/entrance', 
      icon: QrCode, 
      label: 'Kapı Kontrol', // İSİM GÜNCELLENDİ
      permission: 'SCAN_TICKETS'
    },
    { 
      path: '/staff', 
      icon: Users, 
      label: 'Personel',
      permission: 'MANAGE_STAFF'
    },
    { 
      path: '/reports', 
      icon: FileBarChart, 
      label: 'Raporlar',
      permission: 'VIEW_DASHBOARD'
    },
  ];

  // Hangi menüyü göstereceğiz?
  let navItems = [];
  
  if (user?.role === 'super_admin') {
      // Patron sadece patron menüsünü görür
      navItems = superAdminNavItems;
  } else {
      // Müşteri yetkilerine göre filtrelenmiş menüyü görür
      navItems = clientNavItems.filter(item => 
        user?.permissions.includes(item.permission as any) || user?.role === 'admin'
      );
  }

  const isActive = (path: string) => location.pathname === path;

  // Lisans Rengi (Sadece Müşteri İçin)
  let licenseColor = 'text-emerald-400';
  let licenseBg = 'bg-emerald-500/10';
  let licenseBorder = 'border-emerald-500/20';

  if (licenseDaysLeft !== null) {
      if (licenseDaysLeft <= 7) {
          licenseColor = 'text-red-400';
          licenseBg = 'bg-red-500/10';
          licenseBorder = 'border-red-500/20';
      } else if (licenseDaysLeft <= 30) {
          licenseColor = 'text-amber-400';
          licenseBg = 'bg-amber-500/10';
          licenseBorder = 'border-amber-500/20';
      }
  }

  return (
    <>
        {/* Mobile Overlay */}
        {isMobileMenuOpen && (
            <div 
                className="fixed inset-0 bg-slate-900/60 z-40 md:hidden backdrop-blur-sm"
                onClick={closeMobileMenu}
            ></div>
        )}

        <aside className={`
            fixed left-0 top-0 h-full w-64 bg-slate-950 text-white z-50 shadow-2xl
            flex flex-col transition-transform duration-500 ease-in-out border-r border-slate-800
            ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
        `}>
            <div className="p-8 border-b border-slate-800 flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`${user?.role === 'super_admin' ? 'bg-indigo-600' : 'bg-blue-600'} p-2.5 rounded-xl shadow-2xl shadow-blue-900/20`}>
                        {user?.role === 'super_admin' ? <TrendingUp size={24} className="text-white" /> : <Ticket size={24} className="text-white" />}
                    </div>
                    <div>
                        <span className="text-xl font-black tracking-tight block leading-none">BiletPro</span>
                        <span className="text-[9px] text-slate-500 font-bold tracking-widest uppercase mt-1">
                            {user?.role === 'super_admin' ? 'YÖNETİM MERKEZİ' : userOrg?.name || 'PREMIUM'}
                        </span>
                    </div>
                </div>
                <button onClick={closeMobileMenu} className="md:hidden text-slate-500 hover:text-white transition-colors">
                    <X size={24} />
                </button>
            </div>

            <nav className="flex-1 px-4 py-8 space-y-1.5 overflow-y-auto custom-scrollbar">
                {user?.role === 'super_admin' && (
                    <div className="px-4 pb-2 mb-2">
                        <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">Analiz & Yönetim</p>
                    </div>
                )}
                
                {navItems.map((item) => (
                <Link
                    key={item.path}
                    to={item.path}
                    onClick={closeMobileMenu}
                    className={`flex items-center gap-3.5 px-5 py-4 rounded-xl transition-all duration-300 group ${
                    isActive(item.path)
                        ? user?.role === 'super_admin' 
                            ? 'bg-indigo-600/10 text-indigo-400 border border-indigo-600/20 translate-x-1' 
                            : 'bg-blue-600 text-white shadow-xl shadow-blue-900/40 translate-x-1'
                        : 'text-slate-400 hover:bg-slate-800/50 hover:text-slate-200 hover:translate-x-1'
                    }`}
                >
                    <item.icon size={18} strokeWidth={isActive(item.path) ? 2.5 : 2} className={isActive(item.path) ? 'scale-110' : 'group-hover:scale-110 transition-transform'} />
                    <span className={`text-sm tracking-tight ${isActive(item.path) ? 'font-black' : 'font-medium'}`}>{item.label}</span>
                </Link>
                ))}
            </nav>

            <div className="p-6 border-t border-slate-800 bg-slate-900/50">
                {/* Lisans Durumu (Sadece Müşteri) */}
                {user?.role !== 'super_admin' && licenseDaysLeft !== null && (
                    <div className={`mb-6 p-4 rounded-2xl border ${licenseBg} ${licenseBorder}`}>
                        <div className="flex justify-between items-center mb-2">
                             <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-slate-400">
                                 <Clock size={12} /> Lisans
                             </div>
                             {licenseDaysLeft <= 7 && <AlertTriangle size={14} className="text-red-500 animate-pulse" />}
                        </div>
                        <div className="flex items-end gap-1">
                            <span className={`text-2xl font-black leading-none ${licenseColor}`}>{licenseDaysLeft}</span>
                            <span className="text-[10px] font-bold text-slate-500 mb-0.5">GÜN KALDI</span>
                        </div>
                        {licenseDaysLeft <= 0 && <p className="text-[9px] text-red-500 font-bold mt-2">SÜRENİZ DOLDU!</p>}
                    </div>
                )}

                <div className="mb-4 px-4 py-3 bg-slate-800/50 rounded-xl flex items-center gap-3 border border-slate-700/50">
                    <div className={`w-8 h-8 rounded-lg ${user?.role === 'super_admin' ? 'bg-indigo-500' : 'bg-blue-500'} flex items-center justify-center font-bold text-xs uppercase text-white shadow-lg`}>{user?.name.charAt(0)}</div>
                    <div className="overflow-hidden">
                        <p className="text-xs font-bold truncate text-slate-200">{user?.name}</p>
                        <p className="text-[9px] text-slate-500 uppercase font-black tracking-widest">{user?.role === 'super_admin' ? 'ROOT' : user?.role}</p>
                    </div>
                </div>
                <button 
                    onClick={logout}
                    className="flex items-center gap-3 w-full px-5 py-3 text-slate-400 hover:bg-red-500/10 hover:text-red-400 rounded-xl transition-all font-bold text-xs border border-transparent hover:border-red-500/10"
                >
                    <LogOut size={16} />
                    <span>Oturumu Kapat</span>
                </button>

                {/* --- HAKAN AKIN SIGNATURE (Transparent & Subtle) --- */}
                <div className="mt-6 flex justify-center">
                    <div className="group flex items-center gap-1.5 opacity-20 hover:opacity-80 transition-opacity duration-500 select-none cursor-default">
                        <Code2 size={10} className="text-slate-400" />
                        <span className="text-[9px] font-medium text-slate-400 tracking-wider font-mono">
                            HAKAN AKIN
                        </span>
                    </div>
                </div>
            </div>
        </aside>
    </>
  );
};
