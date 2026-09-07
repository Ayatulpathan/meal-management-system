import { 
  auth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signOut, 
  onAuthStateChanged,
  isFirebaseConfigured
} from './firebase';

const DEMO_USER_KEY = 'mms_demo_user';

export const authService = {
  /**
   * Log in user with email and password
   */
  async login(email, password) {
    if (!isFirebaseConfigured()) {
      // Demo/Offline mode fallback
      if (email && password) {
        const demoUser = {
          uid: 'demo-admin-001',
          email,
          displayName: 'Admin User',
          isDemo: true,
        };
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(demoUser));
        return { user: demoUser, error: null };
      }
      return { user: null, error: 'Email and password are required.' };
    }

    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      return { user: userCredential.user, error: null };
    } catch (err) {
      let friendlyMessage = 'Unable to sign in. Please check your credentials.';
      if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
        friendlyMessage = 'Invalid email or password.';
      } else if (err.code === 'auth/invalid-email') {
        friendlyMessage = 'Please provide a valid email address.';
      } else if (err.code === 'auth/too-many-requests') {
        friendlyMessage = 'Too many failed login attempts. Please try again later.';
      }
      return { user: null, error: friendlyMessage };
    }
  },

  /**
   * Sign out user
   */
  async logout() {
    if (!isFirebaseConfigured()) {
      localStorage.removeItem(DEMO_USER_KEY);
      return { success: true };
    }
    try {
      await signOut(auth);
      return { success: true };
    } catch (err) {
      console.error('Logout error:', err);
      return { success: false, error: err.message };
    }
  },

  /**
   * Subscribe to auth changes
   */
  onAuthStateChanged(callback) {
    if (!isFirebaseConfigured()) {
      const stored = localStorage.getItem(DEMO_USER_KEY);
      if (stored) {
        try {
          callback(JSON.parse(stored));
        } catch (e) {
          callback(null);
        }
      } else {
        // Provide demo user as default for instant demo usability
        const defaultDemo = {
          uid: 'demo-admin-001',
          email: 'admin@mealmanager.com',
          displayName: 'Admin User',
          isDemo: true,
        };
        localStorage.setItem(DEMO_USER_KEY, JSON.stringify(defaultDemo));
        callback(defaultDemo);
      }
      return () => {};
    }

    return onAuthStateChanged(auth, (user) => {
      callback(user);
    });
  }
};
