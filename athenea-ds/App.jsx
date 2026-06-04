import { useState } from 'react'

// Tokens (importar una vez aquí)
import './src/tokens/tokens.css'
import './src/tokens/animations.css'

// Layout shell
import AppShell, { useNav } from './src/components/AppShell'
import { Page, PageHeader, Grid, Section, Stack, Row, Divider } from './src/components/PageLayout'

// Components
import Button from './src/components/Button'
import Badge from './src/components/Badge'
import { MetricCard, FeatureCard, GlassCard, ListCard } from './src/components/Cards'
import { SearchInput, Toggle } from './src/components/Inputs'
import { BarChart, ProgressStack } from './src/components/Charts'
import { ToastContainer, useToast } from './src/components/Overlays'

/* ============================================================
   ATHENEA — App.jsx
   Ejemplo completo de cómo conectar el shell y los hubs.
   Cada hub (Work, Personal, Finance, Agents) es su propio
   componente hijo que recibe los datos que necesita.
   ============================================================ */

export default function App() {
  const { toasts, toast, dismiss } = useToast()
  const [notifCount] = useState(3)

  return (
    <>
      <AppShell
        defaultTab="work"
        notifCount={notifCount}
        userInitials="G"
        onNotifClick={() => toast('3 notificaciones nuevas', 'info')}
        onAvatarClick={() => toast('Perfil de usuario', 'info')}
      >
        <HubRouter />
      </AppShell>

      {/* Toasts van fuera del shell para que floten sobre todo */}
      <ToastContainer toasts={toasts} onDismiss={dismiss} />
    </>
  )
}

/* ── HubRouter — renderiza el hub activo ─────────────────── */
function HubRouter() {
  const { activeTab } = useNav()

  const hubs = {
    work:     <WorkHub />,
    personal: <PersonalHub />,
    finance:  <FinanceHub />,
    agents:   <AgentsHub />,
  }

  return hubs[activeTab] || hubs.work
}

/* ── Work Hub ────────────────────────────────────────────── */
function WorkHub() {
  const { toast } = useToast()
  const [q, setQ] = useState('')

  return (
    <Page>
      <PageHeader
        title="Work Hub"
        subtitle="Proyectos activos y tareas del día"
        actions={
          <>
            <Badge variant="cyan" dot pulse>3 en proceso</Badge>
            <Button variant="primary" size="sm" onClick={() => toast('Nueva tarea creada', 'success')}>
              + Tarea
            </Button>
          </>
        }
      />

      <Section label="resumen">
        <Grid cols={3} gap={10}>
          <MetricCard label="Tareas hoy"      value="8"       delta="2 vencidas"     deltaPositive={false} />
          <MetricCard label="Completadas"     value="14"      delta="+5 esta semana" accentTop />
          <MetricCard label="Proyectos"       value="4"       delta="1 nuevo"        deltaPositive />
        </Grid>
      </Section>

      <Section label="buscar">
        <SearchInput
          placeholder="Buscar tarea, proyecto o cliente..."
          value={q}
          onChange={e => setQ(e.target.value)}
        />
      </Section>

      <Section label="proyectos activos" action="Ver todos">
        <ProgressStack items={[
          { label: 'Imperial Barbershop',  value: 78, color: 'var(--accent)' },
          { label: 'AlphaDev 360',         value: 55, color: 'var(--color-purple)' },
          { label: 'Psique n Pixel',       value: 32, color: 'var(--color-warning)' },
          { label: 'Ungido — Rey David',   value: 18, color: 'var(--color-success)' },
        ]} />
      </Section>
    </Page>
  )
}

/* ── Personal Hub ────────────────────────────────────────── */
function PersonalHub() {
  const [autoSave, setAutoSave] = useState(true)
  const [darkPlus, setDarkPlus] = useState(false)

  return (
    <Page>
      <PageHeader title="Personal Hub" subtitle="Rutinas, hábitos y configuración" />

      <Section label="métricas">
        <Grid cols={2} gap={10}>
          <MetricCard label="Hábitos hoy"  value="5/7"   delta="+1 vs ayer"   deltaPositive />
          <MetricCard label="Racha actual" value="12d"   delta="récord: 24d"   deltaPositive={false} />
        </Grid>
      </Section>

      <Section label="preferencias">
        <Stack gap={10}>
          <Toggle
            label="Auto-guardar sesión"
            description="Mantiene la última sesión al abrir ATHENEA"
            checked={autoSave}
            onChange={setAutoSave}
          />
          <Toggle
            label="Modo oscuro extremo"
            description="Reduce el brillo del fondo base a #060810"
            checked={darkPlus}
            onChange={setDarkPlus}
          />
        </Stack>
      </Section>
    </Page>
  )
}

/* ── Finance Hub ─────────────────────────────────────────── */
const monthData = [
  { label: 'Ene', value: 4200 }, { label: 'Feb', value: 3800 },
  { label: 'Mar', value: 5100 }, { label: 'Abr', value: 4700 },
  { label: 'May', value: 6200 }, { label: 'Jun', value: 5500 },
  { label: 'Jul', value: 4900 }, { label: 'Ago', value: 3600 },
  { label: 'Sep', value: 5800 }, { label: 'Oct', value: 6100 },
  { label: 'Nov', value: 4400 }, { label: 'Dic', value: 5200 },
]

