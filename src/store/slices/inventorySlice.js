import { createSlice } from '@reduxjs/toolkit';

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    items: [],
    selectedItem: null,
  },
  reducers: {
    addInventoryItem: (state, action) => {
      const newItem = {
        ...action.payload,
        id: Date.now().toString(),
      };
      state.items.push(newItem);
    },
    updateInventoryItem: (state, action) => {
      const idx = state.items.findIndex(i => i.id === action.payload.id);
      if (idx !== -1) {
        state.items[idx] = { ...state.items[idx], ...action.payload };
      }
    },
    deleteInventoryItem: (state, action) => {
      state.items = state.items.filter(i => i.id !== action.payload);
    },
    transferToProject: (state, action) => {
      const { itemId, projectId, quantity } = action.payload;
      const warehouseItem = state.items.find(i => i.id === itemId);
      
      if (warehouseItem && warehouseItem.quantity >= quantity) {
        // Reduce warehouse stock
        warehouseItem.quantity -= quantity;
        
        // Find or create project inventory item
        const projectItem = state.items.find(
          i => i.name === warehouseItem.name && i.projectId === projectId
        );
        
        if (projectItem) {
          projectItem.quantity += quantity;
        } else {
          // Create new project inventory item
          state.items.push({
            ...warehouseItem,
            id: Date.now().toString(),
            quantity,
            location: 'project',
            projectId,
            minStock: 0,
          });
        }
      }
    },
    setSelectedItem: (state, action) => {
      state.selectedItem = action.payload;
    },
  },
});

export const {
  addInventoryItem,
  updateInventoryItem,
  deleteInventoryItem,
  transferToProject,
  setSelectedItem,
} = inventorySlice.actions;

export default inventorySlice.reducer;
