/* DEBTS-3: FinanceDebts page — full debt management UI */
import { useState, useMemo, useCallback } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '../context/LanguageContext';
import { addDebt, updateDebt, deleteDebt, deletePayment } from '../../store/slices/debtsSlice';
import { payDebt } from '../store/thunks/financeThunks'; /* DEBTS-2 */
import { addEvent, unlinkFromCalendar } from '../../store/slices/calendarSlice';
import { EmptyState } from '../components';
import './FinanceDebts.css';

// I18N-9: keys in English — t() maps to Spanish when needed
const CREDITOR_TYPE_KEYS = [
  { value: 'bank',       key: 'Bank' },
  { value: 'person',     key: 'Person' },
  { value: 'family',     key: 'Family' },
  { value: 'friend',     key: 'Friend' },
  { value: 'collection', key: 'Collection' },
  { value: 'other',      key: 'Other' },
];

const FREQUENCY_KEYS = [
  { value: 'daily',     key: 'Daily' },
  { value: 'weekly',    key: 'Weekly' },
  { value: 'biweekly',  key: 'Biweekly' },
  { value: 'monthly',   key: 'Monthly' },
  { value: 'bimonthly', key: 'Bimonthly' },
  { value: 'quarterly', key: 'Quarterly' },
  { value: 'annual',    key: 'Annual' },
  { value: 'irregular', key: 'Irregular' },
];

const STATUS_LABELS = {
  not_started: 'No iniciada',
  active:      'Activa',
  paused:      'Pausada',
  completed:   'Completada',
};

const getBarColor = (pct) => {
  if (pct >= 75) return '#10b981';
  if (pct >= 40) return '#1ec9ff';
  return '#f3c54a';
};

const emptyDebtForm = {
  name: '',
  creditor: '',
  creditorType: 'bank',
  totalAmount: '',
  currency: 'MXN',
  frequency: 'monthly',
  paymentAmount: '',
  nextDueDate: '',
  status: 'not_started',
  notStartedReason: '',
  estimatedStartDate: '',
  notes: '',
};

