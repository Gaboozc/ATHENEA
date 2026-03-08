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
import { playSuccessSound, playErrorSound } from './utils/audioFeedback';

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
 * Actions with confidence >= 90% and all required params will auto-execute
 */
const AUTO_EXECUTE_THRESHOLD = 90;

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
          playErrorSound();
          return { executed: false, response, needsConfirmation: false };
        }

        // Check for autonomous execution
        const shouldAutoExecute = options?.autoExecute !== false &&
          response.reasoning.confidence >= AUTO_EXECUTE_THRESHOLD &&
          response.reasoning.allRequiredParamsPresent === true &&
          response.reduxAction;

        if (shouldAutoExecute) {
          // AUTONOMOUS EXECUTION: Execute immediately without confirmation
          console.log(`[Intelligence] Auto-executing with ${response.reasoning.confidence}% confidence`);
          
          await intelligenceBridge.executeAction(
            response,
            dispatch as any,
            () => storeState
          );

          // Play success sound
          playSuccessSound();

          // Clear state - no artifact needed
          setCurrentArtifact(null);
          setCurrentResponse(null);

          return { 
            executed: true, 
            response, 
            needsConfirmation: false 
          };
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
        playErrorSound();
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
      const responseToExecute = overrideData && currentResponse.reduxAction
        ? {
            ...currentResponse,
            reduxAction: {
              ...currentResponse.reduxAction,
              payload: {
                ...(currentResponse.reduxAction.payload || {}),
                ...overrideData
              }
            }
          }
        : currentResponse;

      await intelligenceBridge.executeAction(
        responseToExecute,
        dispatch as any,
        () => storeState
      );
      
      // Clear the artifact after execution
      setCurrentArtifact(null);
      setCurrentResponse(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to execute action';
      setLastError(errorMsg);
      console.error('Action execution error:', error);
    } finally {
      setIsLoading(false);
    }
  }, [currentResponse, dispatch, storeState]);

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
