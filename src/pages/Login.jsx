import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './Login.css';

export const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { isLoading, error } = useSelector((state) => state.auth);
  const { t } = useLanguage();

  const handleSocialLogin = async (provider) => {
    const result = await dispatch(loginUser({ email: `${provider}@auth.local`, password: 'oauth' }));
    if (result.type === 'auth/login/fulfilled') {
      navigate('/dashboard');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const result = await dispatch(loginUser({ email, password }));
    if (result.type === 'auth/login/fulfilled') {
      navigate('/projects');
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
            <img src="/src/assets/img/Athena-logo.png" alt="ATHENEA logo" className="login-logo" />
          <h1>ATHENEA</h1>
          <p>{t('Tactical Engineering System')}</p>
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
        </div>

        <div className="login-divider">
          <span>{t('Or continue with email')}</span>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
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

          <div className="demo-hint">
            <p>💡 {t('Demo: Enter any email and password to login')}</p>
          </div>
        </form>
      </div>
    </div>
  );
};
