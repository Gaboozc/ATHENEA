import { useMemo } from 'react';
import { useSelector } from 'react-redux';

/**
 * useFinancialCalendar
 *
 * Aggregates financial data from three store slices into a per-day map
 * so the Calendar can paint visual indicators without any direct DOM coupling.
 *
 * Returns: { [dateStr: 'YYYY-MM-DD']: DayMeta }
 *
 * DayMeta {
 *   pendingCommitments: Payment[]   – pending payments whose nextDueDate is this day
 *   expenseTotal: number            – total money moved (budget expenses + income)
 *   activityCount: number           – number of actual financial transactions
 *   agents: {
 *     Jarvis: ActionEntry[],
 *     Shodan: ActionEntry[],
 *     Cortana: ActionEntry[],
 *     user: ActionEntry[]
 *   }
 * }
 */

const toDateStr = (value) => {
  if (!value) return null;
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return null;
  return d.toISOString().split('T')[0];
};

const ensureDay = (map, dateStr) => {
  if (!map[dateStr]) {
    map[dateStr] = {
      pendingCommitments: [],
      expenseTotal: 0,
      activityCount: 0,
      agents: { Jarvis: [], Shodan: [], Cortana: [], user: [] }
    };
  }
  return map[dateStr];
};

export const useFinancialCalendar = () => {
  const payments  = useSelector((s) => s?.payments?.payments  || []);
  const expenses  = useSelector((s) => s?.budget?.expenses    || []);
  const history   = useSelector((s) => s?.aiMemory?.actionHistory || []);

  return useMemo(() => {
    const map = {};

    // ── 1. Pending commitments (blue dot) ────────────────────────────────
    //   Any payment with status !== 'paid' → paint its nextDueDate
    payments
      .filter((p) => {
        const status = p?.status === 'paid' ||
          (typeof p?.paid === 'boolean' && p.paid) ? 'paid' : 'pending';
        return status !== 'paid';
      })
      .forEach((p) => {
        const dateStr = toDateStr(p.nextDueDate);
        if (!dateStr) return;
        ensureDay(map, dateStr).pendingCommitments.push(p);
      });

    // ── 2. Budget expenses → transaction heat (amber dot) ─────────────────
    expenses.forEach((e) => {
      const dateStr = toDateStr(e.date);
      if (!dateStr) return;
      const meta = ensureDay(map, dateStr);
      meta.expenseTotal += Number(e.amount || 0);
      meta.activityCount++;
    });

    // ── 3. Paid / recorded payment transactions ────────────────────────────
    payments
      .filter((p) => p.lastPaidAt)
      .forEach((p) => {
        const dateStr = toDateStr(p.lastPaidAt);
        if (!dateStr) return;
        const meta = ensureDay(map, dateStr);
        meta.expenseTotal += Number(p.amount || 0);
        meta.activityCount++;
      });

    // ── 4. aiMemory actionHistory → agent attribution ─────────────────────
    //   Only FinanceHub entries. Agent stored in entry.agent or detected from text.
    history
      .filter((e) => e.hub === 'FinanceHub')
      .forEach((e) => {
        const dateStr = toDateStr(e.timestamp);
        if (!dateStr) return;
        const meta = ensureDay(map, dateStr);

        const agentKey = e.agent && ['Jarvis', 'Shodan', 'Cortana'].includes(e.agent)
          ? e.agent
          : 'user';

        meta.agents[agentKey].push(e);
      });

    return map;
  }, [payments, expenses, history]);
};

export default useFinancialCalendar;
