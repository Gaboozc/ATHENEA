/* WALLETS-4: FinanceWallets page — dual USD/MXN wallet management */
import { useState, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import {
  addIncomeUSD,
  addIncomeMXN,
  addExpenseUSD,
  addExpenseMXN,
  recordConversion,
  deleteTransaction,
} from '../../store/slices/walletsSlice';
import { registerExpense } from '../store/thunks/financeThunks';
import './FinanceWallets.css';

const INCOME_CATEGORIES = ['freelance', 'salary', 'investment', 'other'];
const FILTER_ALL = 'all';
const FILTER_INCOME = 'income';
const FILTER_EXPENSE = 'expense';
const FILTER_CONVERSION = 'conversion';

const fmtUSD = (n) =>
  Number(n || 0).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const fmtMXN = (n) =>
  Number(n || 0).toLocaleString('es-MX', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const relativeDate = (iso) => {
  if (!iso) return '—';
  const diff = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (diff === 0) return 'Hoy';
  if (diff === 1) return 'Ayer';
  return `Hace ${diff} días`;
};

export const FinanceWallets = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();

  const walletUSD = useSelector((s) => s.wallets?.walletUSD || 0);
  const walletMXN = useSelector((s) => s.wallets?.walletMXN || 0);
  const referenceRate = useSelector((s) => s.wallets?.referenceRate || 0);
  const lastConversionDate = useSelector((s) => s.wallets?.lastConversionDate || null);
  const transactions = useSelector((s) => s.wallets?.transactions || []);
  const budgetCategories = useSelector((s) => s.budget?.categories || []);

  const [activeForm, setActiveForm] = useState(null); // 'income_usd' | 'income_mxn' | 'conversion' | 'expense'
  const [txFilter, setTxFilter] = useState(FILTER_ALL);

  // ── Form state ──────────────────────────────────────────────────────────────
  const [form, setForm] = useState({
    amount: '',
    amountUSD: '',
    amountMXN: '',
    description: '',
    category: '',
    currency: 'MXN',
    date: new Date().toISOString().slice(0, 10),
  });

  const resetForm = () => {
    setForm({ amount: '', amountUSD: '', amountMXN: '', description: '', category: '', currency: 'MXN', date: new Date().toISOString().slice(0, 10) });
  };

  const openForm = (type) => {
    resetForm();
    setActiveForm(activeForm === type ? null : type);
  };

  // Calculated rate preview for conversion form
  const conversionRate = useMemo(() => {
    const usd = parseFloat(form.amountUSD);
    const mxn = parseFloat(form.amountMXN);
    if (usd > 0 && mxn > 0) return mxn / usd;
    return null;
  }, [form.amountUSD, form.amountMXN]);

  // Equivalent total (informational)
  const equivalentMXN = referenceRate > 0 ? walletMXN + walletUSD * referenceRate : null;

  // Filtered budget categories by selected currency
  const filteredCategories = useMemo(
    () => budgetCategories.filter((c) => (c.currency || 'MXN') === form.currency),
    [budgetCategories, form.currency]
  );

  // ── Submit handlers ─────────────────────────────────────────────────────────
  const handleIncomeUSD = (e) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return;
    dispatch(addIncomeUSD({
      id: `inc-usd-${Date.now()}`,
      amount: amt,
      description: form.description || 'Ingreso USD',
      category: form.category || 'income',
      date: new Date(form.date).toISOString(),
    }));
    resetForm();
    setActiveForm(null);
  };

  const handleIncomeMXN = (e) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return;
    dispatch(addIncomeMXN({
      id: `inc-mxn-${Date.now()}`,
      amount: amt,
      description: form.description || 'Ingreso MXN',
      category: form.category || 'income',
      date: new Date(form.date).toISOString(),
    }));
    resetForm();
    setActiveForm(null);
  };

  const handleConversion = (e) => {
    e.preventDefault();
    const usd = parseFloat(form.amountUSD);
    const mxn = parseFloat(form.amountMXN);
    if (!usd || usd <= 0 || !mxn || mxn <= 0) return;
    dispatch(recordConversion({
      id: `conv-${Date.now()}`,
      amountUSD: usd,
      amountMXN: mxn,
      description: form.description || '',
      date: new Date(form.date).toISOString(),
    }));
    resetForm();
    setActiveForm(null);
  };

  const handleExpense = (e) => {
    e.preventDefault();
    const amt = parseFloat(form.amount);
    if (!amt || amt <= 0) return;
    const id = `exp-${Date.now()}`;
    dispatch(
      registerExpense({
        id,
        amount: amt,
        currency: form.currency,
        categoryId: form.category || null,
        description: form.description || 'Gasto',
        date: new Date(form.date).toISOString(),
      })
    );
    resetForm();
    setActiveForm(null);
  };

  // ── Filtered transactions ───────────────────────────────────────────────────
  const filteredTx = useMemo(() => {
    if (txFilter === FILTER_INCOME)
      return transactions.filter((t) => t.type === 'income_usd' || t.type === 'income_mxn');
    if (txFilter === FILTER_EXPENSE)
      return transactions.filter((t) => t.type === 'expense_usd' || t.type === 'expense_mxn');
    if (txFilter === FILTER_CONVERSION)
      return transactions.filter((t) => t.type === 'conversion');
    return transactions;
  }, [transactions, txFilter]);

  const txIcon = (type) => {
    if (type === 'income_usd') return '💵';
    if (type === 'income_mxn') return '💴';
    if (type === 'expense_usd' || type === 'expense_mxn') return '🔴';
    return '↔';
  };

  const txColor = (type) => {
    if (type === 'income_usd' || type === 'income_mxn') return 'var(--color-success, #22c55e)';
    if (type === 'conversion') return 'var(--accent-cyan, #1ec9ff)';
    return 'var(--color-error, #ef4444)';
  };

  const txLabel = (tx) => {
    if (tx.type === 'income_usd') return `+$${fmtUSD(tx.amountUSD)} USD`;
    if (tx.type === 'income_mxn') return `+$${fmtMXN(tx.amountMXN)} MXN`;
    if (tx.type === 'expense_usd') return `-$${fmtUSD(tx.amountUSD)} USD`;
    if (tx.type === 'expense_mxn') return `-$${fmtMXN(tx.amountMXN)} MXN`;
    if (tx.type === 'conversion')
      return `-$${fmtUSD(tx.amountUSD)} USD → +$${fmtMXN(tx.amountMXN)} MXN (tasa $${tx.rate?.toFixed(2)})`;
    return '';
  };

  return (
    <div className="wallets-container">
      <header className="wallets-header">
        <h1>💼 {t('Billeteras')}</h1>
        <p>{t('Saldos reales en USD y MXN — sin conversiones automáticas')}</p>
      </header>

      {/* SECCIÓN 1 — Saldos */}
      <section className="wallets-balances">
        <div className="wallet-card wallet-usd">
          <div className="wallet-card-icon">💵</div>
          <div className="wallet-card-body">
            <span className="wallet-card-label">{t('Saldo USD')}</span>
            <strong className="wallet-card-amount">${fmtUSD(walletUSD)} USD</strong>
            {lastConversionDate && (
              <span className="wallet-card-meta">
                {t('Última conversión')}: {relativeDate(lastConversionDate)}
              </span>
            )}
          </div>
        </div>

        <div className="wallet-card wallet-mxn">
          <div className="wallet-card-icon">💴</div>
          <div className="wallet-card-body">
            <span className="wallet-card-label">{t('Saldo MXN')}</span>
            <strong className="wallet-card-amount">${fmtMXN(walletMXN)} MXN</strong>
            {referenceRate > 0 && (
              <span className="wallet-card-meta">
                {t('Tasa ref')}: ${referenceRate.toFixed(2)} MXN/USD
              </span>
            )}
          </div>
        </div>

        {equivalentMXN !== null && (
          <div className="wallet-equiv-note">
            ≈ {t('Total equivalente')}: <strong>${fmtMXN(equivalentMXN)} MXN</strong>
            <small> ({t('usando tasa')} ${referenceRate.toFixed(2)} — {t('solo referencial')})</small>
          </div>
        )}
      </section>

      {/* SECCIÓN 2 — Acciones rápidas */}
      <section className="wallets-actions">
        <button
          className={`wallets-action-btn${activeForm === 'income_usd' ? ' active' : ''}`}
          onClick={() => openForm('income_usd')}
        >
          + {t('Ingreso USD')}
        </button>
        <button
          className={`wallets-action-btn${activeForm === 'income_mxn' ? ' active' : ''}`}
          onClick={() => openForm('income_mxn')}
        >
          + {t('Ingreso MXN')}
        </button>
        <button
          className={`wallets-action-btn wallets-action-btn--convert${activeForm === 'conversion' ? ' active' : ''}`}
          onClick={() => openForm('conversion')}
        >
          ↔ {t('Convertir')}
        </button>
        <button
          className={`wallets-action-btn wallets-action-btn--expense${activeForm === 'expense' ? ' active' : ''}`}
          onClick={() => openForm('expense')}
        >
          − {t('Gasto')}
        </button>
      </section>

      {/* SECCIÓN 3 — Formularios inline */}
      {activeForm === 'income_usd' && (
        <form className="wallets-form" onSubmit={handleIncomeUSD}>
          <h3>💵 {t('Ingreso USD')}</h3>
          <label>{t('Descripción')}
            <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Ej: Cliente XYZ" />
          </label>
          <label>{t('Monto USD')}
            <input type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
          </label>
          <label>{t('Categoría')}
            <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
              <option value="">{t('Seleccionar')}</option>
              {INCOME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>{t('Fecha')}
            <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
          </label>
          <div className="wallets-form-actions">
            <button type="button" onClick={() => setActiveForm(null)}>{t('Cancelar')}</button>
            <button type="submit">{t('Registrar')}</button>
          </div>
        </form>
      )}

      {activeForm === 'income_mxn' && (
        <form className="wallets-form" onSubmit={handleIncomeMXN}>
          <h3>💴 {t('Ingreso MXN')}</h3>
          <label>{t('Descripción')}
            <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Ej: Venta local" />
          </label>
          <label>{t('Monto MXN')}
            <input type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
          </label>
          <label>{t('Categoría')}
            <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
              <option value="">{t('Seleccionar')}</option>
              {INCOME_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </label>
          <label>{t('Fecha')}
            <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
          </label>
          <div className="wallets-form-actions">
            <button type="button" onClick={() => setActiveForm(null)}>{t('Cancelar')}</button>
            <button type="submit">{t('Registrar')}</button>
          </div>
        </form>
      )}

      {activeForm === 'conversion' && (
        <form className="wallets-form wallets-form--conversion" onSubmit={handleConversion}>
          <h3>↔ {t('Conversión USD → MXN')}</h3>
          <p className="wallets-form-hint">¿{t('Cuánto convertiste y a qué tasa')}?</p>
          <label>{t('Monto USD que convertiste')}
            <input type="number" min="0.01" step="0.01" required value={form.amountUSD} onChange={(e) => setForm((p) => ({ ...p, amountUSD: e.target.value }))} placeholder="0.00" />
          </label>
          <label>{t('Monto MXN que recibiste')}
            <input type="number" min="0.01" step="0.01" required value={form.amountMXN} onChange={(e) => setForm((p) => ({ ...p, amountMXN: e.target.value }))} placeholder="0.00" />
          </label>
          {conversionRate !== null && (
            <div className="wallets-rate-preview">
              {t('Convirtiendo')} <strong>${fmtUSD(form.amountUSD)} USD</strong> → <strong>${fmtMXN(form.amountMXN)} MXN</strong>
              <br />
              {t('Tasa registrada')}: <strong>${conversionRate.toFixed(4)} MXN {t('por')} USD</strong>
            </div>
          )}
          <label>{t('Descripción')} ({t('opcional')})
            <input value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Ej: Casa de cambio OXXO" />
          </label>
          <label>{t('Fecha')}
            <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
          </label>
          <div className="wallets-form-actions">
            <button type="button" onClick={() => setActiveForm(null)}>{t('Cancelar')}</button>
            <button type="submit">{t('Registrar conversión')}</button>
          </div>
        </form>
      )}

      {activeForm === 'expense' && (
        <form className="wallets-form" onSubmit={handleExpense}>
          <h3>🔴 {t('Registrar gasto')}</h3>
          <label>{t('Descripción')}
            <input required value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} placeholder="Ej: Supermercado" />
          </label>
          <label>{t('Monto')}
            <input type="number" min="0.01" step="0.01" required value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} placeholder="0.00" />
          </label>
          <label>{t('Divisa')}
            <select value={form.currency} onChange={(e) => setForm((p) => ({ ...p, currency: e.target.value, category: '' }))}>
              <option value="MXN">💴 MXN</option>
              <option value="USD">💵 USD</option>
            </select>
          </label>
          <p className="wallets-form-hint">
            {t('Se descontará de tu saldo')} <strong>{form.currency}</strong>
          </p>
          <label>{t('Categoría')}
            <select value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}>
              <option value="">{t('Sin categoría')}</option>
              {filteredCategories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </label>
          <label>{t('Fecha')}
            <input type="date" value={form.date} onChange={(e) => setForm((p) => ({ ...p, date: e.target.value }))} />
          </label>
          <div className="wallets-form-actions">
            <button type="button" onClick={() => setActiveForm(null)}>{t('Cancelar')}</button>
            <button type="submit">{t('Registrar gasto')}</button>
          </div>
        </form>
      )}

      {/* SECCIÓN 4 — Historial */}
      <section className="wallets-history">
        <div className="wallets-history-header">
          <h2>{t('Historial de billetera')}</h2>
          <div className="wallets-filter-tabs">
            {[FILTER_ALL, FILTER_INCOME, FILTER_EXPENSE, FILTER_CONVERSION].map((f) => (
              <button
                key={f}
                className={`wallets-filter-tab${txFilter === f ? ' active' : ''}`}
                onClick={() => setTxFilter(f)}
              >
                {f === FILTER_ALL ? t('Todos')
                  : f === FILTER_INCOME ? t('Ingresos')
                  : f === FILTER_EXPENSE ? t('Gastos')
                  : t('Conversiones')}
              </button>
            ))}
          </div>
        </div>

        {filteredTx.length === 0 ? (
          <div className="wallets-empty">{t('No hay transacciones aún.')}</div>
        ) : (
          <ul className="wallets-tx-list">
            {filteredTx.map((tx) => (
              <li key={tx.id} className="wallets-tx-item">
                <span className="wallets-tx-icon">{txIcon(tx.type)}</span>
                <div className="wallets-tx-body">
                  <span className="wallets-tx-desc">{tx.description}</span>
                  {tx.category && tx.category !== 'conversion' && (
                    <span className="wallets-tx-badge">{tx.category}</span>
                  )}
                  <span className="wallets-tx-date">{relativeDate(tx.date)}</span>
                </div>
                <span className="wallets-tx-amount" style={{ color: txColor(tx.type) }}>
                  {txLabel(tx)}
                </span>
                <button
                  className="wallets-tx-delete"
                  onClick={() => {
                    if (window.confirm(t('¿Eliminar esta transacción? Se revertirá el saldo.'))) {
                      dispatch(deleteTransaction(tx.id));
                    }
                  }}
                  title={t('Eliminar')}
                >
                  ×
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
};

export default FinanceWallets;
