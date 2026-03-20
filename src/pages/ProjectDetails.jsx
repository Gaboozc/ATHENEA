import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { useTasks } from '../context/TasksContext';
import { updateProject, setProjectPhase, addMeetingNote, deleteMeetingNote } from '../../store/slices/projectsSlice';
import { useLanguage } from '../context/LanguageContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import './ProjectDetails.css';

const PROJECT_PHASES = ['Discovery', 'Setup', 'Desarrollo', 'Pruebas', 'Lanzamiento']; /* NEW-WORK-3 */
const TASK_STATUSES = ['Pendiente', 'En Curso', 'Por Terminar', 'En Revisión', 'Completado']; /* NEW-WORK-3 */
const slugStatus = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

const PRIORITY_LEVELS = [
  'Critical',
  'High Velocity',
  'Steady Flow',
  'Low Friction',
  'Backlog'
];

const buildSubscriptionTimeline = (startDate, amount, months = 12) => {
  const base = new Date(startDate || '');
  if (Number.isNaN(base.getTime()) || Number(amount || 0) <= 0) {
    return [];
  }

  return Array.from({ length: months }).map((_, index) => {
    const due = new Date(base);
    due.setMonth(base.getMonth() + index);
    return {
      id: `subscription-${index}`,
      date: due,
      amount: Number(amount || 0)
    };
  });
};

