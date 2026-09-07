import React from 'react';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDateDisplay } from '../../utils/dateUtils';

export const FinancialReport = ({ marketCosts = [], deposits = [], members = [] }) => {
  const memberMap = new Map(members.map(m => [m.id, m.name]));
  const totalMarketCost = marketCosts.reduce((sum, c) => sum + (Number(c.amount) || 0), 0);
  const totalDeposits = deposits.reduce((sum, d) => sum + (Number(d.amount) || 0), 0);

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 print-break-inside-avoid">
      {/* Market Cost Ledger Report */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Expenditure</span>
            <h4 className="text-base font-bold text-slate-900">Market Cost Report</h4>
          </div>
          <span className="text-sm font-bold text-slate-900 bg-slate-100 px-3 py-1 rounded-lg">
            {formatCurrency(totalMarketCost)}
          </span>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-3">Description</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {marketCosts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-400">No market records</td>
                </tr>
              ) : (
                marketCosts.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-4 whitespace-nowrap font-medium text-slate-700">{formatDateDisplay(item.date)}</td>
                    <td className="py-2.5 px-3 text-slate-800">{item.description || 'Grocery'}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">{formatCurrency(item.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deposit Ledger Report */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm overflow-hidden flex flex-col">
        <div className="p-5 border-b border-slate-100 flex items-center justify-between">
          <div>
            <span className="text-xs font-semibold uppercase tracking-wider text-slate-500">Collections</span>
            <h4 className="text-base font-bold text-slate-900">Deposit Report</h4>
          </div>
          <span className="text-sm font-bold text-emerald-700 bg-emerald-50 px-3 py-1 rounded-lg">
            {formatCurrency(totalDeposits)}
          </span>
        </div>
        <div className="overflow-x-auto flex-1">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-50 text-slate-500 uppercase border-b border-slate-200 font-semibold">
              <tr>
                <th className="py-2.5 px-4">Date</th>
                <th className="py-2.5 px-3">Member</th>
                <th className="py-2.5 px-3">Note</th>
                <th className="py-2.5 px-4 text-right">Amount</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {deposits.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-4 text-center text-slate-400">No deposit records</td>
                </tr>
              ) : (
                deposits.map((item) => (
                  <tr key={item.id}>
                    <td className="py-2.5 px-4 whitespace-nowrap font-medium text-slate-700">{formatDateDisplay(item.date)}</td>
                    <td className="py-2.5 px-3 font-semibold text-slate-900">{memberMap.get(item.memberId) || 'Member'}</td>
                    <td className="py-2.5 px-3 text-slate-500">{item.note || 'Cash'}</td>
                    <td className="py-2.5 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">+{formatCurrency(item.amount)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
