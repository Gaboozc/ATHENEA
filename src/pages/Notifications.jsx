import { useTasks } from '../context/TasksContext';
import { useLanguage } from '../context/LanguageContext';
import './Notifications.css';

export const Notifications = () => {
  const { tasks } = useTasks();
  const { t } = useLanguage();
  const criticalTasks = tasks.filter((task) => task.level === 'Critical');

  return (
    <div className="notifications-container">
      <header className="notifications-header">
        <h1>{t('Notifications')}</h1>
        <p>{t('Critical task alerts and operational signals.')}</p>
      </header>

      <section className="notifications-card">
        {criticalTasks.length === 0 ? (
          <div className="notifications-empty">{t('No critical alerts at this time.')}</div>
        ) : (
          <ul className="notifications-list">
            {criticalTasks.map((task) => (
              <li key={task.id} className="notification-row">
                <div>
                  <span className="notification-title">{task.title}</span>
                  <span className="notification-meta">{task.projectName}</span>
                </div>
                <span className="notification-score">PS: {task.totalScore}/14</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
