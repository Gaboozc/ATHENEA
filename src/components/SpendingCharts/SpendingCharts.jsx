import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../../context/LanguageContext';
import './SpendingCharts.css';

const COLORS = [
  '#667eea', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6',
  '#06b6d4', '#ec4899', '#84cc16', '#f97316', '#6366f1',
];

const getLastNMonths = (n) => {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' }),
    });
  }
  return months;
};

export const SpendingCharts = ({ selectedMonth }) => {
  const { t } = useLanguage();
  const expenses = useSelector((s) => s.budget?.expenses || []);
  const categories = useSelector((s) => s.budget?.categories || []);
  const [view, setView] = useState('donut');

  const last6 = useMemo(() => getLastNMonths(6), []);
  const activeMonthKey = selectedMonth || last6[last6.length - 1].key;

  /* Donut — group by categoryId → category name/color */
  const byCategory = useMemo(() => {
    const monthExpenses = expenses.filter(
      (e) => (e.date || '').slice(0, 7) === activeMonthKey
    );
    return categories
      .map((cat, i) => ({
        name: cat.name,
        currency: cat.currency || 'MXN',
        color: cat.color || COLORS[i % COLORS.length],
        amount: monthExpenses
          .filter((e) => e.categoryId === cat.id)
          .reduce((s, e) => s + Number(e.amount || 0), 0),
      }))
      .filter((c) => c.amount > 0)
      .sort((a, b) => b.amount - a.amount);
  }, [expenses, categories, activeMonthKey]);

  const totalThisMonth = byCategory.reduce((s, c) => s + c.amount, 0);

  /* Bars — last 6 months, dual-currency MXN / USD */
  const monthlyTotals = useMemo(() => {
    return last6.map(({ key, label }) => {
      const mxn = expenses
        .filter(
          (e) =>
            (e.date || '').slice(0, 7) === key &&
            (e.currency || 'MXN') === 'MXN'
        )
        .reduce((s, e) => s + Number(e.amount || 0), 0);
      const usd = expenses
        .filter(
          (e) =>
            (e.date || '').slice(0, 7) === key && e.currency === 'USD'
        )
        .reduce((s, e) => s + Number(e.amount || 0), 0);
      return { key, label, mxn, usd };
    });
  }, [expenses, last6]);

  const maxVal = Math.max(...monthlyTotals.map((m) => Math.max(m.mxn, m.usd)), 1);

  /* SVG donut */
  const RADIUS = 70;
  const CIRC = 2 * Math.PI * RADIUS;
  let offset = 0;
  const donutSegments = byCategory.map((cat) => {
    const pct = totalThisMonth > 0 ? cat.amount / totalThisMonth : 0;
    const len = pct * CIRC;
    const seg = { ...cat, pct, len, offset };
    offset += len;
    return seg;
  });

  if (expenses.length === 0) {
    return (
      <section className="spending-charts-section">
        <div className="spending-charts-header">
          <h2>{t('Spending Charts')}</h2>
        </div>
        <div className="spending-charts-empty">
          <p>{t('No expenses recorded this month.')}</p>
          <small>{t('Expenses will appear here once registered.')}</small>
        </div>
      </section>
    );
  }

  return (
    <section className="spending-charts-section">
      <div className="spending-charts-header">
        <h2>{t('Spending Charts')}</h2>
        <div className="spending-charts-toggle">
          <button
            className={view === 'donut' ? 'active' : ''}
            onClick={() => setView('donut')}
          >
            {t('Por categoría')}
          </button>
          <button
            className={view === 'bars' ? 'active' : ''}
            onClick={() => setView('bars')}
          >
            {t('Últimos 6 meses')}
          </button>
        </div>
      </div>

      {view === 'donut' && (
        <div className="spending-donut-container">
          {byCategory.length === 0 ? (
            <div className="spending-charts-empty">
              <p>{t('Sin gastos este mes.')}</p>
            </div>
          ) : (
            <>
              <svg
                width="180"
                height="180"
                className="spending-donut-svg"
                viewBox="0 0 180 180"
              >
                <circle
                  cx="90"
                  cy="90"
                  r={RADIUS}
                  fill="none"
                  stroke="rgba(255,255,255,0.07)"
                  strokeWidth="20"
                />
                {donutSegments.map((seg, i) => (
                  <circle
                    key={i}
                    cx="90"
                    cy="90"
                    r={RADIUS}
                    fill="none"
                    stroke={seg.color}
                    strokeWidth="20"
                    strokeDasharray={`${seg.len} ${CIRC - seg.len}`}
                    strokeDashoffset={-seg.offset + CIRC / 4}
                    transform="rotate(-90 90 90)"
                  />
                ))}
                <text
                  x="90"
                  y="86"
                  textAnchor="middle"
                  className="spending-donut-center-label"
                >
                  Total
                </text>
                <text
                  x="90"
                  y="104"
                  textAnchor="middle"
                  className="spending-donut-center-amount"
                >
                  {totalThisMonth.toFixed(0)}
                </text>
              </svg>

              <ul className="spending-legend">
                {byCategory.map((cat) => (
                  <li key={cat.name} className="spending-legend-item">
                    <span
                      className="spending-legend-dot"
                      style={{ background: cat.color }}
                    />
                    <span className="spending-legend-name">{cat.name}</span>
                    <span className="spending-legend-currency">
                      {cat.currency}
                    </span>
                    <span className="spending-legend-amount">
                      {cat.amount.toFixed(0)}
                    </span>
                    <span className="spending-legend-pct">
                      {totalThisMonth > 0
                        ? ((cat.amount / totalThisMonth) * 100).toFixed(0)
                        : 0}
                      %
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}

      {view === 'bars' && (
        <div className="spending-bars-container">
          {monthlyTotals.map(({ key, label, mxn, usd }) => (
            <div key={key} className="spending-bar-group">
              <span className="spending-bar-month-label">{label}</span>
              <div className="spending-bar-tracks">
                <div className="spending-bar-track-row">
                  <span className="spending-bar-currency-tag mxn">MXN</span>
                  <div className="spending-bar-track">
                    <div
                      className="spending-bar-fill mxn"
                      style={{ width: `${(mxn / maxVal) * 100}%` }}
                    />
                  </div>
                  <span className="spending-bar-amount">{mxn.toFixed(0)}</span>
                </div>
                {usd > 0 && (
                  <div className="spending-bar-track-row">
                    <span className="spending-bar-currency-tag usd">USD</span>
                    <div className="spending-bar-track">
                      <div
                        className="spending-bar-fill usd"
                        style={{ width: `${(usd / maxVal) * 100}%` }}
                      />
                    </div>
                    <span className="spending-bar-amount">{usd.toFixed(0)}</span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default SpendingCharts;
