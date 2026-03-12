/**
 * ATHENEA Hybrid Intelligence Bridge v2.0
 * 
 * Multi-layer intent recognition engine:
 * 
 * LAYER 1: Fast Path (Regex) - <1ms latency
 *   - Optimized pattern matching for 80% of common cases
 *   - Direct action/entity detection
 *   
 * LAYER 2: Smart Path (ONNX) - ~50-150ms latency
 *   - Sentence embeddings with all-MiniLM-L6-v2
 *   - Semantic similarity matching
 *   - 100% offline, no API calls
 *   
 * LAYER 3: OpenClaw Gateway (Optional) - ~200-500ms latency
 *   - Full LLM reasoning for complex queries
 *   - Requires VITE_OPENCLAW_GATEWAY_URL in .env
 *   - Fallback for ambiguous cases
 * 
 * Inspired by OpenClaw's Agent Loop:
 * Input → Intent Analysis → Skill Selection → Execution → Artifact → Output
 */

import {
  IntelligenceRequest,
  IntelligenceResponse,
  IntentAnalysis,
  SkillManifest,
  ReduxAction,
  CanvasArtifact,
  SkillExecutionContext
} from './types';
import { 
  allSkills, 
  findSkillByKeywords, 
  getSkillById,
  getSkillsByHub 
} from './skills';
import { extractParameters } from './utils/parser.ts';
import type { SmartResolverContext } from './utils/smartResolver';

// Import inference layers
import { fastPathMatcher } from './inference/FastPathMatcher';
import { getONNXEngine } from './inference/ONNXInferenceEngine';
import { suggestionsEngine } from './inference/SuggestionsEngine';
import { getPersonaEngine } from './personaEngine';
import { getAgentOrchestrator } from './agents/AgentOrchestrator';

/**
 * Inference layer enum
 */
enum InferenceLayer {
  FAST_PATH = 'FAST_PATH',
  SMART_PATH = 'SMART_PATH',
  OPENCLAW_GATEWAY = 'OPENCLAW_GATEWAY',
  FALLBACK = 'FALLBACK'
}

/**
 * The Hybrid Intelligence Bridge
 */
export class IntelligenceBridge {
  private conversationHistory: IntelligenceRequest[] = [];
  private recentActions: string[] = [];
  private onnxInitialized: boolean = false;
  /** Read UI language from localStorage — same key used by LanguageContext.jsx */
  private getLanguage(): 'en' | 'es' {
    try {
      return typeof localStorage !== 'undefined' && localStorage.getItem('athenea.language') === 'es' ? 'es' : 'en';
    } catch {
      return 'en';
    }
  }

  /** Bilingual helper — picks ES or EN string based on configured language */
  private tr(en: string, es: string): string {
    return this.getLanguage() === 'es' ? es : en;
  }


  private readonly domainKeywords: Record<'WorkHub' | 'PersonalHub' | 'FinanceHub', RegExp[]> = {
    WorkHub: [
      /\btask\b/i,
      /\bproject\b/i,
      /\bcollaborator\b/i,
      /\bcolaborador\b/i,
    ],
    PersonalHub: [
      /\broutine\b/i,
      /\brutina\b/i,
      /\bto[\s-]?do\b/i,
      /\bnote\b/i,
      /\bnota\b/i,
    ],
    FinanceHub: [
      /\bbudget\b/i,
      /\bbudgeting\b/i,
      /\bspend\b/i,
      /\bdraw\b/i,
      /\bfinance\b/i,
      /\bfinancial\b/i,
      /\bfinanzas\b/i,
      /\bpresupuesto\b/i,
      /\bgasto\b/i,
      /\bingreso\b/i,
      /\bexpense\b/i,
      /\bincome\b/i,
      /\bpayment\b/i,
      /\bpay\b/i,
      /\bcost\b/i,
      /\bwallet\b/i,
      /\bmoney\b/i,
      /\bdebt\b/i,
      /\bdebit\b/i,
      /\bcredit\b/i,
      /\bwithdraw\b/i,
      /\bwithdrawal\b/i,
      /\bsalary\b/i,
      /\brevenue\b/i,
    ],
  };

