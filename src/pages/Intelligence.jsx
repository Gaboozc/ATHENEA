import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTasks } from '../context/TasksContext';
import { useLanguage } from '../context/LanguageContext';
import {
  PRIORITY_LEVELS,
  getPriorityDistribution,
  getProjectHealth,
  getSystemHealth,
  getThroughput
} from '../utils/analyticsEngine';
import { useProactiveInsights, useActionHistory } from '../modules/intelligence';
import { useOmnibar } from '../components/Omnibar/useOmnibar';
import './Intelligence.css';

const LEVEL_COLORS = {
  Critical: '#d4af37',
  'High Velocity': '#1ec9ff',
  'Steady Flow': '#9aa3ad',
  'Low Friction': '#6b7280',
  Backlog: '#4b5563'
};

const SEVERITY_COLORS = {
  high: '#ef4444',
  medium: '#f59e0b',
  low: '#3b82f6',
  info: '#6b7280'
};

const normalizeHub = (rawHub) => {
  const value = String(rawHub || '').trim().toLowerCase();
  if (!value) return 'FinanceHub';
  if (value.includes('work')) return 'WorkHub';
  if (value.includes('personal')) return 'PersonalHub';
  if (value.includes('finance')) return 'FinanceHub';
  return 'FinanceHub';
};

const hubLabel = (hub) => {
  if (hub === 'WorkHub') return 'Work';
  if (hub === 'PersonalHub') return 'Personal';
  return 'Finance';
};

