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
      /* ARCH-FIX-1: guard against duplicates during hydration */
      if (action.payload?.id && state.tasks.some((t) => t.id === action.payload.id)) return;
      state.tasks.unshift({
        id: action.payload?.id || `task-${Date.now()}`,
        title: action.payload?.title || 'Untitled Task',
        status: action.payload?.status || 'pending',
        dueDate: action.payload?.dueDate || null,
        createdAt: new Date().toISOString(),
        ...action.payload
      });
    },
    hydrateFromStorage: (state, action) => { /* ARCH-FIX-1: bulk load from localStorage on app start */
      if (!Array.isArray(action.payload)) return;
      const existingIds = new Set(state.tasks.map((t) => t.id));
      for (const task of action.payload) {
        if (task?.id && !existingIds.has(task.id)) {
          state.tasks.push(task);
          existingIds.add(task.id);
        }
      }
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
        timestamp: payload.timestamp || new Date().toISOString(),
        loggedAt: payload.loggedAt || payload.timestamp || new Date().toISOString() /* W-FIX-2 */
      };
      state.timeEntries.unshift(entry);

      if (!entry.taskId) return;
      const target = state.tasks.find((task) => task.id === entry.taskId);
      if (!target) return;

      target.loggedHours = Number(target.loggedHours || 0) + entry.hoursWorked;
      target.updatedAt = new Date().toISOString();
    },
    updateTask: (state, action) => { /* W-FIX-4 */
      const { id, title, description, dueDate, level, estimatedHours, projectId, workstreamId } = action.payload || {};
      const task = state.tasks.find((t) => t.id === id);
      if (!task) return;
      if (title !== undefined)          task.title          = title;
      if (description !== undefined)    task.description    = description;
      if (dueDate !== undefined)        task.dueDate        = dueDate;
      if (level !== undefined)          task.level          = level;
      if (estimatedHours !== undefined) task.estimatedHours = estimatedHours;
      if (projectId !== undefined)      task.projectId      = projectId;
      if (workstreamId !== undefined)   task.workstreamId   = workstreamId;
      task.updatedAt = new Date().toISOString();
    },
    restoreTask: (state, action) => { /* W-FIX-7 */
      const task = state.tasks.find((t) => t.id === action.payload);
      if (task) {
        task.status = 'pending';
        task.completed = false;
        delete task.deletedAt;
        task.updatedAt = new Date().toISOString();
      }
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
    /* W-FIX-2: extraReducer for tasks/logTime removed — handled by the reducer above */
  }
});

export const { addTask, hydrateFromStorage, rescheduleTask, completeTask, logTime, updateTask, restoreTask } = tasksSlice.actions;
export default tasksSlice.reducer;
