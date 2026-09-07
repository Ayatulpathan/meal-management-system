import React from 'react';
import { Edit2, Trash2, Wallet } from 'lucide-react';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDateDisplay } from '../../utils/dateUtils';

export const DepositTable = ({
  deposits = [],
  members = [],
  totalDeposits = 0,
  isClosed = false,
  onEdit,
  onDelete,
  onAddDeposit,
}) => {
  const memberMap = new Map(members.map(m => [m.id, m.name]));

  if (deposits.length === 0) {
    return (
      <EmptyState
        icon={Wallet}
        title="No deposits recorded for this month"
        description="Record advance deposits and payments made by members."
        actionLabel={isClosed ? null : 'Add Deposit'}
        onAction={onAddDeposit}
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
              <th className="py-3.5 px-4">Member</th>
              <th className="py-3.5 px-4">Note / Method</th>
              <th className="py-3.5 px-4 text-right">Amount</th>
              {!isClosed && <th className="py-3.5 px-4 sm:px-6 text-right">Actions</th>}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {deposits.map((item) => (
              <tr key={item.id} className="hover:bg-slate-50/70 transition-colors">
                <td className="py-3.5 px-4 sm:px-6 font-medium text-slate-900 whitespace-nowrap">
                  {formatDateDisplay(item.date)}
                </td>
                <td className="py-3.5 px-4 font-semibold text-slate-900">
                  <div className="flex items-center gap-2">
                    <div className="w-6 h-6 rounded-md bg-emerald-100 text-emerald-800 font-bold text-xs flex items-center justify-center">
                      {(memberMap.get(item.memberId) || 'M').charAt(0).toUpperCase()}
                    </div>
                    <span>{memberMap.get(item.memberId) || 'Unknown Member'}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-slate-600">
                  <span>{item.note || 'Advance payment'}</span>
                </td>
                <td className="py-3.5 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                  +{formatCurrency(item.amount)}
                </td>
                {!isClosed && (
                  <td className="py-3.5 px-4 sm:px-6 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-1.5">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onEdit(item)}
                        title="Edit deposit"
                        icon={Edit2}
                      />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onDelete(item)}
                        title="Delete deposit"
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
              <td colSpan={3} className="py-3.5 px-4 sm:px-6 text-sm uppercase tracking-wider text-slate-700">
                Total Deposit
              </td>
              <td className="py-3.5 px-4 text-right text-base text-emerald-700 font-extrabold whitespace-nowrap">
                {formatCurrency(totalDeposits)}
              </td>
              {!isClosed && <td className="py-3.5 px-4 sm:px-6"></td>}
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
};
