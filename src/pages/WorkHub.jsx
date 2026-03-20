import { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTasks } from '../context/TasksContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../components/Skeleton/Skeleton';
import { getNeuralKey } from '../modules/intelligence/neuralAccess';
import { DailyStandup } from '../components/DailyStandup/DailyStandup';
import EmptyState from '../components/EmptyState/EmptyState';
import './WorkHub.css';

const openGatekeeper = () => window.dispatchEvent(new CustomEvent('athenea:gatekeeper:open'));

export const WorkHub = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { projects } = useSelector((state) => state.projects);
  const lastVerdict = useSelector((state) => state.aiMemory?.lastVerdict || null); /* W-FEAT-1 */
  const { tasks } = useTasks();
  const [isReady, setIsReady] = useState(false);
  useEffect(() => { setIsReady(true); }, []);

  /* NEW-WORK-2: DailyStandup — show once per day if not completed */
  const STANDUP_KEY = `athenea.standup.${new Date().toISOString().split('T')[0]}`;
  const [showStandup, setShowStandup] = useState(
    () => !window.localStorage.getItem(STANDUP_KEY)
  );

  const activeProjects = useMemo(
    () => (projects || []).filter((project) => project?.status !== 'cancelled'),
    [projects]
  );
  const criticalTasks = useMemo(
    () => (tasks || []).filter((task) => task?.level === 'Critical'),
    [tasks]
  );

  const levelOrder = ['Critical', 'High Velocity', 'Steady Flow', 'Low Friction', 'Backlog'];

  const sortedTasks = useMemo(() => {
    return (tasks || []).sort((a, b) => {
      const levelA = levelOrder.indexOf(a?.level);
      const levelB = levelOrder.indexOf(b?.level);
      return (levelA === -1 ? 999 : levelA) - (levelB === -1 ? 999 : levelB);
    });
  }, [tasks]);

  const todayFocus = useMemo(() => sortedTasks.slice(0, 3), [sortedTasks]);
  const completedTasks = useMemo(
    () => (tasks || []).filter((task) => task?.status === 'Completed'),
    [tasks]
  );
  const inProgressTasks = useMemo(
    () => (tasks || []).filter((task) => task?.status === 'In Progress'),
    [tasks]
  );
  const pendingTasks = useMemo(
    () => (tasks || []).filter(
      (task) => task?.status !== 'Completed' && task?.status !== 'In Progress'
    ),
    [tasks]
  );
  const progressTotal = (tasks || []).length || 1;
  // W-FIX-5: weekly progress calculation
  const startOfWeek = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d; /* W-FIX-5 */
  }, []);
  const tasksThisWeek = useMemo(
    () => (tasks || []).filter((t) => t.createdAt && new Date(t.createdAt) >= startOfWeek),
    [tasks, startOfWeek]
  );
  const completedThisWeek = useMemo(
    () => tasksThisWeek.filter((t) => t.status === 'Completed' || t.completed === true),
    [tasksThisWeek]
  );
  const weeklyProgress = tasksThisWeek.length > 0
    ? Math.round((completedThisWeek.length / tasksThisWeek.length) * 100)
    : 0; /* W-FIX-5 */

  return (
    <div className="workhub-container">
      <header className="workhub-header">
        <div>
          <h1>{t('Work Hub')}</h1>
          <p>{t('Everything related to your daily programming work.')}</p>
        </div>
      </header>

      {lastVerdict && getNeuralKey() && (Date.now() - lastVerdict.timestamp < 30 * 60 * 1000) && ( /* W-FEAT-1 */
        <div className="cortana-briefing">
          <span className="cortana-icon">🧿</span>
          <div className="cortana-content">
            <span className="cortana-label">Cortana</span>
            <p className="cortana-message">{lastVerdict.summary || lastVerdict.text}</p>
          </div>
        </div>
      )}

      {/* NEW-WORK-2: Daily Standup — shown once per day */}
      {showStandup && (
        <DailyStandup onDismiss={() => setShowStandup(false)} />
      )}

      <section className="workhub-stats">
        <div className="workhub-stat">
          <span>{t('Critical Tasks')}</span>
          {isReady ? <strong>{criticalTasks.length > 0 ? criticalTasks.length : '0'}</strong> : <Skeleton type="stat" />}
        </div>
        <div className="workhub-stat">
          <span>{t('Active Projects')}</span>
          {isReady ? <strong>{activeProjects.length > 0 ? activeProjects.length : '0'}</strong> : <Skeleton type="stat" />}
        </div>
      </section>

      <section className="workhub-actions">
        <button onClick={() => navigate('/my-tasks')}>{t('Go to My Tasks')}</button>
        <button onClick={() => navigate('/projects')}>{t('Go to Projects')}</button>
        <button onClick={() => navigate('/fleet')}>{t('Go to Collaborators')}</button>
        {/* FIX UX-1 — exponer GatekeeperModal */}
        <button
          className="workhub-btn-gatekeeper"
          onClick={() => window.dispatchEvent(new CustomEvent('athenea:gatekeeper:open'))}
        >
          🎯 {t('Create priority task')}
        </button>
      </section>

      <section className="workhub-grid">
        <div className="workhub-card">
          <h2>{t("Today's Focus")}</h2>
          {todayFocus.length === 0 ? (
            <EmptyState icon="📋" message={t('No tasks yet.')} ctaLabel={`+ ${t('New task')}`} onCta={openGatekeeper} />
          ) : (
            <ul>
              {todayFocus.map((task) => (
                <li /* W-FIX-8 */
                  key={task.id}
                  className="workhub-task-item"
                  onClick={() => task.projectId ? navigate(`/projects/${task.projectId}`) : navigate('/my-tasks')}
                >
                  <span>{task.title}</span>
                  <span className={`workhub-pill workhub-level-badge level-${(task.level || 'standard').toLowerCase().replace(/\s+/g, '-')}`}>
                    {task.level || 'Standard'}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="workhub-card">
          <h2>{t('Active Projects')}</h2>
          {activeProjects.length === 0 ? (
            <div className="workhub-empty-block">
              <div className="workhub-empty">{t('No active projects.')}</div>
              <button
                className="workhub-inline-action"
                onClick={() => navigate('/projects')}
              >
                {t('Go to Projects')}
              </button>
            </div>
          ) : (
            <ul>
              {activeProjects.slice(0, 3).map((project) => (
                <li key={project.id}>
                  <span>{project.name}</span>
                  {project.phase && (
                    <span className="workhub-pill workhub-pill-phase">{project.phase}</span>
                  )}
                  <span className="workhub-pill">{t(project.status || 'Active')}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="workhub-card">
          <h2>{t('Weekly Progress')}</h2>
          <div className="workhub-progress">
            <div className="workhub-progress-bar">
              <span style={{ width: `${weeklyProgress}%` }} />
            </div>
            <div className="workhub-progress-meta">
              <span>{t('Completed')}: {completedThisWeek.length}</span>
              <span>{t('In Progress')}: {inProgressTasks.length}</span>
              <span>{t('Pending')}: {tasksThisWeek.length - completedThisWeek.length}</span>
              <span>{weeklyProgress}%</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
