
import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div 
        className="absolute inset-0 bg-slate-900/70 backdrop-blur-md transition-opacity duration-300"
        onClick={onClose}
      ></div>
      <div className="relative w-full max-w-lg bg-white rounded-[2rem] md:rounded-[2.5rem] shadow-[0_30px_70px_rgba(0,0,0,0.3)] transform transition-all animate-in fade-in zoom-in-95 duration-300 overflow-hidden border border-white/20 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="flex items-center justify-between p-6 md:p-8 border-b border-slate-50 flex-shrink-0 bg-white z-10">
          <div>
            <h3 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight">{title}</h3>
            <div className="w-12 h-1.5 bg-blue-600 rounded-full mt-1.5"></div>
          </div>
          <button 
            onClick={onClose} 
            className="p-2 md:p-3 bg-slate-50 hover:bg-slate-100 rounded-2xl text-slate-400 hover:text-slate-900 transition-all active:scale-90"
          >
            <X size={20} />
          </button>
        </div>
        
        {/* Content - Scrollable for small screens */}
        <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar flex-1 bg-white relative">
          {children}
        </div>
      </div>
    </div>
  );
};