function FinanceHub() {
  return (
    <Page>
      <PageHeader
        title="Finance Hub"
        subtitle="Balance, gastos y trading"
        actions={<Badge variant="green" dot pulse>Alpaca · Live</Badge>}
      />

      <Section label="resumen financiero">
        <Grid cols={3} gap={10}>
          <MetricCard label="Balance USD"  value="$12,840" delta="+2.4% hoy"    deltaPositive accentTop />
          <MetricCard label="Balance MXN"  value="$218,500" delta="+$3,200"     deltaPositive />
          <MetricCard label="P&L trading"  value="+$340"    delta="2 posiciones" deltaPositive />
        </Grid>
      </Section>

      <Section label="gastos mensuales">
        <div style={{
          background: 'var(--bg-panel)',
          border: '1px solid var(--border-default)',
          borderRadius: 'var(--radius-lg)',
          padding: 'var(--space-4)',
        }}>
          <Row justify="space-between" style={{ marginBottom: 'var(--space-4)' }}>
            <span style={{ fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--text-primary)' }}>
              Gastos mensuales
            </span>
          </Row>
          <BarChart data={monthData} height={120} currency />
        </div>
      </Section>

      <Section label="últimas transacciones" action="Ver todo">
        <ListCard items={[
          {
            avatar: 'N',
            avatarBg: 'var(--accent-dim)', avatarColor: 'var(--accent)',
            name: 'Netflix', meta: 'Entretenimiento · hoy',
            value: '-$18.99', valueColor: 'var(--color-danger)',
            badge: <Badge variant="red">Gasto</Badge>,
          },
          {
            avatar: 'C',
            avatarBg: 'var(--color-success-dim)', avatarColor: 'var(--color-success)',
            name: 'Cliente Feria 2024', meta: 'Ingreso · ayer',
            value: '+$2,400', valueColor: 'var(--color-success)',
            badge: <Badge variant="green">Ingreso</Badge>,
          },
          {
            avatar: 'A',
            avatarBg: 'var(--color-purple-dim)', avatarColor: 'var(--color-purple)',
            name: 'Alpaca Markets', meta: 'Trading · hace 2 días',
            value: '+$340', valueColor: 'var(--color-success)',
            badge: <Badge variant="purple">Trading</Badge>,
          },
        ]} />
      </Section>
    </Page>
  )
}

/* ── Agents Hub ──────────────────────────────────────────── */
function AgentsHub() {
  const { toast } = useToast()

  const agents = [
    { name: 'CORTANA', status: 'active',  color: 'var(--accent)',          desc: 'Asistente principal' },
    { name: 'JARVIS',  status: 'active',  color: 'var(--color-success)',   desc: 'Automatización' },
    { name: 'SHODAN',  status: 'standby', color: 'var(--color-warning)',   desc: 'Seguridad y auditoría' },
  ]

  return (
    <Page>
      <PageHeader
        title="Agents Hub"
        subtitle="Control de agentes IA"
        actions={<Badge variant="cyan" dot pulse>2 activos</Badge>}
      />

      <Section label="estado de agentes">
        <Grid cols={3} gap={10}>
          {agents.map(agent => (
            <GlassCard key={agent.name}>
              <Row gap={10} style={{ marginBottom: 'var(--space-3)' }}>
                <span className="athenea-status-dot" style={{
                  background: agent.color,
                  animation: agent.status === 'active' ? 'athenea-pulse 2s infinite' : 'none',
                }} />
                <span style={{ fontSize: 'var(--text-xs)', color: 'var(--text-tertiary)', letterSpacing: '0.1em' }}>
                  {agent.name}
                </span>
              </Row>
              <div style={{ fontSize: 'var(--text-md)', fontWeight: 600, color: agent.color, marginBottom: '3px' }}>
                {agent.status === 'active' ? 'Active' : 'Standby'}
              </div>
              <div style={{ fontSize: 'var(--text-xs)', color: 'var(--text-secondary)', marginBottom: 'var(--space-3)' }}>
                {agent.desc}
              </div>
              <Button
                variant={agent.status === 'active' ? 'ghost' : 'secondary'}
                size="sm"
                onClick={() => toast(`${agent.name} ${agent.status === 'active' ? 'detenido' : 'activado'}`, agent.status === 'active' ? 'warning' : 'success')}
              >
                {agent.status === 'active' ? 'Detener' : 'Activar'}
              </Button>
            </GlassCard>
          ))}
        </Grid>
      </Section>

      <Divider />

      <Section label="actividad reciente">
        <ListCard items={[
          {
            avatar: 'C', avatarBg: 'var(--accent-dim)', avatarColor: 'var(--accent)',
            name: 'Cortana ejecutó tarea', meta: 'Resumen diario · hace 5 min',
            value: 'OK', valueColor: 'var(--color-success)',
            badge: <Badge variant="green">Completado</Badge>,
          },
          {
            avatar: 'J', avatarBg: 'var(--color-success-dim)', avatarColor: 'var(--color-success)',
            name: 'Jarvis procesó 14 emails', meta: 'Automatización · hace 22 min',
            value: '14', valueColor: 'var(--text-primary)',
            badge: <Badge variant="cyan">Auto</Badge>,
          },
          {
            avatar: 'S', avatarBg: 'var(--color-warning-dim)', avatarColor: 'var(--color-warning)',
            name: 'SHODAN en standby', meta: 'Seguridad · hace 1h',
            value: '—', valueColor: 'var(--text-tertiary)',
            badge: <Badge variant="amber">Standby</Badge>,
          },
        ]} />
      </Section>
    </Page>
  )
}
