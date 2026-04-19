import './Dashboard.css';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import { DashboardCollapsible } from '../components/Dashboard/DashboardCollapsible';

const DAY_MS = 24 * 60 * 60 * 1000;
const EMPTY_ARRAY = Object.freeze([]);
const EMPTY_OBJECT = Object.freeze({});

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

  const identity = useSelector((state) => state.userSettings ?? state.userIdentity ?? EMPTY_OBJECT);
  const tasks = useSelector((state) => state.tasks?.tasks ?? EMPTY_ARRAY);
  const wallets = useSelector((state) => state.wallets ?? EMPTY_OBJECT);
  const debts = useSelector((state) => state.debts ?? EMPTY_OBJECT);
  const calendarEvents = useSelector((state) => state.calendar?.events ?? EMPTY_ARRAY);
  const checkins = useSelector((state) => state.checkins?.checkins ?? EMPTY_ARRAY);
  const routines = useSelector((state) => state.routines?.routines ?? EMPTY_ARRAY);
  const lastVerdict = useSelector((state) => state.aiMemory?.lastVerdict || null);

  const [activeAgentIndex, setActiveAgentIndex] = useState(0);
  const rotationTimerRef = useRef(null);

  const greeting = useMemo(() => getGreeting(), []);

  useEffect(() => {
    if (rotationTimerRef.current) {
      clearInterval(rotationTimerRef.current);
    }

    rotationTimerRef.current = setInterval(() => {
      setActiveAgentIndex((prev) => (prev + 1) % 3);
    }, 8000);

    return () => {
      if (rotationTimerRef.current) {
        clearInterval(rotationTimerRef.current);
        rotationTimerRef.current = null;
      }
    };
  }, []);

  const userName = useMemo(() => {
    const preferred = identity?.preferredName;
    const first = identity?.firstName;
    const baseName = identity?.name;
    const displayName = identity?.displayName;
    const fallbackTitle = identity?.title || identity?.preferredTitle || 'Operador';
    const name = preferred || first || baseName || displayName || fallbackTitle;
    const normalized = String(name).trim();
    return normalized || fallbackTitle;
  }, [identity?.preferredName, identity?.firstName, identity?.name, identity?.displayName, identity?.title, identity?.preferredTitle]);

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

  const upcomingEvents = useMemo(() => {
    const now = Date.now();

    const normalized = (Array.isArray(calendarEvents) ? calendarEvents : [])
      .filter(Boolean)
      .map((event) => {
        const startRaw = event.startDate || event.start || event.date;
        const startMs = parseDateMs(startRaw);
        return {
          id: event.id || `event-${String(startRaw || '')}`,
          title: event.title || 'Evento',
          startMs,
          startLabel: Number.isFinite(startMs)
            ? new Date(startMs).toLocaleString('es-MX', {
                day: '2-digit',
                month: 'short',
                hour: '2-digit',
                minute: '2-digit',
              })
            : 'Fecha no disponible',
          source: event.provider || event.relatedType || 'local',
        };
      })
      .filter((event) => Number.isFinite(event.startMs) && event.startMs >= now)
      .sort((a, b) => a.startMs - b.startMs)
      .slice(0, 3);

    return normalized;
  }, [calendarEvents]);

  const emotionalSummary = useMemo(() => {
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

    const moodMap = {
      1: 'Muy bajo',
      2: 'Bajo',
      3: 'Estable',
      4: 'Bueno',
      5: 'Excelente',
    };

    const moodText = latest ? moodMap[latest.mood] || 'Sin clasificar' : 'Sin check-ins';
    const energyText = latest ? `${latest.energy || '-'} / 5` : '--';

    return {
      latest,
      moodText,
      energyText,
      checkinDate: latest ? new Date(latest.createdAt || latest.date).toLocaleDateString('es-MX') : 'No disponible',
    };
  }, [checkins]);

  const financeSummary = useMemo(() => {
    const walletMXN = Number(wallets?.walletMXN || 0);
    const walletUSD = Number(wallets?.walletUSD || 0);

    const debtsList = Array.isArray(debts?.items)
      ? debts.items
      : Array.isArray(debts?.debts)
        ? debts.debts
        : [];

    const totalDebt = debtsList.reduce((sum, debt) => sum + Number(debt?.amount || 0), 0);
    const totalApprox = walletMXN + walletUSD * 17.0 - totalDebt;

    return {
      walletMXN,
      walletUSD,
      totalDebt,
      totalApprox,
      hasData: walletMXN !== 0 || walletUSD !== 0 || totalDebt !== 0,
    };
  }, [wallets, debts]);

  const agentNames = useMemo(() => {
    const config = identity?.agentNames || {};
    return {
      jarvis: String(config.jarvis || 'JARVIS'),
      shodan: String(config.shodan || 'SHODAN'),
      cortana: String(config.cortana || 'CORTANA'),
    };
  }, [identity?.agentNames]);

  const rotatingCards = useMemo(
    () => [
      {
        key: 'jarvis',
        title: agentNames.jarvis,
        subtitle: t('Finance Intel'),
        insight: financeSummary.hasData
          ? `Liquidez MXN ${formatCurrency(financeSummary.walletMXN, 'MXN')} · Pasivo ${formatCurrency(financeSummary.totalDebt, 'MXN')}`
          : 'Sin movimientos financieros recientes.',
        action: 'Abrir FinanceHub para registrar y ajustar flujo.',
        badge: t('FINANCE'),
      },
      {
        key: 'shodan',
        title: agentNames.shodan,
        subtitle: t('Personal Intel'),
        insight: `Estado emocional: ${emotionalSummary.moodText} · Energía: ${emotionalSummary.energyText}`,
        action: 'Abrir PersonalHub para check-in rápido.',
        badge: t('PERSONAL'),
      },
      {
        key: 'cortana',
        title: agentNames.cortana,
        subtitle: t('Work Intel'),
        insight: `${cortanaData.criticalCount} críticas y ${cortanaData.overdueCount} vencidas detectadas.`,
        action: 'Abrir WorkHub y resolver tareas de prioridad alta.',
        badge: t('WORK'),
      },
    ],
    [agentNames, financeSummary, emotionalSummary, cortanaData]
  );

  const activeAgent = rotatingCards[activeAgentIndex] || rotatingCards[0];

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
      <section className="db-section db-greeting" aria-label={t('Saludo contextual')}>
        <h1>{`${greeting}, ${userName}`}</h1>
        <p>{t('Centro de mando ejecutivo con foco operativo para hoy.')}</p>
      </section>

      <section className="db-section" aria-label={t('Inteligencia rotativa')}>
        <div className="db-rotator-head">
          <h2>{t('Inteligencia de Agentes')}</h2>
          <div className="db-rotator-dots" role="tablist" aria-label={t('Estado de rotación')}>
            {rotatingCards.map((card, idx) => (
              <button
                key={card.key}
                type="button"
                className={`db-dot ${idx === activeAgentIndex ? 'is-active' : ''}`}
                onClick={() => setActiveAgentIndex(idx)}
                aria-label={`Ver ${card.title}`}
              />
            ))}
          </div>
        </div>
        <article key={`agent-${activeAgent.key}`} className="db-rotator-card" data-agent={activeAgent.key}>
          <header>
            <div>
              <h3>{activeAgent.title}</h3>
              <p>{activeAgent.subtitle}</p>
            </div>
            <span className="db-agent-badge">{activeAgent.badge}</span>
          </header>
          <strong className="db-rotator-insight">{activeAgent.insight}</strong>
          <p className="db-rotator-action">{activeAgent.action}</p>
        </article>
      </section>

      <section className="db-main-grid" aria-label={t('Panel principal')}>
        <DashboardCollapsible
          title="Tareas urgentes"
          subtitle={urgentTasks.length ? `${urgentTasks.length} ${t('tareas con riesgo inmediato')}` : t('Sin urgencias detectadas')}
          badge={urgentTasks.length ? String(urgentTasks.length) : null}
          defaultOpen
        >
          {urgentTasks.length ? (
            <ul className="urgent-list">
              {urgentTasks.map((task) => (
                <li key={task.id} className="urgent-item">
                  <div>
                    <strong>{task.title || t('Tarea sin título')}</strong>
                    <p>
                      {(task.level || t('Sin prioridad'))} · {task.dueDate ? new Date(task.dueDate).toLocaleDateString('es-MX') : t('Sin fecha')}
                    </p>
                  </div>
                  <span className="mono">{task.totalScore != null ? `${t('PS')} ${task.totalScore}/14` : `${t('PS')} ${t('N/A')}`}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="db-empty-copy">{t('No hay tareas críticas ni vencidas.')}</p>
          )}
        </DashboardCollapsible>

        <DashboardCollapsible
          title="Estado emocional"
          subtitle={`${t('Check-in')}: ${emotionalSummary.checkinDate}`}
          badge={shodanData.routinesTodayCount ? `${shodanData.routinesTodayCount} ${t('rutinas')}` : null}
          defaultOpen
        >
          <div className="db-kpi-grid">
            <article className="db-kpi-card">
              <span>{t('Ánimo')}</span>
              <strong>{emotionalSummary.moodText}</strong>
            </article>
            <article className="db-kpi-card">
              <span>{t('Energía')}</span>
              <strong>{emotionalSummary.energyText}</strong>
            </article>
          </div>
          <p className="db-block-note">{t('Rutinas programadas hoy:')} {shodanData.routinesTodayCount}</p>
        </DashboardCollapsible>

        <DashboardCollapsible
          title="Próximos eventos"
          subtitle="Calendario real sincronizado"
          badge={upcomingEvents.length ? String(upcomingEvents.length) : null}
        >
          {upcomingEvents.length ? (
            <ul className="db-event-list">
              {upcomingEvents.map((event) => (
                <li key={event.id} className="db-event-item">
                  <div>
                    <strong>{event.title}</strong>
                    <p>{event.startLabel}</p>
                  </div>
                  <span className="db-source-chip">{String(event.source).toUpperCase()}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="db-empty-copy">{t('No hay eventos próximos para las siguientes horas.')}</p>
          )}
        </DashboardCollapsible>

        <DashboardCollapsible
          title="Resumen financiero"
          subtitle="Flujo consolidado"
          badge={financeSummary.hasData ? t('LIVE') : null}
        >
          {financeSummary.hasData ? (
            <div className="finance-grid">
              <article className="finance-card">
                <span>{t('Saldo total aproximado')}</span>
                <strong>{formatCurrency(financeSummary.totalApprox, 'MXN')}</strong>
              </article>
              <article className="finance-card">
                <span>{t('Wallet MXN')}</span>
                <strong>{formatCurrency(financeSummary.walletMXN, 'MXN')}</strong>
              </article>
              <article className="finance-card">
                <span>{t('Wallet USD')}</span>
                <strong>{formatCurrency(financeSummary.walletUSD, 'USD')}</strong>
              </article>
              <article className="finance-card">
                <span>{t('Deuda total')}</span>
                <strong>{formatCurrency(financeSummary.totalDebt, 'MXN')}</strong>
              </article>
            </div>
          ) : (
            <p className="db-empty-copy">{t('Sin datos financieros suficientes para consolidado.')}</p>
          )}
        </DashboardCollapsible>
      </section>

      {recentVerdict && (
        <section className="db-section db-verdict-wrap" aria-label={t('Último veredicto')}>
          <h2>{t('Último Veredicto')}</h2>
          <article className="verdict-card">
            <span className="db-verdict-label">{t('Análisis estratégico')}</span>
            <p>{recentVerdict.summary || recentVerdict.text}</p>
            <footer>
              <span>{t('Prioridad')}: {recentVerdict.priority || t('N/A')}</span>
              <span>{new Date(recentVerdict.timestamp).toLocaleString('es-MX')}</span>
            </footer>
          </article>
        </section>
      )}

    </div>
  );
};
