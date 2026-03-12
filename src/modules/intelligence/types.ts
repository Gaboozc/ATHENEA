/**
 * ATHENEA Intelligence Module - Type Definitions
 * 
 * Inspired by OpenClaw Protocol Architecture:
 * - Skills: Executable tools mapped to Redux actions
 * - Protocol: JSON-RPC style messaging between Bridge and Store
 * - Canvas/Artifacts: Dynamic UI components for data visualization
 * - Reasoning: Skill selection based on user intent analysis
 */

// ============================================================================
// 1. SKILL DEFINITION & MANIFEST
// ============================================================================

/**
 * A Skill is an executable tool that:
 * 1. Takes a user input/intent
 * 2. Maps to a Redux action
 * 3. Executes state mutations
 * 4. Returns an Artifact (visual representation)
 */
export interface SkillManifest {
  id: string;                           // Unique skill identifier
  name: string;                         // Display name
  description: string;                  // What the skill does
  icon: string;                         // Emoji or icon
  hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub'; // Associated hub
  keywords: string[];                   // Keywords to trigger skill (NLP hints)
  action: string;                       // Redux action type to dispatch
  paramSchema: Record<string, SkillParam>; // Input parameter definitions
}

export interface SkillParam {
  type: 'string' | 'textarea' | 'number' | 'date' | 'boolean' | 'select';
  required: boolean;
  description: string;
  enum?: string[];                      // For 'select' type
  validation?: RegExp;                  // Regex for validation
}

// ============================================================================
// 2. PROTOCOL & MESSAGING
// ============================================================================

/**
 * JSON-RPC style message from user → Bridge
 * The Bridge interprets this and executes a Skill
 */
export interface IntelligenceRequest {
  id: string;                           // Unique request ID
  userPrompt: string;                   // Raw user input
  context?: {
    currentHub: 'WorkHub' | 'PersonalHub' | 'FinanceHub';
    selectedProject?: string;
    selectedNote?: string;
  };
  timestamp: number;
}

/**
 * Response from Bridge after executing a Skill
 */
export interface IntelligenceResponse {
  id: string;                           // Matches IntelligenceRequest.id
  success: boolean;
  reasoning: {
    matchedSkill: SkillManifest | null;
    confidence: number;                 // 0-100 confidence score
    reasoning: string;                  // "Why did I pick this skill?"
    responderPersona?: 'jarvis' | 'cortana' | 'shodan' | 'swarm';
    allRequiredParamsPresent?: boolean; // For autonomous execution
    missingParams?: string[];           // List of missing required params
  };
  reduxAction?: ReduxAction;           // Action to dispatch
  artifact?: CanvasArtifact;          // UI to render
  userMessage: string;                 // Message to display to user
  timestamp: number;
}

/**
 * Redux action to dispatch
 * Mimics the action structure already in ATHENEA store
 */
export interface ReduxAction {
  type: string;                        // e.g., 'ADD_NOTE', 'RECORD_PAYMENT'
  payload: any;                        // Action payload
}

// ============================================================================
// 3. CANVAS & ARTIFACTS
// ============================================================================

/**
 * A Canvas Artifact is a dynamic, interactive UI component
 * that the AI can render to show/edit data before committing to Redux
 */
export interface CanvasArtifact {
  type: 'form' | 'table' | 'chart' | 'text' | 'confirm'; // UI component type
  props: CanvasArtifactProps;           // Component-specific props
  onSubmit?: (data: any) => void;      // Callback when user submits
  onCancel?: () => void;                // Callback when user cancels
}

export interface CanvasArtifactProps {
  title: string;                        // Artifact title
  description?: string;                 // Optional description
  fields?: CanvasField[];              // For 'form' type
  columns?: CanvasColumn[];             // For 'table' type
  data?: any;                          // Data to display
  actionLabel?: string;                 // Primary action button label
  cancelLabel?: string;                 // Cancel button label
}

export interface CanvasField {
  id: string;
  label: string;
  type: 'text' | 'textarea' | 'number' | 'date' | 'select' | 'checkbox';
  value?: any;
  required?: boolean;
  placeholder?: string;
  options?: { label: string; value: any }[]; // For select
}

export interface CanvasColumn {
  id: string;
  label: string;
  accessor: string;                    // Path to data property
  type?: 'string' | 'number' | 'date' | 'currency';
}

// ============================================================================
// 4. REASONING ENGINE
// ============================================================================

/**
 * Intent Analysis Result
 * The Bridge uses this to pick the right Skill
 */
export interface IntentAnalysis {
  intent: string;                      // Detected intent (e.g., 'create_note', 'expense')
  confidence: number;                  // 0-100
  keywordsFound: string[];            // Keywords that matched
  suggestedSkill: SkillManifest | null; // Recommended skill
  extractedParams?: Record<string, any>; // Pre-filled params from prompt
}

/**
 * Skill Execution Context
 * Passed to the Bridge when executing a skill
 */
export interface SkillExecutionContext {
  skill: SkillManifest;
  userInput: string;
  parsedParams: Record<string, any>;
  redux: {
    getState: () => any;               // Read current store state
    dispatch: (action: ReduxAction) => void; // Dispatch action
  };
}

// ============================================================================
// 5. INTELLIGENCE STATE
// ============================================================================

/**
 * The local state for the Intelligence module
 * Tracks conversations, artifacts, and skill history
 */
export interface IntelligenceState {
  isLoading: boolean;
  currentRequest: IntelligenceRequest | null;
  lastResponse: IntelligenceResponse | null;
  conversationHistory: IntelligenceExchange[];
  availableSkills: SkillManifest[];
  activeArtifact: CanvasArtifact | null;
}

export interface IntelligenceExchange {
  request: IntelligenceRequest;
  response: IntelligenceResponse;
  executedAt: number;
}

// ============================================================================
// HELPER TYPES
// ============================================================================

export type SkillExecutor = (context: SkillExecutionContext) => Promise<CanvasArtifact | null>;
