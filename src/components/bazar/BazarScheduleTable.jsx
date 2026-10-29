import React, { useState } from 'react';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import { Button } from '../common/Button';
import { EmptyState } from '../common/EmptyState';
import {
  Calendar,
  MessageSquare,
  CheckCircle2,
  Clock,
  Edit2,
  Trash2,
  Phone,
  Search,
  Copy,
  Check,
  Plus
} from 'lucide-react';

export const BazarScheduleTable = ({
  schedules = [],
  todayDate = '',
  isAdmin = false,
  isClosed = false,
  onAddSchedule,
  onEditSchedule,
  onDeleteSchedule,
  onToggleStatus,
  onNotifyWhatsApp,
  onCopyWhatsApp,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [copiedId, setCopiedId] = useState(null);

  const filtered = schedules.filter((s) => {
    const q = searchTerm.toLowerCase();
    return (
      s.memberName?.toLowerCase().includes(q) ||
      s.date?.includes(q) ||
      s.notes?.toLowerCase().includes(q)
    );
  });

  const handleCopy = async (schedule) => {
    if (onCopyWhatsApp) {
      await onCopyWhatsApp(schedule);
      setCopiedId(schedule.id);
      setTimeout(() => setCopiedId(null), 2500);
    }
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200/90 shadow-sm overflow-hidden">
      {/* Controls Bar */}
      <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h3 className="text-base font-bold text-slate-800 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-emerald-600" />
            Bazar Duty List (বাজারের তালিকা)
          </h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Total scheduled duties: <strong className="text-slate-800">{schedules.length}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 sm:w-64">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search member, date or notes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
            />
          </div>

          {isAdmin && !isClosed && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAddSchedule}
              icon={Plus}
              className="text-xs"
            >
              Assign Duty
            </Button>
          )}
        </div>
      </div>

      {/* Table */}
      {filtered.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200/80 text-[11px] font-bold uppercase tracking-wider text-slate-500">
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Member on Duty</th>
                <th className="py-3 px-4">Notes / Items</th>
                <th className="py-3 px-4 text-right">Budget</th>
                <th className="py-3 px-4 text-center">Duty Status</th>
                <th className="py-3 px-4 text-center">WhatsApp Alert</th>
                {isAdmin && !isClosed && <th className="py-3 px-4 text-center">Actions</th>}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs text-slate-700">
              {filtered.map((item) => {
                const isToday = item.date === todayDate;
                const isCompleted = item.status === 'completed';

                return (
                  <tr
                    key={item.id}
                    className={`transition-colors hover:bg-slate-50/70 ${
                      isToday ? 'bg-emerald-50/40 font-medium' : ''
                    }`}
                  >
                    {/* Date */}
                    <td className="py-3 px-4 whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-slate-900">
                          {formatDateDisplay(item.date)}
                        </span>
                        {isToday && (
                          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-300">
                            Today
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Member */}
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs shrink-0">
                          {item.memberName?.charAt(0).toUpperCase() || 'M'}
                        </div>
                        <div>
                          <span className="font-bold text-slate-900 block">{item.memberName}</span>
                          {item.memberPhone && (
                            <span className="text-[11px] text-slate-400 font-normal flex items-center gap-1">
                              <Phone className="w-3 h-3" /> {item.memberPhone}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>

                    {/* Notes */}
                    <td className="py-3 px-4 text-slate-600 max-w-xs truncate">
                      {item.notes || <span className="text-slate-300">-</span>}
                    </td>

                    {/* Budget */}
                    <td className="py-3 px-4 text-right font-semibold text-slate-800">
                      {item.estimatedBudget > 0 ? (
                        formatCurrency(item.estimatedBudget)
                      ) : (
                        <span className="text-slate-300 font-normal">-</span>
                      )}
                    </td>

                    {/* Duty Status */}
                    <td className="py-3 px-4 text-center">
                      <button
                        type="button"
                        onClick={() => isAdmin && !isClosed && onToggleStatus(item.id, item.status)}
                        disabled={!isAdmin || isClosed}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-bold transition-all ${
                          isCompleted
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border border-amber-200 hover:bg-amber-100'
                        } ${isAdmin && !isClosed ? 'cursor-pointer hover:shadow-xs' : 'cursor-default'}`}
                        title={isAdmin && !isClosed ? 'Click to toggle status' : ''}
                      >
                        {isCompleted ? (
                          <>
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
                            <span>Done</span>
                          </>
                        ) : (
                          <>
                            <Clock className="w-3.5 h-3.5 text-amber-600" />
                            <span>Pending</span>
                          </>
                        )}
                      </button>
                    </td>

                    {/* WhatsApp Notification Action */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => onNotifyWhatsApp(item)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold bg-[#25D366]/10 text-[#128C7E] hover:bg-[#25D366] hover:text-white transition-all shadow-2xs border border-[#25D366]/30 group"
                          title="Send pre-filled message via WhatsApp"
                        >
                          <MessageSquare className="w-3.5 h-3.5" />
                          <span>WhatsApp</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleCopy(item)}
                          className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
                          title="Copy notification text"
                        >
                          {copiedId === item.id ? (
                            <Check className="w-3.5 h-3.5 text-emerald-600" />
                          ) : (
                            <Copy className="w-3.5 h-3.5" />
                          )}
                        </button>
                      </div>
                    </td>

                    {/* Admin Actions */}
                    {isAdmin && !isClosed && (
                      <td className="py-3 px-4 text-center">
                        <div className="flex items-center justify-center gap-1">
                          <button
                            onClick={() => onEditSchedule(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-emerald-600 hover:bg-emerald-50 transition-colors"
                            title="Edit Schedule"
                          >
                            <Edit2 className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => onDeleteSchedule(item)}
                            className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                            title="Delete Schedule"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="p-8">
          <EmptyState
            icon={Calendar}
            title="No bazar duties scheduled"
            message={
              searchTerm
                ? 'No duties match your search query.'
                : 'No members are scheduled for bazar duty yet. Assign manually or use auto-rotate.'
            }
            action={
              isAdmin && !isClosed ? (
                <Button variant="primary" size="sm" onClick={onAddSchedule} icon={Plus}>
                  Assign First Bazar Duty
                </Button>
              ) : null
            }
          />
        </div>
      )}
    </div>
  );
};
