import { configureStore } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import storage from 'redux-persist/lib/storage'; // localStorage for web
import { combineReducers } from 'redux';


import authReducer from './slices/authSlice';
import projectsReducer from './slices/projectsSlice';
import pointsReducer from './slices/pointsSlice';
import usersReducer from './slices/usersSlice';
import inventoryReducer from './slices/inventorySlice';
import productionReducer from './slices/productionSlice';
import organizationsReducer from './slices/organizationsSlice';
import notesReducer from './slices/notesSlice';
import calendarReducer from './slices/calendarSlice';
import todosReducer from './slices/todosSlice';
import paymentsReducer from './slices/paymentsSlice';
import routinesReducer from './slices/routinesSlice';
import budgetReducer from './slices/budgetSlice';
import collaboratorsReducer from './slices/collaboratorsSlice';
import workOrdersReducer from './slices/workOrdersSlice';

// Importar los slices maestros
import {
  projectsMasterSlice,
  pointsMasterSlice,
  pointsStatusHistorySlice,
  modDocsRegistrySlice,
  hardwareInventorySlice,
  materialsUsageSlice,
  commRoomsSlice,
  dailyReportsSlice,
  usersAccessSlice,
  approvalsLogSlice,
  notificationsQueueSlice,
} from './slices/masterSlices';


// Redux Persist configuration
const persistConfig = {
  key: 'root',
  storage,
  whitelist: [
    'auth',
    'projects',
    'points',
    'users',
    'inventory',
    'production',
    'organizations',
    'notes',
    'calendar',
    'todos',
    'payments',
    'routines',
    'budget',
    'collaborators',
    'workOrders',
    // Slices maestros
    'projectsMaster',
    'pointsMaster',
    'pointsStatusHistory',
    'modDocsRegistry',
    'hardwareInventory',
    'materialsUsage',
    'commRooms',
    'dailyReports',
    'usersAccess',
    'approvalsLog',
    'notificationsQueue',
  ],
};


const rootReducer = combineReducers({
  auth: authReducer,
  projects: projectsReducer,
  points: pointsReducer,
  users: usersReducer,
  inventory: inventoryReducer,
  production: productionReducer,
  organizations: organizationsReducer,
  notes: notesReducer,
  calendar: calendarReducer,
  todos: todosReducer,
  payments: paymentsReducer,
  routines: routinesReducer,
  budget: budgetReducer,
  collaborators: collaboratorsReducer,
  workOrders: workOrdersReducer,
  // Slices maestros
  projectsMaster: projectsMasterSlice.reducer,
  pointsMaster: pointsMasterSlice.reducer,
  pointsStatusHistory: pointsStatusHistorySlice.reducer,
  modDocsRegistry: modDocsRegistrySlice.reducer,
  hardwareInventory: hardwareInventorySlice.reducer,
  materialsUsage: materialsUsageSlice.reducer,
  commRooms: commRoomsSlice.reducer,
  dailyReports: dailyReportsSlice.reducer,
  usersAccess: usersAccessSlice.reducer,
  approvalsLog: approvalsLogSlice.reducer,
  notificationsQueue: notificationsQueueSlice.reducer,
});

const persistedReducer = persistReducer(persistConfig, rootReducer);

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);
