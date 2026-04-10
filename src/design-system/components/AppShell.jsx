import { useState, createContext, useContext } from 'react'
import Navbar from './Navbar'
import BottomNav from './BottomNav'
import { useDevice } from '../hooks/useDevice'

/* ============================================================
   ATHENEA — AppShell
   Layout raíz responsive. Maneja:
   - Desktop: Navbar arriba + contenido
   - Mobile:  Contenido + BottomNav abajo (safe-area aware)
   - Sidebar opcional en desktop
   - Estado de tab/hub activo compartido via contexto
   ============================================================ */

/* ── Contexto de navegación ──────────────────────────────── */
const NavContext = createContext(null)
export function useNav() {
  return useContext(NavContext)
}

/* ── Tabs default ────────────────────────────────────────── */
const DEFAULT_TABS = [
  { id: 'work',     label: 'Work' },
  { id: 'personal', label: 'Personal' },
  { id: 'finance',  label: 'Finance' },
  { id: 'agents',   label: 'Agents' },
]

/* ── AppShell ────────────────────────────────────────────── */
export default function AppShell({
  children,
  tabs = DEFAULT_TABS,
  defaultTab = 'work',
  notifCount = 0,
  userInitials = 'G',
  onNotifClick,
  onAvatarClick,
  sidebar,           // ReactNode — panel lateral opcional (solo desktop)
  sidebarWidth = 240,
}) {
  const [activeTab, setActiveTab] = useState(defaultTab)
  const { isMobile, isIOS } = useDevice()

  const navCtx = { activeTab, setActiveTab, tabs }

  return (
    <NavContext.Provider value={navCtx}>
      <div style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100dvh',              // dvh: respeta teclado en mobile
        background: 'var(--bg-base)',
        fontFamily: 'var(--font-body)',
        overflow: 'hidden',
      }}>

        {/* ── Desktop: Navbar top ── */}
        {!isMobile && (
          <Navbar
            tabs={tabs}
            activeTab={activeTab}
            onTabChange={setActiveTab}
            notifCount={notifCount}
            userInitials={userInitials}
            onNotifClick={onNotifClick}
            onAvatarClick={onAvatarClick}
          />
        )}

        {/* ── Body row: sidebar + main ── */}
        <div style={{
          display: 'flex',
          flex: 1,
          overflow: 'hidden',
          position: 'relative',
        }}>

          {/* Sidebar — solo desktop y si se pasa */}
          {!isMobile && sidebar && (
            <aside style={{
              width: `${sidebarWidth}px`,
              flexShrink: 0,
              borderRight: '1px solid var(--border-default)',
              background: 'var(--bg-surface)',
              overflowY: 'auto',
              display: 'flex',
              flexDirection: 'column',
            }}>
              {sidebar}
            </aside>
          )}

          {/* Main content */}
          <main style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            WebkitOverflowScrolling: 'touch',  // smooth scroll iOS
            // Extra padding bottom en mobile para que el contenido
            // no quede tapado por el BottomNav
            paddingBottom: isMobile ? '72px' : 0,
          }}>
            {children}
          </main>
        </div>

        {/* ── Mobile: BottomNav fixed bottom ── */}
        {isMobile && (
          <div style={{
            position: 'fixed',
            bottom: 0, left: 0, right: 0,
            zIndex: 'var(--z-nav)',
            // iOS: empuja el nav encima del home indicator
            paddingBottom: isIOS ? 'env(safe-area-inset-bottom)' : 0,
            background: 'var(--bg-surface)',
          }}>
            <BottomNav activeItem={activeTab} onChange={setActiveTab} />
          </div>
        )}
      </div>
    </NavContext.Provider>
  )
}
