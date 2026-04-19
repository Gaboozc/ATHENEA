import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { openOmnibarExternally } from '../Omnibar/useOmnibar';
import { DailyBriefingService } from '../../services/DailyBriefingService';

const HUB_ITEMS = {
  work: [
    { label: '→ Ir a Work Hub', path: '/work' },
    { label: 'Projects', path: '/projects' },
    { label: 'My Tasks', path: '/my-tasks' },
    { label: 'Collaborators', path: '/fleet' },
    { label: 'Intelligence', path: '/intelligence' },
    { label: 'Focus', path: '/focus' },
  ],
  personal: [
    { label: '→ Ir a Personal Hub', path: '/personal' },
    { label: 'Notes', path: '/notes' },
    { label: 'Todos', path: '/todos' },
    { label: 'Rutinas', path: '/routines' },
    { label: 'Journal', path: '/journal' },
    { label: 'Weekly Review', path: '/weekly-review' },
  ],
  finance: [
    { label: '→ Ir a Finance Hub', path: '/finance' },
    { label: 'Payments', path: '/payments' },
    { label: 'Billeteras', path: '/finance/wallets' },
    { label: 'History', path: '/finance/history' },
    { label: 'Goals', path: '/finance/goals' },
    { label: 'Budgeting', path: '/finance/budgeting' },
    { label: 'Deudas', path: '/finance/debts' },
  ],
  more: [
    { label: 'Dashboard', path: '/' },
    { label: 'Calendar', path: '/calendar' },
    { label: 'Stats', path: '/stats' },
    { label: 'Identity', path: '/identity' },
    { label: 'Settings', path: '/settings' },
    {
      label: '☀️ Daily Briefing',
      path: null,
      action: 'openBriefing'
    },
    { label: 'Asistente IA', path: null, action: 'openOmnibar' },
  ],
};

const HUB_COLORS = {
  work: '#667eea',
  personal: '#a78bfa',
  finance: '#ffb700',
  more: 'var(--accent)',
};

export function MobileHubSheet({ hub, onClose }) {
  const navigate = useNavigate();
  const items = HUB_ITEMS[hub] || [];
  const color = HUB_COLORS[hub] || 'var(--accent)';
  const briefingPending = DailyBriefingService.shouldShowBriefing();

  useEffect(() => {
    const handler = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleNav = (path) => {
    navigate(path);
    onClose();
  };

  const handleAction = (action) => {
    if (action === 'openBriefing') {
      openOmnibarExternally('☀️ briefing');
      onClose();
      return;
    }

    if (action === 'openOmnibar') {
      openOmnibarExternally();
      onClose();
    }
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(5, 8, 16, 0.7)',
          backdropFilter: 'blur(4px)',
          zIndex: 'var(--z-modal)',
          animation: 'athenea-fade-in 0.15s ease',
        }}
      />

      <div
        style={{
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          background: 'var(--bg-panel)',
          borderTop: `2px solid ${color}`,
          borderRadius: 'var(--radius-xl) var(--radius-xl) 0 0',
          zIndex: 'calc(var(--z-modal) + 1)',
          padding: '8px 0',
          paddingBottom: 'max(80px, env(safe-area-inset-bottom, 80px))',
          animation: 'athenea-slide-up 0.2s ease',
        }}
      >
        <div
          style={{
            width: '36px',
            height: '4px',
            background: 'var(--border-strong)',
            borderRadius: 'var(--radius-pill)',
            margin: '8px auto 12px',
          }}
        />

        {items.map((item, i) => (
          <button
            key={item.path || item.action || item.label}
            onClick={() => {
              if (item.path) handleNav(item.path);
              else if (item.action) handleAction(item.action);
            }}
            style={{
              display: 'block',
              width: '100%',
              padding: '13px 24px',
              background: 'transparent',
              border: 'none',
              textAlign: 'left',
              color: i === 0 ? color : 'var(--text-secondary)',
              fontSize: 'var(--text-md)',
              fontFamily: 'var(--font-body)',
              fontWeight: i === 0 ? 600 : 400,
              cursor: 'pointer',
              transition: 'all var(--transition-fast)',
            }}
            onTouchStart={(e) => {
              e.currentTarget.style.background = 'var(--bg-panel-alt)';
              e.currentTarget.style.color = 'var(--text-primary)';
            }}
            onTouchEnd={(e) => {
              e.currentTarget.style.background = 'transparent';
            }}
          >
            {item.action === 'openBriefing' && briefingPending
              ? `${item.label} • pendiente`
              : item.label}
          </button>
        ))}
      </div>
    </>
  );
}
