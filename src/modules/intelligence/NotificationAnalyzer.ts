import type { ParsedNotification } from './NotificationParser';

export type InterceptActionType = 'register-expense' | 'schedule-event' | 'none';
export type InterceptUrgency = 'low' | 'medium' | 'high' | 'critical';

export interface NotificationInsight {
  id: string;
  appName: string;
  packageName: string;
  category: 'finance' | 'agenda' | 'other';
  summary: string;
  amount?: number;
  currency?: string;
  merchant?: string;
  temporalHint?: string;
  actionable: boolean;
  actionType: InterceptActionType;
  urgency: InterceptUrgency;
  silent: boolean;
}

const APPS_OF_INTEREST: Record<string, 'bank' | 'calendar' | 'delivery' | 'chat' | 'other'> = {
  'com.whatsapp': 'chat',
  'com.google.android.calendar': 'calendar',
  'com.google.android.apps.walletnfcrel': 'bank',
  'com.paypal.android.p2pmobile': 'bank',
  'com.ubercab': 'delivery',
  'com.didi.passenger': 'delivery',
};

const FINANCE_TRIGGER = /\$|usd|mxn|eur|compra|pago|retiro|transferencia|cargo|debito|credito/i;
const AGENDA_TRIGGER = /reunion|reunión|hoy\s+a\s+las|link|cita|meet|zoom/i;
const MERCHANT_HINT = /(?:en|a|comercio|tienda|merchant)\s+([a-z0-9 .'-]{3,40})/i;
const TIME_HINT = /(hoy\s+a\s+las\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|mañana\s+a\s+las\s+\d{1,2}(?::\d{2})?\s*(?:am|pm)?|\d{1,2}:\d{2}\s*(?:am|pm)?)/i;

const CRITICAL_FINANCE_AMOUNT = 250;

export function analyzeNotification(
  parsed: ParsedNotification,
  context?: {
    currentZone?: string | null;
    batteryLevel?: number | null;
    focusedMode?: boolean;
    knownCommerceKeywords?: string[];
  }
): NotificationInsight {
  const appType = APPS_OF_INTEREST[parsed.packageName] || 'other';
  const normalizedText = parsed.fullText.toLowerCase();
  const batteryCritical = (context?.batteryLevel ?? 100) < 10;

  const financeByPattern = FINANCE_TRIGGER.test(normalizedText);
  const agendaByPattern = AGENDA_TRIGGER.test(normalizedText);

  const merchant = extractMerchant(parsed.fullText);
  const temporalHint = extractTemporalHint(parsed.fullText);

  const knownCommerceHit = Boolean(
    merchant &&
      (context?.knownCommerceKeywords || []).some((keyword) =>
        merchant.toLowerCase().includes(String(keyword).toLowerCase())
      )
  );

  if (parsed.category === 'finance' || financeByPattern) {
    const amountChunk =
      typeof parsed.amount === 'number'
        ? `${parsed.currency || 'USD'} ${parsed.amount.toFixed(2)}`
        : 'monto no identificado';

    const inKnownZone = Boolean(context?.currentZone);
    const priorityBoostByLocation = inKnownZone && knownCommerceHit;
    const isLargeExpense = typeof parsed.amount === 'number' && parsed.amount >= CRITICAL_FINANCE_AMOUNT;

    let urgency: InterceptUrgency = context?.focusedMode ? 'medium' : 'high';
    if (isLargeExpense || priorityBoostByLocation) {
      urgency = 'critical';
    }
    if (batteryCritical && urgency !== 'critical') {
      return silentInsight(parsed, 'Bateria critica: notificacion financiera no critica silenciada.');
    }

    const locationHint = priorityBoostByLocation
      ? ' en comercio conocido de tu zona actual'
      : inKnownZone
      ? ' cerca de una zona operativa'
      : '';

    const merchantChunk = merchant ? ` en ${merchant}` : '';

    return {
      id: parsed.id,
      appName: parsed.appName,
      packageName: parsed.packageName,
      category: 'finance',
      summary: `Detecte un gasto potencial de ${amountChunk}${merchantChunk}${locationHint}.`,
      amount: parsed.amount,
      currency: parsed.currency,
      merchant,
      actionable: true,
      actionType: 'register-expense',
      urgency,
      silent: false,
    };
  }

  if (parsed.category === 'agenda' || agendaByPattern) {
    let urgency: InterceptUrgency = temporalHint?.toLowerCase().includes('hoy') ? 'high' : 'medium';
    if (context?.focusedMode && urgency !== 'high') {
      urgency = 'low';
    }

    if (batteryCritical) {
      return silentInsight(parsed, 'Bateria critica: alerta de agenda no critica silenciada.');
    }

    return {
      id: parsed.id,
      appName: parsed.appName,
      packageName: parsed.packageName,
      category: 'agenda',
      summary: `Interceptacion de agenda detectada${temporalHint ? ` (${temporalHint})` : ''}.`,
      temporalHint,
      actionable: true,
      actionType: 'schedule-event',
      urgency,
      silent: false,
    };
  }

  // Silent priority: if not relevant, log quietly and do not interrupt.
  if (batteryCritical) {
    return silentInsight(parsed, 'Bateria critica: ruido no tactico bloqueado por ahorro de energia.');
  }

  return silentInsight(
    parsed,
    appType === 'delivery'
      ? 'Notificacion de transporte detectada sin accion inmediata.'
      : 'Notificacion interceptada sin entidad tactica relevante.'
  );
}

function extractMerchant(text: string): string | undefined {
  const match = text.match(MERCHANT_HINT);
  const value = match?.[1]?.trim();
  return value ? value.replace(/\s+/g, ' ') : undefined;
}

function extractTemporalHint(text: string): string | undefined {
  const match = text.match(TIME_HINT);
  return match?.[1]?.trim();
}

function silentInsight(parsed: ParsedNotification, summary: string): NotificationInsight {
  return {
    id: parsed.id,
    appName: parsed.appName,
    packageName: parsed.packageName,
    category: 'other',
    summary,
    actionable: false,
    actionType: 'none',
    urgency: 'low',
    silent: true,
  };
}
