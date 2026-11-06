import { useState, useEffect, useMemo, useCallback } from 'react';
import { rentUtilityService } from '../services/rentUtilityService';
import { useMonthContext } from '../context/MonthContext';
import { useAuthContext } from '../context/AuthContext';
import { useMembers } from './useMembers';
import { calculateRentSummary } from '../utils/rentCalculations';

export const useRentUtilities = () => {
  const { selectedMonth, monthDocId, isClosed } = useMonthContext();
  const { user, isAdmin } = useAuthContext();
  const { activeMembers, members, loading: membersLoading } = useMembers();
  const targetMonthId = monthDocId || selectedMonth;

  const [utilityBills, setUtilityBills] = useState([]);
  const [rentPayments, setRentPayments] = useState([]);
  const [memberRentsMap, setMemberRentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Subscribe to real-time updates for the active month
  useEffect(() => {
    if (!targetMonthId) return;
    setLoading(true);

    let billsLoaded = false;
    let paymentsLoaded = false;
    let rentsLoaded = false;

    const checkReady = () => {
      if (billsLoaded && paymentsLoaded && rentsLoaded) {
        setLoading(false);
      }
    };

    const unsubBills = rentUtilityService.subscribeUtilityBills(targetMonthId, (bills) => {
      setUtilityBills(bills);
      billsLoaded = true;
      checkReady();
    });

    const unsubPayments = rentUtilityService.subscribeRentPayments(targetMonthId, (payments) => {
      setRentPayments(payments);
      paymentsLoaded = true;
      checkReady();
    });

    const unsubRents = rentUtilityService.subscribeMemberRents(targetMonthId, (rents) => {
      setMemberRentsMap(rents);
      rentsLoaded = true;
      checkReady();
    });

    return () => {
      if (typeof unsubBills === 'function') unsubBills();
      if (typeof unsubPayments === 'function') unsubPayments();
      if (typeof unsubRents === 'function') unsubRents();
    };
  }, [targetMonthId]);

  // Compute calculated rent and utility summary
  const summary = useMemo(() => {
    return calculateRentSummary(
      activeMembers,
      memberRentsMap,
      utilityBills,
      rentPayments
    );
  }, [activeMembers, memberRentsMap, utilityBills, rentPayments]);

  // Actions
  const addUtilityBill = useCallback(async (billData) => {
    if (isClosed) return { success: false, error: 'Month is closed (read-only).' };
    setActionLoading(true);
    setError(null);
    try {
      const res = await rentUtilityService.addUtilityBill(targetMonthId, billData, user);
      return { success: true, data: res };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [targetMonthId, isClosed, user]);

  const updateUtilityBill = useCallback(async (billId, billData) => {
    if (isClosed) return { success: false, error: 'Month is closed (read-only).' };
    setActionLoading(true);
    setError(null);
    try {
      const res = await rentUtilityService.updateUtilityBill(targetMonthId, billId, billData);
      return { success: true, data: res };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [targetMonthId, isClosed]);

  const deleteUtilityBill = useCallback(async (billId) => {
    if (isClosed) return { success: false, error: 'Month is closed (read-only).' };
    setActionLoading(true);
    setError(null);
    try {
      await rentUtilityService.deleteUtilityBill(targetMonthId, billId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [targetMonthId, isClosed]);

  const addRentPayment = useCallback(async (paymentData) => {
    if (isClosed) return { success: false, error: 'Month is closed (read-only).' };
    setActionLoading(true);
    setError(null);
    try {
      const res = await rentUtilityService.addRentPayment(targetMonthId, paymentData, user);
      return { success: true, data: res };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [targetMonthId, isClosed, user]);

  const updateRentPayment = useCallback(async (paymentId, paymentData) => {
    if (isClosed) return { success: false, error: 'Month is closed (read-only).' };
    setActionLoading(true);
    setError(null);
    try {
      const res = await rentUtilityService.updateRentPayment(targetMonthId, paymentId, paymentData);
      return { success: true, data: res };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [targetMonthId, isClosed]);

  const deleteRentPayment = useCallback(async (paymentId) => {
    if (isClosed) return { success: false, error: 'Month is closed (read-only).' };
    setActionLoading(true);
    setError(null);
    try {
      await rentUtilityService.deleteRentPayment(targetMonthId, paymentId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [targetMonthId, isClosed]);

  const saveMemberRents = useCallback(async (rentsMap) => {
    if (isClosed) return { success: false, error: 'Month is closed (read-only).' };
    setActionLoading(true);
    setError(null);
    try {
      await rentUtilityService.saveMemberRents(targetMonthId, rentsMap);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [targetMonthId, isClosed]);

  return {
    summary,
    utilityBills,
    rentPayments,
    memberRentsMap,
    activeMembers,
    members,
    loading: loading || membersLoading,
    actionLoading,
    error,
    addUtilityBill,
    updateUtilityBill,
    deleteUtilityBill,
    addRentPayment,
    updateRentPayment,
    deleteRentPayment,
    saveMemberRents,
    isAdmin,
    isClosed,
  };
};
