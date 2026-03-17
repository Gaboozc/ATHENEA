import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import type { AgentDialogueEntry, ConflictMemoryEntry } from '../../modules/intelligence/agents/types';
import type { AgentType } from '../../modules/intelligence/agents/types';

export interface SessionLogEntry {
  type: string;
  timestamp: number;
  result: 'success' | 'error' | 'validation_error' | 'cancelled' | 'info';
  priority: 'LOW' | 'MEDIUM' | 'HIGH';
  payloadPreview?: string;
}

export interface UnifiedActionHistoryEntry {
  id: string;
  timestamp: string;
  type: 'user-command' | 'proactive-insight' | 'voice-command';
  hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub' | 'CrossHub';
  actionType: string;
  description: string;
  reduxActionType?: string;
  payload?: Record<string, any>;
  success: boolean;
  /** Which agent (Jarvis, Shodan, Cortana) sourced this action. 'user' if from UI. */
  agent?: 'Jarvis' | 'Shodan' | 'Cortana' | 'user';
}

export interface RecordAgentConflictPayload {
  agents: [AgentType, AgentType];
  topic: string;
  timestamp: number;
}

// FASE 2.5: External Data Structures
export interface WeatherAlert {
  type: 'rain-incoming' | 'extreme-temp' | 'high-wind' | 'forecast-advisory';
  severity: 'low' | 'medium' | 'high';
  message: string;
  affectedIn: number; // hours ahead
  recommendation: string;
}

export interface AssetAlert {
  assetId: string;
  type: 'volatility-up' | 'volatility-down' | 'threshold-breach';
  currentPrice: number;
  changePercent: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
}

export interface PreFlightBriefing {
  generatedAt: number;
  temperature?: number;
  condition?: 'clear' | 'cloudy' | 'rainy' | 'stormy' | 'snow';
  humidity?: number;
  weatherAlerts?: WeatherAlert[];
  assetAlerts?: AssetAlert[];
  batteryLevel?: number;
  predictedHub?: 'WorkHub' | 'PersonalHub' | 'FinanceHub' | null;
  briefingSummary?: string;
}

export interface AiMemoryState {
  sessionLog: SessionLogEntry[];
  actionHistory: UnifiedActionHistoryEntry[];
  userState: {
    mood: 'neutral' | 'focused' | 'frustrated' | 'recovering';
    cancelCount: number;
    completedCount: number;
    errorCount: number;
  };
  context: {
    currentScreen: string;
    lastHubVisited: 'WorkHub' | 'PersonalHub' | 'FinanceHub' | 'Unknown';
    omnibar: {
      isOpen: boolean;
      openedAt: number | null;
      lastInputAt: number | null;
      lastInputText: string;
    };
  };
  currentIntelligenceReport: {
    id: string;
    sourceEvent: string;
    message: string;
    mode: 'jarvis' | 'cortana';
    tone: 'focused' | 'empathetic' | 'urgent' | 'supportive';
    createdAt: number;
  } | null;
  predictiveBuffer: {
    generatedAt: number;
    nextHub: 'WorkHub' | 'PersonalHub' | 'FinanceHub' | null;
    priority: 'LOW' | 'MEDIUM' | 'HIGH';
    reason: string;
    averageInterceptResponseMs: number;
  };
  // FASE 2.5: Pre-Flight Briefing
  preFlightBriefing: PreFlightBriefing;
  tacticalEvents: {
    type: string;
    at: number;
    meta?: Record<string, unknown>;
  }[];
  detectors: {
    inactivityTriggeredAt: number | null;
    financialCrisisTriggeredAt: number | null;
    successTriggeredAt: number | null;
  };
  interception: {
    latestActionable: {
      id: string;
      appName: string;
      packageName: string;
      category: 'finance' | 'agenda' | 'other';
      summary: string;
      amount?: number;
      currency?: string;
      merchant?: string;
      temporalHint?: string;
      urgency: 'low' | 'medium' | 'high' | 'critical';
      actionType: 'register-expense' | 'schedule-event' | 'none';
      detectedAt: number;
    } | null;
    silentLog: {
      id: string;
      appName: string;
      packageName: string;
      summary: string;
      detectedAt: number;
    }[];
  };
  // FASE 3.1: Multi-Agent Dialogue & Conflict Memory
  agentDialogue: {
    recentDialogues: AgentDialogueEntry[]; // Last 50 dialogue entries
    lastWarRoomSession: number; // Timestamp of last orchestration
  };
  conflictMemory: {
    conflicts: ConflictMemoryEntry[]; // Recurring conflict patterns
    needsUserIntervention: boolean; // Flag if any conflict needs resolution
  };
  // FIX 5: Persistent per-agent memory that survives across sessions
  agentMemory: {
    cortana: { lastSeen: string; patterns: string[]; recentContext: string };
    jarvis:  { lastSeen: string; patterns: string[]; recentContext: string };
    shodan:  { lastSeen: string; patterns: string[]; recentContext: string };
  };
}

