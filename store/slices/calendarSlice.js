import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  events: [],
};

const calendarSlice = createSlice({
  name: 'calendar',
  initialState,
  reducers: {
    addEvent: (state, action) => {
      const newEvent = {
        id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        title: action.payload.title,
        description: action.payload.description || '',
        startDate: action.payload.startDate,
        endDate: action.payload.endDate || action.payload.startDate,
        allDay: action.payload.allDay || false,
        color: action.payload.color || '#1ec9ff',
        type: action.payload.type || 'event', // 'event', 'task', 'note', 'deadline'
        relatedId: action.payload.relatedId || null, // ID of related task, project, or note
        relatedType: action.payload.relatedType || null, // 'task', 'project', 'note'
        createdAt: new Date().toISOString(),
      };
      state.events.push(newEvent);
    },
    
    updateEvent: (state, action) => {
      const { id, ...updates } = action.payload;
      const event = state.events.find((e) => e.id === id);
      if (event) {
        Object.assign(event, updates);
      }
    },
    
    deleteEvent: (state, action) => {
      state.events = state.events.filter((e) => e.id !== action.payload);
    },
    
    linkTaskToCalendar: (state, action) => {
      const { taskId, taskTitle, dueDate, projectId } = action.payload;
      const existingEvent = state.events.find(
        (e) => e.relatedId === taskId && e.relatedType === 'task'
      );
      
      if (existingEvent) {
        existingEvent.startDate = dueDate;
        existingEvent.endDate = dueDate;
        existingEvent.title = taskTitle;
      } else {
        const newEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: taskTitle,
          description: `Task deadline`,
          startDate: dueDate,
          endDate: dueDate,
          allDay: true,
          color: '#f59e0b',
          type: 'deadline',
          relatedId: taskId,
          relatedType: 'task',
          projectId: projectId,
          createdAt: new Date().toISOString(),
        };
        state.events.push(newEvent);
      }
    },
    
    linkNoteToCalendar: (state, action) => {
      const { noteId, noteTitle, date, color } = action.payload;
      const existingEvent = state.events.find(
        (e) => e.relatedId === noteId && e.relatedType === 'note'
      );
      
      if (existingEvent) {
        existingEvent.startDate = date;
        existingEvent.endDate = date;
        existingEvent.title = noteTitle;
        existingEvent.color = color || '#1ec9ff';
      } else {
        const newEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: noteTitle,
          description: `Note reminder`,
          startDate: date,
          endDate: date,
          allDay: true,
          color: color || '#1ec9ff',
          type: 'note',
          relatedId: noteId,
          relatedType: 'note',
          createdAt: new Date().toISOString(),
        };
        state.events.push(newEvent);
      }
    },

    linkTodoToCalendar: (state, action) => {
      const { todoId, todoTitle, dueDate } = action.payload;
      const existingEvent = state.events.find(
        (e) => e.relatedId === todoId && e.relatedType === 'todo'
      );

      if (existingEvent) {
        existingEvent.startDate = dueDate;
        existingEvent.endDate = dueDate;
        existingEvent.title = todoTitle;
        existingEvent.type = 'todo';
        existingEvent.color = '#22c55e';
      } else {
        const newEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: todoTitle,
          description: 'Todo reminder',
          startDate: dueDate,
          endDate: dueDate,
          allDay: true,
          color: '#22c55e',
          type: 'todo',
          relatedId: todoId,
          relatedType: 'todo',
          createdAt: new Date().toISOString(),
        };
        state.events.push(newEvent);
      }
    },

    linkPaymentToCalendar: (state, action) => {
      const { paymentId, paymentTitle, dueDate } = action.payload;
      const existingEvent = state.events.find(
        (e) => e.relatedId === paymentId && e.relatedType === 'payment'
      );

      if (existingEvent) {
        existingEvent.startDate = dueDate;
        existingEvent.endDate = dueDate;
        existingEvent.title = paymentTitle;
        existingEvent.type = 'payment';
        existingEvent.color = '#a855f7';
      } else {
        const newEvent = {
          id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          title: paymentTitle,
          description: 'Payment due',
          startDate: dueDate,
          endDate: dueDate,
          allDay: true,
          color: '#a855f7',
          type: 'payment',
          relatedId: paymentId,
          relatedType: 'payment',
          createdAt: new Date().toISOString(),
        };
        state.events.push(newEvent);
      }
    },
    
    unlinkFromCalendar: (state, action) => {
      const { relatedId, relatedType } = action.payload;
      state.events = state.events.filter(
        (e) => !(e.relatedId === relatedId && e.relatedType === relatedType)
      );
    },
    
    syncProjectDeadline: (state, action) => {
      const { projectId, projectName, deadline } = action.payload;
      const existingEvent = state.events.find(
        (e) => e.relatedId === projectId && e.relatedType === 'project'
      );
      
      if (deadline) {
        if (existingEvent) {
          existingEvent.startDate = deadline;
          existingEvent.endDate = deadline;
          existingEvent.title = `${projectName} - Deadline`;
        } else {
          const newEvent = {
            id: `event-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            title: `${projectName} - Deadline`,
            description: `Project deadline`,
            startDate: deadline,
            endDate: deadline,
            allDay: true,
            color: '#ef4444',
            type: 'deadline',
            relatedId: projectId,
            relatedType: 'project',
            createdAt: new Date().toISOString(),
          };
          state.events.push(newEvent);
        }
      } else if (existingEvent) {
        state.events = state.events.filter((e) => e.id !== existingEvent.id);
      }
    },
  },
});

export const {
  addEvent,
  updateEvent,
  deleteEvent,
  linkTaskToCalendar,
  linkNoteToCalendar,
  unlinkFromCalendar,
  syncProjectDeadline,
  linkTodoToCalendar,
  linkPaymentToCalendar,
} = calendarSlice.actions;

export default calendarSlice.reducer;
