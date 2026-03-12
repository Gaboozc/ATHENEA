/**
 * FASE 2.5: WeatherSync
 * 
 * Monitors weather conditions and triggers tactical alerts
 * when weather impacts outdoor tasks or travel.
 * 
 * Rules:
 * - Rain forecast within alertOn.rainIn hours → alert for outdoor tasks
 * - Temperature extremes → alert when extreme temp preference enabled
 * - High wind speed → alert if threshold exceeded
 */

import type { Store } from '@reduxjs/toolkit';
import { externalDataService, type WeatherData } from './ExternalDataService';
import { setPreFlightBriefing } from '../../store/slices/aiMemorySlice';

export interface WeatherAlert {
  type: 'rain-incoming' | 'extreme-temp' | 'high-wind' | 'forecast-advisory';
  severity: 'low' | 'medium' | 'high';
  message: string;
  affectedIn: number; // hours ahead
  recommendation: string;
}

class WeatherSync {
  private static instance: WeatherSync;
  private store: Store | null = null;
  private pollInterval: ReturnType<typeof setInterval> | null = null;
  private lastWeatherCheck = 0;
  private weatherCheckInterval = 300000; // 5 minutes
  private currentAlerts: WeatherAlert[] = [];

  private constructor() {}

  static getInstance(): WeatherSync {
    if (!WeatherSync.instance) {
      WeatherSync.instance = new WeatherSync();
    }
    return WeatherSync.instance;
  }

  /**
   * Initialize weather monitoring
   */
  initialize(store: Store): void {
    this.store = store;

    if (this.pollInterval) {
      clearInterval(this.pollInterval);
    }

    // Initial weather check
    this.checkWeather();

    // Poll every 5 minutes
    this.pollInterval = setInterval(() => this.checkWeather(), this.weatherCheckInterval);
  }

  /**
   * Check current weather and generate alerts
   */
  private async checkWeather(): Promise<void> {
    if (!this.store) return;

    try {
      const state = this.store.getState() as any;
      const sensorData = state.sensorData || {};
      const userSettings = state.userSettings || {};

      // Get user location
      const latitude = sensorData.location?.latitude ?? userSettings.geofencing?.work?.latitude;
      const longitude = sensorData.location?.longitude ?? userSettings.geofencing?.work?.longitude;

      if (!latitude || !longitude) {
        console.warn('[WeatherSync] Location not available for weather check');
        return;
      }

      // Fetch weather
      const weather = await externalDataService.getWeather(latitude, longitude);
      if (!weather) {
        console.warn('[WeatherSync] Failed to fetch weather data');
        return;
      }

      // Check preferences
      const weatherPrefs = userSettings.weatherPreferences || {};
      if (!weatherPrefs.enableWeatherAlerts) {
        return;
      }

      // Generate alerts
      const alerts = this.analyzeWeather(weather, weatherPrefs);
      this.currentAlerts = alerts;

      // If alerts exist, dispatch to Redux
      if (alerts.length > 0) {
        this.dispatchWeatherAlerts(alerts);
      }
    } catch (error) {
      console.error('[WeatherSync] Weather check error:', error);
    }
  }

  /**
   * Analyze weather data against user preferences
   */
  private analyzeWeather(
    weather: WeatherData,
    preferences: any
  ): WeatherAlert[] {
    const alerts: WeatherAlert[] = [];

    // Rule 1: Rain incoming
    if (preferences.alertOn?.rainIn) {
      const rainHour = weather.forecastHourly.find(
        h => h.precipitation > 10 && h.hour <= preferences.alertOn.rainIn
      );

      if (rainHour && weather.condition !== 'rainy') {
        alerts.push({
          type: 'rain-incoming',
          severity: weather.precipitationChance > 70 ? 'high' : 'medium',
          message: `Lluvia esperada en ${rainHour.hour} horas. Probabilidad: ${weather.precipitationChance}%`,
          affectedIn: rainHour.hour,
          recommendation: 'Recomienda cambiar actividades al aire libre o llevar paraguas.',
        });
      }
    }

    // Rule 2: Extreme temperature
    if (preferences.alertOn?.extremeTemp) {
      if (weather.temperature < 0) {
        alerts.push({
          type: 'extreme-temp',
          severity: 'high',
          message: `Temperatura congelante: ${weather.temperature}°C`,
          affectedIn: 0,
          recommendation: 'Riesgo de hielo. Recomienda transporte cauteloso.',
        });
      } else if (weather.temperature > 35) {
        alerts.push({
          type: 'extreme-temp',
          severity: 'high',
          message: `Temperatura muy alta: ${weather.temperature}°C`,
          affectedIn: 0,
          recommendation: 'Calor extremo. Sugiere hidratación y pausas frecuentes.',
        });
      }
    }

    // Rule 3: High wind speed
    if (preferences.alertOn?.windSpeed) {
      if (weather.windSpeed > preferences.alertOn.windSpeed) {
        alerts.push({
          type: 'high-wind',
          severity: weather.windSpeed > 12 ? 'high' : 'medium',
          message: `Vientos fuertes: ${Math.round(weather.windSpeed)} m/s`,
          affectedIn: 0,
          recommendation: 'Vientos impactarán viajes en bicicleta o motocicleta.',
        });
      }
    }

    return alerts;
  }

  /**
   * Dispatch weather alerts to Redux for ProactiveHUD display
   */
  private dispatchWeatherAlerts(alerts: WeatherAlert[]): void {
    if (!this.store) return;

    const dispatch = this.store.dispatch as any;

    // Dispatch to aiMemorySlice for briefing integration
    dispatch(
      setPreFlightBriefing({
        generatedAt: Date.now(),
        weatherAlerts: alerts,
        temperature: undefined, // Will be filled by PreFlightBriefing
        condition: undefined,
      })
    );
  }

  /**
   * Get current weather data (for ProactiveHUD)
   */
  async getCurrentWeather(): Promise<WeatherData | null> {
    if (!this.store) return null;

    const state = this.store.getState() as any;
    const sensorData = state.sensorData || {};
    const userSettings = state.userSettings || {};

    const latitude = sensorData.location?.latitude ?? userSettings.geofencing?.work?.latitude;
    const longitude = sensorData.location?.longitude ?? userSettings.geofencing?.work?.longitude;

    if (!latitude || !longitude) {
      return null;
    }

    return externalDataService.getWeather(latitude, longitude);
  }

  /**
   * Get current alerts
   */
  getAlerts(): WeatherAlert[] {
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

export const weatherSync = WeatherSync.getInstance();

export function initializeWeatherSync(store: Store): void {
  weatherSync.initialize(store);
}

export function getWeatherSync(): WeatherSync {
  return weatherSync;
}
