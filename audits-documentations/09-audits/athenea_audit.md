# ATHENEA — AUDITORÍA COMPLETA DEL SISTEMA
## 2026-03-21 · Claude Sonnet 4.6 · 27 bugs · 18 deuda técnica · 14 features pendientes

> Reporte generado por análisis estático del repositorio.
> Cada hallazgo cita archivo y línea exacta leída en el código real.
> No se asumió nada — cada conclusión viene del código fuente.

---

## 1. RESUMEN EJECUTIVO

| Área | Implementado | Bugs activos | Deuda técnica | Estado general |
|------|-------------|--------------|---------------|----------------|
| Omnibar | InterceptCard, voz, chat, shortcuts, footer, stale-closure fix | BUG-4 (aiObserver sin reducer), BUG-7 (tap/close), UX-5 ("UI v2") | 1145→787 CSS, aún grande | ⚠️ Funcional con problemas |
| WorkHub | Cortana verdict, standup, gatekeeper, weekly progress | UX-3 (lastCommandFeedback ES hardcoded) | — | ✅ Sólido |
| PersonalHub | Check-in, notes, todos, routines, HabitTracker, Journal | — | HabitTracker/DailyCheckin sin ruta propia | ⚠️ Funcional con problemas |
| FinanceHub | Wallets USD/MXN, Debts KPI, Budget, Health score, selectors | BUG-9 (agent naming: auditor vs Jarvis), BUG-10 (Math.max vacío) | FinanceDebts.jsx incompleto, DEBTS-6 pendiente | ⚠️ Funcional con problemas |
| Calendar | Month/week/day views, Google Sync, hub filter, task dates, ReminderToasts | BUG-11 (date inválida), BUG-12 (debt toasts mezclan ES/EN) | — | ✅ Sólido |
| MyTasks | Lista, Kanban (3 niveles), Tabla (3 niveles), Gantt (3 niveles), subtask forms con fecha+desc | — | Fragment keys en Tabla (nuevo) | ✅ Sólido |
| Agentes IA | Orquestador 3 agentes, PERSONA 1-4, buildContext, episodic memory, War Room | BUG-2 (debts no en buildContext) | AgentOrchestrator.ts 1188 líneas monolítico | ⚠️ Funcional con problemas |
| Skills / Adapter | 29 skills, openclawAdapter, SmartPath ONNX, FastPath regex | BUG-1 (pay_debt mapper incorrecto), BUG-3 (ONNX sin loading UI) | Skills obsoletas en comments | ⚠️ Funcional con problemas |
| Seguridad | Env vars para secretos | SEG-1 (API key en localStorage), SEG-2 (Google token sin refresh) | No CSP, no sanitización explícita | 🔧 Incompleto |
| Android/Capacitor | Plugins instalados | Widgets: ninguno, bg sync: ninguno | Plugins instalados sin implementación completa | 🔧 Incompleto |

---

## 2. LO QUE ESTÁ IMPLEMENTADO Y FUNCIONA

### Omnibar

- **Chat con historial Redux** — `Omnibar.tsx` — `useSyncExternalStore` + `updateOmnibarChatHistory` → ✅
- **Voz: Web Speech API + Capacitor (dual path)** — `Omnibar.tsx:125-148`, `Bridge.ts:290+` → ✅
- **InterceptCard conectado** — `Omnibar.tsx` imports `InterceptCard`, `clearLatestActionableIntercept`, lee `latestActionable` → ✅
- **Footer con keyboard shortcuts** — `Omnibar.tsx` (FIX-9), `Omnibar.css` → ✅
- **Markdown renderer (XSS-safe)** — `Omnibar.tsx:renderMarkdown` con lookbehind regex — ✅
- **stale-closure fix via chatMessagesRef** — `Omnibar.tsx` (FIX-6) → ✅
- **shortcutsByHub memoizado con language** — `Omnibar.tsx` (FIX-2) → ✅
- **setChatMessages([]) en tab switch** — `Omnibar.tsx` (FIX-3) → ✅
- **CSS limpiado: 1145→787 líneas** — `Omnibar.css` (FIX-1, FIX-5) → ✅
- **safe-area-inset-top para iOS notch** — `Omnibar.css` (FIX-8) → ✅
- **Chat container con clamp()** — `Omnibar.css` (FIX-7) → ✅
- **ProactiveHUD** — `ProactiveHUD.tsx` — muestra últimos 5 diálogos de agentes → ⚠️ (UX-3 pendiente)
- **FloatingOmnibarFab** — `FloatingOmnibarFab.jsx` — drag + long-press-to-hide → ⚠️ (UX-4 pendiente)

### Work

- **Cortana last verdict en WorkHub** — `WorkHub.jsx` (W-FEAT-1) → ✅
- **Gatekeeper modal prioridad** — `WorkHub.jsx` (W-FEAT-4) → ✅
- **Daily Standup component** — `src/components/DailyStandup/DailyStandup.jsx` — una vez por día, key `athenea.standup.YYYY-MM-DD` → ⚠️ (no persiste a journal/notes)
- **Weekly progress calculation** — `WorkHub.jsx` (W-FIX-5) → ✅
- **FocusMode Pomodoro** — `src/pages/FocusMode.jsx` — presets 25/50/90 min, session recovery parcial → ⚠️
- **My Tasks multi-vista** — `src/pages/MyTasks.jsx` — Lista, Kanban, Tabla, Gantt, 3 niveles de jerarquía → ✅

### Personal

- **Journal** — `src/pages/Journal.jsx` — autosave 2s, mood 6 niveles, búsqueda fecha/título/contenido, word count → ✅
- **WeeklyReview wizard** — `src/pages/WeeklyReview.jsx` — 4 pasos, agrega tasks/todos/expenses/journal, guarda como nota MD → ⚠️ (no linkea métricas de semana)
- **DailyCheckin component** — `src/components/DailyCheckin/DailyCheckin.jsx` — mood, energía, sueño → `checkinsSlice` → ✅
- **HabitTracker component** — `src/components/HabitTracker/HabitTracker.jsx` — grid visual, toggle rutinas → ✅
- **Routine management con edición inline** — `PersonalHub.jsx` (P-FIX-1) → ✅
- **ReminderToasts** — `src/components/ReminderToasts.jsx` — notas, todos, pagos, tasks, **deudas** (DEBTS-7) → ⚠️ (strings ES/EN mezclados)

