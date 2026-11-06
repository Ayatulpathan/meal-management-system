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
  setMessDocData,
  addMessDocData,
  updateMessDocData,
  deleteMessDocData
} from './dbPaths';
import {
  createUtilityBillModel,
  sanitizeUtilityBill,
  createRentPaymentModel,
  sanitizeRentPayment
} from '../models/rentUtilityModel';
import { DEFAULT_MESS_ID, getActiveMessId } from '../models/messModel';

const UTILITY_STORAGE_PREFIX = 'mms_utility_';
const RENT_PAYMENTS_STORAGE_PREFIX = 'mms_rent_payments_';
const MEMBER_RENTS_STORAGE_PREFIX = 'mms_member_rents_';

const getUtilityStorageKey = (monthId, messId = DEFAULT_MESS_ID) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;
  return `${UTILITY_STORAGE_PREFIX}${targetMessId}_${cleanMonth}`;
};

const getPaymentsStorageKey = (monthId, messId = DEFAULT_MESS_ID) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;
  return `${RENT_PAYMENTS_STORAGE_PREFIX}${targetMessId}_${cleanMonth}`;
};

const getMemberRentsStorageKey = (monthId, messId = DEFAULT_MESS_ID) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;
  return `${MEMBER_RENTS_STORAGE_PREFIX}${targetMessId}_${cleanMonth}`;
};

const getLocalUtilityBills = (monthId, messId = DEFAULT_MESS_ID) => {
  const key = getUtilityStorageKey(monthId, messId);
  const stored = localStorage.getItem(key);
  if (!stored) {
    const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;
    const legacyKey = `${UTILITY_STORAGE_PREFIX}${cleanMonth}`;
    const legacyStored = localStorage.getItem(legacyKey);
    if (legacyStored && (messId === DEFAULT_MESS_ID || !messId)) {
      try { return JSON.parse(legacyStored); } catch (e) { return []; }
    }
    return [];
  }
  try { return JSON.parse(stored); } catch (e) { return []; }
};

const saveLocalUtilityBills = (monthId, bills, messId = DEFAULT_MESS_ID) => {
  localStorage.setItem(getUtilityStorageKey(monthId, messId), JSON.stringify(bills));
};

const getLocalRentPayments = (monthId, messId = DEFAULT_MESS_ID) => {
  const key = getPaymentsStorageKey(monthId, messId);
  const stored = localStorage.getItem(key);
  if (!stored) {
    const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;
    const legacyKey = `${RENT_PAYMENTS_STORAGE_PREFIX}${cleanMonth}`;
    const legacyStored = localStorage.getItem(legacyKey);
    if (legacyStored && (messId === DEFAULT_MESS_ID || !messId)) {
      try { return JSON.parse(legacyStored); } catch (e) { return []; }
    }
    return [];
  }
  try { return JSON.parse(stored); } catch (e) { return []; }
};

const saveLocalRentPayments = (monthId, payments, messId = DEFAULT_MESS_ID) => {
  localStorage.setItem(getPaymentsStorageKey(monthId, messId), JSON.stringify(payments));
};

const getLocalMemberRents = (monthId, messId = DEFAULT_MESS_ID) => {
  const key = getMemberRentsStorageKey(monthId, messId);
  const stored = localStorage.getItem(key);
  if (!stored) {
    const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;
    const legacyKey = `${MEMBER_RENTS_STORAGE_PREFIX}${cleanMonth}`;
    const legacyStored = localStorage.getItem(legacyKey);
    if (legacyStored && (messId === DEFAULT_MESS_ID || !messId)) {
      try { return JSON.parse(legacyStored); } catch (e) { return {}; }
    }
    return {};
  }
  try { return JSON.parse(stored); } catch (e) { return {}; }
};

const saveLocalMemberRents = (monthId, rents, messId = DEFAULT_MESS_ID) => {
  localStorage.setItem(getMemberRentsStorageKey(monthId, messId), JSON.stringify(rents));
};

