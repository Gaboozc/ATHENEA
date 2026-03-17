import { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTasks } from '../context/TasksContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../components/Skeleton/Skeleton';
import './WorkHub.css';

export const WorkHub = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { projects } = useSelector((state) => state.projects);
  const { tasks } = useTasks();
  const [isReady, setIsReady] = useState(false);
  useEffect(() => { setIsReady(true); }, []);

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
  const progressPercent = useMemo(
    () => Math.round((completedTasks.length / progressTotal) * 100),
    [completedTasks.length, progressTotal]
  );

  return (
    <div className="workhub-container">
      <header className="workhub-header">
        <div>
          <h1>{t('Work Hub')}</h1>
          <p>{t('Everything related to your daily programming work.')}</p>
        </div>
      </header>

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
          🎯 {t('Crear tarea prioritaria')}
        </button>
      </section>

      <section className="workhub-grid">
        <div className="workhub-card">
          <h2>{t("Today's Focus")}</h2>
          {todayFocus.length === 0 ? (
            <div className="workhub-empty">{t('No tasks yet.')}</div>
          ) : (
            <ul>
              {todayFocus.map((task) => (
                <li key={task.id}>
                  <span>{task.title}</span>
                  <span className="workhub-pill">{task.level}</span>
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
              <span style={{ width: `${progressPercent}%` }} />
            </div>
            <div className="workhub-progress-meta">
              <span>{t('Completed')}: {completedTasks.length}</span>
              <span>{t('In Progress')}: {inProgressTasks.length}</span>
              <span>{t('Pending')}: {pendingTasks.length}</span>
              <span>{progressPercent}%</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