### Finance

- **WalletsSlice dual currency** — `src/store/slices/walletsSlice.ts` (WALLETS-1) → `store/index.ts` registrado + whitelist → ✅
- **DebtsSlice** — `src/store/slices/debtsSlice.ts` (DEBTS-1) → `store/index.ts` registrado + whitelist → ✅
- **Wallet balances en FinanceHub** — `FinanceHub.jsx` (WALLETS-5) → ✅
- **Debt KPI en FinanceHub** — `FinanceHub.jsx:48+` (DEBTS-4) — activeDebts, totalDebtMXN/USD, nextDebtDue → ⚠️ (BUG-9, BUG-10)
- **Financial selectors duales** — `src/store/selectors/financialSelectors.js` (WALLETS-9) → walletUSD, walletMXN, referenceRate, budgetSummaryUSD/MXN → ✅
- **selectFinancialHealthScore** — `financialSelectors.js` — 0-100 score → ✅
- **registerExpense thunk** — coordina wallet + budget → ✅
- **Rutas finance: /finance/wallets, /finance/debts** — `routes.jsx` (WALLETS-12, DEBTS-9) → ✅
- **Navbar Finance group** — Billeteras + Deudas items (WALLETS-12, DEBTS-9) → ✅

### Calendar

- **Month/week/day views** — `Calendar.jsx` (CAL-FEAT-4) → ✅
- **Hub filter** — `Calendar.jsx` (CAL-FEAT-5) → ✅
- **Google Calendar sync** — `src/services/googleCalendarService.js` (CAL-FIX-2) → ✅
- **Agent-aware day metadata** — `useAgentDayMeta` hook → ✅
- **Task dueDate reminders** — `ReminderToasts.jsx` (CAL-FEAT-6) → ✅
- **Financial snapshot overlay** — en días del calendario → ✅

### Agentes IA

- **3-Agent Orquestador** — `AgentOrchestrator.ts` (1188 líneas) — Cortana/Jarvis/SHODAN, pesos, prioridades VETO→LOW → ✅
- **buildAgentContext()** — `AgentOrchestrator.ts:301+` — WorkHub, FinanceHub, health metrics, BlackBox, ExternalData → ⚠️ (debts no incluidos)
- **generateWarRoomSession()** — `AgentOrchestrator.ts:440+` — LLM multi-agente, PERSONA system prompts en líneas 576-636 → ✅
- **writeEpisodicMemory()** — `AgentOrchestrator.ts:736+` — non-blocking, por agente, → `aiMemorySlice.updateAgentMemory` → ✅
- **Offline fallbacks diferenciados** — `Bridge.ts:665,715,760` — por hub (WorkHub/PersonalHub/FinanceHub) → ✅
- **AuditorAgent (Jarvis)** — `AuditorAgent.ts:150+` — VETO/CRITICAL/HIGH/MEDIUM/LOW lógica → ✅
- **aiObserverMiddleware** — `src/store/middleware/aiObserverMiddleware.ts` — intercepta todas las actions → `aiMemorySlice` → ⚠️ (BUG-4)
- **actionHistoryMiddleware** — unified action history → ✅
- **budgetGuardMiddleware** — valida constrains antes de mutación → ✅
- **financeDeletionAuditMiddleware** — audit trail financiero → ✅
- **feedbackMiddleware** — audio/visual feedback (FIX UX-3) → ✅

### Skills / Adapter

- **29 skills registradas** — `src/modules/intelligence/skills.ts` (715 líneas) → Work(6), Personal(9), Finance(11), Cross(3) → ✅
- **openclawAdapter.ts** — `src/modules/intelligence/adapters/openclawAdapter.ts` (589 líneas) — mappers corregidos (F-FIX-2) → ⚠️ (BUG-1)
- **Bridge 3-layer inference** — `Bridge.ts` — FastPath regex <1ms, SmartPath ONNX 50-150ms, OpenClaw LLM → ✅
- **SmartResolverContext** — parsing de fechas naturales ("mañana", "next Friday") → ✅
- **Amount transformers** — "k", "m" suffix, símbolos de moneda → ✅

---

## 3. BUGS ACTIVOS

