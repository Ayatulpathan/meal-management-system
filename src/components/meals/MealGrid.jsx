import React from 'react';
import { MealRow } from './MealRow';
import { MealSummary } from './MealSummary';
import { getDayList } from '../../utils/dateUtils';
import { EmptyState } from '../common/EmptyState';
import { Users, Info } from 'lucide-react';

export const MealGrid = ({
  monthId,
  daysCount = 30,
  members = [],
  mealRecords = [],
  dailyTotals = {},
  totalMeals = 0,
  isClosed = false,
  savingCell = null,
  onMealChange,
  onAddMember,
}) => {
  const daysList = getDayList(monthId);

  // Map meal records by memberId for O(1) lookup
  const recordMap = new Map(mealRecords.map(r => [r.memberId, r]));

  if (members.length === 0) {
    return (
      <EmptyState
        icon={Users}
        title="No members available"
        description="Add members to start logging daily meals in the spreadsheet grid."
        actionLabel="Add Member"
        onAction={onAddMember}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      {/* Legend & Instructions Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3 bg-slate-50 border-b border-slate-200 text-xs">
        <div className="flex items-center gap-2 text-slate-600">
          <Info className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>Click any cell to cycle values: <strong>0 → 1 → 2 → 0</strong></span>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-slate-200 flex items-center justify-center text-[10px] text-slate-600 font-bold">0</span>
            <span className="text-slate-500">No meal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-sky-500 text-white flex items-center justify-center text-[10px] font-bold">1</span>
            <span className="text-slate-500">1 meal</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-4 h-4 rounded bg-emerald-500 text-white flex items-center justify-center text-[10px] font-bold">2</span>
            <span className="text-slate-500">2 meals</span>
          </div>
        </div>
      </div>

      {/* Spreadsheet Table Container with Sticky Horizontal & Vertical Elements */}
      <div className="overflow-x-auto custom-scrollbar flex-1 max-h-[70vh]">
        <table className="w-full border-collapse text-left select-none min-w-[650px]">
          <thead className="bg-slate-100 text-slate-600 text-xs font-semibold uppercase sticky top-0 z-20 shadow-sm">
            <tr className="border-b border-slate-200">
              {/* Sticky Top-Left Corner Header */}
              <th className="sticky left-0 top-0 z-30 bg-slate-100 py-3 px-3.5 border-r border-slate-200 text-slate-700 min-w-[130px] max-w-[160px] shadow-[2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                Member
              </th>

              {/* Day Headers (01, 02, ..., 31) */}
              {daysList.map((day) => (
                <th
                  key={day}
                  className="py-2.5 px-0.5 text-center font-bold text-slate-600 min-w-[36px]"
                >
                  <span className="text-[11px] block">{String(day).padStart(2, '0')}</span>
                </th>
              ))}

              {/* Sticky Top-Right Total Header */}
              <th className="sticky right-0 top-0 z-30 bg-slate-100 py-3 px-3 text-center border-l border-slate-200 text-slate-800 min-w-[70px] shadow-[-2px_0_5px_-2px_rgba(0,0,0,0.05)]">
                Total
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-slate-100 bg-white">
            {members.map((member) => (
              <MealRow
                key={member.id}
                member={member}
                daysList={daysList}
                mealRecord={recordMap.get(member.id)}
                isClosed={isClosed}
                savingCell={savingCell}
                onMealChange={onMealChange}
              />
            ))}
          </tbody>

          <tfoot>
            <MealSummary
              daysList={daysList}
              dailyTotals={dailyTotals}
              totalMeals={totalMeals}
            />
          </tfoot>
        </table>
      </div>
    </div>
  );
};
