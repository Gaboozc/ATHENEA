/**
 * Omnibar Component
 * 
 * Global AI assistant command palette with AUTONOMOUS EXECUTION
 * - Appears as a floating modal at the top of the screen
 * - Activated with Ctrl+K / Cmd+K
 * - Shows IntelligenceCanvas with Artifact preview
 * - Integrates with Redux for real data mutations
 * - Auto-executes high-confidence commands (>= 90%)
 * - Audio feedback for success/error
 * - Smart fallback for missing parameters
 * 
 * Similar to:
 * - Spotlight (macOS)
 * - Notion's Quick Find
 * - GitHub's Command Palette
 */

import React, { useState, useRef, useEffect } from 'react';
import { useDispatch } from 'react-redux';
import { syncExternalEvents } from '../../../store/slices/calendarSlice.js';
import {
  useIntelligence,
  IntelligenceCanvas,
  getSkillsByHub,
  useProactiveInsights,
  actionHistoryStore
} from '../../modules/intelligence';
import type { CanvasArtifact, DynamicInsight } from '../../modules/intelligence';
import { useOmnibar } from './useOmnibar';
import { markOnboardingCompleted } from '../../modules/intelligence/proactive/welcomeOnboarding';
import { playSuccessSound, playErrorSound } from '../../modules/intelligence/utils/audioFeedback';
import './Omnibar.css';

interface OmnibarProps {
  /**
   * Default hub to use when opening
   */
  defaultHub?: 'WorkHub' | 'PersonalHub' | 'FinanceHub';
  
  /**
   * Callback when an action is successfully executed
   */
  onActionExecuted?: (result: {
    success: boolean;
    message: string;
    actionType?: string;
    hub?: 'WorkHub' | 'PersonalHub' | 'FinanceHub';
  }) => void;
}

interface ToastMessage {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const Omnibar: React.FC<OmnibarProps> = ({
  defaultHub = 'WorkHub',
  onActionExecuted
}) => {
  const dispatch = useDispatch();
  const { isOpen, closeOmnibar, prompt, requestVoice, clearPrompt } = useOmnibar();
  const { insightsByHub } = useProactiveInsights();

  // Local state
  const [inputValue, setInputValue] = useState('');
  const [selectedHub, setSelectedHub] = useState<'WorkHub' | 'PersonalHub' | 'FinanceHub'>(defaultHub);
  const [activeInsight, setActiveInsight] = useState<DynamicInsight | null>(null);
  const [activeInsightArtifact, setActiveInsightArtifact] = useState<CanvasArtifact | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);

  // Intelligence module
  const {
    sendPrompt,
    isLoading,
    currentResponse,
    currentArtifact,
    lastError,
    confidenceScore,
    confirmAction,
    cancelAction
  } = useIntelligence(selectedHub);

