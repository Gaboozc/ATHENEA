import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';

// Mock login (accepts any credentials)
export const loginUser = createAsyncThunk(
  'auth/login',
  async ({ email, password, name, role }) => {
    // Simulate API call
    await new Promise((resolve) => setTimeout(resolve, 1000));
    const normalizedEmail = email || 'user@auth.local';
    const displayName = name || normalizedEmail.split('@')[0];
    return {
      user: {
        id: normalizedEmail,
        name: displayName,
        email: normalizedEmail,
        role: role || 'admin'
      },
      token: 'mock-token-' + Date.now(),
    };
  }
);

export const logoutUser = createAsyncThunk('auth/logout', async () => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return true;
});

const authSlice = createSlice({
  name: 'auth',
  initialState: {
    user: null,
    token: null,
    isLoading: false,
    error: null,
    // Role simulator
    demoUser: null,
    demoRole: null,
  },
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    setDemoUser: (state, action) => {
      state.demoUser = action.payload.user;
      state.demoRole = action.payload.role;
    },
    clearDemoUser: (state) => {
      state.demoUser = null;
      state.demoRole = null;
    },
  },
  extraReducers: (builder) => {
    builder
      // Login
      .addCase(loginUser.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.isLoading = false;
        state.user = action.payload.user;
        state.token = action.payload.token;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.error.message;
      })
      // Logout
      .addCase(logoutUser.fulfilled, (state) => {
        state.user = null;
        state.token = null;
      });
  },
});

export const { clearError, setDemoUser, clearDemoUser } = authSlice.actions;
export default authSlice.reducer;