export const rentUtilityService = {
  /**
   * Real-time subscription to monthly utility bills
   */
  subscribeUtilityBills(monthId, callback, messId) {
    if (!monthId) return () => {};
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalUtilityBills(cleanMonth, targetMessId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const billsRef = getMessCollection(targetMessId, 'months', cleanMonth, 'utilityBills');
    const q = query(billsRef, orderBy('date', 'desc'));

    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const bills = snapshot.docs.map(d => sanitizeUtilityBill(d.id, d.data()));
        saveLocalUtilityBills(cleanMonth, bills, targetMessId);
        callback(bills);
        return;
      }

      if (targetMessId === DEFAULT_MESS_ID) {
        getDocs(query(getRootCollection('months', cleanMonth, 'utilityBills'), orderBy('date', 'desc')))
          .then((rootSnap) => {
            if (!rootSnap.empty) {
              const rootBills = rootSnap.docs.map(d => sanitizeUtilityBill(d.id, d.data()));
              saveLocalUtilityBills(cleanMonth, rootBills, DEFAULT_MESS_ID);
              callback(rootBills);
            } else {
              callback([]);
            }
          })
          .catch(() => callback(getLocalUtilityBills(cleanMonth, targetMessId)));
        return;
      }

      callback([]);
    }, (error) => {
      console.error(`Error subscribing to utility bills for month ${cleanMonth}:`, error);
      callback(getLocalUtilityBills(cleanMonth, targetMessId));
    });
  },

  /**
   * Real-time subscription to monthly rent payments
   */
  subscribeRentPayments(monthId, callback, messId) {
    if (!monthId) return () => {};
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalRentPayments(cleanMonth, targetMessId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const paymentsRef = getMessCollection(targetMessId, 'months', cleanMonth, 'rentPayments');
    const q = query(paymentsRef, orderBy('date', 'desc'));

    return onSnapshot(q, (snapshot) => {
      if (!snapshot.empty) {
        const payments = snapshot.docs.map(d => sanitizeRentPayment(d.id, d.data()));
        saveLocalRentPayments(cleanMonth, payments, targetMessId);
        callback(payments);
        return;
      }

      if (targetMessId === DEFAULT_MESS_ID) {
        getDocs(query(getRootCollection('months', cleanMonth, 'rentPayments'), orderBy('date', 'desc')))
          .then((rootSnap) => {
            if (!rootSnap.empty) {
              const rootPayments = rootSnap.docs.map(d => sanitizeRentPayment(d.id, d.data()));
              saveLocalRentPayments(cleanMonth, rootPayments, DEFAULT_MESS_ID);
              callback(rootPayments);
            } else {
              callback([]);
            }
          })
          .catch(() => callback(getLocalRentPayments(cleanMonth, targetMessId)));
        return;
      }

      callback([]);
    }, (error) => {
      console.error(`Error subscribing to rent payments for month ${cleanMonth}:`, error);
      callback(getLocalRentPayments(cleanMonth, targetMessId));
    });
  },

  /**
   * Real-time subscription to monthly member rents configuration
   */
  subscribeMemberRents(monthId, callback, messId) {
    if (!monthId) return () => {};
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalMemberRents(cleanMonth, targetMessId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const docRef = getMessDoc(targetMessId, 'months', cleanMonth, 'config', 'memberRents');
    return onSnapshot(docRef, (snapshot) => {
      if (snapshot.exists()) {
        const data = snapshot.data()?.rents || {};
        saveLocalMemberRents(cleanMonth, data, targetMessId);
        callback(data);
        return;
      }

      if (targetMessId === DEFAULT_MESS_ID) {
        getDoc(getRootDoc('months', cleanMonth, 'config', 'memberRents'))
          .then((rootSnap) => {
            if (rootSnap.exists()) {
              const rootData = rootSnap.data()?.rents || {};
              saveLocalMemberRents(cleanMonth, rootData, DEFAULT_MESS_ID);
              callback(rootData);
            } else {
              callback({});
            }
          })
          .catch(() => callback(getLocalMemberRents(cleanMonth, targetMessId)));
        return;
      }

      callback({});
    }, (error) => {
      console.error(`Error subscribing to member rents for month ${cleanMonth}:`, error);
      callback(getLocalMemberRents(cleanMonth, targetMessId));
    });
  },

  /**
   * Save member rents configuration map { [memberId]: amount }
   */
  async saveMemberRents(monthId, rentsMap, messId) {
    if (!monthId) throw new Error('Month ID is required.');
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      saveLocalMemberRents(cleanMonth, rentsMap, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return rentsMap;
    }

    try {
      await setMessDocData(targetMessId, ['months', cleanMonth, 'config', 'memberRents'], {
        rents: rentsMap,
        updatedAt: new Date().toISOString()
      });
      return rentsMap;
    } catch (err) {
      console.error('Error saving member rents:', err);
      throw new Error('Unable to save member rent configurations.');
    }
  },

  /**
   * Add a utility bill
   */
  async addUtilityBill(monthId, billData, user = null, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;
    const model = createUtilityBillModel(billData, user);

    if (!isFirebaseConfigured()) {
      const bills = getLocalUtilityBills(cleanMonth, targetMessId);
      const newId = `util_${Date.now()}`;
      const created = { id: newId, ...model };
      bills.unshift(created);
      saveLocalUtilityBills(cleanMonth, bills, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return created;
    }

    try {
      const docRef = await addMessDocData(targetMessId, ['months', cleanMonth, 'utilityBills'], model);
      return { id: docRef.id, ...model };
    } catch (err) {
      console.error('Error adding utility bill:', err);
      throw new Error('Unable to record utility bill.');
    }
  },

  /**
   * Update a utility bill
   */
  async updateUtilityBill(monthId, billId, billData, messId) {
    if (!monthId || !billId) throw new Error('Month and Bill ID required.');
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      const bills = getLocalUtilityBills(cleanMonth, targetMessId);
      const idx = bills.findIndex(b => b.id === billId);
      if (idx !== -1) {
        bills[idx] = { ...bills[idx], ...billData, amount: Number(billData.amount), updatedAt: new Date().toISOString() };
        saveLocalUtilityBills(cleanMonth, bills, targetMessId);
        window.dispatchEvent(new Event('storage'));
        return bills[idx];
      }
      throw new Error('Bill not found.');
    }

    try {
      const payload = { ...billData, amount: Number(billData.amount), updatedAt: new Date().toISOString() };
      await updateMessDocData(targetMessId, ['months', cleanMonth, 'utilityBills', billId], payload);
      return { id: billId, ...payload };
    } catch (err) {
      console.error('Error updating utility bill:', err);
      throw new Error('Unable to update utility bill.');
    }
  },

  /**
   * Delete a utility bill
   */
  async deleteUtilityBill(monthId, billId, messId) {
    if (!monthId || !billId) throw new Error('Month and Bill ID required.');
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      const bills = getLocalUtilityBills(cleanMonth, targetMessId);
      const filtered = bills.filter(b => b.id !== billId);
      saveLocalUtilityBills(cleanMonth, filtered, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return { success: true };
    }

    try {
      await deleteMessDocData(targetMessId, ['months', cleanMonth, 'utilityBills', billId]);
      return { success: true };
    } catch (err) {
      console.error('Error deleting utility bill:', err);
      throw new Error('Unable to delete utility bill.');
    }
  },

  /**
   * Record a member rent & utility payment
   */
  async addRentPayment(monthId, paymentData, user = null, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = (monthId || '').includes('_') ? monthId.split('_').pop() : monthId;
    const model = createRentPaymentModel(paymentData, user);

    if (!isFirebaseConfigured()) {
      const payments = getLocalRentPayments(cleanMonth, targetMessId);
      const newId = `rentpay_${Date.now()}`;
      const created = { id: newId, ...model };
      payments.unshift(created);
      saveLocalRentPayments(cleanMonth, payments, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return created;
    }

    try {
      const docRef = await addMessDocData(targetMessId, ['months', cleanMonth, 'rentPayments'], model);
      return { id: docRef.id, ...model };
    } catch (err) {
      console.error('Error recording rent payment:', err);
      throw new Error('Unable to record rent payment.');
    }
  },

  /**
   * Update rent payment
   */
  async updateRentPayment(monthId, paymentId, paymentData, messId) {
    if (!monthId || !paymentId) throw new Error('Month and Payment ID required.');
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      const payments = getLocalRentPayments(cleanMonth, targetMessId);
      const idx = payments.findIndex(p => p.id === paymentId);
      if (idx !== -1) {
        payments[idx] = { ...payments[idx], ...paymentData, amount: Number(paymentData.amount), updatedAt: new Date().toISOString() };
        saveLocalRentPayments(cleanMonth, payments, targetMessId);
        window.dispatchEvent(new Event('storage'));
        return payments[idx];
      }
      throw new Error('Payment not found.');
    }

    try {
      const payload = { ...paymentData, amount: Number(paymentData.amount), updatedAt: new Date().toISOString() };
      await updateMessDocData(targetMessId, ['months', cleanMonth, 'rentPayments', paymentId], payload);
      return { id: paymentId, ...payload };
    } catch (err) {
      console.error('Error updating rent payment:', err);
      throw new Error('Unable to update rent payment.');
    }
  },

  /**
   * Delete rent payment
   */
  async deleteRentPayment(monthId, paymentId, messId) {
    if (!monthId || !paymentId) throw new Error('Month and Payment ID required.');
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanMonth = monthId.includes('_') ? monthId.split('_').pop() : monthId;

    if (!isFirebaseConfigured()) {
      const payments = getLocalRentPayments(cleanMonth, targetMessId);
      const filtered = payments.filter(p => p.id !== paymentId);
      saveLocalRentPayments(cleanMonth, filtered, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return { success: true };
    }

    try {
      await deleteMessDocData(targetMessId, ['months', cleanMonth, 'rentPayments', paymentId]);
      return { success: true };
    } catch (err) {
      console.error('Error deleting rent payment:', err);
      throw new Error('Unable to delete rent payment.');
    }
  }
};
