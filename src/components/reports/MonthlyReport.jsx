import React from 'react';
import { formatCurrency } from '../../utils/currencyUtils';

export const MonthlyReport = ({ summary, monthName }) => {
  const {
    totalMembers = 0,
    totalMeals = 0,
    totalMarketCost = 0,
    costPerMeal = 0,
    totalDeposits = 0,
  } = summary || {};

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6 print-break-inside-avoid">
      <div className="border-b border-slate-200 pb-4 mb-4">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
          Executive Overview
        </span>
        <h3 className="text-lg font-bold text-slate-900">
          Monthly Summary — {monthName}
        </h3>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium block">Total Members</span>
          <span className="text-xl font-bold text-slate-800 mt-1 block">{totalMembers}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium block">Total Meals</span>
          <span className="text-xl font-bold text-slate-800 mt-1 block">{totalMeals}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium block">Market Cost</span>
          <span className="text-xl font-bold text-slate-800 mt-1 block">{formatCurrency(totalMarketCost)}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
          <span className="text-xs text-emerald-700 font-semibold block">Cost Per Meal</span>
          <span className="text-xl font-extrabold text-emerald-800 mt-1 block">{formatCurrency(costPerMeal, true)}</span>
        </div>

        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
          <span className="text-xs text-slate-500 font-medium block">Total Deposits</span>
          <span className="text-xl font-bold text-slate-800 mt-1 block">{formatCurrency(totalDeposits)}</span>
        </div>
      </div>
    </div>
  );
};
