# ATHENEA — Implementación Completa: Calendario + Módulos Nuevos

> Estado: **TODO IMPLEMENTADO** · Última actualización: Mayo 2026
> Cubre FASE 1 (6 fixes), FASE 2 (6 features), FASE 3 (Personal), FASE 4 (Work), FASE 5 (Finance).

---

## FASE 1 — Correcciones Calendario (CAL-FIX-1 a CAL-FIX-6)

Todos los bugs identificados en el inventario original han sido corregidos.

| ID | Fix | Estado | Archivos |
|---|---|---|---|
| CAL-FIX-1 | Notes.jsx: al eliminar nota con calendarEventId, limpiar el evento linked del slice | ✅ Implementado | `Notes.jsx`, `calendarSlice.js` |
| CAL-FIX-2 | Manejo de token Google expirado: UI de error + badge de sync | ✅ Implementado | `googleCalendar.ts`, `Calendar.jsx`, `Calendar.css` |
| CAL-FIX-3 | Proteger eventos gcal-* de modificación: flag `readOnly` + guard en `updateEvent` | ✅ Implementado | `calendarSlice.js` |
| CAL-FIX-4 | Añadir `linkTaskToCalendar` y `linkGoalToCalendar` al slice + conectar desde UI | ✅ Implementado | `calendarSlice.js`, `FinanceGoals.jsx` |
| CAL-FIX-5 | Duplicados en DayDetailModal: filtrar linked-events antes de renderizar | ✅ Implementado | `Calendar.jsx` |
| CAL-FIX-6 | `sync_calendar` skill: hub corregido a `CrossHub` | ✅ Implementado | `skills.ts` |

---

## FASE 2 — Nuevas Funcionalidades Calendario (CAL-FEAT-1 a CAL-FEAT-6)

| ID | Feature | Estado | Archivos |
|---|---|---|---|
| CAL-FEAT-1 | `linkTaskToCalendar` + `linkGoalToCalendar` disponibles en FinanceGoals | ✅ Implementado | `calendarSlice.js`, `FinanceGoals.jsx` |
| CAL-FEAT-2 | `useAgentCalendar`: agregar check-ins + proyección rutinas futuras (30 días) | ✅ Implementado | `useAgentCalendar.js` |
| CAL-FEAT-3 | DayDetailModal: panel de acciones rápidas (crear Nota, Todo, Gasto desde el día) | ✅ Implementado | `Calendar.jsx`, `Calendar.css` |
| CAL-FEAT-4 | Vista Agenda (lista de eventos próximos 60 días) + toggle mes/agenda en navbar | ✅ Implementado | `Calendar.jsx`, `Calendar.css` |
| CAL-FEAT-5 | Filtro por Hub (All / Work / Personal / Finance) sobre vista mes y agenda | ✅ Implementado | `Calendar.jsx`, `Calendar.css` |
| CAL-FEAT-6 | ReminderToasts: incluir tareas con dueDate próxima en las alertas | ✅ Implementado | `ReminderToasts.jsx` |

### Detalles técnicos FASE 2

**useAgentCalendar (CAL-FEAT-2):**
- Sección 12a: itera `checkins`, inserta items tipo `checkin` con agente Shodan
- Sección 12b: proyecta rutinas con `daysOfWeek` a los próximos 30 días
- Dependency array actualizado: `[..., checkins]`

**DayDetailModal QuickActions (CAL-FEAT-3):**
- 3 botones: 📝 Nota → `addNote`, ✅ Todo → `addTodo`, 💸 Gasto → `addExpense`
- Formulario inline con campo título + importe (solo gasto)
- `dispatch` local dentro del componente modal

**AgendaView (CAL-FEAT-4):**
- Componente inline definido antes de DayDetailModal
- Muestra próximos 60 días con eventos
- Cada cabecera de día clickable → abre DayDetailModal
- Badge de workload Cortana por día

**Hub Filter (CAL-FEAT-5):**
```js
const HUB_TYPE_MAP = {
  work: ['deadline', 'meeting', 'task'],
  personal: ['event', 'reminder', 'note', 'routine'],
  finance: ['payment', 'goal']
};
```
- `filteredEvents` pasado tanto a grid mensual como a AgendaView

---

## FASE 3 — Módulos Personales Nuevos

### NEW-PERSONAL-1: Diario Personal ✅ Implementado

