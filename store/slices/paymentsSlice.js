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

const paymentsSlice = createSlice({
  name: 'payments',
  initialState: {
    payments: []
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
        status: payload.status || 'pending',
        lastPaidAt: payload.lastPaidAt || null,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });
    },
    deletePayment: (state, action) => {
      state.payments = state.payments.filter((payment) => payment.id !== action.payload);
    },
    markPaymentPaid: (state, action) => {
      const { id } = action.payload || {};
      const payment = state.payments.find((entry) => entry.id === id);
      if (!payment) return;
      payment.lastPaidAt = new Date().toISOString();
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
      })
      .addCase('payments/markPaymentPaid', (state, action) => {
        const { id, paidAt } = action.payload || {};
        const payment = state.payments.find((entry) => entry.id === id);
        if (!payment) return;
        payment.lastPaidAt = paidAt || new Date().toISOString();
        payment.status = 'paid';
        payment.nextDueDate = advanceByFrequency(payment.nextDueDate, payment.frequency);
        payment.updatedAt = new Date().toISOString();
      });
  }
});

export const { addPayment, deletePayment, markPaymentPaid } = paymentsSlice.actions;
export default paymentsSlice.reducer;
