/**
 * ATHENEA Action History Tracker
 * 
 * Records all actions executed by the Intelligence Engine
 * - Tracks user-initiated actions
 * - Tracks proactive insight executions
 * - Provides chronological history
 * - Allows filtering by hub and action type
 * 
 * Uses a simple in-memory store with localStorage persistence
 */

export interface ActionHistoryEntry {
  id: string;
  timestamp: string;
  type: 'user-command' | 'proactive-insight' | 'voice-command';
  hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub' | 'CrossHub';
  actionType: string; // Redux action type or skill name
  description: string; // Human-readable description
  reduxActionType?: string;
  payload?: Record<string, any>;
  success: boolean;
}

const STORAGE_KEY = 'athenea_action_history';
const MAX_HISTORY_SIZE = 100; // Keep last 100 actions

class ActionHistoryStore {
  private history: ActionHistoryEntry[] = [];
  private listeners: (() => void)[] = [];

  constructor() {
    this.loadFromStorage();
  }

  /**
   * Load history from localStorage
   */
  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        this.history = JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to load action history from storage:', error);
      this.history = [];
    }
  }

  /**
   * Save history to localStorage
   */
  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.history));
    } catch (error) {
      console.warn('Failed to save action history to storage:', error);
    }
  }

  /**
   * Record a new action
   */
  recordAction(entry: Omit<ActionHistoryEntry, 'id' | 'timestamp'>): void {
    const newEntry: ActionHistoryEntry = {
      ...entry,
      id: `action_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString()
    };

    // Add to beginning (most recent first)
    this.history.unshift(newEntry);

    // Trim to max size
    if (this.history.length > MAX_HISTORY_SIZE) {
      this.history = this.history.slice(0, MAX_HISTORY_SIZE);
    }

    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Get all history entries
   */
  getHistory(): ActionHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Get recent history (last N entries)
   */
  getRecentHistory(count: number = 5): ActionHistoryEntry[] {
    return this.history.slice(0, count);
  }

  /**
   * Get history filtered by hub
   */
  getHistoryByHub(hub: ActionHistoryEntry['hub']): ActionHistoryEntry[] {
    return this.history.filter(entry => entry.hub === hub);
  }

  /**
   * Get history filtered by type
   */
  getHistoryByType(type: ActionHistoryEntry['type']): ActionHistoryEntry[] {
    return this.history.filter(entry => entry.type === type);
  }

  /**
   * Get successful actions only
   */
  getSuccessfulHistory(): ActionHistoryEntry[] {
    return this.history.filter(entry => entry.success);
  }

  /**
   * Clear all history
   */
  clearHistory(): void {
    this.history = [];
    this.saveToStorage();
    this.notifyListeners();
  }

  /**
   * Subscribe to changes
   */
  subscribe(listener: () => void): () => void {
    this.listeners.push(listener);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  /**
   * Notify all subscribers
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener());
  }
}

// Singleton instance
export const actionHistoryStore = new ActionHistoryStore();

/**
 * React hook to use action history
 */
export function useActionHistory() {
  const [history, setHistory] = React.useState<ActionHistoryEntry[]>(
    actionHistoryStore.getHistory()
  );

  React.useEffect(() => {
    const unsubscribe = actionHistoryStore.subscribe(() => {
      setHistory(actionHistoryStore.getHistory());
    });

    return unsubscribe;
  }, []);

  return {
    history,
    recentHistory: actionHistoryStore.getRecentHistory(5),
    recordAction: (entry: Omit<ActionHistoryEntry, 'id' | 'timestamp'>) =>
      actionHistoryStore.recordAction(entry),
    clearHistory: () => actionHistoryStore.clearHistory(),
    getHistoryByHub: (hub: ActionHistoryEntry['hub']) =>
      actionHistoryStore.getHistoryByHub(hub),
    getHistoryByType: (type: ActionHistoryEntry['type']) =>
      actionHistoryStore.getHistoryByType(type)
  };
}

// React import for hook
import React from 'react';
