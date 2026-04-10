import './Dashboard.css';
import { useMemo } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';

const DAY_MS = 24 * 60 * 60 * 1000;

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return 'Buenos dias';
  if (hour < 19) return 'Buenas tardes';
  return 'Buenas noches';
};

const parseDateMs = (value) => {
  if (!value) return NaN;
  const ms = new Date(value).getTime();
  return Number.isFinite(ms) ? ms : NaN;
};

const formatCurrency = (value, currency) => {
  const n = Number(value || 0);
  return new Intl.NumberFormat('es-MX', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(n);
};

export const Dashboard = () => {
  const { t } = useLanguage();

  const identity = useSelector((state) => state.userIdentity || state.identity || {});
  const tasks = useSelector((state) => state.tasks?.tasks || []);
  const wallets = useSelector((state) => state.wallets || {});
  const checkins = useSelector((state) => state.checkins?.checkins || []);
  const routines = useSelector((state) => state.routines?.routines || []);
  const lastVerdict = useSelector((state) => state.aiMemory?.lastVerdict || null);

  const greeting = useMemo(() => getGreeting(), []);
  const userName = useMemo(() => {
    const preferred = identity?.preferredName;
    const first = identity?.firstName;
    const name = preferred || first || 'Operador';
    const normalized = String(name).trim();
    return normalized || 'Operador';
  }, [identity?.preferredName, identity?.firstName]);

  // 2) Card Cortana — datos reales desde tasksSlice
  const cortanaData = useMemo(() => {
    const now = Date.now();
    const normalized = (Array.isArray(tasks) ? tasks : []).filter(Boolean);

    const pending = normalized.filter((task) => {
      const status = String(task.status || '').toLowerCase();
      return !status.includes('complet');
    });

    const critical = pending.filter((task) => String(task.level || '').toLowerCase() === 'critical');
    const overdue = pending.filter((task) => {
      const dueMs = parseDateMs(task.dueDate);
      return Number.isFinite(dueMs) && dueMs < now;
    });

    return {
      criticalCount: critical.length,
      overdueCount: overdue.length,
      summary:
        critical.length + overdue.length > 0
          ? `${critical.length} criticas · ${overdue.length} vencidas`
          : 'Sin alertas críticas por ahora',
    };
  }, [tasks]);

  // 2) Card Jarvis + 4) Resumen financiero — walletsSlice
  const jarvisData = useMemo(() => {
    const walletMXN = Number(wallets.walletMXN || 0);
    const walletUSD = Number(wallets.walletUSD || 0);

    return {
      walletMXN,
      walletUSD,
      hasData: walletMXN !== 0 || walletUSD !== 0,
    };
  }, [wallets.walletMXN, wallets.walletUSD]);

  // 2) Card SHODAN — checkinsSlice + routinesSlice
  const shodanData = useMemo(() => {
    const list = (Array.isArray(checkins) ? checkins : []).filter(Boolean);

    let latest = null;
    let latestMs = Number.NEGATIVE_INFINITY;
    list.forEach((entry) => {
      const ms = parseDateMs(entry.createdAt || entry.date);
      if (Number.isFinite(ms) && ms > latestMs) {
        latest = entry;
        latestMs = ms;
      }
    });

    const todayIndex = new Date().getDay();
    const routinesToday = (Array.isArray(routines) ? routines : []).filter((routine) => {
      if (!routine || routine.archived) return false;
      const days = Array.isArray(routine.daysOfWeek) ? routine.daysOfWeek : [];
      return days.includes(todayIndex);
    });

    return {
      latestCheckin: latest,
      latestCheckinLabel: latest ? new Date(latest.createdAt || latest.date).toLocaleString('es-MX') : 'Sin check-ins',
      routinesTodayCount: routinesToday.length,
      routinesToday,
    };
  }, [checkins, routines]);

  // 3) Tareas urgentes — maximo 3, solo si hay datos
  const urgentTasks = useMemo(() => {
    const now = Date.now();

    const pending = (Array.isArray(tasks) ? tasks : []).filter((task) => {
      const status = String(task?.status || '').toLowerCase();
      return !status.includes('complet');
    });

    const ranked = pending
      .filter((task) => {
        const isCritical = String(task.level || '').toLowerCase() === 'critical';
        const dueMs = parseDateMs(task.dueDate);
        const isOverdue = Number.isFinite(dueMs) && dueMs < now;
        return isCritical || isOverdue;
      })
      .sort((a, b) => {
        const aCritical = String(a.level || '').toLowerCase() === 'critical' ? 1 : 0;
        const bCritical = String(b.level || '').toLowerCase() === 'critical' ? 1 : 0;
        if (aCritical !== bCritical) return bCritical - aCritical;

        const aDue = parseDateMs(a.dueDate);
        const bDue = parseDateMs(b.dueDate);
        if (!Number.isFinite(aDue) && !Number.isFinite(bDue)) return 0;
        if (!Number.isFinite(aDue)) return 1;
        if (!Number.isFinite(bDue)) return -1;
        return aDue - bDue;
      })
      .slice(0, 3);

    return ranked;
  }, [tasks]);

  // 5) Ultimo veredicto — solo ultimas 24h
  const recentVerdict = useMemo(() => {
    if (!lastVerdict?.timestamp) return null;
    const ts = Number(lastVerdict.timestamp);
    if (!Number.isFinite(ts)) return null;
    if (Date.now() - ts > DAY_MS) return null;
    return lastVerdict;
  }, [lastVerdict]);

  return (
    <div className="dashboard-v2 dashboard-root">
      {/* 1) SALUDO CONTEXTUAL */}
      <section className="db-section db-greeting" aria-label={t('Saludo contextual')}>
        <h1>{`${greeting}, ${userName}`}</h1>
        <p>{t('Panel ejecutivo de hoy con estado real de agentes, tareas, finanzas y contexto personal.')}</p>
      </section>

      {/* 2) CARDS DE LOS 3 AGENTES */}
      <section className="db-section" aria-label={t('Estado de agentes')}>
        <h2>{t('Estado de Agentes')}</h2>
        <div className="agent-grid dashboard-agent-cards">
          <article className="agent-card">
            <header>
              <h3 className="agent-card-name">Cortana</h3>
              <span className="agent-role">Work Intel</span>
            </header>
            <div className="agent-metrics agent-card-metrics">
              <div><span className="metric-secondary">Críticas</span><strong className="metric-danger">{cortanaData.criticalCount}</strong></div>
              <div><span className="metric-secondary">Vencidas</span><strong className="metric-value">{cortanaData.overdueCount}</strong></div>
            </div>
            <p>{cortanaData.summary}</p>
          </article>

          <article className="agent-card">
            <header>
              <h3 className="agent-card-name">Jarvis</h3>
              <span className="agent-role">Finance Intel</span>
            </header>
            <div className="agent-metrics agent-card-metrics">
              <div><span className="metric-secondary">Wallet MXN</span><strong className="metric-value">{formatCurrency(jarvisData.walletMXN, 'MXN')}</strong></div>
              <div><span className="metric-secondary">Wallet USD</span><strong className="metric-value">{formatCurrency(jarvisData.walletUSD, 'USD')}</strong></div>
            </div>
            <p>{jarvisData.hasData ? 'Balance dual actualizado desde walletsSlice.' : 'Sin movimientos financieros registrados.'}</p>
          </article>

          <article className="agent-card">
            <header>
              <h3 className="agent-card-name">SHODAN</h3>
              <span className="agent-role">Personal Intel</span>
            </header>
            <div className="agent-metrics agent-card-metrics">
              <div><span className="metric-secondary">Último check-in</span><strong className="metric-ok">{shodanData.latestCheckin ? 'Registrado' : 'N/A'}</strong></div>
              <div><span className="metric-secondary">Rutinas hoy</span><strong className="metric-value">{shodanData.routinesTodayCount}</strong></div>
            </div>
            <p>{shodanData.latestCheckinLabel}</p>
          </article>
        </div>
      </section>

      {/* 3) TAREAS URGENTES */}
      {urgentTasks.length > 0 && (
        <section className="db-section" aria-label={t('Tareas urgentes')}>
          <h2>{t('Tareas Urgentes')}</h2>
          <ul className="urgent-list">
            {urgentTasks.map((task) => (
              <li key={task.id} className="urgent-item">
                <div>
                  <strong>{task.title || 'Tarea sin título'}</strong>
                  <p>
                    {(task.level || 'Sin prioridad')} · {task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-MX') : 'Sin fecha'}
                  </p>
                </div>
                <span className="mono">{task.totalScore != null ? `PS ${task.totalScore}/14` : 'PS N/A'}</span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* 4) RESUMEN FINANCIERO */}
      {jarvisData.hasData && (
        <section className="db-section" aria-label={t('Resumen financiero')}>
          <h2>{t('Resumen Financiero')}</h2>
          <div className="finance-grid">
            <article className="finance-card">
              <span>Wallet MXN</span>
              <strong>{formatCurrency(jarvisData.walletMXN, 'MXN')}</strong>
            </article>
            <article className="finance-card">
              <span>Wallet USD</span>
              <strong>{formatCurrency(jarvisData.walletUSD, 'USD')}</strong>
            </article>
          </div>
        </section>
      )}

      {/* 5) ÚLTIMO VEREDICTO */}
      {recentVerdict && (
        <section className="db-section" aria-label={t('Último veredicto')}>
          <h2>{t('Último Veredicto')}</h2>
          <article className="verdict-card">
            <p>{recentVerdict.summary || recentVerdict.text}</p>
            <footer>
              <span>Prioridad: {recentVerdict.priority || 'N/A'}</span>
              <span>{new Date(recentVerdict.timestamp).toLocaleString('es-MX')}</span>
            </footer>
          </article>
        </section>
      )}

      {/* 6) Sin sección de hubs: accesos ya están en Navbar */}
    </div>
  );
};
