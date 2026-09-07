import React from 'react';

export const MealSummary = ({
  daysList = [],
  dailyTotals = {},
  totalMeals = 0,
}) => {
  return (
    <tr className="bg-slate-100/90 font-bold border-t-2 border-slate-300 text-slate-800">
      {/* Sticky Left Column Header */}
      <td className="sticky left-0 z-10 bg-slate-100 py-3 px-3.5 border-r border-slate-200 text-xs uppercase tracking-wider text-slate-700 shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
        Daily Total
      </td>

      {/* Daily totals for each day */}
      {daysList.map((day) => {
        const count = dailyTotals[String(day)] || 0;
        return (
          <td key={day} className="p-1 text-center min-w-[36px]">
            <span
              className={`inline-block w-7 py-0.5 text-xs font-bold rounded ${
                count > 0 ? 'text-slate-800 bg-white/80 shadow-xs' : 'text-slate-400'
              }`}
            >
              {count}
            </span>
          </td>
        );
      })}

      {/* Grand Total Meals Column */}
      <td className="sticky right-0 z-10 bg-emerald-600 text-white py-3 px-3 text-center text-xs font-extrabold shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.1)] min-w-[70px]">
        {totalMeals}
      </td>
    </tr>
  );
};
