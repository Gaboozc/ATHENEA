import type { Store, Unsubscribe } from '@reduxjs/toolkit';
import {
  markDetectorTriggered,
  recordTacticalEvent,
  setCurrentIntelligenceReport,
} from '../../store/slices/aiMemorySlice';
import { getPersonaEngine } from './personaEngine';
import { selectFinancialSnapshot } from '../../store/selectors/financialSelectors';

export type TacticalEventType =
  | 'DETECTOR_INACTIVIDAD'
  | 'DETECTOR_CRISIS_FINANCIERA'
  | 'DETECTOR_EXITO'
  | 'ZONE_CHANGE'
  | 'DETECTOR_CLIMA_IMPACTO'
  | 'AUSTERITY_ACTIVATED'
  | 'AUSTERITY_DEACTIVATED';

export interface TacticalEvent {
  type: TacticalEventType;
  at: number;
  meta?: Record<string, unknown>;
}

type TacticalListener = (event: TacticalEvent) => void;

class TacticalObserver {
  private store: Store | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private loopTimer: ReturnType<typeof setInterval> | null = null;
  private listeners = new Set<TacticalListener>();
  private lastEventAt: Record<TacticalEventType, number> = {
    DETECTOR_INACTIVIDAD: 0,
    DETECTOR_CRISIS_FINANCIERA: 0,
    DETECTOR_EXITO: 0,
    ZONE_CHANGE: 0,
    DETECTOR_CLIMA_IMPACTO: 0,
    AUSTERITY_ACTIVATED: 0,
    AUSTERITY_DEACTIVATED: 0,
  };

  private readonly cooldownMs = {
    DETECTOR_INACTIVIDAD: 1000 * 30,
    DETECTOR_CRISIS_FINANCIERA: 1000 * 60,
    DETECTOR_EXITO: 1000 * 60,
    ZONE_CHANGE: 1000 * 60 * 5, // 5 minutes
    DETECTOR_CLIMA_IMPACTO: 1000 * 60 * 20, // 20 minutes
    AUSTERITY_ACTIVATED: 1000 * 60 * 60, // 1 hour cooldown
    AUSTERITY_DEACTIVATED: 1000 * 60 * 30, // 30 min cooldown
  };
  
  private lastDetectedZone: string | null = null;

  start(store: Store): void {
    if (this.unsubscribe) return;
    this.store = store;
    this.unsubscribe = store.subscribe(() => this.evaluate());
    this.loopTimer = setInterval(() => this.evaluate(), 1000);
    this.evaluate();
  }

