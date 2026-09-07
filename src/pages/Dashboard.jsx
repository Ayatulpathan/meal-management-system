import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  UtensilsCrossed, 
  ShoppingCart, 
  Wallet, 
  Users, 
  FileSpreadsheet,
  Plus
} from 'lucide-react';
import { useMonthlySummary } from '../controllers/useMonthlySummary';
import { DashboardStats } from '../components/dashboard/DashboardStats';
import { TodayMealSummary } from '../components/dashboard/TodayMealSummary';
import { FinancialSummary } from '../components/dashboard/FinancialSummary';
import { RecentTransactions } from '../components/dashboard/RecentTransactions';
import { Button } from '../components/common/Button';
import { Loader } from '../components/common/Loader';

export const Dashboard = () => {
  const navigate = useNavigate();
  const { summary, loading, raw, monthData, isClosed } = useMonthlySummary();

  if (loading) {
    return <Loader message="Loading dashboard & calculating finances..." fullScreen />;
  }

  return (
    <div className="space-y-6">
      {/* Welcome & Quick Action Bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Dashboard Overview
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
            Financial and meal records for <strong>{monthData?.monthName}</strong>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <Button
            variant="primary"
            size="sm"
            onClick={() => navigate('/meals')}
            icon={UtensilsCrossed}
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
              >
                Add Market Cost
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/deposits')}
                icon={Wallet}
              >
                Record Deposit
              </Button>
            </>
          )}

          <Button
            variant="secondary"
            size="sm"
            onClick={() => navigate('/reports')}
            icon={FileSpreadsheet}
          >
            View Reports
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
