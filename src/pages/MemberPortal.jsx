import React, { useState, useMemo } from 'react';
import { 
  Utensils, 
  Wallet, 
  Receipt, 
  Coins, 
  ShoppingCart, 
  Plus, 
  Calendar, 
  Lock, 
  Info,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAuthContext } from '../context/AuthContext';
import { useMonthContext } from '../context/MonthContext';
import { useMeals } from '../controllers/useMeals';
import { useMarketCosts } from '../controllers/useMarketCosts';
import { useDeposits } from '../controllers/useDeposits';
import { useMonthlySummary } from '../controllers/useMonthlySummary';
import { SummaryCard } from '../components/common/SummaryCard';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { MarketCostForm } from '../components/market/MarketCostForm';
import { DepositForm } from '../components/deposits/DepositForm';
import { formatCurrency, formatBalance } from '../utils/currencyUtils';
import { getDayList, formatDateDisplay, getTodayDayNumber } from '../utils/dateUtils';

export const MemberPortal = () => {
  const { user, currentMemberId } = useAuthContext();
  const { selectedMonth, currentMonthData, isClosed } = useMonthContext();
  const { summary, loading: summaryLoading, raw } = useMonthlySummary();
  const { setDayMeal, savingCell, daysCount } = useMeals();
  const { addMarketCost, actionLoading: marketActionLoading } = useMarketCosts();
  const { addDeposit, actionLoading: depositActionLoading } = useDeposits();

  const [isCostModalOpen, setIsCostModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState('planner'); // 'planner', 'finances', 'transparency'

  const memberId = currentMemberId;
  const daysList = getDayList(selectedMonth);
  const todayDay = getTodayDayNumber();

  // Find member's specific summary
  const mySummary = useMemo(() => {
    return summary.memberSummaries.find(m => m.memberId === memberId) || {
      memberId,
      memberName: user?.displayName || 'Member',
      totalMeal: 0,
      mealCost: 0,
      totalDeposit: 0,
      balance: 0,
    };
  }, [summary.memberSummaries, memberId, user]);

  // Find member's meal records
  const myMealRecord = useMemo(() => {
    return raw.mealRecords.find(r => r.memberId === memberId) || { meals: {}, totalMeal: 0 };
  }, [raw.mealRecords, memberId]);

  // Find member's deposits
  const myDeposits = useMemo(() => {
    return raw.deposits.filter(d => d.memberId === memberId);
  }, [raw.deposits, memberId]);

  // Find market expenses logged by this member
  const myMarketCosts = useMemo(() => {
    return raw.marketCosts.filter(c => c.createdBy === memberId || c.createdBy === user?.uid);
  }, [raw.marketCosts, memberId, user]);

  const handleMealToggle = async (day) => {
    if (isClosed) return;
    const currentVal = myMealRecord.meals?.[String(day)] ?? 0;
    const nextVal = (currentVal + 1) % 11; // 0 -> 1 -> 2 -> ... -> 10 -> 0
    await setDayMeal(memberId, day, nextVal);
  };

  const handleAddCost = async (formData) => {
    const res = await addMarketCost(formData);
    if (res.success) setIsCostModalOpen(false);
    return res;
  };

  const handleAddDeposit = async (formData) => {
    const res = await addDeposit({ ...formData, memberId });
    if (res.success) setIsDepositModalOpen(false);
    return res;
  };

  if (summaryLoading) {
    return <Loader message="Loading your member portal & ledger..." fullScreen />;
  }

  const isSurplus = mySummary.balance >= 0;

  const getMealBadgeColor = (count) => {
    if (count === 0) return 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100';
    if (count === 1) return 'bg-sky-500 border-sky-600 text-white shadow-md shadow-sky-500/20';
    if (count === 2) return 'bg-emerald-500 border-emerald-600 text-white shadow-md shadow-emerald-500/20';
    if (count <= 4) return 'bg-teal-600 border-teal-700 text-white shadow-md shadow-teal-600/20';
    if (count <= 7) return 'bg-indigo-600 border-indigo-700 text-white shadow-md shadow-indigo-600/20';
    return 'bg-rose-600 border-rose-700 text-white shadow-md shadow-rose-600/20';
  };

  return (
    <div className="space-y-6">
      {/* Header Profile Greeting */}
      <div className="bg-gradient-to-r from-emerald-700 via-teal-800 to-slate-900 rounded-3xl p-6 sm:p-8 text-white shadow-xl shadow-emerald-950/10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-white/10 backdrop-blur border border-white/20 flex items-center justify-center font-bold text-2xl text-emerald-300 shadow-inner">
            {(user?.displayName || 'M').charAt(0).toUpperCase()}
          </div>
          <div>
            <div className="flex items-center gap-2.5">
              <h1 className="text-2xl font-bold tracking-tight">
                Welcome, {user?.displayName || 'Member'}!
              </h1>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-400/20 text-emerald-300 border border-emerald-400/30 flex items-center gap-1">
                <Sparkles className="w-3 h-3" /> Member Portal
              </span>
            </div>
            <p className="text-xs text-emerald-100/80 mt-1">
              Month: <strong>{currentMonthData?.monthName}</strong> | Meal Rate: <strong>{formatCurrency(summary.costPerMeal, true)}/meal</strong>
            </p>
          </div>
        </div>

        {/* Quick Actions for Member */}
        {!isClosed && (
          <div className="flex flex-wrap items-center gap-2.5">
            <Button
              variant="primary"
              size="sm"
              onClick={() => setIsCostModalOpen(true)}
              icon={ShoppingCart}
              className="bg-emerald-500 hover:bg-emerald-600 text-white shadow-lg shadow-emerald-900/40"
            >
              Add Market Expense
            </Button>
            <Button
              variant="secondary"
              size="sm"
              onClick={() => setIsDepositModalOpen(true)}
              icon={Wallet}
              className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur"
            >
              Record Deposit
            </Button>
          </div>
        )}
      </div>

      {/* Personal Financial Metric Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="My Total Meals"
          value={mySummary.totalMeal}
          subtitle="Consumed this month"
          icon={Utensils}
          variant="default"
        />
        <SummaryCard
          title="My Meal Cost"
          value={formatCurrency(mySummary.mealCost)}
          subtitle={`${mySummary.totalMeal} meals × ${formatCurrency(summary.costPerMeal, true)}`}
          icon={Receipt}
          variant="default"
        />
        <SummaryCard
          title="My Total Deposits"
          value={formatCurrency(mySummary.totalDeposit)}
          subtitle="Paid into mess fund"
          icon={Wallet}
          variant="default"
        />
        <SummaryCard
          title="My Net Balance"
          value={formatBalance(mySummary.balance)}
          subtitle={isSurplus ? 'Surplus / Refund due to you' : 'Amount you owe to mess fund'}
          icon={Coins}
          variant={isSurplus ? 'primary' : 'danger'}
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm max-w-fit">
        <button
          type="button"
          onClick={() => setActiveTab('planner')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'planner'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Calendar className="w-3.5 h-3.5" />
          My Daily Meal Logger
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('finances')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'finances'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Wallet className="w-3.5 h-3.5" />
          My Expenses & Deposits
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('transparency')}
          className={`px-4 py-2 rounded-xl text-xs font-semibold transition-all flex items-center gap-1.5 ${
            activeTab === 'transparency'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Info className="w-3.5 h-3.5" />
          Mess Financial Overview
        </button>
      </div>

      {/* TAB 1: Member Self-Service Daily Meal Logger */}
      {activeTab === 'planner' && (
        <div className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Utensils className="w-5 h-5 text-emerald-600" />
                My Daily Meal Attendance (31 Days)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Tap any day to cycle your meals: <strong>0 → 1 → 2 → 3 ... up to 10 meals/day</strong>
              </p>
            </div>

            <div className="flex items-center gap-3 text-xs bg-slate-50 px-3 py-1.5 rounded-xl border border-slate-200">
              <span className="font-semibold text-slate-700">Today: Day {todayDay}</span>
              <span className="text-slate-400">|</span>
              <span className="text-emerald-700 font-bold">
                Logged: {myMealRecord.meals?.[String(todayDay)] ?? 0} meals
              </span>
            </div>
          </div>

          {/* Interactive Day-by-Day Grid */}
          <div className="grid grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-10 gap-3">
            {daysList.map((day) => {
              const val = myMealRecord.meals?.[String(day)] ?? 0;
              const isToday = day === todayDay;
              const isSaving = savingCell === `${memberId}-${day}`;

              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => handleMealToggle(day)}
                  disabled={isClosed || isSaving}
                  title={`Day ${day}: Tap to cycle (0 to 10) | Current: ${val}`}
                  className={`p-3 rounded-2xl border text-center transition-all duration-150 transform active:scale-95 flex flex-col items-center justify-between gap-1.5 select-none ${
                    isToday ? 'ring-2 ring-emerald-500 ring-offset-2' : ''
                  } ${getMealBadgeColor(val)} ${isClosed ? 'cursor-not-allowed opacity-80' : 'cursor-pointer'}`}
                >
                  <span className={`text-[10px] font-semibold uppercase tracking-wider block ${val > 0 ? 'text-white/80' : 'text-slate-400'}`}>
                    Day {String(day).padStart(2, '0')} {isToday ? '★' : ''}
                  </span>
                  <span className="text-xl font-black">{val}</span>
                  <span className={`text-[9px] font-medium px-1.5 py-0.5 rounded-md ${val > 0 ? 'bg-white/20 text-white' : 'text-slate-400'}`}>
                    {val === 0 ? 'Off' : `${val} ${val === 1 ? 'meal' : 'meals'}`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: Member Personal Expenses & Deposits */}
      {activeTab === 'finances' && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Mess Market Costs with Purchaser Name */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-amber-50 text-amber-600">
                  <ShoppingCart className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">Mess Grocery & Market Purchases</h3>
                  <p className="text-xs text-slate-500">All grocery expenses and who did the shopping</p>
                </div>
              </div>
              {!isClosed && (
                <Button size="sm" variant="outline" onClick={() => setIsCostModalOpen(true)} icon={Plus}>
                  Add
                </Button>
              )}
            </div>

            <div className="mt-4 divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {raw.marketCosts.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No market expenses recorded yet for this month.</p>
              ) : (
                raw.marketCosts.map((c) => {
                  const isMine = c.createdBy === memberId || c.buyerName === user?.displayName;
                  return (
                    <div key={c.id} className="py-3 flex items-center justify-between gap-3">
                      <div>
                        <p className="text-sm font-medium text-slate-800">{c.description || 'Grocery purchase'}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <span className="text-xs text-slate-400">{formatDateDisplay(c.date)}</span>
                          <span className="text-[11px] px-2 py-0.5 rounded-full font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
                            By: {c.buyerName || 'Administrator'} {isMine ? '(You)' : ''}
                          </span>
                        </div>
                      </div>
                      <span className="text-sm font-bold text-slate-900 shrink-0">{formatCurrency(c.amount)}</span>
                    </div>
                  );
                })
              )}
            </div>
          </div>

          {/* My Deposits */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center gap-2.5">
                <div className="p-2 rounded-xl bg-emerald-50 text-emerald-600">
                  <Wallet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-semibold text-slate-900">My Advance Deposits</h3>
                  <p className="text-xs text-slate-500">Payments made to mess manager</p>
                </div>
              </div>
              {!isClosed && (
                <Button size="sm" variant="outline" onClick={() => setIsDepositModalOpen(true)} icon={Plus}>
                  Add
                </Button>
              )}
            </div>

            <div className="mt-4 divide-y divide-slate-100 max-h-72 overflow-y-auto">
              {myDeposits.length === 0 ? (
                <p className="text-xs text-slate-400 py-6 text-center">No deposits recorded for this month.</p>
              ) : (
                myDeposits.map((d) => (
                  <div key={d.id} className="py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{d.note || 'Cash / Online Transfer'}</p>
                      <p className="text-xs text-slate-400">{formatDateDisplay(d.date)}</p>
                    </div>
                    <span className="text-sm font-bold text-emerald-600">+{formatCurrency(d.amount)}</span>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: Full Mess Financial Overview & Transparency */}
      {activeTab === 'transparency' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 space-y-4">
          <div className="border-b border-slate-100 pb-4">
            <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-emerald-600" />
              Mess Group Dining Transparency Ledger
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Current breakdown of total grocery costs, total meals consumed, and all member balances
            </p>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 block font-medium">Mess Grocery Cost</span>
              <span className="text-lg font-bold text-slate-800 mt-1 block">{formatCurrency(summary.totalMarketCost)}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 block font-medium">Total Group Meals</span>
              <span className="text-lg font-bold text-slate-800 mt-1 block">{summary.totalMeals}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-100">
              <span className="text-xs text-emerald-700 block font-semibold">Cost Per Meal</span>
              <span className="text-lg font-extrabold text-emerald-800 mt-1 block">{formatCurrency(summary.costPerMeal, true)}</span>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-100">
              <span className="text-xs text-slate-500 block font-medium">Total Mess Deposits</span>
              <span className="text-lg font-bold text-slate-800 mt-1 block">{formatCurrency(summary.totalDeposits)}</span>
            </div>
          </div>

          {/* Member table for group transparency */}
          <div className="overflow-x-auto mt-4">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-50 uppercase text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-2.5 px-4">Member</th>
                  <th className="py-2.5 px-3 text-center">Meals</th>
                  <th className="py-2.5 px-3 text-right">Meal Cost</th>
                  <th className="py-2.5 px-3 text-right">Deposits</th>
                  <th className="py-2.5 px-4 text-right">Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {summary.memberSummaries.map((m) => {
                  const isCurrent = m.memberId === memberId;
                  return (
                    <tr key={m.memberId} className={isCurrent ? 'bg-emerald-50/60 font-semibold' : ''}>
                      <td className="py-2.5 px-4">
                        <span className="text-slate-800">{m.memberName} {isCurrent ? '(You)' : ''}</span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">{m.totalMeal}</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(m.mealCost)}</td>
                      <td className="py-2.5 px-3 text-right">{formatCurrency(m.totalDeposit)}</td>
                      <td className="py-2.5 px-4 text-right font-bold">
                        <span className={`px-2 py-0.5 rounded-md ${m.balance >= 0 ? 'text-emerald-700 bg-emerald-100/70' : 'text-rose-700 bg-rose-100/70'}`}>
                          {formatBalance(m.balance)}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Market Cost Modal */}
      <MarketCostForm
        isOpen={isCostModalOpen}
        onClose={() => setIsCostModalOpen(false)}
        onSubmit={handleAddCost}
        members={raw.members}
        currentUser={user}
        loading={marketActionLoading}
      />

      {/* Add Deposit Modal */}
      <DepositForm
        isOpen={isDepositModalOpen}
        onClose={() => setIsDepositModalOpen(false)}
        onSubmit={handleAddDeposit}
        members={raw.members.filter(m => m.id === memberId)}
        loading={depositActionLoading}
      />
    </div>
  );
};