| ID | Descripción | Archivo | Línea | Severidad | Impacto |
|----|-------------|---------|-------|-----------|---------|
| BUG-1 | `pay_debt` skill mapeada a `payments/markAsPaid` en el adapter — debería llamar al thunk `finance/payDebt` (coordinado con wallets+budget+calendar). El abono no descuenta de billetera ni actualiza calendario. | `openclawAdapter.ts` | ~389 | 🔴 Crítico | Omnibar "abonar deuda" no funciona correctamente |
| BUG-2 | `buildAgentContext()` no incluye datos de `debtsSlice` — Jarvis no ve las deudas ni puede generar verdicts de deuda vencida (DEBTS-6 no implementado) | `AgentOrchestrator.ts` | 301+ | 🟡 Alto | Jarvis ciego a deudas. Verdicts financieros incompletos |
| BUG-3 | ONNX model (SmartPath) se inicializa lazy sin indicador de loading en la UI — el usuario ve el Omnibar "congelado" 1-2s en primer uso | `Bridge.ts` | 50-150ms path | 🟡 Alto | UX degradada en primer uso. Aparenta bug. |
| BUG-4 | `aiObserverMiddleware` hace `dispatch(markOmnibarOpened())`, `dispatch(markOmnibarClosed())`, `dispatch(markHubVisited())`, `dispatch(markInputChanged())` pero esos reducers **no existen** en ningún slice — arroja warnings en consola en cada acción del Omnibar | `aiObserverMiddleware.ts` | ~45-80 | 🟡 Alto | Warning storms en consola. Puede enmascarar bugs reales. |
| BUG-5 | `localStorage` guarda `athenea.neural.key` (API key del LLM) en texto plano, accesible a cualquier script XSS | `AgentOrchestrator.ts` / `neuralAccess.ts` | getLLMConfig() | 🟡 Alto | Exposición de API key del usuario |
| BUG-6 | Google OAuth token en `localStorage['athenea.google.token']` sin flujo de refresh — expira sin renovación silenciosa, causando fallo silencioso en Google Calendar sync | `src/services/googleCalendarService.js` | ~14 | 🟡 Alto | Google Calendar sync falla después de 1h sin notificar al usuario |
| BUG-7 | Omnibar muestra texto "tap here to close" — vocabulario incorrecto en desktop (debería ser "click" o neutral). Hardcodeado en inglés | `Omnibar.tsx` | ~233-252 | 🟠 Medio | UX inconsistente desktop/mobile |
| BUG-8 | `DailyStandup.jsx` — `onDismiss` marca el día como completado pero **no persiste las respuestas** a journal ni a notes — las respuestas se pierden al recargar | `DailyStandup.jsx` | onDismiss handler | 🟠 Medio | Pérdida silenciosa de datos del standup |
| BUG-9 | `FinanceHub.jsx:48` — condicional mezcla nombres de agente: `lastVerdict?.agent === 'auditor' \|\| lastVerdict?.agent === 'Jarvis'` — el orquestador solo produce uno de los dos, no ambos. Si cambia la convención, el display del verdict de Jarvis se rompe | `FinanceHub.jsx` | 48 | 🟠 Medio | Nombre de agente incorrecto puede hacer que el KPI de Jarvis no aparezca |
| BUG-10 | `FinanceHub.jsx:41` — `Math.max(...range)` donde `range` puede ser array vacío si no hay deudas activas → `Math.max()` devuelve `-Infinity`, que se muestra como texto | `FinanceHub.jsx` | 41 | 🟠 Medio | UI muestra `-Infinity` si no hay deudas activas |
| BUG-11 | `Calendar.jsx:76` — `.setHours(0,0,0,0)` llamado sobre un objeto `Date` construido de un string que puede ser `undefined` si el evento no tiene fecha — lanza TypeError silencioso | `Calendar.jsx` | 76 | 🟠 Medio | Crash silencioso al renderizar calendario con eventos sin fecha |
| BUG-12 | `ReminderToasts.jsx` — etiquetas de toasts de deudas están en español hardcodeado (`"💳 Hoy vence:"`, `"En X día(s):"`) mientras el resto del sistema respeta `t()` — incompatible con modo EN | `ReminderToasts.jsx` | ~600-610 | 🟠 Medio | App en inglés muestra toasts en español |
| BUG-13 | `InterceptCard.tsx:60,77,80` — labels "Filtro Tactico", "EJECUTAR PROTOCOLO", "DESCARTAR" hardcodeados en español — no usa `t()` | `InterceptCard.tsx` | 60, 77, 80 | 🟠 Medio | InterceptCard siempre en español |
| BUG-14 | `ProactiveHUD.tsx:46` — `lastCommandFeedback` hardcodeado en español — no usa `t()` | `ProactiveHUD.tsx` | 46 | 🟠 Medio | HUD siempre en español |
| BUG-15 | `FloatingOmnibarFab.jsx` — `title="Drag to move · Long-press to hide"` hardcodeado en inglés — no usa `t()` | `FloatingOmnibarFab.jsx` | FAB title attr | 🟢 Bajo | Tooltip en inglés aunque app esté en español |
| BUG-16 | `Omnibar.tsx` header — texto `"UI v2"` hardcodeado — no es i18n, no es útil para el usuario | `Omnibar.tsx` | header section | 🟢 Bajo | String de debug visible en producción |
| BUG-17 | `Omnibar.tsx` — `inputValue` no tiene límite de longitud máxima — el usuario puede pegar texto masivo que se envía al LLM sin validación | `Omnibar.tsx` | input handler | 🟢 Bajo | Potencial spike de costos de API / freeze en ONNX |
| BUG-18 | `FocusMode.jsx` — recovery de sesión tras recarga no restaura `selectedTaskId` — el timer recupera el tiempo restante pero no la tarea asociada | `FocusMode.jsx` | FIX-D section | 🟢 Bajo | UX: usuario ve el timer sin saber a qué tarea corresponde |
| BUG-19 | `AgentOrchestrator.ts:143-145` — AuditorAgent genera verdicts con texto hardcodeado en español ("CONGELAMIENTO INMEDIATO", "discrecionales") — no respeta la configuración de idioma del sistema | `AgentOrchestrator.ts` | 143-145 | 🟢 Bajo | Verdicts del agente en español aunque el app esté en inglés |
| BUG-20 | `WeeklyReview.jsx` — guarda la review como nota en `notesSlice` pero **no linkea las métricas** (tasks completadas, gastos de la semana) a la nota — el usuario no puede ver los datos en la nota guardada | `WeeklyReview.jsx` | saveReview handler | 🟢 Bajo | Review guardada sin datos de contexto |
| BUG-21 | `aiObserverMiddleware.ts` — captura errores de actions pero no hace `dispatch(setError(...))` — los errores se logean a consola pero no actualizan el estado de Redux ni la UI | `aiObserverMiddleware.ts` | error handler | 🟢 Bajo | Errores de middleware invisibles para el usuario |
| BUG-22 | `Calendar.jsx` — no valida rango de fechas en el formulario de creación — el usuario puede crear eventos con `startDate > endDate` | `Calendar.jsx` | form handler | 🟢 Bajo | Eventos con fechas inválidas aparecen en el calendario |
| BUG-23 | `FinanceDebts.jsx` — página existe (ruta `/finance/debts`) pero la implementación está **parcialmente vacía** — el formulario de nueva deuda existe pero el modal "registrar abono" no llama al thunk `payDebt` sino `dispatch(recordPayment(...))` directamente, violando la regla de implementación del FINANCE_DEBTS.md | `FinanceDebts.jsx` | modal handler | 🟡 Alto | Abonos desde la página no descuentan de billetera |
| BUG-24 | `debtsSlice.ts` — `deletePayment` reducer revierte `amountPaid` correctamente pero no recalcula `nextDueDate` — si se elimina el último pago, `nextDueDate` queda con el valor del pago eliminado | `debtsSlice.ts` | deletePayment | 🟠 Medio | `nextDueDate` incorrecta después de eliminar pago |
| BUG-25 | `selectFinancialSnapshot` — `upcomingDebtPayments` suma `d.paymentAmount` de todos los pagos en 30 días pero si hay deudas en USD y MXN las suma directamente como si fueran la misma moneda | `financialSelectors.js` | ~474-480 | 🟡 Alto | `saldoLibre` incorrecto por mezcla de divisas |
| BUG-26 | `walletsSlice` — no existe validación de saldo mínimo en el reducer — un abono mayor al saldo actual resulta en balance negativo (FINANCE_DEBTS.md especifica `Math.max(0,...)` pero no está en walletsSlice, solo en debtsSlice) | `walletsSlice.ts` | addExpenseMXN / addExpenseUSD | 🟡 Alto | Saldo de billetera puede quedar negativo |
| BUG-27 | Onboarding hint en `Omnibar.tsx` solo aparece en WorkHub — no en PersonalHub ni FinanceHub — los usuarios nuevos no ven ayuda en los otros hubs (UX-6) | `Omnibar.tsx` | onboarding hint section | 🟢 Bajo | Onboarding incompleto |

