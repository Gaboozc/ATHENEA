import { useState } from 'react'

/* ============================================================
   ATHENEA — Button
   Variants: primary | secondary | ghost | danger | icon
   Sizes:    md (default) | sm | lg
   ============================================================ */

const styles = {
  base: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    borderRadius: '9999px',
    fontFamily: 'var(--font-body)',
    fontWeight: 500,
    cursor: 'pointer',
    border: 'none',
    outline: 'none',
    transition: 'all var(--transition-fast)',
    letterSpacing: '0.02em',
    whiteSpace: 'nowrap',
    userSelect: 'none',
  },
  sizes: {
    sm: { padding: '5px 14px', fontSize: 'var(--text-xs)' },
    md: { padding: '9px 20px', fontSize: 'var(--text-sm)' },
    lg: { padding: '12px 28px', fontSize: 'var(--text-base)' },
  },
  variants: {
    primary: {
      background: 'var(--accent)',
      color: 'var(--text-on-accent)',
    },
    secondary: {
      background: 'var(--accent-dim)',
      color: 'var(--accent)',
      border: '1px solid var(--accent-border)',
    },
    ghost: {
      background: 'transparent',
      color: 'var(--text-secondary)',
      border: '1px solid var(--border-default)',
    },
    danger: {
      background: 'var(--color-danger-dim)',
      color: 'var(--color-danger)',
      border: '1px solid var(--color-danger-border)',
    },
  },
  icon: {
    width: '34px',
    height: '34px',
    borderRadius: 'var(--radius-md)',
    padding: 0,
    background: 'var(--bg-panel)',
    border: '1px solid var(--border-default)',
    color: 'var(--text-secondary)',
  },
}

const hoverMap = {
  primary:   { background: 'var(--accent-hover)' },
  secondary: { background: 'rgba(0,212,255,0.18)' },
  ghost:     { borderColor: 'var(--border-strong)', color: 'var(--text-primary)' },
  danger:    { background: 'rgba(255,64,96,0.18)' },
  icon:      { borderColor: 'var(--border-strong)', color: 'var(--text-primary)' },
}

export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  icon = false,
  disabled = false,
  loading = false,
  onClick,
}) {
  const [hovered, setHovered] = useState(false)
  const [pressed, setPressed] = useState(false)

  const base = {
    ...styles.base,
    ...(icon ? styles.icon : { ...styles.sizes[size], ...styles.variants[variant] }),
    ...(hovered && !disabled ? (icon ? hoverMap.icon : hoverMap[variant]) : {}),
    transform: pressed && !disabled ? 'scale(0.97)' : 'scale(1)',
    opacity: disabled ? 0.4 : 1,
    cursor: disabled ? 'not-allowed' : 'pointer',
  }

  return (
    <button
      style={base}
      disabled={disabled || loading}
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => { setHovered(false); setPressed(false) }}
      onMouseDown={() => setPressed(true)}
      onMouseUp={() => setPressed(false)}
    >
      {loading ? <LoadingDots /> : children}
    </button>
  )
}

function LoadingDots() {
  return (
    <span style={{ display: 'flex', gap: '3px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <span
          key={i}
          style={{
            width: '4px', height: '4px', borderRadius: '50%',
            background: 'currentColor',
            animation: 'athenea-blink 1.2s infinite',
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </span>
  )
}

/* ── Usage examples ────────────────────────────────────────

<Button variant="primary">Ejecutar</Button>
<Button variant="secondary">Configurar</Button>
<Button variant="ghost">Ver más</Button>
<Button variant="danger">Eliminar</Button>
<Button variant="primary" size="sm">Guardar</Button>
<Button variant="ghost" size="lg">Cancelar</Button>
<Button icon>
  <PlusIcon />
</Button>
<Button variant="primary" loading>Guardando</Button>
<Button variant="ghost" disabled>No disponible</Button>

─────────────────────────────────────────────────────────── */
