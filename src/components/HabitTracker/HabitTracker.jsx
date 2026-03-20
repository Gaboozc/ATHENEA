import React from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../../context/LanguageContext';
import './HabitTracker.css';

function getLast7Days() {
  const days = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    days.push(d.toISOString().split('T')[0]);
  }
  return days;
}

function formatDayLabel(dateStr, locale) {
  const d = new Date(dateStr + 'T00:00:00');
  return d.toLocaleDateString(locale, { weekday: 'short' }).slice(0, 2).toUpperCase();
}

export default function HabitTracker() {
  const routines = useSelector((state) => state.routines?.routines || []);
  const { language, t } = useLanguage();
  const locale = language === 'es' ? 'es-ES' : 'en-US';
  const last7 = getLast7Days();

  if (routines.length === 0) return null;

  return (
    <div className="habit-tracker">
      <div className="habit-tracker__header">
        <span className="habit-tracker__title">{t('Habits — last 7 days')}</span>
      </div>

      {/* Day header row */}
      <div className="habit-tracker__grid">
        <div className="habit-tracker__name-col" />
        {last7.map((day) => (
          <div key={day} className="habit-tracker__day-label">
            {formatDayLabel(day, locale)}
          </div>
        ))}
      </div>

      {/* One row per routine */}
      {routines.map((routine) => {
        const completedArr = routine.completedDates || (routine.lastCompleted ? [routine.lastCompleted] : []);
        return (
          <div key={routine.id} className="habit-tracker__grid habit-tracker__row">
            <div className="habit-tracker__name-col" title={routine.title}>
              {routine.title.length > 14 ? routine.title.slice(0, 13) + '…' : routine.title}
            </div>
            {last7.map((day) => {
              const done = completedArr.includes(day);
              return (
                <div
                  key={day}
                  className={`habit-tracker__cell ${done ? 'is-done' : ''}`}
                  title={done ? `${t('Done')} ${day}` : `${t('Pending')} ${day}`}
                />
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
