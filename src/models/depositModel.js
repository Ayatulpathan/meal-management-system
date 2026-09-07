/**
 * Deposit Data Model
 * Structure:
 * Path: months/{monthId}/deposits/{depositId}
 * {
 *   memberId: string,
 *   amount: number (> 0),
 *   date: string (YYYY-MM-DD),
 *   note?: string,
 *   createdBy?: string,
 *   createdAt: Timestamp | Date | string,
 *   updatedAt: Timestamp | Date | string
 * }
 */

export const createDepositModel = (data = {}, userId = 'admin') => {
  return {
    memberId: data.memberId,
    amount: Math.abs(Number(data.amount) || 0),
    date: data.date || new Date().toISOString().slice(0, 10),
    note: data.note?.trim() || '',
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const sanitizeDeposit = (id, data = {}) => {
  return {
    id,
    memberId: data.memberId || '',
    amount: Number(data.amount) || 0,
    date: data.date || '',
    note: data.note || '',
    createdBy: data.createdBy || '',
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};
