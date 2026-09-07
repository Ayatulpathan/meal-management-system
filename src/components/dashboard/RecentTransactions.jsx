import React from 'react';
import { ShoppingCart, Wallet, ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';

export const RecentTransactions = ({ marketCosts = [], deposits = [], members = [] }) => {
  const memberMap = new Map(members.map(m => [m.id, m.name]));

  // Combine and sort market expenses and deposits
  const combined = [
    ...marketCosts.map(c => ({
      id: `cost_${c.id}`,
      type: 'cost',
      title: c.description || 'Grocery & Market Expense',
      date: c.date,
      amount: c.amount,
      createdAt: c.createdAt,
    })),
    ...deposits.map(d => ({
      id: `dep_${d.id}`,
      type: 'deposit',
      title: `Deposit by ${memberMap.get(d.memberId) || 'Member'}`,
      subtitle: d.note,
      date: d.date,
      amount: d.amount,
      createdAt: d.createdAt,
    })),
  ].sort((a, b) => {
    // Sort by date desc
    const dateComp = (b.date || '').localeCompare(a.date || '');
    if (dateComp !== 0) return dateComp;
    return (b.createdAt || '').localeCompare(a.createdAt || '');
  });

  const recentItems = combined.slice(0, 6);

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
      <div className="flex items-center justify-between pb-4 border-b border-slate-100">
        <div>
          <h3 className="text-base font-semibold text-slate-900">Recent Transactions</h3>
          <p className="text-xs text-slate-500">Latest deposits and grocery expenses</p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-slate-100 text-slate-600">
          {combined.length} Total
        </span>
      </div>

      <div className="mt-4 divide-y divide-slate-100 max-h-80 overflow-y-auto">
        {recentItems.length === 0 ? (
          <p className="text-xs text-slate-400 py-6 text-center">No transactions recorded yet.</p>
        ) : (
          recentItems.map((item) => (
            <div key={item.id} className="py-3 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <div
                  className={`p-2 rounded-xl shrink-0 ${
                    item.type === 'deposit'
                      ? 'bg-emerald-50 text-emerald-600'
                      : 'bg-amber-50 text-amber-600'
                  }`}
                >
                  {item.type === 'deposit' ? (
                    <ArrowDownRight className="w-4 h-4" />
                  ) : (
                    <ArrowUpRight className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-slate-800 truncate">{item.title}</p>
                  <p className="text-xs text-slate-400">{formatDateDisplay(item.date)}</p>
                </div>
              </div>
              <div className="text-right shrink-0">
                <span
                  className={`text-sm font-bold ${
                    item.type === 'deposit' ? 'text-emerald-600' : 'text-slate-800'
                  }`}
                >
                  {item.type === 'deposit' ? '+' : '-'}
                  {formatCurrency(item.amount)}
                </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};
