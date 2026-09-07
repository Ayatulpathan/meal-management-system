import { useState, useEffect, useCallback } from 'react';
import { mealService } from '../services/mealService';
import { useMonthContext } from '../context/MonthContext';
import { validateMealValue } from '../utils/validation';
import { calculateDailyMealTotals, calculateTotalMeals } from '../utils/calculations';

export const useMeals = (customMonthId = null) => {
  const { selectedMonth, currentMonthData, isClosed } = useMonthContext();
  const activeMonthId = customMonthId || selectedMonth;

  const [mealRecords, setMealRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [savingCell, setSavingCell] = useState(null); // `${memberId}-${day}`

  useEffect(() => {
    if (!activeMonthId) return;

    setLoading(true);
    const unsubscribe = mealService.subscribeMonthlyMeals(activeMonthId, (records) => {
      setMealRecords(records);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeMonthId]);

  /**
   * Update meal value for a member on a specific day
   */
  const setDayMeal = useCallback(async (memberId, day, value) => {
    if (isClosed) {
      return { success: false, error: 'This month is closed. Data cannot be modified.' };
    }

    const validation = validateMealValue(value);
    if (!validation.isValid) {
      return { success: false, error: validation.message };
    }

    const cellKey = `${memberId}-${day}`;
    setSavingCell(cellKey);
    setError(null);

    // Optimistic UI update
    setMealRecords(prevRecords => {
      const dayKey = String(day);
      const numVal = Number(value);
      const existingIdx = prevRecords.findIndex(r => r.memberId === memberId);
      
      if (existingIdx !== -1) {
        const updated = [...prevRecords];
        const oldMeals = updated[existingIdx].meals || {};
        const newMeals = { ...oldMeals, [dayKey]: numVal };
        const newTotal = Object.values(newMeals).reduce((s, v) => s + (Number(v) || 0), 0);
        updated[existingIdx] = {
          ...updated[existingIdx],
          meals: newMeals,
          totalMeal: newTotal,
        };
        return updated;
      } else {
        return [...prevRecords, {
          memberId,
          meals: { [dayKey]: numVal },
          totalMeal: numVal,
        }];
      }
    });

    try {
      await mealService.updateDayMeal(activeMonthId, memberId, day, value);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setSavingCell(null);
    }
  }, [activeMonthId, isClosed]);

  // Derived daily totals
  const totalDays = currentMonthData?.days || 30;
  const dailyTotals = calculateDailyMealTotals(mealRecords, totalDays);
  const totalMealsCount = calculateTotalMeals(mealRecords);

  // Helper to get meal for a member on a specific day
  const getMemberMeal = useCallback((memberId, day) => {
    const record = mealRecords.find(r => r.memberId === memberId);
    if (!record || !record.meals) return 0;
    const val = record.meals[String(day)];
    return val !== undefined ? val : 0;
  }, [mealRecords]);

  // Helper to get member's monthly total meals
  const getMemberTotal = useCallback((memberId) => {
    const record = mealRecords.find(r => r.memberId === memberId);
    return record?.totalMeal || 0;
  }, [mealRecords]);

  return {
    mealRecords,
    loading,
    error,
    savingCell,
    isClosed,
    daysCount: totalDays,
    dailyTotals,
    totalMealsCount,
    setDayMeal,
    getMemberMeal,
    getMemberTotal,
  };
};
