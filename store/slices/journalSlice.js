import { createSlice } from '@reduxjs/toolkit';

const journalSlice = createSlice({
  name: 'journal',
  initialState: {
    entries: [],
  },
  reducers: {
    addEntry: (state, action) => {
      const payload = action.payload || {};
      const id = payload.id || `journal-${Date.now()}`;
      const content = payload.content || '';
      const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;
      state.entries.unshift({
        id,
        date: payload.date || new Date().toISOString().split('T')[0],
        title: payload.title || '',
        content,
        mood: payload.mood ?? null,
        tags: Array.isArray(payload.tags) ? payload.tags : [],
        wordCount,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },
    updateEntry: (state, action) => {
      const { id, ...updates } = action.payload || {};
      const entry = state.entries.find((e) => e.id === id);
      if (!entry) return;
      if (updates.content !== undefined) {
        const c = updates.content || '';
        updates.wordCount = c.trim() ? c.trim().split(/\s+/).length : 0;
      }
      Object.assign(entry, updates);
      entry.updatedAt = new Date().toISOString();
    },
    deleteEntry: (state, action) => {
      state.entries = state.entries.filter((e) => e.id !== action.payload);
    },
  },
});

export const { addEntry, updateEntry, deleteEntry } = journalSlice.actions;
export default journalSlice.reducer;
