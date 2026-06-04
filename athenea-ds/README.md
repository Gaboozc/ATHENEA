# ATHENEA Design System

Estilo: **dark tech · sistema de mando**
Stack: React + Capacitor · JavaScript (no TypeScript)

---

## Setup

```jsx
// main.jsx
import './src/tokens/tokens.css'
import './src/tokens/animations.css'
```

---

## Archivos

```
src/
├── tokens/
│   ├── tokens.css        ← Variables CSS (paleta, tipografía, radios, spacing)
│   └── animations.css    ← Keyframes + clases utilitarias
├── components/
│   ├── Button.jsx         ← primary | secondary | ghost | danger | icon
│   ├── Badge.jsx          ← cyan | green | red | amber | purple | gray
│   ├── Navbar.jsx         ← Desktop navbar con tabs y acciones
│   ├── BottomNav.jsx      ← Mobile bottom nav (Capacitor safe-area)
│   ├── Cards.jsx          ← MetricCard | FeatureCard | GlassCard | ListCard
│   ├── Inputs.jsx         ← Input | Textarea | Select | Toggle | SearchInput
│   ├── Charts.jsx         ← BarChart | Sparkline | ProgressBar | ProgressStack
│   └── Overlays.jsx       ← Modal | ConfirmModal | Toast | ToastContainer | useToast
└── index.js              ← Barrel export
```

---

## Paleta principal

| Token               | Valor     | Uso                        |
|---------------------|-----------|----------------------------|
| `--bg-base`         | `#0a0d12` | Fondo raíz de la app       |
| `--bg-surface`      | `#0f1520` | Navbar, BottomNav          |
| `--bg-panel`        | `#151c2b` | Cards, inputs              |
| `--bg-panel-alt`    | `#1a2235` | Hover, paneles anidados    |
| `--accent`          | `#00d4ff` | Cian primario              |
| `--color-success`   | `#00e5a0` | Estados OK, ingresos       |
| `--color-danger`    | `#ff4060` | Alertas, errores, gastos   |
| `--color-warning`   | `#ffb700` | Pendientes, standby        |
| `--color-purple`    | `#a78bfa` | IA activa, Personal Hub    |
| `--text-primary`    | `#e8f0fe` | Texto principal            |
| `--text-secondary`  | `#8899bb` | Labels, subtítulos         |
| `--text-tertiary`   | `#4a5a7a` | Hints, labels vacíos       |

---

## Uso rápido

```jsx
import { Button, Badge, MetricCard, BarChart, useToast } from './src'

function Dashboard() {
  const { toasts, toast, dismiss } = useToast()

  return (
    <div style={{ background: 'var(--bg-base)', minHeight: '100vh' }}>
      <Navbar activeTab="work" notifCount={3} />

      <div style={{ padding: '16px', display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '10px' }}>
        <MetricCard label="Balance total" value="$12,840" delta="+2.4% hoy" accentTop />
        <MetricCard label="Tareas activas" value="14" delta="3 vencidas" deltaPositive={false} />
        <MetricCard label="Cortana" value="Online" delta="99.8% uptime" />
      </div>

      <Button variant="primary" onClick={() => toast('Agente activado', 'success')}>
        Activar Cortana
      </Button>

      <BottomNav activeItem="work" />
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </div>
  )
}
```

---

## Clases CSS utilitarias

```html
<!-- Scan lines (paneles de agentes) -->
<div class="athenea-scanlines">...</div>

<!-- Glow border (agente activo) -->
<div class="athenea-glow">...</div>

<!-- Cursor parpadeante -->
<span class="athenea-cursor">CORTANA</span>

<!-- Status dots -->
<span class="athenea-status-dot live"></span>
<span class="athenea-status-dot offline"></span>
<span class="athenea-status-dot alert"></span>
```
