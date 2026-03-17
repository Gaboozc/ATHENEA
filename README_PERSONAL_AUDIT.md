# INVENTARIO ÁREA PERSONAL — ATHENEA
> Auditoría quirúrgica · Rama `single-person` · Marzo 2026
> Metodología: lectura directa de código fuente. Sin suposiciones.

---

## 1. COMPONENTES Y PÁGINAS DEL ÁREA PERSONAL

---

### `src/pages/PersonalHub.jsx` + `PersonalHub.css`

**Qué hace:**  
Hub central del área Personal. Muestra un resumen de 4 tarjetas: notas recientes, todos pendientes, recordatorios próximos (7 días) y rutinas de hoy. Tiene el único formulario inline de creación de rutinas de toda la app.

**Datos del store:**
- `state.notes.notes` — últimas 3 notas ordenadas por `updatedAt`
- `state.todos.todos` — primeros 5 todos con `status !== 'done'`
- `state.routines.routines` — filtradas por `daysOfWeek.includes(todayIndex)`

**Acciones Redux disparadas:**
- `addRoutine({ title, frequency: 'custom', daysOfWeek })` — desde el form inline
- `toggleRoutineToday({ id })` — botón Mark/Done por rutina

**Componentes hijos:** Ninguno. Todo es JSX inline.

**Estado:** Parcial.  
- Los 3 cards de resumen son solo listas de títulos sin links a las páginas hijas.
- No consume `state.routines` para mostrar streak, solo `lastCompleted`.
- No tiene acceso a Goals ni Calendar. No muestra datos del calendario en el hub.
- "Recent Notes" no enlaza a `/notes/${note.id}` — no hay navegación hasta la nota.

---

### `src/pages/Notes.jsx` + `Notes.css`

**Qué hace:**  
Página completa de notas. Permite crear, editar, eliminar, buscar por texto, filtrar por tag, Pin y asignar colores y fecha de recordatorio. Tiene un modal overlay para crear/editar.

**Datos del store:**
- `state.notes.notes` — array completo de notas
- `state.notes.tags` — lista global de tags disponibles

**Acciones Redux disparadas:**
- `addNote({ id, title, content, tags, color, reminderDate })` — create
- `updateNote({ id, ...fields })` — edit
- `deleteNote(id)` — delete
- `togglePinNote(id)` — pin
- `addTag(payload)` — añade tag global o a nota específica
- `linkNoteToCalendar(...)` / `unlinkFromCalendar(...)` — integración calendar
- `clearGhostWriteDraft()` / `setGhostWriteDraft(...)` — Ghost Write assistant

**Componentes hijos:** Ninguno. Todo es JSX inline con un modal overlay.

**Estado:** Completo.  
La funcionalidad de CRUD está operativa end-to-end. El `addTag` tiene un bug potencial: hay un reducer explícito **y** un `extraReducers` que maneja el mismo `notes/addTag` — la lógica está duplicada con riesgo de ejecutarse dos veces si Redux decide aplicar ambos.

---

### `src/pages/Todos.jsx` + `Todos.css`

**Qué hace:**  
Lista de todos con form inline de creación (título, dueDate, prioridad). Cada todo tiene barra de progreso manual (0/25/50/75/100%), botones Done/Reopen y Delete. Sin edición de todos existentes.

**Datos del store:**
- `state.todos.todos` — array completo, ordenado por status→dueDate→updatedAt

**Acciones Redux disparadas:**
- `addTodo({ id, title, notes, dueDate, priority, status: 'pending', progress: 0 })`
- `deleteTodo(id)`
- `setTodoStatus({ id, status })` — 'done' fija progress a 100
- `setTodoProgress({ id, progress })` — 100 fija status a 'done'
- `linkTodoToCalendar(...)` / `unlinkFromCalendar(...)` — si hay dueDate

**Componentes hijos:** Ninguno.

**Estado:** Parcial.  
No hay edición de un todo existente — ni título, ni notas, ni fecha, ni prioridad. Una vez creado, solo se puede marcar como done o eliminar. El campo `priority` existe en el slice y en el form de creación pero no aparece en la tarjeta de la lista — la prioridad se guarda pero nunca se muestra.

---

### `src/pages/Calendar.jsx` + `Calendar.css`

**Qué hace:**  
Vista de calendario mensual estándar. Permite crear/editar/eliminar eventos nativos. Al hacer clic en un día abre `DayDetailModal` — un modal de agente con todo lo planificado ese día (eventos, tasks, todos, notas con recordatorio, payments, goals).

**Datos del store:**
- `state.calendar.events` — eventos nativos + Google synced
- Todos los demás datos vienen del hook `useAgentCalendar` (notes, todos, tasks, routines, payments, goals, expenses, aiMemory)

**Acciones Redux disparadas:**
- `addEvent(...)`, `updateEvent(...)`, `deleteEvent(...)` — CRUD de eventos
- No despacha directamente sobre notas/todos/rutinas

**Componentes hijos:**
- `DayDetailModal` (componente interno en el mismo archivo) — modal de detalle con timeline de agente
- El `DayDetailModal` recibe `onClose`, `onNewEvent`, `onEditEvent`, `onDeleteEvent` como props

**Estado:** Completo con reservas.  
El calendario nativo funciona bien. El hook `useAgentCalendar` agrega datos de todos los slices correctamente. Problema: los todos con dueDate aparecen asignados a **Cortana** (Work), no a SHODAN — inconsistente con el área Personal donde fueron creados.

---

### `src/pages/Inbox.jsx` + `Inbox.css`

**Qué hace:**  
Formulario de captura rápida con tabs: Nota / Todo / Payment. Permite crear los tres tipos con sus campos principales y los vincula automáticamente al Calendar si tienen fecha.

**Datos del store:** No lee — solo escribe.

**Acciones Redux disparadas:**
- `addNote(...)`, `linkNoteToCalendar(...)`
- `addTodo(...)`, `linkTodoToCalendar(...)`
- `addPayment(...)`, `linkPaymentToCalendar(...)`

**Estado:** Huérfano.  
La ruta `/inbox` en `src/routes.jsx` es un **redirect a `/calendar`**. La página Inbox.jsx existe, tiene CSS propio, tiene lógica funcional — pero ninguna ruta la sirve. PersonalHub tiene un botón "Go to Inbox" que navega a `/inbox`, que inmediatamente redirige al usuario a Calendar sin explicación. Inbox.css existe con estilos completos para un componente que nadie puede renderizar.

---

### Componentes de soporte en `src/components/` relevantes para Personal

**`ReminderToasts.jsx`:**  
Componente de nivel app que lee `state.notes.notes` y `state.todos.todos`, extrae items con `reminderDate` o `dueDate` que vencen en ≤24h, y dispara toasts automáticamente. No pertenece a una página — está montado en el layout global.

**`NativeReminderNotifications.jsx`:**  
Idéntico en lógica a `ReminderToasts`. Lee notas y todos, usa la Web Notifications API para disparar notificaciones nativas del sistema operativo cuando hay items próximos. También montado globalmente.

