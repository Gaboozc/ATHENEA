import { useDispatch, useSelector } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useState } from 'react';
import { useTasks } from '../context/TasksContext';
import { addProject, deleteProject, updateProject } from '../store/slices/projectsSlice';
import { useLanguage } from '../context/LanguageContext';
import './Projects.css';

export const Projects = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();
  const { projects } = useSelector((state) => state.projects);
  const { tasks } = useTasks();
  const { t } = useLanguage();
  const [showCancelled, setShowCancelled] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    status: 'planning',
    clientName: '',
    siteAddress: '',
    startDate: '',
    endDate: '',
    maintenancePlan: '',
    isSubscription: false
  });
  const [errors, setErrors] = useState({});

  const canCreateProject = true; // Single-user mode: siempre permitido

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const openCreate = params.get('create') === '1';
    if (!openCreate) return;
    if (!canCreateProject) return;
    setShowCreateModal(true);
  }, [location.search, canCreateProject]);

  const visibleTasks = tasks; // Single-user mode: todas las tareas visibles

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#1ec9ff';
      case 'maintenance':
        return '#1ec9ff';
      case 'in-progress':
        return '#d4af37';
      case 'cancelled':
        return '#ef4444';
      case 'planning':
        return '#9aa3ad';
      default:
        return '#9aa3ad';
    }
  };

  const getStatusLabel = (status) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
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

  const handleCancelProject = (event, projectId) => {
    event.stopPropagation();
    dispatch(updateProject({
      id: projectId,
      status: 'cancelled',
      cancelledAt: new Date().toISOString()
    }));
  };

  const handleRestoreProject = (event, projectId) => {
    event.stopPropagation();
    dispatch(updateProject({
      id: projectId,
      status: 'planning',
      cancelledAt: ''
    }));
  };

  const handleDeleteProject = (event, projectId) => {
    event.stopPropagation();
    dispatch(deleteProject(projectId));
  };

  const openCreateModal = () => {
    setErrors({});
    setFormData({
      name: '',
      description: '',
      status: 'planning',
      clientName: '',
      siteAddress: '',
      startDate: '',
      endDate: '',
      maintenancePlan: '',
      isSubscription: false
    });
    setShowCreateModal(true);
  };

  const handleFormChange = (event) => {
    const { name, value, type, checked } = event.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validateForm = () => {
    const nextErrors = {};
    if (!formData.name.trim()) nextErrors.name = t('Project name is required');
    if (!formData.clientName.trim()) nextErrors.clientName = t('Client name is required');
    if (!formData.siteAddress.trim()) nextErrors.siteAddress = t('Site address is required');
    if (!formData.startDate) nextErrors.startDate = t('Start date is required');
    return nextErrors;
  };

  const handleCreateSubmit = (event) => {
    event.preventDefault();
    const nextErrors = validateForm();
    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    const payload = {
      name: formData.name,
      description: formData.description,
      status: formData.status,
      clientName: formData.clientName,
      siteAddress: formData.siteAddress,
      startDate: formData.startDate,
      endDate: formData.endDate,
      maintenancePlan: formData.isSubscription ? formData.maintenancePlan : ''
    };

    dispatch(addProject(payload));
    setShowCreateModal(false);
  };

  const activeProjects = projects.filter((project) => project.status !== 'cancelled');
  const cancelledProjects = projects.filter((project) => project.status === 'cancelled');

  return (
    <div className="projects-container">
      <div className="projects-header">
        <div>
          <h1>{t('Projects')}</h1>
          <p>{t('Operational programs aligned to ATHENEA build objectives.')}</p>
        </div>
        <button
          type="button"
          className="navbar-task-button project-create-button"
          onClick={openCreateModal}
          disabled={!canCreateProject}
        >
          <span className="task-button-text">{t('New Project')}</span>
          <span className="task-button-icon" aria-hidden="true">
            <svg
              className="task-button-svg"
              viewBox="0 0 24 24"
              strokeWidth={2}
              strokeLinejoin="round"
              strokeLinecap="round"
              stroke="currentColor"
              fill="none"
            >
              <line y2={19} y1={5} x2={12} x1={12} />
              <line y2={12} y1={12} x2={19} x1={5} />
            </svg>
          </span>
        </button>
      </div>
      <div className="projects-grid">
        {activeProjects.map((project) => {
          const projectTasks = visibleTasks
            .filter((task) => task.projectId === project.id)
            .map((task) => ({
              title: task.title,
              level: task.level || 'Backlog',
              status: task.status || 'Active'
            }));
          const legacyTasks = (project.tasks || []).map((task) => ({
            title: task,
            level: 'Backlog',
            status: 'Queued'
          }));
          const mergedTasks = [...legacyTasks, ...projectTasks].filter(
            (task, index, self) =>
              index === self.findIndex((entry) => entry.title === task.title)
          );
          const completedTasksCount = mergedTasks.filter(
            (task) => task.status === 'Completed'
          ).length;
          const totalTasksCount = mergedTasks.length;
          const completionPercentage = totalTasksCount
            ? Math.round((completedTasksCount / totalTasksCount) * 100)
            : 0;

          return (
            <div 
              key={project.id} 
              className="project-card"
              onClick={() => navigate(`/projects/${project.id}`)}
            >
            <div className="project-card-header">
              <h3>{project.name}</h3>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(project.status) }}
              >
                {getStatusLabel(project.status)}
              </span>
            </div>

            <p className="project-description">{project.description}</p>

            {mergedTasks.length > 0 && (
              <div className="project-tasks">
                <div className="project-tasks-title">{t('Task List')}</div>
                <ul>
                  {mergedTasks.map((task) => (
                    <li key={task.title}>
                      <span className="task-title">{task.title}</span>
                      <span
                        className="task-priority"
                        style={{
                          borderColor: getPriorityColor(task.level),
                          color: getPriorityColor(task.level)
                        }}
                      >
                        {task.level}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="project-info">
              <div className="info-item">
                <span className="info-label">{t('Client:')}</span>
                <span className="info-value">{project.clientName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">{t('Location:')}</span>
                <span className="info-value">{project.siteAddress}</span>
              </div>
              <div className="info-item">
                <span className="info-label">{t('Start Date:')}</span>
                <span className="info-value">
                  {new Date(project.startDate).toLocaleDateString()}
                </span>
              </div>
              {(project.endDate || project.maintenancePlan) && (
                <div className="info-item">
                  <span className="info-label">
                    {project.endDate ? t('Completion Date:') : t('Maintenance:')}
                  </span>
                  <span className="info-value">
                    {project.endDate
                      ? new Date(project.endDate).toLocaleDateString()
                      : project.maintenancePlan}
                  </span>
                </div>
              )}
            </div>

            <div className="progress-section">
              <div className="progress-header">
                <span>{t('Progress')}</span>
                <span className="progress-percentage">
                  {completionPercentage}%
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${completionPercentage}%` }}
                />
              </div>
              <div className="points-info">
                {t('Task progress:')} {completedTasksCount} / {totalTasksCount} {t('completed')}
              </div>
            </div>
            <div className="project-card-actions">
              <button
                type="button"
                className="project-action project-cancel"
                onClick={(event) => handleCancelProject(event, project.id)}
              >
                {t('Cancel')}
              </button>
            </div>
            </div>
          );
        })}
      </div>

      <div className="projects-cancelled">
        <div className="projects-cancelled-header">
          <div>
            <h2>{t('Cancelled Projects')}</h2>
            <p>{cancelledProjects.length} {t('total')}</p>
          </div>
          <button
            type="button"
            className="tactical-button"
            onClick={() => setShowCancelled((prev) => !prev)}
          >
            {showCancelled ? t('Hide Cancelled') : t('Show Cancelled')}
          </button>
        </div>
        {showCancelled && (
          <div className="projects-grid">
            {cancelledProjects.length === 0 ? (
              <div className="empty-state">{t('No cancelled projects.')}</div>
            ) : (
              cancelledProjects.map((project) => (
                <div
                  key={project.id}
                  className="project-card is-cancelled"
                  onClick={() => navigate(`/projects/${project.id}`)}
                >
                  <div className="project-card-header">
                    <h3>{project.name}</h3>
                    <span
                      className="status-badge"
                      style={{ backgroundColor: getStatusColor(project.status) }}
                    >
                      {getStatusLabel(project.status)}
                    </span>
                  </div>
                  <p className="project-description">{project.description}</p>
                  <div className="project-cancelled-date">
                    {t('Cancelled on')}:{' '}
                    {project.cancelledAt
                      ? new Date(project.cancelledAt).toLocaleDateString()
                      : t('TBD')}
                  </div>
                  <div className="project-card-actions">
                    <button
                      type="button"
                      className="project-action project-restore"
                      onClick={(event) => handleRestoreProject(event, project.id)}
                    >
                      {t('Restore')}
                    </button>
                    <button
                      type="button"
                      className="project-action project-delete"
                      onClick={(event) => handleDeleteProject(event, project.id)}
                    >
                      {t('Delete')}
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {activeProjects.length === 0 && (
        <div className="empty-state">
          <p>{t('No projects yet')}</p>
        </div>
      )}

      {showCreateModal && (
        <div className="project-create-overlay" onClick={() => setShowCreateModal(false)}>
          <div className="project-create-card" onClick={(event) => event.stopPropagation()}>
            <div className="project-create-header">
              <h2>{t('Create New Project')}</h2>
              <button
                type="button"
                className="project-create-close"
                onClick={() => setShowCreateModal(false)}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="project-create-form">
              <label>
                {t('Project Name *')}
                <input
                  name="name"
                  type="text"
                  value={formData.name}
                  onChange={handleFormChange}
                  placeholder={t('e.g., ATHENEA Command Expansion')}
                  className={errors.name ? 'is-error' : ''}
                />
                {errors.name && <span className="form-error">{errors.name}</span>}
              </label>

              <label>
                {t('Description')}
                <textarea
                  name="description"
                  value={formData.description}
                  onChange={handleFormChange}
                  placeholder={t('Brief description of the project')}
                  rows="4"
                />
              </label>

              <div className="project-create-row">
                <label>
                  {t('Status')}
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleFormChange}
                  >
                    <option value="planning">{t('Planning')}</option>
                    <option value="in-progress">{t('In Progress')}</option>
                    <option value="maintenance">{t('Maintenance')}</option>
                    <option value="completed">{t('Completed')}</option>
                  </select>
                </label>
                <label>
                  {t('Client Name *')}
                  <input
                    name="clientName"
                    type="text"
                    value={formData.clientName}
                    onChange={handleFormChange}
                    placeholder={t('e.g., ABC Corporation')}
                    className={errors.clientName ? 'is-error' : ''}
                  />
                  {errors.clientName && <span className="form-error">{errors.clientName}</span>}
                </label>
              </div>

              <div className="project-create-row">
                <label>
                  {t('Site Address *')}
                  <input
                    name="siteAddress"
                    type="text"
                    value={formData.siteAddress}
                    onChange={handleFormChange}
                    placeholder={t('e.g., 123 Main Street, New York, NY 10001')}
                    className={errors.siteAddress ? 'is-error' : ''}
                  />
                  {errors.siteAddress && <span className="form-error">{errors.siteAddress}</span>}
                </label>
                <label>
                  {t('Start Date *')}
                  <input
                    name="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={handleFormChange}
                    className={errors.startDate ? 'is-error' : ''}
                  />
                  {errors.startDate && <span className="form-error">{errors.startDate}</span>}
                </label>
              </div>

              <div className="project-create-row">
                <label>
                  {t('Completion Date')}
                  <input
                    name="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={handleFormChange}
                  />
                </label>
                <label className="settings-toggle">
                  <span>{t('Subscription')}</span>
                  <input
                    name="isSubscription"
                    type="checkbox"
                    checked={formData.isSubscription}
                    onChange={handleFormChange}
                  />
                </label>
              </div>

              {formData.isSubscription && (
                <label>
                  {t('Plan Notes')}
                  <input
                    name="maintenancePlan"
                    type="text"
                    value={formData.maintenancePlan}
                    onChange={handleFormChange}
                    placeholder={t('Monthly maintenance')}
                  />
                </label>
              )}

              <div className="project-create-actions">
                <button
                  type="button"
                  className="tactical-button is-muted"
                  onClick={() => setShowCreateModal(false)}
                >
                  {t('Cancel')}
                </button>
                <button type="submit" className="project-create-submit">
                  {t('Create Project')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
