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
  createUtilityBillModel,
  sanitizeUtilityBill,
  createRentPaymentModel,
  sanitizeRentPayment
} from '../models/rentUtilityModel';

const UTILITY_STORAGE_PREFIX = 'mms_utility_';
const RENT_PAYMENTS_STORAGE_PREFIX = 'mms_rent_payments_';
const MEMBER_RENTS_STORAGE_PREFIX = 'mms_member_rents_';

const getUtilityStorageKey = (monthId) => `${UTILITY_STORAGE_PREFIX}${monthId}`;
const getPaymentsStorageKey = (monthId) => `${RENT_PAYMENTS_STORAGE_PREFIX}${monthId}`;
const getMemberRentsStorageKey = (monthId) => `${MEMBER_RENTS_STORAGE_PREFIX}${monthId}`;

// Seed initial default demo utility bills for local demo mode
const getLocalUtilityBills = (monthId) => {
  const key = getUtilityStorageKey(monthId);
  const stored = localStorage.getItem(key);
  if (!stored) {
    const initialBills = [
      { id: 'util_001', category: 'electricity', title: 'DESCO Prepaid Electricity', amount: 3200, date: `${monthId}-05`, note: 'Meter #48921', paidBy: 'Administrator', createdAt: new Date().toISOString() },
      { id: 'util_002', category: 'internet', title: 'High-speed Fiber WiFi (50 Mbps)', amount: 1500, date: `${monthId}-03`, note: 'Monthly bill', paidBy: 'Administrator', createdAt: new Date().toISOString() },
      { id: 'util_003', category: 'maid', title: 'Monthly Maid & Cooking Allowance', amount: 4000, date: `${monthId}-10`, note: 'Salary for full month', paidBy: 'Administrator', createdAt: new Date().toISOString() },
      { id: 'util_004', category: 'waste', title: 'City Corporation Waste Collection', amount: 300, date: `${monthId}-01`, note: 'Van collector fee', paidBy: 'Administrator', createdAt: new Date().toISOString() },
    ];
    localStorage.setItem(key, JSON.stringify(initialBills));
    return initialBills;
  }
  try { return JSON.parse(stored); } catch (e) { return []; }
};

const saveLocalUtilityBills = (monthId, bills) => {
  localStorage.setItem(getUtilityStorageKey(monthId), JSON.stringify(bills));
};

const getLocalRentPayments = (monthId) => {
  const key = getPaymentsStorageKey(monthId);
  const stored = localStorage.getItem(key);
  if (!stored) return [];
  try { return JSON.parse(stored); } catch (e) { return []; }
};

const saveLocalRentPayments = (monthId, payments) => {
  localStorage.setItem(getPaymentsStorageKey(monthId), JSON.stringify(payments));
};

const getLocalMemberRents = (monthId) => {
  const key = getMemberRentsStorageKey(monthId);
  const stored = localStorage.getItem(key);
  if (!stored) return {};
  try { return JSON.parse(stored); } catch (e) { return {}; }
};

const saveLocalMemberRents = (monthId, rents) => {
  localStorage.setItem(getMemberRentsStorageKey(monthId), JSON.stringify(rents));
};