**`DashboardWidget.jsx`:**  
Lee `state.todos.todos` para el contador "Pending Todos". No es exclusivo de Personal pero los datos de todos lo alimentan.

**`src/hooks/useAgentCalendar.js`:**  
Hook que agrega los 8 slices (events, projects, tasks, notes, todos, routines, payments, goals, expenses) en un mapa por día. Base de datos del DayDetailModal.

---

## 2. SLICES DE REDUX DEL ÁREA PERSONAL

---

### `store/slices/notesSlice.js`

**Estado:**
```
{
  notes: [],          // Note[]
  tags: ['personal', 'work', 'ideas', 'todo']  // string[] — global tag pool
}
```

**Estructura de una Note:**
```
{
  id: string,
  title: string,
  content: string,
  tags: string[],
  color: string,       // hex color, default '#1ec9ff'
  reminderDate: string | null,  // ISO date string
  pinned: boolean,
  createdAt: string,
  updatedAt: string
}
```

**Acciones disponibles:** `addNote`, `updateNote`, `deleteNote`, `togglePinNote`, `addTag`

**Bug documentado:** `addTag` tiene el reducer explícito **y** un `extraReducers` que captura `'notes/addTag'` con lógica casi idéntica. Ambos se ejecutan. El resultado no es incorrecto (la deduplicación lo protege) pero es deuda técnica activa.

**Persistencia:** ✅ Sí — en whitelist de `redux-persist`

**Primera carga:** `notes: []` — completamente vacío.

---

### `store/slices/todosSlice.js`

**Estado:**
```
{
  todos: []    // Todo[]
}
```

**Estructura de un Todo:**
```
{
  id: string,
  title: string,
  notes: string,
  dueDate: string | null,
  priority: 'low' | 'normal' | 'high',  // guardado, nunca mostrado en UI
  status: 'pending' | 'done',
  progress: number,   // 0 | 25 | 50 | 75 | 100
  createdAt: string,
  updatedAt: string
}
```

**Acciones disponibles:** `addTodo`, `deleteTodo`, `setTodoStatus`, `setTodoProgress`

**Notar:** No hay `updateTodo`. Una vez creado un todo no se puede modificar su título, notas, fecha ni prioridad desde la UI.

**Persistencia:** ✅ Sí

**Primera carga:** `todos: []`

---

### `store/slices/routinesSlice.js`

**Estado:**
```
{
  routines: []    // Routine[]
}
```

**Estructura de una Routine:**
```
{
  id: string,
  title: string,
  frequency: 'daily' | 'custom',
  daysOfWeek: number[],   // 0=Sun, 1=Mon ... 6=Sat
  lastCompleted: string | null,  // 'YYYY-MM-DD' o null
  streak: number          // SIEMPRE 0 — nunca se incrementa
}
```

**Acciones disponibles:** `addRoutine`, `toggleRoutineToday`

**Bug crítico:** El campo `streak` existe en `initialState` y en el objeto creado por `addRoutine` como `streak: 0`. Pero `toggleRoutineToday` **nunca incrementa `streak`** — simplemente alterna `lastCompleted` entre la fecha de hoy y null. El streak es estructuralmente cero para siempre.

**Persistencia:** ✅ Sí

**Primera carga:** `routines: []`

---

### `store/slices/goalsSlice.js`

**Estado:**
```
{
  goals: []    // Goal[]
}
```

**Estructura de un Goal:**
```
{
  id: string,
  name: string,
  targetAmount: number,
  savedToDate: number,
  monthlyContribution: number,
  category: string,     // vincula con una categoría de budget
  targetDate: string | null,
  createdAt: string
}
```

**Acciones disponibles:** `addGoal`, `deleteGoal`, `setMonthlyContribution`, `recordGoalDeposit`

**Nota arquitectural crítica:** Goals es un slice **financiero** disfrazado de personal. `recordGoalDeposit` lo dispara `budgetGuardMiddleware` automáticamente cuando se registra un gasto en una categoría que coincide con el `category` del goal. La UI de Goals vive en `src/pages/FinanceGoals.jsx` — no en PersonalHub. Goals no aparece en ningún lugar del área Personal.

**Persistencia:** ✅ Sí

**Primera carga:** `goals: []`

---

## 3. SKILLS DEL OMNIBAR PARA PERSONAL

---

### `create_note`

| Campo | Valor |
|-------|-------|
| Hub destino | `PersonalHub` |
| Keywords | `note`, `remember`, `write`, `create`, `save`, `jot`, `personal note`, `to do note` |
| Keywords en español | **Ninguna** |
| Parámetros requeridos | `title` (string, 3-150 chars), `content` (textarea) |
| Parámetros opcionales | `tags` (string, comma-separated), `category` (select: personal/work/ideas/important/other) |
| Acción Redux destino | `notes/addNote` (vía `openclawAdapter.mapCreateNote`) |
| Funciona end-to-end | ✅ Sí, con un corte: el parámetro `category` de la skill **no existe en el slice**. El adapter envía `category` en el payload pero `notesSlice.addNote` no lo incluye en el objeto que crea — se descarta silenciosamente. |
| Detectado por FastPath | ✅ Sí — `CREATE + NOTE` → `create_note` |

---

### `add_reminder`

| Campo | Valor |
|-------|-------|
| Hub destino | `PersonalHub` |
| Keywords | `reminder`, `set reminder`, `remind`, `remember`, `wake up`, `alarm`, `alert`, `notification`, `schedule reminder` |
| Keywords en español | **Ninguna — "recuérdame" no está en la lista** |
| Parámetros requeridos | `title`, `dueDate` |
| Parámetros opcionales | `priority` |
| Acción Redux destino | `tasks/addTask` con `isReminder: true` |
| Funciona end-to-end | ⚠️ Parcial. El adapter manda `tasks/addTask` con `{ isReminder: true, ... }`. El slice `tasksSlice` no define el campo `isReminder` en su estructura — se guarda en Redux pero ningún componente lo consume. Los recordatorios no aparecen en una lista de "mis recordatorios" — solo aparecen como tareas normales en MyTasks. El DayDetailModal los mostraría si tienen `dueDate`, pero identificados como tareas de Work, no como recordatorios personales. |
| Detectado por FastPath | ⚠️ No directamente. `NOTE` pattern captura "reminder" (`/\b(note|memo|reminder|remember)\b/i`) y lo mapea a `create_note`, no a `add_reminder`. Los recordatorios vía FastPath crean notas, no tasks. El pipeline LLM puede enrutar correctamente a `add_reminder` si el modelo lo clasifica bien. |

---

### `add_todo`

