import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import './ReminderToasts.css';

const STORAGE_KEY = 'athenea.reminder_toasts';
const TRIGGER_DAYS = [7, 3, 1, 0, -1];

const loadShown = () => {
  if (typeof window === 'undefined') return {};
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : {};
  } catch {
    return {};
  }
};

const saveShown = (value) => {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
  } catch {
    // ignore storage errors
  }
};

export const ReminderToasts = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { notes } = useSelector((state) => state.notes);
  const { todos } = useSelector((state) => state.todos);
  const { payments } = useSelector((state) => state.payments);
  const [toasts, setToasts] = useState([]);
  const shownRef = useRef(loadShown());

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
      .filter((reminder) => TRIGGER_DAYS.includes(reminder.diffDays))
      .sort((a, b) => a.diffDays - b.diffDays);
  }, [notes, todos, payments, t]);

  const buildMessage = (reminder) => {
    if (reminder.type === 'payment') return t('Payment due');
    if (reminder.type === 'todo') return t('Todo due');
    if (reminder.type === 'note') return t('Note reminder');
    return t('Reminder');
  };

  const buildBadge = (diffDays) => {
    if (diffDays < 0) return t('Overdue');
    if (diffDays === 0) return t('Due today');
    if (diffDays === 1) return t('In 1 day');
    if (diffDays === 3) return t('In 3 days');
    if (diffDays === 7) return t('In 7 days');
    return `+${diffDays}d`;
  };

  useEffect(() => {
    const checkReminders = () => {
      const shown = shownRef.current || {};
      const newToasts = [];

      reminders.forEach((reminder) => {
        const key = `${reminder.type}:${reminder.id}:${reminder.diffDays}`;
        if (!shown[key]) {
          shown[key] = new Date().toISOString();
          newToasts.push({
            id: key,
            title: reminder.title,
            message: buildMessage(reminder),
            badge: buildBadge(reminder.diffDays),
            route: reminder.route,
          });
        }
      });

      if (newToasts.length > 0) {
        shownRef.current = shown;
        saveShown(shown);
        setToasts((prev) => [...newToasts, ...prev].slice(0, 4));
      }
    };

    checkReminders();
    const interval = setInterval(checkReminders, 60000);
    return () => clearInterval(interval);
  }, [reminders]);

  const dismissToast = (id) => {
    setToasts((prev) => prev.filter((toast) => toast.id !== id));
  };

  if (toasts.length === 0) return null;

  return (
    <div className="reminder-toasts">
      {toasts.map((toast) => (
        <div key={toast.id} className="reminder-toast">
          <div>
            <div className="reminder-toast-title">{toast.title}</div>
            <div className="reminder-toast-message">{toast.message}</div>
          </div>
          <div className="reminder-toast-meta">
            <span className="reminder-toast-badge">{toast.badge}</span>
            <button type="button" onClick={() => navigate(toast.route)}>
              {t('Open')}
            </button>
            <button type="button" className="ghost" onClick={() => dismissToast(toast.id)}>
              {t('Dismiss')}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};
