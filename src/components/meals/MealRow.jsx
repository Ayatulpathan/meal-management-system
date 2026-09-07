import React from 'react';
import { MealCell } from './MealCell';

export const MealRow = ({
  member,
  daysList = [],
  mealRecord,
  isClosed = false,
  savingCell = null,
  onMealChange,
}) => {
  const memberMeals = mealRecord?.meals || {};
  const totalMeal = mealRecord?.totalMeal || 0;

  return (
    <tr className="hover:bg-slate-50/80 transition-colors border-b border-slate-100">
      {/* Sticky Left Column: Member Name */}
      <td className="sticky left-0 z-10 bg-white group-hover:bg-slate-50 py-2.5 px-3.5 border-r border-slate-200 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
        <div className="flex items-center gap-2.5 min-w-[130px] max-w-[160px]">
          <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center shrink-0">
            {member.name.charAt(0).toUpperCase()}
          </div>
          <div className="truncate">
            <span className="text-xs font-semibold text-slate-800 block truncate" title={member.name}>
              {member.name}
            </span>
          </div>
        </div>
      </td>

      {/* Dynamic Day Columns (1 to N days) */}
      {daysList.map((day) => {
        const val = memberMeals[String(day)] ?? 0;
        const isSaving = savingCell === `${member.id}-${day}`;
        return (
          <td key={day} className="p-0.5 text-center min-w-[36px]">
            <MealCell
              value={val}
              day={day}
              memberId={member.id}
              isClosed={isClosed}
              isSaving={isSaving}
              onChange={onMealChange}
            />
          </td>
        );
      })}

      {/* Sticky Right Column: Member Total */}
      <td className="sticky right-0 z-10 bg-slate-50/95 py-2.5 px-3 text-center border-l border-slate-200 shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)] min-w-[70px]">
        <span className="text-xs font-bold text-slate-900 bg-white px-2 py-1 rounded-md border border-slate-200 shadow-sm">
          {totalMeal}
        </span>
      </td>
    </tr>
  );
};
