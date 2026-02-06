import { createSlice } from '@reduxjs/toolkit';

const initialUsers = [
  {
    id: '1',
    name: 'Super Admin (Owner)',
    email: 'owner@wirescope.com',
    role: 'super-admin',
    active: true,
  },
  {
    id: '2',
    name: 'PM - John Doe',
    email: 'pm1@wirescope.com',
    role: 'pm',
    active: true,
    // PM manages projects 1 and 3
  },
  {
    id: '3',
    name: 'PM - Jane Smith',
    email: 'pm2@wirescope.com',
    role: 'pm',
    active: true,
    // PM manages project 2
  },
  {
    id: '4',
    name: 'Supervisor One',
    email: 'supervisor@wirescope.com',
    role: 'supervisor',
    active: true,
    projectId: '1',
  },
  {
    id: '5',
    name: 'Lead Tech John',
    email: 'leadtech@wirescope.com',
    role: 'lead-technician',
    active: true,
    projectId: '2',
    groupId: 'Group-A',
  },
  {
    id: '6',
    name: 'Technician A',
    email: 'tech@wirescope.com',
    role: 'technician',
    active: true,
    projectId: '2',
    groupId: 'Group-A',
  },
  {
    id: '7',
    name: 'Technician B',
    email: 'techb@wirescope.com',
    role: 'technician',
    active: true,
    projectId: '2',
    groupId: 'Group-A',
  },
];

const usersSlice = createSlice({
  name: 'users',
  initialState: {
    users: initialUsers,
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
