/**
 * useIntelligence Hook
 * 
 * React hook for integrating the Intelligence module into any component
 * Handles:
 * - Sending prompts to the Bridge
 * - Managing artifact rendering
 * - Confirming and executing actions
 * - Conversation history
 */

import { useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  IntelligenceRequest,
  IntelligenceResponse,
  CanvasArtifact
} from './types';
import { intelligenceBridge } from './Bridge';
import { audioFeedback } from './utils/audioFeedback';
import { openclawAdapter } from './adapters/openclawAdapter';
import { actionHistoryStore } from './actionHistory';

interface UseIntelligenceReturn {
  // Prompt handling
  sendPrompt: (
    prompt: string, 
    hub?: 'WorkHub' | 'PersonalHub' | 'FinanceHub',
    options?: { autoExecute?: boolean }
  ) => Promise<{ 
    executed: boolean; 
    response: IntelligenceResponse | null;
    needsConfirmation: boolean;
  }>;

  // State
  isLoading: boolean;
  currentResponse: IntelligenceResponse | null;
  currentArtifact: CanvasArtifact | null;
  lastError: string | null;
  confidenceScore: number;

  // Actions
  confirmAction: (overrideData?: Record<string, any>) => Promise<void>;
  cancelAction: () => void;

  // History
  clearHistory: () => void;
}

/**
 * Autonomous execution threshold
 * FIX 2: Lowered from 90 to 70 — skills with all required params and >= 70% confidence
 * will auto-execute without user confirmation.
 */
const AUTO_EXECUTE_THRESHOLD = 70;

/**
 * useIntelligence Hook
 */
