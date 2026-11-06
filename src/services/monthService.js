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
import {
  getMessCollection,
  getMessDoc,
  getRootCollection,
  getRootDoc,
  setMessDocData,
  updateMessDocData
} from './dbPaths';
import { createMonthModel, sanitizeMonth } from '../models/monthlyModel';
import { getCurrentMonthId, getRecentMonthOptions } from '../utils/dateUtils';
import { DEFAULT_MESS_ID, getActiveMessId } from '../models/messModel';

const COLLECTION_NAME = 'months';
const LOCAL_STORAGE_KEY = 'mms_months_local';

const getLocalMonths = (messId = DEFAULT_MESS_ID) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  const key = `${LOCAL_STORAGE_KEY}_${targetMessId}`;
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
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  localStorage.setItem(`${LOCAL_STORAGE_KEY}_${targetMessId}`, JSON.stringify(months));
};

export const monthService = {
  /**
   * Subscribe to list of months for a specific mess
   */
  subscribeMonths(callback, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;

    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalMonths(targetMessId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const monthsRef = getMessCollection(targetMessId, COLLECTION_NAME);
    const q = query(monthsRef, orderBy('month', 'desc'));

    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const months = snapshot.docs.map(d => sanitizeMonth(d.id, { ...d.data(), messId: targetMessId }));
        saveLocalMonths(months, targetMessId);
        callback(months);
        return;
      }

      // If Khadok Mess and tenant collection is empty, check root as non-destructive fallback
      if (targetMessId === DEFAULT_MESS_ID) {
        getDocs(query(getRootCollection(COLLECTION_NAME), orderBy('month', 'desc')))
          .then((rootSnap) => {
            if (!rootSnap.empty) {
              const rootMonths = rootSnap.docs
                .filter(d => !d.id.includes('_'))
                .map(d => sanitizeMonth(d.id, { ...d.data(), messId: DEFAULT_MESS_ID }));
              saveLocalMonths(rootMonths, DEFAULT_MESS_ID);
              callback(rootMonths);
            } else {
              callback([]);
            }
          })
          .catch(() => callback(getLocalMonths(targetMessId)));
        return;
      }

      callback([]);
    }, (error) => {
      console.error('Error subscribing to months:', error);
      callback(getLocalMonths(targetMessId));
    });
  },

  /**
   * Get all months for a mess
   */
  async getMonths(messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;

    if (!isFirebaseConfigured()) {
      return getLocalMonths(targetMessId);
    }
    try {
      const monthsRef = getMessCollection(targetMessId, COLLECTION_NAME);
      const snapshot = await getDocs(monthsRef);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => sanitizeMonth(d.id, { ...d.data(), messId: targetMessId }));
      }

      if (targetMessId === DEFAULT_MESS_ID) {
        const rootSnap = await getDocs(getRootCollection(COLLECTION_NAME));
        if (!rootSnap.empty) {
          return rootSnap.docs
            .filter(d => !d.id.includes('_'))
            .map(d => sanitizeMonth(d.id, { ...d.data(), messId: DEFAULT_MESS_ID }));
        }
      }

      return [];
    } catch (err) {
      console.error('Error fetching months:', err);
      return getLocalMonths(targetMessId);
    }
  },

  /**
   * Get specific month by ID
   */
  async getMonthById(monthId, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      const local = getLocalMonths(targetMessId);
      return local.find(m => m.month === cleanMonth || m.id === cleanMonth) || null;
    }

    try {
      const docRef = getMessDoc(targetMessId, COLLECTION_NAME, cleanMonth);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return sanitizeMonth(snap.id, { ...snap.data(), messId: targetMessId });
      }

      if (targetMessId === DEFAULT_MESS_ID) {
        const rootSnap = await getDoc(getRootDoc(COLLECTION_NAME, cleanMonth));
        if (rootSnap.exists()) {
          return sanitizeMonth(rootSnap.id, { ...rootSnap.data(), messId: DEFAULT_MESS_ID });
        }
      }

      return null;
    } catch (err) {
      console.error('Error getting month by id:', err);
      return null;
    }
  },

  /**
   * Ensure a month document exists in the mess database tree
   */
  async ensureMonthExists(monthId, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;

    if (!cleanMonth) return null;

    if (!isFirebaseConfigured()) {
      const local = getLocalMonths(targetMessId);
      const existing = local.find(m => m.month === cleanMonth || m.id === cleanMonth);
      if (existing) return existing;

      const newMonth = createMonthModel(cleanMonth, 'open');
      newMonth.messId = targetMessId;
      local.unshift(newMonth);
      saveLocalMonths(local, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return newMonth;
    }

    try {
      const docRef = getMessDoc(targetMessId, COLLECTION_NAME, cleanMonth);
      const snap = await getDoc(docRef);

      if (!snap.exists()) {
        const model = createMonthModel(cleanMonth, 'open');
        model.messId = targetMessId;

        // Dual-write: saves to messes/{targetMessId}/months/{cleanMonth} (and root if Khadok)
        await setMessDocData(targetMessId, [COLLECTION_NAME, cleanMonth], model);
        return model;
      }
      return sanitizeMonth(snap.id, { ...snap.data(), messId: targetMessId });
    } catch (err) {
      console.error('Error ensuring month exists:', err);
      return createMonthModel(cleanMonth, 'open');
    }
  },

  /**
   * Set month status (open or closed)
   */
  async setMonthStatus(monthId, status, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      const local = getLocalMonths(targetMessId);
      const index = local.findIndex(m => m.month === cleanMonth || m.id === cleanMonth);
      if (index !== -1) {
        local[index] = { ...local[index], status, updatedAt: new Date().toISOString() };
        saveLocalMonths(local, targetMessId);
        window.dispatchEvent(new Event('storage'));
        return local[index];
      }
      throw new Error('Month record not found.');
    }

    try {
      const payload = {
        status,
        messId: targetMessId,
        updatedAt: new Date().toISOString()
      };

      await updateMessDocData(targetMessId, [COLLECTION_NAME, cleanMonth], payload);
      return { id: cleanMonth, ...payload };
    } catch (err) {
      console.error('Error updating month status:', err);
      throw new Error('Unable to update month status.');
    }
  }
};
