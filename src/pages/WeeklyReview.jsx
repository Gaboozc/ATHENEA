import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addNote } from '../../store/slices/notesSlice';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import './WeeklyReview.css';

const STEP_COUNT = 4;

const getWeekRange = () => {
  const now = new Date();
  const day = now.getDay(); // 0=Sun
  const monday = new Date(now);
  monday.setDate(now.getDate() - ((day + 6) % 7));
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { monday, sunday };
};

const fmt = (d) =>
  d.toLocaleDateString(undefined, { day: 'numeric', month: 'short' });

export const WeeklyReview = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const { monday, sunday } = getWeekRange();

  // ── Slice data ────────────────────────────────────────────────────────
  const tasks = useSelector((s) => s.tasks?.tasks || []);
  const todos = useSelector((s) => s.todos?.todos || []);
  const goals = useSelector((s) => s.goals?.goals || []);
  const notes = useSelector((s) => s.notes?.notes || []);
  const expenses = useSelector((s) => s.budget?.expenses || []);
  const journalEntries = useSelector((s) => s.journal?.entries || []);

  // ── Derived week metrics ─────────────────────────────────────────────
  const weekStats = useMemo(() => {
    const isThisWeek = (dateStr) => {
      if (!dateStr) return false;
      const d = new Date(dateStr);
      return d >= monday && d <= sunday;
    };
    const completedTasks = tasks.filter(
      (t) => (t.status === 'Completed' || t.completed) && isThisWeek(t.updatedAt)
    );
    const completedTodos = todos.filter(
      (td) => td.status === 'done' && isThisWeek(td.updatedAt)
    );
    const weekExpenses = expenses.filter((e) => isThisWeek(e.date));
    const totalSpent = weekExpenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const journalDays = journalEntries.filter((e) => isThisWeek(e.date)).length;
    return { completedTasks, completedTodos, weekExpenses, totalSpent, journalDays };
  }, [tasks, todos, expenses, journalEntries, monday, sunday]);

  // ── Wizard state ─────────────────────────────────────────────────────
  const [step, setStep] = useState(1);
  const [answers, setAnswers] = useState({
    wins: '',
    challenges: '',
    nextWeekFocus: '',
    energyLevel: null,
  });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (key, value) => {
    setAnswers((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = () => {
    const summary = [
      `## Revisión Semanal — ${fmt(monday)} al ${fmt(sunday)}`,
      '',
      `**Tareas completadas:** ${weekStats.completedTasks.length}`,
      `**Todos completados:** ${weekStats.completedTodos.length}`,
      `**Gasto total:** ${weekStats.totalSpent.toFixed(2)}`,
      `**Días de diario:** ${weekStats.journalDays}/7`,
      '',
      `### Victorias de la semana`,
      answers.wins,
      '',
      `### Desafíos`,
      answers.challenges,
      '',
      `### Enfoque para la próxima semana`,
      answers.nextWeekFocus,
      '',
      `### Nivel de energía: ${answers.energyLevel ?? '—'}/5`,
    ].join('\n');

    dispatch(
      addNote({
        title: `Revisión semanal — ${fmt(monday)}`,
        content: summary,
        tags: ['weekly-review', 'sistema'],
        color: '#a855f7',
      })
    );
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="weekly-review-container">
        <div className="wr-done">
          <div className="wr-done-icon">🎉</div>
          <h2>{t('Review saved!')}</h2>
          <p>{t('Your weekly review was saved as a note.')}</p>
          <div className="wr-done-actions">
            <button onClick={() => navigate('/notes')}>{t('Open Notes')}</button>
            <button className="ghost" onClick={() => { setStep(1); setSubmitted(false); setAnswers({ wins: '', challenges: '', nextWeekFocus: '', energyLevel: null }); }}>
              {t('New Review')}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="weekly-review-container">
      <header className="wr-header">
        <h1>📊 {t('Weekly Review')}</h1>
        <p>
          {fmt(monday)} — {fmt(sunday)}
        </p>
      </header>

      {/* Progress bar */}
      <div className="wr-progress">
        {Array.from({ length: STEP_COUNT }, (_, i) => (
          <div
            key={i}
            className={`wr-progress-dot ${i + 1 <= step ? 'wr-progress-done' : ''}`}
          />
        ))}
        <span className="wr-progress-label">
          {t('Step')} {step}/{STEP_COUNT}
        </span>
      </div>

      {/* ── Step 1: Week metrics ── */}
      {step === 1 && (
        <div className="wr-step">
          <h2>📈 {t('This Week')}</h2>
          <div className="wr-stats-grid">
            <div className="wr-stat-card">
              <span className="wr-stat-number">{weekStats.completedTasks.length}</span>
              <span className="wr-stat-label">{t('Tasks completed')}</span>
            </div>
            <div className="wr-stat-card">
              <span className="wr-stat-number">{weekStats.completedTodos.length}</span>
              <span className="wr-stat-label">{t('Todos done')}</span>
            </div>
            <div className="wr-stat-card">
              <span className="wr-stat-number">{weekStats.totalSpent.toFixed(0)}</span>
              <span className="wr-stat-label">{t('Total spent')}</span>
            </div>
            <div className="wr-stat-card">
              <span className="wr-stat-number">{weekStats.journalDays}/7</span>
              <span className="wr-stat-label">{t('Journal days')}</span>
            </div>
          </div>
        </div>
      )}

      {/* ── Step 2: Wins & challenges ── */}
      {step === 2 && (
        <div className="wr-step">
          <h2>🏆 {t('Wins & Challenges')}</h2>
          <label className="wr-label">{t('What went well this week?')}</label>
          <textarea
            className="wr-textarea"
            placeholder={t('Celebrate your wins…')}
            value={answers.wins}
            onChange={(e) => handleChange('wins', e.target.value)}
            rows={4}
            autoFocus
          />
          <label className="wr-label" style={{ marginTop: 16 }}>{t('What challenged you?')}</label>
          <textarea
            className="wr-textarea"
            placeholder={t('Be honest with yourself…')}
            value={answers.challenges}
            onChange={(e) => handleChange('challenges', e.target.value)}
            rows={4}
          />
        </div>
      )}

      {/* ── Step 3: Next week focus ── */}
      {step === 3 && (
        <div className="wr-step">
          <h2>🎯 {t('Next Week Focus')}</h2>
          <label className="wr-label">{t('What is your main focus for next week?')}</label>
          <textarea
            className="wr-textarea"
            placeholder={t('1-3 key priorities…')}
            value={answers.nextWeekFocus}
            onChange={(e) => handleChange('nextWeekFocus', e.target.value)}
            rows={5}
            autoFocus
          />
          {/* Active goals reminder */}
          {goals.filter((g) => !g.completed).length > 0 && (
            <div className="wr-goals-reminder">
              <p className="wr-goals-title">🎯 {t('Active goals')}</p>
              <ul>
                {goals.filter((g) => !g.completed).slice(0, 5).map((g) => (
                  <li key={g.id}>{g.name}</li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}

      {/* ── Step 4: Energy & wrap-up ── */}
      {step === 4 && (
        <div className="wr-step">
          <h2>⚡ {t('Energy & Mood')}</h2>
          <label className="wr-label">{t('How was your energy level this week?')}</label>
          <div className="wr-energy-selector">
            {[1, 2, 3, 4, 5].map((n) => (
              <button
                key={n}
                className={`wr-energy-btn ${answers.energyLevel === n ? 'wr-energy-active' : ''}`}
                onClick={() => handleChange('energyLevel', answers.energyLevel === n ? null : n)}
              >
                {n}
              </button>
            ))}
          </div>
          <p className="wr-energy-desc">
            {answers.energyLevel === 1 ? '😞 Agotado' :
             answers.energyLevel === 2 ? '😕 Bajo' :
             answers.energyLevel === 3 ? '😐 Normal' :
             answers.energyLevel === 4 ? '🙂 Bien' :
             answers.energyLevel === 5 ? '😊 Excelente' :
             t('Select a level')}
          </p>
          <div className="wr-summary-preview">
            <p>✅ {weekStats.completedTasks.length + weekStats.completedTodos.length} {t('items completed')}</p>
            <p>💰 {weekStats.totalSpent.toFixed(2)} {t('spent')}</p>
            <p>📔 {weekStats.journalDays} {t('journal entries')}</p>
          </div>
        </div>
      )}

      {/* Navigation */}
      <div className="wr-navigation">
        {step > 1 && (
          <button className="wr-nav-btn ghost" onClick={() => setStep((s) => s - 1)}>
            ← {t('Back')}
          </button>
        )}
        {step < STEP_COUNT ? (
          <button className="wr-nav-btn primary" onClick={() => setStep((s) => s + 1)}>
            {t('Next')} →
          </button>
        ) : (
          <button className="wr-nav-btn primary" onClick={handleSubmit}>
            💾 {t('Save Review')}
          </button>
        )}
      </div>
    </div>
  );
};

export default WeeklyReview;
