import { createSlice } from '@reduxjs/toolkit';

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
  },
  reducers: {
    addUser: (state, action) => {
      const incoming = action.payload;
      if (!incoming?.email) return;

      const exists = state.users.some((user) => user.email === incoming.email);
      if (!exists) {
        state.users.push({
          id: incoming.id || `user-${Date.now()}`,
          name: incoming.name || incoming.email,
          email: incoming.email,
          role: incoming.role || 'member',
        });
      }
    },
  },
});

export const { addUser } = usersSlice.actions;
export default usersSlice.reducer;
