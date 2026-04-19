import { useMemo, useState, Fragment, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { DndContext, PointerSensor, closestCenter, useSensor, useSensors, useDraggable, useDroppable } from '@dnd-kit/core';
import { CSS } from '@dnd-kit/utilities';
import { useTasks } from '../context/TasksContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useLanguage } from '../context/LanguageContext';
import { TASK_STATES, TASK_STATE_COLORS, normalizeTaskState } from '../constants/taskStates';
import TaskList from '../components/Work/TaskList';
import TaskKanban from '../components/Work/TaskKanban';
import TaskTable from '../components/Work/TaskTable';
import {
  archiveTask as archiveTaskAction,
  unarchiveTask as unarchiveTaskAction,
  deleteTask as deleteTaskAction,
} from '../../store/slices/tasksSlice';
import { EmptyState, LoadingSpinner } from '../components';
import './MyTasks.css';

const TASK_STATUS_KEYS = [
  TASK_STATES.PENDING,
  TASK_STATES.IN_PROGRESS,
  TASK_STATES.COMPLETED,
  TASK_STATES.BLOCKED,
  TASK_STATES.CANCELLED,
];
const slugStatus = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

const VIEWS = ['lista', 'kanban', 'tabla', 'gantt'];
const VIEW_ICON = { lista: '☰', kanban: '⬛', tabla: '⊞', gantt: '▬' };
const VIEW_KEY  = { lista: 'List', kanban: 'Kanban', tabla: 'Table', gantt: 'Gantt' };

const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es', { day: '2-digit', month: 'short' }) : '—';
const daysDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

/* ─────────────────────────────────────────────────────────────────────────────
   SubtaskForm — defined OUTSIDE MyTasks to prevent unmount/remount loop
───────────────────────────────────────────────────────────────────────────── */
function SubtaskForm({
  parentTask, t,
  title, onTitleChange,
  description, onDescriptionChange,
  dueDate, onDueDateChange,
  onAdd, onCancel,
}) {
  return (
    <div className="mytasks-subtask-form">
      <input
        autoFocus
        className="mytasks-subtask-input"
        placeholder={parentTask.parentTaskId ? t('Sub-subtask title…') : t('Subtask title…')}
        value={title}
        onChange={(e) => onTitleChange(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') onAdd();
          if (e.key === 'Escape') onCancel();
        }}
      />
      <textarea
        className="mytasks-subtask-desc"
        placeholder={t('Description (optional)')}
        rows={2}
        value={description}
        onChange={(e) => onDescriptionChange(e.target.value)}
      />
      <div className="mytasks-subtask-meta-row">
        <label className="mytasks-subtask-date-label">
          📅
          <input
            type="date"
            className="mytasks-subtask-date"
            value={dueDate}
            onChange={(e) => onDueDateChange(e.target.value)}
          />
        </label>
        <div className="mytasks-subtask-btns">
          <button type="button" className="mytasks-subtask-add" onClick={onAdd}>{t('Add')}</button>
          <button type="button" className="mytasks-subtask-cancel" onClick={onCancel}>{t('Cancel')}</button>
        </div>
      </div>
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   AssigneeSelect — collaborator selector for a task
───────────────────────────────────────────────────────────────────────────── */
function AssigneeSelect({ task, collaborators, updateTask, t }) {
  return (
    <select
      className="mytasks-assignee-select"
      value={task.assigneeId || ''}
      onChange={(e) => updateTask(task.id, { assigneeId: e.target.value || null })}
      title={t('Assign to collaborator')}
    >
      <option value="">{t('Unassigned')}</option>
      {collaborators.length === 0 ? (
        <option disabled value="__none__">{t('No collaborators')}</option>
      ) : (
        collaborators.map((c) => (
          <option key={c.id} value={c.id}>
            {c.name || c.email || c.id}
          </option>
        ))
      )}
    </select>
  );
}

function DroppableKanbanColumn({ status, children }) {
  const { isOver, setNodeRef } = useDroppable({
    id: `column-${status}`,
    data: { status },
  });

  return (
    <div ref={setNodeRef} className={`kanban-col-body${isOver ? ' is-over' : ''}`}>
      {children}
    </div>
  );
}

function DraggableKanbanCard({ taskId, children }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useDraggable({
    id: `task-${taskId}`,
    data: { taskId },
  });

  return (
    <div
      ref={setNodeRef}
      style={{
        transform: CSS.Translate.toString(transform),
        transition,
      }}
      className={`kanban-draggable${isDragging ? ' is-dragging' : ''}`}
      {...attributes}
      {...listeners}
    >
      {children}
    </div>
  );
}

/* ─────────────────────────────────────────────────────────────────────────────
   TaskCard — defined OUTSIDE MyTasks to prevent unmount/remount loop
───────────────────────────────────────────────────────────────────────────── */
function TaskCard({
  task, indent = 0,
  t,
  editingId, editValue, onStartEdit, onEditChange, onCommitEdit, onCancelEdit,
  onStatusChange, updateTask,
  onArchiveToggle, onDelete,
  subtaskFormFor, onOpenSubtaskForm,
  subtaskTitle, onSubtaskTitleChange,
  subtaskDescription, onSubtaskDescriptionChange,
  subtaskDueDate, onSubtaskDueDateChange,
  onAddSubtask, onCancelSubtaskForm,
  collaborators,
}) {
  return (
    <article className={`mytasks-card${indent === 1 ? ' mytasks-card--sub' : indent === 2 ? ' mytasks-card--subsub' : ''}`}>
      <div className="mytasks-card-header">
        <div className="mytasks-title-area">
          {indent > 0 && <span className="mytasks-sub-bullet">{'↳'.repeat(indent)}</span>}
          {editingId === task.id ? (
            <input
              className="mytasks-title-input"
              value={editValue}
              autoFocus
              onChange={(e) => onEditChange(e.target.value)}
              onBlur={() => onCommitEdit(task.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') onCommitEdit(task.id);
                if (e.key === 'Escape') onCancelEdit();
              }}
            />
          ) : (
            <h2 className="mytasks-title-editable" title={t('Click to edit')} onClick={() => onStartEdit(task)}>
              {task.title}
            </h2>
          )}
          {task.projectName && indent === 0 && <span className="mytasks-project">{task.projectName}</span>}
          {task.dueDate && <span className="mytasks-due">📅 {fmtDate(task.dueDate)}</span>}
        </div>
        <span className="mytasks-status" style={{ color: TASK_STATE_COLORS[normalizeTaskState(task.status)] || '#9aa3ad' }}>
          {normalizeTaskState(task.status) || t('Active')}
        </span>
      </div>
      {task.description && <p className="mytasks-desc">{task.description}</p>}
      {indent === 0 && task.level && (
        <div className="mytasks-meta">
          {/* Level is read-only — set by Gatekeeper questionnaire */}
          <span className="mytasks-pill mytasks-level-badge">{task.level}</span>
          {Array.isArray(task.workstreams) && task.workstreams.map((s) => (
            <span key={s} className="mytasks-pill">{s}</span>
          ))}
        </div>
      )}
      <div className="mytasks-actions">
        <select
          className={`mytasks-status-select status-${slugStatus(normalizeTaskState(task.status))}`}
          value={TASK_STATUS_KEYS.includes(normalizeTaskState(task.status)) ? normalizeTaskState(task.status) : TASK_STATES.PENDING}
          onChange={(e) => onStatusChange(task.id, e.target.value)}
        >
          {TASK_STATUS_KEYS.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        <AssigneeSelect task={task} collaborators={collaborators} updateTask={updateTask} t={t} />
        <button type="button" className="mytasks-subtask-btn" onClick={() => onArchiveToggle(task)}>
          {task.archived ? t('Unarchive') : t('Archive')}
        </button>
        <button type="button" className="mytasks-subtask-btn mytasks-subtask-btn-danger" onClick={() => onDelete(task)}>
          {t('Delete')}
        </button>
        {indent < 2 && (
          <button type="button" className="mytasks-subtask-btn"
            onClick={() => onOpenSubtaskForm(task.id)}>
            + {indent === 0 ? t('Subtask') : t('Sub')}
          </button>
        )}
      </div>
      {subtaskFormFor === task.id && (
        <SubtaskForm
          parentTask={task} t={t}
          title={subtaskTitle} onTitleChange={onSubtaskTitleChange}
          description={subtaskDescription} onDescriptionChange={onSubtaskDescriptionChange}
          dueDate={subtaskDueDate} onDueDateChange={onSubtaskDueDateChange}
          onAdd={onAddSubtask} onCancel={onCancelSubtaskForm}
        />
      )}
    </article>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
   MyTasks — main component
═══════════════════════════════════════════════════════════════════════════ */
export const MyTasks = () => {
  const { tasks, addTask, updateTaskStatus, updateTask, deleteTask } = useTasks();
  const { user } = useCurrentUser();
  const { t } = useLanguage();
  const dispatch = useDispatch();
  const collaborators = useSelector((s) => s.collaborators?.collaborators || []);
  const projects = useSelector((s) => s.projects?.projects || []);

  const [view, setView] = useState('lista');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setIsLoading(false));
    return () => cancelAnimationFrame(frame);
  }, []);

  // Inline edit state
  const [editingId, setEditingId]   = useState(null);
  const [editValue, setEditValue]   = useState('');

  // Subtask form state
  const [subtaskFormFor, setSubtaskFormFor]         = useState(null);
  const [subtaskTitle, setSubtaskTitle]             = useState('');
  const [subtaskDescription, setSubtaskDescription] = useState('');
  const [subtaskDueDate, setSubtaskDueDate]         = useState('');

  // Kanban expanded subtask rows
  const [expandedKanbanIds, setExpandedKanbanIds] = useState(new Set());
  const [showArchived, setShowArchived] = useState(false);
  const [toast, setToast] = useState('');

  const pushToast = (message) => {
    setToast(message);
    window.setTimeout(() => setToast(''), 2200);
  };

  // ── Derived data ──────────────────────────────────────────────────────────
  const myTasks = useMemo(
    () => tasks.filter((task) => {
      if (task.assigneeId !== user?.id) return false;
      if (task.status === 'pending_approval') return false;
      if (!showArchived && task.archived) return false;
      return true;
    }),
    [tasks, user?.id, showArchived]
  );
  const myTaskIdSet = useMemo(() => new Set(myTasks.map((t) => t.id)), [myTasks]);

  const rootTasks = useMemo(
    () => myTasks.filter((t) => !t.parentTaskId || !myTaskIdSet.has(t.parentTaskId)),
    [myTasks, myTaskIdSet]
  );

  const subtaskMap = useMemo(() => {
    const map = {};
    myTasks.forEach((t) => {
      if (t.parentTaskId && myTaskIdSet.has(t.parentTaskId)) {
        if (!map[t.parentTaskId]) map[t.parentTaskId] = [];
        map[t.parentTaskId].push(t);
      }
    });
    return map;
  }, [myTasks, myTaskIdSet]);

  // ── Handlers ──────────────────────────────────────────────────────────────
  const openGatekeeper = () => window.dispatchEvent(new CustomEvent('athenea:gatekeeper:open'));

  const startEdit    = (task) => { setEditingId(task.id); setEditValue(task.title); };
  const commitEdit   = (taskId) => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed.length >= 3) updateTask(taskId, { title: trimmed });
    setEditingId(null); setEditValue('');
  };
  const cancelEdit   = () => { setEditingId(null); setEditValue(''); };

  const openSubtaskForm  = (taskId) => { setSubtaskFormFor(taskId); setSubtaskTitle(''); setSubtaskDescription(''); setSubtaskDueDate(''); };
  const cancelSubtaskForm = () => { setSubtaskFormFor(null); setSubtaskTitle(''); setSubtaskDescription(''); setSubtaskDueDate(''); };

  const handleAddSubtask = () => {
    const title = subtaskTitle.trim();
    if (!title || !subtaskFormFor) return;
    const parentTask = myTasks.find((t) => t.id === subtaskFormFor);
    if (!parentTask) return;
    addTask({
      title,
      description: subtaskDescription.trim() || null,
      dueDate:     subtaskDueDate || null,
      projectId:   parentTask.projectId || null,
      projectName: parentTask.projectName || null,
      parentTaskId: parentTask.id,
      status:      TASK_STATES.PENDING,
      level:       parentTask.level || 'Backlog',
      assigneeId:  user?.id,
      createdAt:   new Date().toISOString(),
    });
    cancelSubtaskForm();
  };

  const handleStatusChange = (taskId, status) => {
    const normalized = normalizeTaskState(status);
    const isCompleted = normalized === TASK_STATES.COMPLETED;
    updateTaskStatus(taskId, normalized);
    updateTask(taskId, { status: normalized, completed: isCompleted });
  };

  const handleArchiveToggle = (task) => {
    if (task.archived) {
      updateTask(task.id, { archived: false });
      dispatch(unarchiveTaskAction(task.id));
      pushToast(t('Task unarchived'));
      return;
    }

    updateTask(task.id, { archived: true });
    dispatch(archiveTaskAction(task.id));
    pushToast(t('Task archived'));
  };

  const handleDeleteTask = (task) => {
    if (!window.confirm(t('Do you want to permanently delete this task?'))) return;
    deleteTask(task.id);
    dispatch(deleteTaskAction(task.id));
    pushToast(t('Task deleted'));
  };

  // ── VISTA: LISTA (render function, not component) ─────────────────────────
  const renderListView = () => {
    if (rootTasks.length === 0) {
      return (
        <EmptyState
          icon="📋"
          title={t('No tengo tareas asignadas.')}
          description={t('Si creas una tarea desde Gatekeeper, la organizo aqui para ti.')}
          action={{
            label: t('Crear tarea'),
            icon: '+',
            onClick: openGatekeeper,
          }}
        />
      );
    }

    return (
      <TaskList
        tasks={myTasks}
        t={t}
        onStatusChange={handleStatusChange}
        onArchiveToggle={handleArchiveToggle}
        onDeleteTask={handleDeleteTask}
      />
    );
  };

  // ── VISTA: KANBAN (render function) ───────────────────────────────────────
  const renderKanbanView = () => (
    <TaskKanban
      tasks={myTasks}
      t={t}
      onStatusChange={handleStatusChange}
      onArchiveToggle={handleArchiveToggle}
      onDeleteTask={handleDeleteTask}
    />
  );

  // ── VISTA: TABLA (render function) ────────────────────────────────────────
  const renderTablaView = () => {
    if (myTasks.length === 0) {
      return (
        <EmptyState
          icon="⊞"
          title={t('No tengo tareas asignadas.')}
          description={t('Crea una tarea y la muestro en esta tabla por modulo.')}
          action={{
            label: t('Crear tarea'),
            icon: '+',
            onClick: openGatekeeper,
          }}
        />
      );
    }

    return (
      <TaskTable
        tasks={myTasks}
        projects={projects}
        t={t}
        onUpdateTask={updateTask}
        onStatusChange={handleStatusChange}
        onArchiveToggle={handleArchiveToggle}
        onDeleteTask={handleDeleteTask}
      />
    );
  };

  // ── VISTA: GANTT (render function) ────────────────────────────────────────
  const renderGanttView = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const allRows = [];
    rootTasks.forEach((task) => {
      if (task.startDate || task.dueDate) allRows.push({ task, depth: 0 });
      (subtaskMap[task.id] || []).forEach((sub) => {
        if (sub.startDate || sub.dueDate) allRows.push({ task: sub, depth: 1 });
        (subtaskMap[sub.id] || []).forEach((subsub) => {
          if (subsub.startDate || subsub.dueDate) allRows.push({ task: subsub, depth: 2 });
        });
      });
    });

    let rangeStart = new Date(today); rangeStart.setDate(today.getDate() - 7);
    let rangeEnd   = new Date(today); rangeEnd.setDate(today.getDate() + 53);
    allRows.forEach(({ task: tk }) => {
      if (tk.startDate) { const d = new Date(tk.startDate); if (d < rangeStart) rangeStart = d; }
      if (tk.dueDate)   { const d = new Date(tk.dueDate);   if (d > rangeEnd)   rangeEnd = d; }
    });

    const totalDays  = daysDiff(rangeStart, rangeEnd) || 60;
    const todayOff   = Math.max(0, daysDiff(rangeStart, today));
    const weeks = [];
    const cur = new Date(rangeStart);
    while (cur <= rangeEnd) { weeks.push(new Date(cur)); cur.setDate(cur.getDate() + 7); }

    const barLeft  = (dateStr) => `${Math.max(0, (daysDiff(rangeStart, new Date(dateStr)) / totalDays) * 100).toFixed(1)}%`;
    const barWidth = (start, end) => {
      const s = start ? new Date(start) : new Date(today);
      const e = end   ? new Date(end)   : new Date(today);
      return `${Math.max(0.5, (daysDiff(s, e) / totalDays) * 100).toFixed(1)}%`;
    };

    return (
      <section className="mytasks-gantt">
        {allRows.length === 0 && (
          <EmptyState
            icon="▬"
            title={t('No tengo tareas con fechas.')}
            description={t('Agrega fecha de inicio o vencimiento y la muestro en el gantt.')}
            action={{
              label: t('Crear tarea'),
              icon: '+',
              onClick: openGatekeeper,
            }}
          />
        )}
        {allRows.length > 0 && (
          <div className="gantt-wrapper">
            <div className="gantt-header">
              <div className="gantt-label-col" />
              <div className="gantt-timeline-col" style={{ position: 'relative' }}>
                {weeks.map((w) => (
                  <span key={w.toISOString()} className="gantt-week-label"
                    style={{ left: `${(daysDiff(rangeStart, w) / totalDays) * 100}%` }}>
                    {w.toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                  </span>
                ))}
                <div className="gantt-today-line" style={{ left: `${(todayOff / totalDays) * 100}%` }} />
              </div>
            </div>
            {allRows.map(({ task, depth }) => (
              <div key={task.id} className={`gantt-row gantt-row--d${depth}`}>
                <div className="gantt-label-col" title={task.title}
                  style={{ paddingLeft: `${8 + depth * 18}px` }}>
                  {depth > 0 && <span className="gantt-sub-bullet">{'↳'.repeat(depth)}</span>}
                  <span className="gantt-task-title">{task.title}</span>
                  <span className="gantt-task-status" style={{ color: TASK_STATE_COLORS[normalizeTaskState(task.status)] || '#9aa3ad' }}>
                    {normalizeTaskState(task.status)}
                  </span>
                </div>
                <div className="gantt-timeline-col">
                  <div className="gantt-today-line" style={{ left: `${(todayOff / totalDays) * 100}%` }} />
                  {(task.startDate || task.dueDate) && (
                    <div
                      className={`gantt-bar status-${slugStatus(normalizeTaskState(task.status))}${depth > 0 ? ' gantt-bar--sub' : ''}`}
                      style={{
                        left:  barLeft(task.startDate || task.dueDate),
                        width: barWidth(task.startDate, task.dueDate),
                      }}
                      title={`${fmtDate(task.startDate)} → ${fmtDate(task.dueDate)}`}
                    >
                      <span className="gantt-bar-label">{fmtDate(task.startDate)} → {fmtDate(task.dueDate)}</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    );
  };

  // ── Render ─────────────────────────────────────────────────────────────────
  return (
    <div className="mytasks-container">
      {isLoading && (
        <section className="page-loading-state">
          <LoadingSpinner size="md" label="ATHENEA esta preparando tus tareas" />
        </section>
      )}

      {!isLoading && (
      <>
      <header className="mytasks-header">
        <div>
          <h1>{t('My Tasks')}</h1>
          <p>{t('Assigned to you')}</p>
        </div>
        <div className="mytasks-header-actions">
          <div className="mytasks-view-switcher">
            {VIEWS.map((v) => (
              <button key={v} type="button"
                className={`mytasks-view-btn${view === v ? ' active' : ''}`}
                onClick={() => setView(v)}>
                {VIEW_ICON[v]} {t(VIEW_KEY[v])}
              </button>
            ))}
          </div>
          <button
            type="button"
            className={`mytasks-subtask-btn${showArchived ? ' is-active' : ''}`}
            onClick={() => setShowArchived((prev) => !prev)}
          >
            {showArchived ? t('Hide archived') : t('Show archived')}
          </button>
          <span className="mytasks-count">{myTasks.length}</span>
          <button type="button" className="mytasks-btn-nueva" onClick={openGatekeeper}>
            + {t('New task')}
          </button>
        </div>
      </header>

      {toast && <div className="mytasks-toast">{toast}</div>}

      {view === 'lista'  && renderListView()}
      {view === 'kanban' && renderKanbanView()}
      {view === 'tabla'  && renderTablaView()}
      {view === 'gantt'  && renderGanttView()}
      </>
      )}
    </div>
  );
};
