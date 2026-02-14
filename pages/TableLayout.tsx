
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { Table, Category } from '../types';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Input } from '../components/ui/Input';
import { Trash2, Plus, Layers, Lock, Edit, CheckCircle2, Users, Tag, Hash, LayoutGrid, MoreHorizontal, Check, RefreshCw } from 'lucide-react';

const COLOR_PALETTE = [
  '#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#6366f1',
  '#14b8a6', '#f97316', '#84cc16', '#06b6d4', '#d946ef', '#f43f5e', '#64748b',
  '#a855f7', '#fb7185', '#2dd4bf', '#fbbf24', '#a3e635', '#94a3b8'
];

export const TableLayout: React.FC = () => {
  const { 
    tables, currentEvent,
    addCategory, updateCategory, deleteCategory,
    addBulkTables, addTable, deleteAllTables, deleteTable, updateTable
  } = useApp();

  const [toast, setToast] = useState<{message: string, type: 'success' | 'error'} | null>(null);
  const showToast = (message: string, type: 'success' | 'error' = 'success') => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 3000);
  };

  const eventTables = useMemo(() => tables.filter(t => t.eventId === currentEvent.id), [tables, currentEvent.id]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<'edit_table' | 'add_category' | 'edit_category' | 'bulk_add' | 'single_add'>('add_category');
  const [selectedTable, setSelectedTable] = useState<Table | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  
  const [categoryForm, setCategoryForm] = useState({ name: '', price: '', color: '#3b82f6' });
  const [tableForm, setTableForm] = useState({ number: '', capacity: 4, categoryId: '' });
  const [bulkForm, setBulkForm] = useState({ count: 10, categoryId: '', capacity: 4, prefix: 'Masa ', startNo: 1 });

  const getCategory = (catId: string) => currentEvent.categories.find(c => c.id === catId);

  // FIX: Global Numbering Logic (Across all categories)
  const getNextTableNumber = () => {
      let maxNum = 0;
      let lastPrefix = 'Masa ';
      
      // Tüm masaları tara ve en yüksek sayıyı bul
      eventTables.forEach(t => {
          // Sayıyı sondan yakala (örn: "VIP Masa 12" -> 12)
          const match = t.number.match(/(\d+)$/);
          if (match) {
              const num = parseInt(match[0], 10);
              if (num > maxNum) {
                  maxNum = num;
                  // Prefix'i de güncelle (örn: "A-" serisi gidiyorsa onu al)
                  lastPrefix = t.number.substring(0, t.number.lastIndexOf(match[0]));
              }
          }
      });
      
      // Hiç masa yoksa varsayılan döndür
      return { prefix: lastPrefix || 'Masa ', nextNum: maxNum + 1 };
  };

  const openSingleAdd = () => {
      if(currentEvent.categories.length===0) return alert('Önce en az bir kategori eklemelisiniz.');
      const next = getNextTableNumber();
      setTableForm({ number: `${next.prefix}${next.nextNum}`, capacity: 4, categoryId: currentEvent.categories[0]?.id || '' });
      setModalMode('single_add');
      setIsModalOpen(true);
  };

  const openBulkAdd = () => {
      if(currentEvent.categories.length===0) return alert('Önce en az bir kategori eklemelisiniz.');
      const next = getNextTableNumber();
      setBulkForm({ count: 10, categoryId: currentEvent.categories[0]?.id || '', capacity: 4, prefix: next.prefix, startNo: next.nextNum });
      setModalMode('bulk_add');
      setIsModalOpen(true);
  };

  const handleTableSelect = (table: Table) => {
      setSelectedTable(table);
      setTableForm({
          number: table.number,
          capacity: table.capacity,
          categoryId: table.categoryId
      });
      setModalMode('edit_table');
      setIsModalOpen(true);
  };

  const handleDeleteCategory = () => {
      if (!editingCategory) return;
      if (confirm(`"${editingCategory.name}" kategorisini silmek istediğinize emin misiniz?`)) {
          deleteCategory(editingCategory.id);
          setIsModalOpen(false);
          showToast('Kategori silindi');
      }
  };

  const handleUpdateTable = () => {
    if (!selectedTable) return;
    const cat = getCategory(tableForm.categoryId);
    const success = updateTable({
        ...selectedTable,
        number: tableForm.number,
        capacity: tableForm.capacity,
        categoryId: tableForm.categoryId,
        totalPrice: tableForm.capacity * (cat?.pricePerPerson || 0)
    });

    if (success) {
        showToast('Masa Güncellendi');
        setIsModalOpen(false);
    } else {
        showToast('Bu masa ismi zaten kullanımda!', 'error');
    }
  };

  return (
    <div className="h-full md:h-[calc(100vh-64px)] p-4 flex flex-col md:flex-row gap-5 bg-[#f8fafc] overflow-y-auto md:overflow-hidden">
      {/* Event Check */}
      {!currentEvent.id ? (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <Layers size={64} className="text-slate-300 mb-4 mx-auto" />
            <p className="text-lg font-bold text-slate-400 mb-2">Etkinlik Seçilmemiş</p>
            <p className="text-sm text-slate-300">Lütfen önce bir etkinlik seçin veya oluşturun.</p>
          </div>
        </div>
      ) : (
        <>
      {toast && (
          <div className={`fixed top-24 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-full shadow-2xl flex items-center gap-2 text-[11px] font-bold tracking-wide animate-in slide-in-from-top-4 fade-in duration-300 ${toast.type === 'error' ? 'bg-red-500 text-white' : 'bg-slate-900 text-white'}`}>
              <CheckCircle2 size={14} className={toast.type === 'error' ? 'text-white' : 'text-emerald-400'} /> {toast.message}
          </div>
      )}

      {/* Sidebar (Mobile: Top, Desktop: Left) */}
      <div className="w-full md:w-64 flex flex-col gap-3 shrink-0">
        <div className="grid grid-cols-2 gap-2">
            <Button 
              variant="primary" 
              className="rounded-xl h-10 text-[10px] font-black tracking-wider bg-slate-900 text-white shadow-lg shadow-slate-900/20 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={openSingleAdd}
              disabled={currentEvent.categories.length === 0}
            >
              <Plus size={12} className="mr-1.5" /> TEK EKLE
            </Button>
            <Button 
              variant="outline" 
              className="rounded-xl h-10 text-[10px] font-black tracking-wider bg-white border-slate-200 hover:border-blue-400 hover:text-blue-600 shadow-sm hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed" 
              onClick={openBulkAdd}
              disabled={currentEvent.categories.length === 0}
            >
              <Layers size={12} className="mr-1.5" /> TOPLU
            </Button>
        </div>

        <div className="bg-white border border-slate-200/60 shadow-sm rounded-2xl overflow-hidden flex flex-col max-h-64 md:max-h-full md:flex-1">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-50 bg-slate-50/50">
            <h3 className="font-bold text-slate-400 text-[10px] uppercase tracking-[0.15em]">Kategoriler</h3>
            <button onClick={() => { setCategoryForm({name:'', price:'', color: COLOR_PALETTE[0]}); setModalMode('add_category'); setIsModalOpen(true); }} className="w-6 h-6 flex items-center justify-center bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-600 hover:text-white transition-all"><Plus size={14} /></button>
          </div>
          <div className="p-2 space-y-1 overflow-y-auto flex-1 custom-scrollbar">
            {currentEvent.categories.length === 0 ? (
              <div className="p-4 text-center">
                <div className="w-8 h-8 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-2">
                  <Plus size={14} className="text-slate-400" />
                </div>
                <p className="text-xs font-bold text-slate-400 mb-1">Kategori Yok</p>
                <p className="text-[9px] text-slate-300">Masa eklemek için önce kategori oluşturun</p>
              </div>
            ) : (
              currentEvent.categories.map(cat => (
                <div key={cat.id} className="group flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-50 border border-transparent hover:border-slate-100 transition-all cursor-pointer" onClick={() => { setEditingCategory(cat); setCategoryForm({name:cat.name, price:cat.pricePerPerson.toString(), color:cat.color}); setModalMode('edit_category'); setIsModalOpen(true); }}>
                  <div className="flex items-center gap-3 overflow-hidden">
                    <div className="w-2 h-8 rounded-full shrink-0" style={{ backgroundColor: cat.color }} />
                    <div className="min-w-0">
                      <span className="text-xs font-bold text-slate-700 block truncate group-hover:text-slate-900 transition-colors">{cat.name}</span>
                      <span className="text-[10px] text-slate-400 font-semibold tracking-wide group-hover:text-blue-500 transition-colors">₺{cat.pricePerPerson}</span>
                    </div>
                  </div>
                  <MoreHorizontal size={14} className="text-slate-300 opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="flex-1 bg-white rounded-[1.5rem] p-6 overflow-y-auto shadow-sm border border-slate-200/60 custom-scrollbar relative min-h-[500px]">
        <div className="sticky top-0 bg-white/90 backdrop-blur-md z-30 flex items-center justify-between mb-6 pb-4 border-b border-slate-50">
            <div>
                <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
                    <LayoutGrid size={18} className="text-slate-400" /> Masa Planı
                </h2>
                <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mt-0.5 ml-0.5">{eventTables.length} MASA AKTİF</p>
            </div>
            {eventTables.length > 0 && (
                <button onClick={deleteAllTables} className="text-red-400 hover:text-red-600 text-[9px] font-black uppercase tracking-widest hover:bg-red-50 px-4 py-2 rounded-xl transition-all border border-transparent hover:border-red-100">
                    Tümünü Temizle
                </button>
            )}
        </div>

        {eventTables.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center opacity-40">
                <Layers size={64} className="text-slate-300 mb-4" />
                <p className="text-sm font-bold text-slate-400">Henüz masa eklenmemiş.</p>
                <p className="text-xs text-slate-300">Sol menüden tekli veya toplu ekleyebilirsiniz.</p>
            </div>
        ) : (
            <div className="grid grid-cols-2 xs:grid-cols-3 sm:grid-cols-4 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 2xl:grid-cols-7 gap-4 pb-20">
                {eventTables.map(table => {
                    const category = getCategory(table.categoryId);
                    const isSelected = selectedTable?.id === table.id;
                    
                    return (
                        <div 
                            key={table.id} 
                            onClick={() => handleTableSelect(table)} 
                            className={`
                                group relative p-4 rounded-2xl transition-all duration-300 cursor-pointer border flex flex-col justify-between min-h-[100px]
                                ${isSelected 
                                    ? 'bg-white shadow-[0_20px_40px_-15px_rgba(59,130,246,0.3)] border-blue-500 ring-4 ring-blue-500/10 scale-[1.08] z-20' 
                                    : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-lg hover:shadow-blue-500/5 hover:-translate-y-1 z-0'
                                }
                                ${table.status === 'sold' && !isSelected ? 'bg-slate-50 border-slate-100 opacity-70 grayscale-[0.5]' : ''}
                            `}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div className="w-2 h-2 rounded-full ring-2 ring-white shadow-sm" style={{ backgroundColor: category?.color || '#e2e8f0' }} />
                                {table.status === 'sold' && <div className="bg-red-50 p-1 rounded-md"><Lock size={10} className="text-red-500" /></div>}
                            </div>
                            
                            <h4 className={`font-bold text-slate-900 leading-tight mb-2 break-words line-clamp-2 ${isSelected ? 'text-sm' : 'text-xs'}`}>
                                {table.number}
                            </h4>
                            
                            <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                                <span className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">{table.capacity} KİŞİ</span>
                                {isSelected && <Edit size={10} className="text-blue-500" />}
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Düzenleme Paneli">
          <form onSubmit={(e) => {
              e.preventDefault();
              if (modalMode === 'bulk_add') {
                  const cat = getCategory(bulkForm.categoryId);
                  if(!cat) return;
                  const newT = [];
                  for(let i=0; i<bulkForm.count; i++) {
                      // Fix: StartNo + i mantığı
                      const currentNum = bulkForm.startNo + i;
                      // Context'teki generateId zaten kullanılacak, burada placeholder id veriyoruz
                      newT.push({
                          id: '', // Will be generated in Context
                          eventId: currentEvent.id, // CRITICAL FIX: Ensure eventId is passed
                          categoryId: bulkForm.categoryId, 
                          number: `${bulkForm.prefix}${currentNum}`, 
                          capacity: bulkForm.capacity, 
                          totalPrice: bulkForm.capacity * cat.pricePerPerson, 
                          status: 'available' 
                      });
                  }
                  const addedCount = addBulkTables(newT);
                  if (addedCount < bulkForm.count) {
                      showToast(`${addedCount} Masa eklendi. (${bulkForm.count - addedCount} çakışan isim atlandı)`, 'error');
                  } else {
                      showToast(`${addedCount} Masa Başarıyla Eklendi`);
                  }

              } else if (modalMode === 'single_add') {
                  const cat=getCategory(tableForm.categoryId);
                  if (!tableForm.categoryId) { showToast('Lütfen Kategori Seçiniz','error'); return; }
                  const success = addTable({ 
                      id: '', // Generated in Context
                      eventId: currentEvent.id, 
                      categoryId: tableForm.categoryId, 
                      number: tableForm.number, 
                      capacity: tableForm.capacity, 
                      totalPrice: tableForm.capacity * (cat?.pricePerPerson || 0), 
                      status: 'available' 
                  });
                  if(success) showToast('Masa Eklendi');
                  else showToast('Bu isimde bir masa zaten var!', 'error');

              } else if (modalMode === 'add_category') {
                  // Context ID generation is safer
                  addCategory({ id: '', eventId: currentEvent.id, name: categoryForm.name, pricePerPerson: parseFloat(categoryForm.price), color: categoryForm.color });
                  showToast('Kategori Eklendi');
              } else if (modalMode === 'edit_category' && editingCategory) {
                  updateCategory({ ...editingCategory, name: categoryForm.name, pricePerPerson: parseFloat(categoryForm.price), color: categoryForm.color });
                  showToast('Kategori Güncellendi');
              } else if (modalMode === 'edit_table' && selectedTable) {
                  handleUpdateTable();
              }
              if (modalMode !== 'edit_table' || !selectedTable) setIsModalOpen(false); 
          }} className="space-y-6">
              
              {/* EDIT TABLE MODE */}
              {modalMode === 'edit_table' && selectedTable && (
                  <div className="space-y-4">
                      <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100 mb-4">
                          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Masa Bilgileri</p>
                          <div className="grid grid-cols-2 gap-4">
                            <Input label="MASA ADI / NO" value={tableForm.number} onChange={e => setTableForm({...tableForm, number: e.target.value})} />
                            <Input label="KAPASİTE" type="number" value={tableForm.capacity} onChange={e => setTableForm({...tableForm, capacity: parseInt(e.target.value) || 1})} />
                          </div>
                          <div className="mt-4">
                            <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 block mb-1">Kategori</label>
                            <select className="w-full bg-white border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" value={tableForm.categoryId} onChange={e => setTableForm({...tableForm, categoryId: e.target.value})}>
                                {currentEvent.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                            </select>
                          </div>
                      </div>

                      <div className="flex gap-3">
                         <Button type="button" variant="danger" className="flex-1 rounded-xl text-xs font-bold" onClick={() => { deleteTable(selectedTable.id); setIsModalOpen(false); showToast('Masa Silindi'); }}>
                            <Trash2 size={16} className="mr-2" /> SİL
                        </Button>
                        <Button type="submit" className="flex-[2] rounded-xl font-bold text-xs h-12 shadow-lg shadow-blue-500/20">
                            DEĞİŞİKLİKLERİ KAYDET
                        </Button>
                      </div>
                  </div>
              )}

              {/* ADD/EDIT CATEGORY MODES */}
              {(modalMode === 'add_category' || modalMode === 'edit_category') && (
                  <>
                    <Input label="KATEGORİ ADI" value={categoryForm.name} onChange={e => setCategoryForm({...categoryForm, name: e.target.value})} placeholder="Örn: VIP Ön Masa" />
                    <Input label="KİŞİ BAŞI FİYAT" type="number" value={categoryForm.price} onChange={e => setCategoryForm({...categoryForm, price: e.target.value})} icon={Tag} />
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Renk Seçimi</label>
                        <div className="grid grid-cols-10 gap-2 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                            {COLOR_PALETTE.map(c => (
                                <button key={c} type="button" onClick={() => setCategoryForm({...categoryForm, color: c})} className={`w-6 h-6 rounded-full transition-all relative ${categoryForm.color===c ? 'ring-2 ring-offset-1 ring-slate-400 scale-110' : 'hover:scale-110'}`} style={{backgroundColor:c}}>
                                    {categoryForm.color === c && <Check size={12} className="text-white absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" strokeWidth={4} />}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="flex gap-3 pt-2">
                        {modalMode === 'edit_category' && editingCategory && (
                             <Button type="button" variant="danger" className="flex-1 rounded-xl text-xs font-bold" onClick={handleDeleteCategory}>SİL</Button>
                        )}
                        <Button type="submit" className="flex-[2] rounded-xl font-bold text-xs h-12 shadow-lg shadow-blue-500/20">KAYDET</Button>
                    </div>
                  </>
              )}

              {/* BULK ADD MODE */}
              {modalMode === 'bulk_add' && (
                  <>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="ÖN EK" value={bulkForm.prefix} onChange={e => setBulkForm({...bulkForm, prefix: e.target.value})} icon={Tag} placeholder="Örn: 'Masa ' (boşluklu)" />
                        <Input label="BAŞLANGIÇ NO" type="number" value={bulkForm.startNo} onChange={e => setBulkForm({...bulkForm, startNo: parseInt(e.target.value) || 1})} icon={Hash} />
                    </div>
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Kategori Seçimi</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500 transition-all" value={bulkForm.categoryId} onChange={e => setBulkForm({...bulkForm, categoryId: e.target.value})}>
                            {currentEvent.categories.map(c => <option key={c.id} value={c.id}>{c.name} - ₺{c.pricePerPerson}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <Input label="KAPASİTE" type="number" value={bulkForm.capacity} onChange={e => setBulkForm({...bulkForm, capacity: parseInt(e.target.value) || 1})} icon={Users} />
                        <Input label="ADET" type="number" value={bulkForm.count} onChange={e => setBulkForm({...bulkForm, count: parseInt(e.target.value) || 1})} icon={Layers} />
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold text-xs mt-2 shadow-lg shadow-blue-500/20">OLUŞTUR</Button>
                  </>
              )}

              {/* SINGLE ADD MODE */}
              {modalMode === 'single_add' && (
                 <>
                    <Input label="MASA ADI / NO" value={tableForm.number} onChange={e => setTableForm({...tableForm, number: e.target.value})} placeholder="Örn: A-1 veya Firma Adı" />
                    <Input label="KAPASİTE" type="number" value={tableForm.capacity} onChange={e => setTableForm({...tableForm, capacity: parseInt(e.target.value) || 4})} icon={Users} />
                    <div className="space-y-2">
                        <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1">Kategori</label>
                        <select className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs font-bold text-slate-700 outline-none focus:border-blue-500" value={tableForm.categoryId} onChange={e => setTableForm({...tableForm, categoryId: e.target.value})}>
                            <option value="">Seçiniz...</option>
                            {currentEvent.categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                        </select>
                    </div>
                    <Button type="submit" className="w-full h-12 rounded-xl font-bold text-xs mt-2">EKLE</Button>
                 </>
              )}
          </form>
      </Modal>
        </>
      )}
    </div>
  );
};
