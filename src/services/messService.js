/**
 * Multi-Tenant Mess Directory & Management Service
 * Manages all registered messes in Firestore settings/messesDirectory with local fallback.
 * 100% preserves khadok-mess as the primary default mess.
 */

import {
  db,
  doc,
  getDoc,
  setDoc,
  onSnapshot,
  isFirebaseConfigured
} from './firebase';
import {
  DEFAULT_MESS_ID,
  getDefaultMess,
  createMessModel,
  sanitizeMess
} from '../models/messModel';

const SETTINGS_DOC_ID = 'messesDirectory';
const LOCAL_STORAGE_KEY = 'mms_messes_directory';

const getLocalMesses = () => {
  const defaultMess = getDefaultMess();
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    const initial = { [DEFAULT_MESS_ID]: defaultMess };
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(initial));
    return initial;
  }
  try {
    const parsed = JSON.parse(stored);
    if (!parsed[DEFAULT_MESS_ID]) {
      parsed[DEFAULT_MESS_ID] = defaultMess;
    }
    return parsed;
  } catch (e) {
    return { [DEFAULT_MESS_ID]: defaultMess };
  }
};

const saveLocalMesses = (messesMap) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(messesMap));
};

export const messService = {
  /**
   * Subscribe to real-time updates for all registered messes
   */
  subscribeMesses(callback) {
    if (!isFirebaseConfigured()) {
      const load = () => {
        const local = getLocalMesses();
        callback(Object.values(local));
      };
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    try {
      const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
      return onSnapshot(docRef, (snapshot) => {
        const defaultMess = getDefaultMess();
        let messesMap = { [DEFAULT_MESS_ID]: defaultMess };

        if (snapshot.exists()) {
          const data = snapshot.data() || {};
          const rawMesses = data.messes || {};
          Object.entries(rawMesses).forEach(([id, m]) => {
            messesMap[id] = sanitizeMess(id, m);
          });
          // Ensure default mess is always preserved
          if (!messesMap[DEFAULT_MESS_ID]) {
            messesMap[DEFAULT_MESS_ID] = defaultMess;
          }
        } else {
          // Initialize directory in Firestore if not yet present
          this.ensureDirectoryInitialized();
        }

        saveLocalMesses(messesMap);
        callback(Object.values(messesMap));
      }, (error) => {
        console.warn('Firestore messes listener fallback to local:', error);
        callback(Object.values(getLocalMesses()));
      });
    } catch (err) {
      console.error('Error subscribing to messes:', err);
      callback(Object.values(getLocalMesses()));
      return () => {};
    }
  },

  /**
   * Ensure the messes directory exists in Firestore with Khadok Mess as default
   */
  async ensureDirectoryInitialized() {
    if (!isFirebaseConfigured()) return;
    try {
      const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
      const snap = await getDoc(docRef);
      if (!snap.exists()) {
        const defaultMess = getDefaultMess();
        await setDoc(docRef, {
          messes: {
            [DEFAULT_MESS_ID]: defaultMess
          },
          updatedAt: new Date().toISOString()
        });
      }
    } catch (err) {
      console.warn('Could not initialize messes directory in Firestore:', err);
    }
  },

  /**
   * Fetch all registered messes
   */
  async getAllMesses() {
    if (!isFirebaseConfigured()) {
      return Object.values(getLocalMesses());
    }

    try {
      const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
      const snap = await getDoc(docRef);
      const defaultMess = getDefaultMess();
      let messesMap = { [DEFAULT_MESS_ID]: defaultMess };

      if (snap.exists()) {
        const raw = snap.data()?.messes || {};
        Object.entries(raw).forEach(([id, m]) => {
          messesMap[id] = sanitizeMess(id, m);
        });
        if (!messesMap[DEFAULT_MESS_ID]) {
          messesMap[DEFAULT_MESS_ID] = defaultMess;
        }
      }
      return Object.values(messesMap);
    } catch (err) {
      console.warn('Error fetching messes, using local:', err);
      return Object.values(getLocalMesses());
    }
  },

  /**
   * Get mess by ID
   */
  async getMessById(messId) {
    if (!messId || messId === DEFAULT_MESS_ID) {
      return getDefaultMess();
    }
    const all = await this.getAllMesses();
    return all.find(m => m.id === messId) || getDefaultMess();
  },

  /**
   * Look up mess by Invite Code
   */
  async getMessByInviteCode(inviteCode) {
    const cleanCode = (inviteCode || '').trim().toUpperCase();
    if (!cleanCode) return null;

    const all = await this.getAllMesses();
    return all.find(m => (m.inviteCode || '').toUpperCase() === cleanCode) || null;
  },

  /**
   * Create a new Mess
   */
  async createMess(messInput) {
    const newMess = createMessModel(messInput);
    const messesMap = getLocalMesses();
    messesMap[newMess.id] = newMess;
    saveLocalMesses(messesMap);

    if (isFirebaseConfigured()) {
      try {
        const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
        await setDoc(docRef, {
          messes: messesMap,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error('Failed to save new mess to Firestore:', err);
      }
    }

    return newMess;
  },

  /**
   * Update existing mess metadata
   */
  async updateMess(messId, updates) {
    const messesMap = getLocalMesses();
    if (!messesMap[messId]) {
      messesMap[messId] = sanitizeMess(messId, updates);
    } else {
      messesMap[messId] = {
        ...messesMap[messId],
        ...updates,
        updatedAt: new Date().toISOString()
      };
    }
    saveLocalMesses(messesMap);

    if (isFirebaseConfigured()) {
      try {
        const docRef = doc(db, 'settings', SETTINGS_DOC_ID);
        await setDoc(docRef, {
          messes: messesMap,
          lastUpdated: new Date().toISOString()
        }, { merge: true });
      } catch (err) {
        console.error('Failed to update mess in Firestore:', err);
      }
    }

    return messesMap[messId];
  }
};
