import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useTasks } from '../context/TasksContext';
import { useLanguage } from '../context/LanguageContext';
import './Fleet.css';

const getTaskTeams = (task) => {
  if (Array.isArray(task.targetTeams) && task.targetTeams.length > 0) {
    return task.targetTeams;
  }
  if (Array.isArray(task.workstreams)) {
    return task.workstreams.filter((entry) =>
      entry === 'dev' || entry === 'design' || entry === 'cs' || entry === 'management'
    );
  }
  return [];
};

export const Fleet = () => {
  const { tasks, updateTaskAssignment } = useTasks();
  const { t } = useLanguage();
  const { users } = useSelector((state) => state.users);
  const { workstreams, currentOrgId, teamMemberships } = useSelector(
    (state) => state.organizations
  );
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [assignments, setAssignments] = useState({});

  const teams = useMemo(() => {
    if (!currentOrgId) return [];
    return workstreams
      .filter((stream) => stream.orgId === currentOrgId && stream.enabled)
      .map((stream) => ({
        id: stream.id,
        label: stream.label,
        permissions: stream.permissions
      }));
  }, [currentOrgId, workstreams]);

  const activeTeamId = selectedTeamId || teams[0]?.id || '';

  const teamMembers = useMemo(() => {
    if (!activeTeamId || !currentOrgId) return [];
    const activeUsers = users.filter((user) => user.active);
    const memberIds = teamMemberships
      .filter((entry) => entry.orgId === currentOrgId && entry.teamId === activeTeamId)
      .map((entry) => entry.userId);
    return activeUsers.filter((user) => memberIds.includes(user.id));
  }, [activeTeamId, currentOrgId, teamMemberships, users]);

  const teamCards = useMemo(() => {
    return teams.map((team) => {
      const backlog = tasks.filter((task) => {
        const taskTeams = getTaskTeams(task);
        if (team.id === 'management') return true;
        return taskTeams.includes(team.id);
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
      const taskTeams = getTaskTeams(task);
      if (activeTeamId === 'management') return true;
      return taskTeams.includes(activeTeamId);
    });
  }, [activeTeamId, tasks]);

  const handleAssign = (taskId) => {
    const assigneeId = assignments[taskId];
    if (!assigneeId || !activeTeamId) return;
    updateTaskAssignment(taskId, assigneeId, activeTeamId);
  };

  return (
    <div className="fleet-container">
      <header className="fleet-header">
        <h1>{t('Fleet')}</h1>
        <p>{t('Dispatch active operators and balance workload distribution.')}</p>
      </header>

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
    </div>
  );
};
