import React from 'react';
import { 
  Users, 
  Utensils, 
  ShoppingCart, 
  Coins, 
  Wallet, 
  AlertCircle 
} from 'lucide-react';
import { SummaryCard } from '../common/SummaryCard';
import { formatCurrency } from '../../utils/currencyUtils';

export const DashboardStats = ({ summary, loading }) => {
  if (loading) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="h-28 bg-white rounded-2xl border border-slate-200 animate-pulse p-4" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
      <SummaryCard
        title="Total Members"
        value={summary?.totalMembers || 0}
        subtitle="Registered members"
        icon={Users}
        variant="default"
      />
      <SummaryCard
        title="Total Meals"
        value={summary?.totalMeals || 0}
        subtitle="Consumed this month"
        icon={Utensils}
        variant="default"
      />
      <SummaryCard
        title="Market Cost"
        value={formatCurrency(summary?.totalMarketCost || 0)}
        subtitle="Total grocery expense"
        icon={ShoppingCart}
        variant="info"
      />
      <SummaryCard
        title="Cost Per Meal"
        value={formatCurrency(summary?.costPerMeal || 0, true)}
        subtitle="Average meal rate"
        icon={Coins}
        variant="primary"
      />
      <SummaryCard
        title="Total Deposits"
        value={formatCurrency(summary?.totalDeposits || 0)}
        subtitle="Collected advances"
        icon={Wallet}
        variant="default"
      />
      <SummaryCard
        title="Total Due"
        value={formatCurrency(summary?.totalOutstanding || 0)}
        subtitle="Outstanding balance"
        icon={AlertCircle}
        variant={summary?.totalOutstanding > 0 ? 'warning' : 'default'}
      />
    </div>
  );
};
