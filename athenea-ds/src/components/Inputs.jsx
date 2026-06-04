import { useState } from 'react'

/* ============================================================
   ATHENEA — Input, Textarea, Select
   ============================================================ */

/* ── Base input styles ────────────────────────────────────── */
function inputStyle(focused, error) {
  return {
    width: '100%',
    background: 'var(--bg-panel)',
    border: `1px solid ${error ? 'rgba(255,64,96,0.5)' : focused ? 'var(--accent-border)' : 'var(--border-default)'}`,
    borderRadius: 'var(--radius-md)',
    padding: '9px 12px',
    fontSize: 'var(--text-base)',
    fontFamily: 'var(--font-body)',
    color: 'var(--text-primary)',
    outline: 'none',
    transition: 'border var(--transition-fast)',
    boxSizing: 'border-box',
    WebkitAppearance: 'none',
  }
}

/* ── Input ───────────────────────────────────────────────── */
export function Input({
  label,
  hint,
  error,
  icon,
  type = 'text',
  placeholder,
  value,
  onChange,
  ...props
}) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontFamily: 'var(--font-body)' }}>
      {(label || hint) && (
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          {label && <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{label}</label>}
          {hint && <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{hint}</span>}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        {icon && (
          <span style={{
            position: 'absolute', left: '11px', top: '50%', transform: 'translateY(-50%)',
            display: 'flex', alignItems: 'center', color: 'var(--text-tertiary)', pointerEvents: 'none',
          }}>
            {icon}
          </span>
        )}
        <input
          type={type}
          placeholder={placeholder}
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...inputStyle(focused, !!error), paddingLeft: icon ? '34px' : '12px' }}
          {...props}
        />
      </div>
      {error && <span style={{ fontSize: '10px', color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  )
}

/* ── Textarea ────────────────────────────────────────────── */
export function Textarea({ label, hint, error, placeholder, value, onChange, rows = 4, ...props }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontFamily: 'var(--font-body)' }}>
      {(label || hint) && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {label && <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{label}</label>}
          {hint && <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{hint}</span>}
        </div>
      )}
      <textarea
        rows={rows}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          ...inputStyle(focused, !!error),
          resize: 'vertical',
          minHeight: '80px',
          lineHeight: 1.6,
        }}
        {...props}
      />
      {error && <span style={{ fontSize: '10px', color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  )
}

/* ── Select ──────────────────────────────────────────────── */
export function Select({ label, hint, error, options = [], value, onChange, ...props }) {
  const [focused, setFocused] = useState(false)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '5px', fontFamily: 'var(--font-body)' }}>
      {(label || hint) && (
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          {label && <label style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)' }}>{label}</label>}
          {hint && <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{hint}</span>}
        </div>
      )}
      <div style={{ position: 'relative' }}>
        <select
          value={value}
          onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{ ...inputStyle(focused, !!error), paddingRight: '32px', cursor: 'pointer' }}
          {...props}
        >
          {options.map(opt => (
            <option key={opt.value} value={opt.value} style={{ background: 'var(--bg-panel)', color: 'var(--text-primary)' }}>
              {opt.label}
            </option>
          ))}
        </select>
        {/* Caret */}
        <span style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)', pointerEvents: 'none', color: 'var(--text-tertiary)', fontSize: '10px' }}>▾</span>
      </div>
      {error && <span style={{ fontSize: '10px', color: 'var(--color-danger)' }}>{error}</span>}
    </div>
  )
}

/* ── Toggle / Switch ─────────────────────────────────────── */
export function Toggle({ label, description, checked, onChange }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      background: 'var(--bg-panel)',
      border: '1px solid var(--border-default)',
      borderRadius: 'var(--radius-md)',
      padding: '10px var(--space-4)',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{label}</span>
        {description && <span style={{ fontSize: '10px', color: 'var(--text-tertiary)' }}>{description}</span>}
      </div>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        style={{
          width: '38px', height: '22px',
          borderRadius: '11px',
          background: checked ? 'var(--accent)' : 'var(--border-default)',
          border: 'none',
          cursor: 'pointer',
          position: 'relative',
          transition: 'background var(--transition-normal)',
          flexShrink: 0,
        }}
      >
        <span style={{
          position: 'absolute',
          width: '16px', height: '16px',
          borderRadius: '50%',
          background: checked ? 'var(--text-on-accent)' : 'var(--text-tertiary)',
          top: '3px',
          left: checked ? '19px' : '3px',
          transition: 'left var(--transition-normal), background var(--transition-normal)',
        }} />
      </button>
    </div>
  )
}

/* ── SearchInput (convenience wrapper) ───────────────────── */
export function SearchInput({ placeholder = 'Buscar en ATHENEA...', value, onChange }) {
  return (
    <Input
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      icon={
        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <circle cx="11" cy="11" r="8"/>
          <path d="m21 21-4.35-4.35"/>
        </svg>
      }
    />
  )
}

/* ── Usage ──────────────────────────────────────────────────

<Input label="Nombre del agente" placeholder="Ej: Cortana" />
<Input label="API Key" type="password" placeholder="sk-••••" error="Clave inválida" hint="obligatorio" />
<SearchInput value={q} onChange={e => setQ(e.target.value)} />
<Textarea label="Descripción" rows={3} />
<Select label="Hub" options={[
  { value: 'work', label: 'Work Hub' },
  { value: 'personal', label: 'Personal Hub' },
  { value: 'finance', label: 'Finance Hub' },
]} />
<Toggle
  label="Trading automático"
  description="Ejecuta 0–2 DTE sin confirmar"
  checked={autoTrade}
  onChange={setAutoTrade}
/>

─────────────────────────────────────────────────────────── */
