import type { Store } from '@reduxjs/toolkit';
import { getPersonaEngine } from './personaEngine';

interface SleepTrendEntry {
  dayKey: string;
  sleepHours: number;
}

const SLEEP_TREND_KEY = 'athenea.shadow.sleepTrend';

class ShadowChronos {
  private store: Store | null = null;
  private intervalRef: ReturnType<typeof setInterval> | null = null;

  start(store: Store): void {
    this.store = store;
    if (this.intervalRef) return;

    this.runCycle();
    this.intervalRef = setInterval(() => this.runCycle(), 1000 * 60 * 20);
  }

  stop(): void {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
  }

  private runCycle(): void {
    const state = this.store?.getState?.() as any;
    const sleepHours = Number(state?.sensorData?.health?.sleepHours ?? 0);
    if (!sleepHours || !Number.isFinite(sleepHours)) return;
    const preferredTitle = String(state?.userIdentity?.preferredTitle || state?.userSettings?.title || 'Operador').trim() || 'Operador';
    const targetSleepHours = Number(state?.userIdentity?.biometricBaselines?.targetSleepHours ?? 7.5);
    const lowSleepThreshold = Math.max(4.5, Number((targetSleepHours - 1.5).toFixed(1)));

    const today = new Date().toISOString().slice(0, 10);
    const trend = this.getTrend();
    const existing = trend.find((item) => item.dayKey === today);

    if (existing) {
      existing.sleepHours = sleepHours;
    } else {
      trend.unshift({ dayKey: today, sleepHours });
    }

    const normalized = trend.slice(0, 7);
    localStorage.setItem(SLEEP_TREND_KEY, JSON.stringify(normalized));

    const last3 = normalized.slice(0, 3);
    if (last3.length >= 3 && last3.every((item) => item.sleepHours < lowSleepThreshold)) {
      const persona = getPersonaEngine();
      persona.registerTacticalEvent({
        type: 'SHADOW_CHRONOS_CONTINGENCY',
        meta: {
          preferredTitle,
          targetSleepHours,
          lowSleepThreshold,
          pattern: '3days-low-sleep',
          avgSleep: Number((last3.reduce((s, i) => s + i.sleepHours, 0) / 3).toFixed(1)),
        },
      });
    }
  }

  private getTrend(): SleepTrendEntry[] {
    try {
      const parsed = JSON.parse(localStorage.getItem(SLEEP_TREND_KEY) || '[]');
      if (!Array.isArray(parsed)) return [];
      return parsed
        .map((item) => ({
          dayKey: String(item?.dayKey || ''),
          sleepHours: Number(item?.sleepHours || 0),
        }))
        .filter((item) => item.dayKey && Number.isFinite(item.sleepHours));
    } catch {
      return [];
    }
  }
}

let shadowChronosInstance: ShadowChronos | null = null;

export function getShadowChronos(): ShadowChronos {
  if (!shadowChronosInstance) {
    shadowChronosInstance = new ShadowChronos();
  }
  return shadowChronosInstance;
}

export function initializeShadowChronos(store: Store): ShadowChronos {
  const chronos = getShadowChronos();
  chronos.start(store);
  return chronos;
}
