import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Material {
  id: string;
  name: string;
  category: 'cable' | 'connector' | 'patch_panel' | 'outlet' | 'hardware';
  partNumber?: string;
  manufacturer?: string;
  specifications?: any;
  unitPrice?: number;
  stockQuantity?: number;
  createdAt: string;
  updatedAt: string;
}

export interface MaterialsState {
  materials: Material[];
  loading: boolean;
  error: string | null;
}

const initialState: MaterialsState = {
  materials: [],
  loading: false,
  error: null,
};

const materialsSlice = createSlice({
  name: 'materials',
  initialState,
  reducers: {
    setMaterials: (state, action: PayloadAction<Material[]>) => {
      state.materials = action.payload;
      state.loading = false;
      state.error = null;
    },
    addMaterial: (state, action: PayloadAction<Material>) => {
      state.materials.push(action.payload);
    },
    updateMaterial: (state, action: PayloadAction<Material>) => {
      const index = state.materials.findIndex(m => m.id === action.payload.id);
      if (index !== -1) {
        state.materials[index] = action.payload;
      }
    },
    deleteMaterial: (state, action: PayloadAction<string>) => {
      state.materials = state.materials.filter(m => m.id !== action.payload);
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
      state.loading = false;
    },
  },
});

export const {
  setMaterials,
  addMaterial,
  updateMaterial,
  deleteMaterial,
  setLoading,
  setError,
} = materialsSlice.actions;

export default materialsSlice.reducer;