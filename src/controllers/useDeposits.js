import { useState, useEffect, useCallback } from 'react';
import { depositService } from '../services/depositService';
import { useMonthContext } from '../context/MonthContext';
import { useAuthContext } from '../context/AuthContext';
import { validateDeposit } from '../utils/validation';
import { calculateTotalDeposits, calculateMemberTotalDeposit } from '../utils/calculations';

export const useDeposits = (customMonthId = null) => {
  const { selectedMonth, isClosed } = useMonthContext();
  const { user, isAdmin, currentMemberId } = useAuthContext();
  const activeMonthId = customMonthId || selectedMonth;

  const [deposits, setDeposits] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeMonthId) return;

    setLoading(true);
    const unsubscribe = depositService.subscribeDeposits(activeMonthId, (data) => {
      setDeposits(data);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [activeMonthId]);

  const addDeposit = useCallback(async (depositData) => {
    if (isClosed) {
      return { success: false, error: 'This month is closed. Data cannot be modified.' };
    }

    // Member can only record deposit for themselves; Admin can record for anyone
    const targetMemberId = isAdmin ? (depositData.memberId || currentMemberId) : currentMemberId;
    const sanitizedData = { ...depositData, memberId: targetMemberId };

    const validation = validateDeposit(sanitizedData);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError, errors: validation.errors };
    }

    setActionLoading(true);
    setError(null);
    try {
      const created = await depositService.addDeposit(activeMonthId, sanitizedData, user?.uid || 'admin');
      return { success: true, deposit: created };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [activeMonthId, isClosed, isAdmin, currentMemberId, user]);

  const updateDeposit = useCallback(async (depositId, depositData) => {
    if (isClosed) {
      return { success: false, error: 'This month is closed. Data cannot be modified.' };
    }

    // Check permission: Admin can edit all deposits; Member can only edit their own
    if (!isAdmin) {
      const targetDeposit = deposits.find(d => d.id === depositId);
      if (!targetDeposit || targetDeposit.memberId !== currentMemberId) {
        return { success: false, error: 'Permission denied: You can only edit your own deposits.' };
      }
    }

    const validation = validateDeposit(depositData);
    if (!validation.isValid) {
      const firstError = Object.values(validation.errors)[0];
      return { success: false, error: firstError, errors: validation.errors };
    }

    setActionLoading(true);
    setError(null);
    try {
      const updated = await depositService.updateDeposit(activeMonthId, depositId, depositData);
      return { success: true, deposit: updated };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [activeMonthId, isClosed, isAdmin, deposits, currentMemberId]);

  const deleteDeposit = useCallback(async (depositId) => {
    if (isClosed) {
      return { success: false, error: 'This month is closed. Data cannot be modified.' };
    }

    // Check permission: Admin can delete any deposit; Member can only delete their own
    if (!isAdmin) {
      const targetDeposit = deposits.find(d => d.id === depositId);
      if (!targetDeposit || targetDeposit.memberId !== currentMemberId) {
        return { success: false, error: 'Permission denied: You can only delete your own deposits.' };
      }
    }

    setActionLoading(true);
    setError(null);
    try {
      await depositService.deleteDeposit(activeMonthId, depositId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [activeMonthId, isClosed, isAdmin, deposits, currentMemberId]);

  const totalDeposits = calculateTotalDeposits(deposits);

  const getMemberDeposits = useCallback((memberId) => {
    return calculateMemberTotalDeposit(deposits, memberId);
  }, [deposits]);

  return {
    deposits,
    totalDeposits,
    loading,
    actionLoading,
    error,
    isClosed,
    addDeposit,
    updateDeposit,
    deleteDeposit,
    getMemberDeposits,
  };
};
