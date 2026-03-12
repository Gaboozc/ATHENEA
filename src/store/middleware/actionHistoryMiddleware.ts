import type { Middleware } from '@reduxjs/toolkit';
import { appendActionHistoryEntry } from '../slices/aiMemorySlice';

const ACTION_HISTORY_RECORD = 'actionHistory/record';

type AgentLabel = 'Jarvis' | 'Cortana' | 'Shodan' | 'user';

const ALLOWED_AGENTS: AgentLabel[] = ['Jarvis', 'Cortana', 'Shodan', 'user'];

function inferAgent(payload: any): AgentLabel {
  const explicit = String(payload?.agent || '').trim();
  if ((ALLOWED_AGENTS as string[]).includes(explicit)) {
    return explicit as AgentLabel;
  }

  const source = `${payload?.hub || ''} ${payload?.actionType || ''} ${payload?.reduxActionType || ''} ${payload?.description || ''}`
    .toLowerCase();

  if (/jarvis|auditor|finance|budget|expense|payment|debt|goal|austerity|intercept/.test(source)) {
    return 'Jarvis';
  }

  if (/cortana|strategist|task|project|calendar|event|todo|work|schedule/.test(source)) {
    return 'Cortana';
  }

  if (/shodan|vitals|habit|routine|health|sleep|fatigue|biometric/.test(source)) {
    return 'Shodan';
  }

  return 'user';
}

export const actionHistoryMiddleware: Middleware = (store) => {
  return (next) => (action: any) => {
    if (action?.type !== ACTION_HISTORY_RECORD) {
      return next(action);
    }

    const payload = action?.payload || {};
    const entry = {
      id: payload.id || `action_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`,
      timestamp: payload.timestamp || new Date().toISOString(),
      type: payload.type || 'user-command',
      hub: payload.hub || 'CrossHub',
      actionType: String(payload.actionType || 'unknown'),
      description: String(payload.description || 'Action executed'),
      reduxActionType: payload.reduxActionType,
      payload: payload.payload,
      agent: inferAgent(payload),
      success: Boolean(payload.success),
    };

    store.dispatch(appendActionHistoryEntry(entry));

    return next({
      ...action,
      payload: entry,
    });
  };
};

export default actionHistoryMiddleware;
