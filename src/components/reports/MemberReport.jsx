import React from 'react';
import { formatCurrency, formatBalance } from '../../utils/currencyUtils';

export const MemberReport = ({ memberSummaries = [], costPerMeal = 0 }) => {
  const totalMealsAll = memberSummaries.reduce((sum, m) => sum + (m.totalMeal || 0), 0);
  const totalMealCostAll = memberSummaries.reduce((sum, m) => sum + (m.mealCost || 0), 0);
  const totalDepositsAll = memberSummaries.reduce((sum, m) => sum + (m.totalDeposit || 0), 0);
  const totalBalanceAll = memberSummaries.reduce((sum, m) => sum + (m.balance || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden print-break-inside-avoid">
      <div className="p-6 border-b border-slate-100">
        <span className="text-xs font-semibold uppercase tracking-wider text-emerald-600">
          Member Ledger
        </span>
        <h3 className="text-lg font-bold text-slate-900">
          Individual Member Financial Statement
        </h3>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-6">Member</th>
              <th className="py-3.5 px-4 text-center">Total Meals</th>
              <th className="py-3.5 px-4 text-right">Meal Cost ({formatCurrency(costPerMeal, true)}/meal)</th>
              <th className="py-3.5 px-4 text-right">Total Deposit</th>
              <th className="py-3.5 px-6 text-right">Balance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {memberSummaries.map((m) => {
              const isSurplus = m.balance >= 0;
              return (
                <tr key={m.memberId} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-slate-900">
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 text-xs font-bold flex items-center justify-center">
                        {m.memberName.charAt(0).toUpperCase()}
                      </div>
                      <span>{m.memberName}</span>
                    </div>
                  </td>
                  <td className="py-3.5 px-4 text-center font-bold text-slate-800">
                    {m.totalMeal}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                    {formatCurrency(m.mealCost)}
                  </td>
                  <td className="py-3.5 px-4 text-right font-medium text-slate-800">
                    {formatCurrency(m.totalDeposit)}
                  </td>
                  <td className="py-3.5 px-6 text-right font-bold">
                    <span
                      className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-bold ${
                        isSurplus
                          ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                          : 'bg-rose-50 text-rose-700 border border-rose-200'
                      }`}
                    >
                      {formatBalance(m.balance)}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-slate-100/80 font-bold text-slate-900 border-t-2 border-slate-300">
              <td className="py-3.5 px-6 text-xs uppercase tracking-wider text-slate-700">
                Grand Total
              </td>
              <td className="py-3.5 px-4 text-center font-extrabold text-slate-900">
                {totalMealsAll}
              </td>
              <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                {formatCurrency(totalMealCostAll)}
              </td>
              <td className="py-3.5 px-4 text-right font-extrabold text-slate-900">
                {formatCurrency(totalDepositsAll)}
              </td>
              <td className="py-3.5 px-6 text-right font-extrabold">
                <span
                  className={`inline-block px-2.5 py-0.5 rounded-lg text-xs font-extrabold ${
                    totalBalanceAll >= 0
                      ? 'bg-emerald-100 text-emerald-900'
                      : 'bg-rose-100 text-rose-900'
                  }`}
                >
                  {formatBalance(totalBalanceAll)}
                </span>
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
