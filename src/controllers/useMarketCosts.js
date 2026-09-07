import { useState, useEffect, useCallback } from 'react';
import { marketCostService } from '../services/marketCostService';
import { useMonthContext } from '../context/MonthContext';
import { useAuthContext } from '../context/AuthContext';
import { validateMarketCost } from '../utils/validation';
import { calculateTotalMarketCost } from '../utils/calculations';

export const useMarketCosts = (customMonthId = null) => {
  const { selectedMonth, isClosed } = useMonthContext();
  const { user } = useAuthContext();
  const activeMonthId = customMonthId || selectedMonth;

  const [marketCosts, setMarketCosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeMonthId) return;

    setLoading(true);
    const unsubscribe = marketCostService.subscribeMarketCosts(activeMonthId, (costs) => {
      setMarketCosts(costs);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeMonthId]);

  const addMarketCost = useCallback(async (costData) => {
    if (isClosed) {
      return { success: false, error: 'This month is closed. Data cannot be modified.' };
    }

    const validation = validateMarketCost(costData);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError, errors: validation.errors };
    }

    setActionLoading(true);
    setError(null);
    try {
      const created = await marketCostService.addMarketCost(activeMonthId, costData, user?.uid || 'admin');
      return { success: true, cost: created };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [activeMonthId, isClosed, user]);

  const updateMarketCost = useCallback(async (costId, costData) => {
    if (isClosed) {
      return { success: false, error: 'This month is closed. Data cannot be modified.' };
    }

    const validation = validateMarketCost(costData);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError, errors: validation.errors };
    }

    setActionLoading(true);
    setError(null);
    try {
      const updated = await marketCostService.updateMarketCost(activeMonthId, costId, costData);
      return { success: true, cost: updated };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [activeMonthId, isClosed]);

  const deleteMarketCost = useCallback(async (costId) => {
    if (isClosed) {
      return { success: false, error: 'This month is closed. Data cannot be modified.' };
    }

    setActionLoading(true);
    setError(null);
    try {
      await marketCostService.deleteMarketCost(activeMonthId, costId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [activeMonthId, isClosed]);

  const totalMarketCost = calculateTotalMarketCost(marketCosts);

  return {
    marketCosts,
    totalMarketCost,
    loading,
    actionLoading,
    error,
    isClosed,
    addMarketCost,
    updateMarketCost,
    deleteMarketCost,
  };
};
