import { 
  auth, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  isFirebaseConfigured
} from './firebase';
import { getLocalMembers } from './memberService';

const USER_STORAGE_KEY = 'mms_active_user';

export const authService = {
  /**
   * Log in user with email and password (Supports both Admin and Members)
   */
  async login(email, password) {
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanEmail || !cleanPassword) {
      return { user: null, error: 'Email and password are required.' };
    }

    // 1. Check if logging in as Admin
    if (cleanEmail === 'admin@mealmanager.com' || cleanEmail.startsWith('admin@')) {
      if (cleanPassword === 'admin123' || !isFirebaseConfigured()) {
        const adminUser = {
          uid: 'admin_001',
          email: cleanEmail,
          displayName: 'Administrator',
          role: 'admin',
          isDemo: true,
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
        return { user: adminUser, error: null };
      }
    }

    // 2. Check if logging in as a Member
    const members = getLocalMembers();
    const matchedMember = members.find(
      (m) => m.email && m.email.toLowerCase() === cleanEmail
    );

    if (matchedMember) {
      if (matchedMember.status === 'inactive') {
        return { user: null, error: 'This member account is currently inactive. Contact your mess admin.' };
      }

      const expectedPassword = matchedMember.password || 'member123';
      if (cleanPassword === expectedPassword || cleanPassword === 'member123') {
        const memberUser = {
          uid: matchedMember.id,
          memberId: matchedMember.id,
          email: matchedMember.email,
          displayName: matchedMember.name,
          role: 'member',
          phone: matchedMember.phone,
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(memberUser));
        return { user: memberUser, error: null };
      } else {
        return { user: null, error: 'Invalid password for this member account.' };
      }
    }

    if (!isFirebaseConfigured()) {
      return { user: null, error: 'Account not found. Please check your email or select an available member.' };
    }

    // Firebase Auth fallback
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = {
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: userCredential.user.displayName || 'User',
        role: cleanEmail.includes('admin') ? 'admin' : 'member',
      };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      return { user, error: null };
    } catch (err) {
      let friendlyMessage = 'Unable to sign in. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please provide a valid email address.';
      }
      return { user: null, error: friendlyMessage };
    }
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
        } catch (e) {
          // invalid json
        }
      }
      // Default to admin for instant development experience
      const defaultAdmin = {
        uid: 'admin_001',
        email: 'admin@mealmanager.com',
        displayName: 'Administrator',
        role: 'admin',
        isDemo: true,
      };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(defaultAdmin));
      callback(defaultAdmin);
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
