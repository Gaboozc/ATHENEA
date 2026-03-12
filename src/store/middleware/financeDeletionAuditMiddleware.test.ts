import { configureStore } from '@reduxjs/toolkit';
import { describe, expect, it } from 'vitest';

import budgetReducer, { addExpense, deleteExpense } from '../../../store/slices/budgetSlice';
import paymentsReducer, { addPayment, deletePayment } from '../../../store/slices/paymentsSlice';
import aiMemoryReducer, {
  appendActionHistoryEntry,
  deleteActionHistoryEntry,
} from '../slices/aiMemorySlice';
import { actionHistoryMiddleware } from './actionHistoryMiddleware';
import { financeDeletionAuditMiddleware } from './financeDeletionAuditMiddleware';

const createTestStore = () =>
  configureStore({
    reducer: {
      budget: budgetReducer,
      payments: paymentsReducer,
      aiMemory: aiMemoryReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(actionHistoryMiddleware, financeDeletionAuditMiddleware),
  });

describe('financeDeletionAuditMiddleware', () => {
  it('records action history when a budget expense is deleted', () => {
    const store = createTestStore();

    store.dispatch(
      addExpense({
        id: 'exp-1',
        amount: 120,
        categoryId: 'food',
        note: 'Pizza night',
        date: '2026-03-10T00:00:00.000Z',
      })
    );

    const beforeLength = store.getState().aiMemory.actionHistory.length;
    store.dispatch(deleteExpense('exp-1'));

    const history = store.getState().aiMemory.actionHistory;
    expect(history.length).toBe(beforeLength + 1);
    expect(history[0].hub).toBe('FinanceHub');
    expect(history[0].actionType).toBe('delete-expense');
    expect(history[0].description).toContain('Pizza night');
    expect(history[0].payload?.id).toBe('exp-1');
    expect(history[0].success).toBe(true);
  });

  it('records action history when a payment is deleted', () => {
    const store = createTestStore();

    store.dispatch(
      addPayment({
        id: 'pay-1',
        name: 'Netflix',
        amount: 20,
      })
    );

    const beforeLength = store.getState().aiMemory.actionHistory.length;
    store.dispatch(deletePayment('pay-1'));

    const history = store.getState().aiMemory.actionHistory;
    expect(history.length).toBe(beforeLength + 1);
    expect(history[0].hub).toBe('FinanceHub');
    expect(history[0].actionType).toBe('delete-payment');
    expect(history[0].description).toContain('Netflix');
    expect(history[0].payload?.id).toBe('pay-1');
    expect(history[0].success).toBe(true);
  });

  it('records deletion of an action history entry exactly once', () => {
    const store = createTestStore();

    store.dispatch(
      appendActionHistoryEntry({
        id: 'ah-1',
        timestamp: '2026-03-12T00:00:00.000Z',
        type: 'user-command',
        hub: 'FinanceHub',
        actionType: 'add-expense',
        description: 'Expense created',
        success: true,
      })
    );

    store.dispatch(deleteActionHistoryEntry({ id: 'ah-1' }));

    const history = store.getState().aiMemory.actionHistory;
    const deleteEntries = history.filter((entry) => entry.actionType === 'delete-action-history-entry');

    expect(deleteEntries.length).toBe(1);
    expect(deleteEntries[0].description).toContain('Expense created');
    expect(deleteEntries[0].payload?.id).toBe('ah-1');
    expect(history.find((entry) => entry.id === 'ah-1')).toBeUndefined();
  });
});
