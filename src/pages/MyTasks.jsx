import { useMemo, useState } from 'react';
import { useTasks } from '../context/TasksContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useLanguage } from '../context/LanguageContext';
import './MyTasks.css';

const LEVEL_CYCLE = ['Critical', 'High Velocity', 'Steady Flow', 'Low Friction', 'Backlog'];
const TASK_STATUSES = ['Pendiente', 'En Curso', 'Por Terminar', 'En Revisión', 'Completado'];
const STATUS_COLORS = {
  'Pendiente':   '#9aa3ad',
  'En Curso':    '#facc15',
  'Por Terminar':'#60a5fa',
  'En Revisión': '#f59e0b',
  'Completado':  '#22c55e',
};
const slugStatus = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/\s+/g, '-');

const VIEWS = ['lista', 'kanban', 'tabla', 'gantt'];
const VIEW_LABELS = { lista: '☰ Lista', kanban: '⬛ Kanban', tabla: '⊞ Tabla', gantt: '▬ Gantt' };

/* ── Helpers ── */
const fmtDate = (d) => d ? new Date(d).toLocaleDateString('es', { day: '2-digit', month: 'short' }) : '—';
const daysDiff = (a, b) => Math.round((new Date(b) - new Date(a)) / 86400000);

export const MyTasks = () => {
  const { tasks, addTask, updateTaskStatus, updateTask } = useTasks();
  const { user } = useCurrentUser();
  const { t } = useLanguage();
  const [view, setView] = useState('lista');
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');
  const [subtaskFormFor, setSubtaskFormFor] = useState(null);
  const [subtaskTitle, setSubtaskTitle] = useState('');

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

  const handleAddSubtask = (parentTask) => {
    const title = subtaskTitle.trim();
    if (!title) return;
    addTask({
      title,
      projectId: parentTask.projectId || null,
      projectName: parentTask.projectName || null,
      parentTaskId: parentTask.id,
      status: 'Pendiente',
      level: parentTask.level || 'Backlog',
      assigneeId: user?.id,
      createdAt: new Date().toISOString(),
    });
    setSubtaskTitle('');
    setSubtaskFormFor(null);
  };

  const openGatekeeper = () => window.dispatchEvent(new CustomEvent('athenea:gatekeeper:open'));
  const startEdit = (task) => { setEditingId(task.id); setEditValue(task.title); };
  const commitEdit = (taskId) => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed.length >= 3) updateTask(taskId, { title: trimmed });
    setEditingId(null);
    setEditValue('');
  };
  const cycleLevel = (task) => {
    const idx = LEVEL_CYCLE.indexOf(task.level || 'Backlog');
    updateTask(task.id, { level: LEVEL_CYCLE[(idx + 1) % LEVEL_CYCLE.length] });
  };

  /* ── Reusable mini task card (used in Lista + Kanban) ── */
  const TaskCard = ({ task, indent = 0 }) => (
    <article className={`mytasks-card${indent === 1 ? ' mytasks-card--sub' : indent === 2 ? ' mytasks-card--subsub' : ''}`}>
      <div className="mytasks-card-header">
        <div className="mytasks-title-area">
          {indent > 0 && <span className="mytasks-sub-bullet">{'↳'.repeat(indent)}</span>}
          {editingId === task.id ? (
            <input
              className="mytasks-title-input"
              value={editValue}
              autoFocus
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={() => commitEdit(task.id)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') commitEdit(task.id);
                if (e.key === 'Escape') { setEditingId(null); setEditValue(''); }
              }}
            />
          ) : (
            <h2 className="mytasks-title-editable" title={t('Click to edit')} onClick={() => startEdit(task)}>
              {task.title}
            </h2>
          )}
          {task.projectName && indent === 0 && <span className="mytasks-project">{task.projectName}</span>}
          {task.dueDate && indent === 0 && <span className="mytasks-due">📅 {fmtDate(task.dueDate)}</span>}
        </div>
        <span className="mytasks-status" style={{ color: STATUS_COLORS[task.status] || '#9aa3ad' }}>
          {task.status || t('Active')}
        </span>
      </div>
      {task.description && indent === 0 && <p className="mytasks-desc">{task.description}</p>}
      {indent === 0 && (
        <div className="mytasks-meta">
          {task.level && (
            <span className="mytasks-pill mytasks-level-badge" title={t('Click to change level')}
              onClick={() => cycleLevel(task)} style={{ cursor: 'pointer' }}>
              {task.level}
            </span>
          )}
          {Array.isArray(task.workstreams) && task.workstreams.map((s) => (
            <span key={s} className="mytasks-pill">{s}</span>
          ))}
        </div>
      )}
      <div className="mytasks-actions">
        <select
          className={`mytasks-status-select status-${slugStatus(task.status)}`}
          value={TASK_STATUSES.includes(task.status) ? task.status : 'Pendiente'}
          onChange={(e) => updateTaskStatus(task.id, e.target.value)}
        >
          {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
        </select>
        {indent < 2 && (
          <button type="button" className="mytasks-subtask-btn"
            onClick={() => { setSubtaskFormFor(task.id); setSubtaskTitle(''); }}>
            + {indent === 0 ? t('Subtask') : t('Sub')}
          </button>
        )}
      </div>
      {subtaskFormFor === task.id && (
        <div className="mytasks-subtask-form">
          <input autoFocus className="mytasks-subtask-input"
            placeholder={indent === 0 ? t('Subtask title…') : t('Sub-subtask title…')}
            value={subtaskTitle}
            onChange={(e) => setSubtaskTitle(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleAddSubtask(task);
              if (e.key === 'Escape') setSubtaskFormFor(null);
            }}
          />
          <button type="button" className="mytasks-subtask-add" onClick={() => handleAddSubtask(task)}>{t('Add')}</button>
          <button type="button" className="mytasks-subtask-cancel" onClick={() => setSubtaskFormFor(null)}>{t('Cancel')}</button>
        </div>
      )}
    </article>
  );

  /* ── VISTA: LISTA ── */
  const ListView = () => (
    <section className="mytasks-list">
      {rootTasks.length === 0 ? (
        <div className="mytasks-empty">{t('No tasks assigned.')}</div>
      ) : (
        rootTasks.map((task) => (
          <div key={task.id} className="mytasks-task-group">
            <TaskCard task={task} indent={0} />
            {subtaskMap[task.id]?.map((sub) => (
              <div key={sub.id} className="mytasks-subtask-group">
                <TaskCard task={sub} indent={1} />
                {subtaskMap[sub.id]?.map((subsub) => (
                  <TaskCard key={subsub.id} task={subsub} indent={2} />
                ))}
              </div>
            ))}
          </div>
        ))
      )}
    </section>
  );

  /* ── VISTA: KANBAN ── */
  const KanbanView = () => (
    <section className="mytasks-kanban">
      {TASK_STATUSES.map((status) => {
        const col = rootTasks.filter((t) => (t.status || 'Pendiente') === status);
        return (
          <div key={status} className="kanban-col">
            <div className="kanban-col-header" style={{ borderTopColor: STATUS_COLORS[status] }}>
              <span className="kanban-col-title" style={{ color: STATUS_COLORS[status] }}>{status}</span>
              <span className="kanban-col-count">{col.length}</span>
            </div>
            <div className="kanban-col-body">
              {col.length === 0 && <div className="kanban-empty">—</div>}
              {col.map((task) => (
                <div key={task.id} className="kanban-card">
                  <p className="kanban-card-title" onClick={() => startEdit(task)} title={t('Click to edit')}>
                    {editingId === task.id ? (
                      <input className="mytasks-title-input" value={editValue} autoFocus
                        onChange={(e) => setEditValue(e.target.value)}
                        onBlur={() => commitEdit(task.id)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') commitEdit(task.id);
                          if (e.key === 'Escape') { setEditingId(null); setEditValue(''); }
                        }}
                      />
                    ) : task.title}
                  </p>
                  {task.projectName && <span className="kanban-card-project">{task.projectName}</span>}
                  <div className="kanban-card-footer">
                    <span className="kanban-card-level" style={{ color: STATUS_COLORS[task.status] || '#9aa3ad' }}>
                      {task.level || 'Backlog'}
                    </span>
                    {task.dueDate && <span className="kanban-card-due">📅 {fmtDate(task.dueDate)}</span>}
                  </div>
                  <select
                    className={`mytasks-status-select status-${slugStatus(task.status)}`}
                    value={TASK_STATUSES.includes(task.status) ? task.status : 'Pendiente'}
                    onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                  >
                    {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                  {subtaskMap[task.id]?.length > 0 && (
                    <span className="kanban-subtask-count">↳ {subtaskMap[task.id].length} subtarea(s)</span>
                  )}
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </section>
  );

  /* ── VISTA: TABLA POR MÓDULO ── */
  const TablaView = () => {
    const grouped = useMemo(() => {
      const map = {};
      rootTasks.forEach((t) => {
        const key = t.projectName || t.workstreamId || t('Sin módulo');
        if (!map[key]) map[key] = [];
        map[key].push(t);
      });
      return Object.entries(map).sort(([a], [b]) => a.localeCompare(b));
    }, []);

    return (
      <section className="mytasks-tabla">
        {grouped.length === 0 && <div className="mytasks-empty">{t('No tasks assigned.')}</div>}
        {grouped.map(([module, tasks]) => (
          <div key={module} className="tabla-group">
            <div className="tabla-group-header">
              <span className="tabla-module-name">{module}</span>
              <span className="tabla-module-count">{tasks.length} tarea(s)</span>
            </div>
            <table className="tabla-table">
              <thead>
                <tr>
                  <th>{t('Task')}</th>
                  <th>{t('Status')}</th>
                  <th>{t('Priority')}</th>
                  <th>{t('Start')}</th>
                  <th>{t('Due')}</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task.id}>
                    <td className="tabla-title" onClick={() => startEdit(task)}>
                      {editingId === task.id ? (
                        <input className="mytasks-title-input" value={editValue} autoFocus
                          onChange={(e) => setEditValue(e.target.value)}
                          onBlur={() => commitEdit(task.id)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit(task.id);
                            if (e.key === 'Escape') { setEditingId(null); setEditValue(''); }
                          }}
                        />
                      ) : task.title}
                      {subtaskMap[task.id]?.length > 0 && (
                        <span className="tabla-sub-badge">+{subtaskMap[task.id].length}</span>
                      )}
                    </td>
                    <td>
                      <select
                        className={`mytasks-status-select status-${slugStatus(task.status)}`}
                        value={TASK_STATUSES.includes(task.status) ? task.status : 'Pendiente'}
                        onChange={(e) => updateTaskStatus(task.id, e.target.value)}
                      >
                        {TASK_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                    <td>
                      <span className="mytasks-pill mytasks-level-badge" onClick={() => cycleLevel(task)}
                        style={{ cursor: 'pointer' }}>
                        {task.level || 'Backlog'}
                      </span>
                    </td>
                    <td className="tabla-date">{fmtDate(task.startDate)}</td>
                    <td className="tabla-date">{fmtDate(task.dueDate)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </section>
    );
  };

  /* ── VISTA: GANTT ── */
  const GanttView = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /* range: from 7 days ago to 53 days ahead (60-day window), or task dates if wider */
    const tasksWithDates = rootTasks.filter((t) => t.startDate || t.dueDate);
    let rangeStart = new Date(today); rangeStart.setDate(today.getDate() - 7);
    let rangeEnd = new Date(today); rangeEnd.setDate(today.getDate() + 53);

    tasksWithDates.forEach((t) => {
      if (t.startDate) { const d = new Date(t.startDate); if (d < rangeStart) rangeStart = d; }
      if (t.dueDate)   { const d = new Date(t.dueDate);   if (d > rangeEnd)   rangeEnd = d; }
    });

    const totalDays = daysDiff(rangeStart, rangeEnd) || 60;
    const todayOffset = Math.max(0, daysDiff(rangeStart, today));

    /* week labels */
    const weeks = [];
    const cur = new Date(rangeStart);
    while (cur <= rangeEnd) {
      weeks.push(new Date(cur));
      cur.setDate(cur.getDate() + 7);
    }

    const barLeft  = (dateStr) => `${Math.max(0, (daysDiff(rangeStart, new Date(dateStr)) / totalDays) * 100).toFixed(1)}%`;
    const barWidth = (start, end) => {
      const s = start ? new Date(start) : new Date(today);
      const e = end   ? new Date(end)   : new Date(today);
      return `${Math.max(0.5, (daysDiff(s, e) / totalDays) * 100).toFixed(1)}%`;
    };

    return (
      <section className="mytasks-gantt">
        {tasksWithDates.length === 0 && (
          <div className="mytasks-empty">{t('No tasks with dates. Add a start or due date.')}</div>
        )}
        {tasksWithDates.length > 0 && (
          <div className="gantt-wrapper">
            {/* Header: week labels */}
            <div className="gantt-header">
              <div className="gantt-label-col" />
              <div className="gantt-timeline-col" style={{ position: 'relative' }}>
                {weeks.map((w) => (
                  <span key={w.toISOString()} className="gantt-week-label"
                    style={{ left: `${(daysDiff(rangeStart, w) / totalDays) * 100}%` }}>
                    {w.toLocaleDateString('es', { day: '2-digit', month: 'short' })}
                  </span>
                ))}
                {/* today line */}
                <div className="gantt-today-line" style={{ left: `${(todayOffset / totalDays) * 100}%` }} />
              </div>
            </div>
            {/* Rows */}
            {tasksWithDates.map((task) => (
              <div key={task.id} className="gantt-row">
                <div className="gantt-label-col" title={task.title}>
                  <span className="gantt-task-title">{task.title}</span>
                  <span className="gantt-task-status" style={{ color: STATUS_COLORS[task.status] || '#9aa3ad' }}>
                    {task.status}
                  </span>
                </div>
                <div className="gantt-timeline-col">
                  {/* today line */}
                  <div className="gantt-today-line" style={{ left: `${(todayOffset / totalDays) * 100}%` }} />
                  {(task.startDate || task.dueDate) && (
                    <div
                      className={`gantt-bar status-${slugStatus(task.status)}`}
                      style={{
                        left: barLeft(task.startDate || task.dueDate),
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
                {VIEW_LABELS[v]}
              </button>
            ))}
          </div>
          <span className="mytasks-count">{myTasks.length}</span>
          <button type="button" className="mytasks-btn-nueva" onClick={openGatekeeper}>
            + {t('New task')}
          </button>
        </div>
      </header>

      {view === 'lista'  && <ListView />}
      {view === 'kanban' && <KanbanView />}
      {view === 'tabla'  && <TablaView />}
      {view === 'gantt'  && <GanttView />}
    </div>
  );
};
