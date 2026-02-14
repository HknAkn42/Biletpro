
import React, { useMemo, useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { TrendingUp, Users, AlertCircle, ArrowRight, Lock, CheckCircle2, Calendar, LayoutGrid, Ticket, QrCode, Sparkles, Wallet, BadgeCheck, Phone, TrendingDown, Plus, Trash2, Clock, Share2, PieChart as PieIcon, Activity, ArrowUpRight } from 'lucide-react';
import { BarChart, Bar, XAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, AreaChart, Area, PieChart, Pie, Legend, YAxis } from 'recharts';
import { Link, useNavigate } from 'react-router-dom';

// --- SAAS ADMIN DASHBOARD (ROOT USER) ---
const SuperAdminDashboard: React.FC = () => {
    const { organizations, saasExpenses, addSaaSExpense, deleteSaaSExpense } = useApp();

    // --- FINANCIAL CALCULATIONS ---
    const totalRevenue = organizations.reduce((acc, org) => acc + (org.licensePrice || 0), 0);
    const totalExpenses = saasExpenses.reduce((acc, exp) => acc + exp.amount, 0);
    const netProfit = totalRevenue - totalExpenses;
    const profitMargin = totalRevenue > 0 ? ((netProfit / totalRevenue) * 100).toFixed(1) : 0;
    
    // --- CHART DATA PREPARATION ---
    // Expense Breakdown
    const expenseByCategory = useMemo(() => {
        const data: Record<string, number> = { server: 0, marketing: 0, staff: 0, other: 0 };
        saasExpenses.forEach(exp => {
            if (data[exp.category] !== undefined) data[exp.category] += exp.amount;
        });
        return [
            { name: 'Sunucu/Altyapı', value: data.server, color: '#3b82f6' },
            { name: 'Pazarlama', value: data.marketing, color: '#f59e0b' },
            { name: 'Personel', value: data.staff, color: '#10b981' },
            { name: 'Diğer', value: data.other, color: '#64748b' },
        ].filter(d => d.value > 0);
    }, [saasExpenses]);

    // License Expiry Logic
    const getDaysLeft = (dateStr?: string) => {
        if (!dateStr) return -999;
        const diff = new Date(dateStr).getTime() - new Date().getTime();
        return Math.ceil(diff / (1000 * 60 * 60 * 24));
    };

    const expiringOrgs = organizations
        .filter(o => o.id !== 'system' && o.subscriptionEndDate)
        .map(o => ({ ...o, daysLeft: getDaysLeft(o.subscriptionEndDate) }))
        .sort((a, b) => a.daysLeft - b.daysLeft)
        .slice(0, 4);

    const activeCustomers = organizations.filter(o => o.id !== 'system').length;
    
    // Send Reminder Action
    const sendReminder = (org: any) => {
        const msg = `Sayın ${org.contactPerson}, ${org.name} lisans süreniz ${org.daysLeft} gün içinde dolacaktır. Yenileme için iletişime geçiniz.`;
        const url = `https://wa.me/${org.phone?.replace(/[^0-9]/g, '')}?text=${encodeURIComponent(msg)}`;
        window.open(url, '_blank');
    };

    return (
        <div className="p-8 space-y-8 animate-in fade-in max-w-[1600px] mx-auto">
            {/* Header Section */}
            <div className="flex items-end justify-between border-b border-slate-200 pb-6">
                <div>
                    <h1 className="text-3xl font-black text-slate-900 tracking-tight">Genel Bakış</h1>
                    <p className="text-slate-500 font-medium mt-1">SaaS İşletme Performans Analizi ve KPI Göstergeleri</p>
                </div>
                <div className="flex gap-3">
                    <div className="text-right px-4 border-r border-slate-200">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">KÂRLILIK ORANI</p>
                        <p className={`text-xl font-black ${parseFloat(profitMargin as string) >= 50 ? 'text-emerald-500' : 'text-slate-800'}`}>%{profitMargin}</p>
                    </div>
                    <div className="text-right pl-2">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">AKTİF MÜŞTERİ</p>
                        <p className="text-xl font-black text-blue-600">{activeCustomers}</p>
                    </div>
                </div>
            </div>

            {/* MAIN STATS GRID */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                 {/* NET PROFIT CARD - MAIN FOCUS */}
                 <Card className="bg-slate-900 text-white p-8 relative overflow-hidden shadow-2xl shadow-slate-900/20 col-span-1 md:col-span-1 flex flex-col justify-between h-48 border-none">
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 bg-indigo-500 rounded text-white"><Wallet size={16} /></div>
                            <span className="text-[10px] font-bold text-indigo-200 uppercase tracking-widest">NET KÂR (BİLANÇO)</span>
                        </div>
                        <h3 className="text-4xl font-black tracking-tighter">₺{netProfit.toLocaleString()}</h3>
                        <p className="text-xs text-slate-400 mt-2 font-medium">Toplam Gelir - Toplam Gider</p>
                    </div>
                    <div className="absolute right-0 bottom-0 opacity-10">
                        <AreaChart width={200} height={100} data={[{v:10}, {v:15}, {v:12}, {v:20}, {v:35}, {v:40}, {v:38}]}>
                            <Area type="monotone" dataKey="v" stroke="#fff" fill="#fff" />
                        </AreaChart>
                    </div>
                </Card>

                {/* REVENUE & EXPENSE COMPACT CARDS */}
                <Card className="bg-white p-6 border border-slate-100 shadow-sm flex flex-col justify-center gap-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOPLAM LİSANS GELİRİ</p>
                            <h3 className="text-3xl font-black text-emerald-600">₺{totalRevenue.toLocaleString()}</h3>
                        </div>
                        <div className="bg-emerald-50 p-2 rounded-xl text-emerald-600"><TrendingUp size={20} /></div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500" style={{ width: '100%' }}></div>
                    </div>
                </Card>

                <Card className="bg-white p-6 border border-slate-100 shadow-sm flex flex-col justify-center gap-4">
                    <div className="flex justify-between items-start">
                        <div>
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">TOPLAM GİDERLER</p>
                            <h3 className="text-3xl font-black text-red-500">₺{totalExpenses.toLocaleString()}</h3>
                        </div>
                        <div className="bg-red-50 p-2 rounded-xl text-red-500"><TrendingDown size={20} /></div>
                    </div>
                    <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500" style={{ width: `${Math.min(100, (totalExpenses/totalRevenue)*100)}%` }}></div>
                    </div>
                </Card>
            </div>

            {/* DETAILED ANALYSIS SECTION */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                
                {/* EXPENSE DISTRIBUTION CHART */}
                <Card className="p-6 border border-slate-200 bg-white shadow-sm flex flex-col h-[400px]">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <PieIcon size={18} className="text-slate-400" /> Gider Dağılımı
                        </h3>
                    </div>
                    
                    <div className="flex-1 min-h-0">
                        {expenseByCategory.length > 0 ? (
                            <ResponsiveContainer width="100%" height="100%">
                                <PieChart>
                                    <Pie
                                        data={expenseByCategory}
                                        cx="50%"
                                        cy="50%"
                                        innerRadius={60}
                                        outerRadius={80}
                                        paddingAngle={5}
                                        dataKey="value"
                                    >
                                        {expenseByCategory.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Pie>
                                    <Tooltip 
                                        formatter={(value: number) => `₺${value.toLocaleString()}`}
                                        contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)'}}
                                    />
                                    <Legend verticalAlign="bottom" height={36} iconType="circle" />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400 gap-2">
                                <div className="p-4 bg-slate-50 rounded-full"><PieIcon size={24} /></div>
                                <span className="text-xs font-bold">Veri Yok</span>
                            </div>
                        )}
                    </div>
                </Card>

                {/* CRITICAL ALERTS & ACTIONS */}
                <Card className="col-span-1 lg:col-span-2 p-0 border border-slate-200 bg-white shadow-sm overflow-hidden flex flex-col h-[400px]">
                    <div className="px-6 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                        <h3 className="font-bold text-slate-900 flex items-center gap-2">
                            <Activity size={18} className="text-red-500" /> Kritik İzleme & Aksiyonlar
                        </h3>
                        <Link to="/organizations" className="text-[10px] font-black text-blue-600 hover:underline">TÜMÜNÜ GÖR</Link>
                    </div>

                    <div className="overflow-y-auto custom-scrollbar flex-1 p-2">
                        {expiringOrgs.length === 0 ? (
                            <div className="h-full flex flex-col items-center justify-center text-slate-400">
                                <CheckCircle2 size={40} className="text-emerald-200 mb-2" />
                                <p className="font-bold text-slate-500">Her şey yolunda!</p>
                                <p className="text-xs">Yaklaşan lisans yenilemesi bulunmuyor.</p>
                            </div>
                        ) : (
                            <div className="space-y-2">
                                {expiringOrgs.map(org => (
                                    <div key={org.id} className="flex items-center justify-between p-4 bg-white hover:bg-slate-50 border border-slate-100 rounded-xl transition-colors group">
                                        <div className="flex items-center gap-4">
                                            <div className="w-10 h-10 bg-slate-100 rounded-lg flex items-center justify-center font-black text-slate-600 text-sm">
                                                {org.name.charAt(0)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <h4 className="font-bold text-slate-900 text-sm">{org.name}</h4>
                                                    {org.daysLeft <= 0 && <span className="px-2 py-0.5 bg-red-100 text-red-600 text-[9px] font-black rounded uppercase">Süresi Doldu</span>}
                                                </div>
                                                <p className="text-xs text-slate-500 font-medium">Yetkili: {org.contactPerson}</p>
                                            </div>
                                        </div>
                                        
                                        <div className="flex items-center gap-6">
                                            <div className="text-right">
                                                <p className={`text-lg font-black leading-none ${org.daysLeft <= 7 ? 'text-red-500' : 'text-amber-500'}`}>
                                                    {org.daysLeft}
                                                </p>
                                                <p className="text-[9px] font-bold text-slate-400 uppercase">Gün Kaldı</p>
                                            </div>
                                            <button 
                                                onClick={() => sendReminder(org)}
                                                className="px-4 py-2 bg-[#25D366] hover:bg-[#20bd5a] text-white rounded-lg font-bold text-xs shadow-lg shadow-green-500/20 flex items-center gap-2 transition-transform active:scale-95"
                                            >
                                                <Share2 size={14} /> WhatsApp
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </Card>
            </div>
        </div>
    );
};

// --- CLIENT DASHBOARD (REGULAR USER) ---
const ClientDashboard: React.FC = () => {
    const { sales, tables, currentEvent, events, user } = useApp();
    const navigate = useNavigate();
    
    const safeCategories = Array.isArray(currentEvent?.categories) ? currentEvent.categories : [];
  
    const setupSteps = useMemo(() => {
      const eventCreated = events.length > 0;
      const categoriesCreated = currentEvent.id ? safeCategories.length > 0 : false;
      const tablesCreated = currentEvent.id ? tables.filter(t => t.eventId === currentEvent.id).length > 0 : false;
      const firstSaleMade = currentEvent.id ? sales.filter(s => s.eventId === currentEvent.id).length > 0 : false;
      return [
        { id: 1, title: 'Etkinlik', desc: 'Organizasyon tanımla', done: eventCreated, path: '/events', icon: Calendar },
        { id: 2, title: 'Kategori', desc: 'Fiyatları belirle', done: categoriesCreated, path: '/layout', icon: Sparkles },
        { id: 3, title: 'Masa Planı', desc: 'Oturma düzeni', done: tablesCreated, path: '/layout', icon: LayoutGrid },
        { id: 4, title: 'Satış', desc: 'İlk bilet satışı', done: firstSaleMade, path: '/sales', icon: Ticket },
        { id: 5, title: 'Terminal', desc: 'Giriş kontrolü', done: false, path: '/entrance', icon: QrCode }
      ];
    }, [events, currentEvent, tables, sales, safeCategories]);
  
    const allDone = setupSteps.every((s, i) => i === 4 || s.done);
    const totalRevenue = sales.filter(s => s.eventId === currentEvent.id).reduce((acc, sale) => acc + (sale.finalAmount || 0), 0);
    const totalDebt = sales.filter(s => s.eventId === currentEvent.id).reduce((acc, sale) => acc + (sale.remainingDebt || 0), 0);
    const totalTables = tables.filter(t => t.eventId === currentEvent.id).length;
    const soldTables = tables.filter(t => t.eventId === currentEvent.id && t.status === 'sold').length;
    const occupancyRate = totalTables > 0 ? (soldTables / totalTables) * 100 : 0;

    return (
    <div className="p-8 space-y-8 max-w-[1400px] mx-auto animate-in fade-in duration-500">
      
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 to-slate-800 rounded-[2rem] p-8 text-white shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-end justify-between gap-4">
              <div>
                  <div className="flex items-center gap-2 text-blue-400 font-bold text-xs uppercase tracking-widest mb-2">
                      <Sparkles size={14} /> 
                      <span>Yönetim Paneli</span>
                  </div>
                  <h1 className="text-3xl font-black tracking-tight mb-1">Hoşgeldin, {user?.name}</h1>
                  <p className="text-slate-400 text-sm font-medium">Bugün harika işler çıkarmaya hazırsın.</p>
              </div>
              
              {currentEvent.id && (
                  <div className="bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/10 flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_10px_#34d399]"></div>
                      <div>
                          <p className="text-[9px] text-slate-400 uppercase font-bold tracking-wider">AKTİF ETKİNLİK</p>
                          <p className="font-bold text-sm">{currentEvent.name}</p>
                      </div>
                  </div>
              )}
          </div>
      </div>

      {!allDone && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {setupSteps.map((step, idx) => {
                const isNext = !step.done && (idx === 0 || setupSteps[idx-1].done);
                return (
                    <div key={step.id} onClick={() => navigate(step.path)} className={`p-5 rounded-2xl border transition-all cursor-pointer hover:-translate-y-1 duration-300 ${step.done ? 'bg-emerald-50/50 border-emerald-100 hover:shadow-md' : isNext ? 'bg-white border-blue-500 shadow-xl shadow-blue-500/10 ring-2 ring-blue-500/10' : 'bg-slate-50 border-slate-100 opacity-60'}`}>
                        <div className="flex justify-between items-start mb-3">
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${step.done ? 'bg-emerald-100 text-emerald-600' : isNext ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-slate-200 text-slate-400'}`}>
                                {step.done ? <CheckCircle2 size={20} /> : <step.icon size={20} />}
                            </div>
                            {isNext && <span className="text-[9px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-lg">SIRADAKİ</span>}
                        </div>
                        <h4 className="font-bold text-sm text-slate-900">{step.title}</h4>
                        <p className="text-xs text-slate-500 leading-tight mt-1">{step.desc}</p>
                    </div>
                );
            })}
        </div>
      )}

      {/* Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 border-none shadow-xl shadow-slate-200/40 rounded-[2rem] bg-white flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform duration-300">
            <div className="flex justify-between items-start">
                <div className="bg-blue-50 text-blue-600 p-3 rounded-2xl"><TrendingUp size={24} /></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">TOPLAM CİRO</span>
            </div>
            <div>
                <p className="text-3xl font-black tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">₺{totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Etkinlik geneli hasılat</p>
            </div>
        </Card>

        <Card className="p-6 border-none shadow-xl shadow-slate-200/40 rounded-[2rem] bg-white flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform duration-300">
            <div className="flex justify-between items-start">
                <div className="bg-emerald-50 text-emerald-600 p-3 rounded-2xl"><Users size={24} /></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">DOLULUK</span>
            </div>
            <div>
                <div className="flex items-end gap-2">
                    <p className="text-3xl font-black tracking-tight text-slate-900 group-hover:text-emerald-600 transition-colors">%{occupancyRate.toFixed(0)}</p>
                    <span className="text-xs font-bold text-slate-400 mb-1.5">{soldTables}/{totalTables} Masa</span>
                </div>
                <div className="w-full bg-slate-100 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div className="bg-emerald-500 h-full transition-all duration-1000" style={{ width: `${occupancyRate}%` }}></div>
                </div>
            </div>
        </Card>

        <Card className="p-6 border-none shadow-xl shadow-slate-200/40 rounded-[2rem] bg-white flex flex-col justify-between h-40 group hover:scale-[1.02] transition-transform duration-300">
            <div className="flex justify-between items-start">
                <div className="bg-red-50 text-red-600 p-3 rounded-2xl"><AlertCircle size={24} /></div>
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AÇIK HESAP</span>
            </div>
            <div>
                <p className="text-3xl font-black tracking-tight text-slate-900 group-hover:text-red-600 transition-colors">₺{totalDebt.toLocaleString()}</p>
                <p className="text-xs text-slate-400 font-medium mt-1">Tahsil edilecek tutar</p>
            </div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Card className="lg:col-span-2 p-8 rounded-[2rem] shadow-sm border-slate-200 bg-white">
            <div className="flex items-center justify-between mb-8">
                <div>
                    <h3 className="text-lg font-bold text-slate-900">Kategori Performansı</h3>
                    <p className="text-xs text-slate-500">Masaların satış dağılımı</p>
                </div>
                <Link to="/layout" className="bg-slate-50 hover:bg-slate-100 text-slate-600 px-4 py-2 rounded-xl text-xs font-bold transition-colors">YÖNET</Link>
            </div>
            <div className="h-64">
                {safeCategories.length > 0 ? (
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={safeCategories.map(c => ({ name: c.name, count: tables.filter(t => t.categoryId === c.id && t.status === 'sold').length, color: c.color }))}>
                            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                            <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 11, fontWeight: 600}} dy={10} />
                            <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)'}} />
                            <Bar dataKey="count" radius={[8, 8, 0, 0]} barSize={40}>
                                {safeCategories.map((entry, index) => <Cell key={`cell-${index}`} fill={entry.color} />)}
                            </Bar>
                        </BarChart>
                    </ResponsiveContainer>
                ) : (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                        <TrendingUp size={32} />
                        <span className="text-xs font-medium">Veri yok</span>
                    </div>
                )}
            </div>
          </Card>

          <Card className="p-0 rounded-[2rem] shadow-sm border-slate-200 bg-white flex flex-col h-[400px] overflow-hidden">
            <div className="p-6 border-b border-slate-50 bg-slate-50/50">
                <h3 className="text-lg font-bold text-slate-900">Son İşlemler</h3>
            </div>
            <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-3">
                {sales.filter(s => s.eventId === currentEvent.id).length === 0 ? (
                    <div className="h-full flex flex-col items-center justify-center text-slate-300 gap-2">
                        <Ticket size={32} />
                        <span className="text-xs font-medium">İşlem yok</span>
                    </div>
                ) : (
                    sales.filter(s => s.eventId === currentEvent.id).slice(-8).reverse().map(sale => (
                        <div key={sale.id} className="flex items-center gap-4 p-4 rounded-2xl bg-white border border-slate-100 hover:border-blue-200 hover:shadow-md transition-all group">
                            <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center text-slate-500 font-black text-xs shadow-sm shrink-0 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                                {sale.customerName.charAt(0)}
                            </div>
                            <div className="flex-1 min-w-0">
                                <p className="font-bold text-slate-900 text-xs truncate">{sale.customerName}</p>
                                <p className="text-[10px] text-slate-400 font-bold truncate mt-0.5">₺{sale.finalAmount}</p>
                            </div>
                            <span className={`text-[9px] font-black px-2 py-1 rounded-lg ${sale.paymentStatus === 'full' ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                                {sale.paymentStatus === 'full' ? 'OK' : 'BORÇ'}
                            </span>
                        </div>
                    ))
                )}
            </div>
          </Card>
      </div>
    </div>
    );
};

// Main Export
export const Dashboard: React.FC = () => {
  const { user } = useApp();

  if (!user?.permissions.includes('VIEW_DASHBOARD')) {
      return (
          <div className="p-8 h-full flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 p-6 rounded-full mb-4"><Lock size={32} className="text-slate-400" /></div>
              <h2 className="text-lg font-bold text-slate-800">Erişim Kısıtlı</h2>
          </div>
      );
  }

  // Kullanıcı tipine göre Dashboard'u değiştir
  return user.role === 'super_admin' ? <SuperAdminDashboard /> : <ClientDashboard />;
};
