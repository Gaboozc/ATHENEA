/**
 * ATHENEA Skills Registry
 * 
 * Each Skill maps a user intent to:
 * 1. A Redux action
 * 2. A Canvas artifact for preview/editing
 * 3. Keywords for NLP matching
 * 
 * Skills are organized by Hub: WorkHub, PersonalHub, FinanceHub
 */

import { SkillManifest, SkillExecutor, SkillExecutionContext, CanvasArtifact } from './types';

// ============================================================================
// WORK HUB SKILLS
// ============================================================================

export const workHubSkills: SkillManifest[] = [
  {
    id: 'create_project',
    name: 'Create Project',
    description: 'Create a new work project with goals and timeline',
    icon: '📁',
    hub: 'WorkHub',
    keywords: ['project', 'create project', 'new project', 'start project', 'begin project', 'collaborator', 'colaborador'],
    action: 'projects/create',
    paramSchema: {
      title: {
        type: 'string',
        required: true,
        description: 'Project name',
        validation: /^.{3,100}$/
      },
      description: {
        type: 'string',
        required: false,
        description: 'Project description'
      },
      dueDate: {
        type: 'date',
        required: false,
        description: 'Expected completion date'
      },
      priority: {
        type: 'select',
        required: false,
        description: 'Priority level',
        enum: ['low', 'medium', 'high', 'critical']
      }
    }
  },
  
  {
    id: 'add_task',
    name: 'Add Task',
    description: 'Add a new task to your work or a project',
    icon: '✅',
    hub: 'WorkHub',
    keywords: ['add', 'task', 'do', 'create', 'todo', 'to do', 'need to', 'project task'],
    action: 'tasks/add',
    paramSchema: {
      title: {
        type: 'string',
        required: true,
        description: 'Task title',
        validation: /^.{3,200}$/
      },
      projectId: {
        type: 'string',
        required: false,
        description: 'Active project'
      },
      priority: {
        type: 'select',
        required: false,
        description: 'Task priority',
        enum: ['low', 'medium', 'high']
      },
      dueDate: {
        type: 'date',
        required: false,
        description: 'Due date'
      },
      estimatedHours: {
        type: 'number',
        required: false,
        description: 'Estimated hours to complete'
      }
    }
  },

  {
    id: 'log_time',
    name: 'Log Work Time',
    description: 'Record time spent on a task',
    icon: '⏱️',
    hub: 'WorkHub',
    keywords: ['log', 'spent', 'hours', 'worked', 'time', 'record'],
    action: 'tasks/logTime',
    paramSchema: {
      taskId: {
        type: 'string',
        required: true,
        description: 'Task to log time for'
      },
      hoursWorked: {
        type: 'number',
        required: true,
        description: 'Hours worked'
      },
      notes: {
        type: 'string',
        required: false,
        description: 'Work notes/summary'
      }
    }
  }
];

// ============================================================================
// PERSONAL HUB SKILLS
// ============================================================================

export const personalHubSkills: SkillManifest[] = [
  {
    id: 'create_note',
    name: 'Create Note',
    description: 'Create a new personal note or thought',
    icon: '📝',
    hub: 'PersonalHub',
    keywords: ['note', 'remember', 'write', 'create', 'save', 'jot', 'personal note', 'to do note'],
    action: 'notes/create',
    paramSchema: {
      title: {
        type: 'string',
        required: true,
        description: 'Note title',
        validation: /^.{3,150}$/
      },
      content: {
        type: 'textarea',
        required: true,
        description: 'Note content'
      },
      tags: {
        type: 'string',
        required: false,
        description: 'Comma-separated tags'
      },
      category: {
        type: 'select',
        required: false,
        description: 'Note category',
        enum: ['personal', 'work', 'ideas', 'important', 'other']
      }
    }
  },

  {
    id: 'add_reminder',
    name: 'Set Reminder',
    description: 'Create a reminder for later',
    icon: '🔔',
    hub: 'PersonalHub',
    keywords: ['reminder', 'set reminder', 'remind', 'remember', 'wake up', 'alarm', 'alert', 'notification', 'schedule reminder'],
    action: 'tasks/addTask',
    paramSchema: {
      title: {
        type: 'string',
        required: true,
        description: 'Reminder text'
      },
      dueDate: {
        type: 'date',
        required: true,
        description: 'When to remind'
      },
      priority: {
        type: 'select',
        required: false,
        description: 'Reminder priority',
        enum: ['low', 'medium', 'high']
      }
    }
  },

  {
    id: 'add_todo',
    name: 'Add Todo Item',
    description: 'Add to your personal todo list',
    icon: '📌',
    hub: 'PersonalHub',
    keywords: ['todo', 'to-do', 'to do', 'add', 'personal', 'list', 'item', 'routine', 'rutina'],
    action: 'todos/add',
    paramSchema: {
      text: {
        type: 'string',
        required: true,
        description: 'Todo item text'
      },
      priority: {
        type: 'select',
        required: false,
        description: 'Priority',
        enum: ['low', 'medium', 'high']
      }
    }
  }
];

