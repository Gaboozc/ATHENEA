/**
 * Omnibar Component
 * 
 * Global AI assistant command palette with AUTONOMOUS EXECUTION
 * - Appears as a floating modal at the top of the screen
 * - Activated from ATHENEA floating action button
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

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../../context/LanguageContext';
import { syncExternalEvents } from '../../../store/slices/calendarSlice.js';
import {
  useIntelligence,
  IntelligenceCanvas,
  getSkillsByHub,
  actionHistoryStore
} from '../../modules/intelligence';
import type { CanvasArtifact, DynamicInsight } from '../../modules/intelligence';
import { useOmnibar } from './useOmnibar';
import { ProactiveHUD } from './ProactiveHUD.tsx';
import { WarRoomView } from './WarRoomView';
import { isOnboardingCompleted, markOnboardingCompleted } from '../../modules/intelligence/proactive/welcomeOnboarding';
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

interface ChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  agentName?: string;
  agentIcon?: string;
  artifact?: CanvasArtifact;
  actionLabel?: string;
  timestamp: number;
}

interface HubShortcut {
  id: string;
  label: string;
  prompt: string;
}

export const Omnibar: React.FC<OmnibarProps> = ({
  defaultHub = 'WorkHub',
  onActionExecuted
}) => {
  const dispatch = useDispatch();
  const { t, language } = useLanguage();
  const { isOpen, closeOmnibar, prompt, requestVoice, clearPrompt } = useOmnibar();

  // Domain-based routing with explicit prompt override:
  // mention wins ("cortana", "shodan", "jarvis").
  const getAgentInfo = (
    hub?: 'WorkHub' | 'PersonalHub' | 'FinanceHub',
    promptText?: string
  ) => {
    const lower = String(promptText || '').toLowerCase();
    if (/\bcortana\b/i.test(lower)) return { name: 'Cortana', icon: '🧿' };
    if (/\bshodan\b/i.test(lower)) return { name: 'SHODAN', icon: '👁️' };
    if (/\bjarvis\b/i.test(lower)) return { name: 'Jarvis', icon: '🤖' };

    if (hub === 'FinanceHub') return { name: 'Jarvis', icon: '🤖' };
    if (hub === 'PersonalHub') return { name: 'SHODAN', icon: '👁️' };
    return { name: 'Cortana', icon: '🧿' };
  };

  const getAgentInfoFromPersona = (
    persona?: 'jarvis' | 'cortana' | 'shodan' | 'swarm' | null,
    fallbackHub?: 'WorkHub' | 'PersonalHub' | 'FinanceHub',
    promptText?: string
  ) => {
    if (persona === 'jarvis') return { name: 'Jarvis', icon: '🤖' };
    if (persona === 'shodan') return { name: 'SHODAN', icon: '👁️' };
    if (persona === 'cortana') return { name: 'Cortana', icon: '🧿' };
    if (persona === 'swarm') return { name: 'ATHENEA', icon: '🎯' };
    return getAgentInfo(fallbackHub, promptText);
  };

  // FIX 6: Voice language from Redux settings (default 'auto')
  const voiceLanguage = useSelector((state: any) => state.userSettings?.voiceLanguage ?? 'auto');

  // FIX 6.1: 4-state voice machine
  type VoiceState = 'idle' | 'listening' | 'processing' | 'error';
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const [voiceError, setVoiceError] = useState('');
  const voiceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalResultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const capturedTranscriptRef = useRef('');

  // FIX 6.2: Locale resolution from Redux or browser
  const resolveLocale = useCallback((): string => {
    if (voiceLanguage && voiceLanguage !== 'auto') return voiceLanguage;
    const lang = navigator.language || 'en-US';
    if (lang.startsWith('es')) return 'es-MX';
    return 'en-US';
  }, [voiceLanguage]);

  // Local state
  const [inputValue, setInputValue] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [selectedHub, setSelectedHub] = useState<'WorkHub' | 'PersonalHub' | 'FinanceHub'>(defaultHub);
  const [activeInsight, setActiveInsight] = useState<DynamicInsight | null>(null);
  const [activeInsightArtifact, setActiveInsightArtifact] = useState<CanvasArtifact | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const recognitionRef = useRef<any>(null);
  const nativeSpeechRef = useRef<any>(null);
  const nativeVoiceInFlightRef = useRef(false);

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

  // FIX 6.3: cleanupAndReset as useCallback — clears all timers, stops plugin, resets state atomically
  const cleanupAndReset = useCallback(async (nextState: VoiceState = 'idle', errorMsg = '') => {
    // Clear all pending timers first
    if (voiceTimeoutRef.current) {
      clearTimeout(voiceTimeoutRef.current);
      voiceTimeoutRef.current = null;
    }
    if (finalResultTimeoutRef.current) {
      clearTimeout(finalResultTimeoutRef.current);
      finalResultTimeoutRef.current = null;
    }

    nativeVoiceInFlightRef.current = false;

    const speech = nativeSpeechRef.current;
    if (speech) {
      try { await speech.stop(); } catch { /* ignore */ }
      try { await speech.removeAllListeners(); } catch { /* ignore */ }
    }

    setVoiceState(nextState);
    if (errorMsg) setVoiceError(errorMsg);
  }, []);

  // FIX 6: Auto-clear error state after 3 seconds
  useEffect(() => {
    if (voiceState !== 'error') return;
    const t = setTimeout(() => {
      setVoiceState('idle');
      setVoiceError('');
    }, 3000);
    return () => clearTimeout(t);
  }, [voiceState]);

  useEffect(() => {
    return () => {
      cleanupAndReset().catch(() => { /* ignore unmount errors */ });
    };
  }, [cleanupAndReset]);

  // Focus input when modal opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      setTimeout(() => inputRef.current?.focus(), 100);
    }
    // Reset chat history when Omnibar re-opens
    if (isOpen) setChatMessages([]);
  }, [isOpen]);

  useEffect(() => {
    if (isOpen) {
      dispatch({ type: 'aiObserver/omnibarOpened', payload: { at: Date.now() } });
    } else {
      dispatch({ type: 'aiObserver/omnibarClosed', payload: { at: Date.now() } });
    }
  }, [dispatch, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    dispatch({ type: 'aiObserver/hubVisited', payload: { hub: selectedHub, at: Date.now() } });
  }, [dispatch, isOpen, selectedHub]);

  useEffect(() => {
    if (!isOpen) return;
    dispatch({
      type: 'aiObserver/omnibarInputChanged',
      payload: { text: inputValue, at: Date.now(), hub: selectedHub },
    });
  }, [dispatch, inputValue, isOpen, selectedHub]);

  useEffect(() => {
    if (!isOpen || !prompt) return;
    setInputValue(prompt);
    clearPrompt();
  }, [clearPrompt, isOpen, prompt]);

  // Auto-scroll chat to latest message
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

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
   * Handle prompt submission — Chat mode
   * User messages appear as bubbles; agent answers inline.
   * Action skills still show Canvas to confirm before dispatch.
   */
  const handleSubmitPrompt = async (e: React.FormEvent) => {
    e.preventDefault();
    const userText = inputValue.trim();
    if (!userText) return;

    // Push user bubble immediately
    const userMsg: ChatMessage = {
      id: `u_${Date.now()}`,
      role: 'user',
      text: userText,
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, userMsg]);
    setInputValue('');

    const result = await sendPrompt(userText, selectedHub, { autoExecute: true });
    const resolvedHub = (result.response?.reasoning.matchedSkill?.hub || selectedHub) as 'WorkHub' | 'PersonalHub' | 'FinanceHub';
    const agent = getAgentInfoFromPersona(
      result.response?.reasoning.responderPersona || null,
      resolvedHub,
      userText
    );

    if (result.executed) {
      // Action auto-executed → show confirmation bubble
      const skillName = result.response?.reasoning.matchedSkill?.name || t('Action');
      const params = result.response?.reduxAction?.payload;
      const detail = params?.title || params?.text || params?.description || '';
      const agentMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'agent',
        agentName: agent.name,
        agentIcon: agent.icon,
        text: language === 'es'
          ? `✅ **${skillName}** ejecutado${detail ? `: _${detail}_` : ''}.`
          : `✅ **${skillName}** executed${detail ? `: _${detail}_` : ''}.`,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, agentMsg]);

      actionHistoryStore.recordAction({
        type: 'user-command',
        hub: selectedHub,
        actionType: skillName,
        reduxActionType: result.response?.reduxAction?.type || '',
        description: `Auto-executed: ${skillName}`,
        payload: params,
        success: true,
      });
    } else if (result.needsConfirmation && result.response?.artifact) {
      const artifact = result.response.artifact;

      if (artifact.type === 'text') {
        // Pure conversational response — show as agent chat bubble
        const agentMsg: ChatMessage = {
          id: `a_${Date.now()}`,
          role: 'agent',
          agentName: agent.name,
          agentIcon: agent.icon,
          text: artifact.props?.description || result.response?.userMessage || '',
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, agentMsg]);
        // dismiss pending Canvas so no form shows
        cancelAction();
      } else {
        // Action that needs form confirmation — show Canvas bubble
        const agentMsg: ChatMessage = {
          id: `a_${Date.now()}`,
          role: 'agent',
          agentName: agent.name,
          agentIcon: agent.icon,
          text: result.response?.userMessage || `${t('I need some details for')} **${result.response?.reasoning.matchedSkill?.name}**.`,
          artifact,
          timestamp: Date.now(),
        };
        setChatMessages((prev) => [...prev, agentMsg]);
      }
    } else if (!result.response?.success) {
      playErrorSound();
      const agentMsg: ChatMessage = {
        id: `a_${Date.now()}`,
        role: 'agent',
        agentName: agent.name,
        agentIcon: agent.icon,
        text: `⚠️ ${result.response?.userMessage || t('Did not understand that request.')}`,
        timestamp: Date.now(),
      };
      setChatMessages((prev) => [...prev, agentMsg]);
    }
  };

  const handleRunInsightPrompt = async (insight: DynamicInsight) => {
    if (insight.artifact && insight.action && !insight.skillId) {
      setActiveInsight(insight);
      setActiveInsightArtifact(insight.artifact);
      showToast('Complete this form to execute the insight', 'info');
      return;
    }

    if (!insight.suggestedPrompt?.trim()) {
      showToast('This insight has no executable prompt yet', 'info');
      return;
    }

    setInputValue(insight.suggestedPrompt);
    const result = await sendPrompt(insight.suggestedPrompt, selectedHub, { autoExecute: true });

    if (result.executed) {
      const skillName = result.response?.reasoning.matchedSkill?.name || insight.title;
      showToast(`✅ ${skillName}`, 'success');
      markOnboardingCompleted();
      return;
    }

    if (result.needsConfirmation) {
      setActiveInsight(insight);
      if (insight.artifact) {
        setActiveInsightArtifact(insight.artifact);
      }
      return;
    }

    showToast(result.response?.userMessage || 'Could not run this insight', 'error');
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

    const capacitor = (window as any).Capacitor;
    const isNativePlatform = Boolean(capacitor?.isNativePlatform?.());

    if (isNativePlatform) {
      // FIX 6.1: If already listening, cancel and reset
      if (voiceState === 'listening') {
        await cleanupAndReset('idle');
        return;
      }

      // Prevent concurrent sessions
      if (nativeVoiceInFlightRef.current) return;

      try {
        const { SpeechRecognition } = await import('@capacitor-community/speech-recognition');
        nativeSpeechRef.current = SpeechRecognition;

        // Check availability
        const available = await SpeechRecognition.available();
        if (!available?.available) {
          await cleanupAndReset('error', 'Speech recognition not available on this device');
          return;
        }

        // Request permission if needed
        const permission = await SpeechRecognition.requestPermissions();
        const granted = permission?.speechRecognition === 'granted';
        if (!granted) {
          await cleanupAndReset('error', 'Microphone permission denied');
          return;
        }

        // FIX 6.1: Hard cleanup before any new session
        await cleanupAndReset('idle');

        // Mark session as active
        nativeVoiceInFlightRef.current = true;
        capturedTranscriptRef.current = '';
        setVoiceState('listening');

        // FIX 6.5: Debounce final result submission 1.5s after last partial
        const scheduleFinalSubmit = () => {
          if (finalResultTimeoutRef.current) clearTimeout(finalResultTimeoutRef.current);
          finalResultTimeoutRef.current = setTimeout(async () => {
            const transcript = capturedTranscriptRef.current.trim();
            await cleanupAndReset('processing');
            if (transcript) {
              await processTranscript(transcript);
            } else {
              await cleanupAndReset('error', t('No voice input detected'));
            }
          }, 1500);
        };

        // Setup listeners BEFORE starting
        await SpeechRecognition.addListener('partialResults', (data: any) => {
          const partial = data?.matches?.[0] || '';
          if (partial && nativeVoiceInFlightRef.current) {
            capturedTranscriptRef.current = partial;
            setInputValue(partial);
            scheduleFinalSubmit(); // reset debounce on every partial
          }
        });

        // FIX 6.4: listeningState stopped → trigger final submit immediately
        await SpeechRecognition.addListener('listeningState', async (state: any) => {
          if (state?.status === 'stopped' && nativeVoiceInFlightRef.current) {
            // Cancel pending debounce and submit right away
            if (finalResultTimeoutRef.current) {
              clearTimeout(finalResultTimeoutRef.current);
              finalResultTimeoutRef.current = null;
            }
            const transcript = capturedTranscriptRef.current.trim();
            await cleanupAndReset('processing');
            if (transcript) {
              await processTranscript(transcript);
            } else {
              await cleanupAndReset('error', t('No voice input detected'));
            }
          }
        });

        // FIX 6.2: Use Redux voice language setting
        await SpeechRecognition.start({
          language: resolveLocale(),
          maxResults: 5,
          partialResults: true,
          popup: false,
          prompt: ''
        } as any);

        // FIX 6.4: Hard 10s escape timeout — in case listeningState never fires
        voiceTimeoutRef.current = setTimeout(async () => {
          const transcript = capturedTranscriptRef.current.trim();
          await cleanupAndReset(transcript ? 'processing' : 'error',
            transcript ? '' : t('No voice input detected'));
          if (transcript) await processTranscript(transcript);
        }, 10000);

        return;
      } catch (nativeError) {
        await cleanupAndReset('error', 'Native microphone failed to start');
        console.error('Native voice flow failed:', nativeError);
        return;
      }
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('Voice input is not available in this environment', 'error');
      onActionExecuted?.({
        success: false,
        message: 'Voice input is not available in this browser',
        hub: selectedHub
      });
      return;
    }

    if (voiceState === 'listening' && recognitionRef.current) {
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
    recognition.lang = resolveLocale();
    recognition.interimResults = false;
    recognition.maxAlternatives = 1;

    recognition.onstart = () => {
      setVoiceState('listening');
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
      setVoiceState('error');
      setVoiceError(`Voice recognition failed${event?.error ? `: ${event.error}` : ''}`);
      playErrorSound();
    };

    recognition.onend = () => {
      if (voiceState === 'listening') setVoiceState('idle');
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      setVoiceState('error');
      setVoiceError('Could not start microphone');
      playErrorSound();
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
  const artifactToRender = activeInsightArtifact || currentArtifact;
  const showInlineOnboardingHint = selectedHub === 'WorkHub' && !isOnboardingCompleted();
  const shortcutsByHub: Record<'WorkHub' | 'PersonalHub' | 'FinanceHub', HubShortcut[]> = {
    WorkHub: [
      { id: 'work-create-collaborator', label: t('Create collaborator'), prompt: 'create collaborator' },
      { id: 'work-create-project', label: t('Create project'), prompt: 'create project' },
      { id: 'work-create-task', label: t('Create task'), prompt: 'create task' },
    ],
    PersonalHub: [
      { id: 'personal-create-routine', label: t('Create routine'), prompt: 'create daily routine' },
      { id: 'personal-create-reminder', label: t('Create reminder'), prompt: 'create reminder' },
      { id: 'personal-create-note', label: t('Create note'), prompt: 'create note' },
    ],
    FinanceHub: [
      { id: 'finance-add-expense', label: t('Record expense'), prompt: 'record expense' },
      { id: 'finance-add-income', label: t('Record income'), prompt: 'record income' },
      { id: 'finance-view-budget', label: t('View budget'), prompt: 'show budget status' },
    ],
  };
  const activeShortcuts = shortcutsByHub[selectedHub] || [];

  return (
    <div className="omnibar-overlay">
      <div className="omnibar-container" ref={modalRef}>
        <div className="omnibar-top-strip" />
        {/* Header */}
        <div className="omnibar-header">
          <div className="omnibar-title">
            <span className="omnibar-icon">🤖</span>
            <span>ATHENEA Assistant</span>
            <span className="omnibar-version">UI v2</span>
          </div>
          <button
            type="button"
            className="omnibar-shortcut omnibar-close-btn"
            onClick={closeOmnibar}
            aria-label="Close assistant"
          >
            ✕ {t('tap here to close')}
          </button>
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
          <WarRoomView />

          {/* Input Section */}
          <form onSubmit={handleSubmitPrompt} className="omnibar-form">
            <input
              ref={inputRef}
              type="text"
              className="omnibar-input"
               placeholder={`${t('What do you want to do?')}`}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              disabled={isLoading}
            />
            {/* FIX 6.6: Voice button with 4 visual states */}
            <button
              type="button"
              className={[
                'omnibar-voice-btn',
                voiceState === 'listening' ? 'omnibar-voice-btn--listening' : '',
                voiceState === 'processing' ? 'omnibar-voice-btn--processing' : '',
                voiceState === 'error' ? 'omnibar-voice-btn--error' : '',
              ].filter(Boolean).join(' ')}
              onClick={handleVoiceInput}
              disabled={isLoading || voiceState === 'processing'}
              aria-label={voiceState === 'listening' ? 'Stop voice input' : 'Start voice input'}
              title={voiceState === 'listening' ? 'Tap to stop' : 'Voice input'}
            >
              {voiceState === 'idle' ? '🎙' : voiceState === 'listening' ? '⏹' : voiceState === 'processing' ? '⏳' : '⚠️'}
            </button>
            <button
              type="submit"
              className="omnibar-submit-btn"
              disabled={isLoading || !inputValue.trim()}
              title="Send"
            >
              {isLoading ? '⏳' : '→'}
            </button>
          </form>
          {/* FIX 6.6: Voice status bar */}
          {voiceState !== 'idle' && (
            <div className={`omnibar-voice-status${voiceState === 'error' ? ' omnibar-voice-status--error' : ''}`}>
              {voiceState === 'listening' && `🎙 ${t('Listening')}…`}
              {voiceState === 'processing' && `⏳ ${t('Processing')}…`}
              {voiceState === 'error' && `⚠️ ${voiceError || t('Voice error')}`}
            </div>
          )}

          {showInlineOnboardingHint && !inputValue && !currentResponse && !lastError && (
            <div className="omnibar-inline-onboarding-hint">
              <div className="onboarding-hint-title">{t('First command setup')}</div>
              <div className="onboarding-hint-text">
                Open Omnibar from here and run your first command. This quick tip now lives above Workflow optimal, not inside Dynamic Insights.
              </div>
            </div>
          )}

          {/* Proactive HUD - shown only when chat is empty */}
          {chatMessages.length === 0 && !inputValue && !lastError && (
            <div className="omnibar-proactive-hud-section">
              <ProactiveHUD
                onApplySuggestion={(suggestion) => {
                  setInputValue(suggestion);
                  setTimeout(() => inputRef.current?.focus(), 0);
                  showToast('Suggestion moved to command box', 'info');
                }}
              />
            </div>
          )}

          {/* ── CHAT AREA ── */}
          {chatMessages.length > 0 ? (
            <div className="omnibar-chat">
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`chat-bubble chat-bubble--${msg.role}`}>
                  {msg.role === 'agent' && (
                    <div className="chat-agent-header">
                      <span className="chat-agent-icon">{msg.agentIcon}</span>
                      <span className="chat-agent-name">{msg.agentName}</span>
                    </div>
                  )}
                  <div className="chat-bubble-text">{msg.text}</div>
                  {msg.artifact && (
                    <div className="chat-artifact">
                      <IntelligenceCanvas
                        artifact={msg.artifact}
                        onConfirm={handleConfirmAction}
                        onCancel={handleCancel}
                        isLoading={isLoading}
                      />
                    </div>
                  )}
                </div>
              ))}
              {isLoading && (
                <div className="chat-bubble chat-bubble--agent chat-bubble--typing">
                  <span className="chat-agent-icon">{getAgentInfo(selectedHub, inputValue).icon}</span>
                  <span className="chat-typing-dots"><span/><span/><span/></span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          ) : (
            <>
              {/* Empty state — suggested shortcuts */}
              {!inputValue && !lastError && (
                <div className="omnibar-empty">
                  <div className="omnibar-shortcuts-row" role="group" aria-label={`${selectedHub} quick shortcuts`}>
                    {activeShortcuts.map((shortcut) => (
                      <button
                        key={shortcut.id}
                        type="button"
                        className="omnibar-shortcut-btn"
                        onClick={() => {
                          setInputValue(shortcut.prompt);
                          setTimeout(() => inputRef.current?.focus(), 0);
                        }}
                      >
                        {shortcut.label}
                      </button>
                    ))}
                  </div>

                  <div className="empty-title">{t('What do you want to do?')}</div>
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
                </div>
              )}

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
            {getAgentInfo(selectedHub, inputValue).icon} {getAgentInfo(selectedHub, inputValue).name} — {t('type your query or command')}
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
