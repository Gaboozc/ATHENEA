/**
 * FASE 3: The Auditor Agent (Jarvis Style)
 * 
 * Mission: Financial health and resource protection
 * Focus: Analyzes intercepted spending, market volatility, savings goals
 * Voice: Analytical, refined, asset-protective
 * 
 * The Auditor believes in:
 * - Capital preservation above all
 * - Data-driven financial decisions
 * - Long-term wealth accumulation
 */

import type {
  Agent,
  AgentType,
  AgentStatus,
  AgentContext,
  AgentVerdict,
  VerdictPriority
} from './types';
import { isPriorityAtLeast } from './types';

export class AuditorAgent implements Agent {
  readonly type: AgentType = 'auditor';
  readonly name = 'The Auditor';
  readonly colorCode = '#FFD700'; // Financial gold

  private status: AgentStatus = 'idle';
  private lastAnalysis: AgentVerdict | null = null;

  async analyze(context: AgentContext): Promise<AgentVerdict> {
    this.status = 'analyzing';

    const priority = this.calculatePriority(context);
    const confidence = this.calculateConfidence(context);
    const verdict = this.generateVerdict(context);

    // Check for conflicts with Strategist
    const conflictsWith: AgentType[] = [];
    if (
      context.blackBox.isAusterityActive &&
      context.workHub.criticalTasks > 0
    ) {
      // Austerity may conflict with Strategist's urgency
      conflictsWith.push('strategist');
    }

    this.lastAnalysis = {
      agentType: this.type,
      priority,
      confidence,
      timestamp: Date.now(),
      verdict,
      conflictsWith: conflictsWith.length > 0 ? conflictsWith : undefined,
    };

    this.status = isPriorityAtLeast(priority, 'HIGH') ? 'conflict' : 'ready';
    return this.lastAnalysis;
  }