export const Intelligence = () => {
  const { tasks } = useTasks();
  const { t } = useLanguage();
  const { projects } = useSelector((state) => state.projects || { projects: [] });
  const { openOmnibar } = useOmnibar();
  const { allInsights } = useProactiveInsights();
  const { recentHistory } = useActionHistory();

  // Filter states
  const [selectedHub, setSelectedHub] = useState('all');
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [viewMode, setViewMode] = useState('live'); // 'live' or 'analytics'

  const scopedProjects = Array.isArray(projects) ? projects : [];
  const safeTasks = Array.isArray(tasks) ? tasks : [];
  const safeInsights = Array.isArray(allInsights) ? allInsights : [];
  const safeRecentHistory = Array.isArray(recentHistory) ? recentHistory : [];
  
  const systemHealth = useMemo(() => getSystemHealth(safeTasks), [safeTasks]);
  const priorityMetrics = useMemo(() => getPriorityDistribution(safeTasks), [safeTasks]);
  const projectHealth = useMemo(
    () => getProjectHealth(scopedProjects, safeTasks),
    [scopedProjects, safeTasks]
  );
  const throughput = useMemo(
    () => getThroughput(scopedProjects, safeTasks),
    [scopedProjects, safeTasks]
  );

  // Filter insights
  const filteredInsights = useMemo(() => {
    let filtered = safeInsights.map((insight) => ({
      ...insight,
      normalizedHub: normalizeHub(insight?.hub),
    }));

    if (selectedHub !== 'all') {
      filtered = filtered.filter((insight) => insight.normalizedHub === selectedHub);
    }

    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(insight => insight.severity === selectedSeverity);
    }

    // Sort by timestamp (newest first)
    return [...filtered].sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [safeInsights, selectedHub, selectedSeverity]);

  const filteredRecentHistory = useMemo(() => {
    const byHub = selectedHub === 'all'
      ? safeRecentHistory
      : safeRecentHistory.filter((action) => normalizeHub(action?.hub) === selectedHub);

    return byHub.slice(0, 20);
  }, [safeRecentHistory, selectedHub]);

  const noInsightsMessage = useMemo(() => {
    if (selectedHub === 'all') return t('No active insights. Your system is running smoothly!');
    if (selectedHub === 'WorkHub') return t('No records yet for Work.');
    if (selectedHub === 'PersonalHub') return t('No records yet for Personal.');
    return t('No records yet for Finance.');
  }, [selectedHub, t]);

  const noActionsMessage = useMemo(() => {
    if (selectedHub === 'all') return t('No actions executed yet.');
    if (selectedHub === 'WorkHub') return t('No records yet for Work.');
    if (selectedHub === 'PersonalHub') return t('No records yet for Personal.');
    return t('No records yet for Finance.');
  }, [selectedHub, t]);

  const handleInsightClick = (insight) => {
    // Open Omnibar with the insight's suggested prompt
    openOmnibar();
    // Note: We could enhance this to pre-fill the Omnibar with the insight
  };

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);

    if (diffMins < 1) return t('Just now');
    if (diffMins < 60) return `${diffMins}${t('m ago')}`;

    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}${t('h ago')}`;

    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}${t('d ago')}`;
  };

  return (
    <div className="intel-container">
      <header className="intel-header">
        <div>
          <h1>🧠 {t('ATHENEA Command Center')}</h1>
          <p>{t('Live proactive intelligence and system analytics')}</p>
        </div>
        
        {/* View Mode Toggle */}
        <div className="intel-view-toggle">
          <button
            className={`view-toggle-btn ${viewMode === 'live' ? 'active' : ''}`}
            onClick={() => setViewMode('live')}
          >
            📡 {t('Live Feed')}
          </button>
          <button
            className={`view-toggle-btn ${viewMode === 'analytics' ? 'active' : ''}`}
            onClick={() => setViewMode('analytics')}
          >
            📊 {t('Analytics')}
          </button>
        </div>
      </header>

      {viewMode === 'live' ? (
        <>
          {/* Action History Section */}
          <section className="intel-action-history">
            <h2>⚡ {t('Recent Actions')}</h2>
            <div className="action-history-list">
              {filteredRecentHistory.length > 0 ? (
                filteredRecentHistory.map((action) => (
                  <div key={action.id} className={`action-item ${action.success ? 'success' : 'failed'}`}>
                    <div className="action-icon">
                      {action.type === 'voice-command' ? '🎤' : 
                       action.type === 'proactive-insight' ? '💡' : '⌨️'}
                    </div>
                    <div className="action-content">
                      <div className="action-description">{action.description}</div>
                      <div className="action-meta">
                        <span className="action-hub">{action.hub.replace('Hub', '')}</span>
                        <span className="action-time">{formatTimestamp(action.timestamp)}</span>
                      </div>
                    </div>
                    <div className="action-status">
                      {action.success ? '✓' : '✗'}
                    </div>
                  </div>
                ))
              ) : (
                <div className="intel-empty">{noActionsMessage}</div>
              )}
            </div>
          </section>

          {/* Filters */}
          <section className="intel-filters">
            <div className="filter-group">
              <label>{t('Hub')}</label>
              <select 
                value={selectedHub} 
                onChange={(e) => setSelectedHub(e.target.value)}
                className="filter-select"
              >
                <option value="all">{t('All Hubs')}</option>
                <option value="WorkHub">💼 {t('Work')}</option>
                <option value="PersonalHub">📝 {t('Personal')}</option>
                <option value="FinanceHub">💰 {t('Finance')}</option>
              </select>
            </div>

            <div className="filter-group">
              <label>{t('Severity')}</label>
              <select 
                value={selectedSeverity} 
                onChange={(e) => setSelectedSeverity(e.target.value)}
                className="filter-select"
              >
                <option value="all">{t('All Levels')}</option>
                <option value="high">🔴 {t('High')}</option>
                <option value="medium">🟡 {t('Medium')}</option>
                <option value="low">🔵 {t('Low')}</option>
                <option value="info">⚪ {t('Info')}</option>
              </select>
            </div>

            <div className="filter-stats">
              <span className="stat-badge">
                {filteredInsights.length} {t('Insights')}
              </span>
              <span className="stat-badge high">
                {filteredInsights.filter(i => i.severity === 'high').length} {t('High')}
              </span>
            </div>
          </section>

          {/* Live Proactive Feed */}
          <section className="intel-live-feed">
            <h2>💡 {t('Proactive Insights')}</h2>
            <div className="insight-feed">
              {filteredInsights.length > 0 ? (
                filteredInsights.map((insight) => (
                  <div 
                    key={insight.id} 
                    className={`feed-insight insight-${insight.severity}`}
                    onClick={() => handleInsightClick(insight)}
                  >
                    <div className="feed-insight-header">
                      <div className="feed-insight-badges">
                        <span 
                          className="severity-badge" 
                          style={{ background: SEVERITY_COLORS[insight.severity] }}
                        >
                          {insight.severity.toUpperCase()}
                        </span>
                        <span className="hub-badge">
                          {insight.normalizedHub === 'WorkHub' ? '💼' : 
                           insight.normalizedHub === 'PersonalHub' ? '📝' : '💰'} 
                          {hubLabel(insight.normalizedHub)}
                        </span>
                      </div>
                      <span className="feed-insight-time">{formatTimestamp(insight.timestamp)}</span>
                    </div>
                    
                    <h3 className="feed-insight-title">{insight.title}</h3>
                    <p className="feed-insight-description">{insight.description}</p>
                    
                    {insight.suggestedPrompt && (
                      <div className="feed-insight-prompt">
                        <code>→ {insight.suggestedPrompt}</code>
                      </div>
                    )}
                  </div>
                ))
              ) : (
                <div className="intel-empty">
                  <div className="empty-icon">🎯</div>
                  <div className="empty-text">{noInsightsMessage}</div>
                </div>
              )}
            </div>
          </section>
        </>
      ) : (
        /* Analytics View (Original Content) */
        <>
      <section className="intel-grid">
        <div className="intel-card">
          <h2>{t('System Health')}</h2>
          <div className="health-score">
            <span className="health-value">{systemHealth.healthScore}%</span>
            <span className="health-status">{t(systemHealth.status)}</span>
          </div>
          <div className="health-bar">
            <div className="health-fill" style={{ width: `${systemHealth.healthScore}%` }} />
          </div>
        </div>

        <div className="intel-card">
          <h2>{t('Project Health')}</h2>
          <div className="intel-list">
            {projectHealth.map((project) => (
              <div key={project.projectId} className="intel-row">
                <div>
                  <div className="intel-row-title">{project.name}</div>
                  <div className="intel-row-meta">
                    {t('Total tasks')}: {project.totalTasks}
                  </div>
                </div>
                <div className="intel-row-score">
                  <span>{project.healthScore}%</span>
                  <span className="intel-row-status">{t(project.status)}</span>
                  <div className="intel-row-bar">
                    <div style={{ width: `${project.healthScore}%` }} />
                  </div>
                </div>
              </div>
            ))}
            {projectHealth.length === 0 && (
              <div className="intel-empty">{t('No active projects for analytics.')}</div>
            )}
          </div>
        </div>

        <div className="intel-card">
          <h2>{t('Throughput')}</h2>
          <div className="intel-list">
            {throughput.map((entry) => {
              const percent = entry.created
                ? Math.round((entry.completed / entry.created) * 100)
                : 0;
              return (
                <div key={entry.projectId} className="intel-row">
                  <div>
                    <div className="intel-row-title">{entry.name}</div>
                    <div className="intel-row-meta">
                      {t('Completed vs Created')}: {entry.completed}/{entry.created}
                    </div>
                  </div>
                  <div className="intel-row-score">
                    <span>{percent}%</span>
                    <div className="intel-row-bar">
                      <div style={{ width: `${percent}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {throughput.length === 0 && (
              <div className="intel-empty">{t('No throughput data available.')}</div>
            )}
          </div>
        </div>

        <div className="intel-card">
          <h2>{t('Priority Trends')}</h2>
          <div className="trend-list">
            {PRIORITY_LEVELS.map((level) => (
              <div key={level} className="trend-row">
                <span className="trend-label">{level}</span>
                <div className="trend-bar">
                  <div
                    className="trend-fill"
                    style={{
                      width: `${(priorityMetrics.counts[level] / priorityMetrics.maxCount) * 100}%`,
                      background: LEVEL_COLORS[level]
                    }}
                  />
                </div>
                <span className="trend-count">{priorityMetrics.counts[level]}</span>
              </div>
            ))}
          </div>
        </div>
      </section>
        </>
      )}
    </div>
  );
};
