import { useState, useRef, useEffect } from 'react'

/* ============================================================
   ATHENEA — Charts
   BarChart    — barras verticales con tooltip hover
   Sparkline   — línea mini para métricas en tarjeta
   ProgressBar — barra de progreso con label y porcentaje
   ============================================================ */

/* ── BarChart ─────────────────────────────────────────────── */
export function BarChart({
  data = [],        // [{ label, value }]
  height = 120,
  periodOptions = ['1S', '1M', '3M', '1A'],
  defaultPeriod = '1M',
  currency = true,
  accentIndex,      // index of bar to highlight (undefined = highest)
}) {
  const [period, setPeriod] = useState(defaultPeriod)
  const [tooltip, setTooltip] = useState(null) // { i, x, y }

  const max = Math.max(...data.map(d => d.value), 1)
  const highlightIdx = accentIndex ?? data.reduce((acc, d, i) => d.value > data[acc].value ? i : acc, 0)

  const fmt = v => currency
    ? new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 0 }).format(v)
    : v.toLocaleString()

  return (
    <div style={{ fontFamily: 'var(--font-body)' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-4)' }}>
        <slot />
        <div style={{ display: 'flex', gap: '4px' }}>
          {periodOptions.map(p => (
            <button
              key={p}
              onClick={() => setPeriod(p)}
              style={{
                fontSize: '10px', padding: '3px 8px',
                borderRadius: '9999px',
                background: period === p ? 'var(--accent-dim)' : 'transparent',
                color: period === p ? 'var(--accent)' : 'var(--text-tertiary)',
                border: period === p ? '1px solid var(--accent-border)' : '1px solid transparent',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
              }}
            >
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* Bars */}
      <div style={{ position: 'relative' }}>
        <div style={{
          display: 'flex', alignItems: 'flex-end', gap: '3px', height: `${height}px`,
        }}>
          {data.map((d, i) => (
            <div
              key={i}
              style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', justifyContent: 'flex-end' }}
              onMouseEnter={e => setTooltip({ i, rect: e.currentTarget.getBoundingClientRect() })}
              onMouseLeave={() => setTooltip(null)}
            >
              <div style={{
                width: '100%',
                height: `${Math.round((d.value / max) * 100)}%`,
                borderRadius: '4px 4px 0 0',
                background: i === highlightIdx
                  ? 'linear-gradient(180deg, var(--accent) 0%, var(--accent-dark) 100%)'
                  : 'var(--bg-panel-alt)',
                border: i === highlightIdx ? '1px solid var(--accent-border)' : '1px solid var(--border-default)',
                transition: 'opacity var(--transition-fast)',
                opacity: tooltip && tooltip.i !== i ? 0.5 : 1,
                cursor: 'pointer',
                minHeight: '4px',
              }} />
            </div>
          ))}
        </div>

        {/* Tooltip */}
        {tooltip !== null && data[tooltip.i] && (
          <div style={{
            position: 'absolute',
            bottom: `${Math.round((data[tooltip.i].value / max) * height) + 8}px`,
            left: `${Math.round((tooltip.i / data.length) * 100)}%`,
            transform: 'translateX(-50%)',
            background: 'var(--bg-panel-alt)',
            border: '1px solid var(--border-strong)',
            borderRadius: 'var(--radius-sm)',
            padding: '4px 8px',
            fontSize: 'var(--text-xs)',
            color: 'var(--text-primary)',
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
            zIndex: 10,
          }}>
            <span style={{ color: 'var(--text-tertiary)', marginRight: '4px' }}>{data[tooltip.i].label}</span>
            <span style={{ color: 'var(--accent)', fontWeight: 500 }}>{fmt(data[tooltip.i].value)}</span>
          </div>
        )}
      </div>

      {/* X labels */}
      <div style={{ display: 'flex', gap: '3px', marginTop: '6px' }}>
        {data.map((d, i) => (
          <div key={i} style={{ flex: 1, fontSize: '9px', color: 'var(--text-tertiary)', textAlign: 'center' }}>
            {d.label}
          </div>
        ))}
      </div>
    </div>
  )
}

/* ── Sparkline (SVG) ─────────────────────────────────────── */
export function Sparkline({ data = [], color = 'var(--accent)', height = 40, width = 120 }) {
  if (data.length < 2) return null
  const min = Math.min(...data)
  const max = Math.max(...data)
  const range = max - min || 1
  const pad = 2

  const points = data.map((v, i) => {
    const x = Math.round(pad + (i / (data.length - 1)) * (width - pad * 2))
    const y = Math.round(pad + ((max - v) / range) * (height - pad * 2))
    return `${x},${y}`
  }).join(' ')

  // Fill path
  const first = points.split(' ')[0]
  const last = points.split(' ').at(-1)
  const fillPath = `M ${first} L ${points} L ${last.split(',')[0]},${height} L ${first.split(',')[0]},${height} Z`

  return (
    <svg width={width} height={height} viewBox={`0 0 ${width} ${height}`} style={{ overflow: 'visible' }}>
      <defs>
        <linearGradient id="spark-grad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity="0.25" />
          <stop offset="100%" stopColor={color} stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={fillPath} fill="url(#spark-grad)" />
      <polyline points={points} fill="none" stroke={color} strokeWidth="1.5" strokeLinejoin="round" strokeLinecap="round" />
      {/* Last point dot */}
      <circle
        cx={last.split(',')[0]} cy={last.split(',')[1]}
        r="2.5" fill={color}
      />
    </svg>
  )
}

/* ── ProgressBar ─────────────────────────────────────────── */
export function ProgressBar({ label, value, max = 100, color = 'var(--accent)' }) {
  const pct = Math.min(Math.round((value / max) * 100), 100)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontFamily: 'var(--font-body)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between' }}>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{label}</span>
        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-primary)', fontWeight: 500 }}>{pct}%</span>
      </div>
      <div style={{
        height: '4px', borderRadius: '9999px',
        background: 'var(--bg-panel-alt)',
        overflow: 'hidden',
      }}>
        <div style={{
          height: '100%',
          width: `${pct}%`,
          borderRadius: '9999px',
          background: color,
          transition: 'width 0.5s ease',
        }} />
      </div>
    </div>
  )
}

