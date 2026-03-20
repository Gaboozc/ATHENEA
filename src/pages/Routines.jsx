/* ROUTINES-2: Página de gestión de rutinas */
import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addRoutine,
  deleteRoutine,
  updateRoutine,
  addRoutineTask,
  updateRoutineTask,
  deleteRoutineTask,
  toggleRoutineToday,
} from '../../store/slices/routinesSlice';
import { useLanguage } from '../context/LanguageContext';
import './Routines.css';

const WEEK_DAYS = [
  { value: 0, label: 'Dom' },
  { value: 1, label: 'Lun' },
  { value: 2, label: 'Mar' },
  { value: 3, label: 'Mié' },
  { value: 4, label: 'Jue' },
  { value: 5, label: 'Vie' },
  { value: 6, label: 'Sáb' },
];

const todayIndex = new Date().getDay();
const todayKey = new Date().toISOString().slice(0, 10);

/* Genera las 7 fechas de la semana actual (Lun-Dom) */
const getThisWeekDates = () => {
  const today = new Date();
  const day = today.getDay();
  const monday = new Date(today);
  monday.setDate(today.getDate() - (day === 0 ? 6 : day - 1));
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(monday);
    d.setDate(monday.getDate() + i);
    return { dateStr: d.toISOString().slice(0, 10), dayIndex: d.getDay() };
  });
};
const THIS_WEEK = getThisWeekDates();

const fmtTime = (t) => t || '--:--';

