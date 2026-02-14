
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { useNavigate } from 'react-router-dom';
import { Ticket, Lock, User, Code2 } from 'lucide-react';

export const Login: React.FC = () => {
  const { login } = useApp();
  const navigate = useNavigate();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const success = login(username, password);
    if (success) {
        navigate('/');
    } else {
        setError('Hatalı kullanıcı adı veya şifre!');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0">
            <div className="absolute top-[-10%] left-[-10%] w-[500px] h-[500px] bg-blue-600/30 rounded-full blur-[100px]"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[500px] h-[500px] bg-purple-600/30 rounded-full blur-[100px]"></div>
        </div>

        <div className="bg-white/10 backdrop-blur-xl border border-white/20 p-10 rounded-[3rem] w-full max-w-md shadow-2xl relative z-10 animate-in fade-in zoom-in-95 duration-500">
            <div className="flex justify-center mb-8">
                <div className="bg-blue-600 p-4 rounded-3xl shadow-2xl shadow-blue-500/50">
                    <Ticket size={48} className="text-white" />
                </div>
            </div>
            
            <h2 className="text-4xl font-black text-center text-white mb-2 tracking-tight">BiletPro</h2>
            <p className="text-slate-400 text-center mb-10 font-bold uppercase text-[10px] tracking-widest">Yönetim Paneline Giriş Yap</p>

            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Kullanıcı Adı</label>
                    <div className="relative">
                        <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="text"
                            required
                            placeholder="Kullanıcı adınız"
                            className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </div>
                </div>

                <div className="space-y-2">
                    <label className="text-[11px] font-black text-slate-400 uppercase tracking-widest ml-1">Güvenlik Şifresi</label>
                    <div className="relative">
                        <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                        <input 
                            type="password"
                            required
                            placeholder="••••••"
                            className="w-full pl-12 pr-4 py-4 bg-slate-800/50 border-2 border-slate-700/50 rounded-2xl text-white placeholder-slate-600 focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all font-bold"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </div>
                </div>

                {error && (
                    <div className="p-4 bg-red-500/10 border-2 border-red-500/20 rounded-2xl text-red-400 text-xs font-black text-center animate-shake">
                        {error}
                    </div>
                )}

                <button 
                    type="submit" 
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-2xl shadow-blue-600/30 transition-all active:scale-95 uppercase tracking-widest text-sm h-16"
                >
                    OTURUMU AÇ
                </button>
            </form>
        </div>

        {/* --- HAKAN AKIN FOOTER SIGNATURE --- */}
        <div className="absolute bottom-6 left-0 w-full text-center z-0">
             <div className="inline-flex items-center gap-2 opacity-20 hover:opacity-60 transition-opacity duration-500 select-none">
                 <Code2 size={12} className="text-white" />
                 <span className="text-[10px] text-white font-mono tracking-[0.2em] font-medium">DESIGNED & DEVELOPED BY HAKAN AKIN</span>
             </div>
        </div>
    </div>
  );
};
