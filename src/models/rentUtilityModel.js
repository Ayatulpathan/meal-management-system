/**
 * Utility Bill Categories
 */
export const UTILITY_CATEGORIES = [
  { id: 'electricity', label: 'Electricity Bill', icon: 'Zap', color: 'text-amber-500 bg-amber-50 border-amber-200' },
  { id: 'gas', label: 'Gas Bill', icon: 'Flame', color: 'text-orange-500 bg-orange-50 border-orange-200' },
  { id: 'water', label: 'Water (WASA)', icon: 'Droplets', color: 'text-sky-500 bg-sky-50 border-sky-200' },
  { id: 'internet', label: 'Internet / WiFi', icon: 'Wifi', color: 'text-indigo-500 bg-indigo-50 border-indigo-200' },
  { id: 'maid', label: 'Maid / Cook Salary', icon: 'UserCheck', color: 'text-teal-500 bg-teal-50 border-teal-200' },
  { id: 'waste', label: 'Waste Collection', icon: 'Trash2', color: 'text-slate-500 bg-slate-50 border-slate-200' },
  { id: 'service', label: 'Service / Maintenance', icon: 'Building2', color: 'text-emerald-500 bg-emerald-50 border-emerald-200' },
  { id: 'other', label: 'Other Utility Expense', icon: 'Receipt', color: 'text-purple-500 bg-purple-50 border-purple-200' },
];

export const PAYMENT_METHODS = [
  'Cash',
  'bKash',
  'Nagad',
  'Rocket',
  'Bank Transfer',
  'Other',
];

/**
 * Creates a sanitized Utility Bill model
 */
export const createUtilityBillModel = (data = {}, user = null) => {
  return {
    category: data.category || 'electricity',
    title: data.title?.trim() || 'Utility Bill',
    amount: Math.abs(Number(data.amount) || 0),
    date: data.date || new Date().toISOString().slice(0, 10),
    note: data.note?.trim() || '',
    paidBy: data.paidBy?.trim() || user?.displayName || 'Administrator',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const sanitizeUtilityBill = (id, data = {}) => {
  return {
    id,
    category: data.category || 'other',
    title: data.title || 'Utility Bill',
    amount: Number(data.amount) || 0,
    date: data.date || '',
    note: data.note || '',
    paidBy: data.paidBy || 'Administrator',
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};

/**
 * Creates a sanitized Rent Payment model
 */
export const createRentPaymentModel = (data = {}, user = null) => {
  return {
    memberId: data.memberId || '',
    memberName: data.memberName || 'Member',
    amount: Math.abs(Number(data.amount) || 0),
    date: data.date || new Date().toISOString().slice(0, 10),
    method: data.method?.trim() || 'Cash',
    note: data.note?.trim() || 'Rent & Utility Payment',
    recordedBy: user?.displayName || 'Administrator',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

export const sanitizeRentPayment = (id, data = {}) => {
  return {
    id,
    memberId: data.memberId || '',
    memberName: data.memberName || 'Member',
    amount: Number(data.amount) || 0,
    date: data.date || '',
    method: data.method || 'Cash',
    note: data.note || '',
    recordedBy: data.recordedBy || 'Administrator',
    createdAt: data.createdAt || null,
    updatedAt: data.updatedAt || null,
  };
};
