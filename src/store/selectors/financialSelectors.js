/* WALLETS-9 + BUDGET-DUAL-5: Updated for dual-currency wallet + budget system */
import { createSelector } from '@reduxjs/toolkit';

const MS_IN_DAY = 86400000;

const toNumber = (value) => Number(value || 0);

const normalizeStatus = (payment) => {
  if (payment?.status === 'paid' || payment?.status === 'pending') {
    return payment.status;
  }
  if (typeof payment?.paid === 'boolean') {
    return payment.paid ? 'paid' : 'pending';
  }
  return 'pending';
};

const normalizeDate = (value) => {
  const date = new Date(value || '');
  if (Number.isNaN(date.getTime())) return null;
  date.setHours(0, 0, 0, 0);
  return date;
};

export const selectFinancialSnapshot = createSelector(
  [
    (state) => state?.payments,
    (state) => state?.budget,
    (state) => state?.wallets,
    (state) => state?.debts,
    (state) => state?.goals,
  ],
  (payments_slice, budget_slice, wallets_slice, debts_slice, goals_slice) => {
  const payments = Array.isArray(payments_slice?.payments) ? payments_slice.payments : [];
  const categories = Array.isArray(budget_slice?.categories) ? budget_slice.categories : [];
  const expenses = Array.isArray(budget_slice?.expenses) ? budget_slice.expenses : [];
  const goals = Array.isArray(goals_slice?.goals) ? goals_slice.goals : [];

  /* WALLETS-9: wallet balances */
  const walletUSD = toNumber(wallets_slice?.walletUSD);
  const walletMXN = toNumber(wallets_slice?.walletMXN);
  const referenceRate = toNumber(wallets_slice?.referenceRate);
  /* SAVINGS-4: savings balances — intentionally NOT included in saldoLibre */
  const savingsUSD = toNumber(wallets_slice?.savingsUSD);
  const savingsMXN = toNumber(wallets_slice?.savingsMXN);
  const totalSavingsMXN = savingsMXN + (referenceRate > 0 ? savingsUSD * referenceRate : 0);

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const currentMonthKey = now.toISOString().slice(0, 7);

  const ingresos = payments
    .filter((payment) => (payment?.type || '').toLowerCase() === 'income')
    .filter((payment) => normalizeStatus(payment) === 'paid')
    .filter((payment) => {
      const dateStr = String(payment?.date || payment?.nextDueDate || payment?.createdAt || '');
      return dateStr.slice(0, 7) === currentMonthKey;
    })
    .reduce((sum, payment) => sum + toNumber(payment?.amount), 0);

  const fixedRecurring = payments
    .filter((payment) => (payment?.type || '').toLowerCase() !== 'income')
    .filter((payment) => (payment?.frequency || 'once') !== 'once')
    .filter((payment) => normalizeStatus(payment) !== 'paid')
    .reduce((sum, payment) => sum + toNumber(payment?.amount), 0);

  const gastosVariables = expenses
    .filter((expense) => String(expense?.date || '').slice(0, 7) === currentMonthKey)
    .reduce((sum, expense) => sum + toNumber(expense?.amount), 0);

  const compromisosProximos = payments
    .filter((payment) => (payment?.type || '').toLowerCase() !== 'income')
    .filter((payment) => normalizeStatus(payment) !== 'paid')
    .filter((payment) => {
      const due = normalizeDate(payment?.nextDueDate);
      if (!due) return false;
      const diffDays = (due.getTime() - now.getTime()) / MS_IN_DAY;
      return diffDays >= 0 && diffDays <= 30;
    })
    .reduce((sum, payment) => sum + toNumber(payment?.amount), 0);

  const categoryBudget = categories.reduce((sum, category) => sum + toNumber(category?.limit), 0);
  const gastosFijos = fixedRecurring;
  const commitedGoalSavings = goals.reduce(
    (sum, goal) => sum + toNumber(goal?.monthlyContribution),
    0
  );
  const saldoLibre =
    ingresos - (gastosFijos + gastosVariables) - compromisosProximos - commitedGoalSavings;
  const committed = gastosFijos + gastosVariables + compromisosProximos + commitedGoalSavings;

  /* BUDGET-DUAL-5: per-currency budget summaries */
  const getSpentInCategory = (catId, currency) =>
    expenses
      .filter(
        (e) =>
          e.categoryId === catId &&
          (e.currency || 'MXN') === currency &&
          (e.date || '').slice(0, 7) === currentMonthKey
      )
      .reduce((sum, e) => sum + toNumber(e.amount), 0);

  const catUSD = categories.filter((c) => (c.currency || 'MXN') === 'USD');
  const totalSpentUSD = catUSD.reduce((s, c) => s + getSpentInCategory(c.id, 'USD'), 0);
  const totalLimitUSD = catUSD.reduce((s, c) => s + toNumber(c.limit), 0);
  const budgetSummaryUSD = {
    totalLimit: totalLimitUSD,
    totalSpent: totalSpentUSD,
    available: totalLimitUSD - totalSpentUSD,
    healthPct:
      totalLimitUSD > 0
        ? Math.round(((totalLimitUSD - totalSpentUSD) / totalLimitUSD) * 100)
        : 100,
  };

  const catMXN = categories.filter((c) => (c.currency || 'MXN') === 'MXN');
  const totalSpentMXN = catMXN.reduce((s, c) => s + getSpentInCategory(c.id, 'MXN'), 0);
  const totalLimitMXN = catMXN.reduce((s, c) => s + toNumber(c.limit), 0);
  const budgetSummaryMXN = {
    totalLimit: totalLimitMXN,
    totalSpent: totalSpentMXN,
    available: totalLimitMXN - totalSpentMXN,
    healthPct:
      totalLimitMXN > 0
        ? Math.round(((totalLimitMXN - totalSpentMXN) / totalLimitMXN) * 100)
        : 100,
  };

  const baseline = Math.max(Math.abs(ingresos), Math.abs(categoryBudget), 1);
  const normalized = ((saldoLibre + baseline) / (2 * baseline)) * 100;
  const healthScore = Math.max(0, Math.min(100, Math.round(normalized)));

  /* WALLETS-9: saldoLibre in each currency */
  /* DEBTS-5: include upcoming debt payments in saldo libre calculation */
  const debts = Array.isArray(debts_slice?.debts) ? debts_slice.debts : [];
  const activeDebts = debts.filter((d) => d.status !== 'completed');
  const totalDebtMXN = activeDebts
    .filter((d) => (d.currency || 'MXN') === 'MXN')
    .reduce((s, d) => s + toNumber(d.balance), 0);
  const totalDebtUSD = activeDebts
    .filter((d) => d.currency === 'USD')
    .reduce((s, d) => s + toNumber(d.balance), 0);
  const in30Days = new Date();
  in30Days.setDate(in30Days.getDate() + 30);
  const isUpcoming = (d) =>
    d.nextDueDate && new Date(d.nextDueDate) <= in30Days && d.status === 'active';
  const upcomingDebtPaymentsMXN = activeDebts
    .filter((d) => (d.currency || 'MXN') === 'MXN' && isUpcoming(d))
    .reduce((s, d) => s + toNumber(d.paymentAmount), 0);
  const upcomingDebtPaymentsUSD = activeDebts
    .filter((d) => d.currency === 'USD' && isUpcoming(d))
    .reduce((s, d) => s + toNumber(d.paymentAmount), 0);
  /* Convert USD payments to MXN for the free-balance calculation */
  const upcomingDebtPaymentsInMXN =
    upcomingDebtPaymentsMXN + upcomingDebtPaymentsUSD * (referenceRate || 0);
  /* Keep legacy name for backward compat (consumers that read upcomingDebtPayments) */
  const upcomingDebtPayments = upcomingDebtPaymentsInMXN;

  const saldoLibreMXN = walletMXN - commitedGoalSavings - upcomingDebtPaymentsInMXN; /* DEBTS-5 */
  const saldoLibreUSD = walletUSD;

  return {
    ingresos,
    gastosFijos,
    gastosVariables,
    compromisosProximos,
    saldoLibre,          // legacy — payment-based MXN free balance
    saldoLibreMXN,       // wallet-based MXN free balance
    saldoLibreUSD,       // wallet-based USD free balance
    healthScore,
    categoryBudget,
    committed,
    commitedGoalSavings,
    walletUSD,
    walletMXN,
    referenceRate,
    savingsUSD,              /* SAVINGS-4 */
    savingsMXN,              /* SAVINGS-4 */
    totalSavingsMXN,         /* SAVINGS-4 */
    budgetSummaryUSD,
    budgetSummaryMXN,
    baseCurrency: 'MXN',
    totalDebtMXN,       /* DEBTS-5 */
    totalDebtUSD,       /* DEBTS-5 */
    activeDebtsCount: activeDebts.length,       /* DEBTS-5 */
    upcomingDebtPayments,                       /* DEBTS-5 — MXN-converted total (backward compat) */
    upcomingDebtPaymentsMXN,                    /* DEBTS-5 */
    upcomingDebtPaymentsUSD,                    /* DEBTS-5 */
  };
  }
); /* createSelector — OBJETIVO-2 */

export const selectSaldoLibre = createSelector(
  [selectFinancialSnapshot],
  (snapshot) => snapshot.saldoLibre
);
export const selectFinancialHealthScore = createSelector(
  [selectFinancialSnapshot],
  (snapshot) => snapshot.healthScore
);
