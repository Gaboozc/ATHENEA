import React, { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import './StatsPage.css';

const calcStreak = (dates) => {
  if (!dates.length) return 0;
  const unique = Array.from(new Set(dates)).sort().reverse();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  let streak = 0;
  let cursor = new Date(today);
  for (const d of unique) {
    const day = new Date(d);
    day.setHours(0, 0, 0, 0);
    const diff = Math.round((cursor - day) / 86400000);
    if (diff === 0 || diff === 1) { streak += 1; cursor = day; }
    else break;
  }
  return streak;
};

const StatCard = ({ icon, value, label, accent }) => (
  <div className="stat-card" style={{ '--card-accent': accent }}>
    <div className="stat-card-icon">{icon}</div>
    <div className="stat-card-value">{value}</div>
    <div className="stat-card-label">{label}</div>
  </div>
);

const StatsPage = () => {
  const { t } = useLanguage();

  const tasks        = useSelector((s) => s.tasks?.tasks || []);
  const todos        = useSelector((s) => s.todos?.todos || []);
  const notes        = useSelector((s) => s.notes?.notes || []);
  const routines     = useSelector((s) => s.routines?.routines || []);
  const focusMinutes = useSelector((s) => s.focus?.totalMinutes || 0);
  const journalEntries = useSelector((s) => s.journal?.entries || []);
  const checkins     = useSelector((s) => s.checkins?.checkins || []);
  const goals        = useSelector((s) => s.goals?.goals || []);
  const projects     = useSelector((s) => s.projects?.projects || []);
  const expenses     = useSelector((s) => s.budget?.expenses || []);
  const walletUSD    = useSelector((s) => s.wallets?.walletUSD || 0);
  const walletMXN    = useSelector((s) => s.wallets?.walletMXN || 0);
  const savingsUSD   = useSelector((s) => s.wallets?.savingsUSD || 0);
  const savingsMXN   = useSelector((s) => s.wallets?.savingsMXN || 0);
  const collaborators = useSelector((s) => s.collaborators?.collaborators || []);

  const d = useMemo(() => {
    const completedTasks   = tasks.filter((t) => t.status === 'completed' || t.status === 'Completed').length;
    const pendingTasks     = tasks.filter((t) => t.status !== 'completed' && t.status !== 'Completed' && t.status !== 'deleted').length;
    const completedTodos   = todos.filter((t) => t.status === 'done').length;
    const completedGoals   = goals.filter((g) => Number(g.savedToDate || 0) >= Number(g.targetAmount || 1)).length;
    const completedProjs   = projects.filter((p) => p.status === 'completed' || p.status === 'Completed').length;
    const activeProjs      = projects.filter((p) => p.status !== 'completed' && p.status !== 'Completed' && p.status !== 'cancelled').length;
    const focusHours       = Math.floor(focusMinutes / 60);
    const focusMin         = focusMinutes % 60;
    const journalDays      = new Set(journalEntries.map((e) => String(e.date || e.createdAt || '').slice(0, 10))).size;
    const checkInDays      = checkins.map((c) => c.date);
    const streak           = calcStreak(checkInDays);
    const avgMood          = checkins.length
      ? (checkins.reduce((s, c) => s + Number(c.mood || 0), 0) / checkins.length).toFixed(1)
      : null;
    const totalExpensesMXN = expenses.filter((e) => (e.currency || 'MXN') === 'MXN').reduce((s, e) => s + Number(e.amount || 0), 0);
    const totalExpensesUSD = expenses.filter((e) => e.currency === 'USD').reduce((s, e) => s + Number(e.amount || 0), 0);
    const activeRoutines   = routines.filter((r) => !r.archived).length;
    const completedRoutinesToday = routines.filter((r) => {
      const today = new Date().toISOString().slice(0, 10);
      return Array.isArray(r.completedDates) && r.completedDates.includes(today);
    }).length;

    return {
      completedTasks, pendingTasks, completedTodos, completedGoals,
      completedProjs, activeProjs, focusHours, focusMin, journalDays,
      streak, avgMood, totalExpensesMXN, totalExpensesUSD,
      activeRoutines, completedRoutinesToday,
      totalNotes: notes.length, totalTasks: tasks.length,
      totalGoals: goals.length, totalTodos: todos.length,
      totalExpensesCount: expenses.length, totalCheckins: checkins.length,
    };
  }, [tasks, todos, goals, projects, focusMinutes, journalEntries, checkins, expenses, notes, routines]);

  const fmtMXN = (n) => Number(n).toLocaleString('es-MX', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  const fmtUSD = (n) => Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 });

  return (
    <div className="stats-page">
      <div className="stats-header">
        <h1>📊 {t('Estadísticas')}</h1>
        <p>{t('Tu progreso real — calculado desde tus datos.')}</p>
      </div>

      {/* SECCIÓN WORK */}
      <section className="stats-section">
        <h2 className="stats-section-title">
          <span className="stats-section-icon">💼</span> {t('Trabajo')}
        </h2>
        <div className="stats-grid">
          <StatCard icon="✅" value={d.completedTasks} label={t('Tareas completadas')} accent="var(--color-success, #22c55e)" />
          <StatCard icon="📋" value={d.pendingTasks}   label={t('Tareas pendientes')}  accent="var(--accent-cyan, #1ec9ff)" />
          <StatCard icon="📁" value={d.activeProjs}    label={t('Proyectos activos')}   accent="var(--accent-gold, #f59e0b)" />
          <StatCard icon="🏁" value={d.completedProjs} label={t('Proyectos terminados')} accent="var(--color-success, #22c55e)" />
          <StatCard icon="👥" value={collaborators.length} label={t('Colaboradores')}  accent="#8b5cf6" />
          <StatCard
            icon="⏱️"
            value={d.focusHours > 0 ? `${d.focusHours}h ${d.focusMin}m` : `${d.focusMin}m`}
            label={t('Tiempo de enfoque')}
            accent="var(--accent-cyan, #1ec9ff)"
          />
        </div>
      </section>

      {/* SECCIÓN PERSONAL */}
      <section className="stats-section">
        <h2 className="stats-section-title">
          <span className="stats-section-icon">🧠</span> {t('Personal')}
        </h2>
        <div className="stats-grid">
          <StatCard icon="🔥" value={d.streak}        label={t('Racha actual (días)')}  accent="#ef4444" />
          <StatCard icon="📓" value={d.journalDays}   label={t('Días con journal')}      accent="#8b5cf6" />
          <StatCard icon="📝" value={d.totalNotes}    label={t('Notas creadas')}          accent="var(--accent-cyan, #1ec9ff)" />
          <StatCard icon="☑️" value={d.completedTodos} label={t('Todos completados')}    accent="var(--color-success, #22c55e)" />
          <StatCard icon="🔄" value={d.activeRoutines} label={t('Rutinas activas')}      accent="var(--accent-gold, #f59e0b)" />
          <StatCard icon="📅" value={d.totalCheckins} label={t('Total check-ins')}        accent="#8b5cf6" />
          {d.avgMood !== null && (
            <StatCard icon="😊" value={`${d.avgMood}/5`} label={t('Mood promedio')}       accent="#f472b6" />
          )}
          <StatCard icon="✅" value={`${d.completedRoutinesToday}/${d.activeRoutines}`} label={t('Rutinas hoy')} accent="var(--color-success, #22c55e)" />
        </div>
      </section>

      {/* SECCIÓN FINANZAS */}
      <section className="stats-section">
        <h2 className="stats-section-title">
          <span className="stats-section-icon">💰</span> {t('Finanzas')}
        </h2>
        <div className="stats-grid">
          <StatCard icon="💵" value={`$${fmtUSD(walletUSD)}`}  label={t('Saldo USD')}        accent="var(--accent-gold, #f59e0b)" />
          <StatCard icon="💴" value={`$${fmtMXN(walletMXN)}`}  label={t('Saldo MXN')}        accent="var(--accent-cyan, #1ec9ff)" />
          <StatCard icon="🏦" value={`$${fmtUSD(savingsUSD)}`} label={t('Ahorros USD')}       accent="var(--color-success, #22c55e)" />
          <StatCard icon="🏦" value={`$${fmtMXN(savingsMXN)}`} label={t('Ahorros MXN')}       accent="var(--color-success, #22c55e)" />
          <StatCard icon="🎯" value={`${d.completedGoals}/${d.totalGoals}`} label={t('Metas alcanzadas')} accent="var(--accent-gold, #f59e0b)" />
          <StatCard icon="💸" value={d.totalExpensesCount}     label={t('Gastos registrados')} accent="#ef4444" />
          {d.totalExpensesMXN > 0 && (
            <StatCard icon="📊" value={`$${fmtMXN(d.totalExpensesMXN)}`} label={t('Total gastos MXN')} accent="#ef4444" />
          )}
          {d.totalExpensesUSD > 0 && (
            <StatCard icon="📊" value={`$${fmtUSD(d.totalExpensesUSD)}`} label={t('Total gastos USD')} accent="#ef4444" />
          )}
        </div>
      </section>
    </div>
  );
};

export default StatsPage;
