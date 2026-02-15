import { createSlice } from '@reduxjs/toolkit';

const seedOrganizations = [
  {
    id: 'org-1',
    name: 'Primary',
    inviteCode: 'ATHENEA-2026',
    domainRestriction: '',
    brandColor: '#1ec9ff',
    logoUrl: '',
    plan: 'starter',
    planId: 'starter',
    planType: 'starter',
    plan_type: 'starter',
    workerLimit: 10,
    worker_limit: 10,
    planPrice: 39,
    industry: '',
    adminContact: ''
  },
  {
    id: 'org-2',
    name: 'Secondary',
    inviteCode: 'SECONDARY-OPS',
    domainRestriction: '',
    brandColor: '#d4af37',
    logoUrl: '',
    plan: 'starter',
    planId: 'starter',
    planType: 'starter',
    plan_type: 'starter',
    workerLimit: 10,
    worker_limit: 10,
    planPrice: 39,
    industry: '',
    adminContact: ''
  }
];

const normalizePermissions = (entry) => {
  if (entry.permissions) return entry.permissions;
  if (Array.isArray(entry.roleAccess)) {
    return {
      view: [...entry.roleAccess],
      action: [...entry.roleAccess]
    };
  }
  return {
    view: ["Admin", "Manager", "Worker"],
    action: ["Admin", "Manager"]
  };
};

const normalizeWorkstreamRules = (entry) => ({
  require_manager_approval:
    typeof entry.require_manager_approval === 'boolean'
      ? entry.require_manager_approval
      : true,
  allow_worker_self_assign:
    typeof entry.allow_worker_self_assign === 'boolean'
      ? entry.allow_worker_self_assign
      : false,
  strict_dispatch:
    typeof entry.strict_dispatch === 'boolean'
      ? entry.strict_dispatch
      : true
});

const buildWorkstream = ({ orgId, id, label, leadId }) => ({
  id,
  orgId,
  label,
  leadId: leadId || null,
  enabled: true,
  permissions: normalizePermissions({}),
  ...normalizeWorkstreamRules({})
});

const seedWorkstreams = [
  buildWorkstream({ orgId: 'org-1', id: 'ws-logistics', label: 'Logistica', leadId: '2' }),
  buildWorkstream({ orgId: 'org-1', id: 'ws-safety', label: 'Seguridad', leadId: '3' }),
  buildWorkstream({ orgId: 'org-2', id: 'ws-logistics', label: 'Logistica', leadId: '1' }),
  buildWorkstream({ orgId: 'org-2', id: 'ws-facility', label: 'Facility Ops', leadId: null })
];

const seedMemberships = [
  {
    id: 'member-8',
    userId: '8',
    orgId: 'org-1',
    role: 'lead',
    status: 'active'
  },
  {
    id: 'member-9',
    userId: '9',
    orgId: 'org-1',
    role: 'worker',
    status: 'active'
  },
  {
    id: 'member-10',
    userId: '10',
    orgId: 'org-1',
    role: 'worker',
    status: 'active'
  }
];

const seedTeamMemberships = [
  {
    id: 'team-member-9-ws-logistics',
    orgId: 'org-1',
    teamId: 'ws-logistics',
    userId: '9'
  }
];

