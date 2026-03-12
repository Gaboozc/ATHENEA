/**
 * FASE 2.6: Austerity Protocol
 * 
 * Adaptive financial behavior controller that responds to market volatility.
 * When BlackBox detects significant market downturn (bear market conditions),
 * this protocol adjusts ATHENEA's financial suggestions to be more conservative.
 * 
 * Behaviors:
 * - Filter out non-essential spending suggestions in FinanceHub
 * - Prioritize savings/investment review tasks
 * - Adjust PersonaEngine tone to be more cautious about expenditures
 * - Generate tactical advisories when user attempts high-value transactions
 * 
 * Activation Criteria:
 * - Average asset change < -5%
 * - 2+ high-severity negative alerts
 * - BlackBox correlation shows bear market pattern
 * 
 * Deactivation:
 * - Market recovers above -3% average
 * - User manually overrides in Settings
 */

import type { Store, Unsubscribe } from '@reduxjs/toolkit';
import { getBlackBox } from './BlackBox';
import { registerTacticalEvent } from './TacticalObserver';

export interface AusterityState {
  isActive: boolean;
  activatedAt: number;
  reason: string;
  restrictionLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  suggestedActions: string[];
}

class AusterityProtocol {
  private static instance: AusterityProtocol;
  private store: Store | null = null;
  private unsubscribe: Unsubscribe | null = null;
  private lastAusterityState = false;
  private lastCheckAt = 0;
  private readonly CHECK_INTERVAL_MS = 1000 * 60 * 5; // Check every 5 minutes

  private constructor() {}

  static getInstance(): AusterityProtocol {
    if (!AusterityProtocol.instance) {
      AusterityProtocol.instance = new AusterityProtocol();
    }
    return AusterityProtocol.instance;
  }

  initialize(store: Store): void {
    if (this.unsubscribe) return;
    this.store = store;
    this.unsubscribe = store.subscribe(() => this.onStateChange());
  }

  shutdown(): void {
    if (this.unsubscribe) {
      this.unsubscribe();
      this.unsubscribe = null;
    }
  }

  private onStateChange(): void {
    if (!this.store) return;

    const now = Date.now();
    if (now - this.lastCheckAt < this.CHECK_INTERVAL_MS) return;
    this.lastCheckAt = now;

    const blackBox = getBlackBox();
    if (!blackBox) return;

    const isActive = blackBox.isAusterityActive();

    // Detect state transition
    if (isActive && !this.lastAusterityState) {
      this.onAusterityActivated();
    } else if (!isActive && this.lastAusterityState) {
      this.onAusterityDeactivated();
    }

    this.lastAusterityState = isActive;
  }

  private onAusterityActivated(): void {
    const state: any = this.store?.getState();
    const briefing = state?.aiMemory?.preFlightBriefing;
    const assetAlerts = briefing?.assetAlerts || [];

    const negativeAssets = assetAlerts
      .filter((alert: any) => alert.changePercent < 0)
      .map((alert: any) => alert.assetId)
      .slice(0, 2)
      .join(', ');

    const reason = negativeAssets
      ? `Mercado en rojo: ${negativeAssets} con caídas significativas.`
      : 'Volatilidad detectada en activos vigilados.';

    // Emit tactical event
    if (this.store) {
      registerTacticalEvent({
        type: 'AUSTERITY_ACTIVATED',
        at: Date.now(),
        meta: {
          reason,
          assets: negativeAssets || 'N/A',
          restrictionLevel: this.calculateRestrictionLevel(assetAlerts),
        },
      });
    }
  }

  private onAusterityDeactivated(): void {
    if (this.store) {
      registerTacticalEvent({
        type: 'AUSTERITY_DEACTIVATED',
        at: Date.now(),
        meta: {
          reason: 'Mercado estabilizado. Protocolo de Austeridad suspendido.',
        },
      });
    }
  }

