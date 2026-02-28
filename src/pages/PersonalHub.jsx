import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { addRoutine, toggleRoutineToday } from '../store/slices/routinesSlice';
import './PersonalHub.css';

export const PersonalHub = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const { notes } = useSelector((state) => state.notes);
  const { todos } = useSelector((state) => state.todos);
  const { routines } = useSelector((state) => state.routines);
  const [routineTitle, setRoutineTitle] = useState('');
  const [routineDays, setRoutineDays] = useState([1, 2, 3, 4, 5]);

  const weekDays = [
    { value: 0, label: 'Sun' },
    { value: 1, label: 'Mon' },
    { value: 2, label: 'Tue' },
    { value: 3, label: 'Wed' },
    { value: 4, label: 'Thu' },
    { value: 5, label: 'Fri' },
    { value: 6, label: 'Sat' },
  ];

  const recentNotes = useMemo(() => {
    return [...(notes || [])].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 3);
  }, [notes]);

  const pendingTodos = useMemo(() => {
    return (todos || []).filter((todo) => todo.status !== 'done').slice(0, 5);
  }, [todos]);

  const upcomingReminders = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const items = [
      ...(notes || [])
        .filter((note) => note.reminderDate)
        .map((note) => ({
          id: note.id,
          title: note.title,
          date: new Date(note.reminderDate),
        })),
      ...(todos || [])
        .filter((todo) => todo.dueDate && todo.status !== 'done')
        .map((todo) => ({
          id: todo.id,
          title: todo.title,
          date: new Date(todo.dueDate),
        })),
    ];
    return items
      .filter((item) => !Number.isNaN(item.date.getTime()))
      .map((item) => {
        item.date.setHours(0, 0, 0, 0);
        return item;
      })
      .filter((item) => (item.date - today) / 86400000 <= 7)
      .sort((a, b) => a.date - b.date)
      .slice(0, 5);
  }, [notes, todos]);

  const todayKey = new Date().toISOString().split('T')[0];
  const todayIndex = new Date().getDay();

  const routinesToday = useMemo(() => {
    return (routines || []).filter((routine) =>
      (routine.daysOfWeek || []).includes(todayIndex)
    );
  }, [routines, todayIndex]);

  const formatDays = (days) =>
    (days || []).map((day) => t(weekDays[day]?.label || '')).join(', ');

  const handleAddRoutine = (event) => {
    event.preventDefault();
    if (!routineTitle.trim()) return;
    const days = routineDays.length ? routineDays : [todayIndex];
    dispatch(addRoutine({ title: routineTitle.trim(), frequency: 'custom', daysOfWeek: days }));
    setRoutineTitle('');
  };

  return (
    <div className="personalhub-container">
      <header className="personalhub-header">
        <div>
          <h1>{t('Personal Hub')}</h1>
          <p>{t('Capture and organize your personal workflow.')}</p>
        </div>
      </header>

      <section className="personalhub-actions">
        <button onClick={() => navigate('/inbox')}>{t('Go to Inbox')}</button>
        <button onClick={() => navigate('/notes')}>{t('Go to Notes')}</button>
        <button onClick={() => navigate('/todos')}>{t('Go to Todos')}</button>
        <button onClick={() => navigate('/calendar')}>{t('Go to Calendar')}</button>
      </section>

      <section className="personalhub-grid">
        <div className="personalhub-card">
          <h2>{t('Recent Notes')}</h2>
          {recentNotes.length === 0 ? (
            <div className="personalhub-empty">{t('No notes yet.')}</div>
          ) : (
            <ul>
              {recentNotes.map((note) => (
                <li key={note.id}>{note.title}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="personalhub-card">
          <h2>{t('Pending Todos')}</h2>
          {pendingTodos.length === 0 ? (
            <div className="personalhub-empty">{t('No todos yet.')}</div>
          ) : (
            <ul>
              {pendingTodos.map((todo) => (
                <li key={todo.id}>{todo.title}</li>
              ))}
            </ul>
          )}
        </div>
        <div className="personalhub-card">
          <h2>{t('Upcoming Reminders')}</h2>
          {upcomingReminders.length === 0 ? (
            <div className="personalhub-empty">{t('No upcoming reminders.')}</div>
          ) : (
            <ul>
              {upcomingReminders.map((item) => (
                <li key={item.id}>
                  <span>{item.title}</span>
                  <span className="personalhub-date">{item.date.toLocaleDateString()}</span>
                </li>
              ))}
            </ul>
          )}
        </div>
        <div className="personalhub-card">
          <h2>{t('Daily Routines')}</h2>
          <form className="personalhub-form" onSubmit={handleAddRoutine}>
            <input
              type="text"
              value={routineTitle}
              onChange={(e) => setRoutineTitle(e.target.value)}
              placeholder={t('New routine')}
            />
            <div className="personalhub-days">
              {weekDays.map((day) => (
                <label
                  key={day.value}
                  className={`personalhub-day${routineDays.includes(day.value) ? ' is-active' : ''}`}
                >
                  <input
                    type="checkbox"
                    checked={routineDays.includes(day.value)}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setRoutineDays((prev) => [...prev, day.value]);
                      } else {
                        setRoutineDays((prev) => prev.filter((item) => item !== day.value));
                      }
                    }}
                  />
                  {t(day.label)}
                </label>
              ))}
            </div>
            <button type="submit">{t('Add')}</button>
          </form>
          {routinesToday.length === 0 ? (
            <div className="personalhub-empty">{t('No routines today.')}</div>
          ) : (
            <ul>
              {routinesToday.slice(0, 6).map((routine) => {
                const doneToday = routine.lastCompleted === todayKey;
                return (
                  <li key={routine.id} className={doneToday ? 'is-done' : ''}>
                    <div>
                      <span>{routine.title}</span>
                      <span className="personalhub-days-label">{formatDays(routine.daysOfWeek)}</span>
                    </div>
                    <button
                      type="button"
                      className="personalhub-toggle"
                      onClick={() => dispatch(toggleRoutineToday({ id: routine.id }))}
                    >
                      {doneToday ? t('Done') : t('Mark')}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  );
};
