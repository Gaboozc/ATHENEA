import { createSlice } from '@reduxjs/toolkit';

const notesSlice = createSlice({
  name: 'notes',
  initialState: {
    notes: [],
    tags: ['personal', 'work', 'ideas', 'todo']
  },
  reducers: {
    addNote: (state, action) => {
      const payload = action.payload || {};
      state.notes.unshift({
        id: payload.id || `note-${Date.now()}`,
        title: payload.title || 'Untitled Note',
        content: payload.content || '',
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        color: payload.color || '#1ec9ff',
        reminderDate: payload.reminderDate || null,
        pinned: Boolean(payload.pinned),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    },
    updateNote: (state, action) => {
      const { id, ...updates } = action.payload || {};
      const note = state.notes.find((entry) => entry.id === id);
      if (!note) return;
      Object.assign(note, updates);
      note.updatedAt = new Date().toISOString();
    },
    deleteNote: (state, action) => {
      state.notes = state.notes.filter((entry) => entry.id !== action.payload);
    },
    togglePinNote: (state, action) => {
      const note = state.notes.find((entry) => entry.id === action.payload);
      if (!note) return;
      note.pinned = !note.pinned;
      note.updatedAt = new Date().toISOString();
    },
    addTag: (state, action) => {
      const payload = action.payload;

      if (typeof payload === 'string') {
        const normalized = payload.trim().toLowerCase();
        if (normalized && !state.tags.includes(normalized)) {
          state.tags.push(normalized);
        }
        return;
      }

      const noteId = payload?.id || payload?.noteId;
      const incomingTags = Array.isArray(payload?.tags)
        ? payload.tags
        : [payload?.tag].filter(Boolean);

      const normalizedTags = incomingTags
        .map((tag) => String(tag).trim().toLowerCase())
        .filter(Boolean);

      normalizedTags.forEach((tag) => {
        if (!state.tags.includes(tag)) state.tags.push(tag);
      });

      if (!noteId) return;
      const note = state.notes.find((entry) => entry.id === noteId);
      if (!note) return;

      const current = Array.isArray(note.tags) ? note.tags : [];
      note.tags = Array.from(new Set([...current, ...normalizedTags]));
      note.updatedAt = new Date().toISOString();
    }
  },
  /* P-FIX-5: extraReducers removed — addTag is handled exclusively in reducers above */
});


export const { addNote, updateNote, deleteNote, togglePinNote, addTag } = notesSlice.actions;
export default notesSlice.reducer;
