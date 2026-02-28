import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTasks } from '../context/TasksContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import './WorkstreamDetail.css';

export const WorkstreamDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { user, role } = useCurrentUser();
  const { tasks, resolveTask } = useTasks();
  const { projects } = useSelector((state) => state.projects);
  const { workstreams, currentOrgId } = useSelector((state) => state.organizations);
  const { users } = useSelector((state) => state.users);

  const workstream = workstreams.find(
    (stream) => stream.orgId === currentOrgId && stream.id === id
  );
  const roleKey = String(role || '').toLowerCase();
  const isAdmin = roleKey === 'admin' || roleKey === 'super-admin' || roleKey === 'manager';
  const isLead = Boolean(workstream?.leadId) && workstream?.leadId === user?.id;
  const canAccess = isAdmin || isLead;

  const lead = users.find((entry) => entry.id === workstream?.leadId);
  const leadInitials = useMemo(() => {
    const name = lead?.name || '';
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'NA';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }, [lead]);

  const workstreamProjects = useMemo(() => {
    if (!currentOrgId || !workstream) return [];
    return projects.filter(
      (project) => project.orgId === currentOrgId && project.workstreamId === workstream.id
    );
  }, [currentOrgId, projects, workstream]);

  const activeProjects = workstreamProjects.filter(
    (project) => project.status !== 'completed' && project.status !== 'cancelled'
  );
  const completedProjects = workstreamProjects.filter(
    (project) => project.status === 'completed'
  );
  const pendingAudits = tasks.filter((task) => {
    const isAlert = task.status === 'failed' || task.status === 'issue_reported';
    return (
      isAlert &&
      Array.isArray(task.workstreams) &&
      task.workstreams.includes(id)
    );
  });
  const statusLabel = pendingAudits.length > 0
    ? t('Attention Required')
    : t('Operational');
  const [pendingResolveTask, setPendingResolveTask] = useState(null);
  const [resolutionNote, setResolutionNote] = useState('');

  if (!workstream) {
    return (
      <div className="workstream-detail-container">
        <div className="workstream-detail-empty">
          <h2>{t('Workstream not found')}</h2>
          <button type="button" className="tactical-button" onClick={() => navigate('/dashboard')}>
            {t('Back')}
          </button>
        </div>
      </div>
    );
  }

  if (!canAccess) {
    return (
      <div className="workstream-detail-container">
        <div className="workstream-detail-empty">
          <h2>{t('Access Restricted')}</h2>
          <p>{t('This area is reserved for your role.')}</p>
          <button type="button" className="tactical-button" onClick={() => navigate('/dashboard')}>
            {t('Back')}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="workstream-detail-container">
      <header className="workstream-detail-header">
        <div>
          <span className="workstream-detail-kicker">{t('Command Center')}</span>
          <h1>{workstream.label}</h1>
          <div className="workstream-detail-lead">
            <span className="workstream-detail-avatar">{leadInitials}</span>
            <div>
              <div className="workstream-detail-lead-label">{t('Assigned Lead')}</div>
              <div className="workstream-detail-lead-name">
                {lead?.name || t('No lead assigned')}
              </div>
            </div>
          </div>
        </div>
        <div className={`workstream-detail-status${pendingAudits.length > 0 ? ' is-alert' : ''}`}>
          <span>{t('Status')}</span>
          <strong>{statusLabel}</strong>
        </div>
      </header>

      <section className="workstream-detail-grid">
        <div className="workstream-detail-panel">
          <div className="panel-header">
            <h2>{t('Projects')}</h2>
            <div className="panel-meta">
              {activeProjects.length > 0 || completedProjects.length > 0
                ? `${activeProjects.length} ${t('Active Projects Short')} / ${completedProjects.length} ${t('Completed Short')}`
                : t('No active projects.')}
            </div>
          </div>
          {workstreamProjects.length === 0 ? (
            <div className="panel-empty">{t('No projects yet')}</div>
          ) : (
            <div className="project-grid">
              {workstreamProjects.map((project) => (
                <div key={project.id} className="project-card-compact">
                  <div className="project-card-title">{project.name}</div>
                  <div className="project-card-meta">
                    <span>{project.clientName}</span>
                    <span className="project-card-status">{project.status}</span>
                  </div>
                  <div className="project-card-desc">{project.description}</div>
                </div>
              ))}
            </div>
          )}
        </div>

        <aside className="workstream-detail-side">
          <div className="workstream-detail-panel stats-panel">
            <h3>{t('Quick Stats')}</h3>
            <div className="stats-row">
              <span>{t('Active Projects')}</span>
              <strong>{activeProjects.length}</strong>
            </div>
            <div className="stats-row">
              <span>{t('Completed Short')}</span>
              <strong>{completedProjects.length}</strong>
            </div>
            <div className="stats-row">
              <span>{t('Pending Audits')}</span>
              <strong>{pendingAudits.length}</strong>
            </div>
          </div>

          <div className="workstream-detail-panel action-panel">
            <h3>{t('Management')}</h3>
            <button
              type="button"
              className="primary-button"
              onClick={() => navigate(`/projects?workstream=${workstream.id}&create=1`)}
            >
              {t('Add Project')}
            </button>
            <p>{t('Workstream locked to project.')}</p>
          </div>
        </aside>
      </section>

      <section className="workstream-detail-panel audit-panel">
        <div className="panel-header">
          <h2>{t('Audit Alerts')}</h2>
          <div className="panel-meta">{pendingAudits.length}</div>
        </div>
        {pendingAudits.length === 0 ? (
          <div className="panel-empty">{t('No pending audits.')}</div>
        ) : (
          <ul className="audit-list">
            {pendingAudits.map((task) => {
              const worker = users.find((entry) => entry.id === task.assigneeId);
              const failedQuestion =
                task.metadata?.failedQuestion ||
                (Array.isArray(task.metadata?.questions)
                  ? task.metadata.questions[0]
                  : t('No audit details'));
              return (
                <li key={task.id} className="audit-card">
                  <div>
                    <div className="audit-title">{task.projectName || t('Project')}</div>
                    <div className="audit-meta">
                      <span>{t('Worker')}: {worker?.name || t('Unassigned')}</span>
                      <span>{failedQuestion}</span>
                    </div>
                  </div>
                  <div className="audit-actions">
                    <button
                      type="button"
                      className="audit-resolve"
                      onClick={() => {
                        setPendingResolveTask(task);
                        setResolutionNote('');
                      }}
                    >
                      {t('Resolve')}
                    </button>
                    <button
                      type="button"
                      className="audit-detail"
                      onClick={() => navigate(`/audits/${task.id}`)}
                    >
                      {t('View Details')}
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {pendingResolveTask && (
        <div className="resolve-modal-overlay" role="dialog" aria-modal="true">
          <div className="resolve-modal">
            <h3>{t('Resolution Note')}</h3>
            <p>{t('Describe how the issue was resolved.')}</p>
            <textarea
              value={resolutionNote}
              onChange={(event) => setResolutionNote(event.target.value)}
              rows={4}
              placeholder={t('Enter resolution note')}
            />
            <div className="resolve-modal-actions">
              <button
                type="button"
                className="audit-detail"
                onClick={() => setPendingResolveTask(null)}
              >
                {t('Cancel')}
              </button>
              <button
                type="button"
                className="audit-resolve"
                onClick={() => {
                  resolveTask(
                    pendingResolveTask.id,
                    user?.name || 'lead',
                    resolutionNote.trim()
                  );
                  setPendingResolveTask(null);
                }}
                disabled={!resolutionNote.trim()}
              >
                {t('Resolve')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
