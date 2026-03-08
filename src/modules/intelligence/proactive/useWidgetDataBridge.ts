import { useEffect, useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useProactiveInsights } from './useProactiveInsights';
import { pushWidgetState } from '../../../services/widgetBridge';

function computePulseStatus(insights: Array<{ severity: string }>): string {
  const high = insights.filter((insight) => insight.severity === 'high').length;
  if (high >= 3) return 'Critical pulse';
  if (high >= 1) return 'Attention needed';
  return 'Stable';
}

export function useWidgetDataBridge(enabled = true): void {
  const { insights } = useProactiveInsights();
  const calendarEvents = useSelector((state: any) => state?.calendar?.events || []);
  const tasks = useSelector((state: any) => state?.tasks?.tasks || []);

  const payload = useMemo(() => {
    const highInsight = insights.find((insight) => insight.severity === 'high') || insights[0];

    const nextExternalEvent = [...calendarEvents]
      .filter((event: any) => event?.provider === 'google' && event?.startDate)
      .sort((a: any, b: any) => new Date(a.startDate).getTime() - new Date(b.startDate).getTime())[0];

    const pendingTask = tasks.find((task: any) => String(task?.status || '').toLowerCase() !== 'completed');

    return {
      generatedAt: Date.now(),
      pulseStatus: computePulseStatus(insights as any),
      topInsightTitle: highInsight?.title || 'No urgent insights',
      topInsightPrompt: highInsight?.suggestedPrompt || 'Open ATHENEA Omnibar',
      nextEventTitle: nextExternalEvent?.title || 'No upcoming calendar events',
      nextEventAt: nextExternalEvent?.startDate || '',
      checkTaskId: pendingTask?.id || ''
    };
  }, [calendarEvents, insights, tasks]);

  useEffect(() => {
    if (!enabled) return;

    const hasHigh = insights.some((insight) => insight.severity === 'high');
    if (!hasHigh && !payload.nextEventAt) return;

    pushWidgetState(payload);
  }, [enabled, insights, payload]);
}

export default useWidgetDataBridge;
