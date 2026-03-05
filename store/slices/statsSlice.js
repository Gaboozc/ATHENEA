import { createSlice } from '@reduxjs/toolkit';

/**
 * Stats & Achievements Slice
 * Tracks user progress, milestones, and gamification elements
 */

const initialState = {
  stats: {
    totalTasksCompleted: 0,
    totalProjectsCompleted: 0,
    totalNotesCreated: 0,
    totalTodosCompleted: 0,
    currentStreak: 0,
    longestStreak: 0,
    lastActiveDate: null,
    totalActiveTime: 0, // minutes
    categoriesUsed: [],
    tagsUsed: [],
  },
  achievements: [
    // Format: { id, title, description, icon, unlocked, unlockedDate, progress, maxProgress }
  ],
  level: 1,
  xp: 0,
  xpToNextLevel: 100,
};

// Achievement definitions
const ACHIEVEMENTS = [
  { id: 'first_task', title: 'First Steps', description: 'Complete your first task', icon: '🎯', maxProgress: 1, xpReward: 10 },
  { id: 'task_master_10', title: 'Task Master', description: 'Complete 10 tasks', icon: '✨', maxProgress: 10, xpReward: 50 },
  { id: 'task_master_50', title: 'Task Veteran', description: 'Complete 50 tasks', icon: '🏆', maxProgress: 50, xpReward: 100 },
  { id: 'task_master_100', title: 'Task Legend', description: 'Complete 100 tasks', icon: '👑', maxProgress: 100, xpReward: 200 },
  { id: 'first_project', title: 'Project Starter', description: 'Create your first project', icon: '📋', maxProgress: 1, xpReward: 15 },
  { id: 'project_pro', title: 'Project Pro', description: 'Complete 5 projects', icon: '🎖️', maxProgress: 5, xpReward: 75 },
  { id: 'note_taker', title: 'Note Taker', description: 'Create 10 notes', icon: '📝', maxProgress: 10, xpReward: 25 },
  { id: 'streak_3', title: '3 Day Streak', description: 'Stay active for 3 days in a row', icon: '🔥', maxProgress: 3, xpReward: 30 },
  { id: 'streak_7', title: 'Week Warrior', description: 'Stay active for 7 days in a row', icon: '⚡', maxProgress: 7, xpReward: 70 },
  { id: 'streak_30', title: 'Monthly Champion', description: 'Stay active for 30 days in a row', icon: '💪', maxProgress: 30, xpReward: 150 },
  { id: 'early_bird', title: 'Early Bird', description: 'Complete a task before 9 AM', icon: '🌅', maxProgress: 1, xpReward: 20 },
  { id: 'night_owl', title: 'Night Owl', description: 'Complete a task after 9 PM', icon: '🦉', maxProgress: 1, xpReward: 20 },
  { id: 'organized', title: 'Organized', description: 'Use 5 different tags', icon: '🏷️', maxProgress: 5, xpReward: 35 },
  { id: 'payment_tracker', title: 'Payment Tracker', description: 'Track 5 payments', icon: '💰', maxProgress: 5, xpReward: 40 },
];

const statsSlice = createSlice({
  name: 'stats',
  initialState,
  reducers: {
    // Initialize achievements
    initializeAchievements: (state) => {
      state.achievements = ACHIEVEMENTS.map(ach => ({
        ...ach,
        unlocked: false,
        unlockedDate: null,
        progress: 0,
      }));
    },

    // Track task completion
    taskCompleted: (state) => {
      state.stats.totalTasksCompleted += 1;
      statsSlice.caseReducers.checkAchievements(state);
      statsSlice.caseReducers.addXP(state, { payload: 10 });
      statsSlice.caseReducers.updateStreak(state);
    },

    // Track project completion
    projectCompleted: (state) => {
      state.stats.totalProjectsCompleted += 1;
      statsSlice.caseReducers.checkAchievements(state);
      statsSlice.caseReducers.addXP(state, { payload: 25 });
    },

    // Track note creation
    noteCreated: (state) => {
      state.stats.totalNotesCreated += 1;
      statsSlice.caseReducers.checkAchievements(state);
      statsSlice.caseReducers.addXP(state, { payload: 5 });
    },

    // Track todo completion
    todoCompleted: (state) => {
      state.stats.totalTodosCompleted += 1;
      statsSlice.caseReducers.addXP(state, { payload: 5 });
      statsSlice.caseReducers.updateStreak(state);
    },

    // Track tag usage
    tagUsed: (state, action) => {
      const tag = action.payload;
      if (!state.stats.tagsUsed.includes(tag)) {
        state.stats.tagsUsed.push(tag);
        statsSlice.caseReducers.checkAchievements(state);
      }
    },

    // Update streak
    updateStreak: (state) => {
      const today = new Date().toDateString();
      const lastActive = state.stats.lastActiveDate;
      
      if (!lastActive) {
        state.stats.currentStreak = 1;
        state.stats.lastActiveDate = today;
      } else if (lastActive !== today) {
        const yesterday = new Date(Date.now() - 86400000).toDateString();
        if (lastActive === yesterday) {
          state.stats.currentStreak += 1;
        } else {
          state.stats.currentStreak = 1;
        }
        state.stats.lastActiveDate = today;
      }
      
      if (state.stats.currentStreak > state.stats.longestStreak) {
        state.stats.longestStreak = state.stats.currentStreak;
      }
      
      statsSlice.caseReducers.checkAchievements(state);
    },

    // Add XP and check level up
    addXP: (state, action) => {
      state.xp += action.payload;
      
      while (state.xp >= state.xpToNextLevel) {
        state.xp -= state.xpToNextLevel;
        state.level += 1;
        state.xpToNextLevel = Math.floor(state.xpToNextLevel * 1.5);
      }
    },

    // Check and unlock achievements
    checkAchievements: (state) => {
      state.achievements.forEach((achievement) => {
        if (achievement.unlocked) return;

        let currentProgress = 0;

        // Calculate progress based on achievement type
        if (achievement.id.includes('task_master')) {
          currentProgress = state.stats.totalTasksCompleted;
        } else if (achievement.id === 'first_task') {
          currentProgress = state.stats.totalTasksCompleted;
        } else if (achievement.id.includes('project')) {
          currentProgress = state.stats.totalProjectsCompleted;
        } else if (achievement.id.includes('note')) {
          currentProgress = state.stats.totalNotesCreated;
        } else if (achievement.id.includes('streak')) {
          currentProgress = state.stats.currentStreak;
        } else if (achievement.id === 'organized') {
          currentProgress = state.stats.tagsUsed.length;
        }

        achievement.progress = currentProgress;

        // Unlock if progress reached
        if (currentProgress >= achievement.maxProgress && !achievement.unlocked) {
          achievement.unlocked = true;
          achievement.unlockedDate = new Date().toISOString();
          // Add XP reward
          state.xp += achievement.xpReward;
        }
      });
    },

    // Manual unlock (for special achievements)
    unlockAchievement: (state, action) => {
      const achievement = state.achievements.find(a => a.id === action.payload);
      if (achievement && !achievement.unlocked) {
        achievement.unlocked = true;
        achievement.unlockedDate = new Date().toISOString();
        state.xp += achievement.xpReward;
      }
    },

    // Reset stats (for testing or user request)
    resetStats: (state) => {
      return initialState;
    },
  },
});

export const {
  initializeAchievements,
  taskCompleted,
  projectCompleted,
  noteCreated,
  todoCompleted,
  tagUsed,
  updateStreak,
  addXP,
  checkAchievements,
  unlockAchievement,
  resetStats,
} = statsSlice.actions;

export default statsSlice.reducer;