// ============================================================================
// FINANCE HUB SKILLS
// ============================================================================

export const financeHubSkills: SkillManifest[] = [
  {
    id: 'record_expense',
    name: 'Record Expense',
    description: 'Log a money expense',
    icon: '💸',
    hub: 'FinanceHub',
    keywords: ['spent', 'expense', 'cost', 'paid', 'bill', 'charge', 'money', 'spend', 'draw', 'finance', 'financial', 'budgeting'],
    action: 'payments/addExpense',
    paramSchema: {
      description: {
        type: 'string',
        required: true,
        description: 'What was purchased',
        validation: /^.{3,200}$/
      },
      amount: {
        type: 'number',
        required: true,
        description: 'Amount in USD'
      },
      category: {
        type: 'select',
        required: true,
        description: 'Expense category',
        enum: ['food', 'transport', 'utilities', 'entertainment', 'business', 'other']
      },
      date: {
        type: 'date',
        required: false,
        description: 'Expense date'
      },
      paymentMethod: {
        type: 'select',
        required: false,
        description: 'How paid',
        enum: ['cash', 'credit', 'debit', 'transfer', 'other']
      }
    }
  },

  {
    id: 'record_income',
    name: 'Record Income',
    description: 'Log money earned',
    icon: '💰',
    hub: 'FinanceHub',
    keywords: ['earned', 'income', 'received', 'payment', 'salary', 'revenue'],
    action: 'payments/addIncome',
    paramSchema: {
      description: {
        type: 'string',
        required: true,
        description: 'Income source'
      },
      amount: {
        type: 'number',
        required: true,
        description: 'Amount in USD'
      },
      source: {
        type: 'select',
        required: true,
        description: 'Income type',
        enum: ['freelance', 'salary', 'investment', 'gift', 'other']
      },
      date: {
        type: 'date',
        required: false,
        description: 'Date received'
      }
    }
  },

  {
    id: 'set_budget',
    name: 'Set Budget',
    description: 'Create a budget limit for a category',
    icon: '📊',
    hub: 'FinanceHub',
    keywords: ['budget', 'budgeting', 'budget limit', 'monthly budget', 'set budget', 'presupuesto', 'limite de presupuesto', 'establecer presupuesto', 'finance budget'],
    action: 'payments/setBudget',
    paramSchema: {
      category: {
        type: 'select',
        required: true,
        description: 'Budget category',
        enum: ['food', 'transport', 'utilities', 'entertainment', 'business', 'other']
      },
      limit: {
        type: 'number',
        required: true,
        description: 'Monthly limit in USD'
      },
      period: {
        type: 'select',
        required: false,
        description: 'Budget period',
        enum: ['weekly', 'monthly', 'quarterly', 'yearly']
      }
    }
  },

  {
    id: 'query_budget_status',
    name: 'Consulta Inteligente de Gasto',
    description: 'Jarvis analiza tu presupuesto y responde si puedes gastar una cantidad específica',
    icon: '🤖',
    hub: 'FinanceHub',
    keywords: [
      'puedo gastar', 'puedo comprar', 'tengo para', 'me alcanza',
      'can i spend', 'should i spend', 'do i have budget', 'cuanto tengo',
      'cuanto me queda', 'budget check', 'verificar presupuesto',
      'analizar gasto', 'jarvis puedo', 'jarvis cuanto', 'puedo gastar el'
    ],
    action: 'agent/query',
    paramSchema: {
      amount: {
        type: 'number',
        required: false,
        description: 'Amount to check'
      }
    }
  }
];