| Campo | Valor |
|-------|-------|
| Hub destino | `PersonalHub` |
| Keywords | `todo`, `to-do`, `to do`, `add`, `personal`, `list`, `item`, `routine`, `rutina` |
| Keywords en español | Solo `rutina` — sesgado al inglés |
| Parámetros requeridos | `text` (alias de `title`) |
| Parámetros opcionales | `priority` |
| Acción Redux destino | `todos/addTodo` |
| Funciona end-to-end | ✅ Sí. El adapter usa `params.text || params.title` para el título, cubre ambos esquemas. Pero: `dueDate` **no está en el paramSchema de la skill** — si el usuario dice "add todo comprar leche para el viernes" el LLM puede extraer la fecha pero la skill no tiene campo para pasársela al adapter, que tampoco la envía. Los todos creados vía Omnibar nunca tienen fecha. |
| Detectado por FastPath | ⚠️ No. FastPath solo mapea `CREATE + TASK → add_task`, no `CREATE + TODO`. La keyword `todo` en FastPath cae bajo TASK pattern (`/\b(task|todo|to-do|assignment)\b/i`) y se mapea a `add_task` de Work. Un usuario en PersonalHub diciendo "add todo comprar leche" puede crear una tarea de Work en lugar de un personal todo. |

---

### Skills que faltan para Personal

| Acción deseada | Skill disponible | Estado |
|----------------|-----------------|--------|
| Editar nota existente | ❌ No existe | Sin skill para `notes/updateNote` |
| Eliminar nota | ❌ No existe | Sin skill de eliminación |
| Crear rutina | ❌ No existe | No hay `add_routine` skill |
| Completar rutina de hoy | ❌ No existe | No hay `complete_routine` skill |
| Buscar notas | ❌ No existe | No hay skill de consulta de notas |
| Ver resumen de Personal | Parcialmente | El fallback de `/PersonalHub` devuelve `reminders.length + notes.length` pero lee `state.notes.reminders` que **no existe** — siempre devuelve 0 recordatorios |

---

## 4. AGENTE RESPONSABLE — SHODAN / VitalsAgent

---

### Datos del store que SHODAN lee para sus recomendaciones

**De `AgentOrchestrator.buildContext()`:**
- `sensorData.battery.level` — nivel de batería del dispositivo
- `sensorData.battery.isCritical`
- `sensorData.network.type` / `isConnected`
- `sensorData.location.currentZone`
- `sensorData.health.fatigueLevelEstimate` — estimado, no medido
- `sensorData.health.sleepHours` — horas de sueño, no medidas
- `sensorData.health.steps` — pasos del día, no medidos
- `workHub.criticalTasks` / `overdueTasks` / `completedToday` — datos de Work (indirecto)
- `userBaselines.targetSleepHours` / `workHourLimit` — de IdentityHub

**Lo que SHODAN NO lee:**
- `state.notes.notes` — ignora completamente las notas del usuario
- `state.todos.todos` — ignora los todos personales
- `state.routines.routines` — ignora si el usuario completó rutinas hoy
- `state.goals.*` — ignora las metas financieras
- `state.calendar.events` — ignora el calendario personal

### Condiciones que activan a SHODAN

`VitalsAgent.shouldActivate()` devuelve true cuando:
- `sleepHours < 6` (del sensor — si no hay sensor, es null, y `null < 6` es **false**)
- `fatigueLevelEstimate === 'high'`
- `battery.isCritical === true`
- `steps < 1000` (del sensor)

**Consecuencia práctica:** En una instalación sin sensores físicos integrados (el 100% de las instalaciones desktop/web actuales), `sleepHours` es null, `fatigueLevelEstimate` es null, `steps` es null. **SHODAN nunca se activa** salvo cuando la batería del dispositivo cae por debajo del umbral crítico.

### Tipos de insights que SHODAN genera actualmente

1. **VETO absoluto** — solo si `Production_Ready_Flag === 'true'` en localStorage. Sin esa flag: nunca ocurre.
2. **Alerta de sueño crítico** — `sleepHours < 4.5` + workload ≥ 3
3. **Alerta de baja actividad** — `steps < 1000` a las 14:00+
4. **Alerta baja batería + workload** — `battery < 15%` + tareas urgentes ≥ 2
5. **Reporte de signos vitales normales** — cuando todo está bien

**Del `proactive/observer.ts`** (independiente de VitalsAgent), SHODAN-hub genera:
- `personal-untagged-note-*` — nota sin tags encontrada
- `calendar-prep-*` — evento importante sin nota de preparación en las próximas 24h
- `ghost-write-*` — sugerencia de tags para la nota actualmente en edición

### Lo que SHODAN debería hacer pero hoy no puede hacer

1. **Leer notas y dar contexto:** Cuando el usuario habla con SHODAN sobre sus hábitos, SHODAN no tiene acceso a las rutinas (`lastCompleted`, `streak`) ni a las notas marcadas con tags de salud. Responde sobre el usuario pero sin conocer al usuario.
2. **Detectar abandono de rutinas:** Si el usuario no ha completado ninguna rutina en 3 días, SHODAN podría proactivamente sugerir revisar el hábito. El dato está en el slice; SHODAN no lo lee.
3. **Correlacionar sueño y productividad:** SHODAN podría descubrir que cuando el usuario reporta poco sueño las tareas completadas ese día son menos. El dato de tasks está en el context. El dato de sueño no.
4. **Crear notas por voz sin skill explícita:** SHODAN podría dictar notas de reflexión después de un check-in de bienestar. No tiene skill propia — delega en `create_note` de la skill registry.
5. **Historial de estado:** No hay tracking de humor, energía o bienestar a lo largo del tiempo. El campo `mood` existe en `aiMemorySlice` (`'neutral' | 'focused' | 'frustrated' | 'recovering'`) pero lo infiere de comportamiento de interacción, no de input del usuario.

---

## 5. FEATURES DEL ÁREA PERSONAL — ESTADO REAL

