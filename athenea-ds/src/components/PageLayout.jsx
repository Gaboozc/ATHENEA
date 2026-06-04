/* ============================================================
   ATHENEA — PageLayout
   Sistema de grid para el contenido interior de cada hub.

   Componentes:
   - Page          — wrapper con padding y max-width
   - PageHeader    — título de sección + acciones
   - Grid          — grid responsivo de columnas
   - Section       — bloque con label de sección
   - Divider       — separador sutil
   ============================================================ */

/* ── Page ────────────────────────────────────────────────── */
export function Page({ children, maxWidth = 960, pad = true }) {
  return (
    <div style={{
      width: '100%',
      maxWidth: `${maxWidth}px`,
      margin: '0 auto',
      padding: pad ? 'var(--space-5) var(--space-4)' : 0,
      boxSizing: 'border-box',
    }}>
      {children}
    </div>
  )
}

/* ── PageHeader ──────────────────────────────────────────── */
export function PageHeader({ title, subtitle, actions }) {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      gap: 'var(--space-4)',
      marginBottom: 'var(--space-6)',
      flexWrap: 'wrap',
    }}>
      <div>
        <h1 style={{
          fontSize: 'var(--text-xl)',
          fontWeight: 600,
          color: 'var(--text-primary)',
          letterSpacing: '-0.02em',
          margin: 0,
          fontFamily: 'var(--font-display)',
        }}>
          {title}
        </h1>
        {subtitle && (
          <p style={{
            fontSize: 'var(--text-sm)',
            color: 'var(--text-secondary)',
            margin: '4px 0 0',
          }}>
            {subtitle}
          </p>
        )}
      </div>
      {actions && (
        <div style={{ display: 'flex', gap: 'var(--space-2)', alignItems: 'center', flexWrap: 'wrap' }}>
          {actions}
        </div>
      )}
    </div>
  )
}

/* ── Grid ────────────────────────────────────────────────── */
export function Grid({ children, cols = 3, colsMd = 2, colsSm = 1, gap = 12 }) {
  // Usa CSS custom property para el responsive sin media queries JS
  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: `repeat(auto-fit, minmax(min(100%, ${Math.floor(100 / cols) - 2}%), 1fr))`,
      gap: `${gap}px`,
    }}>
      {children}
    </div>
  )
}

/* ── Section ─────────────────────────────────────────────── */
export function Section({ label, children, action }) {
  return (
    <div style={{ marginBottom: 'var(--space-6)' }}>
      {label && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 'var(--space-3)',
        }}>
          <span style={{
            fontSize: '10px',
            fontWeight: 500,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--text-tertiary)',
            fontFamily: 'var(--font-body)',
          }}>
            {label}
          </span>
          {action && (
            <span style={{ fontSize: 'var(--text-xs)', color: 'var(--accent)', cursor: 'pointer' }}>
              {action}
            </span>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

/* ── Divider ─────────────────────────────────────────────── */
export function Divider({ margin = 24 }) {
  return (
    <div style={{
      height: '1px',
      background: 'var(--border-default)',
      margin: `${margin}px 0`,
    }} />
  )
}

/* ── Stack ───────────────────────────────────────────────── */
export function Stack({ children, gap = 12, direction = 'column' }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: direction,
      gap: `${gap}px`,
    }}>
      {children}
    </div>
  )
}

/* ── Row ─────────────────────────────────────────────────── */
export function Row({ children, gap = 8, align = 'center', justify = 'flex-start', wrap = false }) {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'row',
      alignItems: align,
      justifyContent: justify,
      gap: `${gap}px`,
      flexWrap: wrap ? 'wrap' : 'nowrap',
    }}>
      {children}
    </div>
  )
}
