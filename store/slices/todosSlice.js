import { createSlice } from '@reduxjs/toolkit';

const todosSlice = createSlice({
  name: 'todos',
  initialState: {
    todos: []
  },
  reducers: {
    addTodo: (state, action) => {
      const payload = action.payload || {};
      state.todos.unshift({
        id: payload.id || `todo-${Date.now()}`,
        title: payload.title || 'Untitled Todo',
        notes: payload.notes || '',
        dueDate: payload.dueDate || null,
        priority: payload.priority || 'normal',
        status: payload.status || 'pending',
        progress: Number(payload.progress || 0),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    },
    deleteTodo: (state, action) => {
      state.todos = state.todos.filter((entry) => entry.id !== action.payload);
    },
    setTodoStatus: (state, action) => {
      const { id, status } = action.payload || {};
      const todo = state.todos.find((entry) => entry.id === id);
      if (!todo) return;
      todo.status = status;
      if (status === 'done') todo.progress = 100;
      todo.updatedAt = new Date().toISOString();
    },
    setTodoProgress: (state, action) => {
      const { id, progress } = action.payload || {};
      const todo = state.todos.find((entry) => entry.id === id);
      if (!todo) return;
      const safeProgress = Math.max(0, Math.min(100, Number(progress || 0)));
      todo.progress = safeProgress;
      todo.status = safeProgress === 100 ? 'done' : 'pending';
      todo.updatedAt = new Date().toISOString();
    }
  }
});

export const { addTodo, deleteTodo, setTodoStatus, setTodoProgress } = todosSlice.actions;
export default todosSlice.reducer;
