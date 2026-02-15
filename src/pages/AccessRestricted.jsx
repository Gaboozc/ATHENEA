import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import './AccessRestricted.css';

export const AccessRestricted = ({ message }) => {
  const navigate = useNavigate();
  const { t } = useLanguage();

  return (
    <div className="access-container">
      <div className="access-card">
        <div className="access-icon">⛔</div>
        <h1>{t('Access Restricted')}</h1>
        <p>{message || t('This area is reserved for your role.')}</p>
        <button type="button" onClick={() => navigate('/dashboard')}>
          {t('Return to Dashboard')}
        </button>
      </div>
    </div>
  );
};
