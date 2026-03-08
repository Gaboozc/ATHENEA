import { createSlice } from '@reduxjs/toolkit';

const DEFAULT_ORG = {
  id: 'org-personal',
  name: 'Personal',
  brandColor: '#1ec9ff',
  logoUrl: ''
};

const organizationsSlice = createSlice({
  name: 'organizations',
  initialState: {
    organizations: [DEFAULT_ORG],
    workstreams: [],
    memberships: [],
    teamMemberships: [],
    currentOrgId: DEFAULT_ORG.id
  },
  reducers: {
    setCurrentOrg: (state, action) => {
      state.currentOrgId = action.payload;
    },
    addOrganization: (state, action) => {
      const incoming = action.payload;
      if (!incoming?.id) return;
      const exists = state.organizations.some((entry) => entry.id === incoming.id);
      if (!exists) state.organizations.push(incoming);
    },
    addMembership: (state, action) => {
      state.memberships.push(action.payload);
    },
    expelMember: (state, action) => {
      const { orgId, userId } = action.payload || {};
      state.memberships = state.memberships.filter(
        (entry) => !(entry.orgId === orgId && entry.userId === userId)
      );
    },
    updateOrganizationName: (state, action) => {
      const org = state.organizations.find((entry) => entry.id === state.currentOrgId);
      if (org) org.name = action.payload;
    },
    updateOrganizationBranding: (state, action) => {
      const org = state.organizations.find((entry) => entry.id === state.currentOrgId);
      if (!org) return;
      org.name = action.payload?.name || org.name;
      org.brandColor = action.payload?.brandColor || org.brandColor;
      org.logoUrl = action.payload?.logoUrl || org.logoUrl;
    }
  }
});

export const {
  setCurrentOrg,
  addOrganization,
  addMembership,
  expelMember,
  updateOrganizationName,
  updateOrganizationBranding
} = organizationsSlice.actions;

export default organizationsSlice.reducer;