export const ProjectDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const project = useSelector((state) =>
    state.projects.projects.find((item) => item.id === id)
  );
  const { workstreams } = useSelector((state) => state.organizations);
  const { tasks, addTask, updateTaskStatus, deleteTask } = useTasks();
  const { t } = useLanguage();
  const { user } = useCurrentUser();
  const [search, setSearch] = useState('');
  const [removedLegacyTitles, setRemovedLegacyTitles] = useState([]);
  const [deletedTasks, setDeletedTasks] = useState([]);
  const [showDeletedTasks, setShowDeletedTasks] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  /* inline new task form */
  const [showNewTaskForm, setShowNewTaskForm] = useState(false);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  /* NEW-WORK-3: subtask inline form */
  const [subtaskFormFor, setSubtaskFormFor] = useState(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');
  /* NEW-WORK-3: meeting notes form */
  const [showMeetingForm, setShowMeetingForm] = useState(false);
  const [meetingForm, setMeetingForm] = useState({ dateTime: '', transcription: '', link: '' });
  const [formState, setFormState] = useState(() => ({
    status: project?.status || 'planning',
    clientName: project?.clientName || '',
    siteAddress: project?.siteAddress || '',
    startDate: project?.startDate || '',
    endDate: project?.endDate || '',
    maintenancePlan: project?.maintenancePlan || '',
    isSubscription: Boolean(project?.economic?.isSubscription || project?.maintenancePlan),
    totalAmount: String(project?.economic?.totalAmount || ''),
    advanceAmount: String(project?.economic?.advanceAmount || ''),
    subscriptionAmount: String(project?.economic?.subscriptionAmount || ''),
    subscriptionStartDate: project?.economic?.subscriptionStartDate
      ? String(project.economic.subscriptionStartDate).slice(0, 10)
      : ''
  }));
  const isCancelled = project?.status === 'cancelled';
  const projectWorkstream = workstreams.find(
    (stream) => stream.id === project?.workstreamId
  );
  const canManageProject = true; // Single-user mode: siempre permitido

  if (!project) {
    return (
      <div className="project-detail-container">
        <div className="project-not-found">
          <h2>{t('Project not found')}</h2>
          <button className="tactical-button" onClick={() => navigate('/projects')}>
            {t('Back to Projects')}
          </button>
        </div>
      </div>
    );
  }

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#1ec9ff';
      case 'maintenance':
        return '#1ec9ff';
      case 'in-progress':
        return '#d4af37';
      case 'planning':
        return '#9aa3ad';
      default:
        return '#9aa3ad';
    }
  };

  const getPriorityColor = (level) => {
    switch (level) {
      case 'Critical':
        return '#ef4444';
      case 'High Velocity':
        return '#f97316';
      case 'Steady Flow':
        return '#facc15';
      case 'Low Friction':
        return '#22c55e';
      case 'Backlog':
        return '#4b5563';
      default:
        return '#4b5563';
    }
  };

  const projectTasks = tasks
    .filter((task) => task.projectId === project.id)
    .map((task) => ({
      id: task.id,
      title: task.title,
      status: task.status || 'Active',
      level: task.level || 'Backlog',
      totalScore: typeof task.totalScore === 'number' ? task.totalScore : null,
      parentTaskId: task.parentTaskId || null,
      isLegacy: false
    }));
  // W-FEAT-3: collect time log entries across all project tasks
  const projectTimeEntries = tasks
    .filter((task) => task.projectId === project.id)
    .flatMap((task) =>
      (task.timeLogs || []).map((log) => ({
        taskId: task.id,
        taskTitle: task.title,
        hours: Number(log.hoursWorked || 0),
        date: log.loggedAt || log.timestamp || '',
        notes: log.notes || ''
      }))
    )
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, 20);
  const totalLoggedHours = Math.round(
    projectTimeEntries.reduce((sum, e) => sum + e.hours, 0) * 10
  ) / 10; /* W-FEAT-3 */
  const legacyTasks = (project.tasks || []).map((task) => ({
    id: `legacy-${task}`,
    title: task,
    status: 'Queued',
    level: 'Backlog',
    totalScore: null,
    isLegacy: true
  }));
  const mergedTasks = [...projectTasks, ...legacyTasks].filter(
    (task, index, self) =>
      index === self.findIndex((entry) => entry.title === task.title)
  );
  const activeTasks = mergedTasks.filter(
    (task) => !removedLegacyTitles.includes(task.title)
  );
  const filteredTasks = activeTasks.filter((task) =>
    task.title.toLowerCase().includes(search.toLowerCase())
  );
  const economic = project?.economic || {};
  const totalAmount = Number(economic.totalAmount || 0);
  const advanceAmount = Number(economic.advanceAmount || 0);
  const hasSubscription = Boolean(economic.isSubscription) && Number(economic.subscriptionAmount || 0) > 0;
  const paidProgress = Math.min(totalAmount, Math.max(0, advanceAmount));
  const subscriptionTimeline = buildSubscriptionTimeline(
    economic.subscriptionStartDate,
    economic.subscriptionAmount,
    12
  );
  const completedTasksCount = activeTasks.filter(
    (task) => task.status === 'Completado' || task.status === 'Finalizado' || task.status === 'Completed' || task.status === 'completed'
  ).length;
  const totalTasksCount = activeTasks.length;
  const remainingTasksCount = Math.max(totalTasksCount - completedTasksCount, 0);
  const completionPercentage = totalTasksCount
    ? Math.round((completedTasksCount / totalTasksCount) * 100)
    : 0;

  /* NEW-WORK-3: build subtask map from real (non-legacy) project tasks */
  const projectTaskIdSet = new Set(projectTasks.map((t) => t.id));
  const subtaskMap = {};
  projectTasks.forEach((t) => {
    if (t.parentTaskId && projectTaskIdSet.has(t.parentTaskId)) {
      if (!subtaskMap[t.parentTaskId]) subtaskMap[t.parentTaskId] = [];
      subtaskMap[t.parentTaskId].push(t);
    }
  });
  /* root tasks: no parentTaskId or parent not in this project */
  const rootFilteredTasks = filteredTasks.filter(
    (t) => !t.parentTaskId || !projectTaskIdSet.has(t.parentTaskId)
  );

  const handleAddTask = () => {
    const title = newTaskTitle.trim();
    if (!title) return;
    addTask({
      title,
      projectId: project.id,
      projectName: project.name,
      status: 'Pendiente',
      level: 'Backlog',
      assigneeId: user?.id,
      createdAt: new Date().toISOString()
    });
    setNewTaskTitle('');
    setShowNewTaskForm(false);
  };

  const handleAddSubtask = (parentId) => {
    const title = subtaskTitle.trim();
    if (!title) return;
    addTask({
      title,
      projectId: project.id,
      projectName: project.name,
      parentTaskId: parentId,
      status: 'pending',
      level: 'Backlog',
      assigneeId: user?.id,
      createdAt: new Date().toISOString()
    });
    setSubtaskTitle('');
    setSubtaskFormFor(null);
  };

  const handleAddMeetingNote = () => {
    if (!meetingForm.transcription.trim() && !meetingForm.link.trim()) return;
    dispatch(addMeetingNote({
      id: project.id,
      note: { ...meetingForm, dateTime: meetingForm.dateTime || new Date().toISOString().slice(0, 16) }
    }));
    setMeetingForm({ dateTime: '', transcription: '', link: '' });
    setShowMeetingForm(false);
  };

  const markLegacyComplete = (title) => {
    if (isCancelled) return;
    addTask({
      id: `legacy-${Date.now()}`,
      projectId: project.id,
      projectName: project.name,
      status: 'Completado',
      title,
      description: '',
      workstreams: project.workstreamId ? [project.workstreamId] : [],
      factors: {
        blocking: 0,
        urgency: 0,
        impact: 0,
        omissionCost: 0,
        alignment: 0,
        mentalLoad: 0,
        quickWin: 0
      },
      totalScore: 0,
      level: 'Backlog',
      metadata: {
        source: 'legacy_manual'
      },
      createdAt: new Date().toISOString()
    });
  };

  const markLegacyInProgress = (title) => {
    if (isCancelled) return;
    addTask({
      id: `legacy-${Date.now()}`,
      projectId: project.id,
      projectName: project.name,
      status: 'En Curso',
      title,
      description: '',
      workstreams: project.workstreamId ? [project.workstreamId] : [],
      factors: {
        blocking: 0,
        urgency: 0,
        impact: 0,
        omissionCost: 0,
        alignment: 0,
        mentalLoad: 0,
        quickWin: 0
      },
      totalScore: 0,
      level: 'Backlog',
      metadata: {
        source: 'legacy_manual'
      },
      createdAt: new Date().toISOString()
    });
  };

  const removeLegacyTask = (title) => {
    setRemovedLegacyTitles((prev) => [...prev, title]);
  };

  const handleDeleteTask = (task) => {
    if (deletedTasks.some((entry) => entry.id === task.id)) {
      return;
    }

    if (task.isLegacy) {
      removeLegacyTask(task.title);
      setDeletedTasks((prev) => [...prev, { id: task.id, title: task.title, isLegacy: true }]);
      return;
    }

    const originalTask = tasks.find((entry) => entry.id === task.id);
    if (!originalTask) {
      return;
    }

    deleteTask(task.id);
    setDeletedTasks((prev) => [
      ...prev,
      {
        id: task.id,
        title: task.title,
        isLegacy: false,
        task: originalTask
      }
    ]);
  };

  const handleRestoreTask = (entry) => {
    if (isCancelled) return;
    if (entry.isLegacy) {
      setRemovedLegacyTitles((prev) => prev.filter((title) => title !== entry.title));
    } else if (entry.task) {
      addTask({ ...entry.task });
    }

    setDeletedTasks((prev) => prev.filter((item) => item.id !== entry.id));
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormState((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const saveProjectSettings = () => {
    if (!canManageProject) return;
    const nextEconomic = {
      totalAmount: Number(formState.totalAmount || 0),
      advanceAmount: Number(formState.advanceAmount || 0),
      isSubscription: Boolean(formState.isSubscription),
      subscriptionAmount: formState.isSubscription ? Number(formState.subscriptionAmount || 0) : 0,
      subscriptionStartDate: formState.isSubscription ? formState.subscriptionStartDate : ''
    };
    dispatch(updateProject({
      id: project.id,
      status: formState.status,
      clientName: formState.clientName,
      siteAddress: formState.siteAddress,
      startDate: formState.startDate,
      endDate: formState.endDate,
      maintenancePlan: formState.isSubscription ? formState.maintenancePlan : '',
      economic: nextEconomic
    }));
    setShowSettings(false);
  };

  return (
    <div className="project-detail-container">
      <div className="project-detail-header">
        <div className="project-header-actions">
          <button className="tactical-button is-muted" onClick={() => navigate('/projects')}>
            ← {t('Back')}
          </button>
          <button
            className="tactical-button"
            type="button"
            onClick={() => setShowSettings((prev) => !prev)}
            disabled={!canManageProject}
          >
            {t('Settings')}
          </button>
        </div>
        <span
          className="project-status"
          style={{ backgroundColor: getStatusColor(project.status) }}
        >
          {project.status.split('-').map((word) =>
            word.charAt(0).toUpperCase() + word.slice(1)
          ).join(' ')}
        </span>
      </div>

      <div className="project-title-block">
        <h1>{project.name}</h1>
        <p>{project.description}</p>
        {project.workstreamName && (
          <span className="project-status is-muted">
            {t('Workstream')}: {project.workstreamName}
          </span>
        )}
      </div>

      {/* NEW-WORK-3: Project phase selector */}
      <div className="project-phase-stepper">
        {PROJECT_PHASES.map((phase, i) => {
          const currentIdx = PROJECT_PHASES.indexOf(project.phase || 'Discovery');
          const isDone = i < currentIdx;
          const isActive = i === currentIdx;
          return (
            <button
              key={phase}
              className={`phase-step${isActive ? ' is-active' : ''}${isDone ? ' is-done' : ''}`}
              onClick={() => dispatch(setProjectPhase({ id: project.id, phase }))}
            >
              {isDone && <span className="phase-check">✓</span>}
              <span className="phase-label">{phase}</span>
            </button>
          );
        })}
      </div>

      {showSettings && (
        <section className="project-card project-settings">
          <h2>{t('Project Settings')}</h2>
          <div className="project-settings-grid">
            <label>
              <span>{t('Status')}</span>
              <select name="status" value={formState.status} onChange={handleFormChange}>
                <option value="planning">{t('Planning')}</option>
                <option value="in-progress">{t('In Progress')}</option>
                <option value="maintenance">{t('Maintenance')}</option>
                <option value="completed">{t('Completed')}</option>
              </select>
            </label>
            <label>
              <span>{t('Client')}</span>
              <input
                name="clientName"
                value={formState.clientName}
                onChange={handleFormChange}
                type="text"
              />
            </label>
            <label>
              <span>{t('Location')}</span>
              <input
                name="siteAddress"
                value={formState.siteAddress}
                onChange={handleFormChange}
                type="text"
              />
            </label>
            <label>
              <span>{t('Start Date')}</span>
              <input
                name="startDate"
                value={formState.startDate}
                onChange={handleFormChange}
                type="date"
              />
            </label>
            <label>
              <span>{t('Delivery Date')}</span>
              <input
                name="endDate"
                value={formState.endDate}
                onChange={handleFormChange}
                type="date"
              />
            </label>
            <label className="settings-toggle">
              <span>{t('Subscription')}</span>
              <input
                name="isSubscription"
                checked={formState.isSubscription}
                onChange={handleFormChange}
                type="checkbox"
              />
            </label>
            {formState.isSubscription && (
              <label>
                <span>{t('Plan Notes')}</span>
                <input
                  name="maintenancePlan"
                  value={formState.maintenancePlan}
                  onChange={handleFormChange}
                  type="text"
                  placeholder={t('Monthly maintenance')}
                />
              </label>
            )}
            <label>
              <span>{t('Total Amount')}</span>
              <input
                name="totalAmount"
                value={formState.totalAmount}
                onChange={handleFormChange}
                type="number"
                min="0"
                step="0.01"
              />
            </label>
            <label>
              <span>{t('Advance Amount')}</span>
              <input
                name="advanceAmount"
                value={formState.advanceAmount}
                onChange={handleFormChange}
                type="number"
                min="0"
                step="0.01"
              />
            </label>
            {formState.isSubscription && (
              <>
                <label>
                  <span>{t('Monthly Subscription Amount')}</span>
                  <input
                    name="subscriptionAmount"
                    value={formState.subscriptionAmount}
                    onChange={handleFormChange}
                    type="number"
                    min="0"
                    step="0.01"
                  />
                </label>
                <label>
                  <span>{t('First Payment Date')}</span>
                  <input
                    name="subscriptionStartDate"
                    value={formState.subscriptionStartDate}
                    onChange={handleFormChange}
                    type="date"
                  />
                </label>
              </>
            )}
          </div>
          <div className="project-settings-actions">
            <button
              type="button"
              className="tactical-button"
              onClick={saveProjectSettings}
            >
              {t('Save Changes')}
            </button>
            <button
              type="button"
              className="tactical-button is-muted"
              onClick={() => setShowSettings(false)}
            >
              {t('Cancel')}
            </button>
          </div>
        </section>
      )}

      <div className="project-grid">
        <section className="project-card">
          <h2>{t('Project Information')}</h2>
          <div className="project-info-grid">
            <div>
              <span className="label">{t('Client')}</span>
              <span className="value">{project.clientName}</span>
            </div>
            <div>
              <span className="label">{t('Location')}</span>
              <span className="value">{project.siteAddress}</span>
            </div>
            <div>
              <span className="label">{t('Start Date')}</span>
              <span className="value">{new Date(project.startDate).toLocaleDateString()}</span>
            </div>
            <div>
              <span className="label">{t('Delivery Date')}</span>
              <span className="value">
                {project.endDate
                  ? new Date(project.endDate).toLocaleDateString()
                  : t('TBD')}
              </span>
            </div>
            <div>
              <span className="label">{t('Subscription')}</span>
              <span className="value">
                {project.maintenancePlan ? project.maintenancePlan : t('Not subscribed')}
              </span>
            </div>
            <div>
              <span className="label">{t('Total Amount')}</span>
              <span className="value">{totalAmount > 0 ? totalAmount.toFixed(2) : t('Not defined')}</span>
            </div>
            <div>
              <span className="label">{t('Advance')}</span>
              <span className="value">{advanceAmount > 0 ? advanceAmount.toFixed(2) : t('Not defined')}</span>
            </div>
          </div>
        </section>

        <section className="project-card">
          <h2>{t('Progress')}</h2>
          <div className="progress-shell">
            <div className="progress-circle">
              <span>{completionPercentage}%</span>
            </div>
            <div className="progress-stats">
              <div className="progress-stat">
                <span className="value">{totalTasksCount}</span>
                <span className="label">{t('Total Tasks')}</span>
              </div>
              <div className="progress-stat">
                <span className="value">{completedTasksCount}</span>
                <span className="label">{t('Completed')}</span>
              </div>
              <div className="progress-stat">
                <span className="value">{remainingTasksCount}</span>
                <span className="label">{t('Remaining')}</span>
              </div>
              <button
                type="button"
                className="progress-stat progress-stat-button"
                onClick={() => setShowDeletedTasks((prev) => !prev)}
              >
                <span className="value">{deletedTasks.length}</span>
                <span className="label">{t('Deleted')}</span>
              </button>
            </div>
          </div>
        </section>
      </div>

      <section className="project-card project-finance-timeline">
        <h2>{t('Subscription Billing Timeline')}</h2>
        {totalAmount > 0 && (
          <div className="project-finance-summary">
            <div>
              <span className="label">{t('Contract Total')}</span>
              <span className="value">{totalAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className="label">{t('Registered Advance')}</span>
              <span className="value">{advanceAmount.toFixed(2)}</span>
            </div>
            <div>
              <span className="label">{t('Progress')}</span>
              <span className="value">{totalAmount > 0 ? Math.round((paidProgress / totalAmount) * 100) : 0}%</span>
            </div>
          </div>
        )}

        {!hasSubscription || subscriptionTimeline.length === 0 ? (
          <div className="tasks-empty">{t('No monthly subscription schedule for this project.')}</div>
        ) : (
          <ul className="project-finance-list">
            {subscriptionTimeline.map((entry) => (
              <li key={entry.id}>
                <span>{entry.date.toLocaleDateString()}</span>
                <strong>{Number(entry.amount).toFixed(2)}</strong>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="project-card tasks-panel">
        <div className="tasks-header">
          <div>
            <h2>{t('Strategic Task List')}</h2>
            <p>{t('Aligned to ATHENEA priority doctrine.')}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              placeholder={t('Search tasks')}
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            {!isCancelled && (
              <button
                type="button"
                className="tactical-button"
                onClick={() => { setShowNewTaskForm((v) => !v); setNewTaskTitle(''); }}
              >
                + {t('Task')}
              </button>
            )}
          </div>
        </div>
        {showNewTaskForm && (
          <div className="subtask-form" style={{ marginLeft: 0, marginBottom: '12px' }}>
            <input
              autoFocus
              className="subtask-input"
              placeholder={t('Task title…')}
              value={newTaskTitle}
              onChange={(e) => setNewTaskTitle(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAddTask();
                if (e.key === 'Escape') setShowNewTaskForm(false);
              }}
            />
            <button type="button" className="task-action task-complete" onClick={handleAddTask}>{t('Add')}</button>
            <button type="button" className="task-action task-delete" onClick={() => setShowNewTaskForm(false)}>{t('Cancel')}</button>
          </div>
        )}
        {isCancelled && (
          <div className="tasks-warning">
            {t('Cancelled projects cannot receive new tasks.')}
          </div>
        )}
        {rootFilteredTasks.length === 0 ? (
          <div className="tasks-empty">{t('No tasks found for this project.')}</div>
        ) : (
          <ul className="tasks-list">
            {rootFilteredTasks.map((task) => (
              <li key={task.id} className="task-row">
                <div className="task-main">
                  <span className="task-title">
                    {task.parentTaskId && !projectTaskIdSet.has(task.parentTaskId) && (
                      <span className="task-orphan-badge" title={t('Subtask sin padre visible')}>↳</span>
                    )}
                    {task.title}
                  </span>
                  {!task.isLegacy ? (
                    <select
                      className={`task-status-select status-${slugStatus(task.status)}`}
                      value={TASK_STATUSES.includes(task.status) ? task.status : 'Pendiente'}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                    >
                      {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                    </select>
                  ) : (
                    <span className={`task-status status-${slugStatus(task.status)}`}>{task.status}</span>
                  )}
                  <div className="task-actions">
                    {!task.isLegacy && (
                      <button type="button" className="task-action task-subtask"
                        onClick={() => { setSubtaskFormFor(task.id); setSubtaskTitle(''); }}>
                        + {t('Subtask')}
                      </button>
                    )}
                    {task.isLegacy && (
                      <button type="button" className="task-action task-complete"
                        onClick={() => markLegacyComplete(task.title)} disabled={isCancelled}>
                        {t('Finalizar')}
                      </button>
                    )}
                    <button type="button" className="task-action task-delete"
                      onClick={() => handleDeleteTask(task)}>{t('Delete')}</button>
                  </div>
                </div>
                <div className="task-metadata">
                  {task.totalScore !== null && (
                    <span className="task-score">PS: {task.totalScore}/14</span>
                  )}
                  <span className="task-priority" style={{ borderColor: getPriorityColor(task.level), color: getPriorityColor(task.level) }}>
                    {task.level}
                  </span>
                </div>
                {/* inline form para subtarea */}
                {subtaskFormFor === task.id && (
                  <div className="subtask-form">
                    <span className="subtask-form-label">↳ {t('Subtask de')}: <strong>{task.title}</strong></span>
                    <input autoFocus className="subtask-input"
                      placeholder={t('Subtask title…')} value={subtaskTitle}
                      onChange={(e) => setSubtaskTitle(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter') handleAddSubtask(task.id);
                        if (e.key === 'Escape') setSubtaskFormFor(null);
                      }}
                    />
                    <button type="button" className="task-action task-complete" onClick={() => handleAddSubtask(task.id)}>{t('Add')}</button>
                    <button type="button" className="task-action task-delete" onClick={() => setSubtaskFormFor(null)}>{t('Cancel')}</button>
                  </div>
                )}
                {/* nivel 1: subtareas */}
                {subtaskMap[task.id]?.length > 0 && (
                  <ul className="subtasks-list">
                    {subtaskMap[task.id].map((sub) => (
                      <li key={sub.id} className="subtask-row">
                        <span className="subtask-bullet">↳</span>
                        <span className="task-title">{sub.title}</span>
                        <select
                          className={`task-status-select status-${slugStatus(sub.status)}`}
                          value={TASK_STATUSES.includes(sub.status) ? sub.status : 'Pendiente'}
                          onChange={(e) => updateTaskStatus(sub.id, e.target.value)}
                        >
                          {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                        </select>
                        <div className="task-actions">
                          <button type="button" className="task-action task-subtask"
                            onClick={() => { setSubtaskFormFor(sub.id); setSubtaskTitle(''); }}>
                            + {t('Sub')}
                          </button>
                          <button type="button" className="task-action task-delete"
                            onClick={() => handleDeleteTask(sub)}>{t('Delete')}</button>
                        </div>
                        {/* inline form para sub-subtarea */}
                        {subtaskFormFor === sub.id && (
                          <div className="subtask-form">
                            <span className="subtask-form-label">↳↳ {t('Sub de')}: <strong>{sub.title}</strong></span>
                            <input autoFocus className="subtask-input"
                              placeholder={t('Sub-subtask title…')} value={subtaskTitle}
                              onChange={(e) => setSubtaskTitle(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleAddSubtask(sub.id);
                                if (e.key === 'Escape') setSubtaskFormFor(null);
                              }}
                            />
                            <button type="button" className="task-action task-complete" onClick={() => handleAddSubtask(sub.id)}>{t('Add')}</button>
                            <button type="button" className="task-action task-delete" onClick={() => setSubtaskFormFor(null)}>{t('Cancel')}</button>
                          </div>
                        )}
                        {/* nivel 2: sub-subtareas */}
                        {subtaskMap[sub.id]?.length > 0 && (
                          <ul className="subtasks-list subtasks-list--l2">
                            {subtaskMap[sub.id].map((subsub) => (
                              <li key={subsub.id} className="subtask-row subtask-row--l2">
                                <span className="subtask-bullet">↳</span>
                                <span className="task-title">{subsub.title}</span>
                                <select
                                  className={`task-status-select status-${slugStatus(subsub.status)}`}
                                  value={TASK_STATUSES.includes(subsub.status) ? subsub.status : 'Pendiente'}
                                  onChange={(e) => updateTaskStatus(subsub.id, e.target.value)}
                                >
                                  {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                                </select>
                                <div className="task-actions">
                                  <button type="button" className="task-action task-delete"
                                    onClick={() => handleDeleteTask(subsub)}>{t('Delete')}</button>
                                </div>
                              </li>
                            ))}
                          </ul>
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        )}
        {showDeletedTasks && (
          <div className="deleted-tasks-panel">
            <div className="deleted-tasks-header">
              <h3>{t('Deleted Tasks')}</h3>
              <span>{deletedTasks.length} {t('total')}</span>
            </div>
            {deletedTasks.length === 0 ? (
              <p className="deleted-tasks-empty">{t('No deleted tasks.')}</p>
            ) : (
              <ul className="deleted-tasks-list">
                {deletedTasks.map((entry) => (
                  <li key={entry.id} className="deleted-task">
                    <span>{entry.title}</span>
                    <button
                      type="button"
                      className="task-action task-restore"
                      onClick={() => handleRestoreTask(entry)}
                      disabled={isCancelled}
                    >
                      {t('Restore')}
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
        <div className="tasks-footer">
          {PRIORITY_LEVELS.map((level) => (
            <span
              key={level}
              className="priority-chip"
              style={{
                borderColor: getPriorityColor(level),
                color: getPriorityColor(level)
              }}
            >
              {level}
            </span>
          ))}
        </div>
      </section>

      {/* NEW-WORK-3: Meeting notes */}
      <section className="project-card project-meetings">
        <div className="meetings-header">
          <h2>{t('Meeting Notes')}</h2>
          <button type="button" className="tactical-button" onClick={() => setShowMeetingForm((v) => !v)}>
            {showMeetingForm ? t('Cancel') : `+ ${t('Add Note')}`}
          </button>
        </div>
        {showMeetingForm && (
          <div className="meeting-form">
            <label>
              <span>{t('Meeting Date & Time')}</span>
              <input type="datetime-local" value={meetingForm.dateTime}
                onChange={(e) => setMeetingForm((f) => ({ ...f, dateTime: e.target.value }))} />
            </label>
            <label>
              <span>{t('Transcription')}</span>
              <textarea rows={6} placeholder={t('Paste or write the meeting transcription…')}
                value={meetingForm.transcription}
                onChange={(e) => setMeetingForm((f) => ({ ...f, transcription: e.target.value }))} />
            </label>
            <label>
              <span>{t('Link')}</span>
              <input type="url" placeholder="https://…"
                value={meetingForm.link}
                onChange={(e) => setMeetingForm((f) => ({ ...f, link: e.target.value }))} />
            </label>
            <div className="meeting-form-actions">
              <button type="button" className="tactical-button" onClick={handleAddMeetingNote}>{t('Save Note')}</button>
            </div>
          </div>
        )}
        {(!project.meetingNotes || project.meetingNotes.length === 0) ? (
          <div className="tasks-empty">{t('No meeting notes yet.')}</div>
        ) : (
          <ul className="meetings-list">
            {project.meetingNotes.map((note) => (
              <li key={note.id} className="meeting-note">
                <div className="meeting-note-header">
                  {note.dateTime && (
                    <span className="meeting-note-date">
                      {new Date(note.dateTime).toLocaleString()}
                    </span>
                  )}
                  {note.link && (
                    <a className="meeting-note-link" href={note.link} target="_blank" rel="noreferrer">
                      🔗 {t('Link')}
                    </a>
                  )}
                  <button type="button" className="task-action task-delete"
                    onClick={() => dispatch(deleteMeetingNote({ id: project.id, noteId: note.id }))}>
                    {t('Delete')}
                  </button>
                </div>
                {note.transcription && (
                  <pre className="meeting-note-transcription">{note.transcription}</pre>
                )}
              </li>
            ))}
          </ul>
        )}
      </section>

      {projectTimeEntries.length > 0 && ( /* W-FEAT-3 */
        <section className="project-card project-time-log">
          <div className="time-log-header">
            <h2>{t('Time Log')}</h2>
            <span className="time-log-total">{totalLoggedHours} {t('hrs total')}</span>
          </div>
          <ul className="time-entries-list">
            {projectTimeEntries.map((entry, i) => (
              <li key={`${entry.taskId}-${i}`} className="time-entry">
                <div className="entry-meta">
                  <span className="entry-task-title">{entry.taskTitle}</span>
                  <span className="entry-date">
                    {entry.date ? new Date(entry.date).toLocaleDateString() : '—'}
                  </span>
                </div>
                <div className="entry-footer">
                  <span className="entry-hours">{entry.hours}h</span>
                  {entry.notes && <span className="entry-notes">{entry.notes}</span>}
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
};
