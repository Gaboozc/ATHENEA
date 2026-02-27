import "./Dashboard.css";
import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTasks } from "../context/TasksContext";
import { useLanguage } from '../context/LanguageContext';
import { useCurrentUser } from '../hooks/useCurrentUser';

const PRIORITY_BUCKETS = [
  "Critical",
  "High Velocity",
  "Steady Flow",
  "Low Friction",
  "Backlog"
];

export const Dashboard = () => {
  const navigate = useNavigate();
  const { projects } = useSelector((state) => state.projects);
  const { workstreams } = useSelector((state) => state.organizations);
  const { users } = useSelector((state) => state.users);
  const { tasks } = useTasks();
  const { t } = useLanguage();
  const { user } = useCurrentUser();

  // Single-user mode: todas las tareas son visibles
  const visibleTasks = tasks;

  const externalTasks = visibleTasks.filter(
    (task) => task.metadata?.source === 'field_report'
  );

  const tasksByLevel = PRIORITY_BUCKETS.reduce((acc, level) => {
    acc[level] = visibleTasks.filter((task) => task.level === level);
    return acc;
  }, {});

  const activeProjects = projects.filter((project) => project.status !== 'cancelled');
  
  const orgWorkstreams = workstreams.filter((stream) => stream.enabled);
  
  const leadById = useMemo(() => {
    return users.reduce((acc, entry) => {
      acc[entry.id] = entry;
      return acc;
    }, {});
  }, [users]);
  
  const projectsByWorkstream = orgWorkstreams.map((stream) => {
    const streamProjects = activeProjects.filter(
      (project) => project.workstreamId === stream.id
    );
    const activeCount = streamProjects.filter(
      (project) => project.status !== 'completed'
    ).length;
    const completedCount = streamProjects.filter(
      (project) => project.status === 'completed'
    ).length;
    return {
      ...stream,
      projects: streamProjects,
      activeCount,
      completedCount
    };
  });
  
  // En single-user mode, mostrar todas las áreas
  const leadStreams = projectsByWorkstream;

  const getInitials = (name = '') => {
    const parts = name.trim().split(' ').filter(Boolean);
    if (parts.length === 0) return 'NA';
    if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  };

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>ATHENEA Personal Assistant</h1>
          <p>{t('Your tasks organized by priority level.')}</p>
        </div>
      </header>

      <section className="priority-board">
        <div className="priority-columns">
          {PRIORITY_BUCKETS.map((level) => (
            <div
              key={level}
              className={`priority-column${level === "Critical" ? " priority-column-critical" : ""}`}
            >
              <div className="priority-column-header">
                <span className="priority-level">{level}</span>
                <span className="priority-count">{tasksByLevel[level].length}</span>
              </div>
              {tasksByLevel[level].length === 0 ? (
                <div className="priority-empty">{t('No tasks in this bucket.')}</div>
              ) : (
                <ul className="priority-task-list">
                  {tasksByLevel[level].map((task) => (
                    <li
                      key={task.id}
                      className={`priority-card${
                        task.metadata?.source === 'field_report'
                          ? ' priority-card-external'
                          : ''
                      }`}
                    >
                      <div className="priority-card-header">
                        <span className="priority-card-title">{task.title}</span>
                        <span className="priority-card-score">[PS: {task.totalScore}/14]</span>
                      </div>
                      {task.projectName && (
                        <div className="priority-card-project">{task.projectName}</div>
                      )}
                      {task.description && (
                        <div className="priority-card-desc">{task.description}</div>
                      )}
                      <div className="priority-card-tags">
                        {task.workstreams.map((stream) => (
                          <span key={stream} className="priority-tag">
                            {stream}
                          </span>
                        ))}
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ))}
        </div>
      </section>

      <section className="external-requests">
        <div className="external-header">
          <h2>{t('External Requests')}</h2>
          <span>{externalTasks.length}</span>
        </div>
        {externalTasks.length === 0 ? (
          <div className="external-empty">{t('No field reports logged.')}</div>
        ) : (
          <ul className="external-list">
            {externalTasks.map((task) => (
              <li key={task.id} className="external-card">
                <div>
                  <span className="external-title">{task.title}</span>
                  {task.projectName && (
                    <span className="external-project">{task.projectName}</span>
                  )}
                </div>
                <div className="external-meta">
                  <span className="external-status">{task.status}</span>
                  <span className="external-score">PS: {task.totalScore}/14</span>
                  <span className="external-priority">{task.level}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

      {leadStreams.length > 0 && (
        <section className="lead-center">
          <div className="lead-center-header">
            <h2>{t('Work Areas Overview')}</h2>
            <span>{leadStreams.length}</span>
          </div>
          <div className="lead-center-grid">
            {leadStreams.map((stream) => (
              <div key={stream.id} className="lead-center-card">
                <div className="lead-center-title">{stream.label}</div>
                <div className="lead-center-meta">
                  {stream.activeCount} {t('Active Projects Short')} / {stream.completedCount} {t('Completed Short')}
                </div>
                {stream.projects.length === 0 ? (
                  <div className="lead-center-empty">{t('No projects yet')}</div>
                ) : (
                  <ul className="lead-center-projects">
                    {stream.projects.map((project) => (
                      <li key={project.id}>
                        <span>{project.name}</span>
                        <span className="lead-center-status">{project.status}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="active-projects">
        <div className="active-projects-header">
          <h2>{t('Active Workstreams')}</h2>
          <span>{orgWorkstreams.length}</span>
        </div>
        {projectsByWorkstream.length === 0 ? (
          <div className="active-projects-empty">{t('No workstreams configured yet.')}</div>
        ) : (
          <ul className="active-projects-list">
            {projectsByWorkstream.map((stream) => (
              <li
                key={stream.id}
                className={`active-project-card${
                  stream.leadId && stream.leadId === user?.id ? ' is-lead' : ''
                }${
                  isAdmin || stream.leadId === user?.id ? ' is-clickable' : ''
                }`}
                onClick={() => {
                  if (isAdmin || stream.leadId === user?.id) {
                    navigate(`/workstreams/${stream.id}`);
                  }
                }}
              >
                <div>
                  <span className="active-project-title">{stream.label}</span>
                  <span className="active-project-client">
                    {t('Projects')}: {stream.projects.length}
                  </span>
                  <div className="active-project-summary">
                    {stream.activeCount} {t('Active Projects Short')} / {stream.completedCount} {t('Completed Short')}
                  </div>
                </div>
                <div className="active-project-meta">
                  <span className="active-project-status">
                    {stream.projects.length > 0 ? t('Active') : t('Empty')}
                  </span>
                  <span className="active-project-date">
                    {stream.projects[0]?.endDate
                      ? new Date(stream.projects[0].endDate).toLocaleDateString()
                      : 'TBD'}
                  </span>
                  <div className="active-project-lead">
                    <span className="active-project-avatar">
                      {stream.leadId && leadById[stream.leadId]
                        ? getInitials(leadById[stream.leadId].name)
                        : 'NA'}
                    </span>
                    <span>
                      {stream.leadId && leadById[stream.leadId]
                        ? leadById[stream.leadId].name
                        : t('No lead assigned')}
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
