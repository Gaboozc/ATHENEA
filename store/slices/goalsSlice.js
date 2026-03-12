import { createSlice } from '@reduxjs/toolkit';

const goalsSlice = createSlice({
  name: 'goals',
  initialState: {
    goals: []
  },
  reducers: {
    addGoal(state, action) {
      const p = action.payload || {};
      state.goals.push({
        id: p.id || `goal-${Date.now()}`,
        name: p.name || 'Meta',
        targetAmount: Number(p.targetAmount || 0),
        savedToDate: Number(p.savedToDate || 0),
        monthlyContribution: Number(p.monthlyContribution || 0),
        // category links this goal to a budget category name (e.g. 'Ahorro')
        // when an expense with that category is added, progress updates automatically
        category: p.category || '',
        targetDate: p.targetDate || null,
        createdAt: p.createdAt || new Date().toISOString()
      });
    },
    deleteGoal(state, action) {
      state.goals = state.goals.filter((g) => g.id !== action.payload);
    },
    setMonthlyContribution(state, action) {
      const { id, amount } = action.payload || {};
      const goal = state.goals.find((g) => g.id === id);
      if (goal) goal.monthlyContribution = Number(amount || 0);
    },
    // Called automatically by budgetGuardMiddleware when a budget/addExpense
    // is dispatched for a category that matches this goal's category name
    recordGoalDeposit(state, action) {
      const { id, amount } = action.payload || {};
      const goal = state.goals.find((g) => g.id === id);
      if (goal) {
        goal.savedToDate = Math.min(
          goal.targetAmount,
          goal.savedToDate + Number(amount || 0)
        );
      }
    }
  }
});

export const { addGoal, deleteGoal, setMonthlyContribution, recordGoalDeposit } =
  goalsSlice.actions;
export default goalsSlice.reducer;