const initialState: AiMemoryState = {
  sessionLog: [],
  actionHistory: [],
  userState: {
    mood: 'neutral',
    cancelCount: 0,
    completedCount: 0,
    errorCount: 0,
  },
  context: {
    currentScreen: 'unknown',
    lastHubVisited: 'Unknown',
    omnibar: {
      isOpen: false,
      openedAt: null,
      lastInputAt: null,
      lastInputText: '',
    },
  },
  currentIntelligenceReport: null,
  predictiveBuffer: {
    generatedAt: 0,
    nextHub: null,
    priority: 'LOW',
    reason: 'Sin datos historicos suficientes.',
    averageInterceptResponseMs: 0,
  },
  // FASE 2.5: Pre-Flight Briefing Default State
  preFlightBriefing: {
    generatedAt: 0,
    temperature: undefined,
    condition: undefined,
    humidity: undefined,
    weatherAlerts: [],
    assetAlerts: [],
    batteryLevel: undefined,
    predictedHub: null,
    briefingSummary: undefined,
  },
  tacticalEvents: [],
  detectors: {
    inactivityTriggeredAt: null,
    financialCrisisTriggeredAt: null,
    successTriggeredAt: null,
  },
  interception: {
    latestActionable: null,
    silentLog: [],
  },
  // FASE 3.1: Agent Dialogue & Conflict Memory
  agentDialogue: {
    recentDialogues: [],
    lastWarRoomSession: 0,
  },
  conflictMemory: {
    conflicts: [],
    needsUserIntervention: false,
  },
  // FIX 5: Persistent agent memory
  agentMemory: {
    cortana: { lastSeen: '', patterns: [], recentContext: '' },
    jarvis:  { lastSeen: '', patterns: [], recentContext: '' },
    shodan:  { lastSeen: '', patterns: [], recentContext: '' },
  },
};

const MAX_SESSION_LOG = 20;
const MAX_ACTION_HISTORY_LOG = 100;
const MAX_TACTICAL_EVENTS = 40;
const MAX_SILENT_INTERCEPT_LOG = 30;
const MAX_DIALOGUE_LOG = 50; // FASE 3.1: Keep last 50 agent statements

