import type { Store } from '@reduxjs/toolkit';
import { Health } from '@capgo/capacitor-health';
import { logSessionAction, recordTacticalEvent } from '../../store/slices/aiMemorySlice';
import { setHealthData } from '../../store/slices/sensorDataSlice';
import { getPersonaEngine } from '../intelligence/personaEngine';

class HealthMonitor {
  private store: Store | null = null;
  private intervalRef: ReturnType<typeof setInterval> | null = null;
  private started = false;
  private lastLowRestAt = 0;
  private lastHighActivityAt = 0;

  constructor(store?: Store) {
    if (store) this.store = store;
  }

  async initialize(): Promise<void> {
    if (this.started) return;
    this.started = true;

    await this.refreshHealthData();
    this.intervalRef = setInterval(() => {
      this.refreshHealthData();
    }, 1000 * 60 * 15);
  }

  shutdown(): void {
    if (this.intervalRef) {
      clearInterval(this.intervalRef);
      this.intervalRef = null;
    }
    this.started = false;
  }

  private async refreshHealthData(): Promise<void> {
    const now = Date.now();
    const dayAgoIso = new Date(now - 1000 * 60 * 60 * 24).toISOString();
    const nowIso = new Date(now).toISOString();

    let steps = 0;
    let sleepHours = 0;

    try {
      const availability = await Health.isAvailable();
      if (availability.available) {
        await Health.requestAuthorization({ read: ['steps', 'sleep'] });

        const stepAgg = await Health.queryAggregated({
          dataType: 'steps',
          startDate: dayAgoIso,
          endDate: nowIso,
          bucket: 'day',
          aggregation: 'sum',
        });

        const sleepAgg = await Health.queryAggregated({
          dataType: 'sleep',
          startDate: dayAgoIso,
          endDate: nowIso,
          bucket: 'day',
          aggregation: 'sum',
        });

        steps = Math.round(stepAgg.samples?.[0]?.value || 0);
        sleepHours = Number(((sleepAgg.samples?.[0]?.value || 0) / 60).toFixed(2));
      } else {
        // Fallback while Health Connect is unavailable.
        steps = 7500;
        sleepHours = 6.5;
      }
    } catch {
      steps = 7200;
      sleepHours = 6.2;
    }

    if (!this.store) return;

    this.store.dispatch(
      setHealthData({
        steps,
        sleepHours,
      })
    );

    this.store.dispatch(
      logSessionAction({
        type: 'healthMonitor/refresh',
        timestamp: now,
        result: 'info',
        priority: 'LOW',
        payloadPreview: `steps=${steps}, sleep=${sleepHours}h`,
      })
    );

    const persona = getPersonaEngine();

    if (steps > 10000 && now - this.lastHighActivityAt > 1000 * 60 * 60 * 6) {
      this.lastHighActivityAt = now;
      this.store.dispatch(
        recordTacticalEvent({
          type: 'HIGH_ACTIVITY',
          at: now,
          meta: { steps },
        })
      );
      persona.registerTacticalEvent({ type: 'HIGH_ACTIVITY', meta: { steps } });
    }

    if (sleepHours > 0 && sleepHours < 6 && now - this.lastLowRestAt > 1000 * 60 * 60 * 6) {
      this.lastLowRestAt = now;
      this.store.dispatch(
        recordTacticalEvent({
          type: 'LOW_REST_WARNING',
          at: now,
          meta: { sleepHours },
        })
      );
      persona.registerTacticalEvent({ type: 'LOW_REST_WARNING', meta: { sleepHours } });
    }
  }

  setStore(store: Store): void {
    this.store = store;
  }
}

let healthMonitorInstance: HealthMonitor | null = null;

export function initializeHealthMonitor(store?: Store): HealthMonitor {
  if (!healthMonitorInstance) {
    healthMonitorInstance = new HealthMonitor(store);
    healthMonitorInstance.initialize().catch((error) => {
      console.warn('[HealthMonitor] Initialization warning:', error);
    });
  } else if (store) {
    healthMonitorInstance.setStore(store);
  }

  return healthMonitorInstance;
}

export function getHealthMonitor(): HealthMonitor | null {
  return healthMonitorInstance;
}
