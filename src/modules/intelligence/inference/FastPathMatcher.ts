/**
 * ATHENEA Fast Path Intent Matcher
 * 
 * Optimized regex-based intent classification for instant recognition.
 * Handles 80% of common cases with <1ms latency.
 * 
 * Pattern Categories:
 * - Action verbs (create, add, delete, update, record, log)
 * - Entity types (task, project, note, payment, expense)
 * - Context signals (urgent, today, tomorrow, weekly)
 * - Numerical patterns (amounts, dates, times)
 */

import type { SkillManifest } from '../types';

export interface FastPathMatch {
  skillId: string;
  confidence: number;
  matchedPatterns: string[];
  extractedContext: Record<string, any>;
}

/**
 * Optimized regex patterns for fast matching
 */
const FAST_PATTERNS = {
  // Action verbs
  CREATE: /\b(create|make|add|new|start|begin|open)\b/i,
  UPDATE: /\b(update|edit|modify|change|alter)\b/i,
  DELETE: /\b(delete|remove|cancel|discard)\b/i,
  RECORD: /\b(record|log|track|register)\b/i,
  PAY: /\b(pay|payment|paid|expense|spend|spent|cost)\b/i,
  SYNC: /\b(sync|synchronize|connect|link)\b/i,
  NAVIGATE: /\b(open|show|ver|abrir|ir a|go to|mu[eé]strame|show me)\b/i,
  SPEND_CHECK: /\b(puedo gastar|puedo\s+gastar|can i spend|should i spend|spend on|gastar el)\b/i,
  
  // Entity types
  TASK: /\b(task|todo|to-do|assignment)\b/i,
  PROJECT: /\b(project|initiative|campaign)\b/i,
  NOTE: /\b(note|memo|reminder|remember)\b/i,
  EVENT: /\b(event|meeting|appointment|schedule)\b/i,
  EXPENSE: /\b(expense|payment|bill|invoice)\b/i,
  CONTACT: /\b(contact|person|client|colleague|collaborator)\b/i,
  TIME: /\b(time|hours|minutes|duration)\b/i,
  CALENDAR: /\b(calendar|calendario|agenda|gastar|viernes|lunes|martes|mi[eé]rcoles|jueves|s[aá]bado|domingo|semana|esta semana|this week)\b/i,
  
  // Priority signals
  URGENT: /\b(urgent|asap|immediately|critical|emergency)\b/i,
  HIGH_PRIORITY: /\b(important|high|priority|crucial)\b/i,
  LOW_PRIORITY: /\b(low|minor|optional|when possible)\b/i,
  
  // Time signals
  TODAY: /\b(today|now)\b/i,
  TOMORROW: /\b(tomorrow)\b/i,
  THIS_WEEK: /\b(this week|weekly)\b/i,
  NEXT_WEEK: /\b(next week)\b/i,
  
  // Numerical
  AMOUNT: /\$\s*(\d+(?:\.\d{2})?)|(\d+(?:\.\d{2})?)\s*(?:dollars|usd|€|euros)/i,
  HOURS: /(\d+(?:\.\d+)?)\s*(?:hours?|hrs?|h)\b/i,
  DATE: /\d{1,2}\/\d{1,2}\/\d{2,4}/,
  
  // Categories (Finance)
  FOOD: /\b(food|restaurant|lunch|dinner|breakfast|meal|groceries)\b/i,
  TRANSPORT: /\b(transport|uber|taxi|bus|train|gas|fuel)\b/i,
  ENTERTAINMENT: /\b(entertainment|movie|cinema|concert|show)\b/i,
  HEALTH: /\b(health|medical|doctor|pharmacy|medicine)\b/i,
  UTILITIES: /\b(utilities|electricity|water|internet|phone)\b/i,
  SHOPPING: /\b(shopping|purchase|buy|bought)\b/i,
};

/**
 * Fast Path Intent Matcher
 */
