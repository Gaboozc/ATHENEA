/* BUDGET-DUAL-1: Extended with currency field for dual USD/MXN budget support */
import { createSlice } from '@reduxjs/toolkit';

const budgetSlice = createSlice({
  name: 'budget',
  initialState: {
    categories: [],
    expenses: [],
    balance: 0 // DEPRECATED — zombie field. Real balance comes from selectFinancialSnapshot(). F-FEAT-5
  },
  reducers: {
    /* BUDGET-DUAL-2: addCategory now includes currency — default 'MXN' for retrocompat */
    addCategory: (state, action) => {
      state.categories.push({
        id: action.payload?.id || `cat-${Date.now()}`,
        name: action.payload?.name || 'General',
        limit: Number(action.payload?.limit || 0),
        currency: action.payload?.currency || 'MXN',  // BUDGET-DUAL: 'MXN' | 'USD'
        color: action.payload?.color || null,
      });
    },
    /* BUDGET-DUAL-3: addExpense now includes currency — default 'MXN' for retrocompat */
    addExpense: (state, action) => {
      state.expenses.unshift({
        id: action.payload?.id || `exp-${Date.now()}`,
        amount: Number(action.payload?.amount || 0),
        currency: action.payload?.currency || 'MXN',  // BUDGET-DUAL: 'MXN' | 'USD'
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
      expense.currency = payload.currency ?? expense.currency ?? 'MXN';
      expense.categoryId = payload.categoryId ?? expense.categoryId ?? null;
      expense.note = payload.note ?? expense.note ?? '';
      expense.date = payload.date || expense.date || new Date().toISOString();
    },
    deleteExpense: (state, action) => {
      state.expenses = state.expenses.filter((entry) => entry.id !== action.payload);
    },
    /* F-FEAT-1: delete and edit categories */
    deleteCategory: (state, action) => {
      state.categories = state.categories.filter((c) => c.id !== action.payload);
      // Orphan expenses: set categoryId to null so they remain visible without a category
      state.expenses = state.expenses.map((e) =>
        e.categoryId === action.payload ? { ...e, categoryId: null } : e
      );
    },
    updateCategory: (state, action) => {
      const { id, name, limit, currency, color } = action.payload || {};
      const cat = state.categories.find((c) => c.id === id);
      if (!cat) return;
      if (name !== undefined) cat.name = name;
      if (limit !== undefined) cat.limit = Number(limit);
      if (currency !== undefined) cat.currency = currency;  // BUDGET-DUAL
      if (color !== undefined) cat.color = color;
    }
  }
});

export const { addCategory, addExpense, addIncome, updateExpense, deleteExpense, deleteCategory, updateCategory } = budgetSlice.actions;
export default budgetSlice.reducer;
