import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { AccessRestricted } from '../pages/AccessRestricted';

export const RequireAccess = ({ allow = [], requireWorkstreamsFor = [], children }) => {
  const { role } = useCurrentUser();
  const { currentOrgId, workstreams } = useSelector((state) => state.organizations);

  const roleKey = String(role || '').toLowerCase();
  const allowList = allow.map((item) => String(item).toLowerCase());
  const requiresWorkstreams = requireWorkstreamsFor.map((item) => String(item).toLowerCase());

  const hasWorkstreams = useMemo(() => {
    if (!currentOrgId) return false;
    return workstreams.some((stream) => stream.orgId === currentOrgId);
  }, [currentOrgId, workstreams]);

  if (allowList.length > 0 && !allowList.includes(roleKey)) {
    return <AccessRestricted />;
  }

  if (requiresWorkstreams.includes(roleKey) && !hasWorkstreams) {
    return <AccessRestricted message="Create the first workstream to unlock this module." />;
  }

  return children;
};
