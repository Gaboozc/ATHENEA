/* ============================================================
   ATHENEA — Cards
   MetricCard  — KPI / número grande con delta
   FeatureCard — panel con icono, título y contenido libre
   GlassCard   — panel semitransparente flotante
   ListCard    — lista de items con avatar, info y valor
   ============================================================ */

/* ── Shared base styles ─── */
const cardBase = {
  background: 'var(--bg-panel)',
  border: '1px solid var(--border-default)',
  borderRadius: 'var(--radius-lg)',
  padding: 'var(--space-4)',
  position: 'relative',
  overflow: 'hidden',
  fontFamily: 'var(--font-body)',
}

const shimmerTop = {
  content: "''",
  position: 'absolute',
  top: 0, left: 0, right: 0,
  height: '1px',
  background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.05), transparent)',
  pointerEvents: 'none',
}

/* ── MetricCard ──────────────────────────────────────────── */
export function MetricCard({ label, value, delta, deltaPositive = true, accentTop = false }) {
  return (
    <div style={{
      ...cardBase,
      borderTop: accentTop ? '2px solid var(--accent)' : cardBase.border,
    }}>
      <div style={shimmerTop} />
      <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '6px' }}>
        {label}
      </div>
      <div style={{ fontSize: 'var(--text-2xl)', fontWeight: 600, color: 'var(--text-primary)', letterSpacing: '-0.02em' }}>
        {value}
      </div>
      {delta && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: '4px',
          fontSize: 'var(--text-xs)', marginTop: '4px',
          color: deltaPositive ? 'var(--color-success)' : 'var(--color-danger)',
        }}>
          <span>{deltaPositive ? '▲' : '▼'}</span>
          <span>{delta}</span>
        </div>
      )}
    </div>
  )
}

/* ── FeatureCard ─────────────────────────────────────────── */
export function FeatureCard({ icon, title, subtitle, children, accentColor = 'var(--accent)' }) {
  return (
    <div style={cardBase}>
      <div style={shimmerTop} />
      {icon && (
        <div style={{
          width: '34px', height: '34px',
          borderRadius: 'var(--radius-md)',
          background: 'var(--accent-dim)',
          border: '1px solid var(--accent-border)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          marginBottom: 'var(--space-3)',
          color: accentColor,
        }}>
          {icon}
        </div>
      )}
      <div style={{ fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '3px' }}>
        {title}
      </div>
      {subtitle && (
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
          {subtitle}
        </div>
      )}
      {children}
    </div>
  )
}

/* ── GlassCard ───────────────────────────────────────────── */
export function GlassCard({ children, style = {} }) {
  return (
    <div style={{
      background: 'rgba(21, 28, 43, 0.55)',
      backdropFilter: 'blur(14px)',
      WebkitBackdropFilter: 'blur(14px)',
      border: '1px solid rgba(0, 212, 255, 0.10)',
      borderRadius: 'var(--radius-xl)',
      padding: 'var(--space-4)',
      fontFamily: 'var(--font-body)',
      ...style,
    }}>
      {children}
    </div>
  )
}

/* ── ListCard ────────────────────────────────────────────── */
export function ListCard({ items = [] }) {
  return (
    <div style={{
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-lg)',
      overflow: 'hidden',
      fontFamily: 'var(--font-body)',
    }}>
      {items.map((item, i) => (
        <ListItem key={i} item={item} last={i === items.length - 1} />
      ))}
    </div>
  )
}

function ListItem({ item, last }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      padding: '11px var(--space-4)',
      borderBottom: last ? 'none' : '1px solid var(--border-default)',
      transition: 'background var(--transition-fast)',
      cursor: 'pointer',
    }}
      onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-panel-alt)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {/* Avatar */}
      <div style={{
        width: '32px', height: '32px', borderRadius: 'var(--radius-md)',
        background: item.avatarBg || 'var(--accent-dim)',
        color: item.avatarColor || 'var(--accent)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 'var(--text-xs)', fontWeight: 600, flexShrink: 0,
      }}>
        {item.avatar}
      </div>
      {/* Info */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 'var(--text-base)', color: 'var(--text-primary)', fontWeight: 500 }}>{item.name}</div>
        <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)' }}>{item.meta}</div>
      </div>
      {/* Right */}
      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: 'var(--text-base)', fontWeight: 500, color: item.valueColor || 'var(--text-primary)' }}>
          {item.value}
        </div>
        {item.badge}
      </div>
    </div>
  )
}

/* ── Usage examples ────────────────────────────────────────

// MetricCard
<MetricCard label="Balance total" value="$12,840" delta="+2.4% hoy" deltaPositive accentTop />
<MetricCard label="Tareas activas" value="14" delta="3 vencidas" deltaPositive={false} />

// FeatureCard
<FeatureCard icon={<ActivityIcon />} title="Monitor de agentes" subtitle="3 activos · último ping 2s">
  <div>…contenido libre…</div>
</FeatureCard>

// GlassCard
<GlassCard>
  <p>Contenido flotante</p>
</GlassCard>

// ListCard
<ListCard items={[
  {
    avatar: 'N',
    avatarBg: 'var(--accent-dim)', avatarColor: 'var(--accent)',
    name: 'Netflix',
    meta: 'Entretenimiento · hoy',
    value: '-$18.99',
    valueColor: 'var(--color-danger)',
    badge: <Badge variant="red">Gasto</Badge>,
  },
  {
    avatar: 'C',
    avatarBg: 'var(--color-success-dim)', avatarColor: 'var(--color-success)',
    name: 'Cliente Feria 2024',
    meta: 'Ingreso · ayer',
    value: '+$2,400',
    valueColor: 'var(--color-success)',
    badge: <Badge variant="green">Ingreso</Badge>,
  },
]} />

─────────────────────────────────────────────────────────── */
