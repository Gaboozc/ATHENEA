import { useMemo, useState, useEffect } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useGlobalReducer } from '../hooks/useGlobalReducer';
import { selectFinancialSnapshot } from '../store/selectors/financialSelectors';
import { setBudgetCycleDay, setNextBudgetDate, upsertMonthlyBudget } from '../../store/slices/budgetCycleSlice';
import './FinanceSections.css';
import { CashFlowProjection } from '../components/CashFlowProjection/CashFlowProjection';

// ── Guardrail helpers ────────────────────────────────────────────────────────

const getBarColor = (usage) => {
  if (usage >= 100) return 'crit';
  if (usage >= 80) return 'warn';
  return 'ok';
};

// ── Planning: budget-plan definitions ───────────────────────────────────────
const PLAN_COLORS = {
  gastosFijos: '#059669',
  recreacion:  '#3b82f6',
  ahorro:      '#eab308',
};

const getBudgetPlans = (t) => ({
  A: {
    name: t('bp.flexible'),
    description: t('bp.flexibleDesc'),
    distribution: { gastosFijos: 0, recreacion: 0, ahorro: 0 },
    flexible: true,
  },
  B: {
    name: t('bp.moderate'),
    description: t('bp.moderateDesc'),
    distribution: { gastosFijos: 60, recreacion: 25, ahorro: 15 },
  },
  C: {
    name: t('bp.saver'),
    description: t('bp.saverDesc'),
    distribution: { gastosFijos: 40, recreacion: 30, ahorro: 30 },
  },
  D: {
    name: t('bp.conservative'),
    description: t('bp.conservativeDesc'),
    distribution: { gastosFijos: 70, recreacion: 20, ahorro: 10 },
  },
  E: {
    name: t('bp.ambitious'),
    description: t('bp.ambitiousDesc'),
    distribution: { gastosFijos: 45, recreacion: 25, ahorro: 30 },
  },
  F: {
    name: t('bp.balanced'),
    description: t('bp.balancedDesc'),
    distribution: { gastosFijos: 33, recreacion: 33, ahorro: 34 },
  },
});

// ── Currency list ─────────────────────────────────────────────────────────────
const CURRENCIES = [
  { code: 'MXN', name: 'Peso mexicano' },
  { code: 'USD', name: 'Dólar estadounidense' },
  { code: 'EUR', name: 'Euro' },
  { code: 'COP', name: 'Peso colombiano' },
  { code: 'ARS', name: 'Peso argentino' },
  { code: 'BRL', name: 'Real brasileño' },
  { code: 'CLP', name: 'Peso chileno' },
  { code: 'PEN', name: 'Sol peruano' },
  { code: 'CAD', name: 'Dólar canadiense' },
  { code: 'GBP', name: 'Libra esterlina' },
];

const getPreviousMonthKey = (monthKey) => {
  const [y, m] = String(monthKey || '').split('-').map(Number);
  if (!y || !m) return '';
  const date = new Date(y, m - 1, 1);
  date.setMonth(date.getMonth() - 1);
  return date.toISOString().slice(0, 7);
};

const monthLabel = (monthKey) => {
  const [y, m] = String(monthKey || '').split('-').map(Number);
  if (!y || !m) return monthKey;
  return new Date(y, m - 1, 1).toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
};

const toYmd = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const getCycleDateForMonth = (year, monthIndex, cycleDay) => {
  const day = Math.max(1, Math.min(28, Number(cycleDay || 1)));
  return new Date(year, monthIndex, day);
};

const computeDefaultNextBudgetDate = (cycleDay) => {
  const now = new Date();
  const thisMonthDate = getCycleDateForMonth(now.getFullYear(), now.getMonth(), cycleDay);
  if (now <= thisMonthDate) {
    return toYmd(thisMonthDate);
  }
  const nextMonthDate = getCycleDateForMonth(now.getFullYear(), now.getMonth() + 1, cycleDay);
  return toYmd(nextMonthDate);
};

