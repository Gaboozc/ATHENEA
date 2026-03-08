/**
 * ATHENEA Intelligence Parser
 * 
 * Utilities for:
 * 1. Analyzing user intent (keyword extraction)
 * 2. Extracting parameters from natural language
 * 3. Validating extracted values
 * 4. Smart parameter resolution with context awareness
 */

import { SkillParam } from '../types';
import { enrichParameters, type SmartResolverContext } from './smartResolver';

/**
 * Extract parameters from user input based on skill definition
 * 
 * Examples:
 * - "create note titled 'My Plans' with tags #personal #goals"
 * - "add task 'Fix bug #123' to Project Alpha, due tomorrow, 3 hours"
 * - "spent $45.50 on coffee with cash"
 * - "set a reminder to buy milk at 5pm tomorrow"
 * 
 * Now includes Smart Resolution:
 * - Resolves "tomorrow" to actual Date objects
 * - Automatically finds entity IDs (e.g., payment ID for "liquidar deuda")
 * - Infers missing parameters from context
 */
export function extractParameters(
  userPrompt: string,
  paramSchema: Record<string, SkillParam>,
  context?: SmartResolverContext
): Record<string, any> {
  const result: Record<string, any> = {};
  const lowerPrompt = userPrompt.toLowerCase();

  // Step 1: Basic extraction
  for (const [paramId, paramDef] of Object.entries(paramSchema)) {
    const value = extractParameterValue(paramId, userPrompt, lowerPrompt, paramDef);
    
    if (value !== undefined) {
      result[paramId] = value;
    }
  }

  // Step 2: Smart enrichment if context is provided
  if (context) {
    return enrichParameters(result, paramSchema, context);
  }

  return result;
}

/**
 * Extract a single parameter value from user input
 */
function extractParameterValue(
  paramId: string,
  userPrompt: string,
  lowerPrompt: string,
  paramDef: SkillParam
): any {
  switch (paramDef.type) {
    case 'string':
      return extractStringValue(paramId, userPrompt, lowerPrompt);
    
    case 'number':
      return extractNumberValue(userPrompt);
    
    case 'date':
      return extractDateValue(userPrompt);
    
    case 'boolean':
      return extractBooleanValue(userPrompt);
    
    case 'select':
      return extractSelectValue(paramId, lowerPrompt, paramDef.enum || []);
    
    default:
      return undefined;
  }
}

/**
 * Extract string values
 * Looks for quoted strings or patterns like "titled X" or "description: X"
 */
function extractStringValue(paramId: string, userPrompt: string, lowerPrompt: string): string | undefined {
  // Try quoted strings first
  const quotedMatch = userPrompt.match(/["']([^"']+)["']/);
  if (quotedMatch) return quotedMatch[1];

  // Try pattern matching for common parameter names
  const patterns: Record<string, RegExp> = {
    title: /titled\s+([^\,\.]+)/i,
    description: /description[:\s]+([^\,\.]+)/i,
    text: /text[:\s]+([^\,\.]+)/i,
    content: /content[:\s]+([^\,\.]+)/i,
    name: /named\s+([^\,\.]+)/i,
  };

  const pattern = patterns[paramId];
  if (pattern) {
    const match = userPrompt.match(pattern);
    if (match) return match[1].trim();
  }

  return undefined;
}

/**
 * Extract numeric values
 * Handles currency ($45.50), regular numbers (3, 100)
 */
function extractNumberValue(userPrompt: string): number | undefined {
  // Try currency pattern first ($45.50)
  const currencyMatch = userPrompt.match(/[\$£€]?\s*(\d+\.?\d*)/);
  if (currencyMatch) {
    return parseFloat(currencyMatch[1]);
  }

  // Try plain number
  const numberMatch = userPrompt.match(/\b(\d+(?:\.\d+)?)\b/);
  if (numberMatch) {
    return parseFloat(numberMatch[1]);
  }

  return undefined;
}

/**
 * Extract dates
 * Handles various date formats: "tomorrow", "next Monday", "03/15", "2025-03-15"
 */
