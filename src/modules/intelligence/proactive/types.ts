import type { CanvasArtifact, ReduxAction } from '../types';

export type InsightSeverity = 'low' | 'medium' | 'high';
export type InsightHub = 'WorkHub' | 'PersonalHub' | 'FinanceHub';

export interface DynamicInsight {
  id: string;
  hub: InsightHub;
  severity: InsightSeverity;
  title: string;
  description: string;
  suggestedPrompt: string;
  skillId?: string;
  artifact?: CanvasArtifact;
  action?: ReduxAction;
  toastMessage?: string;
}

export interface ProactiveAnalysisResult {
  generatedAt: number;
  insights: DynamicInsight[];
}
