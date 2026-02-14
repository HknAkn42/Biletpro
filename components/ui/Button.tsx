import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'success';
  size?: 'sm' | 'md' | 'lg';
}

export const Button: React.FC<ButtonProps> = ({ 
  variant = 'primary', 
  size = 'md', 
  children, 
  className = '',
  ...props 
}) => {
  const baseStyles = "rounded-xl font-medium transition-all focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-blue-600 hover:bg-blue-700 text-white focus:ring-blue-500 shadow-md hover:shadow-lg",
    secondary: "bg-amber-500 hover:bg-amber-600 text-white focus:ring-amber-500 shadow-md",
    success: "bg-emerald-500 hover:bg-emerald-600 text-white focus:ring-emerald-500 shadow-md",
    danger: "bg-red-500 hover:bg-red-600 text-white focus:ring-red-500 shadow-md",
    outline: "border-2 border-blue-500 text-blue-600 hover:bg-blue-50",
    ghost: "text-slate-600 hover:bg-slate-100"
  };
  
  const sizes = {
    sm: "px-3 py-1.5 text-sm",
    md: "px-5 py-2.5",
    lg: "px-8 py-3.5 text-lg"
  };
  
  return (
    <button 
      className={`${baseStyles} ${variants[variant]} ${sizes[size]} ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};