export const FinanceDebts = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const debts = useSelector((s) => s.debts?.debts || []);
  const walletMXN = useSelector((s) => s.wallets?.walletMXN || 0);
  const walletUSD = useSelector((s) => s.wallets?.walletUSD || 0);

  const [filter, setFilter] = useState('all');
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(emptyDebtForm);
  const [editingId, setEditingId] = useState(null);
  const [expandedIds, setExpandedIds] = useState(new Set());
  const [payModal, setPayModal] = useState(null); // { debtId, debtName, balance, currency }
  const [payForm, setPayForm] = useState({ amount: '', currency: 'MXN', date: '', note: '' });

  // ── KPIs ──────────────────────────────────────────────────────────────────
  const activeDebts = useMemo(() => debts.filter((d) => d.status !== 'completed'), [debts]);
  const totalDebtMXN = useMemo(
    () => activeDebts.filter((d) => d.currency === 'MXN').reduce((s, d) => s + d.balance, 0),
    [activeDebts]
  );
  const totalDebtUSD = useMemo(
    () => activeDebts.filter((d) => d.currency === 'USD').reduce((s, d) => s + d.balance, 0),
    [activeDebts]
  );
  const nextPayment = useMemo(
    () =>
      activeDebts
        .filter((d) => d.nextDueDate && d.status === 'active')
        .sort((a, b) => new Date(a.nextDueDate) - new Date(b.nextDueDate))[0] || null,
    [activeDebts]
  );

  // ── Filtered list ─────────────────────────────────────────────────────────
  const filtered = useMemo(() => {
    if (filter === 'all') return debts;
    return debts.filter((d) => d.status === filter);
  }, [debts, filter]);

  // ── Helpers ───────────────────────────────────────────────────────────────
  const toggleExpand = (id) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const resetForm = () => {
    setForm(emptyDebtForm);
    setEditingId(null);
    setShowForm(false);
  };

  const handleFormChange = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
  };

  // ── Add / Edit debt ───────────────────────────────────────────────────────
  const handleSaveDebt = useCallback(() => {
    if (!form.name.trim() || !form.creditor.trim() || !form.totalAmount) return;
    const payload = {
      ...form,
      totalAmount: Number(form.totalAmount),
      paymentAmount: Number(form.paymentAmount) || 0,
      nextDueDate: form.nextDueDate || null,
      estimatedStartDate: form.estimatedStartDate || null,
    };
    if (editingId) {
      dispatch(updateDebt({ id: editingId, ...payload }));
    } else {
      const newDebt = { id: `debt-${Date.now()}`, ...payload };
      dispatch(addDebt(newDebt));
      // If starting active and has nextDueDate, create calendar event
      if (newDebt.status === 'active' && newDebt.nextDueDate) {
        dispatch(addEvent({
          id: `cal-debt-init-${newDebt.id}`,
          title: `💳 ${newDebt.name} — $${newDebt.paymentAmount} ${newDebt.currency}`,
          startDate: newDebt.nextDueDate,
          endDate: newDebt.nextDueDate,
          relatedId: newDebt.id,
          relatedType: 'debt',
          color: '#1ec9ff',
        }));
      }
    }
    resetForm();
  }, [form, editingId, dispatch]);

  const handleEditDebt = (debt) => {
    setForm({
      name: debt.name,
      creditor: debt.creditor,
      creditorType: debt.creditorType,
      totalAmount: String(debt.totalAmount),
      currency: debt.currency,
      frequency: debt.frequency,
      paymentAmount: String(debt.paymentAmount),
      nextDueDate: debt.nextDueDate ? debt.nextDueDate.slice(0, 10) : '',
      status: debt.status,
      notStartedReason: debt.notStartedReason || '',
      estimatedStartDate: debt.estimatedStartDate ? debt.estimatedStartDate.slice(0, 10) : '',
      notes: debt.notes || '',
    });
    setEditingId(debt.id);
    setShowForm(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDeleteDebt = (debt) => {
    if (!window.confirm(`¿Eliminar la deuda "${debt.name}"? Se perderá todo el historial.`)) return;
    dispatch(unlinkFromCalendar({ relatedId: debt.id, relatedType: 'debt' }));
    dispatch(deleteDebt(debt.id));
  };

  const handleDeletePayment = (debtId, paymentId) => {
    if (!window.confirm('¿Eliminar este abono? El saldo de la deuda se ajustará.')) return;
    dispatch(deletePayment({ debtId, paymentId }));
  };

  // ── Pay modal ─────────────────────────────────────────────────────────────
  const openPayModal = (debt) => {
    setPayModal({ debtId: debt.id, debtName: debt.name, balance: debt.balance, currency: debt.currency });
    setPayForm({ amount: '', currency: debt.currency, date: new Date().toISOString().slice(0, 10), note: '' });
  };

  const closePayModal = () => {
    setPayModal(null);
    setPayForm({ amount: '', currency: 'MXN', date: '', note: '' });
  };

  const handleRegisterPayment = useCallback(() => {
    if (!payModal || !payForm.amount) return;
    dispatch(payDebt({
      debtId: payModal.debtId,
      amount: Number(payForm.amount),
      currency: payForm.currency,
      note: payForm.note,
      date: payForm.date ? new Date(payForm.date).toISOString() : undefined,
    }));
    // If payment covers the balance, unlink from calendar
    const debt = debts.find((d) => d.id === payModal.debtId);
    if (debt && Number(payForm.amount) >= debt.balance) {
      dispatch(unlinkFromCalendar({ relatedId: payModal.debtId, relatedType: 'debt' }));
    }
    closePayModal();
  }, [payModal, payForm, debts, dispatch]);

  const previewBalance = payModal
    ? Math.max(0, payModal.balance - Number(payForm.amount || 0))
    : 0;
  const willComplete = payModal && Number(payForm.amount) >= payModal.balance;

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="finance-debts-container">
      <header className="finance-debts-header">
        <div>
          <button className="back-btn" onClick={() => navigate('/finance')}>← Finance Hub</button>
          <h1>💳 Deudas</h1>
          <p>Controla tus deudas, abonos y próximos vencimientos.</p>
        </div>
        <button className="btn-primary" onClick={() => { resetForm(); setShowForm(true); }}>
          + Nueva deuda
        </button>
      </header>

      {/* KPIs */}
      <section className="debts-kpis">
        <div className="debts-kpi">
          <span>Deuda total MXN</span>
          <strong className="kpi-red">
            ${totalDebtMXN.toLocaleString('es-MX', { minimumFractionDigits: 2 })} MXN
          </strong>
          <small>{activeDebts.filter((d) => d.currency === 'MXN').length} deudas activas</small>
        </div>
        <div className="debts-kpi">
          <span>Deuda total USD</span>
          <strong className="kpi-red">
            ${totalDebtUSD.toLocaleString('en-US', { minimumFractionDigits: 2 })} USD
          </strong>
          <small>{activeDebts.filter((d) => d.currency === 'USD').length} deudas activas</small>
        </div>
        <div className="debts-kpi">
          <span>Próximo pago</span>
          {nextPayment ? (
            <>
              <strong>
                ${nextPayment.paymentAmount.toLocaleString('es-MX')} {nextPayment.currency}
              </strong>
              <small>
                {nextPayment.name} · {new Date(nextPayment.nextDueDate).toLocaleDateString('es-MX')}
              </small>
            </>
          ) : (
            <strong style={{ color: 'var(--color-success)' }}>Sin pagos pendientes</strong>
          )}
        </div>
      </section>

      {/* New / Edit form */}
      {showForm && (
        <section className="debt-form-section">
          <h2>{editingId ? 'Editar deuda' : 'Nueva deuda'}</h2>
          <div className="debt-form-grid">
            <label>
              Nombre <span className="req">*</span>
              <input
                value={form.name}
                onChange={(e) => handleFormChange('name', e.target.value)}
                placeholder="Ej: Préstamo HSBC"
              />
            </label>
            <label>
              Acreedor <span className="req">*</span>
              <input
                value={form.creditor}
                onChange={(e) => handleFormChange('creditor', e.target.value)}
                placeholder="Ej: HSBC, Juan"
              />
            </label>
            <label>
              Tipo de acreedor
              <div className="btn-group">
                {CREDITOR_TYPE_KEYS.map((ct) => (
                  <button
                    key={ct.value}
                    type="button"
                    className={`btn-chip${form.creditorType === ct.value ? ' active' : ''}`}
                    onClick={() => handleFormChange('creditorType', ct.value)}
                  >
                    {t(ct.key)}
                  </button>
                ))}
              </div>
            </label>
            <label>
              Monto total <span className="req">*</span>
              <div className="input-row">
                <input
                  type="number"
                  min="0"
                  value={form.totalAmount}
                  onChange={(e) => handleFormChange('totalAmount', e.target.value)}
                  placeholder="5000"
                />
                <div className="btn-group">
                  {['MXN', 'USD'].map((c) => (
                    <button
                      key={c}
                      type="button"
                      className={`btn-chip${form.currency === c ? ' active' : ''}`}
                      onClick={() => handleFormChange('currency', c)}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
            </label>
            <label>
              Frecuencia de pago
              <div className="btn-group wrap">
                {FREQUENCY_KEYS.map((f) => (
                  <button
                    key={f.value}
                    type="button"
                    className={`btn-chip${form.frequency === f.value ? ' active' : ''}`}
                    onClick={() => handleFormChange('frequency', f.value)}
                  >
                    {t(f.key)}
                  </button>
                ))}
              </div>
            </label>
            <label>
              Monto por pago
              <input
                type="number"
                min="0"
                value={form.paymentAmount}
                onChange={(e) => handleFormChange('paymentAmount', e.target.value)}
                placeholder="500"
              />
            </label>
            <label>
              Próxima fecha de pago
              <input
                type="date"
                value={form.nextDueDate}
                onChange={(e) => handleFormChange('nextDueDate', e.target.value)}
              />
            </label>
            <label>
              Estado inicial
              <div className="btn-group">
                <button
                  type="button"
                  className={`btn-chip${form.status === 'active' ? ' active' : ''}`}
                  onClick={() => handleFormChange('status', 'active')}
                >
                  Activa
                </button>
                <button
                  type="button"
                  className={`btn-chip${form.status === 'not_started' ? ' active' : ''}`}
                  onClick={() => handleFormChange('status', 'not_started')}
                >
                  No iniciada
                </button>
              </div>
            </label>
            {form.status === 'not_started' && (
              <>
                <label>
                  Razón (no iniciada)
                  <input
                    value={form.notStartedReason}
                    onChange={(e) => handleFormChange('notStartedReason', e.target.value)}
                    placeholder="Ej: Esperando ingresos"
                  />
                </label>
                <label>
                  Fecha estimada de inicio
                  <input
                    type="date"
                    value={form.estimatedStartDate}
                    onChange={(e) => handleFormChange('estimatedStartDate', e.target.value)}
                  />
                </label>
              </>
            )}
            <label className="full-width">
              Notas
              <textarea
                rows={2}
                value={form.notes}
                onChange={(e) => handleFormChange('notes', e.target.value)}
                placeholder="Opcional"
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="button" className="btn-ghost" onClick={resetForm}>Cancelar</button>
            <button
              type="button"
              className="btn-primary"
              onClick={handleSaveDebt}
              disabled={!form.name.trim() || !form.creditor.trim() || !form.totalAmount}
            >
              {editingId ? 'Guardar cambios' : 'Guardar deuda'}
            </button>
          </div>
        </section>
      )}

      {/* Filters */}
      <div className="debts-filters">
        {['all', 'active', 'not_started', 'paused', 'completed'].map((f) => (
          <button
            key={f}
            type="button"
            className={`filter-btn${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'Todas' : STATUS_LABELS[f]}
            {' '}
            <span className="filter-count">
              ({f === 'all' ? debts.length : debts.filter((d) => d.status === f).length})
            </span>
          </button>
        ))}
      </div>

      {/* Debt list */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="💳"
          title={
            filter === 'all'
              ? 'No tienes deudas registradas. ¡Bien hecho!'
              : `Sin deudas en estado "${STATUS_LABELS[filter] || filter}".`
          }
          description={
            filter === 'all'
              ? 'Puedes registrar una deuda para controlar pagos y vencimientos.'
              : 'Cambia el filtro o registra una nueva deuda.'
          }
          action={
            filter === 'all'
              ? { label: 'Registrar primera deuda', icon: '+', onClick: () => setShowForm(true) }
              : { label: 'Ver todas', icon: '↺', onClick: () => setFilter('all') }
          }
        />
      ) : (
        <div className="debts-list">
          {filtered.map((debt) => {
            const pct = debt.totalAmount > 0 ? (debt.amountPaid / debt.totalAmount) * 100 : 0;
            const barColor = getBarColor(pct);
            const isExpanded = expandedIds.has(debt.id);
            const isOverdue =
              debt.nextDueDate &&
              debt.status === 'active' &&
              new Date(debt.nextDueDate) < new Date();
            return (
              <div
                key={debt.id}
                className={`debt-card debt-card--${debt.status}${isOverdue ? ' debt-card--overdue' : ''}`}
              >
                <div className="debt-card-header">
                  <div className="debt-card-title">
                    <span className="debt-icon">💳</span>
                    <div>
                      <strong>{debt.name}</strong>
                      <span className="debt-creditor">{debt.creditor}</span>
                    </div>
                  </div>
                  <div className="debt-card-meta">
                    <span className={`debt-status-badge debt-status--${debt.status}`}>
                      {STATUS_LABELS[debt.status]}
                    </span>
                    <span className="debt-amount">
                      ${debt.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {debt.currency}
                    </span>
                  </div>
                </div>

                <div className="debt-card-sub">
                  {t(FREQUENCY_KEYS.find((f) => f.value === debt.frequency)?.key || debt.frequency)}
                  {debt.nextDueDate && debt.status !== 'completed' && (
                    <>
                      {' · '}
                      <span className={isOverdue ? 'overdue-text' : ''}>
                        {t('Due:')} {new Date(debt.nextDueDate).toLocaleDateString()}
                        {isOverdue && ' ⚠️'}
                      </span>
                    </>
                  )}
                </div>

                {debt.status === 'not_started' ? (
                  <div className="debt-not-started">
                    <span>⏸ {t('Not started')}</span>
                    {debt.notStartedReason && <span className="reason"> · {debt.notStartedReason}</span>}
                    {debt.estimatedStartDate && (
                      <span> · {t('Est. start:')} {new Date(debt.estimatedStartDate).toLocaleDateString()}</span>
                    )}
                  </div>
                ) : debt.status !== 'completed' ? (
                  <div className="debt-progress-wrap">
                    <div className="debt-progress-bar">
                      <div
                        className="debt-progress-fill"
                        style={{ width: `${Math.min(100, pct)}%`, background: barColor }}
                      />
                    </div>
                    <div className="debt-progress-labels">
                      <span>
                        {t('Paid:')} ${Number(debt.amountPaid).toLocaleString(undefined, { minimumFractionDigits: 2 })} /
                        ${Number(debt.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {debt.currency}
                      </span>
                      <span className="pct-label">{Math.round(pct)}%</span>
                    </div>
                  </div>
                ) : (
                  <div className="debt-completed-banner">
                    ✅ {t('Debt fully paid')} · ${Number(debt.totalAmount).toLocaleString(undefined, { minimumFractionDigits: 2 })} {debt.currency}
                  </div>
                )}

                <div className="debt-card-actions">
                  <button
                    type="button"
                    className="btn-ghost btn-sm"
                    onClick={() => toggleExpand(debt.id)}
                  >
                    {isExpanded ? `${t('Hide history')} ▲` : `${t('View history')} ▼`}
                  </button>
                  {debt.status !== 'completed' && (
                    <button
                      type="button"
                      className="btn-primary btn-sm"
                      onClick={() => openPayModal(debt)}
                    >
                      {t('Record payment')}
                    </button>
                  )}
                  <button type="button" className="btn-ghost btn-sm" onClick={() => handleEditDebt(debt)}>
                    {t('Edit')}
                  </button>
                  <button type="button" className="btn-danger btn-sm" onClick={() => handleDeleteDebt(debt)}>
                    ×
                  </button>
                </div>

                {isExpanded && (
                  <div className="debt-history">
                    {debt.payments.length === 0 ? (
                      <p className="empty-history">{t('No payments recorded.')}</p>
                    ) : (
                      [...debt.payments]
                        .sort((a, b) => new Date(b.date) - new Date(a.date))
                        .map((p) => (
                          <div key={p.id} className="payment-row">
                            <span className="payment-date">
                              {new Date(p.date).toLocaleDateString('es-MX')}
                            </span>
                            <span className="payment-amount">
                              ${p.amount.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {p.currency}
                            </span>
                            {p.note && <span className="payment-note">{p.note}</span>}
                            <button
                              type="button"
                              className="btn-danger btn-xs"
                              onClick={() => handleDeletePayment(debt.id, p.id)}
                            >
                              ×
                            </button>
                          </div>
                        ))
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Pay modal */}
      {payModal && (
        <div className="debt-modal-overlay" onClick={closePayModal}>
          <div className="debt-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Registrar abono</h3>
              <button type="button" className="modal-close" onClick={closePayModal}>×</button>
            </div>
            <div className="modal-body">
              <div className="modal-info-row">
                <span>Deuda:</span>
                <strong>{payModal.debtName}</strong>
              </div>
              <div className="modal-info-row">
                <span>Saldo actual:</span>
                <strong className="kpi-red">
                  ${payModal.balance.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {payModal.currency}
                </strong>
              </div>
              <label>
                Monto del abono <span className="req">*</span>
                <div className="input-row">
                  <input
                    type="number"
                    min="0.01"
                    step="0.01"
                    value={payForm.amount}
                    onChange={(e) => setPayForm((p) => ({ ...p, amount: e.target.value }))}
                    placeholder="500"
                    autoFocus
                  />
                  <div className="btn-group">
                    {['MXN', 'USD'].map((c) => (
                      <button
                        key={c}
                        type="button"
                        className={`btn-chip${payForm.currency === c ? ' active' : ''}`}
                        onClick={() => setPayForm((p) => ({ ...p, currency: c }))}
                      >
                        {c}
                      </button>
                    ))}
                  </div>
                </div>
              </label>
              <label>
                Fecha
                <input
                  type="date"
                  value={payForm.date}
                  onChange={(e) => setPayForm((p) => ({ ...p, date: e.target.value }))}
                />
              </label>
              <label>
                Nota (opcional)
                <input
                  value={payForm.note}
                  onChange={(e) => setPayForm((p) => ({ ...p, note: e.target.value }))}
                  placeholder="Ej: Quincena de marzo"
                />
              </label>

              {payForm.amount && (
                <div className="modal-preview">
                  <div className="preview-row">
                    <span>Se descontará de tu saldo {payForm.currency}:</span>
                    <strong>
                      ${(payForm.currency === 'MXN' ? walletMXN : walletUSD).toLocaleString('es-MX', { minimumFractionDigits: 2 })} → $
                      {Math.max(0, (payForm.currency === 'MXN' ? walletMXN : walletUSD) - Number(payForm.amount)).toLocaleString('es-MX', { minimumFractionDigits: 2 })} {payForm.currency}
                    </strong>
                  </div>
                  <div className="preview-row">
                    <span>Saldo de la deuda después:</span>
                    <strong>
                      ${previewBalance.toLocaleString('es-MX', { minimumFractionDigits: 2 })} {payModal.currency}
                    </strong>
                  </div>
                  {willComplete && (
                    <div className="preview-complete">
                      ✅ Esta deuda quedará completamente pagada.
                    </div>
                  )}
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button type="button" className="btn-ghost" onClick={closePayModal}>Cancelar</button>
              <button
                type="button"
                className="btn-primary"
                onClick={handleRegisterPayment}
                disabled={!payForm.amount || Number(payForm.amount) <= 0}
              >
                Registrar abono
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default FinanceDebts;
