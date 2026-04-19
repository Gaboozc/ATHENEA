/* WALLETS-8: registerExpense thunk — ÚNICO punto de entrada para gastos.
 * Garantiza que walletsSlice y budgetSlice siempre estén sincronizados.
 * NUNCA usar dispatch(addExpense(...)) directamente desde componentes.
 */
import { addExpenseUSD, addExpenseMXN } from '../../../store/slices/walletsSlice';
import { addExpense, addCategory, deleteExpense } from '../../../store/slices/budgetSlice';
import { recordPayment, deletePayment } from '../../../store/slices/debtsSlice'; /* DEBTS-2 */
import { addEvent } from '../../../store/slices/calendarSlice'; /* DEBTS-2 */

export interface RegisterExpensePayload {
  id: string;
  amount: number;
  currency: 'MXN' | 'USD';
  categoryId: string | null;
  projectId?: string | null;
  description: string;
  date: string;
}

export const registerExpense = (payload: RegisterExpensePayload) => (dispatch: any) => {
  // 1. Registrar en presupuesto (categoría)
  dispatch(
    addExpense({
      id: payload.id,
      amount: payload.amount,
      currency: payload.currency,
      categoryId: payload.categoryId,
      projectId: payload.projectId || null,
      note: payload.description,
      date: payload.date,
    })
  );

  // 2. Descontar de la billetera correcta
  const walletPayload = {
    id: `wallet-exp-${payload.id}`,
    amount: payload.amount,
    description: payload.description,
    category: payload.categoryId,
    date: payload.date,
  };

  if (payload.currency === 'USD') {
    dispatch(addExpenseUSD(walletPayload));
  } else {
    dispatch(addExpenseMXN(walletPayload));
  }
};

/* BUG-1: Consistent delete across budget + wallet.
 * Reverts wallet balance first, then removes the budget expense.
 */
export const deleteExpenseConsistent = (expenseId: string) =>
  async (dispatch: any, getState: any) => {
    const state = getState();
    const expense = state.budget?.expenses?.find((e: any) => e.id === expenseId);

    if (!expense) {
      dispatch(deleteExpense(expenseId));
      return;
    }

    const reversePayload = {
      amount: Number(expense.amount || 0),
      description: `Reversión: ${expense.note || expense.description || 'Gasto'}`,
      date: new Date().toISOString(),
      id: `rev-${expenseId}`,
      category: expense.categoryId || null,
    };

    if ((expense.currency || 'MXN') === 'USD') {
      dispatch(addIncomeUSD(reversePayload));
    } else {
      dispatch(addIncomeMXN(reversePayload));
    }

    dispatch(deleteExpense(expenseId));
  };

/* DEBTS-2: payDebt thunk — ÚNICO punto de entrada para registrar abonos.
 * Un abono siempre descuenta de walletsSlice. Nunca usar dispatch(recordPayment(...))
 * directamente desde un componente.
 */
export interface PayDebtPayload {
  debtId: string;
  amount: number;
  currency: 'MXN' | 'USD';
  note?: string;
  date?: string;
  categoryId?: string | null;
}

export const payDebt = (payload: PayDebtPayload) => (dispatch: any, getState: any) => {
  const state = getState();
  const debt = state.debts?.debts?.find((d: any) => d.id === payload.debtId);
  if (!debt) return;

  const date = payload.date || new Date().toISOString();
  const walletId = `wallet-debt-${payload.debtId}-${Date.now()}`;

  // 1. Descontar de la billetera correcta
  const walletPayload = {
    id: walletId,
    amount: payload.amount,
    description: `Abono: ${debt.name}`,
    category: payload.categoryId || 'debt-payment',
    date,
  };
  if (payload.currency === 'USD') {
    dispatch(addExpenseUSD(walletPayload));
  } else {
    dispatch(addExpenseMXN(walletPayload));
  }

  // 2. Registrar siempre en budgetSlice con categoría fija del sistema
  const debtCategoryId = 'system-debts-category';
  const debtCategoryExists = state.budget?.categories?.some((c: any) => c.id === debtCategoryId);

  if (!debtCategoryExists) {
    dispatch(
      addCategory({
        id: debtCategoryId,
        name: 'Deudas',
        limit: 0,
        currency: 'MXN',
      })
    );
  }

  dispatch(
    addExpense({
      id: `debt-pay-${Date.now()}`,
      amount: payload.amount,
      currency: payload.currency || 'MXN',
      categoryId: debtCategoryId,
      note: `Abono: ${debt.name}`,
      date,
      type: 'debt_payment',
    })
  );

  // 3. Registrar el abono en debtsSlice
  dispatch(
    recordPayment({
      debtId: payload.debtId,
      amount: payload.amount,
      currency: payload.currency,
      date,
      note: payload.note || '',
      walletTransactionId: walletId,
    })
  );

  // 4. Actualizar evento en calendario con el próximo vencimiento
  const updatedDebt = getState().debts?.debts?.find((d: any) => d.id === payload.debtId);
  if (updatedDebt?.nextDueDate) {
    dispatch(
      addEvent({
        id: `cal-debt-${payload.debtId}`,
        title: `💳 ${debt.name} — $${updatedDebt.paymentAmount} ${debt.currency}`,
        startDate: updatedDebt.nextDueDate,
        endDate: updatedDebt.nextDueDate,
        relatedId: payload.debtId,
        relatedType: 'debt',
        color: '#1ec9ff',
      })
    );
  }
};

/* BUG-2: Consistent delete of debt payment across debts + wallet.
 * Reverts funds to wallet before removing debt payment entry.
 */
export const deleteDebtPaymentConsistent =
  (debtId: string, paymentId: string) =>
  async (dispatch: any, getState: any) => {
    const state = getState();
    const debt = state.debts?.debts?.find((d: any) => d.id === debtId);
    const payment = debt?.payments?.find((p: any) => p.id === paymentId);

    if (payment) {
      const reversalPayload = {
        amount: Number(payment.amount || 0),
        description: `Reversión abono: ${debt?.name || 'Deuda'}`,
        date: new Date().toISOString(),
        id: `rev-pay-${paymentId}`,
        category: 'debt-payment-reversal',
      };

      if ((payment.currency || 'MXN') === 'USD') {
        dispatch(addIncomeUSD(reversalPayload));
      } else {
        dispatch(addIncomeMXN(reversalPayload));
      }
    }

    dispatch(deletePayment({ debtId, paymentId }));
  };