| Feature | Existe en UI | Funciona | Conectado a IA | Notas |
|---------|:-----------:|:-------:|:-------------:|-------|
| Crear nota | ✅ | ✅ | ✅ Parcial | `category` del Omnibar se descarta |
| Editar nota | ✅ | ✅ | ❌ | No hay skill de edición |
| Eliminar nota | ✅ | ✅ | ❌ | Solo confirm() nativo |
| Tags en notas | ✅ | ✅ | ✅ Parcial | Ghost Write sugiere tags; `addTag` tiene bug de doble ejecución |
| Buscar notas | ✅ | ✅ | ❌ | Búsqueda local solo; sin skill Omnibar |
| Crear todo | ✅ | ✅ | ✅ Parcial | `dueDate` no en paramSchema; siempre sin fecha via Omnibar |
| Completar todo | ✅ | ✅ | ❌ | No hay skill de completar |
| Eliminar todo | ✅ | ✅ | ❌ | Solo confirm() nativo |
| Editar todo | ❌ | ❌ | ❌ | No existe en UI ni en slice |
| Prioridad en todos | ✅ En form | ❌ En lista | ❌ | Se guarda pero nunca se muestra |
| Crear rutina | ✅ En PersonalHub | ✅ | ❌ | Solo disponible en el hub; sin modal ni página propia |
| Editar rutina | ❌ | ❌ | ❌ | No existe ni en UI ni en slice |
| Marcar rutina completada | ✅ | ✅ | ❌ | Solo alterna, sin historial acumulado |
| Streak de rutinas | ❌ | ❌ | ❌ | Campo existe en slice pero nunca incrementa |
| Recordatorios (automáticos) | ✅ | ✅ | ❌ | ReminderToasts y NativeNotifications funcionan sobre notas/todos con fecha |
| Crear recordatorio via Omnibar | ✅ Skill disponible | ⚠️ Parcial | ✅ Parcial | Crea `tasks/addTask` con `isReminder: true`; aparece en MyTasks, no en área Personal |
| Metas personales (goals) | ❌ En Personal | ✅ En Finance | ❌ | FinanceGoals.jsx existe; PersonalHub no lo consume |
| Vista de calendario personal | ✅ | ✅ | ✅ | DayDetailModal con vista multi-agente |
| Sync con Google Calendar | ✅ Skills + código | ⚠️ Parcial | ✅ | `syncExternalEvents` skill existe; depende de config de API key externa |
| Notas con asistencia de IA | ✅ Ghost Write | ✅ | ✅ | GhostWrite activo mientras el modal de nota está abierto |
| Sugerencias proactivas SHODAN | ✅ Observer | ⚠️ Limitado | ✅ | Solo: nota sin tags, evento sin nota de prep, sugerencia de Ghost Write |
| Registro de hábitos | ❌ Tracker | ✅ Solo toggle | ❌ | `lastCompleted` es un solo campo — no hay historial multi-día |
| Humor / mood del usuario | ❌ En UI | ⚠️ Solo inferido | ✅ Parcial | `aiMemorySlice.userState.mood` se infiere de comportamiento; no hay input manual |

---

## 6. FLUJOS DEL ÁREA PERSONAL — PASO A PASO

---

### Flujo 1: Crear una nota con tags desde cero

1. **Navbar** dropdown "Personal" → "Notes" *(2 clicks)*
2. **Notes.jsx** renderiza con form colapsado y la grid de notas
3. Clic en `+ Nueva nota` (botón `.notes-create-btn`) → `handleOpenModal(null)` → `showModal = true`
4. **Modal overlay** `.notes-modal-overlay` aparece con el formulario
5. Relleno `title`, `content`, elegir tag del selector y/o escribir nuevo tag
6. Seleccionar color y fecha de recordatorio opcional
7. Submit del form → `handleSubmit()` → `dispatch(addNote({ ...noteData, id: newNoteId }))`
8. Si hay `reminderDate`: `dispatch(linkNoteToCalendar({ noteId, noteTitle, date, color }))`
9. Modal cierra → nota aparece en grid inmediatamente (Redux reactivo)
10. **Sin toast de confirmación** — la nota aparece silenciosamente

**Componente en cada paso:** Notes.jsx → Notes.jsx modal → notesSlice → Notes.jsx grid

---

### Flujo 2: Crear un todo con prioridad y fecha

1. **Navbar** dropdown "Personal" → "Todos" *(2 clicks)*
2. **Todos.jsx** renderiza con form inline visible permanentemente en el header
3. Escribir `title`, seleccionar `dueDate` (date input), seleccionar `priority` del select
4. Submit → `handleAddTodo()` → `dispatch(addTodo({ id: newId, ...formData, dueDate: formData.dueDate || null }))`
5. Si hay `dueDate`: `dispatch(linkTodoToCalendar({ todoId, todoTitle, dueDate }))`
6. Form resetea → todo aparece en la lista ordenado (primero los con dueDate más próximo)
7. **La tarjeta del todo no muestra el campo `priority`** — se guardó pero es invisible
8. **Sin toast de confirmación**

**Problema de flujo:** No hay forma de editar el todo después de crearlo.

---

### Flujo 3: Crear una rutina y marcarla como completada hoy

1. **Navbar** dropdown "Personal" → "Personal Hub" *(2 clicks)*
2. **PersonalHub.jsx** renderiza. La tarjeta "Daily Routines" está al final del grid (4ta posición)
3. En el form de la tarjeta escribir el título, seleccionar días de la semana como checkboxes
4. Submit → `handleAddRoutine()` → `dispatch(addRoutine({ title, frequency: 'custom', daysOfWeek }))`
5. Si `daysOfWeek` incluye el día de hoy → la rutina aparece inmediatamente en la lista de hoy
6. Clic en "Mark" → `dispatch(toggleRoutineToday({ id }))` → `lastCompleted = hoy`
7. Botón cambia a "Done", item se muestra con clase `is-done` (opacidad 0.6)
8. **Sin streak visual. Sin historial. Sin confirmación.**

**Limitación crítica:** No hay página `/routines`. No hay forma de ver el historial de completado. No hay forma de editar el título ni los días de una rutina existente.

---

### Flujo 4: Pedir a SHODAN una sugerencia sobre hábitos vía Omnibar

1. Clic en FAB (logo flotante) → Omnibar abre
2. Si el hub activo es `PersonalHub`: persona asignada automáticamente → `shodan`
3. Escribir: *"¿Cómo están mis hábitos esta semana?"* → Enter
4. **`detectPersonaFromPrompt()`**: no detecta "shodan" literal → usa hub = PersonalHub → `shodan`
5. **`Bridge.ts`** busca fallback para PersonalHub: lee `state.notes.reminders` (**campo inexistente**) → devuelve `0 recordatorios` y cuenta de notas
6. Sin API key: devuelve el fallback hardcodeado con esos datos mínimos
7. Con API key: `orchestrator.orchestrate()` corre los 3 agentes incluyendo VitalsAgent con los sensores; si no hay sensores → VitalsAgent `shouldActivate()` devuelve false → no habla SHODAN
8. Respuesta probable: Cortana responde sobre tareas de Work porque SHODAN no tiene activación

**Diagnóstico:** El usuario pide a SHODAN algo sobre sus hábitos. SHODAN no sabe que tiene rutinas, ni cuándo las completó, ni qué notas tiene. La respuesta es genérica.

---

### Flujo 5: Ver el calendario con eventos personales

1. **Navbar** dropdown "Personal" → "Calendar" o directo desde `navbar-mobile-link`
2. **Calendar.jsx** monta con vista mensual
3. **`useAgentCalendar()`** corre un useMemo que agrega los 8 slices en un mapa por fecha
4. En cada celda del mes se muestran dots de colores si hay items ese día
5. Clic en una celda con items → `setSelectedDate(date)`, `setShowDayDetail(true)`
6. **`DayDetailModal`** abre con onClose=`() => setShowDayDetail(false)`
7. DayDetailModal muestra timeline de: eventos calendario, tasks/todos de Cortana, rutinas de SHODAN, payments/goals de Jarvis, notas con reminderDate
8. Botón "New Event" dentro del modal abre el modal de creación nativo de Calendar

---

## 7. LO QUE FALTA O ESTÁ ROTO

---

### Funcionalidades que existen en el código pero no tienen UI visible

1. **`Inbox.jsx`** completo con CSS — ruta `/inbox` redirige silenciosamente a `/calendar`. Nadie puede acceder a Inbox. El "Go to Inbox" en PersonalHub lleva al usuario al calendario.