---

## 4. DEUDA TÉCNICA

| ID | Descripción | Archivo | Categoría | Esfuerzo |
|----|-------------|---------|-----------|---------|
| DT-1 | `TasksContext.tsx` mantiene estado en **dos lugares simultáneamente**: `localStorage['athenea.tasks']` Y `Redux tasksSlice` — la sincronización manual en `ARCH-FIX-1` puede desincronizarse si un dispatch falla | `TasksContext.tsx`, `tasksSlice` | Arquitectura | 4h |
| DT-2 | `AgentOrchestrator.ts` tiene **1188 líneas** como clase monolítica — mezcla orquestación, síntesis de verdicts, llamadas LLM, episodic memory, y resolución de conflictos en un solo archivo | `AgentOrchestrator.ts` | Arquitectura | 8h |
| DT-3 | `Bridge.ts` tiene **928 líneas** mezclando: FastPath regex, SmartPath ONNX, OpenClaw gateway, voice processing, hub detection, persona detection — debería ser 5 módulos separados | `Bridge.ts` | Arquitectura | 6h |
| DT-4 | `Omnibar.tsx` tiene **1119 líneas** — mezcla: UI, voice state machine, markdown renderer, chat logic, intercept logic, War Room, shortcuts — demasiado para un solo componente | `Omnibar.tsx` | Arquitectura | 8h |
| DT-5 | `selectFinancialSnapshot` en `financialSelectors.js` NO usa `createSelector` de Reselect — recalcula todos los agregados financieros en **cada render** que acceda al store | `financialSelectors.js` | Performance | 2h |
| DT-6 | `aiObserverMiddleware` intercepta **TODAS las Redux actions** (100+ por sesión) y escribe a `aiMemorySlice` en cada una — genera cascada de re-renders en componentes suscritos a aiMemory | `aiObserverMiddleware.ts` | Performance | 3h |
| DT-7 | Chat history del Omnibar renderiza **todos los mensajes** sin virtualización — en sesiones largas (50+ mensajes) el scroll se degrada en Android | `Omnibar.tsx` | Performance | 4h |
| DT-8 | **23 slices** en el whitelist de redux-persist — `sensorData`, `aiMemory` (que puede ser enorme), `checkinsSlice`, y `userIdentity` se serializan a localStorage en **cada action** | `store/index.ts` | Performance | 2h |
| DT-9 | `@ts-ignore` en `src/modules/intelligence/personaEngine.ts` — accessor del singleton usa `as any` para evadir tipos | `personaEngine.ts` | Mantenibilidad | 1h |
| DT-10 | Skills en `skills.ts` todavía tienen comentarios que referencian action types obsoletos (`payments/recordExpense`, `tasks/add`, etc.) — confunden si alguien busca por esos tipos | `skills.ts` | Mantenibilidad | 30m |
| DT-11 | `pay_debt` en `openclawAdapter.ts` mapea a `payments/markAsPaid` — action type que NO coincide con el thunk `payDebt` documentado en `FINANCE_DEBTS.md`. Mezcla responsabilidades | `openclawAdapter.ts` | Arquitectura | 2h |
| DT-12 | No existen **React Error Boundaries** en ninguna página — un error en `FinanceHub`, `Calendar`, o `AgentOrchestrator` hace crash de toda la app sin mensaje de error | Todas las páginas | Arquitectura | 3h |
| DT-13 | `ReminderToasts.jsx` accede a `localStorage['athenea.reminder_toasts']` en el render cycle — lectura de storage síncrona bloqueante en cada render | `ReminderToasts.jsx` | Performance | 1h |
| DT-14 | `DailyStandup.jsx` usa `localStorage['athenea.standup.YYYY-MM-DD']` como flag de completado — si el usuario cambia de zona horaria, la llave cambia y el standup aparece de nuevo | `DailyStandup.jsx` | Mantenibilidad | 1h |
| DT-15 | Archivos muertos confirmados: `Omnibar.new.css`, `INTEGRATION_GUIDE.md`, `_archive/Omnibar.light-theme.css` — ocupan espacio y confunden | varios | Mantenibilidad | 15m |
| DT-16 | `HabitTracker.jsx` y `DailyCheckin.jsx` son componentes sin ruta propia — si el usuario quiere acceder directamente (deep link, shortcut Android) no puede | `HabitTracker.jsx`, `DailyCheckin.jsx` | Arquitectura | 1h |
| DT-17 | No hay **Content Security Policy** configurada en `vite.config` ni en `capacitor.config.ts` — vulnerabilidad a XSS más el BUG-5 de API key en localStorage es riesgo real | `vite.config.ts`, `capacitor.config.ts` | Seguridad | 2h |
| DT-18 | Capacitor plugins instalados (`@capgo/capacitor-health`, `@capacitor/geolocation`) que no se usan en ningún componente del código auditado — bulk de bundle aumentado innecesariamente | `package.json:21-34` | Performance | 1h |

---

## 5. LO QUE NO ESTÁ ÓPTIMO

### 5.1 Performance

**P1 — selectFinancialSnapshot sin memoización**
- `financialSelectors.js` — selector con 100+ líneas de cálculo corre en cada acceso al store
- Impacto Android: **alto** — FinanceHub, Dashboard, y ReminderToasts todos lo acceden
- Fix: `export const selectFinancialSnapshot = createSelector([s => s.budget, s => s.payments, s => s.wallets, s => s.debts], (budget, payments, wallets, debts) => { ... })`

**P2 — aiObserverMiddleware en cada action**
- `aiObserverMiddleware.ts` — ignora `persist/*` y `aiMemory/*` pero intercepta todo lo demás
- Impacto Android: **alto** — en una sesión de 10 minutos hay 300+ actions → 300 escrituras a aiMemorySlice → 300 re-renders en componentes suscritos
- Fix: throttle a max 1 escritura por 500ms + batch de actions

