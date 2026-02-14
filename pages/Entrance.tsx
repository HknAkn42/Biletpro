
import React, { useState, useEffect, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { QrCode, Check, X, AlertOctagon, Zap, ZapOff, Camera, Loader2, Armchair, Users, Minus, Plus, AlertTriangle, Key, History, Clock } from 'lucide-react';
import { Html5Qrcode, Html5QrcodeSupportedFormats } from 'html5-qrcode';
import { Sale, Table, User as UserType } from '../types';

export const Entrance: React.FC = () => {
  const { checkTicket, approveEntry, collectDebtAndApprove, user, users, currentEvent } = useApp();
  
  const [isScanning, setIsScanning] = useState(false);
  const [isInitializing, setIsInitializing] = useState(true);
  const [manualCode, setManualCode] = useState('');
  
  const [scanStatus, setScanStatus] = useState<'idle' | 'success' | 'error' | 'warning' | 'awaiting_count'>('idle');
  const [statusMessage, setStatusMessage] = useState('');
  const [scannedSale, setScannedSale] = useState<Sale | null>(null);
  const [scannedTable, setScannedTable] = useState<Table | null>(null);
  
  const [entryCount, setEntryCount] = useState(1);
  const [entryNote, setEntryNote] = useState('');

  const [showOverrideModal, setShowOverrideModal] = useState(false);
  const [overridePass, setOverridePass] = useState('');
  const [overrideError, setOverrideError] = useState('');

  const scannerRef = useRef<Html5Qrcode | null>(null);

  const startScanner = async () => {
    try {
        setIsInitializing(true);
        if (scannerRef.current) { await scannerRef.current.stop(); scannerRef.current.clear(); }
        const scanner = new Html5Qrcode("reader");
        scannerRef.current = scanner;
        await scanner.start({ facingMode: "environment" }, { fps: 20, qrbox: 280 }, (text) => processCode(text), () => {});
        setIsScanning(true);
        setScanStatus('idle');
        setIsInitializing(false);
    } catch (err) { setIsInitializing(false); }
  };

  const processCode = (code: string) => {
    const result = checkTicket(code);
    setScannedSale(result.sale || null);
    setScannedTable(result.table || null);
    if (result.valid && result.sale) {
        setEntryCount(1);
        setScanStatus('awaiting_count');
    } else {
        setScanStatus('error');
        setStatusMessage(result.message);
        setTimeout(resumeScanning, 2500);
    }
  };

  const handleFinalApproval = () => {
    if (!scannedSale) return;
    if (scannedSale.remainingDebt >= 1.00) {
        setScanStatus('warning');
        setStatusMessage(`₺${scannedSale.remainingDebt} BAKİYE EKSİK`);
    } else {
        approveEntry(scannedSale.id, entryCount, entryNote);
        setScanStatus('success');
        setStatusMessage(`${entryCount} KİŞİ GİRDİ`);
        setTimeout(resumeScanning, 2000);
    }
  };

  const handleOverrideSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const staff = users.find(u => u.password === overridePass && (u.role === 'admin' || u.permissions.includes('SCAN_TICKETS')));
    if (staff) {
        const details = `YETKİLİ ONAYI (${staff.name}): Borçlu olmasına rağmen giriş verildi. Not: ${entryNote || 'Yok'}`;
        approveEntry(scannedSale!.id, entryCount, details, staff);
        setShowOverrideModal(false);
        setOverridePass('');
        setScanStatus('success');
        setStatusMessage(`ONAYLANDI: ${staff.name}`);
        setTimeout(resumeScanning, 2000);
    } else {
        setOverrideError("HATALI YETKİLİ ŞİFRESİ!");
    }
  };

  const resumeScanning = () => {
    setScanStatus('idle'); setStatusMessage(''); setScannedSale(null); setScannedTable(null); setEntryNote('');
    if (scannerRef.current) { scannerRef.current.resume(); }
  };

  return (
    <div className="h-full flex flex-col p-6 max-w-4xl mx-auto space-y-6 overflow-y-auto">
      <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tighter italic uppercase">Kapı Kontrol Terminali</h1>
            <p className="text-xs text-slate-500 font-medium">Misafirlerin bilet QR kodunu okutarak girişlerini sağlayın.</p>
          </div>
          <div className="bg-slate-100 px-4 py-2 rounded-xl text-[10px] font-black text-slate-400 uppercase tracking-widest">{currentEvent.name}</div>
      </div>

      <div className="relative rounded-[3rem] overflow-hidden bg-black aspect-square md:aspect-video shadow-[0_40px_100px_rgba(0,0,0,0.4)]">
         <div id="reader" className="w-full h-full object-cover"></div>
         
         {scanStatus !== 'idle' && (
            <div className={`absolute inset-0 z-20 flex flex-col items-center justify-center p-8 text-center backdrop-blur-3xl transition-all duration-500 animate-in zoom-in-95 ${
                scanStatus === 'success' ? 'bg-emerald-900/90' : scanStatus === 'error' ? 'bg-red-900/90' : 'bg-slate-950/95'
            }`}>
                {scanStatus === 'awaiting_count' && scannedSale && (
                    <div className="w-full max-w-md bg-white rounded-[2.5rem] p-8 space-y-8 shadow-2xl">
                        <div className="space-y-1">
                             <h2 className="text-3xl font-black text-slate-900 tracking-tighter uppercase italic">{scannedSale.customerName}</h2>
                             <p className="text-blue-600 font-black text-sm tracking-widest">MASA {scannedTable?.number} • {scannedSale.peopleEntered}/{scannedTable?.capacity} GİRDİ</p>
                        </div>
                        
                        <div className="flex items-center justify-center gap-6">
                            <button onClick={() => setEntryCount(Math.max(1, entryCount - 1))} className="w-16 h-16 bg-slate-100 rounded-2xl font-black text-2xl active:scale-90 transition-all">-</button>
                            <span className="text-6xl font-black text-slate-900 tabular-nums w-20">{entryCount}</span>
                            <button onClick={() => {
                                const remaining = (scannedTable?.capacity || 0) - scannedSale.peopleEntered;
                                setEntryCount(Math.min(remaining, entryCount + 1));
                            }} className="w-16 h-16 bg-blue-600 text-white rounded-2xl font-black text-2xl active:scale-90 transition-all shadow-xl shadow-blue-500/30">+</button>
                        </div>
                        
                        <textarea className="w-full bg-slate-50 rounded-2xl p-4 font-bold text-sm outline-none border-2 border-transparent focus:border-blue-500" placeholder="Personel Notu (Opsiyonel)..." rows={2} value={entryNote} onChange={e => setEntryNote(e.target.value)} />
                        
                        <Button onClick={handleFinalApproval} className="w-full h-16 rounded-2xl font-black text-lg">GİRİŞİ ONAYLA</Button>
                    </div>
                )}

                {scanStatus === 'warning' && scannedSale && (
                    <div className="w-full max-w-sm space-y-6 animate-in slide-in-from-bottom-8">
                        <div className="bg-red-600 text-white p-8 rounded-[2.5rem] shadow-2xl relative overflow-hidden border-4 border-white/20">
                             <div className="relative z-10">
                                <p className="text-[10px] font-black uppercase tracking-[0.2em] opacity-80 mb-2">Tahsil Edİlecek Bakİye</p>
                                <h3 className="text-7xl font-black tracking-tighter italic drop-shadow-2xl">₺{scannedSale.remainingDebt}</h3>
                                {scannedSale.promisedPaymentDate && (
                                    <div className="mt-6 flex items-center justify-center gap-2 bg-black/20 py-2 px-4 rounded-xl text-xs font-black italic">
                                        <Clock size={14} /> SÖZ VERİLEN: {new Date(scannedSale.promisedPaymentDate).toLocaleDateString('tr-TR')}
                                    </div>
                                )}
                             </div>
                             <AlertOctagon size={150} className="absolute -bottom-10 -right-10 opacity-10 rotate-12" />
                        </div>
                        
                        <div className="grid grid-cols-1 gap-3">
                            <Button onClick={() => collectDebtAndApprove(scannedSale.id, entryCount)} variant="success" className="h-16 rounded-2xl font-black shadow-xl shadow-emerald-500/20">TAHSİLAT YAPILDI & ONAYLA</Button>
                            <Button onClick={() => setShowOverrideModal(true)} variant="outline" className="h-16 rounded-2xl text-white border-white/20 font-black flex items-center justify-center gap-3 bg-white/5 hover:bg-white/10">
                                <Key size={20} /> ŞİFRE İLE YETKİLİ ONAYI
                            </Button>
                            <Button onClick={resumeScanning} variant="ghost" className="text-white/40 font-black h-12">İŞLEMİ İPTAL ET</Button>
                        </div>
                    </div>
                )}

                {['success', 'error'].includes(scanStatus) && (
                    <div className="animate-in zoom-in-50 duration-500 text-white space-y-6">
                        <div className={`w-32 h-32 rounded-full flex items-center justify-center mx-auto shadow-2xl border-4 border-white/20 ${scanStatus === 'success' ? 'bg-emerald-500' : 'bg-red-500'}`}>
                            {scanStatus === 'success' ? <Check size={64} strokeWidth={4} /> : <X size={64} strokeWidth={4} />}
                        </div>
                        <h2 className="text-5xl font-black uppercase italic tracking-tighter">{statusMessage}</h2>
                    </div>
                )}
            </div>
         )}
      </div>

      {!isScanning && (
          <div className="text-center p-12 bg-white rounded-[3rem] shadow-2xl border border-slate-50 space-y-6">
              <div className="w-24 h-24 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto">
                <Camera size={48} strokeWidth={1.5} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-900 italic">Hazır Mısın?</h3>
                <p className="text-slate-400 font-bold max-w-xs mx-auto text-sm leading-relaxed">QR kodlarını hızlıca taramak için kamerayı aktif edin.</p>
              </div>
              <Button onClick={startScanner} className="rounded-2xl px-16 h-16 font-black text-lg shadow-xl shadow-blue-500/30">LENSİ AÇ</Button>
          </div>
      )}

      {/* Override Modal */}
      <Modal isOpen={showOverrideModal} onClose={() => setShowOverrideModal(false)} title="Yetkili Giriş Onayı">
          <form onSubmit={handleOverrideSubmit} className="space-y-6">
              <div className="bg-amber-50 p-6 rounded-[1.5rem] text-amber-800 text-xs font-bold leading-relaxed border border-amber-100 flex gap-4">
                  <div className="p-2 bg-amber-100 rounded-lg h-fit"><AlertTriangle size={20} /></div>
                  <span>Bakiyesi olan biletlerin girişine izin vermek için kişisel personeli şifrenizi girmelisiniz. Bu işlem imzanızla kaydedilecektir.</span>
              </div>
              <Input 
                label="PERSONEL ŞİFRENİZ" 
                type="password" 
                autoFocus 
                icon={Key} 
                value={overridePass} 
                onChange={e => { setOverridePass(e.target.value); setOverrideError(''); }} 
                error={overrideError}
                placeholder="••••••"
              />
              <Button type="submit" className="w-full h-16 rounded-2xl font-black text-lg">İŞLEMİ İMZALA VE GİRİŞ VER</Button>
          </form>
      </Modal>
    </div>
  );
};
