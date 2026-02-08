import { useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation } from 'react-router-dom';
import { setCurrentOrg } from '../store/slices/organizationsSlice';

export const RequireMembership = ({ children }) => {
  const dispatch = useDispatch();
  const location = useLocation();
  const { user } = useSelector((state) => state.auth);
  const { memberships, organizations, currentOrgId } = useSelector(
    (state) => state.organizations
  );

  const activeMemberships = useMemo(() => {
    if (!user) return [];
    return memberships.filter(
      (membership) => membership.userId === user.id && membership.status === 'active'
    );
  }, [memberships, user]);

  useEffect(() => {
    if (!user) return;
    if (currentOrgId) return;
    if (activeMemberships.length === 0) return;
    const activeOrg = organizations.find((org) => org.id === activeMemberships[0].orgId);
    if (activeOrg) {
      dispatch(setCurrentOrg(activeOrg.id));
    }
  }, [activeMemberships, currentOrgId, dispatch, organizations, user]);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  if (activeMemberships.length === 0) {
    return <Navigate to="/awaiting-command" replace />;
  }

  return children;
};
