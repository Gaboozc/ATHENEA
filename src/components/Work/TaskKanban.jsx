import { useMemo } from 'react';
import { TASK_STATE_VALUES, normalizeTaskState, TASK_STATE_COLORS } from '../../constants/taskStates';
import './WorkViews.css';

function buildMaps(tasks) {
  const byId = new Set(tasks.map((task) => task.id));
  const children = new Map();
  tasks.forEach((task) => children.set(task.id, []));

  const roots = [];
  tasks.forEach((task) => {
    if (task.parentTaskId && byId.has(task.parentTaskId)) {
      children.get(task.parentTaskId).push(task);
      return;
    }
    roots.push(task);
  });

  return { roots, children };
}

export default function TaskKanban({
  tasks,
  t = (value) => value,
  onStatusChange,
  onArchiveToggle,
  onDeleteTask,
}) {
  const { roots, children } = useMemo(() => buildMaps(tasks || []), [tasks]);

  return (
    <section className="work-kanban">
      {TASK_STATE_VALUES.map((columnStatus) => {
        const columnTasks = roots.filter((task) => normalizeTaskState(task.status) === columnStatus);
        return (
          <article key={columnStatus} className="work-kanban-col">
            <header className="work-kanban-head" style={{ borderTop: `3px solid ${TASK_STATE_COLORS[columnStatus] || 'var(--border-default)'}` }}>
              <span className="work-kanban-title">{columnStatus}</span>
              <span className="work-kanban-count">{columnTasks.length}</span>
            </header>
            <div className="work-kanban-body">
              {columnTasks.length === 0 && <div className="tasks-empty">—</div>}
              {columnTasks.map((task) => {
                const subTasks = children.get(task.id) || [];
                return (
                  <div key={task.id} className="work-kanban-card">
                    <div className="work-task-title">{task.title}</div>
                    {task.projectName && <span className="work-task-project">{task.projectName}</span>}
                    <div className="work-task-meta">
                      <span className="mytasks-pill mytasks-level-badge">{task.level || 'Backlog'}</span>
                      <span className="date-cell">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-MX') : '—'}</span>
                    </div>
                    <select
                      className={`mytasks-status-select status-${(normalizeTaskState(task.status) || '').toLowerCase().replace(/\s+/g, '-')}`}
                      value={TASK_STATE_VALUES.includes(normalizeTaskState(task.status)) ? normalizeTaskState(task.status) : TASK_STATE_VALUES[0]}
                      onChange={(event) => onStatusChange?.(task.id, event.target.value)}
                    >
                      {TASK_STATE_VALUES.map((value) => (
                        <option key={value} value={value}>{value}</option>
                      ))}
                    </select>
                    <div className="work-table-actions">
                      <button type="button" className="mytasks-subtask-btn" onClick={() => onArchiveToggle?.(task)}>
                        {task.archived ? t('Unarchive') : t('Archive')}
                      </button>
                      <button type="button" className="mytasks-subtask-btn mytasks-subtask-btn-danger" onClick={() => onDeleteTask?.(task)}>
                        {t('Delete')}
                      </button>
                    </div>
                    {subTasks.length > 0 && (
                      <div className="work-kanban-sub">
                        {subTasks.map((subTask) => (
                          <div key={subTask.id} className="work-kanban-card">
                            <div className="work-task-title">↳ {subTask.title}</div>
                            <select
                              className={`mytasks-status-select status-${(normalizeTaskState(subTask.status) || '').toLowerCase().replace(/\s+/g, '-')}`}
                              value={TASK_STATE_VALUES.includes(normalizeTaskState(subTask.status)) ? normalizeTaskState(subTask.status) : TASK_STATE_VALUES[0]}
                              onChange={(event) => onStatusChange?.(subTask.id, event.target.value)}
                            >
                              {TASK_STATE_VALUES.map((value) => (
                                <option key={value} value={value}>{value}</option>
                              ))}
                            </select>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </article>
        );
      })}
    </section>
  );
}
