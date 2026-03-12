import type { InterceptedNotificationPayload } from '../../services/notificationListenerBridge';

export type InterceptCategory = 'finance' | 'agenda' | 'other';

export interface ParsedNotification {
  id: string;
  packageName: string;
  appName: string;
  title: string;
  text: string;
  fullText: string;
  category: InterceptCategory;
  detectedAt: number;
  amount?: number;
  currency?: string;
  matchedKeywords: string[];
}

const FINANCE_KEYWORDS = [
  'compra',
  'pago',
  'transferencia',
  'usd',
  'mxn',
  '$',
  'cargo',
  'debito',
  'credito',
  'banco',
];

const AGENDA_KEYWORDS = [
  'reunion',
  'reunión',
  'zoom',
  'google meet',
  'meet',
  'cita',
  'calendar',
  'evento',
  'appointment',
];

const AMOUNT_PATTERNS = [
  /(?:\$|usd\s*)(\d+(?:[.,]\d{1,2})?)/i,
  /(\d+(?:[.,]\d{1,2})?)\s*(?:usd|mxn|eur)/i,
];

export function parseNotification(raw: InterceptedNotificationPayload): ParsedNotification {
  const fullText = `${raw.title || ''} ${raw.text || ''}`.trim();
  const normalized = fullText.toLowerCase();

  const matchedFinance = FINANCE_KEYWORDS.filter((keyword) => normalized.includes(keyword));
  const matchedAgenda = AGENDA_KEYWORDS.filter((keyword) => normalized.includes(keyword));

  let category: InterceptCategory = 'other';
  if (matchedFinance.length > 0) {
    category = 'finance';
  } else if (matchedAgenda.length > 0) {
    category = 'agenda';
  }

  const amountInfo = extractAmount(fullText);

  return {
    id: raw.id,
    packageName: raw.packageName,
    appName: raw.appName,
    title: raw.title,
    text: raw.text,
    fullText,
    category,
    detectedAt: raw.postedAt || Date.now(),
    amount: amountInfo.amount,
    currency: amountInfo.currency,
    matchedKeywords: [...matchedFinance, ...matchedAgenda],
  };
}

function extractAmount(text: string): { amount?: number; currency?: string } {
  for (const pattern of AMOUNT_PATTERNS) {
    const match = text.match(pattern);
    if (!match?.[1]) continue;

    const amount = Number(match[1].replace(',', '.'));
    if (!Number.isFinite(amount)) continue;

    const lower = text.toLowerCase();
    if (lower.includes('mxn')) return { amount, currency: 'MXN' };
    if (lower.includes('eur')) return { amount, currency: 'EUR' };
    return { amount, currency: 'USD' };
  }

  return {};
}
