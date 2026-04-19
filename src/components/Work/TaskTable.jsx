import { useMemo, useState } from 'react';
import { TASK_STATE_VALUES, normalizeTaskState } from '../../constants/taskStates';
import './WorkViews.css';

function SortableHeader({ field, label, sortBy, sortDir, setSortBy, setSortDir }) {
  return (
    <th
      className="table-sort-header"
      onClick={() => {
        if (sortBy === field) {
          setSortDir((direction) => (direction === 'asc' ? 'desc' : 'asc'));
        } else {
          setSortBy(field);
          setSortDir('asc');
        }
      }}
    >
      {label}
      {sortBy === field && <span>{sortDir === 'asc' ? ' ↑' : ' ↓'}</span>}
    </th>
  );
}

function EditableDateCell({ task, field, onUpdateTask }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(
    task[field]
      ? new Date(task[field]).toISOString().split('T')[0]
      : ''
  );

  const handleSave = () => {
    onUpdateTask?.(task.id, {
      [field]: value ? new Date(value).toISOString() : null,
    });
    setEditing(false);
  };

  if (editing) {
    return (
      <td>
        <input
          type="date"
          value={value}
          onChange={(event) => setValue(event.target.value)}
          onBlur={handleSave}
          onKeyDown={(event) => {
            if (event.key === 'Enter') handleSave();
            if (event.key === 'Escape') setEditing(false);
          }}
          autoFocus
          style={{
            background: 'var(--bg-panel)',
            border: '1px solid var(--accent-border)',
            borderRadius: 'var(--radius-sm)',
            color: 'var(--text-primary)',
            padding: '4px 8px',
            fontSize: 'var(--text-xs)',
          }}
        />
      </td>
    );
  }

  const date = task[field]
    ? new Date(task[field]).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'short',
      })
    : '—';

  const isOverdue = field === 'dueDate' && task[field] &&
    new Date(task[field]) < new Date() &&
    normalizeTaskState(task.status) !== 'Completado';

  return (
    <td
      className={`date-cell ${isOverdue ? 'overdue' : ''}`}
      onClick={() => setEditing(true)}
      style={{ cursor: 'pointer' }}
      title="Clic para editar"
    >
      {date}
    </td>
  );
}

