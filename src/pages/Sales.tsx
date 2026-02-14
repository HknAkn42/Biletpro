import React, { useState, useMemo, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { User, DollarSign, Users, Phone, Printer, QrCode, Lock, Percent, Tag, Ticket, ChevronRight, Calculator, CreditCard, Banknote, RefreshCcw, Search, X, Calendar, MapPin, Share2, Clock, Crown, Sparkles, LayoutGrid, List, Filter } from 'lucide-react';
import QRCode from 'qrcode';
import { Table, Sale } from '../types';

export const Sales: React.FC = () => {
  const { tables, sales, currentEvent, user, addSale, updateSaleAndTable, collectDebtAndApprove } = useApp();
  
  // -- STATE --
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [activeSale, setActiveSale] = useState<Sale | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  
  // View States
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [statusFilter, setStatusFilter] = useState<'all' | 'available' | 'sold'>('all');

  // Mobile View State (Tab control for small screens)
  const [mobileTab, setMobileTab] = useState<'form' | 'map'>('map');
  
  // Form State
  const [form, setForm] = useState({
    name: '',
    phone: '',
    pax: 1, 
    discountType: 'amount' as 'amount' | 'percentage',
    discountValue: '',
    cash: '',
    card: '',
    note: ''
  });

  const [ticketModalOpen, setTicketModalOpen] = useState(false);
  const [lastSale, setLastSale] = useState<Sale | null>(null);

  // -- FILTER DATA --
  const eventTables = useMemo(() => {
    let t = tables.filter(tbl => tbl.eventId === currentEvent.id);
    
    // Status Filter
    if (statusFilter !== 'all') {
        t = t.filter(tbl => tbl.status === (statusFilter === 'available' ? 'available' : 'sold'));
    }

    // Search
    if (searchTerm) {
        t = t.filter(tbl => tbl.number.toLowerCase().includes(searchTerm.toLowerCase()));
    }

    return t.sort((a, b) => {
        if (a.status === 'sold' && b.status !== 'sold') return 1;
        if (a.status !== 'sold' && b.status === 'sold') return -1;
        return a.number.localeCompare(b.number, undefined, { numeric: true });
    });
  }, [tables, currentEvent.id, searchTerm, statusFilter]);

  const eventSales = useMemo(() => sales.filter(s => s.eventId === currentEvent.id), [sales, currentEvent.id]);

  // -- CALCULATIONS --
  const getCategory = (catId: string) => currentEvent.categories.find(c => c.id === catId);
  
  const priceCalculation = useMemo(() => {
    if (!selectedTable) return { base: 0, discount: 0, final: 0, debt: 0 };

    const catPrice = getCategory(selectedTable.categoryId)?.pricePerPerson || 0;
    const baseTotal = catPrice * (form.pax || 0);
    
    let discountAmount = 0;
    const discountVal = parseFloat(form.discountValue) || 0;
    
    if (form.discountType === 'percentage') {
        discountAmount = (baseTotal * discountVal) / 100;
    } else {
        discountAmount = discountVal;
    }

    const finalTotal = Math.max(0, baseTotal - discountAmount);
    const paid = (parseFloat(form.cash) || 0) + (parseFloat(form.card) || 0);
    const remaining = Math.max(0, finalTotal - paid);

    return {
        unitPrice: catPrice,
        base: baseTotal,
        discount: discountAmount,
        final: finalTotal,
        paidTotal: paid,
        debt: remaining
    };
  }, [selectedTable, form, currentEvent.categories]);

  // -- HANDLERS --

  const handleTableSelect = (table: Table) => {
    setSelectedTable(table);
    const existingSale = eventSales.find(s => s.tableId === table.id && table.status === 'sold');

    if (existingSale) {
        setActiveSale(existingSale);
        setForm({
            name: existingSale.customerName,
            phone: existingSale.customerPhone,
            pax: existingSale.peopleEntered > 0 ? existingSale.peopleEntered : (table.capacity),
            discountType: existingSale.discountType || 'amount',
            discountValue: existingSale.discountValue?.toString() || '',
            cash: '',
            card: '',
            note: existingSale.salesNote || ''
        });
    } else {
        setActiveSale(null);
        setForm({
            name: '',
            phone: '',
            pax: table.capacity,
            discountType: 'amount',
            discountValue: '',
            cash: '',
            card: '',
            note: ''
        });
    }
    setMobileTab('form'); // Mobilde seçim yapınca forma geç
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTable || !user) return;

    if (activeSale) {
        collectDebtAndApprove(activeSale.id, 0); 
        alert('Tahsilat Güncellendi');
        return;
    }

    const newSale: Sale = {
      id: `sale-${Date.now()}`,
      eventId: currentEvent.id,
      tableId: selectedTable.id,
      soldBy: user.id,
      customerName: form.name,
      customerPhone: form.phone,
      originalAmount: priceCalculation.base,
      discountType: form.discountType,
      discountValue: parseFloat(form.discountValue) || 0,
      finalAmount: priceCalculation.final,
      totalAmount: priceCalculation.final,
      paidAmount: priceCalculation.paidTotal,
      remainingDebt: parseFloat(priceCalculation.debt.toFixed(2)),
      paymentStatus: priceCalculation.debt <= 0.01 ? 'full' : priceCalculation.paidTotal === 0 ? 'unpaid' : 'partial',
      qrCode: `QR-${Math.random().toString(36).substr(2,8).toUpperCase()}`,
      ticketUsed: false,
      peopleEntered: 0,
      salesNote: form.note,
      createdAt: new Date().toISOString(),
      history: []
    };

    addSale(newSale);
    setLastSale(newSale);
    setTicketModalOpen(true);
    resetForm();
  };

  const formatDate = (dateStr: string) => {
      if(!dateStr) return '';
      return new Date(dateStr).toLocaleDateString('tr-TR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  };

  const handleWhatsAppShare = async () => {
    if (!lastSale) return;
    const table = eventTables.find(t => t.id === lastSale.tableId);
    const tableName = table?.number || 'Belirtilmemiş';
    const capacity = table?.capacity || form.pax;
    const locationLink = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(currentEvent.venue + ' ' + currentEvent.location)}`;
    const formattedDate = formatDate(currentEvent.date);

    const debtText = lastSale.remainingDebt > 0 
      ? `🔴 *Ödeme Hatırlatması:* Girişte ödenmesi gereken tutar *₺${lastSale.remainingDebt}*'dir. Hızlı giriş için hazırlıklı olmanızı rica ederiz.` 
      : `🟢 *Ödeme Durumu:* Biletinizin ödemesi tamamlanmıştır. Girişte ekstra bir işlem yapmanıza gerek yoktur.`;

    // WhatsApp için QR kod içeren mesaj oluştur
    const qrCodeUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(lastSale.qrCode)}`;
    
    const message = `✨ *SAYIN ${lastSale.customerName.toUpperCase()}*, SİZİ BEKLİYORUZ! ✨

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
Bilet Kodu: *${lastSale.qrCode}*

${debtText}

📱 *QR KOD GÖRÜNTÜLEME:*
${qrCodeUrl}

💡 *MİSAFİR NOTU:* 
Yukarıdaki linke tıklayarak QR kodunuzu büyütebilir veya bu mesajı kapıdaki görevli arkadaşlarımıza gösterebilirsiniz.

Şimdiden iyi eğlenceler dileriz! 🎉
*${currentEvent.organizer || currentEvent.name + ' Ekibi'}*`;

    const phone = lastSale.customerPhone ? lastSale.customerPhone.replace(/[^0-9]/g, '') : '';
    const url = phone.length >= 10 
        ? `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
        : `https://wa.me/?text=${encodeURIComponent(message)}`;
        
    window.open(url, '_blank');
  };

  const resetForm = () => {
      setSelectedTable(null);
      setActiveSale(null);
      setForm({...form, name: '', phone: '', cash: '', card: '', discountValue: ''});
      setMobileTab('map');
  };

  return (
    <div className="flex flex-col md:flex-row h-[calc(100vh-64px)] overflow-hidden bg-slate-50 relative">
      
      {/* MOBILE TAB SWITCHER */}
      <div className="md:hidden flex border-b border-slate-200 bg-white shrink-0">
          <button 
            onClick={() => setMobileTab('map')}
            className={`flex-1 py-3 text-sm font-black flex items-center justify-center gap-2 ${mobileTab === 'map' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
          >
            <LayoutGrid size={16} /> MASA PLANI
          </button>
          <button 
            onClick={() => setMobileTab('form')}
            className={`flex-1 py-3 text-sm font-black flex items-center justify-center gap-2 ${mobileTab === 'form' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-slate-400'}`}
          >
            <Calculator size={16} /> TERMİNAL
            {selectedTable && <span className="bg-red-500 text-white text-[9px] px-1.5 rounded-full animate-pulse">!</span>}
          </button>
      </div>

      {/* SOL PANEL - İŞLEM MERKEZİ (FORM) */}
      <div className={`
        w-full md:w-[400px] lg:w-[450px] bg-white border-r border-slate-200 flex flex-col shadow-2xl z-20 shrink-0 h-full overflow-y-auto custom-scrollbar
        absolute md:relative top-0 left-0 transition-transform duration-300
        ${mobileTab === 'form' ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <div className="p-6 border-b border-slate-100 bg-slate-50/50">
            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                <Calculator className="text-blue-600" />
                {activeSale ? 'Satış Detayı' : 'Satış Terminali'}
            </h2>
            <p className="text-xs text-slate-500 font-bold mt-1">
                {selectedTable ? `Seçili: ${selectedTable.number}` : 'Lütfen sağdan masa seçin'}
            </p>
        </div>

        {selectedTable ? (
            <form onSubmit={handleSubmit} className="flex-1 p-6 space-y-6 pb-24 md:pb-6">
                <div className="space-y-4">
                    <div className="bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                        <div className="flex justify-between items-center mb-2">
                            <span className="text-[10px] font-black uppercase text-blue-400 tracking-widest">Masa Bilgisi</span>
                            {activeSale && <span className="bg-red-500 text-white text-[9px] font-bold px-2 py-0.5 rounded">SATILDI</span>}
                        </div>
                        <div className="flex justify-between items-end">
                            <h3 className="text-2xl font-black text-slate-900">{selectedTable.number}</h3>
                            <div className="text-right">
                                <p className="text-xs font-bold text-slate-500">{getCategory(selectedTable.categoryId)?.name}</p>
                                <p className="text-sm font-black text-blue-600">₺{getCategory(selectedTable.categoryId)?.pricePerPerson} / Kişi</p>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 gap-4">
                        <Input 
                            label="MÜŞTERİ ADI" 
                            icon={User} 
                            value={form.name} 
                            onChange={e => setForm({...form, name: e.target.value})} 
                            disabled={!!activeSale} 
                            required 
                            placeholder="Ad Soyad Giriniz"
                            maxLength={40}
                        />
                        <div className="grid grid-cols-2 gap-4">
                             <Input 
                                label="TELEFON" 
                                icon={Phone} 
                                value={form.phone} 
                                onChange={e => setForm({...form, phone: e.target.value})}
                                disabled={!!activeSale}
                                placeholder="5XX..."
                                maxLength={15}
                             />
                             <Input 
                                label="KİŞİ SAYISI" 
                                type="number" 
                                icon={Users} 
                                value={form.pax} 
                                onChange={e => setForm({...form, pax: parseInt(e.target.value) || 0})}
                                disabled={!!activeSale} 
                             />
                        </div>
                    </div>
                </div>

                <hr className="border-dashed border-slate-200" />

                <div className="space-y-4">
                    <div className="flex items-end gap-2">
                        <div className="flex-1">
                            <Input label="İNDİRİM TUTARI" type="number" icon={Tag} value={form.discountValue} onChange={e => setForm({...form, discountValue: e.target.value})} placeholder="0" disabled={!!activeSale} />
                        </div>
                        <div className="bg-slate-100 p-1 rounded-xl flex mb-1">
                            <button type="button" onClick={() => setForm({...form, discountType: 'amount'})} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${form.discountType === 'amount' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}>TL</button>
                            <button type="button" onClick={() => setForm({...form, discountType: 'percentage'})} className={`px-3 py-2 rounded-lg text-xs font-bold transition-all ${form.discountType === 'percentage' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}>%</button>
                        </div>
                    </div>

                    <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-lg">
                        <div className="flex justify-between text-xs font-medium text-slate-400 mb-1">
                            <span>Ara Toplam ({form.pax} Kişi)</span>
                            <span>₺{priceCalculation.base.toFixed(2)}</span>
                        </div>
                        {priceCalculation.discount > 0 && (
                            <div className="flex justify-between text-xs font-medium text-emerald-400 mb-2">
                                <span>İndirim</span>
                                <span>-₺{priceCalculation.discount.toFixed(2)}</span>
                            </div>
                        )}
                        <div className="pt-2 border-t border-white/10 flex justify-between items-end">
                            <span className="text-sm font-bold uppercase tracking-wider">Genel Toplam</span>
                            <span className="text-3xl font-black tracking-tighter">₺{priceCalculation.final.toFixed(2)}</span>
                        </div>
                        {activeSale && (
                            <div className="mt-2 pt-2 border-t border-white/10 flex justify-between text-xs text-orange-300">
                                <span>Kalan Borç</span>
                                <span className="font-bold">₺{activeSale.remainingDebt.toFixed(2)}</span>
                            </div>
                        )}
                    </div>
                </div>

                <div className="space-y-3">
                    <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Ödeme Al</label>
                    <div className="grid grid-cols-2 gap-4">
                        <div className="relative">
                            <Banknote className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" placeholder="Nakit" value={form.cash} onChange={e => setForm({...form, cash: e.target.value})} />
                        </div>
                        <div className="relative">
                            <CreditCard className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="number" className="w-full bg-slate-50 border border-slate-200 rounded-xl py-3 pl-11 pr-4 font-bold text-slate-900 outline-none focus:border-blue-500 transition-all" placeholder="Kredi Kartı" value={form.card} onChange={e => setForm({...form, card: e.target.value})} />
                        </div>
                    </div>
                    {priceCalculation.debt > 0 && (
                        <p className="text-right text-xs font-bold text-red-500">Kalan Bakiye (Borç): ₺{priceCalculation.debt.toFixed(2)}</p>
                    )}
                </div>
                
                <div className="pt-4 flex gap-3">
                    <Button type="button" variant="ghost" className="flex-1 rounded-xl font-bold bg-slate-100 text-slate-500" onClick={resetForm}>İPTAL</Button>
                    <Button type="submit" className="flex-[2] rounded-xl font-black h-12 shadow-xl shadow-blue-500/20">{activeSale ? 'TAHSİLAT EKLE' : 'SATIŞI ONAYLA'}</Button>
                </div>
            </form>
        ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-center p-8 opacity-50">
                <Ticket size={64} className="text-slate-300 mb-4" />
                <h3 className="text-lg font-bold text-slate-700">Masa Seçimi Bekleniyor</h3>
                <p className="text-sm text-slate-400 mt-2">İşlem yapmak için sağ taraftaki listeden bir masa seçin.</p>
                <button onClick={() => setMobileTab('map')} className="mt-4 px-4 py-2 bg-blue-100 text-blue-600 rounded-lg text-xs font-bold md:hidden">LİSTEYE GİT</button>
            </div>
        )}
      </div>

      {/* SAĞ PANEL - MASA IZGARASI / LİSTESİ */}
      <div className={`
        flex-1 flex flex-col h-full overflow-hidden relative transition-transform duration-300
        ${mobileTab === 'map' ? 'translate-x-0' : 'translate-x-full md:translate-x-0 absolute md:relative inset-0'}
      `}>
          <div className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 shrink-0 z-10 gap-4">
              <div className="flex items-center gap-2 text-slate-400 flex-1">
                  <Search size={18} />
                  <input type="text" placeholder="Masa ara..." className="bg-transparent outline-none font-bold text-sm text-slate-700 placeholder-slate-300 w-full" value={searchTerm} onChange={e => setSearchTerm(e.target.value)} />
              </div>
              
              {/* FILTER & VIEW CONTROLS */}
              <div className="flex items-center gap-2">
                  <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                      <button onClick={() => setStatusFilter('all')} className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${statusFilter === 'all' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}>TÜMÜ</button>
                      <button onClick={() => setStatusFilter('available')} className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${statusFilter === 'available' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}>BOŞ</button>
                      <button onClick={() => setStatusFilter('sold')} className={`text-[10px] font-bold px-2 py-1 rounded-md transition-all ${statusFilter === 'sold' ? 'bg-white shadow text-slate-900' : 'text-slate-400'}`}>DOLU</button>
                  </div>
                  <div className="w-[1px] h-6 bg-slate-200"></div>
                  <div className="bg-slate-100 p-1 rounded-lg flex items-center">
                      <button onClick={() => setViewMode('grid')} className={`p-1.5 rounded-md transition-all ${viewMode === 'grid' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><LayoutGrid size={16} /></button>
                      <button onClick={() => setViewMode('list')} className={`p-1.5 rounded-md transition-all ${viewMode === 'list' ? 'bg-white shadow text-blue-600' : 'text-slate-400'}`}><List size={16} /></button>
                  </div>
              </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 bg-slate-100/50 custom-scrollbar pb-24 md:pb-6">
               {viewMode === 'grid' ? (
                   // GRID VIEW
                   <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5 gap-4">
                        {eventTables.map(table => {
                            const isSelected = selectedTable?.id === table.id;
                            const category = getCategory(table.categoryId);
                            const isSold = table.status === 'sold';
                            const saleInfo = isSold ? eventSales.find(s => s.tableId === table.id) : null;
                            return (
                                <div key={table.id} onClick={() => handleTableSelect(table)} className={`relative p-4 rounded-2xl border-2 transition-all cursor-pointer flex flex-col justify-between min-h-[120px] shadow-sm hover:shadow-md ${isSelected ? 'bg-blue-600 border-blue-600 text-white scale-[1.02] z-10 shadow-xl shadow-blue-500/20' : isSold ? 'bg-white border-red-100 hover:border-red-300' : 'bg-white border-white hover:border-blue-300'}`}>
                                    <div className="flex justify-between items-start">
                                        <span className={`text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded-md ${isSelected ? 'bg-blue-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{category?.name}</span>
                                        {isSold ? <Lock size={14} className={isSelected ? 'text-white' : 'text-red-400'} /> : <div className={`w-2 h-2 rounded-full ${isSelected ? 'bg-white' : 'bg-emerald-400'}`} />}
                                    </div>
                                    <div className="mt-3">
                                        <h4 className={`text-lg font-black leading-none mb-1 ${isSelected ? 'text-white' : 'text-slate-800'}`}>{table.number}</h4>
                                        {isSold && saleInfo ? (
                                            <p className={`text-xs font-bold truncate ${isSelected ? 'text-blue-100' : 'text-red-500'}`}>{saleInfo.customerName}</p>
                                        ) : (
                                            <p className={`text-xs font-medium ${isSelected ? 'text-blue-200' : 'text-slate-400'}`}>{table.capacity} Kişilik</p>
                                        )}
                                    </div>
                                    {isSold && saleInfo && saleInfo.remainingDebt > 0 && (
                                        <div className="mt-2 pt-2 border-t border-dashed border-red-200">
                                            <p className={`text-[10px] font-black ${isSelected ? 'text-white' : 'text-red-600'}`}>BORÇ: ₺{saleInfo.remainingDebt}</p>
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                   </div>
               ) : (
                   // LIST VIEW
                   <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
                       <table className="w-full text-left">
                           <thead className="bg-slate-50 border-b border-slate-200">
                               <tr>
                                   <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Masa</th>
                                   <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Kategori</th>
                                   <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Kapasite</th>
                                   <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Durum</th>
                                   <th className="p-4 text-[10px] font-black text-slate-400 uppercase tracking-wider">Müşteri</th>
                               </tr>
                           </thead>
                           <tbody className="divide-y divide-slate-100">
                               {eventTables.map(table => {
                                   const isSelected = selectedTable?.id === table.id;
                                   const category = getCategory(table.categoryId);
                                   const isSold = table.status === 'sold';
                                   const saleInfo = isSold ? eventSales.find(s => s.tableId === table.id) : null;
                                   
                                   return (
                                       <tr 
                                            key={table.id} 
                                            onClick={() => handleTableSelect(table)}
                                            className={`cursor-pointer transition-colors ${isSelected ? 'bg-blue-50' : 'hover:bg-slate-50'}`}
                                       >
                                           <td className="p-4 font-black text-slate-900">{table.number}</td>
                                           <td className="p-4">
                                               <span className="text-[10px] font-bold px-2 py-1 bg-slate-100 rounded text-slate-600">{category?.name}</span>
                                           </td>
                                           <td className="p-4 text-xs font-bold text-slate-500">{table.capacity} Kişi</td>
                                           <td className="p-4">
                                               {isSold ? (
                                                   <span className="flex items-center gap-1 text-xs font-bold text-red-500"><Lock size={12} /> DOLU</span>
                                               ) : (
                                                   <span className="flex items-center gap-1 text-xs font-bold text-emerald-500"><div className="w-2 h-2 bg-emerald-500 rounded-full"></div> BOŞ</span>
                                               )}
                                           </td>
                                           <td className="p-4 text-xs font-bold text-slate-700">
                                               {saleInfo ? saleInfo.customerName : '-'}
                                               {saleInfo && saleInfo.remainingDebt > 0 && <span className="text-red-500 ml-2">(Borçlu)</span>}
                                           </td>
                                       </tr>
                                   );
                               })}
                           </tbody>
                       </table>
                   </div>
               )}
          </div>
      </div>

      {/* TICKET MODAL */}
      <Modal isOpen={ticketModalOpen} onClose={() => setTicketModalOpen(false)} title="Bilet Hazır">
          {lastSale && (
            <div className="flex flex-col items-center">
                
                {/* PREMIUM TICKET VISUAL - DARK MODE */}
                <div id="ticket-visual" className="w-[340px] bg-zinc-950 text-white rounded-3xl overflow-hidden shadow-2xl relative mb-6 border border-zinc-800">
                    
                    {/* Background Texture */}
                    <div className="absolute inset-0 opacity-10" style={{backgroundImage: 'radial-gradient(#fbbf24 1px, transparent 1px)', backgroundSize: '30px 30px'}}></div>
                    
                    {/* HEADER SECTION */}
                    <div className="h-44 bg-zinc-900 relative flex flex-col items-center justify-end p-0 border-b border-zinc-800/50 overflow-hidden">
                        {currentEvent.logo ? (
                            <>
                                <img src={currentEvent.logo} className="absolute inset-0 w-full h-full object-cover opacity-60" alt="Logo" />
                                <div className="absolute inset-0 bg-gradient-to-t from-zinc-950 via-zinc-950/40 to-transparent"></div>
                            </>
                        ) : (
                            <div className="w-full h-full flex items-center justify-center bg-zinc-800">
                                <Crown size={48} className="text-amber-500/20" />
                            </div>
                        )}
                        
                        <div className="relative z-10 w-full px-6 pb-4 text-center">
                            {currentEvent.organizer && (
                                <p className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1 drop-shadow-md">
                                    {currentEvent.organizer} PRESENTS
                                </p>
                            )}
                            <h2 className="text-2xl font-black tracking-tighter uppercase italic leading-none text-white drop-shadow-md">
                                {currentEvent.name}
                            </h2>
                        </div>
                    </div>

                    {/* BODY SECTION */}
                    <div className="p-6 relative z-10 bg-zinc-950">
                        {/* Info Grid */}
                        <div className="grid grid-cols-2 gap-3 mb-6">
                            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
                                <div className="p-2 bg-zinc-800 rounded-lg text-amber-500 shadow-sm"><Calendar size={14} /></div>
                                <div>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide">TARİH</p>
                                    <p className="text-xs font-bold text-zinc-100">{formatDate(currentEvent.date)}</p>
                                </div>
                            </div>
                            <div className="bg-zinc-900 border border-zinc-800 p-3 rounded-xl flex items-center gap-3">
                                <div className="p-2 bg-zinc-800 rounded-lg text-amber-500 shadow-sm"><Clock size={14} /></div>
                                <div>
                                    <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide">KAPI AÇILIŞ</p>
                                    <p className="text-xs font-bold text-zinc-100">{currentEvent.time}</p>
                                </div>
                            </div>
                        </div>

                         <div className="mb-6 flex items-center gap-3 bg-zinc-900 border border-zinc-800 p-3 rounded-xl">
                            <div className="p-2 bg-zinc-800 rounded-lg text-amber-500 shadow-sm"><MapPin size={14} /></div>
                            <div>
                                <p className="text-[9px] text-zinc-500 font-bold uppercase tracking-wide">ETKİNLİK YERİ</p>
                                <p className="text-xs font-bold text-zinc-300">{currentEvent.venue} — {currentEvent.location}</p>
                            </div>
                         </div>

                        {/* Perforation Line */}
                        <div className="relative h-px bg-zinc-800 w-full mb-6 flex items-center justify-between">
                             <div className="w-5 h-5 bg-slate-50 rounded-full -ml-8"></div>
                             <div className="border-t-2 border-dashed border-zinc-700 w-full mx-2 opacity-50"></div>
                             <div className="w-5 h-5 bg-slate-50 rounded-full -mr-8"></div>
                        </div>

                        {/* Guest & Table Info */}
                        <div className="flex justify-between items-end mb-8">
                            <div>
                                <div className="flex items-center gap-2 mb-1">
                                    <span className="bg-amber-500 text-zinc-900 px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider">VIP ACCESS</span>
                                </div>
                                <h3 className="text-xl font-bold text-white leading-tight">{lastSale.customerName}</h3>
                                <p className="text-[10px] text-zinc-500 font-medium mt-1 uppercase tracking-wider">
                                    DAVETİYE SAHİBİ
                                </p>
                            </div>
                            <div className="text-right">
                                <div className="bg-zinc-900 px-4 py-2 rounded-xl border border-zinc-800 shadow-inner">
                                    <p className="text-[9px] text-zinc-500 uppercase font-bold tracking-wider">MASA</p>
                                    <p className="text-3xl font-black text-white">{eventTables.find(t=>t.id===lastSale.tableId)?.number}</p>
                                    <div className="flex items-center justify-end gap-1 mt-1 text-amber-500">
                                        <Users size={10} /> 
                                        <span className="text-[9px] font-bold">{eventTables.find(t=>t.id===lastSale.tableId)?.capacity || form.pax} Pax</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* QR Code Section */}
                        <div className="flex flex-col items-center justify-center bg-white p-4 rounded-2xl mx-auto w-fit shadow-lg shadow-white/5 relative overflow-hidden">
                            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/5 pointer-events-none"></div>
                            <div className="text-black relative z-10">
                                <img 
                                  src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(lastSale.qrCode)}`} 
                                  alt="QR Kod" 
                                  className="w-24 h-24"
                                />
                            </div>
                        </div>
                        <p className="text-[10px] font-mono text-zinc-500 tracking-[0.3em] text-center mt-3 uppercase">{lastSale.qrCode}</p>
                    </div>
                    
                    {/* Welcome Message Footer */}
                    <div className="bg-zinc-900 p-4 text-center border-t border-zinc-800">
                        <p className="text-[10px] text-zinc-400 font-medium leading-relaxed italic">
                            "Sayın <span className="text-amber-500 font-bold">{lastSale.customerName}</span>, bu özel gece için davetiniz hazırdır. Girişte QR kodunuzu okutarak hızlı geçiş yapabilirsiniz. İyi eğlenceler dileriz."
                        </p>
                    </div>
                </div>

                <div className="flex gap-3 w-full max-w-[340px]">
                    <Button variant="outline" className="flex-1 border-slate-300 text-slate-600 hover:bg-slate-50" onClick={() => window.print()}>
                        <Printer size={16} className="mr-2" /> YAZDIR
                    </Button>
                    <Button className="flex-[2] bg-[#25D366] hover:bg-[#20bd5a] text-white shadow-lg shadow-green-500/20 border-none" onClick={handleWhatsAppShare}>
                        <Share2 size={16} className="mr-2" /> WHATSAPP'TA GÖNDER
                    </Button>
                </div>
                <Button variant="ghost" size="sm" className="mt-3 text-slate-400 text-xs" onClick={() => setTicketModalOpen(false)}>Pencereyi Kapat</Button>
            </div>
          )}
      </Modal>

    </div>
  );
};
