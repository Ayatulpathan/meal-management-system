import React from 'react';
import { Loader2 } from 'lucide-react';

const variants = {
  primary:
    'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-xs hover:shadow-glow-primary focus:ring-emerald-500/30 border border-emerald-500/20 active:scale-[0.98]',
  secondary:
    'bg-white hover:bg-slate-50 text-slate-700 border border-slate-200/90 shadow-xs hover:border-slate-300 focus:ring-slate-300 active:scale-[0.98]',
  danger:
    'bg-gradient-to-r from-rose-600 to-rose-700 hover:from-rose-500 hover:to-rose-600 text-white shadow-xs hover:shadow-rose-500/20 focus:ring-rose-500/30 border border-rose-500/20 active:scale-[0.98]',
  outline:
    'bg-white/60 hover:bg-slate-100/80 text-slate-700 border border-slate-200/90 hover:border-slate-300 focus:ring-slate-300 active:scale-[0.98]',
  ghost:
    'bg-transparent hover:bg-slate-100/80 text-slate-600 hover:text-slate-900 focus:ring-slate-200 active:scale-[0.98]',
  success:
    'bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white focus:ring-emerald-400 active:scale-[0.98]',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs font-semibold rounded-xl gap-1.5',
  md: 'px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl gap-2',
  lg: 'px-5 py-2.5 text-sm sm:text-base font-bold rounded-2xl gap-2.5',
  icon: 'p-2 rounded-xl',
};

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  type = 'button',
  loading = false,
  disabled = false,
  icon: Icon,
  className = '',
  onClick,
  ...props
}) => {
  const variantStyles = variants[variant] || variants.primary;
  const sizeStyles = sizes[size] || sizes.md;

  return (
    <button
      type={type}
      disabled={disabled || loading}
      onClick={onClick}
      className={`inline-flex items-center justify-center font-medium select-none cursor-pointer transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-1 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none ${variantStyles} ${sizeStyles} ${className}`}
      {...props}
    >
      {loading ? (
        <Loader2 className="w-4 h-4 animate-spin shrink-0" />
      ) : Icon ? (
        <Icon className="w-4 h-4 shrink-0" />
      ) : null}
      {children}
    </button>
  );
};
