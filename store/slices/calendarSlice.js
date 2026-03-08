import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { listGoogleCalendarEvents } from '../../src/services/googleCalendar.ts';

const normalizeIso = (value) => {
  if (!value) return null;
  const date = new Date(String(value));
  if (Number.isNaN(date.getTime())) return null;
  return date.toISOString();
};

const mapGoogleEventToAthenea = (event) => {
  const startDate = normalizeIso(event?.start?.dateTime || event?.start?.date);
  const endDate = normalizeIso(event?.end?.dateTime || event?.end?.date || startDate);
  const title = event?.summary || 'Google Calendar event';
  const lowerTitle = String(title).toLowerCase();
  const important = /interview|deadline|presentation|board|client|important|critical|launch/.test(lowerTitle);

  return {
    id: `gcal-${event.id}`,
    externalId: event.id,
    provider: 'google',
    title,
    description: event?.description || '',
    startDate,
    endDate,
    location: event?.location || '',
    sourceUrl: event?.htmlLink || '',
    relatedType: 'external-calendar',
    color: important ? '#ef4444' : '#3b82f6',
    importance: important ? 'high' : 'normal',
    updatedAt: normalizeIso(event?.updated) || new Date().toISOString(),
    syncedAt: new Date().toISOString()
  };
};

export const syncExternalEvents = createAsyncThunk(
  'calendar/syncExternalEvents',
  async (payload = {}, thunkApi) => {
    try {
      const state = thunkApi.getState();
      const existingEvents = Array.isArray(state?.calendar?.events) ? state.calendar.events : [];

      const now = new Date();
      const timeMin = payload.timeMin || now.toISOString();
      const horizon = new Date(now.getTime() + 1000 * 60 * 60 * 24 * 14);
      const timeMax = payload.timeMax || horizon.toISOString();

      const response = await listGoogleCalendarEvents({
        timeMin,
        timeMax,
        maxResults: payload.maxResults || 100,
        forceInteractiveAuth: Boolean(payload.forceInteractiveAuth)
      });

      const mapped = response.items.map(mapGoogleEventToAthenea).filter((event) => event.startDate);
      const existingExternalIds = new Set(
        existingEvents
          .filter((event) => event?.provider === 'google' && event?.externalId)
          .map((event) => event.externalId)
      );

      const updatesByExternalId = new Map();
      mapped.forEach((event) => updatesByExternalId.set(event.externalId, event));

      const newEvents = mapped.filter((event) => !existingExternalIds.has(event.externalId));

      return {
        newEvents,
        updatesByExternalId: Object.fromEntries(updatesByExternalId),
        syncedCount: mapped.length,
        nextSyncToken: response.nextSyncToken || null,
        syncedAt: new Date().toISOString()
      };
    } catch (error) {
      return thunkApi.rejectWithValue(error instanceof Error ? error.message : 'Calendar sync failed');
    }
  }
);

const calendarSlice = createSlice({
  name: 'calendar',
  initialState: {
    events: [],
    lastExternalSyncAt: null,
    externalSyncStatus: 'idle',
    externalSyncError: null,
    externalProvider: 'google',
    nextSyncToken: null
  },
  reducers: {
    addEvent: (state, action) => {
      state.events.push({
        id: action.payload?.id || `event-${Date.now()}`,
        ...action.payload,
        createdAt: new Date().toISOString()
      });
    },
    updateEvent: (state, action) => {
      const { id, ...updates } = action.payload || {};
      const event = state.events.find((entry) => entry.id === id);
      if (event) Object.assign(event, updates);
    },
    deleteEvent: (state, action) => {
      state.events = state.events.filter((entry) => entry.id !== action.payload);
    },
    linkNoteToCalendar: (state, action) => {
      const payload = action.payload || {};
      const id = `note-${payload.noteId}`;
      state.events = state.events.filter((entry) => entry.id !== id);
      state.events.push({
        id,
        title: payload.noteTitle || 'Note reminder',
        startDate: payload.date,
        endDate: payload.date,
        relatedId: payload.noteId,
        relatedType: 'note',
        color: payload.color || '#1ec9ff'
      });
    },
    linkTodoToCalendar: (state, action) => {
      const payload = action.payload || {};
      const id = `todo-${payload.todoId}`;
      state.events = state.events.filter((entry) => entry.id !== id);
      state.events.push({
        id,
        title: payload.todoTitle || 'Todo',
        startDate: payload.dueDate,
        endDate: payload.dueDate,
        relatedId: payload.todoId,
        relatedType: 'todo',
        color: '#22c55e'
      });
    },
    linkPaymentToCalendar: (state, action) => {
      const payload = action.payload || {};
      const id = `payment-${payload.paymentId}`;
      state.events = state.events.filter((entry) => entry.id !== id);
      state.events.push({
        id,
        title: payload.paymentTitle || 'Payment',
        startDate: payload.dueDate,
        endDate: payload.dueDate,
        relatedId: payload.paymentId,
        relatedType: 'payment',
        color: '#a855f7'
      });
    },
    unlinkFromCalendar: (state, action) => {
      const { relatedId, relatedType } = action.payload || {};
      state.events = state.events.filter(
        (entry) => !(entry.relatedId === relatedId && entry.relatedType === relatedType)
      );
    },
    resetExternalSyncError: (state) => {
      state.externalSyncError = null;
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase(syncExternalEvents.pending, (state) => {
        state.externalSyncStatus = 'loading';
        state.externalSyncError = null;
      })
      .addCase(syncExternalEvents.fulfilled, (state, action) => {
        const payload = action.payload || {};
        const updatesMap = payload.updatesByExternalId || {};

        state.events = state.events.map((event) => {
          if (event?.provider !== 'google' || !event?.externalId) return event;
          const next = updatesMap[event.externalId];
          return next ? { ...event, ...next } : event;
        });

        (payload.newEvents || []).forEach((event) => {
          state.events.push(event);
        });

        state.lastExternalSyncAt = payload.syncedAt || new Date().toISOString();
        state.externalSyncStatus = 'succeeded';
        state.nextSyncToken = payload.nextSyncToken || null;
      })
      .addCase(syncExternalEvents.rejected, (state, action) => {
        state.externalSyncStatus = 'failed';
        state.externalSyncError =
          action.payload || action.error?.message || 'Calendar sync failed';
      });
  }
});

export const {
  addEvent,
  updateEvent,
  deleteEvent,
  linkNoteToCalendar,
  linkTodoToCalendar,
  linkPaymentToCalendar,
  unlinkFromCalendar,
  resetExternalSyncError
} = calendarSlice.actions;

export default calendarSlice.reducer;
