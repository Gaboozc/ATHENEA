import { useEffect, useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { addUser } from '../store/slices/usersSlice';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './Login.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error, user } = useSelector((state) => state.auth);
  const { users } = useSelector((state) => state.users);
  const { memberships } = useSelector((state) => state.organizations);
  const { t } = useLanguage();

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
    document.body.classList.add('auth-lock-scroll');
    return () => {
      document.body.classList.remove('auth-lock-scroll');
    };
  }, []);

  useEffect(() => {
    if (!user) return;

    if (activeMemberships.length > 0 && registrationComplete) {
      navigate('/dashboard', { replace: true });
      return;
    }

    if (registrationComplete && activeMemberships.length === 0) {
      navigate('/awaiting-command', { replace: true });
      return;
    }

  }, [activeMemberships.length, navigate, registrationComplete, user]);

  const ensureUserInDirectory = (payload) => {
    const exists = users.some((user) => user.email === payload.email);
    if (!exists) {
      dispatch(addUser({
        name: payload.name,
        email: payload.email,
        role: payload.role
      }));
    }
  };

  const handleSocialLogin = async (provider) => {
    const providerLabels = {
      google: 'Google Operator',
      github: 'GitHub Operator',
      apple: 'Apple Operator',
      microsoft: 'Microsoft Operator',
      sso: 'SSO Operator'
    };
    const profile = {
      email: `${provider}@auth.local`,
      password: 'oauth',
      name: providerLabels[provider] || 'Operator',
      role: 'admin'
    };
    const result = await dispatch(loginUser(profile));
    if (result.type === 'auth/login/fulfilled') {
      ensureUserInDirectory(result.payload.user);
      localStorage.setItem('athenea.registration.complete', 'true');
      localStorage.setItem('athenea.onboarding.complete', 'true');
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const payload = {
      email,
      password,
      name: email ? email.split('@')[0] : 'New Operator',
      role: 'admin'
    };
    const result = await dispatch(loginUser(payload));
    if (result.type === 'auth/login/fulfilled') {
      ensureUserInDirectory(result.payload.user);
      const hasMembership = memberships.some(
        (membership) => membership.userId === result.payload.user.id &&
          membership.status === 'active'
      );
      if (hasMembership) {
        localStorage.setItem('athenea.onboarding.complete', 'true');
        localStorage.setItem('athenea.registration.complete', 'true');
        navigate('/dashboard');
      } else {
        localStorage.setItem('athenea.onboarding.mode', 'join');
        navigate('/awaiting-command');
      }
    }
  };

  const handleStartRegistration = (mode) => {
    localStorage.setItem('athenea.onboarding.mode', mode);
    navigate('/register');
  };

  return (
    <div className="login-container">
      <div className="login-shell">
        <div className="login-hero">
          <div className="login-brand">
            <img src="/src/assets/img/Athena-logo.png" alt="ATHENEA logo" className="login-logo" />
            <div>
              <h1>ATHENEA</h1>
              <p className="login-brand-sub">{t('Tactical Engineering System')}</p>
            </div>
          </div>
          <h2>{t('Ready onboarding for tactical teams.')}</h2>
          <p className="login-hero-desc">{t('Launch a new organization or join an active tenant in seconds.')}</p>

          <div className="login-registration-options">
            <div className="registration-card">
              <h3>{t('Register as Company')}</h3>
              <ul className="registration-benefits">
                <li>{t('Complete dashboard with real-time metrics for all your active projects')}</li>
                <li>{t('Manage multiple teams, assign roles and granular permissions per project')}</li>
                <li>{t('Point-by-point production tracking with automatic progress reports')}</li>
                <li>{t('Full inventory control with low stock alerts and transfers between projects')}</li>
                <li>{t('Complete audits with change history and traceability of every decision')}</li>
                <li>{t('Automatic PDF report generation and data export for analysis')}</li>
                <li>{t('Intelligent notification system to keep your team synchronized')}</li>
              </ul>
              <button
                type="button"
                className="path-button"
                onClick={() => handleStartRegistration('build')}
              >
                {t('Create your Organization')}
              </button>
            </div>

            <div className="registration-card">
              <h3>{t('Register as User')}</h3>
              <ul className="registration-benefits">
                <li>{t('Instantly access your assigned task list prioritized by urgency')}</li>
                <li>{t('Report progress from the field with photos, GPS coordinates and voice notes')}</li>
                <li>{t('Receive real-time notifications when critical tasks are assigned to you')}</li>
                <li>{t('Consult blueprints, diagrams and technical specs from any device')}</li>
                <li>{t('Collaborate with your team through integrated chat and synchronized updates')}</li>
                <li>{t('Automatically log hours worked with progress tracking')}</li>
                <li>{t('Visualize the impact of your work on overall project progress')}</li>
              </ul>
              <button
                type="button"
                className="path-button ghost"
                onClick={() => handleStartRegistration('join')}
              >
                {t('Join with Invite Code')}
              </button>
            </div>
          </div>
        </div>
        <div className="login-card">
          <div className="login-header">
            <span className="login-kicker">{t('Login')}</span>
            <h3>{t('Welcome back')}</h3>
            <p>{t('Sign in to continue your operations.')}</p>
          </div>
          
          <form onSubmit={handleSubmit} className="login-form">
            <div className="login-register">
              <span>{t('Need an account?')}</span>
              <div className="register-options">
                <button
                  type="button"
                  className="register-button"
                  onClick={() => handleStartRegistration('build')}
                >
                  {t('Register as Company')}
                </button>
                <button
                  type="button"
                  className="register-button ghost"
                  onClick={() => handleStartRegistration('join')}
                >
                  {t('Register as User')}
                </button>
              </div>
            </div>

            <div className="login-divider">
              <span>{t('Or sign in with email')}</span>
            </div>

            <div className="form-group">
              <label htmlFor="email">{t('Email')}</label>
              <input
                id="email"
                type="email"
                placeholder={t('Enter your email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">{t('Password')}</label>
              <input
                id="password"
                type="password"
                placeholder={t('Enter your password')}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>

            {error && <div className="error-message">{error}</div>}

            <button type="submit" className="login-button" disabled={isLoading}>
              {isLoading ? t('Logging in...') : t('Login')}
            </button>

            <p className="login-hint">
              {t('Demo mode: any email and password works.')}
            </p>

            <div className="login-divider">
              <span>{t('Or continue with')}</span>
            </div>

            <div className="login-social">
              <button
                type="button"
                className="social-button"
                onClick={() => handleSocialLogin('google')}
              >
                <span className="social-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12 10.2v3.7h5.2c-.8 2.3-3 3.7-5.2 3.7a5.9 5.9 0 1 1 0-11.8c1.6 0 2.8.6 3.8 1.6l2.5-2.5A9.5 9.5 0 1 0 21.5 12c0-.7-.1-1.4-.2-1.8H12z"
                    />
                  </svg>
                </span>
                {t('Continue with Google')}
              </button>
              <button
                type="button"
                className="social-button"
                onClick={() => handleSocialLogin('github')}
              >
                <span className="social-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.8c-2.8.6-3.4-1.3-3.4-1.3-.5-1.2-1.2-1.6-1.2-1.6-1-.7.1-.7.1-.7 1.1.1 1.7 1.1 1.7 1.1 1 .1 1.6-.7 1.6-.7.1-.7.4-1.1.7-1.3-2.2-.2-4.4-1.1-4.4-4.9 0-1.1.4-2 1.1-2.7-.1-.2-.5-1.2.1-2.5 0 0 .9-.3 2.8 1.1a9.4 9.4 0 0 1 5.2 0c2-1.4 2.8-1.1 2.8-1.1.6 1.3.2 2.3.1 2.5.7.7 1.1 1.6 1.1 2.7 0 3.8-2.3 4.7-4.5 4.9.4.3.7.9.7 1.8v2.6c0 .3.2.6.7.5A10 10 0 0 0 12 2z"
                    />
                  </svg>
                </span>
                {t('Continue with GitHub')}
              </button>
              <button
                type="button"
                className="social-button"
                onClick={() => handleSocialLogin('apple')}
              >
                <span className="social-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path
                      fill="currentColor"
                      d="M16.5 13.2c0 3 2.5 3.9 2.5 3.9s-1.6 4.7-3.7 4.7c-1.2 0-1.7-.8-3.2-.8s-2 .8-3.2.8c-2.2 0-4.1-4.3-4.1-8.3 0-3.1 1.9-4.7 3.8-4.7 1.2 0 2.2.8 3.2.8s2.2-1 3.6-.9c.6 0 2.3.2 3.4 1.6-.1.1-2 1.1-2 3.0z"
                    />
                    <path
                      fill="currentColor"
                      d="M14.6 4.7c.6-.7 1-1.7.9-2.7-1 .1-2.1.7-2.8 1.4-.6.7-1.1 1.7-1 2.7 1.1.1 2.2-.5 2.9-1.4z"
                    />
                  </svg>
                </span>
                {t('Continue with Apple')}
              </button>
              <button
                type="button"
                className="social-button"
                onClick={() => handleSocialLogin('microsoft')}
              >
                <span className="social-icon" aria-hidden="true">
                  <svg viewBox="0 0 24 24">
                    <path fill="currentColor" d="M3 3h8v8H3z" />
                    <path fill="currentColor" d="M13 3h8v8h-8z" />
                    <path fill="currentColor" d="M3 13h8v8H3z" />
                    <path fill="currentColor" d="M13 13h8v8h-8z" />
                  </svg>
                </span>
                {t('Continue with Microsoft')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