export default function TaskTable({
  tasks,
  projects = [],
  t = (value) => value,
  onUpdateTask,
  onStatusChange,
  onArchiveToggle,
  onDeleteTask,
  lockProjectId = '',
}) {
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterProject, setFilterProject] = useState(lockProjectId || '');
  const [sortBy, setSortBy] = useState('dueDate');
  const [sortDir, setSortDir] = useState('asc');

  const selectedProjectFilter = lockProjectId || filterProject;

  const filteredTasks = useMemo(() => {
    return (tasks || []).filter((task) => {
      if (task.archived || task.parentTaskId) return false;
      if (searchQuery && !task.title?.toLowerCase().includes(searchQuery.toLowerCase())) return false;
      if (filterStatus && normalizeTaskState(task.status) !== filterStatus) return false;
      if (selectedProjectFilter && task.projectId !== selectedProjectFilter) return false;
      return true;
    });
  }, [tasks, searchQuery, filterStatus, selectedProjectFilter]);

  const sortedTasks = useMemo(() => {
    return [...filteredTasks].sort((taskA, taskB) => {
      let valA = taskA[sortBy] || '';
      let valB = taskB[sortBy] || '';

      if (sortBy === 'projectId') {
        const projectA = projects.find((project) => project.id === taskA.projectId)?.name || taskA.projectName || '';
        const projectB = projects.find((project) => project.id === taskB.projectId)?.name || taskB.projectName || '';
        valA = projectA;
        valB = projectB;
      }

      if (sortBy === 'status') {
        valA = normalizeTaskState(taskA.status);
        valB = normalizeTaskState(taskB.status);
      }

      if (sortBy === 'dueDate' || sortBy === 'startDate') {
        valA = valA ? new Date(valA) : new Date('9999-12-31');
        valB = valB ? new Date(valB) : new Date('9999-12-31');
      }

      if (valA === valB) return 0;
      return sortDir === 'asc' ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
    });
  }, [filteredTasks, sortBy, sortDir, projects]);

  return (
    <section className="work-table-wrap">
      <div className="table-filters">
        <input
          type="text"
          className="table-search"
          placeholder="Buscar tarea..."
          value={searchQuery}
          onChange={(event) => setSearchQuery(event.target.value)}
        />
        <select value={filterStatus} onChange={(event) => setFilterStatus(event.target.value)}>
          <option value="">Todos los estados</option>
          {TASK_STATE_VALUES.map((statusValue) => (
            <option key={statusValue} value={statusValue}>{statusValue}</option>
          ))}
        </select>
        {!lockProjectId && (
          <select value={filterProject} onChange={(event) => setFilterProject(event.target.value)}>
            <option value="">Todos los proyectos</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>{project.name}</option>
            ))}
          </select>
        )}
      </div>

      <table className="work-table">
        <thead>
          <tr>
            <SortableHeader field="title" label="Tarea" sortBy={sortBy} sortDir={sortDir} setSortBy={setSortBy} setSortDir={setSortDir} />
            <SortableHeader field="status" label="Estado" sortBy={sortBy} sortDir={sortDir} setSortBy={setSortBy} setSortDir={setSortDir} />
            <SortableHeader field="level" label="Prioridad" sortBy={sortBy} sortDir={sortDir} setSortBy={setSortBy} setSortDir={setSortDir} />
            <SortableHeader field="projectId" label="Proyecto" sortBy={sortBy} sortDir={sortDir} setSortBy={setSortBy} setSortDir={setSortDir} />
            <SortableHeader field="startDate" label="Inicio" sortBy={sortBy} sortDir={sortDir} setSortBy={setSortBy} setSortDir={setSortDir} />
            <SortableHeader field="dueDate" label="Vence" sortBy={sortBy} sortDir={sortDir} setSortBy={setSortBy} setSortDir={setSortDir} />
            <th className="table-sort-header">Acciones</th>
          </tr>
        </thead>
        <tbody>
          {sortedTasks.map((task) => {
            const projectName = projects.find((project) => project.id === task.projectId)?.name || task.projectName || '—';
            const normalizedStatus = normalizeTaskState(task.status);
            return (
              <tr key={task.id}>
                <td>{task.title}</td>
                <td>
                  <select
                    className={`mytasks-status-select status-${(normalizedStatus || '').toLowerCase().replace(/\s+/g, '-')}`}
                    value={TASK_STATE_VALUES.includes(normalizedStatus) ? normalizedStatus : TASK_STATE_VALUES[0]}
                    onChange={(event) => onStatusChange?.(task.id, event.target.value)}
                  >
                    {TASK_STATE_VALUES.map((statusValue) => (
                      <option key={statusValue} value={statusValue}>{statusValue}</option>
                    ))}
                  </select>
                </td>
                <td><span className="mytasks-pill mytasks-level-badge">{task.level || 'Backlog'}</span></td>
                <td>{projectName}</td>
                <EditableDateCell task={task} field="startDate" onUpdateTask={onUpdateTask} />
                <EditableDateCell task={task} field="dueDate" onUpdateTask={onUpdateTask} />
                <td>
                  <div className="work-table-actions">
                    <button type="button" className="mytasks-subtask-btn" onClick={() => onArchiveToggle?.(task)}>
                      {task.archived ? t('Unarchive') : t('Archive')}
                    </button>
                    <button type="button" className="mytasks-subtask-btn mytasks-subtask-btn-danger" onClick={() => onDeleteTask?.(task)}>
                      {t('Delete')}
                    </button>
                  </div>
                </td>
              </tr>
            );
          })}
          {sortedTasks.length === 0 && (
            <tr>
              <td colSpan={7} className="tasks-empty">{t('No tasks found.')}</td>
            </tr>
          )}
        </tbody>
      </table>
    </section>
  );
}
