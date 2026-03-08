import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  stats: {
    totalTasksCompleted: 0,
    currentStreak: 0,
    lastActiveDate: null
  },
  achievements: [],
  level: 1,
  xp: 0,
  xpToNextLevel: 100
};

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    initializeAchievements: (state) => {
      if (state.achievements.length === 0) {
        state.achievements = [
          {
            id: 'first_task',
            title: 'First Steps',
            unlocked: false,
            progress: 0,
            maxProgress: 1
          }
        ];
      }
    },
    taskCompleted: (state) => {
      state.stats.totalTasksCompleted += 1;
      state.xp += 10;
    },
    updateStreak: (state) => {
      const today = new Date().toDateString();
      if (state.stats.lastActiveDate !== today) {
        state.stats.currentStreak += 1;
        state.stats.lastActiveDate = today;
      }
    },
    resetStats: () => initialState,
    noteCreated: () => {},
    projectCompleted: () => {},
    todoCompleted: () => {},
    tagUsed: () => {}
  }
});

export const {
  initializeAchievements,
  taskCompleted,
  updateStreak,
  resetStats,
  noteCreated,
  projectCompleted,
  todoCompleted,
  tagUsed
} = statsSlice.actions;

export default statsSlice.reducer;
