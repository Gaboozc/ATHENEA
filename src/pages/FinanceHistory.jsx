import { useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useGlobalReducer } from '../hooks/useGlobalReducer';
import { selectFinancialSnapshot } from '../store/selectors/financialSelectors';
import { addExpense, updateExpense, deleteExpense } from '../../store/slices/budgetSlice';
import { recordIncome, recordExpense, updatePayment, deletePayment } from '../../store/slices/paymentsSlice';
import { updateActionHistoryEntry, deleteActionHistoryEntry } from '../store/slices/aiMemorySlice';
import './FinanceSections.css';

// Filter tab identifiers
const FILTER_ALL = 'all';
const FILTER_INCOME = 'income';
const FILTER_EXPENSE = 'expense';
const FILTER_AGENT = 'agent';
const AGENT_NAMES = ['Jarvis', 'Shodan', 'Cortana'];

const agentClass = (agent) => {
  if (!agent || agent === 'user') return 'user';
  return String(agent).toLowerCase();
};

const detectAgentFromText = (text = '') => {
  const lower = text.toLowerCase();
  if (lower.includes('jarvis')) return 'Jarvis';
  if (lower.includes('shodan')) return 'Shodan';
  if (lower.includes('cortana')) return 'Cortana';
  return null;
};

const EMPTY_FORM = {
  txType: 'expense',
  amount: '',
  description: '',
  categoryId: '',
  date: new Date().toISOString().slice(0, 10)
};

