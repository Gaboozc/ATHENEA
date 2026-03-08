import { createSlice } from '@reduxjs/toolkit';

const routinesSlice = createSlice({
  name: 'routines',
  initialState: {
    routines: []
  },
  reducers: {
    addRoutine: (state, action) => {
      state.routines.unshift({
        id: action.payload?.id || `routine-${Date.now()}`,
        title: action.payload?.title || 'Untitled Routine',
        frequency: action.payload?.frequency || 'daily',
        daysOfWeek: action.payload?.daysOfWeek || [0, 1, 2, 3, 4, 5, 6],
        lastCompleted: null,
        streak: 0
      });
    },
    toggleRoutineToday: (state, action) => {
      const id = action.payload?.id;
      const routine = state.routines.find((entry) => entry.id === id);
      if (!routine) return;
      const today = new Date().toISOString().slice(0, 10);
      routine.lastCompleted = routine.lastCompleted === today ? null : today;
    }
  }
});

export const { addRoutine, toggleRoutineToday } = routinesSlice.actions;
export default routinesSlice.reducer;
