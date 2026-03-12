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
import aiMemoryReducer from '../src/store/slices/aiMemorySlice';
import userSettingsReducer from '../src/store/slices/userSettingsSlice';
import sensorDataReducer from '../src/store/slices/sensorDataSlice';
import userIdentityReducer from '../src/store/slices/userIdentitySlice';
import { aiObserverMiddleware } from '../src/store/middleware/aiObserverMiddleware';
import { actionHistoryMiddleware } from '../src/store/middleware/actionHistoryMiddleware';
import goalsReducer from './slices/goalsSlice';
import budgetCycleReducer from './slices/budgetCycleSlice';
import { budgetGuardMiddleware } from '../src/store/middleware/budgetGuardMiddleware';
import { financeDeletionAuditMiddleware } from '../src/store/middleware/financeDeletionAuditMiddleware';

const placeholderSlice = createSlice({
  name: 'app',
  initialState: {
    intelligence: {
      lastQuery: '',
      lastHub: 'WorkHub',
      lastExecutedAt: null
    }
  },
  reducers: {},
  extraReducers: (builder) => {
    builder.addCase('intelligence/executeSearch', (state, action) => {
      state.intelligence.lastQuery = String(action.payload?.query || '');
      state.intelligence.lastHub = action.payload?.hub || 'WorkHub';
      state.intelligence.lastExecutedAt = new Date().toISOString();
    });
  }
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
  aiMemory: aiMemoryReducer,
  userSettings: userSettingsReducer,
  userIdentity: userIdentityReducer,
  sensorData: sensorDataReducer,
  app: placeholderSlice.reducer,
  goals: goalsReducer,
  budgetCycle: budgetCycleReducer,
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
    'tasks',
    'sensorData',
    'userSettings',
    'userIdentity',
    'aiMemory',
    'goals',
    'budgetCycle',
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
    }).concat(aiObserverMiddleware, actionHistoryMiddleware, budgetGuardMiddleware, financeDeletionAuditMiddleware)
});

export const persistor = persistStore(store);

export default store;