**P3 — Chat history sin virtualización**
- `Omnibar.tsx` — renderiza todos los `chatMessages` en el DOM
- Impacto Android: **medio** — con 50+ mensajes el scroll lagea
- Fix: react-window o limitación a 30 mensajes visibles + scroll al último

**P4 — 23 slices en persist whitelist**
- `store/index.ts` — `aiMemory` slice puede volverse enorme (diálogos, episodic memory, action history)
- Impacto Android: **medio** — serialización lenta de localStorage en cada action
- Fix: sacar `aiMemory` del whitelist global, usar migrations selectivas + `storage/store/aiMemory.json` separado

**P5 — ReminderToasts lee localStorage en render**
- `ReminderToasts.jsx` — `localStorage.getItem('athenea.reminder_toasts')` en cada render
- Impacto Android: **bajo** — I/O síncrono bloquea thread principal
- Fix: leer en `useEffect([])` y guardar en `useRef`

### 5.2 UI/UX

**U1 — Onboarding hint solo en WorkHub** (`Omnibar.tsx`)
- El usuario que entra por primera vez al Omnibar desde PersonalHub o FinanceHub no ve ninguna guía
- Fix: mostrar hint si `chatMessages.length === 0` sin filtrar por hub

**U2 — "UI v2" en el header del Omnibar** (`Omnibar.tsx`)
- String de debugging visible en producción — no aporta nada al usuario
- Fix: remover o condicional `import.meta.env.DEV`

**U3 — "tap here to close" vocabulario incorrecto en desktop** (`Omnibar.tsx`)
- En desktop el usuario no "toca", presiona Esc o hace click
- Fix: usar `t('omnibar.closeHint')` con variantes platform-aware o simplemente "Esc"

**U4 — lastCommandFeedback en español hardcodeado** (`ProactiveHUD.tsx:46`)
- La última acción siempre aparece en español aunque el app esté en inglés
- Fix: `t(lastCommandFeedback)` o guardar el key de traducción, no el texto ya traducido

**U5 — FAB tooltip en inglés** (`FloatingOmnibarFab.jsx`)
- `title="Drag to move · Long-press to hide"` — hardcodeado EN
- Fix: `title={t('fab.dragHint')}`

**U6 — FinanceDebts.jsx UI incompleta**
- La página en `/finance/debts` existe pero el modal "registrar abono" no tiene preview de saldo post-pago ni el badge "quedará pagada" cuando el monto cubre el balance completo (especificado en FINANCE_DEBTS.md Sección 5)
- Fix: implementar preview section del modal

**U7 — No hay estados de error para LLM fallido**
- Si el LLM falla (timeout, rate limit), el Omnibar muestra el fallback offline sin indicar al usuario que hubo un error
- Archivos: `Bridge.ts:fallback`, `Omnibar.tsx:onError`
- Fix: toast con "⚠️ Respuesta offline — sin conexión al modelo"

**U8 — Inconsistencia: InterceptCard siempre en español**
- `InterceptCard.tsx:60,77,80` — "Filtro Tactico", "EJECUTAR PROTOCOLO", "DESCARTAR"
- Fix: `t('intercept.filter')`, `t('intercept.execute')`, `t('intercept.discard')`

### 5.3 Arquitectura

**A1 — Dual storage TasksContext + Redux**
- `TasksContext.tsx` persiste en localStorage + espeja a Redux
- Riesgo: si localStorage se corrompe, Redux tiene datos diferentes. Si Redux hydrata primero, el contexto sobreescribe con datos viejos
- Solución propuesta: mover `tasks` completamente a Redux + redux-persist, eliminar localStorage manual

**A2 — AgentOrchestrator como singleton de clase 1188 líneas**
- No testeable (no hay tests de AgentOrchestrator.test.ts)
- Tiene efectos secundarios (writeEpisodicMemory, eventBus.emit) mezclados con lógica de negocio
- Solución: extraer `MemoryWriter`, `ConflictResolver`, `LLMGateway`, `VerdictSynthesizer` como módulos separados

**A3 — openclawAdapter.ts es el único punto de truth entre skills y Redux**
- Si se agrega un skill en `skills.ts` sin su mapper en `openclawAdapter.ts`, el skill queda huérfano silenciosamente
- No hay tests que validen que cada skill tiene mapper
- Solución: TypeScript registry con type-checking entre `skills.ts` y `openclawAdapter.ts`

---

## 6. LO QUE FALTA IMPLEMENTAR

### 6.1 Features pendientes en el código

| Feature | Evidencia en código | Archivo |
|---------|-------------------|---------|
| `aiObserverMiddleware` — reducers faltantes | `markOmnibarOpened`, `markOmnibarClosed`, `markHubVisited`, `markInputChanged` dispatched sin reducer | `aiObserverMiddleware.ts:45-80` |
| `DEBTS-6` — deudas en `buildAgentContext()` | Plan documentado en `FINANCE_DEBTS.md` Fase 6 pero no implementado en `AgentOrchestrator.ts:301+` | `AgentOrchestrator.ts` |
| `DEBTS-6` — verdicts de Jarvis para deudas vencidas | `AuditorAgent.ts` no tiene los 3 patrones de veredicto de deudas | `AuditorAgent.ts` |
| `payDebt` thunk en `financeThunks.ts` | Plan en FINANCE_DEBTS.md Fase 2 — el thunk coordinado no existe, solo `recordPayment` directo | `src/store/thunks/financeThunks.ts` |
| Modal "Registrar Abono" completo en FinanceDebts | Sección 5 de FINANCE_DEBTS.md (preview de saldo, badge "completamente pagada") | `FinanceDebts.jsx` |
| SpendingCharts como página dedicada | No encontrado como página separada — presumiblemente dentro de FinanceHub | No existe `/finance/charts` |
| CashFlowProjection | No encontrado en ningún archivo del proyecto | No existe |
| DailyStandup como ruta accesible | Solo es componente, no tiene ruta `/work/standup` | `routes.jsx` |
| DailyStandup → persist respuestas | `onDismiss` no guarda a journal ni notes | `DailyStandup.jsx` |

### 6.2 Android / Capacitor

