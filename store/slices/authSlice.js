import { createSlice } from '@reduxjs/toolkit';

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: {
      id: 'user-1',
      name: 'Usuario',
      email: 'user@athenea.local',
      role: 'admin'
    },
    token: 'athenea-single-user-token',
    isLoading: false,
    error: null
  },
  reducers: {
    loginUser: (state, action) => {
      const payload = action.payload || {};
      state.user = {
        id: payload.id || state.user.id,
        name: payload.name || state.user.name,
        email: payload.email || state.user.email,
        role: payload.role || state.user.role
      };
      state.token = payload.token || state.token;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateUserName: (state, action) => {
      state.user.name = action.payload;
    }
  }
});

export const { loginUser, clearError, updateUserName } = authSlice.actions;
export default authSlice.reducer;
