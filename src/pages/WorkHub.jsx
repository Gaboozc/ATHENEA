import { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useTasks } from '../context/TasksContext';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { Skeleton } from '../components/Skeleton/Skeleton';
import { getLLMConfigSync } from '../services/LLMClient';
import { DailyStandup } from '../components/DailyStandup/DailyStandup';
import { EmptyState } from '../components';
import './WorkHub.css';

const openGatekeeper = () => window.dispatchEvent(new CustomEvent('athenea:gatekeeper:open'));

const levelOrder = ['Critical', 'High Velocity', 'Steady Flow', 'Low Friction', 'Backlog'];

export const WorkHub = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { projects } = useSelector((state) => state.projects);
  const lastVerdict = useSelector((state) => state.aiMemory?.lastVerdict || null); /* W-FEAT-1 */
  const { tasks, updateTask: updateTaskCtx } = useTasks();
  const [isReady, setIsReady] = useState(false);
  useEffect(() => { setIsReady(true); }, []);

  const [llmConfigured, setLlmConfigured] = useState(() => {
    const cfg = getLLMConfigSync();
    return cfg.provider === 'ollama' || !!cfg.apiKey;
  });

  useEffect(() => {
    const refresh = () => {
      const cfg = getLLMConfigSync();
      setLlmConfigured(cfg.provider === 'ollama' || !!cfg.apiKey);
    };

    window.addEventListener('athenea:llm-config-updated', refresh);
    window.addEventListener('athenea:neural-key-updated', refresh);
    return () => {
      window.removeEventListener('athenea:llm-config-updated', refresh);
      window.removeEventListener('athenea:neural-key-updated', refresh);
    };
  }, []);

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

  /* Step 6.2 — Stat pill computed values */
  const overdueTasks = useMemo(
    () => (tasks || []).filter((t) => {
      const due = new Date(t?.dueDate || '').getTime();
      return !t?.completed &&
        t?.status !== 'Completed' &&
        Number.isFinite(due) && due > 0 && due < Date.now();
    }),
    [tasks]
  );

  const dueTodayTasks = useMemo(
    () => (tasks || []).filter((t) => {
      const due = new Date(t?.dueDate || '');
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
      return !t?.completed &&
        t?.status !== 'Completed' &&
        due >= todayStart && due <= todayEnd;
    }),
    [tasks]
  );

  const startOfWeekForDone = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const doneThisWeek = useMemo(
    () => (tasks || []).filter((t) => {
      if (!(t?.status === 'Completed' || t?.completed === true)) return false;
      const dateToCheck = t?.updatedAt || t?.createdAt;
      return dateToCheck && new Date(dateToCheck) >= startOfWeekForDone;
    }),
    [tasks, startOfWeekForDone]
  );

  /* Step 6.3 — Action List */
  const actionListTasks = useMemo(() => {
    const open = (tasks || []).filter(
      (t) => !t?.completed && t?.status !== 'Completed'
    );
    return [...open]
      .sort((a, b) => {
        const aDue = new Date(a?.dueDate || '').getTime();
        const bDue = new Date(b?.dueDate || '').getTime();
        const aOverdue = Number.isFinite(aDue) && aDue > 0 && aDue < Date.now();
        const bOverdue = Number.isFinite(bDue) && bDue > 0 && bDue < Date.now();
        const todayS = new Date(); todayS.setHours(0,0,0,0);
        const todayE = new Date(); todayE.setHours(23,59,59,999);
        const aToday = Number.isFinite(aDue) && aDue >= todayS.getTime() && aDue <= todayE.getTime();
        const bToday = Number.isFinite(bDue) && bDue >= todayS.getTime() && bDue <= todayE.getTime();
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
        if (aToday !== bToday) return aToday ? -1 : 1;
        const lvlA = levelOrder.indexOf(a?.level); const lvlB = levelOrder.indexOf(b?.level);
        if (lvlA !== lvlB) return (lvlA === -1 ? 999 : lvlA) - (lvlB === -1 ? 999 : lvlB);
        const safeDueA = Number.isFinite(aDue) && aDue > 0 ? aDue : Number.MAX_SAFE_INTEGER;
        const safeDueB = Number.isFinite(bDue) && bDue > 0 ? bDue : Number.MAX_SAFE_INTEGER;
        return safeDueA - safeDueB;
      })
      .slice(0, 7);
  }, [tasks]);

  const formatDueText = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    if (!Number.isFinite(due.getTime())) return null;
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(todayEnd); tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    if (due < todayStart) {
      const daysLate = Math.floor((todayStart.getTime() - due.getTime()) / 86400000);
      return daysLate === 1 ? t('Due yesterday') : `${t('Overdue')} ${daysLate}d`;
    }
    if (due >= todayStart && due <= todayEnd) {
      return `${t('Due today')} ${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (due >= tomorrowStart && due <= tomorrowEnd) return t('Tomorrow');
    return due.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };

  /* Step 6.4 — Urgent task preview map for Active Projects */
  const projectUrgentTask = useMemo(() => {
    const map = {};
    (projects || []).forEach((proj) => {
      const open = (tasks || []).filter(
        (t) => t?.projectId === proj.id && !t?.completed && t?.status !== 'Completed'
      );
      if (open.length === 0) { map[proj.id] = null; return; }
      open.sort((a, b) => {
        const aDue = new Date(a?.dueDate || '').getTime();
        const bDue = new Date(b?.dueDate || '').getTime();
        const safeDueA = Number.isFinite(aDue) && aDue > 0 ? aDue : Number.MAX_SAFE_INTEGER;
        const safeDueB = Number.isFinite(bDue) && bDue > 0 ? bDue : Number.MAX_SAFE_INTEGER;
        if (safeDueA !== safeDueB) return safeDueA - safeDueB;
        return (levelOrder.indexOf(a?.level) ?? 9) - (levelOrder.indexOf(b?.level) ?? 9);
      });
      map[proj.id] = open[0];
    });
    return map;
  }, [projects, tasks]);

  return (
    <div className="workhub-container">
      <header className="workhub-header">
        <div>
          <h1>{t('Work Hub')}</h1>
          <p>{t('Everything related to your daily programming work.')}</p>
        </div>
      </header>

      {lastVerdict && llmConfigured && (Date.now() - lastVerdict.timestamp < 30 * 60 * 1000) && (
        <div className="cortana-briefing">
          <span className="cortana-icon">🧿</span>
          <div className="cortana-content">
            <span className="cortana-label">Cortana</span>
            <p className="cortana-message">{lastVerdict.summary || lastVerdict.text}</p>
          </div>
        </div>
      )}

      {showStandup && (
        <DailyStandup onDismiss={() => setShowStandup(false)} />
      )}

      {/* Situation Report — 4 stat pills */}
      <section className="workhub-sitrep">
        <div className={`workhub-sitrep-pill ${overdueTasks.length > 0 ? 'sitrep-red' : 'sitrep-gray'}`}>
          <span className="sitrep-value">{isReady ? overdueTasks.length : '—'}</span>
          <span className="sitrep-label">{t('Overdue')}</span>
        </div>
        <div className={`workhub-sitrep-pill ${dueTodayTasks.length > 0 ? 'sitrep-amber' : 'sitrep-gray'}`}>
          <span className="sitrep-value">{isReady ? dueTodayTasks.length : '—'}</span>
          <span className="sitrep-label">{t('Due Today')}</span>
        </div>
        <div className={`workhub-sitrep-pill ${inProgressTasks.length > 0 ? 'sitrep-blue' : 'sitrep-gray'}`}>
          <span className="sitrep-value">{isReady ? inProgressTasks.length : '—'}</span>
          <span className="sitrep-label">{t('In Progress')}</span>
        </div>
        <div className="workhub-sitrep-pill sitrep-green">
          <span className="sitrep-value">{isReady ? doneThisWeek.length : '—'}</span>
          <span className="sitrep-label">{t('Done This Week')}</span>
        </div>
      </section>

      {/* Action List */}
      <section className="workhub-card workhub-action-list">
        <h2>{t('Action List')}</h2>
        {actionListTasks.length === 0 ? (
          <EmptyState icon="📋" message={t('No tasks yet.')} ctaLabel={`+ ${t('New task')}`} onCta={openGatekeeper} />
        ) : (
          <>
            <ul>
              {actionListTasks.map((task) => {
                const due = new Date(task?.dueDate || '').getTime();
                const isOverdue = Number.isFinite(due) && due > 0 && due < Date.now();
                const todayS = new Date(); todayS.setHours(0,0,0,0);
                const todayE = new Date(); todayE.setHours(23,59,59,999);
                const isToday = Number.isFinite(due) && due >= todayS.getTime() && due <= todayE.getTime();
                const dueText = formatDueText(task?.dueDate);
                return (
                  <li key={task.id} className={`workhub-action-item${isOverdue ? ' action-overdue' : isToday ? ' action-today' : ''}`}>
                    <span className="action-urgency">
                      {isOverdue ? '⚠️' : isToday ? '🕐' : ''}
                    </span>
                    <button
                      className="action-title"
                      onClick={() => task.projectId ? navigate(`/projects/${task.projectId}`) : navigate('/my-tasks')}
                      type="button"
                    >
                      {task.title}
                    </button>
                    <span className={`workhub-pill level-${(task.level || 'standard').toLowerCase().replace(/\s+/g, '-')}`}>
                      {task.level || 'Standard'}
                    </span>
                    {dueText && <span className={`action-due${isOverdue ? ' action-due--overdue' : ''}`}>{dueText}</span>}
                    <div className="action-buttons">
                      {task.status !== 'In Progress' && (
                        <button
                          className="action-btn action-btn--start"
                          title={t('Start')}
                          onClick={() => updateTaskCtx(task.id, { status: 'In Progress' })}
                        >
                          ▶
                        </button>
                      )}
                      <button
                        className="action-btn action-btn--done"
                        title={t('Complete')}
                        onClick={() => updateTaskCtx(task.id, { status: 'Completed', completed: true })}
                      >
                        ✓
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <a className="workhub-see-all" href="/my-tasks" onClick={(e) => { e.preventDefault(); navigate('/my-tasks'); }}>{t('See all')} →</a>
          </>
        )}
      </section>

      {/* Active Projects with urgent task preview */}
      <section className="workhub-card">
        <h2>{t('Active Projects')}</h2>
        {activeProjects.length === 0 ? (
          <EmptyState
            icon="📁"
            title={t('No active projects.')}
            description={t('Start by creating a project to organize your workflow.')}
            action={{
              label: t('Go to Projects'),
              icon: '→',
              onClick: () => navigate('/projects'),
            }}
          />
        ) : (
          <ul>
            {activeProjects.slice(0, 3).map((project) => {
              const urgentTask = projectUrgentTask[project.id];
              return (
                <li key={project.id} className="workhub-project-item">
                  <div className="project-header-row">
                    <span>📁 {project.name}</span>
                    <span className="workhub-pill">{t(project.status || 'Active')}</span>
                  </div>
                  <div className="project-urgent-task">
                    {urgentTask
                      ? <span>└─ {urgentTask.title}{urgentTask.dueDate ? ` — ${formatDueText(urgentTask.dueDate)}` : ''}</span>
                      : <span className="project-no-tasks">└─ {t('No open tasks')}</span>
                    }
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="workhub-actions">
        <button onClick={() => navigate('/my-tasks')}>{t('Go to My Tasks')}</button>
        <button onClick={() => navigate('/projects')}>{t('Go to Projects')}</button>
        <button onClick={() => navigate('/fleet')}>{t('Go to Collaborators')}</button>
        <button
          className="workhub-btn-gatekeeper"
          onClick={() => window.dispatchEvent(new CustomEvent('athenea:gatekeeper:open'))}
        >
          🎯 {t('Create priority task')}
        </button>
      </section>
    </div>
  );
};
