import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { analyzeStoreForInsights } from './observer';
import { useGhostWriteSuggestions } from '../ghostWrite';
import type { DynamicInsight, InsightHub } from './types';

export interface UseProactiveInsightsResult {
  insights: DynamicInsight[];
  insightsByHub: Record<InsightHub, DynamicInsight[]>;
}

export function useProactiveInsights(): UseProactiveInsightsResult {
  const storeState = useSelector((state: any) => state);
  const ghostWrite = useGhostWriteSuggestions();

  return useMemo(() => {
    const { insights } = analyzeStoreForInsights(storeState);

    return {
      insights,
      insightsByHub: {
        WorkHub: insights.filter((insight) => insight.hub === 'WorkHub'),
        PersonalHub: insights.filter((insight) => insight.hub === 'PersonalHub'),
        FinanceHub: insights.filter((insight) => insight.hub === 'FinanceHub')
      }
    };
  }, [storeState, ghostWrite.hasDraft, ghostWrite.suggestedTags.join('|'), ghostWrite.draft.noteId, ghostWrite.draft.content, ghostWrite.draft.title]);
}

export default useProactiveInsights;