  shouldActivate(context: AgentContext): boolean {
    // Activate if:
    // 1. Budget is approaching limit or exceeded
    // 2. Austerity protocol is active
    // 3. Recent spendings detected
    // 4. Market volatility detected
    return (
      context.financeHub.budgetStatus !== 'on-track' ||
      context.blackBox.isAusterityActive ||
      context.financeHub.recentSpendings.length > 0 ||
      (context.externalData.market?.assetAlerts?.length ?? 0) > 0
    );
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  private calculatePriority(context: AgentContext): VerdictPriority {
    // CRITICAL: Budget exceeded + Austerity active
    if (
      context.financeHub.budgetStatus === 'exceeded' &&
      context.blackBox.isAusterityActive
    ) {
      return 'CRITICAL';
    }

    // HIGH: Austerity active OR budget exceeded OR major market downturn
    if (
      context.blackBox.isAusterityActive ||
      context.financeHub.budgetStatus === 'exceeded' ||
      (context.externalData.market?.averageChange ?? 0) < -7
    ) {
      return 'HIGH';
    }

    // MEDIUM: Budget approaching limit OR moderate market volatility
    if (
      context.financeHub.budgetStatus === 'approaching-limit' ||
      (context.externalData.market?.averageChange ?? 0) < -3
    ) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  private calculateConfidence(context: AgentContext): number {
    let confidence = 0.6; // Base confidence (finance is more deterministic)

    // Increase confidence with market data
    if (context.externalData.market?.assetAlerts?.length) {
      confidence += 0.2;
    }

    // Increase confidence with spending history
    if (context.financeHub.recentSpendings.length >= 3) {
      confidence += 0.1;
    }

    // Increase confidence if BlackBox has market correlation data
    if (context.blackBox.marketImpact?.confidence) {
      confidence += context.blackBox.marketImpact.confidence * 0.1;
    }

    return Math.min(confidence, 1);
  }

  private generateVerdict(context: AgentContext): AgentVerdict['verdict'] {
    const dataSource: string[] = ['FinanceHub'];
    
    if (context.externalData.market) dataSource.push('MarketData');
    if (context.blackBox.isAusterityActive) dataSource.push('AusterityProtocol');
    if (context.blackBox.marketImpact) dataSource.push('BlackBox-MarketCorrelation');

    // CRITICAL: Budget exceeded + Market crash
    if (
      context.financeHub.budgetStatus === 'exceeded' &&
      (context.externalData.market?.averageChange ?? 0) < -7
    ) {
      return {
        summary: 'CRISIS FINANCIERA - Modo de emergencia activado',
        reasoning: `Presupuesto comprometido (${context.financeHub.budgetStatus}) mientras el mercado cae ${context.externalData.market?.averageChange?.toFixed(1)}%. Capital en riesgo crítico.`,
        recommendation: 'CONGELAMIENTO INMEDIATO de gastos discrecionales. Revisar todos los pagos pendientes. Activar plan de contingencia financiera. No realizar compras mayores hasta nueva orden.',
        dataSource,
      };
    }

    // HIGH: Austerity Protocol active conflict
    if (context.blackBox.isAusterityActive && context.workHub.criticalTasks > 0) {
      const marketState = context.blackBox.marketImpact?.state || 'bear';
      return {
        summary: 'CONFLICTO DETECTADO - Austeridad vs Operaciones',
        reasoning: `Protocolo de Austeridad activo (mercado: ${marketState}), pero Strategist reporta ${context.workHub.criticalTasks} tareas críticas que pueden requerir inversión.`,
        recommendation: 'Solicito autorización explícita para cualquier gasto relacionado con misión crítica. Evaluar cada compromiso financiero caso por caso. Priorizar ROI inmediato.',
        dataSource,
      };
    }

    // Market volatility alert
    if ((context.externalData.market?.assetAlerts?.length ?? 0) >= 2) {
      const topAlert = context.externalData.market?.assetAlerts?.[0];
      const assetId = topAlert?.assetId || 'activos';
      const change = topAlert?.changePercent || 0;
      
      return {
        summary: `Volatilidad de mercado - ${assetId} ${change > 0 ? 'sube' : 'cae'} ${Math.abs(change).toFixed(1)}%`,
        reasoning: `Detecté ${context.externalData.market?.assetAlerts?.length} alertas de activos vigilados. El portafolio está experimentando movimientos significativos.`,
        recommendation:
          change < 0
            ? 'Recomiendo cautela en nuevas inversiones. Considere revisar posiciones en riesgo. Mantener liquidez para oportunidades de compra si la caída continúa.'
            : 'El mercado favorece sus posiciones. Considere tomar ganancias parciales en activos que superaron objetivos. Reinvertir en posiciones más conservadoras.',
        dataSource,
      };
    }

    /* WALLETS-10: USD sin convertir por mucho tiempo */
    if (
      (context.financeHub.walletUSD ?? 0) > 500 &&
      (context.financeHub.daysSinceLastConversion ?? 0) > 14
    ) {
      return {
        summary: `USD estático — ${context.financeHub.daysSinceLastConversion} días sin convertir`,
        reasoning: `Tienes $${(context.financeHub.walletUSD ?? 0).toFixed(2)} USD sin convertir hace ${context.financeHub.daysSinceLastConversion} días. El tipo de cambio puede haber cambiado significativamente.`,
        recommendation: `Evalúa si el tipo de cambio actual es favorable. Si el MXN se depreció, convertir ahora puede ser ventajoso. Usa la pantalla de Billeteras para registrar la conversión.`,
        dataSource,
      };
    }

    /* WALLETS-10: Saldo MXN bajo pero hay USD disponible */
    if (
      (context.financeHub.walletMXN ?? 0) < 1000 &&
      (context.financeHub.walletUSD ?? 0) > 100
    ) {
      return {
        summary: `Saldo MXN bajo — tienes USD disponibles para convertir`,
        reasoning: `Saldo MXN: $${(context.financeHub.walletMXN ?? 0).toFixed(2)} MXN. Tienes $${(context.financeHub.walletUSD ?? 0).toFixed(2)} USD disponibles.`,
        recommendation: `Considera convertir parte de tus USD a MXN para cubrir gastos inmediatos. Registra la conversión en Billeteras con la tasa actual.`,
        dataSource,
      };
    }

    /* WALLETS-10: Presupuesto USD excedido */
    if (context.financeHub.budgetUSD?.status === 'exceeded') {
      return {
        summary: `Presupuesto USD excedido este mes`,
        reasoning: `Gastaste $${context.financeHub.budgetUSD.totalSpent.toFixed(2)} de $${context.financeHub.budgetUSD.totalLimit.toFixed(2)} USD este mes.`,
        recommendation: `Revisa los gastos USD de este mes. Evita nuevos gastos en dólares hasta el próximo ciclo.`,
        dataSource,
      };
    }

    /* WALLETS-10: Presupuesto MXN al límite */
    if (context.financeHub.budgetMXN?.status === 'approaching-limit') {
      return {
        summary: `Presupuesto MXN al ${100 - (context.financeHub.budgetMXN?.healthPct ?? 100)}% del límite`,
        reasoning: `Presupuesto MXN: $${context.financeHub.budgetMXN.totalSpent.toFixed(2)} gastados de $${context.financeHub.budgetMXN.totalLimit.toFixed(2)} MXN este mes.`,
        recommendation: `Reduce gastos MXN discrecionales. Quedan $${context.financeHub.budgetMXN.available.toFixed(2)} MXN disponibles en presupuesto.`,
        dataSource,
      };
    }

    // F-FIX-5: Query de gasto específico — si el contexto trae un monto a consultar
    if (context.financeHub.queryAmount != null && context.financeHub.saldoLibre !== undefined) {
      const queryAmt = context.financeHub.queryAmount;
      const saldo = context.financeHub.saldoLibre;
      const canSpend = saldo >= queryAmt;
      return {
        summary: canSpend
          ? `Sí puedes gastar $${queryAmt.toFixed(2)}`
          : `No recomendado — fondos insuficientes`,
        reasoning: canSpend
          ? `Saldo libre actual: $${saldo.toFixed(2)}. Después del gasto quedarían: $${(saldo - queryAmt).toFixed(2)}.`
          : `Saldo libre actual: $${saldo.toFixed(2)}, insuficiente para cubrir $${queryAmt.toFixed(2)}.`,
        recommendation: canSpend
          ? `Gasto aprobado. Quedarían $${(saldo - queryAmt).toFixed(2)} disponibles.`
          : `Posponer el gasto o reducir otro compromiso primero.`,
        dataSource,
      };
    } /* F-FIX-5 */

    // Budget warning
    if (context.financeHub.budgetStatus === 'approaching-limit') {
      const recentSpending = context.financeHub.recentSpendings
        .slice(0, 3)
        .reduce((sum, s) => sum + s.amount, 0);

      return {
        summary: 'Advertencia presupuestaria - Límite alcanzándose',
        reasoning: `Presupuesto al límite. Saldo libre: $${
          context.financeHub.saldoLibre?.toFixed(2) ?? '—'
        }. Ingresos del mes: $${
          context.financeHub.ingresos?.toFixed(2) ?? '—'
        }. Gastos recientes: $${recentSpending.toFixed(2)}. ${context.financeHub.pendingPayments} pagos pendientes.`, /* F-FIX-5 */
        recommendation: 'Reducir gastos discrecionales en las próximas 2 semanas. Revisar suscripciones innecesarias. Posponer compras no urgentes hasta el próximo ciclo.',
        dataSource,
      };
    }

    // Routine financial health check
    const spendingRate = context.financeHub.recentSpendings.length > 0 ? 'activo' : 'controlado';
    return {
      summary: `Salud financiera: ${context.financeHub.budgetStatus}`,
      reasoning: `Finanzas estables. Saldo libre: $${
        context.financeHub.saldoLibre?.toFixed(2) ?? '—'
      }. Compromisos de ahorro: $${
        context.financeHub.commitedGoalSavings?.toFixed(2) ?? '—'
      }/mes. Ritmo de gasto: ${spendingRate}.`, /* F-FIX-5 */
      recommendation:
        context.financeHub.budgetStatus === 'on-track'
          ? 'Perfil financiero óptimo. Puede considerar inversiones estratégicas si el Strategist las justifica para misiones críticas.'
          : 'Mantener vigilancia en gastos. Cualquier nueva inversión debe justificar retorno de valor claro.',
      dataSource,
    };
  }
}
