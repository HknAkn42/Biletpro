
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Wallet, TrendingUp, TrendingDown, ArrowUpRight, ArrowDownRight, Building2, Calendar, Trash2, Plus, Lock, FileText, PieChart, Megaphone, Send } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';
import { Announcement } from '../types';

export const SaaSFinance: React.FC = () => {
  const { organizations, saasExpenses, addSaaSExpense, deleteSaaSExpense, user, saasTransactions, announcements, addAnnouncement, deleteAnnouncement } = useApp();
  
  // State for tabs
  const [activeTab, setActiveTab] = useState<'finance' | 'campaigns'>('finance');

  // State for expense form
  const [expenseForm, setExpenseForm] = useState({ title: '', amount: '', category: 'server' });

  // State for announcement form
  const [announcementForm, setAnnouncementForm] = useState({
      title: '',
      message: '',
      startDate: '',
      endDate: ''
  });

  // Erişim Kontrolü
  if (user?.role !== 'super_admin') {
      return (
          <div className="p-8 h-full flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 p-8 rounded-full mb-4"><Lock size={48} className="text-slate-400" /></div>
              <h2 className="text-2xl font-bold text-slate-800 uppercase italic">YETKİSİZ ALAN</h2>
          </div>
      );
  }

  // --- ACCOUNTING CALCULATIONS ---
  const totalInvoiced = saasTransactions.filter(t => t.type === 'invoice').reduce((acc, t) => acc + t.amount, 0);
  const totalRefunds = saasTransactions.filter(t => t.type === 'refund').reduce((acc, t) => acc + t.amount, 0);
  const totalOperatingExpenses = saasExpenses.reduce((acc, t) => acc + t.amount, 0);

  const totalRevenue = totalInvoiced; // Brüt Satışlar
  const totalExpense = totalOperatingExpenses + totalRefunds;
  const netProfit = totalRevenue - totalExpense;

  // Chart Data
  const chartData = [
      { name: 'Brüt Satış', value: totalRevenue, color: '#10b981' },
      { name: 'Gider & İade', value: totalExpense, color: '#ef4444' },
      { name: 'Net Kâr', value: netProfit, color: netProfit >= 0 ? '#3b82f6' : '#f43f5e' }
  ];

  const handleAddExpense = (e: React.FormEvent) => {
    e.preventDefault();
    if (!expenseForm.amount) return;
    addSaaSExpense({
        id: `exp-${Date.now()}`,
        title: expenseForm.title,
        amount: parseFloat(expenseForm.amount),
        category: expenseForm.category as any,
        date: new Date().toISOString()
    });
    setExpenseForm({ title: '', amount: '', category: 'server' });
  };

  const handleAddAnnouncement = (e: React.FormEvent) => {
      e.preventDefault();
      const newAnnouncement: Announcement = {
          id: `ann-${Date.now()}`,
          title: announcementForm.title,
          message: announcementForm.message,
          startDate: announcementForm.startDate,
          endDate: announcementForm.endDate,
          isActive: true,
          createdAt: new Date().toISOString()
      };
      addAnnouncement(newAnnouncement);
      setAnnouncementForm({ title: '', message: '', startDate: '', endDate: '' });
      alert('Kampanya başarıyla yayınlandı! Belirlenen tarihlerde müşterilere gösterilecektir.');
  };

  const formatDate = (dateStr: string) => {
      return new Date(dateStr).toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
  };

  const getOrgName = (orgId: string) => {
      const org = organizations.find(o => o.id === orgId);
      return org ? org.name : 'Bilinmeyen Müşteri';
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in max-w-[1600px] mx-auto">
        <div className="flex items-center justify-between border-b border-slate-200 pb-2">
            <div>
                <h1 className="text-3xl font-black text-slate-900 tracking-tight">Finans & Kampanyalar</h1>
                <p className="text-slate-500 font-bold">İşletme Yönetim Merkezi</p>
            </div>
            
            <div className="bg-slate-100 p-1 rounded-xl flex gap-1">
                <button 
                    onClick={() => setActiveTab('finance')}
                    className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'finance' ? 'bg-white shadow text-slate-900' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    FİNANSAL DURUM
                </button>
                <button 
                    onClick={() => setActiveTab('campaigns')}
                    className={`px-6 py-2 rounded-lg text-xs font-black transition-all ${activeTab === 'campaigns' ? 'bg-indigo-600 text-white shadow shadow-indigo-500/30' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    DUYURU & KAMPANYA
                </button>
            </div>
        </div>

        {activeTab === 'finance' ? (
            <div className="space-y-8 animate-in slide-in-from-left-4 fade-in duration-300">
                {/* TOP SUMMARY BAR */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <div className="bg-emerald-50 rounded-2xl p-6 border border-emerald-100 flex items-center justify-between">
                        <div>
                            <p className="text-emerald-800 text-xs font-black uppercase tracking-widest mb-1">TOPLAM SATIŞ (FATURA)</p>
                            <h3 className="text-3xl font-black text-emerald-600 tracking-tight">₺{totalRevenue.toLocaleString()}</h3>
                        </div>
                        <div className="bg-emerald-100 p-3 rounded-xl text-emerald-600"><ArrowUpRight size={24} /></div>
                    </div>
                    
                    <div className="bg-red-50 rounded-2xl p-6 border border-red-100 flex items-center justify-between">
                        <div>
                            <p className="text-red-800 text-xs font-black uppercase tracking-widest mb-1">GİDERLER & İADELER</p>
                            <h3 className="text-3xl font-black text-red-500 tracking-tight">₺{totalExpense.toLocaleString()}</h3>
                        </div>
                        <div className="bg-red-100 p-3 rounded-xl text-red-500"><ArrowDownRight size={24} /></div>
                    </div>

                    <div className={`rounded-2xl p-6 border flex items-center justify-between ${netProfit >= 0 ? 'bg-slate-900 text-white border-slate-800' : 'bg-red-600 text-white border-red-500'}`}>
                        <div>
                            <p className="text-slate-400 text-xs font-black uppercase tracking-widest mb-1">NET İŞLETME KÂRI</p>
                            <h3 className="text-3xl font-black tracking-tight">₺{netProfit.toLocaleString()}</h3>
                        </div>
                        <div className="bg-white/10 p-3 rounded-xl text-white"><Wallet size={24} /></div>
                    </div>
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* SOL KOLON: GİDER GİRİŞİ & GRAFİK */}
                    <div className="lg:col-span-1 space-y-6">
                        <Card className="p-6 border-slate-200 bg-white">
                            <h3 className="text-lg font-black text-slate-900 mb-6 flex items-center gap-2">
                                <TrendingDown className="text-red-500" /> Şirket Gideri Ekle
                            </h3>
                            <form onSubmit={handleAddExpense} className="space-y-4">
                                <Input label="AÇIKLAMA" value={expenseForm.title} onChange={e => setExpenseForm({...expenseForm, title: e.target.value})} placeholder="Örn: Aylık Sunucu Kirası" required />
                                <div className="grid grid-cols-2 gap-4">
                                    <Input label="TUTAR (TL)" type="number" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} required />
                                    <div>
                                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 mb-1.5 block">Kategori</label>
                                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 px-3 text-xs font-bold text-slate-700 outline-none" value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                                            <option value="server">Altyapı / Sunucu</option>
                                            <option value="marketing">Reklam / Marketing</option>
                                            <option value="staff">Personel Gideri</option>
                                            <option value="other">Genel Giderler</option>
                                        </select>
                                    </div>
                                </div>
                                <Button type="submit" variant="danger" className="w-full font-black h-12 shadow-lg shadow-red-500/20">
                                    <Plus size={18} className="mr-2" /> GİDERİ İŞLE
                                </Button>
                            </form>
                        </Card>

                        <Card className="p-6 border-slate-200 bg-white h-64">
                            <h3 className="text-sm font-bold text-slate-500 uppercase tracking-wider mb-4">Finansal Denge</h3>
                            <ResponsiveContainer width="100%" height="100%">
                                <BarChart data={chartData} margin={{top: 10, right: 0, left: -20, bottom: 0}}>
                                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                                    <XAxis dataKey="name" tick={{fontSize: 10, fontWeight: 700}} axisLine={false} tickLine={false} />
                                    <YAxis tick={{fontSize: 10}} axisLine={false} tickLine={false} />
                                    <Tooltip cursor={{fill: 'transparent'}} />
                                    <Bar dataKey="value" radius={[4, 4, 0, 0]} barSize={40}>
                                        {chartData.map((entry, index) => (
                                            <Cell key={`cell-${index}`} fill={entry.color} />
                                        ))}
                                    </Bar>
                                </BarChart>
                            </ResponsiveContainer>
                        </Card>
                    </div>

                    {/* SAĞ KOLON: BİRLEŞTİRİLMİŞ LEDGER */}
                    <div className="lg:col-span-2">
                        <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden h-full flex flex-col">
                            <div className="px-8 py-5 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                                <div className="flex gap-4">
                                    <button className="text-sm font-black text-slate-900 border-b-2 border-slate-900 pb-5 -mb-5">Tüm Hareketler</button>
                                </div>
                                <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                                    Kayıtlar
                                </div>
                            </div>
                            
                            <div className="overflow-x-auto flex-1 bg-white">
                                <table className="w-full text-left border-collapse">
                                    <thead>
                                        <tr className="bg-white border-b border-slate-100 sticky top-0">
                                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/4">Tarih</th>
                                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest w-1/3">Açıklama / Kaynak</th>
                                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Tür</th>
                                            <th className="p-5 text-[10px] font-black text-slate-400 uppercase tracking-widest text-right">Tutar</th>
                                            <th className="p-5 w-10"></th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {/* Combine and Sort Data */}
                                        {[
                                            // Müşteri İşlemleri
                                            ...saasTransactions.map(t => ({
                                                ...t, 
                                                name: `${getOrgName(t.organizationId)} - ${t.description}`, 
                                                rawDate: new Date(t.date).getTime(),
                                                displayType: t.type === 'invoice' ? 'GELİR (SATIŞ)' : t.type === 'refund' ? 'GİDER (İADE)' : 'TAHSİLAT',
                                                isIncome: t.type === 'invoice',
                                                isExpense: t.type === 'refund',
                                                category: 'Müşteri İşlemi'
                                            })),
                                            // Şirket Giderleri
                                            ...saasExpenses.map(e => ({
                                                ...e, 
                                                name: e.title, 
                                                rawDate: new Date(e.date).getTime(), 
                                                displayType: 'GİDER',
                                                isIncome: false,
                                                isExpense: true,
                                                type: 'expense'
                                            }))
                                        ]
                                        .sort((a, b) => b.rawDate - a.rawDate)
                                        .map((item: any) => (
                                            <tr key={item.id} className="hover:bg-slate-50/80 transition-colors group">
                                                <td className="p-5">
                                                    <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                                        <Calendar size={14} className="text-slate-300" />
                                                        {formatDate(item.date)}
                                                    </div>
                                                </td>
                                                <td className="p-5">
                                                    <p className="font-bold text-slate-900 text-sm">{item.name}</p>
                                                    <p className="text-[10px] text-slate-400 uppercase font-bold mt-0.5">{item.category}</p>
                                                </td>
                                                <td className="p-5 text-center">
                                                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase tracking-wider ${
                                                        item.isIncome ? 'bg-emerald-50 text-emerald-600' : item.isExpense ? 'bg-red-50 text-red-600' : 'bg-blue-50 text-blue-600'
                                                    }`}>
                                                        {item.displayType}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-right">
                                                    <span className={`font-black text-lg ${item.isIncome ? 'text-emerald-600' : item.isExpense ? 'text-red-500' : 'text-blue-500'}`}>
                                                        {item.isIncome ? '+' : item.isExpense ? '-' : ''}₺{item.amount.toLocaleString()}
                                                    </span>
                                                </td>
                                                <td className="p-5 text-center">
                                                    {item.type === 'expense' && (
                                                        <button onClick={() => deleteSaaSExpense(item.id)} className="text-slate-300 hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100">
                                                            <Trash2 size={16} />
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-in slide-in-from-right-4 fade-in duration-300">
                {/* SOL KOLON: DUYURU OLUŞTURMA */}
                <Card className="lg:col-span-1 p-8 h-fit border-indigo-100 bg-white">
                    <div className="flex items-center gap-3 mb-6">
                        <div className="bg-indigo-100 p-3 rounded-xl text-indigo-600">
                            <Megaphone size={24} />
                        </div>
                        <div>
                            <h3 className="text-lg font-black text-slate-900">Kampanya Oluştur</h3>
                            <p className="text-xs text-slate-500 font-bold">Müşteri paneline bildirim gönder</p>
                        </div>
                    </div>

                    <form onSubmit={handleAddAnnouncement} className="space-y-4">
                        <Input label="KAMPANYA BAŞLIĞI" required value={announcementForm.title} onChange={e => setAnnouncementForm({...announcementForm, title: e.target.value})} placeholder="Örn: %30 Yıl Sonu İndirimi" />
                        <div className="space-y-1.5">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Mesaj İçeriği</label>
                            <textarea 
                                required
                                rows={4}
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-slate-800 font-semibold text-sm outline-none focus:border-indigo-500 transition-all resize-none"
                                placeholder="Duyuru detaylarını buraya yazınız..."
                                value={announcementForm.message}
                                onChange={e => setAnnouncementForm({...announcementForm, message: e.target.value})}
                            />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                             <Input label="BAŞLANGIÇ" type="date" required value={announcementForm.startDate} onChange={e => setAnnouncementForm({...announcementForm, startDate: e.target.value})} />
                             <Input label="BİTİŞ" type="date" required value={announcementForm.endDate} onChange={e => setAnnouncementForm({...announcementForm, endDate: e.target.value})} />
                        </div>
                        <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-14 rounded-xl font-black shadow-lg shadow-indigo-500/30">
                            <Send size={18} className="mr-2" /> YAYINLA
                        </Button>
                    </form>
                </Card>

                {/* SAĞ KOLON: AKTİF DUYURULAR */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4 px-2">
                        <h3 className="font-black text-slate-700">Aktif & Planlanmış Duyurular</h3>
                    </div>
                    
                    <div className="space-y-4">
                        {announcements.length === 0 ? (
                            <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-12 text-center text-slate-400">
                                <Megaphone size={48} className="mx-auto mb-4 opacity-20" />
                                <p className="font-bold">Henüz yayınlanmış bir duyuru yok.</p>
                            </div>
                        ) : (
                            announcements.map(ann => (
                                <div key={ann.id} className="bg-white p-6 rounded-2xl border border-slate-100 shadow-sm flex flex-col md:flex-row gap-6 relative group hover:shadow-md transition-all">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className={`px-2 py-0.5 rounded text-[10px] font-black uppercase tracking-wider ${ann.isActive ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-500'}`}>
                                                {ann.isActive ? 'AKTİF' : 'PASİF'}
                                            </span>
                                            <span className="text-xs font-bold text-slate-400 flex items-center gap-1">
                                                <Calendar size={12} /> {formatDate(ann.startDate)} - {formatDate(ann.endDate)}
                                            </span>
                                        </div>
                                        <h4 className="text-xl font-black text-slate-900 mb-2">{ann.title}</h4>
                                        <p className="text-sm text-slate-600 leading-relaxed bg-slate-50 p-3 rounded-lg border border-slate-100">{ann.message}</p>
                                    </div>
                                    <div className="flex flex-col justify-center gap-2 border-l border-slate-100 pl-6 border-0 md:border-l">
                                        <button 
                                            onClick={() => { if(confirm('Bu duyuruyu silmek istediğinize emin misiniz?')) deleteAnnouncement(ann.id); }}
                                            className="p-3 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all font-bold text-xs flex items-center justify-center gap-2"
                                        >
                                            <Trash2 size={16} /> SİL
                                        </button>
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        )}
    </div>
  );
};
