import { useState, useMemo, useCallback, useEffect } from 'react';
import useModalClose from '../hooks/useModalClose'; /* FIX UX-9 */
import { useDispatch, useSelector } from 'react-redux';
import { addEvent, updateEvent, deleteEvent, syncExternalEvents } from '../../store/slices/calendarSlice';
import { addNote } from '../../store/slices/notesSlice';
import { addTodo } from '../../store/slices/todosSlice';
import { addExpense } from '../../store/slices/budgetSlice';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useAgentCalendar } from '../hooks/useAgentCalendar';
import { useGoogleCalendar } from '../hooks/useGoogleCalendar';
import { selectFinancialSnapshot } from '../store/selectors/financialSelectors';
import { showToast } from '../components/Toast/Toast';
import './Calendar.css';

const DAYS_OF_WEEK = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

const EVENT_COLORS = [
  { value: '#1ec9ff', label: 'Blue' },
  { value: '#22c55e', label: 'Green' },
  { value: '#f59e0b', label: 'Orange' },
  { value: '#ef4444', label: 'Red' },
  { value: '#a855f7', label: 'Purple' },
  { value: '#ec4899', label: 'Pink' },
];

const EVENT_TYPES = [
  { value: 'event', label: 'Event' },
  { value: 'deadline', label: 'Deadline' },
  { value: 'meeting', label: 'Meeting' },
  { value: 'reminder', label: 'Reminder' },
  { value: 'note', label: 'Note' },
  { value: 'todo', label: 'Todo' },
  { value: 'payment', label: 'Payment' },
];

const EVENT_ICONS = {
  event: '📌',
  deadline: '⏰',
  meeting: '🗓️',
  reminder: '🔔',
  note: '📝',
  todo: '✅',
  payment: '💳',
  task: '🎯',
};

