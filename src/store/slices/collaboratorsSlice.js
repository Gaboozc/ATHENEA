import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  collaborators: [],
};

const collaboratorsSlice = createSlice({
  name: 'collaborators',
  initialState,
  reducers: {
    addCollaborator: (state, action) => {
      const { id, name, email, area, role, phone, status } = action.payload;
      const newCollaborator = {
        id: id || `collab-${Date.now()}`,
        name,
        email,
        area: area || '',
        role: role || 'Contractor',
        phone: phone || '',
        status: status || 'active',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.collaborators.unshift(newCollaborator);
    },
    updateCollaborator: (state, action) => {
      const { id, ...updates } = action.payload;
      const collaborator = state.collaborators.find((c) => c.id === id);
      if (collaborator) {
        Object.assign(collaborator, updates);
        collaborator.updatedAt = new Date().toISOString();
      }
    },
    deleteCollaborator: (state, action) => {
      state.collaborators = state.collaborators.filter((c) => c.id !== action.payload);
    },
    setCollaboratorStatus: (state, action) => {
      const { id, status } = action.payload;
      const collaborator = state.collaborators.find((c) => c.id === id);
      if (collaborator) {
        collaborator.status = status;
        collaborator.updatedAt = new Date().toISOString();
      }
    },
  },
});

export const { addCollaborator, updateCollaborator, deleteCollaborator, setCollaboratorStatus } =
  collaboratorsSlice.actions;
export default collaboratorsSlice.reducer;
