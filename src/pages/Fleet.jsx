import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTasks } from '../context/TasksContext';
import { useLanguage } from '../context/LanguageContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import './Fleet.css';

const getTaskTeams = (task, teamIds) => {
  if (Array.isArray(task.targetTeams) && task.targetTeams.length > 0) {
    return task.targetTeams;
  }
  if (Array.isArray(task.workstreams)) {
    return task.workstreams.filter((entry) => teamIds.includes(entry));
  }
  return [];
};

export const Fleet = () => {
  const { tasks, updateTaskAssignment, updateTaskStatus } = useTasks();
  const { t } = useLanguage();
  const { users } = useSelector((state) => state.users);
  const { workstreams } = useSelector((state) => state.organizations);
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [assignments, setAssignments] = useState({});
  const [teamRoutes, setTeamRoutes] = useState({});

  const canDispatch = true; // Single-user mode: siempre permitido

  const teams = useMemo(() => {
    return workstreams
      .filter((stream) => stream.enabled)
      .map((stream) => ({
        id: stream.id,
        label: stream.label,
      }));
  }, [workstreams]);

  const teamIds = useMemo(() => teams.map((team) => team.id), [teams]);

  const activeTeamId = selectedTeamId || teams[0]?.id || '';

  const teamMembers = useMemo(() => {
    return users.filter((user) => user.active);
  }, [users]);

  const teamCards = useMemo(() => {
    return teams.map((team) => {
      const backlog = tasks.filter((task) => {
        const taskTeams = getTaskTeams(task, teamIds);
        return taskTeams.includes(team.id) && task.status !== 'pending_approval';
      });
      const assigned = backlog.filter((task) => task.assigneeId).length;
      return {
        ...team,
        backlogCount: backlog.length,
        assignedCount: assigned
      };
    });
  }, [teams, tasks]);

  const teamBacklog = useMemo(() => {
    if (!activeTeamId) return [];
    return tasks.filter((task) => {
      const taskTeams = getTaskTeams(task, teamIds);
      return taskTeams.includes(activeTeamId) && task.status !== 'pending_approval';
    });
  }, [activeTeamId, tasks, teamIds]);

  const pendingQueue = useMemo(() => {
    if (!activeTeamId) return [];
    return tasks.filter((task) => {
      if (task.status !== 'pending_approval') return false;
      const taskTeams = getTaskTeams(task, teamIds);
      return taskTeams.includes(activeTeamId);
    });
  }, [activeTeamId, tasks, teamIds]);

  const handleAssign = (taskId) => {
    const assigneeId = assignments[taskId];
    if (!assigneeId || !activeTeamId) return;
    updateTaskAssignment(taskId, assigneeId, activeTeamId);
  };

  const handleRouteTeam = (taskId) => {
    const teamId = teamRoutes[taskId];
    if (!teamId) return;
    updateTaskAssignment(taskId, null, teamId);
  };

  const handleApproveAndAssign = (taskId) => {
    const assigneeId = assignments[taskId];
    if (!assigneeId || !activeTeamId) return;
    updateTaskStatus(taskId, 'Active');
    updateTaskAssignment(taskId, assigneeId, activeTeamId);
  };

  return (
    <div className="fleet-container">
      <header className="fleet-header">
        <h1>{t('Fleet')}</h1>
        <p>{t('Dispatch active operators and balance workload distribution.')}</p>
      </header>
      {teams.length === 0 ? (
        <div className="fleet-empty">{t('No workstreams configured yet.')}</div>
      ) : (
        <section className="fleet-layout">
          <div className="fleet-roster">
            <div className="fleet-section-header">
              <h2>{t('Team View')}</h2>
              <span>{t('Load heatmap')}</span>
            </div>
            <div className="fleet-grid">
              {teamCards.map((team) => (
                <button
                  key={team.id}
                  type="button"
                  onClick={() => setSelectedTeamId(team.id)}
                  className={`fleet-card fleet-team${activeTeamId === team.id ? ' is-selected' : ''}`}
                >
                  <div className="fleet-title">
                    <h2>{team.label}</h2>
                    <span className="fleet-id">{team.id}</span>
                  </div>
                  <div className="fleet-load">
                    <span className="fleet-load-label">{t('Backlog')}</span>
                    <span className="fleet-load-value">{team.backlogCount}</span>
                  </div>
                  <div className="fleet-load fleet-critical">
                    <span className="fleet-load-label">{t('Assigned')}</span>
                    <span className="fleet-load-value">{team.assignedCount}</span>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="fleet-backlog">
            <div className="fleet-section-header">
              <h2>{t('Team Backlog')}</h2>
              <span>{t('Assign to Member')}</span>
            </div>
            {pendingQueue.length > 0 && (
              <div className="fleet-pending">
                <div className="fleet-section-header">
                  <h2>{t('Pending Queue')}</h2>
                  <span>{t('Awaiting approval')}</span>
                </div>
                <div className="fleet-backlog-list">
                  {pendingQueue.map((task) => (
                    <div key={task.id} className="fleet-task-card">
                      <div className="fleet-task-header">
                        <h3>{task.title}</h3>
                        <span className="fleet-source">{t('Pending approval')}</span>
                      </div>
                      <p className="fleet-task-meta">{task.projectName}</p>
                      <div className="fleet-assignments">
                        <select
                          value={assignments[task.id] || ''}
                          onChange={(event) =>
                            setAssignments((prev) => ({
                              ...prev,
                              [task.id]: event.target.value
                            }))
                          }
                        >
                          <option value="">{t('Select member')}</option>
                          {teamMembers.map((member) => (
                            <option key={member.id} value={member.id}>
                              {member.name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          className="fleet-assign-btn"
                          onClick={() => handleApproveAndAssign(task.id)}
                          disabled={!assignments[task.id]}
                        >
                          {t('Approve & Assign')}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
            <div className="fleet-backlog-list">
              {teamBacklog.length === 0 && (
                <div className="fleet-empty-card">{t('No tasks for this team.')}</div>
              )}
              {teamBacklog.map((task) => (
                <div key={task.id} className="fleet-task-card">
                  <div className="fleet-task-header">
                    <h3>{task.title}</h3>
                    <span className={`fleet-priority tag-${task.level?.toLowerCase().replace(/\s+/g, '-')}`}>
                      {task.level}
                    </span>
                  </div>
                  <p className="fleet-task-meta">{task.projectName}</p>
                  {task.metadata?.source === 'field_report' && (
                    <span className="fleet-source">{t('Field Report')}</span>
                  )}
                  {task.assigneeId && (
                    <span className="fleet-source fleet-locked">{t('Locked to member')}</span>
                  )}
                  {canDispatch && (
                    <div className="fleet-route">
                      <select
                        value={teamRoutes[task.id] || ''}
                        onChange={(event) =>
                          setTeamRoutes((prev) => ({
                            ...prev,
                            [task.id]: event.target.value
                          }))
                        }
                      >
                        <option value="">{t('Select team')}</option>
                        {teams.map((team) => (
                          <option key={team.id} value={team.id}>
                            {team.label}
                          </option>
                        ))}
                      </select>
                      <button
                        type="button"
                        className="fleet-assign-btn"
                        onClick={() => handleRouteTeam(task.id)}
                        disabled={!teamRoutes[task.id]}
                      >
                        {t('Route to team')}
                      </button>
                    </div>
                  )}
                  <div className="fleet-assignments">
                    <select
                      value={assignments[task.id] || ''}
                      onChange={(event) =>
                        setAssignments((prev) => ({
                          ...prev,
                          [task.id]: event.target.value
                        }))
                      }
                    >
                      <option value="">{t('Select member')}</option>
                      {teamMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.name}
                        </option>
                      ))}
                    </select>
                    <button
                      type="button"
                      className="fleet-assign-btn"
                      onClick={() => handleAssign(task.id)}
                      disabled={!assignments[task.id]}
                    >
                      {t('Assign to Member')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
};
