import { createSlice } from '@reduxjs/toolkit';

const initialProjects = [
  {
    id: '1',
    name: 'Office Building A',
    description: 'Network infrastructure for 5-floor office building',
    clientName: 'TechCorp Inc.',
    siteAddress: '123 Main St, New York, NY 10001',
    status: 'in-progress',
    startDate: '2025-01-15',
    completionPercentage: 65,
    totalPoints: 150,
    completedPoints: 98,
    floorplans: [],
    pmId: '2', // Asignado a PM 1
  },
  {
    id: '2',
    name: 'Warehouse Data Center',
    description: 'Complete data center cabling and infrastructure',
    clientName: 'Global Logistics Ltd.',
    siteAddress: '456 Industrial Pkwy, Chicago, IL 60601',
    status: 'planning',
    startDate: '2025-02-01',
    completionPercentage: 20,
    totalPoints: 200,
    completedPoints: 40,
    pmId: '3', // Asignado a PM 2
  },
  {
    id: '3',
    name: 'Hospital Network Upgrade',
    description: 'Hospital-wide network upgrade with fiber optics',
    clientName: 'City General Hospital',
    siteAddress: '789 Medical Dr, Los Angeles, CA 90001',
    status: 'completed',
    startDate: '2024-10-01',
    completionPercentage: 100,
    totalPoints: 300,
    completedPoints: 300,
    pmId: '2', // Asignado a PM 1
  },
];

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: initialProjects,
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
        status: 'planning',
        completionPercentage: 0,
        totalPoints: 0,
        completedPoints: 0,
        floorplans: [],
      };
      state.projects.unshift(newProject);
    },
    updateProject: (state, action) => {
      const index = state.projects.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        // If updating floorplans, merge arrays
        if (action.payload.floorplans) {
          state.projects[index].floorplans = action.payload.floorplans;
        }
        state.projects[index] = { ...state.projects[index], ...action.payload };
      }
    },
    deleteProject: (state, action) => {
      state.projects = state.projects.filter((p) => p.id !== action.payload);
    },
  },
});

export const { setCurrentProject, addProject, updateProject, deleteProject } =
  projectsSlice.actions;
export default projectsSlice.reducer;
