import { useMemo } from 'react';
import { useTasks } from '../context/TasksContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useLanguage } from '../context/LanguageContext';
import './MyTasks.css';

export const MyTasks = () => {
  const { tasks, updateTaskStatus } = useTasks();
  const { user } = useCurrentUser();
  const { t } = useLanguage();

  const myTasks = useMemo(
    () => tasks.filter((task) => task.assigneeId === user?.id),
    [tasks, user?.id]
  );

  return (
    <div className="mytasks-container">
      <header className="mytasks-header">
        <div>
          <h1>{t('My Tasks')}</h1>
          <p>{t('Assigned to you')}</p>
        </div>
        <span className="mytasks-count">{myTasks.length}</span>
      </header>

      <section className="mytasks-list">
        {myTasks.length === 0 ? (
          <div className="mytasks-empty">{t('No tasks assigned.')}</div>
        ) : (
          myTasks.map((task) => (
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
          ))
        )}
      </section>
    </div>
  );
};
