import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useTasks } from '../context/TasksContext';
import { useLanguage } from '../context/LanguageContext';
import './Notifications.css';

export const Notifications = () => {
  const { tasks } = useTasks();
  const { t } = useLanguage();
  const { notes } = useSelector((state) => state.notes);
  const { todos } = useSelector((state) => state.todos);
  const { payments } = useSelector((state) => state.payments);
  const criticalTasks = tasks.filter((task) => task.level === 'Critical');

  const reminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buildReminder = (item, type, dateField, route) => {
      const rawDate = item[dateField];
      if (!rawDate) return null;
      const dueDate = new Date(rawDate);
      if (Number.isNaN(dueDate.getTime())) return null;
      dueDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((dueDate - today) / 86400000);
      return {
        id: item.id,
        title: item.title || item.name || t('Untitled'),
        type,
        dueDate,
        diffDays,
        route,
      };
    };

    const upcomingNotes = notes
      .map((note) => buildReminder(note, 'note', 'reminderDate', '/notes'))
      .filter(Boolean);

    const upcomingTodos = todos
      .map((todo) => buildReminder(todo, 'todo', 'dueDate', '/todos'))
      .filter(Boolean);

    const upcomingPayments = payments
      .map((payment) => buildReminder(payment, 'payment', 'nextDueDate', '/payments'))
      .filter(Boolean);

    return [...upcomingNotes, ...upcomingTodos, ...upcomingPayments]
      .filter((reminder) => reminder.diffDays <= 7)
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [notes, todos, payments, t]);

  const getReminderLabel = (diffDays) => {
    if (diffDays < 0) return t('Overdue');
    if (diffDays === 0) return t('Due today');
    if (diffDays === 1) return t('In 1 day');
    if (diffDays === 3) return t('In 3 days');
    if (diffDays === 7) return t('In 7 days');
    return `+${diffDays}d`;
  };

  return (
    <div className="notifications-container">
      <header className="notifications-header">
        <h1>{t('Notifications')}</h1>
        <p>{t('Critical task alerts and reminders.')}</p>
      </header>

      <section className="notifications-card">
        <div className="notifications-section-header">
          <h2>{t('Upcoming reminders')}</h2>
          <span>{reminders.length}</span>
        </div>
        {reminders.length === 0 ? (
          <div className="notifications-empty">{t('No upcoming reminders.')}</div>
        ) : (
          <ul className="notifications-list">
            {reminders.map((reminder) => (
              <li key={reminder.id} className={`notification-row notification-${reminder.type}`}>
                <div>
                  <span className="notification-title">{reminder.title}</span>
                  <span className="notification-meta">
                    {reminder.dueDate.toLocaleDateString()}
                  </span>
                </div>
                <span className="notification-score">{getReminderLabel(reminder.diffDays)}</span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="notifications-card">
        <div className="notifications-section-header">
          <h2>{t('Critical alerts')}</h2>
          <span>{criticalTasks.length}</span>
        </div>
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
