import { useMemo, useState } from 'react';
import { useLanguage } from '../context/LanguageContext';
import { useGlobalReducer } from '../hooks/useGlobalReducer';
import { selectFinancialSnapshot } from '../store/selectors/financialSelectors';
import { addGoal, deleteGoal, setMonthlyContribution } from '../../store/slices/goalsSlice';
import './FinanceSections.css';

const remainingDaysInMonth = () => {
  const now = new Date();
  const last = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  return Math.max(1, last - now.getDate() + 1);
};

/**
 * Projects the month+year when a goal will be fully funded.
 * Returns a formatted string or '—' if data is missing.
 */
const projectCompletionDate = (savedToDate, targetAmount, monthlyContribution) => {
  if (monthlyContribution <= 0 || targetAmount <= savedToDate) return null;
  const monthsLeft = Math.ceil((targetAmount - savedToDate) / monthlyContribution);
  const projected = new Date();
  projected.setMonth(projected.getMonth() + monthsLeft);
  return projected.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
};

const EMPTY_GOAL_FORM = {
  name: '',
  targetAmount: '',
  monthlyContribution: '',
  category: '',
  targetDate: ''
};

export const FinanceGoals = () => {
  const { t } = useLanguage();
  const { store, dispatch } = useGlobalReducer();

  const snapshot = useMemo(() => selectFinancialSnapshot(store), [store]);
  const goals = store?.goals?.goals || [];

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_GOAL_FORM);
  const [editingContrib, setEditingContrib] = useState(null); // goalId → inline edit

  const totalCommitted = useMemo(
    () => goals.reduce((sum, g) => sum + Number(g.monthlyContribution || 0), 0),
    [goals]
  );

  const daysLeft = remainingDaysInMonth();
  const globalRitmo = Number(snapshot.saldoLibre || 0) / daysLeft;

  const surplusAboveCommitted =
    snapshot.saldoLibre > totalCommitted && totalCommitted > 0;

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!form.name || !form.targetAmount) return;
    dispatch(
      addGoal({
        name: form.name,
        targetAmount: parseFloat(form.targetAmount) || 0,
        monthlyContribution: parseFloat(form.monthlyContribution) || 0,
        category: form.category,
        targetDate: form.targetDate || null
      })
    );
    // Record to aiMemory so Shodan / Cortana know about the new goal
    dispatch({
      type: 'actionHistory/record',
      payload: {
        hub: 'FinanceHub',
        actionType: 'add-goal',
        type: 'user-command',
        agent: 'user',
        description: `Nueva meta: ${form.name} — objetivo ${form.targetAmount}`,
        success: true
      }
    });
    setForm(EMPTY_GOAL_FORM);
    setShowForm(false);
  };

  const handleSetContrib = (goalId, amount) => {
    dispatch(setMonthlyContribution({ id: goalId, amount: parseFloat(amount) || 0 }));
    setEditingContrib(null);
  };

  return (
    <div className="finance-section-container">
      <header className="finance-section-header">
        <h1>{t('Metas')}</h1>
        <p>{t('Financial goals and suggested pace for the rest of the month.')}</p>
      </header>

      {/* KPI row */}
      <section className="finance-kpi-grid">
        <article className="finance-kpi-card saldo-libre">
          <span>{t('Saldo Libre')}</span>
          <strong>{Number(snapshot.saldoLibre || 0).toFixed(2)}</strong>
        </article>
        <article className="finance-kpi-card">
          <span>{t('Ahorros Comprometidos')}</span>
          <strong>{totalCommitted.toFixed(2)}</strong>
        </article>
        <article className="finance-kpi-card">
          <span>{t('Ritmo Sugerido Diario')}</span>
          <strong>{globalRitmo.toFixed(2)} / {t('day')}</strong>
        </article>
      </section>

      {/* Suggestion banner */}
      {surplusAboveCommitted && (
        <div className="goal-suggestion">
          💡 {t('Saldo Libre supera tus compromisos — considera aumentar tu aporte mensual.')}
        </div>
      )}

      {/* Goals list */}
      <section className="finance-panel" style={{ marginTop: 14 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ margin: 0 }}>{t('Mis Metas')}</h2>
          <button className="finance-action-btn" onClick={() => setShowForm((s) => !s)}>
            {showForm ? t('Cancelar') : `+ ${t('Add Goal')}`}
          </button>
        </div>

        {/* Add goal form */}
        {showForm && (
          <form className="finance-quick-form" onSubmit={handleAddGoal} style={{ marginBottom: 14 }}>
            <label>{t('Goal name')}
              <input
                value={form.name}
                onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))}
                placeholder="Ej: Auto, Vacaciones, Fondo Emergencia"
                required
              />
            </label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label>{t('Target Amount')}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.targetAmount}
                  onChange={(e) => setForm((p) => ({ ...p, targetAmount: e.target.value }))}
                  placeholder="10000"
                  required
                />
              </label>
              <label>{t('Monthly Contribution')}
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.monthlyContribution}
                  onChange={(e) => setForm((p) => ({ ...p, monthlyContribution: e.target.value }))}
                  placeholder="500"
                />
              </label>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
              <label>{t('Goal category')}
                <input
                  value={form.category}
                  onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))}
                  placeholder="Ahorro"
                />
              </label>
              <label>{t('Target date')} ({t('optional')})
                <input
                  type="date"
                  value={form.targetDate}
                  onChange={(e) => setForm((p) => ({ ...p, targetDate: e.target.value }))}
                />
              </label>
            </div>
            <button type="submit">{t('Save Goal')}</button>
          </form>
        )}

        {goals.length === 0 ? (
          <div className="finance-empty">{t('No goals yet. Add your first financial goal.')}</div>
        ) : (
          <ul className="finance-list" style={{ gap: 12 }}>
            {goals.map((goal) => {
              const target = Number(goal.targetAmount || 0);
              const saved = Number(goal.savedToDate || 0);
              const contrib = Number(goal.monthlyContribution || 0);
              const pct = target > 0 ? Math.min(100, (saved / target) * 100) : 0;
              const estimatedDate = projectCompletionDate(saved, target, contrib);
              const monthsLeft = contrib > 0 && target > saved
                ? Math.ceil((target - saved) / contrib)
                : null;

              return (
                <li key={goal.id} className="goal-item" style={{ display: 'grid', gap: 6 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <strong>{goal.name}</strong>
                      {goal.category && (
                        <span className="finance-agent-tag user" style={{ marginLeft: 8 }}>
                          {goal.category}
                        </span>
                      )}
                    </div>
                    <button
                      className="finance-action-btn finance-action-btn-sm finance-action-btn-danger"
                      onClick={() => dispatch(deleteGoal(goal.id))}
                    >
                      ✕
                    </button>
                  </div>

                  {/* Progress bar */}
                  <div className="goal-progress-bar-bg">
                    <div
                      className="goal-progress-bar-fill"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                  <div className="finance-list-meta" style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span>{saved.toFixed(2)} / {target.toFixed(2)}</span>
                    <span>{pct.toFixed(1)}%</span>
                  </div>

                  {/* Monthly contribution */}
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span className="finance-list-meta">{t('Monthly Contribution')}:</span>
                    {editingContrib === goal.id ? (
                      <ContribEditor
                        defaultValue={contrib}
                        onSave={(v) => handleSetContrib(goal.id, v)}
                        onCancel={() => setEditingContrib(null)}
                      />
                    ) : (
                      <>
                        <span className="goal-ritmo">{contrib.toFixed(2)}</span>
                        <button
                          className="finance-action-btn finance-action-btn-sm"
                          onClick={() => setEditingContrib(goal.id)}
                        >
                          ✎
                        </button>
                      </>
                    )}
                  </div>

                  {/* Fecha de Logro */}
                  {estimatedDate && (
                    <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                      <span className="finance-list-meta">{t('Fecha de Logro')}:</span>
                      <span className="goal-date-badge">{estimatedDate}</span>
                      {monthsLeft && (
                        <span className="finance-list-meta">({monthsLeft} {t('months')})</span>
                      )}
                    </div>
                  )}
                  {pct >= 100 && (
                    <span className="finance-agent-tag jarvis">✓ {t('Meta Completada')}</span>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
};

const ContribEditor = ({ defaultValue, onSave, onCancel }) => {
  const [val, setVal] = useState(String(defaultValue));
  return (
    <span style={{ display: 'flex', gap: 4 }}>
      <input
        type="number"
        min="0"
        step="0.01"
        value={val}
        onChange={(e) => setVal(e.target.value)}
        style={{
          width: 80,
          padding: '2px 6px',
          background: '#27272a',
          border: '1px solid #3f3f46',
          borderRadius: 6,
          color: '#f4f4f5',
          fontSize: '0.85rem'
        }}
      />
      <button className="finance-action-btn finance-action-btn-sm" onClick={() => onSave(val)}>✓</button>
      <button className="finance-action-btn finance-action-btn-sm" onClick={onCancel}>✕</button>
    </span>
  );
};

export default FinanceGoals;