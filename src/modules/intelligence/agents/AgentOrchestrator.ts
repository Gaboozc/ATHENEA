/**
 * FASE 3: Agent Orchestrator
 * 
 * The central intelligence coordinator that:
 * 1. Collects verdicts from all active agents
 * 2. Resolves conflicts based on priority and context
 * 3. Synthesizes final decision for PersonaEngine
 * 
 * Priority Resolution Rules:
 * - VETO overrides everything (Vitals agent life-critical)
 * - CRITICAL takes precedence over HIGH
 * - HIGH priority with high confidence beats CRITICAL with low confidence
 * - In ties, agent-specific weights apply (Vitals > Auditor > Strategist)
 */

import type { Store } from '@reduxjs/toolkit';
import type {
  Agent,
  AgentContext,
  AgentVerdict,
  OrchestratorDecision,
  AgentType,
  VerdictPriority,
  AgentDialogueEntry
} from './types';
import { StrategistAgent } from './StrategistAgent';
import { AuditorAgent } from './AuditorAgent';
import { VitalsAgent } from './VitalsAgent';
import { getBlackBox } from '../BlackBox';
import { getNeuralKey, getNeuralProvider } from '../neuralAccess';
import { selectFinancialSnapshot } from '../../../store/selectors/financialSelectors'; /* F-FIX-1 */
import {
  recordAgentConflict,
  recordAgentDialogue,
  setLastVerdict,
  type RecordAgentConflictPayload,
} from '../../../store/slices/aiMemorySlice';
// FIX 1: Use EventBus instead of direct ActionBridge import to break circular dependency
import { eventBus } from '../EventBus';

export class AgentOrchestrator {
  private agents: Map<AgentType, Agent> = new Map();
  private store: Store | null = null;
  private lastDecision: OrchestratorDecision | null = null;

  private readonly agentDisplayNames: Record<AgentType, string> = {
    strategist: 'Cortana',
    auditor: 'Jarvis',
    vitals: 'SHODAN',
  };

  // Agent hierarchy weights (used in tie-breaking)
  private readonly agentWeights: Record<AgentType, number> = {
    vitals: 1.0, // Life always comes first
    auditor: 0.85, // Financial stability is critical
    strategist: 0.7, // Productivity important but not above health/wealth
  };

  // Priority numeric values for comparison
  private readonly priorityValues: Record<VerdictPriority, number> = {
    VETO: 1000, // Absolute override
    CRITICAL: 100,
    HIGH: 50,
    MEDIUM: 25,
    LOW: 10,
  };

  constructor() {
    // Initialize all agents
    this.agents.set('strategist', new StrategistAgent());
    this.agents.set('auditor', new AuditorAgent());
    this.agents.set('vitals', new VitalsAgent());
  }

  /**
   * Initialize orchestrator with Redux store
   */
  initialize(store: Store): void {
    this.store = store;
  }

