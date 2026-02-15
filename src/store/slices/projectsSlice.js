import { createSlice } from '@reduxjs/toolkit';

const buildSeedProjects = () => [
  {
    id: '1',
    name: 'ATHENEA Engine Evolution',
    description: 'Core priority intelligence and governance upgrades.',
    clientName: 'ATHENEA Core',
    siteAddress: 'Command Layer',
    orgId: 'org-1',
    workstreamId: 'ws-logistics',
    workstreamName: 'Logistica',
    status: 'in-progress',
    startDate: '2026-02-01',
    endDate: '',
    maintenancePlan: '',
    completionPercentage: 45,
    totalPoints: 100,
    completedPoints: 45,
    tasks: ['Scale dynamic pools', 'Refine role-based weights', 'Implement audit logs'],
    pmId: '2',
  },
  {
    id: '2',
    name: 'Tactical Dashboard UI/UX',
    description: 'Precision layout and command-grade interaction polish.',
    clientName: 'ATHENEA Experience',
    siteAddress: 'Ops Interface',
    orgId: 'org-1',
    workstreamId: 'ws-safety',
    workstreamName: 'Seguridad',
    status: 'completed',
    startDate: '2026-02-05',
    endDate: '2026-02-28',
    maintenancePlan: '',
    completionPercentage: 100,
    totalPoints: 80,
    completedPoints: 80,
    tasks: ['Apply premium palette', 'Design high-density cards', 'Mobile responsiveness'],
    pmId: '3',
  },
  {
    id: '3',
    name: 'Supabase Neural Bridge',
    description: 'Data persistence backbone and integration scaffolding.',
    clientName: 'ATHENEA Systems',
    siteAddress: 'Data Layer',
    orgId: 'org-1',
    workstreamId: 'ws-logistics',
    workstreamName: 'Logistica',
    status: 'maintenance',
    startDate: '2026-01-15',
    endDate: '',
    maintenancePlan: 'Monthly maintenance cadence',
    completionPercentage: 100,
    totalPoints: 60,
    completedPoints: 60,
    tasks: ['Baseline schema design', 'Auth bypass logic', 'Client initialization'],
    pmId: '2',
  },
];

const LEGACY_PROJECTS = new Set([
  'Office Building A',
  'Warehouse Data Center',
  'Hospital Network Upgrade'
]);

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: buildSeedProjects(),
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

      const hasOnlyLegacy = incoming.every((project) => LEGACY_PROJECTS.has(project.name));
      if (hasOnlyLegacy) {
        state.projects = buildSeedProjects();
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
