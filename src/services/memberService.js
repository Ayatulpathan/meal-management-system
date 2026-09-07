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
    // Ensure existing members have password field
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
   * Subscribe to real-time member updates
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
      const members = snapshot.docs.map(doc => sanitizeMember(doc.id, doc.data()));
      callback(members);
    }, (error) => {
      console.error('Error in members snapshot listener:', error);
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
      return snapshot.docs.map(doc => sanitizeMember(doc.id, doc.data()));
    } catch (err) {
      console.error('Error fetching members:', err);
      throw new Error('Unable to fetch members.');
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
      return null;
    } catch (err) {
      console.error('Error fetching member:', err);
      throw new Error('Unable to fetch member details.');
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
      console.error('Error creating member:', err);
      throw new Error('Unable to create member. Please try again.');
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
      await updateDoc(docRef, updatePayload);
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
