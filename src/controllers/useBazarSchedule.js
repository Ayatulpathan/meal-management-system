import { useState, useEffect, useMemo } from 'react';
import { bazarScheduleService } from '../services/bazarScheduleService';
import { useMonthContext } from '../context/MonthContext';
import { useMembers } from './useMembers';
import { getTodayDateString, getCurrentMonthId } from '../utils/dateUtils';
import {
  generateWhatsAppMessage,
  openWhatsAppChat,
  copyToClipboard
} from '../utils/bazarNotificationUtils';
import { whatsappAutoService } from '../services/whatsappAutoService';

export const useBazarSchedule = (customMonthId = null) => {
  const { selectedMonth, currentMonthData } = useMonthContext();
  const { activeMembers } = useMembers();
  const activeMonthId = customMonthId || selectedMonth || currentMonthData?.month || getCurrentMonthId();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!activeMonthId) {
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsubscribe = bazarScheduleService.subscribeBazarSchedule(
      activeMonthId,
      (data) => {
        setSchedules(data || []);
        setLoading(false);
      }
    );

    // Safety timeout so it never hangs in loading state
    const timer = setTimeout(() => {
      setLoading(false);
    }, 4000);

    return () => {
      clearTimeout(timer);
      unsubscribe();
    };
  }, [activeMonthId]);

  const todayDate = getTodayDateString();

  // Tomorrow's date string YYYY-MM-DD
  const tomorrowDate = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, []);

  const todaySchedules = useMemo(() => {
    return schedules.filter((s) => s.date === todayDate);
  }, [schedules, todayDate]);

  const tomorrowSchedules = useMemo(() => {
    return schedules.filter((s) => s.date === tomorrowDate);
  }, [schedules, tomorrowDate]);

  const upcomingSchedules = useMemo(() => {
    return schedules.filter((s) => s.date >= todayDate);
  }, [schedules, todayDate]);

  const pastSchedules = useMemo(() => {
    return schedules.filter((s) => s.date < todayDate);
  }, [schedules, todayDate]);

  const stats = useMemo(() => {
    const totalCount = schedules.length;
    const completedCount = schedules.filter((s) => s.status === 'completed').length;
    const pendingCount = schedules.filter((s) => s.status === 'pending').length;
    const todayCount = todaySchedules.length;

    return {
      totalCount,
      completedCount,
      pendingCount,
      todayCount,
    };
  }, [schedules, todaySchedules]);

  const addSchedule = async (scheduleData) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await bazarScheduleService.addSchedule({
        ...scheduleData,
        monthId: activeMonthId,
      });
      return res;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  };

  const updateSchedule = async (scheduleId, updateData) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await bazarScheduleService.updateSchedule(scheduleId, {
        ...updateData,
        monthId: activeMonthId,
      });
      return res;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  };

  const deleteSchedule = async (scheduleId) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await bazarScheduleService.deleteSchedule(scheduleId, activeMonthId);
      return res;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  };

  const toggleStatus = async (scheduleId, currentStatus) => {
    setActionLoading(true);
    try {
      return await bazarScheduleService.toggleStatus(scheduleId, currentStatus, activeMonthId);
    } finally {
      setActionLoading(false);
    }
  };

  const autoRotate = async (config) => {
    setActionLoading(true);
    setError(null);
    try {
      const res = await bazarScheduleService.autoRotateSchedule({
        ...config,
        monthId: activeMonthId,
      });
      return res;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  };

  const [autoDispatchStatus, setAutoDispatchStatus] = useState(null);

  // Auto-check and dispatch today's duty alert if enabled in settings
  useEffect(() => {
    let isMounted = true;
    const runAutoDispatch = async () => {
      if (!schedules || schedules.length === 0 || !activeMonthId) return;
      try {
        const config = await whatsappAutoService.getConfig();
        if (config.enabled && isMounted) {
          const res = await whatsappAutoService.checkAndAutoDispatchToday(schedules, activeMonthId);
          if (res.dispatched > 0 && isMounted) {
            setAutoDispatchStatus(`Auto-sent WhatsApp alert to ${res.dispatched} duty member(s).`);
          }
        }
      } catch (err) {
        console.warn('Auto dispatch check failed:', err);
      }
    };

    runAutoDispatch();
    return () => { isMounted = false; };
  }, [schedules, activeMonthId]);

  const notifyOnWhatsApp = (schedule) => {
    const message = generateWhatsAppMessage({ schedule });
    openWhatsAppChat({ phone: schedule.memberPhone, message });
  };

  const copyWhatsAppMessage = async (schedule) => {
    const message = generateWhatsAppMessage({ schedule });
    return await copyToClipboard(message);
  };

  const sendAutoWhatsApp = async (schedule) => {
    setActionLoading(true);
    try {
      const res = await whatsappAutoService.dispatchDutyAlert(schedule, activeMonthId);
      return res;
    } finally {
      setActionLoading(false);
    }
  };

  return {
    schedules,
    todaySchedules,
    tomorrowSchedules,
    upcomingSchedules,
    pastSchedules,
    stats,
    activeMembers,
    loading,
    actionLoading,
    error,
    autoDispatchStatus,
    addSchedule,
    updateSchedule,
    deleteSchedule,
    toggleStatus,
    autoRotate,
    notifyOnWhatsApp,
    copyWhatsAppMessage,
    sendAutoWhatsApp,
  };
};
