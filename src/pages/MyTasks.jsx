import { useMemo, useState } from 'react';
import { useTasks } from '../context/TasksContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useLanguage } from '../context/LanguageContext';
import LazyList from '../components/LazyList';
import './MyTasks.css';

const LEVEL_CYCLE = ['Critical', 'High Velocity', 'Steady Flow', 'Low Friction', 'Backlog'];

export const MyTasks = () => {
  const { tasks, updateTaskStatus, updateTask } = useTasks();
  const { user } = useCurrentUser();
  const { t } = useLanguage();
  const [editingId, setEditingId] = useState(null); /* W-FEAT-5 */
  const [editValue, setEditValue] = useState('');

  const myTasks = useMemo(
    () =>
      tasks.filter(
        (task) => task.assigneeId === user?.id && task.status !== 'pending_approval'
      ),
    [tasks, user?.id]
  );

  /* FIX UX-1 — exponer GatekeeperModal */
  const openGatekeeper = () =>
    window.dispatchEvent(new CustomEvent('athenea:gatekeeper:open'));

  const startEdit = (task) => { /* W-FEAT-5 */
    setEditingId(task.id);
    setEditValue(task.title);
  };

  const commitEdit = (taskId) => { /* W-FEAT-5 */
    const trimmed = editValue.trim();
    if (trimmed && trimmed.length >= 3) {
      updateTask(taskId, { title: trimmed });
    }
    setEditingId(null);
    setEditValue('');
  };

  const cycleLevel = (task) => { /* W-FEAT-5 */
    const idx = LEVEL_CYCLE.indexOf(task.level || 'Backlog');
    const next = LEVEL_CYCLE[(idx + 1) % LEVEL_CYCLE.length];
    updateTask(task.id, { level: next });
  };

  return (
    <div className="mytasks-container">
      <header className="mytasks-header">
        <div>
          <h1>{t('My Tasks')}</h1>
          <p>{t('Assigned to you')}</p>
        </div>
        <div className="mytasks-header-actions">
          <span className="mytasks-count">{myTasks.length}</span>
          <button
            type="button"
            className="mytasks-btn-nueva"
            onClick={openGatekeeper}
          >
            + {t('Nueva Tarea')}
          </button>
        </div>
      </header>

      <section className="mytasks-list">
        {myTasks.length === 0 ? (
          <div className="mytasks-empty">{t('No tasks assigned.')}</div>
        ) : (
          <LazyList
            items={myTasks}
            renderItem={(task) => (
              <article key={task.id} className="mytasks-card">
                <div className="mytasks-card-header">
                  <div className="mytasks-title-area">
                    {editingId === task.id ? ( /* W-FEAT-5 */
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
                      <h2
                        className="mytasks-title-editable"
                        title={t('Click to edit')}
                        onClick={() => startEdit(task)}
                      >
                        {task.title}
                      </h2>
                    )}
                    {task.projectName && (
                      <span className="mytasks-project">{task.projectName}</span>
                    )}
                    {task.dueDate && ( /* W-FEAT-5: show due date */
                      <span className="mytasks-due">
                        📅 {new Date(task.dueDate).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                  <span className="mytasks-status">{task.status || t('Active')}</span>
                </div>
                {task.description && <p className="mytasks-desc">{task.description}</p>}
                <div className="mytasks-meta">
                  {task.level && (
                    <span /* W-FEAT-5: click to cycle level */
                      className="mytasks-pill mytasks-level-badge"
                      title={t('Click to change level')}
                      onClick={() => cycleLevel(task)}
                      style={{ cursor: 'pointer' }}
                    >
                      {task.level}
                    </span>
                  )}
                  {Array.isArray(task.workstreams) &&
                    task.workstreams.map((stream) => (
                      <span key={stream} className="mytasks-pill">
                        {stream}
                      </span>
                    ))}
                </div>
                <div className="mytasks-actions">
                  <button
                    type="button"
                    className={`mytasks-action${task.status === 'In Progress' ? ' is-active' : ''}`}
                    onClick={() => updateTaskStatus(task.id, 'In Progress')}
                  >
                    {t('In Progress')}
                  </button>
                  <button
                    type="button"
                    className={`mytasks-action${task.status === 'Completed' ? ' is-active' : ''}`}
                    onClick={() => updateTaskStatus(task.id, 'Completed')}
                  >
                    {t('Completed')}
                  </button>
                </div>
              </article>
            )}
            itemHeight={180}
            emptyMessage={t('No tasks assigned.')}
          />
        )}
      </section>
    </div>
  );
};
