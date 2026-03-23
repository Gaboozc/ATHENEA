import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useTasks } from '../context/TasksContext';
import { useLanguage } from '../context/LanguageContext';
import {
  markRead,
  markAllRead,
  dismissNotification,
  clearDismissed,
  selectAllNotifications,
  selectUnreadCount,
  selectBySource,
} from '../store/slices/notificationsSlice';
import './Notifications.css';

const URGENCY_COLOR = {
  low:      'var(--color-success)',
  medium:   'var(--accent-gold)',
  high:     '#FF9800',
  critical: 'var(--color-danger, #F44336)',
};

const AGENT_COLOR = {
  Cortana: '#667eea',
  Jarvis:  '#f3c54a',
  SHODAN:  '#41d467',
};

const AGENT_ICON = {
  Cortana: '🧿',
  Jarvis:  '🤖',
  SHODAN:  '👁️',
};

const SOURCE_ICON = { agent: '🤖', reminder: '🔔', system: '⚙️', widget: '📱' };

/* ── Helper ── */
function diffLabel(diffDays, t) {
  if (diffDays < 0) return t('Overdue');
  if (diffDays === 0) return t('Due today');
  if (diffDays === 1) return t('In 1 day');
  return `+${diffDays}d`;
}

function timeAgo(ts) {
  const diff = Math.floor((Date.now() - ts) / 1000);
  if (diff < 60)  return 'ahora';
  if (diff < 3600) return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
}

/* ── Tab: Recordatorios ── */
function RemindersTab({ t }) {
  const { tasks } = useTasks();
  const { notes }    = useSelector((s) => s.notes);
  const { todos }    = useSelector((s) => s.todos);
  const { payments } = useSelector((s) => s.payments);

  const items = useMemo(() => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const build = (item, type, dateField, route) => {
      const raw = item[dateField];
      if (!raw) return null;
      const due = new Date(raw);
      if (Number.isNaN(due.getTime())) return null;
      due.setHours(0, 0, 0, 0);
      const diffDays = Math.ceil((due - today) / 86400000);
      if (diffDays > 7) return null;
      return { id: item.id, title: item.title || item.name || t('Untitled'), type, due, diffDays, route };
    };

    const criticals = tasks
      .filter((t) => t.level === 'Critical')
      .map((task) => ({
        id: `critical-${task.id}`,
        title: task.title,
        type: 'critical',
        due: null,
        diffDays: 0,
        extra: `PS ${task.totalScore ?? '?'}/14`,
      }));

    return [
      ...notes.map((n) => build(n, 'note', 'reminderDate', '/notes')),
      ...todos.map((t) => build(t, 'todo', 'dueDate', '/todos')),
      ...payments.map((p) => build(p, 'payment', 'nextDueDate', '/payments')),
      ...criticals,
    ]
      .filter(Boolean)
      .sort((a, b) => (a.diffDays ?? 0) - (b.diffDays ?? 0));
  }, [notes, todos, payments, tasks, t]);

  const TYPE_ICON = { note: '📝', todo: '✅', payment: '💳', critical: '🚨' };
  const TYPE_COLOR = { note: '#667eea', todo: '#41d467', payment: '#f3c54a', critical: '#F44336' };

  if (items.length === 0) {
    return <div className="notif-empty">🎯 {t('No upcoming reminders.')}</div>;
  }

  return (
    <ul className="notif-list">
      {items.map((item) => (
        <li
          key={item.id}
          className="notif-row"
          style={{ borderLeft: `3px solid ${TYPE_COLOR[item.type] ?? '#666'}` }}
        >
          <span className="notif-source-icon">{TYPE_ICON[item.type] ?? '🔔'}</span>
          <div className="notif-content">
            <span className="notif-title">{item.title}</span>
            {item.due && (
              <span className="notif-meta">{item.due.toLocaleDateString()}</span>
            )}
            {item.extra && <span className="notif-meta">{item.extra}</span>}
          </div>
          <span
            className="notif-badge"
            style={{ color: item.diffDays < 0 ? '#F44336' : 'var(--accent-gold)' }}
          >
            {item.extra ? '' : diffLabel(item.diffDays, t)}
          </span>
        </li>
      ))}
    </ul>
  );
}

