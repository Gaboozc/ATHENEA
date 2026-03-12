import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';
import aiMemoryReducer, { clearActionHistory } from '../slices/aiMemorySlice';
import { actionHistoryMiddleware } from './actionHistoryMiddleware';

const createTestStore = () =>
  configureStore({
    reducer: {
      aiMemory: aiMemoryReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(actionHistoryMiddleware),
  });

describe('actionHistoryMiddleware', () => {
  it('registra actionHistory/record en aiMemory.actionHistory con valores normalizados', () => {
    const store = createTestStore();

    store.dispatch({
      type: 'actionHistory/record',
      payload: {
        hub: 'FinanceHub',
        actionType: 'record-expense',
        description: 'Registro manual de gasto',
        success: true,
      },
    });

    const history = store.getState().aiMemory.actionHistory;

    expect(history).toHaveLength(1);
    expect(history[0].hub).toBe('FinanceHub');
    expect(history[0].type).toBe('user-command');
    expect(history[0].actionType).toBe('record-expense');
    expect(history[0].description).toBe('Registro manual de gasto');
    expect(history[0].success).toBe(true);
    expect(typeof history[0].id).toBe('string');
    expect(history[0].id.length).toBeGreaterThan(0);
  });

  it('agrega nuevos registros al inicio y preserva metadatos custom cuando vienen en payload', () => {
    const store = createTestStore();

    store.dispatch({
      type: 'actionHistory/record',
      payload: {
        id: 'entry-1',
        timestamp: '2026-03-11T10:00:00.000Z',
        type: 'voice-command',
        hub: 'WorkHub',
        actionType: 'add-task',
        description: 'Primera accion',
        reduxActionType: 'tasks/addTask',
        payload: { title: 'Task A' },
        success: true,
      },
    });

    store.dispatch({
      type: 'actionHistory/record',
      payload: {
        id: 'entry-2',
        timestamp: '2026-03-11T10:01:00.000Z',
        type: 'proactive-insight',
        hub: 'PersonalHub',
        actionType: 'suggest-break',
        description: 'Segunda accion',
        success: false,
      },
    });

    const history = store.getState().aiMemory.actionHistory;

    expect(history).toHaveLength(2);
    expect(history[0].id).toBe('entry-2');
    expect(history[1].id).toBe('entry-1');
    expect(history[1].reduxActionType).toBe('tasks/addTask');
    expect(history[1].payload).toEqual({ title: 'Task A' });
    expect(history[0].type).toBe('proactive-insight');
    expect(history[1].type).toBe('voice-command');
  });

  it('permite limpiar historial y deja actionHistory vacio', () => {
    const store = createTestStore();

    store.dispatch({
      type: 'actionHistory/record',
      payload: {
        hub: 'CrossHub',
        actionType: 'sync',
        description: 'Sincronizacion',
      },
    });

    expect(store.getState().aiMemory.actionHistory).toHaveLength(1);

    store.dispatch(clearActionHistory());

    expect(store.getState().aiMemory.actionHistory).toHaveLength(0);
  });
});
