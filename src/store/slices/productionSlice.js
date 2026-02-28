import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  entries: [],
  selectedEntry: null
};

const productionSlice = createSlice({
  name: 'production',
  initialState,
  reducers: {
    addProductionEntry: (state, action) => {
      const newEntry = {
        ...action.payload,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        hoursWorked: 0,
        progress: 0,
        completedDate: null
      };
      state.entries.push(newEntry);
    },
    bulkUpdateStatus: (state, action) => {
      const { entryIds = [], status } = action.payload || {};
      const today = new Date().toISOString().split('T')[0];
      const nowIso = new Date().toISOString();
      state.entries = state.entries.map(e => {
        if (!entryIds.includes(e.id)) return e;
        const updated = { ...e, status, updatedAt: nowIso };
        if (status === 'completed') {
          updated.completedDate = today;
          updated.progress = 100;
        } else {
          updated.completedDate = null;
        }
        return updated;
      });
    },
    bulkAssignEntries: (state, action) => {
      const { entryIds = [], userId } = action.payload || {};
      const nowIso = new Date().toISOString();
      state.entries = state.entries.map(e => {
        if (entryIds.includes(e.id)) {
          return { ...e, userId, updatedAt: nowIso };
        }
        return e;
      });
    },
    updateProductionEntry: (state, action) => {
      const index = state.entries.findIndex(entry => entry.id === action.payload.id);
      if (index !== -1) {
        state.entries[index] = {
          ...state.entries[index],
          ...action.payload,
          updatedAt: new Date().toISOString()
        };
        // Auto-complete if progress reaches 100%
        if (state.entries[index].progress >= 100 && state.entries[index].status !== 'completed') {
          state.entries[index].status = 'completed';
          state.entries[index].completedDate = new Date().toISOString().split('T')[0];
        }
      }
    },
    deleteProductionEntry: (state, action) => {
      state.entries = state.entries.filter(entry => entry.id !== action.payload);
    },
    updateProgress: (state, action) => {
      const { id, hoursWorked, progress, notes } = action.payload;
      const index = state.entries.findIndex(entry => entry.id === id);
      if (index !== -1) {
        state.entries[index].hoursWorked = hoursWorked;
        state.entries[index].progress = progress;
        if (notes !== undefined) {
          state.entries[index].notes = notes;
        }
        state.entries[index].updatedAt = new Date().toISOString();
        
        // Auto-complete if progress reaches 100%
        if (progress >= 100 && state.entries[index].status !== 'completed') {
          state.entries[index].status = 'completed';
          state.entries[index].completedDate = new Date().toISOString().split('T')[0];
        }
      }
    },
    updateStatus: (state, action) => {
      const { id, status } = action.payload;
      const index = state.entries.findIndex(entry => entry.id === id);
      if (index !== -1) {
        state.entries[index].status = status;
        state.entries[index].updatedAt = new Date().toISOString();
        
        // Set completed date when status changes to completed
        if (status === 'completed' && !state.entries[index].completedDate) {
          state.entries[index].completedDate = new Date().toISOString().split('T')[0];
          state.entries[index].progress = 100;
        }
        // Clear completed date if status changes from completed
        if (status !== 'completed') {
          state.entries[index].completedDate = null;
        }
      }
    },
    setSelectedEntry: (state, action) => {
      state.selectedEntry = action.payload;
    }
  }
});

export const {
  addProductionEntry,
  bulkAssignEntries,
  bulkUpdateStatus,
  updateProductionEntry,
  deleteProductionEntry,
  updateProgress,
  updateStatus,
  setSelectedEntry
} = productionSlice.actions;

export default productionSlice.reducer;
