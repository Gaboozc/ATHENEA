import { useSelector } from 'react-redux';

/**
 * Hook para obtener el usuario actual (single-user mode)
 */
export const useCurrentUser = () => {
  const { user } = useSelector((state) => state.auth);
  
  return {
    user,
    role: 'admin', // Siempre admin en modo single-user
    isDemo: false,
    realUser: user,
  };
};
