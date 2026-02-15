import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';

/**
 * Hook personalizado para obtener el usuario actual (demo o real)
 * Usa el usuario simulado si está activo, de lo contrario usa el usuario real
 */
export const useCurrentUser = () => {
  const { user: realUser, demoUser, demoRole } = useSelector((state) => state.auth);
  const [roleOverride, setRoleOverride] = useState(() => localStorage.getItem('athenea-role-override'));

  useEffect(() => {
    const handleStorage = (event) => {
      if (event.key === 'athenea-role-override') {
        setRoleOverride(event.newValue);
      }
    };

    const handleRoleChange = () => {
      setRoleOverride(localStorage.getItem('athenea-role-override'));
    };

    window.addEventListener('storage', handleStorage);
    window.addEventListener('athenea:role:change', handleRoleChange);

    return () => {
      window.removeEventListener('storage', handleStorage);
      window.removeEventListener('athenea:role:change', handleRoleChange);
    };
  }, []);
  
  // Si hay un usuario demo activo, usarlo
  const currentUser = demoUser || realUser;
  const rawRole = roleOverride || demoRole || currentUser?.role || 'worker';
  const roleKey = String(rawRole).toLowerCase();
  const currentRole = (() => {
    if (roleKey === 'admin' || roleKey === 'super-admin') return 'Admin';
    if (roleKey === 'manager' || roleKey === 'pm' || roleKey === 'supervisor') return 'Manager';
    if (roleKey === 'lead-technician') return 'Manager';
    return 'Worker';
  })();
  
  return {
    user: currentUser,
    role: currentRole,
    isDemo: !!demoUser,
    realUser,
  };
};
