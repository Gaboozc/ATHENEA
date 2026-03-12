import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  tasks: [],
  timeEntries: []
};

const tasksSlice = createSlice({
  name: 'tasks',
  initialState,
  reducers: {
    addTask: (state, action) => {
      state.tasks.unshift({
        id: action.payload?.id || `task-${Date.now()}`,
        title: action.payload?.title || 'Untitled Task',
        status: action.payload?.status || 'pending',
        dueDate: action.payload?.dueDate || null,
        createdAt: new Date().toISOString(),
        ...action.payload
      });
    },
    rescheduleTask: (state, action) => {
      const { id, dueDate } = action.payload || {};
      const target = state.tasks.find((task) => task.id === id);
      if (target) {
        target.dueDate = dueDate;
        target.updatedAt = new Date().toISOString();
      }
    },
    completeTask: (state, action) => {
      const { id } = action.payload || {};
      const target = state.tasks.find((task) => task.id === id);
      if (target) {
        target.status = 'completed';
        target.completedAt = new Date().toISOString();
        target.updatedAt = new Date().toISOString();
      }
    },
    logTime: (state, action) => {
      const payload = action.payload || {};
      const entry = {
        id: payload.id || `time-${Date.now()}`,
        taskId: payload.taskId || null,
        hoursWorked: Number(payload.hoursWorked || 0),
        notes: payload.notes || '',
        timestamp: payload.timestamp || new Date().toISOString()
      };
      state.timeEntries.unshift(entry);

      if (!entry.taskId) return;
      const target = state.tasks.find((task) => task.id === entry.taskId);
      if (!target) return;

      target.loggedHours = Number(target.loggedHours || 0) + entry.hoursWorked;
      target.updatedAt = new Date().toISOString();
    }
  },
  extraReducers: (builder) => {
    builder.addCase('tasks/reschedule', (state, action) => {
      const { id, dueDate } = action.payload || {};
      const target = state.tasks.find((task) => task.id === id);
      if (target) {
        target.dueDate = dueDate;
        target.updatedAt = new Date().toISOString();
      }
    });
    builder.addCase('tasks/complete', (state, action) => {
      const { id } = action.payload || {};
      const target = state.tasks.find((task) => task.id === id);
      if (target) {
        target.status = 'completed';
        target.completedAt = new Date().toISOString();
        target.updatedAt = new Date().toISOString();
      }
    });
    builder.addCase('tasks/logTime', (state, action) => {
      const payload = action.payload || {};
      const entry = {
        id: payload.id || `time-${Date.now()}`,
        taskId: payload.taskId || null,
        hoursWorked: Number(payload.hoursWorked || 0),
        notes: payload.notes || '',
        timestamp: payload.timestamp || new Date().toISOString()
      };
      state.timeEntries.unshift(entry);

      if (!entry.taskId) return;
      const target = state.tasks.find((task) => task.id === entry.taskId);
      if (!target) return;

      target.loggedHours = Number(target.loggedHours || 0) + entry.hoursWorked;
      target.updatedAt = new Date().toISOString();
    });
  }
});

export const { addTask, rescheduleTask, completeTask, logTime } = tasksSlice.actions;
export default tasksSlice.reducer;
