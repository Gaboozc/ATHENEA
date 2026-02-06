import { createSlice } from '@reduxjs/toolkit';

const initialInventoryItems = [
  // Warehouse inventory
  {
    id: '1',
    name: 'Cat6 Cable Roll',
    category: 'cable',
    quantity: 50,
    unit: 'rolls',
    location: 'warehouse',
    projectId: null,
    minStock: 10,
  },
  {
    id: '2',
    name: 'RJ45 Connectors',
    category: 'connector',
    quantity: 1000,
    unit: 'pieces',
    location: 'warehouse',
    projectId: null,
    minStock: 200,
  },
  {
    id: '3',
    name: 'Network Switch 24-Port',
    category: 'equipment',
    quantity: 5,
    unit: 'units',
    location: 'warehouse',
    projectId: null,
    minStock: 2,
  },
  {
    id: '4',
    name: 'Fiber Optic Cable',
    category: 'cable',
    quantity: 20,
    unit: 'rolls',
    location: 'warehouse',
    projectId: null,
    minStock: 5,
  },
  // Project-specific inventory (Office Building A)
  {
    id: '5',
    name: 'Cat6 Cable Roll',
    category: 'cable',
    quantity: 15,
    unit: 'rolls',
    location: 'project',
    projectId: '1',
    minStock: 0,
  },
  {
    id: '6',
    name: 'RJ45 Connectors',
    category: 'connector',
    quantity: 300,
    unit: 'pieces',
    location: 'project',
    projectId: '1',
    minStock: 0,
  },
  // Project-specific inventory (Warehouse Data Center)
  {
    id: '7',
    name: 'Fiber Optic Cable',
    category: 'cable',
    quantity: 8,
    unit: 'rolls',
    location: 'project',
    projectId: '2',
    minStock: 0,
  },
];

const inventorySlice = createSlice({
  name: 'inventory',
  initialState: {
    items: initialInventoryItems,
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
