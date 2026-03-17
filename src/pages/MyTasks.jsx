import { useMemo } from 'react';
import { useTasks } from '../context/TasksContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useLanguage } from '../context/LanguageContext';
import LazyList from '../components/LazyList';
import './MyTasks.css';

export const MyTasks = () => {
  const { tasks, updateTaskStatus } = useTasks();
  const { user } = useCurrentUser();
  const { t } = useLanguage();

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
                  <div>
                    <h2>{task.title}</h2>
                    {task.projectName && (
                      <span className="mytasks-project">{task.projectName}</span>
                    )}
                  </div>
                  <span className="mytasks-status">{task.status || t('Active')}</span>
                </div>
                {task.description && <p className="mytasks-desc">{task.description}</p>}
                <div className="mytasks-meta">
                  {task.level && <span className="mytasks-pill">{task.level}</span>}
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
