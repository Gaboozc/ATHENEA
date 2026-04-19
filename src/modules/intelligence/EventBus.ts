/**
 * FIX 1: EventBus — Decoupled async event system for ATHENEA internals.
 *
 * AgentOrchestrator emits events here instead of calling ActionBridge directly,
 * which breaks the circular import: intelligence → actions → intelligence.
 *
 * Usage:
 *   eventBus.emit('orchestrator:decision', decision);
 *   const off = eventBus.on('orchestrator:decision', handleDecision);
 *   off(); // unsubscribe
 */

import type { OrchestratorDecision } from './agents/types';

// ── Event map ────────────────────────────────────────────────────────────────
interface EventMap {
  /** Emitted when AgentOrchestrator finishes a full evaluation run */
  'orchestrator:decision': OrchestratorDecision;
  /** Emitted when an agent has a proactive, non-user-triggered alert */
  'agent:proactive-alert': {
    agentName: string;
    message: string;
    priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'VETO';
  };
}

type Handler<T> = (data: T) => void;

// ── EventBus class ────────────────────────────────────────────────────────────
class EventBus {
  private listeners: Map<string, Handler<any>[]> = new Map();
  private handlerIds: WeakMap<Handler<any>, string> = new WeakMap();
  private nextHandlerId = 1;

  /**
   * Subscribe to an event. Returns an unsubscribe function.
   */
  on<K extends keyof EventMap>(event: K, handler: Handler<EventMap[K]>): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event)!.push(handler);
    if (!this.handlerIds.has(handler as Handler<any>)) {
      this.handlerIds.set(handler as Handler<any>, `${String(event)}#${this.nextHandlerId++}`);
    }
    return () => {
      const list = this.listeners.get(event);
      if (!list) return;
      const idx = list.indexOf(handler);
      if (idx >= 0) list.splice(idx, 1);
    };
  }

  /**
   * Publish an event to all subscribed handlers.
   */
  emit<K extends keyof EventMap>(event: K, data: EventMap[K]): void {
    const list = this.listeners.get(event) || [];
    for (const handler of list) {
      try {
        handler(data);
      } catch (err) {
        const subscriberId = this.handlerIds.get(handler) || `${String(event)}#unknown`;
        console.error(`[EventBus] Error in handler for "${event}" (subscriber: ${subscriberId}):`, err);
      }
    }
  }

  /**
   * Remove all handlers for a specific event (used in tests / teardown).
   */
  off(event: keyof EventMap): void {
    this.listeners.delete(event);
  }
}

// ── Singleton ─────────────────────────────────────────────────────────────────
export const eventBus = new EventBus();
