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
import { createDepositModel, sanitizeDeposit } from '../models/depositModel';

const LOCAL_STORAGE_KEY_PREFIX = 'mms_deposits_';

const getLocalKey = (monthId) => `${LOCAL_STORAGE_KEY_PREFIX}${monthId}`;

const getLocalDeposits = (monthId) => {
  const key = getLocalKey(monthId);
  const stored = localStorage.getItem(key);
  if (!stored) {
    // Seed initial demo deposits matching specification test (Rahim: 12000, Karim: 7000, Hasan: 15000)
    const initialDeposits = [
      { id: 'dep_001', memberId: 'member_001', amount: 6000, date: `${monthId}-01`, note: 'First advance deposit (bKash)', createdBy: 'admin', createdAt: new Date().toISOString() },
      { id: 'dep_002', memberId: 'member_001', amount: 6000, date: `${monthId}-15`, note: 'Second advance deposit (Cash)', createdBy: 'admin', createdAt: new Date().toISOString() },
      { id: 'dep_003', memberId: 'member_002', amount: 7000, date: `${monthId}-02`, note: 'Monthly advance deposit (Nagad)', createdBy: 'admin', createdAt: new Date().toISOString() },
      { id: 'dep_004', memberId: 'member_003', amount: 15000, date: `${monthId}-01`, note: 'Full month advance deposit (Bank)', createdBy: 'admin', createdAt: new Date().toISOString() },
    ];
    localStorage.setItem(key, JSON.stringify(initialDeposits));
    return initialDeposits;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

const saveLocalDeposits = (monthId, deposits) => {
  localStorage.setItem(getLocalKey(monthId), JSON.stringify(deposits));
};

export const depositService = {
  /**
   * Subscribe to real-time deposits for a month
   * Path: months/{monthId}/deposits
   */
  subscribeDeposits(monthId, callback) {
    if (!monthId) return () => {};

    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalDeposits(monthId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const depositsRef = collection(db, 'months', monthId, 'deposits');
    const q = query(depositsRef, orderBy('date', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const deposits = snapshot.docs.map(d => sanitizeDeposit(d.id, d.data()));
      callback(deposits);
    }, (error) => {
      console.error(`Error subscribing to deposits for month ${monthId}:`, error);
    });
  },

  /**
   * Fetch deposits once
   */
  async getDeposits(monthId) {
    if (!monthId) return [];

    if (!isFirebaseConfigured()) {
      return getLocalDeposits(monthId);
    }

    try {
      const depositsRef = collection(db, 'months', monthId, 'deposits');
      const snapshot = await getDocs(depositsRef);
      return snapshot.docs.map(d => sanitizeDeposit(d.id, d.data()));
    } catch (err) {
      console.error(`Error fetching deposits for month ${monthId}:`, err);
      throw new Error('Unable to load deposits.');
    }
  },

  /**
   * Add new deposit
   */
  async addDeposit(monthId, depositData, userId = 'admin') {
    const model = createDepositModel(depositData, userId);

    if (!isFirebaseConfigured()) {
      const deposits = getLocalDeposits(monthId);
      const newId = `dep_${Date.now()}`;
      const created = { id: newId, ...model };
      deposits.unshift(created);
      saveLocalDeposits(monthId, deposits);
      window.dispatchEvent(new Event('storage'));
      return created;
    }

    try {
      const depositsRef = collection(db, 'months', monthId, 'deposits');
      const docRef = await addDoc(depositsRef, model);
      return { id: docRef.id, ...model };
    } catch (err) {
      console.error('Error adding deposit:', err);
      throw new Error('Unable to add deposit record. Please try again.');
    }
  },

  /**
   * Update deposit
   */
  async updateDeposit(monthId, depositId, depositData) {
    if (!monthId || !depositId) throw new Error('Month and Deposit ID are required.');

    if (!isFirebaseConfigured()) {
      const deposits = getLocalDeposits(monthId);
      const index = deposits.findIndex(d => d.id === depositId);
      if (index !== -1) {
        deposits[index] = { ...deposits[index], ...depositData, amount: Number(depositData.amount), updatedAt: new Date().toISOString() };
        saveLocalDeposits(monthId, deposits);
        window.dispatchEvent(new Event('storage'));
        return deposits[index];
      }
      throw new Error('Deposit record not found.');
    }

    try {
      const docRef = doc(db, 'months', monthId, 'deposits', depositId);
      const payload = {
        ...depositData,
        amount: Number(depositData.amount),
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(docRef, payload);
      return { id: depositId, ...payload };
    } catch (err) {
      console.error('Error updating deposit:', err);
      throw new Error('Unable to update deposit.');
    }
  },

  /**
   * Delete deposit
   */
  async deleteDeposit(monthId, depositId) {
    if (!monthId || !depositId) throw new Error('Month and Deposit ID are required.');

    if (!isFirebaseConfigured()) {
      const deposits = getLocalDeposits(monthId);
      const filtered = deposits.filter(d => d.id !== depositId);
      saveLocalDeposits(monthId, filtered);
      window.dispatchEvent(new Event('storage'));
      return { success: true };
    }

    try {
      const docRef = doc(db, 'months', monthId, 'deposits', depositId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (err) {
      console.error('Error deleting deposit:', err);
      throw new Error('Unable to delete deposit.');
    }
  }
};
