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
    deleteExpense: (state, action) => {
      state.expenses = state.expenses.filter((entry) => entry.id !== action.payload);
    }
  }
});

export const { addCategory, addExpense, deleteExpense } = budgetSlice.actions;
export default budgetSlice.reducer;
