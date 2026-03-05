import { noteCreated, projectCompleted, todoCompleted, tagUsed } from '../store/slices/statsSlice';

/**
 * Achievement Tracking Middleware
 * Listens to Redux actions and dispatches achievement tracking
 */
export const achievementMiddleware = (store) => (next) => (action) => {
  const result = next(action);
  
  // Get dispatch for stats actions
  const { dispatch } = store;

  // Track note creation
  if (action.type === 'notes/addNote') {
    dispatch(noteCreated());
    
    // Track tags used
    if (action.payload.tags && Array.isArray(action.payload.tags)) {
      action.payload.tags.forEach(tag => {
        dispatch(tagUsed(tag));
      });
    }
  }

  // Track tag usage in note updates
  if (action.type === 'notes/updateNote') {
    if (action.payload.tags && Array.isArray(action.payload.tags)) {
      action.payload.tags.forEach(tag => {
        dispatch(tagUsed(tag));
      });
    }
  }

  // Track project completion
  if (action.type === 'projects/updateProject') {
    const state = store.getState();
    const project = state.projects.projects.find(p => p.id === action.payload.id);
    
    // Check if status changed to completed
    if (action.payload.status === 'completed' && project && project.status !== 'completed') {
      dispatch(projectCompleted());
    }
  }

  // Track todo completion
  if (action.type === 'todos/setTodoStatus') {
    if (action.payload.status === 'done') {
      const state = store.getState();
      const todo = state.todos.todos.find(t => t.id === action.payload.id);
      
      // Only track if it wasn't already done
      if (todo && todo.status !== 'done') {
        dispatch(todoCompleted());
      }
    }
  }

  // Track todo completion via progress
  if (action.type === 'todos/setTodoProgress') {
    if (action.payload.progress === 100) {
      const state = store.getState();
      const todo = state.todos.todos.find(t => t.id === action.payload.id);
      
      // Only track if it wasn't already at 100%
      if (todo && todo.progress !== 100) {
        dispatch(todoCompleted());
      }
    }
  }

  return result;
};
