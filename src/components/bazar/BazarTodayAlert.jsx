import React from 'react';
import { formatDateDisplay } from '../../utils/dateUtils';
import { formatCurrency } from '../../utils/currencyUtils';
import { Button } from '../common/Button';
import {
  ShoppingCart,
  MessageSquare,
  CheckCircle2,
  Clock,
  Phone,
  Calendar,
  AlertCircle,
  ArrowRight
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export const BazarTodayAlert = ({
  todaySchedules = [],
  tomorrowSchedules = [],
  isAdmin = false,
  onNotifyWhatsApp,
  onToggleStatus,
  onAssignToday,
}) => {
  const navigate = useNavigate();
  const hasTodayDuty = todaySchedules.length > 0;
  const hasTomorrowDuty = tomorrowSchedules.length > 0;

  return (
    <div className="bg-gradient-to-br from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-5 sm:p-6 text-white border border-slate-800 shadow-xl relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute right-0 top-0 w-64 h-64 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-4">
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-white shadow-lg shadow-emerald-500/30">
            <ShoppingCart className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                Bazar Duty Roster
              </span>
              <span className="text-xs text-slate-400 font-medium">
                {hasTodayDuty ? 'Duty Assigned Today' : 'Today: No Duty Set'}
              </span>
            </div>
            <h3 className="text-lg font-extrabold text-white tracking-tight mt-0.5">
              Today's Grocery & Market Duty (আজকের বাজার)
            </h3>
          </div>
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/bazar-schedule')}
          className="text-xs bg-white/10 hover:bg-white/20 text-white border-white/20"
        >
          <span>Full Schedule</span>
          <ArrowRight className="w-3.5 h-3.5 ml-1" />
        </Button>
      </div>

      {/* Today's Duty Box */}
      {hasTodayDuty ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {todaySchedules.map((duty) => {
            const isCompleted = duty.status === 'completed';

            return (
              <div
                key={duty.id}
                className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between gap-3 backdrop-blur-xs"
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/20 border border-emerald-500/30 text-emerald-300 flex items-center justify-center font-extrabold text-base">
                      {duty.memberName?.charAt(0).toUpperCase() || 'M'}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white">
                          {duty.memberName}
                        </h4>
                        <span
                          className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          }`}
                        >
                          {isCompleted ? '✓ Completed' : 'Pending'}
                        </span>
                      </div>
                      {duty.memberPhone && (
                        <p className="text-xs text-slate-400 flex items-center gap-1 mt-0.5">
                          <Phone className="w-3 h-3 text-slate-400" />
                          <span>{duty.memberPhone}</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {duty.estimatedBudget > 0 && (
                    <div className="text-right">
                      <span className="text-[10px] uppercase font-bold text-slate-400 block">
                        Est. Budget
                      </span>
                      <span className="text-xs font-extrabold text-emerald-400">
                        {formatCurrency(duty.estimatedBudget)}
                      </span>
                    </div>
                  )}
                </div>

                {duty.notes && (
                  <p className="text-xs text-slate-300 bg-white/5 p-2 rounded-xl border border-white/5">
                    📝 {duty.notes}
                  </p>
                )}

                {/* Action Buttons */}
                <div className="flex items-center justify-between gap-2 pt-2 border-t border-white/10">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => onNotifyWhatsApp(duty)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-[#25D366] text-slate-950 hover:bg-[#20ba5a] transition-all shadow-md shadow-[#25D366]/20"
                    >
                      <MessageSquare className="w-4 h-4 fill-slate-950" />
                      <span>WhatsApp Reminder</span>
                    </button>

                    {duty.autoNotified && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-300 bg-emerald-500/20 px-2 py-0.5 rounded-full border border-emerald-500/30">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                        Auto-Sent
                      </span>
                    )}
                  </div>

                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => onToggleStatus(duty.id, duty.status)}
                      className="text-xs font-semibold text-slate-300 hover:text-white px-2 py-1 rounded-lg hover:bg-white/10 transition-colors"
                    >
                      {isCompleted ? 'Mark Pending' : 'Mark Completed'}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-white/5 border border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <AlertCircle className="w-5 h-5 text-amber-400 shrink-0" />
            <p className="text-xs text-slate-300">
              No bazar duty is scheduled for today. You can assign someone now.
            </p>
          </div>
          {isAdmin && (
            <Button
              variant="primary"
              size="sm"
              onClick={onAssignToday || (() => navigate('/bazar-schedule'))}
              className="text-xs"
            >
              Assign Today's Duty
            </Button>
          )}
        </div>
      )}

      {/* Tomorrow's Duty Notice */}
      {hasTomorrowDuty && (
        <div className="mt-4 pt-3.5 border-t border-white/10 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2.5 text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="font-bold text-emerald-400">Tomorrow's Duty:</span>
            <span>
              {tomorrowSchedules.map((s) => s.memberName).join(', ')} ({formatDateDisplay(tomorrowSchedules[0]?.date)})
            </span>
          </div>

          <button
            type="button"
            onClick={() => onNotifyWhatsApp(tomorrowSchedules[0])}
            className="text-xs font-bold text-[#25D366] hover:underline inline-flex items-center gap-1"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            <span>Send Advance WhatsApp Reminder</span>
          </button>
        </div>
      )}
    </div>
  );
};
