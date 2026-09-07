import React from 'react';
import { Loader2 } from 'lucide-react';

export const MealCell = ({
  value = 0,
  day,
  memberId,
  isClosed = false,
  isSaving = false,
  onChange,
}) => {
  const currentVal = Number(value) || 0;

  const cycleNext = () => {
    if (isClosed || isSaving) return;
    const nextVal = (currentVal + 1) % 3; // 0 -> 1 -> 2 -> 0
    onChange(memberId, day, nextVal);
  };

  const getStyle = (val) => {
    if (val === 2) return 'bg-emerald-500 text-white font-bold shadow-sm shadow-emerald-500/30';
    if (val === 1) return 'bg-sky-500 text-white font-bold shadow-sm shadow-sky-500/30';
    return 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700';
  };

  return (
    <div className="flex items-center justify-center p-1">
      {isClosed ? (
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold select-none ${
            currentVal === 2
              ? 'bg-emerald-100 text-emerald-800'
              : currentVal === 1
              ? 'bg-sky-100 text-sky-800'
              : 'bg-slate-100 text-slate-400'
          }`}
        >
          {currentVal}
        </span>
      ) : (
        <button
          type="button"
          onClick={cycleNext}
          disabled={isSaving}
          title={`Day ${day}: Click to toggle (Current: ${currentVal})`}
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-150 transform active:scale-90 select-none ${getStyle(
            currentVal
          )} ${isSaving ? 'opacity-50 cursor-wait' : 'cursor-pointer'}`}
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : currentVal}
        </button>
      )}
    </div>
  );
};
