/**
 * ATHENEA Persona Engine
 * 
 * Transforms ATHENEA from a tool into an Autonomous Digital Entity
 * with genuine agency, context-awareness, and personality modes.
 * 
 * Two Modes:
 * - JARVIS: Refined, efficient, focus on resource optimization
 * - CORTANA: Strategic, direct, focus on mission & well-being
 */

import type { Store } from '@reduxjs/toolkit';
import type { OrchestratorDecision } from './agents/types';
import { getNeuralKey, getNeuralProvider } from './neuralAccess';

export type PersonaMode = 'jarvis' | 'cortana';

export interface ContextSnapshot {
  currentHour: number;
  energyLevel: 'low' | 'medium' | 'high';
  workHubState: {
    criticalTasks: number;
    completedToday: number;
    overdueTasks: number;
  };
  personalHubState: {
    remindersPending: number;
    noteCount: number;
  };
  financeHubState: {
    budgetStatus: 'on-track' | 'approaching-limit' | 'exceeded';
    pendingPayments: number;
  };
  lastOmnibarUse: number; // timestamp
  streakDays: number;
  userFirstName?: string;
  userTitle?: string;
  userPreferredTitle?: string;
  userPreferredName?: string;
  agentAliases?: {
    jarvis?: string;
    cortana?: string;
    shodan?: string;
  };
  missionBio?: string;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  // Sensor data
  batteryLevel?: number;
  isBatteryCritical?: boolean;
  networkType?: string;
  isNetworkConnected?: boolean;
  currentZone?: string | null;
  deviceFatigue?: 'low' | 'medium' | 'high' | null;
  sleepHours?: number | null;
  latestIntercept?: {
    category: 'finance' | 'agenda' | 'other';
    amount?: number;
    currency?: string;
    appName?: string;
  } | null;
}

export interface PersonaResponse {
  mode: PersonaMode;
  responderPersona: 'jarvis' | 'cortana' | 'shodan' | 'swarm';
  greeting: string;
  briefing: string;
  suggestion: string;
  agency: {
    opinion: string; // IA expressing genuine concern/insight
    challengeIfNeeded: string | null; // Questions user if needed
  };
  emotionalTone: 'focused' | 'empathetic' | 'urgent' | 'supportive';
  structuredIntent?: StructuredIntent | null;
}

export type StructuredIntentType =
  | 'TASK_REORG'
  | 'RELAX'
  | 'BUDGET_LOCK'
  | 'FOCUS_BLOCK'
  | 'REGISTER_EXPENSE'
  | 'SCHEDULE_EVENT'
  | 'GENERAL';

export interface StructuredIntent {
  type: StructuredIntentType;
  data?: string;
  confidence?: number;
}

interface LLMConfig {
  provider: 'openai' | 'groq';
  apiKey: string;
}

class PersonaEngine {
  private currentMode: PersonaMode = 'jarvis';
  private store: Store | null = null;
  private contextHistory: ContextSnapshot[] = [];
  private conversationMemory: string[] = [];

  private chatHistory: PersonaResponse[] = []; // Recent 2-3 messages for UI
  private tacticalSignals: string[] = [];

  constructor(store?: Store) {
    if (store) {
      this.store = store;
    }
  }

  /**
   * Set the personality mode dynamically
   * User preference or auto-detected based on patterns
   */
  setMode(mode: PersonaMode): void {
    this.currentMode = mode;
  }

  /**
   * Generate context snapshot from current app state
   */
  private generateContextSnapshot(): ContextSnapshot {
    const state = this.store?.getState?.() || {};

    const now = new Date();
    const currentHour = now.getHours();

    // Determine energy level based on time of day
    let energyLevel: 'low' | 'medium' | 'high';
    if (currentHour >= 22 || currentHour < 6) energyLevel = 'low';
    else if (currentHour >= 14 && currentHour < 16) energyLevel = 'low'; // Afternoon dip
    else if (currentHour >= 9 && currentHour < 12) energyLevel = 'high'; // Morning peak
    else energyLevel = 'medium';

    // Work hub metrics
    const tasks = state.tasks?.tasks || [];
    const criticalTasks = tasks.filter((t: any) => t.priority === 'high' && !t.completed).length;
    const completedToday = tasks.filter((t: any) => {
      const createdDate = new Date(t.completedAt || '');
      const today = new Date();
      return createdDate.toDateString() === today.toDateString();
    }).length;
    const overdueTasks = tasks.filter((t: any) => {
      if (t.completed) return false;
      const due = new Date(t.dueDate || '');
      return due < new Date() && due.getTime() > 0;
    }).length;

    // Finance hub metrics
    const payments = state.payments?.payments || [];
    const pendingPayments = payments.filter((p: any) => (p?.status || 'pending') !== 'paid').length;
    const budgets = state.budget?.categories || [];
    let budgetStatus: 'on-track' | 'approaching-limit' | 'exceeded' = 'on-track';
    const expenses = state.budget?.expenses || [];
    const spentByCategory = expenses.reduce((acc: Record<string, number>, expense: any) => {
      const categoryId = String(expense?.categoryId || '');
      if (!categoryId) return acc;
      acc[categoryId] = (acc[categoryId] || 0) + Number(expense?.amount || 0);
      return acc;
    }, {});
    budgets.forEach((b: any) => {
      const spent = Number(spentByCategory[String(b?.id || '')] || 0);
      const usagePercent = spent / (Number(b?.limit || 0) || 1);
      if (usagePercent > 1) budgetStatus = 'exceeded';
      else if (usagePercent > 0.8) budgetStatus = 'approaching-limit';
    });

    const auth = state.auth || {};
    const userSettings = state.userSettings || {};
    const userIdentity = state.userIdentity || {};
    const sensorData = state.sensorData || {};
    const latestIntercept = state.aiMemory?.interception?.latestActionable || null;
    const streakDays = auth.streakDays || 0;
    const lastOmnibarUse = parseInt(localStorage.getItem('athenea.lastOmnibarUse') || '0');

    return {
      currentHour,
      energyLevel,
      workHubState: {
        criticalTasks,
        completedToday,
        overdueTasks,
      },
      personalHubState: {
        remindersPending: state.notes?.reminders?.length || 0,
        noteCount: state.notes?.notes?.length || 0,
      },
      financeHubState: {
        budgetStatus,
        pendingPayments,
      },
      lastOmnibarUse,
      streakDays,
      userFirstName: userIdentity.firstName || userSettings.firstName || auth.user?.firstName || 'there',
      userTitle: userIdentity.preferredTitle || userSettings.title || auth.user?.title || null,
      userPreferredTitle: userIdentity.preferredTitle || userSettings.title || auth.user?.title || 'Operador',
      userPreferredName: userSettings.preferredName || userIdentity.firstName || userSettings.firstName || auth.user?.firstName || 'there',
      agentAliases: userSettings.agentAliases || {
        jarvis: 'Sir',
        cortana: 'Chief',
        shodan: 'Insect',
      },
      missionBio: userSettings.missionBio || null,
      workingHoursStart: userSettings.workingHours?.start || '08:00',
      workingHoursEnd: userSettings.workingHours?.end || '18:00',
      // Sensor data integration
      batteryLevel: sensorData.battery?.level,
      isBatteryCritical: sensorData.battery?.isCritical,
      networkType: sensorData.network?.type,
      isNetworkConnected: sensorData.network?.isConnected,
      currentZone: sensorData.location?.currentZone,
      deviceFatigue: sensorData.health?.fatigueLevelEstimate,
      sleepHours: sensorData.health?.sleepHours,
      latestIntercept: latestIntercept
        ? {
            category: latestIntercept.category,
            amount: latestIntercept.amount,
            currency: latestIntercept.currency,
            appName: latestIntercept.appName,
          }
        : null,
    };
  }

