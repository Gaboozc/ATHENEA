import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface BiometricBaselines {
  targetSleepHours: number;
  dailyCalorieTarget: number;
  workHourLimit: number;
}

export interface UserIdentityState {
  firstName: string;
  lastName: string;
  preferredTitle: string;
  biometricBaselines: BiometricBaselines;
  initialized: boolean;
}

const initialState: UserIdentityState = {
  firstName: '',
  lastName: '',
  preferredTitle: 'Señor',
  biometricBaselines: {
    targetSleepHours: 7.5,
    dailyCalorieTarget: 2200,
    workHourLimit: 8,
  },
  initialized: false,
};

const userIdentitySlice = createSlice({
  name: 'userIdentity',
  initialState,
  reducers: {
    updateIdentityCore: (state, action: PayloadAction<Partial<UserIdentityState>>) => {
      return {
        ...state,
        ...action.payload,
        biometricBaselines: {
          ...state.biometricBaselines,
          ...(action.payload.biometricBaselines || {}),
        },
        initialized: true,
      };
    },
    setIdentityName: (state, action: PayloadAction<{ firstName: string; lastName: string }>) => {
      state.firstName = action.payload.firstName;
      state.lastName = action.payload.lastName;
      state.initialized = true;
    },
    setPreferredTitle: (state, action: PayloadAction<string>) => {
      state.preferredTitle = action.payload;
      state.initialized = true;
    },
    setBiometricBaselines: (state, action: PayloadAction<Partial<BiometricBaselines>>) => {
      state.biometricBaselines = {
        ...state.biometricBaselines,
        ...action.payload,
      };
      state.initialized = true;
    },
  },
});

export const {
  updateIdentityCore,
  setIdentityName,
  setPreferredTitle,
  setBiometricBaselines,
} = userIdentitySlice.actions;

export default userIdentitySlice.reducer;
