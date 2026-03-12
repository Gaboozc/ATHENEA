import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SensorDataState {
  battery: {
    level: number; // 0-100
    isCharging: boolean;
    lastUpdated: number;
    isCritical: boolean; // true if < 15%
  };
  network: {
    type: 'wifi' | 'cellular' | 'none' | 'unknown';
    isConnected: boolean;
    lastUpdated: number;
  };
  location: {
    latitude: number | null;
    longitude: number | null;
    accuracy: number | null;
    lastUpdated: number;
    currentZone: string | null; // 'HOME', 'WORK', null
  };
  device: {
    platform: string;
    osVersion: string;
    model: string;
  };
  health: {
    steps: number | null;
    sleepHours: number | null;
    heartRate: number | null;
    fatigueLevelEstimate: 'low' | 'medium' | 'high' | null; // Calculated from sleep + activity
    lastUpdated: number;
  };
}

const initialState: SensorDataState = {
  battery: {
    level: 100,
    isCharging: false,
    lastUpdated: 0,
    isCritical: false,
  },
  network: {
    type: 'unknown',
    isConnected: false,
    lastUpdated: 0,
  },
  location: {
    latitude: null,
    longitude: null,
    accuracy: null,
    lastUpdated: 0,
    currentZone: null,
  },
  device: {
    platform: '',
    osVersion: '',
    model: '',
  },
  health: {
    steps: null,
    sleepHours: null,
    heartRate: null,
    fatigueLevelEstimate: null,
    lastUpdated: 0,
  },
};

const sensorDataSlice = createSlice({
  name: 'sensorData',
  initialState,
  reducers: {
    // Battery actions
    setBatteryLevel: (
      state,
      action: PayloadAction<{ level: number; isCharging: boolean }>
    ) => {
      state.battery.level = action.payload.level;
      state.battery.isCharging = action.payload.isCharging;
      state.battery.isCritical = action.payload.level < 15;
      state.battery.lastUpdated = Date.now();
    },

    // Network actions
    setNetworkStatus: (
      state,
      action: PayloadAction<{ type: 'wifi' | 'cellular' | 'none' | 'unknown'; isConnected: boolean }>
    ) => {
      state.network.type = action.payload.type;
      state.network.isConnected = action.payload.isConnected;
      state.network.lastUpdated = Date.now();
    },

    // Location actions
    setLocation: (
      state,
      action: PayloadAction<{
        latitude: number;
        longitude: number;
        accuracy?: number;
      }>
    ) => {
      state.location.latitude = action.payload.latitude;
      state.location.longitude = action.payload.longitude;
      state.location.accuracy = action.payload.accuracy ?? null;
      state.location.lastUpdated = Date.now();
    },

    setCurrentZone: (state, action: PayloadAction<string | null>) => {
      state.location.currentZone = action.payload;
    },

    // Device info
    setDeviceInfo: (
      state,
      action: PayloadAction<{
        platform: string;
        osVersion: string;
        model: string;
      }>
    ) => {
      state.device = action.payload;
    },

    // Health data
    setHealthData: (
      state,
      action: PayloadAction<{
        steps?: number;
        sleepHours?: number;
        heartRate?: number;
      }>
    ) => {
      if (action.payload.steps !== undefined) {
        state.health.steps = action.payload.steps;
      }
      if (action.payload.sleepHours !== undefined) {
        state.health.sleepHours = action.payload.sleepHours;
      }
      if (action.payload.heartRate !== undefined) {
        state.health.heartRate = action.payload.heartRate;
      }

      // Calculate fatigue estimate from sleep
      if (action.payload.sleepHours !== undefined) {
        const sleepHours = action.payload.sleepHours;
        if (sleepHours < 5) {
          state.health.fatigueLevelEstimate = 'high';
        } else if (sleepHours < 7) {
          state.health.fatigueLevelEstimate = 'medium';
        } else {
          state.health.fatigueLevelEstimate = 'low';
        }
      }

      state.health.lastUpdated = Date.now();
    },

    // Reset
    resetSensorData: (state) => {
      state.battery = initialState.battery;
      state.network = initialState.network;
      state.location = initialState.location;
      state.health = initialState.health;
    },
  },
});

export const {
  setBatteryLevel,
  setNetworkStatus,
  setLocation,
  setCurrentZone,
  setDeviceInfo,
  setHealthData,
  resetSensorData,
} = sensorDataSlice.actions;

export default sensorDataSlice.reducer;
