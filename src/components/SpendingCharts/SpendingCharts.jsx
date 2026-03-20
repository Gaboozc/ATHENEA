import { useMemo, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../../context/LanguageContext';
import './SpendingCharts.css';

const PALETTE = [
  '#1ec9ff', '#a855f7', '#22c55e', '#f59e0b',
  '#ef4444', '#ec4899', '#14b8a6', '#8b5cf6',
  '#f97316', '#0ea5e9',
];

const getLastNMonths = (n) => {
  const months = [];
  const now = new Date();
  for (let i = n - 1; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({
      key: `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`,
      label: d.toLocaleDateString(undefined, { month: 'short', year: '2-digit' }),
    });
  }
  return months;
};

export const SpendingCharts = ({ selectedMonth }) => {
  const { t } = useLanguage();
  const expenses = useSelector((s) => s.budget?.expenses || []);
  const categories = useSelector((s) => s.budget?.categories || []);

  const [view, setView] = useState('donut'); // 'donut' | 'bars'

  const last6 = useMemo(() => getLastNMonths(6), []);
  const defaultMonthKey = last6[last6.length - 1].key;
  const activeMonthKey = selectedMonth || defaultMonthKey;

  // Selected month spending by category (for donut)
  const byCategoryThisMonth = useMemo(() => {
    const map = {};
    expenses.forEach((e) => {
      if (!e.date?.startsWith(activeMonthKey)) return;
      const cat = e.category || t('Other');
      map[cat] = (map[cat] || 0) + Number(e.amount || 0);
    });
    return Object.entries(map)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount], i) => ({ name, amount, color: PALETTE[i % PALETTE.length] }));
  }, [expenses, activeMonthKey, t]);

  const totalThisMonth = byCategoryThisMonth.reduce((s, c) => s + c.amount, 0);

  // Monthly totals for bar chart
  const monthlyTotals = useMemo(() => {
    return last6.map(({ key, label }) => {
      const total = expenses
        .filter((e) => e.date?.startsWith(key))
        .reduce((s, e) => s + Number(e.amount || 0), 0);
      return { key, label, total };
    });
  }, [expenses, last6]);

  const maxMonthly = Math.max(...monthlyTotals.map((m) => m.total), 1);

  // SVG donut
  const RADIUS = 70;
  const CIRC = 2 * Math.PI * RADIUS;
  let offset = 0;
  const donutSegments = byCategoryThisMonth.map((cat) => {
    const pct = totalThisMonth > 0 ? cat.amount / totalThisMonth : 0;
    const len = pct * CIRC;
    const seg = { ...cat, pct, len, offset };
    offset += len;
    return seg;
  });

  if (expenses.length === 0) {
    return (
      <section className="spending-charts-section">
        <h2>📊 {t('Spending Charts')}</h2>
        <p className="spending-empty">{t('No expenses recorded yet.')}</p>
      </section>
    );
  }

  return (
    <section className="spending-charts-section">
      <div className="spending-charts-header">
        <h2>📊 {t('Spending Charts')}</h2>
        <div className="spending-view-toggle">
          <button
            className={`spending-view-btn ${view === 'donut' ? 'active' : ''}`}
            onClick={() => setView('donut')}
          >🍩</button>
          <button
            className={`spending-view-btn ${view === 'bars' ? 'active' : ''}`}
            onClick={() => setView('bars')}
          >📊</button>
        </div>
      </div>

      {view === 'donut' && (
        <div className="spending-donut-container">
          <svg width="180" height="180" className="spending-donut-svg">
            <circle cx="90" cy="90" r={RADIUS} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="20" />
            {totalThisMonth > 0 && donutSegments.map((seg, i) => (
              <circle
                key={i}
                cx="90" cy="90" r={RADIUS}
                fill="none"
                stroke={seg.color}
                strokeWidth="20"
                strokeDasharray={`${seg.len} ${CIRC - seg.len}`}
                strokeDashoffset={-seg.offset + CIRC / 4}
                transform="rotate(-90 90 90)"
              />
            ))}
            <text x="90" y="86" textAnchor="middle" className="spending-donut-total-label">Total</text>
            <text x="90" y="103" textAnchor="middle" className="spending-donut-total-amount">
              {totalThisMonth.toFixed(0)}
            </text>
          </svg>
          <ul className="spending-legend">
            {byCategoryThisMonth.map((cat) => (
              <li key={cat.name} className="spending-legend-item">
                <span className="spending-legend-dot" style={{ background: cat.color }} />
                <span className="spending-legend-name">{cat.name}</span>
                <span className="spending-legend-amount">{cat.amount.toFixed(0)}</span>
                <span className="spending-legend-pct">
                  {totalThisMonth > 0 ? ((cat.amount / totalThisMonth) * 100).toFixed(0) : 0}%
                </span>
              </li>
            ))}
          </ul>
        </div>
      )}

      {view === 'bars' && (
        <div className="spending-bars-container">
          {monthlyTotals.map(({ key, label, total }) => (
            <div key={key} className="spending-bar-row">
              <span className="spending-bar-label">{label}</span>
              <div className="spending-bar-track">
                <div
                  className="spending-bar-fill"
                  style={{ width: `${(total / maxMonthly) * 100}%` }}
                />
              </div>
              <span className="spending-bar-amount">{total.toFixed(0)}</span>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default SpendingCharts;
