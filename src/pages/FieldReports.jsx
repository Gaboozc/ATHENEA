import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTasks } from '../context/TasksContext';
import { useLanguage } from '../context/LanguageContext';
import './FieldReports.css';

const PRIORITY_MAP = {
  Low: { level: 'Low Friction', score: 4 },
  Mid: { level: 'Steady Flow', score: 8 },
  High: { level: 'High Velocity', score: 12 }
};

const DEFAULT_FACTORS = {
  blocking: 0,
  urgency: 0,
  impact: 0,
  omissionCost: 0,
  alignment: 0,
  mentalLoad: 0,
  quickWin: 0
};

export const FieldReports = () => {
  const { addTask } = useTasks();
  const { projects } = useSelector((state) => state.projects);
  const { currentOrgId } = useSelector((state) => state.organizations);
  const { t } = useLanguage();
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Bug');
  const [priority, setPriority] = useState('Mid');
  const [description, setDescription] = useState('');
  const [projectId, setProjectId] = useState('');
  const [status, setStatus] = useState('Open');
  const [success, setSuccess] = useState(false);

  const activeProjects = useMemo(
    () =>
      projects.filter(
        (project) =>
          project.status !== 'cancelled' && project.orgId === currentOrgId
      ),
    [currentOrgId, projects]
  );
  const selectedProject = useMemo(
    () => activeProjects.find((project) => project.id === projectId),
    [activeProjects, projectId]
  );
  const selectedProjectAny = useMemo(
    () => projects.find((project) => project.id === projectId),
    [projects, projectId]
  );
  const isCancelledProject = selectedProjectAny?.status === 'cancelled';
  const canSubmit = title.trim().length > 0 && projectId.length > 0 && !isCancelledProject;

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!canSubmit || !selectedProject || isCancelledProject) return;

    const mapping = PRIORITY_MAP[priority] || PRIORITY_MAP.Mid;

    addTask({
      id: `field-${Date.now()}`,
      projectId: selectedProject.id,
      projectName: selectedProject.name,
      status,
      title: title.trim(),
      description: description.trim(),
      workstreams: ['cs'],
      targetTeams: ['cs'],
      factors: DEFAULT_FACTORS,
      totalScore: mapping.score,
      level: mapping.level,
      metadata: {
        source: 'field_report',
        category,
        priority
      },
      createdAt: new Date().toISOString()
    });

    setTitle('');
    setDescription('');
    setPriority('Mid');
    setCategory('Bug');
    setStatus('Open');
    setSuccess(true);
    setTimeout(() => setSuccess(false), 1200);
  };

  return (
    <div className="field-reports-container">
      <header className="field-reports-header">
        <h1>{t('Field Reports')}</h1>
        <p>{t('Service and sales intake for non-technical requests.')}</p>
      </header>

      <section className="field-reports-card">
        <h2>{t('Support Ticket Intake')}</h2>
        <form onSubmit={handleSubmit} className="field-reports-form">
          <label>
            {t('Ticket Title')}
            <input
              type="text"
              value={title}
              onChange={(event) => setTitle(event.target.value)}
              placeholder={t('Short summary')}
            />
          </label>

          <label>
            {t('Project')}
            <select value={projectId} onChange={(event) => setProjectId(event.target.value)}>
              <option value="">{t('Select project')}</option>
              {activeProjects.map((project) => (
                <option key={project.id} value={project.id}>
                  {project.name}
                </option>
              ))}
            </select>
          </label>

          <div className="field-reports-row">
            <label>
              {t('Category')}
              <select value={category} onChange={(event) => setCategory(event.target.value)}>
                <option value="Bug">{t('Bug')}</option>
                <option value="Feature Request">{t('Feature Request')}</option>
                <option value="Client Update">{t('Client Update')}</option>
              </select>
            </label>

            <label>
              {t('Priority')}
              <select value={priority} onChange={(event) => setPriority(event.target.value)}>
                <option value="Low">{t('Low')}</option>
                <option value="Mid">{t('Mid')}</option>
                <option value="High">{t('High')}</option>
              </select>
            </label>

            <label>
              {t('Status')}
              <select value={status} onChange={(event) => setStatus(event.target.value)}>
                <option value="Open">{t('Open')}</option>
                <option value="In Review">{t('In Review')}</option>
                <option value="Approved">{t('Approved')}</option>
              </select>
            </label>
          </div>

          <label>
            {t('Description')}
            <textarea
              rows={4}
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder={t('Context, requested changes, or client impact')}
            />
          </label>

          <div className="field-reports-actions">
            <button className="field-submit" type="submit" disabled={!canSubmit}>
              {t('Submit Ticket')}
            </button>
            {success && <span className="field-success">{t('Ticket routed to ATHENEA.')}</span>}
            {activeProjects.length === 0 && (
              <span className="field-warning">
                {t('No active projects available. Create a project before logging tasks.')}
              </span>
            )}
            {isCancelledProject && (
              <span className="field-warning">
                {t('Cancelled projects cannot receive new tasks.')}
              </span>
            )}
          </div>
        </form>
      </section>
    </div>
  );
};
