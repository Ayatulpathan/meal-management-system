/**
 * Multi-Tenant Mess / Branch Data Model & Sanitizer
 */

export const DEFAULT_MESS_ID = 'khadok-mess';
export const DEFAULT_MESS_NAME = 'Khadok Mess';
export const DEFAULT_INVITE_CODE = 'KHD101';

/**
 * Returns the currently active Mess ID from storage or defaults to khadok-mess
 */
export const getActiveMessId = () => {
  if (typeof window !== 'undefined' && window.localStorage) {
    return window.localStorage.getItem('mms_active_mess_id') || DEFAULT_MESS_ID;
  }
  return DEFAULT_MESS_ID;
};

/**
 * Persists the currently active Mess ID
 */
export const setActiveMessId = (messId) => {
  if (typeof window !== 'undefined' && window.localStorage && messId) {
    window.localStorage.setItem('mms_active_mess_id', messId);
  }
};

/**
 * Generate a random 6-character uppercase alphanumeric invite code
 */
export const generateInviteCode = (prefix = 'MESS') => {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZ'; // excluded ambiguous 0, 1, I, O
  let code = '';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return `${prefix.slice(0, 3).toUpperCase()}${code}`;
};

/**
 * Creates a new Mess model instance
 */
export const createMessModel = ({
  id = '',
  name = '',
  inviteCode = '',
  managerEmail = '',
  managerName = 'Mess Manager',
  managerPhone = '',
  currency = '৳',
  address = '',
  status = 'active',
  createdAt = null,
} = {}) => {
  const generatedId = id || `mess_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
  const cleanName = (name || '').trim() || 'My Mess';
  const cleanCode = (inviteCode || '').trim().toUpperCase() || generateInviteCode(cleanName.replace(/[^a-zA-Z]/g, ''));

  return {
    id: generatedId,
    name: cleanName,
    inviteCode: cleanCode,
    managerEmail: (managerEmail || '').trim().toLowerCase(),
    managerName: (managerName || 'Mess Manager').trim(),
    managerPhone: (managerPhone || '').trim(),
    currency: currency || '৳',
    address: (address || '').trim(),
    status: status || 'active',
    createdAt: createdAt || new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };
};

/**
 * Default fallback Mess (preserves all existing legacy data)
 */
export const getDefaultMess = () => ({
  id: DEFAULT_MESS_ID,
  name: DEFAULT_MESS_NAME,
  inviteCode: DEFAULT_INVITE_CODE,
  managerEmail: 'admin@messhishab.com',
  managerName: 'Khadok Administrator',
  managerPhone: '',
  currency: '৳',
  address: 'Dhaka, Bangladesh',
  status: 'active',
  createdAt: '2026-09-01T00:00:00.000Z',
  updatedAt: new Date().toISOString(),
  isDefault: true,
});

/**
 * Sanitizes Mess data from Firestore
 */
export const sanitizeMess = (id, data = {}) => {
  return {
    id: id || data.id || DEFAULT_MESS_ID,
    name: data.name || DEFAULT_MESS_NAME,
    inviteCode: (data.inviteCode || '').toUpperCase(),
    managerEmail: (data.managerEmail || '').toLowerCase(),
    managerName: data.managerName || 'Mess Manager',
    managerPhone: data.managerPhone || '',
    currency: data.currency || '৳',
    address: data.address || '',
    status: data.status || 'active',
    createdAt: data.createdAt || new Date().toISOString(),
    updatedAt: data.updatedAt || new Date().toISOString(),
    isDefault: id === DEFAULT_MESS_ID,
  };
};
