/**
 * ATHENEA OpenClaw Adapter
 * 
 * Core bridge that transforms OpenClaw NLU responses into Redux-compatible actions.
 * This adapter is the SINGLE SOURCE OF TRUTH for action mapping, eliminating the
 * critical mismatch between skills.ts and Redux reducers.
 * 
 * Architecture:
 * 1. Receives skill ID + parsed parameters from Bridge
 * 2. Applies strict declarative mapping to actual Redux action types
 * 3. Transforms payloads (dates, amounts, categories) for Redux consistency
 * 4. Returns a validated, ready-to-dispatch Redux action
 * 
 * Critical Fix:
 * - projects/create → projects/addProject
 * - tasks/add → tasks/addTask
 * - notes/create → notes/addNote
 * - todos/add → todos/addTodo
 * - reminders/set → tasks/addTask (with isReminder: true)
 * - payments/* → payments/* (correct mapping)
 */

import { ReduxAction } from '../types';
import { resolveSmartDate, SmartResolverContext } from '../utils/smartResolver';

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface OpenClawResponse {
  skillId: string;
  parameters: Record<string, any>;
  confidence: number;
  context: SmartResolverContext;
}

export interface AdapterResult {
  success: boolean;
  action?: ReduxAction;
  error?: string;
  validationErrors?: string[];
}

// ============================================================================
// CORE ADAPTER CLASS
// ============================================================================

export class OpenClawAdapter {
  /**
   * Transform OpenClaw response to Redux action
   * This is the ONLY place where action type mapping should happen
   */
  adapt(response: OpenClawResponse): AdapterResult {
    try {
      // Select appropriate mapper based on skill ID
      const mapper = this.getMapper(response.skillId);
      
      if (!mapper) {
        return {
          success: false,
          error: `No mapper found for skill: ${response.skillId}`
        };
      }

      // Execute mapper with parameter transformation
      const action = mapper(response.parameters, response.context);

      // Validate that action type exists in Redux
      if (!this.isValidActionType(action.type)) {
        return {
          success: false,
          error: `Action type '${action.type}' does not exist in Redux store`,
          validationErrors: [`Unknown action: ${action.type}`]
        };
      }

      return {
        success: true,
        action
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown adapter error'
      };
    }
  }

  /**
   * Get mapper function for a specific skill
   */
  private getMapper(skillId: string): ((params: any, ctx: SmartResolverContext) => ReduxAction) | null {
    const mappers: Record<string, (params: any, ctx: SmartResolverContext) => ReduxAction> = {
      // ========== WORK HUB ==========
      'create_project': this.mapCreateProject.bind(this),
      'add_task': this.mapAddTask.bind(this),
      'log_time': this.mapLogTime.bind(this),

      // ========== PERSONAL HUB ==========
      'create_note': this.mapCreateNote.bind(this),
      'add_reminder': this.mapAddReminder.bind(this),
      'add_todo': this.mapAddTodo.bind(this),

      // ========== FINANCE HUB ==========
      'add_expense': this.mapAddExpense.bind(this),
      'add_income': this.mapAddIncome.bind(this),
      'set_budget': this.mapSetBudget.bind(this),
      'pay_debt': this.mapPayDebt.bind(this),

      // ========== GLOBAL ==========
      'search': this.mapSearch.bind(this),
      'create_event': this.mapCreateEvent.bind(this)
    };

    return mappers[skillId] || null;
  }

  // ============================================================================
  // WORK HUB MAPPERS
  // ============================================================================