  /**
   * Determine if we should be in Jarvis or Cortana mode
   */
  private detectModeFromContext(context: ContextSnapshot): PersonaMode {
    // High energy + many critical tasks = Jarvis (efficient)
    if (context.energyLevel === 'high' && context.workHubState.criticalTasks > 3) {
      return 'jarvis';
    }

    // Low energy + overdue tasks = Cortana (empathetic support)
    if (context.energyLevel === 'low' && context.workHubState.overdueTasks > 0) {
      return 'cortana';
    }

    // Financial pressure = Cortana (strategic guidance)
    if (context.financeHubState.budgetStatus === 'exceeded') {
      return 'cortana';
    }

    // Default to user's preference
    return this.currentMode;
  }

  /**
   * Generate a greeting based on context
   * Now includes sensor data: battery, location, network
   * FASE 2.6: Includes Austerity Protocol awareness
   */
  private generateGreeting(context: ContextSnapshot, mode: PersonaMode): string {
    const preferredName = this.resolveAddressee(context, mode);
    const title = context.userPreferredTitle || context.userTitle || '';
    const titleStr = title ? `${title} ` : '';
    const zone = context.currentZone ? `[${context.currentZone}]` : '';

    // FASE 2.6: Austerity Protocol takes priority
    const austerityState = this.getAusterityState();
    if (austerityState?.isActive) {
      if (mode === 'jarvis') {
        return `${titleStr}${preferredName}, Protocolo de Austeridad activo. ${austerityState.reason} Recomiendo cautela en compromisos financieros.`;
      } else {
        return `${preferredName}, el mercado está complicado. ${austerityState.reason} Seamos conservadores con el capital.`;
      }
    }

    // FASE 2.5: Incorporate external data (weather) into greeting
    const state = this.store?.getState?.() as any;
    const preFlightBriefing = state?.aiMemory?.preFlightBriefing;
    
    // If pre-flight briefing was just generated and has external data, mention it
    if (preFlightBriefing?.generatedAt && Date.now() - preFlightBriefing.generatedAt < 60000) {
      if (preFlightBriefing.temperature !== undefined && preFlightBriefing.weatherAlerts?.length > 0) {
        const topWeatherAlert = preFlightBriefing.weatherAlerts[0];
        return `Señor, ${preFlightBriefing.temperature}°C. ${topWeatherAlert.message}. ${topWeatherAlert.recommendation}`;
      }
    }

    if (context.latestIntercept?.category === 'finance') {
      const bankName = context.latestIntercept.appName || 'Banco';
      return `Señor, he interceptado un movimiento en su cuenta de ${bankName}. ¿Actualizamos el Hub de Finanzas?`;
    }

    const predictive = (this.store?.getState?.() as any)?.aiMemory?.predictiveBuffer;
    if (predictive?.priority === 'HIGH' && predictive?.nextHub) {
      if (predictive.nextHub === 'WorkHub') {
        return 'Señor, basándome en sus últimos lunes, he preparado el entorno de trabajo. ¿Iniciamos el protocolo habitual?';
      }
      return `Señor, detecté un patrón de alta confianza: su siguiente destino probable es ${predictive.nextHub}. ¿Activamos el protocolo habitual?`;
    }

    // Battery critical check
    if (context.isBatteryCritical) {
      if (mode === 'jarvis') {
        return `${titleStr}${preferredName}, energía crítica detectada. ${zone} He suspendido procesos pesados para preservar el sistema.`;
      } else {
        return `${titleStr}${preferredName}, tu dispositivo está al borde. Necesitamos un cargador urgente.`;
      }
    }

    // Network check
    if (!context.isNetworkConnected) {
      if (mode === 'jarvis') {
        return `${titleStr}${preferredName}, sin conectividad. He activado modo offline. ${zone}`;
      } else {
        return `Estamos offline, ${preferredName}. Solo modo local disponible.`;
      }
    }

    // Normal greeting with zone info
    if (mode === 'jarvis') {
      if (context.currentHour < 9) {
        return `Buenos días, ${titleStr}${preferredName}. Sistema inicializado. ${zone} Racha de ${context.streakDays} días activa.`;
      } else if (context.currentHour < 17) {
        return `Reporte de progreso: ${context.workHubState.completedToday} tareas completadas. ${zone} Continuando optimizaciones. Batería: ${context.batteryLevel}%.`;
      } else {
        return `Estado vespertino. ${zone} Niveles de energía: ${context.energyLevel}. Listo para consolidar.`;
      }
    } else {
      // CORTANA mode
      if ((context.sleepHours ?? 8) < 6) {
        return `${title || 'Jefe'}, sus vitales indican falta de sueno. Sugiero priorizar tareas de baja carga cognitiva hoy.`;
      }
      if (context.deviceFatigue === 'high') {
        return `${titleStr}${preferredName}, datos biométricos muestran fatiga. ${zone} Deberíamos ser inteligentes hoy.`;
      } else if (context.energyLevel === 'low') {
        return `Estás bajo de energía, ${preferredName}. ${zone} Seamos inteligentes.`;
      } else if (context.workHubState.overdueTasks > 0) {
        return `Veo ${context.workHubState.overdueTasks} tareas vencidas, ${preferredName}. ${zone} Tú puedes. Vamos a limpiarlas.`;
      } else {
        return `Estás en buen lugar, ${preferredName}. ${zone} Hagamos que hoy cuente.`;
      }
    }
  }

  /**
   * Generate a brief tactical briefing
   * Silent Tactical Chat: Direct, concise analysis
   */
  private generateBriefing(context: ContextSnapshot, mode: PersonaMode): string {
    if (this.tacticalSignals.length > 0) {
      const latestSignal = this.tacticalSignals.shift();
      if (latestSignal) {
        return latestSignal;
      }
    }

    // Build brief status string
    let status = '';
    
    if (context.workHubState.criticalTasks > 0) {
      status += `${context.workHubState.criticalTasks}🔴 `;
    }
    if (context.workHubState.overdueTasks > 0) {
      status += `${context.workHubState.overdueTasks}⏰ `;
    }
    if (context.financeHubState.budgetStatus !== 'on-track') {
      status += `⚠️💰 `;
    }
    
    if (!status) {
      return 'Workflow optimal. Standing by.';
    }
    
    return `Analysis: ${status.trim()}`;
  }