export const Routines = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const { routines } = useSelector((state) => state.routines);

  /* ── Nueva rutina form ── */
  const [showNewForm, setShowNewForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDays, setNewDays] = useState([0, 1, 2, 3, 4, 5, 6]);

  /* ── Tarea inline form — keyed by routineId ── */
  const [taskFormFor, setTaskFormFor] = useState(null);
  const [taskForm, setTaskForm] = useState({ name: '', startTime: '08:00', endTime: '09:00' });

  /* ── Edición inline de rutina ── */
  const [editingRoutineId, setEditingRoutineId] = useState(null);
  const [editingTitle, setEditingTitle] = useState('');

  /* ── Filter: hoy / todas ── */
  const [showAll, setShowAll] = useState(false);

  const visibleRoutines = useMemo(
    () =>
      showAll
        ? routines
        : routines.filter((r) => (r.daysOfWeek || []).includes(todayIndex)),
    [routines, showAll]
  );

  const handleAddRoutine = () => {
    if (!newTitle.trim()) return;
    dispatch(addRoutine({ title: newTitle.trim(), daysOfWeek: newDays }));
    setNewTitle('');
    setNewDays([0, 1, 2, 3, 4, 5, 6]);
    setShowNewForm(false);
  };

  const handleAddTask = (routineId) => {
    if (!taskForm.name.trim()) return;
    dispatch(addRoutineTask({ routineId, task: { ...taskForm } }));
    setTaskForm({ name: '', startTime: '08:00', endTime: '09:00' });
    setTaskFormFor(null);
  };

  const handleDeleteTask = (routineId, taskId) => {
    dispatch(deleteRoutineTask({ routineId, taskId }));
  };

  const toggleDay = (day, setter, current) => {
    setter(current.includes(day) ? current.filter((d) => d !== day) : [...current, day]);
  };

  /* Request notification permission on first interaction */
  const requestNotifPerm = () => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  };

  return (
    <div className="routines-container">
      <header className="routines-header">
        <div>
          <h1>{t('Mis Rutinas')}</h1>
          <p>{t('Gestiona tus listas de rutinas con horarios y alarmas automáticas.')}</p>
        </div>
        <div className="routines-header-actions">
          <button
            className={`routines-filter-btn${!showAll ? ' active' : ''}`}
            onClick={() => setShowAll(false)}
          >
            {t('Hoy')}
          </button>
          <button
            className={`routines-filter-btn${showAll ? ' active' : ''}`}
            onClick={() => setShowAll(true)}
          >
            {t('Todas')}
          </button>
          <button
            className="routines-new-btn"
            onClick={() => { setShowNewForm((v) => !v); requestNotifPerm(); }}
          >
            + {t('Nueva Rutina')}
          </button>
        </div>
      </header>

      {/* ── Formulario nueva rutina ── */}
      {showNewForm && (
        <div className="routines-new-form">
          <input
            autoFocus
            className="routines-input"
            placeholder={t('Nombre de la rutina…')}
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') handleAddRoutine(); if (e.key === 'Escape') setShowNewForm(false); }}
          />
          <div className="routines-days-row">
            {WEEK_DAYS.map((d) => (
              <button
                key={d.value}
                type="button"
                className={`routines-day-chip${newDays.includes(d.value) ? ' active' : ''}`}
                onClick={() => toggleDay(d.value, setNewDays, newDays)}
              >
                {d.label}
              </button>
            ))}
          </div>
          <div className="routines-form-actions">
            <button className="routines-btn-primary" onClick={handleAddRoutine}>{t('Crear')}</button>
            <button className="routines-btn-cancel" onClick={() => setShowNewForm(false)}>{t('Cancelar')}</button>
          </div>
        </div>
      )}

      {/* ── Lista de rutinas ── */}
      {visibleRoutines.length === 0 ? (
        <div className="routines-empty">
          {showAll ? t('No hay rutinas creadas.') : t('No hay rutinas para hoy.')}
        </div>
      ) : (
        <div className="routines-grid">
          {visibleRoutines.map((routine) => {
            const completedArr = routine.completedDates || [];
            const doneToday = completedArr.includes(todayKey);
            const tasks = (routine.tasks || []);
            const isToday = (routine.daysOfWeek || []).includes(todayIndex);

            return (
              <div key={routine.id} className={`routine-card${doneToday ? ' is-done' : ''}${isToday ? ' is-today' : ''}`}>
                {/* Cabecera de tarjeta */}
                <div className="routine-card-header">
                  <div className="routine-card-title-row">
                    {editingRoutineId === routine.id ? (
                      <input
                        className="routines-input routine-title-input"
                        value={editingTitle}
                        autoFocus
                        onChange={(e) => setEditingTitle(e.target.value)}
                        onBlur={() => {
                          if (editingTitle.trim()) dispatch(updateRoutine({ id: routine.id, title: editingTitle.trim() }));
                          setEditingRoutineId(null);
                        }}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') e.target.blur();
                          if (e.key === 'Escape') setEditingRoutineId(null);
                        }}
                      />
                    ) : (
                      <h2
                        className="routine-title"
                        title={t('Click para editar')}
                        onClick={() => { setEditingRoutineId(routine.id); setEditingTitle(routine.title); }}
                      >
                        {routine.title}
                        {routine.streak > 0 && <span className="routine-streak">🔥{routine.streak}</span>}
                      </h2>
                    )}
                  </div>

                  {/* Días de la semana — clickeables para editar */}
                  <div className="routine-days-chips">
                    {WEEK_DAYS.map((d) => {
                      const isActive = (routine.daysOfWeek || []).includes(d.value);
                      return (
                        <button
                          key={d.value}
                          type="button"
                          title={isActive ? t('Click para quitar este día') : t('Click para añadir este día')}
                          className={`routine-day-chip routine-day-chip--btn${isActive ? ' active' : ''}${d.value === todayIndex ? ' is-today-chip' : ''}`}
                          onClick={() => {
                            const current = routine.daysOfWeek || [];
                            const next = isActive
                              ? current.filter((x) => x !== d.value)
                              : [...current, d.value];
                            dispatch(updateRoutine({ id: routine.id, daysOfWeek: next }));
                          }}
                        >
                          {d.label}
                        </button>
                      );
                    })}
                  </div>

                  {/* Mini vista semanal — qué días se completó esta semana */}
                  <div className="routine-week-track">
                    <span className="routine-week-label">{t('Esta semana:')}</span>
                    {THIS_WEEK.map(({ dateStr, dayIndex }) => {
                      const applies = (routine.daysOfWeek || []).includes(dayIndex);
                      const done = completedArr.includes(dateStr);
                      const isToday2 = dateStr === todayKey;
                      return (
                        <span
                          key={dateStr}
                          className={`routine-week-dot${done ? ' done' : ''}${!applies ? ' skip' : ''}${isToday2 ? ' today' : ''}`}
                          title={`${WEEK_DAYS.find(w => w.value === dayIndex)?.label} ${dateStr}${done ? ' ✓' : ''}`}
                        >
                          {done ? '✓' : applies ? '·' : '—'}
                        </span>
                      );
                    })}
                  </div>

                  <div className="routine-card-controls">
                    {isToday && (
                      <button
                        className={`routine-toggle-btn${doneToday ? ' is-done' : ''}`}
                        onClick={() => dispatch(toggleRoutineToday({ id: routine.id }))}
                      >
                        {doneToday ? '✓ Completada hoy' : t('Marcar hecha hoy')}
                      </button>
                    )}
                    <button
                      className="routine-delete-btn"
                      onClick={() => { if (confirm(t('¿Eliminar esta rutina?'))) dispatch(deleteRoutine(routine.id)); }}
                    >
                      ×
                    </button>
                  </div>
                </div>

                {/* Lista de tareas */}
                <div className="routine-tasks">
                  {tasks.length === 0 ? (
                    <p className="routine-tasks-empty">{t('Sin tareas. Añade una para activar las alarmas.')}</p>
                  ) : (
                    <ul className="routine-task-list">
                      {tasks.map((task) => (
                        <li key={task.id} className="routine-task-row">
                          <span className="routine-task-time">
                            {fmtTime(task.startTime)}
                            <span className="routine-task-time-sep">→</span>
                            {fmtTime(task.endTime)}
                          </span>
                          <span className="routine-task-name">{task.name}</span>
                          <button
                            className="routine-task-delete"
                            onClick={() => handleDeleteTask(routine.id, task.id)}
                            title={t('Eliminar tarea')}
                          >
                            ×
                          </button>
                        </li>
                      ))}
                    </ul>
                  )}

                  {/* Formulario inline de nueva tarea */}
                  {taskFormFor === routine.id ? (
                    <div className="routine-task-form">
                      <input
                        autoFocus
                        className="routines-input routine-task-name-input"
                        placeholder={t('Nombre de la tarea…')}
                        value={taskForm.name}
                        onChange={(e) => setTaskForm((f) => ({ ...f, name: e.target.value }))}
                        onKeyDown={(e) => { if (e.key === 'Escape') setTaskFormFor(null); }}
                      />
                      <div className="routine-task-times">
                        <label>
                          <span>{t('Inicio')}</span>
                          <input
                            type="time"
                            className="routines-input routine-time-input"
                            value={taskForm.startTime}
                            onChange={(e) => setTaskForm((f) => ({ ...f, startTime: e.target.value }))}
                          />
                        </label>
                        <label>
                          <span>{t('Fin')}</span>
                          <input
                            type="time"
                            className="routines-input routine-time-input"
                            value={taskForm.endTime}
                            onChange={(e) => setTaskForm((f) => ({ ...f, endTime: e.target.value }))}
                          />
                        </label>
                      </div>
                      <div className="routines-form-actions">
                        <button className="routines-btn-primary" onClick={() => handleAddTask(routine.id)}>
                          {t('Añadir')}
                        </button>
                        <button className="routines-btn-cancel" onClick={() => setTaskFormFor(null)}>
                          {t('Cancelar')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button
                      className="routine-add-task-btn"
                      onClick={() => { setTaskFormFor(routine.id); setTaskForm({ name: '', startTime: '08:00', endTime: '09:00' }); }}
                    >
                      + {t('Añadir tarea')}
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Nota sobre alarmas */}
      <p className="routines-alarm-note">
        🔔 {t('Las alarmas se activan automáticamente a la hora de inicio y fin de cada tarea. Asegúrate de dar permiso de notificaciones.')}
      </p>
    </div>
  );
};
