import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import { addTodo, deleteTodo, setTodoProgress, setTodoStatus, updateTodo } from '../../store/slices/todosSlice'; /* P-FIX-2 */
import { linkTodoToCalendar, unlinkFromCalendar } from '../../store/slices/calendarSlice';
import './Todos.css';

const PROGRESS_STEPS = [0, 25, 50, 75, 100];

export const Todos = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const { todos } = useSelector((state) => state.todos);
  const [formData, setFormData] = useState({ title: '', notes: '', dueDate: '', priority: 'normal' });
  /* P-FIX-2: inline title editing state */
  const [editingId, setEditingId] = useState(null);
  const [editValue, setEditValue] = useState('');

  const sortedTodos = useMemo(() => {
    return [...todos].sort((a, b) => {
      if (a.status !== b.status) return a.status === 'done' ? 1 : -1;
      if (a.dueDate && b.dueDate) return new Date(a.dueDate) - new Date(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return new Date(b.updatedAt) - new Date(a.updatedAt);
    });
  }, [todos]);

  const handleAddTodo = (event) => {
    event.preventDefault();
    const newId = `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    dispatch(addTodo({ id: newId, ...formData, dueDate: formData.dueDate || null }));
    if (formData.dueDate) {
      dispatch(linkTodoToCalendar({ todoId: newId, todoTitle: formData.title, dueDate: formData.dueDate }));
    }
    setFormData({ title: '', notes: '', dueDate: '', priority: 'normal' });
  };

  const handleToggleDone = (todo) => {
    const nextStatus = todo.status === 'done' ? 'pending' : 'done';
    dispatch(setTodoStatus({ id: todo.id, status: nextStatus }));
  };

  const handleDelete = (todo) => {
    if (confirm(t('Delete this todo?'))) {
      dispatch(deleteTodo(todo.id));
      dispatch(unlinkFromCalendar({ relatedId: todo.id, relatedType: 'todo' }));
    }
  };

  const handleProgress = (todo, progress) => {
    dispatch(setTodoProgress({ id: todo.id, progress }));
  };

  /* P-FIX-2: inline title edit handlers */
  const handleEditStart = (todo) => {
    setEditingId(todo.id);
    setEditValue(todo.title);
  };

  const handleEditCommit = (todo) => {
    const trimmed = editValue.trim();
    if (trimmed && trimmed !== todo.title) {
      dispatch(updateTodo({ id: todo.id, title: trimmed }));
    }
    setEditingId(null);
    setEditValue('');
  };

  const handleEditKeyDown = (e, todo) => {
    if (e.key === 'Enter') handleEditCommit(todo);
    if (e.key === 'Escape') { setEditingId(null); setEditValue(''); }
  };

  return (
    <div className="todos-container">
      <header className="todos-header">
        <div>
          <h1>{t('Todo List')}</h1>
          <p>{t('Track your progress in small steps.')}</p>
        </div>
        <span className="todos-count">{todos.length}</span>
      </header>

      <form className="todos-form" onSubmit={handleAddTodo}>
        <input
          type="text"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder={t('What needs to be done?')}
          required
        />
        <input
          type="date"
          value={formData.dueDate}
          onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
        />
        <select
          value={formData.priority}
          onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
        >
          <option value="low">{t('Low')}</option>
          <option value="normal">{t('Normal')}</option>
          <option value="high">{t('High')}</option>
        </select>
        <button type="submit">{t('Add Todo')}</button>
      </form>

      <section className="todos-list">
        {sortedTodos.length === 0 ? (
          <div className="todos-empty">{t('No todos yet.')}</div>
        ) : (
          sortedTodos.map((todo) => (
            <article key={todo.id} className={`todo-card${todo.status === 'done' ? ' done' : ''}`}>
              <div className="todo-card-header">
                <div>
                  {/* P-FIX-2: clickable title for inline editing */}
                  {editingId === todo.id ? (
                    <input
                      className="todo-title-edit"
                      value={editValue}
                      autoFocus
                      onChange={(e) => setEditValue(e.target.value)}
                      onBlur={() => handleEditCommit(todo)}
                      onKeyDown={(e) => handleEditKeyDown(e, todo)}
                    />
                  ) : (
                    <h2
                      className="todo-title-clickable"
                      title={t('Click to edit')}
                      onClick={() => handleEditStart(todo)}
                    >
                      {todo.title}
                    </h2>
                  )}
                  {/* P-FIX-2: priority badge */}
                  {todo.priority && todo.priority !== 'normal' && (
                    <span className={`todo-priority-badge priority-${todo.priority}`}>
                      {todo.priority === 'high' ? `\u2191 ${t('Alta')}` : `\u2193 ${t('Baja')}`}
                    </span>
                  )}
                  {todo.dueDate && (
                    <span className="todo-date">{new Date(todo.dueDate).toLocaleDateString()}</span>
                  )}
                </div>
                <div className="todo-actions">
                  <button type="button" onClick={() => handleToggleDone(todo)}>
                    {todo.status === 'done' ? t('Reopen') : t('Done')}
                  </button>
                  <button type="button" className="danger" onClick={() => handleDelete(todo)}>
                    {t('Delete')}
                  </button>
                </div>
              </div>

              {todo.notes && <p className="todo-notes">{todo.notes}</p>}

              <div className="todo-progress">
                <span>{t('Progress')}</span>
                <div className="todo-progress-buttons">
                  {PROGRESS_STEPS.map((step) => (
                    <button
                      key={step}
                      type="button"
                      className={todo.progress === step ? 'active' : ''}
                      onClick={() => handleProgress(todo, step)}
                    >
                      {step}%
                    </button>
                  ))}
                </div>
              </div>
            </article>
          ))
        )}
      </section>
    </div>
  );
};
