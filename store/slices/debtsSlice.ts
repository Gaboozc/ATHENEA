/* DEBTS-1: Debt tracking slice — tracks debts, payments, balances */
import { createSlice } from '@reduxjs/toolkit';

export interface DebtPayment {
  id: string;
  amount: number;
  currency: 'MXN' | 'USD';
  date: string;
  note: string;
  walletTransactionId: string | null;
}

export interface Debt {
  id: string;
  name: string;
  creditor: string;
  creditorType: 'bank' | 'person' | 'family' | 'friend' | 'collection' | 'other';
  totalAmount: number;
  currency: 'MXN' | 'USD';
  amountPaid: number;
  balance: number;
  frequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' | 'bimonthly' | 'quarterly' | 'annual' | 'irregular';
  paymentAmount: number;
  nextDueDate: string | null;
  status: 'not_started' | 'active' | 'paused' | 'completed';
  startDate: string | null;
  notStartedReason: string;
  estimatedStartDate: string | null;
  payments: DebtPayment[];
  notes: string;
  createdAt: string;
  updatedAt: string;
  calendarEventId: string | null;
}

export interface DebtsState {
  debts: Debt[];
}

/* DEBTS-1: calculate next due date based on frequency */
const calculateNextDueDate = (fromDate: string, frequency: string): string | null => {
  const date = new Date(fromDate);
  switch (frequency) {
    case 'daily':     date.setDate(date.getDate() + 1); break;
    case 'weekly':    date.setDate(date.getDate() + 7); break;
    case 'biweekly':  date.setDate(date.getDate() + 14); break;
    case 'monthly':   date.setMonth(date.getMonth() + 1); break;
    case 'bimonthly': date.setMonth(date.getMonth() + 2); break;
    case 'quarterly': date.setMonth(date.getMonth() + 3); break;
    case 'annual':    date.setFullYear(date.getFullYear() + 1); break;
    case 'irregular': return null;
    default: return null;
  }
  return date.toISOString();
};

const initialState: DebtsState = {
  debts: []
};

const debtsSlice = createSlice({
  name: 'debts',
  initialState,
  reducers: {
    addDebt: (state, action) => {
      /* DEBTS-1 */
      state.debts.push({
        ...action.payload,
        id: action.payload.id || `debt-${Date.now()}`,
        amountPaid: 0,
        balance: action.payload.totalAmount,
        payments: [],
        status: action.payload.status || 'not_started',
        notStartedReason: action.payload.notStartedReason || '',
        estimatedStartDate: action.payload.estimatedStartDate || null,
        startDate: null,
        calendarEventId: null,
        notes: action.payload.notes || '',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    },

    recordPayment: (state, action) => {
      /* DEBTS-1: action.payload: { debtId, amount, currency, date, note, walletTransactionId } */
      const debt = state.debts.find((d) => d.id === action.payload.debtId);
      if (!debt) return;

      const requestedAmount = Number(action.payload.amount || 0);
      const pendingBalance = Number(debt.balance || 0);
      const safeAmount = Math.min(requestedAmount, pendingBalance);
      if (safeAmount <= 0) return;

      const payment: DebtPayment = {
        id: `dpay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
        amount: safeAmount,
        currency: action.payload.currency || debt.currency,
        date: action.payload.date || new Date().toISOString(),
        note: action.payload.note || '',
        walletTransactionId: action.payload.walletTransactionId || null,
      };
      debt.payments.push(payment);
      debt.amountPaid += payment.amount;
      debt.balance = Math.max(0, debt.totalAmount - debt.amountPaid);
      if (debt.balance === 0) {
        debt.status = 'completed';
      } else if (debt.status === 'not_started') {
        debt.status = 'active';
      }
      if (!debt.startDate && debt.status === 'active') {
        debt.startDate = payment.date;
      }
      debt.nextDueDate = calculateNextDueDate(payment.date, debt.frequency);
      debt.updatedAt = new Date().toISOString();
    },

    updateDebt: (state, action) => {
      /* DEBTS-1 */
      const idx = state.debts.findIndex((d) => d.id === action.payload.id);
      if (idx === -1) return;
      state.debts[idx] = {
        ...state.debts[idx],
        ...action.payload,
        updatedAt: new Date().toISOString(),
      };
      state.debts[idx].balance = Math.max(
        0,
        state.debts[idx].totalAmount - state.debts[idx].amountPaid
      );
    },

    deleteDebt: (state, action) => {
      /* DEBTS-1 */
      state.debts = state.debts.filter((d) => d.id !== action.payload);
    },

    deletePayment: (state, action) => {
      /* DEBTS-1: action.payload: { debtId, paymentId } */
      const debt = state.debts.find((d) => d.id === action.payload.debtId);
      if (!debt) return;
      const payment = debt.payments.find((p) => p.id === action.payload.paymentId);
      if (!payment) return;
      debt.payments = debt.payments.filter((p) => p.id !== action.payload.paymentId);
      debt.amountPaid -= payment.amount;
      debt.balance = Math.max(0, debt.totalAmount - debt.amountPaid);
      if (debt.balance > 0 && debt.status === 'completed') {
        debt.status = 'active';
      }
      /* DEBTS-BUG24: recalculate nextDueDate from remaining payments */
      if (debt.payments.length === 0) {
        // No payments left — derive first due date from startDate, or clear
        if (debt.startDate && debt.frequency !== 'irregular') {
          debt.nextDueDate = calculateNextDueDate(debt.startDate, debt.frequency);
        } else {
          debt.nextDueDate = null;
        }
      } else {
        // Recalculate from the most recent remaining payment
        const lastPayment = debt.payments
          .slice()
          .sort(
            (a: DebtPayment, b: DebtPayment) =>
              new Date(b.date).getTime() - new Date(a.date).getTime()
          )[0];
        if (lastPayment && debt.frequency !== 'irregular') {
          debt.nextDueDate = calculateNextDueDate(lastPayment.date, debt.frequency);
        } else if (debt.frequency === 'irregular') {
          debt.nextDueDate = null;
        }
      }
      /* DEBTS-BUG24 */
      debt.updatedAt = new Date().toISOString();
    },

    setCalendarEventId: (state, action) => {
      /* DEBTS-1: action.payload: { debtId, calendarEventId } */
      const debt = state.debts.find((d) => d.id === action.payload.debtId);
      if (debt) debt.calendarEventId = action.payload.calendarEventId;
    },
  },
});

export const {
  addDebt,
  recordPayment,
  updateDebt,
  deleteDebt,
  deletePayment,
  setCalendarEventId,
} = debtsSlice.actions;

export default debtsSlice.reducer;