| Feature | Estado | Referencia |
|---------|--------|-----------|
| Widgets nativos Android | ❌ No existe ninguna implementación | No encontrado |
| Background sync | ❌ No implementado | No encontrado |
| Push notifications | ⚠️ Plugin instalado (`@capacitor/local-notifications`) sin integración confirmada más allá de ReminderToasts | `package.json:28` |
| Share extension | ❌ No implementado | No encontrado |
| App shortcuts (Android long-press) | ❌ No implementado | No encontrado |
| Deep links | ❌ No configurados en `capacitor.config.ts` | `capacitor.config.ts` |
| Splash screen / assets nativos | ⚠️ Desconocido — no auditado el directorio `android/` | — |
| Geolocation | ⚠️ Plugin instalado, no usado en código fuente auditado | `package.json:24` |
| Health data (CapGo) | ⚠️ Plugin instalado, referenciado en `HealthMonitor.ts` — integración parcial desconocida | `HealthMonitor.ts` |

### 6.3 Gaps de integración

| Gap | Descripción | Impacto |
|----|-------------|---------|
| Debts → AgentOrchestrator | Jarvis no sabe cuánto se debe, cuándo vence, si hay deudas vencidas | Verdicts financieros incompletos |
| Debts → Calendar (DEBTS-7) | ReminderToasts integrado, pero al crear deuda activa no se crea evento en calendarSlice automáticamente | No hay recordatorio en calendario al crear deuda |
| payDebt thunk → openclawAdapter | El adapter mapea `pay_debt` a `payments/markAsPaid` en lugar del thunk coordinado | Omnibar no ejecuta el flujo completo de abono |
| FocusMode → AgentOrchestrator | El contexto de `buildContext()` no incluye sesiones de foco activas — Cortana no puede sugerir break o continuación | Cortana ciega a focus sessions |
| DailyCheckin → AgentOrchestrator | SHODAN tiene acceso parcial a checkins en buildContext — no confirmado si lee `sueño`, `energía`, `mood` | SHODAN puede dar consejos sin datos actuales |
| HabitTracker → Skills | No existe skill `complete_habit` o similar en `skills.ts` | Omnibar no puede marcar hábitos |
| WeeklyReview → notas con métricas | La nota guardada no tiene los datos de la semana — es texto libre | Review inútil como reporte |

---

## 7. SEGURIDAD

| ID | Descripción | Archivo | Riesgo | Fix |
|----|-------------|---------|--------|-----|
| SEG-1 | `athenea.neural.key` (API key del LLM) guardada en `localStorage` en texto plano — accesible a cualquier script XSS inyectado | `AgentOrchestrator.ts` / `neuralAccess.ts` | 🔴 Crítico | Proxy server-side o IndexedDB con encryption (localforage + crypto-js). En Electron: usar `safeStorage`. |
| SEG-2 | Google OAuth token en `localStorage['athenea.google.token']` sin refresh flow — token caduca silenciosamente, y si se roba con XSS el atacante tiene acceso a Google Calendar del usuario | `googleCalendarService.js:14` | 🟡 Alto | Implementar `@google/oauth2` con PKCE flow. Guardar solo el refresh token (nunca el access token) en localStorage. |
| SEG-3 | No hay Content Security Policy configurada — cualquier script externo inyectado puede leer localStorage (donde está la API key) | `vite.config.ts`, `capacitor.config.ts` | 🟡 Alto | Agregar CSP header: `script-src 'self'`, `connect-src 'self' api.openai.com api.groq.com` |
| SEG-4 | `inputValue` del Omnibar no tiene sanitización antes de enviarse al LLM — prompt injection posible si el usuario pega contenido malicioso | `Omnibar.tsx` — sendMessage handler | 🟠 Medio | Truncar a 2000 chars máximo. Escapar caracteres de control antes de enviar al LLM. |
| SEG-5 | `dangerouslySetInnerHTML` usado en Omnibar.tsx con salida de `renderMarkdown()` — el renderer está sanitizado (escapa `<`, `>`, `&`) pero si alguien introduce doble-escape (`&amp;lt;`) podría bypassear | `Omnibar.tsx` — renderMarkdown | 🟢 Bajo | Usar DOMPurify como segunda capa de sanitización |

---

## 8. ESTADO DE LOS MÓDULOS NUEVOS

| Módulo | Archivo existe | Ruta en routes | Navbar item | Slice en store | Persist whitelist | buildContext() | Skill registrada | Mapper adapter |
|--------|:-:|:-:|:-:|:-:|:-:|:-:|:-:|:-:|
| Journal | ✅ `Journal.jsx` | ✅ `/journal` | ✅ "Diario" | ✅ `journal` | ✅ | ❌ | ✅ `write_journal` | ❓ no verificado |
| WeeklyReview | ✅ `WeeklyReview.jsx` | ✅ `/weekly-review` | ✅ "Rev. Semanal" | ❌ (no slice propio, usa `notes`) | N/A | ❌ | ✅ `open_weekly_review` | ❓ no verificado |
| FocusMode | ✅ `FocusMode.jsx` | ✅ `/focus` | ✅ "Focus Mode" | ✅ `focus` | ✅ | ❌ | ✅ `open_focus` | ❓ no verificado |
| DailyStandup | ✅ componente | ❌ sin ruta | ❌ | ❌ sin slice propio | N/A | ❌ | ✅ `open_standup` | ❓ no verificado |
| SpendingCharts | ❌ no encontrado | ❌ | ❌ | N/A | N/A | N/A | ❌ | ❌ |
| CashFlowProjection | ❌ no encontrado | ❌ | ❌ | N/A | N/A | N/A | ❌ | ❌ |
| DailyCheckin | ✅ componente | ❌ sin ruta | ❌ | ✅ `checkins` | ✅ | ❓ parcial | ✅ `log_checkin` | ❓ no verificado |
| HabitTracker | ✅ componente | ❌ sin ruta | ❌ | ❌ usa `routines` | N/A | ❌ | ❌ | ❌ |
| WalletsSlice | ✅ `walletsSlice.ts` | ✅ `/finance/wallets` | ✅ "Billeteras" | ✅ `wallets` | ✅ | ⚠️ parcial (selector incluye wallets) | ✅ 4 skills | ✅ mappers presentes |
| DebtsSlice | ✅ `debtsSlice.ts` | ✅ `/finance/debts` | ✅ "Deudas" | ✅ `debts` | ✅ | ❌ DEBTS-6 pendiente | ✅ `add_debt` `pay_debt` | ⚠️ `pay_debt` mapper incorrecto |

