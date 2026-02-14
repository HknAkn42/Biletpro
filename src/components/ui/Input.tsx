
import React from 'react';
import { LucideIcon } from 'lucide-react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  icon?: LucideIcon;
  error?: string;
}

export const Input: React.FC<InputProps> = ({ label, icon: Icon, error, className = '', ...props }) => {
  return (
    <div className="space-y-1.5 group">
      <label className="text-[10px] font-bold text-slate-400 uppercase tracking-wider ml-1 group-focus-within:text-blue-600 transition-colors">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-all duration-300">
            <Icon size={18} strokeWidth={2} />
          </div>
        )}
        <input
          {...props}
          className={`
            w-full bg-slate-50 border border-slate-200 rounded-xl py-3 
            ${Icon ? 'pl-11' : 'pl-4'} pr-4 
            text-slate-800 font-semibold placeholder:text-slate-300 placeholder:font-normal
            focus:bg-white focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 
            outline-none transition-all duration-300 shadow-sm hover:border-slate-300
            ${className}
          `}
        />
      </div>
      {error && <p className="text-red-500 text-[10px] font-bold ml-1">{error}</p>}
    </div>
  );
};
