import { createSlice } from '@reduxjs/toolkit';

const advanceByFrequency = (dateIso, frequency) => {
  const base = new Date(dateIso || new Date().toISOString());
  if (frequency === 'weekly') {
    base.setDate(base.getDate() + 7);
  } else if (frequency === 'yearly') {
    base.setFullYear(base.getFullYear() + 1);
  } else {
    const day = base.getDate();
    base.setMonth(base.getMonth() + 1);
    if (base.getDate() < day) {
      base.setDate(0);
    }
  }
  return base.toISOString();
};

const normalizeStatus = (payload = {}) => {
  if (payload.status === 'paid' || payload.status === 'pending') {
    return payload.status;
  }
  if (typeof payload.paid === 'boolean') {
    return payload.paid ? 'paid' : 'pending';
  }
  return 'pending';
};

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    payments: [],
    budgets: [] // DEPRECATED — zombie field, use store/slices/budgetSlice categories instead. F-FEAT-5
  },
  reducers: {
    addPayment: (state, action) => {
      const payload = action.payload || {};
      state.payments.unshift({
        id: payload.id || `payment-${Date.now()}`,
        name: payload.name || 'Untitled Payment',
        amount: Number(payload.amount || 0),
        currency: payload.currency || 'USD',
        frequency: payload.frequency || 'monthly',
        nextDueDate: payload.nextDueDate || new Date().toISOString(),
        notes: payload.notes || '',
        status: normalizeStatus(payload),
        lastPaidAt: payload.lastPaidAt || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    },
    deletePayment: (state, action) => {
      state.payments = state.payments.filter((payment) => payment.id !== action.payload);
    },
    updatePayment: (state, action) => {
      const payload = action.payload || {};
      const payment = state.payments.find((entry) => entry.id === payload.id);
      if (!payment) return;

      if (payload.name !== undefined) payment.name = payload.name;
      if (payload.amount !== undefined) payment.amount = Number(payload.amount || 0);
      if (payload.currency !== undefined) payment.currency = payload.currency || payment.currency;
      if (payload.frequency !== undefined) payment.frequency = payload.frequency || payment.frequency;
      if (payload.notes !== undefined) payment.notes = payload.notes || '';
      if (payload.status !== undefined) payment.status = payload.status;
      if (payload.type !== undefined) payment.type = payload.type;
      if (payload.category !== undefined) payment.category = payload.category || 'other';
      if (payload.source !== undefined) payment.source = payload.source || 'other';

      if (payload.date !== undefined) {
        const normalizedDate = payload.date || new Date().toISOString();
        payment.nextDueDate = normalizedDate;
        payment.lastPaidAt = normalizedDate;
      }

      payment.updatedAt = new Date().toISOString();
    },
    markPaymentPaid: (state, action) => {
      const { id } = action.payload || {};
      const payment = state.payments.find((entry) => entry.id === id);
      if (!payment) return;
      payment.lastPaidAt = new Date().toISOString();
      payment.status = 'paid';
      payment.nextDueDate = advanceByFrequency(payment.nextDueDate, payment.frequency);
      payment.updatedAt = new Date().toISOString();
    },
    recordExpense: (state, action) => {
      const payload = action.payload || {};
      state.payments.unshift({
        id: payload.id || `payment-${Date.now()}`,
        name: payload.description || payload.name || 'Expense',
        amount: Number(payload.amount || 0),
        currency: payload.currency || 'USD',
        frequency: payload.frequency || 'once',
        nextDueDate: payload.date || new Date().toISOString(),
        notes: payload.notes || '',
        status: payload.status === 'pending' ? 'pending' : 'paid',
        type: 'expense',
        category: payload.category || 'other',
        lastPaidAt: payload.date || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    },
    recordIncome: (state, action) => {
      const payload = action.payload || {};
      state.payments.unshift({
        id: payload.id || `payment-${Date.now()}`,
        name: payload.description || payload.source || 'Income',
        amount: Number(payload.amount || 0),
        currency: payload.currency || 'USD',
        frequency: payload.frequency || 'once',
        nextDueDate: payload.date || new Date().toISOString(),
        notes: payload.notes || '',
        status: payload.status === 'pending' ? 'pending' : 'paid',
        type: 'income',
        source: payload.source || 'other',
        lastPaidAt: payload.date || new Date().toISOString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    },
    setBudget: (state, action) => {
      const payload = action.payload || {};
      const category = payload.category || 'other';
      const existing = state.budgets.find((entry) => entry.category === category);
      const budget = {
        id: existing?.id || `budget-${category}`,
        category,
        amount: Number(payload.amount || 0),
        period: payload.period || 'monthly',
        updatedAt: new Date().toISOString(),
        createdAt: existing?.createdAt || new Date().toISOString()
      };

      if (!existing) {
        state.budgets.unshift(budget);
      } else {
        Object.assign(existing, budget);
      }
    },
    markAsPaid: (state, action) => {
      const { paymentId, id, paidAt } = action.payload || {};
      const targetId = paymentId || id;
      const payment = state.payments.find((entry) => entry.id === targetId);
      if (!payment) return;
      payment.lastPaidAt = paidAt || new Date().toISOString();
      payment.status = 'paid';
      payment.nextDueDate = advanceByFrequency(payment.nextDueDate, payment.frequency);
      payment.updatedAt = new Date().toISOString();
    }
  },
  extraReducers: (builder) => {
    builder
      .addCase('payments/markPaid', (state, action) => {
        const { id, paidAt } = action.payload || {};
        const payment = state.payments.find((entry) => entry.id === id);
        if (!payment) return;
        payment.lastPaidAt = paidAt || new Date().toISOString();
        payment.status = 'paid';
        payment.nextDueDate = advanceByFrequency(payment.nextDueDate, payment.frequency);
        payment.updatedAt = new Date().toISOString();
      });
      // F-FEAT-5: removed duplicate 'payments/markPaymentPaid' case (already handled by markPaymentPaid reducer above)
  }
});

export const {
  addPayment,
  deletePayment,
  updatePayment,
  markPaymentPaid,
  recordExpense,
  recordIncome,
  setBudget,
  markAsPaid
} = paymentsSlice.actions;
export default paymentsSlice.reducer;