export const rentUtilityService = {
  /**
   * Real-time subscription to monthly utility bills
   */
  subscribeUtilityBills(monthId, callback) {
    if (!monthId) return () => {};

    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalUtilityBills(monthId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const billsRef = collection(db, 'months', monthId, 'utilityBills');
    const q = query(billsRef, orderBy('date', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const bills = snapshot.docs.map(d => sanitizeUtilityBill(d.id, d.data()));
      callback(bills);
    }, (error) => {
      console.error(`Error subscribing to utility bills for month ${monthId}:`, error);
      callback(getLocalUtilityBills(monthId));
    });
  },

  /**
   * Real-time subscription to monthly rent payments
   */
  subscribeRentPayments(monthId, callback) {
    if (!monthId) return () => {};

    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalRentPayments(monthId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const paymentsRef = collection(db, 'months', monthId, 'rentPayments');
    const q = query(paymentsRef, orderBy('date', 'desc'));

    return onSnapshot(q, (snapshot) => {
      const payments = snapshot.docs.map(d => sanitizeRentPayment(d.id, d.data()));
      callback(payments);
    }, (error) => {
      console.error(`Error subscribing to rent payments for month ${monthId}:`, error);
      callback(getLocalRentPayments(monthId));
    });
  },

  /**
   * Real-time subscription to monthly member rents configuration
   */
  subscribeMemberRents(monthId, callback) {
    if (!monthId) return () => {};

    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalMemberRents(monthId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const docRef = doc(db, 'months', monthId, 'config', 'memberRents');
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        callback(snapshot.data()?.rents || {});
      } else {
        callback({});
      }
    }, (error) => {
      console.error(`Error subscribing to member rents for month ${monthId}:`, error);
      callback(getLocalMemberRents(monthId));
    });
  },

  /**
   * Save member rents configuration map { [memberId]: amount }
   */
  async saveMemberRents(monthId, rentsMap) {
    if (!monthId) throw new Error('Month ID is required.');

    if (!isFirebaseConfigured()) {
      saveLocalMemberRents(monthId, rentsMap);
      window.dispatchEvent(new Event('storage'));
      return rentsMap;
    }

    try {
      const docRef = doc(db, 'months', monthId, 'config', 'memberRents');
      await setDoc(docRef, { rents: rentsMap, updatedAt: new Date().toISOString() }, { merge: true });
      return rentsMap;
    } catch (err) {
      console.error('Error saving member rents:', err);
      throw new Error('Unable to save member rent configurations.');
    }
  },

  /**
   * Add a utility bill
   */
  async addUtilityBill(monthId, billData, user = null) {
    const model = createUtilityBillModel(billData, user);

    if (!isFirebaseConfigured()) {
      const bills = getLocalUtilityBills(monthId);
      const newId = `util_${Date.now()}`;
      const created = { id: newId, ...model };
      bills.unshift(created);
      saveLocalUtilityBills(monthId, bills);
      window.dispatchEvent(new Event('storage'));
      return created;
    }

    try {
      const colRef = collection(db, 'months', monthId, 'utilityBills');
      const docRef = await addDoc(colRef, model);
      return { id: docRef.id, ...model };
    } catch (err) {
      console.error('Error adding utility bill:', err);
      throw new Error('Unable to record utility bill.');
    }
  },

  /**
   * Update a utility bill
   */
  async updateUtilityBill(monthId, billId, billData) {
    if (!monthId || !billId) throw new Error('Month and Bill ID required.');

    if (!isFirebaseConfigured()) {
      const bills = getLocalUtilityBills(monthId);
      const idx = bills.findIndex(b => b.id === billId);
      if (idx !== -1) {
        bills[idx] = { ...bills[idx], ...billData, amount: Number(billData.amount), updatedAt: new Date().toISOString() };
        saveLocalUtilityBills(monthId, bills);
        window.dispatchEvent(new Event('storage'));
        return bills[idx];
      }
      throw new Error('Bill not found.');
    }

    try {
      const docRef = doc(db, 'months', monthId, 'utilityBills', billId);
      const payload = { ...billData, amount: Number(billData.amount), updatedAt: new Date().toISOString() };
      await updateDoc(docRef, payload);
      return { id: billId, ...payload };
    } catch (err) {
      console.error('Error updating utility bill:', err);
      throw new Error('Unable to update utility bill.');
    }
  },

  /**
   * Delete a utility bill
   */
  async deleteUtilityBill(monthId, billId) {
    if (!monthId || !billId) throw new Error('Month and Bill ID required.');

    if (!isFirebaseConfigured()) {
      const bills = getLocalUtilityBills(monthId);
      const filtered = bills.filter(b => b.id !== billId);
      saveLocalUtilityBills(monthId, filtered);
      window.dispatchEvent(new Event('storage'));
      return { success: true };
    }

    try {
      const docRef = doc(db, 'months', monthId, 'utilityBills', billId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (err) {
      console.error('Error deleting utility bill:', err);
      throw new Error('Unable to delete utility bill.');
    }
  },

  /**
   * Record a member rent & utility payment
   */
  async addRentPayment(monthId, paymentData, user = null) {
    const model = createRentPaymentModel(paymentData, user);

    if (!isFirebaseConfigured()) {
      const payments = getLocalRentPayments(monthId);
      const newId = `rentpay_${Date.now()}`;
      const created = { id: newId, ...model };
      payments.unshift(created);
      saveLocalRentPayments(monthId, payments);
      window.dispatchEvent(new Event('storage'));
      return created;
    }

    try {
      const colRef = collection(db, 'months', monthId, 'rentPayments');
      const docRef = await addDoc(colRef, model);
      return { id: docRef.id, ...model };
    } catch (err) {
      console.error('Error recording rent payment:', err);
      throw new Error('Unable to record rent payment.');
    }
  },

  /**
   * Update rent payment
   */
  async updateRentPayment(monthId, paymentId, paymentData) {
    if (!monthId || !paymentId) throw new Error('Month and Payment ID required.');

    if (!isFirebaseConfigured()) {
      const payments = getLocalRentPayments(monthId);
      const idx = payments.findIndex(p => p.id === paymentId);
      if (idx !== -1) {
        payments[idx] = { ...payments[idx], ...paymentData, amount: Number(paymentData.amount), updatedAt: new Date().toISOString() };
        saveLocalRentPayments(monthId, payments);
        window.dispatchEvent(new Event('storage'));
        return payments[idx];
      }
      throw new Error('Payment not found.');
    }

    try {
      const docRef = doc(db, 'months', monthId, 'rentPayments', paymentId);
      const payload = { ...paymentData, amount: Number(paymentData.amount), updatedAt: new Date().toISOString() };
      await updateDoc(docRef, payload);
      return { id: paymentId, ...payload };
    } catch (err) {
      console.error('Error updating rent payment:', err);
      throw new Error('Unable to update rent payment.');
    }
  },

  /**
   * Delete rent payment
   */
  async deleteRentPayment(monthId, paymentId) {
    if (!monthId || !paymentId) throw new Error('Month and Payment ID required.');

    if (!isFirebaseConfigured()) {
      const payments = getLocalRentPayments(monthId);
      const filtered = payments.filter(p => p.id !== paymentId);
      saveLocalRentPayments(monthId, filtered);
      window.dispatchEvent(new Event('storage'));
      return { success: true };
    }

    try {
      const docRef = doc(db, 'months', monthId, 'rentPayments', paymentId);
      await deleteDoc(docRef);
      return { success: true };
    } catch (err) {
      console.error('Error deleting rent payment:', err);
      throw new Error('Unable to delete rent payment.');
    }
  }
};
