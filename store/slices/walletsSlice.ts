/* WALLETS-1: Dual-currency wallet slice — USD and MXN independent balances */
import { createSlice } from '@reduxjs/toolkit';

export interface WalletTransaction {
  id: string;
  type: 'income_usd' | 'income_mxn' | 'expense_usd' | 'expense_mxn' | 'conversion';
  amountUSD: number | null;
  amountMXN: number | null;
  rate: number | null; // only on conversions
  description: string;
  category: string | null;
  date: string;
  createdAt: string;
}

export interface SavingsTransaction {
  id: string;
  type: 'deposit' | 'withdrawal'; // deposit = mover a ahorros, withdrawal = retirar
  currency: 'MXN' | 'USD';
  amount: number;
  description: string;
  date: string;
  createdAt: string;
}

export interface WalletsState {
  walletUSD: number;
  walletMXN: number;
  savingsUSD: number;             /* SAVINGS-1 */
  savingsMXN: number;             /* SAVINGS-1 */
  transactions: WalletTransaction[];
  savingsTransactions: SavingsTransaction[]; /* SAVINGS-1 */
  referenceRate: number;          // last used rate (informational)
  lastConversionDate: string | null;
}

const initialState: WalletsState = {
  walletUSD: 0,
  walletMXN: 0,
  savingsUSD: 0,              /* SAVINGS-1 */
  savingsMXN: 0,              /* SAVINGS-1 */
  transactions: [],
  savingsTransactions: [],    /* SAVINGS-1 */
  referenceRate: 0,
  lastConversionDate: null,
};