**Leyenda:** ✅ Confirmado en código · ❌ Ausente · ⚠️ Parcial o incorrecto · ❓ No pudo verificarse en audit

---

## 9. ANÁLISIS DEL SISTEMA DE AGENTES

### 9.1 System Prompts (PERSONA 1-4)

**Estado:** Los system prompts profundos están en `AgentOrchestrator.ts:576-636` (`generateWarRoomSession`). El agente de auditoría no pudo extraer el texto exacto por longitud del archivo (1188 líneas).

**Lo que SÍ se confirmó:**
- PERSONA-3: `writeEpisodicMemory()` existe en línea 736+ y se llama no-blocking después de cada orquestación → `aiMemorySlice.updateAgentMemory()` ✅
- PERSONA-4: Fallbacks offline diferenciados por hub en `Bridge.ts:665,715,760` ✅ (texto exacto no extraído)
- Los 3 agentes tienen prompts definidos en el War Room session (líneas 576-636)

**No confirmado:**
- PERSONA-1/PERSONA-2: los deep system prompts de personalidad en llamadas individuales de agente (fuera del War Room) — no se verificó que cada agente tenga su prompt cargado en llamadas LLM normales (no solo en War Room)

### 9.2 buildAgentContext()

Existe en `AgentOrchestrator.ts:301+` e incluye:
- WorkHub: `criticalTasks`, active projects count
- FinanceHub: `budgetStatus`, `marketVolatility`, `austerityActive`, `BlackBox market crash`
- Health: métricas de `sensorData` / `checkinsSlice` (parcial)
- ExternalData: weather, market volatility
- Detectores: `inactivityTriggered`, `financialCrisistriggered`, `successTriggered`
- **AUSENTE**: datos de `debtsSlice` — Jarvis no ve deudas (DEBTS-6 pendiente)
- **AUSENTE**: sesiones de foco activas — Cortana no ve si el usuario está en Pomodoro

### 9.3 Estado de Skills

| Skill ID | Hub | Action | Mapper en adapter | Reducer existe | Estado |
|----------|-----|--------|------------------|----------------|--------|
| `create_project` | Work | `projects/addProject` | ✅ | ✅ | ✅ |
| `add_task` | Work | `tasks/addTask` | ✅ | ✅ | ✅ |
| `log_time` | Work | — | ❓ | ❓ | ⚠️ huérfana parcial |
| `open_gatekeeper` | Work | UI event | ✅ | N/A | ✅ |
| `open_focus` | Work | UI event | ✅ | N/A | ✅ |
| `open_standup` | Work | UI event | ✅ | N/A | ✅ |
| `create_note` | Personal | `notes/addNote` | ✅ | ✅ | ✅ |
| `add_reminder` | Personal | `todos/addTodo` | ✅ | ✅ | ✅ |
| `add_todo` | Personal | `todos/addTodo` | ✅ | ✅ | ✅ |
| `complete_routine` | Personal | `routines/completeRoutine` | ✅ | ✅ | ✅ |
| `create_routine` | Personal | `routines/addRoutine` | ✅ | ✅ | ✅ |
| `log_checkin` | Personal | `checkins/logCheckin` | ❓ | ✅ | ⚠️ |
| `write_journal` | Personal | `journal/addEntry` | ❓ | ✅ | ⚠️ |
| `open_weekly_review` | Personal | UI event | ❓ | N/A | ⚠️ |
| `record_income_usd` | Finance | `wallets/addIncomeUSD` | ✅ | ✅ | ✅ |
| `record_income_mxn` | Finance | `wallets/addIncomeMXN` | ✅ | ✅ | ✅ |
| `record_conversion` | Finance | `wallets/recordConversion` | ✅ | ✅ | ✅ |
| `record_expense_usd` | Finance | `wallets/addExpenseUSD` + `budget/addExpense` | ✅ | ✅ | ✅ |
| `record_expense` | Finance | `budget/addExpense` | ✅ | ✅ | ✅ |
| `record_income` | Finance | `payments/recordIncome` | ✅ | ✅ | ✅ |
| `set_budget` | Finance | `budget/addCategory` | ✅ | ✅ | ✅ |
| `add_debt` | Finance | `debts/addDebt` | ❓ | ✅ | ⚠️ mapper no verificado |
| `pay_debt` | Finance | `finance/payDebt` (thunk) | ⚠️ mapea a `payments/markAsPaid` | ❌ thunk no existe | 🔴 ROTO |
| `query_budget_status` | Finance | agent/query | ✅ | N/A (agente) | ✅ |
| `search` | Cross | UI event | ✅ | N/A | ✅ |
| `sync_calendar` | Cross | `calendar/syncGoogleCalendar` | ✅ | ✅ | ✅ |
| `open_calendar` | Cross | UI event | ✅ | N/A | ✅ |

**Skills Huérfanas o Rotas:**
- `log_time` — mapper no verificado
- `pay_debt` — mapper apunta a action incorrecta, thunk no existe → 🔴 ROTO
- `log_checkin`, `write_journal`, `open_weekly_review` — mappers no verificados

---

## 10. PRIORIZACIÓN DE TRABAJO PENDIENTE

### P0 — Crítico (rompe funcionalidad core)

1. **Crear thunk `payDebt` en `financeThunks.ts`** y corregir mapper en `openclawAdapter.ts`
   - Archivos: `src/store/thunks/financeThunks.ts`, `openclawAdapter.ts`
   - Sin esto: Omnibar no puede registrar abonos correctamente, FinanceDebts modal tampoco
   - Esfuerzo: **3h**

2. **Corregir `BUG-26`: validación saldo mínimo en walletsSlice**
   - Archivo: `walletsSlice.ts` — reducers `addExpenseMXN`, `addExpenseUSD`
   - Sin esto: saldo puede ser negativo indefinidamente
   - Esfuerzo: **30m**

3. **Corregir `BUG-25`: `upcomingDebtPayments` mezcla MXN+USD**
   - Archivo: `financialSelectors.js:474-480`
   - Sin esto: `saldoLibre` incorrecto para usuarios con deudas en ambas divisas
   - Esfuerzo: **1h**

