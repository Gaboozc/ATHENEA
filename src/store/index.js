import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage for web
import { combineReducers } from 'redux';
import { achievementMiddleware } from './achievementMiddleware';


import authReducer from './slices/authSlice';
import projectsReducer from './slices/projectsSlice';
import organizationsReducer from './slices/organizationsSlice';
import notesReducer from './slices/notesSlice';
import calendarReducer from './slices/calendarSlice';
import todosReducer from './slices/todosSlice';
import paymentsReducer from './slices/paymentsSlice';
import routinesReducer from './slices/routinesSlice';
import budgetReducer from './slices/budgetSlice';
import collaboratorsReducer from './slices/collaboratorsSlice';
import workOrdersReducer from './slices/workOrdersSlice';
import statsReducer from './slices/statsSlice';


// Redux Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: [
    'auth',
    'projects',
    'organizations',
    'notes',
    'calendar',
    'todos',
    'payments',
    'routines',
    'budget',
    'collaborators',
    'workOrders',
    'stats',
  ],
};


const rootReducer = combineReducers({
  auth: authReducer,
  projects: projectsReducer,
  organizations: organizationsReducer,
  notes: notesReducer,
  calendar: calendarReducer,
  todos: todosReducer,
  payments: paymentsReducer,
  routines: routinesReducer,
  budget: budgetReducer,
  collaborators: collaboratorsReducer,
  workOrders: workOrdersReducer,
  stats: statsReducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }).concat(achievementMiddleware),
});

export const persistor = persistStore(store);
