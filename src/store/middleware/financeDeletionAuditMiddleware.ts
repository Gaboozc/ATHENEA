import type { Middleware } from '@reduxjs/toolkit';

const DELETE_EXPENSE = 'budget/deleteExpense';
const DELETE_PAYMENT = 'payments/deletePayment';
const DELETE_ACTION_HISTORY = 'aiMemory/deleteActionHistoryEntry';

export const financeDeletionAuditMiddleware: Middleware = (storeApi) => (next) => (action: any) => {
  const prevState: any = storeApi.getState();
  const result = next(action);

  if (action?.type === DELETE_EXPENSE) {
    const deletedId = action.payload;
    const deletedExpense = (prevState?.budget?.expenses || []).find((e: any) => e.id === deletedId);

    storeApi.dispatch({
      type: 'actionHistory/record',
      payload: {
        hub: 'FinanceHub',
        actionType: 'delete-expense',
        type: 'user-command',
        agent: 'user',
        description: `✖ Gasto eliminado${deletedExpense?.note ? `: ${deletedExpense.note}` : ''}`,
        success: true,
        payload: {
          id: deletedId,
          amount: Number(deletedExpense?.amount || 0),
          categoryId: deletedExpense?.categoryId || null,
        },
      },
    });
  }

  if (action?.type === DELETE_PAYMENT) {
    const deletedId = action.payload;
    const deletedPayment = (prevState?.payments?.payments || []).find((p: any) => p.id === deletedId);

    storeApi.dispatch({
      type: 'actionHistory/record',
      payload: {
        hub: 'FinanceHub',
        actionType: 'delete-payment',
        type: 'user-command',
        agent: 'user',
        description: `✖ Movimiento eliminado${deletedPayment?.name ? `: ${deletedPayment.name}` : ''}`,
        success: true,
        payload: {
          id: deletedId,
          amount: Number(deletedPayment?.amount || 0),
          kind: deletedPayment?.type || null,
        },
      },
    });
  }

  if (action?.type === DELETE_ACTION_HISTORY) {
    const targetId = action?.payload?.id;
    const deletedEntry = (prevState?.aiMemory?.actionHistory || []).find((entry: any) => entry.id === targetId);

    storeApi.dispatch({
      type: 'actionHistory/record',
      payload: {
        hub: deletedEntry?.hub || 'CrossHub',
        actionType: 'delete-action-history-entry',
        type: 'user-command',
        agent: 'user',
        description: `✖ Registro de acción eliminado${deletedEntry?.description ? `: ${deletedEntry.description}` : ''}`,
        success: true,
        payload: {
          id: targetId,
          deletedActionType: deletedEntry?.actionType || null,
        },
      },
    });
  }

  return result;
};

export default financeDeletionAuditMiddleware;
