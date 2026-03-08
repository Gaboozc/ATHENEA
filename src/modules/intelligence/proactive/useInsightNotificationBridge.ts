import { useEffect, useRef } from 'react';
import { showToast } from '../../../components/Toast';
import { useProactiveInsights } from './useProactiveInsights';

const DEFAULT_COOLDOWN_MS = 120000;

export function useInsightNotificationBridge(enabled = true): void {
  const { insights } = useProactiveInsights();
  const seenInsightsRef = useRef<Record<string, number>>({});

  useEffect(() => {
    if (!enabled) return;

    const now = Date.now();

    insights.forEach((insight) => {
      if (insight.severity === 'low') return;

      const lastSeenAt = seenInsightsRef.current[insight.id] || 0;
      if (now - lastSeenAt < DEFAULT_COOLDOWN_MS) return;

      const message = insight.toastMessage || 'Hey, detecte algo relevante. Te deje una sugerencia en Omnibar.';
      showToast(message, 'info', 4200, '👀');
      seenInsightsRef.current[insight.id] = now;
    });
  }, [enabled, insights]);
}

export default useInsightNotificationBridge;
