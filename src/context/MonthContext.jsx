import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { monthService } from '../services/monthService';
import { getCurrentMonthId, formatMonthName, getDaysInMonth, getRecentMonthOptions } from '../utils/dateUtils';
import { useMessContext } from './MessContext';

const MonthContext = createContext(null);

export const MonthProvider = ({ children }) => {
  const { currentMessId, getScopedMonthDocId } = useMessContext();

  const [selectedMonth, setSelectedMonth] = useState(() => {
    return localStorage.getItem(`mms_selected_month_${currentMessId}`) || getCurrentMonthId();
  });
  const [monthsList, setMonthsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to months list for active mess
  useEffect(() => {
    setLoading(true);
    const unsubscribe = monthService.subscribeMonths((months) => {
      setMonthsList(months);
      setLoading(false);
    }, currentMessId);

    return () => unsubscribe();
  }, [currentMessId]);

  // Ensure current selected month exists in database for active mess
  useEffect(() => {
    if (selectedMonth && currentMessId) {
      localStorage.setItem(`mms_selected_month_${currentMessId}`, selectedMonth);
      monthService.ensureMonthExists(selectedMonth, currentMessId);
    }
  }, [selectedMonth, currentMessId]);

  const monthDocId = useMemo(() => {
    return getScopedMonthDocId(selectedMonth);
  }, [getScopedMonthDocId, selectedMonth]);

  const currentMonthData = useMemo(() => {
    const cleanMonth = selectedMonth.includes('_') ? selectedMonth.split('_').pop() : selectedMonth;
    const found = monthsList.find(m => m.month === cleanMonth || m.id === monthDocId);
    if (found) return { ...found, days: 31 };

    return {
      id: monthDocId,
      month: cleanMonth,
      monthName: formatMonthName(cleanMonth),
      days: 31,
      status: 'open',
    };
  }, [monthsList, selectedMonth, monthDocId]);

  const isClosed = currentMonthData.status === 'closed';

  const selectMonth = (monthId) => {
    if (monthId) {
      const clean = monthId.includes('_') ? monthId.split('_').pop() : monthId;
      setSelectedMonth(clean);
    }
  };

  const createMonth = async (monthId) => {
    const clean = monthId.includes('_') ? monthId.split('_').pop() : monthId;
    const created = await monthService.ensureMonthExists(clean, currentMessId);
    setSelectedMonth(clean);
    return created;
  };

  const toggleMonthStatus = async (newStatus) => {
    const status = newStatus || (isClosed ? 'open' : 'closed');
    const updated = await monthService.setMonthStatus(selectedMonth, status, currentMessId);
    return updated;
  };

  const value = {
    selectedMonth,
    monthDocId,
    activeMonthId: monthDocId, // backward-compatible alias
    currentMonthData,
    isClosed,
    monthsList,
    recentOptions: getRecentMonthOptions(),
    loading,
    selectMonth,
    createMonth,
    toggleMonthStatus,
  };

  return <MonthContext.Provider value={value}>{children}</MonthContext.Provider>;
};

export const useMonthContext = () => {
  const context = useContext(MonthContext);
  if (!context) {
    throw new Error('useMonthContext must be used within a MonthProvider');
  }
  return context;
};
