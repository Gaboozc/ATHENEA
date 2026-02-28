import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  todos: [],
};

const todosSlice = createSlice({
  name: 'todos',
  initialState,
  reducers: {
    addTodo: (state, action) => {
      const { id, title, notes, dueDate, priority } = action.payload;
      const newTodo = {
        id: id || `todo-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        title: title || 'Untitled Todo',
        notes: notes || '',
        dueDate: dueDate || null,
        priority: priority || 'normal',
        status: 'pending',
        progress: 0,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.todos.unshift(newTodo);
    },
    updateTodo: (state, action) => {
      const { id, ...updates } = action.payload;
      const todo = state.todos.find((item) => item.id === id);
      if (todo) {
        Object.assign(todo, updates);
        todo.updatedAt = new Date().toISOString();
      }
    },
    deleteTodo: (state, action) => {
      state.todos = state.todos.filter((item) => item.id !== action.payload);
    },
    setTodoStatus: (state, action) => {
      const { id, status } = action.payload;
      const todo = state.todos.find((item) => item.id === id);
      if (todo) {
        todo.status = status;
        if (status === 'done') {
          todo.progress = 100;
        }
        todo.updatedAt = new Date().toISOString();
      }
    },
    setTodoProgress: (state, action) => {
      const { id, progress } = action.payload;
      const todo = state.todos.find((item) => item.id === id);
      if (todo) {
        todo.progress = Math.max(0, Math.min(100, progress));
        todo.status = todo.progress === 100 ? 'done' : 'pending';
        todo.updatedAt = new Date().toISOString();
      }
    },
  },
});

export const {
  addTodo,
  updateTodo,
  deleteTodo,
  setTodoStatus,
  setTodoProgress,
} = todosSlice.actions;

export default todosSlice.reducer;
