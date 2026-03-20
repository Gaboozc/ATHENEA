/* WALLETS-9 + BUDGET-DUAL-5: Updated for dual-currency wallet + budget system */
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

export const selectFinancialSnapshot = (state) => {
  const payments = Array.isArray(state?.payments?.payments) ? state.payments.payments : [];
  const categories = Array.isArray(state?.budget?.categories) ? state.budget.categories : [];
  const expenses = Array.isArray(state?.budget?.expenses) ? state.budget.expenses : [];
  const goals = Array.isArray(state?.goals?.goals) ? state.goals.goals : [];

  /* WALLETS-9: wallet balances */
  const walletUSD = toNumber(state?.wallets?.walletUSD);
  const walletMXN = toNumber(state?.wallets?.walletMXN);
  const referenceRate = toNumber(state?.wallets?.referenceRate);

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
  const saldoLibreMXN = walletMXN - commitedGoalSavings;
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
    budgetSummaryUSD,
    budgetSummaryMXN,
    baseCurrency: 'MXN',
  };
};

export const selectSaldoLibre = (state) => selectFinancialSnapshot(state).saldoLibre;
export const selectFinancialHealthScore = (state) => selectFinancialSnapshot(state).healthScore;
