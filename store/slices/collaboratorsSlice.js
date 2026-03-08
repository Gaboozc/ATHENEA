import { createSlice } from '@reduxjs/toolkit';

const collaboratorsSlice = createSlice({
  name: 'collaborators',
  initialState: {
    collaborators: []
  },
  reducers: {
    addCollaborator: (state, action) => {
      state.collaborators.unshift({
        id: action.payload?.id || `collab-${Date.now()}`,
        ...action.payload,
        createdAt: new Date().toISOString()
      });
    },
    updateCollaborator: (state, action) => {
      const { id, ...updates } = action.payload || {};
      const target = state.collaborators.find((entry) => entry.id === id);
      if (target) Object.assign(target, updates);
    },
    deleteCollaborator: (state, action) => {
      state.collaborators = state.collaborators.filter((entry) => entry.id !== action.payload);
    },
    setCollaboratorStatus: (state, action) => {
      const { id, status } = action.payload || {};
      const target = state.collaborators.find((entry) => entry.id === id);
      if (target) target.status = status;
    }
  }
});

export const { addCollaborator, updateCollaborator, deleteCollaborator, setCollaboratorStatus } = collaboratorsSlice.actions;
export default collaboratorsSlice.reducer;
