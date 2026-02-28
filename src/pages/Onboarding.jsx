import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../store/slices/authSlice';
import {
  addMembership,
  addOrganization,
  setCurrentOrg
} from '../store/slices/organizationsSlice';
import { useLanguage } from '../context/LanguageContext';
import { getPlanLimits } from '../utils/planLimits';
import './Onboarding.css';

const PLAN_ICONS = {
  starter: (
    <svg className="pricing-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M5 13c6-1 9-6 14-7-1 7-6 12-13 12-1 0-2-2-1-5z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
      />
      <path
        d="M8 12c1 2 2 3 4 5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  business: (
    <svg className="pricing-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 21h16V7l-8-4-8 4v14z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 21v-6h6v6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
    </svg>
  ),
  corporate: (
    <svg className="pricing-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M3 21h18"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M6 21V7l6-3 6 3v14"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M10 11h4M10 14h4"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  ),
  enterprise: (
    <svg className="pricing-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path
        d="M4 9l4-4 4 4 4-4 4 4-2 9H6L4 9z"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <path
        d="M9 18h6"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
      />
    </svg>
  )
};

const PLAN_OPTIONS = [
  {
    id: 'starter',
    title: 'Inicial',
    price: 39,
    recommended: false,
    features: ['Hasta 10 personas', 'Core Audit Engine', '2 Workstreams Activos']
  },
  {
    id: 'business',
    title: 'Negocios',
    price: 149,
    recommended: true,
    features: ['Hasta 50 personas', 'Pending Queue', 'Dashboard de Metricas']
  },
  {
    id: 'corporate',
    title: 'Corporativo',
    price: 349,
    recommended: false,
    features: ['Hasta 200 personas', 'Roles de Manager', 'Reportes Avanzados']
  },
  {
    id: 'enterprise',
    title: 'Empresarial',
    price: 799,
    recommended: false,
    features: ['Personas Ilimitadas', 'Inteligencia AI', 'Soporte 24/7']
  }
];

const INDUSTRIES = ['Construction', 'Energy', 'Telecom', 'Manufacturing', 'Logistics'];

const buildInviteCode = () =>
  `ATH-${Math.random().toString(36).slice(2, 6).toUpperCase()}-${Date.now()
    .toString()
    .slice(-4)}`;

