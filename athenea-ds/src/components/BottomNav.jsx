import { useState } from 'react'

/* ============================================================
   ATHENEA — BottomNav (mobile / Capacitor)
   Props:
     items       — array of { id, label, icon: ReactNode, badge? }
     activeItem  — current id
     onChange(id)
   ============================================================ */

export default function BottomNav({
  items = [
    { id: 'work',     label: 'Work',     icon: <HomeIcon /> },
    { id: 'personal', label: 'Personal', icon: <UserIcon /> },
    { id: 'finance',  label: 'Finance',  icon: <DollarIcon />, badge: true },
    { id: 'agents',   label: 'Agents',   icon: <AgentsIcon /> },
    { id: 'settings', label: 'Config',   icon: <SettingsIcon /> },
  ],
  activeItem = 'work',
  onChange = () => {},
}) {
  const [pressed, setPressed] = useState(null)

  return (
    <nav style={{
      display: 'flex', justifyContent: 'space-around',
      padding: '8px var(--space-3)',
      background: 'var(--bg-surface)',
      borderTop: '1px solid var(--border-default)',
      fontFamily: 'var(--font-body)',
      position: 'relative',
      // Safe area for iOS notch
      paddingBottom: 'max(8px, env(safe-area-inset-bottom))',
    }}>
      {/* Top glow line */}
      <div style={{
        position: 'absolute', top: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--accent-border), transparent)',
        pointerEvents: 'none',
      }} />

      {items.map(item => {
        const isActive = item.id === activeItem
        return (
          <button
            key={item.id}
            onClick={() => onChange(item.id)}
            onMouseDown={() => setPressed(item.id)}
            onMouseUp={() => setPressed(null)}
            onTouchStart={() => setPressed(item.id)}
            onTouchEnd={() => setPressed(null)}
            style={{
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px',
              padding: '7px 16px',
              borderRadius: 'var(--radius-md)',
              background: isActive ? 'var(--accent-dim)' : 'transparent',
              border: 'none', cursor: 'pointer',
              position: 'relative',
              transform: pressed === item.id ? 'scale(0.92)' : 'scale(1)',
              transition: 'all var(--transition-fast)',
            }}
          >
            <span style={{
              display: 'flex',
              color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
              transition: 'color var(--transition-fast)',
            }}>
              {item.icon}
            </span>
            <span style={{
              fontSize: '9px', letterSpacing: '0.05em',
              color: isActive ? 'var(--accent)' : 'var(--text-tertiary)',
              fontWeight: isActive ? 500 : 400,
              transition: 'color var(--transition-fast)',
            }}>
              {item.label}
            </span>
            {item.badge && (
              <span style={{
                position: 'absolute', top: '5px', right: '11px',
                width: '6px', height: '6px', borderRadius: '50%',
                background: 'var(--color-danger)',
                border: '1.5px solid var(--bg-surface)',
              }} />
            )}
          </button>
        )
      })}
    </nav>
  )
}

/* ── SVG Icons ────────────────────────────────────────────── */
function HomeIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
      <polyline points="9 22 9 12 15 12 15 22"/>
    </svg>
  )
}
function UserIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
      <circle cx="12" cy="7" r="4"/>
    </svg>
  )
}
function DollarIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  )
}
function AgentsIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M12 1v4M12 19v4M4.22 4.22l2.83 2.83M16.95 16.95l2.83 2.83M1 12h4M19 12h4M4.22 19.78l2.83-2.83M16.95 7.05l2.83-2.83"/>
    </svg>
  )
}
function SettingsIcon() {
  return (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" viewBox="0 0 24 24">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  )
}

/* ── Usage ──────────────────────────────────────────────────

const [tab, setTab] = useState('work')

<BottomNav activeItem={tab} onChange={setTab} />

// Capacitor: fix to bottom inside app layout
<div style={{ display: 'flex', flexDirection: 'column', height: '100vh' }}>
  <div style={{ flex: 1, overflowY: 'auto' }}>
    {/* page content }
  </div>
  <BottomNav activeItem={tab} onChange={setTab} />
</div>

─────────────────────────────────────────────────────────── */
