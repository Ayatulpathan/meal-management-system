import { useState, useEffect, useMemo } from 'react';
import { bazarScheduleService } from '../services/bazarScheduleService';
import { useMonthContext } from '../context/MonthContext';
import { useMembers } from './useMembers';
import { getTodayDateString } from '../utils/dateUtils';
import {
  generateWhatsAppMessage,
  openWhatsAppChat,
  copyToClipboard
} from '../utils/bazarNotificationUtils';

export const useBazarSchedule = () => {
  const { currentMonthId } = useMonthContext();
  const { activeMembers } = useMembers();

  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!currentMonthId) return;

    setLoading(true);
    const unsubscribe = bazarScheduleService.subscribeBazarSchedule(
      currentMonthId,
      (data) => {
        setSchedules(data);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentMonthId]);

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
        monthId: currentMonthId,
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
        monthId: currentMonthId,
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
      const res = await bazarScheduleService.deleteSchedule(scheduleId, currentMonthId);
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
      return await bazarScheduleService.toggleStatus(scheduleId, currentStatus, currentMonthId);
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
        monthId: currentMonthId,
      });
      return res;
    } catch (err) {
      setError(err.message);
      return { success: false, error: err.message };
    } finally {
      setActionLoading(false);
    }
  };

  const notifyOnWhatsApp = (schedule) => {
    const message = generateWhatsAppMessage({ schedule });
    openWhatsAppChat({ phone: schedule.memberPhone, message });
  };

  const copyWhatsAppMessage = async (schedule) => {
    const message = generateWhatsAppMessage({ schedule });
    return await copyToClipboard(message);
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
    addSchedule,
    updateSchedule,
    deleteSchedule,
    toggleStatus,
    autoRotate,
    notifyOnWhatsApp,
    copyWhatsAppMessage,
  };
};
