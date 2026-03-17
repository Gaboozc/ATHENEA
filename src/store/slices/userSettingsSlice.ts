import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type VoiceTone = 'jarvis' | 'cortana';
export type LLMProvider = 'openai' | 'groq';
// FIX 6.2: Voice language options for speech recognition locale
export type VoiceLanguage = 'en-US' | 'es-MX' | 'es-ES' | 'auto';

export interface WorkingHours {
  start: string; // HH:MM
  end: string;   // HH:MM
}

export interface GeofencePoint {
  latitude: number | null;
  longitude: number | null;
  radiusKm: number;
}

export interface WatchedAsset {
  id: string; // BTC, ETH, AAPL, etc.
  type: 'crypto' | 'stock';
  alertThreshold: number; // % change threshold (default 5%)
  isActive: boolean;
}

export interface WeatherPreferences {
  enableWeatherAlerts: boolean;
  apiProvider: 'device-auto' | 'openweather' | 'weatherapi';
  apiKey: string;
  alertOn: {
    rainIn: number; // Hours ahead to alert about rain (e.g., 3)
    extremeTemp: boolean; // Alert on freezing/very hot
    windSpeed: number; // m/s threshold for alerts
  };
}

export interface UserSettingsState {
  firstName: string;
  lastName: string;
  preferredName: string;
  title: string; // Ej: "Señor", "Jefe", "Comandante"
  agentAliases: {
    jarvis: string;
    cortana: string;
    shodan: string;
  };
  missionBio: string;
  workingHours: WorkingHours;
  geofencing: {
    home: GeofencePoint;
    work: GeofencePoint;
  };
  knownCommerceKeywords: string[];
  voiceTone: VoiceTone;
  // FIX 6.2: Voice language for speech recognition (affects locale passed to Android plugin)
  voiceLanguage: VoiceLanguage;
  // FASE 2.5: External Data Integration
  watchedAssets: WatchedAsset[];
  weatherPreferences: WeatherPreferences;
    // FASE 4.0: External Webhook Integration
    webhookURL: string;
  // FASE 4.2: Neural Spark LLM integration
  llmProvider: LLMProvider;
  llmApiKey: string;
  initialized: boolean;
  // FIX UX-4 — modo avanzado: habilita WarRoomView en el Omnibar
  advancedMode: boolean;
}

const initialState: UserSettingsState = {
  firstName: '',
  lastName: '',
  preferredName: '',
  title: 'Señor',
  agentAliases: {
    jarvis: 'Sir',
    cortana: 'Chief',
    shodan: 'Insect'
  },
  missionBio: '',
  workingHours: {
    start: '08:00',
    end: '18:00'
  },
  geofencing: {
    home: {
      latitude: null,
      longitude: null,
      radiusKm: 0.5,
    },
    work: {
      latitude: null,
      longitude: null,
      radiusKm: 0.5,
    },
  },
  knownCommerceKeywords: ['oxxo', 'walmart', 'costco', 'starbucks', 'amazon'],
  voiceTone: 'jarvis',
  // FIX 6.2: Default to 'auto' — resolves from navigator.language at runtime
  voiceLanguage: 'auto',
  // FASE 2.5: External Data Default Configuration
  watchedAssets: [],
  weatherPreferences: {
    enableWeatherAlerts: true,
    apiProvider: 'device-auto',
    apiKey: '',
    alertOn: {
      rainIn: 3,
      extremeTemp: true,
      windSpeed: 8.0,
    },
  },
    initialized: false,
    webhookURL: '',
  llmProvider: 'openai',
  llmApiKey: '',
  // FIX UX-4
  advancedMode: false,
};

