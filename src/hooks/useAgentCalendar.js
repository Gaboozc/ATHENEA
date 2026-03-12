import { useMemo } from 'react';
import { useSelector } from 'react-redux';

/**
 * useAgentCalendar
 *
 * Aggregates ALL data sources into a per-day map so the Calendar can render
 * a full Agent Command Center view. Replaces useFinancialCalendar with a
 * comprehensive multi-domain, multi-agent feed.
 *
 * Returns: { [dateStr: 'YYYY-MM-DD']: DayMeta }
 *
 * DayMeta {
 *   items: AgendaItem[]         – all entities for this day (sorted by type)
 *   jarvis: {
 *     pressureLevel: 'none'|'low'|'high',
 *     payments: Payment[],      – pending payments due on this day
 *     goals: Goal[],            – goal deadlines on this day
 *   }
 *   cortana: {
 *     workloadLevel: 'none'|'low'|'medium'|'high',
 *     tasks: Task[],
 *     projects: ProjectMarker[],
 *     todos: Todo[],
 *   }
 *   shodan: {
 *     routines: Routine[],
 *     habitDone: boolean,       – true if any routine was completed on this day
 *   }
 *   // Legacy fields kept for FinanceDaySummary backward-compat
 *   pendingCommitments: Payment[]
 *   expenseTotal: number
 *   activityCount: number
 *   agents: { Jarvis: [], Shodan: [], Cortana: [], user: [] }
 * }
 */

const toDateStr = (v) => {
  if (!v) return null;
  const d = new Date(v);
  return isNaN(d.getTime()) ? null : d.toISOString().split('T')[0];
};

const ensureDay = (map, dateStr) => {
  if (!map[dateStr]) {
    map[dateStr] = {
      items: [],
      jarvis:  { pressureLevel: 'none', payments: [], goals: [] },
      cortana: { workloadLevel: 'none', tasks: [], projects: [], todos: [] },
      shodan:  { routines: [], habitDone: false },
      pendingCommitments: [],
      expenseTotal: 0,
      activityCount: 0,
      agents: { Jarvis: [], Shodan: [], Cortana: [], user: [] },
    };
  }
  return map[dateStr];
};

const getWorkloadLevel = (count) =>
  count >= 4 ? 'high' : count >= 2 ? 'medium' : count >= 1 ? 'low' : 'none';

