import React from 'react';
import { 
  User, 
  Phone, 
  Mail, 
  Calendar, 
  Utensils, 
  Wallet, 
  Receipt, 
  Coins 
} from 'lucide-react';
import { formatCurrency, formatBalance } from '../../utils/currencyUtils';
import { formatDateDisplay } from '../../utils/dateUtils';
import { SummaryCard } from '../common/SummaryCard';

export const MemberDetails = ({
  member,
  memberSummary,
  memberDeposits = [],
  mealHistory = {},
  daysCount = 30,
}) => {
  if (!member) return null;

  const totalMeal = memberSummary?.totalMeal || 0;
  const mealCost = memberSummary?.mealCost || 0;
  const totalDeposit = memberSummary?.totalDeposit || 0;
  const balance = memberSummary?.balance || 0;

  return (
    <div className="space-y-6">
      {/* Profile Overview Card */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-800 font-bold text-2xl flex items-center justify-center shadow-inner">
              {member.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">{member.name}</h2>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                    member.status === 'active'
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-slate-100 text-slate-600 border border-slate-200'
                  }`}
                >
                  {member.status}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1">Member ID: {member.id}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-600 bg-slate-50 p-3.5 rounded-xl border border-slate-100">
            <div className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-slate-400" />
              <span>{member.phone || 'No phone'}</span>
            </div>
            <div className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-slate-400" />
              <span>{member.email || 'No email'}</span>
            </div>
            <div className="flex items-center gap-2 sm:col-span-2">
              <Calendar className="w-4 h-4 text-slate-400" />
              <span>Joined: {formatDateDisplay(member.joinedAt)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Financial & Meal Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Total Meals"
          value={totalMeal}
          subtitle="Consumed this month"
          icon={Utensils}
          variant="default"
        />
        <SummaryCard
          title="Meal Cost"
          value={formatCurrency(mealCost)}
          subtitle="Calculated expense"
          icon={Receipt}
          variant="default"
        />
        <SummaryCard
          title="Total Deposit"
          value={formatCurrency(totalDeposit)}
          subtitle="Paid into mess fund"
          icon={Wallet}
          variant="default"
        />
        <SummaryCard
          title="Net Balance"
          value={formatBalance(balance)}
          subtitle={balance >= 0 ? 'Surplus / Refund due' : 'Payment due'}
          icon={Coins}
          variant={balance >= 0 ? 'primary' : 'danger'}
        />
      </div>

      {/* Day-by-day Meal History for current month */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Utensils className="w-4 h-4 text-emerald-600" />
          Monthly Meal Attendance Breakdown
        </h3>
        <div className="grid grid-cols-5 sm:grid-cols-8 md:grid-cols-10 lg:grid-cols-15 gap-2">
          {Array.from({ length: daysCount }).map((_, i) => {
            const day = i + 1;
            const count = mealHistory[String(day)] ?? 0;
            return (
              <div
                key={day}
                className={`p-2 rounded-xl text-center border transition-all ${
                  count === 2
                    ? 'bg-emerald-50 border-emerald-300 text-emerald-900 font-bold'
                    : count === 1
                    ? 'bg-sky-50 border-sky-300 text-sky-900 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-400'
                }`}
              >
                <span className="text-[10px] text-slate-400 block mb-0.5">Day {day}</span>
                <span className="text-sm">{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Deposit History */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-sm p-6">
        <h3 className="text-base font-semibold text-slate-900 mb-4 flex items-center gap-2">
          <Wallet className="w-4 h-4 text-emerald-600" />
          Deposit Records for This Month
        </h3>
        {memberDeposits.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">No deposit transactions recorded this month.</p>
        ) : (
          <div className="divide-y divide-slate-100">
            {memberDeposits.map((dep) => (
              <div key={dep.id} className="py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-800">{dep.note || 'Cash Deposit'}</p>
                  <p className="text-xs text-slate-400">{formatDateDisplay(dep.date)}</p>
                </div>
                <span className="text-sm font-bold text-emerald-600">
                  +{formatCurrency(dep.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
