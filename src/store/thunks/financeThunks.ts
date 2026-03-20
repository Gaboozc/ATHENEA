/* WALLETS-8: registerExpense thunk — ÚNICO punto de entrada para gastos.
 * Garantiza que walletsSlice y budgetSlice siempre estén sincronizados.
 * NUNCA usar dispatch(addExpense(...)) directamente desde componentes.
 */
import { addExpenseUSD, addExpenseMXN } from '../../../store/slices/walletsSlice';
import { addExpense } from '../../../store/slices/budgetSlice';

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
