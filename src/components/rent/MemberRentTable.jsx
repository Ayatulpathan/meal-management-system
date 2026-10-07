import React, { useState } from 'react';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currencyUtils';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { Search, Users, PlusCircle, CheckCircle, AlertTriangle, XCircle, CreditCard } from 'lucide-react';

export const MemberRentTable = ({
  memberSummaries = [],
  utilitySharePerMember = 0,
  isAdmin = false,
  onRecordPayment,
  onConfigureRent,
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredMembers = memberSummaries.filter((m) =>
    m.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    m.room?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusBadge = (status) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-emerald-100 text-emerald-800">
            <CheckCircle className="w-3 h-3" /> Paid
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3 h-3" /> Partial
          </span>
        );
      case 'overpaid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-blue-100 text-blue-800">
            <CheckCircle className="w-3 h-3" /> Advance
          </span>
        );
      case 'unpaid':
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-rose-100 text-rose-800">
            <XCircle className="w-3 h-3" /> Due
          </span>
        );
    }
  };

  // Totals
  const totalSeatRent = memberSummaries.reduce((sum, m) => sum + (m.seatRent || 0), 0);
  const totalUtilityShare = memberSummaries.reduce((sum, m) => sum + (m.utilityShare || 0), 0);
  const totalDue = memberSummaries.reduce((sum, m) => sum + (m.totalDue || 0), 0);
  const totalPaid = memberSummaries.reduce((sum, m) => sum + (m.rentPaid || 0), 0);
  const totalDueRemaining = memberSummaries.reduce((sum, m) => sum + (m.dueRemaining || 0), 0);

  return (
    <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
      {/* Header & Controls */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Users className="w-5 h-5 text-primary-600" />
            Member Rent & Utility Ledger
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Individual seat rent + equal utility split ({formatCurrency(utilitySharePerMember)}/member)
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member or room..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-primary-500/20 focus:border-primary-500"
            />
          </div>

          {isAdmin && (
            <Button
              variant="outline"
              size="sm"
              onClick={onConfigureRent}
              className="text-xs"
            >
              Configure Rents
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {filteredMembers.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Member</th>
                <th className="py-3 px-4 text-center">Room</th>
                <th className="py-3 px-4 text-right">Seat Rent</th>
                <th className="py-3 px-4 text-right">Utility Share</th>
                <th className="py-3 px-4 text-right">Total Due</th>
                <th className="py-3 px-4 text-right">Paid</th>
                <th className="py-3 px-4 text-right">Balance Due</th>
                <th className="py-3 px-4 text-center">Status</th>
                {isAdmin && <th className="py-3 px-4 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredMembers.map((member) => {
                const isPaidFull = member.dueRemaining <= 0;
                return (
                  <tr
                    key={member.id}
                    className="hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-3 px-4 font-semibold text-slate-900">
                      <div>
                        <span>{member.name}</span>
                        {member.phone && (
                          <p className="text-[11px] text-slate-400 font-normal">{member.phone}</p>
                        )}
                      </div>
                    </td>
                    <td className="py-3 px-4 text-center text-slate-500">
                      {member.room ? (
                        <span className="inline-block px-2 py-0.5 rounded bg-slate-100 text-slate-700 font-medium">
                          {member.room}
                        </span>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-slate-700">
                      {formatCurrency(member.seatRent)}
                    </td>
                    <td className="py-3 px-4 text-right font-medium text-amber-700">
                      {formatCurrency(member.utilityShare)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(member.totalDue)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      {formatCurrency(member.rentPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      <span
                        className={
                          member.dueRemaining > 0
                            ? 'text-rose-600'
                            : member.dueRemaining < 0
                            ? 'text-blue-600'
                            : 'text-emerald-600'
                        }
                      >
                        {formatCurrency(member.dueRemaining)}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(member.status)}
                    </td>
                    {isAdmin && (
                      <td className="py-3 px-4 text-center">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => onRecordPayment(member)}
                          className="text-xs text-primary-600 hover:text-primary-700 hover:bg-primary-50 py-1 px-2.5 h-auto inline-flex items-center gap-1"
                        >
                          <CreditCard className="w-3 h-3" />
                          <span>Pay</span>
                        </Button>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="bg-slate-50 font-bold text-slate-900 border-t-2 border-slate-200 text-xs">
                <td className="py-3 px-4">Total ({filteredMembers.length} Members)</td>
                <td className="py-3 px-4 text-center">-</td>
                <td className="py-3 px-4 text-right">{formatCurrency(totalSeatRent)}</td>
                <td className="py-3 px-4 text-right text-amber-700">{formatCurrency(totalUtilityShare)}</td>
                <td className="py-3 px-4 text-right">{formatCurrency(totalDue)}</td>
                <td className="py-3 px-4 text-right text-emerald-600">{formatCurrency(totalPaid)}</td>
                <td className="py-3 px-4 text-right text-rose-600">{formatCurrency(totalDueRemaining)}</td>
                <td className="py-3 px-4 text-center">-</td>
                {isAdmin && <td className="py-3 px-4 text-center">-</td>}
              </tr>
            </tfoot>
          </table>
        </div>
      ) : (
        <div className="p-8">
          <EmptyState
            icon={Users}
            title="No member records found"
            message={searchTerm ? 'No members match your search criteria.' : 'Add active members to the mess to see rent calculations.'}
          />
        </div>
      )}
    </div>
  );
};
