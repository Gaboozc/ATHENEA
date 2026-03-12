import type { Middleware } from '@reduxjs/toolkit';
import { recordGoalDeposit } from '../../../store/slices/goalsSlice';

const ADD_EXPENSE = 'budget/addExpense';
const ALERT_THRESHOLD = 0.1; // 10% remaining → fire VitalsAgent signal

const getMonthKey = () => new Date().toISOString().slice(0, 7);

/**
 * budgetGuardMiddleware
 *
 * Intercepts every `budget/addExpense` action. After the expense is committed
 * to state it performs two cross-actions:
 *
 *  1. BUDGET ALERT  — if a category drops below 10% of its limit, dispatches
 *     an `actionHistory/record` (hub: FinanceHub, actionType: budget-alert,
 *     agent: Jarvis) so that VitalsAgent / Dashboard can surface the warning.
 *
 *  2. GOAL SYNC — if the expense's category name matches a saved goal's
 *     `category` field, auto-deposits the expense amount into that goal via
 *     `goals/recordGoalDeposit`, keeping the progress bar up to date.
 */
export const budgetGuardMiddleware: Middleware = (storeApi) => (next) => (action: any) => {
  const result = next(action);

  if (action?.type !== ADD_EXPENSE) return result;

  const state = storeApi.getState();
  const categories: any[] = Array.isArray(state?.budget?.categories)
    ? state.budget.categories
    : [];
  const expenses: any[] = Array.isArray(state?.budget?.expenses)
    ? state.budget.expenses
    : [];
  const goals: any[] = Array.isArray(state?.goals?.goals) ? state.goals.goals : [];
  const monthKey = getMonthKey();

  // 1 ─ Budget threshold check
  categories.forEach((category) => {
    const limit = Number(category?.limit || 0);
    if (limit <= 0) return;

    const spent = expenses
      .filter((e) => e.categoryId === category.id)
      .filter((e) => String(e.date || '').slice(0, 7) === monthKey)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);

    const remaining = limit - spent;
    const remainingPct = remaining / limit;

    if (remainingPct <= ALERT_THRESHOLD && remaining >= 0) {
      storeApi.dispatch({
        type: 'actionHistory/record',
        payload: {
          hub: 'FinanceHub',
          actionType: 'budget-alert',
          type: 'proactive-insight',
          agent: 'Jarvis',
          description: `⚠️ ${category.name}: queda ${remaining.toFixed(2)} (${Math.round(remainingPct * 100)}% del límite)`,
          success: true,
          payload: {
            categoryId: category.id,
            categoryName: category.name,
            remaining,
            limit,
            spent,
            remainingPct: Math.round(remainingPct * 100)
          }
        }
      });
    }
  });

  // 2 ─ Goal deposit sync
  const expensePayload = action?.payload || {};
  const expenseCategoryId: string | null = expensePayload?.categoryId ?? null;
  const expenseAmount = Number(expensePayload?.amount || 0);

  if (expenseCategoryId && expenseAmount > 0) {
    const matchedCategory = categories.find((c) => c.id === expenseCategoryId);
    if (matchedCategory) {
      const catNameLower = String(matchedCategory.name || '').toLowerCase();
      goals
        .filter((g) => String(g.category || '').toLowerCase() === catNameLower)
        .forEach((goal) => {
          storeApi.dispatch(recordGoalDeposit({ id: goal.id, amount: expenseAmount }));
        });
    }
  }

  return result;
};

export default budgetGuardMiddleware;
