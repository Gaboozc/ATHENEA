import { createSlice } from '@reduxjs/toolkit';

const clampCycleDay = (value) => {
  const day = Number(value || 1);
  if (!Number.isFinite(day)) return 1;
  return Math.min(28, Math.max(1, Math.round(day)));
};

const initialState = {
  cycleDay: 1,
  nextBudgetDate: null,
  monthlyBudgets: {},
};

const budgetCycleSlice = createSlice({
  name: 'budgetCycle',
  initialState,
  reducers: {
    setBudgetCycleDay(state, action) {
      state.cycleDay = clampCycleDay(action.payload);
    },
    setNextBudgetDate(state, action) {
      const value = String(action.payload || '').trim();
      state.nextBudgetDate = value || null;
    },
    upsertMonthlyBudget(state, action) {
      const payload = action.payload || {};
      const monthKey = String(payload.monthKey || '').trim();
      if (!monthKey) return;

      const previous = state.monthlyBudgets[monthKey] || null;
      state.monthlyBudgets[monthKey] = {
        monthKey,
        cycleDay: clampCycleDay(payload.cycleDay ?? state.cycleDay),
        selectedPlan: payload.selectedPlan || previous?.selectedPlan || 'B',
        baseIncome: Number(payload.baseIncome || 0),
        carryOver: Number(payload.carryOver || 0),
        effectiveIncome: Number(payload.effectiveIncome || 0),
        totalFixed: Number(payload.totalFixed || 0),
        totalDistribuido: Number(payload.totalDistribuido || 0),
        balanceAfterAllocation: Number(payload.balanceAfterAllocation || 0),
        distribution: payload.distribution || previous?.distribution || {},
        incomeConfig: payload.incomeConfig || previous?.incomeConfig || null,
        fixedExpenses: payload.fixedExpenses || previous?.fixedExpenses || [],
        flexDist: payload.flexDist || previous?.flexDist || { recreacionAmount: 0, ahorroAmount: 0 },
        appliedAt: payload.appliedAt || previous?.appliedAt || new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
    },
    deleteMonthlyBudget(state, action) {
      const monthKey = String(action.payload || '').trim();
      if (!monthKey) return;
      delete state.monthlyBudgets[monthKey];
    },
  },
});

export const { setBudgetCycleDay, setNextBudgetDate, upsertMonthlyBudget, deleteMonthlyBudget } = budgetCycleSlice.actions;
export default budgetCycleSlice.reducer;
