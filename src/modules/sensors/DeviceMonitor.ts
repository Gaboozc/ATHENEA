/**
 * Device Monitor Service
 * 
 * Monitors hardware vitals: battery, network, location
 * Injects sensory data into Redux aiMemory store
 * 
 * Similar to Jarvis monitoring Mark III systems
 * or Cortana reading Spartan suit diagnostics
 */

import { Device } from '@capacitor/device';
import { Network } from '@capacitor/network';
import { Geolocation } from '@capacitor/geolocation';
import type { Store } from '@reduxjs/toolkit';
import { logSessionAction } from '../../store/slices/aiMemorySlice';
import {
  setBatteryLevel,
  setCurrentZone,
  setDeviceInfo,
  setLocation,
  setNetworkStatus,
} from '../../store/slices/sensorDataSlice';

export interface DeviceStatus {
  battery: {
    level: number; // 0-100
    isCharging: boolean;
    temperature?: number;
  };
  network: {
    type: 'wifi' | 'cellular' | 'none' | 'unknown';
    isConnected: boolean;
  };
  location?: {
    latitude: number;
    longitude: number;
    accuracy: number;
    timestamp: number;
  };
  device: {
    platform: string;
    osVersion: string;
    model: string;
  };
}

class DeviceMonitor {
  private store: Store | null = null;
  private statusHistory: DeviceStatus[] = [];
  private monitorInterval: ReturnType<typeof setInterval> | null = null;
  private monitoringActive = false;
  private lastBatteryLevel = 100;
  private lastNetworkType: string = 'unknown';
  private lastLocationZone: string | null = null;

  constructor(store?: Store) {
    if (store) {
      this.store = store;
    }
  }

  /**
   * Initialize monitoring loops
   */
  async initialize(): Promise<void> {
    if (this.monitoringActive) return;

    console.log('[DeviceMonitor] Initializing sensory systems...');
    this.monitoringActive = true;

    // Get initial device info
    const deviceInfo = await Device.getInfo();
    console.log(`[DeviceMonitor] Platform: ${deviceInfo.platform}, OS: ${deviceInfo.osVersion}`);

    // Start continuous monitoring every 5 minutes (300s)
    this.monitorInterval = setInterval(() => {
      this.updateDeviceStatus();
    }, 300000); // 5 minutes

    // Initial check immediately
    await this.updateDeviceStatus();

    // Setup network listener
    this.setupNetworkListener();
  }

  /**
   * Stop monitoring
   */
  shutdown(): void {
    if (this.monitorInterval) {
      clearInterval(this.monitorInterval);
      this.monitorInterval = null;
    }
    this.monitoringActive = false;
    console.log('[DeviceMonitor] Sensory systems powered down.');
  }

  /**
   * Get current device status
   */
  private async updateDeviceStatus(): Promise<void> {
    try {
      const status: DeviceStatus = {
        battery: await this.getBatteryStatus(),
        network: await this.getNetworkStatus(),
        device: await this.getDeviceInfo(),
      };

      // Try to get current location (non-blocking)
      try {
        status.location = await this.getCurrentLocation();
      } catch (err) {
        // Location might not be available, that's OK
      }

      // Store in history
      this.statusHistory.push(status);
      if (this.statusHistory.length > 20) {
        this.statusHistory.shift();
      }

      this.dispatchSensorData(status);
      // Log to Redux if battery changed significantly
      this._logStatusToRedux(status);
    } catch (error) {
      console.error('[DeviceMonitor] Status update error:', error);
    }
  }

  /**
   * Get battery status
   */
  private async getBatteryStatus(): Promise<DeviceStatus['battery']> {
    try {
      const nav = navigator as Navigator & {
        getBattery?: () => Promise<{ level: number; charging: boolean }>;
      };

      if (typeof nav.getBattery === 'function') {
        const battery = await nav.getBattery();
        return {
          level: Math.round((battery.level || 0) * 100),
          isCharging: Boolean(battery.charging),
        };
      }
    } catch {
      // Fall back to latest known values if Battery API is unavailable.
    }

    return {
      level: this.lastBatteryLevel,
      isCharging: false,
    };
  }

  /**
   * Get network status
   */
  private async getNetworkStatus(): Promise<DeviceStatus['network']> {
    const status = await Network.getStatus();
    return {
      type: (status.connectionType as any) || 'unknown',
      isConnected: status.connected,
    };
  }

  /**
   * Get device info
   */
  private async getDeviceInfo(): Promise<DeviceStatus['device']> {
    const info = await Device.getInfo();
    return {
      platform: info.platform,
      osVersion: info.osVersion,
      model: info.model,
    };
  }

  /**
   * Get current location (async, passive)
   */
  private async getCurrentLocation(): Promise<DeviceStatus['location']> {
    const coords = await Geolocation.getCurrentPosition({
      enableHighAccuracy: true,
      timeout: 5000,
      maximumAge: 60000, // Use cached position if < 1 min old
    });

    return {
      latitude: coords.coords.latitude,
      longitude: coords.coords.longitude,
      accuracy: coords.coords.accuracy || 0,
      timestamp: coords.timestamp,
    };
  }