const walletsSlice = createSlice({
  name: 'wallets',
  initialState,
  reducers: {
    /* WALLETS-2: Income USD — adds to walletUSD */
    addIncomeUSD: (state, action) => {
      const { id, amount, description, category, date } = action.payload;
      state.walletUSD += Number(amount);
      state.transactions.unshift({
        id,
        type: 'income_usd',
        amountUSD: Number(amount),
        amountMXN: null,
        rate: null,
        description: description || 'Ingreso USD',
        category: category || null,
        date,
        createdAt: new Date().toISOString(),
      });
    },

    /* WALLETS-3: Income MXN — adds to walletMXN */
    addIncomeMXN: (state, action) => {
      const { id, amount, description, category, date } = action.payload;
      state.walletMXN += Number(amount);
      state.transactions.unshift({
        id,
        type: 'income_mxn',
        amountUSD: null,
        amountMXN: Number(amount),
        rate: null,
        description: description || 'Ingreso MXN',
        category: category || null,
        date,
        createdAt: new Date().toISOString(),
      });
    },

    /* WALLETS-4: Expense USD — deducts from walletUSD (floor at 0) */
    addExpenseUSD: (state, action) => {
      const { id, amount, description, category, date } = action.payload;
      state.walletUSD = Math.max(0, state.walletUSD - Number(amount));
      state.transactions.unshift({
        id,
        type: 'expense_usd',
        amountUSD: Number(amount),
        amountMXN: null,
        rate: null,
        description: description || 'Gasto USD',
        category: category || null,
        date,
        createdAt: new Date().toISOString(),
      });
    },

    /* WALLETS-5: Expense MXN — deducts from walletMXN (floor at 0) */
    addExpenseMXN: (state, action) => {
      const { id, amount, description, category, date } = action.payload;
      state.walletMXN = Math.max(0, state.walletMXN - Number(amount));
      state.transactions.unshift({
        id,
        type: 'expense_mxn',
        amountUSD: null,
        amountMXN: Number(amount),
        rate: null,
        description: description || 'Gasto MXN',
        category: category || null,
        date,
        createdAt: new Date().toISOString(),
      });
    },

    /* WALLETS-6: Conversion USD→MXN — user enters both amounts, rate is calculated */
    recordConversion: (state, action) => {
      const { id, amountUSD, amountMXN, description, date } = action.payload;
      const usd = Number(amountUSD);
      const mxn = Number(amountMXN);
      const rate = usd > 0 ? mxn / usd : 0;
      state.walletUSD = Math.max(0, state.walletUSD - usd);
      state.walletMXN += mxn;
      state.referenceRate = rate;
      state.lastConversionDate = date;
      state.transactions.unshift({
        id,
        type: 'conversion',
        amountUSD: usd,
        amountMXN: mxn,
        rate,
        description: description || `Conversión a tasa $${rate.toFixed(2)} MXN/USD`,
        category: 'conversion',
        date,
        createdAt: new Date().toISOString(),
      });
    },

    /* SAVINGS-1: Transfer available → savings */
    transferToSavings: (state, action) => {
      const { id, amount, currency, description, date } = action.payload;
      const amt = Number(amount);
      if (currency === 'USD') {
        state.walletUSD = Math.max(0, state.walletUSD - amt);
        state.savingsUSD += amt;
      } else {
        state.walletMXN = Math.max(0, state.walletMXN - amt);
        state.savingsMXN += amt;
      }
      state.savingsTransactions.unshift({
        id: id || `sav-dep-${Date.now()}`,
        type: 'deposit',
        currency: currency || 'MXN',
        amount: amt,
        description: description || 'Transferencia a ahorros',
        date: date || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    },

    /* SAVINGS-1: Withdraw savings → available */
    withdrawFromSavings: (state, action) => {
      const { id, amount, currency, description, date } = action.payload;
      const amt = Number(amount);
      if (currency === 'USD') {
        state.savingsUSD = Math.max(0, state.savingsUSD - amt);
        state.walletUSD += amt;
      } else {
        state.savingsMXN = Math.max(0, state.savingsMXN - amt);
        state.walletMXN += amt;
      }
      state.savingsTransactions.unshift({
        id: id || `sav-wit-${Date.now()}`,
        type: 'withdrawal',
        currency: currency || 'MXN',
        amount: amt,
        description: description || 'Retiro de ahorros',
        date: date || new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
    },

    /* SAVINGS-DEL: Delete savings transaction — always reverts balances */
    deleteSavingsTransaction: (state, action) => {
      const tx = state.savingsTransactions.find((t) => t.id === action.payload);
      if (!tx) return;
      const amt = Number(tx.amount);
      if (tx.type === 'deposit') {
        // Revertir depósito: devolver a disponible, quitar de ahorros
        if (tx.currency === 'USD') {
          state.savingsUSD = Math.max(0, state.savingsUSD - amt);
          state.walletUSD += amt;
        } else {
          state.savingsMXN = Math.max(0, state.savingsMXN - amt);
          state.walletMXN += amt;
        }
      } else {
        // Revertir retiro: devolver a ahorros, quitar de disponible
        if (tx.currency === 'USD') {
          state.walletUSD = Math.max(0, state.walletUSD - amt);
          state.savingsUSD += amt;
        } else {
          state.walletMXN = Math.max(0, state.walletMXN - amt);
          state.savingsMXN += amt;
        }
      }
      state.savingsTransactions = state.savingsTransactions.filter(
        (t) => t.id !== action.payload
      );
    },

    /* WALLETS-7: Delete transaction — always reverts the balance impact */
    deleteTransaction: (state, action) => {
      const tx = state.transactions.find((t) => t.id === action.payload);
      if (!tx) return;
      switch (tx.type) {
        case 'income_usd':
          state.walletUSD -= tx.amountUSD!;
          break;
        case 'income_mxn':
          state.walletMXN -= tx.amountMXN!;
          break;
        case 'expense_usd':
          state.walletUSD += tx.amountUSD!;
          break;
        case 'expense_mxn':
          state.walletMXN += tx.amountMXN!;
          break;
        case 'conversion':
          state.walletUSD += tx.amountUSD!;
          state.walletMXN -= tx.amountMXN!;
          break;
      }
      state.walletUSD = Math.max(0, state.walletUSD);
      state.walletMXN = Math.max(0, state.walletMXN);
      state.transactions = state.transactions.filter((t) => t.id !== action.payload);
    },
  },
});

export const {
  addIncomeUSD,
  addIncomeMXN,
  addExpenseUSD,
  addExpenseMXN,
  recordConversion,
  deleteTransaction,
  transferToSavings,      /* SAVINGS-1 */
  withdrawFromSavings,    /* SAVINGS-1 */
  deleteSavingsTransaction, /* SAVINGS-DEL */
} = walletsSlice.actions;

export default walletsSlice.reducer;
