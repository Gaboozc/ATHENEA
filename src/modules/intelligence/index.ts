/**
 * ATHENEA Intelligence Module - Main Export
 * 
 * Use this to import all intelligence module exports:
 * 
 * import {
 *   useIntelligence,
 *   IntelligenceCanvas,
 *   intelligenceBridge,
 *   allSkills,
 *   analyzeIntent,
 *   extractParameters
 * } from '@/modules/intelligence';
 */

// ============================================================================
// TYPE EXPORTS
// ============================================================================

export type {
  SkillManifest,
  SkillParam,
  IntelligenceRequest,
  IntelligenceResponse,
  ReduxAction,
  CanvasArtifact,
  CanvasArtifactProps,
  CanvasField,
  CanvasColumn,
  IntentAnalysis,
  SkillExecutionContext,
  IntelligenceState,
  IntelligenceExchange,
  SkillExecutor
} from './types';

// ============================================================================
// SKILLS EXPORTS
// ============================================================================

export {
  workHubSkills,
  personalHubSkills,
  financeHubSkills,
  crossHubSkills,
  allSkills,
  skillRegistry,
  getSkillsByHub,
  getSkillById,
  findSkillByKeywords
} from './skills';

// ============================================================================
// BRIDGE EXPORTS
// ============================================================================

export { IntelligenceBridge, intelligenceBridge } from './Bridge';

// ============================================================================
// PARSER EXPORTS
// ============================================================================

export {
  extractParameters,
  analyzeIntent,
  generateConfirmationMessage,
  validateParameters
} from './utils/parser';

// ============================================================================
// SMART RESOLVER EXPORTS
// ============================================================================

export type { SmartResolverContext } from './utils/smartResolver';
export {
  enrichParameters,
  resolveSmartDate,
  resolvePaymentId,
  resolveProjectId,
  resolveTaskId,
  resolveCategory,
  resolvePriority,
  resolveAmount
} from './utils/smartResolver';

// ============================================================================
// AUDIO FEEDBACK EXPORTS
// ============================================================================

export {
  playSuccessSound,
  playErrorSound,
  playProcessingSound,
  setAudioEnabled,
  isAudioEnabled
} from './utils/audioFeedback';

// ============================================================================
// COMPONENT EXPORTS
// ============================================================================

export { default as IntelligenceCanvas } from './components/IntelligenceCanvas';
export type { default as IntelligenceCanvasComponent } from './components/IntelligenceCanvas';

// ============================================================================
// HOOK EXPORTS
// ============================================================================

export { default as useIntelligence } from './useIntelligence';

export type { default as UseIntelligenceReturn } from './useIntelligence';

// ============================================================================
// PROACTIVE ENGINE EXPORTS
// ============================================================================

export { analyzeStoreForInsights } from './proactive/observer';
export { useProactiveInsights } from './proactive/useProactiveInsights';
export { useInsightNotificationBridge } from './proactive/useInsightNotificationBridge';
export { useExternalCalendarObserver } from './proactive/useExternalCalendarObserver';

// ============================================================================
// INFERENCE ENGINES EXPORTS (NEW - Hybrid Intelligence)
// ============================================================================

export { getONNXEngine } from './inference/ONNXInferenceEngine';
export type { InferenceResult, ONNXInferenceEngine } from './inference/ONNXInferenceEngine';

export { fastPathMatcher } from './inference/FastPathMatcher';
export type { FastPathMatch } from './inference/FastPathMatcher';

export { suggestionsEngine } from './inference/SuggestionsEngine';
export type { 
  SuggestionContext, 
  AppState, 
  CommandSuggestion 
} from './inference/SuggestionsEngine';

// ============================================================================
// ACTION HISTORY EXPORTS (moved from proactive section to avoid duplicates)
// ============================================================================

export { actionHistoryStore, useActionHistory } from './actionHistory';
export type { ActionHistoryEntry } from './actionHistory';
export { useWidgetDataBridge } from './proactive/useWidgetDataBridge';
export {
  setGhostWriteDraft,
  clearGhostWriteDraft,
  getGhostWriteSnapshot,
  useGhostWriteSuggestions
} from './ghostWrite';

export type {
  DynamicInsight,
  InsightHub,
  InsightSeverity,
  ProactiveAnalysisResult
} from './proactive/types';
