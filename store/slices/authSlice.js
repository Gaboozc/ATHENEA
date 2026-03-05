import { createSlice } from '@reduxjs/toolkit';

// Single-user mode: usuario por defecto siempre activo
const DEFAULT_USER = {
  id: 'user-1',
  name: 'Usuario',
  email: 'user@athenea.local',
  role: 'admin'
};

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: DEFAULT_USER,
    token: 'athenea-single-user-token',
    isLoading: false,
    error: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    updateUserName: (state, action) => {
      state.user.name = action.payload;
    },
  },
});

export const { clearError, updateUserName } = authSlice.actions;
export default authSlice.reducer;
