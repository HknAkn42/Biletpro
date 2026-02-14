
import React, { useEffect, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Megaphone, X, Calendar, Gift, Star } from 'lucide-react';
import { Announcement } from '../../types';

export const AnnouncementPopup: React.FC = () => {
  const { announcements, user } = useApp();
  const [activeAnnouncement, setActiveAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    // Sadece müşteri rolündeyse göster (Admin/User), Super Admin'e gösterme
    if (!user || user.role === 'super_admin') return;

    const checkAnnouncements = () => {
        const today = new Date();
        const validAnnouncement = announcements.find(a => {
            const start = new Date(a.startDate);
            const end = new Date(a.endDate);
            const isDateValid = today >= start && today <= end;
            
            // LocalStorage kontrolü: Daha önce bu duyuruyu gördü mü?
            const hasSeen = localStorage.getItem(`seen_announcement_${a.id}`);
            
            return a.isActive && isDateValid && !hasSeen;
        });

        if (validAnnouncement) {
            setActiveAnnouncement(validAnnouncement);
        }
    };

    checkAnnouncements();
  }, [announcements, user]);

  const handleClose = () => {
      if (activeAnnouncement) {
          // Görüldü olarak işaretle
          localStorage.setItem(`seen_announcement_${activeAnnouncement.id}`, 'true');
          setActiveAnnouncement(null);
      }
  };

  if (!activeAnnouncement) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
        {/* Backdrop */}
        <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"></div>
        
        {/* Modal Card */}
        <div className="relative w-full max-w-md bg-white rounded-[2rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-500 border-4 border-white/20">
            {/* Header / Banner */}
            <div className="bg-gradient-to-br from-indigo-600 to-purple-700 p-8 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-full opacity-10">
                    <div className="absolute top-[-50%] left-[-50%] w-[200%] h-[200%] rotate-12" style={{backgroundImage: 'radial-gradient(circle, #fff 2px, transparent 2.5px)', backgroundSize: '20px 20px'}}></div>
                </div>
                
                <div className="relative z-10 flex justify-center mb-4">
                    <div className="bg-white/20 p-4 rounded-full backdrop-blur-md shadow-lg border border-white/20">
                        <Gift size={40} className="text-white drop-shadow-md animate-pulse" />
                    </div>
                </div>
                
                <h2 className="relative z-10 text-2xl font-black text-white tracking-tight uppercase leading-tight drop-shadow-md">
                    {activeAnnouncement.title}
                </h2>
            </div>

            {/* Content */}
            <div className="p-8 text-center bg-white">
                <p className="text-slate-600 font-medium leading-relaxed mb-6 whitespace-pre-wrap">
                    {activeAnnouncement.message}
                </p>

                <div className="flex items-center justify-center gap-2 text-xs font-bold text-slate-400 bg-slate-50 py-2 px-4 rounded-xl mb-6 inline-flex">
                    <Calendar size={14} />
                    <span>Son Geçerlilik: {new Date(activeAnnouncement.endDate).toLocaleDateString()}</span>
                </div>

                <button 
                    onClick={handleClose}
                    className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-sm hover:bg-slate-800 transition-all shadow-xl shadow-slate-900/20 active:scale-95"
                >
                    HARİKA, ANLAŞILDI! 🚀
                </button>
            </div>

            {/* Close X */}
            <button 
                onClick={handleClose}
                className="absolute top-4 right-4 text-white/60 hover:text-white transition-colors bg-black/10 hover:bg-black/20 rounded-full p-2 backdrop-blur-sm"
            >
                <X size={20} />
            </button>
        </div>
    </div>
  );
};
