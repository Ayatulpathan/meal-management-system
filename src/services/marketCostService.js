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
import { createMarketCostModel, sanitizeMarketCost } from '../models/marketCostModel';

const LOCAL_STORAGE_KEY_PREFIX = 'mms_market_';

const getLocalKey = (monthId) => `${LOCAL_STORAGE_KEY_PREFIX}${monthId}`;

const getLocalMarketCosts = (monthId) => {
  const key = getLocalKey(monthId);
  const stored = localStorage.getItem(key);
  if (!stored) {
    // Seed initial demo expenses totaling 30,000 for the sample month
    const initialCosts = [
      { id: 'cost_001', date: `${monthId}-02`, amount: 10000, description: 'Rice, Oil, Spices and Lentils', buyerName: 'Rahim Ahmed', createdBy: 'admin', createdAt: new Date().toISOString() },
      { id: 'cost_002', date: `${monthId}-08`, amount: 8000, description: 'Chicken, Fish, and Fresh Vegetables', buyerName: 'Karim Ullah', createdBy: 'admin', createdAt: new Date().toISOString() },
      { id: 'cost_003', date: `${monthId}-15`, amount: 7000, description: 'Beef, Onions, and Seasonings', buyerName: 'Hasan Mahmud', createdBy: 'admin', createdAt: new Date().toISOString() },
      { id: 'cost_004', date: `${monthId}-22`, amount: 5000, description: 'Eggs, Potatoes, and Daily Groceries', buyerName: 'Administrator', createdBy: 'admin', createdAt: new Date().toISOString() },
    ];
    localStorage.setItem(key, JSON.stringify(initialCosts));
    return initialCosts;
  }
  try {
    return JSON.parse(stored);
  } catch (e) {
    return [];
  }
};

const saveLocalMarketCosts = (monthId, costs) => {
  localStorage.setItem(getLocalKey(monthId), JSON.stringify(costs));
};

export const marketCostService = {
  /**
   * Subscribe to real-time market cost updates for a month
   * Path: months/{monthId}/marketCosts
   */
  subscribeMarketCosts(monthId, callback) {
    if (!monthId) return () => {};

    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalMarketCosts(monthId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const costsRef = collection(db, 'months', monthId, 'marketCosts');
    const q = query(costsRef, orderBy('date', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const costs = snapshot.docs.map(d => sanitizeMarketCost(d.id, d.data()));
      callback(costs);
    }, (error) => {
      console.error(`Error subscribing to market costs for month ${monthId}:`, error);
    });
  },

  /**
   * Fetch market costs once
   */
  async getMarketCosts(monthId) {
    if (!monthId) return [];

    if (!isFirebaseConfigured()) {
      return getLocalMarketCosts(monthId);
    }

    try {
      const costsRef = collection(db, 'months', monthId, 'marketCosts');
      const snapshot = await getDocs(costsRef);
      return snapshot.docs.map(d => sanitizeMarketCost(d.id, d.data()));
    } catch (err) {
      console.error(`Error fetching market costs for month ${monthId}:`, err);
      throw new Error('Unable to load market costs.');
    }
  },

  /**
   * Add new market cost
   */
  async addMarketCost(monthId, costData, userId = 'admin') {
    const model = createMarketCostModel(costData, userId);

    if (!isFirebaseConfigured()) {
      const costs = getLocalMarketCosts(monthId);
      const newId = `cost_${Date.now()}`;
      const created = { id: newId, ...model };
      costs.unshift(created);
      saveLocalMarketCosts(monthId, costs);
      window.dispatchEvent(new Event('storage'));
      return created;
    }

    try {
      const costsRef = collection(db, 'months', monthId, 'marketCosts');
      const docRef = await addDoc(costsRef, model);
      return { id: docRef.id, ...model };
    } catch (err) {
      console.error('Error adding market cost:', err);
      throw new Error('Unable to add market cost. Please try again.');
    }
  },

  /**
   * Update market cost
   */
  async updateMarketCost(monthId, costId, costData) {
    if (!monthId || !costId) throw new Error('Month and Cost ID are required.');

    if (!isFirebaseConfigured()) {
      const costs = getLocalMarketCosts(monthId);
      const index = costs.findIndex(c => c.id === costId);
      if (index !== -1) {
        costs[index] = { ...costs[index], ...costData, amount: Number(costData.amount), updatedAt: new Date().toISOString() };
        saveLocalMarketCosts(monthId, costs);
        window.dispatchEvent(new Event('storage'));
        return costs[index];
      }
      throw new Error('Market cost record not found.');
    }

    try {
      const docRef = doc(db, 'months', monthId, 'marketCosts', costId);
      const payload = {
        ...costData,
        amount: Number(costData.amount),
        updatedAt: new Date().toISOString(),
      };
      await updateDoc(docRef, payload);
      return { id: costId, ...payload };
    } catch (err) {
      console.error('Error updating market cost:', err);
      throw new Error('Unable to update market cost.');
    }
  },

  /**
   * Delete market cost
   */
  async deleteMarketCost(monthId, costId) {
    if (!monthId || !costId) throw new Error('Month and Cost ID are required.');

    if (!isFirebaseConfigured()) {
      const costs = getLocalMarketCosts(monthId);
      const filtered = costs.filter(c => c.id !== costId);
      saveLocalMarketCosts(monthId, filtered);
      window.dispatchEvent(new Event('storage'));
      return { success: true };
    }

    try {
      const docRef = doc(db, 'months', monthId, 'marketCosts', costId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (err) {
      console.error('Error deleting market cost:', err);
      throw new Error('Unable to delete market cost.');
    }
  }
};
