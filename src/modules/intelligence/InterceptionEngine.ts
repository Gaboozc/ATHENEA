import type { Store } from '@reduxjs/toolkit';
import {
  appendSilentInterceptLog,
  logSessionAction,
  setCurrentIntelligenceReport,
  setLatestActionableIntercept,
} from '../../store/slices/aiMemorySlice';
import { analyzeNotification } from './NotificationAnalyzer';
import { parseNotification } from './NotificationParser';
import { getPersonaEngine } from './personaEngine';
import { getNotificationListenerStatus, pullInterceptedNotifications } from '../../services/notificationListenerBridge';

class InterceptionEngine {
  private store: Store | null = null;
  private started = false;
  private pollRef: ReturnType<typeof setInterval> | null = null;

  constructor(store?: Store) {
    if (store) this.store = store;
  }

  async initialize(): Promise<void> {
    if (this.started) return;
    this.started = true;

    await this.pollOnce();
    this.pollRef = setInterval(() => {
      this.pollOnce();
    }, 8000);
  }

  shutdown(): void {
    if (this.pollRef) {
      clearInterval(this.pollRef);
      this.pollRef = null;
    }
    this.started = false;
  }

  private async pollOnce(): Promise<void> {
    if (!this.store) return;

    const listenerStatus = await getNotificationListenerStatus();
    if (!listenerStatus.enabled && listenerStatus.pendingCount === 0) {
      return;
    }

    const intercepted = await pullInterceptedNotifications();
    if (!intercepted.length) return;

    for (const raw of intercepted) {
      const parsed = parseNotification(raw);
      const state: any = this.store.getState();
      const insight = analyzeNotification(parsed, {
        currentZone: state.sensorData?.location?.currentZone || null,
        batteryLevel: state.sensorData?.battery?.level ?? null,
        focusedMode: state.aiMemory?.userState?.mood === 'focused',
        knownCommerceKeywords: state.userSettings?.knownCommerceKeywords || [],
      });

      const now = Date.now();
      const focusedMode = state.aiMemory?.userState?.mood === 'focused';
      const batteryCritical = (state.sensorData?.battery?.level ?? 100) < 10;

      // Tactical firewall: in focused mode only critical items can interrupt.
      if (focusedMode && insight.urgency !== 'critical') {
        this.store.dispatch(
          appendSilentInterceptLog({
            id: insight.id,
            appName: insight.appName,
            packageName: insight.packageName,
            summary: `[FOCUSED BLOCK] ${insight.summary}`,
            detectedAt: now,
          })
        );
        continue;
      }

      // Battery safeguard: under 10%, only critical notifications survive.
      if (batteryCritical && insight.urgency !== 'critical') {
        this.store.dispatch(
          appendSilentInterceptLog({
            id: insight.id,
            appName: insight.appName,
            packageName: insight.packageName,
            summary: `[POWER SAVE] ${insight.summary}`,
            detectedAt: now,
          })
        );
        continue;
      }

      if (insight.silent) {
        this.store.dispatch(
          appendSilentInterceptLog({
            id: insight.id,
            appName: insight.appName,
            packageName: insight.packageName,
            summary: insight.summary,
            detectedAt: now,
          })
        );

        this.store.dispatch(
          logSessionAction({
            type: 'interception/silent',
            timestamp: now,
            result: 'info',
            priority: 'LOW',
            payloadPreview: `[SILENT] ${insight.appName}: ${insight.summary}`,
          })
        );
        continue;
      }

      this.store.dispatch(
        setLatestActionableIntercept({
          id: insight.id,
          appName: insight.appName,
          packageName: insight.packageName,
          category: insight.category,
          summary: insight.summary,
          amount: insight.amount,
          currency: insight.currency,
          merchant: insight.merchant,
          temporalHint: insight.temporalHint,
          urgency: insight.urgency,
          actionType: insight.actionType,
          detectedAt: now,
        })
      );

      this.store.dispatch(
        logSessionAction({
          type: 'interception/detected',
          timestamp: now,
          result: 'info',
          priority: 'HIGH',
          payloadPreview: `[INTERCEPTED] Notificacion de ${insight.appName} detectada`,
        })
      );

      const persona = getPersonaEngine();
      persona.registerTacticalEvent({
        type: 'INTERCEPTED_NOTIFICATION',
        meta: {
          category: insight.category,
          appName: insight.appName,
          amount: insight.amount,
          currency: insight.currency,
        },
      });

      const response = persona.generateResponse();
      this.store.dispatch(
        setCurrentIntelligenceReport({
          id: `intel-intercept-${now}`,
          sourceEvent: 'INTERCEPTED_NOTIFICATION',
          message: response.briefing,
          mode: response.mode,
          tone: response.emotionalTone,
          createdAt: now,
        })
      );
    }
  }

  setStore(store: Store): void {
    this.store = store;
  }
}

let interceptionEngineInstance: InterceptionEngine | null = null;

export function initializeInterceptionEngine(store?: Store): InterceptionEngine {
  if (!interceptionEngineInstance) {
    interceptionEngineInstance = new InterceptionEngine(store);
    interceptionEngineInstance.initialize().catch((error) => {
      console.warn('[InterceptionEngine] Initialization warning:', error);
    });
  } else if (store) {
    interceptionEngineInstance.setStore(store);
  }

  return interceptionEngineInstance;
}

export function getInterceptionEngine(): InterceptionEngine | null {
  return interceptionEngineInstance;
}
