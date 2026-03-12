/**
 * FASE 2.5: Pre-Flight Briefing Generator
 * 
 * Generates the morning/pre-work briefing that synthesizes:
 * - Weather conditions and forecasts
 * - Battery and system status
 * - Learned patterns from BlackBox (Phase 2.4)
 * - Critical tasks for the day
 * 
 * Example Output:
 * "Buenos días, Jefe. 18°C despejado. Batería al 100%. 
 *  Hoy suele ser su día más productivo en WorkHub. 
 *  He limpiado las notificaciones menores para su enfoque.
 *  BTC subió 3% en 24h. Lo vigilamos."
 */

import type { Store } from '@reduxjs/toolkit';
import { setPreFlightBriefing } from '../../store/slices/aiMemorySlice';
import { getWeatherSync } from './WeatherSync';

class PreFlightBriefingGenerator {
  private static instance: PreFlightBriefingGenerator;
  private store: Store | null = null;
  private lastBriefingDate: string = '';
  private isGenerating = false;

  private constructor() {}

  static getInstance(): PreFlightBriefingGenerator {
    if (!PreFlightBriefingGenerator.instance) {
      PreFlightBriefingGenerator.instance = new PreFlightBriefingGenerator();
    }
    return PreFlightBriefingGenerator.instance;
  }

  /**
   * Initialize the briefing generator
   */
  initialize(store: Store): void {
    this.store = store;
  }

  /**
   * Check if briefing should be generated (once per day)
   */
  shouldGenerateBriefing(): boolean {
    const now = new Date();
    const todayDate = now.toDateString();

    if (this.lastBriefingDate !== todayDate) {
      this.lastBriefingDate = todayDate;
      return true;
    }

    return false;
  }

  /**
   * Generate the pre-flight briefing
   * Called when app opens for the first time on a given day
   */
  async generateBriefing(): Promise<void> {
    if (!this.store || this.isGenerating) return;

    this.isGenerating = true;

    try {
      const state = this.store.getState() as any;
      const dispatch = this.store.dispatch as any;

      // Gather data from all sources
      const weatherSync = getWeatherSync();
      // Get current weather
      const weather = await weatherSync.getCurrentWeather();
      const weatherAlerts = weatherSync.getAlerts();

      // Get battery level
      const batteryLevel = state.sensorData?.battery?.level || 100;

      // Get predictive buffer (from BlackBox)
      const predictiveBuffer = state.aiMemory?.predictiveBuffer || {};

      // Get critical tasks count
      const criticalTasks = (state.tasks?.tasks || []).filter(
        (t: any) => t.priority === 'high' && !t.completed && !t.dueDate
      ).length;

      // Generate briefing summary
      const briefingSummary = this.synthesizeBriefing({
        weather,
        weatherAlerts,
        batteryLevel,
        predictiveBuffer,
        criticalTasks,
        state,
      });

      // Dispatch to Redux
      dispatch(
        setPreFlightBriefing({
          generatedAt: Date.now(),
          temperature: weather?.temperature,
          condition: weather?.condition,
          humidity: weather?.humidity,
          weatherAlerts,
          assetAlerts: [],
          batteryLevel,
          predictedHub: predictiveBuffer.nextHub,
          briefingSummary,
        })
      );
    } catch (error) {
      console.error('[PreFlightBriefingGenerator] Error generating briefing:', error);
    } finally {
      this.isGenerating = false;
    }
  }

  /**
   * Synthesize all data into a cohesive briefing narrative
   */
  private synthesizeBriefing(data: {
    weather: any;
    weatherAlerts: any[];
    batteryLevel: number;
    predictiveBuffer: any;
    criticalTasks: number;
    state: any;
  }): string {
    const parts: string[] = [];

    // Greeting
    const now = new Date();
    const hour = now.getHours();
    const greeting =
      hour < 12
        ? 'Buenos días, Jefe'
        : hour < 18
          ? 'Buenas tardes, Jefe'
          : 'Buenas noches, Jefe';
    parts.push(greeting);

    // Weather
    if (data.weather) {
      const tempStr = `${data.weather.temperature}°C`;
      const condStr = this.translateCondition(data.weather.condition);
      parts.push(`${tempStr} ${condStr}`);

      // Weather alerts
      if (data.weatherAlerts.length > 0) {
        const highSeverity = data.weatherAlerts.find((a: any) => a.severity === 'high');
        if (highSeverity) {
          parts.push(`⚠️ ${highSeverity.message}`);
        }
      }
    }

    // Battery
    if (data.batteryLevel < 20) {
      parts.push(`🔋 Batería al ${data.batteryLevel}%. Poder limitado.`);
    } else if (data.batteryLevel < 50) {
      parts.push(`🔋 Batería al ${data.batteryLevel}%.`);
    }

    // Predictive pattern
    if (data.predictiveBuffer?.priority === 'HIGH' && data.predictiveBuffer?.nextHub) {
      parts.push(
        `He detectado un patrón: hoy típicamente trabaja en ${data.predictiveBuffer.nextHub}.`
      );
    }

    // Critical tasks
    if (data.criticalTasks > 0) {
      parts.push(`Tienes ${data.criticalTasks} tarea${data.criticalTasks > 1 ? 's' : ''} crítica${data.criticalTasks > 1 ? 's' : ''} sin plazo.`);
    }

    // Final touch
    parts.push('Listo para la acción, Jefe.');

    return parts.join(' ');
  }

  /**
   * Translate weather condition to Spanish
   */
  private translateCondition(condition: string): string {
    const translations: Record<string, string> = {
      clear: 'despejado',
      cloudy: 'nublado',
      rainy: 'lluvioso',
      stormy: 'tormentoso',
      snow: 'nevado',
    };

    return translations[condition] || 'variable';
  }

  /**
   * Force briefing generation (for testing)
   */
  async forceRefresh(): Promise<void> {
    this.lastBriefingDate = '';
    await this.generateBriefing();
  }
}

export const preFlightBriefingGenerator = PreFlightBriefingGenerator.getInstance();

export function initializePreFlightBriefing(store: Store): void {
  preFlightBriefingGenerator.initialize(store);
}

export function getPreFlightBriefingGenerator(): PreFlightBriefingGenerator {
  return preFlightBriefingGenerator;
}
