import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Point {
  id: string;
  pointNumber: string;
  projectId: string;
  floorId: string;
  roomId?: string;
  type: 'data' | 'voice' | 'video' | 'power' | 'fiber';
  category: 'Cat5e' | 'Cat6' | 'Cat6a' | 'Cat7' | 'Fiber' | 'Coax';
  status: 'planned' | 'installed' | 'tested' | 'certified' | 'failed';
  coordinates: {
    x: number;
    y: number;
  };
  description?: string;
  testResults?: any;
  createdAt: string;
  updatedAt: string;
}

export interface PointsState {
  points: Point[];
  selectedPoint: Point | null;
  loading: boolean;
  error: string | null;
  filters: {
    type?: string[];
    status?: string[];
    category?: string[];
  };
}

const initialState: PointsState = {
  points: [],
  selectedPoint: null,
  loading: false,
  error: null,
  filters: {},
};

const pointsSlice = createSlice({
  name: 'points',
  initialState,
  reducers: {
    setPoints: (state, action: PayloadAction<Point[]>) => {
      state.points = action.payload;
      state.loading = false;
      state.error = null;
    },
    addPoint: (state, action: PayloadAction<Point>) => {
      state.points.push(action.payload);
    },
    updatePoint: (state, action: PayloadAction<Point>) => {
      const index = state.points.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.points[index] = action.payload;
      }
      if (state.selectedPoint?.id === action.payload.id) {
        state.selectedPoint = action.payload;
      }
    },
    deletePoint: (state, action: PayloadAction<string>) => {
      state.points = state.points.filter(p => p.id !== action.payload);
      if (state.selectedPoint?.id === action.payload) {
        state.selectedPoint = null;
      }
    },
    setSelectedPoint: (state, action: PayloadAction<Point | null>) => {
      state.selectedPoint = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
    setFilters: (state, action: PayloadAction<PointsState['filters']>) => {
      state.filters = action.payload;
    },
  },
});

export const {
  setPoints,
  addPoint,
  updatePoint,
  deletePoint,
  setSelectedPoint,
  setLoading,
  setError,
  setFilters,
} = pointsSlice.actions;

export default pointsSlice.reducer;