/* ── ProgressStack (multiple bars) ──────────────────────── */
export function ProgressStack({ items = [] }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
      {items.map((item, i) => (
        <ProgressBar key={i} {...item} />
      ))}
    </div>
  )
}

/* ── Usage ──────────────────────────────────────────────────

const monthData = [
  { label: 'Ene', value: 4200 }, { label: 'Feb', value: 3800 },
  { label: 'Mar', value: 5100 }, { label: 'Abr', value: 4700 },
  { label: 'May', value: 6200 }, { label: 'Jun', value: 5500 },
  { label: 'Jul', value: 4900 }, { label: 'Ago', value: 3600 },
  { label: 'Sep', value: 5800 }, { label: 'Oct', value: 6100 },
  { label: 'Nov', value: 4400 }, { label: 'Dic', value: 5200 },
]

<div style={{ background: 'var(--bg-panel)', borderRadius: 'var(--radius-lg)', padding: '16px' }}>
  <h3 style={{ color: 'var(--text-primary)', fontSize: '13px', fontWeight: 500, marginBottom: 0 }}>Gastos mensuales</h3>
  <BarChart data={monthData} height={120} />
</div>

<Sparkline data={[42, 55, 48, 70, 65, 80, 75, 90]} color="var(--accent)" />

<ProgressStack items={[
  { label: 'Work Hub',     value: 78, color: 'var(--accent)' },
  { label: 'Personal Hub', value: 52, color: 'var(--color-purple)' },
  { label: 'Finance Hub',  value: 91, color: 'var(--color-success)' },
  { label: 'Agents',       value: 34, color: 'var(--color-warning)' },
]} />

─────────────────────────────────────────────────────────── */