function extractDateValue(userPrompt: string): string | undefined {
  const lowerPrompt = userPrompt.toLowerCase();

  // Relative dates
  if (lowerPrompt.includes('today')) {
    return new Date().toISOString().split('T')[0];
  }
  if (lowerPrompt.includes('tomorrow')) {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    return tomorrow.toISOString().split('T')[0];
  }
  if (lowerPrompt.includes('next week')) {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    return nextWeek.toISOString().split('T')[0];
  }

  // ISO date (2025-03-15)
  const isoMatch = userPrompt.match(/(\d{4}-\d{2}-\d{2})/);
  if (isoMatch) return isoMatch[1];

  // US date format (03/15/2025 or 03/15)
  const usMatch = userPrompt.match(/(\d{1,2})\/(\d{1,2})(?:\/(\d{4}))?/);
  if (usMatch) {
    const [, month, day, year] = usMatch;
    const fullYear = year ? parseInt(year) : new Date().getFullYear();
    const dateObj = new Date(fullYear, parseInt(month) - 1, parseInt(day));
    return dateObj.toISOString().split('T')[0];
  }

  return undefined;
}

/**
 * Extract boolean values (yes, no, true, false)
 */
function extractBooleanValue(userPrompt: string): boolean | undefined {
  const lowerPrompt = userPrompt.toLowerCase();
  
  if (/\b(yes|true|enabled|on|ok)\b/.test(lowerPrompt)) return true;
  if (/\b(no|false|disabled|off)\b/.test(lowerPrompt)) return false;
  
  return undefined;
}

/**
 * Extract select/enum values
 */
function extractSelectValue(paramId: string, lowerPrompt: string, enumOptions: string[]): string | undefined {
  for (const option of enumOptions) {
    if (lowerPrompt.includes(option.toLowerCase())) {
      return option;
    }
  }
  return undefined;
}

/**
 * Analyze intent from keywords
 * Returns what the user is trying to do
 */
export function analyzeIntent(userPrompt: string): {
  intent: string;
  confidence: number;
  keywords: string[];
} {
  const lowerPrompt = userPrompt.toLowerCase();

  // Intent patterns
  const intents = [
    {
      name: 'create',
      keywords: ['create', 'new', 'add', 'make', 'start', 'begin'],
      weight: 1.0
    },
    {
      name: 'update',
      keywords: ['update', 'edit', 'change', 'modify', 'set'],
      weight: 0.8
    },
    {
      name: 'delete',
      keywords: ['delete', 'remove', 'clear', 'drop', 'erase'],
      weight: 0.6
    },
    {
      name: 'view',
      keywords: ['show', 'list', 'view', 'see', 'get', 'find'],
      weight: 0.7
    },
    {
      name: 'search',
      keywords: ['search', 'find', 'where', 'look', 'filter'],
      weight: 0.5
    }
  ];

  let bestMatch = { name: 'unknown', weight: 0, found: [] as string[] };

  for (const intent of intents) {
    const found = intent.keywords.filter(kw => lowerPrompt.includes(kw));
    const score = found.length * intent.weight;

    if (score > bestMatch.weight) {
      bestMatch = {
        name: intent.name,
        weight: score,
        found
      };
    }
  }

  const confidence = Math.min(100, Math.round(bestMatch.weight * 40));

  return {
    intent: bestMatch.name,
    confidence: Math.max(0, confidence),
    keywords: bestMatch.found
  };
}

/**
 * Generate a natural language confirmation message
 */
export function generateConfirmationMessage(
  skill: { name: string; icon: string },
  params: Record<string, any>
): string {
  const title = params.title || params.text || params.description || 'item';
  return `${skill.icon} Create ${skill.name.toLowerCase()}: "${title}"?`;
}

/**
 * Validate parameters against schema
 */
export function validateParameters(
  params: Record<string, any>,
  schema: Record<string, SkillParam>
): { isValid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};

  for (const [paramId, paramDef] of Object.entries(schema)) {
    const value = params[paramId];

    // Check required
    if (paramDef.required && (value === undefined || value === '' || value === null)) {
      errors[paramId] = `${paramId} is required`;
      continue;
    }

    // Skip validation if not required and empty
    if (!paramDef.required && (value === undefined || value === '')) {
      continue;
    }

    // Validate type
    switch (paramDef.type) {
      case 'number':
        if (typeof value !== 'number' || isNaN(value)) {
          errors[paramId] = `${paramId} must be a number`;
        }
        break;

      case 'date':
        if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
          errors[paramId] = `${paramId} must be a valid date (YYYY-MM-DD)`;
        }
        break;

      case 'select':
        if (paramDef.enum && !paramDef.enum.includes(value)) {
          errors[paramId] = `${paramId} must be one of: ${paramDef.enum.join(', ')}`;
        }
        break;
    }

    // Custom validation (regex)
    if (paramDef.validation && typeof value === 'string') {
      if (!paramDef.validation.test(value)) {
        errors[paramId] = `${paramId} format is invalid`;
      }
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
}
