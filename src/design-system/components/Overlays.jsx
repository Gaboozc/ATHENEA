import { useState, useEffect } from 'react'

/* ============================================================
   ATHENEA — Modal + Toast
   ============================================================ */

/* ── Modal ───────────────────────────────────────────────── */
export function Modal({ open, onClose, title, children, size = 'md', danger = false }) {
  useEffect(() => {
    if (!open) return
    const handler = e => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [open, onClose])

  if (!open) return null

  const widths = { sm: '360px', md: '480px', lg: '640px' }

  return (
    <div
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
      style={{
        position: 'fixed', inset: 0, zIndex: 'var(--z-modal)',
        background: 'rgba(5, 8, 16, 0.75)',
        backdropFilter: 'blur(4px)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 'var(--space-4)',
        animation: 'athenea-fade-in 0.15s ease',
      }}
    >
      <div style={{
        width: '100%', maxWidth: widths[size],
        background: 'var(--bg-panel)',
        border: `1px solid ${danger ? 'var(--color-danger-border)' : 'var(--border-strong)'}`,
        borderRadius: 'var(--radius-xl)',
        overflow: 'hidden',
        fontFamily: 'var(--font-body)',
        animation: 'athenea-slide-up 0.2s ease',
      }}>
        {/* Header */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: 'var(--space-4)',
          borderBottom: '1px solid var(--border-default)',
        }}>
          <h2 style={{ fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--text-primary)', margin: 0 }}>
            {title}
          </h2>
          <button
            onClick={onClose}
            style={{
              width: '26px', height: '26px', borderRadius: 'var(--radius-sm)',
              background: 'var(--bg-panel-alt)', border: '1px solid var(--border-default)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer', color: 'var(--text-secondary)',
            }}
          >
            <svg width="11" height="11" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
        {/* Body */}
        <div style={{ padding: 'var(--space-4)' }}>
          {children}
        </div>
      </div>
    </div>
  )
}

/* ── ConfirmModal ────────────────────────────────────────── */
export function ConfirmModal({ open, onClose, onConfirm, title, message, confirmLabel = 'Confirmar', danger = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title} size="sm" danger={danger}>
      <p style={{ fontSize: 'var(--text-sm)', color: 'var(--text-secondary)', marginBottom: 'var(--space-5)', lineHeight: 1.6 }}>
        {message}
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-2)', justifyContent: 'flex-end' }}>
        <button onClick={onClose} style={ghostBtn}>Cancelar</button>
        <button onClick={() => { onConfirm(); onClose() }} style={danger ? dangerBtn : primaryBtn}>
          {confirmLabel}
        </button>
      </div>
    </Modal>
  )
}

/* ── Toast ───────────────────────────────────────────────── */
const toastVariants = {
  success: { icon: '✓', bg: 'var(--color-success-dim)', border: 'var(--color-success-border)', color: 'var(--color-success)' },
  error:   { icon: '✕', bg: 'var(--color-danger-dim)',  border: 'var(--color-danger-border)',  color: 'var(--color-danger)' },
  warning: { icon: '!', bg: 'var(--color-warning-dim)', border: 'var(--color-warning-border)', color: 'var(--color-warning)' },
  info:    { icon: 'i', bg: 'var(--accent-dim)',         border: 'var(--accent-border)',        color: 'var(--accent)' },
}

export function Toast({ message, variant = 'info', onDismiss, duration = 3500 }) {
  const [visible, setVisible] = useState(true)
  const v = toastVariants[variant]

  useEffect(() => {
    const t = setTimeout(() => { setVisible(false); setTimeout(onDismiss, 300) }, duration)
    return () => clearTimeout(t)
  }, [duration, onDismiss])

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 'var(--space-3)',
      padding: '10px 14px',
      background: 'var(--bg-panel)',
      border: `1px solid ${v.border}`,
      borderRadius: 'var(--radius-lg)',
      fontFamily: 'var(--font-body)',
      boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
      minWidth: '240px', maxWidth: '380px',
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(8px)',
      transition: 'opacity 0.3s ease, transform 0.3s ease',
    }}>
      <span style={{
        width: '20px', height: '20px', borderRadius: '50%',
        background: v.bg, color: v.color,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: '10px', fontWeight: 700, flexShrink: 0,
      }}>
        {v.icon}
      </span>
      <span style={{ flex: 1, fontSize: 'var(--text-sm)', color: 'var(--text-primary)' }}>{message}</span>
      <button onClick={() => { setVisible(false); setTimeout(onDismiss, 300) }} style={{
        background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-tertiary)', padding: '2px',
      }}>
        <svg width="10" height="10" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
        </svg>
      </button>
    </div>
  )
}

/* ── ToastContainer (portal-like fixed container) ────────── */
export function ToastContainer({ toasts = [], onDismiss }) {
  return (
    <div style={{
      position: 'fixed', bottom: '80px', right: '16px',
      display: 'flex', flexDirection: 'column', gap: 'var(--space-2)',
      zIndex: 'var(--z-toast)',
    }}>
      {toasts.map(t => (
        <Toast key={t.id} {...t} onDismiss={() => onDismiss(t.id)} />
      ))}
    </div>
  )
}

/* ── useToast hook ───────────────────────────────────────── */
export function useToast() {
  const [toasts, setToasts] = useState([])

  const add = (message, variant = 'info') => {
    const id = Date.now()
    setToasts(prev => [...prev, { id, message, variant }])
  }

  const dismiss = id => setToasts(prev => prev.filter(t => t.id !== id))

  return { toasts, toast: add, dismiss }
}

/* ── Button styles (inline) ────────────────────────────────*/
const ghostBtn = {
  padding: '7px 16px', borderRadius: '9999px', fontSize: 'var(--text-sm)',
  background: 'transparent', color: 'var(--text-secondary)',
  border: '1px solid var(--border-default)', cursor: 'pointer',
  fontFamily: 'var(--font-body)',
}
const primaryBtn = {
  ...ghostBtn, background: 'var(--accent)', color: 'var(--text-on-accent)', border: 'none', fontWeight: 500,
}
const dangerBtn = {
  ...ghostBtn, background: 'var(--color-danger-dim)', color: 'var(--color-danger)',
  border: '1px solid var(--color-danger-border)',
}

/* ── Usage ──────────────────────────────────────────────────

// Modal
const [open, setOpen] = useState(false)
<Modal open={open} onClose={() => setOpen(false)} title="Configurar agente">
  <Input label="Nombre" />
</Modal>

// ConfirmModal
<ConfirmModal
  open={confirmOpen}
  onClose={() => setConfirmOpen(false)}
  onConfirm={() => deleteAgent(id)}
  title="Eliminar agente"
  message="Esta acción no se puede deshacer. ¿Confirmas?"
  confirmLabel="Sí, eliminar"
  danger
/>

// Toast
const { toasts, toast, dismiss } = useToast()
<button onClick={() => toast('Guardado correctamente', 'success')}>Guardar</button>
<ToastContainer toasts={toasts} onDismiss={dismiss} />

─────────────────────────────────────────────────────────── */
