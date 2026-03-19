import { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../../context/LanguageContext';
import './DailyStandup.css';

const STORAGE_KEY_PREFIX = 'athenea.standup.';

const getTodayKey = () =>
  `${STORAGE_KEY_PREFIX}${new Date().toISOString().split('T')[0]}`;

const loadTodayStandup = () => {
  try {
    const raw = window.localStorage.getItem(getTodayKey());
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
};

const saveTodayStandup = (data) => {
  try {
    window.localStorage.setItem(getTodayKey(), JSON.stringify(data));
  } catch {
    // ignore
  }
};

export const DailyStandup = ({ onDismiss }) => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const tasks = useSelector((s) => s.tasks?.tasks || []);

  const [done, setDone] = useState(false);
  const [form, setForm] = useState({ yesterday: '', today: '', blockers: '' });
  const [submitted, setSubmitted] = useState(false);

  // Check if already submitted today
  useEffect(() => {
    const existing = loadTodayStandup();
    if (existing) setDone(true);
  }, []);

  // Pre-fill yesterday with completed tasks
  useEffect(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);

    const completedYesterday = tasks
      .filter((t) => {
        if (!t.updatedAt) return false;
        const d = new Date(t.updatedAt);
        d.setHours(0, 0, 0, 0);
        return (t.completed || t.status === 'Completed') && d.getTime() === yesterday.getTime();
      })
      .map((t) => `✅ ${t.title}`)
      .join('\n');

    if (completedYesterday) {
      setForm((prev) => ({ ...prev, yesterday: completedYesterday }));
    }
  }, [tasks]);

  const inProgressTasks = tasks
    .filter((t) => t.status === 'In Progress' && !t.completed)
    .slice(0, 5);

  const handleSubmit = (e) => {
    e.preventDefault();
    saveTodayStandup({ ...form, submittedAt: new Date().toISOString() });
    setSubmitted(true);
    setDone(true);
    if (onDismiss) setTimeout(onDismiss, 2500);
  };

  if (done && !submitted) return null; // already done today — don't show

  if (submitted) {
    return (
      <div className="standup-banner standup-done">
        <span>✅ {t('Standup submitted')} — {t('have a productive day!')} 🚀</span>
        <button className="standup-dismiss" onClick={onDismiss}>✕</button>
      </div>
    );
  }

  return (
    <div className="standup-panel">
      <div className="standup-panel-header">
        <span>🗣️ {t('Daily Standup')}</span>
        <button className="standup-dismiss" onClick={onDismiss} title={t('Later')}>✕</button>
      </div>

      <form className="standup-form" onSubmit={handleSubmit}>
        <div className="standup-field">
          <label>{t('What did you do yesterday?')}</label>
          <textarea
            rows={3}
            value={form.yesterday}
            onChange={(e) => setForm((p) => ({ ...p, yesterday: e.target.value }))}
            placeholder={t('Completed tasks…')}
          />
        </div>

        <div className="standup-field">
          <label>{t('What will you do today?')}</label>
          <textarea
            rows={3}
            value={form.today}
            onChange={(e) => setForm((p) => ({ ...p, today: e.target.value }))}
            placeholder={t('Tasks in progress…')}
          />
          {inProgressTasks.length > 0 && (
            <div className="standup-suggestions">
              {inProgressTasks.map((task) => (
                <button
                  key={task.id}
                  type="button"
                  className="standup-suggestion-tag"
                  onClick={() =>
                    setForm((p) => ({
                      ...p,
                      today: p.today ? `${p.today}\n▶ ${task.title}` : `▶ ${task.title}`,
                    }))
                  }
                >
                  + {task.title}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="standup-field">
          <label>{t('Any blockers?')}</label>
          <textarea
            rows={2}
            value={form.blockers}
            onChange={(e) => setForm((p) => ({ ...p, blockers: e.target.value }))}
            placeholder={t('None')}
          />
        </div>

        <div className="standup-actions">
          <button type="submit" className="standup-submit">
            ✓ {t('Submit')}
          </button>
          <button type="button" className="standup-goto-focus" onClick={() => navigate('/focus')}>
            🍅 {t('Focus Mode')}
          </button>
        </div>
      </form>
    </div>
  );
};

export default DailyStandup;
