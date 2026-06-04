import { useState } from 'react'

/* ============================================================
   ATHENEA — Navbar (desktop)
   Props:
     tabs       — array of { id, label }
     activeTab  — current tab id
     onTabChange(id)
     notifCount — number of unread notifications
     userInitials
     onNotifClick
     onAvatarClick
   ============================================================ */

export default function Navbar({
  tabs = [
    { id: 'work',     label: 'Work' },
    { id: 'personal', label: 'Personal' },
    { id: 'finance',  label: 'Finance' },
    { id: 'agents',   label: 'Agents' },
  ],
  activeTab = 'work',
  onTabChange = () => {},
  notifCount = 0,
  userInitials = 'G',
  onNotifClick = () => {},
  onAvatarClick = () => {},
}) {
  const [hoveredTab, setHoveredTab] = useState(null)
  const [hoveredBtn, setHoveredBtn] = useState(null)

  return (
    <nav style={{
      display: 'flex', alignItems: 'center',
      height: '52px', padding: '0 var(--space-4)',
      background: 'var(--bg-surface)',
      borderBottom: '1px solid var(--border-default)',
      fontFamily: 'var(--font-body)',
      position: 'relative',
    }}>
      {/* Bottom glow line */}
      <div style={{
        position: 'absolute', bottom: 0, left: 0, right: 0, height: '1px',
        background: 'linear-gradient(90deg, transparent, var(--accent-border), transparent)',
        pointerEvents: 'none',
      }} />

      {/* Logo */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '7px',
        marginRight: 'var(--space-5)',
        fontSize: 'var(--text-sm)', fontWeight: 600,
        color: 'var(--accent)', letterSpacing: '0.06em',
        userSelect: 'none',
      }}>
        <span style={{
          width: '6px', height: '6px', borderRadius: '50%',
          background: 'var(--accent)',
          boxShadow: '0 0 6px var(--accent)',
        }} />
        ATHENEA
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '2px', flex: 1 }}>
        {tabs.map(tab => {
          const isActive = tab.id === activeTab
          const isHovered = hoveredTab === tab.id && !isActive
          return (
            <button
              key={tab.id}
              onClick={() => onTabChange(tab.id)}
              onMouseEnter={() => setHoveredTab(tab.id)}
              onMouseLeave={() => setHoveredTab(null)}
              style={{
                padding: '6px 13px',
                borderRadius: 'var(--radius-md)',
                fontSize: 'var(--text-sm)',
                fontFamily: 'var(--font-body)',
                fontWeight: isActive ? 500 : 400,
                color: isActive ? 'var(--accent)' : isHovered ? 'var(--text-primary)' : 'var(--text-secondary)',
                background: isActive ? 'var(--accent-dim)' : 'transparent',
                border: isActive ? '1px solid var(--accent-border)' : '1px solid transparent',
                cursor: 'pointer',
                transition: 'all var(--transition-fast)',
              }}
            >
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Right actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginLeft: 'auto' }}>
        {/* Notif bell */}
        <button
          onClick={onNotifClick}
          onMouseEnter={() => setHoveredBtn('notif')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            width: '30px', height: '30px',
            borderRadius: 'var(--radius-md)',
            background: hoveredBtn === 'notif' ? 'var(--bg-panel-alt)' : 'var(--bg-panel)',
            border: '1px solid var(--border-default)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
            position: 'relative',
            transition: 'background var(--transition-fast)',
          }}
        >
          <svg width="13" height="13" fill="none" stroke="var(--text-secondary)" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/>
            <path d="M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {notifCount > 0 && (
            <span style={{
              position: 'absolute', top: '4px', right: '4px',
              width: '6px', height: '6px', borderRadius: '50%',
              background: 'var(--color-danger)',
              border: '1.5px solid var(--bg-surface)',
            }} />
          )}
        </button>

        {/* Avatar */}
        <button
          onClick={onAvatarClick}
          onMouseEnter={() => setHoveredBtn('avatar')}
          onMouseLeave={() => setHoveredBtn(null)}
          style={{
            width: '30px', height: '30px',
            borderRadius: 'var(--radius-md)',
            background: 'linear-gradient(135deg, var(--accent-dark), var(--accent))',
            border: 'none',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: 'var(--text-xs)', fontWeight: 700,
            color: 'var(--text-on-accent)',
            cursor: 'pointer',
            opacity: hoveredBtn === 'avatar' ? 0.85 : 1,
            transition: 'opacity var(--transition-fast)',
          }}
        >
          {userInitials}
        </button>
      </div>
    </nav>
  )
}

/* ── Usage ──────────────────────────────────────────────────

const [tab, setTab] = useState('work')

<Navbar
  activeTab={tab}
  onTabChange={setTab}
  notifCount={3}
  userInitials="G"
  onNotifClick={() => console.log('notifs')}
  onAvatarClick={() => console.log('profile')}
/>

─────────────────────────────────────────────────────────── */