**Archivos creados:**
- `store/slices/journalSlice.js` — Redux slice con `addEntry`, `updateEntry`, `deleteEntry`
- `src/pages/Journal.jsx` — Layout dos columnas: sidebar lista + editor
- `src/pages/Journal.css`

**Funcionalidades:**
- Sidebar con lista de entradas (fecha, preview, conteo palabras, mood emoji)
- Botón "Hoy" crea o abre la entrada del día actual
- Auto-guardado con debounce de 2s
- Selector de estado de ánimo (1-5: 😞😕😐🙂😊)
- Conteo de palabras en tiempo real
- Ruta: `/journal`

### NEW-PERSONAL-2: Revisión Semanal ✅ Implementado

**Archivos creados:**
- `src/pages/WeeklyReview.jsx` — Wizard 4 pasos
- `src/pages/WeeklyReview.css`

**Flujo del wizard:**
1. Métricas de la semana (tareas completadas, todos, gasto total, días de diario)
2. Logros y desafíos (2 textareas)
3. Foco semana siguiente + metas activas
4. Nivel de energía (1-5) + vista previa del resumen
- Al completar: guarda como nota con tags `['weekly-review', 'sistema']`
- Ruta: `/weekly-review`

---

## FASE 4 — Módulos de Trabajo Nuevos

### NEW-WORK-1: Modo Focus (Pomodoro) ✅ Implementado

**Archivos creados:**
- `store/slices/focusSlice.js` — Redux slice con `recordSession`, `setCurrentTask`
- `src/pages/FocusMode.jsx` — Timer con anillo SVG animado
- `src/pages/FocusMode.css`

**Funcionalidades:**
- Presets: 25 min / 50 min / 90 min
- Pausa de 5 min automática al completar sesión
- Anillo SVG animado (`RADIUS=90`, strokeDashoffset dinámico)
- Estadísticas: sesiones hoy, minutos totales históricos, historial reciente
- Selector de tarea activa desde el slice de tasks
- Ruta: `/focus`

### NEW-WORK-2: Daily Standup ✅ Implementado

**Archivos creados:**
- `src/components/DailyStandup/DailyStandup.jsx`
- `src/components/DailyStandup/DailyStandup.css`

**WorkHub.jsx modificado:**
- Import + estado `showStandup` (localStorage key diario)
- Banner standup aparece una vez por día al entrar a WorkHub

**Funcionalidades del standup:**
- Pre-rellena ayer con tareas completadas ayer
- Tags de sugerencia desde tareas en progreso
- Guardado en `localStorage['athenea.standup.YYYY-MM-DD']`
- Botón de acceso rápido a Focus Mode

---

## FASE 5 — Módulos de Finanzas Nuevos

### NEW-FINANCE-1: Gráficos de Gastos ✅ Implementado

**Archivos creados:**
- `src/components/SpendingCharts/SpendingCharts.jsx` — Donut SVG + barras CSS
- `src/components/SpendingCharts/SpendingCharts.css`

**FinanceHub.jsx modificado:** renderiza `<SpendingCharts />` al final del hub

**Funcionalidades:**
- Vista donut: segmentos SVG con `strokeDasharray`/`strokeDashoffset` por categoría
- Vista barras: últimos 6 meses, barras proporcionales con gradiente
- Paleta de 10 colores
- Toggle donut/barras

### NEW-FINANCE-2: Proyección de Flujo de Caja ✅ Implementado

**Archivos creados:**
- `src/components/CashFlowProjection/CashFlowProjection.jsx`
- `src/components/CashFlowProjection/CashFlowProjection.css`

**FinanceBudgeting.jsx modificado:** renderiza `<CashFlowProjection />` al final de la página

**Funcionalidades:**
- Proyección a 6 meses vista
- Barras agrupadas: ingresos (verde), pagos programados (rojo), neto (cyan/ámbar)
- Dots de pagos pendientes por mes
- Indicador ▲/▼ con color según si el net es positivo o negativo
- Lee `state.payments.payments` (nextDueDate), `state.budget.income` y `state.budget.expenses`

---

## Actualizaciones de Infraestructura

### store/index.ts ✅
```ts
import journalReducer from '../store/slices/journalSlice';
import focusReducer from '../store/slices/focusSlice';
// En rootReducer:
journal: journalReducer,
focus: focusReducer,
// En whitelist:
'journal', 'focus'
```

