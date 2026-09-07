/**
 * Month Data Model
 * Structure:
 * Collection: months/{monthId}
 * {
 *   month: string (e.g. "2026-09"),
 *   monthName: string (e.g. "September 2026"),
 *   days: number (e.g. 30),
 *   status: 'open' | 'closed',
 *   createdAt: Timestamp | Date | string,
 *   updatedAt: Timestamp | Date | string
 * }
 */

import { formatMonthName, getDaysInMonth } from '../utils/dateUtils';

export const createMonthModel = (monthId, status = 'open') => {
  return {
    month: monthId,
    monthName: formatMonthName(monthId),
    days: getDaysInMonth(monthId),
    status: status === 'closed' ? 'closed' : 'open',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const sanitizeMonth = (monthId, data = {}) => {
  return {
    id: monthId,
    month: monthId,
    monthName: data.monthName || formatMonthName(monthId),
    days: data.days || getDaysInMonth(monthId),
    status: data.status || 'open',
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};
