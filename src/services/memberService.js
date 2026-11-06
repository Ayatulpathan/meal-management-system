import {
  db,
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
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
  updateMessDocData,
  deleteMessDocData
} from './dbPaths';
import { createMemberModel, sanitizeMember } from '../models/memberModel';
import { DEFAULT_MESS_ID, getActiveMessId } from '../models/messModel';

const COLLECTION_NAME = 'members';
const LOCAL_STORAGE_KEY = 'mms_members_local';

export const getLocalMembers = (messId = DEFAULT_MESS_ID) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${targetMessId}`) || localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    const parsed = JSON.parse(stored);
    return parsed.filter(m => {
      if (targetMessId === DEFAULT_MESS_ID) return !m.messId || m.messId === DEFAULT_MESS_ID;
      return m.messId === targetMessId;
    });
  } catch (e) {
    return [];
  }
};

const saveLocalMembers = (members, messId = DEFAULT_MESS_ID) => {
  const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
  localStorage.setItem(`${LOCAL_STORAGE_KEY}_${targetMessId}`, JSON.stringify(members));
};

export const memberService = {
  /**
   * Subscribe to real-time member updates for a specific mess
   */
  subscribeMembers(callback, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;

    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalMembers(targetMessId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const membersRef = getMessCollection(targetMessId, COLLECTION_NAME);
    const q = query(membersRef, orderBy('name', 'asc'));

    return onSnapshot(q, (snapshot) => {
      // If tenant path has members, return them
      if (!snapshot.empty) {
        const members = snapshot.docs.map(d => sanitizeMember(d.id, { ...d.data(), messId: targetMessId }));
        saveLocalMembers(members, targetMessId);
        callback(members);
        return;
      }

      // If Khadok Mess and tenant collection is empty, check root as non-destructive fallback
      if (targetMessId === DEFAULT_MESS_ID) {
        getDocs(query(getRootCollection(COLLECTION_NAME), orderBy('name', 'asc')))
          .then((rootSnap) => {
            if (!rootSnap.empty) {
              const rootMembers = rootSnap.docs.map(d => sanitizeMember(d.id, { ...d.data(), messId: DEFAULT_MESS_ID }));
              saveLocalMembers(rootMembers, DEFAULT_MESS_ID);
              callback(rootMembers);
            } else {
              callback([]);
            }
          })
          .catch(() => callback(getLocalMembers(targetMessId)));
        return;
      }

      callback([]);
    }, (error) => {
      console.warn('Firestore member listener fallback to local:', error);
      callback(getLocalMembers(targetMessId));
    });
  },

  /**
   * Fetch all members for a mess once
   */
  async getMembers(messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;

    if (!isFirebaseConfigured()) {
      return getLocalMembers(targetMessId);
    }
    try {
      const membersRef = getMessCollection(targetMessId, COLLECTION_NAME);
      const snapshot = await getDocs(membersRef);

      if (!snapshot.empty) {
        return snapshot.docs.map(d => sanitizeMember(d.id, { ...d.data(), messId: targetMessId }));
      }

      // Fallback for default mess
      if (targetMessId === DEFAULT_MESS_ID) {
        const rootSnap = await getDocs(getRootCollection(COLLECTION_NAME));
        if (!rootSnap.empty) {
          return rootSnap.docs.map(d => sanitizeMember(d.id, { ...d.data(), messId: DEFAULT_MESS_ID }));
        }
      }

      return [];
    } catch (err) {
      console.error('Error fetching members:', err);
      return getLocalMembers(targetMessId);
    }
  },

  /**
   * Fetch single member by ID
   */
  async getMemberById(memberId, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;

    if (!isFirebaseConfigured()) {
      const local = getLocalMembers(targetMessId);
      return local.find(m => m.id === memberId) || null;
    }

    try {
      const docRef = getMessDoc(targetMessId, COLLECTION_NAME, memberId);
      const snap = await getDoc(docRef);
      if (snap.exists()) {
        return sanitizeMember(snap.id, { ...snap.data(), messId: targetMessId });
      }

      if (targetMessId === DEFAULT_MESS_ID) {
        const rootSnap = await getDoc(getRootDoc(COLLECTION_NAME, memberId));
        if (rootSnap.exists()) {
          return sanitizeMember(rootSnap.id, { ...rootSnap.data(), messId: DEFAULT_MESS_ID });
        }
      }

      return null;
    } catch (err) {
      console.error('Error fetching member by id:', err);
      return null;
    }
  },

  /**
   * Create a new member in the designated mess
   */
  async createMember(memberData, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const model = createMemberModel(memberData);
    model.messId = targetMessId;

    if (!isFirebaseConfigured()) {
      const local = getLocalMembers(targetMessId);
      const newId = `member_${Date.now()}`;
      const newMember = { id: newId, ...model };
      local.push(newMember);
      saveLocalMembers(local, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return newMember;
    }

    try {
      const memberId = `member_${Date.now()}_${Math.random().toString(36).substr(2, 4)}`;
      const memberPayload = { id: memberId, ...model };

      // Dual-write: saves to messes/{targetMessId}/members/{memberId} (and root if Khadok)
      await setMessDocData(targetMessId, [COLLECTION_NAME, memberId], memberPayload);

      // Register user lookup if email provided
      if (memberData.email) {
        const cleanEmail = memberData.email.trim().toLowerCase();
        try {
          await setDoc(doc(db, 'users', cleanEmail), {
            email: cleanEmail,
            messId: targetMessId,
            role: memberData.role || 'member',
            memberId: memberId,
            name: memberData.name || '',
            updatedAt: new Date().toISOString()
          }, { merge: true });
        } catch (uErr) {
          console.warn('Could not register users directory mapping:', uErr);
        }
      }

      return memberPayload;
    } catch (err) {
      console.error('Error creating member:', err);
      throw new Error('Unable to create member. Please try again.');
    }
  },

  /**
   * Update existing member
   */
  async updateMember(memberId, memberData, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;

    if (!isFirebaseConfigured()) {
      const local = getLocalMembers(targetMessId);
      const index = local.findIndex(m => m.id === memberId);
      if (index !== -1) {
        local[index] = { ...local[index], ...memberData, messId: targetMessId, updatedAt: new Date().toISOString() };
        saveLocalMembers(local, targetMessId);
        window.dispatchEvent(new Event('storage'));
        return local[index];
      }
      throw new Error('Member not found.');
    }

    try {
      const payload = {
        ...memberData,
        messId: targetMessId,
        updatedAt: new Date().toISOString()
      };

      await updateMessDocData(targetMessId, [COLLECTION_NAME, memberId], payload);
      return { id: memberId, ...payload };
    } catch (err) {
      console.error('Error updating member:', err);
      throw new Error('Unable to update member.');
    }
  },

  /**
   * Delete member
   */
  async deleteMember(memberId, messId) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;

    if (!isFirebaseConfigured()) {
      const local = getLocalMembers(targetMessId);
      const filtered = local.filter(m => m.id !== memberId);
      saveLocalMembers(filtered, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return { success: true };
    }

    try {
      await deleteMessDocData(targetMessId, [COLLECTION_NAME, memberId]);
      return { success: true };
    } catch (err) {
      console.error('Error deleting member:', err);
      throw new Error('Unable to delete member.');
    }
  }
};
