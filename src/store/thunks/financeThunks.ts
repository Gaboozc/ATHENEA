/* WALLETS-8: registerExpense thunk — ÚNICO punto de entrada para gastos.
 * Garantiza que walletsSlice y budgetSlice siempre estén sincronizados.
 * NUNCA usar dispatch(addExpense(...)) directamente desde componentes.
 */
import { addExpenseUSD, addExpenseMXN } from '../../../store/slices/walletsSlice';
import { addExpense } from '../../../store/slices/budgetSlice';
import { recordPayment } from '../../../store/slices/debtsSlice'; /* DEBTS-2 */
import { addEvent } from '../../../store/slices/calendarSlice'; /* DEBTS-2 */

export interface RegisterExpensePayload {
  id: string;
  amount: number;
  currency: 'MXN' | 'USD';
  categoryId: string | null;
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

  // 2. Registrar en budgetSlice si existe categoría de deudas
  const debtCategory = state.budget?.categories?.find(
    (c: any) =>
      c.name.toLowerCase().includes('deuda') ||
      c.name.toLowerCase().includes('debt')
  );
  if (debtCategory) {
    dispatch(
      addExpense({
        id: `budget-debt-${Date.now()}`,
        amount: payload.amount,
        currency: payload.currency,
        categoryId: debtCategory.id,
        note: `Abono: ${debt.name}`,
        date,
      })
    );
  }

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
