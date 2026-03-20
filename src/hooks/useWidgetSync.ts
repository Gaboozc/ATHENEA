/**
 * useWidgetSync
 *
 * Subscribes to changes in the Redux store (or any data source passed as deps),
 * serializes the relevant widget data, and pushes it to the native Android
 * widgets via the AtheneaWidgetPlugin Capacitor plugin.
 *
 * Also polls for pending widget actions (e.g. routine toggles from the
 * Habit Tracker widget) and dispatches them back to Redux.
 *
 * Usage — drop this hook in your root component or App.jsx:
 *
 *   import { useWidgetSync } from './hooks/useWidgetSync';
 *   function App() {
 *     useWidgetSync();
 *     ...
 *   }
 */

import { useEffect, useRef, useCallback } from 'react';
import { registerPlugin } from '@capacitor/core';

// ---- Plugin registration ----
interface AtheneaWidgetPlugin {
  updateWidgetData(options: { payload: string }): Promise<{ ok: boolean }>;
  consumePendingAction(): Promise<{ action: string | null }>;
  refreshWidgets(): Promise<{ ok: boolean }>;
}

const AtheneaWidget = registerPlugin<AtheneaWidgetPlugin>('AtheneaWidget');

// ---- Types ----
export interface WidgetData {
  tasks_pending: number;
  tasks_critical: number;
  focus_active: boolean;
  focus_minutes_today: number;
  focus_streak: number;
  focus_current_task: string;
  finance_balance: number;
  finance_budget: number;
  finance_spent: number;
  finance_last_expense: {
    amount: number;
    note: string;
    category: string;
  } | null;
  today_events: Array<{
    id: string;
    title: string;
    time: string;
    hub?: string;
  }>;
  latest_insight: {
    title: string;
    severity: 'high' | 'medium' | 'low' | 'info';
    timestamp: string;
  } | null;
  routines_today: Array<{
    id: string;
    name: string;
    done: boolean;
  }>;
  system_health: number;
  expense_categories: Array<{
    id: string;
    name: string;
    icon: string;
  }>;
}

export type WidgetPendingAction =
  | { type: 'toggle_routine'; routineId: string; done: boolean }
  | { type: 'open_omnibar'; prompt?: string }
  | { type: 'open_voice'; prompt?: string }
  | { type: 'complete_task'; taskId: string };

// ---- Helper: is this a Capacitor Android environment? ----
function isAndroidCapacitor(): boolean {
  return (
    typeof window !== 'undefined' &&
    !!(window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor &&
    (window as Window & { Capacitor?: { getPlatform?: () => string } }).Capacitor!.getPlatform?.() === 'android'
  );
}

// ---- Main hook ----
interface UseWidgetSyncOptions {
  /** Reactive data to serialize and push to widgets. Re-syncs whenever this changes. */
  data: WidgetData;
  /** Called when the widget fires a pending action (e.g. routine toggle). */
  onAction?: (action: WidgetPendingAction) => void;
  /** How often (ms) to poll for pending widget actions. Default: 3000ms */
  pollIntervalMs?: number;
  /** Debounce delay (ms) before sending data after a change. Default: 500ms */
  debounceMs?: number;
}

export function useWidgetSync({
  data,
  onAction,
  pollIntervalMs = 3000,
  debounceMs = 500,
}: UseWidgetSyncOptions): void {
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const onActionRef = useRef(onAction);
  onActionRef.current = onAction;

  // Push data to native widgets (debounced)
  const syncData = useCallback(
    (widgetData: WidgetData) => {
      if (!isAndroidCapacitor()) return;
      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = setTimeout(() => {
        AtheneaWidget.updateWidgetData({ payload: JSON.stringify(widgetData) }).catch(
          (err: unknown) => console.warn('[useWidgetSync] updateWidgetData error', err)
        );
      }, debounceMs);
    },
    [debounceMs]
  );

  // Sync whenever data changes
  useEffect(() => {
    syncData(data);
  }, [data, syncData]);

  // Poll for pending actions
  useEffect(() => {
    if (!isAndroidCapacitor()) return;

    const poll = async () => {
      try {
        const result = await AtheneaWidget.consumePendingAction();
        if (result.action) {
          const parsed = JSON.parse(result.action) as WidgetPendingAction;
          onActionRef.current?.(parsed);
        }
      } catch (err) {
        // Silently ignore — plugin may not be loaded in dev
      }
    };

    // Run once immediately on mount
    poll();
    const intervalId = setInterval(poll, pollIntervalMs);

    return () => {
      clearInterval(intervalId);
      if (debounceRef.current) clearTimeout(debounceRef.current);
    };
  }, [pollIntervalMs]);
}

// ---- Convenience: build WidgetData from raw app state ----
/**
 * buildWidgetData
 *
 * Maps your app's state slices to the WidgetData shape.
 * Adjust the field paths to match your actual Redux selectors.
 *
 * Example usage in a component:
 *   const widgetData = buildWidgetData({ tasks, finance, focus, routines, events, insights, health });
 *   useWidgetSync({ data: widgetData, onAction: handleWidgetAction });
 */
export function buildWidgetData(params: {
  tasks?: { pending?: unknown[]; critical?: unknown[] };
  focus?: {
    active?: boolean;
    minutesToday?: number;
    streak?: number;
    currentTask?: string;
  };
  finance?: {
    balance?: number;
    budget?: number;
    spent?: number;
    lastExpense?: { amount: number; note: string; category: string } | null;
    categories?: Array<{ id: string; name: string; icon: string }>;
  };
  events?: Array<{ id: string; title: string; time: string; hub?: string }>;
  insights?: { latest?: { title: string; severity: 'high' | 'medium' | 'low' | 'info'; timestamp: string } | null };
  routines?: Array<{ id: string; name: string; done: boolean }>;
  health?: { score?: number };
}): WidgetData {
  const { tasks = {}, focus = {}, finance = {}, events = [], insights = {}, routines = [], health = {} } = params;

  return {
    tasks_pending: tasks.pending?.length ?? 0,
    tasks_critical: tasks.critical?.length ?? 0,
    focus_active: focus.active ?? false,
    focus_minutes_today: focus.minutesToday ?? 0,
    focus_streak: focus.streak ?? 0,
    focus_current_task: focus.currentTask ?? 'Sin tarea activa',
    finance_balance: finance.balance ?? 0,
    finance_budget: finance.budget ?? 0,
    finance_spent: finance.spent ?? 0,
    finance_last_expense: finance.lastExpense ?? null,
    today_events: events,
    latest_insight: insights.latest ?? null,
    routines_today: routines,
    system_health: health.score ?? 0,
    expense_categories: finance.categories ?? [
      { id: '1', name: 'Comida', icon: '🍔' },
      { id: '2', name: 'Transporte', icon: '🚗' },
      { id: '3', name: 'Salud', icon: '💊' },
      { id: '4', name: 'Ocio', icon: '🎮' },
    ],
  };
}
