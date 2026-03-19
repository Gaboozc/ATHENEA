import { createSlice } from '@reduxjs/toolkit';

const focusSlice = createSlice({
  name: 'focus',
  initialState: {
    sessions: [],          // completed Pomodoro sessions
    totalMinutes: 0,       // lifetime focused minutes
    currentTaskId: null,   // task linked to current/last session
    currentSession: null,  // FIX-D: { startedAt: ISO, durationSeconds: number } — persisted for crash recovery
  },
  reducers: {
    recordSession: (state, action) => {
      const { taskId, taskTitle, durationMinutes, completedAt } = action.payload || {};
      state.sessions.unshift({
        id: `focus-${Date.now()}`,
        taskId: taskId || null,
        taskTitle: taskTitle || '',
        durationMinutes: Number(durationMinutes) || 25,
        completedAt: completedAt || new Date().toISOString(),
      });
      state.totalMinutes += Number(durationMinutes) || 25;
      if (state.sessions.length > 100) {
        state.sessions = state.sessions.slice(0, 100);
      }
      state.currentSession = null; // FIX-D: clear active session on complete
    },
    setCurrentTask: (state, action) => {
      state.currentTaskId = action.payload || null;
    },
    startSession: (state, action) => { /* FIX-D: called when timer starts, enables crash recovery */
      state.currentSession = {
        startedAt: new Date().toISOString(),
        durationSeconds: Number(action.payload) || 25 * 60,
      };
    },
    clearSession: (state) => { /* FIX-D: called on reset/cancel */
      state.currentSession = null;
    },
  },
});

export const { recordSession, setCurrentTask, startSession, clearSession } = focusSlice.actions;
export default focusSlice.reducer;
