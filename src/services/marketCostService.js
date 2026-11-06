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
import { createMarketCostModel, sanitizeMarketCost } from '../models/marketCostModel';
import { DEFAULT_MESS_ID, getActiveMessId } from '../models/messModel';

const LOCAL_STORAGE_KEY_PREFIX = 'mms_market_';

const getLocalKey = (monthId, messId = DEFAULT_MESS_ID) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;
  return `${LOCAL_STORAGE_KEY_PREFIX}${targetMessId}_${cleanMonth}`;
};

const getLocalMarketCosts = (monthId, messId = DEFAULT_MESS_ID) => {
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

const saveLocalMarketCosts = (monthId, costs, messId = DEFAULT_MESS_ID) => {
  localStorage.setItem(getLocalKey(monthId, messId), JSON.stringify(costs));
};

export const marketCostService = {
  /**
   * Subscribe to real-time market cost updates for a month
   * Path: messes/{messId}/months/{monthId}/marketCosts
   */
  subscribeMarketCosts(monthId, callback, messId) {
    if (!monthId) return () => {};
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalMarketCosts(cleanMonth, targetMessId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const costsRef = getMessCollection(targetMessId, 'months', cleanMonth, 'marketCosts');
    const q = query(costsRef, orderBy('date', 'desc'));

    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const costs = snapshot.docs.map(d => sanitizeMarketCost(d.id, d.data()));
        saveLocalMarketCosts(cleanMonth, costs, targetMessId);
        callback(costs);
        return;
      }

      // If Khadok Mess and empty, fallback to root
      if (targetMessId === DEFAULT_MESS_ID) {
        getDocs(query(getRootCollection('months', cleanMonth, 'marketCosts'), orderBy('date', 'desc')))
          .then((rootSnap) => {
            if (!rootSnap.empty) {
              const rootCosts = rootSnap.docs.map(d => sanitizeMarketCost(d.id, d.data()));
              saveLocalMarketCosts(cleanMonth, rootCosts, DEFAULT_MESS_ID);
              callback(rootCosts);
            } else {
              callback([]);
            }
          })
          .catch(() => callback(getLocalMarketCosts(cleanMonth, targetMessId)));
        return;
      }

      callback([]);
    }, (error) => {
      console.error(`Error subscribing to market costs for month ${cleanMonth}:`, error);
      callback(getLocalMarketCosts(cleanMonth, targetMessId));
    });
  },

  /**
   * Fetch market costs once
   */
  async getMarketCosts(monthId, messId) {
    if (!monthId) return [];
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      return getLocalMarketCosts(cleanMonth, targetMessId);
    }

    try {
      const costsRef = getMessCollection(targetMessId, 'months', cleanMonth, 'marketCosts');
      const snapshot = await getDocs(costsRef);
      if (!snapshot.empty) {
        return snapshot.docs.map(d => sanitizeMarketCost(d.id, d.data()));
      }

      if (targetMessId === DEFAULT_MESS_ID) {
        const rootSnap = await getDocs(getRootCollection('months', cleanMonth, 'marketCosts'));
        if (!rootSnap.empty) {
          return rootSnap.docs.map(d => sanitizeMarketCost(d.id, d.data()));
        }
      }

      return [];
    } catch (err) {
      console.error(`Error fetching market costs for month ${cleanMonth}:`, err);
      return getLocalMarketCosts(cleanMonth, targetMessId);
    }
  },

  /**
   * Add new market cost
   */
  async addMarketCost(monthId, costData, userId = 'admin', messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;
    const model = createMarketCostModel(costData, userId);

    if (!isFirebaseConfigured()) {
      const costs = getLocalMarketCosts(cleanMonth, targetMessId);
      const newId = `cost_${Date.now()}`;
      const created = { id: newId, ...model };
      costs.unshift(created);
      saveLocalMarketCosts(cleanMonth, costs, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return created;
    }

    try {
      const docRef = await addMessDocData(targetMessId, ['months', cleanMonth, 'marketCosts'], model);
      return { id: docRef.id, ...model };
    } catch (err) {
      console.error('Error adding market cost:', err);
      throw new Error('Unable to add market cost. Please try again.');
    }
  },

  /**
   * Update market cost
   */
  async updateMarketCost(monthId, costId, costData, messId) {
    if (!monthId || !costId) throw new Error('Month and Cost ID are required.');
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      const costs = getLocalMarketCosts(cleanMonth, targetMessId);
      const index = costs.findIndex(c => c.id === costId);
      if (index !== -1) {
        costs[index] = { ...costs[index], ...costData, amount: Number(costData.amount), updatedAt: new Date().toISOString() };
        saveLocalMarketCosts(cleanMonth, costs, targetMessId);
        window.dispatchEvent(new Event('storage'));
        return costs[index];
      }
      throw new Error('Market cost record not found.');
    }

    try {
      const payload = {
        ...costData,
        amount: Number(costData.amount),
        updatedAt: new Date().toISOString(),
      };
      await updateMessDocData(targetMessId, ['months', cleanMonth, 'marketCosts', costId], payload);
      return { id: costId, ...payload };
    } catch (err) {
      console.error('Error updating market cost:', err);
      throw new Error('Unable to update market cost.');
    }
  },

  /**
   * Delete market cost
   */
  async deleteMarketCost(monthId, costId, messId) {
    if (!monthId || !costId) throw new Error('Month and Cost ID are required.');
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      const costs = getLocalMarketCosts(cleanMonth, targetMessId);
      const filtered = costs.filter(c => c.id !== costId);
      saveLocalMarketCosts(cleanMonth, filtered, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return { success: true };
    }

    try {
      await deleteMessDocData(targetMessId, ['months', cleanMonth, 'marketCosts', costId]);
      return { success: true };
    } catch (err) {
      console.error('Error deleting market cost:', err);
      throw new Error('Unable to delete market cost.');
    }
  }
};
