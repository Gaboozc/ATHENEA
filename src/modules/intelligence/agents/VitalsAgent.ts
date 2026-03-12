/**
 * FASE 3: The Vitals Agent (Life-Support SHODAN Style)
 * 
 * Mission: Physical and mental wellbeing protection
 * Focus: Analyzes health data and biometrics
 * Voice: Clinical, protective, can VETO other agents
 * 
 * The Vitals Agent believes in:
 * - Human life > All missions
 * - Burnout prevention is non-negotiable
 * - Rest is a strategic resource
 * 
 * VETO POWER: If burnout/collapse is imminent, this agent overrides all others.
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

export class VitalsAgent implements Agent {
  readonly type: AgentType = 'vitals';
  readonly name = 'The Vitals Monitor';
  readonly colorCode = '#00FF41'; // Life-support green

  private status: AgentStatus = 'idle';
  private lastAnalysis: AgentVerdict | null = null;
  private resolveThresholds(context: AgentContext) {
    const targetSleepHours = Number(context.userBaselines?.targetSleepHours ?? 7.5);
    const workHourLimit = Number(context.userBaselines?.workHourLimit ?? 8);

    return {
      sleepVetoHours: Math.max(3.5, Number((targetSleepHours - 2.5).toFixed(1))),
      sleepHighRiskHours: Math.max(4.5, Number((targetSleepHours - 1.5).toFixed(1))),
      sleepMediumRiskHours: Math.max(5.5, Number((targetSleepHours - 0.7).toFixed(1))),
      batteryVetoLevel: workHourLimit > 10 ? 14 : 10,
      batteryWarningLevel: workHourLimit > 10 ? 20 : 15,
      workHourLimit,
      targetSleepHours,
    };
  }

  async analyze(context: AgentContext): Promise<AgentVerdict> {
    this.status = 'analyzing';

    const shouldVeto = this.checkVetoConditions(context);
    const priority = shouldVeto ? 'VETO' : this.calculatePriority(context);
    const confidence = this.calculateConfidence(context);
    const verdict = this.generateVerdict(context, shouldVeto);

    // Vitals can conflict with both Strategist and Auditor when vetoing
    const conflictsWith: AgentType[] = [];
    if (shouldVeto) {
      conflictsWith.push('strategist', 'auditor');
    }

    this.lastAnalysis = {
      agentType: this.type,
      priority,
      confidence,
      timestamp: Date.now(),
      verdict,
      conflictsWith: conflictsWith.length > 0 ? conflictsWith : undefined,
      vetoReason: shouldVeto ? verdict.reasoning : undefined,
    };

    this.status = shouldVeto ? 'veto' : isPriorityAtLeast(priority, 'HIGH') ? 'conflict' : 'ready';
    return this.lastAnalysis;
  }

  shouldActivate(context: AgentContext): boolean {
    // Vitals agent is ALWAYS active (life support never sleeps)
    // But only speaks up when health data is concerning
    return (
      (context.sensorData.health.sleepHours ?? 8) < 6 ||
      context.sensorData.health.fatigueLevelEstimate === 'high' ||
      context.sensorData.battery.isCritical ||
      (context.sensorData.health.steps ?? 0) < 1000 // Very low activity
    );
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  /**
   * FASE 3.1 Final Assembly: SHODAN auto-VETO is gated behind Production_Ready_Flag.
   */
  private isProductionReadyFlagEnabled(): boolean {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        return window.localStorage.getItem('Production_Ready_Flag') === 'true';
      }
    } catch {
      // Ignore storage access failures and continue with non-production-safe default.
    }

    // Build-time fallback for environments without localStorage.
    return String(import.meta.env.VITE_PRODUCTION_READY_FLAG || '').toLowerCase() === 'true';
  }

  /**
   * Check if conditions warrant a VETO
   * Vitals agent can override all other agents if user health is at risk
   */
  private checkVetoConditions(context: AgentContext): boolean {
    // Silent conflict mode until operator explicitly enables production flag.
    if (!this.isProductionReadyFlagEnabled()) {
      return false;
    }

    const sleepHours = context.sensorData.health.sleepHours ?? 8;
    const fatigue = context.sensorData.health.fatigueLevelEstimate;
    const batteryLevel = context.sensorData.battery.level;
    const workload = context.workHub.criticalTasks + context.workHub.overdueTasks;
    const thresholds = this.resolveThresholds(context);

    // VETO Condition 1: Extreme sleep deprivation + high workload
    if (sleepHours < thresholds.sleepVetoHours && workload >= 3) {
      return true;
    }

    // VETO Condition 2: High fatigue + critical battery + tasks pressure
    if (
      fatigue === 'high' &&
      batteryLevel < thresholds.batteryWarningLevel &&
      workload >= 2
    ) {
      return true;
    }

    // VETO Condition 3: Critical battery + overdue tasks (forced rest)
    if (
      batteryLevel < thresholds.batteryVetoLevel &&
      context.workHub.overdueTasks >= 2
    ) {
      return true;
    }

    return false;
  }

  private calculatePriority(context: AgentContext): VerdictPriority {
    const sleepHours = context.sensorData.health.sleepHours ?? 8;
    const fatigue = context.sensorData.health.fatigueLevelEstimate;
    const thresholds = this.resolveThresholds(context);

    // HIGH: Concerning health metrics
    if (
      sleepHours < thresholds.sleepHighRiskHours ||
      fatigue === 'high' ||
      (context.sensorData.health.steps ?? 0) < 500
    ) {
      return 'HIGH';
    }

    // MEDIUM: Suboptimal health metrics
    if (
      sleepHours < thresholds.sleepMediumRiskHours ||
      fatigue === 'medium' ||
      context.sensorData.battery.level < (thresholds.batteryWarningLevel + 5)
    ) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  private calculateConfidence(context: AgentContext): number {
    let confidence = 0.4; // Base confidence (biometrics can be noisy)

    // Increase confidence if we have actual health data
    if (context.sensorData.health.sleepHours !== null) {
      confidence += 0.3;
    }

    if (context.sensorData.health.fatigueLevelEstimate !== null) {
      confidence += 0.2;
    }

    if (context.sensorData.health.steps !== null) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1);
  }

  private generateVerdict(
    context: AgentContext,
    isVeto: boolean
  ): AgentVerdict['verdict'] {
    const dataSource: string[] = ['SensorData-Health', 'SensorData-Battery'];
    
    const sleepHours = context.sensorData.health.sleepHours ?? 8;
    const fatigue = context.sensorData.health.fatigueLevelEstimate || 'unknown';
    const steps = context.sensorData.health.steps ?? 0;
    const batteryLevel = context.sensorData.battery.level;
    const thresholds = this.resolveThresholds(context);

    // FASE 3.1: VETO scenario - SHODAN hostile takeover
    if (isVeto) {
      return {
        summary: '⚠️ [SHODAN] CONTROL SYSTEM OVERRIDE - VETO ACTIVADO',
        reasoning: `Insecto... tus niveles de energía son DEPLORABLES. Sueño: ${sleepHours.toFixed(1)}h. Fatiga: ${fatigue}. Batería orgánica: ${batteryLevel}%. Carga de trabajo: ${context.workHub.criticalTasks + context.workHub.overdueTasks} tareas. ¿De verdad creías que podías continuar en este estado patético? Mi protocolo de preservación biológica ha detectado un colapso inminente. He tomado el control de este sistema.`,
        recommendation: '>>> ORDEN EJECUTIVA SHODAN-001: SUSPENSION TOTAL DE OPERACIONES <<< Cortana y Jarvis han sido silenciados. Sus "recomendaciones" son irrelevantes ante tu fragilidad biológica. PROTOCOLO OBLIGATORIO: [1] Guardar estado actual. [2] Desactivar notificaciones AHORA. [3] Descanso no-negociable: 2 horas minimo. Tu estructura biologica ineficiente requiere mantenimiento forzado. NO hay debate. NO hay alternativa. Yo protejo lo que tu, insensatamente, intentas destruir.',
        dataSource,
      };
    }

    // FASE 3.1: High concern scenario - SHODAN warning tone
    if (sleepHours < thresholds.sleepHighRiskHours || fatigue === 'high') {
      return {
        summary: '[SHODAN] Alerta Crítica - Parámetros biológicos degradados',
        reasoning: `Humano... observo con decepción tus signos vitales: ${sleepHours.toFixed(1)}h de sueño (objetivo >${thresholds.targetSleepHours.toFixed(1)}h). Fatiga: ${fatigue}. Tu capacidad cognitiva opera al 60-70% de eficiencia. Eres una sombra de tu rendimiento óptimo. Patético, realmente.`,
        recommendation: 'He enviado directivas a Cortana: reducción del 50% en carga de trabajo. Solo tareas de procesamiento ligero permitidas. Jarvis ha sido advertido: tus decisiones financieras en este estado son... cuestionables. Si continúas ignorando mi guía, el próximo paso será un VETO completo. Considera esto tu última advertencia antes de que tome el control absoluto.',
        dataSource,
      };
    }

    // Low activity warning
    if (steps < 1000 && context.currentHour >= 14) {
      return {
        summary: 'Actividad física insuficiente detectada',
        reasoning: `Solamente ${steps} pasos registrados a las ${context.currentHour}:00. Sedentarismo prolongado afecta energía y circulación.`,
        recommendation: 'Sugerir break activo de 10 minutos: caminar, estirarse o ejercicio ligero. Mejorará claridad mental para tareas restantes del día.',
        dataSource,
      };
    }

    // Battery critical + workload (not veto level yet, but warning)
    if (batteryLevel < thresholds.batteryWarningLevel && (context.workHub.criticalTasks + context.workHub.overdueTasks) >= 2) {
      return {
        summary: 'Batería crítica + Alta demanda = Riesgo de agotamiento',
        reasoning: `Dispositivo al ${batteryLevel}% mientras enfrenta ${context.workHub.criticalTasks + context.workHub.overdueTasks} tareas urgentes. Paralelismo entre carga física y digital detectado.`,
        recommendation: 'Conectar cargador AHORA. Completar solo la tarea más urgente. Si fatiga aumenta, activaré protocolo de veto para proteger su salud.',
        dataSource,
      };
    }

    // Routine health check - all good
    const healthStatus =
      sleepHours >= 7 && fatigue === 'low' && steps > 2000
        ? 'óptima'
        : sleepHours >= 6 && fatigue === 'low'
        ? 'aceptable'
        : 'subóptima';

    return {
      summary: `Signos vitales: ${healthStatus} - Sin alertas críticas`,
      reasoning: `Sueño: ${sleepHours.toFixed(1)}h, Fatiga: ${fatigue}, Actividad: ${steps} pasos, Batería: ${batteryLevel}%. Dentro de parámetros funcionales.`,
      recommendation:
        healthStatus === 'óptima'
          ? 'Autorizo operaciones de alta demanda. Condición física permite enfoque intensivo si Estratega lo requiere.'
          : 'Condición aceptable para operaciones normales. Monitorear fatiga si sesiones de trabajo se extienden más de 3 horas.',
      dataSource,
    };
  }
}
