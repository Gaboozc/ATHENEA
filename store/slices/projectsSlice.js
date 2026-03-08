import { createSlice } from '@reduxjs/toolkit';

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: [],
    currentProject: null,
    isLoading: false
  },
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    addProject: (state, action) => {
      state.projects.unshift({
        id: action.payload?.id || `project-${Date.now()}`,
        name: action.payload?.name || action.payload?.title || 'Untitled Project',
        status: action.payload?.status || 'planning',
        tasks: action.payload?.tasks || [],
        createdAt: new Date().toISOString(),
        ...action.payload
      });
    },
    updateProject: (state, action) => {
      const { id, ...updates } = action.payload || {};
      const target = state.projects.find((entry) => entry.id === id);
      if (target) Object.assign(target, updates);
    },
    deleteProject: (state, action) => {
      state.projects = state.projects.filter((entry) => entry.id !== action.payload);
    }
  }
});

export const { setCurrentProject, addProject, updateProject, deleteProject } = projectsSlice.actions;
export default projectsSlice.reducer;
