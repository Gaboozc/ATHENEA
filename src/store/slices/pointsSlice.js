import { createSlice } from '@reduxjs/toolkit';

const initialPoints = [
  {
    id: '1',
    projectId: '1',
    pointNumber: 'A-101',
    type: 'data',
    category: 'outlet',
    status: 'completed',
    description: 'Main server room - Rack A',
    x: 150,
    y: 200,
  },
  {
    id: '2',
    projectId: '1',
    pointNumber: 'A-102',
    type: 'power',
    category: 'panel',
    status: 'in-progress',
    description: 'Power distribution panel',
    x: 300,
    y: 250,
  },
  {
    id: '3',
    projectId: '1',
    pointNumber: 'A-103',
    type: 'fiber',
    category: 'splice',
    status: 'pending',
    description: 'Fiber optic splice point',
    x: 450,
    y: 180,
  },
];

const pointsSlice = createSlice({
  name: 'points',
  initialState: {
    points: initialPoints,
    selectedPoint: null,
  },
  reducers: {
    setSelectedPoint: (state, action) => {
      state.selectedPoint = action.payload;
    },
    addPoint: (state, action) => {
      const newPoint = {
        ...action.payload,
        id: Date.now().toString(),
        status: 'pending',
      };
      state.points.push(newPoint);
    },
    updatePoint: (state, action) => {
      const index = state.points.findIndex((p) => p.id === action.payload.id);
      if (index !== -1) {
        state.points[index] = { ...state.points[index], ...action.payload };
      }
    },
    deletePoint: (state, action) => {
      state.points = state.points.filter((p) => p.id !== action.payload);
    },
    getPointsByProject: (state, action) => {
      return state.points.filter((p) => p.projectId === action.payload);
    },
  },
});

export const {
  setSelectedPoint,
  addPoint,
  updatePoint,
  deletePoint,
  getPointsByProject,
} = pointsSlice.actions;
export default pointsSlice.reducer;
