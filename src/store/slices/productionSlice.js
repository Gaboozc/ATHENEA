import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  entries: [
    {
      id: '1',
      projectId: '1',
      userId: '1',
      taskName: 'Cable Installation - Floor 1',
      description: 'Install Cat6 cables in first floor offices',
      status: 'in-progress',
      priority: 'high',
      startDate: '2025-10-15',
      dueDate: '2025-10-20',
      completedDate: null,
      hoursEstimated: 16,
      hoursWorked: 8,
      progress: 50,
      notes: 'Completed 15 out of 30 cable runs',
      createdAt: '2025-10-15T09:00:00Z',
      updatedAt: '2025-10-17T14:30:00Z'
    },
    {
      id: '2',
      projectId: '1',
      userId: '2',
      taskName: 'Equipment Installation',
      description: 'Install network switches and patch panels',
      status: 'pending',
      priority: 'medium',
      startDate: '2025-10-18',
      dueDate: '2025-10-22',
      completedDate: null,
      hoursEstimated: 12,
      hoursWorked: 0,
      progress: 0,
      notes: 'Waiting for cable installation completion',
      createdAt: '2025-10-15T09:30:00Z',
      updatedAt: '2025-10-15T09:30:00Z'
    },
    {
      id: '3',
      projectId: '2',
      userId: '3',
      taskName: 'Fiber Optic Installation',
      description: 'Install fiber optic backbone between buildings',
      status: 'completed',
      priority: 'high',
      startDate: '2025-10-10',
      dueDate: '2025-10-15',
      completedDate: '2025-10-14',
      hoursEstimated: 20,
      hoursWorked: 18,
      progress: 100,
      notes: 'Completed ahead of schedule',
      createdAt: '2025-10-10T08:00:00Z',
      updatedAt: '2025-10-14T17:00:00Z'
    },
    {
      id: '4',
      projectId: '2',
      userId: '4',
      taskName: 'Testing and Certification',
      description: 'Test all connections and certify cable runs',
      status: 'in-progress',
      priority: 'high',
      startDate: '2025-10-16',
      dueDate: '2025-10-18',
      completedDate: null,
      hoursEstimated: 8,
      hoursWorked: 4,
      progress: 60,
      notes: 'Testing 60% complete, all tests passing',
      createdAt: '2025-10-16T08:00:00Z',
      updatedAt: '2025-10-17T12:00:00Z'
    }
  ],
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
