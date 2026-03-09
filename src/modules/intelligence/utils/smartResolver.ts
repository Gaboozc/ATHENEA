/**
 * ATHENEA Smart Parameter Resolver
 * 
 * Intelligent parameter resolution that goes beyond simple extraction:
 * - Resolves relative dates ("tomorrow" → actual Date)
 * - Finds entity IDs automatically (e.g., most recent payment for "liquidar deuda")
 * - Infers missing but obvious parameters from context
 * - Uses Redux state for contextual lookups
 */

export interface SmartResolverContext {
  getState: () => any; // Redux state
  userPrompt: string;
  lowerPrompt: string;
  currentHub: 'WorkHub' | 'PersonalHub' | 'FinanceHub';
}

/**
 * Smart Date Resolution
 * Handles natural language dates with full Date object support
 * ENHANCED: Now infers dates from context when dateString is empty
 */
export function resolveSmartDate(
  dateString: string | undefined,
  context: SmartResolverContext
): Date | string | undefined {
  const now = new Date();
  
  // ENHANCEMENT: If no explicit date, infer from natural language context
  if (!dateString || dateString.trim() === '') {
    // Check for time-sensitive keywords in the full prompt
    const lower = context.lowerPrompt;
    
    // "In X minutes/hours"
    const minutesMatch = lower.match(/in\s+(\d+)\s+minute/i);
    if (minutesMatch) {
      const date = new Date(now);
      date.setMinutes(date.getMinutes() + parseInt(minutesMatch[1]));
      return date;
    }
    
    const hoursMatch = lower.match(/in\s+(\d+)\s+hour/i);
    if (hoursMatch) {
      const date = new Date(now);
      date.setHours(date.getHours() + parseInt(hoursMatch[1]));
      return date;
    }
    
    // "Tomorrow" without explicit time
    if (lower.includes('tomorrow') || lower.includes('mañana')) {
      const date = new Date(now);
      date.setDate(date.getDate() + 1);
      date.setHours(9, 0, 0, 0); // Default to 9 AM
      return date;
    }
    
    // "Wake up" related prompts default to tomorrow morning
    if (lower.includes('wake up') || lower.includes('wake me') || 
        lower.includes('alarm') || lower.includes('despertador')) {
      const date = new Date(now);
      date.setDate(date.getDate() + 1);
      date.setHours(7, 0, 0, 0); // Default to 7 AM
      return date;
    }
    
    // No inference possible, return undefined
    return undefined;
  }

  const lower = dateString.toLowerCase();

  // Handle time expressions (at 5pm, at 17:00)
  const timeMatch = context.lowerPrompt.match(/at\s+(\d{1,2})(?::(\d{2}))?\s*(am|pm)?/i);
  let targetTime: { hours: number; minutes: number } | null = null;

  if (timeMatch) {
    let hours = parseInt(timeMatch[1]);
    const minutes = timeMatch[2] ? parseInt(timeMatch[2]) : 0;
    const meridiem = timeMatch[3]?.toLowerCase();

    if (meridiem === 'pm' && hours < 12) hours += 12;
    if (meridiem === 'am' && hours === 12) hours = 0;

    targetTime = { hours, minutes };
  }

  // Relative dates
  if (lower.includes('today') || lower.includes('hoy')) {
    const date = new Date(now);
    if (targetTime) {
      date.setHours(targetTime.hours, targetTime.minutes, 0, 0);
    }
    return date;
  }

  if (lower.includes('tomorrow') || lower.includes('mañana')) {
    const date = new Date(now);
    date.setDate(date.getDate() + 1);
    if (targetTime) {
      date.setHours(targetTime.hours, targetTime.minutes, 0, 0);
    }
    return date;
  }

  if (lower.includes('next week') || lower.includes('próxima semana')) {
    const date = new Date(now);
    date.setDate(date.getDate() + 7);
    if (targetTime) {
      date.setHours(targetTime.hours, targetTime.minutes, 0, 0);
    }
    return date;
  }

  if (lower.includes('next month') || lower.includes('próximo mes')) {
    const date = new Date(now);
    date.setMonth(date.getMonth() + 1);
    if (targetTime) {
      date.setHours(targetTime.hours, targetTime.minutes, 0, 0);
    }
    return date;
  }

  // Day of week (next Monday, el lunes)
  const dayNames = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'];
  const dayNamesES = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];
  
  for (let i = 0; i < dayNames.length; i++) {
    if (lower.includes(dayNames[i]) || lower.includes(dayNamesES[i])) {
      const targetDay = i;
      const currentDay = now.getDay();
      const daysUntil = (targetDay - currentDay + 7) % 7 || 7;
      const date = new Date(now);
      date.setDate(date.getDate() + daysUntil);
      if (targetTime) {
        date.setHours(targetTime.hours, targetTime.minutes, 0, 0);
      }
      return date;
    }
  }

  // If we already have a valid date string, return it
  return dateString;
}

