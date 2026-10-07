import { useState, useEffect, useMemo, useCallback } from 'react';
import { rentUtilityService } from '../services/rentUtilityService';
import { useMonthContext } from '../context/MonthContext';
import { useAuthContext } from '../context/AuthContext';
import { useMembers } from './useMembers';
import { calculateRentSummary } from '../utils/rentCalculations';

export const useRentUtilities = () => {
  const { selectedMonth, isClosed } = useMonthContext();
  const { user, isAdmin } = useAuthContext();
  const { activeMembers, members, loading: membersLoading } = useMembers();

  const [utilityBills, setUtilityBills] = useState([]);
  const [rentPayments, setRentPayments] = useState([]);
  const [memberRentsMap, setMemberRentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  // Subscribe to real-time updates for the active month
  useEffect(() => {
    if (!selectedMonth) return;
    setLoading(true);

    let billsLoaded = false;
    let paymentsLoaded = false;
    let rentsLoaded = false;

    const checkReady = () => {
      if (billsLoaded && paymentsLoaded && rentsLoaded) {
        setLoading(false);
      }
    };

    const unsubBills = rentUtilityService.subscribeUtilityBills(selectedMonth, (bills) => {
      setUtilityBills(bills);
      billsLoaded = true;
      checkReady();
    });

    const unsubPayments = rentUtilityService.subscribeRentPayments(selectedMonth, (payments) => {
      setRentPayments(payments);
      paymentsLoaded = true;
      checkReady();
    });

    const unsubRents = rentUtilityService.subscribeMemberRents(selectedMonth, (rents) => {
      setMemberRentsMap(rents);
      rentsLoaded = true;
      checkReady();
    });

    return () => {
      if (typeof unsubBills === 'function') unsubBills();
      if (typeof unsubPayments === 'function') unsubPayments();
      if (typeof unsubRents === 'function') unsubRents();
    };
  }, [selectedMonth]);

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
      const res = await rentUtilityService.addUtilityBill(selectedMonth, billData, user);
      return { success: true, data: res };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [selectedMonth, isClosed, user]);

  const updateUtilityBill = useCallback(async (billId, billData) => {
    if (isClosed) return { success: false, error: 'Month is closed (read-only).' };
    setActionLoading(true);
    setError(null);
    try {
      const res = await rentUtilityService.updateUtilityBill(selectedMonth, billId, billData);
      return { success: true, data: res };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [selectedMonth, isClosed]);

  const deleteUtilityBill = useCallback(async (billId) => {
    if (isClosed) return { success: false, error: 'Month is closed (read-only).' };
    setActionLoading(true);
    setError(null);
    try {
      await rentUtilityService.deleteUtilityBill(selectedMonth, billId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [selectedMonth, isClosed]);

  const addRentPayment = useCallback(async (paymentData) => {
    if (isClosed) return { success: false, error: 'Month is closed (read-only).' };
    setActionLoading(true);
    setError(null);
    try {
      const res = await rentUtilityService.addRentPayment(selectedMonth, paymentData, user);
      return { success: true, data: res };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [selectedMonth, isClosed, user]);

  const updateRentPayment = useCallback(async (paymentId, paymentData) => {
    if (isClosed) return { success: false, error: 'Month is closed (read-only).' };
    setActionLoading(true);
    setError(null);
    try {
      const res = await rentUtilityService.updateRentPayment(selectedMonth, paymentId, paymentData);
      return { success: true, data: res };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [selectedMonth, isClosed]);

  const deleteRentPayment = useCallback(async (paymentId) => {
    if (isClosed) return { success: false, error: 'Month is closed (read-only).' };
    setActionLoading(true);
    setError(null);
    try {
      await rentUtilityService.deleteRentPayment(selectedMonth, paymentId);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [selectedMonth, isClosed]);

  const saveMemberRents = useCallback(async (rentsMap) => {
    if (isClosed) return { success: false, error: 'Month is closed (read-only).' };
    setActionLoading(true);
    setError(null);
    try {
      await rentUtilityService.saveMemberRents(selectedMonth, rentsMap);
      return { success: true };
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  }, [selectedMonth, isClosed]);

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
