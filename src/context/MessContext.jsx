import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { messService } from '../services/messService';
import { DEFAULT_MESS_ID, getDefaultMess } from '../models/messModel';
import { useAuthContext } from './AuthContext';

const MessContext = createContext(null);
const ACTIVE_MESS_STORAGE_KEY = 'mms_active_mess_id';

export const MessProvider = ({ children }) => {
  const { user, isAdmin } = useAuthContext();

  const [activeMessId, setActiveMessId] = useState(() => {
    return localStorage.getItem(ACTIVE_MESS_STORAGE_KEY) || DEFAULT_MESS_ID;
  });

  const [messes, setMesses] = useState([getDefaultMess()]);
  const [loading, setLoading] = useState(true);

  // Subscribe to real-time messes updates
  useEffect(() => {
    const unsubscribe = messService.subscribeMesses((updatedMesses) => {
      setMesses(updatedMesses);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Compute current active mess object
  const currentMess = useMemo(() => {
    const found = messes.find(m => m.id === activeMessId);
    return found || getDefaultMess();
  }, [messes, activeMessId]);

  // Compute user-accessible messes
  const userMesses = useMemo(() => {
    if (!user) return [getDefaultMess()];

    const userEmail = (user.email || '').toLowerCase();
    
    // Default admin has access to Khadok Mess by default
    if (userEmail === 'admin@messhishab.com' || userEmail === 'admin@mealmanager.com') {
      return messes;
    }

    // Filter messes where user is manager or member
    const filtered = messes.filter(m => {
      if (m.id === DEFAULT_MESS_ID) return true; // Legacy fallback access
      if (m.managerEmail && m.managerEmail.toLowerCase() === userEmail) return true;
      if (user.messId && user.messId === m.id) return true;
      if (Array.isArray(user.allowedMesses) && user.allowedMesses.includes(m.id)) return true;
      return false;
    });

    return filtered.length > 0 ? filtered : [getDefaultMess()];
  }, [messes, user]);

  const switchMess = (messId) => {
    if (!messId) return;
    setActiveMessId(messId);
    localStorage.setItem(ACTIVE_MESS_STORAGE_KEY, messId);
  };

  const createNewMess = async (messInput) => {
    const created = await messService.createMess({
      ...messInput,
      managerEmail: user?.email || '',
      managerName: user?.displayName || user?.name || 'Mess Manager',
    });
    switchMess(created.id);
    return created;
  };

  const joinMessWithCode = async (inviteCode) => {
    const targetMess = await messService.getMessByInviteCode(inviteCode);
    if (!targetMess) {
      throw new Error(`Invalid invite code "${inviteCode}". No mess found.`);
    }
    switchMess(targetMess.id);
    return targetMess;
  };

  /**
   * Translates a human month ID (e.g. '2026-11') into a Firestore document ID.
   * For the primary Khadok Mess, it returns untouched '2026-11' to preserve 100% of existing data.
   * For any other mess, it returns '${activeMessId}_${monthId}'.
   */
  const getScopedMonthDocId = (monthId) => {
    if (!monthId) return '';
    if (activeMessId === DEFAULT_MESS_ID) {
      return monthId;
    }
    return `${activeMessId}_${monthId}`;
  };

  const value = {
    currentMess,
    currentMessId: activeMessId,
    allMesses: messes,
    userMesses,
    loading,
    isDefaultMess: activeMessId === DEFAULT_MESS_ID,
    switchMess,
    createNewMess,
    joinMessWithCode,
    getScopedMonthDocId,
  };

  return <MessContext.Provider value={value}>{children}</MessContext.Provider>;
};

export const useMessContext = () => {
  const context = useContext(MessContext);
  if (!context) {
    throw new Error('useMessContext must be used within a MessProvider');
  }
  return context;
};