2. **`FinanceGoals.jsx`** — Goals existen como slice con `addGoal`, `deleteGoal`, `setMonthlyContribution`. Tienen su propia página. En PersonalHub no aparecen. La única relación con Personal es que un goal tiene `targetDate` y aparece en el DayDetailModal del calendario bajo el agente Jarvis.

3. **Field `streak`** en routinesSlice — estructuralmente inicializado en 0, nunca se incrementa. El campo existe, el dato nunca crece.

4. **Field `priority`** en todosSlice — guardado en cada todo, nunca renderizado en Todos.jsx ni en PersonalHub.

5. **`notes.reminders`** en `Bridge.ts` — el código de fallback de PersonalHub lee `state.notes.reminders`, que no existe en el slice. Siempre devuelve 0 recordatorios al preguntarle al agente sobre el estado personal.

6. **`isReminder: true`** en tasksSlice — los recordatorios creados via Omnibar tienen esta flag. El tasksSlice no la define en su estructura y MyTasks.jsx no la usa para diferenciarlos de tareas normales.

---

### Funcionalidades que tienen UI pero no funcionan completamente

1. **Edición de todos** — no existe. El `updateTodo` no está en el slice.

2. **Edición de rutinas** — no existe. Ni en PersonalHub.jsx ni en ningún otro archivo.

3. **Eliminación de rutinas** — no existe. Ni botón ni reducer.

4. **`add_reminder` via Omnibar** — crea una task de Work, no un reminder personal navegable.

5. **`add_todo` via Omnibar** — crea todo sin fecha (dueDate ausente del paramSchema).

6. **Streak de rutinas** — el campo existe, siempre muestra 0.

7. **SHODAN proactivo sobre Personal** — solo genera insights sobre nota sin tags, evento sin prep. No analiza rutinas, estados de ánimo, patrones de hábitos.

8. **FastPath para `add_todo`** — la keyword `todo` se captura como entity TASK y se mapea a `add_task` de Work, no a `add_todo` de Personal.

---

### Conexiones cortadas entre componentes

- **PersonalHub → notas individuales:** La lista de "Recent Notes" muestra 3 títulos. No hay `<Link>` a la nota. El usuario no puede abrir una nota directamente desde el hub.
- **PersonalHub → estado completo de todos:** Muestra los primeros 5 todos pendientes como lista de texto. Sin prioridad, sin fecha, sin progreso.
- **PersonalHub → rutinas historial:** Solo muestra las rutinas de hoy. No hay vista semanal ni mensual.
- **SHODAN ↔ notas/todos/rutinas:** La construcción de `AgentContext` en `AgentOrchestrator.buildContext()` no incluye `state.notes`, `state.todos` ni `state.routines`. SHODAN analiza sensores físicos y tareas de Work; ignora el contenido personal del usuario.
- **Observer (insights) ↔ rutinas:** El `analyzeStoreForInsights` no analiza el estado de rutinas para detectar abandono.

---

### Lo que un usuario esperaría encontrar que Athenea no tiene

- **Historial de hábitos:** Ver si completó sus rutinas lunes-martes-miércoles, no solo "¿lo hice hoy?".
- **Editar una nota de forma rápida** sin abrir el modal completo.
- **Editar o borrar una rutina** después de crearla.
- **Diario personal:** Entrada diaria con texto libre. Notes puede simular esto pero no hay estructura de "una entrada por día".
- **Registro de humor/energía:** El usuario que quiere decirle a SHODAN "hoy estoy cansado" no tiene un campo para eso — solo puede escribirlo en el Omnibar y esperar que el agente lo recuerde.
- **Objetivos personales** (distintos de financial goals): Algo como "leer 2 libros al mes", "meditar 5 días a la semana" — sin monto monetario asociado.

---

## 8. CSS Y ESTILO DEL ÁREA PERSONAL

---

### ¿PersonalHub tiene su propio CSS o comparte con WorkHub?

Archivos separados, estructuras paralelas:
- `PersonalHub.css` — `.personalhub-container`, `.personalhub-card`, `.personalhub-form`
- `WorkHub.css` — `.workhub-container`, `.workhub-stat`, `.workhub-actions`

**Estructural y visualmente son prácticamente idénticos.** Mismo `max-width: 1100px`, mismo `padding: 1.5rem 1.25rem 2rem`, mismo grid con `auto-fit minmax`, mismo uso de `var(--border-default)`, `var(--bg-surface)`, títulos en `var(--accent-gold)`. Son dos copias de la misma plantilla con diferentes prefijos de clase.

---

### ¿Hay diferenciación visual entre Personal y Work?

Mínima:
- **Work:** Botones de acción en `var(--accent-cyan)` (azul). Stats numéricas en `var(--accent-cyan)`.
- **Personal:** Botones de acción en `var(--accent-cyan)`. Títulos en `var(--accent-gold)`.
- **Diferencia real:** Solo el color del H1. La paleta, layout, cards y tipografía son idénticas.

El área Personal no tiene identidad visual propia que lo distinga de Work. Ningún elemento visual comunica "esto es diferente, más íntimo, personal".

---

### ¿Notes, Todos y Calendar tienen estilos consistentes entre sí?

No completamente:

| Aspecto | Notes.css | Todos.css | Calendar.css |
|---------|-----------|-----------|--------------|
| H1 color | `var(--accent-cyan)` | `var(--accent-gold)` | No aplica |
| Botón "Add" | Gradiente cyan→skyblue | Gradiente cyan→skyblue | Sí similar |
| Form inputs | `background: #1e293b; border: 1px solid #334155` | `background: var(--bg-base)` | Mixto |
| Hover de links | `border-color: var(--accent-cyan)` | N/A | N/A |

**Notes.css usa valores hardcoded** (`#1e293b`, `#334155`, `#9ca3af`, `#0f172a`, `#64748b`) en lugar de tokens CSS. Es el único archivo de Personal que no usa el sistema de tokens del todo.

---

### Clases o estilos duplicados entre Personal y Work

| WorkHub.css | PersonalHub.css | Elemento |
|-------------|-----------------|---------|
| `.workhub-container` | `.personalhub-container` | Idéntico layout |
| `.workhub-header h1` | `.personalhub-header h1` | Mismo font-size, mismo color `var(--accent-gold)` |
| `.workhub-actions button` | `.personalhub-actions button` | Idéntico — pill border cyan |
| `.workhub-stat` | `.personalhub-card` | Misma card con border-radius 14-16px |

Estos 4 patrones serían candidatos a un componente compartido `<HubCard>` o clases utilitarias.

---

## 9. INCOHERENCIAS DE DATOS Y LÓGICA

---

