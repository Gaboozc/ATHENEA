import { createSlice } from '@reduxjs/toolkit';

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: [],
    selectedUser: null,
  },
  reducers: {
    addUser: (state, action) => {
      const newUser = {
        ...action.payload,
        id: Date.now().toString(),
        active: true,
      };
      state.users.push(newUser);
    },
    updateUser: (state, action) => {
      const idx = state.users.findIndex(u => u.id === action.payload.id);
      if (idx !== -1) {
        state.users[idx] = { ...state.users[idx], ...action.payload };
      }
    },
    deleteUser: (state, action) => {
      state.users = state.users.filter(u => u.id !== action.payload);
    },
    setSelectedUser: (state, action) => {
      state.selectedUser = action.payload;
    },
  },
});

export const { addUser, updateUser, deleteUser, setSelectedUser } = usersSlice.actions;
export default usersSlice.reducer;
