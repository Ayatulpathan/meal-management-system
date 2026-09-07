import React from 'react';
import { Loader2 } from 'lucide-react';

export const Loader = ({ message = 'Loading...', fullScreen = false, className = '' }) => {
  if (fullScreen) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 gap-3">
        <Loader2 className="w-9 h-9 text-emerald-600 animate-spin" />
        <p className="text-sm font-medium text-slate-600 animate-pulse">{message}</p>
      </div>
    );
  }

  return (
    <div className={`flex flex-col items-center justify-center p-6 gap-2 text-slate-500 ${className}`}>
      <Loader2 className="w-6 h-6 text-emerald-600 animate-spin" />
      <span className="text-xs font-medium">{message}</span>
    </div>
  );
};
