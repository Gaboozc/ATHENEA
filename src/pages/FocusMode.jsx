import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { recordSession, setCurrentTask, startSession, clearSession } from '../../store/slices/focusSlice';
import { useLanguage } from '../context/LanguageContext';
import { showToast } from '../components/Toast/Toast';
import './FocusMode.css';

const PRESETS = [
  { label: '25 min', minutes: 25 },
  { label: '50 min', minutes: 50 },
  { label: '90 min', minutes: 90 },
];
const BREAK_DURATION = 5; // minutes

const fmt2 = (n) => String(n).padStart(2, '0');
const toHM = (totalMins) =>
  totalMins >= 60
    ? `${Math.floor(totalMins / 60)}h ${totalMins % 60}m`
    : `${totalMins}m`;

export const FocusMode = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const tasks = useSelector((s) => s.tasks?.tasks || []);
  const sessions = useSelector((s) => s.focus?.sessions || []);
  const totalMinutes = useSelector((s) => s.focus?.totalMinutes || 0);
  const currentTaskId = useSelector((s) => s.focus?.currentTaskId || null);
  const currentSession = useSelector((s) => s.focus?.currentSession || null); /* FIX-D */

  const activeTasks = useMemo(
    () => tasks.filter((task) => !task.completed && task.status !== 'Completed' && task.status !== 'deleted'),
    [tasks]
  );

  const [duration, setDuration] = useState(25);      // planned minutes
  const [remaining, setRemaining] = useState(25 * 60); // seconds
  const [phase, setPhase] = useState('idle');         // idle | running | break | done
  const [selectedTaskId, setSelectedTaskId] = useState(currentTaskId || '');
  const intervalRef = useRef(null);
  const startTimeRef = useRef(null);

  const totalSeconds = duration * 60;
  const progress = 1 - remaining / totalSeconds;

  // Sync task selection to store
  useEffect(() => {
    dispatch(setCurrentTask(selectedTaskId || null));
  }, [selectedTaskId, dispatch]);

  // FIX-D: recover active session after page reload
  useEffect(() => {
    if (!currentSession?.startedAt) return;
    const elapsed = Math.floor((Date.now() - new Date(currentSession.startedAt).getTime()) / 1000);
    const remaining = currentSession.durationSeconds - elapsed;
    if (remaining > 0) {
      const recoveredMins = Math.round(currentSession.durationSeconds / 60);
      setDuration(recoveredMins);
      setRemaining(remaining);
      setPhase('running');
      intervalRef.current = setInterval(() => {
        setRemaining((prev) => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            handleSessionComplete();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      // Session already expired while page was closed — record it and clear
      dispatch(recordSession({
        taskId: currentSession.taskId || null,
        taskTitle: '',
        durationMinutes: Math.round(currentSession.durationSeconds / 60),
        completedAt: new Date().toISOString(),
      }));
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const start = useCallback(() => {
    dispatch(startSession(duration * 60)); /* FIX-D: persist session start for crash recovery */
    setPhase('running');
    startTimeRef.current = Date.now();
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          handleSessionComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [duration, selectedTaskId]); // eslint-disable-line react-hooks/exhaustive-deps

  const pause = () => {
    clearInterval(intervalRef.current);
    setPhase('paused');
  };

  const resume = () => {
    setPhase('running');
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          handleSessionComplete();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const reset = () => {
    clearInterval(intervalRef.current);
    dispatch(clearSession()); /* FIX-D: cancel persisted session on manual reset */
    setPhase('idle');
    setRemaining(duration * 60);
  };

  const handleSessionComplete = useCallback(() => {
    const task = activeTasks.find((t) => t.id === selectedTaskId);
    dispatch(
      recordSession({
        taskId: selectedTaskId || null,
        taskTitle: task?.title || '',
        durationMinutes: duration,
        completedAt: new Date().toISOString(),
      })
    );
    showToast(`🍅 ¡Pomodoro completado! ${duration} min de enfoque.`, 'success', 5000);
    setPhase('break');
    setRemaining(BREAK_DURATION * 60);
    // Auto-start break timer
    intervalRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          setPhase('done');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  }, [activeTasks, selectedTaskId, duration, dispatch]);

  // Cleanup on unmount
  useEffect(() => () => clearInterval(intervalRef.current), []);

  const handlePreset = (mins) => {
    if (phase !== 'idle') return;
    setDuration(mins);
    setRemaining(mins * 60);
  };

  const mins = Math.floor(remaining / 60);
  const secs = remaining % 60;

  // SVG circle parameters
  const RADIUS = 90;
  const CIRC = 2 * Math.PI * RADIUS;
  const strokeDashoffset = CIRC * (1 - progress);

  // Today's session count
  const todayStr = new Date().toISOString().split('T')[0];
  const todaySessions = sessions.filter((s) => s.completedAt?.startsWith(todayStr));

  return (
    <div className="focus-container">
      <header className="focus-header">
        <h1>🍅 {t('Focus Mode')}</h1>
        <p>{t('Deep work with Pomodoro timer')}</p>
      </header>

      {/* Task selector */}
      <div className="focus-task-selector">
        <label className="focus-label">{t('Working on')}:</label>
        <select
          className="focus-select"
          value={selectedTaskId}
          onChange={(e) => setSelectedTaskId(e.target.value)}
          disabled={phase === 'running'}
        >
          <option value="">{t('— Free focus —')}</option>
          {activeTasks.map((task) => (
            <option key={task.id} value={task.id}>
              {task.title}
            </option>
          ))}
        </select>
      </div>

      {/* Duration presets */}
      <div className="focus-presets">
        {PRESETS.map(({ label, minutes }) => (
          <button
            key={minutes}
            className={`focus-preset-btn ${duration === minutes ? 'focus-preset-active' : ''}`}
            onClick={() => handlePreset(minutes)}
            disabled={phase !== 'idle'}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Timer ring */}
      <div className="focus-timer-ring">
        <svg width="220" height="220" className="focus-ring-svg">
          <circle
            className="focus-ring-bg"
            cx="110" cy="110" r={RADIUS}
            fill="none" strokeWidth="10"
          />
          <circle
            className={`focus-ring-progress ${phase === 'break' ? 'focus-ring-break' : ''}`}
            cx="110" cy="110" r={RADIUS}
            fill="none" strokeWidth="10"
            strokeDasharray={CIRC}
            strokeDashoffset={strokeDashoffset}
            strokeLinecap="round"
            transform="rotate(-90 110 110)"
          />
        </svg>
        <div className="focus-timer-display">
          <span className="focus-timer-time">{fmt2(mins)}:{fmt2(secs)}</span>
          <span className="focus-timer-phase">
            {phase === 'idle'   ? t('Ready')       :
             phase === 'running'? t('Focusing')     :
             phase === 'paused' ? t('Paused')       :
             phase === 'break'  ? `☕ ${t('Break')}` :
                                  `✅ ${t('Done!')}`}
          </span>
        </div>
      </div>

      {/* Controls */}
      <div className="focus-controls">
        {phase === 'idle' && (
          <button className="focus-btn primary" onClick={start}>
            ▶ {t('Start')}
          </button>
        )}
        {phase === 'running' && (
          <>
            <button className="focus-btn secondary" onClick={pause}>⏸ {t('Pause')}</button>
            <button className="focus-btn ghost" onClick={reset}>↺ {t('Reset')}</button>
          </>
        )}
        {phase === 'paused' && (
          <>
            <button className="focus-btn primary" onClick={resume}>▶ {t('Resume')}</button>
            <button className="focus-btn ghost" onClick={reset}>↺ {t('Reset')}</button>
          </>
        )}
        {(phase === 'break' || phase === 'done') && (
          <button className="focus-btn primary" onClick={() => { setPhase('idle'); setRemaining(duration * 60); }}>
            🍅 {t('New Session')}
          </button>
        )}
      </div>

      {/* Stats */}
      <div className="focus-stats">
        <div className="focus-stat">
          <span className="focus-stat-n">{todaySessions.length}</span>
          <span className="focus-stat-l">{t('Today')}</span>
        </div>
        <div className="focus-stat">
          <span className="focus-stat-n">{toHM(totalMinutes)}</span>
          <span className="focus-stat-l">{t('Total')}</span>
        </div>
        <div className="focus-stat">
          <span className="focus-stat-n">{sessions.length}</span>
          <span className="focus-stat-l">{t('Sessions')}</span>
        </div>
      </div>

      {/* Recent session history */}
      {sessions.length > 0 && (
        <div className="focus-history">
          <h3>{t('Recent Sessions')}</h3>
          <ul>
            {sessions.slice(0, 8).map((s) => (
              <li key={s.id} className="focus-history-item">
                <span className="focus-history-task">{s.taskTitle || t('Free focus')}</span>
                <span className="focus-history-dur">{s.durationMinutes}m</span>
                <span className="focus-history-date">
                  {new Date(s.completedAt).toLocaleDateString(undefined, { day: 'numeric', month: 'short' })}
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};

export default FocusMode;
