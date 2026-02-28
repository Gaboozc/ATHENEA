import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  categories: [],
  expenses: [],
};

const budgetSlice = createSlice({
  name: 'budget',
  initialState,
  reducers: {
    addCategory: (state, action) => {
      const { name, limit } = action.payload;
      const newCategory = {
        id: `cat-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: name || 'General',
        limit: Number(limit || 0),
        createdAt: new Date().toISOString(),
      };
      state.categories.push(newCategory);
    },
    addExpense: (state, action) => {
      const { amount, categoryId, date, note } = action.payload;
      const newExpense = {
        id: `exp-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        amount: Number(amount || 0),
        categoryId,
        date: date || new Date().toISOString(),
        note: note || '',
        createdAt: new Date().toISOString(),
      };
      state.expenses.unshift(newExpense);
    },
    deleteExpense: (state, action) => {
      state.expenses = state.expenses.filter((item) => item.id !== action.payload);
    },
  },
});

export const { addCategory, addExpense, deleteExpense } = budgetSlice.actions;
export default budgetSlice.reducer;
