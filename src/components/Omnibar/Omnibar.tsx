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

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { updateOmnibarChatHistory, clearLatestActionableIntercept, updateAgentMemory } from '../../store/slices/aiMemorySlice'; /* OMNI-FIX-2 */
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
import { InterceptCard } from './InterceptCard'; /* INTERCEPT: conectar feature existente */
import { WarRoomView } from './WarRoomView';
import { isOnboardingCompleted, markOnboardingCompleted } from '../../modules/intelligence/proactive/welcomeOnboarding';
import { playSuccessSound, playErrorSound } from '../../modules/intelligence/utils/audioFeedback';
import { llmClient } from '../../services/LLMClient';
import {
  speak,
  stopSpeaking,
  cleanTextForTTS,
  isVoiceboxAvailable,
  getIsSpeaking,
} from '../../services/VoiceboxService';
import { showToast } from '../../components/Toast'; /* OMNI-FIX-8: sistema global de toasts */
import { LoadingSpinner } from '..';
import athenaLogo from '../../assets/img/Athena-logo.png';
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

const resolveVoiceAgent = (msg: ChatMessage): 'cortana' | 'jarvis' | 'shodan' => {
  const raw = `${(msg as any)?.agent || ''} ${(msg as any)?.responderPersona || ''} ${msg.agentName || ''}`
    .toLowerCase();
  if (raw.includes('jarvis')) return 'jarvis';
  if (raw.includes('shodan')) return 'shodan';
  return 'cortana';
};

interface HubShortcut {
  id: string;
  label: string;
  prompt?: string;
  action?: 'openBriefing';
}

/* OMNI-FIX-5: render básico de Markdown sin dependencias externas */
const renderMarkdown = (text: string): string => {
  if (!text) return '';
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<em>$1</em>') /* FIX-4: *italic* con asterisco simple */
    .replace(/_(.+?)_/g, '<em>$1</em>')
    .replace(/`(.+?)`/g, '<code>$1</code>');
};
const SKILL_NAME_ES: Record<string, string> = {
  'Create Project': 'Crear proyecto',
  'Add Task': 'Nueva tarea',
  'Log Work Time': 'Registrar tiempo',
  'Open Task Creator': 'Crear tarea prioritaria',
  'Create Note': 'Nueva nota',
  'Set Reminder': 'Crear recordatorio',
  'Add Todo Item': 'Nuevo pendiente',
  'Mark Routine Done': 'Completar rutina',
  'Record USD Income': 'Registrar ingreso USD',
  'Record MXN Income': 'Registrar ingreso MXN',
  'Record Currency Conversion': 'Convertir divisa',
  'Record USD Expense': 'Registrar gasto USD',
  'Record MXN Expense': 'Registrar gasto MXN',
  'View Budget': 'Ver presupuesto',
};

const SKILL_DESC_ES: Record<string, string> = {
  'Create a new work project...': 'Crea un nuevo proyecto de trabajo',
  'Add a new task to your work...': 'Agrega una tarea a tu trabajo',
  'Record time spent on a task': 'Registra tiempo en una tarea',
  'Open the priority task creation modal': 'Abre el creador de tareas prioritarias',
  'Create a new personal note...': 'Crea una nota personal',
  'Set a reminder for later': 'Crea un recordatorio',
  'Add to your personal todo list': 'Agrega un pendiente',
  'Mark a routine as done': 'Marca una rutina como completada',
  'Log income received in USD': 'Registra un ingreso en USD',
  'Log income received in MXN': 'Registra un ingreso en MXN',
  'Convert currency between USD and MXN': 'Convierte entre USD y MXN',
  'Log an expense in USD': 'Registra un gasto en USD',
  'Log an expense in MXN': 'Registra un gasto en MXN',
};