export const Calendar = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { events } = useSelector((state) => state.calendar);
  
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingEvent, setEditingEvent] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    startTime: '',
    endDate: '',
    endTime: '',
    allDay: true,
    color: '#1ec9ff',
    type: 'event',
  });

  // ── Agent-aware calendar overlay ─────────────────────────────────────────
  const agentDayMeta = useAgentCalendar();
  const financialSnapshot = useSelector(selectFinancialSnapshot);

  // Google Calendar sync
  const { isConnected: gcalConnected, login: gcalLogin, disconnect: gcalDisconnect, sync: gcalSync, lastSyncAt } = useGoogleCalendar();

  // CAL-FIX-2: Track Google calendar sync errors
  const syncStatus = useSelector((s) => s.calendar.externalSyncStatus);
  const syncError  = useSelector((s) => s.calendar.externalSyncError);

  useEffect(() => {
    if (syncStatus === 'failed' && syncError) {
      showToast(
        'No se pudo sincronizar Google Calendar. Revisa tu conexión o vuelve a conectar.',
        'error',
        5000
      );
    }
  }, [syncStatus, syncError]);

  // Separate state: day detail modal (intelligence report)
  const [showDayDetail, setShowDayDetail] = useState(false);
  const [viewMode, setViewMode] = useState('month'); /* CAL-FEAT-4 */
  const [hubFilter, setHubFilter] = useState('all'); /* CAL-FEAT-5 */

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const formatDateLabel = (date) => {
    if (!date) return '';
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const daysInMonth = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const lastDate = new Date(year, month + 1, 0).getDate();
    const prevLastDate = new Date(year, month, 0).getDate();
    
    const days = [];
    
    // Previous month days
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        date: prevLastDate - i,
        isCurrentMonth: false,
        fullDate: new Date(year, month - 1, prevLastDate - i),
      });
    }
    
    // Current month days
    for (let i = 1; i <= lastDate; i++) {
      days.push({
        date: i,
        isCurrentMonth: true,
        fullDate: new Date(year, month, i),
      });
    }
    
    // Next month days
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      days.push({
        date: i,
        isCurrentMonth: false,
        fullDate: new Date(year, month + 1, i),
      });
    }
    
    return days;
  }, [year, month]);

  // CAL-FEAT-5: Hub-filtered events
  const HUB_TYPE_MAP = {
    work:     ['deadline', 'meeting', 'task'],
    personal: ['event', 'reminder', 'note', 'routine'],
    finance:  ['payment', 'goal'],
  };
  const filteredEvents = useMemo(() => {
    if (hubFilter === 'all') return events;
    const allowed = HUB_TYPE_MAP[hubFilter] || [];
    return events.filter((ev) => allowed.includes(ev.type) || ev.hub === hubFilter);
  }, [events, hubFilter]);

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return filteredEvents.filter((event) => {
      const eventStart = new Date(event.startDate).toISOString().split('T')[0];
      const eventEnd = new Date(event.endDate).toISOString().split('T')[0];
      return dateStr >= eventStart && dateStr <= eventEnd;
    });
  };

  const handlePrevMonth = () => {
    setCurrentDate(new Date(year, month - 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(year, month + 1));
  };

  const handleToday = () => {
    setCurrentDate(new Date());
  };

  const handleDateClick = (day) => {
    setSelectedDate(day.fullDate);
    setShowDayDetail(true);
  };

  const handleOpenCreateForm = useCallback((date) => {
    const d = date || selectedDate || new Date();
    const dateStr = d.toISOString().split('T')[0];
    setSelectedDate(d);
    setEditingEvent(null);
    setFormData({
      title: '',
      description: '',
      startDate: dateStr,
      startTime: '09:00',
      endDate: dateStr,
      endTime: '10:00',
      allDay: true,
      color: '#1ec9ff',
      type: 'event',
    });
    setShowDayDetail(false);
    setShowModal(true);
  }, [selectedDate]);

  const handleEditEvent = (event, triggerEvent) => {
    triggerEvent?.stopPropagation?.();
    setEditingEvent(event.id);
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);
    setSelectedDate(startDate);
    setFormData({
      title: event.title,
      description: event.description,
      startDate: startDate.toISOString().split('T')[0],
      startTime: startDate.toTimeString().slice(0, 5),
      endDate: endDate.toISOString().split('T')[0],
      endTime: endDate.toTimeString().slice(0, 5),
      allDay: event.allDay,
      color: event.color,
      type: event.type,
    });
    setShowDayDetail(false);
    setShowModal(true);
  };

  const handleDeleteEvent = (eventId, triggerEvent) => {
    triggerEvent?.stopPropagation?.();
    if (confirm(t('Delete this event?'))) {
      dispatch(deleteEvent(eventId));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    const startDateTime = formData.allDay
      ? new Date(formData.startDate).toISOString()
      : new Date(`${formData.startDate}T${formData.startTime}`).toISOString();
    
    const endDateTime = formData.allDay
      ? new Date(formData.endDate).toISOString()
      : new Date(`${formData.endDate}T${formData.endTime}`).toISOString();
    
    if (editingEvent) {
      dispatch(updateEvent({
        id: editingEvent,
        title: formData.title,
        description: formData.description,
        startDate: startDateTime,
        endDate: endDateTime,
        allDay: formData.allDay,
        color: formData.color,
        type: formData.type,
      }));
    } else {
      dispatch(addEvent({
        title: formData.title,
        description: formData.description,
        startDate: startDateTime,
        endDate: endDateTime,
        allDay: formData.allDay,
        color: formData.color,
        type: formData.type,
      }));
    }
    
    setShowModal(false);
    setEditingEvent(null);
  };

  const handleCloseModal = useCallback(() => setShowModal(false), []); /* FIX UX-9 */
  const { handleBackdropClick: handleModalBackdrop } = useModalClose(handleCloseModal); /* FIX UX-9 */

  const handleEventClick = (event) => {
    if (event.relatedType === 'task') {
      navigate('/my-tasks');
    } else if (event.relatedType === 'note') {
      navigate('/notes');
    } else if (event.relatedType === 'todo') {
      navigate('/todos');
    } else if (event.relatedType === 'payment') {
      navigate('/payments');
    } else if (event.relatedType === 'project') {
      navigate(`/projects/${event.relatedId}`);
    }
  };

  const selectedDayEvents = useMemo(() => {
    if (!selectedDate) return [];
    return getEventsForDate(selectedDate).sort(
      (a, b) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime()
    );
  }, [selectedDate, events]);

  // Agent meta for selected day
  const selectedDayMeta = useMemo(() => {
    if (!selectedDate) return null;
    const dateStr = selectedDate.toISOString().split('T')[0];
    return agentDayMeta[dateStr] || null;
  }, [selectedDate, agentDayMeta]);

  // Projected saldo libre: current month saldo libre minus pending payments
  // that fall between today and the selected date (inclusive).
  const projectedSaldoLibre = useMemo(() => {
    if (!selectedDate || !financialSnapshot) return null;
    const todayStr = new Date().toISOString().split('T')[0];
    const selStr   = selectedDate.toISOString().split('T')[0];
    // Sum all pending payment commitments from today up to selectedDate
    let deductions = 0;
    Object.entries(agentDayMeta).forEach(([ds, meta]) => {
      if (ds >= todayStr && ds <= selStr) {
        deductions += (meta.jarvis?.payments || []).reduce(
          (sum, p) => sum + Number(p.amount || 0), 0
        );
      }
    });
    return financialSnapshot.saldoLibre - (selStr > todayStr ? deductions : 0);
  }, [selectedDate, agentDayMeta, financialSnapshot]);

  const todayEvents = getEventsForDate(new Date());

  // Helper: derive background class from agent layers
  const getDayAgentClass = (dateStr) => {
    const meta = agentDayMeta[dateStr];
    if (!meta) return '';
    // Cortana saturation overrides finance tint (workload is most visually significant)
    if (meta.cortana.workloadLevel === 'high')   return 'agent-cortana-saturated';
    if (meta.cortana.workloadLevel === 'medium') return 'agent-cortana-busy';
    if (meta.jarvis.pressureLevel === 'high')    return 'fin-has-commitment';
    if (meta.jarvis.pressureLevel === 'low')     return 'fin-low-activity';
    if (meta.activityCount >= 3)                 return 'fin-high-activity';
    if (meta.activityCount >= 1)                 return 'fin-low-activity';
    return '';
  };

  return (
    <div className="calendar-container">
      <header className="calendar-header">
        <div>
          <h1>{t('Calendar')}</h1>
          <p>{t('Manage your events, deadlines, and reminders.')}</p>
        </div>
        <button className="calendar-create-btn" onClick={() => handleOpenCreateForm(null)}>
          {t('New Event')}
        </button>
      </header>

      <div className="calendar-nav">
        <button onClick={handlePrevMonth} className="calendar-nav-btn">‹</button>
        <h2 className="calendar-month-year">
          {MONTHS[month]} {year}
        </h2>
        <button onClick={handleNextMonth} className="calendar-nav-btn">›</button>
        <button onClick={handleToday} className="calendar-today-btn">
          {t('Today')}
        </button>
        {/* CAL-FEAT-4: View toggle */}
        <div className="calendar-view-toggle">
          <button
            className={`cal-view-btn ${viewMode === 'month' ? 'cal-view-btn-active' : ''}`}
            onClick={() => setViewMode('month')}
            title="Vista mensual"
          >🗓️</button>
          <button
            className={`cal-view-btn ${viewMode === 'agenda' ? 'cal-view-btn-active' : ''}`}
            onClick={() => setViewMode('agenda')}
            title="Vista agenda"
          >📋</button>
        </div>
      </div>

      {/* Google Calendar connect / sync bar */}
      <div className="calendar-gcal-bar">
        {gcalConnected ? (
          <>
            <span className="calendar-gcal-status connected">
              📅 Google Calendar conectado
              {lastSyncAt && (
                <span className="calendar-gcal-time">
                  {' · '}última sync {new Date(lastSyncAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              )}
            </span>
            <button
              className="calendar-gcal-btn"
              onClick={gcalSync}
              disabled={syncStatus === 'loading'}
            >
              {syncStatus === 'loading' ? '⏳ Sincronizando…' : '🔄 Sincronizar'}
            </button>
            <button className="calendar-gcal-btn secondary" onClick={gcalDisconnect}>
              Desconectar
            </button>
          </>
        ) : (
          <>
            <span className="calendar-gcal-status">📅 Google Calendar no conectado</span>
            <button className="calendar-gcal-btn primary" onClick={() => gcalLogin()}>
              Conectar Google Calendar
            </button>
          </>
        )}
      </div>

      {/* CAL-FIX-2: Show banner when Google sync fails */}
      {syncStatus === 'failed' && (
        <div className="calendar-sync-error">
          <span>⚠ Sincronización con Google Calendar fallida</span>
          <button onClick={() => gcalLogin()}>
            Reconectar
          </button>
        </div>
      )}

      {/* CAL-FEAT-5: Hub filter toolbar */}
      <div className="calendar-hub-filter">
        {[
          { key: 'all',      icon: '🌐', label: 'Todo'      },
          { key: 'work',     icon: '💼', label: 'Trabajo'   },
          { key: 'personal', icon: '🏠', label: 'Personal' },
          { key: 'finance',  icon: '💰', label: 'Finanzas'  },
        ].map(({ key, icon, label }) => (
          <button
            key={key}
            className={`hub-filter-btn ${hubFilter === key ? 'hub-filter-btn-active' : ''}`}
            onClick={() => setHubFilter(key)}
          >
            {icon} {label}
          </button>
        ))}
      </div>

      {/* CAL-FEAT-4: Month grid (only in month view) */}
      {viewMode === 'month' && (
      <div className="calendar-grid">
        <div className="calendar-weekdays">
          {DAYS_OF_WEEK.map((day) => (
            <div key={day} className="calendar-weekday">
              {t(day)}
            </div>
          ))}
        </div>
        
        <div className="calendar-days">
          {daysInMonth.map((day, index) => {
            const dayEvents = getEventsForDate(day.fullDate);
            const isToday = day.fullDate.toDateString() === new Date().toDateString();
            const dayTypes = [...new Set(dayEvents.map((event) => event.type))].slice(0, 4);
            const dateStr = day.fullDate.toISOString().split('T')[0];
            const agentMeta = agentDayMeta[dateStr];

            return (
              <div
                key={index}
                className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''} ${day.isCurrentMonth ? getDayAgentClass(dateStr) : ''}`}
                onClick={() => handleDateClick(day)}
              >
                <span className="calendar-day-number">{day.date}</span>
                {dayTypes.length > 0 && (
                  <div className="calendar-day-icons">
                    {dayTypes.map((type) => (
                      <span key={type} className="calendar-day-icon" aria-hidden="true">
                        {EVENT_ICONS[type] || '📌'}
                      </span>
                    ))}
                  </div>
                )}
                <div className="calendar-day-events">
                  {dayEvents.slice(0, 4).map((event) => (
                    <button
                      type="button"
                      key={event.id}
                      className="calendar-event-dot"
                      style={{ backgroundColor: event.color }}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDateClick(day);
                      }}
                      aria-label={event.title}
                      title={event.title}
                    >
                      <span className="calendar-event-icon" aria-hidden="true">
                        {EVENT_ICONS[event.type] || '📌'}
                      </span>
                    </button>
                  ))}
                  {dayEvents.length > 4 && (
                    <div className="calendar-more-events">
                      +{dayEvents.length - 4}
                    </div>
                  )}
                </div>

                {/* ── Three-layer Agent Indicator Row ── */}
                {agentMeta && (
                  <div className="cal-agent-indicator-row">
                    {/* Jarvis: payment pressure (blue) */}
                    {agentMeta.jarvis.payments.length > 0 && (
                      <span
                        className="cal-agent-dot jarvis-pressure"
                        title={`Jarvis: ${agentMeta.jarvis.payments.length} pago(s) pendiente(s)`}
                      >💳</span>
                    )}
                    {agentMeta.jarvis.goals.length > 0 && (
                      <span
                        className="cal-agent-dot jarvis-goal"
                        title={`Jarvis: ${agentMeta.jarvis.goals.length} meta(s) con deadline`}
                      >🎯</span>
                    )}
                    {/* Cortana: workload saturation (amber/red) */}
                    {agentMeta.cortana.workloadLevel !== 'none' && (
                      <span
                        className={`cal-agent-dot cortana-work cortana-${agentMeta.cortana.workloadLevel}`}
                        title={`Cortana: carga ${agentMeta.cortana.workloadLevel}`}
                      >📋</span>
                    )}
                    {/* Shodan: habit tracking (green/gray) */}
                    {agentMeta.shodan.routines.length > 0 && (
                      <span
                        className={`cal-agent-dot shodan-habit ${agentMeta.shodan.habitDone ? 'shodan-done' : 'shodan-missed'}`}
                        title={agentMeta.shodan.habitDone ? 'Shodan: hábitos cumplidos ✓' : 'Shodan: hábitos pendientes'}
                      >{agentMeta.shodan.habitDone ? '✓' : '○'}</span>
                    )}
                    {/* Generic finance activity dots */}
                    {agentMeta.activityCount >= 2 && (
                      <span
                        className="cal-fin-dot activity"
                        title={`${agentMeta.activityCount} movimientos financieros`}
                      />
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
      )} {/* end viewMode === 'month' */}

      {/* CAL-FEAT-4: Agenda View */}
      {viewMode === 'agenda' && (
        <AgendaView
          events={filteredEvents}
          agentDayMeta={agentDayMeta}
          onEventEdit={handleEditEvent}
          onEventDelete={handleDeleteEvent}
          onDateClick={(d) => { setSelectedDate(d); setShowDayDetail(true); }}
          t={t}
        />
      )}

      {todayEvents.length > 0 && viewMode === 'month' && (
        <div className="calendar-today-events">
          <h3>{t('Today\'s Events')}</h3>
          <div className="calendar-today-list">
            {todayEvents.map((event) => (
              <div
                key={event.id}
                className="calendar-today-item"
                style={{ borderLeft: `4px solid ${event.color}` }}
              >
                <div className="calendar-today-content">
                  <h4>
                    <span className="calendar-event-icon" aria-hidden="true">
                      {EVENT_ICONS[event.type] || '📌'}
                    </span>
                    {event.title}
                  </h4>
                  {event.description && <p>{event.description}</p>}
                  <span className="calendar-today-time">
                    {event.allDay ? t('All day') : new Date(event.startDate).toLocaleTimeString()}
                  </span>
                </div>
                <div className="calendar-today-actions">
                  <button onClick={(e) => handleEditEvent(event, e)}>✏️</button>
                  <button onClick={(e) => handleDeleteEvent(event.id, e)}>🗑️</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Day Detail Modal (Agent Intelligence Report) ── */}
      {showDayDetail && selectedDate && (
        <DayDetailModal
          date={selectedDate}
          meta={selectedDayMeta}
          events={selectedDayEvents}
          projectedSaldoLibre={projectedSaldoLibre}
          onClose={() => setShowDayDetail(false)}
          onNewEvent={() => handleOpenCreateForm(selectedDate)}
          onEditEvent={handleEditEvent}
          onDeleteEvent={handleDeleteEvent}
          onEventClick={handleEventClick}
          t={t}
        />
      )}

      {showModal && (
        <div className="calendar-modal-overlay" onClick={handleModalBackdrop}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h2>{editingEvent ? t('Edit Event') : t('New Event')}</h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="calendar-form-group">
                <label>{t('Title')}</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder={t('Event title')}
                  required
                />
              </div>
              
              <div className="calendar-form-group">
                <label>{t('Description')}</label>
                <textarea
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder={t('Event description')}
                  rows="3"
                />
              </div>

              <div className="calendar-form-row">
                <div className="calendar-form-group">
                  <label>{t('Type')}</label>
                  <select
                    value={formData.type}
                    onChange={(e) => setFormData({ ...formData, type: e.target.value })}
                  >
                    {EVENT_TYPES.map((type) => (
                      <option key={type.value} value={type.value}>
                        {t(type.label)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="calendar-form-group">
                  <label>{t('Color')}</label>
                  <div className="calendar-color-picker">
                    {EVENT_COLORS.map((color) => (
                      <button
                        key={color.value}
                        type="button"
                        className={`calendar-color-option ${formData.color === color.value ? 'selected' : ''}`}
                        style={{ backgroundColor: color.value }}
                        onClick={() => setFormData({ ...formData, color: color.value })}
                      />
                    ))}
                  </div>
                </div>
              </div>

              <div className="calendar-form-group">
                <label className="calendar-checkbox-label">
                  <input
                    type="checkbox"
                    checked={formData.allDay}
                    onChange={(e) => setFormData({ ...formData, allDay: e.target.checked })}
                  />
                  {t('All day')}
                </label>
              </div>

              <div className="calendar-form-row">
                <div className="calendar-form-group">
                  <label>{t('Start Date')}</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                  {!formData.allDay && (
                    <input
                      type="time"
                      value={formData.startTime}
                      onChange={(e) => setFormData({ ...formData, startTime: e.target.value })}
                      required
                    />
                  )}
                </div>

                <div className="calendar-form-group">
                  <label>{t('End Date')}</label>
                  <input
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                  {!formData.allDay && (
                    <input
                      type="time"
                      value={formData.endTime}
                      onChange={(e) => setFormData({ ...formData, endTime: e.target.value })}
                      required
                    />
                  )}
                </div>
              </div>

              <div className="calendar-form-actions">
                <button type="button" onClick={() => setShowModal(false)}>
                  {t('Cancel')}
                </button>
                <button type="submit">{t('Save')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

// ============================================================================
// CAL-FEAT-4: AgendaView – chronological list of upcoming events
// ============================================================================
const AgendaView = ({ events, agentDayMeta, onEventEdit, onEventDelete, onDateClick, t }) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Group events by date, only future/today events, sorted
  const grouped = useMemo(() => {
    const map = {};
    const sorted = [...events]
      .filter((ev) => {
        const d = new Date(ev.startDate);
        d.setHours(0, 0, 0, 0);
        return d >= today;
      })
      .sort((a, b) => new Date(a.startDate) - new Date(b.startDate));

    sorted.forEach((ev) => {
      const ds = new Date(ev.startDate).toISOString().split('T')[0];
      if (!map[ds]) map[ds] = [];
      map[ds].push(ev);
    });
    return map;
  }, [events]);

  const dateKeys = Object.keys(grouped).sort().slice(0, 60); // max 60 days ahead

  if (dateKeys.length === 0) {
    return (
      <div className="agenda-view agenda-empty">
        <p>No hay eventos próximos.</p>
      </div>
    );
  }

  return (
    <div className="agenda-view">
      {dateKeys.map((ds) => {
        const dateObj = new Date(ds + 'T00:00:00');
        const isToday = ds === today.toISOString().split('T')[0];
        const meta = agentDayMeta[ds];
        return (
          <div key={ds} className={`agenda-day ${isToday ? 'agenda-day-today' : ''}`}>
            <div
              className="agenda-day-header"
              onClick={() => onDateClick(dateObj)}
              role="button"
              tabIndex={0}
              onKeyDown={(e) => e.key === 'Enter' && onDateClick(dateObj)}
            >
              <span className="agenda-day-label">
                {isToday ? '📍 Hoy — ' : ''}
                {dateObj.toLocaleDateString(undefined, { weekday: 'short', day: 'numeric', month: 'short' })}
              </span>
              {meta && meta.cortana.workloadLevel !== 'none' && (
                <span className="agenda-workload-badge">
                  {meta.cortana.workloadLevel === 'high' ? '🔥' : '📋'} {meta.cortana.workloadLevel}
                </span>
              )}
            </div>
            <ul className="agenda-day-events">
              {grouped[ds].map((ev) => (
                <li key={ev.id} className="agenda-event-item" style={{ borderLeftColor: ev.color || '#1ec9ff' }}>
                  <span className="agenda-event-icon">{EVENT_ICONS[ev.type] || '📌'}</span>
                  <span className="agenda-event-title">{ev.title}</span>
                  {!ev.allDay && (
                    <span className="agenda-event-time">
                      {new Date(ev.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  )}
                  <div className="agenda-event-actions">
                    <button type="button" onClick={(e) => onEventEdit(ev, e)} title="Editar">✏️</button>
                    <button type="button" onClick={(e) => onEventDelete(ev.id, e)} title="Eliminar">🗑️</button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </div>
  );
};

// ============================================================================
// DayDetailModal – Multi-Agent Intelligence Report
// ============================================================================

const AGENT_META = {
  Jarvis:  { cls: 'jarvis',  icon: '🤖', label: 'Jarvis',  color: '#0ea5e9' },
  Cortana: { cls: 'cortana', icon: '🟣', label: 'Cortana', color: '#a855f7' },
  Shodan:  { cls: 'shodan',  icon: '🔴', label: 'Shodan',  color: '#ef4444' },
  user:    { cls: 'user',    icon: '👤', label: 'User',    color: '#6b7280' },
};

// Map agenda item type → display metadata
const ITEM_TYPE_META = {
  event:         { icon: '📌', label: 'Evento'          },
  'project-start': { icon: '▶️',  label: 'Inicio de Proyecto' },
  'project-end':   { icon: '🏁', label: 'Fin de Proyecto'    },
  task:          { icon: '✅', label: 'Tarea'           },
  note:          { icon: '📝', label: 'Nota'            },
  todo:          { icon: '📌', label: 'Todo'            },
  routine:       { icon: '🔄', label: 'Rutina'          },
  payment:       { icon: '💳', label: 'Pago'            },
  goal:          { icon: '🎯', label: 'Meta'            },
};

const DayDetailModal = ({
  date, meta, events, projectedSaldoLibre,
  onClose, onNewEvent, onEditEvent, onDeleteEvent, onEventClick, t,
}) => {
  const dispatch = useDispatch(); /* CAL-FEAT-3 */
  const { handleBackdropClick } = useModalClose(onClose); /* FIX UX-9 */
  const [quickAction, setQuickAction] = useState(null);   /* CAL-FEAT-3 */
  const [qaTitle,    setQaTitle]    = useState('');       /* CAL-FEAT-3 */
  const [qaAmount,   setQaAmount]   = useState('');       /* CAL-FEAT-3 */
  const dateLabel = date.toLocaleDateString(undefined, {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });
  const todayStr = new Date().toISOString().split('T')[0];
  const dateStr  = date.toISOString().split('T')[0];
  const isFuture = dateStr > todayStr;
  const isToday  = dateStr === todayStr;

  // Build unified timeline from agent items + calendar events
  const timeline = useMemo(() => {
    const items = [];

    // Existing calendar events (already shown on tile)
    events.forEach((ev) => {
      /* CAL-FIX-3: skip linked payment events — they come from useAgentCalendar
         with richer context, otherwise every payment appears twice */
      if (ev.relatedType === 'payment') return;
      items.push({
        ...ev,
        color: ev.color,
        sortKey: ev.allDay ? '00:00' : (new Date(ev.startDate).toTimeString().slice(0, 5)),
      });
    });

    // Agent items from agentDayMeta
    if (meta) {
      meta.items.forEach((item) => {
        // Don't duplicate calendar events already added above
        if (item.type === 'event') return;
        items.push({
          ...item,
          sortKey: '12:00',
        });
      });
    }

    // Sort: payments/goals first, then tasks, todos, projects, notes last
    const ORDER = { payment: 0, goal: 1, 'project-end': 2, 'project-start': 3, task: 4, todo: 5, event: 6, note: 7, routine: 8 };
    return items.sort((a, b) => (ORDER[a.type] ?? 9) - (ORDER[b.type] ?? 9));
  }, [events, meta]);

  // Conflict detection: Cortana says high workload + Jarvis says financial pressure
  const hasConflict =
    meta &&
    meta.cortana.workloadLevel !== 'none' &&
    meta.jarvis.pressureLevel !== 'none';

  return (
    <div className="calendar-modal-overlay" onClick={handleBackdropClick}>
      <div className="cal-daydetail-modal" onClick={(e) => e.stopPropagation()}>

        {/* ── Header ──────────────────────────────────────────────────── */}
        <div className="cal-daydetail-header">
          <div>
            <h2 className="cal-daydetail-title">
              {isToday ? '📍 ' : isFuture ? '🔭 ' : '📁 '}
              {dateLabel}
            </h2>
            <p className="cal-daydetail-subtitle">
              {isToday ? 'Centro de Mando — Hoy' : isFuture ? 'Proyección Táctica' : 'Registro Histórico'}
            </p>
          </div>
          <button className="cal-daydetail-close" onClick={onClose}>✕</button>
        </div>

        {/* ── Conflict banner ──────────────────────────────────────────── */}
        {hasConflict && (
          <div className="cal-conflict-banner">
            ⚡ <strong>Conflicto detectado:</strong> Carga de trabajo elevada + presión financiera.
            Cortana recomienda redistribuir tareas antes de comprometer gastos adicionales.
          </div>
        )}

        {/* ── Saldo Libre Header (Jarvis) ──────────────────────────────── */}
        {projectedSaldoLibre !== null && (
          <div className={`cal-saldo-header ${projectedSaldoLibre >= 0 ? 'saldo-positive' : 'saldo-negative'}`}>
            <span className="cal-saldo-label">
              <span className="finance-agent-tag jarvis">🤖 Jarvis</span>
              {isFuture ? ' — Saldo libre proyectado:' : isToday ? ' — Saldo libre hoy:' : ' — Saldo del día:'}
            </span>
            <span className="cal-saldo-amount">
              {projectedSaldoLibre >= 0 ? '✅' : '⚠️'} {projectedSaldoLibre.toFixed(2)}
            </span>
          </div>
        )}

        {/* ── Agent status badges ─────────────────────────────────────── */}
        {meta && (
          <div className="cal-agent-badges">
            {/* Jarvis */}
            <div className="cal-agent-badge jarvis">
              <span>🤖 Jarvis</span>
              <span className={`cal-badge-level pressure-${meta.jarvis.pressureLevel}`}>
                {meta.jarvis.pressureLevel === 'none' ? 'Sin presión' :
                 meta.jarvis.pressureLevel === 'low'  ? '⚠️ Presión baja' :
                                                        '🔴 Presión alta'}
              </span>
            </div>
            {/* Cortana */}
            <div className="cal-agent-badge cortana">
              <span>🟣 Cortana</span>
              <span className={`cal-badge-level workload-${meta.cortana.workloadLevel}`}>
                {meta.cortana.workloadLevel === 'none'   ? 'Libre' :
                 meta.cortana.workloadLevel === 'low'    ? '📋 Carga baja' :
                 meta.cortana.workloadLevel === 'medium' ? '📋 Carga media' :
                                                           '🔥 Saturado'}
              </span>
            </div>
            {/* Shodan */}
            <div className="cal-agent-badge shodan">
              <span>🔴 Shodan</span>
              <span className={`cal-badge-level habit-${meta.shodan.habitDone ? 'done' : 'pending'}`}>
                {meta.shodan.habitDone ? '✓ Hábitos cumplidos' :
                 meta.shodan.routines.length > 0 ? '○ Hábitos pendientes' :
                                                   'Sin rutinas'}
              </span>
            </div>
          </div>
        )}

        {/* ── Intelligence Timeline ────────────────────────────────────── */}
        <div className="cal-timeline-section">
          <div className="cal-timeline-header">
            📡 {t('Intelligence Feed')} ({timeline.length})
          </div>

          {timeline.length === 0 ? (
            <div className="cal-timeline-empty">
              {t('No events or agent signals for this day.')}
            </div>
          ) : (
            <ul className="cal-timeline-list">
              {timeline.map((item) => {
                const agentInfo = item.agent ? AGENT_META[item.agent] : null;
                const typeInfo  = ITEM_TYPE_META[item.type] || { icon: '📌', label: item.type };
                const isCalEvent = item.type === 'event' && item.meta;

                return (
                  <li
                    key={item.id}
                    className={`cal-timeline-item ${item.overdue ? 'item-overdue' : ''}`}
                    style={item.color ? { borderLeftColor: item.color } : undefined}
                  >
                    <span className="cal-timeline-type-icon">{typeInfo.icon}</span>
                    <div className="cal-timeline-body">
                      <span className="cal-timeline-title">{item.title}</span>
                      {item.amount != null && (
                        <span className="cal-timeline-amount">
                          {Number(item.amount).toFixed(2)}{item.currency ? ` ${item.currency}` : ''}
                        </span>
                      )}
                      {item.meta?.description && (
                        <span className="cal-timeline-desc">{item.meta.description}</span>
                      )}
                    </div>
                    <div className="cal-timeline-right">
                      {agentInfo && (
                        <span className={`finance-agent-tag ${agentInfo.cls}`}>
                          {agentInfo.icon} {agentInfo.label}
                        </span>
                      )}
                      {isCalEvent && (
                        <div className="calendar-selected-event-actions">
                          <button type="button" onClick={(e) => onEditEvent(item.meta, e)}>✏️</button>
                          <button type="button" onClick={(e) => onDeleteEvent(item.meta.id, e)}>🗑️</button>
                        </div>
                      )}
                      {isCalEvent && item.meta.relatedType && (
                        <button
                          type="button"
                          className="cal-timeline-nav"
                          onClick={() => onEventClick(item.meta)}
                        >→</button>
                      )}
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        {/* ── Finance history agent log (existing FinanceDaySummary data) ── */}
        {meta && (
          <FinanceDaySummary data={meta} t={t} />
        )}

        {/* ── CAL-FEAT-3: Quick Actions ────────────────────────────────── */}
        <div className="day-modal-quick-actions">
          <span className="qa-label">⚡ Acción rápida:</span>
          <div className="qa-buttons">
            {[
              { key: 'note',    icon: '📝', label: 'Nota'    },
              { key: 'todo',    icon: '✅', label: 'Todo'    },
              { key: 'expense', icon: '💸', label: 'Gasto'   },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                className={`qa-btn ${quickAction === key ? 'qa-btn-active' : ''}`}
                onClick={() => { setQuickAction(quickAction === key ? null : key); setQaTitle(''); setQaAmount(''); }}
              >
                {icon} {label}
              </button>
            ))}
          </div>
          {quickAction && (
            <form
              className="qa-form"
              onSubmit={(e) => {
                e.preventDefault();
                const dateStr = date.toISOString().split('T')[0];
                if (!qaTitle.trim()) return;
                if (quickAction === 'note') {
                  const noteId = `note-${Date.now()}`;
                  dispatch(addNote({ id: noteId, title: qaTitle.trim(), content: '', reminderDate: dateStr }));
                  showToast('📝 Nota creada', 'success', 2500);
                } else if (quickAction === 'todo') {
                  dispatch(addTodo({ title: qaTitle.trim(), dueDate: dateStr }));
                  showToast('✅ Todo creado', 'success', 2500);
                } else if (quickAction === 'expense') {
                  const amount = parseFloat(qaAmount);
                  if (!isNaN(amount) && amount > 0) {
                    dispatch(addExpense({ description: qaTitle.trim(), amount, date: dateStr, category: 'General' }));
                    showToast('💸 Gasto registrado', 'success', 2500);
                  }
                }
                setQuickAction(null);
                setQaTitle('');
                setQaAmount('');
              }}
            >
              <input
                className="qa-input"
                placeholder={quickAction === 'expense' ? 'Descripción' : 'Título…'}
                value={qaTitle}
                onChange={(e) => setQaTitle(e.target.value)}
                autoFocus
              />
              {quickAction === 'expense' && (
                <input
                  className="qa-input qa-amount"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="Importe"
                  value={qaAmount}
                  onChange={(e) => setQaAmount(e.target.value)}
                />
              )}
              <button type="submit" className="qa-submit">Guardar</button>
              <button type="button" className="qa-cancel" onClick={() => setQuickAction(null)}>✕</button>
            </form>
          )}
        </div>

        {/* ── Footer action ───────────────────────────────────────────── */}
        <div className="cal-daydetail-footer">
          <button className="calendar-create-btn" onClick={onNewEvent}>
            + {t('New Event')}
          </button>
        </div>
      </div>
    </div>
  );
};

// ── Finance Day Summary Panel (legacy, reused inside DayDetailModal) ─────
const AGENT_CONFIG = [
  { key: 'Jarvis',  cls: 'jarvis',  icon: '🤖' },
  { key: 'Shodan',  cls: 'shodan',  icon: '🔴' },
  { key: 'Cortana', cls: 'cortana', icon: '🟣' },
];

const FinanceDaySummary = ({ data, t }) => {
  const { pendingCommitments, expenseTotal, activityCount, agents } = data;
  const hasAgentData = AGENT_CONFIG.some(({ key }) => (agents[key]?.length ?? 0) > 0);
  const hasAnything = pendingCommitments.length > 0 || activityCount > 0 || hasAgentData;
  if (!hasAnything) return null;

  return (
    <div className="cal-finance-summary">
      <div className="cal-finance-summary-title">
        💰 {t('Finance Log')}
      </div>

      {pendingCommitments.length > 0 && (
        <div className="cal-finance-section">
          <div className="cal-finance-section-header">
            <span className="cal-fin-dot commitment" style={{ display: 'inline-block' }} />
            {t('Pending Commitments')} ({pendingCommitments.length})
          </div>
          <ul className="cal-finance-list">
            {pendingCommitments.map((p) => (
              <li key={p.id}>
                <span>💳 {p.name}</span>
                <span className="cal-finance-amount commitment-amount">
                  {Number(p.amount || 0).toFixed(2)}{p.currency ? ` ${p.currency}` : ''}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {activityCount > 0 && (
        <div className="cal-finance-section">
          <div className="cal-finance-section-header">
            <span className="cal-fin-dot activity" style={{ display: 'inline-block' }} />
            {t('Financial Activity')}
          </div>
          <div className="cal-finance-activity-row">
            <span>{activityCount} {t('movements')}</span>
            <span className="cal-finance-amount expense-amount">
              {expenseTotal.toFixed(2)}
            </span>
          </div>
        </div>
      )}

      {hasAgentData && (
        <div className="cal-finance-section">
          <div className="cal-finance-section-header">⚡ {t('Agent Action Log')}</div>
          {AGENT_CONFIG.map(({ key, cls, icon }) => {
            const entries = agents[key] || [];
            if (entries.length === 0) return null;
            return (
              <div key={key} className="cal-agent-group">
                <span className={`finance-agent-tag ${cls}`}>{icon} {key}</span>
                <ul className="cal-finance-list">
                  {entries.slice(0, 5).map((e) => (
                    <li key={e.id}>
                      <span>{e.description || e.actionType}</span>
                      <span className="cal-finance-ts">
                        {new Date(e.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
