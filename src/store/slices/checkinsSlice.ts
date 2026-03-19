import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface DailyCheckin {
  id: string;
  date: string; // YYYY-MM-DD
  mood: 1 | 2 | 3 | 4 | 5;
  energy: 1 | 2 | 3 | 4 | 5;
  sleepHours: number;
  note: string;
  createdAt: string;
}

interface CheckinsState {
  checkins: DailyCheckin[];
}

const initialState: CheckinsState = {
  checkins: [],
};

const checkinsSlice = createSlice({
  name: 'checkins',
  initialState,
  reducers: {
    addCheckin(state, action: PayloadAction<DailyCheckin>) {
      const existingIdx = state.checkins.findIndex(c => c.date === action.payload.date);
      if (existingIdx >= 0) {
        state.checkins[existingIdx] = action.payload;
      } else {
        state.checkins.push(action.payload);
      }
    },
    updateTodayCheckin(state, action: PayloadAction<Partial<DailyCheckin>>) {
      const today = new Date().toISOString().split('T')[0];
      const existing = state.checkins.find(c => c.date === today);
      if (existing) {
        Object.assign(existing, action.payload);
      }
    },
  },
});

export const { addCheckin, updateTodayCheckin } = checkinsSlice.actions;
export default checkinsSlice.reducer;
