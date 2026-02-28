import { createSlice } from '@reduxjs/toolkit';

const todayKey = () => new Date().toISOString().split('T')[0];

const initialState = {
  routines: [],
};

const routinesSlice = createSlice({
  name: 'routines',
  initialState,
  reducers: {
    addRoutine: (state, action) => {
      const { title, frequency, daysOfWeek } = action.payload;
      const newRoutine = {
        id: `routine-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: title || 'Untitled Routine',
        frequency: frequency || 'daily',
        daysOfWeek: Array.isArray(daysOfWeek) && daysOfWeek.length
          ? daysOfWeek
          : [0, 1, 2, 3, 4, 5, 6],
        lastCompleted: null,
        streak: 0,
        createdAt: new Date().toISOString(),
      };
      state.routines.unshift(newRoutine);
    },
    updateRoutineDays: (state, action) => {
      const { id, daysOfWeek } = action.payload;
      const routine = state.routines.find((item) => item.id === id);
      if (routine && Array.isArray(daysOfWeek) && daysOfWeek.length) {
        routine.daysOfWeek = daysOfWeek;
      }
    },
    toggleRoutineToday: (state, action) => {
      const { id } = action.payload;
      const routine = state.routines.find((item) => item.id === id);
      if (!routine) return;

      const today = todayKey();
      if (routine.lastCompleted === today) {
        routine.lastCompleted = null;
        routine.streak = Math.max(0, routine.streak - 1);
        return;
      }

      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayKey = yesterday.toISOString().split('T')[0];

      const wasYesterday = routine.lastCompleted === yesterdayKey;
      routine.lastCompleted = today;
      routine.streak = wasYesterday ? routine.streak + 1 : 1;
    },
  },
});

export const { addRoutine, updateRoutineDays, toggleRoutineToday } = routinesSlice.actions;
export default routinesSlice.reducer;