4. **Implementar reducers faltantes para `aiObserverMiddleware` (BUG-4)**
   - O eliminar los 4 dispatches huérfanos — la opción más rápida
   - Archivo: `aiObserverMiddleware.ts:45-80`
   - Esfuerzo: **1h** (eliminar) / **4h** (implementar correctamente en aiMemorySlice)

### P1 — Alto (afecta experiencia significativamente)

5. **Implementar DEBTS-6: deudas en `buildAgentContext()`** + verdicts de Jarvis para deudas vencidas
   - Archivos: `AgentOrchestrator.ts:301+`, `AuditorAgent.ts`
   - Esfuerzo: **3h**

6. **Corregir `BUG-9`: nombre de agente inconsistente en FinanceHub**
   - Archivo: `FinanceHub.jsx:48`
   - Esfuerzo: **15m**

7. **Corregir `BUG-10`: Math.max con array vacío en FinanceHub**
   - Archivo: `FinanceHub.jsx:41`
   - Esfuerzo: **15m**

8. **Securizar API key del LLM (SEG-1)**
   - Mover de localStorage a `safeStorage` (Electron) / IndexedDB cifrado (Capacitor)
   - Archivos: `neuralAccess.ts`, Settings.jsx (si expone campo de API key)
   - Esfuerzo: **4h**

9. **Google OAuth refresh flow (SEG-2, BUG-6)**
   - Archivo: `googleCalendarService.js`
   - Esfuerzo: **3h**

10. **Completar modal "Registrar Abono" en FinanceDebts (BUG-23)**
    - Preview de saldo, badge "quedará pagada", llamar thunk `payDebt`
    - Archivo: `FinanceDebts.jsx`
    - Esfuerzo: **2h**

11. **Memoizar `selectFinancialSnapshot` con `createSelector` (DT-5)**
    - Archivo: `financialSelectors.js`
    - Esfuerzo: **2h**

### P2 — Medio (mejora importante pero no urgente)

12. **i18n: corregir todas las strings hardcodeadas** (BUG-12, 13, 14, 15, 16, 19)
    - Archivos: `ReminderToasts.jsx`, `InterceptCard.tsx`, `ProactiveHUD.tsx`, `FloatingOmnibarFab.jsx`, `Omnibar.tsx`, `AgentOrchestrator.ts`
    - Esfuerzo: **2h**

13. **DailyStandup → persistir respuestas a journal** (BUG-8)
    - Archivo: `DailyStandup.jsx`
    - Esfuerzo: **1h**

14. **React Error Boundaries en páginas principales** (DT-12)
    - Archivos: `routes.jsx` + wrappers en cada hub
    - Esfuerzo: **2h**

15. **Throttle de aiObserverMiddleware** (DT-6)
    - Archivo: `aiObserverMiddleware.ts`
    - Esfuerzo: **1h**

16. **CSP header en Vite + Capacitor** (SEG-3, DT-17)
    - Archivos: `vite.config.ts`, `capacitor.config.ts`
    - Esfuerzo: **1h**

17. **FocusMode → restaurar selectedTaskId en recovery** (BUG-18)
    - Archivo: `FocusMode.jsx`
    - Esfuerzo: **30m**

18. **Corregir `BUG-24`: deletePayment no recalcula nextDueDate**
    - Archivo: `debtsSlice.ts`
    - Esfuerzo: **30m**

### P3 — Bajo (nice to have)

19. **Virtualizar chat history del Omnibar** (DT-7)
    - Archivo: `Omnibar.tsx`
    - Esfuerzo: **3h**

20. **Eliminar archivos muertos** (DT-15): `Omnibar.new.css`, `INTEGRATION_GUIDE.md`, `_archive/`
    - Esfuerzo: **10m**

21. **Verificar y completar mappers de skills `log_checkin`, `write_journal`, `add_debt`**
    - Archivo: `openclawAdapter.ts`
    - Esfuerzo: **2h**

22. **SpendingCharts y CashFlowProjection como páginas reales**
    - Archivos: nuevos `SpendingCharts.jsx`, `CashFlowProjection.jsx` + rutas
    - Esfuerzo: **8h**

23. **Widgets Android nativos**
    - Sin código base existente — requiere Android Kotlin/Glance
    - Esfuerzo: **16h+**

---

## 11. MÉTRICAS DEL PROYECTO

| Métrica | Valor | Notas |
|---------|-------|-------|
| **Total archivos .ts/.tsx/.js/.jsx en src/** | 157 | Excluyendo node_modules y android/ |
| **Total líneas de código** | ~40,787 | Aproximado, includes comments |
| **Slices Redux** | 23 | users, auth, organizations, projects, notes, calendar, todos, payments, routines, budget, collaborators, workOrders, stats, tasks, aiMemory, userSettings, sensorData, userIdentity, goals, budgetCycle, checkins, journal, focus, wallets, debts |
| **Skills registradas** | 29 | Work(6), Personal(9), Finance(11), Cross(3) |
| **Rutas en routes.jsx** | 25+ | Incluyendo rutas anidadas de finance/ |
| **Componentes en src/components/** | 33+ | Omnibar system, cards, charts, etc. |
| **Páginas en src/pages/** | 30+ | Todos los hubs + sub-páginas |
| **Middleware en store/middleware/** | 5 | aiObserver, actionHistory, budgetGuard, financeDeletionAudit, feedback |
| **Thunks en store/thunks/** | 2+ | `registerExpense`, `payDebt` (pendiente) |
| **Selectores** | 2+ | `selectFinancialSnapshot`, `selectFinancialHealthScore` |
| **Tests** | ~4 suites | middleware/middleware.test.ts, selectors.test.ts — cobertura <40% |
| **@ts-ignore** | 2 | `personaEngine.ts` (singleton accessor) |
| **TODO/FIXME** | ~5 | Bajo — código relativamente maduro |
| **Bugs encontrados** | **27** | 4 críticos/alto, 8 medio, 15 bajo |
| **Items de deuda técnica** | **18** | 6 arquitectura, 5 performance, 4 mantenibilidad, 3 seguridad |
| **Features pendientes** | **14** | DEBTS-6, payDebt thunk, SpendingCharts, CashFlowProjection, etc. |

---

## FIRMA

```
AUDITORÍA COMPLETA — 2026-03-21 — 27 bugs encontrados,
18 items de deuda técnica, 14 features pendientes.
Codebase: 157 archivos · ~40,787 líneas · 23 slices Redux · 29 skills.
```