export function useIntelligence(
  initialHub?: 'WorkHub' | 'PersonalHub' | 'FinanceHub'
): UseIntelligenceReturn {
  const dispatch = useDispatch();
  const storeState = useSelector((state: any) => state);

  // Local state
  const [isLoading, setIsLoading] = useState(false);
  const [currentResponse, setCurrentResponse] = useState<IntelligenceResponse | null>(null);
  const [currentArtifact, setCurrentArtifact] = useState<CanvasArtifact | null>(null);
  const [lastError, setLastError] = useState<string | null>(null);
  const [confidenceScore, setConfidenceScore] = useState(0);

  /**
   * Send a prompt to the Bridge
   * Now supports Autonomous Execution:
   * - If confidence >= 90% and all required params present → auto-execute
   * - If confidence < 85% or missing params → show Canvas for confirmation
   */
  const sendPrompt = useCallback(
    async (
      prompt: string, 
      hub?: 'WorkHub' | 'PersonalHub' | 'FinanceHub',
      options?: { autoExecute?: boolean }
    ) => {
      try {
        setIsLoading(true);
        setLastError(null);

        const request: IntelligenceRequest = {
          id: `req_${Date.now()}`,
          userPrompt: prompt,
          context: {
            currentHub: hub || initialHub || 'WorkHub'
          },
          timestamp: Date.now()
        };

        // Get current state for the bridge
        const response = await intelligenceBridge.processPrompt(
          request,
          () => storeState,
          dispatch as any
        );

        setCurrentResponse(response);
        setConfidenceScore(response.reasoning.confidence);

        if (!response.success) {
          setLastError(response.userMessage);
          audioFeedback.playError();
          actionHistoryStore.recordAction({
            type: 'user-command',
            hub: hub || initialHub || 'WorkHub',
            actionType: 'unknown',
            description: `Failed: ${prompt}`,
            success: false
          });
          return { executed: false, response, needsConfirmation: false };
        }

        // Check for autonomous execution
        const shouldAutoExecute = options?.autoExecute !== false &&
          response.reasoning.confidence >= AUTO_EXECUTE_THRESHOLD &&
          response.reasoning.allRequiredParamsPresent === true &&
          response.reduxAction;

        if (shouldAutoExecute) {
          // AUTONOMOUS EXECUTION: Use OpenClaw Adapter for strict action mapping
          console.log(`[Intelligence] Auto-executing with ${response.reasoning.confidence}% confidence`);
          
          const adapterResult = openclawAdapter.adapt({
            skillId: response.reasoning.matchedSkill?.id || '',
            parameters: response.reduxAction?.payload || {},
            confidence: response.reasoning.confidence,
            context: {
              getState: () => storeState,
              userPrompt: prompt,
              lowerPrompt: prompt.toLowerCase(),
              currentHub: hub || initialHub || 'WorkHub'
            }
          });

          if (!adapterResult.success || !adapterResult.action) {
            console.error('[OpenClaw Adapter] Failed:', adapterResult.error);
            audioFeedback.playError();
            actionHistoryStore.recordAction({
              type: 'voice-command',
              hub: hub || initialHub || 'WorkHub',
              actionType: response.reasoning.matchedSkill?.id || 'unknown',
              description: `Adapter failed: ${prompt}`,
              success: false
            });
            return { executed: false, response, needsConfirmation: false };
          }

          try {
            dispatch(adapterResult.action as any);
            /* Dispatch calendar link side-effects (e.g. add_task with dueDate) */
            adapterResult.actions?.forEach((extra) => dispatch(extra as any));
            audioFeedback.playSuccess();
            actionHistoryStore.recordAction({
              type: 'voice-command',
              hub: hub || initialHub || 'WorkHub',
              actionType: response.reasoning.matchedSkill?.id || 'executed',
              description: response.userMessage || prompt,
              reduxActionType: adapterResult.action.type,
              payload: adapterResult.action.payload,
              success: true
            });
            setCurrentArtifact(null);
            setCurrentResponse(null);
            return { executed: true, response, needsConfirmation: false };
          } catch (dispatchError) {
            console.error('[Redux Dispatch] Failed:', dispatchError);
            audioFeedback.playError();
            actionHistoryStore.recordAction({
              type: 'voice-command',
              hub: hub || initialHub || 'WorkHub',
              actionType: response.reasoning.matchedSkill?.id || 'unknown',
              description: `Dispatch error: ${prompt}`,
              success: false
            });
            return { executed: false, response, needsConfirmation: false };
          }
        } else {
          // MANUAL CONFIRMATION NEEDED: Show artifact
          setCurrentArtifact(response.artifact || null);
          
          return { 
            executed: false, 
            response, 
            needsConfirmation: true 
          };
        }
      } catch (error) {
        const errorMsg = error instanceof Error ? error.message : 'An error occurred';
        setLastError(errorMsg);
        console.error('Intelligence error:', error);
        audioFeedback.playError();
        actionHistoryStore.recordAction({
          type: 'user-command',
          hub: hub || initialHub || 'WorkHub',
          actionType: 'error',
          description: `Error: ${errorMsg}`,
          success: false
        });
        return { executed: false, response: null, needsConfirmation: false };
      } finally {
        setIsLoading(false);
      }
    },
    [dispatch, storeState, initialHub]
  );

  /**
   * Confirm and execute the current action
   */
  const confirmAction = useCallback(async (overrideData?: Record<string, any>) => {
    if (!currentResponse) return;

    try {
      setIsLoading(true);
      
      const adapterResult = openclawAdapter.adapt({
        skillId: currentResponse.reasoning.matchedSkill?.id || '',
        parameters: overrideData || currentResponse.reduxAction?.payload || {},
        confidence: currentResponse.reasoning.confidence,
        context: {
          getState: () => storeState,
          userPrompt: currentResponse.reasoning.matchedSkill?.name || '',
          lowerPrompt: '',
          currentHub: initialHub || 'WorkHub'
        }
      });

      if (!adapterResult.success || !adapterResult.action) {
        console.error('[OpenClaw Adapter] Failed:', adapterResult.error);
        audioFeedback.playError();
        actionHistoryStore.recordAction({
          type: 'user-command',
          hub: initialHub || 'WorkHub',
          actionType: currentResponse.reasoning.matchedSkill?.id || 'unknown',
          description: 'Manual confirmation failed',
          success: false
        });
        return;
      }

      dispatch(adapterResult.action as any);
      /* Dispatch calendar link side-effects (e.g. add_task with dueDate) */
      adapterResult.actions?.forEach((extra) => dispatch(extra as any));
      audioFeedback.playSuccess();
      actionHistoryStore.recordAction({
        type: 'user-command',
        hub: initialHub || 'WorkHub',
        actionType: currentResponse.reasoning.matchedSkill?.id || 'confirmed',
        description: currentResponse.userMessage || 'Action confirmed',
        reduxActionType: adapterResult.action.type,
        payload: adapterResult.action.payload,
        success: true
      });
      
      setCurrentArtifact(null);
      setCurrentResponse(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to execute action';
      setLastError(errorMsg);
      console.error('Action execution error:', error);
      audioFeedback.playError();
      actionHistoryStore.recordAction({
        type: 'user-command',
        hub: initialHub || 'WorkHub',
        actionType: 'execution-error',
        description: errorMsg,
        success: false
      });
    } finally {
      setIsLoading(false);
    }
  }, [currentResponse, dispatch, storeState, initialHub]);

  /**
   * Cancel the current action
   */
  const cancelAction = useCallback(() => {
    setCurrentArtifact(null);
    setCurrentResponse(null);
    setLastError(null);
  }, []);

  /**
   * Clear conversation history
   */
  const clearHistory = useCallback(() => {
    intelligenceBridge.clearHistory();
  }, []);

  return {
    sendPrompt,
    isLoading,
    currentResponse,
    currentArtifact,
    lastError,
    confidenceScore,
    confirmAction,
    cancelAction,
    clearHistory
  };
}

export default useIntelligence;