const userSettingsSlice = createSlice({
  name: 'userSettings',
  initialState,
  reducers: {
    updateUserSettings: (
      state,
      action: PayloadAction<Partial<UserSettingsState>>
    ) => {
      return {
        ...state,
        ...action.payload,
        initialized: true
      };
    },
    setFirstName: (state, action: PayloadAction<string>) => {
      state.firstName = action.payload;
      state.initialized = true;
    },
    setLastName: (state, action: PayloadAction<string>) => {
      state.lastName = action.payload;
      state.initialized = true;
    },
    setPreferredName: (state, action: PayloadAction<string>) => {
      state.preferredName = action.payload;
      state.initialized = true;
    },
    setTitle: (state, action: PayloadAction<string>) => {
      state.title = action.payload;
      state.initialized = true;
    },
    setAgentAliases: (
      state,
      action: PayloadAction<Partial<UserSettingsState['agentAliases']>>
    ) => {
      state.agentAliases = {
        ...state.agentAliases,
        ...action.payload,
      };
      state.initialized = true;
    },
    setMissionBio: (state, action: PayloadAction<string>) => {
      state.missionBio = action.payload;
      state.initialized = true;
    },
    setWorkingHours: (state, action: PayloadAction<WorkingHours>) => {
      state.workingHours = action.payload;
      state.initialized = true;
    },
    setGeofencing: (
      state,
      action: PayloadAction<{
        home?: Partial<GeofencePoint>;
        work?: Partial<GeofencePoint>;
      }>
    ) => {
      if (action.payload.home) {
        state.geofencing.home = {
          ...state.geofencing.home,
          ...action.payload.home,
        };
      }
      if (action.payload.work) {
        state.geofencing.work = {
          ...state.geofencing.work,
          ...action.payload.work,
        };
      }
      state.initialized = true;
    },
    setVoiceTone: (state, action: PayloadAction<VoiceTone>) => {
      state.voiceTone = action.payload;
      state.initialized = true;
    },
    // FIX 6.2: Set preferred voice language
    setVoiceLanguage: (state, action: PayloadAction<VoiceLanguage>) => {
      state.voiceLanguage = action.payload;
      state.initialized = true;
    },
    // FASE 2.5: External Data Actions
    addWatchedAsset: (state, action: PayloadAction<WatchedAsset>) => {
      const exists = state.watchedAssets.find(a => a.id === action.payload.id);
      if (!exists) {
        state.watchedAssets.push(action.payload);
        state.initialized = true;
      }
    },
    removeWatchedAsset: (state, action: PayloadAction<string>) => {
      state.watchedAssets = state.watchedAssets.filter(a => a.id !== action.payload);
      state.initialized = true;
    },
    toggleAssetAlert: (state, action: PayloadAction<string>) => {
      const asset = state.watchedAssets.find(a => a.id === action.payload);
      if (asset) {
        asset.isActive = !asset.isActive;
        state.initialized = true;
      }
    },
    updateAssetThreshold: (state, action: PayloadAction<{ assetId: string; threshold: number }>) => {
      const asset = state.watchedAssets.find(a => a.id === action.payload.assetId);
      if (asset) {
        asset.alertThreshold = action.payload.threshold;
        state.initialized = true;
      }
    },
    setWeatherPreferences: (state, action: PayloadAction<Partial<WeatherPreferences>>) => {
      state.weatherPreferences = {
        ...state.weatherPreferences,
        ...action.payload,
      };
      state.initialized = true;
      },
      // FASE 4.0: Webhook Configuration
      setWebhookURL: (state, action: PayloadAction<string>) => {
        state.webhookURL = action.payload;
        state.initialized = true;
      },
    // FASE 4.2: LLM Configuration
    setLLMProvider: (state, action: PayloadAction<LLMProvider>) => {
      state.llmProvider = action.payload;
      state.initialized = true;
    },
    setLLMApiKey: (state, action: PayloadAction<string>) => {
      state.llmApiKey = action.payload;
      state.initialized = true;
    },
    setLLMConfig: (
      state,
      action: PayloadAction<{ provider?: LLMProvider; apiKey?: string }>
    ) => {
      if (action.payload.provider) {
        state.llmProvider = action.payload.provider;
      }
      if (typeof action.payload.apiKey === 'string') {
        state.llmApiKey = action.payload.apiKey;
      }
      state.initialized = true;
    }
  }
});

export const {
  updateUserSettings,
  setFirstName,
  setLastName,
  setPreferredName,
  setTitle,
  setAgentAliases,
  setMissionBio,
  setWorkingHours,
  setGeofencing,
  setVoiceTone,
  setVoiceLanguage,
  addWatchedAsset,
  removeWatchedAsset,
  toggleAssetAlert,
  updateAssetThreshold,
  setWeatherPreferences,
    setWebhookURL,
  setLLMProvider,
  setLLMApiKey,
  setLLMConfig,
} = userSettingsSlice.actions;

export default userSettingsSlice.reducer;
