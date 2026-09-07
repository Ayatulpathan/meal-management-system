import { useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const {
    user,
    role,
    isAdmin,
    isMember,
    currentMemberId,
    loading,
    authError,
    isAuthenticated,
    login,
    logout,
  } = useAuthContext();

  return {
    user,
    role,
    isAdmin,
    isMember,
    currentMemberId,
    loading,
    error: authError,
    isAuthenticated,
    login,
    logout,
  };
};
