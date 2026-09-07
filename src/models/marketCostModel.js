/**
 * Market Cost Data Model
 * Structure:
 * Path: months/{monthId}/marketCosts/{costId}
 * {
 *   date: string (YYYY-MM-DD),
 *   amount: number (> 0),
 *   description?: string,
 *   createdBy?: string,
 *   createdAt: Timestamp | Date | string,
 *   updatedAt: Timestamp | Date | string
 * }
 */

export const createMarketCostModel = (data = {}, user = null) => {
  const userName = data.buyerName?.trim() || user?.displayName || user?.name || 'Administrator';
  const userId = data.buyerId || user?.memberId || user?.uid || (typeof user === 'string' ? user : 'admin');

  return {
    date: data.date || new Date().toISOString().slice(0, 10),
    amount: Math.abs(Number(data.amount) || 0),
    description: data.description?.trim() || '',
    buyerName: userName,
    buyerId: userId,
    createdBy: userId,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const sanitizeMarketCost = (id, data = {}) => {
  return {
    id,
    date: data.date || '',
    amount: Number(data.amount) || 0,
    description: data.description || '',
    buyerName: data.buyerName || data.buyer || data.createdBy || 'Administrator',
    buyerId: data.buyerId || data.createdBy || '',
    createdBy: data.createdBy || '',
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};
