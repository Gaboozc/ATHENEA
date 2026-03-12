/**
 * FASE 3: The Strategist Agent (Cortana Style)
 * 
 * Mission: Time, energy, and productivity management
 * Focus: Analyzes agenda, weather, fatigue to reorder your day
 * Voice: Tactical, motivational, mission-focused
 * 
 * The Strategist believes in:
 * - Strike while energy is high
 * - Adapt to environmental conditions
 * - Momentum over perfection
 */

import type {
  Agent,
  AgentType,
  AgentStatus,
  AgentContext,
  AgentVerdict,
  VerdictPriority
} from './types';

export class StrategistAgent implements Agent {
  readonly type: AgentType = 'strategist';
  readonly name = 'The Strategist';
  readonly colorCode = '#00A8FF'; // Tactical blue

  private status: AgentStatus = 'idle';
  private lastAnalysis: AgentVerdict | null = null;

  async analyze(context: AgentContext): Promise<AgentVerdict> {
    this.status = 'analyzing';

    const priority = this.calculatePriority(context);
    const confidence = this.calculateConfidence(context);
    const verdict = this.generateVerdict(context);

    this.lastAnalysis = {
      agentType: this.type,
      priority,
      confidence,
      timestamp: Date.now(),
      verdict,
    };

    this.status = priority === 'CRITICAL' ? 'conflict' : 'ready';
    return this.lastAnalysis;
  }

  shouldActivate(context: AgentContext): boolean {
    // Activate if:
    // 1. There are critical or overdue tasks
    // 2. Weather conditions affect outdoor tasks
    // 3. Energy/battery is suboptimal for current workload
    return (
      context.workHub.criticalTasks > 0 ||
      context.workHub.overdueTasks > 0 ||
      context.sensorData.battery.isCritical ||
      (context.externalData.weather?.alerts?.length ?? 0) > 0
    );
  }

  getStatus(): AgentStatus {
    return this.status;
  }

  private calculatePriority(context: AgentContext): VerdictPriority {
    // CRITICAL: Overdue tasks + bad weather + low energy
    if (
      context.workHub.overdueTasks >= 3 &&
      context.energyLevel === 'low' &&
      context.sensorData.battery.isCritical
    ) {
      return 'CRITICAL';
    }

    // HIGH: Multiple critical tasks or significant weather impact
    if (
      context.workHub.criticalTasks >= 3 ||
      (context.blackBox.weatherImpact?.productivity ?? 1) < 0.5
    ) {
      return 'HIGH';
    }

    // MEDIUM: Some task pressure or suboptimal conditions
    if (
      context.workHub.criticalTasks > 0 ||
      context.workHub.overdueTasks > 0 ||
      context.sensorData.battery.level < 30
    ) {
      return 'MEDIUM';
    }

    return 'LOW';
  }

  private calculateConfidence(context: AgentContext): number {
    let confidence = 0.5; // Base confidence

    // Increase confidence with more data points
    if (context.blackBox.weatherImpact?.confidence) {
      confidence += context.blackBox.weatherImpact.confidence * 0.2;
    }

    if (context.workHub.totalTasks > 5) {
      confidence += 0.2; // More tasks = better pattern recognition
    }

    if (context.sensorData.health.fatigueLevelEstimate) {
      confidence += 0.1; // Biometric data available
    }

    return Math.min(confidence, 1);
  }

  private generateVerdict(context: AgentContext): AgentVerdict['verdict'] {
    const dataSource: string[] = ['WorkHub', 'SensorData'];
    
    if (context.externalData.weather) dataSource.push('Weather');
    if (context.blackBox.weatherImpact) dataSource.push('BlackBox-WeatherCorrelation');

    // Critical overload scenario
    if (context.workHub.overdueTasks >= 3 && context.energyLevel === 'low') {
      return {
        summary: 'Sobrecarga detectada - Priorización urgente requerida',
        reasoning: `Tiene ${context.workHub.overdueTasks} tareas vencidas y su nivel de energía está bajo (${context.energyLevel}). Continuar sin reorganización resultará en mayor retraso.`,
        recommendation: 'Ejecutar protocolo de triage: Seleccione las 2 tareas más críticas y posponga el resto. Considere delegar si es posible.',
        dataSource,
      };
    }

    // Weather impact scenario
    if (
      context.externalData.weather?.condition === 'rainy' ||
      context.externalData.weather?.condition === 'stormy'
    ) {
      const outdoorTasksRisk = context.workHub.criticalTasks > 0;
      if (outdoorTasksRisk) {
        return {
          summary: 'Alerta climática - Reorganizar tareas de tránsito',
          reasoning: `Condiciones climáticas adversas (${context.externalData.weather.condition}). Tareas que requieren desplazamiento están en riesgo.`,
          recommendation: 'Priorizar tareas remotas/internas en este momento. Reprogramar actividades externas para cuando mejore el clima.',
          dataSource,
        };
      }
    }

    // Battery critical + high workload
    if (context.sensorData.battery.isCritical && context.workHub.criticalTasks >= 2) {
      return {
        summary: 'Energía crítica - Modo de supervivencia activado',
        reasoning: `Batería al ${context.sensorData.battery.level}% con ${context.workHub.criticalTasks} tareas críticas pendientes. Riesgo de pérdida de progreso.`,
        recommendation: 'Buscar cargador inmediatamente. Guardar todo el trabajo en progreso. Considere completar solo la tarea más urgente.',
        dataSource,
      };
    }

    // High productivity opportunity
    if (
      context.energyLevel === 'high' &&
      context.workHub.criticalTasks >= 2 &&
      context.externalData.weather?.condition === 'clear'
    ) {
      return {
        summary: 'Ventana de alta productividad - Aprovechar momentum',
        reasoning: `Condiciones óptimas alineadas: energía alta, clima favorable, ${context.workHub.criticalTasks} tareas críticas listas. Este es tu momento de ataque.`,
        recommendation: 'Ejecutar sprint de 2 horas en las tareas más importantes. Desactivar notificaciones y enfocarse.',
        dataSource,
      };
    }

    // Default tactical analysis
    const taskStatus =
      context.workHub.criticalTasks > 0
        ? `${context.workHub.criticalTasks} tareas críticas en radar`
        : 'Sin tareas críticas inmediatas';

    return {
      summary: `Estado operacional: ${taskStatus}`,
      reasoning: `WorkHub: ${context.workHub.completedToday} completadas hoy, ${context.workHub.totalTasks} totales. Energía: ${context.energyLevel}. Batería: ${context.sensorData.battery.level}%.`,
      recommendation:
        context.workHub.criticalTasks > 0
          ? 'Mantener enfoque en las prioridades actuales. Condiciones estables para ejecución.'
          : 'Buen momento para atacar tareas pendientes de baja prioridad o planificación estratégica.',
      dataSource,
    };
  }
}
