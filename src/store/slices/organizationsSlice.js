import { createSlice } from '@reduxjs/toolkit';

// Single-user mode: una organización por defecto
const DEFAULT_ORG = {
  id: 'org-personal',
  name: 'Personal',
  brandColor: '#1ec9ff',
  logoUrl: '',
};

const buildWorkstream = ({ id, label }) => ({
  id,
  orgId: 'org-personal',
  label,
  enabled: true,
});

const organizationsSlice = createSlice({
  name: 'organizations',
  initialState: {
    organizations: [DEFAULT_ORG],
    workstreams: [],
    teamMemberships: [],
    memberships: [],
    currentOrgId: 'org-personal'
  },
  reducers: {
    setCurrentOrg: (state, action) => {
      state.currentOrgId = action.payload;
    },
    addOrganization: (state, action) => {
      const newOrg = action.payload;
      const exists = state.organizations.some((org) => org.id === newOrg.id);
      if (!exists) {
        state.organizations.push(newOrg);
      }
    },
    addMembership: (state, action) => {
      const membership = action.payload;
      const exists = state.memberships.some(
        (entry) => entry.orgId === membership.orgId && entry.userId === membership.userId
      );
      if (!exists) {
        state.memberships.push(membership);
      }
    },
    expelMember: (state, action) => {
      const { orgId, userId } = action.payload;
      state.memberships = state.memberships.filter(
        (entry) => !(entry.orgId === orgId && entry.userId === userId)
      );
      state.teamMemberships = state.teamMemberships.filter(
        (entry) => !(entry.orgId === orgId && entry.userId === userId)
      );
    },
    updateOrganizationName: (state, action) => {
      state.organizations[0].name = action.payload;
    },
    updateOrganizationBranding: (state, action) => {
      const { name, brandColor, logoUrl } = action.payload;
      if (name) state.organizations[0].name = name;
      if (brandColor) state.organizations[0].brandColor = brandColor;
      if (logoUrl) state.organizations[0].logoUrl = logoUrl;
    },
    addWorkstream: (state, action) => {
      const { id, label } = action.payload;
      const exists = state.workstreams.some((entry) => entry.id === id);
      if (!exists) {
        state.workstreams.push(buildWorkstream({ id, label }));
      }
    },
    updateWorkstreamLabel: (state, action) => {
      const { id, label } = action.payload;
      const workstream = state.workstreams.find((entry) => entry.id === id);
      if (workstream) {
        workstream.label = label;
      }
    },
    removeWorkstream: (state, action) => {
      const { id } = action.payload;
      state.workstreams = state.workstreams.filter((entry) => entry.id !== id);
    },
    setWorkstreamEnabled: (state, action) => {
      const { id, enabled } = action.payload;
      const workstream = state.workstreams.find((entry) => entry.id === id);
      if (workstream) {
        workstream.enabled = enabled;
      }
    },
  },
});

export const {
  setCurrentOrg,
  addOrganization,
  addMembership,
  expelMember,
  updateOrganizationName,
  updateOrganizationBranding,
  addWorkstream,
  updateWorkstreamLabel,
  removeWorkstream,
  setWorkstreamEnabled,
} = organizationsSlice.actions;
export default organizationsSlice.reducer;
