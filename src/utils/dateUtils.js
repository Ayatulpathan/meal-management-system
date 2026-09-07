/**
 * Date Utility for Meal Management System
 * Handles YYYY-MM and YYYY-MM-DD formats consistently
 */

/**
 * Returns current month string in YYYY-MM format (e.g. "2026-09")
 */
export const getCurrentMonthId = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

/**
 * Returns today's date string in YYYY-MM-DD format (e.g. "2026-09-07")
 */
export const getTodayDateString = () => {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * Returns today's day number as integer (1 to 31)
 */
export const getTodayDayNumber = () => {
  return new Date().getDate();
};

/**
 * Formats a monthId (e.g., "2026-09") into a human-readable string ("September 2026")
 * @param {string} monthId 
 * @returns {string}
 */
export const formatMonthName = (monthId) => {
  if (!monthId || !monthId.includes('-')) return '';
  const [year, month] = monthId.split('-').map(Number);
  const date = new Date(year, month - 1, 1);
  return date.toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
};

/**
 * Returns 31 days for meal management grid accounting
 * @param {string} monthId 
 * @returns {number}
 */
export const getDaysInMonth = (monthId) => {
  return 31;
};

/**
 * Generates an array of 31 day numbers [1, 2, ..., 31]
 * @param {string} monthId 
 * @returns {number[]}
 */
export const getDayList = (monthId) => {
  return Array.from({ length: 31 }, (_, i) => i + 1);
};

/**
 * Formats a date string (YYYY-MM-DD) for display (e.g. "Sep 07, 2026")
 * @param {string|Date} dateStr 
 * @returns {string}
 */
export const formatDateDisplay = (dateStr) => {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return String(dateStr);
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: '2-digit',
    year: 'numeric',
  });
};

/**
 * Generates recent month choices for selector
 */
export const getRecentMonthOptions = (count = 12) => {
  const options = [];
  const current = new Date();
  
  for (let i = -2; i < count - 2; i++) {
    const d = new Date(current.getFullYear(), current.getMonth() - i, 1);
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const monthId = `${year}-${month}`;
    options.push({
      id: monthId,
      name: formatMonthName(monthId),
      days: getDaysInMonth(monthId),
    });
  }
  return options;
};