export class FastPathMatcher {
  /**
   * Attempt to match user prompt using fast regex patterns
   * Returns null if no confident match found
   */
  match(
    userPrompt: string,
    availableSkills: SkillManifest[],
    currentHub?: 'WorkHub' | 'PersonalHub' | 'FinanceHub'
  ): FastPathMatch | null {
    const lowerPrompt = userPrompt.toLowerCase();
    const matchedPatterns: string[] = [];
    const extractedContext: Record<string, any> = {};

    // Detect action
    let action: string | null = null;
    if (FAST_PATTERNS.CREATE.test(lowerPrompt)) {
      action = 'CREATE';
      matchedPatterns.push('CREATE');
    } else if (FAST_PATTERNS.PAY.test(lowerPrompt) || FAST_PATTERNS.RECORD.test(lowerPrompt)) {
      action = 'RECORD';
      matchedPatterns.push('RECORD');
    } else if (FAST_PATTERNS.UPDATE.test(lowerPrompt)) {
      action = 'UPDATE';
      matchedPatterns.push('UPDATE');
    } else if (FAST_PATTERNS.DELETE.test(lowerPrompt)) {
      action = 'DELETE';
      matchedPatterns.push('DELETE');
    } else if (FAST_PATTERNS.SYNC.test(lowerPrompt)) {
      action = 'SYNC';
      matchedPatterns.push('SYNC');
    } else if (FAST_PATTERNS.NAVIGATE.test(lowerPrompt)) {
      action = 'NAVIGATE';
      matchedPatterns.push('NAVIGATE');
    }

    if (FAST_PATTERNS.SPEND_CHECK.test(lowerPrompt)) {
      matchedPatterns.push('SPEND_CHECK');
      extractedContext.intent = 'spend-check';
    }

    // Detect entity
    let entity: string | null = null;
    if (FAST_PATTERNS.TASK.test(lowerPrompt)) {
      entity = 'TASK';
      matchedPatterns.push('TASK');
    } else if (FAST_PATTERNS.PROJECT.test(lowerPrompt)) {
      entity = 'PROJECT';
      matchedPatterns.push('PROJECT');
    } else if (FAST_PATTERNS.NOTE.test(lowerPrompt)) {
      entity = 'NOTE';
      matchedPatterns.push('NOTE');
    } else if (FAST_PATTERNS.EVENT.test(lowerPrompt)) {
      entity = 'EVENT';
      matchedPatterns.push('EVENT');
    } else if (FAST_PATTERNS.EXPENSE.test(lowerPrompt)) {
      entity = 'EXPENSE';
      matchedPatterns.push('EXPENSE');
    } else if (FAST_PATTERNS.CONTACT.test(lowerPrompt)) {
      entity = 'CONTACT';
      matchedPatterns.push('CONTACT');
    } else if (FAST_PATTERNS.TIME.test(lowerPrompt)) {
      entity = 'TIME';
      matchedPatterns.push('TIME');
    } else if (FAST_PATTERNS.CALENDAR.test(lowerPrompt)) {
      entity = 'CALENDAR';
      matchedPatterns.push('CALENDAR');
    }

    // Extract priority
    if (FAST_PATTERNS.URGENT.test(lowerPrompt) || FAST_PATTERNS.HIGH_PRIORITY.test(lowerPrompt)) {
      extractedContext.priority = 'high';
      matchedPatterns.push('HIGH_PRIORITY');
    } else if (FAST_PATTERNS.LOW_PRIORITY.test(lowerPrompt)) {
      extractedContext.priority = 'low';
      matchedPatterns.push('LOW_PRIORITY');
    }

    // Extract time context
    if (FAST_PATTERNS.TODAY.test(lowerPrompt)) {
      extractedContext.timeframe = 'today';
      matchedPatterns.push('TODAY');
    } else if (FAST_PATTERNS.TOMORROW.test(lowerPrompt)) {
      extractedContext.timeframe = 'tomorrow';
      matchedPatterns.push('TOMORROW');
    }

    // Extract amounts
    const amountMatch = FAST_PATTERNS.AMOUNT.exec(userPrompt);
    if (amountMatch) {
      extractedContext.amount = parseFloat(amountMatch[1] || amountMatch[2]);
      matchedPatterns.push('AMOUNT');
    }

    // Extract hours
    const hoursMatch = FAST_PATTERNS.HOURS.exec(userPrompt);
    if (hoursMatch) {
      extractedContext.hours = parseFloat(hoursMatch[1]);
      matchedPatterns.push('HOURS');
    }

    // Extract category (Finance)
    if (FAST_PATTERNS.FOOD.test(lowerPrompt)) {
      extractedContext.category = 'Food';
      matchedPatterns.push('FOOD');
    } else if (FAST_PATTERNS.TRANSPORT.test(lowerPrompt)) {
      extractedContext.category = 'Transport';
      matchedPatterns.push('TRANSPORT');
    } else if (FAST_PATTERNS.ENTERTAINMENT.test(lowerPrompt)) {
      extractedContext.category = 'Entertainment';
      matchedPatterns.push('ENTERTAINMENT');
    } else if (FAST_PATTERNS.HEALTH.test(lowerPrompt)) {
      extractedContext.category = 'Health';
      matchedPatterns.push('HEALTH');
    } else if (FAST_PATTERNS.UTILITIES.test(lowerPrompt)) {
      extractedContext.category = 'Utilities';
      matchedPatterns.push('UTILITIES');
    } else if (FAST_PATTERNS.SHOPPING.test(lowerPrompt)) {
      extractedContext.category = 'Shopping';
      matchedPatterns.push('SHOPPING');
    }

    // Match against skill IDs
    const skillId = this.matchSkillId(action, entity, currentHub, matchedPatterns);
    if (!skillId) {
      return null; // No confident match
    }

    // Check if skill exists in available skills
    const skillExists = availableSkills.some(s => s.id === skillId);
    if (!skillExists) {
      return null;
    }

    // Calculate confidence based on pattern matches
    const confidence = this.calculateConfidence(matchedPatterns, extractedContext);

    return {
      skillId,
      confidence,
      matchedPatterns,
      extractedContext
    };
  }

