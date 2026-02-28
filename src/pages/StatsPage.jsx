import React from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { initializeAchievements, resetStats } from '../store/slices/statsSlice';
import './StatsPage.css';

/**
 * Stats & Achievements Page
 * Display user progress, achievements, and gamification elements
 */
const StatsPage = () => {
  const dispatch = useDispatch();
  const { stats, achievements, level, xp, xpToNextLevel } = useSelector((state) => state.stats);

  React.useEffect(() => {
    if (achievements.length === 0) {
      dispatch(initializeAchievements());
    }
  }, [dispatch, achievements.length]);

  const xpProgress = (xp / xpToNextLevel) * 100;
  const unlockedCount = achievements.filter(a => a.unlocked).length;

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h1>📊 Stats & Achievements</h1>
        <p>Track your progress and unlock achievements</p>
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
              <div className="xp-fill" style={{ width: `${xpProgress}%` }}></div>
            </div>
            <span className="xp-text">{xp} / {xpToNextLevel} XP</span>
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="quick-stats">
        <div className="stat-card">
          <div className="stat-icon">✓</div>
          <div className="stat-value">{stats.totalTasksCompleted}</div>
          <div className="stat-label">Tasks Completed</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-value">{stats.totalProjectsCompleted}</div>
          <div className="stat-label">Projects Done</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-value">{stats.totalNotesCreated}</div>
          <div className="stat-label">Notes Created</div>
        </div>

        <div className="stat-card">
          <div className="stat-icon">🔥</div>
          <div className="stat-value">{stats.currentStreak}</div>
          <div className="stat-label">Day Streak</div>
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
                        style={{ width: `${(achievement.progress / achievement.maxProgress) * 100}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">
                      {achievement.progress} / {achievement.maxProgress}
                    </span>
                  </div>
                )}
                {achievement.unlocked && achievement.unlockedDate && (
                  <div className="unlocked-date">
                    Unlocked: {new Date(achievement.unlockedDate).toLocaleDateString()}
                  </div>
                )}
                <div className="achievement-xp">+{achievement.xpReward} XP</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Additional Stats */}
      <div className="detailed-stats">
        <h2>📈 Detailed Statistics</h2>
        <div className="stats-list">
          <div className="stat-row">
            <span className="stat-key">Longest Streak</span>
            <span className="stat-value">{stats.longestStreak} days 🔥</span>
          </div>
          <div className="stat-row">
            <span className="stat-key">Todos Completed</span>
            <span className="stat-value">{stats.totalTodosCompleted} ☑</span>
          </div>
          <div className="stat-row">
            <span className="stat-key">Tags Used</span>
            <span className="stat-value">{stats.tagsUsed.length} 🏷️</span>
          </div>
          <div className="stat-row">
            <span className="stat-key">Last Active</span>
            <span className="stat-value">
              {stats.lastActiveDate ? new Date(stats.lastActiveDate).toLocaleDateString() : 'Never'}
            </span>
          </div>
        </div>
      </div>

      {/* Reset Button (for development) */}
      <div className="stats-actions">
        <button 
          className="reset-button" 
          onClick={() => {
            if (window.confirm('Are you sure you want to reset all stats? This cannot be undone.')) {
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