  // Toast helper
  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'info') => {
    const toast: ToastMessage = {
      id: `toast_${Date.now()}`,
      message,
      type
    };
    setToasts(prev => [...prev, toast]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== toast.id));
    }, 4000);
  };

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen || !prompt) return;
    setInputValue(prompt);
    clearPrompt();
  }, [clearPrompt, isOpen, prompt]);

  // Close when clicking outside modal
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
        closeOmnibar();
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      return () => document.removeEventListener('mousedown', handleClickOutside);
    }
  }, [isOpen, closeOmnibar]);

  /**
   * Handle prompt submission
   * Now supports AUTONOMOUS EXECUTION
   */
  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    const result = await sendPrompt(inputValue, selectedHub, { autoExecute: true });

    if (result.executed) {
      // Action was executed automatically!
      const skillName = result.response?.reasoning.matchedSkill?.name || 'Action';
      const params = result.response?.reduxAction?.payload;
      const title = params?.title || params?.text || params?.description || '';
      
      showToast(
        `✅ ${skillName} completed: ${title}`,
        'success'
      );

      // Record in history
      actionHistoryStore.recordAction({
        type: 'user-command',
        hub: selectedHub,
        actionType: skillName,
        reduxActionType: result.response?.reduxAction?.type || '',
        description: `Auto-executed: ${skillName}`,
        payload: params,
        success: true
      });

      // Close omnibar and clear input
      setTimeout(() => {
        setInputValue('');
        closeOmnibar();
      }, 800);
    } else if (result.needsConfirmation) {
      // Show canvas for manual confirmation
      // (already handled by useIntelligence setting currentArtifact)
    } else if (!result.response?.success) {
      // Error occurred
      playErrorSound();
      showToast(result.response?.userMessage || 'Could not process request', 'error');
    }
  };

  /**
   * Handle action confirmation
   * Dispatch to Redux + notify user + record in history
   */
  const handleConfirmAction = async (formData: Record<string, any> = {}) => {
    let actionDescription = '';
    let reduxActionType = '';

    try {
      if (activeInsight?.action) {
        const mergedPayload = {
          ...(activeInsight.action.payload || {}),
          ...formData
        };

        if (activeInsight.action.type === 'calendar/syncExternalEvents') {
          await dispatch(syncExternalEvents({ ...mergedPayload, forceInteractiveAuth: true }) as any);
        } else {
          dispatch({
            type: activeInsight.action.type,
            payload: mergedPayload
          });
        }

        actionDescription = activeInsight.title;
        reduxActionType = activeInsight.action.type;
        markOnboardingCompleted();

        actionHistoryStore.recordAction({
          type: 'proactive-insight',
          hub: selectedHub,
          actionType: activeInsight.title,
          reduxActionType: activeInsight.action.type,
          description: `Executed insight: ${activeInsight.title}`,
          payload: mergedPayload,
          success: true
        });

        onActionExecuted?.({
          success: true,
          message: `Insight executed: ${activeInsight.title}`,
          actionType: activeInsight.action.type,
          hub: selectedHub
        });
      } else if (currentResponse?.reduxAction?.type === 'calendar/syncExternalEvents') {
        const mergedPayload = {
          ...(currentResponse.reduxAction.payload || {}),
          ...formData,
          forceInteractiveAuth: true
        };

        await dispatch(syncExternalEvents(mergedPayload) as any);
        actionDescription = 'Sync Calendar';
        reduxActionType = 'calendar/syncExternalEvents';
        markOnboardingCompleted();

        actionHistoryStore.recordAction({
          type: 'user-command',
          hub: selectedHub,
          actionType: 'Sync Calendar',
          reduxActionType: 'calendar/syncExternalEvents',
          description: 'Executed: Sync Calendar',
          payload: mergedPayload,
          success: true
        });

        onActionExecuted?.({
          success: true,
          message: 'Calendar sync completed',
          actionType: 'calendar/syncExternalEvents',
          hub: selectedHub
        });
      } else {
        await confirmAction(formData);

        if (currentResponse?.reasoning.matchedSkill) {
          actionDescription = currentResponse.reasoning.matchedSkill.name;
          reduxActionType = currentResponse.reduxAction?.type || '';
          markOnboardingCompleted();

          actionHistoryStore.recordAction({
            type: 'user-command',
            hub: selectedHub,
            actionType: currentResponse.reasoning.matchedSkill.name,
            reduxActionType: currentResponse.reduxAction?.type,
            description: `Executed: ${currentResponse.reasoning.matchedSkill.name}`,
            payload: formData,
            success: true
          });

          onActionExecuted?.({
            success: true,
            message: `Executed: ${currentResponse.reasoning.matchedSkill.name}`,
            actionType: currentResponse.reduxAction?.type,
            hub: selectedHub
          });
        }
      }

      setTimeout(() => {
        setInputValue('');
        setActiveInsight(null);
        setActiveInsightArtifact(null);
        closeOmnibar();
      }, 500);
    } catch (error) {
      console.error('Failed to execute action:', error);

      actionHistoryStore.recordAction({
        type: activeInsight ? 'proactive-insight' : 'user-command',
        hub: selectedHub,
        actionType: actionDescription || 'Unknown',
        reduxActionType,
        description: `Failed: ${actionDescription || 'Unknown action'}`,
        payload: formData,
        success: false
      });

      onActionExecuted?.({
        success: false,
        message: 'Could not execute action',
        hub: selectedHub
      });
    }
  };

  /**
   * Handle cancel
   */
  const handleCancel = () => {
    cancelAction();
    setInputValue('');
    setActiveInsight(null);
    setActiveInsightArtifact(null);
  };

  const handleOpenInsight = (insight: DynamicInsight) => {
    setActiveInsight(insight);

    if (insight.artifact) {
      setActiveInsightArtifact(insight.artifact);
      return;
    }

    setInputValue(insight.suggestedPrompt);
  };

  const handleVoiceInput = async () => {
    const processTranscript = async (normalizedTranscript: string) => {
      setInputValue(normalizedTranscript);

      // Auto-process voice commands with clear intent.
      const commandKeywords = [
        'create', 'add', 'new', 'schedule', 'record', 'sync', 'set',
        'pay', 'mark', 'update', 'delete', 'remove', 'reminder',
        'start', 'finish', 'complete', 'cancel', 'buy', 'call', 'send'
      ];

      const startsWithCommand = commandKeywords.some(keyword =>
        normalizedTranscript.toLowerCase().startsWith(keyword)
      );

      if (!startsWithCommand) return;

      actionHistoryStore.recordAction({
        type: 'voice-command',
        hub: selectedHub,
        actionType: 'Voice Input',
        description: `Voice command: "${normalizedTranscript}"`,
        payload: { transcript: normalizedTranscript },
        success: true
      });

      const result = await sendPrompt(normalizedTranscript, selectedHub, { autoExecute: true });

      if (result.executed) {
        const skillName = result.response?.reasoning.matchedSkill?.name || 'Action';
        const params = result.response?.reduxAction?.payload;
        const title = params?.title || params?.text || params?.description || '';
        const time = params?.dueDate || params?.date ? ` for ${new Date(params.dueDate || params.date).toLocaleString()}` : '';

        showToast(`✅ ${skillName}: ${title}${time}`, 'success');

        setTimeout(() => {
          setInputValue('');
          closeOmnibar();
        }, 1500);
      } else if (result.needsConfirmation) {
        const missingParams = result.response?.reasoning.missingParams || [];
        if (missingParams.length > 0) {
          if ('speechSynthesis' in window) {
            const utterance = new SpeechSynthesisUtterance(
              `I need more information: ${missingParams.join(', ')}`
            );
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
          }
          showToast(`ℹ️ Please provide: ${missingParams.join(', ')}`, 'info');
        }
      } else {
        playErrorSound();
        showToast('Could not process voice command', 'error');
      }
    };

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback for Android Capacitor builds where Web Speech API is unavailable.
      try {
        const capacitor = (window as any).Capacitor;
        if (capacitor?.isNativePlatform?.()) {
          const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
          const available = await SpeechRecognition.available();
          if (!available?.available) {
            showToast('Speech recognition is not available on this device', 'error');
            return;
          }

          const permission = await SpeechRecognition.requestPermissions();
          const granted = permission?.speechRecognition === 'granted';
          if (!granted) {
            showToast('Microphone permission denied', 'error');
            return;
          }

          setIsListening(true);
          const result = await SpeechRecognition.start({
            language: navigator.language || 'en-US',
            maxResults: 1,
            prompt: 'Speak now...'
          } as any);

          const spoken = (result as any)?.matches?.[0]?.trim();
          setIsListening(false);

          if (spoken) {
            await processTranscript(spoken);
          } else {
            showToast('No voice input detected', 'error');
          }
          return;
        }
      } catch (nativeError) {
        console.error('Native voice fallback failed:', nativeError);
      }

      showToast('Voice input is not available in this environment', 'error');
      onActionExecuted?.({
        success: false,
        message: 'Voice input is not available in this browser',
        hub: selectedHub
      });
      return;
    }

    if (isListening && recognitionRef.current) {
      recognitionRef.current.stop();
      return;
    }

    try {
      await navigator.mediaDevices?.getUserMedia?.({ audio: true });
    } catch {
      showToast('Microphone permission denied', 'error');
      playErrorSound();
      return;
    }

    const recognition = new SpeechRecognition();
    recognition.lang = navigator.language || 'en-US';
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onresult = async (event: any) => {
      const transcript = event?.results?.[0]?.[0]?.transcript;
      if (transcript) {
        const normalizedTranscript = transcript.trim();
        setTimeout(() => {
          processTranscript(normalizedTranscript).catch((err) => {
            console.error('Voice processing failed:', err);
            playErrorSound();
            showToast('Could not process voice command', 'error');
          });
        }, 250);
      }
    };

    recognition.onerror = (event: any) => {
      setIsListening(false);
      playErrorSound();
      showToast(`Voice recognition failed${event?.error ? `: ${event.error}` : ''}`, 'error');
    };

    recognition.onend = () => {
      setIsListening(false);
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      setIsListening(false);
      playErrorSound();
      showToast('Could not start microphone', 'error');
      console.error('Speech recognition start failed:', error);
    }
  };

  useEffect(() => {
    if (!isOpen || !requestVoice) return;
    handleVoiceInput();
    clearPrompt();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, requestVoice]);

  // Only render if open
  if (!isOpen) return null;

  const suggestedSkills = getSkillsByHub(selectedHub).slice(0, 4);
  const dynamicInsights = (insightsByHub[selectedHub] || []).slice(0, 4);
  const artifactToRender = activeInsightArtifact || currentArtifact;

  return (
    <div className="omnibar-overlay">
      <div className="omnibar-container" ref={modalRef}>
        {/* Header */}
        <div className="omnibar-header">
          <div className="omnibar-title">
            <span className="omnibar-icon">🤖</span>
            <span>ATHENEA Assistant</span>
          </div>
          <span className="omnibar-shortcut">Esc to close</span>
        </div>

        {/* Hub Selector Tabs */}
        <div className="omnibar-tabs">
          <button
            className={`omnibar-tab ${selectedHub === 'WorkHub' ? 'active' : ''}`}
            onClick={() => {
              setSelectedHub('WorkHub');
              setInputValue('');
            }}
          >
            💼 Work
          </button>
          <button
            className={`omnibar-tab ${selectedHub === 'PersonalHub' ? 'active' : ''}`}
            onClick={() => {
              setSelectedHub('PersonalHub');
              setInputValue('');
            }}
          >
            📝 Personal
          </button>
          <button
            className={`omnibar-tab ${selectedHub === 'FinanceHub' ? 'active' : ''}`}
            onClick={() => {
              setSelectedHub('FinanceHub');
              setInputValue('');
            }}
          >
            💰 Finance
          </button>
        </div>

        {/* Main Content Area */}
        <div className="omnibar-content">
          {/* Input Section */}
          <form onSubmit={handleSubmitPrompt} className="omnibar-form">
            <input
              ref={inputRef}
              type="text"
              className="omnibar-input"
              placeholder={`What do you want to do in ${selectedHub}?`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            <button
              type="button"
              className={`omnibar-mic-btn ${isListening ? 'is-listening' : ''}`}
              onClick={handleVoiceInput}
              disabled={isLoading}
              title="Voice input"
            >
              {isListening ? '...' : 'Mic'}
            </button>
            {inputValue && (
              <button
                type="submit"
                className="omnibar-submit-btn"
                disabled={isLoading}
              >
                {isLoading ? '⏳' : '→'}
              </button>
            )}
          </form>

          {/* Results Section */}
          {currentResponse ? (
            <div className="omnibar-results">
              {/* Reasoning */}
              <div className="omnibar-reasoning">
                <div className="reasoning-flex">
                  <span className={`confidence-badge ${
                    confidenceScore >= 80 ? 'high' : 
                    confidenceScore >= 60 ? 'medium' : 'low'
                  }`}>
                    {confidenceScore}%
                  </span>
                  <span className="reasoning-text">
                    {currentResponse.reasoning.reasoning}
                  </span>
                </div>
              </div>

              {/* Canvas Artifact */}
              {artifactToRender && (
                <div className="omnibar-artifact">
                  <IntelligenceCanvas
                    artifact={artifactToRender}
                    onConfirm={handleConfirmAction}
                    onCancel={handleCancel}
                    isLoading={isLoading}
                  />
                </div>
              )}
            </div>
          ) : (
            <>
              {/* Empty State - Show Suggested Skills */}
              {!inputValue && !lastError && (
                <div className="omnibar-empty">
                  {dynamicInsights.length > 0 ? (
                    <>
                      <div className="empty-title">Dynamic Insights</div>
                      <div className="insight-list">
                        {dynamicInsights.map((insight) => (
                          <button
                            key={insight.id}
                            className={`insight-card insight-${insight.severity}`}
                            onClick={() => handleOpenInsight(insight)}
                            type="button"
                          >
                            <div className="insight-card-header">
                              <span className="insight-badge">{insight.severity.toUpperCase()}</span>
                              <span className="insight-hub">{insight.hub}</span>
                            </div>
                            <div className="insight-title">{insight.title}</div>
                            <div className="insight-description">{insight.description}</div>
                          </button>
                        ))}
                      </div>
                    </>
                  ) : (
                    <>
                      <div className="empty-title">What do you want to do?</div>
                      <div className="suggested-skills">
                        {suggestedSkills.map((skill) => (
                          <button
                            key={skill.id}
                            className="skill-suggestion"
                            onClick={() => setInputValue(`${skill.icon} ${skill.name.toLowerCase()}`)}
                            type="button"
                          >
                            <span className="skill-icon">{skill.icon}</span>
                            <div className="skill-info">
                              <div className="skill-name">{skill.name}</div>
                              <div className="skill-desc">{skill.description}</div>
                            </div>
                          </button>
                        ))}
                      </div>
                    </>
                  )}
                </div>
              )}

              {/* Error State */}
              {lastError && (
                <div className="omnibar-error">
                  <span>⚠️ {lastError}</span>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="omnibar-footer">
          <span className="footer-text">
            {currentResponse ? 'Review and confirm, or modify your request' : 'Press Ctrl+K for commands'}
          </span>
        </div>
      </div>

      {/* Toast Notifications */}
      {toasts.length > 0 && (
        <div className="omnibar-toasts">
          {toasts.map(toast => (
            <div key={toast.id} className={`toast toast-${toast.type}`}>
              {toast.message}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Omnibar;
