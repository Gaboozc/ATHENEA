import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addEvent, updateEvent, deleteEvent } from '../../store/slices/calendarSlice';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
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

  const getEventsForDate = (date) => {
    const dateStr = date.toISOString().split('T')[0];
    return events.filter((event) => {
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
    setShowModal(true);
    setEditingEvent(null);
    const dateStr = day.fullDate.toISOString().split('T')[0];
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
  };

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

  const todayEvents = getEventsForDate(new Date());

  return (
    <div className="calendar-container">
      <header className="calendar-header">
        <div>
          <h1>{t('Calendar')}</h1>
          <p>{t('Manage your events, deadlines, and reminders.')}</p>
        </div>
        <button className="calendar-create-btn" onClick={() => {
          setShowModal(true);
          setEditingEvent(null);
          const todayDate = new Date();
          const today = todayDate.toISOString().split('T')[0];
          setSelectedDate(todayDate);
          setFormData({
            title: '',
            description: '',
            startDate: today,
            startTime: '09:00',
            endDate: today,
            endTime: '10:00',
            allDay: true,
            color: '#1ec9ff',
            type: 'event',
          });
        }}>
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
      </div>

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
            
            return (
              <div
                key={index}
                className={`calendar-day ${!day.isCurrentMonth ? 'other-month' : ''} ${isToday ? 'today' : ''}`}
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
              </div>
            );
          })}
        </div>
      </div>

      {todayEvents.length > 0 && (
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

      {showModal && (
        <div className="calendar-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="calendar-modal" onClick={(e) => e.stopPropagation()}>
            <div className="calendar-modal-header">
              <h2>{editingEvent ? t('Edit Event') : t('New Event')}</h2>
              <button onClick={() => setShowModal(false)}>✕</button>
            </div>
            {selectedDate && (
              <div className="calendar-selected-day">
                <h3>{t('Events')} · {formatDateLabel(selectedDate)}</h3>
                {selectedDayEvents.length === 0 ? (
                  <p>{t('No events yet')}</p>
                ) : (
                  <ul className="calendar-selected-events">
                    {selectedDayEvents.map((event) => (
                      <li key={event.id}>
                        <button
                          type="button"
                          className="calendar-selected-event-main"
                          onClick={() => handleEventClick(event)}
                        >
                          <span className="calendar-event-icon" aria-hidden="true">
                            {EVENT_ICONS[event.type] || '📌'}
                          </span>
                          <span className="calendar-selected-event-title">{event.title}</span>
                          <span className="calendar-selected-event-time">
                            {event.allDay ? t('All day') : new Date(event.startDate).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </button>
                        <div className="calendar-selected-event-actions">
                          <button type="button" onClick={(e) => handleEditEvent(event, e)}>✏️</button>
                          <button type="button" onClick={(e) => handleDeleteEvent(event.id, e)}>🗑️</button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
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
