import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { monthService } from '../services/monthService';
import { getCurrentMonthId, formatMonthName, getDaysInMonth, getRecentMonthOptions } from '../utils/dateUtils';

const MonthContext = createContext(null);

export const MonthProvider = ({ children }) => {
  const [selectedMonth, setSelectedMonth] = useState(() => {
    return localStorage.getItem('mms_selected_month') || getCurrentMonthId();
  });
  const [monthsList, setMonthsList] = useState([]);
  const [loading, setLoading] = useState(true);

  // Subscribe to months list
  useEffect(() => {
    const unsubscribe = monthService.subscribeMonths((months) => {
      setMonthsList(months);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Ensure current selected month exists in database
  useEffect(() => {
    if (selectedMonth) {
      localStorage.setItem('mms_selected_month', selectedMonth);
      monthService.ensureMonthExists(selectedMonth);
    }
  }, [selectedMonth]);

  const currentMonthData = useMemo(() => {
    const found = monthsList.find(m => m.month === selectedMonth || m.id === selectedMonth);
    if (found) return { ...found, days: 31 };

    return {
      id: selectedMonth,
      month: selectedMonth,
      monthName: formatMonthName(selectedMonth),
      days: 31,
      status: 'open',
    };
  }, [monthsList, selectedMonth]);

  const isClosed = currentMonthData.status === 'closed';

  const selectMonth = (monthId) => {
    if (monthId) {
      setSelectedMonth(monthId);
    }
  };

  const createMonth = async (monthId) => {
    const created = await monthService.ensureMonthExists(monthId);
    setSelectedMonth(monthId);
    return created;
  };

  const toggleMonthStatus = async (newStatus) => {
    const status = newStatus || (isClosed ? 'open' : 'closed');
    const updated = await monthService.setMonthStatus(selectedMonth, status);
    return updated;
  };

  const value = {
    selectedMonth,
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