**Campos que se guardan pero nunca se muestran en UI:**
- `todos.priority` — en la form de creación (`low/normal/high`), guardado en Redux. La tarjeta del todo en Todos.jsx no renderiza el badge de prioridad.
- `routines.streak` — guardado como 0 y nunca incrementado. Aparece en ningún lugar de la UI.
- `notes.pinned` — `togglePinNote` existe y se puede llamar desde Notes.jsx (botón pin). Sin embargo, las notas pinneadas no se muestran primero en PersonalHub (que usa `updatedAt` para ordenar), ni se marcan visualmente diferente en PersonalHub.

**Campos que la UI muestra pero el slice no tiene:**
- `state.notes.reminders` — `Bridge.ts` lo lee para el fallback de PersonalHub. El slice no tiene ese campo. Siempre devuelve vacío.
- `task.isReminder` — el adapter lo escribe, el tasksSlice no lo define en la estructura del addTask. MyTasks.jsx no lo diferencia. Los recordatorios son tareas invisibles.

**Acciones Redux que se disparan pero el reducer no maneja correctamente:**
- `notes/addTag` — tiene manejador tanto en `reducers` como en `extraReducers`. Ambos se ejecutan para la misma acción. No produce datos incorrectos (la deduplicación de Set lo previene) pero es invocación doble de lógica de negocio.
- `tasks/reschedule` — observer.ts construye un action con `type: 'tasks/reschedule'` pero este reducer no existe en tasksSlice. Si ese insight se auto-ejecuta, la acción se descarta silenciosamente.

**¿Los todos y las tasks son lo mismo con otro nombre?**

Sí, conceptualmente solapados. Diferencias técnicas:

| Dimensión | `todos` (Personal) | `tasks` (Work) |
|-----------|-------------------|----------------|
| Scope | Personal | Proyecto/Workstream |
| Campos | title, notes, dueDate, priority, status, progress | title, projectId, workstreamId, estimatedHours, loggedHours, assigneeId, factors, totalScore |
| Progreso | Manual (0/25/50/75/100 manual) | Via `logTime` acumulativo |
| Creación | Directo en Todos.jsx | GatekeeperModal (scoring 7 factores) |
| IA scoring | No | Sí (PriorityEngine) |
| Agente | Cortana en DayDetailModal | Cortana |

El mismo DayDetailModal agrupa todos y tasks bajo "Cortana" sin distinción visual. Un usuario que tiene un todo "comprar leche" y una task "entregar informe" los ve en la misma lista bajo el mismo agente.

**¿Los recordatorios son tareas disfrazadas?**

Sí. La skill `add_reminder` genera `tasks/addTask` con `{ isReminder: true }`. El tasksSlice.addTask no maneja ese campo — lo guarda pero no hace nada con él. Los recordatorios creados via Omnibar son tareas normales con un campo ignorado. Los recordatorios que el sistema maneja en `ReminderToasts.jsx` y `NativeReminderNotifications.jsx` son en realidad **notas con `reminderDate`** o **todos con `dueDate`** — no usan el concepto de `add_reminder` en absoluto. Hay dos sistemas de recordatorios que no se conocen entre sí.

**¿Las rutinas y los hábitos son conceptos distintos o duplicados?**

Son el mismo concepto con nombre diferente. `routinesSlice` tiene un campo `streak` que es el mecanismo de hábito, pero está roto. El código del agente calendar usa `habitDone` para los días de rutinas completadas. En la UI solo existe la palabra "Routines". "Habits" aparece en comentarios de código (`habitDone`) y en CSS de Calendar (`.shodan-done`, `.shodan-missed`). El usuario ve "Routines", el código dice "habits" — sin unificación.

**¿Goals están conectadas a todos/rutinas?**

No. `goalsSlice` es financiero. Un goal tiene `targetAmount`, `savedToDate`, `category` de budget y `targetDate`. No tiene relación con rutinas, todos ni notas. El `budgetGuardMiddleware` lo alimenta de gastos de presupuesto. Es un módulo de ahorro financiero colocado incorrectamente bajo el concepto de "metas personales".

---

## 10. INCOHERENCIAS DE NAVEGACIÓN Y ACCESO

---

**Páginas del área Personal que no se pueden alcanzar desde PersonalHub:**

| Página | ¿Accesible desde PersonalHub? | Cómo llegar |
|--------|------------------------------|-------------|
| `/notes` | ✅ Sí — botón directo | "Go to Notes" |
| `/todos` | ✅ Sí — botón directo | "Go to Todos" |
| `/calendar` | ✅ Sí — botón directo | "Go to Calendar" |
| `/inbox` | ❌ Redirect a calendar | Botón existe, redirige |
| `/notifications` | ❌ No hay botón | Solo desde navbar o URL |
| `FinanceGoals` | ❌ No hay enlace | Solo desde Finance nav |
| `/routines` | ❌ No existe como ruta | Solo en PersonalHub inline |

**¿El botón "Go to Inbox" tiene sentido?**

No. `PersonalHub.jsx` línea 96: `navigate('/inbox')`. La ruta `/inbox` en routes.jsx es `<Navigate to="/calendar" replace />`. El usuario hace clic en "Go to Inbox" y llega al Calendario sin explicación. No hay mensaje de "Inbox se ha movido" ni redirección suave. Inbox.jsx existe como componente completo pero es inaccesible. Su función de captura rápida (nota + todo + pago en un tab switch) sería más valiosa que el Calendar al que se redirige.

**¿La separación PersonalHub / sub-páginas agrega valor?**

Agrega fragmentación sin aportar síntesis. PersonalHub muestra 3 ítems de cada sección sin ningún CTA que lleve a los detalles. Las sub-páginas (Notes, Todos) son independientes y no "saben" que su hub padre existe. Un usuario que vive solo en `/notes` nunca necesita abrir PersonalHub. Un usuario que vive en PersonalHub no puede actuar sobre sus datos — solo verlos.

---

## 11. INCOHERENCIAS CON EL AGENTE SHODAN

---

**¿SHODAN recibe datos del área Personal o solo sensores físicos?**

Solo sensores físicos + workHub tasks. El `AgentContext` que se pasa a `VitalsAgent.analyze()` contiene: `sensorData` (battery, network, location, health), `workHub` (tasks counts), `financeHub` (payments), `userBaselines`. No incluye `notes`, `todos`, ni `routines`.

**¿Hay notas marcadas como importantes que SHODAN ignora?**

Sí. El usuario puede crear una nota con tag "important" o pin en `true`. SHODAN no sabe que existen esas notas. Solo el observer de proactive insights detecta notas sin tags (para sugerir etiquetarlas) — no detecta notas importantes para incluirlas en el contexto del agente.

**¿SHODAN puede actuar sobre el área Personal (crear nota, agregar todo)?**

No directamente. SHODAN puede sugerir acciones en el ProactiveHUD (vía ActionChips del observer) y puede sugerir prompts en el Omnibar. Pero el agente no puede auto-ejecutar acciones sobre el área Personal — no tiene acceso al dispatch de Redux. La creación de contenido requiere que el usuario confirme o ejecute manualmente.

**¿Cuando el usuario habla con SHODAN sobre algo personal, SHODAN conoce sus notas y rutinas?**

