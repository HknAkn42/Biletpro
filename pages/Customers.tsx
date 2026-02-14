
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Modal } from '../components/ui/Modal';
import { Search, Download, User, Eye, History, Clock, FileText, UserCheck, Share2, Ticket } from 'lucide-react';
import { Sale } from '../types';

export const Customers: React.FC = () => {
  const { sales, tables, currentEvent, user } = useApp();

  const [filter, setFilter] = useState<'all' | 'debt' | 'paid'>('all');
  const [search, setSearch] = useState('');
  
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<Sale | null>(null);

  if (!user?.permissions.includes('VIEW_CUSTOMERS')) {
      return (
          <div className="p-8 h-full flex flex-col items-center justify-center text-center">
              <div className="bg-slate-100 p-8 rounded-full mb-4"><User size={48} className="text-slate-400" /></div>
              <h2 className="text-2xl font-bold text-slate-800 uppercase italic">Erişim Yetkisi Yok</h2>
          </div>
      );
  }

  // CRITICAL FIX: Sadece mevcut etkinliğe (currentEvent.id) ait satışları filtrele.
  const eventSales = sales.filter(sale => sale.eventId === currentEvent.id);

  const filteredSales = eventSales.filter(sale => {
    const matchesSearch = 
        sale.customerName.toLowerCase().includes(search.toLowerCase()) || 
        sale.customerPhone.includes(search) ||
        sale.qrCode.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filter === 'debt') return sale.remainingDebt > 0;
    if (filter === 'paid') return sale.remainingDebt === 0;
    return true;
  });

  const getTableNumber = (tableId: string) => tables.find(t => t.id === tableId)?.number || '??';
  const getTableCapacity = (tableId: string) => tables.find(t => t.id === tableId)?.capacity || '?';

  const openDetail = (sale: Sale) => {
      setSelectedCustomer(sale);
      setIsDetailModalOpen(true);
  };

  const formatDate = (dateStr: string) => {
    if(!dateStr) return '';
    return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleWhatsAppShare = () => {
    if (!selectedCustomer) return;
    
    const tableName = getTableNumber(selectedCustomer.tableId);
    const capacity = getTableCapacity(selectedCustomer.tableId);
    const locationLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentEvent.venue + ' ' + currentEvent.location)}`;
    const formattedDate = formatDate(currentEvent.date);

    const debtText = selectedCustomer.remainingDebt > 0 
      ? `🔴 *Ödeme Hatırlatması:* Girişte ödenmesi gereken tutar *₺${selectedCustomer.remainingDebt}*'dir. Hızlı giriş için hazırlıklı olmanızı rica ederiz.` 
      : `🟢 *Ödeme Durumu:* Biletinizin ödemesi tamamlanmıştır. Girişte ekstra bir işlem yapmanıza gerek yoktur.`;

    // WhatsApp Mesaj Şablonu - Premium & Kişiselleştirilmiş (Sales.tsx ile AYNI)
    const message = `✨ *SAYIN ${selectedCustomer.customerName.toUpperCase()}*, SİZİ BEKLİYORUZ! ✨

Özel davetiniz ve biletiniz oluşturulmuştur. Harika bir gece geçirmeye hazır mısınız? 🥂

🎫 *ETKİNLİK DETAYLARI*
━━━━━━━━━━━━━━━━━━━━
🎪 *Etkinlik:* ${currentEvent.name}
📅 *Tarih:* ${formattedDate}
⏰ *Kapı Açılış:* ${currentEvent.time}
📍 *Konum:* ${currentEvent.venue}, ${currentEvent.location}
🗺️ *Harita:* ${locationLink}

🪑 *REZERVASYON BİLGİLERİ*
━━━━━━━━━━━━━━━━━━━━
Masa No: *${tableName}*
Kişi Sayısı: *${capacity} Kişilik*
Bilet Kodu: *${selectedCustomer.qrCode}*

${debtText}

💡 *MİSAFİR NOTU:* 
Giriş işlemlerinizin hızlı yapılabilmesi için lütfen QR kodunuzu veya bu mesajı kapıdaki görevli arkadaşlarımıza gösteriniz.

Şimdiden iyi eğlenceler dileriz! 🎉
*${currentEvent.organizer || currentEvent.name + ' Ekibi'}*`;

    const phone = selectedCustomer.customerPhone ? selectedCustomer.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone.length >= 10 
        ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
        
    window.open(url, '_blank');
  };

  return (
    <div className="p-8 space-y-6 animate-in fade-in duration-500 h-full flex flex-col max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic uppercase">Müşteri Dosyaları</h1>
          <p className="text-slate-500 font-bold">{currentEvent.name} - Finansal Takip</p>
        </div>
        <div className="flex gap-2">
            <Button variant="outline" className="rounded-2xl border-slate-200 h-12 font-black">
                <Download size={18} className="mr-2" /> EXCEL AKTAR
            </Button>
        </div>
      </div>

      <Card className="p-3 flex flex-col md:flex-row gap-4 items-center bg-white shadow-xl rounded-[2rem] border-slate-100">
        <div className="relative flex-1 w-full">
            <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
                type="text" 
                placeholder="Müşteri adı veya bilet no ile ara..." 
                className="w-full pl-14 pr-4 py-4 bg-slate-50 border-none rounded-2xl focus:ring-2 focus:ring-blue-500 font-bold text-slate-900"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
            />
        </div>
        <div className="flex gap-2 px-2">
            <button onClick={() => setFilter('all')} className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${filter === 'all' ? 'bg-slate-900 text-white' : 'text-slate-400 hover:bg-slate-100'}`}>TÜMÜ</button>
            <button onClick={() => setFilter('debt')} className={`px-6 py-3 rounded-xl text-xs font-black transition-all ${filter === 'debt' ? 'bg-red-600 text-white shadow-lg shadow-red-500/30' : 'text-red-500 hover:bg-red-50'}`}>BORÇLULAR</button>
        </div>
      </Card>

      <div className="flex-1 bg-white rounded-[2.5rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col">
          <div className="overflow-auto flex-1 custom-scrollbar">
              <table className="w-full text-left">
                  <thead className="bg-slate-50">
                      <tr>
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Müşteri / İletişim</th>
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest text-center">Masa</th>
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Finansal Durum</th>
                          <th className="p-6 text-[10px] font-black text-slate-400 uppercase tracking-widest">Giriş</th>
                          <th className="p-6 text-right"></th>
                      </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                      {filteredSales.map(sale => (
                          <tr key={sale.id} className="hover:bg-slate-50/50 transition-all group">
                              <td className="p-6">
                                  <div className="flex items-center gap-4">
                                      <div className="w-12 h-12 bg-slate-100 rounded-2xl flex items-center justify-center font-black text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-all">
                                          {sale.customerName.charAt(0)}
                                      </div>
                                      <div>
                                          <p className="font-black text-slate-900 text-base">{sale.customerName}</p>
                                          <p className="text-xs text-slate-400 font-bold">{sale.customerPhone}</p>
                                      </div>
                                  </div>
                              </td>
                              <td className="p-6 text-center">
                                  <span className="bg-slate-900 text-white px-4 py-2 rounded-xl font-black text-xs italic">
                                      {getTableNumber(sale.tableId)}
                                  </span>
                              </td>
                              <td className="p-6">
                                  <div className="flex flex-col">
                                      {sale.remainingDebt > 0 ? (
                                          <span className="text-red-600 font-black text-sm italic animate-pulse">
                                              ₺{sale.remainingDebt} BAKİYE VAR
                                          </span>
                                      ) : (
                                          <span className="text-emerald-500 font-black text-sm">TAMAMI ÖDENDİ</span>
                                      )}
                                      <span className="text-[10px] text-slate-400 font-bold uppercase">Toplam: ₺{sale.finalAmount}</span>
                                  </div>
                              </td>
                              <td className="p-6">
                                  {sale.ticketUsed ? (
                                      <div className="flex items-center gap-2 text-emerald-600 font-black text-xs">
                                          <UserCheck size={14} /> GİRDİ ({sale.peopleEntered} Kişi)
                                      </div>
                                  ) : (
                                      <span className="text-slate-300 font-black text-xs">BEKLİYOR</span>
                                  )}
                              </td>
                              <td className="p-6 text-right">
                                  <Button onClick={() => openDetail(sale)} variant="ghost" className="rounded-xl h-10 w-10 p-0 hover:bg-blue-50 hover:text-blue-600">
                                      <Eye size={18} />
                                  </Button>
                              </td>
                          </tr>
                      ))}
                  </tbody>
              </table>
          </div>
      </div>

      {/* DETAY MODAL */}
      <Modal isOpen={isDetailModalOpen} onClose={() => setIsDetailModalOpen(false)} title="Müşteri Detay Kartı">
          {selectedCustomer && (
              <div className="space-y-8">
                  {/* Özet Kartı */}
                  <div className="bg-slate-900 text-white p-8 rounded-[2rem] relative overflow-hidden shadow-2xl">
                      <div className="relative z-10">
                          <h4 className="text-3xl font-black mb-1 italic">{selectedCustomer.customerName}</h4>
                          <p className="text-blue-400 font-black text-xs tracking-widest uppercase">MASA {getTableNumber(selectedCustomer.tableId)} • {selectedCustomer.qrCode}</p>
                          
                          <div className="mt-8 grid grid-cols-2 gap-6">
                              <div className="bg-white/10 p-4 rounded-2xl">
                                  <p className="text-[10px] opacity-60 font-black uppercase mb-1">Ödenen</p>
                                  <p className="text-xl font-black">₺{selectedCustomer.paidAmount}</p>
                              </div>
                              <div className={`p-4 rounded-2xl ${selectedCustomer.remainingDebt > 0 ? 'bg-red-500/20 text-red-400' : 'bg-emerald-500/20 text-emerald-400'}`}>
                                  <p className="text-[10px] opacity-60 font-black uppercase mb-1">Kalan Borç</p>
                                  <p className="text-xl font-black">₺{selectedCustomer.remainingDebt}</p>
                              </div>
                          </div>
                      </div>
                      <User size={120} className="absolute -bottom-8 -right-8 opacity-5" />
                  </div>
                  
                  {/* WhatsApp Paylaş Butonu */}
                  <Button 
                    onClick={handleWhatsAppShare} 
                    className="w-full h-14 rounded-2xl bg-[#25D366] hover:bg-[#20bd5a] text-white font-black shadow-lg shadow-green-500/20 flex items-center justify-center gap-2 border-none"
                  >
                    <Share2 size={20} />
                    WHATSAPP BİLET GÖNDER
                  </Button>

                  {/* Tarihçe */}
                  <div className="space-y-4">
                      <div className="flex items-center gap-2 text-slate-400 font-black text-[10px] uppercase tracking-widest ml-1">
                          <History size={14} /> İşlem Geçmişi
                      </div>
                      <div className="space-y-3">
                          {selectedCustomer.history?.map((log, idx) => (
                              <div key={log.id || idx} className="bg-slate-50 p-5 rounded-2xl border border-slate-100 flex items-start gap-4 transition-all hover:border-slate-300">
                                  <div className="w-10 h-10 bg-white rounded-xl shadow-sm flex items-center justify-center text-slate-400 font-black text-xs shrink-0">
                                      {idx + 1}
                                  </div>
                                  <div className="flex-1">
                                      <div className="flex justify-between items-start mb-1">
                                          <p className="font-black text-slate-900 text-sm uppercase italic">{log.action}</p>
                                          <span className="text-[10px] text-slate-400 font-bold">{new Date(log.date).toLocaleString('tr-TR')}</span>
                                      </div>
                                      <p className="text-xs text-slate-600 font-bold mb-2 leading-relaxed">{log.details}</p>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>
              </div>
          )}
      </Modal>
    </div>
  );
};