// ============================================================================
// CROSS-HUB SKILLS
// ============================================================================

export const crossHubSkills: SkillManifest[] = [
  {
    id: 'search',
    name: 'Search',
    description: 'Search across all your data',
    icon: '🔍',
    hub: 'WorkHub',
    keywords: ['search', 'find', 'look', 'where is', 'find me'],
    action: 'intelligence/search',
    paramSchema: {
      query: {
        type: 'string',
        required: true,
        description: 'Search query'
      },
      scope: {
        type: 'select',
        required: false,
        description: 'Search in',
        enum: ['all', 'notes', 'tasks', 'expenses', 'projects']
      }
    }
  },
  {
    id: 'sync_calendar',
    name: 'Sync Calendar',
    description: 'Sync external Google Calendar events into ATHENEA',
    icon: '📅',
    hub: 'WorkHub',
    keywords: ['sync calendar', 'sync my calendar', 'google calendar', 'calendar sync', 'update calendar'],
    action: 'calendar/syncExternalEvents',
    paramSchema: {
      forceInteractiveAuth: {
        type: 'boolean',
        required: false,
        description: 'Force Google OAuth consent during sync'
      }
    }
  },

  {
    id: 'open_calendar',
    name: 'Open Calendar',
    description: 'Open the calendar to a specific date or view financial/work projection for a day',
    icon: '📅',
    hub: 'WorkHub',
    keywords: [
      'calendar', 'open calendar', 'show calendar', 'ver calendario', 'abrir calendario',
      'show me friday', 'viernes', 'lunes', 'martes', 'miércoles',
      'jueves', 'sábado', 'domingo', 'agenda', 'this week', 'semana'
    ],
    action: 'navigation/openCalendar',
    paramSchema: {
      targetDate: {
        type: 'date',
        required: false,
        description: 'Target date to navigate to'
      }
    }
  }
];

// ============================================================================
// SKILL REGISTRY
// ============================================================================

export const allSkills = [
  ...workHubSkills,
  ...personalHubSkills,
  ...financeHubSkills,
  ...crossHubSkills
];

export const skillRegistry = new Map<string, SkillManifest>(
  allSkills.map(skill => [skill.id, skill])
);

/**
 * Get skills by hub
 */
export function getSkillsByHub(hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub'): SkillManifest[] {
  return allSkills.filter(skill => skill.hub === hub);
}

/**
 * Find skill by ID
 */
export function getSkillById(id: string): SkillManifest | undefined {
  return skillRegistry.get(id);
}

/**
 * Find skill by keyword matching
 */
export function findSkillByKeywords(
  input: string,
  preferredHub?: 'WorkHub' | 'PersonalHub' | 'FinanceHub'
): SkillManifest | null {
  const lowerInput = input.toLowerCase();

  let bestSkill: SkillManifest | null = null;
  let bestScore = 0;

  for (const skill of allSkills) {
    let score = 0;

    for (const keyword of skill.keywords) {
      const lowerKeyword = keyword.toLowerCase();
      if (lowerInput.includes(lowerKeyword)) {
        // Longer phrases are more specific and should rank higher.
        score += Math.max(1, lowerKeyword.length);

        // Exact phrase match boost.
        if (lowerInput === lowerKeyword) {
          score += 20;
        }
      }
    }

    // Prefer current hub when scores are close.
    if (preferredHub && skill.hub === preferredHub) {
      score += 5;
    }

    // Reminder-specific boost to avoid being hijacked by generic "create" matches.
    if (skill.id === 'add_reminder' && /(remind|reminder|wake\s*up|alarm)/.test(lowerInput)) {
      score += 25;
    }

    if (score > bestScore) {
      bestScore = score;
      bestSkill = skill;
    }
  }

  return bestScore > 0 ? bestSkill : null;
}
