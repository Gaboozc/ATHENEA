import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../../context/LanguageContext';
import './CashFlowProjection.css';

const MONTHS_AHEAD = 6;

const addMonths = (date, n) => {
  const d = new Date(date);
  d.setMonth(d.getMonth() + n);
  return d;
};

export const CashFlowProjection = () => {
  const { t } = useLanguage();
  const payments = useSelector((s) => s.payments?.payments || []);
  const snapshot = useSelector((s) => {
    // Try to get the saldo libre from financial snapshot or income/expenses
    const income = s.budget?.income?.reduce((sum, i) => sum + Number(i.amount || 0), 0) || 0;
    const monthlyExpenses =
      s.budget?.expenses
        ?.filter((e) => {
          const d = new Date(e.date);
          const now = new Date();
          return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear();
        })
        ?.reduce((sum, e) => sum + Number(e.amount || 0), 0) || 0;
    return { income, monthlyExpenses };
  });

  const months = useMemo(() => {
    const now = new Date();
    const result = [];

    for (let i = 0; i < MONTHS_AHEAD; i++) {
      const monthDate = addMonths(now, i);
      const monthKey = `${monthDate.getFullYear()}-${String(monthDate.getMonth() + 1).padStart(2, '0')}`;
      const label = monthDate.toLocaleDateString(undefined, { month: 'short', year: '2-digit' });

      // Scheduled payments that fall in this month
      const monthPayments = payments.filter((p) => {
        if (!p.nextDueDate) return false;
        const pd = new Date(p.nextDueDate);
        const pk = `${pd.getFullYear()}-${String(pd.getMonth() + 1).padStart(2, '0')}`;
        return pk === monthKey;
      });

      const outflow = monthPayments.reduce((sum, p) => sum + Number(p.amount || 0), 0);
      const inflow = snapshot.income;
      const net = inflow - outflow;

      result.push({ monthKey, label, inflow, outflow, net, payments: monthPayments });
    }

    return result;
  }, [payments, snapshot]);

  const maxAbsolute = Math.max(...months.map((m) => Math.max(Math.abs(m.net), m.inflow, m.outflow)), 1);

  if (payments.length === 0 && snapshot.income === 0) {
    return (
      <section className="cashflow-section">
        <h2>💹 {t('Cash Flow Projection')}</h2>
        <p className="cashflow-empty">{t('Add income and scheduled payments to see your projection.')}</p>
      </section>
    );
  }

  return (
    <section className="cashflow-section">
      <h2>💹 {t('Cash Flow Projection')}</h2>
      <p className="cashflow-subtitle">{t('Next')} {MONTHS_AHEAD} {t('months')}</p>

      <div className="cashflow-chart">
        {months.map(({ monthKey, label, inflow, outflow, net, payments: mPayments }) => {
          const isNegative = net < 0;
          const netHeight = Math.round((Math.abs(net) / maxAbsolute) * 80);
          const inflowHeight = Math.round((inflow / maxAbsolute) * 80);
          const outflowHeight = Math.round((outflow / maxAbsolute) * 80);

          return (
            <div key={monthKey} className={`cashflow-month ${isNegative ? 'cashflow-danger' : 'cashflow-ok'}`}>
              <div className="cashflow-bars">
                {/* Inflow bar */}
                <div
                  className="cashflow-bar cashflow-inflow"
                  style={{ height: `${inflowHeight}px` }}
                  title={`${t('Income')}: ${inflow.toFixed(0)}`}
                />
                {/* Outflow bar */}
                <div
                  className="cashflow-bar cashflow-outflow"
                  style={{ height: `${outflowHeight}px` }}
                  title={`${t('Payments')}: ${outflow.toFixed(0)}`}
                />
                {/* Net indicator */}
                <div
                  className={`cashflow-bar cashflow-net ${isNegative ? 'neg' : 'pos'}`}
                  style={{ height: `${netHeight}px` }}
                  title={`${t('Net')}: ${net.toFixed(0)}`}
                />
              </div>

              <div className="cashflow-month-label">{label}</div>
              <div className={`cashflow-month-net ${isNegative ? 'text-danger' : 'text-ok'}`}>
                {isNegative ? '▼' : '▲'} {Math.abs(net).toFixed(0)}
              </div>

              {mPayments.length > 0 && (
                <div className="cashflow-payment-dots">
                  {mPayments.slice(0, 3).map((p) => (
                    <span key={p.id} className="cashflow-dot" title={`${p.name}: ${p.amount}`} />
                  ))}
                  {mPayments.length > 3 && (
                    <span className="cashflow-dot-more">+{mPayments.length - 3}</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="cashflow-legend">
        <span className="cashflow-legend-item">
          <span className="cashflow-legend-dot inflow" /> {t('Income')}
        </span>
        <span className="cashflow-legend-item">
          <span className="cashflow-legend-dot outflow" /> {t('Payments')}
        </span>
        <span className="cashflow-legend-item">
          <span className="cashflow-legend-dot net" /> {t('Net')}
        </span>
      </div>
    </section>
  );
};

export default CashFlowProjection;
