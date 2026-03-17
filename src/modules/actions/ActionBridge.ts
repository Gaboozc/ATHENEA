/**
 * FASE 4.0: ActionBridge - The Hands of ATHENEA
 * 
 * Transforms agent verdicts into physical device actions:
 * - Haptic feedback (vibration profiles per agent)
 * - Native system notifications (critical alerts)
 * - External telemetry (webhook dispatch)
 * - App navigation (auto-redirect to relevant hubs)
 * 
 * This is where ATHENEA touches the real world.
 */

import { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
import { LocalNotifications } from '@capacitor/local-notifications';
import type { Store } from '@reduxjs/toolkit';
import type { AgentType, OrchestratorDecision } from '../intelligence/agents/types';
import type { StructuredIntent } from '../intelligence/personaEngine';
import { addExpense } from '../../../store/slices/budgetSlice';
import { addEvent } from '../../../store/slices/calendarSlice';
import { addTask, completeTask } from '../../../store/slices/tasksSlice';
import { clearLatestActionableIntercept } from '../../store/slices/aiMemorySlice';

export type ActionType =
  | 'NOTIFY_USER'
  | 'DEVICE_HAPTIC'
  | 'APP_REDIRECT'
  | 'DISPATCH_TELEMETRY'
  | 'VOICE_CONFIRMATION';

export interface ActionPayload {
  type: ActionType;
  source: AgentType | 'orchestrator';
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'VETO';
  data: any;
  timestamp: number;
}

export interface WebhookPayload {
  event: string;
  source: string;
  timestamp: number;
  data: {
    agentType?: AgentType;
    priority?: string;
    message?: string;
    decision?: OrchestratorDecision;
    deviceInfo?: {
      battery?: number;
      network?: string;
      location?: string;
    };
  };
}

export type ChipPersona = 'cortana' | 'jarvis' | 'shodan' | 'swarm';

export interface ActionChip {
  id: string;
  label: string;
  intent: 'register-expense' | 'schedule-event' | 'complete-overdue' | 'create-focus-task' | 'schedule-focus-block';
  persona: ChipPersona;
}

interface ActionChipContext {
  dominantPersona: ChipPersona;
  latestIntercept?: any;
  predictiveBuffer?: any;
  tasks?: any[];
  suggestion?: string;
  structuredIntent?: StructuredIntent | null;
}

/**
 * Haptic profiles for each agent personality
 */
const AGENT_HAPTIC_PROFILES: Record<AgentType, () => Promise<void>> = {
  strategist: async () => {
    // Cortana: Double short pulse - efficient and tactical
    await Haptics.impact({ style: ImpactStyle.Light });
    await new Promise((resolve) => setTimeout(resolve, 100));
    await Haptics.impact({ style: ImpactStyle.Light });
  },
  auditor: async () => {
    // Jarvis: Triple refined pulse - analytical and precise
    await Haptics.impact({ style: ImpactStyle.Medium });
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.impact({ style: ImpactStyle.Medium });
    await new Promise((resolve) => setTimeout(resolve, 80));
    await Haptics.impact({ style: ImpactStyle.Medium });
  },
  vitals: async () => {
    // SHODAN: Long aggressive pulse - life-critical warning
    await Haptics.notification({ type: NotificationType.Error });
    await new Promise((resolve) => setTimeout(resolve, 200));
    await Haptics.vibrate({ duration: 500 });
  },
};

/**
 * VETO-specific haptic: Ultra-aggressive pattern
 */
const VETO_HAPTIC_PATTERN = async () => {
  // Long vibration + multiple error notifications
  await Haptics.notification({ type: NotificationType.Error });
  await Haptics.vibrate({ duration: 800 });
  await new Promise((resolve) => setTimeout(resolve, 100));
  await Haptics.notification({ type: NotificationType.Error });
  await Haptics.vibrate({ duration: 400 });
};

class ActionBridge {
  private store: Store | null = null;
  private webhookURL: string | null = null;
  private actionLog: ActionPayload[] = [];
  private maxLogSize = 100; // Keep last 100 actions
  private notificationPermissionGranted = false;
  private hapticsAvailable = true;
  private initialized = false;
  private initializing = false;

  constructor() {
    // Don't initialize async operations in constructor to avoid race conditions
  }

  /**
   * Build contextual action chips for ProactiveHUD
   */
  buildActionChips(context: ActionChipContext): ActionChip[] {
    const chips: ActionChip[] = [];
    const dominantPersona = context.dominantPersona || 'swarm';
    const intentType = context.structuredIntent?.type || 'GENERAL';

    if (intentType === 'RELAX') {
      chips.push({
        id: 'chip-relax-notifications',
        label: 'Silenciar notificaciones 30 min',
        intent: 'schedule-focus-block',
        persona: dominantPersona,
      });
      chips.push({
        id: 'chip-relax-close-task',
        label: 'Cerrar una tarea rapida',
        intent: 'complete-overdue',
        persona: dominantPersona,
      });
    }

    if (intentType === 'TASK_REORG') {
      chips.push({
        id: 'chip-task-reorg-complete',
        label: 'Resolver tarea vencida',
        intent: 'complete-overdue',
        persona: dominantPersona,
      });
      chips.push({
        id: 'chip-task-reorg-focus',
        label: 'Crear tarea prioritaria',
        intent: 'create-focus-task',
        persona: dominantPersona,
      });
    }

    if (intentType === 'BUDGET_LOCK') {
      chips.push({
        id: 'chip-budget-log-expense',
        label: 'Registrar gasto ahora',
        intent: 'register-expense',
        persona: dominantPersona,
      });
      chips.push({
        id: 'chip-budget-focus-block',
        label: 'Pausa tactica financiera',
        intent: 'schedule-focus-block',
        persona: dominantPersona,
      });
    }

    if (context.latestIntercept?.actionType === 'register-expense') {
      chips.push({
        id: 'chip-intercept-expense',
        label: 'Registrar gasto interceptado',
        intent: 'register-expense',
        persona: dominantPersona,
      });
    }

    if (context.latestIntercept?.actionType === 'schedule-event') {
      chips.push({
        id: 'chip-intercept-event',
        label: 'Crear evento desde intercept',
        intent: 'schedule-event',
        persona: dominantPersona,
      });
    }

    const firstOverdue = (context.tasks || []).find((task: any) => {
      if (task.status === 'completed') return false;
      const dueDate = new Date(task.dueDate || '');
      return Number.isFinite(dueDate.getTime()) && dueDate.getTime() < Date.now();
    });

    if (firstOverdue) {
      chips.push({
        id: String(firstOverdue.id),
        label: 'Marcar vencida como completada',
        intent: 'complete-overdue',
        persona: dominantPersona,
      });
    }

    if (context.predictiveBuffer?.nextHub === 'WorkHub') {
      chips.push({
        id: 'chip-focus-task',
        label: 'Crear tarea foco',
        intent: 'create-focus-task',
        persona: dominantPersona,
      });
    }

    if (chips.length < 2) {
      chips.push({
        id: 'chip-fallback-task',
        label: 'Nueva tarea rapida',
        intent: 'create-focus-task',
        persona: dominantPersona,
      });
    }

    if (chips.length < 2) {
      chips.push({
        id: 'chip-fallback-block',
        label: 'Bloquear 30 min de foco',
        intent: 'schedule-focus-block',
        persona: dominantPersona,
      });
    }

    const unique = chips.filter((chip, index, arr) => arr.findIndex((x) => x.id === chip.id) === index);
    return unique.slice(0, 3);
  }

  /**
   * Execute an action chip against real app state
   */
  executeActionChip(chip: ActionChip, context: ActionChipContext): string {
    if (!this.store) return 'Sin store activo';

    const dispatch = this.store.dispatch as any;

    switch (chip.intent) {
      case 'register-expense':
        if (!context.latestIntercept) return 'No hay intercepto financiero disponible';
        dispatch(
          addExpense({
            amount: Number(context.latestIntercept.amount || 0),
            note: `[INTERCEPTED] ${context.latestIntercept.summary}`,
            date: new Date(context.latestIntercept.detectedAt || Date.now()).toISOString(),
          })
        );
        dispatch(clearLatestActionableIntercept());
        return 'Registrar gasto interceptado';

      case 'schedule-event':
        if (!context.latestIntercept) return 'No hay intercepto de agenda disponible';
        dispatch(
          addEvent({
            title: `[INTERCEPTED] ${context.latestIntercept.summary}`,
            startDate: new Date(Date.now() + 1000 * 60 * 30).toISOString(),
            endDate: new Date(Date.now() + 1000 * 60 * 60).toISOString(),
            description: `Fuente: ${context.latestIntercept.appName || 'Intercepted Notification'}`,
          })
        );
        dispatch(clearLatestActionableIntercept());
        return 'Crear evento desde intercept';

      case 'complete-overdue':
        dispatch(completeTask({ id: chip.id }));
        return 'Completar tarea vencida';

      case 'schedule-focus-block':
        dispatch(
          addEvent({
            title: 'Focus Block / Modo Calma',
            startDate: new Date(Date.now() + 1000 * 60 * 10).toISOString(),
            endDate: new Date(Date.now() + 1000 * 60 * 40).toISOString(),
            description: 'Bloque creado desde Omnibar Action Chip.',
          })
        );
        return 'Silenciar notificaciones / Pausa de foco';

      case 'create-focus-task':
      default:
        dispatch(
          addTask({
            title: context.suggestion || 'Tarea de foco sugerida por ATHENEA',
            priority: 'high',
          })
        );
        return 'Crear tarea de foco';
    }
  }

  /**
   * Initialize device capabilities (lazy initialization)
   */
  private async initializeCapabilities(): Promise<void> {
    if (this.initialized || this.initializing) return;
    this.initializing = true;
    try {
      // Check notification permissions
      const permission = await LocalNotifications.checkPermissions();
      if (permission.display === 'granted') {
        this.notificationPermissionGranted = true;
      } else {
        const requested = await LocalNotifications.requestPermissions();
        this.notificationPermissionGranted = requested.display === 'granted';
      }

      // Test haptics availability
      try {
        await Haptics.impact({ style: ImpactStyle.Light });
      } catch (error) {
        console.warn('[ActionBridge] Haptics not available on this device');
        this.hapticsAvailable = false;
      }

      console.log('[ActionBridge] Initialized', {
        notifications: this.notificationPermissionGranted,
        haptics: this.hapticsAvailable,
      });
      this.initialized = true;
      this.initializing = false;
    } catch (error) {
      console.error('[ActionBridge] Failed to initialize capabilities:', error);
      this.initializing = false;
    }
  }

  /**
   * Initialize with Redux store
   */
  initialize(store: Store): void {
    this.store = store;
    this.loadWebhookURL();
  }

  /**
   * Load webhook URL from Redux state
   */
  private loadWebhookURL(): void {
    if (!this.store) return;
    const state: any = this.store.getState();
    this.webhookURL = state.userSettings?.webhookURL || null;
  }

  /**
   * Update webhook URL (called from Settings)
   */
  setWebhookURL(url: string | null): void {
    this.webhookURL = url;
  }

  /**
   * Execute action based on agent decision
   */
  async executeAction(action: ActionPayload): Promise<void> {
    // Log action
    this.logAction(action);

    // Route to appropriate handler
    switch (action.type) {
      case 'NOTIFY_USER':
        await this.handleNotification(action);
        break;
      case 'DEVICE_HAPTIC':
        await this.handleHaptic(action);
        break;
      case 'APP_REDIRECT':
        await this.handleAppRedirect(action);
        break;
      case 'DISPATCH_TELEMETRY':
        await this.handleTelemetry(action);
        break;
      default:
        console.warn('[ActionBridge] Unknown action type:', action.type);
    }
  }

  /**
   * Quick metinitialized) await this.initializeCapabilities();
    if (!this.hod: Execute agent-specific haptic feedback
   */
  async triggerAgentHaptic(agentType: AgentType, isVeto = false): Promise<void> {
    if (!this.hapticsAvailable) {
      console.log('[ActionBridge] Haptics not available, skipping');
      return;
    }

    try {
      if (isVeto) {
        await VETO_HAPTIC_PATTERN();
      } else {
        await AGENT_HAPTIC_PROFILES[agentType]();
      }
    } catch (error) {
      console.error('[ActionBridge] Failed to trigger haptic:', error);
    }
  }

  /**
   * Quick method: Send native notification
   */
  async triggerNotification(
    title: string,
    body: string,
    agentType?: AgentType,
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'VETO' = 'MEDIUM'
  ): Promise<void> {
    if (!this.initialized) await this.initializeCapabilities();
    if (!this.notificationPermissionGranted) {
      console.log('[ActionBridge] Notification permission not granted, skipping');
      return;
    }

    try {
      await LocalNotifications.schedule({
        notifications: [
          {
            id: Date.now(),
            title,
            body,
            smallIcon: 'ic_launcher',
            iconColor: this.getAgentColor(agentType),
            extra: {
              source: agentType || 'system',
              priority,
            },
          },
        ],
      });

      console.log('[ActionBridge] Notification sent:', title);
    } catch (error) {
      console.error('[ActionBridge] Failed to send notification:', error);
    }
  }

  /**
   * Quick method: Dispatch telemetry to webhook
   */
  async dispatchTelemetry(payload: WebhookPayload): Promise<void> {
    if (!this.webhookURL) {
      console.log('[ActionBridge] No webhook URL configured, skipping telemetry');
      return;
    }

    try {
      const response = await fetch(this.webhookURL, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook returned ${response.status}`);
      }

      console.log('[ActionBridge] Telemetry dispatched successfully');
    } catch (error) {
      console.error('[ActionBridge] Failed to dispatch telemetry:', error);
    }
  }

  /**
   * INTEGRATED METHOD: Handle orchestrator decision
   * Called directly by AgentOrchestrator after consensus
   */
  async processOrchestratorDecision(decision: OrchestratorDecision): Promise<void> {
    const isVeto = decision.vetoActivated;
    const leadAgent = decision.leadAgent;
    
      // Get priority from lead agent's verdict in allVerdicts
      const leadVerdict = decision.allVerdicts.find(v => v.agentType === leadAgent);
      const priority = leadVerdict?.priority || 'MEDIUM';
      const recommendation = leadVerdict?.verdict.recommendation || decision.finalVerdict;

    // Check if Production_Ready_Flag is enabled
    const productionReady = this.isProductionReadyFlagEnabled();

    // CRITICAL or VETO decisions trigger haptics
    if (priority === 'CRITICAL' || priority === 'VETO') {
      await this.triggerAgentHaptic(leadAgent, isVeto);
    }

    // VETO decisions trigger native notifications (if production ready)
    if (isVeto && productionReady) {
      await this.triggerNotification(
        '[SHODAN VETO ACTIVO]',
          recommendation,
        'vitals',
        'VETO'
      );

      // Dispatch VETO telemetry if webhook configured
      if (this.webhookURL) {
        await this.dispatchTelemetry({
          event: 'SHODAN_VETO_ACTIVATED',
          source: 'VitalsAgent',
          timestamp: Date.now(),
          data: {
            agentType: 'vitals',
            priority: 'VETO',
              message: recommendation,
            decision,
            deviceInfo: this.getDeviceInfo(),
          },
        });
      }
    }

    // CRITICAL financial anomalies trigger audit notifications
    if (
      leadAgent === 'auditor' &&
      priority === 'CRITICAL' &&
      productionReady &&
        recommendation.toLowerCase().includes('presupuesto')
    ) {
      await this.triggerNotification(
        '[REPORTE DE AUDITORÍA]',
          recommendation,
        'auditor',
        'CRITICAL'
      );
    }
  }

  /**
   * Private: Handle notification action
   */
  private async handleNotification(action: ActionPayload): Promise<void> {
    await this.triggerNotification(
      action.data.title,
      action.data.body,
      action.source as AgentType,
      action.priority
    );
  }

  /**
   * Private: Handle haptic action
   */
  private async handleHaptic(action: ActionPayload): Promise<void> {
    await this.triggerAgentHaptic(action.source as AgentType, action.priority === 'VETO');
  }

  /**
   * Private: Handle app redirect
   */
  private async handleAppRedirect(action: ActionPayload): Promise<void> {
    const targetHub = action.data.targetHub;
    console.log(`[ActionBridge] Redirecting to ${targetHub}`);
    
    // Dispatch navigation event (would be handled by router)
    if (this.store) {
      // TODO: Dispatch navigation action to Redux or direct route manipulation
      // Example: this.store.dispatch(navigateToHub(targetHub));
    }
  }

  /**
   * Private: Handle telemetry dispatch
   */
  private async handleTelemetry(action: ActionPayload): Promise<void> {
    await this.dispatchTelemetry(action.data);
  }

  /**
   * Log action for debugging/audit trail
   */
  private logAction(action: ActionPayload): void {
    this.actionLog.push(action);
    if (this.actionLog.length > this.maxLogSize) {
      this.actionLog.shift(); // Remove oldest
    }
  }

  /**
   * Get recent action log
   */
  getActionLog(): ActionPayload[] {
    return [...this.actionLog];
  }

  /**
   * Get device info for telemetry
   */
  private getDeviceInfo() {
    const state: any = this.store?.getState() || {};
    const sensorData = state.sensorData || {};

    return {
      battery: sensorData.battery?.level,
      network: sensorData.network?.type,
      location: sensorData.location?.currentZone,
    };
  }

  /**
   * Get agent color for notification styling
   */
  private getAgentColor(agentType?: AgentType): string {
    const colors: Record<AgentType, string> = {
      strategist: '#00A8FF', // Cortana blue
      auditor: '#FFD700', // Jarvis gold
      vitals: '#00FF41', // SHODAN green
    };
    return agentType ? colors[agentType] : '#FFFFFF';
  }

  /**
   * Check if Production_Ready_Flag is enabled
   */
  private isProductionReadyFlagEnabled(): boolean {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('Production_Ready_Flag') === 'true';
    }
    return String(import.meta.env.VITE_PRODUCTION_READY_FLAG || '').toLowerCase() === 'true';
  }
}

// Singleton instance
let actionBridgeInstance: ActionBridge | null = null;

export function getActionBridge(): ActionBridge {
  if (!actionBridgeInstance) {
    actionBridgeInstance = new ActionBridge();
  }
  return actionBridgeInstance;
}

// FIX 1: Wire ActionBridge to EventBus so AgentOrchestrator can emit events without
// a direct import (which caused a circular dependency crash).
let _eventBusUnsubscribe: (() => void) | null = null;

export function initializeActionBridgeListener(store: import('@reduxjs/toolkit').Store): void {
  if (_eventBusUnsubscribe) return; // already initialized

  const bridge = getActionBridge();
  bridge.initialize(store);

  // Lazy import to avoid loading Intel module before it's ready
  import('../intelligence/EventBus').then(({ eventBus }) => {
    _eventBusUnsubscribe = eventBus.on('orchestrator:decision', (decision) => {
      bridge.processOrchestratorDecision(decision).catch((err) => {
        console.warn('[ActionBridge] processOrchestratorDecision error:', err);
      });
    });
  });
}

export default ActionBridge;