export const useAgentCalendar = () => {
  const events   = useSelector((s) => s?.calendar?.events    || []);
  const projects = useSelector((s) => s?.projects?.projects  || []);
  const tasks    = useSelector((s) => s?.tasks?.tasks        || []);
  const notes    = useSelector((s) => s?.notes?.notes        || []);
  const todos    = useSelector((s) => s?.todos?.todos        || []);
  const routines = useSelector((s) => s?.routines?.routines  || []);
  const payments = useSelector((s) => s?.payments?.payments  || []);
  const goals    = useSelector((s) => s?.goals?.goals        || []);
  const expenses = useSelector((s) => s?.budget?.expenses    || []);
  const history  = useSelector((s) => s?.aiMemory?.actionHistory || []);

  return useMemo(() => {
    const map = {};
    const todayStr = new Date().toISOString().split('T')[0];

    // ── 1. Calendar events (native + Google synced) ───────────────────
    events.forEach((ev) => {
      const start = toDateStr(ev.startDate);
      const end   = toDateStr(ev.endDate) || start;
      if (!start) return;

      const d = new Date(start);
      const endD = new Date(end);
      while (d <= endD) {
        const ds = d.toISOString().split('T')[0];
        const day = ensureDay(map, ds);
        day.items.push({
          id: `ev-${ev.id}-${ds}`,
          type: 'event',
          agent: null,
          title: ev.title,
          meta: ev,
          color: ev.color,
        });
        d.setDate(d.getDate() + 1);
      }
    });

    // ── 2. Projects (startDate + endDate/dueDate + range fill) ────────
    projects.forEach((proj) => {
      const name  = proj.name || proj.title || 'Project';
      const start = toDateStr(proj.startDate);
      const end   = toDateStr(proj.dueDate || proj.endDate);

      if (start) {
        const day = ensureDay(map, start);
        day.items.push({ id: `${proj.id}-start`, type: 'project-start', agent: 'Cortana', title: `▶ ${name}`, meta: proj });
        day.cortana.projects.push({ ...proj, _marker: 'start' });
      }
      if (end) {
        const day = ensureDay(map, end);
        day.items.push({ id: `${proj.id}-end`, type: 'project-end', agent: 'Cortana', title: `🏁 ${name}`, meta: proj });
        day.cortana.projects.push({ ...proj, _marker: 'end' });
      }
      // Fill in-range days for workload coloring (no item entry, just marker)
      if (start && end && start < end) {
        const d = new Date(start);
        d.setDate(d.getDate() + 1);
        const endD = new Date(end);
        while (d < endD) {
          const ds = d.toISOString().split('T')[0];
          const day = ensureDay(map, ds);
          if (!day.cortana.projects.some((p) => p.id === proj.id)) {
            day.cortana.projects.push({ ...proj, _marker: 'active' });
          }
          d.setDate(d.getDate() + 1);
        }
      }
    });

    // ── 3. Tasks (dueDate → Cortana) ──────────────────────────────────
    tasks
      .filter((t) => t.status !== 'done' && t.status !== 'completed')
      .forEach((task) => {
        const ds = toDateStr(task.dueDate);
        if (!ds) return;
        const day = ensureDay(map, ds);
        const overdue = ds < todayStr;
        day.items.push({
          id: `task-${task.id}`,
          type: 'task',
          agent: 'Cortana',
          title: `${overdue ? '⚠️' : '✅'} ${task.title}`,
          meta: task,
          overdue,
        });
        day.cortana.tasks.push(task);
      });

    // ── 4. Notes with reminderDate ────────────────────────────────────
    notes
      .filter((n) => n.reminderDate)
      .forEach((note) => {
        const ds = toDateStr(note.reminderDate);
        if (!ds) return;
        const day = ensureDay(map, ds);
        day.items.push({ id: `note-${note.id}`, type: 'note', agent: null, title: `📝 ${note.title}`, meta: note });
      });

    // ── 5. Todos (dueDate → Cortana) ──────────────────────────────────
    todos
      .filter((t) => t.status !== 'done')
      .forEach((todo) => {
        const ds = toDateStr(todo.dueDate);
        if (!ds) return;
        const day = ensureDay(map, ds);
        day.items.push({ id: `todo-${todo.id}`, type: 'todo', agent: 'Cortana', title: `📌 ${todo.title}`, meta: todo });
        day.cortana.todos.push(todo);
      });

    // ── 6. Routines – mark lastCompleted dates (Shodan) ───────────────
    // Recurring dots per weekday are rendered at display time; here we only
    // mark which days a user actually completed their routines.
    routines.forEach((routine) => {
      const lastDs = toDateStr(routine.lastCompleted);
      if (!lastDs) return;
      const day = ensureDay(map, lastDs);
      if (!day.shodan.routines.some((r) => r.id === routine.id)) {
        day.shodan.routines.push({ ...routine, _completed: true });
      }
      day.shodan.habitDone = true;
    });

    // ── 7. Payments – pending (nextDueDate → Jarvis) ──────────────────
    payments
      .filter((p) => p.status !== 'paid' && !(typeof p.paid === 'boolean' && p.paid))
      .forEach((p) => {
        const ds = toDateStr(p.nextDueDate);
        if (!ds) return;
        const day = ensureDay(map, ds);
        day.items.push({
          id: `pay-${p.id}`,
          type: 'payment',
          agent: 'Jarvis',
          title: `💳 ${p.name}`,
          amount: p.amount,
          currency: p.currency,
          meta: p,
        });
        day.jarvis.payments.push(p);
        day.pendingCommitments.push(p);
      });

    // ── 8. Goals with targetDate (→ Jarvis) ───────────────────────────
    goals
      .filter((g) => g.targetDate)
      .forEach((goal) => {
        const ds = toDateStr(goal.targetDate);
        if (!ds) return;
        const day = ensureDay(map, ds);
        day.items.push({ id: `goal-${goal.id}`, type: 'goal', agent: 'Jarvis', title: `🎯 ${goal.name}`, meta: goal });
        day.jarvis.goals.push(goal);
      });

    // ── 9. Budget expenses → financial heat ───────────────────────────
    expenses.forEach((e) => {
      const ds = toDateStr(e.date);
      if (!ds) return;
      const day = ensureDay(map, ds);
      day.expenseTotal += Number(e.amount || 0);
      day.activityCount++;
    });

    // ── 10. Paid payment transactions ─────────────────────────────────
    payments
      .filter((p) => p.lastPaidAt)
      .forEach((p) => {
        const ds = toDateStr(p.lastPaidAt);
        if (!ds) return;
        const day = ensureDay(map, ds);
        day.expenseTotal += Number(p.amount || 0);
        day.activityCount++;
      });

    // ── 11. AI action history → agent attribution ─────────────────────
    history
      .filter((e) => e.hub === 'FinanceHub')
      .forEach((e) => {
        const ds = toDateStr(e.timestamp);
        if (!ds) return;
        const day = ensureDay(map, ds);
        const agentKey =
          e.agent && ['Jarvis', 'Shodan', 'Cortana'].includes(e.agent) ? e.agent : 'user';
        day.agents[agentKey].push(e);
      });

    // ── 12. Compute derived agent pressure / workload levels ──────────
    Object.values(map).forEach((day) => {
      const jpCount = day.jarvis.payments.length * 2 + day.jarvis.goals.length;
      day.jarvis.pressureLevel = jpCount >= 4 ? 'high' : jpCount >= 1 ? 'low' : 'none';

      const cwCount =
        day.cortana.tasks.length +
        day.cortana.todos.length +
        day.cortana.projects.filter((p) => p._marker !== 'active').length;
      day.cortana.workloadLevel = getWorkloadLevel(cwCount);
    });

    return map;
  }, [events, projects, tasks, notes, todos, routines, payments, goals, expenses, history]);
};

export default useAgentCalendar;
