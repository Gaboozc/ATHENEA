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

  const now = new Date();
  now.setHours(0, 0, 0, 0);

  const ingresos = payments
    .filter((payment) => (payment?.type || '').toLowerCase() === 'income')
    .filter((payment) => normalizeStatus(payment) === 'paid')
    .reduce((sum, payment) => sum + toNumber(payment?.amount), 0);

  const fixedRecurring = payments
    .filter((payment) => (payment?.type || '').toLowerCase() !== 'income')
    .filter((payment) => (payment?.frequency || 'once') !== 'once')
    .filter((payment) => normalizeStatus(payment) !== 'paid')
    .reduce((sum, payment) => sum + toNumber(payment?.amount), 0);

  const currentMonthKey = now.toISOString().slice(0, 7);
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
  // commitedGoalSavings: monthly contributions the user has committed to their goals.
  // These are subtracted from saldoLibre so the Hub shows truly available funds.
  const commitedGoalSavings = goals.reduce(
    (sum, goal) => sum + toNumber(goal?.monthlyContribution),
    0
  );
  const saldoLibre =
    ingresos - (gastosFijos + gastosVariables) - compromisosProximos - commitedGoalSavings;
  const committed = gastosFijos + gastosVariables + compromisosProximos + commitedGoalSavings;

  const baseline = Math.max(Math.abs(ingresos), Math.abs(categoryBudget), 1);
  const normalized = ((saldoLibre + baseline) / (2 * baseline)) * 100;
  const healthScore = Math.max(0, Math.min(100, Math.round(normalized)));

  return {
    ingresos,
    gastosFijos,
    gastosVariables,
    compromisosProximos,
    saldoLibre,
    healthScore,
    categoryBudget,
    committed,
    commitedGoalSavings,
  };
};

export const selectSaldoLibre = (state) => selectFinancialSnapshot(state).saldoLibre;
export const selectFinancialHealthScore = (state) => selectFinancialSnapshot(state).healthScore;
