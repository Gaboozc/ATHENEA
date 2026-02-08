import "./Dashboard.css";
import { useMemo } from 'react';
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
  const { projects } = useSelector((state) => state.projects);
  const { currentOrgId, teamMemberships } = useSelector((state) => state.organizations);
  const { tasks } = useTasks();
  const { t } = useLanguage();
  const { user, role } = useCurrentUser();

  const isAdmin = role === 'Admin' || role === 'admin' || role === 'super-admin';

  const teamIds = useMemo(() => {
    if (!user?.id || !currentOrgId) return [];
    return teamMemberships
      .filter((entry) => entry.orgId === currentOrgId && entry.userId === user.id)
      .map((entry) => entry.teamId);
  }, [currentOrgId, teamMemberships, user?.id]);

  const visibleTasks = useMemo(() => {
    if (isAdmin) return tasks;
    return tasks.filter((task) => {
      if (task.assigneeId && task.assigneeId === user?.id) return true;
      const teamMatch = teamIds.length > 0 && (
        (Array.isArray(task.targetTeams) && task.targetTeams.some((id) => teamIds.includes(id))) ||
        (Array.isArray(task.workstreams) && task.workstreams.some((id) => teamIds.includes(id)))
      );
      return teamMatch;
    });
  }, [isAdmin, tasks, teamIds, user?.id]);

  const externalTasks = visibleTasks.filter(
    (task) => task.metadata?.source === 'field_report'
  );

  const tasksByLevel = PRIORITY_BUCKETS.reduce((acc, level) => {
    acc[level] = visibleTasks.filter((task) => task.level === level);
    return acc;
  }, {});

  const orgProjects = projects.filter(
    (project) => project.status !== 'cancelled' && project.orgId === currentOrgId
  );
  const visibleProjectIds = new Set(visibleTasks.map((task) => task.projectId));
  const activeProjects = isAdmin
    ? orgProjects
    : orgProjects.filter((project) => visibleProjectIds.has(project.id));

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div>
          <h1>ATHENEA Priority Buckets</h1>
          <p>{t('Operational tasks organized by priority level.')}</p>
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

      <section className="active-projects">
        <div className="active-projects-header">
          <h2>{t('Active Projects')}</h2>
          <span>{activeProjects.length}</span>
        </div>
        {activeProjects.length === 0 ? (
          <div className="active-projects-empty">{t('No active projects.')}</div>
        ) : (
          <ul className="active-projects-list">
            {activeProjects.map((project) => (
              <li key={project.id} className="active-project-card">
                <div>
                  <span className="active-project-title">{project.name}</span>
                  <span className="active-project-client">{project.clientName}</span>
                </div>
                <div className="active-project-meta">
                  <span className="active-project-status">{project.status}</span>
                  <span className="active-project-date">
                    {project.endDate
                      ? new Date(project.endDate).toLocaleDateString()
                      : 'TBD'}
                  </span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};