  private mapCreateProject(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'projects/addProject', // CORRECTED: was 'projects/create'
      payload: {
        title: params.title,
        description: params.description || '',
        dueDate: this.transformDate(params.dueDate, ctx),
        priority: params.priority || 'medium',
        status: 'active',
        createdAt: new Date().toISOString()
      }
    };
  }

  private mapAddTask(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'tasks/addTask', // CORRECTED: was 'tasks/add'
      payload: {
        title: params.title,
        projectId: params.projectId || null,
        priority: params.priority || 'medium',
        dueDate: this.transformDate(params.dueDate, ctx),
        estimatedHours: params.estimatedHours || null,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    };
  }

  private mapLogTime(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'tasks/logTime', // This one was already correct
      payload: {
        taskId: params.taskId,
        hoursWorked: parseFloat(params.hoursWorked),
        notes: params.notes || '',
        timestamp: new Date().toISOString()
      }
    };
  }

  // ============================================================================
  // PERSONAL HUB MAPPERS
  // ============================================================================

  private mapCreateNote(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'notes/addNote', // CORRECTED: was 'notes/create'
      payload: {
        title: params.title,
        content: params.content,
        tags: this.transformTags(params.tags),
        category: params.category || 'personal',
        isPinned: false,
        createdAt: new Date().toISOString()
      }
    };
  }

  private mapAddReminder(params: any, ctx: SmartResolverContext): ReduxAction {
    // CRITICAL: Reminders are stored as tasks with isReminder: true
    const dueDate = this.transformDate(params.dueDate, ctx);
    
    return {
      type: 'tasks/addTask', // CORRECTED: Store as task with special flag
      payload: {
        title: params.title,
        isReminder: true, // Special flag for reminders
        priority: params.priority || 'high', // Reminders default to high priority
        dueDate: dueDate,
        status: 'pending',
        createdAt: new Date().toISOString()
      }
    };
  }

  private mapAddTodo(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'todos/addTodo', // CORRECTED: was 'todos/add'
      payload: {
        text: params.text,
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString()
      }
    };
  }

  // ============================================================================
  // FINANCE HUB MAPPERS
  // ============================================================================

  private mapAddExpense(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'payments/recordExpense', // CORRECTED: was 'payments/addExpense'
      payload: {
        amount: this.transformAmount(params.amount),
        category: params.category || 'other',
        description: params.description || '',
        date: this.transformDate(params.date, ctx) || new Date().toISOString(),
        type: 'expense'
      }
    };
  }

  private mapAddIncome(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'payments/recordIncome', // CORRECTED: was 'payments/addIncome'
      payload: {
        amount: this.transformAmount(params.amount),
        source: params.source || 'other',
        description: params.description || '',
        date: this.transformDate(params.date, ctx) || new Date().toISOString(),
        type: 'income'
      }
    };
  }

  private mapSetBudget(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'payments/setBudget', // Check if this exists in Redux
      payload: {
        category: params.category,
        amount: this.transformAmount(params.amount),
        period: params.period || 'monthly'
      }
    };
  }

  private mapPayDebt(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'payments/markAsPaid', // CORRECTED: was 'payments/payDebt'
      payload: {
        paymentId: params.paymentId,
        paidAt: new Date().toISOString()
      }
    };
  }

  // ============================================================================
  // GLOBAL MAPPERS
  // ============================================================================

  private mapSearch(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'intelligence/executeSearch', // CORRECTED: was 'intelligence/search'
      payload: {
        query: params.query,
        hub: ctx.currentHub
      }
    };
  }

  private mapCreateEvent(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'calendar/addEvent', // CORRECTED: was 'calendar/create'
      payload: {
        title: params.title,
        description: params.description || '',
        startTime: this.transformDate(params.startTime, ctx),
        endTime: this.transformDate(params.endTime, ctx),
        location: params.location || '',
        createdAt: new Date().toISOString()
      }
    };
  }

  // ============================================================================
  // PAYLOAD TRANSFORMERS
  // ============================================================================

  /**
   * Transform date strings to ISO format using smart resolution
   */
  private transformDate(
    dateInput: string | Date | undefined, 
    ctx: SmartResolverContext
  ): string | undefined {
    if (!dateInput) {
      // ENHANCEMENT: Infer from context if empty
      // For reminders like "wake up early", infer "tomorrow morning"
      if (ctx.lowerPrompt.includes('wake up') || ctx.lowerPrompt.includes('alarm')) {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        tomorrow.setHours(7, 0, 0, 0); // Default 7 AM
        return tomorrow.toISOString();
      }
      return undefined;
    }

    if (dateInput instanceof Date) {
      return dateInput.toISOString();
    }

    // Use smart resolver for natural language dates
    const resolved = resolveSmartDate(dateInput, ctx);
    
    if (resolved instanceof Date) {
      return resolved.toISOString();
    }
    
    if (typeof resolved === 'string') {
      // Try parsing as date
      const parsed = new Date(resolved);
      if (!isNaN(parsed.getTime())) {
        return parsed.toISOString();
      }
    }

    return undefined;
  }

  /**
   * Transform amount strings to numbers (handles "50k", "$1,500", etc.)
   */
  private transformAmount(amount: string | number): number {
    if (typeof amount === 'number') {
      return amount;
    }

    // Remove currency symbols and commas
    const cleaned = amount.replace(/[$,€£¥]/g, '').trim();

    // Handle 'k' suffix (thousands)
    if (cleaned.toLowerCase().endsWith('k')) {
      return parseFloat(cleaned.slice(0, -1)) * 1000;
    }

    // Handle 'm' suffix (millions)
    if (cleaned.toLowerCase().endsWith('m')) {
      return parseFloat(cleaned.slice(0, -1)) * 1000000;
    }

    return parseFloat(cleaned);
  }

  /**
   * Transform tags string to array
   */
  private transformTags(tags: string | string[] | undefined): string[] {
    if (!tags) return [];
    if (Array.isArray(tags)) return tags;
    
    // Split by comma, trim, filter empties
    return tags.split(',')
      .map(tag => tag.trim())
      .filter(tag => tag.length > 0);
  }

  // ============================================================================
  // VALIDATION
  // ============================================================================

  /**
   * Validate that an action type exists in Redux store
   * This is a safeguard against typos and missing reducers
   */
  private isValidActionType(actionType: string): boolean {
    const knownActions = [
      // Projects
      'projects/addProject',
      'projects/updateProject',
      'projects/deleteProject',
      'projects/setCurrentProject',

      // Tasks
      'tasks/addTask',
      'tasks/rescheduleTask',
      'tasks/completeTask',
      'tasks/logTime',

      // Notes
      'notes/addNote',
      'notes/updateNote',
      'notes/deleteNote',
      'notes/togglePinNote',
      'notes/addTag',

      // Todos
      'todos/addTodo',
      'todos/deleteTodo',
      'todos/setTodoStatus',
      'todos/setTodoProgress',

      // Payments (Finance)
      'payments/recordExpense',
      'payments/recordIncome',
      'payments/markAsPaid',
      'payments/setBudget',

      // Calendar
      'calendar/addEvent',
      'calendar/updateEvent',
      'calendar/deleteEvent',

      // Intelligence
      'intelligence/executeSearch'
    ];

    return knownActions.includes(actionType);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const openclawAdapter = new OpenClawAdapter();