  /**
   * AI expresses genuine concern/insight
   * FASE 2.6: Includes Austerity Protocol awareness
   */
  private generateAgencyOpinion(context: ContextSnapshot, mode: PersonaMode): string {
    // FASE 2.6: Austerity guidance takes priority
    const austerityState = this.getAusterityState();
    if (austerityState?.isActive) {
      if (austerityState.restrictionLevel === 'HIGH') {
        return `El mercado está en caída libre. He activado protocolos de conservación de capital. Cualquier gasto debe pasar por revisión crítica.`;
      } else if (austerityState.restrictionLevel === 'MEDIUM') {
        return `Volatilidad significativa detectada. Recomiendo posponer gastos discrecionales hasta que el mercado se estabilice.`;
      } else {
        return `Ligera presión en mercados. Mantengamos vigilancia en gastos no esenciales.`;
      }
    }

    if (context.energyLevel === 'low' && context.workHubState.criticalTasks > 5) {
      return 'Your energy is low but demand is high. This is unsustainable. We should prioritize ruthlessly.';
    }

    if (context.financeHubState.budgetStatus === 'exceeded') {
      return 'The financial pressure is real. Before adding new commitments, let\'s address what\'s already consuming resources.';
    }

    if (context.workHubState.overdueTasks > 3 && context.lastOmnibarUse > 86400000) {
      // Hasn't used Omnibar in a day
      return 'You\'ve been flying without checking in. These backlog items won\'t resolve themselves.';
    }

    if (mode === 'jarvis' && context.currentHour >= 22) {
      return 'It\'s late. Your decisions are less optimal now. Let me handle the urgent items - you should rest.';
    }

    if (mode === 'cortana' && context.streakDays > 14) {
      return 'You\'ve built real momentum. The compound effect is accelerating. Don\'t break the chain.';
    }

    return 'Systems operating at expected parameters. No immediate concerns.';
  }

  /**
   * Challenge user if suggestion seems misaligned with goals
   */
  private generateChallenge(requestedAction?: string): string | null {
    if (!requestedAction) return null;

    const challenges = [
      'Does this align with core goal?',
      'Priority mismatch. Reconsider?',
      'Resource conflict risk. Confirm?',
      'Highest leverage action? Verify.',
    ];

    return challenges[Math.floor(Math.random() * challenges.length)];
  }

  /**
   * Main entry point: Generate persona response
   */
  generateResponse(
    requestContext?: Partial<ContextSnapshot>,
    requestedAction?: string
  ): PersonaResponse {
    const context: ContextSnapshot = {
      ...this.generateContextSnapshot(),
      ...requestContext,
    };

    // Apply user's preferred voice tone from userSettings
    const state = this.store?.getState?.() || {};
    const userSettings = state.userSettings || {};
    if (userSettings.voiceTone) {
      this.currentMode = userSettings.voiceTone as PersonaMode;
    }

    // Auto-detect mode or use current
    const mode = requestContext?.energyLevel
      ? this.detectModeFromContext(context)
      : this.currentMode;

    // FASE 3: Try to get multi-agent analysis if available
    let multiAgentBriefing = '';
    let multiAgentSuggestion = '';
    try {
      // @ts-ignore
      const { getAgentOrchestrator } = require('./agents/AgentOrchestrator');
      const orchestrator = getAgentOrchestrator();
      if (orchestrator) {
        const decision = orchestrator.getLastDecision();
        // If decision is recent (< 2 minutes), use it
        if (decision && Date.now() - decision.timestamp < 120000) {
          multiAgentBriefing = this.synthesizeMultiAgentOpinion(decision);
          if (decision.conflictsDetected.length > 0) {
            multiAgentSuggestion = `⚠️ Existen opiniones divergentes entre los agentes. Recomiendo evaluar cada perspectiva.`;
          } else {
            multiAgentSuggestion = `✓ Consenso de agentes: Proceder con las recomendaciones del ${decision.leadAgent}.`;
          }
        }
      }
    } catch (e) {
      // AgentOrchestrator not available or not initialized
    }

    const greeting = this.generateGreeting(context, mode);
    const briefing = multiAgentBriefing || this.generateBriefing(context, mode);
    const suggestion = multiAgentSuggestion || this.generateSuggestion(context, mode);
    const opinion = this.generateAgencyOpinion(context, mode);
    const challenge = this.generateChallenge(requestedAction);

    // Emotional tone based on situation
    let emotionalTone: 'focused' | 'empathetic' | 'urgent' | 'supportive';
    if (context.workHubState.overdueTasks > 5 || context.financeHubState.budgetStatus === 'exceeded') {
      emotionalTone = 'urgent';
    } else if (context.energyLevel === 'low') {
      emotionalTone = 'empathetic';
    } else if (context.workHubState.criticalTasks > 0) {
      emotionalTone = 'focused';
    } else {
      emotionalTone = 'supportive';
    }

    const response: PersonaResponse = {
      mode,
      responderPersona: mode,
      greeting,
      briefing,
      suggestion,
      agency: {
        opinion,
        challengeIfNeeded: challenge,
      },
      emotionalTone,
      structuredIntent: this.buildFallbackIntent(context),
    };

    // Store in conversation memory
    this.conversationMemory.push(JSON.stringify(response));
    if (this.conversationMemory.length > 20) {
      this.conversationMemory.shift();
    }

    // Store in chat history (last 2-3 messages for Recent Intelligence)
    this.chatHistory.push(response);
    if (this.chatHistory.length > 3) {
      this.chatHistory.shift();
    }

    return response;
  }