/* ── Tab: Agentes ── */
function AgentsTab({ t }) {
  const dispatch   = useDispatch();
  const agentNotifsSelector = useMemo(() => selectBySource('agent'), []);
  const notifications = useSelector(agentNotifsSelector);

  if (notifications.length === 0) {
    return <div className="notif-empty">🤖 {t('No agent notifications yet.')}</div>;
  }

  return (
    <ul className="notif-list">
      {notifications.map((n) => {
        const color = AGENT_COLOR[n.agentName] ?? 'var(--accent-cyan)';
        const icon  = AGENT_ICON[n.agentName] ?? SOURCE_ICON.agent;
        return (
          <li
            key={n.id}
            className={`notif-row${n.read ? ' notif-read' : ''}`}
            style={{ borderLeft: `3px solid ${color}` }}
            onClick={() => dispatch(markRead(n.id))}
          >
            <span className="notif-source-icon">{icon}</span>
            <div className="notif-content">
              <div className="notif-agent-header">
                <span className="notif-agent-name" style={{ color }}>{n.agentName ?? 'Agent'}</span>
                <span
                  className="notif-urgency-dot"
                  style={{ background: URGENCY_COLOR[n.urgency] }}
                  title={n.urgency}
                />
                {!n.read && <span className="notif-unread-dot" />}
              </div>
              <span className="notif-title">{n.title !== n.agentName ? n.title : ''}</span>
              <span className="notif-body">{n.body}</span>
            </div>
            <div className="notif-actions">
              <span className="notif-time">{timeAgo(n.timestamp)}</span>
              <button
                className="notif-dismiss-btn"
                onClick={(e) => { e.stopPropagation(); dispatch(dismissNotification(n.id)); }}
                title={t('Dismiss')}
              >✕</button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}

/* ── Tab: Sistema ── */
function SystemTab({ t }) {
  const dispatch = useDispatch();
  const systemNotifsSelector  = useMemo(() => selectBySource('system'), []);
  const widgetNotifsSelector  = useMemo(() => selectBySource('widget'), []);
  const systemNotifs  = useSelector(systemNotifsSelector);
  const widgetNotifs  = useSelector(widgetNotifsSelector);
  const notifications = [...systemNotifs, ...widgetNotifs].sort((a, b) => b.timestamp - a.timestamp);

  const sensorData = useSelector((s) => s.sensorData);
  const battery    = sensorData?.battery;
  const network    = sensorData?.network;

  const liveAlerts = useMemo(() => {
    const alerts = [];
    if (battery?.percentage <= 15 && battery?.isCharging === false) {
      alerts.push({ id: 'battery-low', icon: '🔋', title: t('Low battery'), body: `${battery.percentage}%`, urgency: 'high' });
    }
    if (network?.isConnected === false) {
      alerts.push({ id: 'no-network', icon: '📡', title: t('No internet connection'), body: t('Some features may be limited'), urgency: 'medium' });
    }
    return alerts;
  }, [battery, network, t]);

  if (notifications.length === 0 && liveAlerts.length === 0) {
    return <div className="notif-empty">⚙️ {t('No system alerts.')}</div>;
  }

  return (
    <ul className="notif-list">
      {liveAlerts.map((a) => (
        <li key={a.id} className="notif-row" style={{ borderLeft: `3px solid ${URGENCY_COLOR[a.urgency]}` }}>
          <span className="notif-source-icon">{a.icon}</span>
          <div className="notif-content">
            <span className="notif-title">{a.title}</span>
            <span className="notif-body">{a.body}</span>
          </div>
          <span className="notif-badge" style={{ color: URGENCY_COLOR[a.urgency] }}>{a.urgency}</span>
        </li>
      ))}
      {notifications.map((n) => (
        <li
          key={n.id}
          className={`notif-row${n.read ? ' notif-read' : ''}`}
          style={{ borderLeft: `3px solid ${URGENCY_COLOR[n.urgency] ?? '#666'}` }}
          onClick={() => dispatch(markRead(n.id))}
        >
          <span className="notif-source-icon">{SOURCE_ICON[n.source]}</span>
          <div className="notif-content">
            <span className="notif-title">{n.title}</span>
            <span className="notif-body">{n.body}</span>
          </div>
          <div className="notif-actions">
            <span className="notif-time">{timeAgo(n.timestamp)}</span>
            <button
              className="notif-dismiss-btn"
              onClick={(e) => { e.stopPropagation(); dispatch(dismissNotification(n.id)); }}
              title={t('Dismiss')}
            >✕</button>
          </div>
        </li>
      ))}
    </ul>
  );
}

/* ══ Main Component ══════════════════════════════════════════════════════ */
export const Notifications = () => {
  const dispatch    = useDispatch();
  const { t }       = useLanguage();
  const [tab, setTab] = useState('reminders');

  const allNotifs  = useSelector(selectAllNotifications);
  const unreadCount = useSelector(selectUnreadCount);

  const agentCount  = allNotifs.filter((n) => n.source === 'agent'  && !n.read).length;
  const systemCount = allNotifs.filter((n) => (n.source === 'system' || n.source === 'widget') && !n.read).length;

  const tabs = [
    { key: 'reminders', label: t('Reminders'),  icon: '🔔' },
    { key: 'agents',    label: t('Agents'),      icon: '🤖', badge: agentCount },
    { key: 'system',    label: t('System'),      icon: '⚙️', badge: systemCount },
  ];

  return (
    <div className="notifications-container">
      <header className="notifications-header">
        <div className="notif-header-row">
          <h1>
            {t('Notifications')}
            {unreadCount > 0 && <span className="notif-total-badge">{unreadCount}</span>}
          </h1>
          <div className="notif-header-actions">
            <button className="notif-action-btn" onClick={() => dispatch(markAllRead())}>
              {t('Mark all read')}
            </button>
            <button className="notif-action-btn notif-action-btn--danger" onClick={() => dispatch(clearDismissed())}>
              {t('Clear dismissed')}
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div className="notif-tabs">
        {tabs.map((tb) => (
          <button
            key={tb.key}
            className={`notif-tab${tab === tb.key ? ' active' : ''}`}
            onClick={() => setTab(tb.key)}
          >
            {tb.icon} {tb.label}
            {tb.badge > 0 && <span className="notif-tab-badge">{tb.badge}</span>}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="notif-tab-content">
        {tab === 'reminders' && <RemindersTab t={t} />}
        {tab === 'agents'    && <AgentsTab    t={t} />}
        {tab === 'system'    && <SystemTab    t={t} />}
      </div>
    </div>
  );
};
