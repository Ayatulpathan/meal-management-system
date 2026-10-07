import React, { useState } from 'react';
import { formatCurrency } from '../../utils/currencyUtils';
import { formatDate } from '../../utils/dateUtils';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import {
  Wallet,
  Plus,
  Edit2,
  Trash,
  Search,
  CheckCircle,
  CreditCard,
} from 'lucide-react';

export const RentPaymentList = ({
  payments = [],
  isAdmin = false,
  isClosed = false,
  onAddPayment,
  onEditPayment,
  onDeletePayment,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredPayments = payments.filter((p) =>
    p.memberName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.paymentMethod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    p.note?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalCollected = filteredPayments.reduce((sum, p) => sum + (Number(p.amount) || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Wallet className="w-5 h-5 text-emerald-600" />
            Rent Payment History
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Total payments collected: <span className="font-semibold text-emerald-600">{formatCurrency(totalCollected)}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member or payment method..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          {isAdmin && !isClosed && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddPayment}
              className="text-xs inline-flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </Button>
          )}
        </div>
      </div>

      {/* Payment Table */}
      {filteredPayments.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4 text-right">Amount</th>
                <th className="py-3 px-4 text-center">Method</th>
                <th className="py-3 px-4">Note / TrxID</th>
                <th className="py-3 px-4">Recorded By</th>
                {isAdmin && !isClosed && <th className="py-3 px-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredPayments.map((payment) => (
                <tr key={payment.id} className="hover:bg-slate-50/60 transition-colors">
                  <td className="py-3 px-4 whitespace-nowrap text-slate-500">
                    {formatDate(payment.date)}
                  </td>
                  <td className="py-3 px-4 font-semibold text-slate-900">
                    {payment.memberName}
                  </td>
                  <td className="py-3 px-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                    {formatCurrency(payment.amount)}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-medium bg-slate-100 text-slate-700">
                      {payment.paymentMethod || 'Cash'}
                    </span>
                  </td>
                  <td className="py-3 px-4 text-slate-500 max-w-xs truncate">
                    {payment.note || '-'}
                  </td>
                  <td className="py-3 px-4 text-slate-500 whitespace-nowrap">
                    {payment.recordedBy || 'Admin'}
                  </td>
                  {isAdmin && !isClosed && (
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1">
                        <button
                          onClick={() => onEditPayment(payment)}
                          className="p-1 rounded hover:text-primary-600 hover:bg-primary-50 text-slate-400 transition-colors"
                          title="Edit Payment"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => onDeletePayment(payment)}
                          className="p-1 rounded hover:text-rose-600 hover:bg-rose-50 text-slate-400 transition-colors"
                          title="Delete Payment"
                        >
                          <Trash className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200 text-xs">
                <td className="py-3 px-4">Total ({filteredPayments.length} Transactions)</td>
                <td className="py-3 px-4">-</td>
                <td className="py-3 px-4 text-right text-emerald-600">{formatCurrency(totalCollected)}</td>
                <td className="py-3 px-4 text-center">-</td>
                <td className="py-3 px-4">-</td>
                <td className="py-3 px-4">-</td>
                {isAdmin && !isClosed && <td className="py-3 px-4 text-center">-</td>}
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="p-8">
          <EmptyState
            icon={Wallet}
            title="No rent payments recorded"
            message={searchTerm ? 'No payments match your search criteria.' : 'Record rent and utility collections from members.'}
            action={
              isAdmin && !isClosed ? (
                <Button variant="primary" size="sm" onClick={onAddPayment}>
                  <Plus className="w-4 h-4 mr-1.5" />
                  Record First Payment
                </Button>
              ) : null
            }
          />
        </div>
      )}
    </div>
  );
};
