import { useMemo } from 'react';
import { useMembers } from './useMembers';
import { useMeals } from './useMeals';
import { useMarketCosts } from './useMarketCosts';
import { useDeposits } from './useDeposits';
import { useMonthContext } from '../context/MonthContext';
import { calculateMonthlySummary } from '../utils/calculations';

export const useMonthlySummary = (customMonthId = null) => {
  const { selectedMonth, currentMonthData, isClosed } = useMonthContext();
  const activeMonthId = customMonthId || selectedMonth;

  const { members, loading: membersLoading } = useMembers();
  const { mealRecords, loading: mealsLoading, dailyTotals } = useMeals(activeMonthId);
  const { marketCosts, loading: marketCostsLoading } = useMarketCosts(activeMonthId);
  const { deposits, loading: depositsLoading } = useDeposits(activeMonthId);

  const loading = membersLoading || mealsLoading || marketCostsLoading || depositsLoading;

  const summary = useMemo(() => {
    return calculateMonthlySummary(members, mealRecords, marketCosts, deposits);
  }, [members, mealRecords, marketCosts, deposits]);

  return {
    monthId: activeMonthId,
    monthData: currentMonthData,
    isClosed,
    loading,
    summary,
    dailyTotals,
    raw: {
      members,
      mealRecords,
      marketCosts,
      deposits,
    },
  };
};
