import { createSlice } from '@reduxjs/toolkit';
import { DEFAULT_WORKSTREAMS } from '../../utils/workstreams';

const seedOrganizations = [
  {
    id: 'org-1',
    name: 'Primary',
    inviteCode: 'ATHENEA-2026',
    domainRestriction: '',
    brandColor: '#1ec9ff',
    logoUrl: ''
  },
  {
    id: 'org-2',
    name: 'Secondary',
    inviteCode: 'SECONDARY-OPS',
    domainRestriction: '',
    brandColor: '#d4af37',
    logoUrl: ''
  }
];

const seedWorkstreams = (orgId) =>
  DEFAULT_WORKSTREAMS.map((stream) => ({
    ...stream,
    orgId
  }));

const normalizePermissions = (entry) => {
  if (entry.permissions) return entry.permissions;
  if (Array.isArray(entry.roleAccess)) {
    return {
      view: [...entry.roleAccess],
      action: [...entry.roleAccess]
    };
  }
  return {
    view: ["Engineer", "Sales", "Manager"],
    action: ["Engineer", "Manager"]
  };
};

const organizationsSlice = createSlice({
  name: 'organizations',
  initialState: {
    organizations: seedOrganizations,
    workstreams: [...seedWorkstreams('org-1'), ...seedWorkstreams('org-2')],
    teamMemberships: [],
    memberships: [],
    currentOrgId: null
  },
  reducers: {
    setCurrentOrg: (state, action) => {
      state.currentOrgId = action.payload;
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

      if (!Array.isArray(incoming.teamMemberships)) {
        state.teamMemberships = [];
      }

      const nextWorkstreams = incoming.workstreams;
      if (!Array.isArray(nextWorkstreams) || nextWorkstreams.length === 0) {
        state.workstreams = [
          ...seedWorkstreams('org-1'),
          ...seedWorkstreams('org-2')
        ];
        return;
      }

      const expectedIds = new Set(DEFAULT_WORKSTREAMS.map((stream) => stream.id));
      const incomingIds = new Set(nextWorkstreams.map((stream) => stream.id));
      const missingTeam = [...expectedIds].some((id) => !incomingIds.has(id));

      if (missingTeam) {
        const orgIds = Array.from(
          new Set(nextWorkstreams.map((stream) => stream.orgId).filter(Boolean))
        );
        state.workstreams = orgIds.flatMap((orgId) => seedWorkstreams(orgId));
        return;
      }

      state.workstreams = nextWorkstreams.map((entry) => ({
        ...entry,
        permissions: normalizePermissions(entry)
      }));
    });
  }
});

export const {
  setCurrentOrg,
  addMembership,
  updateMembershipStatus,
  updateMembershipRole,
  updateOrganizationName,
  updateOrganizationBranding,
  updateInviteCode,
  setWorkstreamEnabled,
  setWorkstreamPermissions,
  addTeamMember,
  removeTeamMember,
  expelMember
} = organizationsSlice.actions;
export default organizationsSlice.reducer;
