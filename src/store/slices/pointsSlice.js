import { createSlice } from '@reduxjs/toolkit';

const pointsSlice = createSlice({
  name: 'points',
  initialState: {
    points: [],
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