  /**
   * Setup network change listener
   */
  private setupNetworkListener(): void {
    Network.addListener('networkStatusChange', (status) => {
      const newType = (status.connectionType as any) || 'unknown';
      if (newType !== this.lastNetworkType) {
        this.lastNetworkType = newType;
        console.log(`[DeviceMonitor] Network changed to: ${newType}`);

        // Dispatch Redux action
        if (this.store) {
          this.store.dispatch(
            setNetworkStatus({
              type: newType,
              isConnected: status.connected,
            })
          );
          this.store.dispatch(
            logSessionAction({
              type: 'aiObserver/networkChanged',
              timestamp: Date.now(),
              result: 'info',
              priority: 'MEDIUM',
              payloadPreview: `Network: ${newType}`,
            })
          );
        }
      }
    });
  }

  /**
   * Log status changes to Redux
   */
  private _logStatusToRedux(status: DeviceStatus): void {
    if (!this.store) return;

    // Log battery state
    if (Math.abs(status.battery.level - this.lastBatteryLevel) >= 5) {
      this.lastBatteryLevel = status.battery.level;

      let priority: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
      if (status.battery.level < 15) priority = 'HIGH';
      else if (status.battery.level < 30) priority = 'MEDIUM';

      this.store.dispatch(
        logSessionAction({
          type: 'aiObserver/batteryStatusChanged',
          timestamp: Date.now(),
          result: 'info',
          priority,
          payloadPreview: `Battery: ${status.battery.level}%${
            status.battery.isCharging ? ' (charging)' : ''
          }`,
        })
      );
    }
  }

  /**
   * Dispatch latest hardware state to Redux.
   */
  private dispatchSensorData(status: DeviceStatus): void {
    if (!this.store) return;

    this.store.dispatch(
      setBatteryLevel({
        level: status.battery.level,
        isCharging: status.battery.isCharging,
      })
    );

    this.store.dispatch(
      setNetworkStatus({
        type: status.network.type,
        isConnected: status.network.isConnected,
      })
    );

    this.store.dispatch(
      setDeviceInfo({
        platform: status.device.platform,
        osVersion: status.device.osVersion,
        model: status.device.model,
      })
    );

    if (status.location) {
      this.store.dispatch(
        setLocation({
          latitude: status.location.latitude,
          longitude: status.location.longitude,
          accuracy: status.location.accuracy,
        })
      );

      const zone = this.resolveZone(status.location.latitude, status.location.longitude);
      this.store.dispatch(setCurrentZone(zone));
      if (zone !== this.lastLocationZone) {
        this.lastLocationZone = zone;
        if (zone) {
          this.store.dispatch(
            logSessionAction({
              type: 'aiObserver/zoneChanged',
              timestamp: Date.now(),
              result: 'info',
              priority: 'MEDIUM',
              payloadPreview: `Zona: ${zone}`,
            })
          );
        }
      }
    }
  }

  /**
   * Resolve current zone from persisted user settings.
   */
  private resolveZone(currentLat: number, currentLng: number): string | null {
    const state: any = this.store?.getState?.();
    const geofencing = state?.userSettings?.geofencing;
    if (!geofencing) return null;

    const home = geofencing.home;
    if (
      home?.latitude != null &&
      home?.longitude != null &&
      this.isInZone(currentLat, currentLng, Number(home.latitude), Number(home.longitude), Number(home.radiusKm || 0.5))
    ) {
      return 'HOME';
    }

    const work = geofencing.work;
    if (
      work?.latitude != null &&
      work?.longitude != null &&
      this.isInZone(currentLat, currentLng, Number(work.latitude), Number(work.longitude), Number(work.radiusKm || 0.5))
    ) {
      return 'WORK';
    }

    return null;
  }

  /**
   * Get latest status
   */
  getLatestStatus(): DeviceStatus | null {
    return this.statusHistory.length > 0 ? this.statusHistory[this.statusHistory.length - 1] : null;
  }

  /**
   * Get status by index (-1 = latest)
   */
  getStatusAt(index: number = -1): DeviceStatus | null {
    if (index === -1) {
      return this.getLatestStatus();
    }
    return this.statusHistory[index] || null;
  }

  /**
   * Get status history
   */
  getHistory(): DeviceStatus[] {
    return [...this.statusHistory];
  }

  /**
   * Update store reference (late initialization)
   */
  setStore(store: Store): void {
    this.store = store;
  }

  /**
   * Check if in defined zone
   * Compares current location against stored zones
   */
  isInZone(
    currentLat: number,
    currentLng: number,
    zoneLat: number,
    zoneLng: number,
    radiusKm: number = 0.5
  ): boolean {
    // Haversine formula simplified
    const R = 6371; // Earth radius in km
    const dLat = ((zoneLat - currentLat) * Math.PI) / 180;
    const dLng = ((zoneLng - currentLng) * Math.PI) / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((currentLat * Math.PI) / 180) *
        Math.cos((zoneLat * Math.PI) / 180) *
        Math.sin(dLng / 2) *
        Math.sin(dLng / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const distance = R * c;

    return distance <= radiusKm;
  }
}

// Singleton instance
let deviceMonitorInstance: DeviceMonitor | null = null;

export function initializeDeviceMonitor(store?: Store): DeviceMonitor {
  if (!deviceMonitorInstance) {
    deviceMonitorInstance = new DeviceMonitor(store);
    deviceMonitorInstance.initialize().catch((err) => {
      console.error('[DeviceMonitor] Initialization failed:', err);
    });
  } else if (store && !deviceMonitorInstance['store']) {
    deviceMonitorInstance.setStore(store);
  }
  return deviceMonitorInstance;
}

export function getDeviceMonitor(): DeviceMonitor | null {
  return deviceMonitorInstance;
}
