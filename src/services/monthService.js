import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  onSnapshot,
  query,
  orderBy,
  isFirebaseConfigured
} from './firebase';
import { createMonthModel, sanitizeMonth } from '../models/monthlyModel';
import { getCurrentMonthId, getRecentMonthOptions } from '../utils/dateUtils';

const COLLECTION_NAME = 'months';
const LOCAL_STORAGE_KEY = 'mms_months_local';

const getLocalMonths = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    const currentId = getCurrentMonthId();
    const initialMonths = [
      createMonthModel(currentId, 'open'),
      createMonthModel('2026-08', 'closed'),
    ];
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initialMonths));
    return initialMonths;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

const saveLocalMonths = (months) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(months));
};

export const monthService = {
  /**
   * Subscribe to list of months
   */
  subscribeMonths(callback) {
    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalMonths());
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const monthsRef = collection(db, COLLECTION_NAME);
    const q = query(monthsRef, orderBy('month', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const months = snapshot.docs.map(d => sanitizeMonth(d.id, d.data()));
      callback(months);
    }, (error) => {
      console.error('Error subscribing to months:', error);
    });
  },

  /**
   * Get all months
   */
  async getMonths() {
    if (!isFirebaseConfigured()) {
      return getLocalMonths();
    }
    try {
      const monthsRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(monthsRef);
      return snapshot.docs.map(d => sanitizeMonth(d.id, d.data()));
    } catch (err) {
      console.error('Error getting months:', err);
      throw new Error('Unable to load months.');
    }
  },

  /**
   * Ensure a month document exists, creating it if not
   */
  async ensureMonthExists(monthId) {
    if (!monthId) return null;

    if (!isFirebaseConfigured()) {
      const months = getLocalMonths();
      let found = months.find(m => m.id === monthId || m.month === monthId);
      if (!found) {
        found = { id: monthId, ...createMonthModel(monthId, 'open') };
        months.unshift(found);
        saveLocalMonths(months);
        window.dispatchEvent(new Event('storage'));
      }
      return found;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, monthId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        const newMonth = createMonthModel(monthId, 'open');
        await setDoc(docRef, newMonth);
        return { id: monthId, ...newMonth };
      }
      return sanitizeMonth(docSnap.id, docSnap.data());
    } catch (err) {
      console.error(`Error ensuring month ${monthId}:`, err);
      return createMonthModel(monthId, 'open');
    }
  },

  /**
   * Update month status ('open' or 'closed')
   */
  async setMonthStatus(monthId, status) {
    const validStatus = status === 'closed' ? 'closed' : 'open';

    if (!isFirebaseConfigured()) {
      const months = getLocalMonths();
      const idx = months.findIndex(m => m.id === monthId || m.month === monthId);
      if (idx !== -1) {
        months[idx].status = validStatus;
        months[idx].updatedAt = new Date().toISOString();
      } else {
        months.unshift({ id: monthId, ...createMonthModel(monthId, validStatus) });
      }
      saveLocalMonths(months);
      window.dispatchEvent(new Event('storage'));
      return { id: monthId, status: validStatus };
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, monthId);
      await setDoc(docRef, {
        status: validStatus,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return { id: monthId, status: validStatus };
    } catch (err) {
      console.error(`Error updating status for month ${monthId}:`, err);
      throw new Error('Unable to update month status.');
    }
  }
};