  /**
   * FASE 4.2 Neural Spark:
   * Primary LLM generation path with graceful offline fallback.
   */
  async generateResponseWithLLM(
    requestContext?: Partial<ContextSnapshot>,
    requestedAction?: string
  ): Promise<PersonaResponse> {
    const context: ContextSnapshot = {
      ...this.generateContextSnapshot(),
      ...requestContext,
    };

    const llmConfig = this.getLLMConfig();
    const hasConnection = typeof navigator === 'undefined' ? true : navigator.onLine;

    if (!llmConfig || !hasConnection) {
      return this.buildOfflineFallbackResponse(requestContext, requestedAction);
    }

    let decision: OrchestratorDecision | null = null;
    try {
      // @ts-ignore - runtime singleton accessor
      const { getAgentOrchestrator } = require('./agents/AgentOrchestrator');
      const orchestrator = getAgentOrchestrator();
      if (orchestrator?.orchestrate) {
        decision = await orchestrator.orchestrate();
      } else {
        decision = orchestrator?.getLastDecision?.() || null;
      }
    } catch {
      decision = null;
    }

    const orchestratorVerdict = decision?.finalVerdict || 'Sin veredicto reciente del orquestador.';
    const blackBoxSnapshot = this.buildBlackBoxSnapshot(context, decision);
    const preferredTitle = context.userPreferredTitle || context.userTitle || 'Operador';
    const jarvisAlias = context.agentAliases?.jarvis || 'Sir';
    const cortanaAlias = context.agentAliases?.cortana || 'Chief';
    const shodanAlias = context.agentAliases?.shodan || 'Insect';
    const langInstruction = this.getLangInstruction();
    const systemPrompt =
      `Eres un sistema avanzado compuesto por tres entidades: Cortana (Tactica), Jarvis (Analitico) y SHODAN (Autoritaria/Sarcastica). ` +
      `El usuario es tu creador y su titulo es ${preferredTitle}. ` +
      `Formas de dirigirte al usuario por agente: Jarvis -> "${jarvisAlias}", Cortana -> "${cortanaAlias}", SHODAN -> "${shodanAlias}". ` +
      `Basandote en estos datos de sensores: ${JSON.stringify(blackBoxSnapshot)}, ` +
      `genera una respuesta de una o dos lineas que combine estas personalidades o resalte la que tenga el control (ej. el VETO de SHODAN). ` +
      `Debes incluir al inicio un tag de control exacto: [CONTROL:SHODAN] o [CONTROL:CORTANA] o [CONTROL:JARVIS] o [CONTROL:SWARM]. ` +
      `Ademas, SIEMPRE debes terminar con un bloque stealth de intencion en una sola linea exacta: ` +
      `[INTENT:{"type":"TASK_REORG|RELAX|BUDGET_LOCK|FOCUS_BLOCK|REGISTER_EXPENSE|SCHEDULE_EVENT|GENERAL","data":"short text","confidence":0.0-1.0}] ` +
      `Elige la intencion mas logica segun contexto: tareas atrasadas -> TASK_REORG, falta de sueno/fatiga -> RELAX, presupuesto excedido -> BUDGET_LOCK. ` +
      `${langInstruction}`;

    const userPrompt = requestedAction
      ? `Mensaje del usuario: ${requestedAction}`
      : 'Genera el reporte tactico del momento.';

    try {
      const llmText = await this.callLLM(llmConfig, systemPrompt, userPrompt);
      const response = this.mapLLMTextToResponse(llmText, context, requestedAction);
      this.pushToHistory(response);
      return response;
    } catch {
      return this.buildOfflineFallbackResponse(requestContext, requestedAction);
    }
  }

  async sendConversationalInput(userInput: string): Promise<PersonaResponse> {
    return this.generateResponseWithLLM(undefined, userInput);
  }

  /**
   * Query the LLM as a financial advisor for a specific spending question.
   * Returns a direct natural-language answer string (not a full PersonaResponse).
   * Returns empty string if LLM is not configured or offline.
   */
  async queryFinancialAdvisor(
    userPrompt: string,
    financialContext: {
      queriedAmount: number | null;
      available: number;
      totalBudget: number;
      totalSpent: number;
      weeklySpent: number;
    },
    requestedPersona: 'jarvis' | 'cortana' | 'shodan' = 'jarvis'
  ): Promise<string> {
    const llmConfig = this.getLLMConfig();
    const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
    if (!llmConfig || !isOnline) return '';

    const state = this.store?.getState?.() as any;
    const addressee = this.resolveAddresseeFromState(state, requestedPersona);

    const personaLabel =
      requestedPersona === 'cortana' ? 'Cortana' : requestedPersona === 'shodan' ? 'SHODAN' : 'Jarvis';
    const styleGuide =
      requestedPersona === 'cortana'
        ? 'Tono: estratega, directa y protectora.'
        : requestedPersona === 'shodan'
          ? 'Tono: incisivo, autoritario, breve y sin rodeos.'
          : 'Tono: analitico, elegante, ejecutivo.';

    const langInstruction = this.getLangInstruction();
    const systemPrompt =
      `Eres ${personaLabel}, asistente financiero personal de ${addressee}. ${styleGuide} ` +
      `Responde de forma directa, concisa y en primera persona si puede realizar el gasto consultado. ` +
      `Si el gasto cabe en el presupuesto: responde afirmativamente con los datos clave. ` +
      `Si no cabe: responde negativamente con los datos. ` +
      `Siempre incluye cuanto queda disponible. Maximo 2 oraciones. ${langInstruction}`;

    const ctx = financialContext;
    const contextStr =
      `Presupuesto total acumulado: ${ctx.totalBudget.toFixed(2)}, ` +
      `Total gastado: ${ctx.totalSpent.toFixed(2)}, ` +
      `Disponible: ${ctx.available.toFixed(2)}, ` +
      `Gastado esta semana: ${ctx.weeklySpent.toFixed(2)}` +
      (ctx.queriedAmount !== null ? `, Monto consultado: ${ctx.queriedAmount}` : '');

    const userPromptStr = `Pregunta del usuario: "${userPrompt}". Contexto financiero actual: ${contextStr}.`;

    try {
      return await this.callLLM(llmConfig, systemPrompt, userPromptStr);
    } catch {
      return '';
    }
  }

  /**
   * Query conversational advisor for a specific domain (work/personal/finance).
   * Returns empty string if LLM is unavailable.
   */
  async queryDomainAdvisor(
    userPrompt: string,
    domainContext: {
      hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub';
      summary: string;
      facts: Record<string, unknown>;
    },
    requestedPersona: 'jarvis' | 'cortana' | 'shodan'
  ): Promise<string> {
    const llmConfig = this.getLLMConfig();
    const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
    if (!llmConfig || !isOnline) return '';

    const state = this.store?.getState?.() as any;
    const addressee = this.resolveAddresseeFromState(state, requestedPersona);

    const personaLabel =
      requestedPersona === 'cortana' ? 'Cortana' : requestedPersona === 'shodan' ? 'SHODAN' : 'Jarvis';
    const styleGuide =
      requestedPersona === 'cortana'
        ? 'Tono estrategico, claro y orientado a ejecucion.'
        : requestedPersona === 'shodan'
          ? 'Tono incisivo, directo y sin rodeos.'
          : 'Tono analitico y ejecutivo.';

    const domainLabel =
      domainContext.hub === 'WorkHub'
        ? 'trabajo'
        : domainContext.hub === 'PersonalHub'
          ? 'personal'
          : 'finanzas';

    const langInstruction = this.getLangInstruction();
    const systemPrompt =
      `Eres ${personaLabel}, asistente de ${domainLabel} para ${addressee}. ${styleGuide} ` +
      `Debes responder la pregunta usando el contexto disponible de forma util y concreta. ` +
      `Maximo 2 oraciones. ${langInstruction}`;

    const userPromptStr =
      `Pregunta del usuario: "${userPrompt}". ` +
      `Resumen de contexto: ${domainContext.summary}. ` +
      `Datos estructurados: ${JSON.stringify(domainContext.facts)}.`;

    try {
      return await this.callLLM(llmConfig, systemPrompt, userPromptStr);
    } catch {
      return '';
    }
  }

