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
import { messService } from './messService';
import { DEFAULT_MESS_ID, getActiveMessId } from '../models/messModel';

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

    // Check if logging in as Default Super Administrator
    if (cleanEmail === 'admin@messhishab.com' || cleanEmail === 'admin@mealmanager.com') {
      if (cleanPassword === 'admin123' || !isFirebaseConfigured()) {
        const adminUser = {
          uid: 'admin_001',
          email: cleanEmail,
          displayName: 'Administrator',
          role: 'admin',
          messId: DEFAULT_MESS_ID,
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(adminUser));
        localStorage.setItem('mms_active_mess_id', DEFAULT_MESS_ID);
        return { user: adminUser, error: null };
      }
    }

    // Resolve user's mess association from users directory or local active mess
    let userMessId = localStorage.getItem('mms_active_mess_id') || DEFAULT_MESS_ID;
    let registeredRole = null;
    let registeredName = null;

    if (isFirebaseConfigured()) {
      try {
        const userDocRef = doc(db, 'users', cleanEmail);
        const userSnap = await getDoc(userDocRef);
        if (userSnap.exists()) {
          const uData = userSnap.data();
          if (uData?.messId) userMessId = uData.messId;
          registeredRole = uData?.role || null;
          registeredName = uData?.name || null;
        }
      } catch (uErr) {
        console.warn('Users mapping lookup notice:', uErr.message);
      }
    }

    // Check if user is the designated creator / manager of this mess
    let isMessManager = false;
    try {
      const messData = await messService.getMessById(userMessId);
      if (messData?.managerEmail && messData.managerEmail.toLowerCase() === cleanEmail) {
        isMessManager = true;
      }
    } catch (mErr) {
      console.warn('Mess lookup notice:', mErr.message);
    }

    // Check members inside user's designated mess
    let members = await memberService.getMembers(userMessId);
    let matchedMember = members.find(
      (m) => m.email && m.email.toLowerCase() === cleanEmail
    );

    // If not found and userMessId wasn't default, check Khadok Mess as fallback
    if (!matchedMember && userMessId !== DEFAULT_MESS_ID) {
      const defaultMembers = await memberService.getMembers(DEFAULT_MESS_ID);
      const fallbackMatch = defaultMembers.find(
        (m) => m.email && m.email.toLowerCase() === cleanEmail
      );
      if (fallbackMatch) {
        matchedMember = fallbackMatch;
        userMessId = DEFAULT_MESS_ID;
      }
    }

    if (matchedMember) {
      if (matchedMember.status === 'inactive') {
        return { user: null, error: 'This account is currently marked inactive. Please contact your mess manager.' };
      }

      const expectedPassword = matchedMember.password || 'member123';
      if (cleanPassword === expectedPassword) {
        // Enforce admin role if user is the mess manager or designated admin
        const effectiveRole = (isMessManager || cleanEmail.includes('admin') || registeredRole === 'admin' || matchedMember.role === 'admin')
          ? 'admin'
          : 'member';

        // Auto-heal member document in Firestore if role was previously saved as 'member'
        if (effectiveRole === 'admin' && matchedMember.role !== 'admin') {
          memberService.updateMember(matchedMember.id, { role: 'admin' }, userMessId).catch(console.warn);
        }

        const user = {
          uid: matchedMember.id,
          memberId: matchedMember.id,
          email: matchedMember.email,
          displayName: matchedMember.name || registeredName || 'User',
          role: effectiveRole,
          phone: matchedMember.phone,
          messId: userMessId,
        };
        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
        localStorage.setItem('mms_active_mess_id', userMessId);
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
      
      const messMembers = await memberService.getMembers(userMessId);
      const existingMember = messMembers.find(m => m.email && m.email.toLowerCase() === cleanEmail);

      const effectiveRole = (isMessManager || cleanEmail.includes('admin') || registeredRole === 'admin' || existingMember?.role === 'admin')
        ? 'admin'
        : (existingMember?.role || 'member');
      const memberId = existingMember ? existingMember.id : fbUser.uid;

      if (effectiveRole === 'admin' && existingMember && existingMember.role !== 'admin') {
        memberService.updateMember(existingMember.id, { role: 'admin' }, userMessId).catch(console.warn);
      }

      const user = {
        uid: fbUser.uid,
        memberId,
        email: fbUser.email,
        displayName: fbUser.displayName || existingMember?.name || registeredName || 'User',
        role: effectiveRole,
        messId: userMessId,
      };
      localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
      localStorage.setItem('mms_active_mess_id', userMessId);
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
   * Register a new admin or member in a designated mess
   */
  async createAccount(name, email, password, role = 'member', phone = '', messId = null) {
    const targetMessId = messId || getActiveMessId() || DEFAULT_MESS_ID;
    const cleanName = (name || '').trim();
    const cleanEmail = (email || '').trim().toLowerCase();
    const cleanPassword = (password || '').trim();

    if (!cleanName) return { user: null, error: 'Full name is required.' };
    if (!cleanEmail) return { user: null, error: 'Email address is required.' };
    if (!cleanPassword || cleanPassword.length < 6) {
      return { user: null, error: 'Password must be at least 6 characters long.' };
    }

    const members = await memberService.getMembers(targetMessId);
    const existing = members.find(m => m.email && m.email.toLowerCase() === cleanEmail);
    if (existing) {
      return { user: null, error: 'An account with this email address already exists in this mess.' };
    }

    const newMember = await memberService.createMember({
      name: cleanName,
      email: cleanEmail,
      phone,
      password: cleanPassword,
      role,
      status: 'active',
      messId: targetMessId,
    }, targetMessId);

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

    return onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        const stored = localStorage.getItem(USER_STORAGE_KEY);
        let role = 'member';
        let memberId = null;
        let messId = localStorage.getItem('mms_active_mess_id') || DEFAULT_MESS_ID;

        if (stored) {
          try {
            const parsed = JSON.parse(stored);
            role = parsed.role || role;
            memberId = parsed.memberId || null;
            messId = parsed.messId || messId;
          } catch (e) {}
        }

        const fbEmail = (firebaseUser.email || '').toLowerCase();

        // Enforce admin role if user is the mess manager or email has admin
        if (messId) {
          try {
            const messData = await messService.getMessById(messId);
            if (messData?.managerEmail && messData.managerEmail.toLowerCase() === fbEmail) {
              role = 'admin';
            }
          } catch (e) {}
        }
        if (fbEmail.includes('admin') || fbEmail === 'admin@messhishab.com') {
          role = 'admin';
        }

        const authUser = {
          uid: firebaseUser.uid,
          email: firebaseUser.email,
          displayName: firebaseUser.displayName || 'User',
          role,
          memberId,
          messId,
        };

        localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(authUser));
        localStorage.setItem('mms_active_mess_id', messId);

        callback(authUser);
      } else {
        checkLocal();
      }
    });
  }
};
