/**
 * FASE 2.5: FinancialPulse
 *
 * Market/asset monitoring is intentionally disabled.
 * This module remains as a no-op shim to preserve integrations
 * without generating crypto/asset insights internally.
 */

import type { Store } from '@reduxjs/toolkit';
import type { AssetPrice } from './ExternalDataService';
import { setPreFlightBriefing } from '../../store/slices/aiMemorySlice';

export interface AssetAlert {
  assetId: string;
  type: 'volatility-up' | 'volatility-down' | 'threshold-breach';
  currentPrice: number;
  changePercent: number;
  severity: 'low' | 'medium' | 'high';
  message: string;
  recommendation: string;
}

class FinancialPulse {
  private static instance: FinancialPulse;
  private store: Store | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private currentAlerts: AssetAlert[] = [];

  private constructor() {}

  static getInstance(): FinancialPulse {
    if (!FinancialPulse.instance) {
      FinancialPulse.instance = new FinancialPulse();
    }
    return FinancialPulse.instance;
  }

  /**
   * Initialize financial monitoring
   */
  initialize(store: Store): void {
    this.store = store;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    // Ensure stale alerts from previous sessions are cleared.
    this.currentAlerts = [];
    this.dispatchFinancialAlerts([]);
  }

  /**
   * Check prices of all watched assets
   */
  private async checkAssets(): Promise<void> {
    this.currentAlerts = [];
  }

  /**
   * Dispatch asset alerts to Redux
   */
  private dispatchFinancialAlerts(alerts: AssetAlert[]): void {
    if (!this.store) return;

    const dispatch = this.store.dispatch as any;

    // Dispatch to aiMemorySlice for briefing integration
    dispatch(
      setPreFlightBriefing({
        generatedAt: Date.now(),
        assetAlerts: alerts,
      })
    );
  }

  /**
   * Get current asset prices
   */
  getAssetSnapshot(): AssetPrice[] {
    return [];
  }

  /**
   * Get current alerts
   */
  getAlerts(): AssetAlert[] {
    return [...this.currentAlerts];
  }

  /**
   * Cleanup
   */
  destroy(): void {
    if (this.pollInterval) {
      clearInterval(this.pollInterval);
      this.pollInterval = null;
    }
  }
}

export const financialPulse = FinancialPulse.getInstance();

export function initializeFinancialPulse(store: Store): void {
  financialPulse.initialize(store);
}

export function getFinancialPulse(): FinancialPulse {
  return financialPulse;
}
