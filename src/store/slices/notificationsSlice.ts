import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export type NotificationUrgency = 'low' | 'medium' | 'high' | 'critical';
export type NotificationSource = 'agent' | 'reminder' | 'system' | 'widget';

export interface NotificationEntry {
  id: string;
  title: string;
  body: string;
  urgency: NotificationUrgency;
  source: NotificationSource;
  agentName?: string;   // 'Cortana' | 'Jarvis' | 'SHODAN'
  tag?: string;
  read: boolean;
  dismissed: boolean;
  timestamp: number;
}

export interface NotificationsState {
  notifications: NotificationEntry[];
}

const MAX_NOTIFICATIONS = 60;

const initialState: NotificationsState = {
  notifications: [],
};

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    addNotification: (state, action: PayloadAction<Omit<NotificationEntry, 'read' | 'dismissed'>>) => {
      // Dedupe by id
      const exists = state.notifications.some((n) => n.id === action.payload.id);
      if (exists) return;
      state.notifications.unshift({ ...action.payload, read: false, dismissed: false });
      // Keep only the latest MAX_NOTIFICATIONS
      if (state.notifications.length > MAX_NOTIFICATIONS) {
        state.notifications = state.notifications.slice(0, MAX_NOTIFICATIONS);
      }
    },
    markRead: (state, action: PayloadAction<string>) => {
      const n = state.notifications.find((n) => n.id === action.payload);
      if (n) n.read = true;
    },
    markAllRead: (state) => {
      state.notifications.forEach((n) => { n.read = true; });
    },
    dismissNotification: (state, action: PayloadAction<string>) => {
      const n = state.notifications.find((n) => n.id === action.payload);
      if (n) { n.dismissed = true; n.read = true; }
    },
    clearDismissed: (state) => {
      state.notifications = state.notifications.filter((n) => !n.dismissed);
    },
    clearAll: (state) => {
      state.notifications = [];
    },
  },
});

export const {
  addNotification,
  markRead,
  markAllRead,
  dismissNotification,
  clearDismissed,
  clearAll,
} = notificationsSlice.actions;

export default notificationsSlice.reducer;

/* ── Selectors ── */
export const selectAllNotifications = (state: any) =>
  (state.notifications?.notifications ?? []).filter((n: NotificationEntry) => !n.dismissed);

export const selectUnreadCount = (state: any) =>
  (state.notifications?.notifications ?? []).filter(
    (n: NotificationEntry) => !n.read && !n.dismissed
  ).length;

export const selectBySource = (source: NotificationSource) => (state: any) =>
  (state.notifications?.notifications ?? []).filter(
    (n: NotificationEntry) => n.source === source && !n.dismissed
  );
