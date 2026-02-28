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
  const { notes } = useSelector((state) => state.notes);
  const { todos } = useSelector((state) => state.todos);
  const { payments } = useSelector((state) => state.payments);
  const { tasks } = useTasks();
  const { t } = useLanguage();
  const { user, role } = useCurrentUser();
  const isAdmin = (role || '').toLowerCase() === 'admin' || (role || '').toLowerCase() === 'super-admin';

  // Single-user mode: todas las tareas son visibles
  const visibleTasks = tasks || [];

  const externalTasks = visibleTasks.filter(
    (task) => task.metadata?.source === 'field_report'
  );

  const tasksByLevel = PRIORITY_BUCKETS.reduce((acc, level) => {
    acc[level] = visibleTasks.filter((task) => task.level === level);
    return acc;
  }, {});

  const activeProjects = (projects || []).filter((project) => project.status !== 'cancelled');
  
  const orgWorkstreams = (workstreams || []).filter((stream) => stream.enabled);

  const recentNotes = useMemo(() => {
    return [...notes]
      .sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
      .slice(0, 5);
  }, [notes]);

  const reminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const buildReminder = (item, type, dateField, route) => {
      const rawDate = item[dateField];
      if (!rawDate) return null;
      const dueDate = new Date(rawDate);
      if (Number.isNaN(dueDate.getTime())) return null;
      dueDate.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((dueDate - today) / 86400000);
      return {
        id: item.id,
        title: item.title || item.name || t('Untitled'),
        type,
        dueDate,
        diffDays,
        route,
      };
    };

    const upcomingNotes = notes
      .map((note) => buildReminder(note, 'note', 'reminderDate', '/notes'))
      .filter(Boolean);

    const upcomingTodos = todos
      .map((todo) => buildReminder(todo, 'todo', 'dueDate', '/todos'))
      .filter(Boolean);

    const upcomingPayments = payments
      .map((payment) => buildReminder(payment, 'payment', 'nextDueDate', '/payments'))
      .filter(Boolean);

    return [...upcomingNotes, ...upcomingTodos, ...upcomingPayments]
      .filter((reminder) => reminder.diffDays <= 7)
      .sort((a, b) => a.diffDays - b.diffDays)
      .slice(0, 8);
  }, [notes, todos, payments, t]);

  const getReminderLabel = (diffDays) => {
    if (diffDays < 0) return t('Overdue');
    if (diffDays === 0) return t('Due today');
    return `+${diffDays}d`;
  };
  
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

      <section className="notes-recent">
        <div className="notes-recent-header">
          <h2>{t('Recent Notes')}</h2>
          <button
            type="button"
            className="notes-recent-link"
            onClick={() => navigate('/notes')}
          >
            {t('View all notes')}
          </button>
        </div>
        {recentNotes.length === 0 ? (
          <div className="notes-recent-empty">{t('No notes yet.')}</div>
        ) : (
          <ul className="notes-recent-list">
            {recentNotes.map((note) => (
              <li key={note.id} className="notes-recent-card">
                <div className="notes-recent-title">
                  <span>{note.title}</span>
                  {note.reminderDate && (
                    <span className="notes-recent-date">
                      {new Date(note.reminderDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
                <p className="notes-recent-preview">
                  {note.content.length > 140
                    ? `${note.content.slice(0, 140)}...`
                    : note.content}
                </p>
                <button
                  type="button"
                  className="notes-recent-more"
                  onClick={() => navigate('/notes')}
                >
                  {t('View more')}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="reminders">
        <div className="reminders-header">
          <h2>{t('Reminders')}</h2>
          <span>{reminders.length}</span>
        </div>
        {reminders.length === 0 ? (
          <div className="reminders-empty">{t('No upcoming reminders.')}</div>
        ) : (
          <ul className="reminders-list">
            {reminders.map((reminder) => (
              <li key={reminder.id} className={`reminder-card reminder-${reminder.type}`}>
                <div>
                  <span className="reminder-title">{reminder.title}</span>
                  <span className="reminder-date">
                    {reminder.dueDate.toLocaleDateString()}
                  </span>
                </div>
                <div className="reminder-meta">
                  <span className="reminder-badge">{getReminderLabel(reminder.diffDays)}</span>
                  <button
                    type="button"
                    className="reminder-link"
                    onClick={() => navigate(reminder.route)}
                  >
                    {t('View')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>

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
                  {stream.activeCount > 0 || stream.completedCount > 0
                    ? `${stream.activeCount} ${t('Active Projects Short')} / ${stream.completedCount} ${t('Completed Short')}`
                    : t('No active projects.')}
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
                    {stream.activeCount > 0 || stream.completedCount > 0
                      ? `${stream.activeCount} ${t('Active Projects Short')} / ${stream.completedCount} ${t('Completed Short')}`
                      : t('No projects yet')}
                  </span>
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
                      --
                    </span>
                    <span>
                      {t('No lead assigned')}
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
