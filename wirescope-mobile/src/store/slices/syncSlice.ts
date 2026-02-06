import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface SyncItem {
  id: string;
  type: 'project' | 'point' | 'material' | 'report';
  action: 'create' | 'update' | 'delete';
  data: any;
  timestamp: number;
  synced: boolean;
}

export interface SyncState {
  isOnline: boolean;
  isSyncing: boolean;
  lastSyncTime: number | null;
  pendingSync: SyncItem[];
  failedSync: SyncItem[];
  error: string | null;
}

const initialState: SyncState = {
  isOnline: true,
  isSyncing: false,
  lastSyncTime: null,
  pendingSync: [],
  failedSync: [],
  error: null,
};

const syncSlice = createSlice({
  name: 'sync',
  initialState,
  reducers: {
    setOnlineStatus: (state, action: PayloadAction<boolean>) => {
      state.isOnline = action.payload;
    },
    setSyncingStatus: (state, action: PayloadAction<boolean>) => {
      state.isSyncing = action.payload;
    },
    addToSyncQueue: (state, action: PayloadAction<Omit<SyncItem, 'id' | 'timestamp' | 'synced'>>) => {
      const syncItem: SyncItem = {
        ...action.payload,
        id: `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        timestamp: Date.now(),
        synced: false,
      };
      state.pendingSync.push(syncItem);
    },
    markAsSynced: (state, action: PayloadAction<string>) => {
      const itemIndex = state.pendingSync.findIndex(item => item.id === action.payload);
      if (itemIndex !== -1) {
        state.pendingSync.splice(itemIndex, 1);
      }
      const failedIndex = state.failedSync.findIndex(item => item.id === action.payload);
      if (failedIndex !== -1) {
        state.failedSync.splice(failedIndex, 1);
      }
    },
    markSyncFailed: (state, action: PayloadAction<string>) => {
      const itemIndex = state.pendingSync.findIndex(item => item.id === action.payload);
      if (itemIndex !== -1) {
        const item = state.pendingSync[itemIndex];
        state.pendingSync.splice(itemIndex, 1);
        state.failedSync.push(item);
      }
    },
    updateLastSyncTime: (state) => {
      state.lastSyncTime = Date.now();
    },
    setSyncError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
    clearSyncQueue: (state) => {
      state.pendingSync = [];
      state.failedSync = [];
    },
  },
});

export const {
  setOnlineStatus,
  setSyncingStatus,
  addToSyncQueue,
  markAsSynced,
  markSyncFailed,
  updateLastSyncTime,
  setSyncError,
  clearSyncQueue,
} = syncSlice.actions;

export default syncSlice.reducer;