export const Onboarding = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user } = useSelector((state) => state.auth);
  const { organizations } = useSelector((state) => state.organizations);
  const { memberships } = useSelector((state) => state.organizations);

  const [step, setStep] = useState(0);
  const [path, setPath] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [orgName, setOrgName] = useState('');
  const [industry, setIndustry] = useState(INDUSTRIES[0]);
  const [adminContact, setAdminContact] = useState('');
  const [planId, setPlanId] = useState('');

  const stepsCount = path === 'business' ? 3 : 1;
  const stepIndex = step === 0 ? 0 : Math.min(step, stepsCount);
  const defaultOrgId = useMemo(() => organizations[0]?.id || 'org-1', [organizations]);

  const activeMemberships = useMemo(() => {
    if (!user) return [];
    return memberships.filter(
      (membership) => membership.userId === user.id && membership.status === 'active'
    );
  }, [memberships, user]);

  const registrationComplete =
    localStorage.getItem('athenea.registration.complete') === 'true' ||
    localStorage.getItem('athenea.onboarding.complete') === 'true';

  useEffect(() => {
    const mode = localStorage.getItem('athenea.onboarding.mode');
    if (mode === 'build') {
      setPath('business');
      setStep(1);
      return;
    }
    if (mode === 'join') {
      setPath('individual');
      setStep(1);
    }
  }, []);

  useEffect(() => {
    if (!user || !registrationComplete) return;
    if (activeMemberships.length > 0) {
      navigate('/dashboard', { replace: true });
      return;
    }
    navigate('/awaiting-command', { replace: true });
  }, [activeMemberships.length, navigate, registrationComplete, user]);

  const handleSocial = async (provider) => {
    const payload = {
      email: `${provider}@auth.local`,
      password: 'oauth',
      name: provider === 'google' ? 'Google Operator' : 'GitHub Operator',
      role: 'admin'
    };
    const result = await dispatch(loginUser(payload));
    if (result.type === 'auth/login/fulfilled') {
      setStep(2);
    }
  };

  const handleAccountNext = async () => {
    if (!email.trim() || !password.trim()) return;
    const payload = {
      email: email.trim(),
      password,
      name: email.split('@')[0],
      role: 'admin'
    };
    const result = await dispatch(loginUser(payload));
    if (result.type === 'auth/login/fulfilled') {
      setStep(2);
    }
  };

  const handleOrgNext = () => {
    if (!orgName.trim() || !adminContact.trim()) return;
    setStep(3);
  };

  const handleIndividualJoin = async () => {
    if (!firstName.trim() || !lastName.trim() || !email.trim()) return;
    const payload = {
      email: email.trim(),
      password: password || 'invite',
      name: `${firstName.trim()} ${lastName.trim()}`.trim(),
      role: 'worker'
    };
    const result = await dispatch(loginUser(payload));
    if (result.type === 'auth/login/fulfilled') {
      dispatch(
        addMembership({
          userId: result.payload.user.id,
          orgId: defaultOrgId,
          role: 'Worker',
          status: 'pending'
        })
      );
      localStorage.setItem('athenea.registration.complete', 'true');
      localStorage.setItem('athenea.onboarding.complete', 'true');
      navigate('/awaiting-command');
    }
  };

  const handleIndividualSocial = async (provider) => {
    const payload = {
      email: `${provider}@auth.local`,
      password: 'oauth',
      name: provider === 'google' ? 'Google Operator' : 'GitHub Operator',
      role: 'worker'
    };
    const result = await dispatch(loginUser(payload));
    if (result.type === 'auth/login/fulfilled') {
      dispatch(
        addMembership({
          userId: result.payload.user.id,
          orgId: defaultOrgId,
          role: 'Worker',
          status: 'pending'
        })
      );
      localStorage.setItem('athenea.registration.complete', 'true');
      localStorage.setItem('athenea.onboarding.complete', 'true');
      navigate('/awaiting-command');
    }
  };

  const handleFinish = () => {
    if (!planId) return;
    const selection = PLAN_OPTIONS.find((option) => option.id === planId) || PLAN_OPTIONS[0];
    const limits = getPlanLimits(planId);
    const orgId = `org-${Date.now()}`;
    dispatch(
      addOrganization({
        id: orgId,
        name: orgName.trim(),
        inviteCode: buildInviteCode(),
        brandColor: '#1ec9ff',
        logoUrl: '',
        planId: planId,
        planType: planId,
        plan_type: planId,
        workerLimit: limits.workers ?? null,
        worker_limit: limits.workers ?? null,
        planPrice: selection.price,
        industry,
        adminContact
      })
    );
    if (user?.id) {
      dispatch(
        addMembership({
          userId: user.id,
          orgId,
          role: 'Admin',
          status: 'active'
        })
      );
      dispatch(setCurrentOrg(orgId));
    }
    localStorage.setItem('athenea.registration.complete', 'true');
    localStorage.setItem('athenea.onboarding.complete', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="onboarding-container">
      <div className="onboarding-card">
        <header className="onboarding-header">
          <div>
            <span className="onboarding-kicker">{t('Registration Wizard')}</span>
            <h1>
              {path === 'individual'
                ? t('Create your user')
                : t('Create your organization')}
            </h1>
            <p>
              {path === 'individual'
                ? t('Complete your profile to continue.')
                : t('Complete three steps to unlock ATHENEA.')}
            </p>
          </div>
          <div className="onboarding-steps">
            {Array.from({ length: stepsCount }, (_, index) => index + 1).map((index) => (
              <span
                key={index}
                className={`step-dot${index === stepIndex ? ' is-active' : ''}`}
              />
            ))}
          </div>
        </header>

        {step === 0 && (
          <section className="onboarding-section">
            <h2>{t('Choose your path')}</h2>
            <div className="path-grid">
              <button
                type="button"
                className="path-card"
                onClick={() => {
                  setPath('business');
                  setStep(1);
                }}
              >
                <div className="path-icon" aria-hidden="true">&#9632;</div>
                <div>
                  <h3>{t('Register as Business')}</h3>
                  <p>{t('I want to manage my team and operations.')}</p>
                </div>
              </button>
              <button
                type="button"
                className="path-card"
                onClick={() => {
                  setPath('individual');
                  setStep(1);
                }}
              >
                <div className="path-icon" aria-hidden="true">&#9679;</div>
                <div>
                  <h3>{t('Join as User')}</h3>
                  <p>{t('I need to join an existing ATHENEA team.')}</p>
                </div>
              </button>
            </div>
          </section>
        )}

        {path === 'business' && step === 1 && (
          <section className="onboarding-section">
            <h2>{t('Account')}</h2>
            <div className="onboarding-social">
              <button type="button" onClick={() => handleSocial('google')}>
                {t('Continue with Google')}
              </button>
              <button type="button" onClick={() => handleSocial('github')}>
                {t('Continue with GitHub')}
              </button>
            </div>
            <div className="onboarding-divider">{t('Or continue with email')}</div>
            <div className="onboarding-grid">
              <label>
                {t('Email')}
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t('Enter your email')}
                />
              </label>
              <label>
                {t('Password')}
                <input
                  type="password"
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  placeholder={t('Enter your password')}
                />
              </label>
            </div>
          </section>
        )}

        {path === 'individual' && step === 1 && (
          <section className="onboarding-section">
            <h2>{t('Create user')}</h2>
            <div className="onboarding-social">
              <button type="button" onClick={() => handleIndividualSocial('google')}>
                {t('Continue with Google')}
              </button>
              <button type="button" onClick={() => handleIndividualSocial('github')}>
                {t('Continue with GitHub')}
              </button>
            </div>
            <div className="onboarding-divider">{t('Or continue with email')}</div>
            <div className="onboarding-grid">
              <label>
                {t('First Name')}
                <input
                  type="text"
                  value={firstName}
                  onChange={(event) => setFirstName(event.target.value)}
                  placeholder={t('Enter your name')}
                />
              </label>
              <label>
                {t('Last Name')}
                <input
                  type="text"
                  value={lastName}
                  onChange={(event) => setLastName(event.target.value)}
                  placeholder={t('Enter your last name')}
                />
              </label>
              <label>
                {t('Email')}
                <input
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  placeholder={t('Enter your email')}
                />
              </label>
            </div>
          </section>
        )}

        {path === 'business' && step === 2 && (
          <section className="onboarding-section">
            <h2>{t('Organization')}</h2>
            <div className="onboarding-grid">
              <label>
                {t('Organization Name')}
                <input
                  type="text"
                  value={orgName}
                  onChange={(event) => setOrgName(event.target.value)}
                  placeholder={t('ATHENEA Field Ops')}
                />
              </label>
              <label>
                {t('Industry')}
                <select
                  value={industry}
                  onChange={(event) => setIndustry(event.target.value)}
                >
                  {INDUSTRIES.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                {t('Admin Contact')}
                <input
                  type="email"
                  value={adminContact}
                  onChange={(event) => setAdminContact(event.target.value)}
                  placeholder={t('ops@athenea.io')}
                />
              </label>
            </div>
          </section>
        )}

        {path === 'business' && step === 3 && (
          <section className="onboarding-section">
            <h2>{t('Subscription')}</h2>
            <div className="pricing-grid">
              {PLAN_OPTIONS.map((option) => {
                const isSelected = planId === option.id;
                const limits = getPlanLimits(option.id);
                return (
                  <button
                    type="button"
                    key={option.id}
                    className={`pricing-card${isSelected ? ' is-selected' : ''}`}
                    onClick={() => setPlanId(option.id)}
                  >
                    <div className="pricing-top">
                      <div className="pricing-title-row">
                        {PLAN_ICONS[option.id]}
                        <span className="pricing-title">{option.title}</span>
                        {option.recommended && (
                          <span className="pricing-badge">{t('Recommended')}</span>
                        )}
                      </div>
                      <span className="pricing-price">
                        <span className="pricing-currency">$</span>
                        <span className="pricing-amount">{option.price}</span>
                        <span className="pricing-period">/mo</span>
                      </span>
                    </div>
                    <ul className="pricing-features">
                      {option.features.map((feature) => (
                        <li key={feature}>{feature}</li>
                      ))}
                    </ul>
                    <div className="pricing-meta">
                      <span>{t('Worker limit')}: {limits.workers ?? t('Unlimited')}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
        )}

        <footer className="onboarding-footer">
          <button
            type="button"
            className="ghost-button"
            onClick={() => {
              if (step === 1) {
                setStep(0);
                setPath('');
                return;
              }
              setStep((prev) => Math.max(prev - 1, 1));
            }}
          >
            {t('Back')}
          </button>
          {path === 'business' && step === 1 && (
            <button type="button" className="primary-button" onClick={handleAccountNext}>
              {t('Continue')}
            </button>
          )}
          {path === 'business' && step === 2 && (
            <button type="button" className="primary-button" onClick={handleOrgNext}>
              {t('Continue')}
            </button>
          )}
          {path === 'business' && step === 3 && (
            <button type="button" className="primary-button" onClick={handleFinish} disabled={!planId}>
              {t('Finish Setup')}
            </button>
          )}
          {path === 'individual' && step === 1 && (
            <button type="button" className="primary-button" onClick={handleIndividualJoin}>
              {t('Continue')}
            </button>
          )}
        </footer>
      </div>
    </div>
  );
};
