/**
 * usePersona Hook
 * 
 * Provides React integration with PersonaEngine
 * Handles initialization, response generation, and state management
 */

import { useEffect, useState, useRef } from 'react';
import { useDispatch } from 'react-redux';
import { showToast } from '../../../components/Toast';
import PersonaEngine from '../personaEngine';
import type {
  PersonaResponse,
  ContextSnapshot,
} from '../personaEngine';
import {
  initializePersonaEngine,
  getPersonaEngine,
} from '../personaEngine';

export function usePersona() {
  const dispatch = useDispatch();
  const [persona, setPersona] = useState<PersonaEngine | null>(null);
  const [currentResponse, setCurrentResponse] = useState<PersonaResponse | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const personaRef = useRef<PersonaEngine | null>(null);

  // Initialize persona engine on mount
  useEffect(() => {
    const engine = initializePersonaEngine();
    personaRef.current = engine;

    if (!persona) {
      setPersona(engine);
    }

    // Initial greeting when component mounts
    engine
      .generateResponseWithLLM()
      .then((initialResponse) => {
        setCurrentResponse(initialResponse);
      })
      .catch((error) => {
        console.error('[usePersona] Initial LLM greeting failed:', error);
        const fallback = engine.generateResponse();
        setCurrentResponse(fallback);
        showToast('LLM no disponible, usando respuesta local', 'warning');
      });

    // Re-generate when API key is set/cleared
    const onKeyUpdate = () => {
      const eng = personaRef.current || getPersonaEngine();
      eng.generateResponseWithLLM()
        .then(setCurrentResponse)
        .catch((error) => {
          console.error('[usePersona] Key update refresh failed:', error);
          setCurrentResponse(eng.generateResponse());
          showToast('No se pudo refrescar con LLM, usando fallback local', 'warning');
        });
    };
    window.addEventListener('athenea:neural-key-updated', onKeyUpdate);

    return () => {
      window.removeEventListener('athenea:neural-key-updated', onKeyUpdate);
    };
  }, [dispatch]);

  const generateResponse = async (
    requestContext?: Partial<ContextSnapshot>,
    requestedAction?: string
  ): Promise<PersonaResponse> => {
    const engine = personaRef.current || getPersonaEngine();
    setIsGenerating(true);

    try {
      const response = await engine.generateResponseWithLLM(requestContext, requestedAction);
      setCurrentResponse(response);
      return response;
    } catch (error) {
      console.error('[usePersona] generateResponse failed:', error);
      const fallback = engine.generateResponse(requestContext, requestedAction);
      setCurrentResponse(fallback);
      showToast('Error al generar respuesta con LLM, usando fallback local', 'error');
      return fallback;
    } finally {
      setIsGenerating(false);
    }
  };

  const sendMessage = async (userInput: string): Promise<PersonaResponse> => {
    const engine = personaRef.current || getPersonaEngine();
    setIsGenerating(true);

    try {
      const response = await engine.sendConversationalInput(userInput);
      setCurrentResponse(response);
      return response;
    } catch (error) {
      console.error('[usePersona] sendMessage failed:', error);
      const fallback = engine.generateResponse();
      setCurrentResponse(fallback);
      showToast('Error de conversación con LLM, usando fallback local', 'error');
      return fallback;
    } finally {
      setIsGenerating(false);
    }
  };

  const setMode = (mode: 'jarvis' | 'cortana') => {
    const engine = personaRef.current || getPersonaEngine();
    engine.setMode(mode);
  };

  const getMode = () => {
    return currentResponse?.mode || 'jarvis';
  };

  const getChatHistory = () => {
    const engine = personaRef.current || getPersonaEngine();
    return engine.getChatHistory();
  };

  return {
    persona,
    currentResponse,
    isGenerating,
    generateResponse,
    sendMessage,
    setMode,
    getMode,
    getChatHistory,
  };
}
