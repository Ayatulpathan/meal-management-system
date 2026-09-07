import React from 'react';
import { Loader2 } from 'lucide-react';

export const MealCell = ({
  value = 0,
  day,
  memberId,
  canEdit = true,
  isClosed = false,
  isSaving = false,
  onChange,
}) => {
  const currentVal = Number(value) || 0;

  const cycleNext = () => {
    if (isClosed || isSaving || !canEdit) return;
    const nextVal = (currentVal + 1) % 11; // 0 -> 1 -> 2 -> ... -> 10 -> 0
    onChange(memberId, day, nextVal);
  };

  const getBadgeStyle = (val) => {
    if (val === 0) return 'bg-slate-100 text-slate-400 hover:bg-slate-200 hover:text-slate-700';
    if (val === 1) return 'bg-sky-500 text-white font-bold shadow-sm shadow-sky-500/20';
    if (val === 2) return 'bg-emerald-500 text-white font-bold shadow-sm shadow-emerald-500/20';
    if (val === 3) return 'bg-teal-600 text-white font-bold shadow-sm shadow-teal-600/20';
    if (val === 4) return 'bg-indigo-600 text-white font-bold shadow-sm shadow-indigo-600/20';
    if (val === 5) return 'bg-violet-600 text-white font-bold shadow-sm shadow-violet-600/20';
    if (val <= 7) return 'bg-amber-600 text-white font-bold shadow-sm shadow-amber-600/20';
    return 'bg-rose-600 text-white font-extrabold shadow-sm shadow-rose-600/20';
  };

  const isEditable = canEdit && !isClosed;

  return (
    <div className="flex items-center justify-center p-0.5">
      {!isEditable ? (
        <span
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs font-semibold select-none ${
            currentVal > 0 ? getBadgeStyle(currentVal) : 'bg-slate-100 text-slate-400'
          }`}
          title={!canEdit ? 'Only you or an admin can edit your own meals' : 'Month is closed'}
        >
          {currentVal}
        </span>
      ) : (
        <button
          type="button"
          onClick={cycleNext}
          disabled={isSaving}
          title={`Day ${day}: Tap to cycle (0 to 10) | Current: ${currentVal}`}
          className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs transition-all duration-150 transform active:scale-90 select-none ${getBadgeStyle(
            currentVal
          )} ${isSaving ? 'opacity-50 cursor-wait' : 'cursor-pointer hover:ring-2 hover:ring-emerald-400/50'}`}
        >
          {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : currentVal}
        </button>
      )}
    </div>
  );
};
