import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  isFirebaseConfigured
} from './firebase';
import {
  getMessCollection,
  getMessDoc,
  getRootCollection,
  getRootDoc,
  addMessDocData,
  updateMessDocData,
  deleteMessDocData
} from './dbPaths';
import { createDepositModel, sanitizeDeposit } from '../models/depositModel';
import { DEFAULT_MESS_ID, getActiveMessId } from '../models/messModel';

const LOCAL_STORAGE_KEY_PREFIX = 'mms_deposits_';

const getLocalKey = (monthId, messId = DEFAULT_MESS_ID) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;
  return `${LOCAL_STORAGE_KEY_PREFIX}${targetMessId}_${cleanMonth}`;
};

const getLocalDeposits = (monthId, messId = DEFAULT_MESS_ID) => {
  const key = getLocalKey(monthId, messId);
  const stored = localStorage.getItem(key);
  if (!stored) {
    const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;
    const legacyKey = `${LOCAL_STORAGE_KEY_PREFIX}${cleanMonth}`;
    const legacyStored = localStorage.getItem(legacyKey);
    if (legacyStored && (messId === DEFAULT_MESS_ID || !messId)) {
      try { return JSON.parse(legacyStored); } catch (e) { return []; }
    }
    return [];
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

const saveLocalDeposits = (monthId, deposits, messId = DEFAULT_MESS_ID) => {
  localStorage.setItem(getLocalKey(monthId, messId), JSON.stringify(deposits));
};

export const depositService = {
  /**
   * Subscribe to real-time deposits for a month
   * Path: messes/{messId}/months/{monthId}/deposits
   */
  subscribeDeposits(monthId, callback, messId) {
    if (!monthId) return () => {};
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalDeposits(cleanMonth, targetMessId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const depositsRef = getMessCollection(targetMessId, 'months', cleanMonth, 'deposits');
    const q = query(depositsRef, orderBy('date', 'desc'));

    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const deposits = snapshot.docs.map(d => sanitizeDeposit(d.id, d.data()));
        saveLocalDeposits(cleanMonth, deposits, targetMessId);
        callback(deposits);
        return;
      }

      // If Khadok Mess and empty, fallback to root
      if (targetMessId === DEFAULT_MESS_ID) {
        getDocs(query(getRootCollection('months', cleanMonth, 'deposits'), orderBy('date', 'desc')))
          .then((rootSnap) => {
            if (!rootSnap.empty) {
              const rootDeposits = rootSnap.docs.map(d => sanitizeDeposit(d.id, d.data()));
              saveLocalDeposits(cleanMonth, rootDeposits, DEFAULT_MESS_ID);
              callback(rootDeposits);
            } else {
              callback([]);
            }
          })
          .catch(() => callback(getLocalDeposits(cleanMonth, targetMessId)));
        return;
      }

      callback([]);
    }, (error) => {
      console.error(`Error subscribing to deposits for month ${cleanMonth}:`, error);
      callback(getLocalDeposits(cleanMonth, targetMessId));
    });
  },

  /**
   * Fetch deposits once
   */
  async getDeposits(monthId, messId) {
    if (!monthId) return [];
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      return getLocalDeposits(cleanMonth, targetMessId);
    }

    try {
      const depositsRef = getMessCollection(targetMessId, 'months', cleanMonth, 'deposits');
      const snapshot = await getDocs(depositsRef);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => sanitizeDeposit(d.id, d.data()));
      }

      if (targetMessId === DEFAULT_MESS_ID) {
        const rootSnap = await getDocs(getRootCollection('months', cleanMonth, 'deposits'));
        if (!rootSnap.empty) {
          return rootSnap.docs.map(d => sanitizeDeposit(d.id, d.data()));
        }
      }

      return [];
    } catch (err) {
      console.error(`Error fetching deposits for month ${cleanMonth}:`, err);
      return getLocalDeposits(cleanMonth, targetMessId);
    }
  },

  /**
   * Add new deposit
   */
  async addDeposit(monthId, depositData, userId = 'admin', messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;
    const model = createDepositModel(depositData, userId);

    if (!isFirebaseConfigured()) {
      const deposits = getLocalDeposits(cleanMonth, targetMessId);
      const newId = `dep_${Date.now()}`;
      const created = { id: newId, ...model };
      deposits.unshift(created);
      saveLocalDeposits(cleanMonth, deposits, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return created;
    }

    try {
      const docRef = await addMessDocData(targetMessId, ['months', cleanMonth, 'deposits'], model);
      return { id: docRef.id, ...model };
    } catch (err) {
      console.error('Error adding deposit:', err);
      throw new Error('Unable to add deposit record. Please try again.');
    }
  },

  /**
   * Update deposit
   */
  async updateDeposit(monthId, depositId, depositData, messId) {
    if (!monthId || !depositId) throw new Error('Month and Deposit ID are required.');
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      const deposits = getLocalDeposits(cleanMonth, targetMessId);
      const index = deposits.findIndex(d => d.id === depositId);
      if (index !== -1) {
        deposits[index] = { ...deposits[index], ...depositData, amount: Number(depositData.amount), updatedAt: new Date().toISOString() };
        saveLocalDeposits(cleanMonth, deposits, targetMessId);
        window.dispatchEvent(new Event('storage'));
        return deposits[index];
      }
      throw new Error('Deposit record not found.');
    }

    try {
      const payload = {
        ...depositData,
        amount: Number(depositData.amount),
        updatedAt: new Date().toISOString(),
      };
      await updateMessDocData(targetMessId, ['months', cleanMonth, 'deposits', depositId], payload);
      return { id: depositId, ...payload };
    } catch (err) {
      console.error('Error updating deposit:', err);
      throw new Error('Unable to update deposit.');
    }
  },

  /**
   * Delete deposit
   */
  async deleteDeposit(monthId, depositId, messId) {
    if (!monthId || !depositId) throw new Error('Month and Deposit ID are required.');
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      const deposits = getLocalDeposits(cleanMonth, targetMessId);
      const filtered = deposits.filter(d => d.id !== depositId);
      saveLocalDeposits(cleanMonth, filtered, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return { success: true };
    }

    try {
      await deleteMessDocData(targetMessId, ['months', cleanMonth, 'deposits', depositId]);
      return { success: true };
    } catch (err) {
      console.error('Error deleting deposit:', err);
      throw new Error('Unable to delete deposit.');
    }
  }
};
