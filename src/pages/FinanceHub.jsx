import { useMemo, useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useGlobalReducer } from '../hooks/useGlobalReducer'; /* F-FEAT-6 */
import { addCategory, deleteExpense, deleteCategory, updateCategory } from '../../store/slices/budgetSlice'; /* F-FEAT-1 */
import { registerExpense } from '../store/thunks/financeThunks';
import { selectFinancialSnapshot, selectFinancialHealthScore } from '../store/selectors/financialSelectors'; /* F-FEAT-3 */
import { Skeleton } from '../components/Skeleton/Skeleton';
import { SpendingCharts } from '../components/SpendingCharts/SpendingCharts';
import EmptyState from '../components/EmptyState/EmptyState';
import './FinanceHub.css';

export const FinanceHub = () => {
  const { store, dispatch } = useGlobalReducer(); /* F-FEAT-6 */
  const navigate = useNavigate();
  const { t } = useLanguage();
  /* F-FEAT-6: read from store instead of useSelector */
  const payments = store?.payments?.payments || [];
  const budgetCategories = store?.budget?.categories || [];
  const expenses = store?.budget?.expenses || [];
  /* WALLETS-5: wallet balances */
  const walletUSD = store?.wallets?.walletUSD || 0;
  const walletMXN = store?.wallets?.walletMXN || 0;
  const referenceRate = store?.wallets?.referenceRate || 0;
  const financialSnapshot = useMemo(() => selectFinancialSnapshot(store), [store]); /* F-FEAT-6 */
  const healthScore = useMemo(() => selectFinancialHealthScore(store), [store]); /* F-FEAT-3 */
  /* F-FEAT-7: Jarvis last verdict */
  const lastVerdict = useSelector((state) => state.aiMemory?.lastVerdict);
  const isJarvisVerdict = lastVerdict?.agent === 'auditor' || lastVerdict?.agent === 'Jarvis';
  const isJarvisRecent = lastVerdict?.timestamp && (Date.now() - lastVerdict.timestamp) < 30 * 60 * 1000;
  const [isReady, setIsReady] = useState(false);
  useEffect(() => { setIsReady(true); }, []);
  const [categoryName, setCategoryName] = useState('');
  const [categoryLimit, setCategoryLimit] = useState('');
  /* F-FEAT-1: inline limit editing */
  const [editingLimitId, setEditingLimitId] = useState(null);
  const [editingLimitValue, setEditingLimitValue] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));
  const [expenseCurrency, setExpenseCurrency] = useState('MXN');
  const [categoryFormCurrency, setCategoryFormCurrency] = useState('MXN');

  const upcomingPayments = useMemo(() => {
    return [...(payments || [])]
      .filter((payment) => (payment?.status || 'pending') !== 'paid')
      .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))
      .slice(0, 5);
  }, [payments]);

  const nextSevenTotal = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return (payments || []).reduce((sum, payment) => {
      if (!payment.nextDueDate) return sum;
      const due = new Date(payment.nextDueDate);
      if (Number.isNaN(due.getTime())) return sum;
      due.setHours(0, 0, 0, 0);
      const diff = (due - today) / 86400000;
      if (diff <= 7) return sum + Number(payment.amount || 0);
      return sum;
    }, 0);
  }, [payments]);

  const monthlyTotal = useMemo(() => {
    return (payments || [])
      .filter((payment) => payment.frequency === 'monthly' && (payment?.status || 'pending') !== 'paid')
      .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  }, [payments]);

  const monthOptions = useMemo(() => {
    const keys = new Set([selectedMonth]);
    (expenses || []).forEach((expense) => {
      const key = (expense.date || '').slice(0, 7);
      if (key) keys.add(key);
    });
    (payments || []).forEach((payment) => {
      const key = (payment.nextDueDate || '').slice(0, 7);
      if (key) keys.add(key);
    });
    return Array.from(keys).sort().reverse();
  }, [expenses, payments, selectedMonth]);

  const monthHistory = useMemo(() => {
    const totals = {};
    expenses.forEach((expense) => {
      const key = (expense.date || '').slice(0, 7);
      if (!key) return;
      totals[key] = (totals[key] || 0) + Number(expense.amount || 0);
    });
    return Object.entries(totals)
      .sort((a, b) => b[0].localeCompare(a[0]))
      .map(([key, total]) => ({ key, total }));
  }, [expenses]);

  const monthKey = selectedMonth;

  const monthlyExpenses = useMemo(() => {
    return expenses.filter((expense) => (expense.date || '').slice(0, 7) === monthKey);
  }, [expenses, monthKey]);

  const totalSpent = useMemo(() => {
    return monthlyExpenses.reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
  }, [monthlyExpenses]);

  const totalBudget = useMemo(() => {
    return budgetCategories.reduce((sum, category) => sum + Number(category.limit || 0), 0);
  }, [budgetCategories]);

  /* F-FEAT-3: health score label and color */
  const healthLabel = healthScore >= 70 ? t('Healthy') : healthScore >= 40 ? t('Attention') : t('Critical');
  const healthColor = healthScore >= 70 ? 'var(--color-success)' : healthScore >= 40 ? 'var(--color-warning)' : 'var(--color-error)';

  const handleAddCategory = (event) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    dispatch(addCategory({ name: categoryName.trim(), limit: Number(categoryLimit || 0), currency: categoryFormCurrency }));
    setCategoryName('');
    setCategoryLimit('');
  };

  /* WALLETS-5: use registerExpense thunk to sync wallet + budget */
  const handleAddExpense = (event) => {
    event.preventDefault();
    if (!expenseAmount) return;
    dispatch(registerExpense({
      id: `exp-${Date.now()}`,
      amount: Number(expenseAmount),
      currency: expenseCurrency,
      categoryId: expenseCategory || null,
      description: expenseNote || 'Gasto',
      date: new Date().toISOString(),
    }));
    setExpenseAmount('');
    setExpenseCategory('');
    setExpenseNote('');
  };

  /* F-FEAT-1: inline limit commit */
  const commitLimitEdit = (catId) => {
    const val = parseFloat(editingLimitValue);
    if (!isNaN(val) && val >= 0) dispatch(updateCategory({ id: catId, limit: val }));
    setEditingLimitId(null);
    setEditingLimitValue('');
  };

  return (
    <div className="financehub-container">
      <header className="financehub-header">
        <div>
          <h1>{t('Finance Hub')}</h1>
          <p>{t('Keep your finances clear and predictable.')}</p>
        </div>
      </header>

      {/* WALLETS-5: Wallet KPI row */}
      <section className="financehub-wallets-row">
        <div className="wallet-kpi wallet-kpi-usd">
          <span>💵 {t('Saldo USD')}</span>
          <strong>${Number(walletUSD).toLocaleString('en-US', { minimumFractionDigits: 2 })} USD</strong>
        </div>
        <div className="wallet-kpi wallet-kpi-mxn">
          <span>💴 {t('Saldo MXN')}</span>
          <strong>${Number(walletMXN).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
        </div>
        {referenceRate > 0 && (
          <div className="wallet-kpi wallet-kpi-equiv">
            <span>≈ {t('Equivalente total')}</span>
            <strong>${(walletMXN + walletUSD * referenceRate).toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN</strong>
            <small>{t('Tasa ref')}: ${referenceRate.toFixed(2)}</small>
          </div>
        )}
        <button className="wallet-kpi-link" onClick={() => navigate('/finance/wallets')}>
          {t('Ver billeteras')} →
        </button>
      </section>

      <section className="financehub-actions">
        <button onClick={() => navigate('/payments')}>{t('Go to Payments')}</button>
        <button onClick={() => navigate('/finance/history')}>{t('Historial')}</button>
        <button onClick={() => navigate('/finance/goals')}>{t('Metas')}</button>
        <button onClick={() => navigate('/finance/budgeting')}>{t('Budgeting')}</button>
        <button onClick={() => navigate('/calendar')}>{t('Go to Calendar')}</button>
      </section>

      <section className="financehub-stats">
        <div className="financehub-stat financehub-stat-saldo">
          <span>{t('Free Balance')}</span>
          {isReady ? <strong>{Number(financialSnapshot.saldoLibre || 0).toFixed(2)}</strong> : <Skeleton type="stat" />}
        </div>
        <div className="financehub-stat">
          <span>{t('Next 7 days')}</span>
          {isReady ? <strong>{nextSevenTotal.toFixed(2)}</strong> : <Skeleton type="stat" />}
        </div>
        <div className="financehub-stat">
          <span>{t('Monthly Total')}</span>
          {isReady ? <strong>{monthlyTotal.toFixed(2)}</strong> : <Skeleton type="stat" />}
        </div>
        <div className="financehub-stat">
          <span>{t('Recurring Payments')}</span>
          {isReady ? <strong>{payments.length}</strong> : <Skeleton type="stat" />}
        </div>
        {/* F-FEAT-3: health score card */}
        <div className="financehub-stat">
          <span>{t('Financial Health')}</span>
          {isReady
            ? <strong style={{ color: healthColor }}>{healthLabel} ({healthScore})</strong>
            : <Skeleton type="stat" />}
        </div>
      </section>

      <section className="financehub-budget">
        <div className="financehub-budget-header">
          <div>
            <h2>{t('Monthly Budget')}</h2>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="financehub-month"
            >
              {monthOptions.map((month) => (
                <option key={month} value={month}>
                  {new Date(`${month}-01`).toLocaleString(undefined, { month: 'long', year: 'numeric' })}
                </option>
              ))}
            </select>
          </div>
          <span>{t('Spent')}: {totalSpent.toFixed(2)} / {totalBudget.toFixed(2)}</span>
        </div>

        <div className="financehub-budget-grid">
          <div className="financehub-card">
            <h3>{t('Add Category')}</h3>
            <form className="financehub-form" onSubmit={handleAddCategory}>
              <input
                type="text"
                value={categoryName}
                onChange={(e) => setCategoryName(e.target.value)}
                placeholder={t('Category name')}
              />
              <input
                type="number"
                min="0"
                step="0.01"
                value={categoryLimit}
                onChange={(e) => setCategoryLimit(e.target.value)}
                placeholder={t('Monthly limit')}
              />
              <select
                value={categoryFormCurrency}
                onChange={(e) => setCategoryFormCurrency(e.target.value)}
              >
                <option value="MXN">💴 MXN</option>
                <option value="USD">💵 USD</option>
              </select>
              <button type="submit">{t('Add')}</button>
            </form>
          </div>

          <div className="financehub-card">
            <h3>{t('Add Expense')}</h3>
            <form className="financehub-form" onSubmit={handleAddExpense}>
              <input
                type="number"
                min="0"
                step="0.01"
                value={expenseAmount}
                onChange={(e) => setExpenseAmount(e.target.value)}
                placeholder={t('Amount')}
              />
              <select
                value={expenseCurrency}
                onChange={(e) => { setExpenseCurrency(e.target.value); setExpenseCategory(''); }}
              >
                <option value="MXN">💴 MXN</option>
                <option value="USD">💵 USD</option>
              </select>
              <select
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
              >
                <option value="">{t('Select category')}</option>
                {budgetCategories.filter(c => (c.currency || 'MXN') === expenseCurrency).map((category) => (
                  <option key={category.id} value={category.id}>
                    {category.name}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={expenseNote}
                onChange={(e) => setExpenseNote(e.target.value)}
                placeholder={t('Optional details')}
              />
              <button type="submit">{t('Add')}</button>
            </form>
          </div>
        </div>

        <div className="financehub-card">
          <h3>{t('Categories')}</h3>
          {budgetCategories.length === 0 ? (
            <EmptyState icon="🏷️" message={t('No categories yet.')} ctaLabel={`+ ${t('Add Category')}`} onCta={() => {}} />
          ) : (
            <ul>
              {/* F-FEAT-1: delete + inline limit edit */}
              {budgetCategories.map((category) => {
                const spent = monthlyExpenses
                  .filter((expense) => expense.categoryId === category.id && (expense.currency || 'MXN') === (category.currency || 'MXN'))
                  .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
                const percent = category.limit ? Math.min(100, Math.round((spent / category.limit) * 100)) : 0;
                const isEditing = editingLimitId === category.id;
                return (
                  <li key={category.id}>
                    <span>{category.name} <small style={{opacity:0.6, fontSize:'0.72rem'}}>({category.currency || 'MXN'})</small></span>
                    {isEditing ? (
                      <input
                        type="number"
                        min="0"
                        step="0.01"
                        className="financehub-limit-input"
                        value={editingLimitValue}
                        autoFocus
                        onChange={(e) => setEditingLimitValue(e.target.value)}
                        onBlur={() => commitLimitEdit(category.id)}
                        onKeyDown={(e) => { if (e.key === 'Enter') commitLimitEdit(category.id); if (e.key === 'Escape') { setEditingLimitId(null); setEditingLimitValue(''); } }}
                      />
                    ) : (
                      <span
                        className="financehub-date financehub-limit-clickable"
                        title={t('Click to edit limit')}
                        onClick={() => { setEditingLimitId(category.id); setEditingLimitValue(String(category.limit || 0)); }}
                      >
                        {spent.toFixed(2)} / {Number(category.limit || 0).toFixed(2)}
                      </span>
                    )}
                    <div className="financehub-progress">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                    <button
                      type="button"
                      className="financehub-delete-cat"
                      onClick={() => {
                        if (window.confirm(t('Delete category and orphan its expenses?'))) {
                          dispatch(deleteCategory(category.id));
                        }
                      }}
                    >
                      {t('Delete')}
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="financehub-card">
          <h3>{t('Monthly History')}</h3>
          {monthHistory.length === 0 ? (
            <EmptyState icon="💸" message={t('No expenses yet.')} ctaLabel={`+ ${t('Add Expense')}`} onCta={() => navigate('/finance/budgeting')} />
          ) : (
            <ul>
              {monthHistory.slice(0, 6).map((month) => (
                <li key={month.key}>
                  <span>{new Date(`${month.key}-01`).toLocaleString(undefined, { month: 'long', year: 'numeric' })}</span>
                  <span className="financehub-date">{Number(month.total).toFixed(2)}</span>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="financehub-card">
          <h3>{t('Recent Expenses')}</h3>
          {monthlyExpenses.length === 0 ? (
            <EmptyState icon="💸" message={t('No expenses yet.')} ctaLabel={`+ ${t('Add Expense')}`} onCta={() => navigate('/finance/budgeting')} />
          ) : (
            <ul>
              {monthlyExpenses.slice(0, 6).map((expense) => (
                <li key={expense.id}>
                  <span>{expense.note || t('Expense')}</span>
                  <span className="financehub-date">{Number(expense.amount).toFixed(2)}</span>
                  <button
                    type="button"
                    className="financehub-delete"
                    onClick={() => dispatch(deleteExpense(expense.id))}
                  >
                    {t('Delete')}
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>

      <section className="financehub-list">
        <h2>{t('Upcoming Payments')}</h2>
        {upcomingPayments.length === 0 ? (
          <EmptyState icon="💳" message={t('No payments yet.')} ctaLabel={`+ ${t('Add Payment')}`} onCta={() => navigate('/payments')} />
        ) : (
          <ul>
            {upcomingPayments.map((payment) => (
              <li key={payment.id}>
                <span>{payment.name}</span>
                <span className="financehub-date">
                  {new Date(payment.nextDueDate).toLocaleDateString()}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      {/* F-FEAT-7: Jarvis verdict panel */}
      {isJarvisVerdict && isJarvisRecent && (
        <section className="jarvis-briefing">
          <h3>{t('Jarvis — Latest analysis')}</h3>
          {lastVerdict.reasoning && <p className="jarvis-reasoning">{lastVerdict.reasoning}</p>}
          {lastVerdict.recommendation && <p className="jarvis-recommendation">{lastVerdict.recommendation}</p>}
        </section>
      )}

      {/* NEW-FINANCE-1: Spending Charts — pass selectedMonth so chart reflects user selection */}
      <SpendingCharts selectedMonth={selectedMonth} />
    </div>
  );
};