  /**
   * Map (action, entity) pair to skill ID
   */
  private matchSkillId(
    action: string | null,
    entity: string | null,
    hub?: string,
    patterns: string[] = []
  ): string | null {
    // SPEND_CHECK takes highest priority → always routes to budget query
    if (patterns.includes('SPEND_CHECK')) return 'query_budget_status';
    // Exact matches
    if (action === 'CREATE' && entity === 'PROJECT') return 'create_project';
    if (action === 'CREATE' && entity === 'TASK') return 'add_task';
    if (action === 'CREATE' && entity === 'NOTE') return 'create_note';
    if (action === 'CREATE' && entity === 'EVENT') return 'add_event';
    if (action === 'CREATE' && entity === 'CONTACT') return 'add_contact';
    
    if (action === 'RECORD' && entity === 'TIME') return 'log_time';
    if (action === 'RECORD' && entity === 'EXPENSE') return 'record_expense';
    if ((action === 'RECORD' || action === 'CREATE') && entity === 'EXPENSE') return 'record_expense';
    
    if (action === 'SYNC' && entity === 'EVENT') return 'sync_calendar';
    if (entity === 'CALENDAR') return 'open_calendar';
    if (action === 'NAVIGATE' && entity === 'CALENDAR') return 'open_calendar';
    
    // Hub-based fallbacks
    if (hub === 'FinanceHub' && entity === 'EXPENSE') return 'record_expense';
    if (hub === 'WorkHub' && entity === 'TASK') return 'add_task';
    if (hub === 'PersonalHub' && entity === 'NOTE') return 'create_note';
    
    return null;
  }

  /**
   * Calculate confidence score based on matched patterns
   */
  private calculateConfidence(
    patterns: string[],
    context: Record<string, any>
  ): number {
    let confidence = 0;
    
    // Base confidence from pattern count
    confidence += patterns.length * 15;
    
    // Bonus for extracted context
    const contextKeys = Object.keys(context);
    confidence += contextKeys.length * 10;
    
    // Bonus for having both action and entity
    const hasAction = patterns.some((p) => ['CREATE', 'RECORD', 'UPDATE', 'DELETE', 'NAVIGATE', 'SYNC'].includes(p));
    const hasEntity = patterns.some((p) => ['TASK', 'PROJECT', 'NOTE', 'EVENT', 'EXPENSE', 'CALENDAR', 'TIME'].includes(p));
    if (hasAction && hasEntity) {
      confidence += 30;
    }

    // Calendar intents need high confidence to avoid fallback mismatches.
    if (patterns.includes('CALENDAR')) {
      confidence += 25;
    }

    if (patterns.includes('SPEND_CHECK')) {
      confidence += 25;
    }
    
    return Math.min(100, confidence);
  }
}

/**
 * Singleton instance
 */
export const fastPathMatcher = new FastPathMatcher();
