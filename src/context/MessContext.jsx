import React, { createContext, useContext, useState, useEffect, useMemo } from 'react';
import { messService } from '../services/messService';
import { DEFAULT_MESS_ID, getDefaultMess } from '../models/messModel';
import { useAuthContext } from './AuthContext';

const MessContext = createContext(null);
const ACTIVE_MESS_STORAGE_KEY = 'mms_active_mess_id';

export const MessProvider = ({ children }) => {
  const { user } = useAuthContext();

  const [activeMessId, setActiveMessId] = useState(() => {
    return localStorage.getItem(ACTIVE_MESS_STORAGE_KEY) || DEFAULT_MESS_ID;
  });

  const [currentMessData, setCurrentMessData] = useState(getDefaultMess());
  const [loading, setLoading] = useState(true);

  // Sync activeMessId with logged in user's mess association
  useEffect(() => {
    if (user?.messId && user.messId !== activeMessId) {
      setActiveMessId(user.messId);
      localStorage.setItem(ACTIVE_MESS_STORAGE_KEY, user.messId);
    }
  }, [user]);

  // Load mess data whenever activeMessId changes
  useEffect(() => {
    let isMounted = true;
    setLoading(true);

    messService.getMessById(activeMessId)
      .then((m) => {
        if (isMounted) {
          setCurrentMessData(m || getDefaultMess());
          setLoading(false);
        }
      })
      .catch((err) => {
        console.warn('Error loading mess metadata:', err);
        if (isMounted) {
          setCurrentMessData(getDefaultMess());
          setLoading(false);
        }
      });

    return () => { isMounted = false; };
  }, [activeMessId]);

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
   * Translates a month identifier into a clean standard month ID (e.g. '2026-11').
   * Since every mess now has its own separate database tree under messes/{messId}/months/{monthId},
   * all months maintain clean, unpolluted standard month IDs.
   */
  const getScopedMonthDocId = (monthId) => {
    if (!monthId) return '';
    return monthId.includes('_') ? monthId.split('_').pop() : monthId;
  };

  const value = {
    currentMess: currentMessData,
    currentMessId: activeMessId,
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