const aiMemorySlice = createSlice({
  name: 'aiMemory',
  initialState,
  reducers: {
    logSessionAction(state, action: PayloadAction<SessionLogEntry>) {
      if (!Array.isArray(state.sessionLog)) {
        state.sessionLog = [];
      }
      state.sessionLog.unshift(action.payload);
      if (state.sessionLog.length > MAX_SESSION_LOG) {
        state.sessionLog.length = MAX_SESSION_LOG;
      }
    },
    appendActionHistoryEntry(state, action: PayloadAction<UnifiedActionHistoryEntry>) {
      if (!Array.isArray(state.actionHistory)) {
        state.actionHistory = [];
      }
      state.actionHistory.unshift(action.payload);
      if (state.actionHistory.length > MAX_ACTION_HISTORY_LOG) {
        state.actionHistory.length = MAX_ACTION_HISTORY_LOG;
      }
    },
    updateActionHistoryEntry(
      state,
      action: PayloadAction<{
        id: string;
        description?: string;
        actionType?: string;
        timestamp?: string;
        payload?: Record<string, any>;
      }>
    ) {
      const entry = state.actionHistory.find((item) => item.id === action.payload.id);
      if (!entry) return;

      if (action.payload.description !== undefined) entry.description = action.payload.description;
      if (action.payload.actionType !== undefined) entry.actionType = action.payload.actionType;
      if (action.payload.timestamp !== undefined) entry.timestamp = action.payload.timestamp;
      if (action.payload.payload !== undefined) {
        entry.payload = {
          ...(entry.payload || {}),
          ...action.payload.payload,
        };
      }
    },
    deleteActionHistoryEntry(state, action: PayloadAction<{ id: string }>) {
      state.actionHistory = state.actionHistory.filter((item) => item.id !== action.payload.id);
    },
    clearActionHistory(state) {
      state.actionHistory = [];
    },
    setCurrentScreen(state, action: PayloadAction<{ screen: string }>) {
      state.context.currentScreen = action.payload.screen || 'unknown';
    },
    setLastHubVisited(
      state,
      action: PayloadAction<{ hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub' | 'Unknown' }>
    ) {
      state.context.lastHubVisited = action.payload.hub;
    },
    markOmnibarOpened(state, action: PayloadAction<{ at: number }>) {
      state.context.omnibar.isOpen = true;
      state.context.omnibar.openedAt = action.payload.at;
      state.context.omnibar.lastInputAt = null;
      state.context.omnibar.lastInputText = '';
    },
    markOmnibarClosed(state) {
      state.context.omnibar.isOpen = false;
    },
    markOmnibarInput(state, action: PayloadAction<{ at: number; text: string }>) {
      state.context.omnibar.lastInputAt = action.payload.at;
      state.context.omnibar.lastInputText = action.payload.text;
    },
    registerCancellation(state) {
      state.userState.cancelCount += 1;
      if (state.userState.cancelCount >= 3) {
        state.userState.mood = 'frustrated';
      }
    },
    registerTaskCompletion(state) {
      state.userState.completedCount += 1;
      if (state.userState.completedCount >= 2) {
        state.userState.mood = 'focused';
      } else if (state.userState.mood === 'frustrated') {
        state.userState.mood = 'recovering';
      }
    },
    registerError(state) {
      state.userState.errorCount += 1;
      state.userState.mood = 'frustrated';
    },
    recordTacticalEvent(
      state,
      action: PayloadAction<{ type: string; at: number; meta?: Record<string, unknown> }>
    ) {
      if (!Array.isArray(state.tacticalEvents)) {
        state.tacticalEvents = [];
      }
      state.tacticalEvents.unshift(action.payload);
      if (state.tacticalEvents.length > MAX_TACTICAL_EVENTS) {
        state.tacticalEvents.length = MAX_TACTICAL_EVENTS;
      }
    },
    setCurrentIntelligenceReport(
      state,
      action: PayloadAction<{
        id: string;
        sourceEvent: string;
        message: string;
        mode: 'jarvis' | 'cortana';
        tone: 'focused' | 'empathetic' | 'urgent' | 'supportive';
        createdAt: number;
      }>
    ) {
      state.currentIntelligenceReport = action.payload;
    },
    setPredictiveBuffer(
      state,
      action: PayloadAction<{
        generatedAt: number;
        nextHub: 'WorkHub' | 'PersonalHub' | 'FinanceHub' | null;
        priority: 'LOW' | 'MEDIUM' | 'HIGH';
        reason: string;
        averageInterceptResponseMs: number;
      }>
    ) {
      state.predictiveBuffer = action.payload;
    },
    // FASE 2.5: Pre-Flight Briefing Reducer
    setPreFlightBriefing(
      state,
      action: PayloadAction<Partial<PreFlightBriefing>>
    ) {
      state.preFlightBriefing = {
        ...state.preFlightBriefing,
        ...action.payload,
        generatedAt: action.payload.generatedAt || Date.now(),
      };
    },
    markDetectorTriggered(
      state,
      action: PayloadAction<{ detector: 'inactivity' | 'financial_crisis' | 'success'; at: number }>
    ) {
      if (action.payload.detector === 'inactivity') {
        state.detectors.inactivityTriggeredAt = action.payload.at;
      }
      if (action.payload.detector === 'financial_crisis') {
        state.detectors.financialCrisisTriggeredAt = action.payload.at;
      }
      if (action.payload.detector === 'success') {
        state.detectors.successTriggeredAt = action.payload.at;
      }
    },
    setLatestActionableIntercept(
      state,
      action: PayloadAction<{
        id: string;
        appName: string;
        packageName: string;
        category: 'finance' | 'agenda' | 'other';
        summary: string;
        amount?: number;
        currency?: string;
        merchant?: string;
        temporalHint?: string;
        urgency: 'low' | 'medium' | 'high' | 'critical';
        actionType: 'register-expense' | 'schedule-event' | 'none';
        detectedAt: number;
      }>
    ) {
      state.interception.latestActionable = action.payload;
    },
    clearLatestActionableIntercept(state) {
      state.interception.latestActionable = null;
    },
    appendSilentInterceptLog(
      state,
      action: PayloadAction<{
        id: string;
        appName: string;
        packageName: string;
        summary: string;
        detectedAt: number;
      }>
    ) {
      if (!state.interception) {
        state.interception = { latestActionable: null, silentLog: [] } as any;
      }
      if (!Array.isArray(state.interception.silentLog)) {
        state.interception.silentLog = [];
      }
      state.interception.silentLog.unshift(action.payload);
      if (state.interception.silentLog.length > MAX_SILENT_INTERCEPT_LOG) {
        state.interception.silentLog.length = MAX_SILENT_INTERCEPT_LOG;
      }
    },
    // FASE 3.1: Agent Dialogue & Conflict Memory Reducers
    recordAgentDialogue(state, action: PayloadAction<AgentDialogueEntry[]>) {
      if (!state.agentDialogue) {
        state.agentDialogue = { recentDialogues: [], lastWarRoomSession: 0 } as any;
      }
      if (!Array.isArray(state.agentDialogue.recentDialogues)) {
        state.agentDialogue.recentDialogues = [];
      }
      // Add new dialogue entries to the log
      state.agentDialogue.recentDialogues.unshift(...action.payload);
      if (state.agentDialogue.recentDialogues.length > MAX_DIALOGUE_LOG) {
        state.agentDialogue.recentDialogues.length = MAX_DIALOGUE_LOG;
      }
      state.agentDialogue.lastWarRoomSession = Date.now();
    },
    recordAgentConflict(
      state,
      action: PayloadAction<RecordAgentConflictPayload>
    ) {
      const normalizedTopic = action.payload.topic.trim().toLowerCase();
      if (!state.conflictMemory) {
        state.conflictMemory = { conflicts: [], needsUserIntervention: false } as any;
      }
      if (!Array.isArray(state.conflictMemory.conflicts)) {
        state.conflictMemory.conflicts = [];
      }
      // Find existing conflict or create new one
      const existingConflict = state.conflictMemory.conflicts.find(
        (c) =>
          ((c.agents[0] === action.payload.agents[0] && c.agents[1] === action.payload.agents[1]) ||
            (c.agents[0] === action.payload.agents[1] && c.agents[1] === action.payload.agents[0])) &&
          c.topic.trim().toLowerCase() === normalizedTopic
      );

      if (existingConflict) {
        existingConflict.occurrences += 1;
        existingConflict.lastOccurrence = action.payload.timestamp;
        if (existingConflict.occurrences >= 3) {
          existingConflict.needsResolution = true;
          state.conflictMemory.needsUserIntervention = true;
        }
      } else {
        const newConflict: ConflictMemoryEntry = {
          id: `conflict-${Date.now()}`,
          agents: action.payload.agents,
          topic: action.payload.topic,
          occurrences: 1,
          lastOccurrence: action.payload.timestamp,
          needsResolution: false,
        };
        state.conflictMemory.conflicts.push(newConflict);
      }
    },
    markConflictResolved(state, action: PayloadAction<{ conflictId: string }>) {
      const conflict = state.conflictMemory.conflicts.find((c) => c.id === action.payload.conflictId);
      if (conflict) {
        conflict.needsResolution = false;
        conflict.occurrences = 0; // Reset counter after user intervention
      }
      // Check if any conflicts still need resolution
      state.conflictMemory.needsUserIntervention = state.conflictMemory.conflicts.some((c) => c.needsResolution);
    },
    clearDialogueHistory(state) {
      state.agentDialogue.recentDialogues = [];
    },
    // FIX 5: Update persistent agent memory after each session
    updateAgentMemory(
      state,
      action: PayloadAction<{
        agent: 'cortana' | 'jarvis' | 'shodan';
        lastSeen?: string;
        patterns?: string[];
        recentContext?: string;
      }>
    ) {
      if (!state.agentMemory) {
        state.agentMemory = {
          cortana: { lastSeen: '', patterns: [], recentContext: '' },
          jarvis:  { lastSeen: '', patterns: [], recentContext: '' },
          shodan:  { lastSeen: '', patterns: [], recentContext: '' },
        } as any;
      }
      const mem = state.agentMemory[action.payload.agent];
      if (!mem) return;
      if (action.payload.lastSeen !== undefined) mem.lastSeen = action.payload.lastSeen;
      if (action.payload.patterns !== undefined) {
        // Keep last 20 patterns
        mem.patterns = [...(action.payload.patterns || []), ...(mem.patterns || [])].slice(0, 20);
      }
      if (action.payload.recentContext !== undefined) mem.recentContext = action.payload.recentContext;
    },
  },
});

export const {
  logSessionAction,
  appendActionHistoryEntry,
  updateActionHistoryEntry,
  deleteActionHistoryEntry,
  clearActionHistory,
  setCurrentScreen,
  setLastHubVisited,
  markOmnibarOpened,
  markOmnibarClosed,
  markOmnibarInput,
  registerCancellation,
  registerTaskCompletion,
  registerError,
  recordTacticalEvent,
  setCurrentIntelligenceReport,
  setPredictiveBuffer,
  setPreFlightBriefing,
  markDetectorTriggered,
  setLatestActionableIntercept,
  clearLatestActionableIntercept,
  appendSilentInterceptLog,
  // FASE 3.1: Agent Dialogue & Conflict Memory
  recordAgentDialogue,
  recordAgentConflict,
  markConflictResolved,
  clearDialogueHistory,
  // FIX 5: Persistent agent memory
  updateAgentMemory,
} = aiMemorySlice.actions;

export default aiMemorySlice.reducer;
