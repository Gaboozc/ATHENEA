/**
 * useAppWidgetSync
 *
 * Reads all relevant Redux slices and proactive insights, builds the full
 * WidgetData payload, and pushes it to all 9 native Android widgets via
 * useWidgetSync (AtheneaWidgetPlugin).
 *
 * Also handles widget-initiated actions (routine toggles, omnibar opens,
 * task completions) by dispatching back to Redux.
 *
 * Drop this in Layout.jsx — it no-ops automatically in web/non-Android.
 */

import { useCallback, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useWidgetSync, buildWidgetData, type WidgetPendingAction } from './useWidgetSync';
import { useProactiveInsights } from '../modules/intelligence';
import { toggleRoutineToday } from '../../store/slices/routinesSlice';
import { addNotification } from '../store/slices/notificationsSlice';
import { openOmnibarExternally } from '../components/Omnibar/useOmnibar';

export function useAppWidgetSync(): void {
  const dispatch = useDispatch();

  // ── Selectors ──────────────────────────────────────────────────────────────
  const tasks          = useSelector((s: any) => s.tasks?.tasks || []);
  const focusState     = useSelector((s: any) => s.focus || {});
  const walletMXN      = useSelector((s: any) => s.wallets?.walletMXN ?? 0);
  const walletTxns     = useSelector((s: any) => s.wallets?.transactions || []);
  const calendarEvents = useSelector((s: any) => s.calendar?.events || []);
  const routines       = useSelector((s: any) => s.routines?.routines || []);
  const { insights }   = useProactiveInsights();

  // ── Build WidgetData (re-computes only when deps change) ───────────────────
  const widgetData = useMemo(() => {
    const todayStr   = new Date().toISOString().split('T')[0];
    const todayIndex = new Date().getDay();

    // Tasks
    const pendingTasks  = tasks.filter((t: any) => t.status !== 'Completed' && t.status !== 'deleted');
    const criticalTasks = tasks.filter((t: any) =>
      t.level === 'tactical' && t.status !== 'Completed' && t.status !== 'deleted');

    // Focus
    const isRunning       = !!focusState.currentSession;
    const todaySessions   = (focusState.sessions || []).filter((s: any) =>
      s.completedAt?.startsWith(todayStr));
    const focusMinutes    = todaySessions.reduce((n: number, s: any) => n + (s.durationMinutes || 0), 0);
    const focusStreak     = todaySessions.length;
    const currentTaskObj  = tasks.find((t: any) => t.id === focusState.currentTaskId);
    const currentTaskName = currentTaskObj?.title || '';

    // Finance — last MXN or USD expense
    const lastTxn = walletTxns.find((t: any) => t.type === 'expense_mxn' || t.type === 'expense_usd') || null;

    // Calendar — today's events (max 4)
    const todayEvents = calendarEvents
      .filter((e: any) => e.startDate?.startsWith(todayStr))
      .slice(0, 4)
      .map((e: any) => ({ id: e.id, title: e.title || '', time: e.startDate || '', hub: e.hub }));

    // Routines — today's (max 3)
    const todayRoutines = routines
      .filter((r: any) => (r.daysOfWeek || []).includes(todayIndex))
      .slice(0, 3)
      .map((r: any) => ({
        id: r.id,
        name: r.title,
        done: (r.completedDates || []).includes(todayStr),
      }));

    // Insights + health score
    const highInsight  = insights.find((i: any) => i.severity === 'high') || insights[0] || null;
    const highCount    = insights.filter((i: any) => i.severity === 'high').length;
    const medCount     = insights.filter((i: any) => i.severity === 'medium').length;
    const healthScore  = Math.max(0, Math.min(100, 100 - highCount * 20 - medCount * 8));

    return buildWidgetData({
      tasks: { pending: pendingTasks, critical: criticalTasks },
      focus: {
        active:      isRunning,
        minutesToday: focusMinutes,
        streak:      focusStreak,
        currentTask: currentTaskName,
      },
      finance: {
        balance: walletMXN,
        lastExpense: lastTxn ? {
          amount:   lastTxn.amountMXN || lastTxn.amountUSD || 0,
          note:     lastTxn.description || '',
          category: lastTxn.category || '',
        } : null,
      },
      events: todayEvents,
      insights: highInsight ? {
        latest: {
          title:     highInsight.title || '',
          severity:  (highInsight.severity || 'info') as 'high' | 'medium' | 'low' | 'info',
          timestamp: highInsight.createdAt || new Date().toISOString(),
        },
      } : undefined,
      routines: todayRoutines,
      health: { score: healthScore },
    });
  }, [tasks, focusState, walletMXN, walletTxns, calendarEvents, routines, insights]);

  // ── Handle actions fired from widgets ─────────────────────────────────────
  const onAction = useCallback((action: WidgetPendingAction) => {
    switch (action.type) {
      case 'toggle_routine':
        dispatch(toggleRoutineToday({ id: action.routineId }));
        dispatch(addNotification({
          id: `widget-routine-${action.routineId}-${Date.now()}`,
          title: 'Rutina completada',
          body: 'Marcada como hecha desde el widget.',
          urgency: 'low',
          source: 'widget',
          timestamp: Date.now(),
        }));
        break;
      case 'open_omnibar':
        openOmnibarExternally(action.prompt || '', false);
        break;
      case 'open_voice':
        openOmnibarExternally(action.prompt || '', true);
        break;
      case 'complete_task': {
        const taskObj = (action as any)._task;
        dispatch({ type: 'tasks/complete', payload: { id: action.taskId } });
        dispatch(addNotification({
          id: `widget-task-${action.taskId}-${Date.now()}`,
          title: 'Tarea completada',
          body: taskObj?.title ? `"${taskObj.title}" marcada desde el widget.` : 'Completada desde el widget.',
          urgency: 'low',
          source: 'widget',
          timestamp: Date.now(),
        }));
        break;
      }
    }
  }, [dispatch]);

  useWidgetSync({ data: widgetData, onAction });
}
