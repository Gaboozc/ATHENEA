import { useCurrentUser } from '../hooks/useCurrentUser';
import { useLanguage } from '../context/LanguageContext';
import './Profile.css';

export const Profile = () => {
  const { user, role } = useCurrentUser();
  const { t } = useLanguage();

  return (
    <div className="profile-container">
      <header className="profile-header">
        <h1>{t('User Profile')}</h1>
        <p>{t('Access credentials and role configuration.')}</p>
      </header>

      <section className="profile-card">
        <div className="profile-row">
          <span className="profile-label">{t('User')}</span>
          <span className="profile-value">{user?.name || t('Operator')}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">{t('Role')}</span>
          <span className="profile-value">{role}</span>
        </div>
        <div className="profile-row">
          <span className="profile-label">{t('Tenant')}</span>
          <span className="profile-value">{user?.tenant || t('Primary')}</span>
        </div>
      </section>
    </div>
  );
};
