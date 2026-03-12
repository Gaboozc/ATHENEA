/**
 * ATHENEA Context-Aware Suggestions Engine
 * 
 * Provides intelligent command suggestions based on:
 * - Current Hub (Work/Personal/Finance)
 * - Time of day
 * - Recent actions
 * - User patterns
 * - Current app state (tasks pending, low balance, etc.)
 */

import type { SkillManifest } from '../types';
import { getSkillsByHub, allSkills } from '../skills';

export interface SuggestionContext {
  currentHub: 'WorkHub' | 'PersonalHub' | 'FinanceHub';
  timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  dayOfWeek: number; // 0-6
  recentActions: string[]; // Recent skill IDs
  appState: AppState;
}

export interface AppState {
  tasksPending: number;
  projectsActive: number;
  upcomingEvents: number;
  balance: number;
  recentExpenses: number;
  notesCount: number;
}

export interface CommandSuggestion {
  skill: SkillManifest;
  reason: string;
  priority: number;
}

/**
 * Context-Aware Suggestions Engine
 */
export class SuggestionsEngine {
  /**
   * Get contextual command suggestions
   * Returns top-N most relevant skills for current context
   */
  getSuggestions(
    context: SuggestionContext,
    maxSuggestions: number = 5
  ): CommandSuggestion[] {
    const suggestions: CommandSuggestion[] = [];
    
    // Get skills for current hub
    const hubSkills = getSkillsByHub(context.currentHub);
    
    for (const skill of hubSkills) {
      const priority = this.calculatePriority(skill, context);
      const reason = this.generateReason(skill, context);
      
      if (priority > 0) {
        suggestions.push({ skill, reason, priority });
      }
    }
    
    // Sort by priority (descending) and return top-N
    return suggestions
      .sort((a, b) => b.priority - a.priority)
      .slice(0, maxSuggestions);
  }

  /**
   * Calculate priority score for a skill given current context
   */
  private calculatePriority(
    skill: SkillManifest,
    context: SuggestionContext
  ): number {
    let priority = 50; // Base priority
    
    // Time-based boosting
    priority += this.getTimeBoost(skill, context.timeOfDay);
    
    // Day-based boosting
    priority += this.getDayBoost(skill, context.dayOfWeek);
    
    // State-based boosting
    priority += this.getStateBoost(skill, context.appState);
    
    // Recent actions penalty (avoid suggesting just-used skills)
    if (context.recentActions.includes(skill.id)) {
      priority -= 20;
    }
    
    // Hub match bonus
    if (skill.hub === context.currentHub) {
      priority += 10;
    }
    
    return Math.max(0, priority);
  }

  /**
   * Time-of-day boosting
   */
  private getTimeBoost(
    skill: SkillManifest,
    timeOfDay: SuggestionContext['timeOfDay']
  ): number {
    const timeRules: Record<string, string[]> = {
      morning: ['sync_calendar', 'add_task', 'review_tasks'],
      afternoon: ['log_time', 'record_expense', 'add_contact'],
      evening: ['create_note', 'review_day', 'add_task'],
      night: ['create_note', 'add_event', 'plan_tomorrow']
    };
    
    const relevantSkills = timeRules[timeOfDay] || [];
    return relevantSkills.includes(skill.id) ? 15 : 0;
  }

  /**
   * Day-of-week boosting
   */
  private getDayBoost(
    skill: SkillManifest,
    dayOfWeek: number
  ): number {
    // Monday: Planning
    if (dayOfWeek === 1 && ['create_project', 'add_task', 'sync_calendar'].includes(skill.id)) {
      return 10;
    }
    
    // Friday: Review & Planning
    if (dayOfWeek === 5 && ['log_time', 'review_tasks', 'create_note'].includes(skill.id)) {
      return 10;
    }
    
    // Weekend: Personal
    if ((dayOfWeek === 0 || dayOfWeek === 6) && skill.hub === 'PersonalHub') {
      return 15;
    }
    
    // Weekday: Work
    if (dayOfWeek >= 1 && dayOfWeek <= 5 && skill.hub === 'WorkHub') {
      return 5;
    }
    
    return 0;
  }

  /**
   * App state boosting
   */
  private getStateBoost(
    skill: SkillManifest,
    state: AppState
  ): number {
    let boost = 0;
    
    // Financial urgency
    if (state.balance < 100 && skill.id === 'record_income') {
      boost += 30;
    }
    
    if (state.recentExpenses > 5 && skill.id === 'review_expenses') {
      boost += 20;
    }
    
    // Task management
    if (state.tasksPending > 10 && skill.id === 'review_tasks') {
      boost += 25;
    }
    
    if (state.projectsActive > 0 && skill.id === 'log_time') {
      boost += 10;
    }
    
    // Events
    if (state.upcomingEvents > 0 && skill.id === 'sync_calendar') {
      boost += 15;
    }
    
    // Notes
    if (state.notesCount === 0 && skill.id === 'create_note') {
      boost += 10;
    }
    
    return boost;
  }

  /**
   * Generate human-readable reason for suggestion
   */
  private generateReason(
    skill: SkillManifest,
    context: SuggestionContext
  ): string {
    // Time-based reasons
    if (context.timeOfDay === 'morning' && skill.id === 'sync_calendar') {
      return 'Start your day organized';
    }
    
    if (context.timeOfDay === 'evening' && skill.id === 'create_note') {
      return 'Capture thoughts before EOD';
    }
    
    // State-based reasons
    if (context.appState.tasksPending > 10 && skill.id === 'review_tasks') {
      return `You have ${context.appState.tasksPending} pending tasks`;
    }
    
    if (context.appState.balance < 100 && skill.id === 'record_income') {
      return 'Low balance detected';
    }
    
    if (context.appState.recentExpenses > 5 && skill.id === 'review_expenses') {
      return `${context.appState.recentExpenses} recent expenses to review`;
    }
    
    // Hub-based reasons
    if (skill.hub === context.currentHub) {
      return `Popular in ${context.currentHub}`;
    }
    
    // Default
    return skill.description;
  }

  /**
   * Build suggestion context from current app state
   */
  buildContext(
    currentHub: 'WorkHub' | 'PersonalHub' | 'FinanceHub',
    reduxState: any,
    recentActions: string[]
  ): SuggestionContext {
    const now = new Date();
    const hour = now.getHours();
    
    // Determine time of day
    let timeOfDay: SuggestionContext['timeOfDay'];
    if (hour >= 5 && hour < 12) {
      timeOfDay = 'morning';
    } else if (hour >= 12 && hour < 17) {
      timeOfDay = 'afternoon';
    } else if (hour >= 17 && hour < 21) {
      timeOfDay = 'evening';
    } else {
      timeOfDay = 'night';
    }
    
    // Build app state
    const appState: AppState = {
      tasksPending: reduxState.tasks?.tasks?.filter((t: any) => !t.completed)?.length || 0,
      projectsActive: reduxState.projects?.projects?.filter((p: any) => p.status === 'active')?.length || 0,
      upcomingEvents: reduxState.calendar?.events?.filter((e: any) => new Date(e.startTime) > now)?.length || 0,
      balance: reduxState.finance?.balance || 0,
      recentExpenses: reduxState.finance?.recentPayments?.length || 0,
      notesCount: reduxState.notes?.notes?.length || 0
    };
    
    return {
      currentHub,
      timeOfDay,
      dayOfWeek: now.getDay(),
      recentActions,
      appState
    };
  }
}

/**
 * Singleton instance
 */
export const suggestionsEngine = new SuggestionsEngine();
