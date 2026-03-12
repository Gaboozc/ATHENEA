import type { Middleware } from '@reduxjs/toolkit';
import {
  logSessionAction,
  setCurrentScreen,
  setLastHubVisited,
  markOmnibarOpened,
  markOmnibarClosed,
  markOmnibarInput,
  registerCancellation,
  registerTaskCompletion,
  registerError,
} from '../slices/aiMemorySlice';

const IGNORE_PREFIXES = ['persist/', 'aiMemory/'];

function shortPreview(payload: unknown): string {
  try {
    const text = JSON.stringify(payload);
    return text.length > 140 ? `${text.slice(0, 140)}...` : text;
  } catch {
    return 'unserializable-payload';
  }
}

export const aiObserverMiddleware: Middleware = (store) => {
  return (next) => (action: any) => {
    const type = String(action?.type || 'unknown');
    const shouldIgnore = IGNORE_PREFIXES.some((prefix) => type.startsWith(prefix));
    const now = Date.now();

    const result = next(action);

    if (shouldIgnore) {
      return result;
    }

    let sessionResult: 'success' | 'error' | 'validation_error' | 'cancelled' | 'info' = 'success';
    let sessionPriority: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';

    const isFailure =
      type.endsWith('/rejected') ||
      type.includes('error') ||
      Boolean(action?.error) ||
      Boolean(action?.payload?.validationError) ||
      Boolean(action?.payload?.errors);

    if (isFailure) {
      sessionResult = action?.payload?.validationError || action?.payload?.errors
        ? 'validation_error'
        : 'error';
      sessionPriority = 'HIGH';
      store.dispatch(registerError());
    }

    if (type.includes('cancel') || type.endsWith('/cancel')) {
      sessionResult = 'cancelled';
      sessionPriority = 'MEDIUM';
      store.dispatch(registerCancellation());
    }

    store.dispatch(
      logSessionAction({
        type,
        timestamp: now,
        result: sessionResult,
        priority: sessionPriority,
        payloadPreview: shortPreview(action?.payload),
      })
    );

    if (type === 'tasks/complete' || type === 'tasks/completeTask') {
      store.dispatch(registerTaskCompletion());
    }

    if (type === 'aiObserver/omnibarOpened') {
      store.dispatch(markOmnibarOpened({ at: now }));
    }

    if (type === 'aiObserver/omnibarClosed') {
      store.dispatch(markOmnibarClosed());
    }

    if (type === 'aiObserver/omnibarInputChanged') {
      store.dispatch(markOmnibarInput({ at: now, text: String(action?.payload?.text || '') }));
    }

    const screen = String(
      action?.payload?.pathname ||
      action?.payload?.route ||
      action?.payload?.screen ||
      ''
    );
    if (type.includes('route/') || type.includes('navigation/') || type === '@@router/LOCATION_CHANGE' || screen) {
      store.dispatch(setCurrentScreen({ screen: screen || 'unknown' }));
    }

    const payloadHub = action?.payload?.hub;
    if (payloadHub === 'WorkHub' || payloadHub === 'PersonalHub' || payloadHub === 'FinanceHub') {
      store.dispatch(setLastHubVisited({ hub: payloadHub }));
    }

    if (type === 'aiObserver/hubVisited') {
      const hub = action?.payload?.hub;
      if (hub === 'WorkHub' || hub === 'PersonalHub' || hub === 'FinanceHub') {
        store.dispatch(setLastHubVisited({ hub }));
      }
    }

    return result;
  };
};

export default aiObserverMiddleware;
