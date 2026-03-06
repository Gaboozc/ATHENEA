import { useNavigate, useParams } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import { useState } from 'react';
import { useTasks } from '../context/TasksContext';
import { updateProject } from '../../store/slices/projectsSlice';
import { useLanguage } from '../context/LanguageContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import './ProjectDetails.css';

const PRIORITY_LEVELS = [
  'Critical',
  'High Velocity',
  'Steady Flow',
  'Low Friction',
  'Backlog'
];

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
  const [formState, setFormState] = useState(() => ({
    status: project?.status || 'planning',
    clientName: project?.clientName || '',
    siteAddress: project?.siteAddress || '',
    startDate: project?.startDate || '',
    endDate: project?.endDate || '',
    maintenancePlan: project?.maintenancePlan || '',
    isSubscription: Boolean(project?.maintenancePlan)
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
      isLegacy: false
    }));
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
  const completedTasksCount = activeTasks.filter(
    (task) => task.status === 'Completed'
  ).length;
  const totalTasksCount = activeTasks.length;
  const remainingTasksCount = Math.max(totalTasksCount - completedTasksCount, 0);
  const completionPercentage = totalTasksCount
    ? Math.round((completedTasksCount / totalTasksCount) * 100)
    : 0;

  const markLegacyComplete = (title) => {
    if (isCancelled) return;
    addTask({
      id: `legacy-${Date.now()}`,
      projectId: project.id,
      projectName: project.name,
      status: 'Completed',
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
      status: 'In Progress',
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
    dispatch(updateProject({
      id: project.id,
      status: formState.status,
      clientName: formState.clientName,
      siteAddress: formState.siteAddress,
      startDate: formState.startDate,
      endDate: formState.endDate,
      maintenancePlan: formState.isSubscription ? formState.maintenancePlan : ''
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

      <section className="project-card tasks-panel">
        <div className="tasks-header">
          <div>
            <h2>{t('Strategic Task List')}</h2>
            <p>{t('Aligned to ATHENEA priority doctrine.')}</p>
          </div>
          <input
            type="text"
            placeholder={t('Search tasks')}
            value={search}
            onChange={(event) => setSearch(event.target.value)}
          />
        </div>
        {isCancelled && (
          <div className="tasks-warning">
            {t('Cancelled projects cannot receive new tasks.')}
          </div>
        )}
        {filteredTasks.length === 0 ? (
          <div className="tasks-empty">{t('No tasks found for this project.')}</div>
        ) : (
          <ul className="tasks-list">
            {filteredTasks.map((task) => (
              <li key={task.id} className="task-row">
                <div className="task-main">
                  <span className="task-title">{task.title}</span>
                  <span className="task-status">{task.status}</span>
                  {!task.isLegacy && (
                    <div className="task-actions">
                      <button
                        type="button"
                        className="task-action task-complete"
                        onClick={() => updateTaskStatus(task.id, 'Completed')}
                      >
                        {t('Complete')}
                      </button>
                      <button
                        type="button"
                        className="task-action task-progress"
                        onClick={() => updateTaskStatus(task.id, 'In Progress')}
                      >
                        {t('In Progress')}
                      </button>
                      <button
                        type="button"
                        className="task-action task-delete"
                        onClick={() => handleDeleteTask(task)}
                      >
                        {t('Delete')}
                      </button>
                    </div>
                  )}
                  {task.isLegacy && (
                    <div className="task-actions">
                      <button
                        type="button"
                        className="task-action task-complete"
                        onClick={() => markLegacyComplete(task.title)}
                        disabled={isCancelled}
                      >
                        {t('Complete')}
                      </button>
                      <button
                        type="button"
                        className="task-action task-progress"
                        onClick={() => markLegacyInProgress(task.title)}
                        disabled={isCancelled}
                      >
                        {t('In Progress')}
                      </button>
                      <button
                        type="button"
                        className="task-action task-delete"
                        onClick={() => handleDeleteTask(task)}
                      >
                        {t('Delete')}
                      </button>
                    </div>
                  )}
                </div>
                <div className="task-metadata">
                  {task.totalScore !== null && (
                    <span className="task-score">PS: {task.totalScore}/14</span>
                  )}
                  <span
                    className="task-priority"
                    style={{
                      borderColor: getPriorityColor(task.level),
                      color: getPriorityColor(task.level)
                    }}
                  >
                    {task.level}
                  </span>
                </div>
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
    </div>
  );
};
