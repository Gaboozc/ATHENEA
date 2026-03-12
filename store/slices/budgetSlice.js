import { createSlice } from '@reduxjs/toolkit';

const budgetSlice = createSlice({
  name: 'budget',
  initialState: {
    categories: [],
    expenses: [],
    balance: 0
  },
  reducers: {
    addCategory: (state, action) => {
      state.categories.push({
        id: action.payload?.id || `cat-${Date.now()}`,
        name: action.payload?.name || 'General',
        limit: Number(action.payload?.limit || 0)
      });
    },
    addExpense: (state, action) => {
      state.expenses.unshift({
        id: action.payload?.id || `exp-${Date.now()}`,
        amount: Number(action.payload?.amount || 0),
        categoryId: action.payload?.categoryId || null,
        note: action.payload?.note || '',
        date: action.payload?.date || new Date().toISOString()
      });
      state.balance -= Number(action.payload?.amount || 0);
    },
    addIncome: (state, action) => {
      state.balance += Number(action.payload?.amount || 0);
    },
    updateExpense: (state, action) => {
      const payload = action.payload || {};
      const expense = state.expenses.find((entry) => entry.id === payload.id);
      if (!expense) return;
      expense.amount = Number(payload.amount ?? expense.amount ?? 0);
      expense.categoryId = payload.categoryId ?? expense.categoryId ?? null;
      expense.note = payload.note ?? expense.note ?? '';
      expense.date = payload.date || expense.date || new Date().toISOString();
    },
    deleteExpense: (state, action) => {
      state.expenses = state.expenses.filter((entry) => entry.id !== action.payload);
    }
  }
});

export const { addCategory, addExpense, addIncome, updateExpense, deleteExpense } = budgetSlice.actions;
export default budgetSlice.reducer;