export const FinanceBudgeting = () => {
  const { t } = useLanguage();
  const { store, dispatch } = useGlobalReducer();
  const snapshot = useMemo(() => selectFinancialSnapshot(store), [store]);

  // ── SEGUIMIENTO ──────────────────────────────────────────────────────────
  const categories      = store?.budget?.categories || [];
  const expenses        = store?.budget?.expenses   || [];
  const currentMonthKey = new Date().toISOString().slice(0, 7);

  const budgetCycle = store?.budgetCycle || { cycleDay: 1, nextBudgetDate: null, monthlyBudgets: {} };
  const cycleDay = Number(budgetCycle.cycleDay || 1);
  const nextBudgetDate = budgetCycle.nextBudgetDate || computeDefaultNextBudgetDate(cycleDay);
  const monthlyBudgetsRaw = budgetCycle.monthlyBudgets;
  const monthlyBudgets =
    monthlyBudgetsRaw && typeof monthlyBudgetsRaw === 'object' && !Array.isArray(monthlyBudgetsRaw)
      ? monthlyBudgetsRaw
      : {};
  const monthlyBudgetEntries = useMemo(
    () =>
      Object.values(monthlyBudgets).filter(
        (item) => item && typeof item === 'object' && typeof item.monthKey === 'string' && item.monthKey
      ),
    [monthlyBudgets]
  );
  const previousMonthKey = getPreviousMonthKey(currentMonthKey);
  const currentMonthCandidate = monthlyBudgets[currentMonthKey];
  const prevMonthCandidate = monthlyBudgets[previousMonthKey];
  const currentMonthBudget =
    currentMonthCandidate && typeof currentMonthCandidate === 'object' ? currentMonthCandidate : null;
  const previousMonthBudget =
    prevMonthCandidate && typeof prevMonthCandidate === 'object' ? prevMonthCandidate : null;
  const isBudgetDue = useMemo(() => {
    const dueDate = new Date(`${nextBudgetDate}T00:00:00`);
    if (Number.isNaN(dueDate.getTime())) return false;
    const now = new Date();
    return now >= dueDate;
  }, [nextBudgetDate]);

  const rows = useMemo(() => categories.map((cat) => {
    const spent = expenses
      .filter((e) => e.categoryId === cat.id && String(e.date || '').slice(0, 7) === currentMonthKey)
      .reduce((sum, e) => sum + Number(e.amount || 0), 0);
    const limit       = Number(cat.limit || 0);
    const usage       = limit > 0 ? (spent / limit) * 100 : 0;
    const remaining   = Math.max(0, limit - spent);
    const remainingPct = limit > 0 ? (remaining / limit) * 100 : 100;
    return {
      id: cat.id, name: cat.name, spent, limit,
      usage: Math.min(usage, 100),
      overBudget: spent > limit && limit > 0,
      isAlert:    remainingPct <= 10 && limit > 0,
      colorClass: getBarColor(usage),
    };
  }), [categories, expenses, currentMonthKey]);

  const budgetAlerts = useMemo(() =>
    (store?.aiMemory?.actionHistory || [])
      .filter((e) => e.actionType === 'budget-alert' && e.hub === 'FinanceHub')
      .slice(0, 10),
    [store]);

  const atRiskCount = rows.filter((r) => r.isAlert || r.overBudget).length;

  // ── PLANEACIÓN: persisted state ───────────────────────────────────────────
  const [planStep, setPlanStep] = useState(() =>
    parseInt(localStorage.getItem('bp_step') || '1'));
  const [selectedPlan, setSelectedPlan] = useState(() =>
    localStorage.getItem('bp_plan') || 'B');
  const [incomeConfig, setIncomeConfig] = useState(() => {
    try { const r = localStorage.getItem('bp_income'); if (r) return JSON.parse(r); } catch {}
    return { amount: '', frequency: 'monthly', specificDays: '', currency: 'MXN' };
  });
  const [fixedExpenses, setFixedExpenses] = useState(() => {
    try { const r = localStorage.getItem('bp_fixed'); if (r) return JSON.parse(r); } catch {}
    return [
      { id: 1, name: 'Renta/Hipoteca',            amount: '', category: 'vivienda'     },
      { id: 2, name: 'Servicios (luz, agua, gas)', amount: '', category: 'servicios'   },
      { id: 3, name: 'Alimentación',               amount: '', category: 'alimentacion'},
      { id: 4, name: 'Transporte',                 amount: '', category: 'transporte'  },
    ];
  });
  const [flexDist, setFlexDist] = useState(() => {
    try { const r = localStorage.getItem('bp_flex'); if (r) return JSON.parse(r); } catch {}
    return { recreacionAmount: 0, ahorroAmount: 0 };
  });
  const [loadedMonth, setLoadedMonth] = useState(null);

  useEffect(() => {
    if (!budgetCycle.nextBudgetDate) {
      dispatch(setNextBudgetDate(computeDefaultNextBudgetDate(cycleDay)));
    }
  }, [budgetCycle.nextBudgetDate, cycleDay, dispatch]);

  useEffect(() => { localStorage.setItem('bp_step',   String(planStep));                     }, [planStep]);
  useEffect(() => { localStorage.setItem('bp_plan',   selectedPlan);                         }, [selectedPlan]);
  useEffect(() => { localStorage.setItem('bp_income', JSON.stringify(incomeConfig));          }, [incomeConfig]);
  useEffect(() => { localStorage.setItem('bp_fixed',  JSON.stringify(fixedExpenses));         }, [fixedExpenses]);
  useEffect(() => { localStorage.setItem('bp_flex',   JSON.stringify(flexDist));              }, [flexDist]);

  const monthlyIncome = useMemo(() => {
    const amount = parseFloat(incomeConfig.amount) || 0;
    switch (incomeConfig.frequency) {
      case 'daily':  return amount * 30;
      case 'weekly': return amount * 4;
      case 'yearly': return amount / 12;
      case 'specific-days': {
        const days = incomeConfig.specificDays.split(',').map(d => parseInt(d.trim())).filter(d => !isNaN(d));
        return amount * days.length;
      }
      default: return amount;
    }
  }, [incomeConfig]);

  const carryOverPreview = Number(previousMonthBudget?.balanceAfterAllocation || 0);
  const effectiveMonthlyIncome = monthlyIncome + carryOverPreview;

  const totalFixed = useMemo(() =>
    fixedExpenses.reduce((s, e) => s + (parseFloat(e.amount) || 0), 0),
    [fixedExpenses]);

  const availableAfterFixed = effectiveMonthlyIncome - totalFixed;

  useEffect(() => {
    if (selectedPlan !== 'A') return;
    const remaining = Math.max(0, effectiveMonthlyIncome - totalFixed);
    const sum = flexDist.recreacionAmount + flexDist.ahorroAmount;
    if (sum > remaining && sum > 0) {
      const factor = remaining / sum;
      setFlexDist(fd => ({
        recreacionAmount: parseFloat((fd.recreacionAmount * factor).toFixed(2)),
        ahorroAmount:     parseFloat((fd.ahorroAmount     * factor).toFixed(2)),
      }));
    }
  }, [selectedPlan, totalFixed, effectiveMonthlyIncome]);

  useEffect(() => {
    if (!currentMonthBudget || loadedMonth === currentMonthKey) return;
    setSelectedPlan(currentMonthBudget.selectedPlan || 'B');
    if (currentMonthBudget.incomeConfig) setIncomeConfig(currentMonthBudget.incomeConfig);
    if (Array.isArray(currentMonthBudget.fixedExpenses) && currentMonthBudget.fixedExpenses.length > 0) {
      setFixedExpenses(currentMonthBudget.fixedExpenses);
    }
    if (currentMonthBudget.flexDist) setFlexDist(currentMonthBudget.flexDist);
    setLoadedMonth(currentMonthKey);
  }, [currentMonthBudget, currentMonthKey, loadedMonth]);

  useEffect(() => {
    if (!isBudgetDue) return;
    if (currentMonthBudget) return;

    const reminderKey = `bp_jarvis_reminder_${currentMonthKey}`;
    if (localStorage.getItem(reminderKey) === '1') return;

    dispatch({
      type: 'actionHistory/record',
      payload: {
        hub: 'FinanceHub',
        actionType: 'jarvis-monthly-budget-reminder',
        type: 'proactive-insight',
        agent: 'Jarvis',
        description: `🧭 Jarvis: falta registrar el presupuesto de ${currentMonthKey}. Fecha de renovación: ${nextBudgetDate}.`,
        success: true,
        payload: { monthKey: currentMonthKey, cycleDay, nextBudgetDate }
      }
    });

    localStorage.setItem(reminderKey, '1');
  }, [isBudgetDue, cycleDay, nextBudgetDate, currentMonthBudget, currentMonthKey, dispatch]);

  const BUDGET_PLANS = useMemo(() => getBudgetPlans(t), [t]);

  const distribution = useMemo(() => {
    const allocationBase = Math.max(0, effectiveMonthlyIncome);
    if (selectedPlan === 'A') {
      const remaining          = Math.max(0, allocationBase - totalFixed);
      const gastosFijosPercent = allocationBase > 0 ? (totalFixed / allocationBase) * 100 : 0;
      const recreacion         = flexDist.recreacionAmount;
      const ahorro             = flexDist.ahorroAmount;
      return {
        gastosFijos: totalFixed, recreacion, ahorro,
        gastosFijosReales: totalFixed, diferenceGastosFijos: 0,
        totalDistribuido: totalFixed + recreacion + ahorro,
        gastosFijosPercent: Math.round(gastosFijosPercent), remaining,
        recreacionPercent: allocationBase ? (recreacion / allocationBase) * 100 : 0,
        ahorroPercent:     allocationBase ? (ahorro     / allocationBase) * 100 : 0,
      };
    }
    const plan    = BUDGET_PLANS[selectedPlan].distribution;
    const gfRecom = (allocationBase * plan.gastosFijos) / 100;
    const rcRecom = (allocationBase * plan.recreacion)  / 100;
    const ahRecom = (allocationBase * plan.ahorro)      / 100;
    return {
      gastosFijos: gfRecom, recreacion: rcRecom, ahorro: ahRecom,
      gastosFijosReales: totalFixed, diferenceGastosFijos: gfRecom - totalFixed,
      totalDistribuido: gfRecom + rcRecom + ahRecom,
      gastosFijosPercent: plan.gastosFijos,
      recreacionPercent:  plan.recreacion,
      ahorroPercent:      plan.ahorro,
      remaining: 0,
    };
  }, [selectedPlan, effectiveMonthlyIncome, totalFixed, flexDist, BUDGET_PLANS]);

  const fmtCurrency = (amount) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency', currency: incomeConfig.currency || 'MXN', minimumFractionDigits: 2,
    }).format(amount);

  const resetPlan = () => {
    ['bp_step','bp_plan','bp_income','bp_fixed','bp_flex'].forEach(k => localStorage.removeItem(k));
    setPlanStep(1); setSelectedPlan('B');
    setIncomeConfig({ amount: '', frequency: 'monthly', specificDays: '', currency: 'MXN' });
    setFixedExpenses([
      { id: 1, name: 'Renta/Hipoteca',            amount: '', category: 'vivienda'     },
      { id: 2, name: 'Servicios (luz, agua, gas)', amount: '', category: 'servicios'   },
      { id: 3, name: 'Alimentación',               amount: '', category: 'alimentacion'},
      { id: 4, name: 'Transporte',                 amount: '', category: 'transporte'  },
    ]);
    setFlexDist({ recreacionAmount: 0, ahorroAmount: 0 });
  };

  const applyCurrentMonthBudget = () => {
    const effectiveIncome = effectiveMonthlyIncome;
    const totalDistribuido = Number(distribution.totalDistribuido || 0);
    const balanceAfterAllocation = effectiveIncome - totalDistribuido;

    dispatch(upsertMonthlyBudget({
      monthKey: currentMonthKey,
      cycleDay,
      selectedPlan,
      baseIncome: monthlyIncome,
      carryOver: carryOverPreview,
      effectiveIncome,
      totalFixed,
      totalDistribuido,
      balanceAfterAllocation,
      distribution,
      incomeConfig,
      fixedExpenses,
      flexDist,
      appliedAt: new Date().toISOString(),
    }));

    const [year, month] = currentMonthKey.split('-').map(Number);
    const nextDate = getCycleDateForMonth(year, month, cycleDay);
    dispatch(setNextBudgetDate(toYmd(nextDate)));

    dispatch({
      type: 'actionHistory/record',
      payload: {
        hub: 'FinanceHub',
        actionType: 'jarvis-monthly-budget-applied',
        type: 'proactive-insight',
        agent: 'Jarvis',
        description: `📦 Jarvis aplicó presupuesto ${currentMonthKey}: ingreso ${monthlyIncome.toFixed(2)}, arrastre ${carryOverPreview.toFixed(2)}, saldo proyectado ${balanceAfterAllocation.toFixed(2)}.`,
        success: true,
        payload: {
          monthKey: currentMonthKey,
          selectedPlan,
          baseIncome: monthlyIncome,
          carryOver: carryOverPreview,
          effectiveIncome,
          totalDistribuido,
          balanceAfterAllocation,
          nextBudgetDate: toYmd(nextDate),
        }
      }
    });
  };

  // Jarvis automatic mode: when renewal date arrives and there is no budget for the month,
  // auto-apply using current planning parameters.
  useEffect(() => {
    if (!isBudgetDue) return;
    if (currentMonthBudget) return;
    if (monthlyIncome <= 0) return;

    const autoKey = `bp_jarvis_auto_${currentMonthKey}`;
    if (localStorage.getItem(autoKey) === '1') return;

    const effectiveIncome = effectiveMonthlyIncome;
    const totalDistribuido = Number(distribution.totalDistribuido || 0);
    const balanceAfterAllocation = effectiveIncome - totalDistribuido;

    dispatch(upsertMonthlyBudget({
      monthKey: currentMonthKey,
      cycleDay,
      selectedPlan,
      baseIncome: monthlyIncome,
      carryOver: carryOverPreview,
      effectiveIncome,
      totalFixed,
      totalDistribuido,
      balanceAfterAllocation,
      distribution,
      incomeConfig,
      fixedExpenses,
      flexDist,
      appliedAt: new Date().toISOString(),
    }));

    const [year, month] = currentMonthKey.split('-').map(Number);
    const nextDate = getCycleDateForMonth(year, month, cycleDay);
    dispatch(setNextBudgetDate(toYmd(nextDate)));

    dispatch({
      type: 'actionHistory/record',
      payload: {
        hub: 'FinanceHub',
        actionType: 'jarvis-monthly-budget-auto-applied',
        type: 'proactive-insight',
        agent: 'Jarvis',
        description: `🤖 Jarvis aplicó automáticamente el presupuesto de ${currentMonthKey}. Saldo proyectado: ${balanceAfterAllocation.toFixed(2)}.`,
        success: true,
        payload: {
          monthKey: currentMonthKey,
          selectedPlan,
          baseIncome: monthlyIncome,
          carryOver: carryOverPreview,
          effectiveIncome,
          totalDistribuido,
          balanceAfterAllocation,
        }
      }
    });

    localStorage.setItem(autoKey, '1');
  }, [
    isBudgetDue,
    currentMonthBudget,
    currentMonthKey,
    monthlyIncome,
    effectiveMonthlyIncome,
    distribution,
    cycleDay,
    selectedPlan,
    carryOverPreview,
    totalFixed,
    incomeConfig,
    fixedExpenses,
    flexDist,
    dispatch,
  ]);

  const addFixed    = () => {
    const newId = Math.max(0, ...fixedExpenses.map(e => e.id)) + 1;
    setFixedExpenses([...fixedExpenses, { id: newId, name: '', amount: '', category: 'otros' }]);
  };
  const removeFixed = (id) => setFixedExpenses(fixedExpenses.filter(e => e.id !== id));
  const updateFixed = (id, field, value) =>
    setFixedExpenses(fixedExpenses.map(e => e.id === id ? { ...e, [field]: value } : e));

  // ── RENDER ─────────────────────────────────────────────────────────────────
  return (
    <div className="finance-section-container">
      <header className="finance-section-header">
        <h1>{t('Budgeting')}</h1>
        <p>{t('bp.monthCycleTitle')}</p>
      </header>

      <div className="bp-container">

          <section className="finance-panel bp-card bp-cycle-panel">
            <h2>{t('bp.monthCycleTitle')}</h2>
            <div className="bp-cycle-grid">
              <label className="bp-label">
                {t('bp.cycleDay')}
                <input
                  className="bp-input bp-amount-input"
                  type="number"
                  min="1"
                  max="28"
                  value={cycleDay}
                  onChange={(e) => dispatch(setBudgetCycleDay(Number(e.target.value || 1)))}
                />
              </label>
              <label className="bp-label">
                {t('bp.nextBudgetDate')}
                <input
                  className="bp-input"
                  type="date"
                  value={nextBudgetDate}
                  onChange={(e) => dispatch(setNextBudgetDate(e.target.value))}
                />
              </label>
              <div className="bp-cycle-info">
                <div><strong>{t('bp.currentMonth')}</strong> {monthLabel(currentMonthKey)}</div>
                <div><strong>{t('bp.prevCarryOver')}</strong> {fmtCurrency(carryOverPreview)}</div>
                <div><strong>{t('bp.effectiveIncome')}</strong> {fmtCurrency(effectiveMonthlyIncome)}</div>
                <div><strong>{t('bp.monthStatus')}</strong> {currentMonthBudget ? t('bp.statusApplied') : t('bp.statusPending')}</div>
              </div>
            </div>

            {!currentMonthBudget && (
              <div className="bp-jarvis-note">
                {t('bp.pendingMonthSetup')}
              </div>
            )}
          </section>

          {/* Step indicator */}
          <div className="bp-steps">
            {[1, 2, 3].map((n) => (
              <div key={n} className={`bp-step${planStep >= n ? ' active' : ''}`}>
                <span>{n}</span>
                <label>
                  {n === 1 ? t('bp.stepIncome') : n === 2 ? t('bp.stepFixed') : t('bp.stepPlan')}
                </label>
              </div>
            ))}
          </div>

          {/* ── STEP 1: Income ─────────────────────────────────────────── */}
          {planStep === 1 && (
            <section className="finance-panel bp-card">
              <h2>{t('bp.incomeTitle')}</h2>
              <div className="bp-form-grid">
                <label className="bp-label">
                  {t('bp.amount')}
                  <input className="bp-input" type="number" min="0"
                    value={incomeConfig.amount}
                    onChange={(e) => setIncomeConfig({ ...incomeConfig, amount: e.target.value })}
                    placeholder="0.00"
                  />
                </label>
                <label className="bp-label">
                  {t('bp.frequency')}
                  <select className="bp-input"
                    value={incomeConfig.frequency}
                    onChange={(e) => setIncomeConfig({ ...incomeConfig, frequency: e.target.value })}
                  >
                    <option value="weekly">{t('bp.freqWeekly')}</option>
                    <option value="monthly">{t('bp.freqMonthly')}</option>
                    <option value="yearly">{t('bp.freqYearly')}</option>
                    <option value="specific-days">{t('bp.freqSpecific')}</option>
                  </select>
                </label>
                {incomeConfig.frequency === 'specific-days' && (
                  <label className="bp-label bp-span2">
                    {t('bp.specificDays')}
                    <input className="bp-input" type="text"
                      value={incomeConfig.specificDays}
                      onChange={(e) => setIncomeConfig({ ...incomeConfig, specificDays: e.target.value })}
                      placeholder={t('bp.specificDaysHint')}
                    />
                  </label>
                )}
                <label className="bp-label">
                  {t('bp.currency')}
                  <select className="bp-input"
                    value={incomeConfig.currency}
                    onChange={(e) => setIncomeConfig({ ...incomeConfig, currency: e.target.value })}
                  >
                    {CURRENCIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.code} — {c.name}</option>
                    ))}
                  </select>
                </label>
              </div>
              <div className="bp-income-summary">
                <span>{t('bp.monthlyEstimate')}</span>
                <strong>{fmtCurrency(monthlyIncome)}</strong>
              </div>
              <div className="bp-income-summary" style={{ marginTop: -6 }}>
                <span>{t('bp.effectiveIncome')}</span>
                <strong>{fmtCurrency(effectiveMonthlyIncome)}</strong>
              </div>
              <div className="bp-actions">
                <button
                  className="finance-action-btn bp-btn-primary"
                  disabled={!incomeConfig.amount || monthlyIncome <= 0}
                  onClick={() => setPlanStep(2)}
                >
                  {t('bp.continue')} →
                </button>
              </div>
            </section>
          )}

          {/* ── STEP 2: Fixed expenses ─────────────────────────────────── */}
          {planStep === 2 && (
            <section className="finance-panel bp-card">
              <h2>{t('bp.fixedTitle')}</h2>
              <div className="bp-fixed-list">
                {fixedExpenses.map((exp) => (
                  <div key={exp.id} className="bp-fixed-row">
                    <input className="bp-input" type="text" value={exp.name}
                      onChange={(e) => updateFixed(exp.id, 'name', e.target.value)}
                      placeholder={t('bp.expenseName')}
                    />
                    <input className="bp-input bp-amount-input" type="number" min="0" value={exp.amount}
                      onChange={(e) => updateFixed(exp.id, 'amount', e.target.value)}
                      placeholder="0.00"
                    />
                    <button
                      className="finance-action-btn finance-action-btn-sm finance-action-btn-danger"
                      onClick={() => removeFixed(exp.id)}
                      disabled={fixedExpenses.length <= 1}
                    >✕</button>
                  </div>
                ))}
              </div>
              <button className="finance-action-btn" style={{ marginTop: 8 }} onClick={addFixed}>
                + {t('bp.addExpense')}
              </button>
              <div className="bp-fixed-summary">
                <div>
                  <span>{t('bp.totalFixed')}</span>
                  <strong>{fmtCurrency(totalFixed)}</strong>
                </div>
                <div>
                  <span>{t('bp.available')}</span>
                  <strong style={{ color: availableAfterFixed < 0 ? '#ef4444' : '#22c55e' }}>
                    {fmtCurrency(availableAfterFixed)}
                  </strong>
                </div>
              </div>
              <div className="bp-actions">
                <button className="finance-action-btn" onClick={() => setPlanStep(1)}>← {t('bp.back')}</button>
                <button
                  className="finance-action-btn bp-btn-primary"
                  disabled={totalFixed >= Math.max(0, effectiveMonthlyIncome)}
                  onClick={() => setPlanStep(3)}
                >
                  {t('bp.continue')} →
                </button>
              </div>
            </section>
          )}

          {/* ── STEP 3: Plan selection + result ───────────────────────── */}
          {planStep === 3 && (
            <>
              <section className="finance-panel bp-card">
                <h2>{t('bp.planTitle')}</h2>
                <div className="bp-plans-grid">
                  {Object.entries(BUDGET_PLANS).map(([key, plan]) => {
                    const gfPct  = key === 'A' ? distribution.gastosFijosPercent  : plan.distribution.gastosFijos;
                    const recPct = key === 'A' ? Math.round(distribution.recreacionPercent) : plan.distribution.recreacion;
                    const ahoPct = key === 'A' ? Math.round(distribution.ahorroPercent)     : plan.distribution.ahorro;
                    return (
                      <div
                        key={key}
                        className={`bp-plan-card${selectedPlan === key ? ' selected' : ''}`}
                        onClick={() => setSelectedPlan(key)}
                      >
                        <div className="bp-plan-label">
                          <strong>{key}</strong>
                          <span>{plan.name}</span>
                        </div>
                        <p className="bp-plan-desc">{plan.description}</p>
                        <div className="bp-bars">
                          <div className="bp-bar" style={{ height: `${gfPct}%`,  background: PLAN_COLORS.gastosFijos }}>
                            <span>{gfPct}%</span>
                          </div>
                          <div className="bp-bar" style={{ height: `${recPct}%`, background: PLAN_COLORS.recreacion }}>
                            <span>{recPct}%</span>
                          </div>
                          <div className="bp-bar" style={{ height: `${ahoPct}%`, background: PLAN_COLORS.ahorro }}>
                            <span>{ahoPct}%</span>
                          </div>
                        </div>
                        <div className="bp-bar-labels">
                          <span>{t('bp.fixed')}</span>
                          <span>{t('bp.recreation')}</span>
                          <span>{t('bp.savings')}</span>
                        </div>

                        {selectedPlan === 'A' && key === 'A' && (
                          <div className="bp-flex-sliders" onClick={(e) => e.stopPropagation()}>
                            {[
                              { label: t('bp.recreation'), fk: 'recreacionAmount' },
                              { label: t('bp.savings'),    fk: 'ahorroAmount'     },
                            ].map(({ label, fk }) => (
                              <div key={fk} className="bp-slider-row">
                                <span className="bp-slider-label">{label}</span>
                                <input type="range" min="0" max={distribution.remaining}
                                  value={flexDist[fk]}
                                  onChange={(e) => setFlexDist(fd => ({ ...fd, [fk]: parseFloat(e.target.value) }))}
                                />
                                <input className="bp-input bp-amount-input" type="number" min="0" max={distribution.remaining}
                                  value={flexDist[fk]}
                                  onChange={(e) => setFlexDist(fd => ({ ...fd, [fk]: parseFloat(e.target.value) || 0 }))}
                                />
                              </div>
                            ))}
                            <div className="bp-flex-total">
                              <span>{t('bp.remaining')}: <strong>{fmtCurrency(distribution.remaining)}</strong></span>
                              <span>{t('bp.distributed')}: <strong>{fmtCurrency(flexDist.recreacionAmount + flexDist.ahorroAmount)}</strong></span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </section>

              {/* Result panel */}
              <section className="finance-panel bp-card bp-result">
                <h2>{t('bp.resultTitle')} · {t('bp.plan')} {selectedPlan}</h2>
                <div className="bp-result-kpis">
                  <div className="bp-kpi">
                    <span>{t('bp.monthlyIncome')}</span>
                    <strong>{fmtCurrency(monthlyIncome)}</strong>
                  </div>
                  <div className="bp-kpi">
                    <span>{t('bp.prevCarryOver')}</span>
                    <strong style={{ color: carryOverPreview >= 0 ? '#22c55e' : '#ef4444' }}>
                      {fmtCurrency(carryOverPreview)}
                    </strong>
                  </div>
                  <div className="bp-kpi">
                    <span>{t('bp.effectiveIncome')}</span>
                    <strong>{fmtCurrency(effectiveMonthlyIncome)}</strong>
                  </div>
                  <div className="bp-kpi">
                    <span>{t('bp.distributed')}</span>
                    <strong>{fmtCurrency(distribution.totalDistribuido)}</strong>
                  </div>
                  {Math.abs(effectiveMonthlyIncome - distribution.totalDistribuido) > 0.01 && (
                    <div className="bp-kpi bp-kpi-warn">
                      <span>{t('bp.unassigned')}</span>
                      <strong>{fmtCurrency(effectiveMonthlyIncome - distribution.totalDistribuido)}</strong>
                    </div>
                  )}
                </div>

                <div className="bp-result-cols">
                  <div className="bp-result-col bp-col-fixed">
                    <h3>{t('bp.fixed')} ({distribution.gastosFijosPercent}%)</h3>
                    <p className="bp-result-amount">{fmtCurrency(distribution.gastosFijos)}</p>
                    <p className="bp-result-real">{t('bp.realExpenses')}: <span>{fmtCurrency(distribution.gastosFijosReales)}</span></p>
                    {distribution.diferenceGastosFijos !== 0 && (
                      <p className={`bp-result-diff ${distribution.diferenceGastosFijos > 0 ? 'positive' : 'negative'}`}>
                        {distribution.diferenceGastosFijos > 0 ? t('bp.canSpend') : t('bp.exceeding')}:{' '}
                        {fmtCurrency(Math.abs(distribution.diferenceGastosFijos))}
                      </p>
                    )}
                    <ul className="bp-breakdown">
                      {fixedExpenses.filter(e => e.amount).map(e => (
                        <li key={e.id}>
                          <span>{e.name}</span>
                          <span>{fmtCurrency(parseFloat(e.amount) || 0)}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="bp-result-col bp-col-rec">
                    <h3>{t('bp.recreation')} ({Math.round(distribution.recreacionPercent)}%)</h3>
                    <p className="bp-result-amount">{fmtCurrency(distribution.recreacion)}</p>
                    <ul className="bp-breakdown">
                      <li><span>Entretenimiento</span></li>
                      <li><span>Restaurantes</span></li>
                      <li><span>Compras no esenciales</span></li>
                      <li><span>Hobbies</span></li>
                    </ul>
                  </div>

                  <div className="bp-result-col bp-col-sav">
                    <h3>{t('bp.savings')} ({Math.round(distribution.ahorroPercent)}%)</h3>
                    <p className="bp-result-amount">{fmtCurrency(distribution.ahorro)}</p>
                    <ul className="bp-breakdown">
                      <li><span>Fondo de emergencia</span></li>
                      <li><span>Inversiones</span></li>
                      <li><span>Metas financieras</span></li>
                      <li><span>Retiro</span></li>
                    </ul>
                  </div>
                </div>

                <div className="bp-actions">
                  <button className="finance-action-btn bp-btn-primary" onClick={applyCurrentMonthBudget}>
                    {currentMonthBudget ? t('bp.updateMonthBudget') : t('bp.applyMonthBudget')}
                  </button>
                  <button className="finance-action-btn" onClick={() => setPlanStep(2)}>← {t('bp.back')}</button>
                  <button className="finance-action-btn finance-action-btn-danger" onClick={resetPlan}>↺ {t('bp.reset')}</button>
                </div>
              </section>

              <section className="finance-panel bp-card" style={{ marginTop: 14 }}>
                <h2>{t('bp.monthHistory')}</h2>
                {monthlyBudgetEntries.length === 0 ? (
                  <div className="finance-empty">{t('bp.noMonthHistory')}</div>
                ) : (
                  <ul className="finance-list" style={{ gap: 8 }}>
                    {monthlyBudgetEntries
                      .sort((a, b) => String(b.monthKey).localeCompare(String(a.monthKey)))
                      .slice(0, 6)
                      .map((item) => (
                        <li key={item.monthKey}>
                          <div style={{ display: 'grid', gap: 2 }}>
                            <strong style={{ fontSize: '0.9rem' }}>{monthLabel(item.monthKey)} · {t('bp.plan')} {item.selectedPlan}</strong>
                            <span className="finance-list-meta">
                              {t('bp.effectiveIncome')}: {fmtCurrency(item.effectiveIncome)} · {t('bp.distributed')}: {fmtCurrency(item.totalDistribuido)}
                            </span>
                          </div>
                          <strong style={{ color: item.balanceAfterAllocation >= 0 ? '#86efac' : '#fca5a5' }}>
                            {fmtCurrency(item.balanceAfterAllocation)}
                          </strong>
                        </li>
                      ))}
                  </ul>
                )}
              </section>
            </>
          )}
        <CashFlowProjection />
      </div>
    </div>
  );
};

export default FinanceBudgeting;