No. El fallback de `Bridge.ts` para PersonalHub lee `state.notes.reminders` (campo inexistente → 0) y `state.notes.notes.length`. El sistema LLM recibe un contexto con solo el conteo de notas y 0 recordatorios. SHODAN no sabe el contenido de las notas, no sabe qué rutinas tiene el usuario, no sabe si las completó esta semana. Responde sobre la vida personal del usuario sin ningún dato de su vida personal.

---

## 12. INCOHERENCIAS ENTRE PERSONAL Y WORK

---

**Componentes copiados que deberían ser uno:**

`WorkHub.css` y `PersonalHub.css` son la misma plantilla. `.workhub-container` y `.personalhub-container` tienen exactamente los mismos valores de layout. Deberían ser un componente `<HubLayout>` con prop `accentColor`.

**¿Los todos de Personal y las tasks de Work se diferencian suficientemente?**

En la experiencia del usuario: no. Ambos aparecen en el DayDetailModal del calendario bajo "Cortana". El único punto donde se separan es en sus páginas dedicadas. En el Dashboard, DashboardWidget.jsx tiene un contador "Pending Todos" que suma `state.todos.todos` (personal) y un contador "Pending Tasks" que suma `state.tasks.tasks` (work). Pero están en el mismo widget sin explicar la diferencia.

**¿El calendario es personal o mezcla trabajo con personal?**

Mezcla total. `useAgentCalendar` agrega: eventos propios, tasks de Work (con proyectos), todos personales, notas con fecha, pagos, goals financieros y rutinas. Todo aparece en el mismo calendario. No hay filtro de "ver solo Personal" o "ver solo Work". El DayDetailModal agrupa por agente (Cortana=Work+Personal, Jarvis=Finance, SHODAN=rutinas) pero la vista mensual no distingue tipos en los dots.

---

## 13. INCOHERENCIAS DE IA Y OMNIBAR

---

**¿Las keywords de Personal se solapan con las de Work?**

Sí. `create_note` tiene la keyword `to do note`. `add_task` tiene keywords `todo`, `to do`, `create`. El FastPathMatcher tiene pattern `TASK: /\b(task|todo|to-do|assignment)\b/i` — captura "todo" y lo mapea a `add_task` de Work, no a `add_todo` de Personal. Si el usuario escribe "add todo comprar leche" en el hub de Personal, el FastPath puede enviarlo como una task de Work.

**¿"recuérdame comprar leche" en Work crea un reminder personal o una tarea de Work?**

Ni uno ni otro de forma fiable. El texto "recuérdame" no está en los patterns del FastPath (ni en inglés ni en español). El keyword `remind` está en `add_reminder`. Si el LLM lo clasifica como `add_reminder`, crea `tasks/addTask` con `isReminder: true` (que se descarta structuralmente). Si el FastPath toma control, "leche" no matchea ningún entity pattern → `skillId = null` → va al LLM. Resultado: incierto y potencialmente incorrecto.

**¿Suficientes keywords en español?**

No. Comparativa por skill:

| Skill | Keywords en español |
|-------|---------------------|
| `create_note` | 0 |
| `add_reminder` | 0 |
| `add_todo` | `rutina` (1, incorrecta — rutina ≠ todo) |
| `add_task` | 0 |
| `create_project` | `colaborador` (1) |
| `set_budget` | `presupuesto`, `limite de presupuesto`, `establecer presupuesto` (3 ✅) |

El área Personal está totalmente sesgada al inglés en el reconocimiento de intents.

**¿Acciones comunes que no tienen skill mapeada?**

| Acción | Disponible | Alternativa |
|--------|-----------|-------------|
| Ver mis notas | ❌ | Navegar a /notes |
| Buscar nota por contenido | ❌ | Búsqueda local en /notes |
| Editar nota existente | ❌ | Abrir modal en /notes |
| Completar rutina | ❌ | PersonalHub botón |
| Ver rutinas de la semana | ❌ | No existe en ningún lugar |
| Cambiar prioridad de un todo | ❌ | No existe edición de todos |
| Crear rutina | ❌ | PersonalHub form inline |

---

## 14. EVALUACIÓN DE MÓDULOS Y RECOMENDACIONES

---

### Módulos actuales — evaluación

**Notes**  
Cumple su propósito de manera sólida. CRUD completo, tags, colores, pin, Ghost Write. Lo que falta: edición rápida inline (sin modal), vista de tarjetas con prioridad visual, y búsqueda conectada al Omnibar.

**Todos**  
Scope adecuado pero incompleto. Falta la operación más básica: **editar**. El campo `priority` guardado pero invisible es confuso para el desarrollador que lee el slice y para el usuario si algún día se muestra mal. Debería tener `updateTodo` o al menos edición inline del título.

**Routines**  
Scope demasiado estrecho. Sirve como toggle diario pero no cumple el contrato implícito de "hábito": no calcula racha, no muestra historial, no permite editar ni eliminar. Es un módulo a la mitad.

**Calendar**  
Scope demasiado amplio para Personal. Es el calendario de toda la app — mezcla work, finance y personal sin filtros. El DayDetailModal es el punto más sofisticado del área Personal (timeline multi-agente) pero requiere clic en el día correcto para acceder. Debería tener vistas filtradas.

**PersonalHub**  
Scope demasiado estrecho como índice, demasiado amplio como la única página que incluye el formulario de rutinas. Es un hub que muestra 3 ítems de cada sección sin permitir acción sobre ninguno. Debería ser el centro de mando personal con datos accionables, no un tablero de lectura.

**Inbox**  
Módulo completo, sólido, que no se puede usar. El redirect de `/inbox` → `/calendar` debe eliminarse y la ruta debe servir `<Inbox />`. Tiene exactamente la función correcta: captura rápida multi-tipo en una sola pantalla.

---

### Módulos a fusionar

**Routines + Stats / Streak**  
El streak de rutinas en `routinesSlice` y el streak de productivity en `statsSlice` son conceptos paralelos. El StatsPage muestra `currentStreak` y `longestStreak` basados en tasks completadas (Work). El streak personal de hábitos no tiene representación. Fusionar el tracking de completado de rutinas con el sistema de XP/streak de Stats crearía un sistema unificado de racha que abarque trabajo y hábitos.

**Notes (recordatorio) + Todos (dueDate) + add_reminder (task)**  
Son tres sistemas de recordatorio distintos que no se conocen entre sí. El Dashboard (`Reminders` section) ya los unifica en lectura — lo hace computando listas de notas con `reminderDate` y todos con `dueDate`. Esa lógica debería centralizarse en un hook `useReminders()` compartido y habría que eliminar el path de `add_reminder → tasks/addTask`, redirigiendo a `todos/addTodo` con `isReminder: true`.

---

### Módulos nuevos recomendados

**1. Habit Tracker (extensión de Routines)**
- Propósito: historial visual de completado de rutinas con racha
- Por qué encaja: las rutinas ya existen pero no tienen memoria histórica
- Datos: extender `routinesSlice` → campo `completedDates: string[]` en lugar de solo `lastCompleted`
- SHODAN: podría analizar abandono de rutinas y correlacionarlas con energía
- Skill: `complete_routine`, `skip_routine`
- Complejidad: **Baja** (cambio de slice + UI de heatmap)
- Prioridad: **Esencial** — completa una feature rota

