import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addCheckin } from '../../store/slices/checkinsSlice';
import { setHealthData } from '../../store/slices/sensorDataSlice';
import './DailyCheckin.css';

const MOOD_LABELS = ['😞', '😕', '😐', '🙂', '😄'];
const ENERGY_LABELS = ['💤', '😴', '⚡', '🔋', '🚀'];

export default function DailyCheckin() {
  const dispatch = useDispatch();
  const today = new Date().toISOString().split('T')[0];

  const existing = useSelector((state) =>
    (state.checkins?.checkins || []).find((c) => c.date === today)
  );

  const [mood, setMood] = useState(existing?.mood ?? 3);
  const [energy, setEnergy] = useState(existing?.energy ?? 3);
  const [sleepHours, setSleepHours] = useState(existing?.sleepHours ?? 7);
  const [note, setNote] = useState(existing?.note ?? '');
  const [saved, setSaved] = useState(!!existing);

  function handleSave() {
    const checkin = {
      id: `checkin-${today}`,
      date: today,
      mood,
      energy,
      sleepHours: Number(sleepHours),
      note,
      createdAt: existing?.createdAt || new Date().toISOString(),
    };
    dispatch(addCheckin(checkin));
    dispatch(setHealthData({ sleepHours: Number(sleepHours) }));
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="daily-checkin">
      <h3 className="daily-checkin__title">Check-in diario</h3>

      <div className="daily-checkin__row">
        <label className="daily-checkin__label">Estado de ánimo</label>
        <div className="daily-checkin__options">
          {MOOD_LABELS.map((emoji, i) => (
            <button
              key={i}
              type="button"
              className={`daily-checkin__btn ${mood === i + 1 ? 'is-selected' : ''}`}
              onClick={() => setMood(i + 1)}
              title={`${i + 1}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="daily-checkin__row">
        <label className="daily-checkin__label">Energía</label>
        <div className="daily-checkin__options">
          {ENERGY_LABELS.map((emoji, i) => (
            <button
              key={i}
              type="button"
              className={`daily-checkin__btn ${energy === i + 1 ? 'is-selected' : ''}`}
              onClick={() => setEnergy(i + 1)}
              title={`${i + 1}`}
            >
              {emoji}
            </button>
          ))}
        </div>
      </div>

      <div className="daily-checkin__row">
        <label className="daily-checkin__label">Horas de sueño</label>
        <input
          type="number"
          min="0"
          max="24"
          step="0.5"
          value={sleepHours}
          onChange={(e) => setSleepHours(parseFloat(e.target.value) || 0)}
          className="daily-checkin__input"
        />
      </div>

      <div className="daily-checkin__row">
        <label className="daily-checkin__label">Nota rápida</label>
        <textarea
          className="daily-checkin__textarea"
          rows={2}
          placeholder="¿Cómo te sientes hoy?"
          value={note}
          onChange={(e) => setNote(e.target.value)}
        />
      </div>

      <button type="button" className="daily-checkin__save" onClick={handleSave}>
        {saved ? '✓ Guardado' : 'Guardar check-in'}
      </button>
    </div>
  );
}
