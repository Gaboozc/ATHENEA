import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  workOrders: [],
};

const workOrdersSlice = createSlice({
  name: 'workOrders',
  initialState,
  reducers: {
    addWorkOrder: (state, action) => {
      const {
        id,
        title,
        description,
        collaboratorId,
        area,
        dueDate,
        priority,
        status,
        attachments,
      } = action.payload;
      const newOrder = {
        id: id || `order-${Date.now()}`,
        title,
        description: description || '',
        collaboratorId,
        area: area || '',
        dueDate: dueDate || '',
        priority: priority || 'Normal',
        status: status || 'draft',
        progress: 0,
        attachments: attachments || [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.workOrders.unshift(newOrder);
    },
    updateWorkOrder: (state, action) => {
      const { id, ...updates } = action.payload;
      const order = state.workOrders.find((o) => o.id === id);
      if (order) {
        Object.assign(order, updates);
        order.updatedAt = new Date().toISOString();
      }
    },
    deleteWorkOrder: (state, action) => {
      state.workOrders = state.workOrders.filter((o) => o.id !== action.payload);
    },
    setWorkOrderStatus: (state, action) => {
      const { id, status } = action.payload;
      const order = state.workOrders.find((o) => o.id === id);
      if (order) {
        order.status = status;
        order.updatedAt = new Date().toISOString();
      }
    },
    setWorkOrderProgress: (state, action) => {
      const { id, progress } = action.payload;
      const order = state.workOrders.find((o) => o.id === id);
      if (order) {
        order.progress = Math.min(100, Math.max(0, progress));
        order.updatedAt = new Date().toISOString();
      }
    },
  },
});

export const {
  addWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  setWorkOrderStatus,
  setWorkOrderProgress,
} = workOrdersSlice.actions;
export default workOrdersSlice.reducer;
