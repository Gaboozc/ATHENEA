import { createSlice } from '@reduxjs/toolkit';

const LEGACY_PROJECTS = new Set([
  'Office Building A',
  'Warehouse Data Center',
  'Hospital Network Upgrade'
]);

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: [],
    currentProject: null,
    isLoading: false,
  },
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    addProject: (state, action) => {
      const newProject = {
        ...action.payload,
        id: Date.now().toString(),
        orgId: action.payload.orgId || 'org-1',
        workstreamId: action.payload.workstreamId || 'ws-logistics',
        workstreamName: action.payload.workstreamName || 'Logistica',
        status: 'planning',
        completionPercentage: 0,
        totalPoints: 0,
        completedPoints: 0,
        endDate: action.payload.endDate || '',
        maintenancePlan: action.payload.maintenancePlan || '',
      };
      state.projects.unshift(newProject);
    },
    updateProject: (state, action) => {
      const index = state.projects.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.projects[index] = { ...state.projects[index], ...action.payload };
      }
    },
    deleteProject: (state, action) => {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
    },
  },
  extraReducers: (builder) => {
    builder.addCase('persist/REHYDRATE', (state, action) => {
      const incoming = action.payload?.projects?.projects;
      if (!incoming || incoming.length === 0) return;

      // Clean up legacy projects
      const hasOnlyLegacy = incoming.every((project) => LEGACY_PROJECTS.has(project.name));
      if (hasOnlyLegacy) {
        state.projects = [];
        return;
      }

      state.projects = incoming.map((project) => ({
        ...project,
        workstreamId: project.workstreamId || 'ws-logistics',
        workstreamName: project.workstreamName || 'Logistica'
      }));
    });
  },
});

export const { setCurrentProject, addProject, updateProject, deleteProject } =
  projectsSlice.actions;
export default projectsSlice.reducer;
