/**
 * useOmnibar Hook
 * 
 * Global state management for the Omnibar component
 * Handles:
 * - Opening/closing the omnibar
 * - Managing search state
 * - Keyboard shortcuts (Ctrl+K)
 * - Modal visibility
 */

import { useCallback, useEffect, useSyncExternalStore } from 'react';

interface UseOmnibarReturn {
  isOpen: boolean;
  prompt: string;
  requestVoice: boolean;
  openOmnibar: () => void;
  openOmnibarWithPrompt: (prompt: string, requestVoice?: boolean) => void;
  closeOmnibar: () => void;
  toggleOmnibar: () => void;
  clearPrompt: () => void;
}

/**
 * useOmnibar Hook
 * Manages global Omnibar state with keyboard shortcuts
 */
export function useOmnibar(): UseOmnibarReturn {
  const snapshot = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const isOpen = snapshot.isOpen;

  /**
   * Open Omnibar
   */
  const openOmnibar = useCallback(() => {
    setGlobalState({ ...globalState, isOpen: true, requestVoice: false });
  }, []);

  const openOmnibarWithPrompt = useCallback((prompt: string, requestVoice = false) => {
    setGlobalState({
      ...globalState,
      isOpen: true,
      prompt: String(prompt || ''),
      requestVoice
    });
  }, []);

  /**
   * Close Omnibar
   */
  const closeOmnibar = useCallback(() => {
    setGlobalState({ ...globalState, isOpen: false, requestVoice: false });
  }, []);

  /**
   * Toggle Omnibar
   */
  const toggleOmnibar = useCallback(() => {
    setGlobalState({ ...globalState, isOpen: !globalState.isOpen, requestVoice: false });
  }, []);

  const clearPrompt = useCallback(() => {
    if (!globalState.prompt && !globalState.requestVoice) return;
    setGlobalState({ ...globalState, prompt: '', requestVoice: false });
  }, []);

  /**
   * Handle Ctrl+K / Cmd+K shortcut
   */
  useEffect(() => {
    keyboardSubscribers += 1;
    if (keyboardSubscribers === 1) {
      window.addEventListener('keydown', globalKeydownHandler);
    }

    return () => {
      keyboardSubscribers -= 1;
      if (keyboardSubscribers <= 0) {
        keyboardSubscribers = 0;
        window.removeEventListener('keydown', globalKeydownHandler);
      }
    };
  }, []);

  return {
    isOpen,
    prompt: snapshot.prompt,
    requestVoice: snapshot.requestVoice,
    openOmnibar,
    openOmnibarWithPrompt,
    closeOmnibar,
    toggleOmnibar,
    clearPrompt
  };
}

export default useOmnibar;

let globalState = {
  isOpen: false,
  prompt: '',
  requestVoice: false
};
let keyboardSubscribers = 0;
const listeners = new Set<() => void>();

function emitChange() {
  listeners.forEach((listener) => listener());
}

function getSnapshot() {
  return globalState;
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function setGlobalState(nextState: { isOpen: boolean; prompt: string; requestVoice: boolean }) {
  const unchanged =
    globalState.isOpen === nextState.isOpen &&
    globalState.prompt === nextState.prompt &&
    globalState.requestVoice === nextState.requestVoice;
  if (unchanged) return;
  globalState = nextState;
  emitChange();
}

export function openOmnibarExternally(prompt = '', requestVoice = false) {
  setGlobalState({
    ...globalState,
    isOpen: true,
    prompt: String(prompt || ''),
    requestVoice
  });
}

function globalKeydownHandler(event: KeyboardEvent) {
  const isCmdK = (event.ctrlKey || event.metaKey) && event.key.toLowerCase() === 'k';

  if (isCmdK) {
    event.preventDefault();
    setGlobalState({ ...globalState, isOpen: !globalState.isOpen, requestVoice: false });
    return;
  }

  if (event.key === 'Escape' && globalState.isOpen) {
    setGlobalState({ ...globalState, isOpen: false, requestVoice: false });
  }
}
