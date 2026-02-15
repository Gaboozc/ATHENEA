// Normalize roles (alias)
export const normalizeRole = (role) => {
  const roleKey = String(role || '').toLowerCase();
  if (roleKey === 'admin') return 'super-admin';
  if (roleKey === 'manager') return 'pm';
  if (roleKey === 'worker') return 'technician';
  return roleKey;
};

// Define granular permissions per role according to the provided matrix
export const PERMISSIONS = {
  // Super Admin - Owner level (above PM)
  // Responsible for: Assigning PMs to projects, distributing personnel, global oversight
  'super-admin': {
    dashboard: { view: true, viewGlobalMetrics: true, viewAllProjects: true },
    projects: {
      viewAll: true, viewAssigned: false, create: true, edit: true, delete: true, configure: true,
      close: true, assignBudget: true, assignPM: true, assignSupervisor: true, assignLeadTech: true
    },
    users: {
      viewAll: true, createSuperAdmin: true, createPM: true, createSupervisor: true, createLeadTech: true, createTech: true,
      assignRoles: true, approveLeadAssignment: true, assignLeadTech: true, assignToPM: true, movePersonnel: true
    },
    inventory: { viewAll: true, viewProject: true, approveRequests: true, transfer: true },
    modDocs: { create: true, approve: true, overrideSupervisor: true },
    points: {
      viewAll: true, viewGroup: true, viewOwn: true,
      create: true, changeAnyStatus: true, certify: true
    },
    materials: { viewInventoryGlobal: true, viewProject: true, request: true, approveAny: true, viewUsageReports: true },
    production: { createTask: true, assignTask: true, viewAll: true, editTask: true, deleteTask: true },
    reports: { viewGlobal: true, viewProjects: true, viewTeams: true, generate: true, export: true },
    approvals: { approveAny: true, override: true, approveLeadAssignment: true },
    system: { configureRules: true, defineStandards: true, reportTemplates: true, manageClients: true },
  },

  // Project Manager (PM) - maximum level
  // Responsible for: Managing assigned projects, creating projects, assigning and approving lead tech assignments, project-level oversight
  pm: {
    dashboard: { view: true, viewGlobalMetrics: true, viewAllProjects: false },
    projects: {
      viewAll: false, viewAssigned: true, create: true, edit: true, delete: true, configure: true,
      close: true, assignBudget: true, assignSupervisor: true, assignLeadTech: true
    },
    users: {
      viewAll: false, viewAssigned: true, createPM: false, createSupervisor: true, createLeadTech: true, createTech: true,
      assignRoles: true, approveLeadAssignment: true, assignLeadTech: true, viewGroupInfo: true
    },
    inventory: { viewAll: true, viewProject: true, approveRequests: true, transfer: true },
    modDocs: { create: true, approve: true, overrideSupervisor: true },
    points: {
      viewAll: true, viewGroup: true, viewOwn: true,
      create: true, changeAnyStatus: true, certify: true
    },
    materials: { viewInventoryGlobal: true, viewProject: true, request: true, approveAny: true, viewUsageReports: true },
    production: { createTask: true, assignTask: true, viewAll: true, editTask: true, deleteTask: true },
    reports: { viewGlobal: true, viewProjects: true, viewTeams: true, generate: true, export: true },
    approvals: { approveAny: true, override: true, approveLeadAssignment: true },
    system: { configureRules: true, defineStandards: true, reportTemplates: true, manageClients: true },
  },

  // Supervisor (Project Lead)
  // Responsible for: Creating tasks, assigning Lead Techs (pending PM approval), managing project execution
  supervisor: {
    dashboard: { view: true, viewGlobalMetrics: false },
    projects: {
      viewAll: false, viewAssigned: true, create: false, edit: true, delete: false, configure: true,
      assignLeadTech: true, assignTechnicians: true // assignLeadTech requires PM approval
    },
    users: { viewAll: true, createPM: false, createSupervisor: false, createLeadTech: true, createTech: true, assignRoles: true },
    inventory: { viewAll: true, viewProject: true, approveRequests: true, transfer: true },
    modDocs: { create: true, approve: false /* can be enabled by PM via config */ },
    points: {
      viewAll: true /* of assigned projects */, viewGroup: true, viewOwn: true,
      create: true, changeAnyStatus: true, certify: true
    },
    materials: { viewInventoryGlobal: true, viewProject: true, request: true, approveTeam: true, viewUsageReports: true },
    production: { createTask: true, assignTask: true, viewAll: true, editTask: true, deleteTask: true },
    reports: { viewGlobal: false, viewProjects: true, viewTeams: true, generate: true, export: true },
    approvals: { approveTeam: true, override: false, requestLeadAssignment: true },
    system: { configureRules: false, defineStandards: false },
  },

  // Lead Technician
  // Responsible for: Distributing tasks among team members, monitoring team progress, viewing group
  'lead-technician': {
    dashboard: { view: true, viewGlobalMetrics: false, viewGroupInfo: true },
    projects: { viewAll: false, viewAssigned: true, create: false, edit: false, delete: false, configure: false },
    users: { viewAll: false, viewTeam: false, viewGroup: true },
    inventory: { viewAll: false, viewProject: true, approveRequests: true /* team only */, transfer: false },
    modDocs: { create: false, approve: false },
    points: {
      viewAll: false, viewGroup: true, viewOwn: true,
      create: false, changeGroupStatus: true, changeOwnStatus: true, certify: true
    },
    materials: { viewInventoryGlobal: false, viewProject: true, request: true, approveTeam: true, viewUsageReports: true },
    production: { createTask: false, assignTask: true, viewGroup: true, editGroupTask: true, deleteTask: false },
    reports: { viewGlobal: false, viewProjects: false, viewTeams: true, generate: true /* daily */, export: false },
    approvals: { approveTeam: true },
    system: { configureRules: false },
  },

  // Technician
  // Responsible for: Completing assigned tasks, viewing group tasks
  technician: {
    dashboard: { view: true, viewGlobalMetrics: false, viewGroupInfo: false },
    projects: { viewAll: false, viewAssigned: false, create: false, edit: false, delete: false, configure: false },
    users: { viewAll: false, viewTeam: false, viewGroup: false },
    inventory: { viewAll: false, viewProject: false, approveRequests: false, transfer: false },
    modDocs: { create: false, approve: false },
    points: {
      viewAll: false, viewGroup: false, viewOwn: true,
      create: false, changeOwnStatus: true, certify: false
    },
    materials: { viewInventoryGlobal: false, viewProject: false, request: false, approveTeam: false, viewUsageReports: false },
    production: { createTask: false, assignTask: false, viewGroup: false, editOwnTask: true, completeOwnTask: true },
    reports: { viewGlobal: false, viewProjects: false, viewTeams: false, generate: false, export: false },
    approvals: { approveTeam: false },
    system: { configureRules: false },
  },
};

