
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Calendar, MapPin, Edit, Trash2, CheckCircle2, Image, UploadCloud, PlayCircle, StopCircle, Clock, Type, Landmark, Plus, X, Building2 } from 'lucide-react';
import { Event } from '../types';

export const Events: React.FC = () => {
  const { events, currentEvent, setCurrentEvent, addEvent, updateEvent, deleteEvent, user } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditMode, setIsEditMode] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  
  const [eventForm, setEventForm] = useState({
    name: '', organizer: '', logo: '', date: '', time: '', venue: '', location: '', status: 'active' as 'active' | 'completed' | 'cancelled'
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // 500KB Boyut Limiti
      if (file.size > 500 * 1024) {
          alert('HATA: Resim boyutu çok büyük! Lütfen 500KB altında bir resim yükleyiniz.\n\nİpucu: Resmi Whatsapp\'tan kendinize gönderip indirerek küçültebilirsiniz.');
          return;
      }
      const reader = new FileReader();
      reader.onloadend = () => { setEventForm({ ...eventForm, logo: reader.result as string }); };
      reader.readAsDataURL(file);
    }
  };

  const removeLogo = (e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();
      setEventForm({ ...eventForm, logo: '' });
  };

  const openCreateModal = () => {
      setEventForm({ name: '', organizer: '', logo: '', date: '', time: '', venue: '', location: '', status: 'active' });
      setIsEditMode(false);
      setEditingEventId(null);
      setIsModalOpen(true);
  };

  const openEditModal = (e: React.MouseEvent, event: Event) => {
      e.stopPropagation();
      setEventForm({
          name: event.name, 
          organizer: event.organizer || '',
          logo: event.logo || '', 
          date: event.date, 
          time: event.time, 
          venue: event.venue, 
          location: event.location, 
          status: event.status
      });
      setIsEditMode(true);
      setEditingEventId(event.id);
      setIsModalOpen(true);
  };

  const handleDelete = (e: React.MouseEvent, eventId: string) => {
      e.stopPropagation(); // Kartın tıklanmasını engelle
      e.preventDefault();
      if (confirm('Bu etkinliği ve ilgili tüm verileri silmek istediğinize emin misiniz?')) {
          deleteEvent(eventId);
      }
  };

  const toggleStatus = (e: React.MouseEvent, event: Event) => {
      e.stopPropagation();
      const newStatus = event.status === 'active' ? 'completed' : 'active';
      if (confirm(`Etkinlik durumu değiştirilsin mi?`)) updateEvent({ ...event, status: newStatus });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const eventData = { ...eventForm };
    if (isEditMode && editingEventId) {
        const existing = events.find(ev => ev.id === editingEventId);
        if (existing) updateEvent({ ...existing, ...eventData });
    } else {
        const newEvent: Event = { 
            id: `evt-${Date.now()}`, 
            organizationId: user?.organizationId || '',
            categories: [], 
            ...eventData 
        };
        addEvent(newEvent);
        setCurrentEvent(newEvent);
    }
    setIsModalOpen(false);
  };

  // Helper to format date for display
  const formatDateDisplay = (dateStr: string) => {
      if(!dateStr) return '';
      const d = new Date(dateStr);
      return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'numeric', year: 'numeric' });
  };

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Etkinlikler</h1>
          <p className="text-xs text-slate-500 font-medium">Organizasyon yönetimi</p>
        </div>
        {user?.role === 'admin' && (
          <Button size="sm" onClick={openCreateModal} className="rounded-xl px-5 h-10 font-bold text-xs shadow-lg shadow-blue-500/10">
            <Plus size={16} className="mr-2" /> OLUŞTUR
          </Button>
        )}
      </div>

      {events.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-slate-200">
            <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto text-blue-500 mb-4"><Calendar size={32} /></div>
            <h2 className="text-lg font-bold text-slate-900">Etkinlik Yok</h2>
            <p className="text-xs text-slate-500 mb-6">Başlamak için yeni bir etkinlik oluşturun.</p>
            <Button size="sm" onClick={openCreateModal}>Yeni Etkinlik</Button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {events.map(event => {
            const isActive = currentEvent.id === event.id;
            return (
                <div key={event.id} onClick={() => setCurrentEvent(event)} className={`group relative cursor-pointer transition-all duration-300 ${isActive ? 'scale-[1.02]' : 'hover:scale-[1.01]'}`}>
                <Card className={`h-full border-0 shadow-lg shadow-slate-200/50 overflow-hidden flex flex-col p-0 rounded-3xl transition-all bg-white ${isActive ? 'ring-2 ring-blue-500 ring-offset-2' : ''}`}>
                    <div className="h-40 bg-slate-900 relative overflow-hidden">
                        {event.logo ? (
                            <img src={event.logo} alt={event.name} className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-105 transition-transform duration-700" />
                        ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-slate-800"><Image size={40} /></div>
                        )}
                        {/* Gradient Overlay */}
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent"></div>
                        
                        {/* Status Badge */}
                        <div className="absolute top-4 right-4 z-20">
                             <button onClick={(e) => toggleStatus(e, event)} className={`px-3 py-1 rounded-lg text-[9px] font-bold backdrop-blur-md flex items-center gap-1.5 transition-colors ${event.status === 'active' ? 'bg-emerald-500/90 text-white shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-700/90 text-slate-300'}`}>
                                 {event.status === 'active' ? <PlayCircle size={10} className="animate-pulse" /> : <StopCircle size={10} />}
                                 {event.status === 'active' ? 'AKTİF' : 'BİTTİ'}
                             </button>
                        </div>
                        
                        {isActive && <div className="absolute top-4 left-4 bg-blue-600 text-white px-3 py-1 rounded-lg text-[9px] font-bold flex items-center gap-1.5 shadow-lg z-20"><CheckCircle2 size={10} /> SEÇİLİ</div>}
                        
                        <div className="absolute bottom-4 left-5 right-5 z-10">
                            <div className="flex items-center gap-1.5 text-blue-400 text-[9px] font-bold uppercase tracking-wider mb-1">
                                <Calendar size={10} /> <span>{formatDateDisplay(event.date)} • {event.time}</span>
                            </div>
                            <h3 className="text-lg font-bold text-white truncate leading-tight drop-shadow-md">{event.name}</h3>
                            {event.organizer && <p className="text-[10px] text-slate-400 truncate mt-0.5">{event.organizer}</p>}
                        </div>
                    </div>
                    <div className="p-5 flex-1 flex flex-col justify-between">
                        <div className="flex items-start gap-3">
                            <div className="p-2.5 bg-slate-50 rounded-xl text-slate-400"><MapPin size={16} /></div>
                            <div className="min-w-0">
                                <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wide">Konum</p>
                                <p className="text-xs text-slate-900 font-bold truncate">{event.venue}, {event.location}</p>
                            </div>
                        </div>
                        {user?.role === 'admin' && (
                            <div className="flex gap-2 pt-4 mt-4 border-t border-slate-50">
                                <Button variant="ghost" className="flex-1 rounded-xl bg-slate-50 h-9 text-[10px] font-bold text-slate-600 hover:bg-blue-50 hover:text-blue-600" onClick={(e) => openEditModal(e, event)}><Edit size={12} className="mr-1.5" /> DÜZENLE</Button>
                                <Button variant="ghost" className="rounded-xl bg-red-50 text-red-500 w-9 h-9 p-0 flex items-center justify-center hover:bg-red-100" onClick={(e) => handleDelete(e, event.id)}><Trash2 size={14} /></Button>
                            </div>
                        )}
                    </div>
                </Card>
                </div>
            );
            })}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title={isEditMode ? "Etkinlik Düzenle" : "Yeni Etkinlik"}>
        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Logo Upload Area */}
          <div className="flex justify-center mb-4">
              <div className="relative group w-full">
                  <input type="file" id="logo-upload" className="hidden" accept="image/*" onChange={handleFileChange} />
                  <label htmlFor="logo-upload" className={`w-full h-32 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden relative ${eventForm.logo ? 'border-blue-500 bg-blue-50' : 'border-slate-300 hover:border-blue-500 hover:bg-blue-50/50'}`}>
                      {eventForm.logo ? (
                          <img src={eventForm.logo} alt="Logo Preview" className="w-full h-full object-cover opacity-80" />
                      ) : (
                          <>
                              <div className="bg-white p-3 rounded-full shadow-sm mb-2"><UploadCloud size={20} className="text-blue-500" /></div>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">Şirket Logosu Yükle</span>
                          </>
                      )}
                      
                      {/* Hover Overlay */}
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <span className="text-white text-xs font-bold">Değiştirmek için tıkla</span>
                      </div>
                  </label>
                  
                  {eventForm.logo && (
                      <button type="button" onClick={removeLogo} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1.5 shadow-lg hover:bg-red-600 transition-all z-10">
                          <X size={12} />
                      </button>
                  )}
              </div>
          </div>

          <div className="grid grid-cols-1 gap-4">
             <Input label="ETKİNLİK ADI" icon={Type} required value={eventForm.name} onChange={(e) => setEventForm({...eventForm, name: e.target.value})} />
             <Input label="FİRMA / ORGANİZATÖR" icon={Building2} value={eventForm.organizer} onChange={(e) => setEventForm({...eventForm, organizer: e.target.value})} placeholder="Örn: X Medya Yapım" />
          </div>
          
          <div className="grid grid-cols-2 gap-4">
             <Input label="TARİH" icon={Calendar} type="date" required value={eventForm.date} onChange={(e) => setEventForm({...eventForm, date: e.target.value})} />
             <Input label="SAAT" icon={Clock} type="time" required value={eventForm.time} onChange={(e) => setEventForm({...eventForm, time: e.target.value})} />
          </div>
          <div className="grid grid-cols-2 gap-4">
              <Input label="MEKAN" icon={Landmark} required value={eventForm.venue} onChange={(e) => setEventForm({...eventForm, venue: e.target.value})} />
              <Input label="ŞEHİR" icon={MapPin} required value={eventForm.location} onChange={(e) => setEventForm({...eventForm, location: e.target.value})} />
          </div>
          <div className="pt-4 flex gap-3">
            <Button type="button" variant="ghost" className="flex-1 rounded-xl bg-slate-50 text-xs font-bold" onClick={() => setIsModalOpen(false)}>İPTAL</Button>
            <Button type="submit" className="flex-[2] rounded-xl text-xs font-bold shadow-lg shadow-blue-500/20">{isEditMode ? 'KAYDET' : 'OLUŞTUR'}</Button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
