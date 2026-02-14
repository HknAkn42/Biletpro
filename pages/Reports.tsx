
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Lock, FileBarChart, Users, Wallet, AlertCircle, TrendingUp, Download, Trophy, Medal, Crown, Star } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Legend } from 'recharts';

export const Reports: React.FC = () => {
  const { sales, users, currentEvent, user } = useApp();

  // Yetki Kontrolü
  if (!user?.permissions.includes('VIEW_DASHBOARD')) {
      return (
          <div className="p-8 h-full flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 p-8 rounded-full mb-4">
                  <Lock size={48} className="text-slate-400" />
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Erişim Kısıtlı</h2>
              <p className="text-slate-500 mt-2">Raporları görüntüleme yetkiniz yok.</p>
          </div>
      );
  }

  // Veri Analizi ve Gruplama
  const staffPerformance = useMemo(() => {
    const stats: Record<string, {
      id: string;
      name: string;
      role: string;
      count: number;
      revenue: number;
      collected: number;
      debt: number;
    }> = {};

    // 1. Tüm satışları döngüye al
    sales.forEach(sale => {
      // Sadece mevcut etkinlik
      if (sale.eventId !== currentEvent.id) return;

      const sellerId = sale.soldBy;
      
      // Eğer bu satıcı daha önce listeye eklenmediyse, başlat
      if (!stats[sellerId]) {
        const seller = users.find(u => u.id === sellerId);
        stats[sellerId] = {
          id: sellerId,
          name: seller ? seller.name : 'Bilinmeyen / Silinen',
          role: seller?.role || 'staff',
          count: 0,
          revenue: 0,
          collected: 0,
          debt: 0
        };
      }

      // Değerleri topla
      stats[sellerId].count += 1;
      // revenue için finalAmount (indirimli) yoksa totalAmount (eski kayıtlar) kullanılır
      stats[sellerId].revenue += (sale.finalAmount !== undefined ? sale.finalAmount : sale.totalAmount);
      stats[sellerId].collected += sale.paidAmount;
      stats[sellerId].debt += sale.remainingDebt;
    });

    // 2. Array formatına çevir ve Ciroya göre sırala
    return Object.values(stats).sort((a, b) => b.revenue - a.revenue);
  }, [sales, users, currentEvent.id]);

  // Genel Toplamlar
  const totalStats = staffPerformance.reduce((acc, curr) => ({
    revenue: acc.revenue + curr.revenue,
    collected: acc.collected + curr.collected,
    debt: acc.debt + curr.debt,
    count: acc.count + curr.count
  }), { revenue: 0, collected: 0, debt: 0, count: 0 });

  const exportCSV = () => {
    const headers = ["Personel", "Rol", "Satış Adedi", "Toplam Ciro", "Tahsil Edilen (Kasa)", "Kalan Borç"];
    const rows = staffPerformance.map(p => [
        p.name,
        p.role,
        p.count,
        p.revenue.toFixed(2),
        p.collected.toFixed(2),
        p.debt.toFixed(2)
    ]);
    const csvContent = "data:text/csv;charset=utf-8," + headers.join(",") + "\n" + rows.map(e => e.join(",")).join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `${currentEvent.name}_Personel_Raporu.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // İlk 3 Personel
  const topPerformers = staffPerformance.slice(0, 3);

  // Grafik Renkleri
  const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6'];

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-200 pb-6">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Satış & Performans</h1>
          <p className="text-slate-500 font-medium">Etkinlik bazlı personel ve ciro analizi</p>
        </div>
        <button 
            onClick={exportCSV}
            className="flex items-center gap-2 px-6 py-3 bg-slate-900 text-white rounded-xl font-bold text-xs hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
        >
            <Download size={18} /> EXCEL İNDİR
        </button>
      </div>

      {/* Özet Kartlar */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-white border border-slate-100 shadow-sm p-6 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-blue-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
              <div className="relative z-10">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">TOPLAM CİRO</p>
                  <h3 className="text-3xl font-black text-slate-900">₺{totalStats.revenue.toLocaleString('tr-TR')}</h3>
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-blue-50 text-blue-600 rounded-lg text-xs font-bold">
                      <TrendingUp size={14} /> Genel Satış
                  </div>
              </div>
          </Card>
          <Card className="bg-white border border-slate-100 shadow-sm p-6 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
              <div className="relative z-10">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">KASA (TAHSİLAT)</p>
                  <h3 className="text-3xl font-black text-emerald-600">₺{totalStats.collected.toLocaleString('tr-TR')}</h3>
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-600 rounded-lg text-xs font-bold">
                      <Wallet size={14} /> Nakit & Kart
                  </div>
              </div>
          </Card>
          <Card className="bg-white border border-slate-100 shadow-sm p-6 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-red-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
              <div className="relative z-10">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">AÇIK HESAP</p>
                  <h3 className="text-3xl font-black text-red-500">₺{totalStats.debt.toLocaleString('tr-TR')}</h3>
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-red-50 text-red-500 rounded-lg text-xs font-bold">
                      <AlertCircle size={14} /> Bekleyen
                  </div>
              </div>
          </Card>
          <Card className="bg-white border border-slate-100 shadow-sm p-6 relative overflow-hidden group">
              <div className="absolute right-0 top-0 w-24 h-24 bg-purple-50 rounded-bl-[4rem] -mr-4 -mt-4 transition-all group-hover:scale-110"></div>
              <div className="relative z-10">
                  <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">TOPLAM BİLET</p>
                  <h3 className="text-3xl font-black text-purple-600">{totalStats.count}</h3>
                  <div className="mt-4 inline-flex items-center gap-2 px-3 py-1 bg-purple-50 text-purple-600 rounded-lg text-xs font-bold">
                      <Users size={14} /> Adet Satış
                  </div>
              </div>
          </Card>
      </div>

      {/* TOP 3 PERFORMERS */}
      {topPerformers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {topPerformers.map((staff, idx) => {
                  let colorClass = '';
                  let icon = null;
                  let title = '';
                  
                  if (idx === 0) {
                      colorClass = 'bg-yellow-50 border-yellow-200 text-yellow-700';
                      icon = <Crown size={32} className="text-yellow-500" />;
                      title = 'CİRO LİDERİ';
                  } else if (idx === 1) {
                      colorClass = 'bg-slate-100 border-slate-200 text-slate-700';
                      icon = <Medal size={32} className="text-slate-400" />;
                      title = '2. SIRADA';
                  } else {
                      colorClass = 'bg-orange-50 border-orange-200 text-orange-700';
                      icon = <Trophy size={32} className="text-orange-500" />;
                      title = '3. SIRADA';
                  }

                  return (
                      <div key={staff.id} className={`rounded-[2rem] p-6 border-2 flex items-center gap-5 relative overflow-hidden ${colorClass}`}>
                          <div className="bg-white p-4 rounded-full shadow-md shrink-0">
                              {icon}
                          </div>
                          <div className="flex-1 z-10">
                              <p className="text-[10px] font-black uppercase tracking-widest opacity-60 mb-1">{title}</p>
                              <h3 className="text-xl font-black">{staff.name}</h3>
                              <p className="text-sm font-bold opacity-80 mt-1">{staff.count} Bilet Satışı</p>
                              <div className="mt-3 text-2xl font-black tracking-tight">₺{staff.revenue.toLocaleString()}</div>
                          </div>
                          {/* Background Decoration */}
                          <div className="absolute -right-6 -bottom-6 opacity-10 transform rotate-12 scale-150">
                              {icon}
                          </div>
                      </div>
                  );
              })}
          </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* TABLO */}
          <div className="lg:col-span-2 bg-white rounded-[2rem] shadow-sm border border-slate-200 overflow-hidden flex flex-col">
              <div className="p-6 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
                  <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                    <FileBarChart size={20} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-sm">Personel Detay Tablosu</h3>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wide">TÜM SATIŞ HAREKETLERİ</p>
                  </div>
              </div>
              <div className="overflow-x-auto flex-1 custom-scrollbar">
                  <table className="w-full text-left border-collapse">
                      <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest border-b border-slate-100">
                          <tr>
                              <th className="p-5 font-black">Personel</th>
                              <th className="p-5 font-black text-center">Bilet Adedi</th>
                              <th className="p-5 font-black text-right">Toplam Ciro</th>
                              <th className="p-5 font-black text-right text-emerald-600">Tahsilat (Kasa)</th>
                              <th className="p-5 font-black text-right text-red-500">Açık Hesap</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 text-sm font-medium">
                          {staffPerformance.length === 0 ? (
                              <tr><td colSpan={5} className="p-12 text-center text-slate-400 font-bold">Henüz bu etkinlik için satış verisi yok.</td></tr>
                          ) : (
                              staffPerformance.map((p, idx) => (
                                  <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                      <td className="p-5 text-slate-900 flex items-center gap-4">
                                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-500 font-black text-xs shadow-sm group-hover:bg-blue-600 group-hover:text-white transition-all">
                                              {p.name.charAt(0)}
                                          </div>
                                          <div>
                                              <p className="font-bold">{p.name}</p>
                                              <p className="text-[10px] text-slate-400 font-bold uppercase">{p.role === 'admin' ? 'YÖNETİCİ' : 'PERSONEL'}</p>
                                          </div>
                                      </td>
                                      <td className="p-5 text-center">
                                          <span className="bg-slate-100 text-slate-700 px-3 py-1.5 rounded-lg font-bold text-xs">{p.count}</span>
                                      </td>
                                      <td className="p-5 text-right font-bold text-slate-700">₺{p.revenue.toLocaleString('tr-TR')}</td>
                                      <td className="p-5 text-right text-emerald-600 font-black bg-emerald-50/30">₺{p.collected.toLocaleString('tr-TR')}</td>
                                      <td className="p-5 text-right">
                                          {p.debt > 0 ? (
                                              <span className="text-red-500 font-black bg-red-50 px-3 py-1.5 rounded-lg text-xs">₺{p.debt.toLocaleString('tr-TR')}</span>
                                          ) : (
                                              <span className="text-slate-300 font-bold">-</span>
                                          )}
                                      </td>
                                  </tr>
                              ))
                          )}
                      </tbody>
                  </table>
              </div>
          </div>

          {/* GRAFİK */}
          <Card className="h-[500px] flex flex-col p-6 border border-slate-200">
              <h3 className="font-black text-slate-900 mb-2">Ciro Karşılaştırması</h3>
              <p className="text-xs text-slate-500 font-medium mb-6">Personellerin toplam satışa katkısı</p>
              
              {staffPerformance.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={staffPerformance} layout="vertical" margin={{ left: 0, right: 20 }}>
                          <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                          <XAxis type="number" hide />
                          <YAxis 
                              dataKey="name" 
                              type="category" 
                              tick={{ fill: '#64748b', fontSize: 11, fontWeight: 700 }} 
                              width={100} 
                              axisLine={false}
                              tickLine={false}
                          />
                          <Tooltip 
                              cursor={{fill: '#f8fafc'}}
                              contentStyle={{borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)'}}
                              formatter={(value: number) => [`₺${value.toLocaleString('tr-TR')}`, 'Toplam Ciro']}
                          />
                          <Bar dataKey="revenue" radius={[0, 6, 6, 0]} barSize={24}>
                              {staffPerformance.map((entry, index) => (
                                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                              ))}
                          </Bar>
                      </BarChart>
                  </ResponsiveContainer>
              ) : (
                  <div className="flex-1 flex flex-col items-center justify-center text-slate-300 gap-2">
                      <TrendingUp size={32} />
                      <span className="text-xs font-bold">Grafik verisi yok.</span>
                  </div>
              )}
          </Card>
      </div>
    </div>
  );
};
