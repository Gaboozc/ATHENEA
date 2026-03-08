/**
 * ATHENEA Intelligence Bridge
 * 
 * Core execution engine that:
 * 1. Receives user prompts
 * 2. Analyzes intent using keyword matching + simple NLP
 * 3. Selects appropriate Skill
 * 4. Generates Canvas Artifact for preview
 * 5. Executes Redux action on confirmation
 * 6. Returns response to UI
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

/**
 * The Bridge: Main execution engine for the Intelligence module
 */
export class IntelligenceBridge {
  private conversationHistory: IntelligenceRequest[] = [];

  /**
   * Main entry point: Process a user prompt
   * Returns an IntelligenceResponse with reasoning, action, and artifact
   */
  async processPrompt(
    request: IntelligenceRequest,
    reduxGetState: () => any,
    reduxDispatch: (action: ReduxAction) => void
  ): Promise<IntelligenceResponse> {
    this.conversationHistory.push(request);

    try {
      // Step 1: Analyze user intent
      const intentAnalysis = await this.analyzeIntent(request.userPrompt);

      // Step 2: Select skill (with fallback)
      const selectedSkill = intentAnalysis.suggestedSkill || 
                           findSkillByKeywords(request.userPrompt);

      if (!selectedSkill) {
        return this.createErrorResponse(request, 'Could not understand your request');
      }

      // Step 3: Extract parameters with Smart Resolution
      const resolverContext: SmartResolverContext = {
        getState: reduxGetState,
        userPrompt: request.userPrompt,
        lowerPrompt: request.userPrompt.toLowerCase(),
        currentHub: request.context.currentHub || 'WorkHub'
      };

      const parsedParams = extractParameters(
        request.userPrompt,
        selectedSkill.paramSchema,
        resolverContext
      );

      // Step 3.5: Check if all required parameters are present
      const missingParams = this.getMissingRequiredParams(selectedSkill, parsedParams);
      const allRequiredPresent = missingParams.length === 0;

      // Step 3.6: Calculate enhanced confidence score
      const enhancedConfidence = this.calculateEnhancedConfidence(
        request.userPrompt,
        selectedSkill,
        parsedParams,
        allRequiredPresent
      );

      // Step 4: Create Canvas Artifact for preview
      const artifact = this.buildCanvasArtifact(
        selectedSkill,
        parsedParams,
        reduxGetState()
      );

      // Step 5: Build Redux action (ready to dispatch)
      const reduxAction = this.buildReduxAction(selectedSkill, parsedParams);

      // Step 6: Return response (artifact should be confirmed by user before dispatch)
      return {
        id: request.id,
        success: true,
        reasoning: {
          matchedSkill: selectedSkill,
          confidence: enhancedConfidence,
          reasoning: `Matched intent "${intentAnalysis.intent}" to skill "${selectedSkill.name}" (${enhancedConfidence}% confidence)${
            !allRequiredPresent ? ` - Missing: ${missingParams.join(', ')}` : ''
          }`,
          allRequiredParamsPresent: allRequiredPresent,
          missingParams
        },
        reduxAction,
        artifact,
        userMessage: this.generateUserMessage(selectedSkill, parsedParams),
        timestamp: Date.now()
      };
    } catch (error) {
      console.error('Bridge error:', error);
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
   * Step 1: Analyze intent from user input
   * Uses keyword matching + basic NLP patterns
   */
  private async analyzeIntent(userPrompt: string): Promise<IntentAnalysis> {
    const lowerPrompt = userPrompt.toLowerCase();

    // Try to find matching skill by keywords
    const matchedSkill = findSkillByKeywords(userPrompt);

    if (matchedSkill) {
      return {
        intent: matchedSkill.id,
        confidence: this.calculateConfidence(userPrompt, matchedSkill.keywords),
        keywordsFound: matchedSkill.keywords.filter(kw => 
          lowerPrompt.includes(kw)
        ),
        suggestedSkill: matchedSkill
      };
    }

    // Fallback: Try semantic matching against all skills
    return {
      intent: 'unknown',
      confidence: 0,
      keywordsFound: [],
      suggestedSkill: null
    };
  }

  /**
   * Calculate confidence score (0-100)
   * Based on number of matching keywords and prompt length
   */
  private calculateConfidence(userPrompt: string, keywords: string[]): number {
    const lowerPrompt = userPrompt.toLowerCase();
    const matchedCount = keywords.filter(kw => lowerPrompt.includes(kw)).length;
    
    // Base confidence from keyword matches
    let confidence = Math.min(100, matchedCount * 25);
    
    // Boost if prompt is specific and detailed
    if (userPrompt.length > 20) confidence = Math.min(100, confidence + 10);
    if (userPrompt.length > 50) confidence = Math.min(100, confidence + 15);
    
    return Math.round(confidence);
  }

  /**
   * Calculate enhanced confidence score
   * Factors in: keywords, prompt length, parameter completeness, specificity
   */
  private calculateEnhancedConfidence(
    userPrompt: string,
    skill: SkillManifest,
    params: Record<string, any>,
    allRequiredPresent: boolean
  ): number {
    const lowerPrompt = userPrompt.toLowerCase();
    const matchedKeywords = skill.keywords.filter(kw => lowerPrompt.includes(kw));
    
    let confidence = 0;

    // Factor 1: Keyword matching (40 points max)
    confidence += Math.min(40, matchedKeywords.length * 15);

    // Factor 2: Required parameters present (30 points)
    if (allRequiredPresent) {
      confidence += 30;
    } else {
      const requiredCount = Object.values(skill.paramSchema).filter(p => p.required).length;
      const presentCount = Object.entries(skill.paramSchema)
        .filter(([id, def]) => def.required && params[id] !== undefined)
        .length;
      confidence += Math.round((presentCount / requiredCount) * 30);
    }

    // Factor 3: Prompt specificity (20 points)
    const hasQuotes = /"[^"]+"|'[^']+'/.test(userPrompt);
    const hasNumbers = /\d+/.test(userPrompt);
    const hasDates = /(today|tomorrow|monday|tuesday|next week)/i.test(userPrompt);
    
    if (hasQuotes) confidence += 8;
    if (hasNumbers) confidence += 6;
    if (hasDates) confidence += 6;

    // Factor 4: Length and detail (10 points)
    if (userPrompt.length > 30) confidence += 5;
    if (userPrompt.length > 60) confidence += 5;

    return Math.min(100, Math.round(confidence));
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
    const fields = Object.entries(skill.paramSchema).map(([fieldId, fieldSchema]) => ({
      id: fieldId,
      label: fieldSchema.description || fieldId,
      type: fieldSchema.type === 'textarea' ? 'textarea' : 
            fieldSchema.type === 'select' ? 'select' :
            fieldSchema.type as any,
      value: params[fieldId] || '',
      required: fieldSchema.required,
      options: fieldSchema.enum?.map(e => ({ label: e, value: e }))
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