const organizationsSlice = createSlice({
  name: 'organizations',
  initialState: {
    organizations: seedOrganizations,
    workstreams: seedWorkstreams,
    teamMemberships: seedTeamMemberships,
    memberships: seedMemberships,
    currentOrgId: null
  },
  reducers: {
    setCurrentOrg: (state, action) => {
      state.currentOrgId = action.payload;
    },
    addOrganization: (state, action) => {
      const {
        id,
        name,
        inviteCode,
        brandColor,
        logoUrl,
        planId,
        planType,
        plan_type,
        workerLimit,
        worker_limit,
        planPrice,
        industry,
        adminContact
      } = action.payload;
      const resolvedPlanType = planType || plan_type || planId || 'starter';
      const resolvedWorkerLimit = workerLimit ?? worker_limit ?? 10;
      const exists = state.organizations.some((org) => org.id === id);
      if (exists) return;
      state.organizations.push({
        id,
        name,
        inviteCode,
        brandColor,
        logoUrl,
        plan: resolvedPlanType,
        planId: resolvedPlanType,
        planType: resolvedPlanType,
        plan_type: resolvedPlanType,
        workerLimit: resolvedWorkerLimit,
        worker_limit: resolvedWorkerLimit,
        planPrice: planPrice ?? 39,
        industry: industry || '',
        adminContact: adminContact || ''
      });
    },
    addMembership: (state, action) => {
      const { userId, orgId, role, status } = action.payload;
      const existing = state.memberships.find(
        (membership) => membership.userId === userId && membership.orgId === orgId
      );
      if (existing) {
        existing.role = role;
        existing.status = status;
        return;
      }
      state.memberships.push({
        id: Date.now().toString(),
        userId,
        orgId,
        role,
        status
      });
    },
    updateMembershipStatus: (state, action) => {
      const { membershipId, status } = action.payload;
      const membership = state.memberships.find((entry) => entry.id === membershipId);
      if (membership) {
        membership.status = status;
      }
    },
    updateMembershipRole: (state, action) => {
      const { membershipId, role } = action.payload;
      const membership = state.memberships.find((entry) => entry.id === membershipId);
      if (membership) {
        membership.role = role;
      }
    },
    updateOrganizationName: (state, action) => {
      const { orgId, name } = action.payload;
      const org = state.organizations.find((entry) => entry.id === orgId);
      if (org) {
        org.name = name;
      }
    },
    updateOrganizationBranding: (state, action) => {
      const { orgId, name, brandColor, logoUrl } = action.payload;
      const org = state.organizations.find((entry) => entry.id === orgId);
      if (org) {
        org.name = name ?? org.name;
        org.brandColor = brandColor ?? org.brandColor;
        org.logoUrl = logoUrl ?? org.logoUrl;
      }
    },
    updateInviteCode: (state, action) => {
      const { orgId, inviteCode } = action.payload;
      const org = state.organizations.find((entry) => entry.id === orgId);
      if (org) {
        org.inviteCode = inviteCode;
      }
    },
    setWorkstreamEnabled: (state, action) => {
      const { orgId, id, enabled } = action.payload;
      const workstream = state.workstreams.find(
        (entry) => entry.orgId === orgId && entry.id === id
      );
      if (workstream) {
        workstream.enabled = enabled;
      }
    },
    setWorkstreamPermissions: (state, action) => {
      const { orgId, id, permissions } = action.payload;
      const workstream = state.workstreams.find(
        (entry) => entry.orgId === orgId && entry.id === id
      );
      if (workstream) {
        workstream.permissions = permissions;
      }
    },
    setWorkstreamRules: (state, action) => {
      const { orgId, id, rules } = action.payload;
      const workstream = state.workstreams.find(
        (entry) => entry.orgId === orgId && entry.id === id
      );
      if (workstream) {
        workstream.require_manager_approval =
          typeof rules.require_manager_approval === 'boolean'
            ? rules.require_manager_approval
            : workstream.require_manager_approval;
        workstream.allow_worker_self_assign =
          typeof rules.allow_worker_self_assign === 'boolean'
            ? rules.allow_worker_self_assign
            : workstream.allow_worker_self_assign;
        workstream.strict_dispatch =
          typeof rules.strict_dispatch === 'boolean'
            ? rules.strict_dispatch
            : workstream.strict_dispatch;
      }
    },
    addWorkstream: (state, action) => {
      const { orgId, id, label, leadId } = action.payload;
      const exists = state.workstreams.some(
        (entry) => entry.orgId === orgId && entry.id === id
      );
      if (!exists) {
        state.workstreams.push(buildWorkstream({ orgId, id, label, leadId }));
      }
    },
    setWorkstreamLead: (state, action) => {
      const { orgId, id, leadId } = action.payload;
      const workstream = state.workstreams.find(
        (entry) => entry.orgId === orgId && entry.id === id
      );
      if (workstream) {
        workstream.leadId = leadId || null;
      }
    },
    updateWorkstreamLabel: (state, action) => {
      const { orgId, id, label } = action.payload;
      const workstream = state.workstreams.find(
        (entry) => entry.orgId === orgId && entry.id === id
      );
      if (workstream) {
        workstream.label = label;
      }
    },
    removeWorkstream: (state, action) => {
      const { orgId, id } = action.payload;
      state.workstreams = state.workstreams.filter(
        (entry) => !(entry.orgId === orgId && entry.id === id)
      );
      state.teamMemberships = state.teamMemberships.filter(
        (entry) => !(entry.orgId === orgId && entry.teamId === id)
      );
    },
    addTeamMember: (state, action) => {
      const { orgId, teamId, userId } = action.payload;
      const exists = state.teamMemberships.find(
        (entry) =>
          entry.orgId === orgId && entry.teamId === teamId && entry.userId === userId
      );
      if (!exists) {
        state.teamMemberships.push({
          id: Date.now().toString(),
          orgId,
          teamId,
          userId
        });
      }
    },
    removeTeamMember: (state, action) => {
      const { orgId, teamId, userId } = action.payload;
      state.teamMemberships = state.teamMemberships.filter(
        (entry) =>
          !(
            entry.orgId === orgId &&
            entry.teamId === teamId &&
            entry.userId === userId
          )
      );
    },
    expelMember: (state, action) => {
      const { orgId, userId } = action.payload;
      state.memberships = state.memberships.filter(
        (entry) => !(entry.orgId === orgId && entry.userId === userId)
      );
      state.teamMemberships = state.teamMemberships.filter(
        (entry) => !(entry.orgId === orgId && entry.userId === userId)
      );
      if (state.currentOrgId === orgId) {
        const remaining = state.memberships.find(
          (entry) => entry.orgId === orgId && entry.userId !== userId
        );
        if (!remaining && state.memberships.length === 0) {
          state.currentOrgId = null;
        }
      }
    }
  },
  extraReducers: (builder) => {
    builder.addCase('persist/REHYDRATE', (state, action) => {
      const incoming = action.payload?.organizations;
      if (!incoming) return;

      if (Array.isArray(incoming.organizations)) {
        state.organizations = incoming.organizations.map((org) => ({
          ...org,
          plan: org.plan || org.planId || org.planType || org.plan_type || 'starter',
          planId: org.planId || org.plan || org.planType || org.plan_type || 'starter',
          planType: org.planType || org.plan_type || org.planId || org.plan || 'starter',
          plan_type: org.plan_type || org.planType || org.planId || org.plan || 'starter',
          workerLimit: org.workerLimit ?? org.worker_limit ?? 10,
          worker_limit: org.worker_limit ?? org.workerLimit ?? 10,
          planPrice: org.planPrice ?? 39,
          industry: org.industry || '',
          adminContact: org.adminContact || ''
        }));
      }

      if (!Array.isArray(incoming.teamMemberships)) {
        state.teamMemberships = [];
      }

      const nextWorkstreams = incoming.workstreams;
      if (!Array.isArray(nextWorkstreams)) {
        state.workstreams = [];
        return;
      }

      state.workstreams = nextWorkstreams.map((entry) => ({
        ...entry,
        leadId: entry.leadId || null,
        permissions: normalizePermissions(entry),
        ...normalizeWorkstreamRules(entry)
      }));
    });
  }
});

export const {
  setCurrentOrg,
  addOrganization,
  addMembership,
  updateMembershipStatus,
  updateMembershipRole,
  updateOrganizationName,
  updateOrganizationBranding,
  updateInviteCode,
  setWorkstreamEnabled,
  setWorkstreamPermissions,
  setWorkstreamRules,
  setWorkstreamLead,
  addWorkstream,
  updateWorkstreamLabel,
  removeWorkstream,
  addTeamMember,
  removeTeamMember,
  expelMember
} = organizationsSlice.actions;
export default organizationsSlice.reducer;
