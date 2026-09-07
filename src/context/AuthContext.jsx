import React, { createContext, useContext, useState, useEffect } from 'react';
import { authService } from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authError, setAuthError] = useState(null);

  useEffect(() => {
    const unsubscribe = authService.onAuthStateChanged((currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const login = async (email, password) => {
    setAuthError(null);
    const { user: loggedInUser, error } = await authService.login(email, password);
    if (error) {
      setAuthError(error);
      return { success: false, error };
    }
    setUser(loggedInUser);
    return { success: true, user: loggedInUser };
  };

  const logout = async () => {
    const res = await authService.logout();
    if (res.success) {
      setUser(null);
    }
    return res;
  };

  const role = user?.role || 'member';
  const isAdmin = role === 'admin';
  const isMember = role === 'member';
  const currentMemberId = user?.memberId || user?.uid;

  const value = {
    user,
    role,
    isAdmin,
    isMember,
    currentMemberId,
    loading,
    authError,
    isAuthenticated: !!user,
    login,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};
