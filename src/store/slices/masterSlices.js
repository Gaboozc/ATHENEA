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
const initialProjects = [
  {
    id: 'P-001',
    name: 'Torre Norte',
    client: 'ABC Corp',
    startDate: '2024-01-15',
    endDate: '2024-06-30',
    budgetHours: 1200,
    status: 'Active',
    pmAssigned: 'Maria Lopez',
  },
];

export const projectsMasterSlice = createSlice({
  name: 'projectsMaster',
  initialState: { projects: initialProjects },
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
const initialPoints = [
  {
    id: 'PT-001',
    projectId: 'P-001',
    label: 'A-15-01',
    building: 'Edificio A',
    floor: '15',
    room: 'Oficina 101',
    status: 'Certified',
    technician: 'Juan Perez',
    leadTech: 'Carlos R.',
    createdDate: '2024-05-15',
    certifiedDate: '2024-05-20',
  },
];

export const pointsMasterSlice = createSlice({
  name: 'pointsMaster',
  initialState: { points: initialPoints },
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
const initialPointsHistory = [
  {
    id: 'H-001',
    pointId: 'PT-001',
    previousStatus: 'In Progress',
    newStatus: 'Terminated',
    changedBy: 'Juan Perez',
    timestamp: '2024-05-18T14:30',
    notes: 'Completado instalación',
  },
];

export const pointsStatusHistorySlice = createSlice({
  name: 'pointsStatusHistory',
  initialState: { history: initialPointsHistory },
  reducers: {
    addHistory: (state, action) => { state.history.push(action.payload); },
  },
});

// --- HOJA 5: MODDOCS_REGISTRY ---
const initialModDocs = [
  {
    id: 'MD-001',
    projectId: 'P-001',
    planId: 'FP-001',
    description: 'Agregar punto A-15-25',
    changeType: 'Addition',
    createdBy: 'Ana Silva',
    approvedBy: 'Maria Lopez',
    createdDate: '2024-05-22',
    approvedDate: '2024-05-23',
  },
];

export const modDocsRegistrySlice = createSlice({
  name: 'modDocsRegistry',
  initialState: { modDocs: initialModDocs },
  reducers: {
    addModDoc: (state, action) => { state.modDocs.push(action.payload); },
  },
});

// --- HOJA 6: HARDWARE_INVENTORY ---
const initialHardware = [
  {
    id: 'HW-001',
    projectId: 'P-001',
    pointId: 'PT-001',
    type: 'AP',
    brand: 'Cisco',
    model: 'AIR-AP2802I',
    serialNumber: 'FGL2345X',
    macAddress: '00:1B:44...',
    installDate: '2024-05-15',
    warrantyUntil: '2026-05-15',
  },
];

export const hardwareInventorySlice = createSlice({
  name: 'hardwareInventory',
  initialState: { hardware: initialHardware },
  reducers: {
    addHardware: (state, action) => { state.hardware.push(action.payload); },
  },
});

// --- HOJA 7: MATERIALS_USAGE ---
const initialMaterials = [
  {
    id: 'MAT-001',
    projectId: 'P-001',
    pointId: 'PT-001',
    materialType: 'UTP Cat6',
    quantityUsed: 15,
    unit: 'meters',
    technician: 'Juan Perez',
    dateUsed: '2024-05-15',
    cost: 45.00,
  },
];

export const materialsUsageSlice = createSlice({
  name: 'materialsUsage',
  initialState: { materials: initialMaterials },
  reducers: {
    addMaterial: (state, action) => { state.materials.push(action.payload); },
    deleteMaterial: (state, action) => {
      state.materials = state.materials.filter(m => m.id !== action.payload);
    },
  },
});

// --- HOJA 8: COMM_ROOMS ---
const initialCommRooms = [
  {
    id: 'CR-001',
    projectId: 'P-001',
    location: 'Piso 15-Sala A',
    status: 'Completed',
    leadTech: 'Carlos R.',
    startDate: '2024-05-10',
    completeDate: '2024-05-12',
    checklistScore: '95%',
  },
];

export const commRoomsSlice = createSlice({
  name: 'commRooms',
  initialState: { commRooms: initialCommRooms },
  reducers: {
    addCommRoom: (state, action) => { state.commRooms.push(action.payload); },
  },
});

// --- HOJA 9: DAILY_REPORTS ---
const initialDailyReports = [
  {
    id: 'DR-001',
    projectId: 'P-001',
    reportDate: '2024-05-25',
    reportedBy: 'Carlos R.',
    role: 'Lead Tech',
    content: '{}',
    pointsCompleted: 8,
    issuesReported: 2,
    materialsUsed: 'UTP:45m, Conn:8',
  },
];

export const dailyReportsSlice = createSlice({
  name: 'dailyReports',
  initialState: { dailyReports: initialDailyReports },
  reducers: {
    addDailyReport: (state, action) => { state.dailyReports.push(action.payload); },
  },
});

// --- HOJA 10: USERS_ACCESS ---
const initialUsersAccess = [
  {
    id: 'U-001',
    name: 'Carlos Rodriguez',
    role: 'Lead Tech',
    email: 'c.rodriguez@corp.com',
    phone: '+123456',
    specialization: 'Data/Fiber',
    assignedProjects: ['P-001', 'P-002'],
    active: true,
  },
];

export const usersAccessSlice = createSlice({
  name: 'usersAccess',
  initialState: { users: initialUsersAccess },
  reducers: {
    addUser: (state, action) => { state.users.push(action.payload); },
  },
});

// --- HOJA 11: APPROVALS_LOG ---
const initialApprovals = [
  {
    id: 'APP-001',
    projectId: 'P-001',
    itemType: 'ModDoc',
    itemId: 'MD-001',
    requestedBy: 'Ana Silva',
    approvedBy: 'Maria Lopez',
    status: 'Approved',
    requestDate: '2024-05-22',
    approvalDate: '2024-05-23',
  },
];

export const approvalsLogSlice = createSlice({
  name: 'approvalsLog',
  initialState: { approvals: initialApprovals },
  reducers: {
    addApproval: (state, action) => { state.approvals.push(action.payload); },
  },
});

// --- HOJA 12: NOTIFICATIONS_QUEUE ---
const initialNotifications = [
  {
    id: 'N-001',
    userId: 'U-001',
    type: 'Alert',
    priority: 'High',
    message: 'Falta material UTP en Piso 15',
    sentDate: '2024-05-25 09:00',
    readStatus: 'Unread',
    actionRequired: true,
  },
];

export const notificationsQueueSlice = createSlice({
  name: 'notificationsQueue',
  initialState: { notifications: initialNotifications },
  reducers: {
    addNotification: (state, action) => { state.notifications.push(action.payload); },
  },
});
