/**
 * FASE 3: Multi-Agent Swarm - Agent Type Definitions
 * 
 * Base types for the distributed intelligence system.
 * Each agent is an independent reasoning process that consumes BlackBox data
 * and emits verdicts with priority weightings.
 */

export type AgentType = 'strategist' | 'auditor' | 'vitals';

export type AgentStatus = 'idle' | 'analyzing' | 'ready' | 'veto' | 'conflict';

export type VerdictPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'VETO';

export const VERDICT_PRIORITY_WEIGHT: Record<VerdictPriority, number> = {
  LOW: 10,
  MEDIUM: 20,
  HIGH: 30,
  CRITICAL: 40,
  VETO: 100,
};

export function isPriorityAtLeast(
  priority: VerdictPriority,
  minimum: VerdictPriority
): boolean {
  return VERDICT_PRIORITY_WEIGHT[priority] >= VERDICT_PRIORITY_WEIGHT[minimum];
}

/**
 * Agent Verdict - The output of an agent's analysis
 */
export interface AgentVerdict {
  agentType: AgentType;
  priority: VerdictPriority;
  confidence: number; // 0-1, how confident is the agent
  timestamp: number;
  verdict: {
    summary: string; // One-line conclusion
    reasoning: string; // Detailed explanation
    recommendation: string; // What user should do
    dataSource: string[]; // What data was analyzed
  };
  conflictsWith?: AgentType[]; // Other agents this verdict conflicts with
  vetoReason?: string; // If priority is VETO, explain why
}

/**
 * Agent Context - Shared data structure all agents can read
 */
export interface AgentContext {
  // From BlackBox
  blackBox: {
    weatherImpact: { condition: string; productivity: number; confidence: number } | null;
    marketImpact: { state: string; spending: number; confidence: number } | null;
    isAusterityActive: boolean;
    predictiveBuffer: any;
  };
  
  // From Redux sensors
  sensorData: {
    battery: { level: number; isCritical: boolean };
    network: { type: string; isConnected: boolean };
    location: { currentZone: string | null };
    health: {
      fatigueLevelEstimate: 'low' | 'medium' | 'high' | null;
      sleepHours: number | null;
      steps: number | null;
    };
  };

  // From Redux state
  workHub: {
    criticalTasks: number;
    overdueTasks: number;
    completedToday: number;
    totalTasks: number;
    // W-FEAT-2: expanded context fields
    activeProjects: number;
    topTask: string | null;
    loggedHoursToday: number;
    tasksWithoutDueDate: number;
    overdueProjects: number;
  };

  financeHub: {
    budgetStatus: 'on-track' | 'approaching-limit' | 'exceeded';
    pendingPayments: number;
    recentSpendings: Array<{ amount: number; category: string; timestamp: number; note?: string }>;
    /* F-FIX-1: real financial data from selectFinancialSnapshot */
    saldoLibre: number;
    ingresos: number;
    commitedGoalSavings: number;
    healthScore: number;
    queryAmount?: number; // F-FIX-5: optional amount for budget queries
    /* WALLETS-10: dual-currency wallet fields */
    walletUSD?: number;
    walletMXN?: number;
    referenceRate?: number;
    daysSinceLastConversion?: number | null;
    budgetUSD?: { totalLimit: number; totalSpent: number; available: number; healthPct: number; status: string } | null;
    budgetMXN?: { totalLimit: number; totalSpent: number; available: number; healthPct: number; status: string } | null;
  };

  // From Phase 2.5
  externalData: {
    weather: {
      temperature: number;
      condition: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snow';
      alerts: any[];
    } | null;
    market: {
      assetAlerts: any[];
      averageChange: number;
    } | null;
  };

  // Current time context
  currentHour: number;
  currentDayOfWeek: string;
  energyLevel: 'low' | 'medium' | 'high';

  userBaselines?: {
    targetSleepHours: number;
    dailyCalorieTarget: number;
    workHourLimit: number;
  };

  // P-MOD-1: Personal area metrics for SHODAN (VitalsAgent)
  personalHub?: {
    pendingTodos: number;
    overdueTodos: number;
    highPriorityTodos: number;
    todayRoutines: number;
    completedTodayRoutines: number;
    abandonedRoutines: string[]; // routine ids with streak broken today
    latestCheckin: {
      date: string;
      mood: number;
      energy: number;
      sleepHours: number;
    } | null;
    recentJournalEntries?: Array<{
      date: string;
      preview: string;
      wordCount: number;
      mood?: number;
    }>;
  };

  // CAL-FIX-4: Calendar context — upcoming events visible to all agents
  calendar?: {
    upcomingEvents: Array<{
      id: string;
      title: string;
      startDate: string;
      type: string;
      importance: string;
      provider: string;
    }>;
    nextImportantEvent: {
      id: string; title: string; startDate: string;
      type: string; importance: string; provider: string;
    } | null;
    hasImportantEventToday: boolean;
    eventCountToday: number;
  };
}

/**
 * Base Agent Interface
 * All agents must implement this contract
 */
export interface Agent {
  readonly type: AgentType;
  readonly name: string;
  readonly colorCode: string; // For UI indicators
  
  /**
   * Analyze current context and emit a verdict
   */
  analyze(context: AgentContext): Promise<AgentVerdict>;

  /**
   * Check if agent should be active based on context
   */
  shouldActivate(context: AgentContext): boolean;

  /**
   * Get current status of the agent
   */
  getStatus(): AgentStatus;
}

/**
 * FASE 3.1: Agent Dialogue Entry
 * Represents a single statement in the agent debate
 */
export interface AgentDialogueEntry {
  agentType: AgentType;
  agentName: string;
  statement: string; // What the agent said
  timestamp: number;
  tone: 'neutral' | 'insistent' | 'defensive' | 'override' | 'hostile';
  inResponseTo?: AgentType; // If this is a response to another agent
}

/**
 * FASE 3.1: Conflict Memory Entry
 * Tracks recurring conflicts between agents
 */
export interface ConflictMemoryEntry {
  id: string; // Unique identifier for this conflict pattern
  agents: [AgentType, AgentType]; // Two agents in conflict
  topic: string; // What they disagree about (e.g., "spending-on-tools")
  occurrences: number; // How many times this has happened
  lastOccurrence: number; // Timestamp of last conflict
  needsResolution: boolean; // If > 3 occurrences, flag for user intervention
}

/**
 * Orchestrator Decision - The final synthesized response
 */
export interface OrchestratorDecision {
  leadAgent: AgentType; // Which agent had the highest weighted priority
  finalVerdict: string; // Synthesized message for user
  reasoning: string; // Why this decision was made
  allVerdicts: AgentVerdict[]; // All agent verdicts for transparency
  conflictsDetected: Array<{
    agents: AgentType[];
    issue: string;
    resolution: string;
  }>;
  // FASE 3.1: Dialogue log
  dialogueLog: AgentDialogueEntry[]; // Internal debate between agents
  vetoActivated: boolean; // If SHODAN took control
  timestamp: number;
}