  stop(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
    if (this.loopTimer) {
      clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
  }

  onEvent(listener: TacticalListener): () => void {
    this.listeners.add(listener);
    return () => {
      this.listeners.delete(listener);
    };
  }

  private emit(event: TacticalEvent): void {
    this.lastEventAt[event.type] = event.at;
    if (this.store) {
      this.store.dispatch(recordTacticalEvent(event));
      if (event.type === 'DETECTOR_INACTIVIDAD') {
        this.store.dispatch(markDetectorTriggered({ detector: 'inactivity', at: event.at }));
      }
      if (event.type === 'DETECTOR_CRISIS_FINANCIERA') {
        this.store.dispatch(markDetectorTriggered({ detector: 'financial_crisis', at: event.at }));
      }
      if (event.type === 'DETECTOR_EXITO') {
        this.store.dispatch(markDetectorTriggered({ detector: 'success', at: event.at }));
      }

      const persona = getPersonaEngine();
      persona.registerTacticalEvent({ type: event.type, meta: event.meta });
      const response = persona.generateResponse();
      this.store.dispatch(
        setCurrentIntelligenceReport({
          id: `intel-${event.at}`,
          sourceEvent: event.type,
          message: response.briefing,
          mode: response.mode,
          tone: response.emotionalTone,
          createdAt: event.at,
        })
      );
    }
    for (const listener of this.listeners) {
      listener(event);
    }
  }

  private evaluate(): void {
    if (!this.store) return;
    const state: any = this.store.getState();
    const now = Date.now();

    const omnibar = state.aiMemory?.context?.omnibar;
    const shouldTriggerInactivity =
      Boolean(omnibar?.isOpen) &&
      Boolean(omnibar?.openedAt) &&
      !String(omnibar?.lastInputText || '').trim() &&
      now - Number(omnibar?.openedAt || 0) >= 10000 &&
      now - this.lastEventAt.DETECTOR_INACTIVIDAD > this.cooldownMs.DETECTOR_INACTIVIDAD;

    if (shouldTriggerInactivity) {
      this.emit({
        type: 'DETECTOR_INACTIVIDAD',
        at: now,
        meta: { windowMs: 10000 },
      });
    }

    const sessionLog = state.aiMemory?.sessionLog || [];
    const latestAction = sessionLog[0];
    const isSpendAction =
      latestAction?.type === 'budget/addExpense' || latestAction?.type === 'payments/recordExpense';

    const financial = selectFinancialSnapshot(state);
    const healthScore = Number(financial.healthScore || 0);
    const saldoLibre = Number(financial.saldoLibre || 0);

    if (
      isSpendAction &&
      (healthScore < 35 || saldoLibre < 0) &&
      now - this.lastEventAt.DETECTOR_CRISIS_FINANCIERA > this.cooldownMs.DETECTOR_CRISIS_FINANCIERA
    ) {
      this.emit({
        type: 'DETECTOR_CRISIS_FINANCIERA',
        at: now,
        meta: {
          healthScore,
          saldoLibre,
          ingresos: financial.ingresos,
          gastosFijos: financial.gastosFijos,
          gastosVariables: financial.gastosVariables,
          compromisosProximos: financial.compromisosProximos,
        },
      });
    }

    const completionActions = sessionLog
      .filter((entry: any) =>
        entry?.type === 'tasks/complete' || entry?.type === 'tasks/completeTask'
      )
      .slice(0, 2);

    const isTwoInThirtyMinutes =
      completionActions.length === 2 &&
      Math.abs(Number(completionActions[0]?.timestamp || 0) - Number(completionActions[1]?.timestamp || 0)) <=
        1000 * 60 * 30;

    if (
      isTwoInThirtyMinutes &&
      now - this.lastEventAt.DETECTOR_EXITO > this.cooldownMs.DETECTOR_EXITO
    ) {
      this.emit({
        type: 'DETECTOR_EXITO',
        at: now,
        meta: { completions: 2, withinMs: 1000 * 60 * 30 },
      });
    }

    // Zone change detection
    const currentZone = state.sensorData?.location?.currentZone;
    if (
      currentZone &&
      currentZone !== this.lastDetectedZone &&
      now - this.lastEventAt.ZONE_CHANGE > this.cooldownMs.ZONE_CHANGE
    ) {
      const previousZone = this.lastDetectedZone;
      this.lastDetectedZone = currentZone;
      this.emit({
        type: 'ZONE_CHANGE',
        at: now,
        meta: { zone: currentZone, previousZone },
      });
    }

    // FASE 2.5: Weather impact detector (outdoor tasks / commute context)
    const weatherAlerts = state.aiMemory?.preFlightBriefing?.weatherAlerts || [];
    const weatherRisk = weatherAlerts.find((alert: any) => alert?.severity === 'high' || alert?.type === 'rain-incoming');
    const tasks = state.tasks?.tasks || [];
    const hasOutdoorOrTransitTask = tasks.some((task: any) => {
      if (task?.completed) return false;
      const content = `${task?.title || ''} ${task?.description || ''}`.toLowerCase();
      return /(compras|salir|traslado|transporte|caminar|bicicleta|delivery|reunion|cita|visita)/i.test(content);
    });

    if (
      weatherRisk &&
      hasOutdoorOrTransitTask &&
      now - this.lastEventAt.DETECTOR_CLIMA_IMPACTO > this.cooldownMs.DETECTOR_CLIMA_IMPACTO
    ) {
      this.emit({
        type: 'DETECTOR_CLIMA_IMPACTO',
        at: now,
        meta: {
          weather: weatherRisk,
          affectedTaskContext: 'outdoor-or-transit',
          zone: currentZone || 'UNKNOWN',
        },
      });
    }
  }
}

let tacticalObserverInstance: TacticalObserver | null = null;

export function getTacticalObserver(): TacticalObserver {
  if (!tacticalObserverInstance) {
    tacticalObserverInstance = new TacticalObserver();
  }
  return tacticalObserverInstance;
}

export function initializeTacticalObserver(store: Store): TacticalObserver {
  const observer = getTacticalObserver();
  observer.start(store);
  return observer;
}

/**
 * FASE 2.6: Public API for external modules to emit tactical events
 * Used by AusterityProtocol and other intelligence modules
 */
export function registerTacticalEvent(event: TacticalEvent): void {
  const observer = getTacticalObserver();
  if (observer) {
    observer['emit'](event);
  }
}
