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
import { createMemberModel, sanitizeMember } from '../models/memberModel';
import { DEFAULT_MESS_ID } from '../models/messModel';

const COLLECTION_NAME = 'members';
const LOCAL_STORAGE_KEY = 'mms_members_local';

export const getLocalMembers = (messId = DEFAULT_MESS_ID) => {
  const stored = localStorage.getItem(`${LOCAL_STORAGE_KEY}_${messId}`) || localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    return [];
  }
  try {
    const parsed = JSON.parse(stored);
    return parsed.filter(m => {
      if (messId === DEFAULT_MESS_ID) return !m.messId || m.messId === DEFAULT_MESS_ID;
      return m.messId === messId;
    });
  } catch (e) {
    return [];
  }
};

const saveLocalMembers = (members, messId = DEFAULT_MESS_ID) => {
  localStorage.setItem(`${LOCAL_STORAGE_KEY}_${messId}`, JSON.stringify(members));
};

export const memberService = {
  /**
   * Subscribe to real-time member updates from Cloud Firestore
   */
  subscribeMembers(callback, messId = DEFAULT_MESS_ID) {
    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalMembers(messId));
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const membersRef = collection(db, COLLECTION_NAME);
    const q = query(membersRef, orderBy('name', 'asc'));

    return onSnapshot(q, (snapshot) => {
      const allMembers = snapshot.docs.map(d => sanitizeMember(d.id, d.data()));
      const filtered = allMembers.filter(m => {
        if (messId === DEFAULT_MESS_ID) {
          return !m.messId || m.messId === DEFAULT_MESS_ID;
        }
        return m.messId === messId;
      });
      callback(filtered);
    }, (error) => {
      console.warn('Firestore listener fallback to local:', error);
      callback(getLocalMembers(messId));
    });
  },

  /**
   * Fetch all members once
   */
  async getMembers(messId = DEFAULT_MESS_ID) {
    if (!isFirebaseConfigured()) {
      return getLocalMembers(messId);
    }
    try {
      const membersRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(membersRef);
      const allMembers = snapshot.docs.map(d => sanitizeMember(d.id, d.data()));
      if (messId === 'all' || messId === null) {
        return allMembers;
      }
      return allMembers.filter(m => {
        if (messId === DEFAULT_MESS_ID) {
          return !m.messId || m.messId === DEFAULT_MESS_ID;
        }
        return m.messId === messId;
      });
    } catch (err) {
      console.error('Error fetching members:', err);
      return getLocalMembers(messId);
    }
  },

  /**
   * Fetch single member by ID
   */
  async getMemberById(memberId) {
    if (!isFirebaseConfigured()) {
      const members = getLocalMembers();
      return members.find(m => m.id === memberId) || null;
    }
    try {
      const docRef = doc(db, COLLECTION_NAME, memberId);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        return sanitizeMember(docSnap.id, docSnap.data());
      }
      const local = getLocalMembers();
      return local.find(m => m.id === memberId) || null;
    } catch (err) {
      console.error('Error fetching member:', err);
      const local = getLocalMembers();
      return local.find(m => m.id === memberId) || null;
    }
  },

  /**
   * Create new member or admin
   */
  async createMember(memberData, messId = DEFAULT_MESS_ID) {
    const targetMessId = messId || memberData?.messId || DEFAULT_MESS_ID;
    const newMemberModel = {
      ...createMemberModel(memberData),
      messId: targetMessId,
    };

    if (!isFirebaseConfigured()) {
      const members = getLocalMembers(targetMessId);
      const newId = `member_${Date.now()}`;
      const created = { id: newId, ...newMemberModel };
      members.push(created);
      saveLocalMembers(members, targetMessId);
      window.dispatchEvent(new Event('storage'));
      return created;
    }

    try {
      const membersRef = collection(db, COLLECTION_NAME);
      const docRef = await addDoc(membersRef, newMemberModel);
      return { id: docRef.id, ...newMemberModel };
    } catch (err) {
      console.error('Error creating member:', err);
      throw new Error(err.message || 'Failed to create member record.');
    }
  },

  /**
   * Update existing member
   */
  async updateMember(memberId, memberData) {
    if (!memberId) throw new Error('Member ID is required.');

    if (!isFirebaseConfigured()) {
      const members = getLocalMembers();
      const index = members.findIndex(m => m.id === memberId);
      if (index !== -1) {
        members[index] = { ...members[index], ...memberData, updatedAt: new Date().toISOString() };
        saveLocalMembers(members);
        window.dispatchEvent(new Event('storage'));
        return members[index];
      }
      throw new Error('Member not found.');
    }

    try {
      const docRef = doc(db, COLLECTION_NAME, memberId);
      const updatePayload = {
        ...memberData,
        updatedAt: new Date().toISOString(),
      };
      await setDoc(docRef, updatePayload, { merge: true });
      return { id: memberId, ...updatePayload };
    } catch (err) {
      console.error('Error updating member:', err);
      throw new Error('Unable to update member details.');
    }
  },

  /**
   * Soft deactivate member (status: 'inactive')
   */
  async deactivateMember(memberId) {
    return this.updateMember(memberId, { status: 'inactive' });
  },

  /**
   * Activate member (status: 'active')
   */
  async activateMember(memberId) {
    return this.updateMember(memberId, { status: 'active' });
  },
};
