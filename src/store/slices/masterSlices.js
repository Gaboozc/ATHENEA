// Slices maestros para el Spreadsheet Maestro ATHENEA
// Cada slice representa una hoja lógica del sistema de gestión de proyectos.
// Puedes separar cada slice en su propio archivo si lo prefieres para mayor escalabilidad.
//
// Para conectar cada slice a la UI:
//   1. Usa useSelector(state => state.[sliceName].[array]) para acceder a los datos.
//   2. Usa useDispatch() y los reducers exportados para agregar/editar/eliminar.
//   3. Los modelos incluyen relaciones por ID (projectId, pointId, etc) para vincular entidades.
//   4. Puedes crear componentes de tabla, formularios o dashboards para cada slice.
//   5. Todos los datos se persisten automáticamente con redux-persist.

// Ejemplo de uso en un componente:
//   const { projects } = useSelector(state => state.projectsMaster);
//   const dispatch = useDispatch();
//   dispatch(projectsMasterSlice.actions.addProject({ ... }))

// Si necesitas migrar a archivos separados, simplemente copia cada slice y su initialState a un archivo propio.
import { createSlice } from '@reduxjs/toolkit';

// --- HOJA 1: PROJECTS_MASTER ---
export const projectsMasterSlice = createSlice({
  name: 'projectsMaster',
  initialState: { projects: [] },
  reducers: {
    addProject: (state, action) => { state.projects.push(action.payload); },
    updateProject: (state, action) => {
      const idx = state.projects.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) state.projects[idx] = { ...state.projects[idx], ...action.payload };
    },
    deleteProject: (state, action) => {
      state.projects = state.projects.filter(p => p.id !== action.payload);
    },
  },
});

// --- HOJA 2: POINTS_MASTER ---
export const pointsMasterSlice = createSlice({
  name: 'pointsMaster',
  initialState: { points: [] },
  reducers: {
    addPoint: (state, action) => { state.points.push(action.payload); },
    updatePoint: (state, action) => {
      const idx = state.points.findIndex(p => p.id === action.payload.id);
      if (idx !== -1) state.points[idx] = { ...state.points[idx], ...action.payload };
    },
    deletePoint: (state, action) => {
      state.points = state.points.filter(p => p.id !== action.payload);
    },
  },
});

// --- HOJA 4: POINTS_STATUS_HISTORY ---
export const pointsStatusHistorySlice = createSlice({
  name: 'pointsStatusHistory',
  initialState: { history: [] },
  reducers: {
    addHistory: (state, action) => { state.history.push(action.payload); },
  },
});

// --- HOJA 5: MODDOCS_REGISTRY ---
export const modDocsRegistrySlice = createSlice({
  name: 'modDocsRegistry',
  initialState: { modDocs: [] },
  reducers: {
    addModDoc: (state, action) => { state.modDocs.push(action.payload); },
  },
});

// --- HOJA 6: HARDWARE_INVENTORY ---
export const hardwareInventorySlice = createSlice({
  name: 'hardwareInventory',
  initialState: { hardware: [] },
  reducers: {
    addHardware: (state, action) => { state.hardware.push(action.payload); },
  },
});

// --- HOJA 7: MATERIALS_USAGE ---
export const materialsUsageSlice = createSlice({
  name: 'materialsUsage',
  initialState: { materials: [] },
  reducers: {
    addMaterial: (state, action) => { state.materials.push(action.payload); },
    deleteMaterial: (state, action) => {
      state.materials = state.materials.filter(m => m.id !== action.payload);
    },
  },
});

// --- HOJA 8: COMM_ROOMS ---
export const commRoomsSlice = createSlice({
  name: 'commRooms',
  initialState: { commRooms: [] },
  reducers: {
    addCommRoom: (state, action) => { state.commRooms.push(action.payload); },
  },
});

// --- HOJA 9: DAILY_REPORTS ---
export const dailyReportsSlice = createSlice({
  name: 'dailyReports',
  initialState: { dailyReports: [] },
  reducers: {
    addDailyReport: (state, action) => { state.dailyReports.push(action.payload); },
  },
});

// --- HOJA 10: USERS_ACCESS ---
export const usersAccessSlice = createSlice({
  name: 'usersAccess',
  initialState: { users: [] },
  reducers: {
    addUser: (state, action) => { state.users.push(action.payload); },
  },
});

// --- HOJA 11: APPROVALS_LOG ---
export const approvalsLogSlice = createSlice({
  name: 'approvalsLog',
  initialState: { approvals: [] },
  reducers: {
    addApproval: (state, action) => { state.approvals.push(action.payload); },
  },
});

// --- HOJA 12: NOTIFICATIONS_QUEUE ---
export const notificationsQueueSlice = createSlice({
  name: 'notificationsQueue',
  initialState: { notifications: [] },
  reducers: {
    addNotification: (state, action) => { state.notifications.push(action.payload); },
  },
});