  private calculateRestrictionLevel(assetAlerts: any[]): 'LOW' | 'MEDIUM' | 'HIGH' {
    if (assetAlerts.length === 0) return 'LOW';

    const avgChange = assetAlerts.reduce((sum: number, alert: any) => sum + (alert.changePercent || 0), 0) / assetAlerts.length;
    const highSeverityCount = assetAlerts.filter((alert: any) => alert.severity === 'high').length;

    if (avgChange < -10 || highSeverityCount >= 3) return 'HIGH';
    if (avgChange < -7 || highSeverityCount >= 2) return 'MEDIUM';
    return 'LOW';
  }

  /**
   * Public API: Get current austerity state
   */
  getAusterityState(): AusterityState {
    const blackBox = getBlackBox();
    if (!blackBox) {
      return {
        isActive: false,
        activatedAt: 0,
        reason: '',
        restrictionLevel: 'LOW',
        suggestedActions: [],
      };
    }

    const isActive = blackBox.isAusterityActive();
    const activatedAt = blackBox.getAusterityActivatedAt();

    if (!isActive) {
      return {
        isActive: false,
        activatedAt: 0,
        reason: '',
        restrictionLevel: 'LOW',
        suggestedActions: [],
      };
    }

    const state: any = this.store?.getState();
    const briefing = state?.aiMemory?.preFlightBriefing;
    const assetAlerts = briefing?.assetAlerts || [];

    const restrictionLevel = this.calculateRestrictionLevel(assetAlerts);
    const reason = this.generateAusterityReason(assetAlerts);
    const suggestedActions = this.generateSuggestedActions(restrictionLevel);

    return {
      isActive,
      activatedAt,
      reason,
      restrictionLevel,
      suggestedActions,
    };
  }

  private generateAusterityReason(assetAlerts: any[]): string {
    if (assetAlerts.length === 0) return 'Protocolo activo por volatilidad histórica.';

    const negativeAlerts = assetAlerts.filter((alert: any) => alert.changePercent < 0);
    if (negativeAlerts.length === 0) return 'Mercado estable, reevaluando condiciones.';

    const worstAsset = negativeAlerts.reduce((worst: any, alert: any) => 
      alert.changePercent < worst.changePercent ? alert : worst
    );

    return `Mercado en rojo. ${worstAsset.assetId} cayó ${Math.abs(worstAsset.changePercent).toFixed(1)}%. Recomiendo cautela en gastos no esenciales.`;
  }

  private generateSuggestedActions(level: 'LOW' | 'MEDIUM' | 'HIGH'): string[] {
    const actions = [
      'Revisar gastos no esenciales en FinanceHub',
      'Priorizar tareas de ahorro programadas',
    ];

    if (level === 'MEDIUM' || level === 'HIGH') {
      actions.push(
        'Posponer compras mayores planificadas',
        'Revisar liquidez disponible y fondos de emergencia'
      );
    }

    if (level === 'HIGH') {
      actions.push(
        'Evaluar rebalanceo de portafolio con asesor',
        'Activar alertas de gasto en categorías discrecionales'
      );
    }

    return actions;
  }

  /**
   * Check if a spending should be flagged based on austerity
   */
  shouldFlagSpending(amount: number, category: string): boolean {
    const austerity = this.getAusterityState();
    if (!austerity.isActive) return false;

    const discretionaryCategories = ['entertainment', 'dining', 'shopping', 'travel', 'luxury'];
    const isDiscretionary = discretionaryCategories.some(cat => category.toLowerCase().includes(cat));

    if (austerity.restrictionLevel === 'HIGH') {
      return amount > 500 || isDiscretionary;
    }

    if (austerity.restrictionLevel === 'MEDIUM') {
      return (amount > 1000 && isDiscretionary) || amount > 5000;
    }

    // LOW level
    return amount > 10000 || (amount > 2000 && isDiscretionary);
  }
}

let austerityInstance: AusterityProtocol | null = null;

export function initializeAusterityProtocol(store: Store): AusterityProtocol {
  if (!austerityInstance) {
    austerityInstance = AusterityProtocol.getInstance();
  }
  austerityInstance.initialize(store);
  return austerityInstance;
}

export function getAusterityProtocol(): AusterityProtocol | null {
  return austerityInstance;
}
