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

const COLLECTION_NAME = 'members';
const LOCAL_STORAGE_KEY = 'mms_members_local';

// Seed initial members with credentials for member login
const DEFAULT_INITIAL_MEMBERS = [
  { id: 'member_001', name: 'Rahim', phone: '01711000001', email: 'rahim@example.com', password: 'member123', role: 'member', status: 'active', joinedAt: new Date().toISOString() },
  { id: 'member_002', name: 'Karim', phone: '01711000002', email: 'karim@example.com', password: 'member123', role: 'member', status: 'active', joinedAt: new Date().toISOString() },
  { id: 'member_003', name: 'Hasan', phone: '01711000003', email: 'hasan@example.com', password: 'member123', role: 'member', status: 'active', joinedAt: new Date().toISOString() },
];

export const getLocalMembers = () => {
  const stored = localStorage.getItem(LOCAL_STORAGE_KEY);
  if (!stored) {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(DEFAULT_INITIAL_MEMBERS));
    return DEFAULT_INITIAL_MEMBERS;
  }
  try {
    const parsed = JSON.parse(stored);
    return parsed.map(m => ({
      ...m,
      password: m.password || 'member123',
      role: m.role || 'member',
    }));
  } catch (e) {
    return DEFAULT_INITIAL_MEMBERS;
  }
};

const saveLocalMembers = (members) => {
  localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(members));
};

export const memberService = {
  /**
   * Subscribe to real-time member updates from Cloud Firestore
   */
  subscribeMembers(callback) {
    if (!isFirebaseConfigured()) {
      const load = () => callback(getLocalMembers());
      load();
      window.addEventListener('storage', load);
      return () => window.removeEventListener('storage', load);
    }

    const membersRef = collection(db, COLLECTION_NAME);
    const q = query(membersRef, orderBy('name', 'asc'));

    return onSnapshot(q, (snapshot) => {
      if (snapshot.empty) {
        // Automatically seed default members into Cloud Firestore
        DEFAULT_INITIAL_MEMBERS.forEach((m) => {
          setDoc(doc(db, COLLECTION_NAME, m.id), m, { merge: true }).catch(console.error);
        });
        callback(DEFAULT_INITIAL_MEMBERS);
      } else {
        const members = snapshot.docs.map(d => sanitizeMember(d.id, d.data()));
        callback(members);
      }
    }, (error) => {
      console.warn('Firestore listener fallback to local:', error);
      callback(getLocalMembers());
    });
  },

  /**
   * Fetch all members once
   */
  async getMembers() {
    if (!isFirebaseConfigured()) {
      return getLocalMembers();
    }
    try {
      const membersRef = collection(db, COLLECTION_NAME);
      const snapshot = await getDocs(membersRef);
      if (snapshot.empty) {
        return DEFAULT_INITIAL_MEMBERS;
      }
      return snapshot.docs.map(d => sanitizeMember(d.id, d.data()));
    } catch (err) {
      console.error('Error fetching members:', err);
      return getLocalMembers();
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
   * Create new member
   */
  async createMember(memberData) {
    const newMemberModel = createMemberModel(memberData);

    if (!isFirebaseConfigured()) {
      const members = getLocalMembers();
      const newId = `member_${Date.now()}`;
      const created = { id: newId, ...newMemberModel };
      members.push(created);
      saveLocalMembers(members);
      window.dispatchEvent(new Event('storage'));
      return created;
    }

    try {
      const membersRef = collection(db, COLLECTION_NAME);
      const docRef = await addDoc(membersRef, newMemberModel);
      return { id: docRef.id, ...newMemberModel };
    } catch (err) {
      console.error('Error creating member on Firestore:', err);
      // Fallback
      const members = getLocalMembers();
      const newId = `member_${Date.now()}`;
      const created = { id: newId, ...newMemberModel };
      members.push(created);
      saveLocalMembers(members);
      return created;
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
