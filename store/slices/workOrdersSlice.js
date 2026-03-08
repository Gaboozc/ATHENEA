import { createSlice } from '@reduxjs/toolkit';

const workOrdersSlice = createSlice({
  name: 'workOrders',
  initialState: {
    workOrders: []
  },
  reducers: {
    addWorkOrder: (state, action) => {
      state.workOrders.unshift({
        id: action.payload?.id || `order-${Date.now()}`,
        ...action.payload,
        status: action.payload?.status || 'draft',
        progress: Number(action.payload?.progress || 0),
        createdAt: new Date().toISOString()
      });
    },
    updateWorkOrder: (state, action) => {
      const { id, ...updates } = action.payload || {};
      const target = state.workOrders.find((entry) => entry.id === id);
      if (target) Object.assign(target, updates);
    },
    deleteWorkOrder: (state, action) => {
      state.workOrders = state.workOrders.filter((entry) => entry.id !== action.payload);
    },
    deleteWorkOrdersByCollaborator: (state, action) => {
      state.workOrders = state.workOrders.filter((entry) => entry.collaboratorId !== action.payload);
    },
    setWorkOrderStatus: (state, action) => {
      const { id, status } = action.payload || {};
      const target = state.workOrders.find((entry) => entry.id === id);
      if (target) target.status = status;
    },
    setWorkOrderProgress: (state, action) => {
      const { id, progress } = action.payload || {};
      const target = state.workOrders.find((entry) => entry.id === id);
      if (target) target.progress = Math.max(0, Math.min(100, Number(progress || 0)));
    }
  }
});

export const {
  addWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  deleteWorkOrdersByCollaborator,
  setWorkOrderStatus,
  setWorkOrderProgress
} = workOrdersSlice.actions;

export default workOrdersSlice.reducer;
