import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { addMembership, setCurrentOrg } from '../store/slices/organizationsSlice';
import { useLanguage } from '../context/LanguageContext';
import './AwaitingCommand.css';

const ACCESS_DENIED_KEY = 'athenea.accessDenied';

export const AwaitingCommand = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useLanguage();
  const { user } = useSelector((state) => state.auth);
  const { organizations, memberships } = useSelector((state) => state.organizations);
  const [inviteCode, setInviteCode] = useState('');
  const [error, setError] = useState('');
  const [accessDenied, setAccessDenied] = useState(false);

  const normalizeCode = (code) =>
    code.trim().toUpperCase().replace(/[^A-Z0-9]/g, '');

  const activeMemberships = useMemo(() => {
    if (!user) return [];
    return memberships.filter(
      (membership) => membership.userId === user.id && membership.status === 'active'
    );
  }, [memberships, user]);

  useEffect(() => {
    const denied = location.state?.reason === 'expelled' || localStorage.getItem(ACCESS_DENIED_KEY);
    if (denied) {
      setAccessDenied(true);
      localStorage.removeItem(ACCESS_DENIED_KEY);
    }
  }, [location.state]);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!user) return;

    const normalized = normalizeCode(inviteCode);
    const org = organizations.find(
      (entry) => normalizeCode(entry.inviteCode) === normalized
    );

    if (!org) {
      setError(t('Invalid invite code'));
      return;
    }

    dispatch(
      addMembership({
        userId: user.id,
        orgId: org.id,
        role: 'Engineer',
        status: 'active'
      })
    );
    if (org.name === 'Primary') {
      const secondary = organizations.find((entry) => entry.name === 'Secondary');
      const hasSecondary = memberships.some(
        (membership) => membership.userId === user.id && membership.orgId === secondary?.id
      );
      if (secondary && !hasSecondary) {
        dispatch(
          addMembership({
            userId: user.id,
            orgId: secondary.id,
            role: 'Engineer',
            status: 'active'
          })
        );
      }
    }
    dispatch(setCurrentOrg(org.id));
    navigate('/dashboard');
  };

  return (
    <div className="awaiting-container">
      <div className="awaiting-card">
        <div className="awaiting-header">
          <div className="awaiting-icon">◎</div>
          <h1>{t('Awaiting Command')}</h1>
          <p>{t('Enter your Company Invite Code to unlock operations.')}</p>
        </div>

        {accessDenied && (
          <div className="awaiting-alert">
            {t('Access revoked. Contact your administrator to regain entry.')}
          </div>
        )}

        {activeMemberships.length > 0 && (
          <div className="awaiting-alert">
            {t('Membership active. Select an organization to proceed.')}
          </div>
        )}

        <form className="awaiting-form" onSubmit={handleSubmit}>
          <label htmlFor="inviteCode">{t('Company Invite Code')}</label>
          <input
            id="inviteCode"
            type="text"
            value={inviteCode}
            onChange={(event) => {
              setInviteCode(event.target.value);
              if (error) setError('');
            }}
            placeholder={t('e.g., ATHENEA-2026')}
          />
          {error && <div className="awaiting-error">{error}</div>}
          <button type="submit" className="awaiting-submit">
            {t('Authorize Access')}
          </button>
        </form>
      </div>
    </div>
  );
};