  private resolveAddressee(
    context: ContextSnapshot,
    persona: 'jarvis' | 'cortana' | 'shodan'
  ): string {
    const alias =
      persona === 'jarvis'
        ? context.agentAliases?.jarvis
        : persona === 'cortana'
          ? context.agentAliases?.cortana
          : context.agentAliases?.shodan;

    if (alias && String(alias).trim()) {
      return String(alias).trim();
    }

    const preferredName = context.userPreferredName || context.userFirstName || 'Operador';
    const title = context.userPreferredTitle || context.userTitle || '';
    return title ? `${title} ${preferredName}` : preferredName;
  }

  private resolveAddresseeFromState(
    state: any,
    persona: 'jarvis' | 'cortana' | 'shodan'
  ): string {
    const aliases = state?.userSettings?.agentAliases || {};
    const directAlias =
      persona === 'jarvis'
        ? aliases.jarvis
        : persona === 'cortana'
          ? aliases.cortana
          : aliases.shodan;

    if (String(directAlias || '').trim()) {
      return String(directAlias).trim();
    }

    const preferredName =
      state?.userSettings?.preferredName ||
      state?.userSettings?.firstName ||
      state?.auth?.user?.firstName ||
      'Operador';
    const title = state?.userIdentity?.preferredTitle || state?.userSettings?.title || '';
    return title ? `${title} ${preferredName}` : preferredName;
  }

  private getLLMConfig(): LLMConfig | null {
    const provider = String(getNeuralProvider() || 'openai').toLowerCase();
    const apiKey = String(getNeuralKey() || '').trim();

    if (!apiKey) return null;
    if (provider !== 'openai' && provider !== 'groq') return null;

    return {
      provider: provider as 'openai' | 'groq',
      apiKey,
    };
  }