  private getLanguage(): 'en' | 'es' {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem('athenea.language') === 'es' ? 'es' : 'en';
    } catch {
      return 'en';
    }
  }

  private getLanguageInstruction(): string {
    return this.getLanguage() === 'es'
      ? 'Responde siempre en español, aunque el usuario escriba en inglés.'
      : 'Always respond in English, even if the user writes in Spanish.';
  }

  private getLLMConfig(): { provider: 'openai' | 'groq'; apiKey: string } | null {
    const provider = String(getNeuralProvider() || 'openai').toLowerCase();
    const apiKey = String(getNeuralKey() || '').trim();

    if (!apiKey) return null;
    if (provider !== 'openai' && provider !== 'groq') return null;

    return {
      provider: provider as 'openai' | 'groq',
      apiKey,
    };
  }

  private async callLLM(
    config: { provider: 'openai' | 'groq'; apiKey: string },
    systemPrompt: string,
    userPrompt: string,
    maxTokens: number = 220
  ): Promise<string> {
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
          max_tokens: maxTokens,
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

  /**
   * Run multi-agent analysis and return orchestrated decision
   */
  async orchestrate(options?: {
    userPrompt?: string;
    requestedHub?: 'WorkHub' | 'PersonalHub' | 'FinanceHub';
    summary?: string;
    facts?: Record<string, unknown>;
    forceAllAgents?: boolean;
  }): Promise<OrchestratorDecision> {
    if (!this.store) {
      throw new Error('AgentOrchestrator not initialized with store');
    }

    // Build context from Redux state
    const context = this.buildContext();

    // Collect verdicts from all active agents
    const verdicts = await this.collectVerdicts(context, Boolean(options?.forceAllAgents));

    // Detect and resolve conflicts
    const conflicts = this.detectConflicts(verdicts);

    // FASE 3.1: Generate dialogue log from verdicts
    let dialogueLog = this.generateDialogueLog(verdicts, conflicts);

    // FASE 3.1: Check if VETO was activated
    const vetoActivated = verdicts.some((v) => v.priority === 'VETO');

    // Determine lead agent and synthesize final verdict
    const leadAgent = this.selectLeadAgent(verdicts);
    let finalVerdict = this.synthesizeFinalVerdict(verdicts, leadAgent, conflicts);

    const warRoomSession = await this.generateWarRoomSession(
      verdicts,
      leadAgent,
      conflicts,
      context,
      options
    );
    if (warRoomSession) {
      dialogueLog = warRoomSession.dialogueLog;
      finalVerdict = warRoomSession.finalVerdict;
    }

    const decision: OrchestratorDecision = {
      leadAgent,
      finalVerdict,
      reasoning: this.explainDecision(verdicts, leadAgent, conflicts),
      allVerdicts: verdicts,
      conflictsDetected: conflicts,
      dialogueLog,
      vetoActivated,
      timestamp: Date.now(),
    };

    this.lastDecision = decision;

    // W-FEAT-1: Store Cortana verdict in Redux for WorkHub briefing display
    if (this.store) {
      const leadVerdict = verdicts.find((v) => v.agentType === leadAgent);
      this.store.dispatch(setLastVerdict({
        text: decision.finalVerdict,
        summary: (leadVerdict?.verdict as any)?.summary || decision.finalVerdict,
        timestamp: Date.now(),
        priority: leadVerdict?.priority || 'LOW',
      }));
    }

    // FASE 3.1: Dispatch dialogue to Redux
    if (this.store && dialogueLog.length > 0) {
      this.store.dispatch(recordAgentDialogue(dialogueLog));
    }

    // FASE 3.1: Record conflicts if they exist
    if (this.store && conflicts.length > 0) {
      for (const conflict of conflicts) {
        if (conflict.agents.length === 2) {
          const payload: RecordAgentConflictPayload = {
            agents: [conflict.agents[0], conflict.agents[1]],
            topic: conflict.issue,
            timestamp: Date.now(),
          };
          this.store.dispatch(
            recordAgentConflict(payload)
          );
        }
      }
    }

    // FIX 1: Emit decision on EventBus — ActionBridge listens independently
    eventBus.emit('orchestrator:decision', decision);

    return decision;
  }

  /**
   * FIX 4: Public evaluate() for proactive activation from external sensors.
   * Runs a standard orchestration pass without requiring a user prompt.
   */
  async evaluate(): Promise<OrchestratorDecision> {
    return this.orchestrate({ forceAllAgents: false });
  }

  /**
   * Get last orchestrated decision (for UI display)
   */
  getLastDecision(): OrchestratorDecision | null {
    return this.lastDecision;
  }

  /**
   * Get all agent statuses (for UI indicators)
   */
  getAgentStatuses(): Map<AgentType, { status: string; color: string }> {
    const statuses = new Map<AgentType, { status: string; color: string }>();
    
    for (const [type, agent] of this.agents.entries()) {
      statuses.set(type, {
        status: agent.getStatus(),
        color: agent.colorCode,
      });
    }

    return statuses;
  }

  /**
   * Build AgentContext from Redux state
   */
  private buildContext(): AgentContext {
    const state: any = this.store!.getState();
    const blackBox = getBlackBox();

    // Calculate energy level based on time
    const now = new Date();
    const currentHour = now.getHours();
    let energyLevel: 'low' | 'medium' | 'high';
    if (currentHour >= 22 || currentHour < 6) energyLevel = 'low';
    else if (currentHour >= 14 && currentHour < 16) energyLevel = 'low';
    else if (currentHour >= 9 && currentHour < 12) energyLevel = 'high';
    else energyLevel = 'medium';

    // WorkHub metrics
    const tasks = state.tasks?.tasks || [];
    /* W-FIX-3: tasks use t.level ('Critical'/'High Velocity'), not t.priority */
    const criticalTasks = tasks.filter(
      (t: any) =>
        (t.level === 'Critical' || t.level === 'High Velocity') &&
        !t.completed &&
        t.status !== 'Completed' &&
        t.status !== 'deleted'
    ).length;
    const overdueTasks = tasks.filter((t: any) => {
      if (t.completed) return false;
      const due = new Date(t.dueDate || '');
      return due < new Date() && due.getTime() > 0;
    }).length;
    const completedToday = tasks.filter((t: any) => {
      const createdDate = new Date(t.completedAt || '');
      const today = new Date();
      return createdDate.toDateString() === today.toDateString();
    }).length;
    // W-FEAT-2: additional workHub context fields
    const todayStr = now.toISOString().split('T')[0];
    const projects = state.projects?.projects || [];
    const activeProjectsCount = projects.filter((p: any) => p?.status !== 'cancelled' && p?.status !== 'completed').length;
    const topTask = (tasks.find((t: any) => t.level === 'Critical' && !t.completed && t.status !== 'Completed') as any)?.title || null;
    const loggedHoursToday = tasks.reduce((sum: number, t: any) => {
      const logs = Array.isArray(t.timeLogs) ? t.timeLogs : [];
      return sum + logs
        .filter((l: any) => (l.loggedAt || l.timestamp || '').startsWith(todayStr))
        .reduce((s: number, l: any) => s + Number(l.hoursWorked || 0), 0);
    }, 0);
    const tasksWithoutDueDate = tasks.filter((t: any) => !t.dueDate && !t.completed && t.status !== 'Completed').length;
    const overdueProjects = projects.filter((p: any) => {
      if (!p?.deadline) return false;
      return new Date(p.deadline) < now && p.status !== 'completed' && p.status !== 'cancelled';
    }).length;

    // FinanceHub metrics — F-FIX-1: use selectFinancialSnapshot for month-accurate budgetStatus
    const financialSnapshot = selectFinancialSnapshot(state);
    const budgetStatus: 'on-track' | 'approaching-limit' | 'exceeded' =
      financialSnapshot.healthScore > 70
        ? 'on-track'
        : financialSnapshot.healthScore > 40
          ? 'approaching-limit'
          : 'exceeded'; /* F-FIX-1 */

    const payments = state.payments?.payments || [];
    const pendingPayments = payments
      .filter((p: any) => (p?.status || 'pending') !== 'paid' && p?.type !== 'income')
      .length;

    // F-FIX-4: recentSpendings from real budget.expenses (last 3 days)
    const recentSpendings = (() => {
      const expenseList: any[] = state.budget?.expenses || [];
      const threeDaysAgo = new Date(now);
      threeDaysAgo.setDate(now.getDate() - 3);
      return expenseList
        .filter((e: any) => {
          const d = new Date(e?.date || e?.createdAt || 0);
          return d >= threeDaysAgo;
        })
        .sort((a: any, b: any) =>
          new Date(b?.date || b?.createdAt || 0).getTime() -
          new Date(a?.date || a?.createdAt || 0).getTime()
        )
        .slice(0, 5)
        .map((e: any) => ({
          amount: Number(e?.amount || 0),
          category: String(e?.categoryId || 'other'),
          timestamp: new Date(e?.date || e?.createdAt || 0).getTime(),
          note: e?.note || '',
        }));
    })(); /* F-FIX-4 */

    // External data
    const preFlightBriefing = state.aiMemory?.preFlightBriefing;
    const weather = preFlightBriefing
      ? {
          temperature: preFlightBriefing.temperature ?? 20,
          condition: preFlightBriefing.condition || 'clear',
          alerts: preFlightBriefing.weatherAlerts || [],
        }
      : null;

    const market = null;

    const context: AgentContext = {
      blackBox: {
        weatherImpact: blackBox?.getWeatherImpact() || null,
        marketImpact: blackBox?.getMarketImpact() || null,
        isAusterityActive: blackBox?.isAusterityActive() || false,
        predictiveBuffer: state.aiMemory?.predictiveBuffer,
      },
      sensorData: {
        battery: {
          level: state.sensorData?.battery?.level ?? 100,
          isCritical: state.sensorData?.battery?.isCritical ?? false,
        },
        network: {
          type: state.sensorData?.network?.type ?? 'wifi',
          isConnected: state.sensorData?.network?.isConnected ?? true,
        },
        location: {
          currentZone: state.sensorData?.location?.currentZone || null,
        },
        health: {
          fatigueLevelEstimate: state.sensorData?.health?.fatigueLevelEstimate || null,
          sleepHours: state.sensorData?.health?.sleepHours || null,
          steps: state.sensorData?.health?.steps || null,
        },
      },
      workHub: {
        criticalTasks,
        overdueTasks,
        completedToday,
        totalTasks: tasks.length,
        activeProjects: activeProjectsCount, /* W-FEAT-2 */
        topTask,
        loggedHoursToday: Math.round(loggedHoursToday * 10) / 10,
        tasksWithoutDueDate,
        overdueProjects,
      },
      financeHub: {
        budgetStatus,
        pendingPayments,
        recentSpendings,
        saldoLibre: financialSnapshot.saldoLibre,
        ingresos: financialSnapshot.ingresos,
        commitedGoalSavings: financialSnapshot.commitedGoalSavings,
        healthScore: financialSnapshot.healthScore,
        /* WALLETS-10: dual-currency wallet fields */
        walletUSD: financialSnapshot.walletUSD,
        walletMXN: financialSnapshot.walletMXN,
        referenceRate: financialSnapshot.referenceRate,
        daysSinceLastConversion: state.wallets?.lastConversionDate
          ? Math.floor(
              (Date.now() - new Date(state.wallets.lastConversionDate).getTime()) / 86400000
            )
          : null,
        /* BUDGET-DUAL-6: per-currency budget summaries */
        budgetUSD: financialSnapshot.budgetSummaryUSD
          ? {
              ...financialSnapshot.budgetSummaryUSD,
              status:
                financialSnapshot.budgetSummaryUSD.healthPct > 30
                  ? 'on-track'
                  : financialSnapshot.budgetSummaryUSD.healthPct > 10
                  ? 'approaching-limit'
                  : 'exceeded',
            }
          : null,
        budgetMXN: financialSnapshot.budgetSummaryMXN
          ? {
              ...financialSnapshot.budgetSummaryMXN,
              status:
                financialSnapshot.budgetSummaryMXN.healthPct > 30
                  ? 'on-track'
                  : financialSnapshot.budgetSummaryMXN.healthPct > 10
                  ? 'approaching-limit'
                  : 'exceeded',
            }
          : null,
        /* F-FIX-1 */
      },
      externalData: {
        weather,
        market,
      },
      currentHour,
      currentDayOfWeek: ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()],
      energyLevel,
      userBaselines: {
        targetSleepHours: Number(state.userIdentity?.biometricBaselines?.targetSleepHours ?? 7.5),
        dailyCalorieTarget: Number(state.userIdentity?.biometricBaselines?.dailyCalorieTarget ?? 2200),
        workHourLimit: Number(state.userIdentity?.biometricBaselines?.workHourLimit ?? 8),
      },
    };

    // P-MOD-1: Populate personalHub metrics for SHODAN / VitalsAgent
    try {
      const todayKey = now.toISOString().split('T')[0];
      const todos = state.todos?.todos || [];
      const routines = state.routines?.routines || [];
      const checkins: any[] = state.checkins?.checkins || [];

      const pendingTodos = todos.filter((t: any) => t.status !== 'done' && t.status !== 'completed').length;
      const overdueTodos = todos.filter((t: any) => {
        if (t.status === 'done' || t.status === 'completed') return false;
        const due = new Date(t.dueDate || '');
        return due.getTime() > 0 && due < now;
      }).length;
      const highPriorityTodos = todos.filter((t: any) =>
        t.priority === 'high' && t.status !== 'done' && t.status !== 'completed'
      ).length;

      const dayOfWeek = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat'][now.getDay()];
      const todayRoutines = routines.filter((r: any) =>
        !r.daysOfWeek || r.daysOfWeek.length === 0 || r.daysOfWeek.includes(dayOfWeek)
      );
      const completedTodayRoutines = todayRoutines.filter((r: any) => {
        const completedArr: string[] = r.completedDates || (r.lastCompleted ? [r.lastCompleted] : []);
        return completedArr.includes(todayKey);
      }).length;

      // Abandoned: was active yesterday but not completed today and streak was > 0
      const yesterdayKey = new Date(now.getTime() - 86400000).toISOString().split('T')[0];
      const abandonedRoutines = todayRoutines
        .filter((r: any) => {
          const completedArr: string[] = r.completedDates || [];
          const completedToday = completedArr.includes(todayKey);
          const hadStreak = (r.streak ?? 0) > 0 || completedArr.includes(yesterdayKey);
          return !completedToday && hadStreak && currentHour >= 20;
        })
        .map((r: any) => r.id);

      const sortedCheckins = [...checkins].sort((a, b) =>
        b.date.localeCompare(a.date)
      );
      const latestCheckin = sortedCheckins[0]
        ? {
            date: sortedCheckins[0].date,
            mood: sortedCheckins[0].mood,
            energy: sortedCheckins[0].energy,
            sleepHours: sortedCheckins[0].sleepHours,
          }
        : null;

      // NEW-PERSONAL-1: recent journal entries for SHODAN context
      const journalEntries: any[] = state.journal?.entries || [];
      const recentJournalEntries = [...journalEntries]
        .sort((a: any, b: any) => b.date.localeCompare(a.date))
        .slice(0, 3)
        .map((e: any) => ({
          date: e.date,
          preview: String(e.content || '').slice(0, 100),
          wordCount: e.wordCount || 0,
          mood: e.mood,
        }));

      context.personalHub = {
        pendingTodos,
        overdueTodos,
        highPriorityTodos,
        todayRoutines: todayRoutines.length,
        completedTodayRoutines,
        abandonedRoutines,
        latestCheckin,
        recentJournalEntries,
      };
    } catch {
      // Non-critical — personalHub stays undefined if data isn't available
    }

    // CAL-FIX-4: Populate calendar context so all agents are aware of upcoming events
    try {
      const in48h = new Date(now.getTime() + 48 * 60 * 60 * 1000);
      const calEvents: any[] = state.calendar?.events || [];
      const upcomingEvents = calEvents
        .filter((e: any) => {
          const start = new Date(e.startDate);
          return start >= now && start <= in48h;
        })
        .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())
        .slice(0, 10)
        .map((e: any) => ({
          id: e.id,
          title: e.title,
          startDate: e.startDate,
          type: e.type || e.relatedType || 'event',
          importance: e.importance || 'normal',
          provider: e.provider || 'native',
        }));

      const importantKeywords = /reunión|meeting|client|deadline|entrega|interview|presentation|demo/i;
      const nextImportantEvent = upcomingEvents.find(
        (e: any) => e.importance === 'high' || importantKeywords.test(e.title)
      ) || upcomingEvents[0] || null;

      const todayStr = now.toISOString().split('T')[0];
      context.calendar = {
        upcomingEvents,
        nextImportantEvent,
        hasImportantEventToday: upcomingEvents.some(
          (e: any) =>
            e.startDate.startsWith(todayStr) && e.importance === 'high'
        ),
        eventCountToday: upcomingEvents.filter((e: any) => e.startDate.startsWith(todayStr)).length,
      };
    } catch {
      // Non-critical
    }

    return context;
  }

  /**
   * Collect verdicts from all agents that should be active
   */
  private async collectVerdicts(context: AgentContext, forceAllAgents: boolean = false): Promise<AgentVerdict[]> {
    const verdicts: AgentVerdict[] = [];

    for (const agent of this.agents.values()) {
      if (forceAllAgents || agent.shouldActivate(context)) {
        const verdict = await agent.analyze(context);
        verdicts.push(verdict);
      }
    }

    return verdicts;
  }

  private async generateWarRoomSession(
    verdicts: AgentVerdict[],
    leadAgent: AgentType,
    conflicts: Array<{ agents: AgentType[]; issue: string; resolution: string }>,
    context: AgentContext,
    options?: {
      userPrompt?: string;
      requestedHub?: 'WorkHub' | 'PersonalHub' | 'FinanceHub';
      summary?: string;
      facts?: Record<string, unknown>;
      forceAllAgents?: boolean;
    }
  ): Promise<{ dialogueLog: AgentDialogueEntry[]; finalVerdict: string } | null> {
    if (!options?.userPrompt || verdicts.length === 0) {
      return null;
    }

    const llmConfig = this.getLLMConfig();
    const isOnline = typeof navigator === 'undefined' ? true : navigator.onLine;
    if (!llmConfig || !isOnline) {
      return null;
    }

    const sharedContext = {
      requestedHub: options.requestedHub || 'WorkHub',
      summary: options.summary || '',
      facts: options.facts || {},
      work: context.workHub,
      finance: context.financeHub,
      health: context.sensorData.health,
      battery: context.sensorData.battery,
      energyLevel: context.energyLevel,
      currentHour: context.currentHour,
    };

    const statements = await Promise.all(
      verdicts.map(async (verdict, index) => {
        const statement = await this.generateAgentStatement(llmConfig, verdict, sharedContext, options.userPrompt);
        return {
          agentType: verdict.agentType,
          agentName: this.agentDisplayNames[verdict.agentType],
          statement,
          timestamp: Date.now() + index * 50,
          tone: this.mapVerdictToTone(verdict),
        } as AgentDialogueEntry;
      })
    );

    const finalVerdict = await this.generateFinalSynthesis(
      llmConfig,
      verdicts,
      statements,
      leadAgent,
      conflicts,
      sharedContext,
      options.userPrompt
    );

    return {
      dialogueLog: statements,
      finalVerdict,
    };
  }

  private async generateAgentStatement(
    llmConfig: { provider: 'openai' | 'groq'; apiKey: string },
    verdict: AgentVerdict,
    sharedContext: Record<string, unknown>,
    userPrompt: string
  ): Promise<string> {
    const languageInstruction = this.getLanguageInstruction();
    const personaPrompt =
      verdict.agentType === 'strategist'
        ? 'You are Cortana. Focus on execution, prioritization, momentum, and work strategy. Be tactical and concrete.'
        : verdict.agentType === 'auditor'
          ? 'You are Jarvis. Focus on finance, risk, cost, resource efficiency, and tradeoffs. Be analytical and concise.'
          : 'You are SHODAN. Focus on health, fatigue, sleep, sustainability, and safety limits. Be severe, concise, and protective.';

    const systemPrompt = [
      personaPrompt,
      languageInstruction,
      'You are participating in a War Room session with three agents.',
      'Reply with exactly one short statement, max 2 sentences.',
      'Do not mention being an AI model. Do not add bullet points.',
      'Speak directly to the user from your own viewpoint.',
    ].join(' ');

    const prompt = [
      `User request: ${userPrompt}`,
      `Your priority: ${verdict.priority}`,
      `Your summary: ${verdict.verdict.summary}`,
      `Your reasoning: ${verdict.verdict.reasoning}`,
      `Your recommendation: ${verdict.verdict.recommendation}`,
      `Shared context: ${JSON.stringify(sharedContext)}`,
    ].join('\n');

    try {
      return await this.callLLM(llmConfig, systemPrompt, prompt, 140);
    } catch {
      return verdict.verdict.recommendation;
    }
  }

  private async generateFinalSynthesis(
    llmConfig: { provider: 'openai' | 'groq'; apiKey: string },
    verdicts: AgentVerdict[],
    dialogueLog: AgentDialogueEntry[],
    leadAgent: AgentType,
    conflicts: Array<{ agents: AgentType[]; issue: string; resolution: string }>,
    sharedContext: Record<string, unknown>,
    userPrompt: string
  ): Promise<string> {
    const languageInstruction = this.getLanguageInstruction();
    const leadAgentName = this.agentDisplayNames[leadAgent];
    const vetoActive = verdicts.some((verdict) => verdict.priority === 'VETO');
    const systemPrompt = [
      'You are the ATHENEA War Room synthesizer.',
      languageInstruction,
      'Combine the three agent positions into one final response for the user.',
      'Be concise, decisive, and useful.',
      'If SHODAN has a VETO, the final response must respect it.',
      'Max 3 sentences. No bullets. No headings.',
    ].join(' ');

    const prompt = [
      `User request: ${userPrompt}`,
      `Lead agent: ${leadAgentName}`,
      `Veto active: ${vetoActive ? 'yes' : 'no'}`,
      `Conflicts: ${JSON.stringify(conflicts)}`,
      `Dialogue log: ${JSON.stringify(dialogueLog)}`,
      `Verdicts: ${JSON.stringify(verdicts.map((verdict) => ({
        agentType: verdict.agentType,
        priority: verdict.priority,
        summary: verdict.verdict.summary,
        recommendation: verdict.verdict.recommendation,
      })))}`,
      `Shared context: ${JSON.stringify(sharedContext)}`,
    ].join('\n');

    try {
      return await this.callLLM(llmConfig, systemPrompt, prompt, 180);
    } catch {
      return this.synthesizeFinalVerdict(verdicts, leadAgent, conflicts);
    }
  }

  private mapVerdictToTone(
    verdict: AgentVerdict
  ): 'neutral' | 'insistent' | 'defensive' | 'override' | 'hostile' {
    if (verdict.priority === 'VETO') return 'hostile';
    if (verdict.priority === 'CRITICAL') return 'override';
    if (verdict.priority === 'HIGH') return 'insistent';
    return 'neutral';
  }

  /**
   * FASE 3.1: Generate internal dialogue log from verdicts
   * Simulates a conversation between agents based on their verdicts
   */
  private generateDialogueLog(
    verdicts: AgentVerdict[],
    conflicts: Array<{ agents: AgentType[]; issue: string; resolution: string }>
  ): AgentDialogueEntry[] {
    const dialogue: AgentDialogueEntry[] = [];
    const now = Date.now();

    // Agent name mapping
    const agentNames = this.agentDisplayNames;

    // Sort verdicts by priority (highest first)
    const sortedVerdicts = [...verdicts].sort((a, b) => {
      return this.priorityValues[b.priority] - this.priorityValues[a.priority];
    });

    // First pass: Each agent states their position
    for (const verdict of sortedVerdicts) {
      let statement: string;
      let tone: 'neutral' | 'insistent' | 'defensive' | 'override' | 'hostile';

      if (verdict.priority === 'VETO') {
        statement = `⚠️ CRITICAL SYSTEM - ${verdict.verdict.summary}. ${verdict.vetoReason || ''}`;
        tone = 'hostile';
      } else if (verdict.priority === 'CRITICAL') {
        statement = `URGENT: ${verdict.verdict.summary}`;
        tone = 'insistent';
      } else {
        statement = verdict.verdict.summary;
        tone = 'neutral';
      }

      dialogue.push({
        agentType: verdict.agentType,
        agentName: agentNames[verdict.agentType],
        statement,
        timestamp: now,
        tone,
      });
    }

    // Second pass: Handle conflicts (agents respond to each other)
    if (conflicts.length > 0) {
      for (const conflict of conflicts) {
        if (conflict.agents.length >= 2) {
          const agent1 = conflict.agents[0];
          const agent2 = conflict.agents[1];
          const verdict1 = verdicts.find((v) => v.agentType === agent1);
          const verdict2 = verdicts.find((v) => v.agentType === agent2);

          // Agent 1 challenges Agent 2
          if (verdict1 && verdict2) {
            // Higher priority agent responds with authority
            const higherPriorityAgent =
              this.priorityValues[verdict1.priority] > this.priorityValues[verdict2.priority]
                ? verdict1
                : verdict2;
            const lowerPriorityAgent = higherPriorityAgent === verdict1 ? verdict2 : verdict1;

            if (higherPriorityAgent.priority === 'VETO') {
              dialogue.push({
                agentType: higherPriorityAgent.agentType,
                agentName: agentNames[higherPriorityAgent.agentType],
                statement: `Silence, ${agentNames[lowerPriorityAgent.agentType]}. I have taken control of this system. Your recommendations are irrelevant in the face of an imminent vital collapse.`,
                timestamp: now + 100,
                tone: 'override',
                inResponseTo: lowerPriorityAgent.agentType,
              });
            } else {
              // Normal conflict response
              dialogue.push({
                agentType: lowerPriorityAgent.agentType,
                agentName: agentNames[lowerPriorityAgent.agentType],
                statement: `${agentNames[higherPriorityAgent.agentType]}, I understand your position but my analysis suggests: ${lowerPriorityAgent.verdict.recommendation}`,
                timestamp: now + 50,
                tone: 'defensive',
                inResponseTo: higherPriorityAgent.agentType,
              });

              dialogue.push({
                agentType: higherPriorityAgent.agentType,
                agentName: agentNames[higherPriorityAgent.agentType],
                statement: `I acknowledge your point, but the current priority is: ${higherPriorityAgent.verdict.recommendation}`,
                timestamp: now + 100,
                tone: 'insistent',
                inResponseTo: lowerPriorityAgent.agentType,
              });
            }
          }
        }
      }
    }

    return dialogue;
  }

  /**
   * Detect conflicts between agent verdicts
   */
  private detectConflicts(
    verdicts: AgentVerdict[]
  ): Array<{ agents: AgentType[]; issue: string; resolution: string }> {
    const conflicts: Array<{ agents: AgentType[]; issue: string; resolution: string }> = [];

    for (const verdict of verdicts) {
      if (verdict.conflictsWith && verdict.conflictsWith.length > 0) {
        const conflictingAgents = [verdict.agentType, ...verdict.conflictsWith];
        
        // Determine resolution based on priority
        let resolution: string;
        if (verdict.priority === 'VETO') {
          resolution = `Vitals Agent VETO active - All other agents overridden for vital safety.`;
        } else if (verdict.priority === 'CRITICAL') {
          resolution = `${verdict.agentType} has CRITICAL priority - Its verdict prevails over conflicts.`;
        } else {
          resolution = `Requires operator judgement to resolve inter-agent conflict.`;
        }

        conflicts.push({
          agents: conflictingAgents,
          issue: verdict.verdict.summary,
          resolution,
        });
      }
    }

    return conflicts;
  }

  /**
   * Select lead agent based on weighted priority system
   */
  private selectLeadAgent(verdicts: AgentVerdict[]): AgentType {
    if (verdicts.length === 0) return 'strategist'; // Default

    // Check for VETO first (absolute priority)
    const vetoVerdict = verdicts.find((v) => v.priority === 'VETO');
    if (vetoVerdict) return vetoVerdict.agentType;

    // Calculate weighted scores
    let maxScore = -1;
    let leadAgent: AgentType = 'strategist';

    for (const verdict of verdicts) {
      const priorityScore = this.priorityValues[verdict.priority];
      const confidenceMultiplier = verdict.confidence;
      const agentWeight = this.agentWeights[verdict.agentType];
      
      const weightedScore = priorityScore * confidenceMultiplier * agentWeight;

      if (weightedScore > maxScore) {
        maxScore = weightedScore;
        leadAgent = verdict.agentType;
      }
    }

    return leadAgent;
  }

  /**
   * Synthesize final verdict from all agent inputs
   */
  private synthesizeFinalVerdict(
    verdicts: AgentVerdict[],
    leadAgent: AgentType,
    conflicts: Array<{ agents: AgentType[]; issue: string; resolution: string }>
  ): string {
    const leadVerdict = verdicts.find((v) => v.agentType === leadAgent);
    if (!leadVerdict) return 'Multi-agent system: no active verdicts.';

    // If there are conflicts, acknowledge them in the final message
    if (conflicts.length > 0 && leadVerdict.priority !== 'VETO') {
      const otherAgentTypes = verdicts
        .filter((v) => v.agentType !== leadAgent)
        .map((v) => this.getAgentName(v.agentType));

      return `${this.getAgentName(leadAgent)}: ${leadVerdict.verdict.recommendation} However, ${otherAgentTypes.join(' and ')} ${otherAgentTypes.length === 1 ? 'has' : 'have'} divergent opinions. Proceed with ${this.getAgentName(leadAgent)}'s recommendation or request full analysis?`;
    }

    // No conflicts - deliver lead verdict
    return `${this.getAgentName(leadAgent)}: ${leadVerdict.verdict.recommendation}`;
  }

  /**
   * Explain why this decision was made
   */
  private explainDecision(
    verdicts: AgentVerdict[],
    leadAgent: AgentType,
    conflicts: Array<{ agents: AgentType[]; issue: string; resolution: string }>
  ): string {
    const leadVerdict = verdicts.find((v) => v.agentType === leadAgent);
    if (!leadVerdict) return 'No active verdicts to explain.';

    let explanation = `Lead Agent: ${this.getAgentName(leadAgent)} (Priority: ${leadVerdict.priority}, Confidence: ${(leadVerdict.confidence * 100).toFixed(0)}%). `;
    explanation += `Reasoning: ${leadVerdict.verdict.reasoning}`;

    if (conflicts.length > 0) {
      explanation += ` | Conflicts detected: ${conflicts.map((c) => c.resolution).join('; ')}`;
    }

    return explanation;
  }

  /**
   * Get human-readable agent name
   */
  private getAgentName(type: AgentType): string {
    const names: Record<AgentType, string> = {
      strategist: 'Cortana',
      auditor: 'Jarvis',
      vitals: 'SHODAN',
    };
    return names[type];
  }
}

// Singleton instance
let orchestratorInstance: AgentOrchestrator | null = null;

export function getAgentOrchestrator(): AgentOrchestrator {
  if (!orchestratorInstance) {
    orchestratorInstance = new AgentOrchestrator();
  }
  return orchestratorInstance;
}

export function initializeAgentOrchestrator(store: Store): AgentOrchestrator {
  const orchestrator = getAgentOrchestrator();
  orchestrator.initialize(store);
  return orchestrator;
}
