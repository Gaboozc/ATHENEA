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
  /** Extra actions to dispatch after the primary action (e.g. calendar link side-effects) */
  actions?: ReduxAction[];
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
        action,
        actions: this.getSideEffectActions(response.skillId, action.payload, response.parameters, response.context)
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
      'record_expense': this.mapAddExpense.bind(this),
      'record_income': this.mapAddIncome.bind(this),
      'set_budget': this.mapSetBudget.bind(this),
      'pay_debt': this.mapPayDebt.bind(this),
      /* WALLETS-11: wallet skills */
      'record_income_usd': this.mapAddIncomeUSD.bind(this),
      'record_income_mxn': this.mapAddIncomeMXN.bind(this),
      'record_conversion': this.mapRecordConversion.bind(this),
      'record_expense_usd': this.mapRegisterExpenseUSD.bind(this),

      // ========== GLOBAL ==========
      'search': this.mapSearch.bind(this),
      'create_event': this.mapCreateEvent.bind(this),
      'sync_calendar': this.mapSyncCalendar.bind(this),
      'open_calendar': this.mapOpenCalendar.bind(this)
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
        id: `task-omni-${Date.now()}`,
        title: params.title,
        projectId: params.projectId || null,
        priority: params.priority || 'medium',
        level: params.level || 'Standard',
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
    // P-FIX-6: Reminders go to todos slice (not tasks) with isReminder flag
    const dueDate = this.transformDate(params.dueDate, ctx);

    return {
      type: 'todos/addTodo',
      payload: {
        id: `reminder-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: params.title,
        isReminder: true,
        priority: params.priority || 'high',
        dueDate: dueDate,
        status: 'pending',
        progress: 0,
        notes: '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      }
    };
  }

  private mapAddTodo(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'todos/addTodo', // CORRECTED: was 'todos/add'
      payload: {
        title: params.text || params.title || 'Untitled Todo',
        notes: params.notes || '',
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
      type: 'budget/addExpense', /* F-FIX-2: was 'payments/recordExpense'; real gastos van a budgetSlice */
      payload: {
        id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        amount: this.transformAmount(params.amount),
        categoryId: params.category || null,
        note: params.description || '',
        date: this.transformDate(params.date, ctx) || new Date().toISOString(),
      }
    };
  }

  private mapAddIncome(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'payments/recordIncome', /* F-FIX-2: action name correcto (ya existía correcto) */
      payload: {
        id: `payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        description: params.description || params.source || '',
        amount: this.transformAmount(params.amount),
        source: params.source || 'other',
        date: this.transformDate(params.date, ctx) || new Date().toISOString(),
      }
    };
  }

  private mapSetBudget(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'budget/addCategory', /* F-FIX-2: was 'payments/setBudget' (escribía en array zombi) */
      payload: {
        id: `cat-skill-${Date.now()}`,
        name: params.category,
        limit: this.transformAmount(params.limit ?? params.amount ?? 0)
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

  private mapSyncCalendar(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'calendar/syncExternalEvents',
      payload: {
        forceInteractiveAuth: Boolean(params.forceInteractiveAuth)
      }
    };
  }

  private mapOpenCalendar(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'navigation/openCalendar',
      payload: {
        targetDate: this.transformDate(params.targetDate, ctx) ?? null
      }
    };
  }

  // ============================================================================
  // SIDE-EFFECT ACTIONS (calendar linking, etc.)
  // ============================================================================

  /**
   * Returns extra Redux actions to dispatch after the primary action.
   * Currently handles: add_task → calendar/linkTaskToCalendar when dueDate is set.
   */
  private getSideEffectActions(
    skillId: string,
    primaryPayload: any,
    originalParams: any,
    ctx: SmartResolverContext
  ): ReduxAction[] {
    if (skillId === 'add_task') {
      const dueDate = primaryPayload?.dueDate;
      if (dueDate) {
        return [{
          type: 'calendar/linkTaskToCalendar',
          payload: {
            taskId: primaryPayload.id,
            taskTitle: primaryPayload.title,
            dueDate,
            level: primaryPayload.level || 'Standard'
          }
        }];
      }
    }

    /* WALLETS-11: record_expense_usd — also deduct from wallet after budget entry */
    if (skillId === 'record_expense_usd' && primaryPayload?.id) {
      const currency = primaryPayload.currency || 'USD';
      return [{
        type: currency === 'USD' ? 'wallets/addExpenseUSD' : 'wallets/addExpenseMXN',
        payload: {
          id: `wallet-exp-${primaryPayload.id}`,
          amount: primaryPayload.amount,
          description: primaryPayload.note || '',
          category: primaryPayload.categoryId || null,
          date: primaryPayload.date,
        },
      }];
    }

    return [];
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
  // WALLET MAPPERS (WALLETS-11)
  // ============================================================================

  private mapAddIncomeUSD(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'wallets/addIncomeUSD',
      payload: {
        id: `inc-usd-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        amount: this.transformAmount(params.amount),
        description: params.description || 'Ingreso USD',
        category: params.category || 'income',
        date: this.transformDate(params.date, ctx) || new Date().toISOString(),
      },
    };
  }

  private mapAddIncomeMXN(params: any, ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'wallets/addIncomeMXN',
      payload: {
        id: `inc-mxn-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        amount: this.transformAmount(params.amount),
        description: params.description || 'Ingreso MXN',
        category: params.category || 'income',
        date: this.transformDate(params.date, ctx) || new Date().toISOString(),
      },
    };
  }

  private mapRecordConversion(params: any, _ctx: SmartResolverContext): ReduxAction {
    return {
      type: 'wallets/recordConversion',
      payload: {
        id: `conv-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
        amountUSD: this.transformAmount(params.amountUSD),
        amountMXN: this.transformAmount(params.amountMXN),
        description: params.description || '',
        date: new Date().toISOString(),
      },
    };
  }

  private mapRegisterExpenseUSD(params: any, ctx: SmartResolverContext): ReduxAction {
    /* WALLETS-11: USD expense — primary action goes to budgetSlice;
     * side-effect (wallets/addExpenseUSD) added via getSideEffectActions */
    const id = `exp-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const currency = /usd|dólar|dollar/i.test(params.description || '') ? 'USD'
      : (params.currency || 'USD');
    return {
      type: 'budget/addExpense',
      payload: {
        id,
        amount: this.transformAmount(params.amount),
        currency,
        categoryId: params.categoryId || params.category || null,
        note: params.description || '',
        date: this.transformDate(params.date, ctx) || new Date().toISOString(),
      },
    };
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
      'calendar/syncExternalEvents',

      // Navigation
      'navigation/openCalendar',

      // Intelligence
      'intelligence/executeSearch',

      // Budget (corrected)
      'budget/addExpense',
      'budget/addCategory',

      // Wallets (WALLETS-11)
      'wallets/addIncomeUSD',
      'wallets/addIncomeMXN',
      'wallets/addExpenseUSD',
      'wallets/addExpenseMXN',
      'wallets/recordConversion',
    ];

    return knownActions.includes(actionType);
  }
}

// ============================================================================
// SINGLETON INSTANCE
// ============================================================================

export const openclawAdapter = new OpenClawAdapter();