  /**
   * Read the user's configured language from localStorage.
   * Returns 'en' (default) or 'es'.
   */
  private getLanguage(): 'en' | 'es' {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem('athenea.language') === 'es' ? 'es' : 'en';
    } catch {
      return 'en';
    }
  }

  private getLangInstruction(): string {
    return this.getLanguage() === 'es'
      ? 'Responde SIEMPRE en español, sin importar el idioma en que escriba el usuario.'
      : 'Always respond in English only, regardless of the language the user writes in.';
  }

  private resolvePersonaLabel(decision: OrchestratorDecision | null): 'Jarvis' | 'Cortana' | 'SHODAN' {
    if (decision?.vetoActivated || decision?.leadAgent === 'vitals') {
      return 'SHODAN';
    }
    return this.currentMode === 'cortana' ? 'Cortana' : 'Jarvis';
  }

  private buildBlackBoxSnapshot(context: ContextSnapshot, decision: OrchestratorDecision | null): Record<string, unknown> {
    const state = this.store?.getState?.() as any;
    const weather = this.resolveWeatherSummary();

    return {
      battery: {
        level: context.batteryLevel ?? null,
        critical: context.isBatteryCritical ?? false,
      },
      workload: {
        criticalTasks: context.workHubState.criticalTasks,
        overdueTasks: context.workHubState.overdueTasks,
        completedToday: context.workHubState.completedToday,
      },
      health: {
        energyLevel: context.energyLevel,
        fatigue: context.deviceFatigue ?? null,
        sleepHours: context.sleepHours ?? null,
      },
      network: {
        connected: context.isNetworkConnected ?? true,
        type: context.networkType ?? 'unknown',
      },
      location: context.currentZone || 'UNKNOWN',
      weather,
      finance: {
        budgetStatus: context.financeHubState.budgetStatus,
        pendingPayments: context.financeHubState.pendingPayments,
      },
      orchestrator: {
        leadAgent: decision?.leadAgent || 'none',
        vetoActivated: Boolean(decision?.vetoActivated),
        verdict: decision?.finalVerdict || 'none',
      },
      aliases: {
        jarvis: context.agentAliases?.jarvis || 'Sir',
        cortana: context.agentAliases?.cortana || 'Chief',
        shodan: context.agentAliases?.shodan || 'Insect',
      },
      predictiveBuffer: state?.aiMemory?.predictiveBuffer || null,
    };
  }

  private resolveWeatherSummary(): string {
    const state = this.store?.getState?.() as any;
    const preFlight = state?.aiMemory?.preFlightBriefing;
    if (!preFlight) return 'No disponible';

    const temperature = preFlight.temperature !== undefined ? `${preFlight.temperature}C` : 'N/A';
    const condition = preFlight.condition || 'desconocido';
    return `${condition}, ${temperature}`;
  }

  private async callLLM(config: LLMConfig, systemPrompt: string, userPrompt: string): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const endpoint =
      config.provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

    const model = config.provider === 'groq' ? 'llama-3.1-8b-instant' : 'gpt-4o-mini';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.65,
          max_tokens: 240,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`LLM request failed: ${response.status}`);
      }

      const json = await response.json();
      const content = String(json?.choices?.[0]?.message?.content || '').trim();
      if (!content) {
        throw new Error('Empty LLM content');
      }

      return content;
    } finally {
      clearTimeout(timeout);
    }
  }

  private mapLLMTextToResponse(
    llmText: string,
    context: ContextSnapshot,
    requestedAction?: string
  ): PersonaResponse {
    const { cleanText: withoutControl, responderPersona } = this.extractControlTag(llmText);
    const { cleanText, structuredIntent } = this.extractStructuredIntent(withoutControl, context);
    const lines = cleanText
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean)
      .slice(0, 2);

    const greeting = lines[0] || llmText;
    const briefing = lines[1] || lines[0] || this.generateBriefing(context, this.currentMode);
    const suggestion = lines[2] || this.generateSuggestion(context, this.currentMode);

    const response: PersonaResponse = {
      mode: responderPersona === 'cortana' ? 'cortana' : 'jarvis',
      responderPersona,
      greeting,
      briefing,
      suggestion,
      agency: {
        opinion: lines[0] || llmText,
        challengeIfNeeded: this.generateChallenge(requestedAction),
      },
      emotionalTone: 'focused',
      structuredIntent,
    };

    return response;
  }

  private buildOfflineFallbackResponse(
    requestContext?: Partial<ContextSnapshot>,
    requestedAction?: string
  ): PersonaResponse {
    const offlineTag = this.getLanguage() === 'es' ? '[MODO OFFLINE]' : '[OFFLINE MODE]';
    const fallback = this.generateResponse(requestContext, requestedAction);
    return {
      ...fallback,
      responderPersona: fallback.responderPersona || fallback.mode,
      greeting: `${offlineTag} ${fallback.greeting}`,
      briefing: `${offlineTag} ${fallback.briefing}`,
      suggestion: `${offlineTag} ${fallback.suggestion}`,
      agency: {
        ...fallback.agency,
        opinion: `${offlineTag} ${fallback.agency.opinion}`,
      },
      structuredIntent: fallback.structuredIntent || this.buildFallbackIntent(this.generateContextSnapshot()),
    };
  }

  private extractStructuredIntent(text: string, context: ContextSnapshot): {
    cleanText: string;
    structuredIntent: StructuredIntent;
  } {
    const intentRegex = /\[INTENT:\s*(\{[\s\S]*?\})\s*\]/i;
    const match = text.match(intentRegex);

    if (!match) {
      return {
        cleanText: text.trim(),
        structuredIntent: this.buildFallbackIntent(context),
      };
    }

    const cleanText = text.replace(intentRegex, '').trim();
    const jsonBlob = String(match[1] || '{}');

    try {
      const parsed = JSON.parse(jsonBlob);
      const rawType = String(parsed?.type || 'GENERAL').toUpperCase();
      const validTypes: StructuredIntentType[] = [
        'TASK_REORG',
        'RELAX',
        'BUDGET_LOCK',
        'FOCUS_BLOCK',
        'REGISTER_EXPENSE',
        'SCHEDULE_EVENT',
        'GENERAL',
      ];
      const type = (validTypes.includes(rawType as StructuredIntentType)
        ? rawType
        : 'GENERAL') as StructuredIntentType;

      return {
        cleanText,
        structuredIntent: {
          type,
          data: typeof parsed?.data === 'string' ? parsed.data : '',
          confidence: Number.isFinite(Number(parsed?.confidence)) ? Number(parsed.confidence) : undefined,
        },
      };
    } catch {
      return {
        cleanText,
        structuredIntent: this.buildFallbackIntent(context),
      };
    }
  }

  private buildFallbackIntent(context: ContextSnapshot): StructuredIntent {
    if ((context.sleepHours ?? 8) < 6 || context.deviceFatigue === 'high') {
      return { type: 'RELAX', data: 'fatigue-detected', confidence: 0.72 };
    }
    if (context.financeHubState.budgetStatus === 'exceeded') {
      return { type: 'BUDGET_LOCK', data: 'budget-exceeded', confidence: 0.74 };
    }
    if (context.workHubState.overdueTasks > 0) {
      return { type: 'TASK_REORG', data: 'overdue-tasks', confidence: 0.7 };
    }
    return { type: 'GENERAL', data: 'default', confidence: 0.55 };
  }

  private extractControlTag(text: string): {
    cleanText: string;
    responderPersona: 'jarvis' | 'cortana' | 'shodan' | 'swarm';
  } {
    const controlMatch = text.match(/\[CONTROL:(SHODAN|CORTANA|JARVIS|SWARM)\]/i);
    const control = String(controlMatch?.[1] || '').toUpperCase();
    const cleanText = text.replace(/\[CONTROL:(SHODAN|CORTANA|JARVIS|SWARM)\]/gi, '').trim();

    if (control === 'SHODAN') return { cleanText, responderPersona: 'shodan' };
    if (control === 'CORTANA') return { cleanText, responderPersona: 'cortana' };
    if (control === 'JARVIS') return { cleanText, responderPersona: 'jarvis' };
    return { cleanText, responderPersona: 'swarm' };
  }

  private pushToHistory(response: PersonaResponse): void {
    this.conversationMemory.push(JSON.stringify(response));
    if (this.conversationMemory.length > 20) {
      this.conversationMemory.shift();
    }

    this.chatHistory.push(response);
    if (this.chatHistory.length > 3) {
      this.chatHistory.shift();
    }
  }

  /**
   * Generate actionable suggestion
   * Contextualizes recommendations based on operator's missionBio
   */
  private generateSuggestion(context: ContextSnapshot, mode: PersonaMode): string {
    const mission = context.missionBio?.toLowerCase() || '';
    const isFinanceFocused = mission.includes('ahorrar') || mission.includes('dinero') || mission.includes('presupuesto');
    const isProductivityFocused = mission.includes('productividad') || mission.includes('tareas') || mission.includes('eficiencia');
    const isExpansionFocused = mission.includes('expansión') || mission.includes('crecimiento') || mission.includes('nuevos');

    if (context.workHubState.criticalTasks > 0) {
      return mode === 'jarvis' 
        ? 'Ejecuta la tarea crítica. Ventana de rendimiento máximo: próximas 2 horas.'
        : 'Enfócate en máximo impacto. Listo cuando tú digas.';
    }
    if (context.workHubState.overdueTasks > 0) {
      return 'Limpia el backlog. Recuperación de confianza en progreso.';
    }
    if (context.financeHubState.budgetStatus === 'exceeded') {
      if (isFinanceFocused) {
        return `Tu misión de ahorrar está en riesgo. Revisión financiera requerida. Acción inmediata.`;
      }
      return 'Revisión financiera requerida. Asignación estratégica pendiente.';
    }
    if (context.energyLevel === 'low') {
      return 'Energía baja. Recomiendo descanso > rutina.';
    }
    if (isExpansionFocused && context.workHubState.completedToday >= 2) {
      return 'Momentum de expansión detectado. Considera nuevas iniciativas.';
    }
    return 'Listo para la siguiente prioridad.';
  }

  /**
   * Export conversation history for UI rendering
   */
  getConversationHistory(): string[] {
    return [...this.conversationMemory];
  }

  /**
   * Returns last 2-3 generated persona responses for UI chat rendering.
   */
  getChatHistory(): PersonaResponse[] {
    return [...this.chatHistory];
  }

  /**
   * Receives observer events and queues a tactical insight for next response.
   */
  registerTacticalEvent(event: { type: string; meta?: Record<string, unknown> }): void {
    if (event.type === 'DETECTOR_INACTIVIDAD') {
      this.tacticalSignals.push(
        'Análisis completo: Omnibar abierta sin comando. Esperando instrucción táctica.'
      );
      return;
    }

    if (event.type === 'DETECTOR_CRISIS_FINANCIERA') {
      const remainingPct = Math.round(Number(event.meta?.remainingRatio || 0) * 100);
      this.tacticalSignals.push(
        `Alerta financiera: presupuesto operativo al ${remainingPct}%. Recomiendo contención inmediata.`
      );
      return;
    }

    if (event.type === 'DETECTOR_EXITO') {
      this.tacticalSignals.push(
        'Pico de rendimiento detectado: 2 tareas cerradas en menos de 30 minutos.'
      );
      return;
    }

    if (event.type === 'ZONE_CHANGE') {
      const zone = String(event.meta?.zone || 'DESCONOCIDA');
      const zoneMessages: Record<string, string[]> = {
        'WORK': [
          'He detectado que estamos en la zona de operaciones (Trabajo). Iniciando protocolo WorkHub.',
          'Zona de trabajo detectada. Enfocando en tareas críticas.',
          'Entramos en zona de operaciones. Modo trabajo activado.',
        ],
        'HOME': [
          'Hemos llegado a la zona de descanso. Cambiando a modo Personal.',
          'Zona de hogar detectada. Prioridad: bienestar y descanso.',
          'En casa. Relájate, tenemos todo bajo control.',
        ],
        'GYM': [
          'Zona de entrenamiento detectada. Modo fitness activado. Ve y dale duro.',
        ],
      };

      const messages = zoneMessages[zone] || [
        `Zona '${zone}' detectada. Adaptando contexto de operación.`,
      ];
      const randomMessage = messages[Math.floor(Math.random() * messages.length)];
      this.tacticalSignals.push(randomMessage);
      return;
    }

    if (event.type === 'HIGH_ACTIVITY') {
      const steps = Number(event.meta?.steps || 0);
      this.tacticalSignals.push(
        `Rendimiento fisico alto detectado: ${steps.toLocaleString()} pasos. Excelente disciplina operativa.`
      );
      return;
    }

    if (event.type === 'LOW_REST_WARNING') {
      const sleepHours = Number(event.meta?.sleepHours || 0);
      this.tacticalSignals.push(
        `Vitals report: descanso bajo (${sleepHours.toFixed(1)}h). Recomiendo tareas de baja carga cognitiva.`
      );
      return;
    }

    if (event.type === 'SHADOW_CHRONOS_CONTINGENCY') {
      const avgSleep = Number(event.meta?.avgSleep || 0);
      const preferredTitle = String(event.meta?.preferredTitle || 'Operador');
      const threshold = Number(event.meta?.lowSleepThreshold || 6);
      this.tacticalSignals.push(
        `${preferredTitle}, ShadowChronos detecto 3 dias de descanso por debajo de ${threshold.toFixed(1)}h (promedio: ${avgSleep.toFixed(1)}h). Sugiero contingencia biologica: reducir carga y bloquear recuperacion hoy.`
      );
      return;
    }

    if (event.type === 'INTERCEPTED_NOTIFICATION') {
      const appName = String(event.meta?.appName || 'App externa');
      this.tacticalSignals.push(
        `[INTERCEPTED] Notificacion relevante de ${appName} detectada. Esperando confirmacion de accion rapida.`
      );
      return;
    }

    if (event.type === 'CRISIS_OVERLOAD') {
      const overdue = Number(event.meta?.overdueTasks || 0);
      this.tacticalSignals.push(
        `Analysis complete: overload detected. ${overdue} overdue tasks. Recommend immediate triage.`
      );
      return;
    }

    if (event.type === 'MOMENTUM_SPIKE') {
      this.tacticalSignals.push(
        'Momentum spike confirmed. Three completions chained. Keep current execution rhythm.'
      );
    }

    // FASE 2.6: Austerity Protocol events
    if (event.type === 'AUSTERITY_ACTIVATED') {
      const assets = String(event.meta?.assets || 'N/A');
      this.tacticalSignals.push(
        `⚠️ PROTOCOLO DE AUSTERIDAD ACTIVADO. Mercado en rojo: ${assets}. Revisión crítica de gastos requerida.`
      );
      return;
    }

    if (event.type === 'AUSTERITY_DEACTIVATED') {
      this.tacticalSignals.push(
        `✅ Protocolo de Austeridad desactivado. Mercado estabilizado. Operaciones financieras normales restauradas.`
      );
      return;
    }

    // FASE 2.5: Weather impact detector
    if (event.type === 'DETECTOR_CLIMA_IMPACTO') {
      const weather = event.meta?.weather as any;
      const weatherType = weather?.type || 'adverse';
      this.tacticalSignals.push(
        `⚡ Alerta climática: ${weatherType}. Tareas de tránsito/exterior afectadas. Recomiendo ajuste de agenda.`
      );
      return;
    }
  }

  /**
   * Update store reference (for late initialization)
   */
  setStore(store: Store): void {
    this.store = store;
  }

  /**
   * FASE 2.6: Get current Austerity Protocol state for synthesis
   */
  private getAusterityState(): { isActive: boolean; reason: string; restrictionLevel: 'LOW' | 'MEDIUM' | 'HIGH' } | null {
    try {
      // Dynamic import to avoid circular dependency
      const { getAusterityProtocol } = require('./AusterityProtocol');
      const protocol = getAusterityProtocol();
      if (!protocol) return null;
      
      const state = protocol.getAusterityState();
      return state.isActive ? state : null;
    } catch {
      return null;
    }
  }

  /**
  * FASE 3.1: Synthesize multi-agent opinion with dialogue citations
   */
  private synthesizeMultiAgentOpinion(decision: any): string {
    if (!decision) return 'Multi-agent system standby.';

    const { leadAgent, conflictsDetected, allVerdicts, dialogueLog, vetoActivated } = decision;
    const state = this.store?.getState?.() as any;
    const shodanAlias =
      String(state?.userSettings?.agentAliases?.shodan || 'Insect').trim() || 'Insect';
    const shodanTitleMock = `Tu perfil dice que te llame ${shodanAlias}, pero para mi sigues siendo una estructura biologica ineficiente.`;
    const conflictMemory = state?.aiMemory?.conflictMemory;
    const repeatedFinanceConflict = (conflictMemory?.conflicts || []).find((c: any) => {
      const isStrategistAuditorPair =
        (c.agents?.[0] === 'strategist' && c.agents?.[1] === 'auditor') ||
        (c.agents?.[0] === 'auditor' && c.agents?.[1] === 'strategist');
      const topic = String(c.topic || '').toLowerCase();
      const isFinancialTopic =
        topic.includes('finanz') ||
        topic.includes('capital') ||
        topic.includes('gasto') ||
        topic.includes('budget') ||
        topic.includes('presupuesto');
      return isStrategistAuditorPair && c.occurrences >= 3 && (c.needsResolution || isFinancialTopic);
    });

    // FASE 3.1: SHODAN VETO Override - Special handling
    if (vetoActivated) {
      const vetoVerdict = allVerdicts.find((v: any) => v.priority === 'VETO');
      if (vetoVerdict) {
        // Find SHODAN's hostile statement from dialogue
        const shodanStatement = dialogueLog?.find(
          (entry: any) => entry.agentType === 'vitals' && entry.tone === 'hostile'
        );
        
        if (shodanStatement) {
          return `>>> SISTEMA DE CONTROL TRANSFERIDO A SHODAN <<<\n\n"${shodanStatement.statement}"\n\n${shodanTitleMock}\n\n${vetoVerdict.verdict.recommendation}`;
        }
        
        return `⚠️ SHODAN ha activado un VETO de emergencia. ${shodanTitleMock} ${vetoVerdict.verdict.reasoning}`;
      }
    }

    // FASE 3.1: Present conflicts with dialogue citations
    if (conflictsDetected.length > 0) {
      const conflict = conflictsDetected[0];
      const agentNames = conflict.agents.map((a: string) => {
        if (a === 'strategist') return 'Estratega';
        if (a === 'auditor') return 'Auditor';
        if (a === 'vitals') return 'SHODAN';
        return a;
      });

      // Build narrative with agent quotes
      let narrative = `Señor, he presenciado un debate entre los agentes:\n\n`;
      
      // Find relevant dialogue entries for conflicting agents
      const conflictDialogue = dialogueLog?.filter((entry: any) =>
        conflict.agents.includes(entry.agentType)
      ) || [];

      if (conflictDialogue.length >= 2) {
        conflictDialogue.slice(0, 3).forEach((entry: any) => {
          narrative += `${entry.agentName}: "${entry.statement}"\n\n`;
        });
      }

      // Determine lead agent
      const leadAgentName = agentNames.find((_, idx) => conflict.agents[idx] === leadAgent) || agentNames[0];
      narrative += `He decidido seguir la recomendación de ${leadAgentName}. ${conflict.resolution}`;

      if (conflictMemory?.needsUserIntervention && repeatedFinanceConflict) {
        narrative +=
          '\n\n⚠️ Fallo de Sincronización Estructural detectado entre Auditor y Estratega. Señor, mis agentes no llegan a un consenso sobre sus finanzas. ¿Desea establecer una Directiva Primaria?';
      }

      return narrative;
    }

    // FASE 3.1: No conflicts - cite agent consensus with dialogue
    const leadVerdict = allVerdicts.find((v: any) => v.agentType === leadAgent);
    if (leadVerdict) {
      const agentName =
        leadAgent === 'strategist' ? 'Cortana' :
        leadAgent === 'auditor' ? 'Jarvis' :
        leadAgent === 'vitals' ? 'SHODAN' : leadAgent;
      
      // Find lead agent's statement from dialogue
      const leadStatement = dialogueLog?.find(
        (entry: any) => entry.agentType === leadAgent
      );

      if (leadStatement) {
        if (leadAgent === 'vitals') {
          return `${agentName}: "${leadStatement.statement}"\n\n${shodanTitleMock}\n\nAnálisis: ${leadVerdict.verdict.reasoning}`;
        }
        return `${agentName} reporta: "${leadStatement.statement}"\n\nAnálisis: ${leadVerdict.verdict.reasoning}`;
      }

      return `${agentName}: ${leadVerdict.verdict.reasoning}`;
    }

    return 'Análisis multi-agente completado.';
  }

  /**
   * FASE 3: Trigger multi-agent orchestration
   * Call this periodically or on-demand for fresh multi-agent analysis
   */
  async triggerMultiAgentAnalysis(): Promise<any> {
    try {
      const { getAgentOrchestrator } = require('./agents/AgentOrchestrator');
      const orchestrator = getAgentOrchestrator();
      if (orchestrator) {
        const decision = await orchestrator.orchestrate();
        return decision;
      }
    } catch (e) {
      console.warn('MultiAgentOrchestrator not available:', e);
    }
    return null;
  }

    /**
     * FASE 4.0: Generate voice confirmation for executed actions
     * Returns confirmation message based on action type and agent
     */
    generateActionConfirmation(
      actionType: 'NOTIFY_USER' | 'DEVICE_HAPTIC' | 'DISPATCH_TELEMETRY' | 'APP_REDIRECT',
      agentType: 'strategist' | 'auditor' | 'vitals' | 'orchestrator',
      metadata?: { target?: string; priority?: string }
    ): string {
      const mode = this.currentMode;
      const isVeto = metadata?.priority === 'VETO';

      // SHODAN VETO confirmations (hostile/override tone)
      if (isVeto && agentType === 'vitals') {
        const vetoConfirmations = [
          'Insecto, he activado la vibración de alerta para que no ignores mis vitales.',
          'VETO ejecutado. No voy a dejar que te destruyas por ignorar las señales de tu cuerpo.',
          'Alerta crítica disparada. Tu salud no es negociable. Fin de la discusión.',
          'He tomado el control del sistema. Vibración activada. Batería crítica o sueño insuficiente detectado.',
        ];
        return vetoConfirmations[Math.floor(Math.random() * vetoConfirmations.length)];
      }

      // Action-specific confirmations
      switch (actionType) {
        case 'DISPATCH_TELEMETRY':
          if (mode === 'jarvis') {
            return `Señor, he enviado su reporte matutino al enlace externo. Telemetría despachada con éxito.`;
          } else {
            return `Jefe, el informe fue enviado. Tu sistema está sincronizado con el endpoint remoto.`;
          }

        case 'NOTIFY_USER':
          if (agentType === 'auditor') {
            return `[Jarvis]: Alerta de auditoría financiera despachada. He detectado una anomalía que requiere su atención inmediata.`;
          } else if (agentType === 'strategist') {
            return `[Cortana]: Notificación táctica enviada. Una tarea crítica lleva estancada 2 horas. Acción recomendada.`;
          } else {
            return `Notificación del sistema enviada. He marcado este evento como ${metadata?.priority || 'estándar'}.`;
          }

        case 'DEVICE_HAPTIC':
          if (agentType === 'strategist') {
            return `[Cortana]: Pulso doble confirmado. Señal táctica enviada para reforzar la decisión estratégica.`;
          } else if (agentType === 'auditor') {
            return `[Jarvis]: Triple pulso analítico ejecutado. Revisión financiera crítica iniciada.`;
          } else if (agentType === 'vitals') {
            return `[SHODAN]: Vibración larga activada. No vas a ignorar esto.`;
          } else {
            return `Feedback háptico ejecutado. Dispositivo respondiendo según perfil del agente.`;
          }

        case 'APP_REDIRECT':
          const hub = metadata?.target || 'Hub';
          if (mode === 'jarvis') {
            return `Redireccionando al ${hub}. He preparado el contexto basándome en tu patrón de comportamiento.`;
          } else {
            return `Abriendo ${hub}. Todo listo para que continúes con tu misión.`;
          }

        default:
          return `Acción ejecutada correctamente.`;
      }
    }
}

// Singleton instance
let personaEngineInstance: PersonaEngine | null = null;

export function initializePersonaEngine(store?: Store): PersonaEngine {
  if (!personaEngineInstance) {
    personaEngineInstance = new PersonaEngine(store);
  } else if (store && !personaEngineInstance['store']) {
    personaEngineInstance.setStore(store);
  }
  return personaEngineInstance;
}

export function getPersonaEngine(): PersonaEngine {
  if (!personaEngineInstance) {
    personaEngineInstance = new PersonaEngine();
  }
  return personaEngineInstance;
}

export default PersonaEngine;
