import { useSelector } from 'react-redux';

/**
 * Hook personalizado para obtener el usuario actual (demo o real)
 * Usa el usuario simulado si está activo, de lo contrario usa el usuario real
 */
export const useCurrentUser = () => {
  const { user: realUser, demoUser, demoRole } = useSelector((state) => state.auth);
  const roleOverride = localStorage.getItem('athenea-role-override');
  
  // Si hay un usuario demo activo, usarlo
  const currentUser = demoUser || realUser;
  const currentRole = roleOverride || demoRole || currentUser?.role || 'technician';
  
  return {
    user: currentUser,
    role: currentRole,
    isDemo: !!demoUser,
    realUser,
  };
};
