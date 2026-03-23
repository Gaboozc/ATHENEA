import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../../context/LanguageContext';
import './CashFlowProjection.css';

const MONTHS_AHEAD = 6;

export const CashFlowProjection = () => {
  const { t } = useLanguage();
  const payments   = useSelector((s) => s.payments?.payments || []);
  const debts      = useSelector((s) => s.debts?.debts || []);
  const wallets    = useSelector((s) => s.wallets);

  const referenceRate = wallets?.referenceRate || 0;

  /* Average monthly income from last 3 months of wallet transactions */
  const { avgMonthlyIncomeMXN, avgMonthlyIncomeUSD } = useMemo(() => {
    const transactions = wallets?.transactions || [];
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - 3);

    const recent = transactions.filter((t) => {
      const d = new Date(t.date || t.createdAt || 0);
      return d >= cutoff;
    });

    const totalIncomeMXN = recent
      .filter((t) => t.type === 'income_mxn')
      .reduce((s, t) => s + Number(t.amountMXN || 0), 0);
    const totalIncomeUSD = recent
      .filter((t) => t.type === 'income_usd')
      .reduce((s, t) => s + Number(t.amountUSD || 0), 0);

    return {
      avgMonthlyIncomeMXN: totalIncomeMXN / 3,
      avgMonthlyIncomeUSD: totalIncomeUSD / 3,
    };
  }, [wallets]);

  /* Monthly recurring commitments from debts */
  const { monthlyDebtMXN, monthlyDebtUSD } = useMemo(() => {
    const active = debts.filter((d) => d.status === 'active');
    return {
      monthlyDebtMXN: active
        .filter((d) => (d.currency || 'MXN') === 'MXN')
        .reduce((s, d) => s + Number(d.paymentAmount || 0), 0),
      monthlyDebtUSD: active
        .filter((d) => d.currency === 'USD')
        .reduce((s, d) => s + Number(d.paymentAmount || 0), 0),
    };
  }, [debts]);

  /* Monthly recurring payments from paymentsSlice */
  const { recurringMXN, recurringUSD } = useMemo(() => {
    const recurring = payments.filter(
      (p) =>
        (p.type || '') !== 'income' &&
        (p.frequency === 'monthly' || p.frequency === 'recurring') &&
        p.status !== 'cancelled'
    );
    return {
      recurringMXN: recurring
        .filter((p) => (p.currency || 'MXN') !== 'USD')
        .reduce((s, p) => s + Number(p.amount || 0), 0),
      recurringUSD: recurring
        .filter((p) => p.currency === 'USD')
        .reduce((s, p) => s + Number(p.amount || 0), 0),
    };
  }, [payments]);

  /* 6-month forward projection */
  const projection = useMemo(() => {
    return Array.from({ length: MONTHS_AHEAD }, (_, i) => {
      const d = new Date();
      d.setMonth(d.getMonth() + i + 1);
      const monthKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const monthName = d.toLocaleDateString('es-MX', { month: 'short', year: '2-digit' });

      const totalCommitmentsMXN =
        recurringMXN +
        monthlyDebtMXN +
        (referenceRate > 0 ? (recurringUSD + monthlyDebtUSD) * referenceRate : 0);

      const totalIncomeMXN =
        avgMonthlyIncomeMXN +
        (referenceRate > 0 ? avgMonthlyIncomeUSD * referenceRate : 0);

      const netMXN = totalIncomeMXN - totalCommitmentsMXN;

      return {
        monthKey,
        monthName,
        incomeMXN: totalIncomeMXN,
        commitmentsMXN: totalCommitmentsMXN,
        netMXN,
        isPositive: netMXN >= 0,
      };
    });
  }, [avgMonthlyIncomeMXN, avgMonthlyIncomeUSD, recurringMXN, recurringUSD, monthlyDebtMXN, monthlyDebtUSD, referenceRate]);

  /* Not enough data */
  const hasHistory = (wallets?.transactions || []).length > 0 || avgMonthlyIncomeMXN > 0;
  if (!hasHistory && payments.length === 0 && debts.length === 0) {
    return (
      <section className="cashflow-section">
        <h2>💹 {t('Cash Flow Projection')}</h2>
        <div className="projection-empty">
          <p>
            {t('Registra tus ingresos y gastos durante al menos un mes para activar la proyección de flujo de caja.')}
          </p>
        </div>
      </section>
    );
  }

  const maxAbsolute = Math.max(
    ...projection.map((m) => Math.max(m.incomeMXN, m.commitmentsMXN, Math.abs(m.netMXN))),
    1
  );

  return (
    <section className="cashflow-section">
      <h2>💹 {t('Cash Flow Projection')}</h2>
      <p className="cashflow-subtitle">
        {t('Próximos')} {MONTHS_AHEAD} {t('meses — basado en compromisos actuales')}
      </p>

      <div className="cashflow-chart">
        {projection.map(({ monthKey, monthName, incomeMXN, commitmentsMXN, netMXN, isPositive }) => {
          const inflowH = Math.round((incomeMXN / maxAbsolute) * 80);
          const outflowH = Math.round((commitmentsMXN / maxAbsolute) * 80);
          const netH = Math.round((Math.abs(netMXN) / maxAbsolute) * 80);

          return (
            <div
              key={monthKey}
              className={`cashflow-month ${isPositive ? 'cashflow-ok' : 'cashflow-danger'}`}
            >
              <div className="cashflow-bars">
                <div
                  className="cashflow-bar cashflow-inflow"
                  style={{ height: `${Math.max(inflowH, 2)}px` }}
                  title={`${t('Ingresos')}: ${incomeMXN.toFixed(0)} MXN`}
                />
                <div
                  className="cashflow-bar cashflow-outflow"
                  style={{ height: `${Math.max(outflowH, 2)}px` }}
                  title={`${t('Compromisos')}: ${commitmentsMXN.toFixed(0)} MXN`}
                />
                <div
                  className={`cashflow-bar cashflow-net ${isPositive ? 'pos' : 'neg'}`}
                  style={{ height: `${Math.max(netH, 2)}px` }}
                  title={`${t('Neto')}: ${netMXN.toFixed(0)} MXN`}
                />
              </div>
              <div className="cashflow-month-label">{monthName}</div>
              <div className={`cashflow-month-net ${isPositive ? 'text-ok' : 'text-danger'}`}>
                {isPositive ? '▲' : '▼'} {Math.abs(netMXN).toFixed(0)}
              </div>
            </div>
          );
        })}
      </div>

      <div className="cashflow-legend">
        <span className="cashflow-legend-item">
          <span className="cashflow-legend-dot inflow" /> {t('Ingresos')}
        </span>
        <span className="cashflow-legend-item">
          <span className="cashflow-legend-dot outflow" /> {t('Compromisos')}
        </span>
        <span className="cashflow-legend-item">
          <span className="cashflow-legend-dot net" /> {t('Neto')}
        </span>
      </div>

      <table className="cashflow-table">
        <thead>
          <tr>
            <th>{t('Mes')}</th>
            <th>{t('Ingresos')}</th>
            <th>{t('Compromisos')}</th>
            <th>{t('Neto')}</th>
          </tr>
        </thead>
        <tbody>
          {projection.map(({ monthKey, monthName, incomeMXN, commitmentsMXN, netMXN, isPositive }) => (
            <tr key={monthKey} className={isPositive ? 'row-ok' : 'row-danger'}>
              <td>{monthName}</td>
              <td>{incomeMXN.toFixed(0)}</td>
              <td>{commitmentsMXN.toFixed(0)}</td>
              <td className={isPositive ? 'text-ok' : 'text-danger'}>
                {isPositive ? '+' : ''}{netMXN.toFixed(0)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <p className="cashflow-disclaimer">
        {t('Proyección basada en el promedio de los últimos 3 meses. No incluye ingresos variables ni gastos imprevistos.')}
      </p>
    </section>
  );
};

export default CashFlowProjection;
