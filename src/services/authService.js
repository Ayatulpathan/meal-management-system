import { 
  auth, 
  db,
  doc,
  setDoc,
  getDoc,
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  updateProfile,
  signOut, 
  onAuthStateChanged,
  isFirebaseConfigured
} from './firebase';
import { getLocalMembers, memberService } from './memberService';

const USER_STORAGE_KEY = 'mms_active_user';

export const authService = {
  /**
   * Log in user with email and password
   */
  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      return { user: null, error: 'Email and password are required.' };
    }

    // Check if logging in as Default Administrator
    if (cleanEmail === 'admin@mealmanager.com') {
      if (cleanPassword === 'admin123' || !isFirebaseConfigured()) {
        const adminUser = {
          uid: 'admin_001',
          email: cleanEmail,
          displayName: 'Administrator',
          role: 'admin',
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
        return { user: adminUser, error: null };
      }
    }

    // Check against Firestore / Local Registered Members & Admins
    const members = await memberService.getMembers();
    const matchedMember = members.find(
      (m) => m.email && m.email.toLowerCase() === cleanEmail
    );

    if (matchedMember) {
      if (matchedMember.status === 'inactive') {
        return { user: null, error: 'This account is currently marked inactive. Please contact your mess manager.' };
      }

      const expectedPassword = matchedMember.password || 'member123';
      if (cleanPassword === expectedPassword) {
        const user = {
          uid: matchedMember.id,
          memberId: matchedMember.id,
          email: matchedMember.email,
          displayName: matchedMember.name,
          role: matchedMember.role || 'member',
          phone: matchedMember.phone,
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        return { user, error: null };
      } else {
        return { user: null, error: 'Invalid password. Please check your credentials.' };
      }
    }

    if (!isFirebaseConfigured()) {
      return { user: null, error: 'Account not found. Please verify your email or ask an admin to register you.' };
    }

    // Live Firebase Authentication
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const fbUser = userCredential.user;
      
      const allMembers = await memberService.getMembers();
      const existingMember = allMembers.find(m => m.email && m.email.toLowerCase() === cleanEmail);

      const role = cleanEmail.includes('admin') ? 'admin' : (existingMember?.role || 'member');
      const memberId = existingMember ? existingMember.id : fbUser.uid;

      const user = {
        uid: fbUser.uid,
        memberId,
        email: fbUser.email,
        displayName: fbUser.displayName || existingMember?.name || 'User',
        role,
      };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      return { user, error: null };
    } catch (err) {
      let friendlyMessage = 'Unable to sign in. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please provide a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many failed attempts. Please try again later.';
      }
      return { user: null, error: friendlyMessage };
    }
  },

  /**
   * Register a new admin or member
   */
  async createAccount(name, email, password, role = 'member', phone = '') {
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanName) return { user: null, error: 'Full name is required.' };
    if (!cleanEmail) return { user: null, error: 'Email address is required.' };
    if (!cleanPassword || cleanPassword.length < 6) {
      return { user: null, error: 'Password must be at least 6 characters long.' };
    }

    const members = await memberService.getMembers();
    const existing = members.find(m => m.email && m.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { user: null, error: 'An account with this email address already exists.' };
    }

    const newMember = await memberService.createMember({
      name: cleanName,
      email: cleanEmail,
      phone,
      password: cleanPassword,
      role,
      status: 'active',
    });

    if (isFirebaseConfigured()) {
      try {
        const userCredential = await createUserWithEmailAndPassword(auth, cleanEmail, cleanPassword);
        if (cleanName) {
          await updateProfile(userCredential.user, { displayName: cleanName });
        }
      } catch (e) {
        console.warn('Firebase Auth account creation notice:', e.message);
      }
    }

    return { user: newMember, error: null };
  },

  /**
   * Sign out user
   */
  async logout() {
    localStorage.removeItem(USER_STORAGE_KEY);
    if (isFirebaseConfigured()) {
      try {
        await signOut(auth);
      } catch (err) {
        console.error('Logout error:', err);
      }
    }
    return { success: true };
  },

  /**
   * Subscribe to auth state changes
   */
  onAuthStateChanged(callback) {
    const checkLocal = () => {
      const stored = localStorage.getItem(USER_STORAGE_KEY);
      if (stored) {
        try {
          callback(JSON.parse(stored));
          return;
        } catch (e) {}
      }
      callback(null);
    };

    if (!isFirebaseConfigured()) {
      checkLocal();
      window.addEventListener('storage', checkLocal);
      return () => window.removeEventListener('storage', checkLocal);
    }

    return onAuthStateChanged(auth, (firebaseUser) => {
      if (firebaseUser) {
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        let role = 'member';
        let memberId = null;
        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            role = parsed.role || (firebaseUser.email?.includes('admin') ? 'admin' : 'member');
            memberId = parsed.memberId || null;
          } catch (e) {}
        }
        callback({
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'User',
          role,
          memberId,
        });
      } else {
        checkLocal();
      }
    });
  }
};
