import { useMemo, useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { addCategory, addExpense, deleteExpense } from '../../store/slices/budgetSlice';
import { selectFinancialSnapshot } from '../store/selectors/financialSelectors';
import { Skeleton } from '../components/Skeleton/Skeleton';
import './FinanceHub.css';

export const FinanceHub = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { payments } = useSelector((state) => state.payments);
  const { categories: budgetCategories, expenses } = useSelector((state) => state.budget);
  const financialSnapshot = useSelector(selectFinancialSnapshot);
  const [isReady, setIsReady] = useState(false);
  useEffect(() => { setIsReady(true); }, []);
  const [categoryName, setCategoryName] = useState('');
  const [categoryLimit, setCategoryLimit] = useState('');
  const [expenseAmount, setExpenseAmount] = useState('');
  const [expenseCategory, setExpenseCategory] = useState('');
  const [expenseNote, setExpenseNote] = useState('');
  const [selectedMonth, setSelectedMonth] = useState(new Date().toISOString().slice(0, 7));

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

  const handleAddCategory = (event) => {
    event.preventDefault();
    if (!categoryName.trim()) return;
    dispatch(addCategory({ name: categoryName.trim(), limit: Number(categoryLimit || 0) }));
    setCategoryName('');
    setCategoryLimit('');
  };

  const handleAddExpense = (event) => {
    event.preventDefault();
    if (!expenseAmount || !expenseCategory) return;
    dispatch(addExpense({
      amount: Number(expenseAmount),
      categoryId: expenseCategory,
      date: new Date().toISOString(),
      note: expenseNote,
    }));
    setExpenseAmount('');
    setExpenseCategory('');
    setExpenseNote('');
  };

  return (
    <div className="financehub-container">
      <header className="financehub-header">
        <div>
          <h1>{t('Finance Hub')}</h1>
          <p>{t('Keep your finances clear and predictable.')}</p>
        </div>
      </header>

      <section className="financehub-actions">
        <button onClick={() => navigate('/payments')}>{t('Go to Payments')}</button>
        <button onClick={() => navigate('/finance/history')}>{t('Historial')}</button>
        <button onClick={() => navigate('/finance/goals')}>{t('Metas')}</button>
        <button onClick={() => navigate('/finance/budgeting')}>{t('Budgeting')}</button>
        <button onClick={() => navigate('/calendar')}>{t('Go to Calendar')}</button>
      </section>

      <section className="financehub-stats">
        <div className="financehub-stat financehub-stat-saldo">
          <span>{t('Saldo Libre')}</span>
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
                value={expenseCategory}
                onChange={(e) => setExpenseCategory(e.target.value)}
              >
                <option value="">{t('Select category')}</option>
                {budgetCategories.map((category) => (
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
            <div className="financehub-empty">{t('No categories yet.')}</div>
          ) : (
            <ul>
              {budgetCategories.map((category) => {
                const spent = monthlyExpenses
                  .filter((expense) => expense.categoryId === category.id)
                  .reduce((sum, expense) => sum + Number(expense.amount || 0), 0);
                const percent = category.limit ? Math.min(100, Math.round((spent / category.limit) * 100)) : 0;
                return (
                  <li key={category.id}>
                    <span>{category.name}</span>
                    <span className="financehub-date">{spent.toFixed(2)} / {Number(category.limit || 0).toFixed(2)}</span>
                    <div className="financehub-progress">
                      <span style={{ width: `${percent}%` }} />
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </div>

        <div className="financehub-card">
          <h3>{t('Monthly History')}</h3>
          {monthHistory.length === 0 ? (
            <div className="financehub-empty">{t('No expenses yet.')}</div>
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
            <div className="financehub-empty">{t('No expenses yet.')}</div>
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
          <div className="financehub-empty">{t('No payments yet.')}</div>
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
    </div>
  );
};
