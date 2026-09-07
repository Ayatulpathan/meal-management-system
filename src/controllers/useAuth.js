import { useAuthContext } from '../context/AuthContext';

export const useAuth = () => {
  const {
    user,
    loading,
    authError,
    isAuthenticated,
    login,
    logout,
  } = useAuthContext();

  return {
    user,
    loading,
    error: authError,
    isAuthenticated,
    login,
    logout,
  };
};