export const Omnibar: React.FC<OmnibarProps> = ({
  defaultHub = 'WorkHub',
  onActionExecuted
}) => {
  const dispatch = useDispatch();
  const { t, language } = useLanguage();
  const { isOpen, closeOmnibar, prompt, requestVoice, clearPrompt } = useOmnibar();
  const identity = useSelector((s: any) => s.userSettings || s.userIdentity || {});
  const agentNames = identity?.agentNames || {};
  const cortanaName = agentNames.cortana || 'Agent 1';
  const jarvisName = agentNames.jarvis || 'Agent 2';
  const shodanName = agentNames.shodan || 'Agent 3';

  const getAgentForHub = (hub?: 'WorkHub' | 'PersonalHub' | 'FinanceHub') => {
    if (hub === 'WorkHub') return 'cortana';
    if (hub === 'PersonalHub') return 'shodan';
    if (hub === 'FinanceHub') return 'jarvis';
    return 'cortana';
  };

  // Domain-based routing with explicit prompt override:
  // mention wins ("cortana", "shodan", "jarvis").
  const getAgentInfo = (
    hub?: 'WorkHub' | 'PersonalHub' | 'FinanceHub',
    promptText?: string
  ) => {
    const lower = String(promptText || '').toLowerCase();
    if (/\bcortana\b/i.test(lower)) return { name: cortanaName, icon: '🧿' };
    if (/\bshodan\b/i.test(lower)) return { name: shodanName, icon: '👁️' };
    if (/\bjarvis\b/i.test(lower)) return { name: jarvisName, icon: '🤖' };

    const agentKey = getAgentForHub(hub);
    if (agentKey === 'jarvis') return { name: jarvisName, icon: '🤖' };
    if (agentKey === 'shodan') return { name: shodanName, icon: '👁️' };
    return { name: cortanaName, icon: '🧿' };
  };

  const getAgentInfoFromPersona = (
    persona?: 'jarvis' | 'cortana' | 'shodan' | 'swarm' | null,
    fallbackHub?: 'WorkHub' | 'PersonalHub' | 'FinanceHub',
    promptText?: string
  ) => {
    if (persona === 'jarvis') return { name: jarvisName, icon: '🤖' };
    if (persona === 'shodan') return { name: shodanName, icon: '👁️' };
    if (persona === 'cortana') return { name: cortanaName, icon: '🧿' };
    if (persona === 'swarm') return { name: 'ATHENEA', icon: '🎯' };
    return getAgentInfo(fallbackHub, promptText);
  };

  // FIX 6: Voice language from Redux settings (default 'auto')
  const voiceLanguage = useSelector((state: any) => state.userSettings?.voiceLanguage ?? 'auto');
  /* FIX UX-4 — WarRoomView sólo visible en modo avanzado */
  const advancedMode = useSelector((state: any) => state.userSettings?.advancedMode ?? false);

  // FIX 6.1: 4-state voice machine
  type VoiceState = 'idle' | 'listening' | 'processing' | 'error';
  const [voiceState, setVoiceState] = useState<VoiceState>('idle');
  const voiceStateRef = useRef<string>('idle');
  useEffect(() => { voiceStateRef.current = voiceState; }, [voiceState]);
  /* OMNI-FIX-7 */
  const [voiceError, setVoiceError] = useState('');
  const voiceTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const finalResultTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const capturedTranscriptRef = useRef('');
  const inputDebounceRef = useRef<ReturnType<typeof setTimeout> | null>(null); /* OMNI-PERF-1 */

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
  const chatMessagesRef = useRef<ChatMessage[]>([]); /* FIX-6: ref para evitar stale closure en efecto de cierre */
  useEffect(() => { chatMessagesRef.current = chatMessages; }, [chatMessages]);
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  const [voiceboxActive, setVoiceboxActive] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [selectedHub, setSelectedHub] = useState<'WorkHub' | 'PersonalHub' | 'FinanceHub'>(defaultHub);
  const [activeInsight, setActiveInsight] = useState<DynamicInsight | null>(null);
  const [activeInsightArtifact, setActiveInsightArtifact] = useState<CanvasArtifact | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
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
    confirmAction,
    cancelAction /* OMNI-CLEAN-2: confidenceScore eliminado — no se usa en JSX */
  } = useIntelligence(selectedHub);

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

  // OMNI-FIX-2: acceder al historial guardado en Redux
  /* INTERCEPT: intercepción de notificaciones desde Redux */
  const latestIntercept = useSelector((s: any) => s.aiMemory?.interception?.latestActionable ?? null);

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
    if (isOpen) {
      /* FIX-DESKTOP-SHORTCUTS: abrir limpio para mostrar shortcuts/chips desde el inicio */
      setChatMessages([]);
      /* Limpiar cualquier artifact/insight activo de la sesión anterior */
      setActiveInsight(null);
      setActiveInsightArtifact(null);
    } else {
      /* OMNI-FIX-2 + FIX-6: guardar historial — excluir artifacts para que no se restauren como formularios */
      if (chatMessagesRef.current.length > 0) {
        dispatch(updateOmnibarChatHistory(
          chatMessagesRef.current.filter((m: any) => !m.artifact).slice(-20)
        ));
      }
      // Write session summary to agentMemory if there was a real conversation
      const sessionMsgs = chatMessagesRef.current.filter((m) => !m.artifact);
      if (sessionMsgs.length >= 2) {
        const agentMsgs = sessionMsgs.filter((m) => m.role === 'agent');
        const lastAgent = agentMsgs[agentMsgs.length - 1];
        const agentName = lastAgent?.agentName?.toLowerCase() ?? '';
        const agent: 'cortana' | 'jarvis' | 'shodan' =
          agentName.includes('jarvis') ? 'jarvis'
          : agentName.includes('shodan') ? 'shodan'
          : agentName.includes('athenea') || agentName.includes('swarm')
            ? (selectedHub === 'FinanceHub' ? 'jarvis' : selectedHub === 'PersonalHub' ? 'shodan' : 'cortana')
            : 'cortana';

        const lastUserMsg = [...sessionMsgs].reverse().find((m) => m.role === 'user');
        const lastAgentMsg = [...sessionMsgs].reverse().find((m) => m.role === 'agent');
        if (lastUserMsg && lastAgentMsg) {
          const summary = `Usuario preguntó: "${lastUserMsg.text.slice(0, 80)}". Respuesta clave: "${lastAgentMsg.text.slice(0, 120)}".`;
          dispatch(updateAgentMemory({
            agent,
            recentContext: summary,
            lastSeen: new Date().toISOString(),
          }));
        }
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
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
    /* OMNI-PERF-1: debounce 300ms — no disparar Redux en cada keystroke */
    if (inputDebounceRef.current) clearTimeout(inputDebounceRef.current);
    inputDebounceRef.current = setTimeout(() => {
      dispatch({
        type: 'aiObserver/omnibarInputChanged',
        payload: { text: inputValue, at: Date.now(), hub: selectedHub },
      });
    }, 300);
    return () => {
      if (inputDebounceRef.current) clearTimeout(inputDebounceRef.current);
    };
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

  // Close only on true outside interaction (robust for nested/complex DOM trees)
  useEffect(() => {
    const handlePointerDownOutside = (e: PointerEvent) => {
      const modalEl = modalRef.current;
      if (!modalEl) return;

      // composedPath handles shadow DOM and complex event retargeting.
      const eventPath = typeof e.composedPath === 'function' ? e.composedPath() : [];
      const clickedInside = eventPath.includes(modalEl) || modalEl.contains(e.target as Node);

      if (!clickedInside) {
        closeOmnibar();
      }
    };

    if (isOpen) {
      document.addEventListener('pointerdown', handlePointerDownOutside);
      return () => document.removeEventListener('pointerdown', handlePointerDownOutside);
    }
  }, [isOpen, closeOmnibar]);

  /* OMNI-FIX-6: cerrar con Escape */
  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeOmnibar();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
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

    // Create agent placeholder bubble immediately
    const agentBubbleId = `a_${Date.now()}`;
    const agentPlaceholder = getAgentInfoFromPersona(null, selectedHub, userText);
    const placeholderMsg: ChatMessage = {
      id: agentBubbleId,
      role: 'agent',
      agentName: agentPlaceholder.name,
      agentIcon: agentPlaceholder.icon,
      text: '',
      timestamp: Date.now(),
    };
    setChatMessages((prev) => [...prev, placeholderMsg]);
    setStreamingMsgId(agentBubbleId);

    // If no content arrives in time, avoid leaving an empty visible bubble.
    const responseTimeout = window.setTimeout(() => {
      setChatMessages((prev) =>
        prev.map((m) => {
          if (m.id === agentBubbleId && (!m.text || m.text.trim() === '')) {
            return {
              ...m,
              text: 'El agente tardó demasiado en responder. Verifica que Ollama esté corriendo.',
            };
          }
          return m;
        })
      );
    }, 20000);

    // onToken: append each SSE token to the placeholder bubble
    const onToken = (chunk: string) => {
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === agentBubbleId ? { ...m, text: m.text + chunk } : m
        )
      );
    };

    let result;
    try {
      result = await sendPrompt(userText, selectedHub, {
        autoExecute: true,
        conversationHistory: chatMessagesRef.current,
        onToken,
      });
    } catch (err) {
      window.clearTimeout(responseTimeout);
      setStreamingMsgId(null);
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === agentBubbleId
            ? { ...m, text: 'Error al conectar con el agente.' }
            : m
        )
      );
      playErrorSound();
      return;
    } finally {
      window.clearTimeout(responseTimeout);
      setStreamingMsgId(null);
    }

    const resolvedHub = (result.response?.reasoning.matchedSkill?.hub || selectedHub) as 'WorkHub' | 'PersonalHub' | 'FinanceHub';
    const agent = getAgentInfoFromPersona(
      result.response?.reasoning.responderPersona || null,
      resolvedHub,
      userText
    );

    if (result.executed) {
      // Skill auto-executed — replace placeholder with confirmation text
      const skillName = result.response?.reasoning.matchedSkill?.name || 'Acción';
      const params = result.response?.reduxAction?.payload;
      const detail = params?.title || params?.text || params?.description || '';
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === agentBubbleId
            ? {
                ...m,
                agentName: agent.name,
                agentIcon: agent.icon,
                text: `✅ **${skillName}** ejecutado${detail ? `: _${detail}_` : ''}.`,
              }
            : m
        )
      );
      actionHistoryStore.recordAction({
        type: 'user-command',
        hub: selectedHub,
        actionType: skillName,
        reduxActionType: result.response?.reduxAction?.type || '',
        description: `Autoejecutado: ${skillName}`,
        payload: params,
        success: true,
      });
    } else if (result.needsConfirmation && result.response?.artifact) {
      const artifact = result.response.artifact;
      if (artifact.type === 'text') {
        // Pure conversational response — ensure fallback text if stream produced no tokens.
        const fallbackText =
          result.response?.userMessage ||
          (typeof artifact?.props?.description === 'string' ? artifact.props.description : '') ||
          t('Something went wrong.');

        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === agentBubbleId
              ? {
                  ...m,
                  agentName: agent.name,
                  agentIcon: agent.icon,
                  text: m.text && m.text.trim() !== '' ? m.text : fallbackText,
                }
              : m
          )
        );
        cancelAction();
      } else {
        // Action skill needing form — replace placeholder with artifact bubble
        setChatMessages((prev) =>
          prev.map((m) =>
            m.id === agentBubbleId
              ? {
                  ...m,
                  agentName: agent.name,
                  agentIcon: agent.icon,
                  text: result.response?.userMessage ||
                    `Necesito algunos datos para **${result.response?.reasoning.matchedSkill?.name}**.`,
                  artifact,
                }
              : m
          )
        );
      }
    } else if (!result.response?.success) {
      playErrorSound();
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === agentBubbleId
            ? {
                ...m,
                agentName: agent.name,
                agentIcon: agent.icon,
                text: result.response?.userMessage || 'Algo salió mal.',
              }
            : m
        )
      );
    }
  };

  const handleRunInsightPrompt = async (insight: DynamicInsight) => {
    if (insight.artifact && insight.action && !insight.skillId) {
      setActiveInsight(insight);
      setActiveInsightArtifact(insight.artifact);
      showToast('Completa este formulario para ejecutar el insight', 'info');
      return;
    }

    if (!insight.suggestedPrompt?.trim()) {
      showToast('Este insight aún no tiene un prompt ejecutable', 'info');
      return;
    }

    setInputValue(insight.suggestedPrompt);
    const result = await sendPrompt(insight.suggestedPrompt, selectedHub, {
      autoExecute: true,
      conversationHistory: chatMessagesRef.current,
    });

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

    showToast(result.response?.userMessage || 'No se pudo ejecutar este insight', 'error');
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
          description: `Insight ejecutado: ${activeInsight.title}`,
          payload: mergedPayload,
          success: true
        });

        onActionExecuted?.({
          success: true,
          message: `Insight ejecutado: ${activeInsight.title}`,
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
        actionDescription = 'Sincronizar calendario';
        reduxActionType = 'calendar/syncExternalEvents';
        markOnboardingCompleted();

        actionHistoryStore.recordAction({
          type: 'user-command',
          hub: selectedHub,
          actionType: 'Sincronizar calendario',
          reduxActionType: 'calendar/syncExternalEvents',
          description: 'Ejecutado: Sincronizar calendario',
          payload: mergedPayload,
          success: true
        });

        onActionExecuted?.({
          success: true,
          message: 'Sincronización de calendario completada',
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
            description: `Ejecutado: ${currentResponse.reasoning.matchedSkill.name}`,
            payload: formData,
            success: true
          });

          onActionExecuted?.({
            success: true,
            message: `Ejecutado: ${currentResponse.reasoning.matchedSkill.name}`,
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
        message: 'No se pudo ejecutar la acción',
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
        actionType: 'Entrada de voz',
        description: `Comando de voz: "${normalizedTranscript}"`,
        payload: { transcript: normalizedTranscript },
        success: true
      });

      const result = await sendPrompt(normalizedTranscript, selectedHub, {
        autoExecute: true,
        conversationHistory: chatMessagesRef.current,
      });

      if (result.executed) {
        const skillName = result.response?.reasoning.matchedSkill?.name || 'Acción';
        const params = result.response?.reduxAction?.payload;
        const title = params?.title || params?.text || params?.description || '';
        const time = params?.dueDate || params?.date ? ` para ${new Date(params.dueDate || params.date).toLocaleString()}` : '';

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
              `Necesito más información: ${missingParams.join(', ')}`
            );
            utterance.rate = 1.0;
            utterance.pitch = 1.0;
            window.speechSynthesis.speak(utterance);
          }
          showToast(`ℹ️ Por favor completa: ${missingParams.join(', ')}`, 'info');
        }
      } else {
        playErrorSound();
        showToast('No se pudo procesar el comando de voz', 'error');
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
          await cleanupAndReset('error', 'Permiso de micrófono denegado');
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
              await cleanupAndReset('error', 'No se detectó entrada de voz');
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
              await cleanupAndReset('error', 'No se detectó entrada de voz');
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
            transcript ? '' : 'No se detectó entrada de voz');
          if (transcript) await processTranscript(transcript);
        }, 10000);

        return;
      } catch (nativeError) {
        await cleanupAndReset('error', 'No se pudo iniciar el micrófono nativo');
        console.error('Native voice flow failed:', nativeError);
        return;
      }
    }

    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      showToast('La entrada por voz no está disponible en este entorno', 'error');
      onActionExecuted?.({
        success: false,
        message: 'La entrada por voz no está disponible en este navegador',
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
      showToast('Permiso de micrófono denegado', 'error');
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
            showToast('No se pudo procesar el comando de voz', 'error');
          });
        }, 250);
      }
    };

    recognition.onerror = (event: any) => {
      setVoiceState('error');
      setVoiceError(`Reconocimiento de voz falló${event?.error ? `: ${event.error}` : ''}`);
      playErrorSound();
    };

    recognition.onend = () => {
      if (voiceStateRef.current === 'listening') setVoiceState('idle'); /* OMNI-FIX-7 */
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch (error) {
      setVoiceState('error');
      setVoiceError('No se pudo iniciar el micrófono');
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

  /* INTERCEPT: ejecutar protocolo — lleva la intención al input para confirmación del usuario */
  const handleInterceptExecute = useCallback(() => {
    if (!latestIntercept) return;
    if (latestIntercept.actionType === 'register-expense') {
      setSelectedHub('FinanceHub');
      const amount = latestIntercept.amount ? ` $${latestIntercept.amount}` : '';
      const merchant = latestIntercept.merchant ? ` en ${latestIntercept.merchant}` : '';
      setInputValue(`registrar gasto${amount}${merchant}`.trim());
    } else if (latestIntercept.actionType === 'schedule-event') {
      setSelectedHub('PersonalHub');
      setInputValue(`crear evento ${latestIntercept.summary || ''}`.trim());
    }
    dispatch(clearLatestActionableIntercept());
    setTimeout(() => inputRef.current?.focus(), 50);
  }, [latestIntercept, dispatch]);

  const handleInterceptDiscard = useCallback(() => {
    dispatch(clearLatestActionableIntercept());
  }, [dispatch]);

  const getInputPlaceholder = useCallback((hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub') => {
    if (hub === 'WorkHub') return `Habla con ${cortanaName}...`;
    if (hub === 'PersonalHub') return `Habla con ${shodanName}...`;
    if (hub === 'FinanceHub') return `Habla con ${jarvisName}...`;
    return 'Escribe un comando...';
  }, [cortanaName, jarvisName, shodanName]);

  const getAgentKey = useCallback((hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub') => {
    return getAgentForHub(hub);
  }, []);

  const getAgentIcon = useCallback((hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub') => {
    if (hub === 'WorkHub') return '🧿';
    if (hub === 'PersonalHub') return '👁';
    return '🤖';
  }, []);

  const getAgentDisplayName = useCallback((hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub') => {
    const agentKey = getAgentForHub(hub);
    if (agentKey === 'cortana') return cortanaName;
    if (agentKey === 'shodan') return shodanName;
    return jarvisName;
  }, [cortanaName, jarvisName, shodanName]);

  const getAgentRole = useCallback((hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub') => {
    if (hub === 'WorkHub') return 'Estrategia & trabajo';
    if (hub === 'PersonalHub') return 'Salud & bienestar';
    return 'Finanzas & control';
  }, []);

  const getAgentQuickActions = useCallback((hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub') => {
    if (hub === 'WorkHub') return [
      { id: 'task', label: '+ Tarea', prompt: 'crear tarea ' },
      { id: 'focus', label: '⏱ Focus', prompt: 'iniciar foco 25 minutos' },
      { id: 'status', label: '¿Cómo voy?', prompt: 'cortana resumen del día' },
    ];
    if (hub === 'PersonalHub') return [
      { id: 'checkin', label: '+ Check-in', prompt: 'registrar check-in' },
      { id: 'journal', label: '✏ Diario', prompt: 'abrir diario' },
      { id: 'status', label: '¿Cómo estoy?', prompt: 'shodan cómo estoy hoy' },
    ];
    return [
      { id: 'expense', label: '+ Gasto', prompt: 'registrar gasto ' },
      { id: 'income', label: '+ Ingreso', prompt: 'registrar ingreso ' },
      { id: 'status', label: '¿Cuánto tengo?', prompt: 'jarvis cuánto tengo disponible' },
    ];
  }, []);

  const [hudMessage, setHudMessage] = useState('');

  useEffect(() => {
    if (!isOpen || chatMessages.length > 0 || !!inputValue || !!lastError) return;
    setHudMessage('');
    const hubHints: Record<'WorkHub' | 'PersonalHub' | 'FinanceHub', string> = {
      WorkHub: 'Detectando prioridades de trabajo para hoy.',
      PersonalHub: 'Preparando check-in de bienestar del dia.',
      FinanceHub: 'Analizando estado financiero en tiempo real.',
    };
    const timer = window.setTimeout(() => {
      setHudMessage(hubHints[selectedHub]);
    }, 180);
    return () => window.clearTimeout(timer);
  }, [isOpen, chatMessages.length, inputValue, lastError, selectedHub]);

  const handleSubmit = useCallback(() => {
    formRef.current?.requestSubmit();
  }, []);

  const openBriefing = useCallback(() => {
    window.dispatchEvent(new CustomEvent('athenea:openBriefing'));
  }, []);

  /* OMNI-FIX-9: memoizar para evitar doble cálculo */
  const agentInfo = useMemo(
    () => getAgentInfo(selectedHub, inputValue),
    [selectedHub, inputValue]
  );

  /* OMNI-PERF-2: real connectivity status via universal LLM client */
  const [aiOnline, setAiOnline] = useState<boolean | null>(null);
  useEffect(() => {
    let mounted = true;

    const refreshConnection = async () => {
      try {
        const ok = await llmClient.testConnection();
        if (mounted) setAiOnline(ok);
      } catch {
        if (mounted) setAiOnline(false);
      }
    };

    void refreshConnection();

    const onConfigUpdate = () => {
      void refreshConnection();
    };

    window.addEventListener('athenea:llm-config-updated', onConfigUpdate);
    window.addEventListener('athenea:neural-key-updated', onConfigUpdate);

    return () => {
      mounted = false;
      window.removeEventListener('athenea:llm-config-updated', onConfigUpdate);
      window.removeEventListener('athenea:neural-key-updated', onConfigUpdate);
    };
  }, []);

  useEffect(() => {
    if (isOpen) {
      isVoiceboxAvailable().then(setVoiceboxActive).catch(() => setVoiceboxActive(false));
    } else {
      setVoiceboxActive(false);
      setSpeakingMsgId(null);
      stopSpeaking();
    }
  }, [isOpen]);

  useEffect(() => {
    if (!speakingMsgId) return;
    const timer = window.setInterval(() => {
      if (!getIsSpeaking()) {
        setSpeakingMsgId(null);
      }
    }, 300);
    return () => window.clearInterval(timer);
  }, [speakingMsgId]);

  const handleSpeak = useCallback(async (msg: ChatMessage) => {
    if (speakingMsgId === msg.id) {
      stopSpeaking();
      setSpeakingMsgId(null);
      return;
    }

    setSpeakingMsgId(msg.id);
    const text = cleanTextForTTS(msg.text || (msg as any).content || '');
    const agent = resolveVoiceAgent(msg);
    const success = await speak(text, agent);
    if (!success) setSpeakingMsgId(null);
  }, [speakingMsgId]);

  const HUB_SHORTCUTS: Record<'WorkHub' | 'PersonalHub' | 'FinanceHub', HubShortcut[]> = {
    WorkHub: [
      { id: 'work-new-task', label: '+ Nueva tarea', prompt: 'crear tarea ' },
      { id: 'work-new-project', label: '+ Nuevo proyecto', prompt: 'crear proyecto ' },
      { id: 'work-focus-25', label: '⏱ Focus 25min', prompt: 'iniciar foco 25 minutos' },
      { id: 'work-open-spotify', label: '🎵 Spotify', prompt: 'abre spotify' },
      { id: 'work-my-tasks', label: '📋 Mis tareas', prompt: 'cortana resumen de mis tareas' },
      { id: 'work-standup', label: '📊 Daily Standup', prompt: 'cortana resumen del día' },
    ],
    PersonalHub: [
      { id: 'personal-checkin', label: '+ Check-in', prompt: 'registrar check-in' },
      { id: 'personal-journal', label: '✏ Diario', prompt: 'abrir diario' },
      { id: 'personal-quick-note', label: '+ Nota rápida', prompt: 'crear nota ' },
      { id: 'personal-routines', label: '🔄 Rutinas hoy', prompt: 'shodan rutinas de hoy' },
      { id: 'personal-status', label: '¿Cómo estoy?', prompt: 'shodan cómo estoy hoy' },
    ],
    FinanceHub: [
      { id: 'finance-expense', label: '+ Gasto', prompt: 'registrar gasto ' },
      { id: 'finance-income', label: '+ Ingreso', prompt: 'registrar ingreso ' },
      { id: 'finance-balance', label: '💰 ¿Cuánto tengo?', prompt: 'jarvis cuánto tengo disponible' },
      { id: 'finance-save', label: '📈 Ahorrar', prompt: 'transferir a ahorros ' },
      { id: 'finance-debts', label: '📋 Deudas', prompt: 'jarvis resumen de deudas' },
    ],
  };

  // Only render if open — early return MUST come after all hooks
  if (!isOpen) return null;

  const activeShortcuts = HUB_SHORTCUTS[selectedHub] || [];
  const suggestedSkills = getSkillsByHub(selectedHub).slice(0, 4);
  const artifactToRender = activeInsightArtifact || currentArtifact;
  const showInlineOnboardingHint =
    !isOnboardingCompleted() &&
    chatMessages.length === 0 &&
    !inputValue &&
    !currentResponse &&
    !lastError;

  return (
    <>
      <div className="omnibar-overlay">
      <div className="omnibar-container" ref={modalRef} role="dialog" aria-modal="true" aria-label="Asistente ATHENEA"> {/* OMNI-A11Y-1 */}
        <div className={`omnibar-top-strip ${selectedHub === 'WorkHub' ? 'work' : selectedHub === 'PersonalHub' ? 'personal' : 'finance'}`} />

        {/* 1) HEADER */}
        <div className="omnibar-header">
          <div className="omnibar-header-left">
            <img src={athenaLogo} className="omnibar-logo" alt="ATHENEA" />
            <span className={`athenea-status-dot ${aiOnline ? 'live' : 'offline'}`} />
          </div>

          <div className="omnibar-hub-tabs">
            <button
              className={`omnibar-hub-tab ${selectedHub === 'WorkHub' ? 'active work' : ''}`}
              onClick={() => {
                setSelectedHub('WorkHub');
                setInputValue('');
                setChatMessages([]);
              }}
            >
              Trabajo
            </button>
            <button
              className={`omnibar-hub-tab ${selectedHub === 'PersonalHub' ? 'active personal' : ''}`}
              onClick={() => {
                setSelectedHub('PersonalHub');
                setInputValue('');
                setChatMessages([]);
              }}
            >
              Personal
            </button>
            <button
              className={`omnibar-hub-tab ${selectedHub === 'FinanceHub' ? 'active finance' : ''}`}
              onClick={() => {
                setSelectedHub('FinanceHub');
                setInputValue('');
                setChatMessages([]);
              }}
            >
              Finanzas
            </button>
            <button
              className="omnibar-hub-tab"
              onClick={openBriefing}
            >
              ☀️ Briefing
            </button>
          </div>

          <button
            type="button"
            className="omnibar-close-btn"
            onClick={closeOmnibar}
            aria-label="Cerrar asistente"
          >
            ✕
          </button>
        </div>

        {/* 2) INPUT */}
        <div className="omnibar-input-section">
          <form ref={formRef} onSubmit={handleSubmitPrompt} className="omnibar-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="omnibar-input"
              placeholder={getInputPlaceholder(selectedHub)}
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleSubmit();
                }
              }}
              disabled={isLoading}
              aria-label={getInputPlaceholder(selectedHub)}
            />
            {chatMessages.length > 0 && (
              <span
                className="omnibar-context-indicator"
                title={`${chatMessages.length} mensajes en contexto`}
              >
                {Math.floor(chatMessages.length / 2)}
              </span>
            )}
            <button
              type="button"
              className={`omnibar-voice-btn ${voiceState}`}
              onClick={handleVoiceInput}
              disabled={isLoading || voiceState === 'processing'}
              aria-label={voiceState === 'listening' ? 'Detener voz' : 'Iniciar voz'}
              title={voiceState === 'listening' ? 'Toca para detener' : 'Entrada por voz'}
            >
              {voiceState === 'listening' ? '⏹' : '🎙'}
            </button>
            <button
              type="button"
              className="omnibar-send-btn"
              disabled={isLoading || !inputValue.trim()}
              onClick={handleSubmit}
              title="Enviar"
              aria-label="Enviar"
            >
              {isLoading ? (
                <span className="omnibar-spinner" />
              ) : (
                <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              )}
            </button>
          </form>
          {voiceState !== 'idle' && (
            <div className={`omnibar-voice-status${voiceState === 'error' ? ' omnibar-voice-status--error' : ''}`} aria-live="assertive" aria-atomic="true">
              {voiceState === 'listening' && '🎙 Escuchando…'}
              {voiceState === 'processing' && '⏳ Procesando…'}
              {voiceState === 'error' && `⚠️ ${voiceError || 'Error de voz'}`}
            </div>
          )}
          {isLoading && (
            <div className="omnibar-inline-loading" aria-live="polite">
              <LoadingSpinner size="sm" label="ATHENEA está pensando" />
              <span>ATHENEA está pensando...</span>
            </div>
          )}
        </div>

        {/* Main Content Area */}
        <div className="omnibar-content">
          {advancedMode && <WarRoomView />}

          {/* 3) AGENTE PANEL */}
          {chatMessages.length === 0 && !inputValue && !lastError && (
            <div className={`omnibar-agent-panel agent-${getAgentKey(selectedHub)}`}>
              <div className="athenea-scanlines omnibar-scanlines" />

              <div className="agent-panel-header">
                <span className="agent-panel-icon">{getAgentIcon(selectedHub)}</span>
                <div className="agent-panel-identity">
                  <span className="agent-panel-name">{getAgentDisplayName(selectedHub)}</span>
                  <span className="agent-panel-role">{getAgentRole(selectedHub)}</span>
                </div>
                <span className="athenea-status-dot live" />
              </div>

              <div className="agent-panel-message">
                {hudMessage ? (
                  <p>{hudMessage}</p>
                ) : (
                  <div className="agent-message-loading">
                    <div className="skeleton-line" />
                    <div className="skeleton-line short" />
                  </div>
                )}
              </div>

              <div className="agent-panel-actions">
                {getAgentQuickActions(selectedHub).map((action) => (
                  <button
                    key={action.id}
                    className="agent-quick-action"
                    onClick={() => {
                      if (!action.prompt) return;
                      setInputValue(action.prompt);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    type="button"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* INTERCEPT: mantener lógica existente */}
          {chatMessages.length === 0 && !inputValue && latestIntercept && latestIntercept.actionType !== 'none' && (
            <InterceptCard
              appName={latestIntercept.appName}
              packageName={latestIntercept.packageName}
              summary={latestIntercept.summary}
              urgency={latestIntercept.urgency}
              actionType={latestIntercept.actionType}
              merchant={latestIntercept.merchant}
              temporalHint={latestIntercept.temporalHint}
              onExecute={handleInterceptExecute}
              onDiscard={handleInterceptDiscard}
            />
          )}

          {/* 4) SKILLS CHIPS */}
          {chatMessages.length === 0 && !inputValue && !lastError && (
            <div className="omnibar-shortcuts-section">
              <div className="omnibar-shortcuts-grid">
                {activeShortcuts.map((s, i) => (
                  <button
                    key={s.id || i}
                    className="omnibar-shortcut-chip"
                    onClick={() => {
                      if (!s.prompt) return;
                      setInputValue(s.prompt);
                      setTimeout(() => inputRef.current?.focus(), 50);
                    }}
                    type="button"
                  >
                    {s.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {chatMessages.length === 0 && !inputValue && !lastError && (
            <div className="omnibar-skills-section">
              <div className="omnibar-skills-grid">
                {getSkillsByHub(selectedHub).slice(0, 4).map((skill) => {
                  const skillName = SKILL_NAME_ES[skill.name] || skill.name;
                  const skillDesc = SKILL_DESC_ES[skill.description] || skill.description;
                  return (
                  <button
                    key={skill.id}
                    className="omnibar-skill-chip"
                    onClick={() => setInputValue(skill.name.toLowerCase())}
                    type="button"
                  >
                    <span className="skill-chip-icon" style={{ fontSize: '16px' }}>{skill.icon}</span>
                    <div className="skill-chip-text">
                      <span className="skill-chip-name">{skillName}</span>
                      <span className="skill-chip-desc">{skillDesc}</span>
                    </div>
                  </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* 5) CHAT */}
          {chatMessages.length > 0 ? (
            <div className="omnibar-chat" role="log" aria-live="polite"> {/* OMNI-A11Y-1 */}
              {chatMessages.map((msg) => (
                <div key={msg.id} className={`chat-bubble chat-bubble--${msg.role}`}>
                  {msg.role === 'agent' && (
                    <div className="chat-agent-header">
                      <span className="chat-agent-icon">{msg.agentIcon}</span>
                      <span className="chat-agent-name">{msg.agentName}</span>
                    </div>
                  )}
                  <div
                    className="chat-bubble-text"
                    role="status"
                    aria-live="polite"
                    aria-atomic="false"
                    dangerouslySetInnerHTML={{
                      __html:
                        renderMarkdown(msg.text || '') +
                        (streamingMsgId === msg.id
                          ? '<span class="omnibar-stream-cursor">▌</span>'
                          : ''),
                    }}
                  />
                  {voiceboxActive && msg.role === 'agent' && (
                    <button
                      className={`omnibar-speak-btn ${speakingMsgId === msg.id ? 'speaking' : ''}`}
                      onClick={() => handleSpeak(msg)}
                      title={speakingMsgId === msg.id ? 'Detener' : 'Escuchar'}
                      type="button"
                    >
                      {speakingMsgId === msg.id ? '⏹' : '🔊'}
                    </button>
                  )}
                  {/* OMNI-FIX-5 */}
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
              {isLoading && !streamingMsgId && (
                <div className="chat-bubble chat-bubble--agent chat-bubble--typing">
                  <span className="chat-agent-icon">{agentInfo.icon /* OMNI-FIX-9 */}</span>
                  <LoadingSpinner size="sm" label="Procesando comando" />
                  <span className="chat-bubble-loading-text">{t('Procesando comando...')}</span>
                  <span className="chat-typing-dots"><span/><span/><span/></span>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>
          ) : null}

          {lastError && (
            <div className="omnibar-error">
              <span>⚠️ {lastError}</span>
            </div>
          )}
        </div>

        {/* FOOTER */}
        <div className="omnibar-footer">
          <kbd>Enter</kbd> enviar
          <span className="omnibar-footer-sep">·</span>
          <kbd>Esc</kbd> cerrar
          <span className="omnibar-footer-sep">·</span>
          <span className="omnibar-footer-agent">
            {getAgentDisplayName(selectedHub)}
          </span>
        </div>
      </div>

      </div>
    </>
  );
};

export default Omnibar;
