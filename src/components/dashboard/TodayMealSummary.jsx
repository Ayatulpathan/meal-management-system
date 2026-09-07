import React from 'react';
import { Utensils, ShoppingCart, Clock } from 'lucide-react';
import { getTodayDayNumber, getTodayDateString, formatDateDisplay } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';

export const TodayMealSummary = ({ members = [], mealRecords = [], marketCosts = [] }) => {
  const todayDay = getTodayDayNumber();
  const todayDateStr = getTodayDateString();

  // Find today's meals for each active member
  const memberTodayMeals = members
    .filter(m => m.status === 'active')
    .map(member => {
      const record = mealRecords.find(r => r.memberId === member.id);
      const count = record?.meals?.[String(todayDay)] ?? 0;
      return {
        id: member.id,
        name: member.name,
        count,
      };
    });

  const todayTotalMeals = memberTodayMeals.reduce((sum, m) => sum + m.count, 0);

  // Find today's market expenses
  const todayMarketCosts = marketCosts.filter(c => c.date === todayDateStr);
  const todayTotalCost = todayMarketCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
            <Clock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-semibold text-slate-900">Today's Summary</h3>
            <p className="text-xs text-slate-500">
              Day {todayDay} ({formatDateDisplay(todayDateStr)})
            </p>
          </div>
        </div>
        <div className="text-right">
          <span className="text-xs text-slate-500 block">Today's Meals</span>
          <span className="text-lg font-bold text-emerald-600">{todayTotalMeals}</span>
        </div>
      </div>

      {/* Member-by-member today's meal badges */}
      <div className="mt-4 space-y-2.5">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Individual Meals
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-56 overflow-y-auto pr-1">
          {memberTodayMeals.length === 0 ? (
            <p className="text-xs text-slate-400 py-2">No active members found.</p>
          ) : (
            memberTodayMeals.map(m => (
              <div
                key={m.id}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-50 border border-slate-100"
              >
                <span className="text-sm font-medium text-slate-700 truncate mr-2">
                  {m.name}
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                    m.count === 2
                      ? 'bg-emerald-100 text-emerald-800'
                      : m.count === 1
                      ? 'bg-sky-100 text-sky-800'
                      : 'bg-slate-200 text-slate-600'
                  }`}
                >
                  {m.count} {m.count === 1 ? 'meal' : 'meals'}
                </span>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Today's Market Cost Section */}
      <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between bg-slate-50/50 p-3 rounded-xl">
        <div className="flex items-center gap-2 text-xs font-medium text-slate-600">
          <ShoppingCart className="w-4 h-4 text-slate-400" />
          <span>Today's Market Expense:</span>
        </div>
        <span className="text-sm font-bold text-slate-900">
          {formatCurrency(todayTotalCost)}
        </span>
      </div>
    </div>
  );
};
