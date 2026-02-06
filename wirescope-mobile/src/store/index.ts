import { configureStore, combineReducers } from '@reduxjs/toolkit';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Import reducers
import authReducer from './slices/authSlice';
import projectsReducer from './slices/projectsSlice';
import pointsReducer from './slices/pointsSlice';
import materialsReducer from './slices/materialsSlice';
import notificationsReducer from './slices/notificationsSlice';
import syncReducer from './slices/syncSlice';

// Persist configuration
const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'projects', 'sync'], // Only persist these reducers
  blacklist: ['notifications'], // Don't persist notifications
};

const rootReducer = combineReducers({
  auth: authReducer,
  projects: projectsReducer,
  points: pointsReducer,
  materials: materialsReducer,
  notifications: notificationsReducer,
  sync: syncReducer,
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
  devTools: typeof __DEV__ !== 'undefined' ? __DEV__ : process.env.NODE_ENV !== 'production',
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;