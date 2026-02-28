import { createSlice } from '@reduxjs/toolkit';

const addMonths = (date, count) => {
  const next = new Date(date);
  const day = next.getDate();
  next.setMonth(next.getMonth() + count);
  if (next.getDate() < day) {
    next.setDate(0);
  }
  return next;
};

const addYears = (date, count) => {
  const next = new Date(date);
  next.setFullYear(next.getFullYear() + count);
  return next;
};

const addWeeks = (date, count) => {
  const next = new Date(date);
  next.setDate(next.getDate() + count * 7);
  return next;
};

const advanceByFrequency = (dateIso, frequency) => {
  const base = new Date(dateIso);
  if (frequency === 'weekly') return addWeeks(base, 1).toISOString();
  if (frequency === 'yearly') return addYears(base, 1).toISOString();
  return addMonths(base, 1).toISOString();
};

const initialState = {
  payments: [],
};

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    addPayment: (state, action) => {
      const { id, name, amount, currency, frequency, nextDueDate, notes } = action.payload;
      const newPayment = {
        id: id || `payment-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name: name || 'Untitled Payment',
        amount: amount || 0,
        currency: currency || 'USD',
        frequency: frequency || 'monthly',
        nextDueDate: nextDueDate || new Date().toISOString(),
        notes: notes || '',
        lastPaidAt: null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      state.payments.unshift(newPayment);
    },
    updatePayment: (state, action) => {
      const { id, ...updates } = action.payload;
      const payment = state.payments.find((item) => item.id === id);
      if (payment) {
        Object.assign(payment, updates);
        payment.updatedAt = new Date().toISOString();
      }
    },
    deletePayment: (state, action) => {
      state.payments = state.payments.filter((item) => item.id !== action.payload);
    },
    markPaymentPaid: (state, action) => {
      const { id } = action.payload;
      const payment = state.payments.find((item) => item.id === id);
      if (payment) {
        payment.lastPaidAt = new Date().toISOString();
        payment.nextDueDate = advanceByFrequency(payment.nextDueDate, payment.frequency);
        payment.updatedAt = new Date().toISOString();
      }
    },
  },
});

export const {
  addPayment,
  updatePayment,
  deletePayment,
  markPaymentPaid,
} = paymentsSlice.actions;

export default paymentsSlice.reducer;