**2. Diario / Daily Journal**
- Propósito: entrada diaria de texto libre, una por día, con fecha
- Por qué encaja: en Personal existe Notes pero sin estructura temporal de "hoy"
- Datos: slice nuevo `journal: { entries: { date: string, content: string, mood?: string }[] }`
- SHODAN: leería las entradas recientes para tener contexto del estado del usuario
- Skill: `write_journal`, `read_today_journal`
- Complejidad: **Baja** — slice simple, UI de textarea con fecha fija = hoy
- Prioridad: **Útil** — cierra el gap de "qué hago con mis pensamientos del día"

**3. Mood & Energy Check-in**
- Propósito: registro manual de humor y energía (1-5 o emojis) una vez al día
- Por qué encaja: `aiMemorySlice` ya tiene campo `mood` que se infiere de comportamiento — agregar input manual es la fuente que SHODAN necesita
- Datos: extender `aiMemorySlice` con `dailyCheckins: { date, mood: string, energy: number }[]` o slice independiente
- SHODAN: con checkins históricos puede decir "los martes sueles estar con baja energía"
- Skill: `log_mood`, `check_energy`
- Complejidad: **Baja** — UI minimalista, dos selectores o botones rápidos
- Prioridad: **Esencial** — desbloquea a SHODAN para hacer su trabajo real

**4. Sistema de Revisión Semanal**
- Propósito: proceso guiado cada domingo (o configurable) para revisar: rutinas completadas, todos pendientes, notes de la semana, qué llevar a la semana siguiente
- Por qué encaja: el área Personal tiene todos los datos pero ninguna síntesis temporal
- Datos: solo lectura de slices existentes; podría guardar el "resumen semanal" como una nota especial con tag `weekly-review`
- SHODAN: coordinaría con Cortana (work review) y Jarvis (finance review) para el reporte
- Skill: `start_weekly_review`
- Complejidad: **Media** — requiere WizardModal con pasos
- Prioridad: **Útil**

**5. Objetivos Personales (Personal OKRs)**
- Propósito: metas del tipo "meditar 5 días/semana" o "leer 2 libros al mes" — sin dinero
- Por qué encaja: `goalsSlice` es financiero; el área Personal no tiene objetivos cualitativos
- Datos: slice nuevo `personalGoals: { id, title, metric: string, target: number, current, period, startDate, deadline }[]`
- SHODAN: puede relacionar hábitos completados con el progreso hacia estos objetivos
- Skill: `add_personal_goal`, `update_goal_progress`
- Complejidad: **Media**
- Prioridad: **Útil**

**6. Lector / Read Later**
- Propósito: guardar URLs o notas de contenido para leer después, con etiquetas y estado (pendiente/leído)
- Por qué encaja: Notes ya puede hacer esto pero sin estructura de "content queue"
- Datos: podría ser un tag especial `read-later` en notas existentes + un campo `url`; o slice mínimo
- SHODAN: sugeriría leer durante tiempos de baja energía
- Skill: `save_for_later`
- Complejidad: **Baja** si extiende Notes; **Media** si es slice propio
- Prioridad: **Nice-to-have**

**7. Seguimiento de Sueño Manual**
- Propósito: input manual de horas de sueño cuando no hay sensor
- Por qué encaja: `sensorData.health.sleepHours` siempre es null sin sensor — SHODAN no se activa nunca sin este dato
- Datos: extender `sensorData` slice con campo de input manual, o `aiMemorySlice`
- SHODAN: con datos de sueño, VitalsAgent puede activarse y dar recomendaciones significativas
- Skill: `log_sleep`
- Complejidad: **Baja** — un input numérico en Settings o check-in matutino
- Prioridad: **Esencial** — sin esto, SHODAN es decorativo en el 99% de los casos

---

### Tabla resumen de módulos

| Módulo | Estado | Acción | Prioridad | Complejidad |
|--------|--------|--------|-----------|-------------|
| Notes | Existe — completo | Añadir skill edición + búsqueda Omnibar | Esencial | Baja |
| Todos | Existe — parcial | Añadir `updateTodo` + mostrar priority | Esencial | Baja |
| Routines / Habit Tracker | Existe — roto | Extender con `completedDates[]` + streak real | Esencial | Baja |
| Calendar (Personal) | Existe — compartido | Añadir filtros Personal/Work/Finance | Útil | Media |
| PersonalHub | Existe — índice vacío | Convertir en centro de mando accionable | Útil | Media |
| Inbox | Existe — inaccesible | Reparar ruta, conectar a PersonalHub | Esencial | Baja |
| Mood & Energy Check-in | No existe | Crear | Esencial | Baja |
| Seguimiento de sueño manual | No existe | Crear | Esencial | Baja |
| Diario / Daily Journal | No existe | Crear | Útil | Baja |
| Revisión semanal | No existe | Crear | Útil | Media |
| OKRs personales | No existe | Crear | Útil | Media |
| Lector / Read Later | No existe | Crear | Nice-to-have | Baja |

---

## VEREDICTO PERSONAL HUB

**¿Qué tan completa y funcional está el área Personal hoy?**

El área Personal existe como conjunto de piezas que no forman un sistema. Notes es funcional. Todos es funcional con un corte grave (sin edición). Calendar funciona pero no es "personal". Routines está a la mitad. El hub que las agrupa es un tablero de lectura sin capacidad de acción. La IA asignada al área (SHODAN) no tiene acceso a los datos del área. En una escala del 1 al 10, el área Personal está en un **4 funcional** — las operaciones CRUD básicas corren, pero la coherencia sistémica, la profundidad de IA y la experiencia de uso están al 20% de su potencial declarado.

**¿Cuál es la incoherencia más grave encontrada?**

SHODAN, el agente responsable de la salud y el bienestar personal, no lee las notas, todos ni rutinas del usuario. El `AgentContext` que recibe no incluye `state.notes`, `state.todos` ni `state.routines`. Cuando el usuario le pregunta a SHODAN "¿cómo están mis hábitos?", SHODAN responde sobre sensores físicos que en el 99% de los casos están vacíos (null). El área Personal tiene un agente sin datos y datos sin agente — dos mitades que no se conectan.

**¿Cuál es el módulo faltante que más impacto tendría?**

El check-in manual de sueño y energía. Es un campo numérico o selector de emojis que el usuario puede rellenar en 5 segundos al abrir la app. Con ese dato, `VitalsAgent.shouldActivate()` devolvería true, SHODAN comenzaría a hablar, sus VETOs tendrían contexto, y el puente entre "yo digo cómo me siento" y "SHODAN me da recomendaciones basadas en cómo me siento" se cerraría. Sin ese input, toda la arquitectura de SHODAN — el código más sofisticado del repositorio — permanece durmiendo.

---

> Inventario Personal completo.