  private detectHubFromKeywords(userPrompt: string): 'WorkHub' | 'PersonalHub' | 'FinanceHub' | null {
    const text = String(userPrompt || '');
    let bestHub: 'WorkHub' | 'PersonalHub' | 'FinanceHub' | null = null;
    let bestScore = 0;

    for (const hub of Object.keys(this.domainKeywords) as Array<'WorkHub' | 'PersonalHub' | 'FinanceHub'>) {
      const score = this.domainKeywords[hub].reduce((acc, pattern) => {
        return acc + (pattern.test(text) ? 1 : 0);
      }, 0);
      if (score > bestScore) {
        bestScore = score;
        bestHub = hub;
      }
    }

    return bestScore > 0 ? bestHub : null;
  }

  private detectPersonaFromPrompt(userPrompt: string): 'jarvis' | 'cortana' | 'shodan' | null {
    const text = String(userPrompt || '').toLowerCase();
    if (/\bcortana\b/i.test(text)) return 'cortana';
    if (/\bshodan\b/i.test(text)) return 'shodan';
    if (/\bjarvis\b/i.test(text)) return 'jarvis';
    return null;
  }
  
  constructor() {
    // Start ONNX initialization in background (lazy)
    this.initializeONNX();
  }

  /**
   * Initialize ONNX engine (async, non-blocking)
   */
  private async initializeONNX(): Promise<void> {
    try {
      const engine = getONNXEngine();
      await engine.initialize();
      await engine.precomputeSkillEmbeddings(allSkills);
      this.onnxInitialized = true;
      console.log('[Bridge] ONNX engine ready');
    } catch (error) {
      console.warn('[Bridge] ONNX initialization failed, using Fast Path only:', error);
    }
  }

  /**
   * Main entry point: Process a user prompt with Hybrid Intelligence
   * Returns an IntelligenceResponse with reasoning, action, and artifact
   */
  async processPrompt(
    request: IntelligenceRequest,
    reduxGetState: () => any,
    reduxDispatch: (action: ReduxAction) => void
  ): Promise<IntelligenceResponse> {
    this.conversationHistory.push(request);
    const keywordHub = this.detectHubFromKeywords(request.userPrompt);
    const effectiveHub = keywordHub || request.context.currentHub;
    const hub = (effectiveHub || 'WorkHub') as 'WorkHub' | 'PersonalHub' | 'FinanceHub';

    // Every prompt is always handled by the domain agent (Cortana / SHODAN / Jarvis).
    // No skill matching, no forms — the AI agent always responds.
    try {
      return await this.handleConversationalQuestion(
        request,
        hub,
        null,
        100,
        InferenceLayer.FAST_PATH,
        reduxGetState
      );
    } catch (error) {
      console.error('[Bridge] Error:', error);
      return this.createErrorResponse(
        request,
        'An error occurred while processing your request'
      );
    }
  }

  /**
   * Execute a confirmed action (after user approves artifact)
   */
  async executeAction(
    response: IntelligenceResponse,
    reduxDispatch: (action: ReduxAction) => void,
    reduxGetState: () => any
  ): Promise<void> {
    if (!response.reduxAction) {
      throw new Error('No action to execute');
    }

    // Dispatch to Redux
    reduxDispatch(response.reduxAction);

    // Log execution
    console.log(`[Intelligence] Executed action: ${response.reduxAction.type}`);
  }

  /**
   * Query OpenClaw Gateway (optional remote LLM inference)
   */
  private async queryOpenClawGateway(
    userPrompt: string,
    context: any
  ): Promise<{ skillId: string; confidence: number } | null> {
    const gatewayUrl = import.meta.env.VITE_OPENCLAW_GATEWAY_URL;
    const apiKey = import.meta.env.VITE_OPENCLAW_API_KEY;
    
    if (!gatewayUrl) {
      return null;
    }

    try {
      const response = await fetch(`${gatewayUrl}/agent`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(apiKey && { 'Authorization': `Bearer ${apiKey}` })
        },
        body: JSON.stringify({
          message: userPrompt,
          context: {
            hub: context.currentHub,
            availableSkills: allSkills.map(s => ({
              id: s.id,
              name: s.name,
              description: s.description
            }))
          }
        }),
        signal: AbortSignal.timeout(5000) // 5s timeout
      });

