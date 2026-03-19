import { createSlice } from '@reduxjs/toolkit';

/* P-FIX-1: routinesSlice with completedDates[], real streak, deleteRoutine, updateRoutine */

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
        completedDates: [],  /* P-FIX-1: replaces single lastCompleted */
        streak: 0
      });
    },
    toggleRoutineToday: (state, action) => {
      const id = action.payload?.id;
      const routine = state.routines.find((entry) => entry.id === id);
      if (!routine) return;

      /* P-FIX-1: migrate legacy data that only has lastCompleted */
      if (!routine.completedDates) {
        routine.completedDates = routine.lastCompleted ? [routine.lastCompleted] : [];
      }

      const today = new Date().toISOString().slice(0, 10);
      const alreadyDone = routine.completedDates.includes(today);

      if (alreadyDone) {
        routine.completedDates = routine.completedDates.filter((d) => d !== today);
      } else {
        routine.completedDates = [...routine.completedDates, today];
      }

      /* Keep lastCompleted in sync for backward compat */
      routine.lastCompleted = alreadyDone
        ? ([...routine.completedDates].sort().reverse()[0] || null)
        : today;

      /* Recalculate streak: consecutive days back from today */
      let streak = 0;
      const check = new Date();
      while (true) {
        const dateStr = check.toISOString().slice(0, 10);
        if (routine.completedDates.includes(dateStr)) {
          streak++;
          check.setDate(check.getDate() - 1);
        } else {
          break;
        }
      }
      routine.streak = streak;
    },
    /* P-FIX-1: delete a routine */
    deleteRoutine: (state, action) => {
      state.routines = state.routines.filter((r) => r.id !== action.payload);
    },
    /* P-FIX-1: edit title and/or days of a routine */
    updateRoutine: (state, action) => {
      const { id, title, daysOfWeek } = action.payload || {};
      const routine = state.routines.find((r) => r.id === id);
      if (!routine) return;
      if (title !== undefined)      routine.title      = title;
      if (daysOfWeek !== undefined) routine.daysOfWeek = daysOfWeek;
    }
  }
});

export const { addRoutine, toggleRoutineToday, deleteRoutine, updateRoutine } = routinesSlice.actions;
export default routinesSlice.reducer;
