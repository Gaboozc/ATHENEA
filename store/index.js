import { combineReducers, configureStore, createSlice } from '@reduxjs/toolkit';
import { persistReducer, persistStore } from 'redux-persist';
import storage from 'redux-persist/lib/storage';

import usersReducer from './slices/usersSlice';
import authReducer from './slices/authSlice';
import organizationsReducer from './slices/organizationsSlice';
import projectsReducer from './slices/projectsSlice';
import notesReducer from './slices/notesSlice';
import calendarReducer from './slices/calendarSlice';
import todosReducer from './slices/todosSlice';
import paymentsReducer from './slices/paymentsSlice';
import routinesReducer from './slices/routinesSlice';
import budgetReducer from './slices/budgetSlice';
import collaboratorsReducer from './slices/collaboratorsSlice';
import workOrdersReducer from './slices/workOrdersSlice';
import statsReducer from './slices/statsSlice';
import tasksReducer from './slices/tasksSlice';

const placeholderSlice = createSlice({
  name: 'placeholder',
  initialState: {},
  reducers: {}
});

const rootReducer = combineReducers({
  users: usersReducer,
  auth: authReducer,
  organizations: organizationsReducer,
  projects: projectsReducer,
  notes: notesReducer,
  calendar: calendarReducer,
  todos: todosReducer,
  payments: paymentsReducer,
  routines: routinesReducer,
  budget: budgetReducer,
  collaborators: collaboratorsReducer,
  workOrders: workOrdersReducer,
  stats: statsReducer,
  tasks: tasksReducer,
  app: placeholderSlice.reducer
});

const persistConfig = {
  key: 'athenea-root',
  storage,
  whitelist: [
    'users',
    'auth',
    'organizations',
    'projects',
    'notes',
    'calendar',
    'todos',
    'payments',
    'routines',
    'budget',
    'collaborators',
    'workOrders',
    'stats',
    'tasks'
  ]
};

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE']
      }
    })
});

export const persistor = persistStore(store);

export default store;
