import { useMemo } from 'react';
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
import './Intelligence.css';

const LEVEL_COLORS = {
  Critical: '#d4af37',
  'High Velocity': '#1ec9ff',
  'Steady Flow': '#9aa3ad',
  'Low Friction': '#6b7280',
  Backlog: '#4b5563'
};

export const Intelligence = () => {
  const { tasks } = useTasks();
  const { t } = useLanguage();
  const { projects } = useSelector((state) => state.projects);
  const { workstreams } = useSelector((state) => state.organizations);

  const hasWorkstreams = workstreams.length > 0;

  const scopedProjects = projects;
  
  const systemHealth = useMemo(() => getSystemHealth(tasks), [tasks]);
  const priorityMetrics = useMemo(() => getPriorityDistribution(tasks), [tasks]);
  const projectHealth = useMemo(
    () => getProjectHealth(scopedProjects, tasks),
    [scopedProjects, tasks]
  );
  const throughput = useMemo(
    () => getThroughput(scopedProjects, tasks),
    [scopedProjects, tasks]
  );

  return (
    <div className="intel-container">
      <header className="intel-header">
        <h1>{t('Intelligence')}</h1>
        <p>{t('Priority analytics and tactical system health.')}</p>
      </header>

      {!hasWorkstreams && (
        <div className="module-maintenance">
          <div className="maintenance-icon">!</div>
          <div>
            <h2>{t('No workstreams configured yet.')}</h2>
            <p>{t('Create the first workstream to unlock analytics.')}</p>
          </div>
        </div>
      )}

      {hasWorkstreams && (
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
      )}
    </div>
  );
};
