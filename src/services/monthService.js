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
import { DEFAULT_MESS_ID } from '../models/messModel';

const COLLECTION_NAME = 'months';
const LOCAL_STORAGE_KEY = 'mms_months_local';

const getLocalMonths = (messId = DEFAULT_MESS_ID) => {
  const key = `${LOCAL_STORAGE_KEY}_${messId}`;
  const stored = localStorage.getItem(key);
  if (!stored) {
    const currentId = getCurrentMonthId();
    const initialMonths = [
      createMonthModel(currentId, 'open'),
      createMonthModel('2026-08', 'closed'),
    ];
    localStorage.setItem(key, JSON.stringify(initialMonths));
    return initialMonths;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

const saveLocalMonths = (months, messId = DEFAULT_MESS_ID) => {
  localStorage.setItem(`${LOCAL_STORAGE_KEY}_${messId}`, JSON.stringify(months));
};

export const monthService = {
  /**
   * Subscribe to list of months for a specific mess
   */
  subscribeMonths(callback, messId = DEFAULT_MESS_ID) {
    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalMonths(messId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const monthsRef = collection(db, COLLECTION_NAME);
    const q = query(monthsRef, orderBy('month', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const allMonths = snapshot.docs.map(d => sanitizeMonth(d.id, d.data()));
      // Filter by messId:
      // For default Khadok Mess: include months without prefix or messId === 'khadok-mess'
      // For other messes: include months with `${messId}_` prefix or messId === messId
      const filtered = allMonths.filter(m => {
        if (messId === DEFAULT_MESS_ID) {
          return !m.id.includes('_') || m.messId === DEFAULT_MESS_ID;
        }
        return m.id.startsWith(`${messId}_`) || m.messId === messId;
      }).map(m => {
        // Normalize month string for UI display
        const cleanMonth = m.id.includes('_') ? m.id.split('_').pop() : m.id;
        return {
          ...m,
          month: cleanMonth,
        };
      });

      callback(filtered);
    }, (error) => {
      console.error('Error subscribing to months:', error);
      callback(getLocalMonths(messId));
    });
  },

  /**
   * Get all months for a mess
   */
  async getMonths(messId = DEFAULT_MESS_ID) {
    if (!isFirebaseConfigured()) {
      return getLocalMonths(messId);
    }
    try {
      const monthsRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(monthsRef);
      const all = snapshot.docs.map(d => sanitizeMonth(d.id, d.data()));
      return all.filter(m => {
        if (messId === DEFAULT_MESS_ID) {
          return !m.id.includes('_') || m.messId === DEFAULT_MESS_ID;
        }
        return m.id.startsWith(`${messId}_`) || m.messId === messId;
      });
    } catch (err) {
      console.error('Error getting months:', err);
      return getLocalMonths(messId);
    }
  },

  /**
   * Ensure a month document exists, creating it if not
   */
  async ensureMonthExists(monthId, messId = DEFAULT_MESS_ID) {
    if (!monthId) return null;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;
    const docId = messId === DEFAULT_MESS_ID ? cleanMonth : `${messId}_${cleanMonth}`;

    if (!isFirebaseConfigured()) {
      const months = getLocalMonths(messId);
      let found = months.find(m => m.id === docId || m.month === cleanMonth);
      if (!found) {
        found = { id: docId, messId, ...createMonthModel(cleanMonth, 'open') };
        months.unshift(found);
        saveLocalMonths(months, messId);
        window.dispatchEvent(new Event('storage'));
      }
      return found;
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, docId);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        const newMonth = {
          ...createMonthModel(cleanMonth, 'open'),
          messId,
        };
        await setDoc(docRef, newMonth);
        return { id: docId, ...newMonth };
      }
      return sanitizeMonth(docSnap.id, docSnap.data());
    } catch (err) {
      console.error(`Error ensuring month ${docId}:`, err);
      return createMonthModel(cleanMonth, 'open');
    }
  },

  /**
   * Update month status ('open' or 'closed')
   */
  async setMonthStatus(monthId, status, messId = DEFAULT_MESS_ID) {
    const validStatus = status === 'closed' ? 'closed' : 'open';
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;
    const docId = messId === DEFAULT_MESS_ID ? cleanMonth : `${messId}_${cleanMonth}`;

    if (!isFirebaseConfigured()) {
      const months = getLocalMonths(messId);
      const idx = months.findIndex(m => m.id === docId || m.month === cleanMonth);
      if (idx !== -1) {
        months[idx].status = validStatus;
        months[idx].updatedAt = new Date().toISOString();
      } else {
        months.unshift({ id: docId, messId, ...createMonthModel(cleanMonth, validStatus) });
      }
      saveLocalMonths(months, messId);
      window.dispatchEvent(new Event('storage'));
      return { id: docId, status: validStatus };
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, docId);
      await setDoc(docRef, {
        status: validStatus,
        messId,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      return { id: docId, status: validStatus };
    } catch (err) {
      console.error(`Error updating status for month ${docId}:`, err);
      throw new Error('Unable to update month status.');
    }
  }
};