export const FinanceHistory = () => {
  const { t } = useLanguage();
  const { store, dispatch } = useGlobalReducer();

  const snapshot = useMemo(() => selectFinancialSnapshot(store), [store]);

  const [filter, setFilter] = useState(FILTER_ALL);
  const [agentFilter, setAgentFilter] = useState(null); // Jarvis | Shodan | Cortana
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_FORM);
  const [editingEntry, setEditingEntry] = useState(null);
  const [currencyFilter, setCurrencyFilter] = useState('all'); // BUDGET-DUAL-7

  const categories = store?.budget?.categories || [];

  // ── Combine all financial movements into one chronological list ──────────
  const allEntries = useMemo(() => {
    const entries = [];

    // 1) payments.payments — F-FIX-3: only show income-type payments to avoid
    //    duplicating expenses already tracked in budgetSlice
    (store?.payments?.payments || [])
      .filter((p) => (p.type || '').toLowerCase() === 'income')
      .forEach((p) => {
      const paymentCategory = p.category ? categories.find((c) => c.id === p.category) : null;
      entries.push({
        _key: `pay-${p.id}`,
        kind: (p.type || '').toLowerCase() === 'income' ? 'income' : 'expense',
        amount: Number(p.amount || 0),
        description: p.name || p.description || '—',
        date: p.lastPaidAt || p.nextDueDate || p.createdAt || '',
        source: 'user',
        sourceId: p.id,
        agent: null,
        categoryId: p.category || '',
        categoryLabel: paymentCategory ? paymentCategory.name : (p.category || null),
        status: p.status
      });
    });

    // 2) budget.expenses (categorized spending)
    (store?.budget?.expenses || []).forEach((e) => {
      const cat = categories.find((c) => c.id === e.categoryId);
      entries.push({
        _key: `exp-${e.id}`,
        kind: 'expense',
        amount: Number(e.amount || 0),
        currency: e.currency || 'MXN', /* BUDGET-DUAL-7 */
        description: e.note || (cat ? cat.name : 'Gasto'),
        date: e.date || '',
        source: 'budget',
        sourceId: e.id,
        agent: null,
        categoryId: e.categoryId || '',
        categoryLabel: cat ? cat.name : null
      });
    });

    // 3) aiMemory.actionHistory (FinanceHub entries — agent & user actions)
    (store?.aiMemory?.actionHistory || [])
      .filter((e) => e.hub === 'FinanceHub')
      .forEach((e) => {
        const detectedAgent =
          e.agent || detectAgentFromText(e.description) || detectAgentFromText(e.actionType);
        entries.push({
          _key: `hist-${e.id}`,
          kind: 'agent',
          amount: Number(e.payload?.amount || 0) || null,
          description: e.description,
          date: e.timestamp,
          source: 'agent',
          sourceId: e.id,
          agent: detectedAgent,
          actionType: e.actionType,
          success: e.success
        });
      });

    // Sort newest first
    return entries.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [store, categories]);

  // Monthly aggregates for KPI
  const monthKey = new Date().toISOString().slice(0, 7);
  const monthIncome = useMemo(
    () =>
      allEntries
        .filter((e) => e.kind === 'income' && String(e.date || '').slice(0, 7) === monthKey)
        .reduce((s, e) => s + (e.amount || 0), 0),
    [allEntries, monthKey]
  );
  const monthExpense = useMemo(
    () =>
      allEntries
        .filter((e) => e.kind === 'expense' && String(e.date || '').slice(0, 7) === monthKey)
        .reduce((s, e) => s + (e.amount || 0), 0),
    [allEntries, monthKey]
  );

  // Apply filter
  const filtered = useMemo(() => {
    let list = allEntries;
    if (filter === FILTER_INCOME) list = list.filter((e) => e.kind === 'income');
    else if (filter === FILTER_EXPENSE) list = list.filter((e) => e.kind === 'expense');
    else if (filter === FILTER_AGENT) {
      list = list.filter((e) => e.source === 'agent');
      if (agentFilter) {
        list = list.filter(
          (e) => String(e.agent || '').toLowerCase() === agentFilter.toLowerCase()
        );
      }
    }
    if (currencyFilter !== 'all') {
      list = list.filter((e) => (e.currency || 'MXN') === currencyFilter || e.kind === 'agent');
    }
    return list.slice(0, 50);
  }, [allEntries, filter, agentFilter, currencyFilter]);

  // ── Add transaction handler ───────────────────────────────────────────────
  const resetFormState = () => {
    setForm({ ...EMPTY_FORM, date: new Date().toISOString().slice(0, 10) });
    setEditingEntry(null);
    setShowForm(false);
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    const amount = parseFloat(form.amount);
    if (!editingEntry && (!amount || amount <= 0)) return;
    const now = new Date(form.date || Date.now()).toISOString();

    if (editingEntry) {
      if (editingEntry.source === 'budget') {
        dispatch(updateExpense({
          id: editingEntry.sourceId,
          amount,
          categoryId: form.categoryId || null,
          note: form.description,
          date: now
        }));
      } else if (editingEntry.source === 'user') {
        dispatch(updatePayment({
          id: editingEntry.sourceId,
          amount,
          name: form.description,
          type: form.txType,
          category: form.categoryId || 'other',
          source: form.txType === 'income' ? 'manual' : undefined,
          date: now
        }));
      } else if (editingEntry.source === 'agent') {
        dispatch(updateActionHistoryEntry({
          id: editingEntry.sourceId,
          description: form.description,
          timestamp: now,
          payload: Number.isFinite(amount) ? { amount } : undefined
        }));
      }

      dispatch({
        type: 'actionHistory/record',
        payload: {
          hub: 'FinanceHub',
          actionType: 'edit-finance-entry',
          type: 'user-command',
          agent: 'user',
          description: `✎ ${form.description || form.txType}${Number.isFinite(amount) ? ` — ${amount.toFixed(2)}` : ''}`,
          success: true,
          payload: { source: editingEntry.source, id: editingEntry.sourceId, amount }
        }
      });

      resetFormState();
      return;
    }

    if (form.txType === 'income') {
      dispatch(recordIncome({ amount, description: form.description, date: now }));
    } else {
      // F-FIX-3: Only dispatch to budgetSlice — source of truth for gastos.
      // Removed recordExpense() call that caused duplicate entries in allEntries.
      dispatch(addExpense({ amount, categoryId: form.categoryId || null, note: form.description, date: now }));
      // addExpense → budgetGuardMiddleware auto-fires threshold check + goal sync
    }

    // Create actionHistory papertrail (Source of Truth bus event)
    dispatch({
      type: 'actionHistory/record',
      payload: {
        hub: 'FinanceHub',
        actionType: form.txType === 'income' ? 'add-income' : 'add-expense',
        type: 'user-command',
        agent: 'user',
        description: `${form.txType === 'income' ? '↑' : '↓'} ${form.description || form.txType} — ${amount.toFixed(2)}`,
        success: true,
        payload: { amount, categoryId: form.categoryId || null, description: form.description }
      }
    });

    resetFormState();
  };

  const handleEditEntry = (entry) => {
    setEditingEntry(entry);
    setForm({
      txType: entry.kind === 'income' ? 'income' : 'expense',
      amount: String(entry.amount || ''),
      description: entry.description || '',
      categoryId: entry.categoryId || '',
      date: entry.date ? new Date(entry.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10)
    });
    setShowForm(true);
  };

  const handleDeleteEntry = (entry) => {
    if (!window.confirm(t('Delete this event?'))) return;

    if (entry.source === 'budget') {
      dispatch(deleteExpense(entry.sourceId));
    } else if (entry.source === 'user') {
      dispatch(deletePayment(entry.sourceId));
    } else if (entry.source === 'agent') {
      dispatch(deleteActionHistoryEntry({ id: entry.sourceId }));
    }

    if (editingEntry?._key === entry._key) {
      resetFormState();
    }
  };

  return (
    <div className="finance-section-container">
      <header className="finance-section-header">
        <h1>{t('Historial')}</h1>
        <p>{t('Source of Truth — all financial movements feed Budgeting, Hub and Calendar.')}</p>
      </header>

      {/* KPI row — BUDGET-DUAL-7 */}
      <section className="finance-kpi-grid">
        <article className="finance-kpi-card" style={{ borderColor: '#22c55e' }}>
          <span>{t('Ingresos USD')} ({t('month')})</span>
          <strong style={{ color: '#86efac' }}>
            +${allEntries.filter(e => e.kind === 'income' && (e.currency || 'MXN') === 'USD' && String(e.date||'').slice(0,7) === monthKey).reduce((s,e) => s+(e.amount||0), 0).toFixed(2)} USD
          </strong>
        </article>
        <article className="finance-kpi-card" style={{ borderColor: '#22c55e' }}>
          <span>{t('Ingresos MXN')} ({t('month')})</span>
          <strong style={{ color: '#86efac' }}>
            +${allEntries.filter(e => e.kind === 'income' && (e.currency || 'MXN') === 'MXN' && String(e.date||'').slice(0,7) === monthKey).reduce((s,e) => s+(e.amount||0), 0).toFixed(2)} MXN
          </strong>
        </article>
        <article className="finance-kpi-card" style={{ borderColor: '#ef4444' }}>
          <span>{t('Egresos USD')} ({t('month')})</span>
          <strong style={{ color: '#fca5a5' }}>
            -${allEntries.filter(e => e.kind === 'expense' && (e.currency || 'MXN') === 'USD' && String(e.date||'').slice(0,7) === monthKey).reduce((s,e) => s+(e.amount||0), 0).toFixed(2)} USD
          </strong>
        </article>
        <article className="finance-kpi-card" style={{ borderColor: '#ef4444' }}>
          <span>{t('Egresos MXN')} ({t('month')})</span>
          <strong style={{ color: '#fca5a5' }}>
            -${allEntries.filter(e => e.kind === 'expense' && (e.currency || 'MXN') === 'MXN' && String(e.date||'').slice(0,7) === monthKey).reduce((s,e) => s+(e.amount||0), 0).toFixed(2)} MXN
          </strong>
        </article>
      </section>

      {/* Currency filter — BUDGET-DUAL-7 */}
      <div className="finance-filter-tabs" style={{ marginBottom: 8 }}>
        {['all','USD','MXN'].map((c) => (
          <button
            key={c}
            className={`finance-filter-tab${currencyFilter === c ? ' active' : ''}`}
            onClick={() => setCurrencyFilter(c)}
          >
            {c === 'all' ? t('Todas las divisas') : c === 'USD' ? '💵 USD' : '💴 MXN'}
          </button>
        ))}
      </div>

      {/* Filter tabs */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
        <div className="finance-filter-tabs">
          {[FILTER_ALL, FILTER_INCOME, FILTER_EXPENSE, FILTER_AGENT].map((tab) => (
            <button
              key={tab}
              className={`finance-filter-tab${filter === tab ? ' active' : ''}`}
              onClick={() => {
                setFilter(tab);
                if (tab !== FILTER_AGENT) setAgentFilter(null);
              }}
            >
              {tab === FILTER_ALL ? t('Todos') :
               tab === FILTER_INCOME ? t('Ingresos') :
               tab === FILTER_EXPENSE ? t('Egresos') : t('Agente')}
            </button>
          ))}
        </div>
        <button
          className="finance-action-btn"
          onClick={() => {
            if (showForm) {
              resetFormState();
              return;
            }
            setShowForm(true);
          }}
        >
          {showForm ? t('Cancelar') : `+ ${t('Add Transaction')}`}
        </button>
      </div>

      {/* Agent sub-filter */}
      {filter === FILTER_AGENT && (
        <div className="finance-filter-tabs" style={{ marginBottom: 10 }}>
          <button
            className={`finance-filter-tab${!agentFilter ? ' active' : ''}`}
            onClick={() => setAgentFilter(null)}
          >
            {t('All agents')}
          </button>
          {AGENT_NAMES.map((name) => (
            <button
              key={name}
              className={`finance-filter-tab${agentFilter === name ? ' active' : ''}`}
              onClick={() => setAgentFilter(name)}
            >
              <span className={`finance-agent-tag ${name.toLowerCase()}`}>{name}</span>
            </button>
          ))}
        </div>
      )}

      {/* Add transaction form */}
      {showForm && (
        <form className="finance-quick-form" onSubmit={handleAddTransaction} style={{ marginBottom: 14 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
            <label>{t('Type')}
              <select value={form.txType} onChange={(e) => setForm((p) => ({ ...p, txType: e.target.value }))}>
                <option value="income">{t('Income')}</option>
                <option value="expense">{t('Expense')}</option>
              </select>
            </label>
            <label>{t('Amount')}
              <input
                type="number"
                min="0"
                step="0.01"
                value={form.amount}
                onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                placeholder="0.00"
                required={!editingEntry || editingEntry.source !== 'agent'}
              />
            </label>
          </div>
          <label>{t('Description')}
            <input
              value={form.description}
              onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
              placeholder="Ej: Supermercado, Salario, Uber"
            />
          </label>
          {form.txType === 'expense' && (
            <label>{t('Category')}
              <select
                value={form.categoryId}
                onChange={(e) => setForm((p) => ({ ...p, categoryId: e.target.value }))}
              >
                <option value="">{t('Select category')}</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </label>
          )}
          <label>{t('Date')}
            <input
              type="date"
              value={form.date}
              onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))}
            />
          </label>
          <button type="submit">
            {editingEntry ? t('Save') : t('Save Transaction')}
          </button>
        </form>
      )}

      {/* Entries list */}
      <section className="finance-panel">
        <h2>{t('Movimientos')}</h2>
        {filtered.length === 0 ? (
          <div className="finance-empty">{t('No finance history entries yet.')}</div>
        ) : (
          <ul className="finance-list">
            {filtered.map((entry) => (
              <li key={entry._key} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                {/* Type icon */}
                <div className={`finance-entry-icon ${entry.kind === 'income' ? 'income' : entry.kind === 'agent' ? 'agent' : 'expense'}`}>
                  {entry.kind === 'income' ? '↑' : entry.kind === 'agent' ? '⚡' : '↓'}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.9rem' }}>{entry.description}</span>
                    {entry.agent && (
                      <span className={`finance-agent-tag ${agentClass(entry.agent)}`}>
                        {entry.agent}
                      </span>
                    )}
                    {entry.categoryLabel && (
                      <span className="finance-agent-tag user">{entry.categoryLabel}</span>
                    )}
                    {entry.currency && entry.kind !== 'agent' && (
                      <span className={`finance-agent-tag currency-${(entry.currency || 'MXN').toLowerCase()}`}>
                        {entry.currency}
                      </span>
                    )}
                  </div>
                  <div className="finance-list-meta">
                    {entry.date ? new Date(entry.date).toLocaleString() : '—'}
                    {entry.actionType && ` · ${entry.actionType}`}
                  </div>
                </div>
                {entry.amount != null && entry.amount !== 0 && (
                  <span style={{
                    fontWeight: 600,
                    color: entry.kind === 'income' ? '#86efac' : entry.kind === 'agent' ? '#67e8f9' : '#fca5a5',
                    whiteSpace: 'nowrap'
                  }}>
                    {entry.kind === 'income' ? '+' : entry.kind === 'agent' ? '' : '-'}{entry.amount.toFixed(2)}
                  </span>
                )}
                <div style={{ display: 'flex', gap: 6 }}>
                  <button
                    type="button"
                    className="finance-action-btn finance-action-btn-sm"
                    onClick={() => handleEditEntry(entry)}
                  >
                    {t('Edit')}
                  </button>
                  <button
                    type="button"
                    className="finance-action-btn finance-action-btn-sm finance-action-btn-danger"
                    onClick={() => handleDeleteEntry(entry)}
                  >
                    {t('Delete')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default FinanceHistory;