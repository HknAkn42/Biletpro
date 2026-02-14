
import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Bell, Search, Menu, X, ArrowRightLeft, AlertCircle, Calendar, ChevronDown, Check, LogOut, Ticket, CheckCheck, Trash2, Info, BadgeCheck, AlertTriangle } from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { Sale, Table } from '../../types';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';

export const Header: React.FC = () => {
  const { 
    user, toggleMobileMenu, logout,
    sales, tables,
    events, currentEvent, setCurrentEvent,
    collectDebtAndApprove,
    notifications, markNotificationRead, clearAllNotifications
  } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [isSearchFocused, setIsSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState<{sale: Sale, table: Table | undefined}[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showEventMenu, setShowEventMenu] = useState(false); 
  const [isActionModalOpen, setIsActionModalOpen] = useState(false);
  const [selectedSaleForAction, setSelectedSaleForAction] = useState<Sale | null>(null);

  const searchRef = useRef<HTMLDivElement>(null);
  const notifRef = useRef<HTMLDivElement>(null);
  const eventRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (searchQuery.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const term = searchQuery.toLowerCase();
    const currentEventSales = sales.filter(s => s.eventId === currentEvent.id);
    const results = currentEventSales.filter(s => {
      const table = tables.find(t => t.id === s.tableId);
      const tableNo = table?.number.toLowerCase() || '';
      return (
        s.customerName.toLowerCase().includes(term) ||
        s.customerPhone.includes(term) ||
        s.qrCode.toLowerCase().includes(term) ||
        tableNo.includes(term)
      );
    }).map(s => ({
      sale: s,
      table: tables.find(t => t.id === s.tableId)
    })).slice(0, 5);
    setSearchResults(results);
  }, [searchQuery, sales, tables, currentEvent.id]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setIsSearchFocused(false);
      if (notifRef.current && !notifRef.current.contains(event.target as Node)) setShowNotifications(false);
      if (eventRef.current && !eventRef.current.contains(event.target as Node)) setShowEventMenu(false);
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Filter notifications based on role
  const visibleNotifications = useMemo(() => {
      if (!user) return [];
      // Sadece admin ve super_admin görebilir
      if (user.role !== 'admin' && user.role !== 'super_admin') return [];
      
      // Sadece okunmamışları göster (veya hepsi gösterilebilir, UI tercihine bağlı)
      return notifications.filter(n => !n.isRead && n.organizationId === user.organizationId);
  }, [notifications, user]);

  const handleResultClick = (sale: Sale) => {
    setSelectedSaleForAction(sale);
    setIsActionModalOpen(true);
    setIsSearchFocused(false);
    setSearchQuery('');
  };

  const handleEventSelect = (event: any) => {
      setCurrentEvent(event);
      setShowEventMenu(false);
  };

  const getNotificationIcon = (type: string) => {
      switch(type) {
          case 'sale': return <Ticket size={16} className="text-emerald-500" />;
          case 'alert': return <AlertTriangle size={16} className="text-red-500" />;
          case 'success': return <BadgeCheck size={16} className="text-blue-500" />;
          default: return <Info size={16} className="text-slate-400" />;
      }
  };

  return (
    <>
    <header className="bg-white/80 backdrop-blur-md border-b border-slate-100 h-16 px-6 flex items-center justify-between sticky top-0 z-40 transition-all">
      <div className="flex items-center gap-4">
        <button onClick={toggleMobileMenu} className="md:hidden p-2 text-slate-500 hover:bg-slate-50 rounded-lg">
          <Menu size={20} />
        </button>

        <div className="relative" ref={eventRef}>
            <button 
                onClick={() => setShowEventMenu(!showEventMenu)}
                className={`flex items-center gap-3 py-1.5 px-1.5 pr-3 rounded-full transition-all border ${showEventMenu ? 'bg-blue-50 border-blue-100' : 'bg-transparent border-transparent hover:bg-slate-50'}`}
            >
                <div className="w-8 h-8 bg-slate-900 rounded-full flex items-center justify-center text-white shadow-md">
                    <Calendar size={14} />
                </div>
                <div className="hidden md:block text-left">
                    <div className="flex items-center gap-2">
                        <h2 className="font-bold text-slate-900 text-xs leading-none truncate max-w-[150px]">
                            {currentEvent.id ? currentEvent.name : 'Etkinlik Seçin'}
                        </h2>
                        <ChevronDown size={12} className="text-slate-400" />
                    </div>
                </div>
            </button>
            {showEventMenu && (
                <div className="absolute top-full left-0 mt-2 w-64 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden py-2 animate-in fade-in slide-in-from-top-2">
                    <div className="max-h-[300px] overflow-y-auto custom-scrollbar px-1">
                        {events.map(ev => (
                            <button key={ev.id} onClick={() => handleEventSelect(ev)} className={`w-full text-left px-4 py-2.5 rounded-xl flex items-center justify-between text-xs font-medium transition-all ${currentEvent.id === ev.id ? 'bg-blue-50 text-blue-600' : 'text-slate-600 hover:bg-slate-50'}`}>
                                <span className="truncate">{ev.name}</span>
                                {currentEvent.id === ev.id && <Check size={14} />}
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
      </div>

      <div className="flex-1 max-w-xl mx-6 hidden md:block relative" ref={searchRef}>
        <div className={`flex items-center bg-slate-50 rounded-xl px-4 py-2 transition-all border ${isSearchFocused ? 'bg-white border-blue-500 ring-4 ring-blue-500/5' : 'border-transparent'}`}>
          <Search size={16} className="text-slate-400" />
          <input 
            type="text" 
            placeholder="Ara: Misafir, masa, kod..." 
            className="bg-transparent border-none focus:outline-none w-full text-xs font-medium text-slate-900 placeholder-slate-400 ml-3"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            onFocus={() => setIsSearchFocused(true)}
          />
          {searchQuery && <button onClick={() => { setSearchQuery(''); setIsSearchFocused(false); }}><X size={14} className="text-slate-400 hover:text-slate-900" /></button>}
        </div>
        
        {isSearchFocused && searchQuery.length >= 2 && (
            <div className="absolute top-full left-0 w-full mt-2 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden py-2 z-50">
                {searchResults.length === 0 ? (
                    <div className="p-4 text-center text-xs text-slate-400 font-medium">Sonuç bulunamadı.</div>
                ) : (
                    <div className="px-1 space-y-0.5">
                        {searchResults.map(({sale, table}) => (
                            <button key={sale.id} onClick={() => handleResultClick(sale)} className="w-full text-left px-4 py-2.5 rounded-xl hover:bg-slate-50 flex items-center justify-between group">
                                <div className="flex items-center gap-3 overflow-hidden">
                                    <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-500 text-xs font-bold shrink-0">{sale.customerName.charAt(0)}</div>
                                    <div className="min-w-0">
                                        <p className="font-semibold text-slate-900 text-xs truncate">{sale.customerName}</p>
                                        <p className="text-[10px] text-slate-400 truncate">{sale.qrCode}</p>
                                    </div>
                                </div>
                                <span className="text-[10px] font-bold bg-slate-100 text-slate-600 px-2 py-1 rounded-md shrink-0">MASA {table?.number}</span>
                            </button>
                        ))}
                    </div>
                )}
            </div>
        )}
      </div>

      <div className="flex items-center gap-3">
        {/* Sadece Admin ve Super Admin Bildirimleri Görür */}
        {(user?.role === 'admin' || user?.role === 'super_admin') && (
            <div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotifications(!showNotifications)} className="p-2 text-slate-400 hover:text-slate-600 relative transition-colors">
                    <Bell size={20} />
                    {visibleNotifications.length > 0 && <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full ring-2 ring-white animate-pulse"></span>}
                </button>
                {showNotifications && (
                    <div className="absolute top-full right-0 mt-2 w-96 bg-white rounded-2xl shadow-xl border border-slate-100 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2">
                        <div className="px-4 py-3 border-b border-slate-50 flex justify-between items-center bg-slate-50/50">
                            <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">Bildirim Merkezi</span>
                            {visibleNotifications.length > 0 && (
                                <button onClick={clearAllNotifications} className="text-[10px] text-blue-600 font-bold hover:underline">Hepsini Okundu Yap</button>
                            )}
                        </div>
                        <div className="max-h-80 overflow-y-auto custom-scrollbar p-1">
                            {visibleNotifications.length === 0 ? <p className="p-8 text-center text-xs text-slate-400">Yeni bildirim yok.</p> : visibleNotifications.map(n => (
                                <div key={n.id} className="w-full text-left p-3 hover:bg-slate-50 rounded-xl flex gap-3 group relative border-b border-slate-50 last:border-0">
                                    <div className="mt-0.5 shrink-0 bg-white p-2 rounded-lg border border-slate-100 shadow-sm">
                                        {getNotificationIcon(n.type)}
                                    </div>
                                    <div className="flex-1 min-w-0" onClick={() => { if(n.relatedSaleId) { const s = sales.find(x => x.id === n.relatedSaleId); if(s) { setSelectedSaleForAction(s); setIsActionModalOpen(true); setShowNotifications(false); } } }}>
                                        <p className="text-xs font-bold text-slate-900 truncate">{n.title}</p>
                                        <p className="text-[11px] text-slate-500 mt-0.5 leading-snug line-clamp-2">{n.message}</p>
                                        <p className="text-[9px] text-slate-300 mt-1 font-medium">{new Date(n.timestamp).toLocaleTimeString()}</p>
                                    </div>
                                    <button onClick={(e) => { e.stopPropagation(); markNotificationRead(n.id); }} className="absolute top-2 right-2 p-1.5 text-slate-300 hover:text-blue-500 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100">
                                        <CheckCheck size={14} />
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </div>
        )}

        <div className="w-[1px] h-6 bg-slate-200 hidden md:block"></div>

        <button onClick={logout} className="flex items-center gap-3 pl-2 group">
            <div className="hidden md:block text-right">
                <p className="text-xs font-bold text-slate-800 leading-none">{user?.name}</p>
                <p className="text-[10px] font-medium text-slate-400 mt-0.5">{user?.role}</p>
            </div>
            <div className="w-9 h-9 bg-slate-100 rounded-full flex items-center justify-center text-slate-600 group-hover:bg-red-50 group-hover:text-red-500 transition-colors">
                <LogOut size={16} />
            </div>
        </button>
      </div>
    </header>

    <Modal isOpen={isActionModalOpen} onClose={() => setIsActionModalOpen(false)} title="Hızlı İşlem">
        {selectedSaleForAction && (
            <div className="space-y-6">
                <div className="text-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                    <h4 className="text-lg font-bold text-slate-900">{selectedSaleForAction.customerName}</h4>
                    <p className="text-xs text-slate-500 font-medium mt-1">MASA {tables.find(t => t.id === selectedSaleForAction.tableId)?.number}</p>
                </div>
                <div className="space-y-3">
                    <Button variant="outline" className="w-full justify-center h-12 text-xs font-bold border-slate-200">
                        <Ticket size={16} className="mr-2" /> BİLET DETAYI
                    </Button>
                    {selectedSaleForAction.remainingDebt > 0 && (
                        <Button variant="success" className="w-full justify-center h-12 text-xs font-bold" onClick={() => { collectDebtAndApprove(selectedSaleForAction.id, 0); setIsActionModalOpen(false); }}>
                            <ArrowRightLeft size={16} className="mr-2" /> ₺{selectedSaleForAction.remainingDebt} TAHSİL ET
                        </Button>
                    )}
                </div>
            </div>
        )}
    </Modal>
    </>
  );
};
