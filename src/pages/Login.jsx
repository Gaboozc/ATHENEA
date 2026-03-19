import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { loginUser } from '../../store/slices/authSlice';
import { useNavigate } from 'react-router-dom';
import atheneaLogo from '../assets/img/Athena-logo.png';
import './Login.css';

/**
 * Single-user setup screen.
 * If the user already configured a name, redirect straight to /dashboard.
 * Otherwise show a minimal "Bienvenido" form to set the name.
 */
export const Login = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const user = useSelector((state) => state.auth?.user);
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  // Already set up → go straight to dashboard
  useEffect(() => {
    if (user?.name) {
      navigate('/dashboard', { replace: true });
    }
  }, [user, navigate]);

  const handleStart = async (e) => {
    e.preventDefault();
    const displayName = name.trim() || 'Operator';
    setLoading(true);
    await dispatch(loginUser({
      name: displayName,
      email: 'local@athenea.app',
      password: 'local',
      role: 'admin'
    }));
    localStorage.setItem('athenea.registration.complete', 'true');
    localStorage.setItem('athenea.onboarding.complete', 'true');
    navigate('/dashboard', { replace: true });
  };

  return (
    <div className="login-container">
      <div className="login-shell" style={{ maxWidth: 420, margin: '0 auto' }}>
        <div className="login-brand" style={{ textAlign: 'center', marginBottom: 32 }}>
          <img src={atheneaLogo} alt="Athenea" style={{ height: 72, marginBottom: 16 }} />
          <h1 style={{ fontSize: '1.6rem', fontWeight: 700, color: 'var(--text-primary, #e2e8f0)', margin: 0 }}>
            Athenea
          </h1>
          <p style={{ color: 'var(--text-secondary, #9ca3af)', fontSize: '0.9rem', marginTop: 6 }}>
            Tu sistema de productividad personal
          </p>
        </div>

        <form className="login-form" onSubmit={handleStart}>
          <label className="login-label" htmlFor="setup-name">
            ¿Cómo te llamas?
          </label>
          <input
            id="setup-name"
            className="login-input"
            type="text"
            placeholder="Tu nombre o alias"
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoFocus
            maxLength={40}
          />
          <button
            type="submit"
            className="login-submit"
            disabled={loading}
            style={{ marginTop: 20 }}
          >
            {loading ? 'Iniciando...' : '🚀 Empezar'}
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
