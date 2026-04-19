import { useMemo } from 'react';
import { TASK_STATE_VALUES, normalizeTaskState } from '../../constants/taskStates';
import './WorkViews.css';

function buildTree(tasks) {
  const map = new Map();
  tasks.forEach((task) => map.set(task.id, []));

  const roots = [];
  tasks.forEach((task) => {
    if (task.parentTaskId && map.has(task.parentTaskId)) {
      map.get(task.parentTaskId).push(task);
      return;
    }
    roots.push(task);
  });

  return { roots, childrenMap: map };
}

export default function TaskList({
  tasks,
  t = (value) => value,
  onStatusChange,
  onArchiveToggle,
  onDeleteTask,
  showProject = true,
  maxDepth = 2,
}) {
  const { roots, childrenMap } = useMemo(() => buildTree(tasks || []), [tasks]);

  const renderNode = (task, depth = 0) => {
    const children = depth < maxDepth ? childrenMap.get(task.id) || [] : [];
    const status = normalizeTaskState(task.status);

    return (
      <div key={task.id} className={`work-task-row depth-${depth}`}>
        <div className="work-task-main">
          <span className="work-task-title">{depth > 0 ? '↳ ' : ''}{task.title}</span>
          {showProject && task.projectName && (
            <span className="work-task-project">{task.projectName}</span>
          )}
        </div>
        <div className="work-task-meta">
          <select
            className={`mytasks-status-select status-${(status || '').toLowerCase().replace(/\s+/g, '-')}`}
            value={TASK_STATE_VALUES.includes(status) ? status : TASK_STATE_VALUES[0]}
            onChange={(event) => onStatusChange?.(task.id, event.target.value)}
          >
            {TASK_STATE_VALUES.map((value) => (
              <option key={value} value={value}>{value}</option>
            ))}
          </select>
          <span className="mytasks-pill mytasks-level-badge">{task.level || 'Backlog'}</span>
          <span className="date-cell">{task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-MX') : '—'}</span>
          <div className="work-table-actions">
            <button type="button" className="mytasks-subtask-btn" onClick={() => onArchiveToggle?.(task)}>
              {task.archived ? t('Unarchive') : t('Archive')}
            </button>
            <button type="button" className="mytasks-subtask-btn mytasks-subtask-btn-danger" onClick={() => onDeleteTask?.(task)}>
              {t('Delete')}
            </button>
          </div>
        </div>
        {children.map((child) => renderNode(child, depth + 1))}
      </div>
    );
  };

  if (!roots.length) {
    return <div className="tasks-empty">{t('No tasks found.')}</div>;
  }

  return <section className="work-task-list">{roots.map((root) => renderNode(root, 0))}</section>;
}