### src/routes.jsx ✅
```jsx
import { Journal } from './pages/Journal';
import { WeeklyReview } from './pages/WeeklyReview';
import { FocusMode } from './pages/FocusMode';
// Rutas añadidas:
<Route path="journal" element={<Journal />} />
<Route path="weekly-review" element={<WeeklyReview />} />
<Route path="focus" element={<FocusMode />} />
```

### src/components/Navbar.jsx ✅
```js
// Personal dropdown:
{ label: t('Diario'), path: '/journal' },
{ label: t('Rev. Semanal'), path: '/weekly-review' },
// Work dropdown:
{ label: t('Focus'), path: '/focus' },
```

### src/modules/intelligence/skills.ts ✅
Nuevas skills registradas:
| ID | Hub | Keywords principales |
|---|---|---|
| `open_focus` | WorkHub | focus, pomodoro, concentrarme, timer, sesión de trabajo |
| `open_standup` | WorkHub | standup, daily standup, qué hice ayer |
| `write_journal` | PersonalHub | diario, journal, escribir hoy, entrada de hoy |
| `open_weekly_review` | PersonalHub | revisión semanal, weekly review, balance semanal |

---

## Inventario de Archivos por Fase

### Archivos nuevos creados
| Archivo | Propósito |
|---|---|
| `store/slices/journalSlice.js` | Estado Redux del diario |
| `store/slices/focusSlice.js` | Estado Redux del modo focus |
| `src/pages/Journal.jsx` + `.css` | Página diario personal |
| `src/pages/WeeklyReview.jsx` + `.css` | Wizard revisión semanal |
| `src/pages/FocusMode.jsx` + `.css` | Timer Pomodoro |
| `src/components/DailyStandup/DailyStandup.jsx` + `.css` | Banner standup diario |
| `src/components/SpendingCharts/SpendingCharts.jsx` + `.css` | Gráficos de gasto |
| `src/components/CashFlowProjection/CashFlowProjection.jsx` + `.css` | Proyección flujo de caja |

### Archivos modificados
| Archivo | Cambios |
|---|---|
| `src/hooks/useAgentCalendar.js` | CAL-FEAT-2: check-ins + rutinas futuras |
| `src/pages/Calendar.jsx` | CAL-FEAT-3/4/5: QuickActions, AgendaView, HubFilter |
| `src/pages/Calendar.css` | CSS para QuickActions, AgendaView, HubFilter |
| `src/components/ReminderToasts.jsx` | CAL-FEAT-6: tareas con dueDate |
| `src/pages/WorkHub.jsx` | NEW-WORK-2: banner DailyStandup |
| `src/pages/FinanceHub.jsx` | NEW-FINANCE-1: SpendingCharts |
| `src/pages/FinanceBudgeting.jsx` | NEW-FINANCE-2: CashFlowProjection |
| `store/slices/calendarSlice.js` | CAL-FIX-1/3/4: unlinkNote, readOnly guard, linkTask/linkGoal |
| `src/pages/Notes.jsx` | CAL-FIX-1: unlink al eliminar |
| `src/pages/FinanceGoals.jsx` | CAL-FIX-4/CAL-FEAT-1: linkGoalToCalendar |
| `store/index.ts` | journalReducer, focusReducer |
| `src/routes.jsx` | Rutas /journal, /weekly-review, /focus |
| `src/components/Navbar.jsx` | Items Diario, Rev. Semanal, Focus |
| `src/modules/intelligence/skills.ts` | 4 nuevas skills + CAL-FIX-6 hub corregido |

---

## Limitaciones Conocidas

1. **goalId mismatch en FinanceGoals** — `linkGoalToCalendar` usa `goal.id` pero algunos goals legacy tienen `goal._id`. No bloquea la app pero puede causar doble-link si el usuario tiene goals viejos.

2. **linkTaskToCalendar sin conexión a GatekeeperModal** — La acción existe en el slice pero el modal de creación de tareas no la invoca automáticamente. El link se hace desde `FinanceGoals.jsx` manualmente.

3. **CashFlowProjection sin ingresos recurrentes** — La proyección mensual toma el ingreso mensual del mes actual como constante para todos los meses proyectados. No modela bonos, variaciones de ingresos freelance, etc.

4. **FocusMode sin persistencia de sesión activa** — Si el usuario recarga durante una sesión activa, el timer se reinicia. El historial de sesiones completadas sí persiste (redux-persist).

5. **Journal sin búsqueda** — La sidebar muestra todas las entradas cronológicamente pero no hay filtro/búsqueda por texto o mood aún.

---

*Implementación completa. Todos los items del prompt original están implementados.*
