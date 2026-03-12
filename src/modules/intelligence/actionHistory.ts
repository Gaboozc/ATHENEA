import React from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { store } from '../../../store/index';
import { clearActionHistory } from '../../store/slices/aiMemorySlice';

export interface ActionHistoryEntry {
  id: string;
  timestamp: string;
  type: 'user-command' | 'proactive-insight' | 'voice-command';
  hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub' | 'CrossHub';
  actionType: string;
  description: string;
  reduxActionType?: string;
  payload?: Record<string, any>;
  success: boolean;
}

const ACTION_HISTORY_RECORD = 'actionHistory/record';

class ActionHistoryStore {
  private listeners: (() => void)[] = [];
  private unsubscribeStore: (() => void) | null = null;

  constructor() {
    this.unsubscribeStore = store.subscribe(() => {
      this.notifyListeners();
    });
  }

  recordAction(entry: Omit<ActionHistoryEntry, 'id' | 'timestamp'>): void {
    store.dispatch({
      type: ACTION_HISTORY_RECORD,
      payload: entry,
    });
  }

  getHistory(): ActionHistoryEntry[] {
    const state = store.getState() as any;
    return [...(state?.aiMemory?.actionHistory || [])];
  }

  getRecentHistory(count: number = 5): ActionHistoryEntry[] {
    return this.getHistory().slice(0, count);
  }

  getHistoryByHub(hub: ActionHistoryEntry['hub']): ActionHistoryEntry[] {
    return this.getHistory().filter((entry) => entry.hub === hub);
  }

  getHistoryByType(type: ActionHistoryEntry['type']): ActionHistoryEntry[] {
    return this.getHistory().filter((entry) => entry.type === type);
  }

  getSuccessfulHistory(): ActionHistoryEntry[] {
    return this.getHistory().filter((entry) => entry.success);
  }

  clearHistory(): void {
    store.dispatch(clearActionHistory());
  }

  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((current) => current !== listener);
    };
  }

  private notifyListeners() {
    this.listeners.forEach((listener) => listener());
  }
}

export const actionHistoryStore = new ActionHistoryStore();

export function useActionHistory() {
  const dispatch = useDispatch();
  const history = useSelector((state: any) => state.aiMemory?.actionHistory || []);

  const clear = React.useCallback(() => {
    dispatch(clearActionHistory());
  }, [dispatch]);

  return {
    history,
    recentHistory: history.slice(0, 5),
    recordAction: (entry: Omit<ActionHistoryEntry, 'id' | 'timestamp'>) =>
      actionHistoryStore.recordAction(entry),
    clearHistory: clear,
    getHistoryByHub: (hub: ActionHistoryEntry['hub']) =>
      history.filter((entry: ActionHistoryEntry) => entry.hub === hub),
    getHistoryByType: (type: ActionHistoryEntry['type']) =>
      history.filter((entry: ActionHistoryEntry) => entry.type === type),
  };
}
