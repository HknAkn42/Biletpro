
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { Modal } from '../components/ui/Modal';
import { Shield, Lock, Trash2, CheckSquare, Square, Plus } from 'lucide-react';
import { User as UserType, Permission } from '../types';

const PERMISSION_LABELS: Record<Permission, string> = {
  'VIEW_DASHBOARD': 'İstatistikleri Görüntüle',
  'MANAGE_EVENTS': 'Etkinlikleri Yönet',
  'VIEW_SALES': 'Masa Planını Görüntüle',
  'MAKE_SALES': 'Satış Yap / İptal Et',
  'VIEW_CUSTOMERS': 'Müşteri Listesi Görüntüle',
  'SCAN_TICKETS': 'Kapı Girişi (QR Okutma)',
  'MANAGE_STAFF': 'Personel Yönetimi',
  'MANAGE_ORGANIZATIONS': 'Şirket Yönetimi (SADECE SİZ)' // Bu sadece root'a görünür
};

export const Staff: React.FC = () => {
  const { users, addUser, deleteUser, user: currentUser } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Yetki Kontrolü
  if (!currentUser?.permissions.includes('MANAGE_STAFF')) {
    return (
        <div className="p-8 h-full flex flex-col items-center justify-center text-center">
            <div className="bg-slate-100 p-8 rounded-full mb-4">
                <Lock size={48} className="text-slate-400" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800">Erişim Kısıtlı</h2>
            <p className="text-slate-500 mt-2">Personel yönetimi yetkiniz bulunmuyor.</p>
        </div>
    );
  }

  const [newUser, setNewUser] = useState<{
    name: string;
    username: string;
    password: string;
    permissions: Permission[];
  }>({
    name: '',
    username: '',
    password: '',
    permissions: []
  });

  const togglePermission = (perm: Permission) => {
    setNewUser(prev => {
        const hasPerm = prev.permissions.includes(perm);
        return {
            ...prev,
            permissions: hasPerm 
                ? prev.permissions.filter(p => p !== perm) 
                : [...prev.permissions, perm]
        };
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const userToAdd: UserType = {
        id: `u-${Date.now()}`,
        organizationId: currentUser?.organizationId || '',
        name: newUser.name,
        username: newUser.username,
        password: newUser.password,
        role: newUser.permissions.includes('MANAGE_STAFF') ? 'admin' : 'staff',
        permissions: newUser.permissions
    };
    addUser(userToAdd);
    setIsModalOpen(false);
    setNewUser({ name: '', username: '', password: '', permissions: [] });
  };

  return (
    <div className="p-8 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Personel Yönetimi</h1>
          <p className="text-slate-500">Sistem kullanıcıları ve erişim yetkileri</p>
        </div>
        <Button onClick={() => setIsModalOpen(true)} className="flex items-center gap-2">
            <Plus size={18} /> Yeni Personel
        </Button>
      </div>

      <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-6">
        {users.map(u => (
            <Card key={u.id} className="relative group hover:shadow-lg transition-all border border-slate-200">
                <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-4">
                        <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg ${
                            u.role === 'admin' ? 'bg-indigo-600' : 'bg-blue-500'
                        }`}>
                            {u.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                            <h3 className="font-bold text-slate-900">{u.name}</h3>
                            <p className="text-xs text-slate-500 font-mono">@{u.username}</p>
                        </div>
                    </div>
                    {u.id !== currentUser.id && (
                        <button 
                            onClick={() => { if(confirm('Bu kullanıcı silinsin mi?')) deleteUser(u.id); }}
                            className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors"
                        >
                            <Trash2 size={18} />
                        </button>
                    )}
                </div>
                
                <div className="border-t border-slate-100 pt-4">
                    <p className="text-xs font-bold text-slate-400 uppercase mb-2 flex items-center gap-1">
                        <Shield size={12} /> Yetkiler
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {u.permissions.map(p => (
                            <span key={p} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded border border-slate-200">
                                {PERMISSION_LABELS[p]}
                            </span>
                        ))}
                    </div>
                </div>
            </Card>
        ))}
      </div>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Personel Ekle">
        <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-1">
                <label className="text-sm font-medium">Ad Soyad</label>
                <input required className="w-full border p-2 rounded-lg" value={newUser.name} onChange={e => setNewUser({...newUser, name: e.target.value})} />
            </div>
            <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                    <label className="text-sm font-medium">Kullanıcı Adı</label>
                    <input required className="w-full border p-2 rounded-lg" value={newUser.username} onChange={e => setNewUser({...newUser, username: e.target.value})} />
                </div>
                <div className="space-y-1">
                    <label className="text-sm font-medium">Şifre</label>
                    <input required type="text" className="w-full border p-2 rounded-lg" value={newUser.password} onChange={e => setNewUser({...newUser, password: e.target.value})} />
                </div>
            </div>

            <div className="pt-2">
                <label className="text-sm font-medium block mb-2">Erişim Yetkileri</label>
                <div className="space-y-2 max-h-60 overflow-y-auto border p-2 rounded-lg bg-slate-50">
                    {(Object.keys(PERMISSION_LABELS) as Permission[])
                    // Güvenlik: Eğer giriş yapan kullanıcı Super Admin DEĞİLSE, 'MANAGE_ORGANIZATIONS' yetkisini listede görmesin.
                    .filter(perm => currentUser?.role === 'super_admin' || perm !== 'MANAGE_ORGANIZATIONS')
                    .map(perm => (
                        <div 
                            key={perm} 
                            onClick={() => togglePermission(perm)}
                            className="flex items-center gap-3 p-2 rounded cursor-pointer hover:bg-white transition-colors"
                        >
                            {newUser.permissions.includes(perm) ? (
                                <CheckSquare size={20} className="text-blue-600" />
                            ) : (
                                <Square size={20} className="text-slate-400" />
                            )}
                            <span className="text-sm text-slate-700">{PERMISSION_LABELS[perm]}</span>
                        </div>
                    ))}
                </div>
            </div>

            <Button type="submit" className="w-full mt-4">Kullanıcıyı Oluştur</Button>
        </form>
      </Modal>
    </div>
  );
};
