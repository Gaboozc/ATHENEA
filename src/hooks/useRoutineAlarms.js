/* ROUTINES-2: Alarm hook — fires at task start/end times for today's routines */
import { useEffect, useRef } from 'react';
import { useSelector } from 'react-redux';

const playBeep = (type = 'start') => {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.type = 'sine';
    oscillator.frequency.value = type === 'start' ? 880 : 660;
    gain.gain.setValueAtTime(0.4, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.6);
    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + 0.6);
  } catch {
    // AudioContext not available (e.g. SSR)
  }
};

const showNotification = (title, body) => {
  playBeep(title.startsWith('🟢') ? 'start' : 'end');
  if (!('Notification' in window)) return;
  if (Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then((perm) => {
      if (perm === 'granted') new Notification(title, { body, icon: '/favicon.ico' });
    });
  }
};

export const useRoutineAlarms = () => {
  const routines = useSelector((state) => state.routines.routines);
  const firedRef = useRef(new Set());

  useEffect(() => {
    const check = () => {
      const now = new Date();
      const todayIndex = now.getDay();
      const hhmm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

      routines.forEach((routine) => {
        if (!(routine.daysOfWeek || []).includes(todayIndex)) return;
        (routine.tasks || []).forEach((task) => {
          if (task.startTime === hhmm) {
            const key = `${routine.id}-${task.id}-start-${hhmm}`;
            if (!firedRef.current.has(key)) {
              firedRef.current.add(key);
              showNotification(`🟢 Iniciando: ${task.name}`, `Rutina: ${routine.title}`);
            }
          }
          if (task.endTime === hhmm) {
            const key = `${routine.id}-${task.id}-end-${hhmm}`;
            if (!firedRef.current.has(key)) {
              firedRef.current.add(key);
              showNotification(`🔴 Finalizando: ${task.name}`, `Rutina: ${routine.title}`);
            }
          }
        });
      });
    };

    check();
    const interval = setInterval(check, 30_000); // cada 30 s
    return () => clearInterval(interval);
  }, [routines]);
};
