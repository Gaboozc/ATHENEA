import { useMemo, useState, Fragment } from 'react';
import { useSelector } from 'react-redux';
import { useTasks } from '../context/TasksContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useLanguage } from '../context/LanguageContext';
import EmptyState from '../components/EmptyState/EmptyState';
import './MyTasks.css';

const TASK_STATUS_KEYS = ['Pending', 'In Progress', 'Near Completion', 'In Review', 'Completed'];
const STATUS_COLORS = {
  'Pending':          '#9aa3ad',
  'In Progress':      '#facc15',
  'Near Completion':  '#60a5fa',
  'In Review':        '#f59e0b',
  'Completed':        '#22c55e',
};
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

/* ─────────────────────────────────────────────────────────────────────────────
   TaskCard — defined OUTSIDE MyTasks to prevent unmount/remount loop
───────────────────────────────────────────────────────────────────────────── */
function TaskCard({
  task, indent = 0,
  t,
  editingId, editValue, onStartEdit, onEditChange, onCommitEdit, onCancelEdit,
  updateTaskStatus, updateTask,
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
        <span className="mytasks-status" style={{ color: STATUS_COLORS[task.status] || '#9aa3ad' }}>
          {task.status || t('Active')}
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
          className={`mytasks-status-select status-${slugStatus(task.status)}`}
          value={TASK_STATUS_KEYS.includes(task.status) ? task.status : 'Pending'}
          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
        >
          {TASK_STATUS_KEYS.map((s) => <option key={s} value={s}>{t(s)}</option>)}
        </select>
        <AssigneeSelect task={task} collaborators={collaborators} updateTask={updateTask} t={t} />
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
  const { tasks, addTask, updateTaskStatus, updateTask } = useTasks();
  const { user } = useCurrentUser();
  const { t } = useLanguage();
  const collaborators = useSelector((s) => s.collaborators?.collaborators || []);

  const [view, setView] = useState('lista');

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

  // ── Derived data ──────────────────────────────────────────────────────────
  const myTasks = useMemo(
    () => tasks.filter((task) => task.assigneeId === user?.id && task.status !== 'pending_approval'),
    [tasks, user?.id]
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
      status:      'Pending',
      level:       parentTask.level || 'Backlog',
      assigneeId:  user?.id,
      createdAt:   new Date().toISOString(),
    });
    cancelSubtaskForm();
  };

  const toggleKanbanExpand = (id) => setExpandedKanbanIds((prev) => {
    const next = new Set(prev);
    if (next.has(id)) next.delete(id); else next.add(id);
    return next;
  });

  // Shared props object passed to every TaskCard
  const cardProps = {
    t, editingId, editValue,
    onStartEdit: startEdit,
    onEditChange: setEditValue,
    onCommitEdit: commitEdit,
    onCancelEdit: cancelEdit,
    updateTaskStatus, updateTask,
    subtaskFormFor,
    onOpenSubtaskForm: openSubtaskForm,
    subtaskTitle,       onSubtaskTitleChange: setSubtaskTitle,
    subtaskDescription, onSubtaskDescriptionChange: setSubtaskDescription,
    subtaskDueDate,     onSubtaskDueDateChange: setSubtaskDueDate,
    onAddSubtask: handleAddSubtask,
    onCancelSubtaskForm: cancelSubtaskForm,
    collaborators,
  };

  // ── VISTA: LISTA (render function, not component) ─────────────────────────
  const renderListView = () => (
    <section className="mytasks-list">
      {rootTasks.length === 0 ? (
        <EmptyState
          icon="📋"
          title={t('No tasks assigned.')}
          message={t('Create your first task through the Gatekeeper questionnaire.')}
          ctaLabel={`+ ${t('New Task')}`}
          onCta={openGatekeeper}
        />
      ) : (
        rootTasks.map((task) => (
          <div key={task.id} className="mytasks-task-group">
            <TaskCard task={task} indent={0} {...cardProps} />
            {(subtaskMap[task.id] || []).map((sub) => (
              <div key={sub.id} className="mytasks-subtask-group">
                <TaskCard task={sub} indent={1} {...cardProps} />
                {(subtaskMap[sub.id] || []).map((subsub) => (
                  <TaskCard key={subsub.id} task={subsub} indent={2} {...cardProps} />
                ))}
              </div>
            ))}
          </div>
        ))
      )}
    </section>
  );

  // ── VISTA: KANBAN (render function) ───────────────────────────────────────
  const renderKanbanView = () => (
    <section className="mytasks-kanban">
      {TASK_STATUS_KEYS.map((status) => {
        const col = rootTasks.filter((t) => (t.status || 'Pending') === status);
        return (
          <div key={status} className="kanban-col">
            <div className="kanban-col-header" style={{ borderTopColor: STATUS_COLORS[status] }}>
              <span className="kanban-col-title" style={{ color: STATUS_COLORS[status] }}>{t(status)}</span>
              <span className="kanban-col-count">{col.length}</span>
            </div>
            <div className="kanban-col-body">
              {col.length === 0 && <div className="kanban-empty">—</div>}
              {col.map((task) => {
                const subs = subtaskMap[task.id] || [];
                const isExpanded = expandedKanbanIds.has(task.id);
                return (
                  <div key={task.id} className="kanban-card">
                    {editingId === task.id ? (
                      <input className="mytasks-title-input" value={editValue} autoFocus
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(task.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit(task.id);
                          if (e.key === 'Escape') cancelEdit();
                        }}
                      />
                    ) : (
                      <p className="kanban-card-title" onClick={() => startEdit(task)} title={t('Click to edit')}>
                        {task.title}
                      </p>
                    )}
                    {task.description && <p className="kanban-card-desc">{task.description}</p>}
                    {task.projectName && <span className="kanban-card-project">{task.projectName}</span>}
                    <div className="kanban-card-footer">
                      {/* Level is read-only */}
                      <span className="kanban-card-level" style={{ color: STATUS_COLORS[task.status] || '#9aa3ad' }}>
                        {task.level || 'Backlog'}
                      </span>
                      {task.dueDate && <span className="kanban-card-due">📅 {fmtDate(task.dueDate)}</span>}
                    </div>
                    <select
                      className={`mytasks-status-select status-${slugStatus(task.status)}`}
                      value={TASK_STATUS_KEYS.includes(task.status) ? task.status : 'Pending'}
                      onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                    >
                      {TASK_STATUS_KEYS.map((s) => <option key={s} value={s}>{t(s)}</option>)}
                    </select>
                    <AssigneeSelect task={task} collaborators={collaborators} updateTask={updateTask} t={t} />

                    {subs.length > 0 && (
                      <button type="button" className="kanban-subtasks-toggle"
                        onClick={() => toggleKanbanExpand(task.id)}>
                        {isExpanded ? '▲' : '▼'} {subs.length} {t('subtask')}{subs.length !== 1 ? 's' : ''}
                      </button>
                    )}

                    {isExpanded && (
                      <div className="kanban-subtask-list">
                        {subs.map((sub) => {
                          const subsubs = subtaskMap[sub.id] || [];
                          return (
                            <div key={sub.id} className="kanban-subtask-item">
                              <div className="kanban-sub-row">
                                <span className="kanban-sub-bullet">↳</span>
                                {editingId === sub.id ? (
                                  <input className="mytasks-title-input" value={editValue} autoFocus
                                    onChange={(e) => setEditValue(e.target.value)}
                                    onBlur={() => commitEdit(sub.id)}
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') commitEdit(sub.id);
                                      if (e.key === 'Escape') cancelEdit();
                                    }}
                                  />
                                ) : (
                                  <span className="kanban-sub-title" onClick={() => startEdit(sub)}>{sub.title}</span>
                                )}
                              </div>
                              {sub.description && <p className="kanban-sub-desc">{sub.description}</p>}
                              <div className="kanban-sub-meta">
                                {sub.dueDate && <span className="kanban-card-due">📅 {fmtDate(sub.dueDate)}</span>}
                                <select
                                  className={`mytasks-status-select kanban-sub-select status-${slugStatus(sub.status)}`}
                                  value={TASK_STATUS_KEYS.includes(sub.status) ? sub.status : 'Pending'}
                                  onChange={(e) => updateTaskStatus(sub.id, e.target.value)}
                                >
                                  {TASK_STATUS_KEYS.map((s) => <option key={s} value={s}>{t(s)}</option>)}
                                </select>
                                <AssigneeSelect task={sub} collaborators={collaborators} updateTask={updateTask} t={t} />
                                <button type="button" className="mytasks-subtask-btn kanban-sub-addbtn"
                                  onClick={() => openSubtaskForm(sub.id)}>
                                  + {t('Sub')}
                                </button>
                              </div>
                              {subtaskFormFor === sub.id && (
                                <SubtaskForm
                                  parentTask={sub} t={t}
                                  title={subtaskTitle} onTitleChange={setSubtaskTitle}
                                  description={subtaskDescription} onDescriptionChange={setSubtaskDescription}
                                  dueDate={subtaskDueDate} onDueDateChange={setSubtaskDueDate}
                                  onAdd={handleAddSubtask} onCancel={cancelSubtaskForm}
                                />
                              )}
                              {subsubs.map((subsub) => (
                                <div key={subsub.id} className="kanban-subsub-item">
                                  <div className="kanban-sub-row">
                                    <span className="kanban-sub-bullet">↳↳</span>
                                    {editingId === subsub.id ? (
                                      <input className="mytasks-title-input" value={editValue} autoFocus
                                        onChange={(e) => setEditValue(e.target.value)}
                                        onBlur={() => commitEdit(subsub.id)}
                                        onKeyDown={(e) => {
                                          if (e.key === 'Enter') commitEdit(subsub.id);
                                          if (e.key === 'Escape') cancelEdit();
                                        }}
                                      />
                                    ) : (
                                      <span className="kanban-sub-title" onClick={() => startEdit(subsub)}>{subsub.title}</span>
                                    )}
                                  </div>
                                  {subsub.description && <p className="kanban-sub-desc">{subsub.description}</p>}
                                  <div className="kanban-sub-meta">
                                    {subsub.dueDate && <span className="kanban-card-due">📅 {fmtDate(subsub.dueDate)}</span>}
                                    <select
                                      className={`mytasks-status-select kanban-sub-select status-${slugStatus(subsub.status)}`}
                                      value={TASK_STATUS_KEYS.includes(subsub.status) ? subsub.status : 'Pending'}
                                      onChange={(e) => updateTaskStatus(subsub.id, e.target.value)}
                                    >
                                      {TASK_STATUS_KEYS.map((s) => <option key={s} value={s}>{t(s)}</option>)}
                                    </select>
                                    <AssigneeSelect task={subsub} collaborators={collaborators} updateTask={updateTask} t={t} />
                                  </div>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    )}

                    {subtaskFormFor === task.id ? (
                      <SubtaskForm
                        parentTask={task} t={t}
                        title={subtaskTitle} onTitleChange={setSubtaskTitle}
                        description={subtaskDescription} onDescriptionChange={setSubtaskDescription}
                        dueDate={subtaskDueDate} onDueDateChange={setSubtaskDueDate}
                        onAdd={handleAddSubtask} onCancel={cancelSubtaskForm}
                      />
                    ) : (
                      <button type="button" className="mytasks-subtask-btn"
                        onClick={() => openSubtaskForm(task.id)}>
                        + {t('Subtask')}
                      </button>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </section>
  );

  // ── VISTA: TABLA (render function) ────────────────────────────────────────
  const renderTablaView = () => {
    const grouped = (() => {
      const map = {};
      rootTasks.forEach((task) => {
        const key = task.projectName || task.workstreamId || t('Sin módulo');
        if (!map[key]) map[key] = [];
        map[key].push(task);
      });
      return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    })();

    // Plain functions (not components) — called directly to avoid React identity change on re-render
    const editableCell = (task) => editingId === task.id ? (
      <input className="mytasks-title-input" value={editValue} autoFocus
        onChange={(e) => setEditValue(e.target.value)}
        onBlur={() => commitEdit(task.id)}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commitEdit(task.id);
          if (e.key === 'Escape') cancelEdit();
        }}
      />
    ) : (
      <span onClick={() => startEdit(task)} title={t('Click to edit')}>{task.title}</span>
    );

    const statusCell = (task) => (
      <select
        className={`mytasks-status-select status-${slugStatus(task.status)}`}
        value={TASK_STATUS_KEYS.includes(task.status) ? task.status : 'Pending'}
        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
      >
        {TASK_STATUS_KEYS.map((s) => <option key={s} value={s}>{t(s)}</option>)}
      </select>
    );

    return (
      <section className="mytasks-tabla">
        {grouped.length === 0 && (
          <EmptyState
            icon="⊞"
            title={t('No tasks assigned.')}
            ctaLabel={`+ ${t('New Task')}`}
            onCta={openGatekeeper}
          />
        )}
        {grouped.map(([module, moduleTasks]) => (
          <div key={module} className="tabla-group">
            <div className="tabla-group-header">
              <span className="tabla-module-name">{module}</span>
              <span className="tabla-module-count">{moduleTasks.length} {t('task(s)')}</span>
            </div>
            <table className="tabla-table">
              <thead>
                <tr>
                  <th>{t('Task')}</th>
                  <th>{t('Status')}</th>
                  <th>{t('Priority')}</th>
                  <th>{t('Assignee')}</th>
                  <th>{t('Start')}</th>
                  <th>{t('Due')}</th>
                </tr>
              </thead>
              <tbody>
                {moduleTasks.map((task) => (
                  <Fragment key={task.id}>
                    <tr>
                      <td className="tabla-title">
                        {editableCell(task)}
                        {subtaskMap[task.id]?.length > 0 && (
                          <span className="tabla-sub-badge">+{subtaskMap[task.id].length}</span>
                        )}
                      </td>
                      <td>{statusCell(task)}</td>
                      {/* Level is read-only */}
                      <td><span className="mytasks-pill mytasks-level-badge">{task.level || 'Backlog'}</span></td>
                      <td><AssigneeSelect task={task} collaborators={collaborators} updateTask={updateTask} t={t} /></td>
                      <td className="tabla-date">{fmtDate(task.startDate)}</td>
                      <td className="tabla-date">{fmtDate(task.dueDate)}</td>
                    </tr>
                    {(subtaskMap[task.id] || []).map((sub) => (
                      <Fragment key={sub.id}>
                        <tr className="tabla-subtask-row">
                          <td className="tabla-title tabla-sub-indent">
                            <span className="tabla-sub-bullet">↳</span>
                            {editableCell(sub)}
                            {sub.description && <span className="tabla-sub-desc">{sub.description}</span>}
                          </td>
                          <td>{statusCell(sub)}</td>
                          <td className="tabla-date-dim">—</td>
                          <td><AssigneeSelect task={sub} collaborators={collaborators} updateTask={updateTask} t={t} /></td>
                          <td className="tabla-date">{fmtDate(sub.startDate)}</td>
                          <td className="tabla-date">{fmtDate(sub.dueDate)}</td>
                        </tr>
                        {(subtaskMap[sub.id] || []).map((subsub) => (
                          <tr key={subsub.id} className="tabla-subtask-row tabla-subsub-row">
                            <td className="tabla-title tabla-subsub-indent">
                              <span className="tabla-sub-bullet">↳↳</span>
                              {editableCell(subsub)}
                              {subsub.description && <span className="tabla-sub-desc">{subsub.description}</span>}
                            </td>
                            <td>{statusCell(subsub)}</td>
                            <td className="tabla-date-dim">—</td>
                            <td><AssigneeSelect task={subsub} collaborators={collaborators} updateTask={updateTask} t={t} /></td>
                            <td className="tabla-date">{fmtDate(subsub.startDate)}</td>
                            <td className="tabla-date">{fmtDate(subsub.dueDate)}</td>
                          </tr>
                        ))}
                      </Fragment>
                    ))}
                  </Fragment>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>
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
            title={t('No tasks with dates.')}
            message={t('Add a start or due date to any task to see it here.')}
            ctaLabel={`+ ${t('New Task')}`}
            onCta={openGatekeeper}
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
                  <span className="gantt-task-status" style={{ color: STATUS_COLORS[task.status] || '#9aa3ad' }}>
                    {task.status}
                  </span>
                </div>
                <div className="gantt-timeline-col">
                  <div className="gantt-today-line" style={{ left: `${(todayOff / totalDays) * 100}%` }} />
                  {(task.startDate || task.dueDate) && (
                    <div
                      className={`gantt-bar status-${slugStatus(task.status)}${depth > 0 ? ' gantt-bar--sub' : ''}`}
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
          <span className="mytasks-count">{myTasks.length}</span>
          <button type="button" className="mytasks-btn-nueva" onClick={openGatekeeper}>
            + {t('New task')}
          </button>
        </div>
      </header>

      {view === 'lista'  && renderListView()}
      {view === 'kanban' && renderKanbanView()}
      {view === 'tabla'  && renderTablaView()}
      {view === 'gantt'  && renderGanttView()}
    </div>
  );
};
