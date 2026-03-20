import React, { useMemo } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { initializeAchievements, resetStats } from '../../store/slices/statsSlice';
import { useLanguage } from '../context/LanguageContext';
import './StatsPage.css';

// Calculate consecutive-day streak from an array of 'YYYY-MM-DD' date strings
const calcStreak = (dates) => {
  if (!dates.length) return 0;
  const unique = Array.from(new Set(dates)).sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let streak = 0;
  let cursor = new Date(today);

  for (const d of unique) {
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    const diff = Math.round((cursor - day) / 86400000);
    if (diff === 0 || diff === 1) {
      streak += 1;
      cursor = day;
    } else {
      break;
    }
  }
  return streak;
};

const StatsPage = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const { achievements, level, xp, xpToNextLevel } = useSelector((s) => s.stats);

  // Real data from slices
  const tasks        = useSelector((s) => s.tasks?.tasks || []);
  const todos        = useSelector((s) => s.todos?.todos || []);
  const notes        = useSelector((s) => s.notes?.notes || []);
  const focusMinutes = useSelector((s) => s.focus?.totalMinutes || 0);
  const journalEntries = useSelector((s) => s.journal?.entries || []);
  const checkins     = useSelector((s) => s.checkins?.checkins || []);
  const goals        = useSelector((s) => s.goals?.goals || []);
  const projects     = useSelector((s) => s.projects?.projects || []);
  const expenses     = useSelector((s) => s.budget?.expenses || []);

  React.useEffect(() => {
    if (achievements.length === 0) dispatch(initializeAchievements());
  }, [dispatch, achievements.length]);

  const derived = useMemo(() => {
    const completedTasks  = tasks.filter((t) => t.status === 'completed' || t.status === 'Completed').length;
    const completedTodos  = todos.filter((t) => t.status === 'done').length;
    const completedGoals  = goals.filter((g) => Number(g.savedToDate || 0) >= Number(g.targetAmount || 1)).length;
    const completedProjs  = projects.filter((p) => p.status === 'completed' || p.status === 'Completed').length;
    const focusHours      = Math.floor(focusMinutes / 60);
    const journalDays     = new Set(journalEntries.map((e) => String(e.date || e.createdAt || '').slice(0, 10))).size;
    const checkInDays     = checkins.map((c) => c.date);
    const streak          = calcStreak(checkInDays);
    const avgMood         = checkins.length
      ? (checkins.reduce((s, c) => s + Number(c.mood || 0), 0) / checkins.length).toFixed(1)
      : '—';
    const totalExpenses   = expenses.reduce((s, e) => s + Number(e.amount || 0), 0);
    return {
      completedTasks, completedTodos, completedGoals, completedProjs,
      focusHours, journalDays, streak, avgMood, totalExpenses,
    };
  }, [tasks, todos, goals, projects, focusMinutes, journalEntries, checkins, expenses]);

  const xpProgress  = xpToNextLevel > 0 ? Math.min(100, (xp / xpToNextLevel) * 100) : 0;
  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h1>📊 Stats & Achievements</h1>
        <p>{t('Your real progress — calculated from your data.')}</p>
      </div>

      {/* Level & XP */}
      <div className="level-card">
        <div className="level-info">
          <div className="level-badge">
            <span className="level-number">{level}</span>
            <span className="level-label">Level</span>
          </div>
          <div className="xp-info">
            <div className="xp-bar">
              <div className="xp-fill" style={{ width: `${xpProgress}%` }} />
            </div>
            <span className="xp-text">{xp} / {xpToNextLevel} XP</span>
          </div>
        </div>
      </div>

      {/* Quick Stats — real data */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-value">{derived.completedTasks}</div>
          <div className="stat-label">{t('Tasks Completed')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">☑</div>
          <div className="stat-value">{derived.completedTodos}</div>
          <div className="stat-label">{t('Todos Completed')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🎯</div>
          <div className="stat-value">{derived.completedGoals}</div>
          <div className="stat-label">{t('Goals Achieved')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{derived.streak}</div>
          <div className="stat-label">{t('Day Streak')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏱</div>
          <div className="stat-value">{derived.focusHours}h</div>
          <div className="stat-label">{t('Focus Hours')}</div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📓</div>
          <div className="stat-value">{derived.journalDays}</div>
          <div className="stat-label">{t('Journal Days')}</div>
        </div>
      </div>

      {/* Achievements */}
      <div className="achievements-section">
        <div className="section-header">
          <h2>🏆 Achievements</h2>
          <span className="achievement-count">{unlockedCount} / {achievements.length}</span>
        </div>
        <div className="achievements-grid">
          {achievements.map((achievement) => (
            <div
              key={achievement.id}
              className={`achievement-card ${achievement.unlocked ? 'unlocked' : 'locked'}`}
            >
              <div className="achievement-icon">{achievement.icon}</div>
              <div className="achievement-info">
                <h3 className="achievement-title">{achievement.title}</h3>
                <p className="achievement-description">{achievement.description}</p>
                {!achievement.unlocked && (
                  <div className="achievement-progress">
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{ width: `${((achievement.progress || 0) / (achievement.maxProgress || 1)) * 100}%` }}
                      />
                    </div>
                    <span className="progress-text">
                      {achievement.progress || 0} / {achievement.maxProgress || 1}
                    </span>
                  </div>
                )}
                {achievement.unlocked && achievement.unlockedDate && (
                  <div className="unlocked-date">
                    Unlocked: {new Date(achievement.unlockedDate).toLocaleDateString()}
                  </div>
                )}
                <div className="achievement-xp">+{achievement.xpReward || 0} XP</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Detailed stats — real data */}
      <div className="detailed-stats">
        <h2>📈 {t('Detailed Statistics')}</h2>
        <div className="stats-list">
          <div className="stat-row">
            <span className="stat-key">{t('Projects Completed')}</span>
            <span className="stat-value">{derived.completedProjs} 📋</span>
          </div>
          <div className="stat-row">
            <span className="stat-key">{t('Notes Created')}</span>
            <span className="stat-value">{notes.length} 📝</span>
          </div>
          <div className="stat-row">
            <span className="stat-key">{t('Total Check-ins')}</span>
            <span className="stat-value">{checkins.length} 📆</span>
          </div>
          <div className="stat-row">
            <span className="stat-key">{t('Average Mood')}</span>
            <span className="stat-value">{derived.avgMood} / 5 😊</span>
          </div>
          <div className="stat-row">
            <span className="stat-key">{t('Total Focus Minutes')}</span>
            <span className="stat-value">{focusMinutes} ⏱</span>
          </div>
          <div className="stat-row">
            <span className="stat-key">{t('Recorded Expenses')}</span>
            <span className="stat-value">{expenses.length} · ${derived.totalExpenses.toFixed(0)} 💸</span>
          </div>
        </div>
      </div>

      <div className="stats-actions">
        <button
          className="reset-button"
          onClick={() => {
            if (window.confirm(t('Reset stats and achievements? This cannot be undone.'))) {
              dispatch(resetStats());
              dispatch(initializeAchievements());
            }
          }}
        >
          Reset Stats
        </button>
      </div>
    </div>
  );
};

export default StatsPage;
