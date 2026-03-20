import { createSlice } from '@reduxjs/toolkit';

const projectsSlice = createSlice({
  name: 'projects',
  initialState: {
    projects: [],
    currentProject: null,
    isLoading: false
  },
  reducers: {
    setCurrentProject: (state, action) => {
      state.currentProject = action.payload;
    },
    addProject: (state, action) => {
      state.projects.unshift({
        id: action.payload?.id || `project-${Date.now()}`,
        name: action.payload?.name || action.payload?.title || 'Untitled Project',
        status: action.payload?.status || 'planning',
        tasks: action.payload?.tasks || [],
        phase: action.payload?.phase || 'Discovery',  /* NEW-WORK-3 */
        meetingNotes: action.payload?.meetingNotes || [],  /* NEW-WORK-3 */
        createdAt: new Date().toISOString(),
        ...action.payload
      });
    },
    updateProject: (state, action) => {
      const { id, ...updates } = action.payload || {};
      const target = state.projects.find((entry) => entry.id === id);
      if (target) Object.assign(target, updates);
    },
    deleteProject: (state, action) => {
      state.projects = state.projects.filter((entry) => entry.id !== action.payload);
    },
    setProjectPhase: (state, action) => {  /* NEW-WORK-3 */
      const { id, phase } = action.payload || {};
      const target = state.projects.find((p) => p.id === id);
      if (target) target.phase = phase;
    },
    addMeetingNote: (state, action) => {  /* NEW-WORK-3 */
      const { id, note } = action.payload || {};
      const target = state.projects.find((p) => p.id === id);
      if (!target) return;
      if (!target.meetingNotes) target.meetingNotes = [];
      target.meetingNotes.unshift({
        id: note?.id || `meet-${Date.now()}`,
        dateTime: note?.dateTime || new Date().toISOString().slice(0, 16),
        transcription: note?.transcription || '',
        link: note?.link || '',
        createdAt: new Date().toISOString()
      });
    },
    deleteMeetingNote: (state, action) => {  /* NEW-WORK-3 */
      const { id, noteId } = action.payload || {};
      const target = state.projects.find((p) => p.id === id);
      if (target?.meetingNotes) {
        target.meetingNotes = target.meetingNotes.filter((n) => n.id !== noteId);
      }
    }
  }
});

export const { setCurrentProject, addProject, updateProject, deleteProject, setProjectPhase, addMeetingNote, deleteMeetingNote } = projectsSlice.actions;
export default projectsSlice.reducer;
