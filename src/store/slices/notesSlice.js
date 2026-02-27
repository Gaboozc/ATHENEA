import { createSlice } from '@reduxjs/toolkit';

const notesSlice = createSlice({
  name: 'notes',
  initialState: {
    notes: [],
    tags: ['personal', 'work', 'ideas', 'todo'],
  },
  reducers: {
    addNote: (state, action) => {
      const { title, content, tags, color } = action.payload;
      const newNote = {
        id: Date.now().toString(),
        title: title || 'Untitled Note',
        content: content || '',
        tags: tags || [],
        color: color || '#1ec9ff',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        pinned: false,
      };
      state.notes.unshift(newNote);
    },
    updateNote: (state, action) => {
      const { id, title, content, tags, color } = action.payload;
      const note = state.notes.find((n) => n.id === id);
      if (note) {
        if (title !== undefined) note.title = title;
        if (content !== undefined) note.content = content;
        if (tags !== undefined) note.tags = tags;
        if (color !== undefined) note.color = color;
        note.updatedAt = new Date().toISOString();
      }
    },
    deleteNote: (state, action) => {
      state.notes = state.notes.filter((n) => n.id !== action.payload);
    },
    togglePinNote: (state, action) => {
      const note = state.notes.find((n) => n.id === action.payload);
      if (note) {
        note.pinned = !note.pinned;
        note.updatedAt = new Date().toISOString();
      }
    },
    addTag: (state, action) => {
      const tag = action.payload.trim().toLowerCase();
      if (tag && !state.tags.includes(tag)) {
        state.tags.push(tag);
      }
    },
  },
});

export const { addNote, updateNote, deleteNote, togglePinNote, addTag } = notesSlice.actions;
export default notesSlice.reducer;
