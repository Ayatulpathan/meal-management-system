import React, { useState } from 'react';
import { formatCurrency, CURRENCY_SYMBOL } from '../../utils/currencyUtils';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import { Search, Users, PlusCircle, CheckCircle, AlertTriangle, XCircle, CreditCard, Coins, ArrowDownLeft } from 'lucide-react';

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

  const getStatusBadge = (member) => {
    const extra = member.extraAmount || member.advanceAmount || 0;
    if (member.status === 'overpaid' || extra > 0) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-800 border border-emerald-300 shadow-2xs whitespace-nowrap">
          <CheckCircle className="w-3 h-3 text-emerald-600" /> Extra Paid (+{formatCurrency(extra)})
        </span>
      );
    }

    switch (member.status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-slate-100 text-slate-700">
            <CheckCircle className="w-3 h-3 text-slate-500" /> Cleared
          </span>
        );
      case 'partial':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-800">
            <AlertTriangle className="w-3 h-3" /> Partial
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
  const totalSeatRent = filteredMembers.reduce((sum, m) => sum + (m.seatRent || 0), 0);
  const totalUtilityShare = filteredMembers.reduce((sum, m) => sum + (m.utilityShare || 0), 0);
  const totalDue = filteredMembers.reduce((sum, m) => sum + (m.totalDue || 0), 0);
  const totalPaid = filteredMembers.reduce((sum, m) => sum + (m.rentPaid || 0), 0);
  const totalDueRemaining = filteredMembers.reduce((sum, m) => sum + (m.dueRemaining || 0), 0);
  const totalExtraAmount = filteredMembers.reduce((sum, m) => sum + (m.extraAmount || m.advanceAmount || 0), 0);
  const membersWithExtra = filteredMembers.filter(m => (m.extraAmount || m.advanceAmount || 0) > 0);

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
            Individual seat rent + assigned utility shares for each member
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

      {/* Members with Extra Money Callout Banner */}
      {membersWithExtra.length > 0 && (
        <div className="m-4 sm:m-5 p-4 rounded-2xl bg-gradient-to-r from-emerald-50/90 via-teal-50/80 to-emerald-50/90 border border-emerald-200/90 shadow-2xs">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100 text-emerald-700 shrink-0">
                <Coins className="w-5 h-5" />
              </div>
              <div>
                <h4 className="text-xs sm:text-sm font-bold text-emerald-950 flex items-center gap-1.5">
                  <span>Extra Money Received (Refundable to Members)</span>
                  <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-200/90 text-emerald-900">
                    {membersWithExtra.length} Member{membersWithExtra.length > 1 ? 's' : ''}
                  </span>
                </h4>
                <p className="text-xs text-emerald-800 mt-0.5">
                  The following member{membersWithExtra.length > 1 ? 's have' : ' has'} paid extra money and will receive a refund or adjustment:
                </p>
                <div className="flex flex-wrap gap-2 mt-2">
                  {membersWithExtra.map((m) => {
                    const extra = m.extraAmount || m.advanceAmount || 0;
                    return (
                      <span
                        key={m.id}
                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/95 border border-emerald-300 text-xs font-semibold text-emerald-950 shadow-2xs"
                      >
                        <span className="font-bold text-slate-800">{m.name}:</span>
                        <span className="text-emerald-700">Extra: +{formatCurrency(extra)}</span>
                        <span className="text-slate-400">→</span>
                        <span className="text-emerald-800 font-extrabold bg-emerald-100 px-1.5 py-0.5 rounded text-[11px]">
                          Will get: {formatCurrency(extra)}
                        </span>
                      </span>
                    );
                  })}
                </div>
              </div>
            </div>
            <div className="shrink-0 bg-white px-3.5 py-2 rounded-xl border border-emerald-200 text-right shadow-2xs">
              <span className="text-[10px] uppercase font-bold tracking-wider text-slate-500 block">Total Refundable</span>
              <span className="text-sm font-extrabold text-emerald-700">+{formatCurrency(totalExtraAmount)}</span>
            </div>
          </div>
        </div>
      )}

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
                <th className="py-3 px-4 text-right">Due (To Pay)</th>
                <th className="py-3 px-4 text-right">Extra (Will Get)</th>
                <th className="py-3 px-4 text-center">Status</th>
                {isAdmin && <th className="py-3 px-4 text-center">Action</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filteredMembers.map((member) => {
                const extra = member.extraAmount || member.advanceAmount || 0;
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
                      {member.exemptUtilities ? (
                        <span className="text-[11px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-medium">
                          Exempt
                        </span>
                      ) : (
                        formatCurrency(member.utilityShare)
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-slate-900">
                      {formatCurrency(member.totalDue)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      {formatCurrency(member.rentPaid)}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      {member.dueRemaining > 0 ? (
                        <span className="text-rose-600 font-extrabold">
                          {formatCurrency(member.dueRemaining)}
                        </span>
                      ) : (
                        <span className="text-emerald-600 font-medium text-[11px] bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          Cleared
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-right font-bold">
                      {extra > 0 ? (
                        <div className="flex flex-col items-end">
                          <span className="text-emerald-700 font-extrabold text-xs">
                            +{formatCurrency(extra)}
                          </span>
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-800 bg-emerald-100/90 border border-emerald-300 px-1.5 py-0.5 rounded mt-0.5 whitespace-nowrap shadow-2xs">
                            Will get {formatCurrency(extra)}
                          </span>
                        </div>
                      ) : (
                        <span className="text-slate-300">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {getStatusBadge(member)}
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
                <td className="py-3 px-4 text-right">
                  {totalExtraAmount > 0 ? (
                    <div className="flex flex-col items-end">
                      <span className="text-emerald-700 font-extrabold">+{formatCurrency(totalExtraAmount)}</span>
                      <span className="text-[10px] text-emerald-800 font-bold bg-emerald-100 px-1.5 py-0.2 rounded mt-0.5">
                        To Refund: {formatCurrency(totalExtraAmount)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-slate-400">-</span>
                  )}
                </td>
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
