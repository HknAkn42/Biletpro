
import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Building2, Plus, Lock, Check, MapPin, Copy, Briefcase, Mail, User, Calendar, AlertTriangle, BadgeCheck, DollarSign, Edit, Trash2, Eye, FileText, CheckCircle2, History, TrendingUp, TrendingDown, RefreshCcw, Tag, Percent, Printer } from 'lucide-react';
import { Organization, User as UserType, SaaSTransaction } from '../types';

export const Organizations: React.FC = () => {
  const { organizations, addOrganization, updateOrganization, deleteOrganization, user, saasTransactions, addSaaSTransaction, deleteSaaSTransaction, getOrganizationBalance } = useApp();
  
  // States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isSuccessModalOpen, setIsSuccessModalOpen] = useState(false); 
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false); 
  const [deleteConfirmationName, setDeleteConfirmationName] = useState('');

  // Receipt States
  const [isReceiptOpen, setIsReceiptOpen] = useState(false);
  const [receiptData, setReceiptData] = useState<SaaSTransaction | null>(null);

  const [activeTab, setActiveTab] = useState<'info' | 'admin'>('info');
  const [detailTab, setDetailTab] = useState<'profile' | 'finance'>('profile');
  
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [createdOrgDetails, setCreatedOrgDetails] = useState<{org: Organization, admin: UserType} | null>(null);

  // Forms - Initial States defined outside to be reusable for reset
  const INITIAL_ORG_FORM = { 
      id: '', name: '', commercialTitle: '', taxId: '', taxOffice: '', address: '', phone: '', contactPerson: '', contactEmail: '', subscriptionEndDate: '', licensePrice: '', paidAmount: '',
      discountType: 'amount' as 'amount' | 'percentage', discountValue: ''
  };
  const INITIAL_ADMIN_FORM = { name: '', username: '', password: '' };
  const INITIAL_TRANS_FORM = { amount: '', description: '', type: 'payment' as 'invoice' | 'payment' | 'refund' };

  const [orgForm, setOrgForm] = useState(INITIAL_ORG_FORM);
  const [adminForm, setAdminForm] = useState(INITIAL_ADMIN_FORM);
  const [transactionForm, setTransactionForm] = useState(INITIAL_TRANS_FORM);

  // İZOLASYON & RESET MEKANİZMASI
  const resetForms = () => {
      setOrgForm(INITIAL_ORG_FORM);
      setAdminForm(INITIAL_ADMIN_FORM);
      setTransactionForm(INITIAL_TRANS_FORM);
      setActiveTab('info');
  };

  // Finansal Hesaplamalar (Live)
  const financialSummary = useMemo(() => {
      const price = parseFloat(orgForm.licensePrice) || 0;
      const discountVal = parseFloat(orgForm.discountValue) || 0;
      const paid = parseFloat(orgForm.paidAmount) || 0;
      
      let discountAmount = 0;
      if (orgForm.discountType === 'percentage') {
          discountAmount = price * (discountVal / 100);
      } else {
          discountAmount = discountVal;
      }

      const netPrice = Math.max(0, price - discountAmount);
      const remaining = netPrice - paid;
      
      let dailyCost = 0;
      let durationDays = 0;

      if (orgForm.subscriptionEndDate) {
          const start = new Date(); // Bugün
          const end = new Date(orgForm.subscriptionEndDate);
          const diffTime = end.getTime() - start.getTime();
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
          
          if (diffDays > 0) {
              durationDays = diffDays;
              dailyCost = netPrice / diffDays;
          }
      }

      return { price, discountAmount, netPrice, paid, remaining, dailyCost, durationDays };
  }, [orgForm.licensePrice, orgForm.discountType, orgForm.discountValue, orgForm.paidAmount, orgForm.subscriptionEndDate]);

  // Modal Açıldığında/Kapandığında State Yönetimi
  useEffect(() => {
    if (isDetailOpen && selectedOrg) {
        // Formu sadece açılan org verisiyle doldur
        setOrgForm({
          id: selectedOrg.id,
          name: selectedOrg.name,
          commercialTitle: selectedOrg.commercialTitle || '',
          taxId: selectedOrg.taxId || '',
          taxOffice: selectedOrg.taxOffice || '',
          address: selectedOrg.address || '',
          phone: selectedOrg.phone || '',
          contactPerson: selectedOrg.contactPerson || '',
          contactEmail: selectedOrg.contactEmail || '',
          subscriptionEndDate: selectedOrg.subscriptionEndDate || '',
          licensePrice: selectedOrg.licensePrice?.toString() || '',
          discountType: selectedOrg.discountType || 'amount',
          discountValue: selectedOrg.discountValue?.toString() || '',
          paidAmount: '' // Düzenlemede peşinat gösterilmez
        });
        setTransactionForm(INITIAL_TRANS_FORM);
    } else if (!isDetailOpen && !isModalOpen) {
        // Her iki modal da kapalıysa her şeyi temizle (Memory leak prevention)
        resetForms();
        setSelectedOrg(null);
    }
  }, [isDetailOpen, isModalOpen, selectedOrg]);

  const getDaysLeft = (dateStr?: string) => {
      if (!dateStr) return null;
      const diff = new Date(dateStr).getTime() - new Date().getTime();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
  };

  const copyToClipboard = (text: string) => {
      navigator.clipboard.writeText(text);
      alert('Kopyalandı!');
  };

  if (user?.role !== 'super_admin') {
      return <div className="p-8 text-center text-slate-400">Yetkisiz Erişim</div>;
  }

  // --- HANDLERS ---

  const handleOpenCreate = () => {
      resetForms(); // Eski verileri kesinlikle temizle
      setSelectedOrg(null); // Seçili organizasyon olmadığından emin ol
      setIsModalOpen(true);
  };

  const handleOpenEdit = (org: Organization) => {
      resetForms(); // Önce temizle
      setSelectedOrg(org); // Sonra yenisini seç
      setIsDetailOpen(true);
      setDetailTab('profile');
  };

  const handleOpenReceipt = (transaction: SaaSTransaction) => {
      setReceiptData(transaction);
      setIsReceiptOpen(true);
  };

  const handlePrint = () => {
      window.print();
  };

  const handleSaveOrg = (e: React.FormEvent) => {
      e.preventDefault();
      
      const commonData = {
          ...orgForm,
          licensePrice: parseFloat(orgForm.licensePrice) || 0,
          discountValue: parseFloat(orgForm.discountValue) || 0,
      };

      if (selectedOrg) {
          // UPDATE
          updateOrganization({
              ...selectedOrg,
              ...commonData
          });
          setIsDetailOpen(false);
          alert('Müşteri bilgileri güncellendi.');
      } else {
          // CREATE - ID Generation artık Context içinde yapılıyor
          const newOrg: Organization = {
              id: '', // Context will generate proper ID
              ...commonData,
              subscriptionStatus: 'active',
              isActive: true,
              createdAt: new Date().toISOString()
          };
          
          const newAdmin: UserType = {
              id: '', // Context will generate
              organizationId: '',
              ...adminForm,
              role: 'admin',
              permissions: ['VIEW_DASHBOARD', 'MANAGE_EVENTS', 'VIEW_SALES', 'MAKE_SALES', 'VIEW_CUSTOMERS', 'SCAN_TICKETS', 'MANAGE_STAFF']
          };
          
          // PaidAmount'u da gönderiyoruz
          addOrganization(newOrg, newAdmin, parseFloat(orgForm.paidAmount) || 0);
          
          // NOT: ID'ler Context içinde oluşturulduğu için burada createdOrgDetails'i set etmek zor.
          // Ancak başarı mesajı gösterebiliriz.
          
          setIsModalOpen(false);
          resetForms(); // Formu temizle
          alert("Müşteri başarıyla oluşturuldu.");
      }
  };

  const initiateDelete = () => {
      setIsDeleteConfirmOpen(true);
      setDeleteConfirmationName('');
  };

  const confirmDelete = () => {
      if (!selectedOrg) return;
      if (deleteConfirmationName !== selectedOrg.name) {
          alert('Firma adı eşleşmedi!');
          return;
      }
      deleteOrganization(selectedOrg.id);
      setIsDeleteConfirmOpen(false);
      setIsDetailOpen(false);
      setSelectedOrg(null); // Clear selection immediately
      alert('Müşteri ve tüm verileri silindi.');
  };

  const handleTransaction = (e: React.FormEvent) => {
      e.preventDefault();
      // GÜVENLİK: Sadece seçili organizasyon varsa işlem yap.
      if (!selectedOrg || !selectedOrg.id || !transactionForm.amount) {
          alert("HATA: Organizasyon seçimi kayboldu. Lütfen sayfayı yenileyin.");
          return;
      }

      const trans: SaaSTransaction = {
          id: '', // Will be generated in Context
          organizationId: selectedOrg.id, // ID'yi direkt seçili objeden al
          type: transactionForm.type,
          amount: parseFloat(transactionForm.amount),
          description: transactionForm.description,
          date: new Date().toISOString(),
          processedBy: user.name
      };

      addSaaSTransaction(trans);
      setTransactionForm(INITIAL_TRANS_FORM); // Sadece transaction formunu temizle
      alert('İşlem kaydedildi.');
  };

  const getWelcomeEmail = () => {
      if (!createdOrgDetails) return '';
      const { org, admin } = createdOrgDetails;
      return `Konu: BiletPro Hesabınız Hazır - ${org.name}
...`; 
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500 max-w-[1600px] mx-auto">
      {/* PRINT STYLES */}
      <style>{`
        @media print {
          body * {
            visibility: hidden;
          }
          #receipt-content, #receipt-content * {
            visibility: visible;
          }
          #receipt-content {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            margin: 0;
            padding: 0;
            background: white;
            color: black;
          }
          .no-print {
            display: none !important;
          }
        }
      `}</style>

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tight">Müşteri Yönetimi</h1>
          <p className="text-slate-500 font-medium">Portföy Takibi & Finansal İşlemler</p>
        </div>
        <Button onClick={handleOpenCreate} className="rounded-xl px-6 h-12 font-bold shadow-xl shadow-blue-500/20 bg-blue-600 hover:bg-blue-700">
            <Plus size={18} className="mr-2" /> YENİ MÜŞTERİ EKLE
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {organizations.filter(o => o.id !== 'system').map(org => {
               const daysLeft = getDaysLeft(org.subscriptionEndDate);
               const balance = getOrganizationBalance(org.id);
               return (
                   <Card key={org.id} className="relative group hover:shadow-xl transition-all border-slate-200">
                       <div className="flex justify-between items-start mb-4">
                           <div className="flex items-center gap-3">
                                <div className="w-12 h-12 bg-slate-100 text-slate-600 rounded-xl flex items-center justify-center font-black text-lg">
                                    {org.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 className="font-bold text-slate-900">{org.name}</h3>
                                    <p className="text-xs text-slate-500 font-medium truncate max-w-[150px]">{org.contactPerson}</p>
                                </div>
                           </div>
                           <button onClick={() => handleOpenEdit(org)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                               <Edit size={18} />
                           </button>
                       </div>
                       
                       <div className="space-y-3">
                           <div className="flex justify-between items-center p-3 bg-slate-50 rounded-xl">
                               <span className="text-xs font-bold text-slate-500 uppercase">Bakiye Durumu</span>
                               <span className={`text-sm font-black ${balance > 0 ? 'text-red-500' : balance < 0 ? 'text-blue-600' : 'text-emerald-500'}`}>
                                   {balance > 0 ? `-${balance.toLocaleString()} (Borç)` : balance < 0 ? `+${Math.abs(balance).toLocaleString()} (Alacak)` : '0.00 (Temiz)'}
                               </span>
                           </div>
                           <div className="flex justify-between items-center px-1">
                               <div className="flex items-center gap-2 text-xs font-bold text-slate-500">
                                   <Calendar size={14} /> Lisans Bitiş
                               </div>
                               <span className={`text-xs font-black ${daysLeft && daysLeft <= 0 ? 'text-red-500' : 'text-slate-800'}`}>
                                   {org.subscriptionEndDate ? new Date(org.subscriptionEndDate).toLocaleDateString() : '-'}
                               </span>
                           </div>
                       </div>
                   </Card>
               );
          })}
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); resetForms(); }} title="Yeni Müşteri Kaydı">
          <div className="sticky top-[-1.5rem] md:top-[-2rem] -mx-6 md:-mx-8 px-6 md:px-8 pt-6 md:pt-8 pb-4 bg-white z-20 mb-2">
            <div className="flex gap-2 bg-slate-100 p-1 rounded-xl">
                <button onClick={() => setActiveTab('info')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'info' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>1. TİCARİ BİLGİLER</button>
                <button onClick={() => setActiveTab('admin')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === 'admin' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>2. YÖNETİCİ HESABI</button>
            </div>
          </div>
          <form onSubmit={handleSaveOrg} className="space-y-6 pb-4">
              {activeTab === 'info' ? (
                  <div className="space-y-4">
                      <Input label="MARKA / İŞLETME ADI" required value={orgForm.name} onChange={e => setOrgForm({...orgForm, name: e.target.value})} />
                      <Input label="YETKİLİ KİŞİ" value={orgForm.contactPerson} onChange={e => setOrgForm({...orgForm, contactPerson: e.target.value})} />
                      <div className="grid grid-cols-2 gap-4">
                          <Input label="TELEFON" value={orgForm.phone} onChange={e => setOrgForm({...orgForm, phone: e.target.value})} />
                          <Input label="LİSANS BİTİŞ" type="date" required value={orgForm.subscriptionEndDate} onChange={e => setOrgForm({...orgForm, subscriptionEndDate: e.target.value})} />
                      </div>
                      
                      <div className="p-4 bg-blue-50/50 border border-blue-100 rounded-2xl space-y-4">
                          <h4 className="text-xs font-black text-blue-900 uppercase">Finansal Başlangıç & İskonto</h4>
                          
                          <Input label="LİSTE FİYATI (TL)" type="number" required value={orgForm.licensePrice} onChange={e => setOrgForm({...orgForm, licensePrice: e.target.value})} />
                          
                          <div className="grid grid-cols-2 gap-4 items-end">
                              <div className="bg-white rounded-xl p-1 border border-slate-200 flex h-[50px]">
                                  <button type="button" onClick={() => setOrgForm({...orgForm, discountType: 'amount'})} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${orgForm.discountType === 'amount' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>TL İNDİRİM</button>
                                  <button type="button" onClick={() => setOrgForm({...orgForm, discountType: 'percentage'})} className={`flex-1 rounded-lg text-[10px] font-black transition-all ${orgForm.discountType === 'percentage' ? 'bg-slate-900 text-white' : 'text-slate-400'}`}>% YÜZDE</button>
                              </div>
                              <Input label="İNDİRİM DEĞERİ" type="number" value={orgForm.discountValue} onChange={e => setOrgForm({...orgForm, discountValue: e.target.value})} placeholder="0" />
                          </div>

                          <Input label="ALINAN PEŞİNAT (TL)" type="number" value={orgForm.paidAmount} onChange={e => setOrgForm({...orgForm, paidAmount: e.target.value})} placeholder="0" />
                          
                          {/* Live Calculation Box */}
                          <div className="bg-white rounded-xl p-3 shadow-sm border border-blue-100 grid grid-cols-2 gap-2">
                              <div className="col-span-2 flex justify-between p-2 bg-slate-50 rounded-lg border border-slate-100">
                                  <span className="text-xs font-bold text-slate-500">Liste Fiyatı</span>
                                  <span className="text-xs font-black text-slate-900">₺{financialSummary.price.toLocaleString()}</span>
                              </div>
                              {financialSummary.discountAmount > 0 && (
                                  <div className="col-span-2 flex justify-between p-2 bg-emerald-50 rounded-lg border border-emerald-100">
                                      <span className="text-xs font-bold text-emerald-600">Uygulanan İskonto</span>
                                      <span className="text-xs font-black text-emerald-700">-₺{financialSummary.discountAmount.toLocaleString()}</span>
                                  </div>
                              )}
                              <div className="col-span-2 flex justify-between p-2 bg-blue-50 rounded-lg border border-blue-100">
                                  <span className="text-xs font-bold text-blue-600 uppercase">NET BORÇLANMA</span>
                                  <span className="text-sm font-black text-blue-700">₺{financialSummary.netPrice.toLocaleString()}</span>
                              </div>
                              <div className="text-center p-2 bg-slate-50 rounded-lg border border-slate-100">
                                  <p className="text-[9px] font-bold text-slate-400 uppercase">Günlük (Net)</p>
                                  <p className="text-xs font-black text-slate-900">{financialSummary.durationDays > 0 ? `₺${financialSummary.dailyCost.toFixed(2)}` : '-'}</p>
                              </div>
                              <div className={`text-center p-2 rounded-lg border ${financialSummary.remaining > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
                                  <p className={`text-[9px] font-bold uppercase ${financialSummary.remaining > 0 ? 'text-red-400' : 'text-emerald-500'}`}>Kalan</p>
                                  <p className={`text-xs font-black ${financialSummary.remaining > 0 ? 'text-red-600' : 'text-emerald-600'}`}>₺{financialSummary.remaining.toLocaleString()}</p>
                              </div>
                          </div>
                      </div>
                      
                      <div className="sticky bottom-[-1.5rem] md:bottom-[-2rem] -mx-6 md:-mx-8 px-6 md:px-8 pb-6 md:pb-8 pt-4 bg-white border-t border-slate-100 mt-6 z-10">
                        <Button type="button" onClick={() => setActiveTab('admin')} className="w-full h-12 rounded-xl font-bold">DEVAM ET</Button>
                      </div>
                  </div>
              ) : (
                  <div className="space-y-4">
                      <Input label="YÖNETİCİ ADI" required value={adminForm.name} onChange={e => setAdminForm({...adminForm, name: e.target.value})} />
                      <div className="grid grid-cols-2 gap-4">
                        <Input label="KULLANICI ADI" required value={adminForm.username} onChange={e => setAdminForm({...adminForm, username: e.target.value})} />
                        <Input label="ŞİFRE" required value={adminForm.password} onChange={e => setAdminForm({...adminForm, password: e.target.value})} />
                      </div>
                      
                      <div className="sticky bottom-[-1.5rem] md:bottom-[-2rem] -mx-6 md:-mx-8 px-6 md:px-8 pb-6 md:pb-8 pt-4 bg-white border-t border-slate-100 mt-6 z-10">
                        <Button type="submit" className="w-full h-12 rounded-xl font-black bg-emerald-600 hover:bg-emerald-700">KAYDI TAMAMLA</Button>
                      </div>
                  </div>
              )}
          </form>
      </Modal>

      {/* SUCCESS MODAL (Updated: Without Login Info, just success message) */}
      <Modal isOpen={isSuccessModalOpen} onClose={() => setIsSuccessModalOpen(false)} title="Müşteri Başarıyla Oluşturuldu!">
          <div className="space-y-6">
              <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl flex gap-4 items-start">
                  <div className="bg-emerald-100 p-2 rounded-full"><CheckCircle2 className="text-emerald-600" /></div>
                  <div>
                      <h4 className="text-emerald-900 font-bold text-sm">İşlem Tamamlandı</h4>
                      <p className="text-emerald-700 text-xs mt-1">Müşteri sisteme eklendi ve cari hesabı açıldı.</p>
                  </div>
              </div>
              <Button variant="ghost" onClick={() => setIsSuccessModalOpen(false)} className="w-full text-xs text-slate-400">Pencereyi Kapat</Button>
          </div>
      </Modal>

      {/* DETAIL / EDIT MODAL */}
      <Modal isOpen={isDetailOpen} onClose={() => { setIsDetailOpen(false); resetForms(); }} title={selectedOrg?.name || 'Müşteri Detayı'}>
         {selectedOrg && (
             <div className="flex flex-col">
                 <div className="sticky top-[-1.5rem] md:top-[-2rem] -mx-6 md:-mx-8 px-6 md:px-8 pt-6 md:pt-8 pb-4 bg-white z-20 mb-2">
                    <div className="flex gap-2 bg-slate-100 p-1 rounded-xl shrink-0">
                        <button onClick={() => setDetailTab('profile')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${detailTab === 'profile' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>PROFİL & LİSANS</button>
                        <button onClick={() => setDetailTab('finance')} className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${detailTab === 'finance' ? 'bg-white shadow text-slate-900' : 'text-slate-500'}`}>FİNANS & CARİ</button>
                    </div>
                 </div>

                 <div className="flex-1">
                     {detailTab === 'profile' ? (
                         <form onSubmit={handleSaveOrg} className="space-y-4">
                             <Input label="MARKA ADI" value={orgForm.name} onChange={e => setOrgForm({...orgForm, name: e.target.value})} />
                             <Input label="TİCARİ UNVAN" value={orgForm.commercialTitle} onChange={e => setOrgForm({...orgForm, commercialTitle: e.target.value})} />
                             <div className="grid grid-cols-2 gap-4">
                                <Input label="VERGİ NO" value={orgForm.taxId} onChange={e => setOrgForm({...orgForm, taxId: e.target.value})} />
                                <Input label="VERGİ DAİRESİ" value={orgForm.taxOffice} onChange={e => setOrgForm({...orgForm, taxOffice: e.target.value})} />
                             </div>
                             <Input label="ADRES" value={orgForm.address} onChange={e => setOrgForm({...orgForm, address: e.target.value})} />
                             <div className="grid grid-cols-2 gap-4">
                                <Input label="YETKİLİ" value={orgForm.contactPerson} onChange={e => setOrgForm({...orgForm, contactPerson: e.target.value})} />
                                <Input label="TELEFON" value={orgForm.phone} onChange={e => setOrgForm({...orgForm, phone: e.target.value})} />
                             </div>
                             <div className="p-4 bg-amber-50 rounded-xl border border-amber-100 mt-4">
                                 <h4 className="text-xs font-black text-amber-800 uppercase mb-2">Lisans Yönetimi</h4>
                                 <div className="grid grid-cols-2 gap-4">
                                     <Input label="BİTİŞ TARİHİ" type="date" value={orgForm.subscriptionEndDate} onChange={e => setOrgForm({...orgForm, subscriptionEndDate: e.target.value})} />
                                     <Input label="LİSTE FİYATI" type="number" value={orgForm.licensePrice} onChange={e => setOrgForm({...orgForm, licensePrice: e.target.value})} />
                                 </div>
                             </div>
                             
                             <div className="sticky bottom-[-1.5rem] md:bottom-[-2rem] -mx-6 md:-mx-8 px-6 md:px-8 pb-6 md:pb-8 pt-4 bg-white border-t border-slate-100 mt-6 z-10 flex gap-3">
                                 <Button type="button" variant="ghost" className="flex-1 text-red-500 hover:bg-red-50" onClick={initiateDelete}><Trash2 size={16} className="mr-2" /> MÜŞTERİYİ SİL</Button>
                                 <Button type="submit" className="flex-[2]">GÜNCELLE</Button>
                             </div>
                         </form>
                     ) : (
                         <div className="space-y-6 pb-6">
                             {/* Balance Summary */}
                             <div className="bg-slate-900 text-white p-6 rounded-2xl flex justify-between items-center shadow-lg">
                                 <div>
                                     <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">GÜNCEL BAKİYE</p>
                                     <h3 className={`text-3xl font-black mt-1 ${getOrganizationBalance(selectedOrg.id) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                                         {getOrganizationBalance(selectedOrg.id) > 0 ? `-${getOrganizationBalance(selectedOrg.id).toLocaleString()} TL` : `+${Math.abs(getOrganizationBalance(selectedOrg.id)).toLocaleString()} TL`}
                                     </h3>
                                     <p className="text-[10px] text-slate-500 font-medium">
                                         {getOrganizationBalance(selectedOrg.id) > 0 ? 'Müşteri Borçlu' : getOrganizationBalance(selectedOrg.id) < 0 ? 'Müşteri Alacaklı (Fazla Ödeme)' : 'Hesap Denk'}
                                     </p>
                                 </div>
                             </div>

                             {/* Transaction Form */}
                             <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                                 <h4 className="text-xs font-black text-slate-900 uppercase mb-3">Yeni İşlem Ekle</h4>
                                 <form onSubmit={handleTransaction} className="space-y-3">
                                     <div className="flex gap-2">
                                         <button type="button" onClick={() => setTransactionForm({...transactionForm, type: 'invoice'})} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase border ${transactionForm.type === 'invoice' ? 'bg-red-500 text-white border-red-500' : 'bg-white text-slate-500 border-slate-200'}`}>Borç Ekle (Hizmet)</button>
                                         <button type="button" onClick={() => setTransactionForm({...transactionForm, type: 'payment'})} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase border ${transactionForm.type === 'payment' ? 'bg-emerald-500 text-white border-emerald-500' : 'bg-white text-slate-500 border-slate-200'}`}>Tahsilat Al</button>
                                         <button type="button" onClick={() => setTransactionForm({...transactionForm, type: 'refund'})} className={`flex-1 py-2 rounded-lg text-[10px] font-black uppercase border ${transactionForm.type === 'refund' ? 'bg-blue-500 text-white border-blue-500' : 'bg-white text-slate-500 border-slate-200'}`}>İade Yap</button>
                                     </div>
                                     <div className="flex gap-3">
                                         <Input className="flex-1" placeholder="Tutar" type="number" value={transactionForm.amount} onChange={e => setTransactionForm({...transactionForm, amount: e.target.value})} label="" />
                                         <Input className="flex-[2]" placeholder="Açıklama (Örn: Ek Sunucu Ücreti)" value={transactionForm.description} onChange={e => setTransactionForm({...transactionForm, description: e.target.value})} label="" />
                                         <Button type="submit" className="h-[50px] mt-[6px] w-12 flex items-center justify-center p-0 rounded-xl"><Plus /></Button>
                                     </div>
                                 </form>
                             </div>

                             {/* History List - ID Çakışmasını önleyen Key Kullanımı */}
                             <div className="space-y-3">
                                 <h4 className="text-xs font-black text-slate-400 uppercase ml-1">Hesap Hareketleri</h4>
                                 {saasTransactions
                                     .filter(t => t.organizationId === selectedOrg.id)
                                     .sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                                     .map(t => (
                                     <div key={t.id} className="flex justify-between items-center p-3 border-b border-slate-50 last:border-0 hover:bg-slate-50 transition-colors rounded-lg group relative">
                                         <div>
                                             <div className="flex items-center gap-2">
                                                 <span className={`w-2 h-2 rounded-full ${t.type === 'invoice' ? 'bg-red-500' : t.type === 'payment' ? 'bg-emerald-500' : 'bg-blue-500'}`}></span>
                                                 <p className="text-sm font-bold text-slate-800">{t.description}</p>
                                             </div>
                                             <p className="text-[10px] text-slate-400 font-mono mt-0.5">{new Date(t.date).toLocaleDateString()} • {t.processedBy}</p>
                                         </div>
                                         <div className="flex items-center gap-4">
                                             <span className={`text-sm font-black ${t.type === 'invoice' ? 'text-red-500' : t.type === 'payment' ? 'text-emerald-600' : 'text-blue-500'}`}>
                                                 {t.type === 'invoice' ? '+' : '-'}{t.amount.toLocaleString()} TL
                                             </span>
                                             
                                             {/* RECEIPT PRINT BUTTON */}
                                             <button onClick={() => handleOpenReceipt(t)} className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded transition-colors" title="Makbuz Yazdır">
                                                 <Printer size={16} />
                                             </button>

                                             {/* Silme İşlemi - Sadece bu ID'ye özgü */}
                                             <button onClick={() => { if(confirm('Bu kaydı silmek istiyor musunuz?')) deleteSaaSTransaction(t.id); }} className="text-slate-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                                                 <Trash2 size={14} />
                                             </button>
                                         </div>
                                     </div>
                                 ))}
                                 {saasTransactions.filter(t => t.organizationId === selectedOrg.id).length === 0 && (
                                     <p className="text-center text-xs text-slate-400 py-4">Henüz işlem yok.</p>
                                 )}
                             </div>
                         </div>
                     )}
                 </div>
             </div>
         )}
      </Modal>

      {/* DELETE CONFIRMATION MODAL */}
      <Modal isOpen={isDeleteConfirmOpen} onClose={() => setIsDeleteConfirmOpen(false)} title="Müşteriyi Sil">
          <div className="space-y-6">
              <div className="bg-red-50 p-4 rounded-2xl border border-red-100 flex items-start gap-4">
                  <AlertTriangle className="text-red-500 shrink-0" />
                  <div>
                      <h4 className="text-red-900 font-bold text-sm">Dikkat: Bu işlem geri alınamaz!</h4>
                      <p className="text-red-700 text-xs mt-1">Bu müşteriyi sildiğinizde, ona ait tüm etkinlikler, satışlar, kullanıcılar ve finansal kayıtlar kalıcı olarak silinecektir.</p>
                  </div>
              </div>
              
              <div className="space-y-2">
                  <label className="text-xs font-bold text-slate-700">Onaylamak için lütfen firmanın tam adını yazınız: <span className="font-black">"{selectedOrg?.name}"</span></label>
                  <Input label="" value={deleteConfirmationName} onChange={e => setDeleteConfirmationName(e.target.value)} placeholder={selectedOrg?.name} />
              </div>

              <Button 
                onClick={confirmDelete} 
                disabled={deleteConfirmationName !== selectedOrg?.name}
                className="w-full bg-red-600 hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                  MÜŞTERİYİ VE TÜM VERİLERİ SİL
              </Button>
          </div>
      </Modal>

      {/* RECEIPT / MAKBUZ MODAL */}
      <Modal isOpen={isReceiptOpen} onClose={() => setIsReceiptOpen(false)} title="Makbuz Önizleme">
          {receiptData && selectedOrg && (
              <div className="flex flex-col gap-6">
                  {/* PRINTABLE AREA */}
                  <div id="receipt-content" className="bg-white p-8 rounded-xl border border-slate-200 shadow-sm relative overflow-hidden">
                      <div className={`absolute top-0 left-0 w-full h-3 ${receiptData.type === 'payment' ? 'bg-emerald-500' : receiptData.type === 'invoice' ? 'bg-blue-600' : 'bg-red-500'}`}></div>
                      
                      {/* Header */}
                      <div className="flex justify-between items-start mb-8 pt-4">
                          <div>
                              <h2 className="text-2xl font-black text-slate-900 tracking-tight">BiletPro</h2>
                              <p className="text-xs text-slate-500 font-medium mt-1">Yazılım ve Teknoloji Hizmetleri</p>
                          </div>
                          <div className="text-right">
                              <h3 className={`text-lg font-black uppercase tracking-wider ${receiptData.type === 'payment' ? 'text-emerald-600' : receiptData.type === 'invoice' ? 'text-blue-600' : 'text-red-500'}`}>
                                  {receiptData.type === 'payment' ? 'TAHSİLAT MAKBUZU' : receiptData.type === 'invoice' ? 'HİZMET FATURASI' : 'İADE DEKONTU'}
                              </h3>
                              <p className="text-xs text-slate-400 font-bold mt-1">TARİH: {new Date(receiptData.date).toLocaleDateString()}</p>
                              <p className="text-[10px] text-slate-300 font-mono mt-0.5">REF: {receiptData.id.toUpperCase()}</p>
                          </div>
                      </div>

                      {/* Info Grid */}
                      <div className="grid grid-cols-2 gap-8 mb-8 border-b border-dashed border-slate-200 pb-8">
                          <div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">SAYIN / FİRMA</p>
                              <p className="font-bold text-slate-900 text-sm">{selectedOrg.name}</p>
                              <p className="text-xs text-slate-500">{selectedOrg.commercialTitle}</p>
                              <p className="text-xs text-slate-500 mt-1">{selectedOrg.taxId ? `VN: ${selectedOrg.taxId}` : ''} {selectedOrg.taxOffice ? `/ ${selectedOrg.taxOffice}` : ''}</p>
                              <p className="text-xs text-slate-500 mt-1 max-w-[200px]">{selectedOrg.address}</p>
                          </div>
                          <div className="text-right">
                              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">İŞLEM DETAYI</p>
                              <p className="font-bold text-slate-900 text-sm">{receiptData.description}</p>
                              <p className="text-xs text-slate-500 mt-1">İşlemi Yapan: {receiptData.processedBy}</p>
                          </div>
                      </div>

                      {/* Amount Section */}
                      <div className="bg-slate-50 p-6 rounded-xl flex justify-between items-center mb-12">
                          <span className="font-bold text-slate-600 text-sm">TOPLAM TUTAR</span>
                          <span className="text-3xl font-black text-slate-900">₺{receiptData.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2 })}</span>
                      </div>

                      {/* Signatures */}
                      <div className="flex justify-between items-end pb-8">
                          <div className="text-center">
                              <div className="h-16 w-32 border-b border-slate-300 mb-2"></div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">TESLİM EDEN (KAŞE/İMZA)</p>
                          </div>
                          <div className="text-center">
                              <div className="h-16 w-32 border-b border-slate-300 mb-2"></div>
                              <p className="text-[10px] font-bold text-slate-400 uppercase">TESLİM ALAN</p>
                          </div>
                      </div>

                      {/* Footer */}
                      <div className="text-center pt-6 border-t border-slate-100">
                          <p className="text-[9px] text-slate-400 font-medium">Bu belge BiletPro sistemi üzerinden elektronik olarak oluşturulmuştur. Geçerliliği sistem kayıtları ile teyit edilebilir.</p>
                      </div>
                  </div>

                  <div className="flex gap-3 no-print">
                      <Button variant="ghost" onClick={() => setIsReceiptOpen(false)} className="flex-1">Kapat</Button>
                      <Button onClick={handlePrint} className="flex-[2] flex items-center justify-center gap-2">
                          <Printer size={18} /> YAZDIR
                      </Button>
                  </div>
              </div>
          )}
      </Modal>
    </div>
  );
};
