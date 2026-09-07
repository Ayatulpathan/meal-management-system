import React from 'react';
import { Edit2, Trash2, ShoppingCart } from 'lucide-react';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDateDisplay } from '../../utils/dateUtils';

export const MarketCostTable = ({
  costs = [],
  totalCost = 0,
  isClosed = false,
  onEdit,
  onDelete,
  onAddCost,
}) => {
  if (costs.length === 0) {
    return (
      <EmptyState
        icon={ShoppingCart}
        title="No market expenses recorded"
        description="Record grocery purchases, bazaars, and daily market expenses for this month."
        actionLabel={isClosed ? null : 'Add Market Expense'}
        onAction={onAddCost}
      />
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm text-slate-600">
          <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wider text-slate-500 border-b border-slate-200">
            <tr>
              <th className="py-3.5 px-4 sm:px-6">Date</th>
              <th className="py-3.5 px-4">Description / Items</th>
              <th className="py-3.5 px-4 text-right">Amount</th>
              {!isClosed && <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {costs.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900 whitespace-nowrap">
                  {formatDateDisplay(item.date)}
                </td>
                <td className="py-3.5 px-4">
                  <p className="text-slate-800 font-medium">{item.description || 'Grocery expense'}</p>
                  <span className="text-[11px] text-slate-400">ID: {item.id}</span>
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-slate-900 whitespace-nowrap">
                  {formatCurrency(item.amount)}
                </td>
                {!isClosed && (
                  <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(item)}
                        title="Edit expense"
                        icon={Edit2}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(item)}
                        title="Delete expense"
                        icon={Trash2}
                        className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                      />
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200">
              <td colSpan={2} className="py-3.5 px-4 sm:px-6 text-sm uppercase tracking-wider text-slate-700">
                Total Market Cost
              </td>
              <td className="py-3.5 px-4 text-right text-base text-emerald-700 font-extrabold whitespace-nowrap">
                {formatCurrency(totalCost)}
              </td>
              {!isClosed && <td className="py-3.5 px-4 sm:px-6"></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