// Helper: check permission of a module/action for a role
export const hasPermission = (userRole, module, action) => {
  const role = normalizeRole(userRole);
  if (!role || !PERMISSIONS[role]) return false;
  const mod = PERMISSIONS[role][module];
  if (!mod) return false;
  if (action === undefined) return !!mod; // any access to module
  return !!mod[action];
};

// Route access helpers
export const canAccessRoute = (userRole, route) => {
  const role = normalizeRole(userRole);
  const routePermissions = {
    '/dashboard': () => hasPermission(role, 'dashboard', 'view'),
    '/projects': () => hasPermission(role, 'projects', 'viewAssigned') || hasPermission(role, 'projects', 'viewAll'),
    '/projects/create': () => hasPermission(role, 'projects', 'create'),
    '/users': () => hasPermission(role, 'users', 'viewAll') || hasPermission(role, 'users', 'viewTeam'),
    '/inventory': () => hasPermission(role, 'inventory', 'viewProject') || hasPermission(role, 'inventory', 'viewAll'),
    '/production': () => hasPermission(role, 'reports', 'viewProjects') || hasPermission(role, 'reports', 'viewTeams') || hasPermission(role, 'production', 'view'),
  };
  const checker = routePermissions[route];
  return checker ? checker() : true;
};

// Labels for roles
export const getRoleLabel = (role) => {
  const normalized = normalizeRole(role);
  const labels = {
    'super-admin': 'Super Admin',
    pm: 'Project Manager',
    supervisor: 'Supervisor',
    'lead-technician': 'Lead Technician',
    technician: 'Technician',
  };
  return labels[normalized] || normalized;
};
