/* ============================================================
   ATHENEA — Badge
   Variants: cyan | green | red | amber | purple | gray
   dot prop: adds animated status dot
   ============================================================ */

const variantMap = {
  cyan:   { bg: 'var(--accent-dim)',           color: 'var(--accent)',          border: 'var(--accent-border)' },
  green:  { bg: 'var(--color-success-dim)',    color: 'var(--color-success)',   border: 'var(--color-success-border)' },
  red:    { bg: 'var(--color-danger-dim)',     color: 'var(--color-danger)',    border: 'var(--color-danger-border)' },
  amber:  { bg: 'var(--color-warning-dim)',    color: 'var(--color-warning)',   border: 'var(--color-warning-border)' },
  purple: { bg: 'var(--color-purple-dim)',     color: 'var(--color-purple)',    border: 'var(--color-purple-border)' },
  gray:   { bg: 'rgba(74,90,122,0.15)',        color: 'var(--text-secondary)',  border: 'rgba(74,90,122,0.25)' },
}

export default function Badge({ children, variant = 'cyan', dot = false, pulse = false }) {
  const v = variantMap[variant] || variantMap.cyan

  return (
    <span style={{
      display: 'inline-flex',
      alignItems: 'center',
      gap: '5px',
      padding: '3px 10px',
      borderRadius: '9999px',
      fontSize: 'var(--text-xs)',
      fontWeight: 500,
      fontFamily: 'var(--font-body)',
      background: v.bg,
      color: v.color,
      border: `1px solid ${v.border}`,
      letterSpacing: '0.02em',
    }}>
      {dot && (
        <span style={{
          width: '5px',
          height: '5px',
          borderRadius: '50%',
          background: v.color,
          flexShrink: 0,
          ...(pulse ? { animation: 'athenea-pulse 2s infinite' } : {}),
        }} />
      )}
      {children}
    </span>
  )
}

/* ── Usage examples ────────────────────────────────────────

<Badge variant="cyan" dot pulse>En proceso</Badge>
<Badge variant="green" dot>Completado</Badge>
<Badge variant="red" dot>Crítico</Badge>
<Badge variant="amber" dot>Pendiente</Badge>
<Badge variant="purple">IA activa</Badge>
<Badge variant="gray">Archivado</Badge>

─────────────────────────────────────────────────────────── */
