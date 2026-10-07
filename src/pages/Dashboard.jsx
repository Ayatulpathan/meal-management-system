import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UtensilsCrossed, 
  ShoppingCart, 
  Wallet, 
  Users, 
  FileSpreadsheet,
  Building2,
  Sparkles,
  Plus,
  Coins
} from 'lucide-react';
import { useMonthlySummary } from '../controllers/useMonthlySummary';
import { useAuthContext } from '../context/AuthContext';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { TodayMealSummary } from '../components/dashboard/TodayMealSummary';
import { FinancialSummary } from '../components/dashboard/FinancialSummary';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';
import { formatCurrency } from '../utils/currencyUtils';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuthContext();
  const { summary, loading, raw, monthData, isClosed } = useMonthlySummary();

  if (loading) {
    return <Loader message="Loading dashboard & calculating finances..." fullScreen />;
  }

  // Greeting based on time
  const currentHour = new Date().getHours();
  let greeting = 'Good morning';
  if (currentHour >= 12 && currentHour < 17) greeting = 'Good afternoon';
  else if (currentHour >= 17) greeting = 'Good evening';

  return (
    <div className="space-y-6">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 rounded-3xl p-6 sm:p-7 text-white shadow-xl shadow-slate-950/10 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-5 relative overflow-hidden">
        {/* Subtle background flare */}
        <div className="absolute right-0 top-0 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="z-10">
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> Admin Workspace
            </span>
            <span className="text-xs text-slate-400 font-medium">
              {monthData?.monthName}
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-white">
            {greeting}, {user?.displayName || 'Administrator'}!
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1 font-medium">
            Active Meal Rate: <strong className="text-emerald-400 font-bold">{formatCurrency(summary.costPerMeal, true)}/meal</strong> | Active Members: <strong className="text-white">{summary.totalMembers}</strong>
          </p>
        </div>

        {/* Quick Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 z-10">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/meals')}
            icon={UtensilsCrossed}
            className="shadow-md shadow-emerald-950/40"
          >
            Meal Entry Grid
          </Button>

          {!isClosed && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/market-costs')}
                icon={ShoppingCart}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                Add Market
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/deposits')}
                icon={Wallet}
                className="bg-white/10 hover:bg-white/20 text-white border-white/20"
              >
                Record Deposit
              </Button>
            </>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate('/rent-utilities')}
            icon={Building2}
            className="bg-white/10 hover:bg-white/20 text-white border-white/20"
          >
            Rent & Utilities
          </Button>
        </div>
      </div>

      {/* 6 Key Stat Cards */}
      <DashboardStats summary={summary} loading={loading} />

      {/* Today Section & Financial Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TodayMealSummary
          members={raw.members}
          mealRecords={raw.mealRecords}
          marketCosts={raw.marketCosts}
        />
        <FinancialSummary summary={summary} />
      </div>

      {/* Recent Activity Log */}
      <RecentTransactions
        marketCosts={raw.marketCosts}
        deposits={raw.deposits}
        members={raw.members}
      />
    </div>
  );
};