      if (!response.ok) {
        throw new Error(`Gateway returned ${response.status}`);
      }

      const data = await response.json();
      
      if (data.skillId && data.confidence) {
        return {
          skillId: data.skillId,
          confidence: data.confidence
        };
      }
      
      return null;
    } catch (error) {
      console.error('[Bridge] Gateway query failed:', error);
      return null;
    }
  }

  /**
   * Calculate enhanced confidence score
   * Factors in: base confidence, keywords, prompt length, parameter completeness, specificity
   */
  private calculateEnhancedConfidence(
    userPrompt: string,
    skill: SkillManifest,
    params: Record<string, any>,
    allRequiredPresent: boolean,
    baseConfidence: number
  ): number {
    const lowerPrompt = userPrompt.toLowerCase();
    const matchedKeywords = skill.keywords.filter(kw => lowerPrompt.includes(kw));
    
    let confidence = baseConfidence || 0;

    // Factor 1: Keyword matching (20 points max)
    confidence += Math.min(20, matchedKeywords.length * 10);

    // Factor 2: Required parameters present (25 points)
    if (allRequiredPresent) {
      confidence += 25;
    } else {
      const requiredCount = Object.values(skill.paramSchema).filter(p => p.required).length;
      const presentCount = Object.entries(skill.paramSchema)
        .filter(([id, def]) => def.required && params[id] !== undefined)
        .length;
      confidence += Math.round((presentCount / requiredCount) * 25);
    }

    // Factor 3: Prompt specificity (15 points)
    const hasQuotes = /"[^"]+"|'[^']+'/.test(userPrompt);
    const hasNumbers = /\d+/.test(userPrompt);
    const hasDates = /(today|tomorrow|monday|tuesday|next week)/i.test(userPrompt);
    
    if (hasQuotes) confidence += 6;
    if (hasNumbers) confidence += 5;
    if (hasDates) confidence += 4;

    // Factor 4: Length and detail (10 points)
    if (userPrompt.length > 30) confidence += 5;
    if (userPrompt.length > 60) confidence += 5;

    return Math.min(100, Math.round(confidence));
  }

  /**
   * Get contextual command suggestions for Omnibar
   */
  getContextualSuggestions(
    currentHub: 'WorkHub' | 'PersonalHub' | 'FinanceHub',
    reduxState: any,
    maxSuggestions: number = 5
  ) {
    const context = suggestionsEngine.buildContext(
      currentHub,
      reduxState,
      this.recentActions
    );
    
    return suggestionsEngine.getSuggestions(context, maxSuggestions);
  }

  /**
   * Get list of missing required parameters
   */
  private getMissingRequiredParams(
    skill: SkillManifest,
    params: Record<string, any>
  ): string[] {
    return Object.entries(skill.paramSchema)
      .filter(([id, def]) => def.required && (params[id] === undefined || params[id] === '' || params[id] === null))
      .map(([id, def]) => def.description || id);
  }

  /**
   * Step 4: Build Canvas Artifact for preview
   * Creates a form/table showing what will be created
   */
  private buildCanvasArtifact(
    skill: SkillManifest,
    params: Record<string, any>,
    storeState: any
  ): CanvasArtifact {
    const projectOptions = (Array.isArray(storeState?.projects?.projects) ? storeState.projects.projects : [])
      .filter((project: any) => project && project.status !== 'cancelled')
      .map((project: any) => ({
        label: String(project.title || project.name || `Project ${project.id || ''}`).trim(),
        value: project.id
      }))
      .filter((project: any) => project.value !== undefined && project.value !== null && project.label);

    const fields = Object.entries(skill.paramSchema).map(([fieldId, fieldSchema]) => ({
      ...(skill.id === 'add_task' && fieldId === 'projectId'
        ? {
            label: 'Active project',
            type: 'select' as const,
            options: projectOptions
          }
        : {
            label: fieldSchema.description || fieldId,
            type: fieldSchema.type === 'textarea' ? 'textarea' : 
                  fieldSchema.type === 'select' ? 'select' :
                  fieldSchema.type as any,
            options: fieldSchema.enum?.map(e => ({ label: e, value: e }))
          }),
      id: fieldId,
      value: params[fieldId] || '',
      required: fieldSchema.required
    }));

    return {
      type: 'form',
      props: {
        title: `Create new: ${skill.name}`,
        description: skill.description,
        fields,
        actionLabel: 'Confirm & Create',
        cancelLabel: 'Cancel'
      }
    };
  }

  /**
   * Step 5: Build Redux action ready to be dispatched
   */
  private buildReduxAction(
    skill: SkillManifest,
    params: Record<string, any>
  ): ReduxAction {
    return {
      type: skill.action,
      payload: {
        ...params,
        createdAt: Date.now(),
        id: this.generateId()
      }
    };
  }

  /**
   * Generate a friendly message to show to the user
   */
  private generateUserMessage(skill: SkillManifest, params: Record<string, any>): string {
    const title = params.title || params.text || params.description || 'item';
    return `I'm ready to create a new ${skill.name.toLowerCase()}: "${title}". Please review and confirm!`;
  }

  /**
   * Handle conversational query skills (action === 'agent/query').
   * Reads budget state, computes available funds, optionally calls LLM,
   * and returns a text artifact with the inline answer.
   * No Redux action is dispatched.
   */
  private async handleAgentQuerySkill(
    request: IntelligenceRequest,
    skill: SkillManifest,
    confidence: number,
    inferenceLayer: InferenceLayer,
    reduxGetState: () => any
  ): Promise<IntelligenceResponse> {
    const state = reduxGetState();

    const requestedPersona: 'jarvis' = 'jarvis';
    const requestedPersonaLabel = 'Jarvis';
    const requestedPersonaIcon = '🤖';

    // Extract queried amount from prompt (e.g. "50" from "puedo gastar 50")
    const amountMatch = /(\d+(?:[.,]\d+)?)/.exec(request.userPrompt);
    const queriedAmount = amountMatch ? parseFloat(amountMatch[1].replace(',', '.')) : null;

    // Compute budget figures from Redux state
    const budgets: any[] = state.budget?.categories || [];
    const expenses: any[] = state.budget?.expenses || [];

    const totalBudget = budgets.reduce((sum, b) => sum + Number(b?.limit || 0), 0);
    const totalSpent = expenses.reduce((sum, e) => sum + Number(e?.amount || 0), 0);
    const available = totalBudget - totalSpent;

    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const weeklySpent = expenses
      .filter((e) => new Date(e?.date || e?.createdAt || 0) >= weekStart)
      .reduce((sum, e) => sum + Number(e?.amount || 0), 0);

    // Rule-based answer (offline fallback)
    let answer: string;
    if (totalBudget === 0) {
      answer = this.tr(
        'No budget configured yet. Go to Finance → Budget to set limits.',
        'No tienes presupuesto configurado aún. Ve a Finanzas → Presupuesto para establecer límites.'
      );
    } else if (queriedAmount !== null) {
      if (available <= 0) {
        answer = this.getLanguage() === 'es'
          ? `⚠️ Tu presupuesto está agotado. Has gastado ${totalSpent.toFixed(2)} de ${totalBudget.toFixed(2)} disponibles.`
          : `⚠️ Your budget is exhausted. You have spent ${totalSpent.toFixed(2)} of ${totalBudget.toFixed(2)}.`;
      } else if (queriedAmount > available) {
        answer = this.getLanguage() === 'es'
          ? `❌ No te recomiendo gastar ${queriedAmount}. Solo te quedan ${available.toFixed(2)} disponibles (gastado: ${totalSpent.toFixed(2)} / límite: ${totalBudget.toFixed(2)}).`
          : `❌ I advise against spending ${queriedAmount}. Only ${available.toFixed(2)} remaining (spent: ${totalSpent.toFixed(2)} / limit: ${totalBudget.toFixed(2)}).`;
      } else {
        answer = this.getLanguage() === 'es'
          ? `✅ Sí, puedes gastar ${queriedAmount}. Tienes ${available.toFixed(2)} disponibles (gastado esta semana: ${weeklySpent.toFixed(2)} / límite total: ${totalBudget.toFixed(2)}).`
          : `✅ Yes, you can spend ${queriedAmount}. You have ${available.toFixed(2)} available (spent this week: ${weeklySpent.toFixed(2)} / total limit: ${totalBudget.toFixed(2)}).`;
      }
    } else {
      answer = this.getLanguage() === 'es'
        ? `Tienes ${available.toFixed(2)} disponibles. Gastado total: ${totalSpent.toFixed(2)} de ${totalBudget.toFixed(2)}.`
        : `You have ${available.toFixed(2)} available. Total spent: ${totalSpent.toFixed(2)} of ${totalBudget.toFixed(2)}.`;
    }

    // Attempt LLM enrichment for a more natural response
    try {
      const persona = getPersonaEngine();
      const llmAnswer = await persona.queryFinancialAdvisor(request.userPrompt, {
        queriedAmount,
        available,
        totalBudget,
        totalSpent,
        weeklySpent,
      }, requestedPersona);
      if (llmAnswer && llmAnswer.trim()) {
        answer = llmAnswer.trim();
      }
    } catch {
      // Keep rule-based answer
    }

    return {
      id: request.id,
      success: true,
      reasoning: {
        matchedSkill: skill,
        confidence: Math.min(100, confidence),
        reasoning: `[${inferenceLayer}] Consulta de presupuesto en tiempo real`,
        responderPersona: requestedPersona,
        allRequiredParamsPresent: true,
        missingParams: [],
      },
      // No reduxAction → prevents auto-execution
      artifact: {
        type: 'text',
        props: {
          title: `${requestedPersonaIcon} ${requestedPersonaLabel} — ${this.tr('Financial Analysis', 'Análisis Financiero')}`,
          description: answer,
          actionLabel: this.tr('Got it', 'Entendido'),
          cancelLabel: this.tr('View budget', 'Ver presupuesto'),
        },
      },
      userMessage: answer,
      timestamp: Date.now(),
    };
  }

  private isConversationalQuestion(
    userPrompt: string,
    selectedSkill: SkillManifest | null
  ): boolean {
    if (selectedSkill?.action === 'agent/query') return true;

    const text = String(userPrompt || '').toLowerCase().trim();
    if (!text) return false;

    const questionSignal =
      /\?|\b(what|which|who|when|where|why|how|next|cual|cu[aá]l|que|qu[eé]|siguiente|proxima|pr[oó]xima)\b/i.test(text);
    if (!questionSignal) return false;

    const imperativeStart =
      /^(create|add|new|start|open|set|update|delete|remove|record|log|sync|crear|agrega|agregar|abre|abrir|establece|actualiza|elimina|registra)\b/i.test(
        text
      );
    if (imperativeStart) return false;

    return true;
  }

  private async handleConversationalQuestion(
    request: IntelligenceRequest,
    hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub',
    selectedSkill: SkillManifest | null,
    confidence: number,
    inferenceLayer: InferenceLayer,
    reduxGetState: () => any
  ): Promise<IntelligenceResponse> {
    const state = reduxGetState();
    const lower = String(request.userPrompt || '').toLowerCase();

    const explicitPersona = this.detectPersonaFromPrompt(request.userPrompt);
    const persona = explicitPersona || (hub === 'FinanceHub' ? 'jarvis' : hub === 'PersonalHub' ? 'shodan' : 'cortana');
    const personaLabel = persona === 'jarvis' ? 'Jarvis' : persona === 'shodan' ? 'SHODAN' : 'Cortana';
    const personaIcon = persona === 'jarvis' ? '🤖' : persona === 'shodan' ? '👁️' : '🧿';

    let fallbackAnswer = this.tr(
      'I have your context updated. Give me a bit more detail to answer precisely.',
      'Tengo tu contexto actualizado. Dame un poco mas de detalle para responder con precision.'
    );
    let summary = '';
    let facts: Record<string, unknown> = {};

    if (hub === 'WorkHub') {
      const tasks: any[] = state.tasks?.tasks || [];
      const openTasks = tasks.filter((t) => !t?.completed);
      const nextTaskIntent = /\b(next task|my next task|siguiente tarea|proxima tarea|pr[oó]xima tarea|what.*task|which.*task)\b/i.test(lower);

      if (nextTaskIntent) {
        const priorityRank: Record<string, number> = { high: 0, medium: 1, low: 2 };
        const sorted = [...openTasks].sort((a, b) => {
          const dueA = new Date(a?.dueDate || '').getTime();
          const dueB = new Date(b?.dueDate || '').getTime();
          const safeA = Number.isFinite(dueA) && dueA > 0 ? dueA : Number.MAX_SAFE_INTEGER;
          const safeB = Number.isFinite(dueB) && dueB > 0 ? dueB : Number.MAX_SAFE_INTEGER;
          if (safeA !== safeB) return safeA - safeB;
          const pA = priorityRank[String(a?.priority || 'medium')] ?? 1;
          const pB = priorityRank[String(b?.priority || 'medium')] ?? 1;
          return pA - pB;
        });

        const nextTask = sorted[0] || null;
        if (!nextTask) {
          fallbackAnswer = this.tr('You have no pending tasks right now.', 'No tienes tareas pendientes ahora mismo.');
          summary = 'No open tasks.';
          facts = { openTasks: 0 };
        } else {
          const dueDate = nextTask?.dueDate ? new Date(nextTask.dueDate) : null;
          const dueText = dueDate && Number.isFinite(dueDate.getTime())
            ? dueDate.toLocaleString()
            : this.tr('no due date', 'sin fecha limite');
          fallbackAnswer = this.getLanguage() === 'es'
            ? `Tu siguiente tarea es: ${nextTask.title || nextTask.name || 'Tarea sin titulo'} (${nextTask.priority || 'medium'}), vence ${dueText}.`
            : `Your next task is: ${nextTask.title || nextTask.name || 'Untitled task'} (${nextTask.priority || 'medium'}), due ${dueText}.`;
          summary = `Next task: ${nextTask.title || nextTask.name || 'Untitled task'} (${nextTask.priority || 'medium'}) due ${dueText}.`;
          facts = {
            openTasks: openTasks.length,
            nextTask: {
              title: nextTask.title || nextTask.name || 'Untitled task',
              priority: nextTask.priority || 'medium',
              dueDate: nextTask.dueDate || null,
            },
          };
        }
      } else {
        const overdue = openTasks.filter((t) => {
          const due = new Date(t?.dueDate || '').getTime();
          return Number.isFinite(due) && due > 0 && due < Date.now();
        }).length;
        fallbackAnswer = this.getLanguage() === 'es'
          ? `Tienes ${openTasks.length} tareas abiertas y ${overdue} vencidas.`
          : `You have ${openTasks.length} open tasks and ${overdue} overdue.`;
        summary = `Open tasks: ${openTasks.length}. Overdue: ${overdue}.`;
        facts = { openTasks: openTasks.length, overdueTasks: overdue };
      }
    } else if (hub === 'PersonalHub') {
      const reminders = state.notes?.reminders || [];
      const notes = state.notes?.notes || [];
      fallbackAnswer = this.getLanguage() === 'es'
        ? `En personal tienes ${reminders.length} recordatorios pendientes y ${notes.length} notas guardadas.`
        : `In Personal you have ${reminders.length} pending reminders and ${notes.length} saved notes.`;
      summary = `Pending reminders: ${reminders.length}. Notes: ${notes.length}.`;
      facts = { remindersPending: reminders.length, noteCount: notes.length };
    } else {
      const budgets: any[] = state.budget?.categories || [];
      const expenses: any[] = state.budget?.expenses || [];
      const totalBudget = budgets.reduce((sum, b) => sum + Number(b?.limit || 0), 0);
      const totalSpent = expenses.reduce((sum, e) => sum + Number(e?.amount || 0), 0);
      const available = totalBudget - totalSpent;
      fallbackAnswer = this.getLanguage() === 'es'
        ? `En finanzas tienes ${available.toFixed(2)} disponibles (gastado ${totalSpent.toFixed(2)} de ${totalBudget.toFixed(2)}).`
        : `In Finance you have ${available.toFixed(2)} available (spent ${totalSpent.toFixed(2)} of ${totalBudget.toFixed(2)}).`;
      summary = `Budget available: ${available.toFixed(2)}.`;
      facts = { totalBudget, totalSpent, available };
    }

    let answer = fallbackAnswer;
    let responderPersona: 'jarvis' | 'cortana' | 'shodan' | 'swarm' = persona;

    // If the user explicitly calls an agent by name, that agent must answer.
    if (!explicitPersona) {
      try {
        const orchestrator = getAgentOrchestrator();
        const warRoomDecision = await orchestrator.orchestrate({
          userPrompt: request.userPrompt,
          requestedHub: hub,
          summary,
          facts,
          forceAllAgents: true,
        });

        if (warRoomDecision?.finalVerdict?.trim()) {
          answer = warRoomDecision.finalVerdict.trim();
          responderPersona =
            warRoomDecision.leadAgent === 'auditor'
              ? 'jarvis'
              : warRoomDecision.leadAgent === 'vitals'
                ? 'shodan'
                : 'cortana';
        } else {
          const llmAnswer = await getPersonaEngine().queryDomainAdvisor(
            request.userPrompt,
            {
              hub,
              summary,
              facts,
            },
            persona
          );
          if (llmAnswer && llmAnswer.trim()) {
            answer = llmAnswer.trim();
          }
        }
      } catch {
        try {
          const llmAnswer = await getPersonaEngine().queryDomainAdvisor(
            request.userPrompt,
            {
              hub,
              summary,
              facts,
            },
            persona
          );
          if (llmAnswer && llmAnswer.trim()) {
            answer = llmAnswer.trim();
          }
        } catch {
          // Keep deterministic fallback
        }
      }
    } else {
      try {
        const llmAnswer = await getPersonaEngine().queryDomainAdvisor(
          request.userPrompt,
          {
            hub,
            summary,
            facts,
          },
          persona
        );
        if (llmAnswer && llmAnswer.trim()) {
          answer = llmAnswer.trim();
        }
      } catch {
        // Keep deterministic fallback when LLM is unavailable.
      }
    }

    return {
      id: request.id,
      success: true,
      reasoning: {
        matchedSkill: selectedSkill,
        confidence: Math.max(70, Math.min(100, confidence || 0)),
        reasoning: `[${inferenceLayer}] Conversational response routed to ${hub}`,
        responderPersona,
        allRequiredParamsPresent: true,
        missingParams: [],
      },
      artifact: {
        type: 'text',
        props: {
          title: `${personaIcon} ${personaLabel} — ${this.tr('Response', 'Respuesta')}`,
          description: answer,
          actionLabel: this.tr('Got it', 'Entendido'),
          cancelLabel: this.tr('Close', 'Cerrar'),
        },
      },
      userMessage: answer,
      timestamp: Date.now(),
    };
  }

  /**
   * Error response builder
   */
  private createErrorResponse(
    request: IntelligenceRequest,
    error: string
  ): IntelligenceResponse {
    return {
      id: request.id,
      success: false,
      reasoning: {
        matchedSkill: null,
        confidence: 0,
        reasoning: error
      },
      userMessage: error,
      timestamp: Date.now()
    };
  }

  /**
   * Simple ID generator
   */
  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get conversation history (for context awareness)
   */
  getConversationHistory(): IntelligenceRequest[] {
    return this.conversationHistory;
  }

  /**
   * Clear conversation history
   */
  clearHistory(): void {
    this.conversationHistory = [];
  }
}

/**
 * Singleton instance of the Bridge
 * Used throughout the Intelligence module
 */
export const intelligenceBridge = new IntelligenceBridge();