/**
 * Smart Payment ID Resolution
 * Finds the most recent unpaid payment when user says "liquidar deuda" or "pay debt"
 * FIXED: Now uses correct state path (state.payments instead of state.finance)
 */
export function resolvePaymentId(
  context: SmartResolverContext
): number | undefined {
  const state = context.getState();
  
  // Check if prompt mentions liquidating/paying debt
  if (
    !context.lowerPrompt.includes('liquidar') &&
    !context.lowerPrompt.includes('pay') &&
    !context.lowerPrompt.includes('pagar')
  ) {
    return undefined;
  }

  // CORRECTED: Use state.payments.payments (not state.finance)
  const payments = state.payments?.payments || [];
  
  // Find most recent unpaid entry
  const unpaidPayments = payments
    .filter((p: any) => p.type === 'expense' && !p.isPaid)
    .sort((a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (unpaidPayments.length > 0) {
    return unpaidPayments[0].id;
  }

  return undefined;
}

/**
 * Smart Project ID Resolution
 * Finds project ID by name or gets the most recently active project
 */
export function resolveProjectId(
  context: SmartResolverContext
): number | undefined {
  const state = context.getState();
  const projects = state.projects?.projects || [];

  // Try to extract project name from prompt
  const projectNameMatch = context.userPrompt.match(/(?:to|in|for)\s+(?:project\s+)?["']?([a-zA-Z0-9\s]+?)["']?(?:\s|,|$)/i);
  
  if (projectNameMatch) {
    const projectName = projectNameMatch[1].trim().toLowerCase();
    const matchedProject = projects.find((p: any) => 
      p.title?.toLowerCase().includes(projectName)
    );
    
    if (matchedProject) {
      return matchedProject.id;
    }
  }

  // Fallback: get most recently updated project
  if (projects.length > 0) {
    const sortedProjects = [...projects].sort((a: any, b: any) => {
      const timeA = a.updatedAt || a.createdAt || 0;
      const timeB = b.updatedAt || b.createdAt || 0;
      return timeB - timeA;
    });
    return sortedProjects[0].id;
  }

  return undefined;
}

/**
 * Smart Task ID Resolution
 * Finds task by partial title match
 */
export function resolveTaskId(
  context: SmartResolverContext
): number | undefined {
  const state = context.getState();
  const tasks = state.tasks?.tasks || [];

  // Look for task reference in prompt
  const taskMatch = context.userPrompt.match(/task\s+#?(\d+)/i);
  if (taskMatch) {
    return parseInt(taskMatch[1]);
  }

  // Try to find by title
  const titleMatch = context.userPrompt.match(/["']([^"']+)["']/);
  if (titleMatch) {
    const searchTitle = titleMatch[1].toLowerCase();
    const matchedTask = tasks.find((t: any) => 
      t.title?.toLowerCase().includes(searchTitle)
    );
    
    if (matchedTask) {
      return matchedTask.id;
    }
  }

  return undefined;
}

/**
 * Smart Category Resolution
 * Infers expense/income category from keywords
 */
export function resolveCategory(
  context: SmartResolverContext
): string | undefined {
  const lower = context.lowerPrompt;

  // Expense categories
  const categoryMap: Record<string, string[]> = {
    'food': ['food', 'restaurant', 'lunch', 'dinner', 'coffee', 'comida', 'restaurante'],
    'transport': ['uber', 'taxi', 'bus', 'train', 'gas', 'transporte', 'gasolina'],
    'shopping': ['shopping', 'clothes', 'amazon', 'compras', 'ropa'],
    'bills': ['bill', 'rent', 'utilities', 'electricity', 'water', 'factura', 'renta'],
    'entertainment': ['movie', 'cinema', 'game', 'entertainment', 'netflix', 'entretenimiento'],
    'health': ['pharmacy', 'doctor', 'medicine', 'hospital', 'salud', 'farmacia'],
    'education': ['course', 'book', 'education', 'school', 'educación', 'curso'],
  };

  for (const [category, keywords] of Object.entries(categoryMap)) {
    if (keywords.some(kw => lower.includes(kw))) {
      return category;
    }
  }

  return undefined;
}

/**
 * Smart Priority Resolution
 * Infers priority from keywords and context
 */
export function resolvePriority(
  context: SmartResolverContext
): 'low' | 'medium' | 'high' | 'critical' | undefined {
  const lower = context.lowerPrompt;

  if (lower.includes('urgent') || lower.includes('asap') || lower.includes('critical') || lower.includes('urgente')) {
    return 'critical';
  }
  if (lower.includes('important') || lower.includes('high priority') || lower.includes('importante')) {
    return 'high';
  }
  if (lower.includes('low priority') || lower.includes('whenever') || lower.includes('baja prioridad')) {
    return 'low';
  }

  // Default to medium for most tasks
  return 'medium';
}

/**
 * Smart Amount Resolution
 * Extracts monetary amounts with currency detection
 */
export function resolveAmount(
  context: SmartResolverContext
): number | undefined {
  const prompt = context.userPrompt;

  // Try to match currency patterns
  const patterns = [
    /\$\s*(\d+(?:\.\d{2})?)/,           // $45.50
    /(\d+(?:\.\d{2})?)\s*(?:dollars?|usd)/i,  // 45.50 dollars
    /(\d+(?:,\d{3})*(?:\.\d{2})?)/,     // 1,234.56
  ];

  for (const pattern of patterns) {
    const match = prompt.match(pattern);
    if (match) {
      const amount = parseFloat(match[1].replace(/,/g, ''));
      if (!isNaN(amount)) {
        return amount;
      }
    }
  }

  return undefined;
}

/**
 * Main Smart Resolution Engine
 * Enriches extracted parameters with intelligent lookups
 */
export function enrichParameters(
  baseParams: Record<string, any>,
  paramSchema: Record<string, any>,
  context: SmartResolverContext
): Record<string, any> {
  const enriched = { ...baseParams };

  // Enrich each parameter type
  for (const [paramId, paramDef] of Object.entries(paramSchema)) {
    // Skip if already has a value
    if (enriched[paramId] !== undefined) {
      // But resolve dates if present
      if (paramDef.type === 'date' && enriched[paramId]) {
        enriched[paramId] = resolveSmartDate(enriched[paramId], context);
      }
      continue;
    }

    // Auto-resolve based on parameter name and type
    switch (paramId) {
      case 'dueDate':
      case 'date':
      case 'startDate':
      case 'endDate':
        enriched[paramId] = resolveSmartDate(undefined, context);
        break;

      case 'paymentId':
        enriched[paramId] = resolvePaymentId(context);
        break;

      case 'projectId':
        enriched[paramId] = resolveProjectId(context);
        break;

      case 'taskId':
        enriched[paramId] = resolveTaskId(context);
        break;

      case 'category':
        enriched[paramId] = resolveCategory(context);
        break;

      case 'priority':
        enriched[paramId] = resolvePriority(context);
        break;

      case 'amount':
        enriched[paramId] = resolveAmount(context);
        break;
    }
  }

  return enriched;
}
