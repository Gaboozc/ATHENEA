# ATHENEA · README_WORK_AUDIT.md
**Reporte de implementación — Área Work · Fixes + Features**

> Rama: `single-person`  
> Sesión de auditoría: auditoría inicial  
> Sesión de implementación: sesión posterior (esta sesión)  
> Autor: Github Copilot (Claude Sonnet 4.6)  
> Estado: **IMPLEMENTACIÓN COMPLETADA** — 0 errores de compilación

---

## RESUMEN EJECUTIVO

Se ejecutaron **14 ítems** en 6 fases (8 fixes + 6 features). Todos compilan sin errores.  
Descubrimiento arquitectónico crítico documentado en §9.

| Fase | Ítems | Estado |
|------|-------|--------|
| Fase 1 — Bugs críticos | W-FIX-1, W-FIX-2, W-FIX-3 | ✅ |
| Fase 2 — Fixes de slice/lógica | W-FIX-4, W-FIX-5, W-FIX-6, W-FIX-7, W-FIX-8 | ✅ |
| Fase 3 — Cortana en WorkHub | W-FEAT-1, W-FEAT-2 | ✅ |
| Fase 4 — Panel timeEntries | W-FEAT-3, W-FEAT-4 | ✅ |
| Fase 5 — Edición inline | W-FEAT-5 | ✅ |
| Fase 6 — Keywords ES | W-FEAT-6 | ✅ |

---

## TABLA MAESTRA DE FIXES

### W-FIX-1 · `assigneeId` en GatekeeperModal ✅

| | |
|---|---|
| **Archivo** | `src/components/modals/GatekeeperModal.tsx` |
| **Bug** | Tareas creadas sin `assigneeId` → MyTasks nunca las mostraba |
| **Fix** | Añadido `useSelector` para leer `state.auth.user`; se pasa `assigneeId: user?.id \|\| user?.uid \|\| null` al llamar `addTask()` |
| **Flujo verificable** | Crear tarea vía GatekeeperModal → ir a My Tasks → la tarea aparece |

### W-FIX-2 · Doble ejecución `logTime` ✅

| | |
|---|---|
| **Archivo** | `store/slices/tasksSlice.js` |
| **Bug** | `logTime` se ejecutaba dos veces: una en `reducers` y otra en `extraReducers` (que interceptaba el mismo action type string) |
| **Fix** | Eliminado el `builder.addCase('tasks/logTime', ...)` del bloque `extraReducers`. Añadido campo `loggedAt` al entry de log para filtrado temporal posterior |
| **Flujo verificable** | Loguear 2h en una tarea → el total acumulado es 2h, no 4h |

### W-FIX-3 · `t.priority` → `t.level` en AgentOrchestrator ✅

| | |
|---|---|
| **Archivo** | `src/modules/intelligence/agents/AgentOrchestrator.ts` (buildContext) |
| **Bug** | `criticalTasks` filtraba `t.priority === 'high'` — campo que no existe en Work tasks (que usan `t.level`) → Cortana siempre veía 0 tareas críticas |
| **Fix** | Cambiado a `t.level === 'Critical' \|\| t.level === 'High Velocity'`, con exclusión de `status === 'Completed'` y `'deleted'` |
| **Nota** | La línea 411 (`t.priority === 'high'` para `todos` de PersonalHub) NO se tocó — los todos sí usan `priority` |

### W-FIX-4 · Reducer `updateTask` ✅

| | |
|---|---|
| **Archivo** | `store/slices/tasksSlice.js` |
| **Bug** | No existía forma de editar tareas en el slice Redux post-creación |
| **Fix** | Añadido reducer `updateTask(state, { payload: { id, title, description, dueDate, level, estimatedHours, projectId, workstreamId } })` con `task.updatedAt` automático |

### W-FIX-5 · Weekly Progress filtro semanal ✅

| | |
|---|---|
| **Archivo** | `src/pages/WorkHub.jsx` |
| **Bug** | `progressPercent` calculaba `completedTasks / totalTasks` histórico — etiqueta "Weekly Progress" era mentira |
| **Fix** | `startOfWeek` memo (domingo de la semana actual), `tasksThisWeek`, `completedThisWeek`, `weeklyProgress`. JSX actualizado para mostrar contadores semanales |

### W-FIX-6 · Skill `priority` → `level` enum ✅

| | |
|---|---|
| **Archivo** | `src/modules/intelligence/skills.ts` |
| **Bug** | `create_project` y `add_task` usaban `priority: { enum: ['low', 'medium', 'high'] }` — inconsistente con el modelo real que usa `level` con valores PascalCase |
| **Fix** | Ambos parámetros renombrados a `level` con enum `['Critical', 'High Velocity', 'Steady Flow', 'Low Friction', 'Backlog']` |
| **No tocado** | `add_reminder` y `add_todo` conservan `priority` — esos dominios sí usan ese campo |

### W-FIX-7 · Reducer `restoreTask` ✅

| | |
|---|---|
| **Archivo** | `store/slices/tasksSlice.js` |
| **Gap** | No existía forma de restaurar tareas borradas en el slice Redux |
| **Fix** | Añadido reducer `restoreTask(state, { payload: taskId })` que pone `status: 'pending'`, `completed: false`, elimina `deletedAt` |

### W-FIX-8 · Today's Focus — badges coloreados + navegación ✅

| | |
|---|---|
| **Archivo** | `src/pages/WorkHub.jsx` + `src/pages/WorkHub.css` |
| **Gap** | Lista de tareas era información muerta — sin indicación visual de nivel y sin click |
| **Fix JSX** | Añadida clase `workhub-task-item` + `onClick` que navega a `/projects/:projectId` o `/my-tasks`; badge con clase dinámica `level-${level.toLowerCase().replace(/\s+/g, '-')}` |
| **Fix CSS** | Añadidas clases `.level-critical` (rojo), `.level-high-velocity` (naranja), `.level-steady-flow` (cyan), `.level-low-friction` (verde), `.level-backlog` (gris), `.level-standard` (gold) |

---

## TABLA MAESTRA DE FEATURES

### W-FEAT-1 · Cortana briefing en WorkHub ✅

| | |
|---|---|
| **Archivos** | `aiMemorySlice.ts` + `AgentOrchestrator.ts` + `WorkHub.jsx` + `WorkHub.css` |
| **Cambio slice** | Añadido `lastVerdict: { text, summary, timestamp, priority } \| null` al estado + reducer `setLastVerdict` |
| **Cambio orchestrator** | Import `setLastVerdict`; tras `this.lastDecision = decision`, dispatch con `finalVerdict`, `summary` del agente líder, `timestamp: Date.now()`, `priority` |
| **Cambio UI** | `useSelector` para `state.aiMemory?.lastVerdict`; banner `.cortana-briefing` visible solo si `timestamp` es de los últimos 30 min |
| **Flujo verificable** | Esperar que Cortana se active → volver a WorkHub en los 30 min siguientes → aparece "🧿 Cortana: [resumen]" |

### W-FEAT-2 · Expandir `AgentContext.workHub` ✅

| | |
|---|---|
| **Archivos** | `types.ts` + `AgentOrchestrator.ts` (buildContext) |
| **Campos nuevos** | `activeProjects`, `topTask`, `loggedHoursToday`, `tasksWithoutDueDate`, `overdueProjects` |
| **Cálculo `loggedHoursToday`** | Suma de `t.timeLogs[].hoursWorked` donde `loggedAt` empieza con la fecha de hoy (`YYYY-MM-DD`) |
| **Cálculo `overdueProjects`** | Proyectos donde `deadline < now && status !== 'completed' && status !== 'cancelled'` |
| **Efecto** | StrategistAgent ahora recibe un contexto más rico → mejores veredictos sobre Work |

### W-FEAT-3 · Time Log panel en ProjectDetails ✅

| | |
|---|---|
| **Archivos** | `src/pages/ProjectDetails.jsx` + `src/pages/ProjectDetails.css` |
| **Lógica** | `projectTimeEntries` = flatMap de `task.timeLogs` en tareas del proyecto, ordenados desc, top 20; `totalLoggedHours` = suma |
| **UI** | Sección `<section className="project-card project-time-log">` visible solo si hay entradas; muestra tarea, fecha, horas, notas |
| **CSS nuevo** | `.project-time-log`, `.time-log-header`, `.time-log-total`, `.time-entries-list`, `.time-entry`, `.entry-meta`, `.entry-task-title`, `.entry-date`, `.entry-footer`, `.entry-hours`, `.entry-notes` |
| **Flujo verificable** | Loguear tiempo en una tarea de un proyecto → abrir ProjectDetails → sección "Time Log" aparece al pie |

### W-FEAT-4 · Skill `open_gatekeeper` ✅

| | |
|---|---|
| **Archivo** | `src/modules/intelligence/skills.ts` |
| **Skill** | `id: 'open_gatekeeper'`, hub `WorkHub`, action `navigation/openGatekeeper` |
| **Keywords** | `gatekeeper`, `open gatekeeper`, `crear tarea prioritaria`, `tarea urgente`, `tarea crítica`, `priority task`, `critical task`, + más |
| **Flujo verificable** | Escribir "tarea urgente" en la omnibar → Cortana dispara `open_gatekeeper` → se abre el GatekeeperModal |

### W-FEAT-5 · Edición inline en MyTasks ✅

| | |
|---|---|
| **Archivos** | `src/pages/MyTasks.jsx` + `src/pages/MyTasks.css` + `src/context/TasksContext.tsx` |
| **TasksContext** | Añadido `updateTask(id, partialUpdates)` que hace spread + `updatedAt = now`; exportado en el value |
| **MyTasks** | Estado `editingId` / `editValue`; click en título → `<input>` con autofocus; blur/Enter → `commitTask`; Escape → cancelar |
| **Level cycling** | Click en badge de nivel → cicla `Critical → High Velocity → Steady Flow → Low Friction → Backlog → Critical` |
| **Due date** | Se muestra `📅 MM/DD/YYYY` debajo del título si la tarea tiene `dueDate` |
| **CSS nuevo** | `.mytasks-title-area`, `.mytasks-title-editable` (hover highlight), `.mytasks-title-input`, `.mytasks-due`, `.mytasks-level-badge` |

### W-FEAT-6 · Keywords ES en skills.ts ✅

| | |
|---|---|
| **Archivo** | `src/modules/intelligence/skills.ts` |
| **`create_project`** | +6 keywords ES: `crear proyecto`, `nuevo proyecto`, `iniciar proyecto`, `proyecto nuevo`, `empezar proyecto`, `abrir proyecto` |
| **`add_task`** | +7 keywords ES: `agregar tarea`, `nueva tarea`, `crear tarea`, `añadir tarea`, `tarea`, `quiero hacer`, `necesito hacer` |
| **`log_time`** | +6 keywords ES: `registrar horas`, `loguear tiempo`, `horas trabajadas`, `anotar tiempo`, `tiempo trabajado`, `registrar tiempo` |

---

## FLUJOS DE VERIFICACIÓN — ESTADO ACTUAL

### Flujo 1: Crear tarea y verla en My Tasks
1. Abrir GatekeeperModal (botón "Crear tarea prioritaria" en WorkHub)
2. Rellenar campos y enviar
3. **✅ Esperado**: tarea aparece en `/my-tasks` con `assigneeId` del usuario actual
4. **Root cause fix**: W-FIX-1 añadió `assigneeId` al payload

### Flujo 2: Weekly Progress real
1. Crear 4 tareas durante la semana actual
2. Marcar 2 como completadas
3. Ir a WorkHub → sección "Weekly Progress"
4. **✅ Esperado**: barra muestra `50%`, "Completed: 2", "Pending: 2"
5. **Root cause fix**: W-FIX-5 añadió filtro `createdAt >= startOfWeek`

### Flujo 3: Today's Focus navegable
1. Tener tareas asignadas a proyectos
2. WorkHub → card "Today's Focus"
3. **✅ Esperado**: badges de color por nivel; click navega al proyecto
4. **Root cause fix**: W-FIX-8

### Flujo 4: Cortana activa en WorkHub
1. Tener API Key configurada (OpenAI o Groq)
2. Esperar ciclo de orquestación (o forzar acción en omnibar)
3. Volver a WorkHub
4. **✅ Esperado**: banner "🧿 Cortana: [resumen del veredicto]" visible hasta 30 min
5. **Root cause fix**: W-FEAT-1

### Flujo 5: Log de tiempo en proyecto
1. Loguear horas en una tarea que tenga `projectId`
2. Abrir ProjectDetails del proyecto
3. **✅ Esperado**: sección "Time Log" al pie, con filas tarea/fecha/horas
4. **Root cause fix**: W-FEAT-3

---

## DESCUBRIMIENTO ARQUITECTÓNICO — ARCH-GAP-01 ✅ RESUELTO

### Dos sistemas de almacenamiento de tareas (resuelto en sesión 3)

Durante la auditoría se descubrió que las tareas existían en **dos lugares independientes**:

| Sistema | Archivo | Almacenamiento | Escribía | Leía |
|---------|---------|----------------|---------|-----|
| **TasksContext** | `src/context/TasksContext.tsx` | `localStorage` key `athenea.tasks` | GatekeeperModal | MyTasks, ProjectDetails |
| **tasksSlice** | `store/slices/tasksSlice.js` | Redux store (RAM) | Nadie | AgentOrchestrator (`state.tasks.tasks`) |

**Consecuencia original**: Cortana siempre veía `totalTasks: 0`, `criticalTasks: 0`.

### Solución implementada (ARCH-FIX-1)

**`store/slices/tasksSlice.js`**:
- Guard anti-duplicado en `addTask`: si ya existe una tarea con ese `id`, hace early return
- Nuevo reducer `hydrateFromStorage(tasks[])`: carga en bulk desde localStorage al montar, ignorando IDs ya presentes
- Exportado `hydrateFromStorage`

**`src/context/TasksContext.tsx`**:
- Import de `addTaskToSlice`, `updateTaskInSlice`, `hydrateFromStorage` desde el slice
- `updateTask` añadido al tipo `TasksContextValue` (faltaba)
- `useEffect` de inicialización: tras `setTasks(parsed)`, llama `dispatch(hydrateFromStorage(parsed))` → Redux arranca con datos reales
- `addTask`: tras `setTasks`, llama `dispatch(addTaskToSlice(newTask))` → nuevas tareas van a ambos sistemas
- `updateTask`: tras `setTasks`, llama `dispatch(updateTaskInSlice({ id, ...updates }))` → ediciones se reflejan en Redux

### Flujo post-fix

```
App mount
  ↓ TasksContext useEffect
  ↓ localStorage.getItem('athenea.tasks') → [task1, task2, ...]
  ↓ setTasks(parsed)                        → UI recibe tareas
  ↓ dispatch(hydrateFromStorage(parsed))    → state.tasks.tasks = [task1, task2, ...]
  
GatekeeperModal crea tarea
  ↓ addTask(newTask) en TasksContext
  ↓ setTasks([newTask, ...prev])            → UI actualizada
  ↓ dispatch(addTaskToSlice(newTask))       → Redux actualizado
  
AgentOrchestrator.buildContext()
  ↓ state.tasks.tasks → [task1, task2, newTask]  ← ya no vacío
  ↓ criticalTasks = tasks.filter(t.level === 'Critical' ...).length  ← valor real
  ↓ Cortana se activa ✅
```

### Verificación

| Check | Cómo verificar | Esperado |
|-------|---------------|---------|
| Hidratación | Redux DevTools al cargar la app | `state.tasks.tasks` tiene las tareas de localStorage |
| Nueva tarea | Crear tarea → Redux DevTools | Aparece en `state.tasks.tasks` inmediatamente |
| Cortana | Forzar orquestación con tarea Critical | `totalTasks > 0`, `criticalTasks > 0` |
| Sin duplicados | Crear tarea y recargar página | Tarea aparece una sola vez en Redux |

**Archivos modificados**: [TasksContext.tsx](src/context/TasksContext.tsx), [tasksSlice.js](store/slices/tasksSlice.js)  
**Errores post-fix**: 0

---

## ARCHIVOS MODIFICADOS (ESTA SESIÓN)

| Archivo | Cambios | Fixes/Features |
|---------|---------|----------------|
| `src/components/modals/GatekeeperModal.tsx` | + `useSelector` auth.user + `assigneeId` | W-FIX-1 |
| `store/slices/tasksSlice.js` | - extraReducer logTime + `loggedAt` + `updateTask` + `restoreTask` | W-FIX-2, W-FIX-4, W-FIX-7 |
| `src/modules/intelligence/agents/AgentOrchestrator.ts` | `t.level` filter + `setLastVerdict` dispatch + 5 new context fields | W-FIX-3, W-FEAT-1, W-FEAT-2 |
| `src/pages/WorkHub.jsx` | weekly calc + cortana banner + task item navigation | W-FIX-5, W-FIX-8, W-FEAT-1 |
| `src/pages/WorkHub.css` | level badge colors + cortana styles + task-item hover | W-FIX-8, W-FEAT-1 |
| `src/store/slices/aiMemorySlice.ts` | + `lastVerdict` state + `setLastVerdict` reducer | W-FEAT-1 |
| `src/modules/intelligence/agents/types.ts` | 5 new fields en `AgentContext.workHub` | W-FEAT-2 |
| `src/modules/intelligence/skills.ts` | `priority` → `level` enum + `open_gatekeeper` skill + ES keywords | W-FIX-6, W-FEAT-4, W-FEAT-6 |
| `src/pages/ProjectDetails.jsx` | + `projectTimeEntries` calc + time log section | W-FEAT-3 |
| `src/pages/ProjectDetails.css` | + time log CSS | W-FEAT-3 |
| `src/context/TasksContext.tsx` | + `updateTask` function + exported in value | W-FEAT-5 |
| `src/pages/MyTasks.jsx` | inline editing + level cycling + due date display | W-FEAT-5 |
| `src/pages/MyTasks.css` | + inline edit styles + level badge styles | W-FEAT-5 |

**Total archivos tocados**: 13  
**Errores de compilación post-implementación**: 0

- **WORK-BUG-03**: `criticalTasks` lee `level === 'Critical'` (correcto aquí) pero el AgentOrchestrator lee `priority === 'high'` — los números divergen entre UI y Cortana.

---

### 1.2 `src/pages/Projects.jsx`

| Atributo | Detalle |
|----------|---------|
| **Rol** | CRUD completo de proyectos con seguimiento económico y de tareas |
| **Estado local** | Modales (show/hide), formularios, filtro activo (`all / personal / client`) |
| **Selectores Redux** | `state.projects.projects`, `state.projects.isLoading` |
| **Hooks** | `useTasks()`, `useDispatch()`, `useCurrentUser()` (implícito via selector) |
| **Dispatches** | `addProject`, `updateProject`, `deleteProject` (projectsSlice) · `recordIncome` (paymentsSlice) · `addIncome` (budgetSlice) · `actionHistory/record` |
| **Tipo de proyectos** | Personal vs Client (toggle en modal de creación) |
| **Campos económicos** | `totalAmount`, `advanceAmount`, `isSubscription`, `subscriptionAmount` |
| **Visualización de tareas** | MERGE de `project.tasks[]` (array legado de strings) con tareas de `tasksSlice` filtradas por `task.projectId === project.id`. Deduplicación por `title` |
| **Barra de progreso por proyecto** | `completedTasksCount / totalTasksCount` sin cache — recalculado en render |
| **Flujo económico** | Al crear proyecto client con advance/subscription → auto-dispatch a paymentsSlice y budgetSlice |
| **Cancel / Restore / Delete** | Flujo de tres estados: activo → cancelado (soft) → borrado (permanente) |
| **GatekeeperModal** | Botón "Add Task" en cada card dispara el CustomEvent |

**Bugs en Projects:**
- **WORK-BUG-04**: No hay edición de tareas desde la card del proyecto — solo visualización.
- **WORK-BUG-05**: `project.tasks[]` (legado) y `tasksSlice` coexisten con deduplicación frágil (por `title`), no por ID.
- **WORK-BUG-06**: `isLoading` se consume en UI, pero el reducer nunca lo pone en `true` → skeleton nunca aparece aunque redux tenga datos async.

---

### 1.3 `src/pages/ProjectDetails.jsx`

| Atributo | Detalle |
|----------|---------|
| **Rol** | Vista detallada de un proyecto: info, progreso, tareas estratégicas, línea de tiempo de suscripción, tareas eliminadas |
| **Acceso** | Via `useParams()` → `projectId` → `state.projects.projects.find(...)` |
| **Selector clave** | `state.projects.currentProject` (seteado por `setCurrentProject`) |
| **Settings form** | Edita nombre, descripción, fechas, estado, workstreamId |
| **Subscription timeline** | `buildSubscriptionTimeline()` — genera cuotas proyectadas a futuro con base en `subscriptionAmount` y `billingCycle` |
| **Task list** | Mismo patrón MERGE que Projects.jsx (tasks legadas + tasksSlice por projectId) |
| **Priority chips** | Leyenda visual de niveles de prioridad (Critical / High Velocity / etc.) |
| **Deleted tasks panel** | Muestra tareas con `status === 'deleted'` del proyecto — recuperación no implementada |
| **GatekeeperModal** | ✅ Presente también en esta vista |

**Bugs en ProjectDetails:**
- **WORK-BUG-07**: El panel "deleted tasks" muestra las tareas pero no hay acción de restaurar.
- **WORK-BUG-08**: `setCurrentProject` debe llamarse antes de navegar a ProjectDetails, responsabilidad no centralizada.

---

### 1.4 `src/pages/MyTasks.jsx`

| Atributo | Detalle |
|----------|---------|
| **Rol** | Vista de tareas asignadas al usuario actual |
| **Estado local** | Filtros de estado (tab), query de búsqueda |
| **Hook central** | `useTasks()` + `useCurrentUser()` |
| **Filtro crítico** | `task.assigneeId === user?.id && task.status !== 'pending_approval'` |
| **Renderizado** | `LazyList` — virtualización para listas largas |
| **Acciones por tarea** | "In Progress" / "Completed" via `updateTaskStatus` — solo dos estados |
| **Campos mostrados** | Solo título y estado — sin prioridad, sin fecha, sin proyecto vinculado, sin horas registradas |
| **GatekeeperModal** | ✅ Presente |

**Bugs en MyTasks:**
- **WORK-BUG-09** 🔴 CRÍTICO: `GatekeeperModal.tsx` crea tareas con `addTask({...payload})` donde `payload` NO incluye `assigneeId`. En modo single-person jamás se setea `assigneeId`. Por tanto, `task.assigneeId === user?.id` **nunca es true** → **MyTasks siempre vacío**.
- **WORK-BUG-10**: Sin campo de prioridad visible — el usuario no puede jerarquizar su lista.
- **WORK-BUG-11**: Sin fecha límite visible — no diferencia urgente de postergable.
- **WORK-BUG-12**: Sin vínculo al proyecto de la tarea — contexto perdido.

---

### 1.5 `src/pages/Fleet.jsx`

| Atributo | Detalle |
|----------|---------|
| **Rol** | Gestión de colaboradores, work orders y asignación de tareas a personas |
| **Estado local** | Modales (collaborator, workOrder), forms, `expandedCollabId` |
| **Selectores Redux** | `state.collaborators`, `state.workOrders`, `state.projects` |
| **Hooks** | `useTasks()` → `tasks`, `updateTaskAssignment`, `updateTaskStatus` |
| **Dispatches** | `addCollaborator`, `updateCollaborator`, `deleteCollaborator`, `deleteWorkOrdersByCollaborator`, `addWorkOrder`, `updateWorkOrder`, `setWorkOrderStatus`, `setWorkOrderProgress` |
| **KPIs** | `completedWorkOrders`, `activeWorkOrders`, `activeCollaborators` |
| **CollaboratorCard** | Componente separado: `src/components/CollaboratorCard.jsx` |
| **Task assigner** | `unassignedTasks` (sin assigneeId + no completadas) mostradas en grid asignable |
| **Projects per collaborator** | `collab.projectIds[]` — cross-reference con `state.projects` in-component |
| **WorkOrder form** | title, description, collaboratorId, projectId, area, dueDate, priority |

**Observaciones Fleet:**
- **WORK-OBS-01**: WorkOrders tienen `projectId` en el formulario y en el dispatch, pero `workOrdersSlice` almacena el payload completo (spread) → `projectId` sí persiste en el store, aunque no haya schema forzado.
- **WORK-OBS-02**: Al borrar colaborador, `deleteWorkOrdersByCollaborator` limpia las work orders — cascade correcto.
- **WORK-OBS-03**: `collaboratorTasks` filtra por `task.assigneeId` in active collaborators — correctamente excluye al usuario dueño. Pero en single-person mode las tareas nunca tienen `assigneeId` → el panel siempre vacío.

---

## 2. Inventario — Redux Slices

### 2.1 `store/slices/tasksSlice.js`

```
State shape:
  {
    tasks: [],
    timeEntries: []
  }
```

| Reducer | Acción | Comportamiento |
|---------|--------|---------------|
| `addTask` | `tasks/addTask` | Spread completo del payload — schema no forzado |
| `rescheduleTask` | `tasks/rescheduleTask` | Actualiza `dueDate` de tarea por id |
| `completeTask` | `tasks/completeTask` | Setea `completed: true`, `completedAt: ISO string`, `status: 'Completed'` |
| `logTime` | `tasks/logTime` | Adds to `timeEntries[]` + incrementa `task.loggedHours` |

**Reducer extraReducer duplicado:**
```js
// Reducer (línea ~42):
logTime: (state, action) => { /* incrementa loggedHours + push timeEntries */ }

// ExtraReducer (línea ~78):
builder.addCase('tasks/logTime', (state, action) => { /* mismo código */ })
```
→ `tasks/logTime` se procesa **dos veces** en cada dispatch.

**Bugs confirmados en tasksSlice:**
- **WORK-BUG-13** 🔴 CRÍTICO: `logTime` double-execution — cada registro de horas dobla el valor `loggedHours` y crea dos entradas en `timeEntries`.
- **WORK-BUG-14**: No existe `updateTask` reducer — una tarea creada no puede editarse (título, descripción, dueDate, level, workstreams).
- **WORK-BUG-15**: `timeEntries[]` nunca se lee en ningún componente de la UI — los datos se pierden funcionalmente.
- **WORK-BUG-16**: `addTask` acepta cualquier payload sin validar schema — posible inconsistencia entre tareas creadas por GatekeeperModal vs Omnibar vs código manual.

---

### 2.2 `store/slices/projectsSlice.js`

```
State shape:
  {
    projects: [],
    currentProject: null,
    isLoading: false
  }
```

| Reducer | Acción | Comportamiento |
|---------|--------|---------------|
| `addProject` | `projects/addProject` | Push al array con payload spread |
| `updateProject` | `projects/updateProject` | Merge by id con payload parcial |
| `deleteProject` | `projects/deleteProject` | Filter by id |
| `setCurrentProject` | `projects/setCurrentProject` | Setea `currentProject` |

**Bugs en projectsSlice:**
- **WORK-BUG-17**: `isLoading` nunca cambia de estado en ningún reducer — siempre `false`. Cualquier uso condicional en UI es efectivamente inoperativo.
- **WORK-BUG-18**: `tasks[]` dentro de cada proyecto es un array legado de strings (títulos), no referencias a `tasksSlice`. Coexisten sin FK definida.
- **WORK-BUG-19**: No hay campo `workstreams` en el slice — los workstreams viven en las tareas hijas (`task.workstreams[]` o `task.workstreamId`), no en el proyecto padre.

---

### 2.3 `store/slices/workOrdersSlice.js`

```
State shape:
  { workOrders: [] }
```

| Reducer | Acción | Comportamiento |
|---------|--------|---------------|
| `addWorkOrder` | `workOrders/addWorkOrder` | Push con `id: Date.now()`, spread payload |
| `updateWorkOrder` | `workOrders/updateWorkOrder` | Merge by id |
| `deleteWorkOrder` | `workOrders/deleteWorkOrder` | Filter by id |
| `deleteWorkOrdersByCollaborator` | `workOrders/deleteWorkOrdersByCollaborator` | Filter out por `collaboratorId` |
| `setWorkOrderStatus` | `workOrders/setWorkOrderStatus` | Setea `status` por id |
| `setWorkOrderProgress` | `workOrders/setWorkOrderProgress` | Setea `progress` (int 0-100) por id |

**Observaciones:**
- El slice está bien diseñado — 6 actions con responsabilidades claras.
- **WORK-OBS-04**: WorkOrders tienen `collaboratorId` (linkeado a collaboratorsSlice) y `projectId` (linkeado a projectsSlice) solo a nivel de valor primitivo — no hay validación de FK en ninguna dirección.
- **WORK-OBS-05**: WorkOrders no tienen linkeado ningún `taskId` — representan unidades de trabajo paralelas a las tasks, no derivadas de ellas.

---

### 2.4 `store/slices/collaboratorsSlice.js`

```
State shape:
  { collaborators: [] }
```

| Reducer | Acción | Comportamiento |
|---------|--------|---------------|
| `addCollaborator` | `collaborators/addCollaborator` | Push con `id: Date.now()`, `status: 'active'`, spread payload |
| `updateCollaborator` | `collaborators/updateCollaborator` | Merge by id |
| `deleteCollaborator` | `collaborators/deleteCollaborator` | Filter by id |
| `setCollaboratorStatus` | `collaborators/setCollaboratorStatus` | Setea `status` ('active' / 'inactive') |

**Observaciones:**
- **WORK-OBS-06**: `projectIds[]` vive en el objeto colaborador (seteado desde Fleet form), pero no hay validación de que esos projectIds existan en projectsSlice.
- **WORK-OBS-07**: Collaborators no tienen `taskIds[]` — la asignación de tareas es unidireccional: la tarea tiene `assigneeId`, el colaborador no tiene lista de sus tareas.

---

## 3. Inventario — Skills IA para Work

Archivo: `src/modules/intelligence/skills.ts` — sección `workHubSkills`

### 3.1 Skill: `create_project`

```
id:          create_project
hub:         WorkHub
action:      projects/create
icon:        📁
keywords:    ['project', 'create project', 'new project', 'start project', 'begin project', 'collaborator', 'colaborador']
```

| Parámetro | Tipo | Required | Validación |
|-----------|------|----------|-----------|
| `title` | string | ✅ | `/^.{3,100}$/` |
| `description` | string | ❌ | — |
| `dueDate` | date | ❌ | — |
| `priority` | select | ❌ | enum: `low / medium / high / critical` |

**Irregularidad detectada:**
- El enum de `priority` en el skill (`low / medium / high / critical`) no coincide con los niveles reales del sistema (`Critical / High Velocity / Standard / Quick Win / Background`). Un proyecto creado por Omnibar con `priority: 'high'` no matchea ningún nivel de prioridad de tareas/proyectos de la app.

---

### 3.2 Skill: `add_task`

```
id:          add_task
hub:         WorkHub
action:      tasks/add
icon:        ✅
keywords:    ['add', 'task', 'do', 'create', 'todo', 'to do', 'need to', 'project task']
```

| Parámetro | Tipo | Required | Validación |
|-----------|------|----------|-----------|
| `title` | string | ✅ | `/^.{3,200}$/` |
| `projectId` | string | ❌ | — |
| `priority` | select | ❌ | enum: `low / medium / high` |
| `dueDate` | date | ❌ | — |
| `estimatedHours` | number | ❌ | — |

**Irregularidades detectadas:**
- Mismo problema de `priority` enum: `low / medium / high` vs sistema real que usa `level` con valores nominales ('Critical', 'High Velocity', etc.).
- `add_task` a través de Omnibar **bypasea el GatekeeperModal completamente** — no aplica el scoring de preguntas universales, crea la tarea sin `level` calculado.
- No setea `assigneeId` → tarea creada por skill tampoco aparecerá en MyTasks.

---

### 3.3 Skill: `log_time`

```
id:          log_time
hub:         WorkHub
action:      tasks/logTime
icon:        ⏱️
keywords:    ['log', 'spent', 'hours', 'worked', 'time', 'record']
```

| Parámetro | Tipo | Required | Validación |
|-----------|------|----------|-----------|
| `taskId` | string | ✅ | — |
| `hoursWorked` | number | ✅ | — |
| `notes` | string | ❌ | — |

**Irregularidades:**
- Dispatcha `tasks/logTime` → **activa el doble bug** del reducer + extraReducer → cada `log_time` via Omnibar dobla las horas registradas.
- `timeEntries` resultantes nunca se muestran en UI.

---

### 3.4 Skills adicionales en WorkHub

| Skill | Acción | Uso |
|-------|--------|-----|
| `search` (ruta ~398) | búsqueda global | hub: WorkHub |
| `sync_calendar` (~420) | sincronizar calendario | hub: WorkHub |
| `open_calendar` (~437) | abrir vista de calendario | hub: WorkHub |

> Estos skills existen en el manifesto pero no hay evidencia de handlers implementados en el side-panel de Work.

---

## 4. Análisis — StrategistAgent (Cortana)

Archivo: `src/modules/intelligence/agents/StrategistAgent.ts`

### 4.1 Qué lee Cortana

```
AgentContext.workHub:
  criticalTasks   (number) — computado en AgentOrchestrator.buildContext()
  overdueTasks    (number) — ídem
  completedToday  (number) — ídem
  totalTasks      (number) — tasks.length

AgentContext:
  energyLevel     ('low' | 'medium' | 'high') — basado en hora del día
  sensorData.battery
  externalData.weather
  blackBox.weatherImpact
```

### 4.2 Qué NO lee Cortana

| Dato ausente | Impacto |
|-------------|---------|
| Array completo de tareas | No puede identificar tareas específicas urgentes |
| Array de proyectos | No conoce estado o avance de proyectos |
| `loggedHours` / `timeEntries` | No puede detectar overwork o underwork |
| `workstreams` | No conoce áreas de trabajo activas |
| Datos de colaboradores | No distingue trabajo personal de delegado |
| `subscriptionAmount` / flujo económico | No conecta Work con Finance |

### 4.3 `shouldActivate` — condiciones de activación

```typescript
shouldActivate(context: AgentContext): boolean {
  return (
    context.workHub.criticalTasks > 0 ||
    context.workHub.overdueTasks > 0 ||
    context.sensorData.battery.isCritical ||
    (context.externalData.weather?.alerts?.length ?? 0) > 0
  );
}
```

**Bug de activación:** `criticalTasks` siempre vale `0` (ver sección 4.4) → Cortana solo se activa si hay overdue tasks, batería crítica o alerta de clima. La señal de trabajo crítico está silenciada.

### 4.4 El bug del campo `priority` vs `level`

**En `AgentOrchestrator.ts` línea 292:**
```typescript
const criticalTasks = tasks.filter(
  (t: any) => t.priority === 'high' && !t.completed
).length;
```

**En `GatekeeperModal.tsx` (campos reales de la tarea creada):**
```typescript
addTask({
  ...payload,
  level: priorityLevel,  // → 'Critical' | 'High Velocity' | 'Standard' | etc.
  // ⚠️ NO hay campo 'priority'
})
```

Las tareas usan el campo `level` (string nominal), no `priority`. El OrchestratortAsigna lee `t.priority` que nunca existe → `criticalTasks` siempre es `0` → Cortana nunca ve trabajo crítico.

### 4.5 Los 5 patrones de veredicto de Cortana

| Condición | Veredicto generado |
|-----------|-------------------|
| `criticalTasks > 3 && energyLevel === 'low'` | Sobrecarga + energía baja — reducir scope |
| `weather.alerts.length > 0` | Alerta meteorológica — ajustar agenda |
| `battery.isCritical` | Batería crítica — guardar trabajo antes de desconexión |
| `completedToday > totalTasks * 0.7 && energyLevel === 'high'` | Ventana de alta productividad |
| (default) | Estado normal — continuar |

**Observación:** Ningún patrón involucra proyectos, workstreams, colaboradores o horas registradas — la inteligencia estratégica de Cortana está limitada a contadores básicos que mayoritariamente retornan 0.

### 4.6 Capacidades de acción de Cortana

**Ninguna.** Cortana es un agente de solo-lectura + recomendación. No puede:
- Crear, modificar o completar tareas
- Reasignar work orders
- Cambiar estado de proyectos
- Interactuar con el store

---

## 5. Tabla de Funcionalidades

| # | Funcionalidad | ¿Existe? | Estado | Componente | Notas |
|---|--------------|----------|--------|-----------|-------|
| 1 | Ver lista de proyectos activos | ✅ | Funcional | Projects.jsx | Filtro all/personal/client |
| 2 | Crear proyecto personal | ✅ | Funcional | Projects.jsx | Sin campos económicos |
| 3 | Crear proyecto cliente con cuota/suscripción | ✅ | Funcional | Projects.jsx | Auto-despacha a Finance |
| 4 | Editar proyecto existente | ✅ | Funcional | ProjectDetails.jsx | Settings form completo |
| 5 | Cancelar / restaurar proyecto | ✅ | Funcional | Projects.jsx | Soft-delete |
| 6 | Eliminar proyecto permanente | ✅ | Funcional | Projects.jsx | Preceded by cancel |
| 7 | Ver timeline de suscripción | ✅ | Funcional | ProjectDetails.jsx | Solo proyectos con billing |
| 8 | Ver tareas de un proyecto | ✅ | Parcial | Projects.jsx, ProjectDetails.jsx | Merge legado+slice, no editables |
| 9 | Crear tarea via GatekeeperModal | ✅ | Funcional | GatekeeperModal.tsx | 3 pasos, scoring ATHENEA |
| 10 | Crear tarea via Omnibar skill | ✅ | Parcial | skills.ts `add_task` | Bypasea scoring, sin assigneeId |
| 11 | Editar tarea existente | ❌ | Ausente | — | No hay `updateTask` en slice |
| 12 | Ver tareas asignadas al usuario | ❌ | Roto | MyTasks.jsx | assigneeId nunca seteado |
| 13 | Marcar tarea en progreso | ✅ | Funcional | MyTasks.jsx | Solo MyTasks — requiere reparar #12 |
| 14 | Completar tarea | ✅ | Funcional | MyTasks.jsx, ProjectDetails.jsx | `completeTask` en slice |
| 15 | Registrar horas trabajadas | ✅ | Roto | skills `log_time` | Double-execution en logTime |
| 16 | Ver historial de horas (timeEntries) | ❌ | Ausente | — | Datos existen, UI no los muestra |
| 17 | Gestionar colaboradores (CRUD) | ✅ | Funcional | Fleet.jsx | Con status active/inactive |
| 18 | Crear work order para colaborador | ✅ | Funcional | Fleet.jsx | Con progreso 0-100 |
| 19 | Asignar tarea a colaborador | ✅ | Funcional | Fleet.jsx | `updateTaskAssignment` |
| 20 | Ver KPIs de Fleet | ✅ | Funcional | Fleet.jsx | Completed/Active work orders, active collaborators |
| 21 | Cortana alerta sobre tareas críticas | ❌ | Roto | StrategistAgent.ts | `priority` vs `level` mismatch |
| 22 | Cortana alerta sobre overdue | ✅ | Funcional | StrategistAgent.ts | Solo si hay dueDate seteado |
| 23 | Progreso semanal real | ❌ | Roto | WorkHub.jsx | Muestra all-time, no semanal |
| 24 | Navegar a detalle de proyecto | ✅ | Funcional | WorkHub.jsx, Projects.jsx | Via hash routing |
| 25 | Tareas eliminadas recuperables | ❌ | Parcial | ProjectDetails.jsx | Panel visible, sin acción restore |

---

## 6. Flujos Documentados

### FLUJO 1 — Crear proyecto cliente con tarea inicial

```
1. Usuario navega a Work → Projects
2. Click "New Project" → modal abre
3. Toggle "Client" → aparece sección económica
4. Completa: name, clientName, totalAmount, advanceAmount, isSubscription flag
5. Submit → dispatch(addProject(payload))
              ↓
           dispatch(recordIncome({ amount: advanceAmount, ... })) → paymentsSlice
              ↓
           dispatch(addIncome({ amount: advanceAmount, ... })) → budgetSlice
              ↓
           dispatch(actionHistory/record)
6. Card de proyecto aparece en la lista
7. Click "Add Task" en la card → window.dispatchEvent('athenea:gatekeeper:open')
8. GatekeeperModal abre — Step 1: selección de proyecto (proyecto nuevo preseleccionado)
9. Step 2: título + descripción de la tarea
10. Step 3: responder preguntas universales (checklist)
11. Sistema calcula `normalizedScore` → `priorityLevel` (e.g. 'Critical')
12. Click "Save" → addTask({ id, createdAt, projectId, title, level: 'Critical', ... })
                    → tarea persiste en tasksSlice
13. La card del proyecto ahora muestra +1 tarea en su lista
```

**Nota de rotura:** La tarea creada NO tiene `assigneeId` → no aparece en MyTasks.

---

### FLUJO 2 — Registrar tiempo trabajado via Omnibar

```
1. Usuario abre Omnibar (shortcut o botón)
2. Escribe: "log 2 hours in task X"
3. Sistema matchea skill `log_time` por keywords: 'log', 'hours', 'worked'
4. Omnibar extrae parámetros: { taskId: X, hoursWorked: 2 }
5. Skill dispatcha: dispatch({ type: 'tasks/logTime', payload: { taskId: X, hoursWorked: 2 } })
6. Redux procesa la action:
     a. Reducer `logTime` (tasksSlice): loggedHours += 2, timeEntries.push(entry)  ← ejecución 1
     b. ExtraReducer 'tasks/logTime' (tasksSlice): loggedHours += 2, timeEntries.push(entry)  ← ejecución 2 (BUG)
7. Resultado: loggedHours = 4 (doble), timeEntries tiene 2 entradas
8. No hay UI que muestre timeEntries → datos corruptos nunca son visibles
```

**Bug explotado:** WORK-BUG-13.

---

### FLUJO 3 — Asignar tarea a colaborador desde Fleet

```
1. Usuario navega a Work → Fleet
2. Panel "Unassigned Tasks" muestra tareas sin assigneeId
3. Usuario selecciona task + selecciona colaborador en el dropdown
4. Click "Assign" → updateTaskAssignment(taskId, collaboratorId)
5. useTasks() context llama dispatch → tarea recibe assigneeId = collaboratorId
6. La tarea desaparece de "Unassigned Tasks" (ya no filtra como unassigned)
7. La tarea aparece en "Collaborator Tasks" del ColaboratorCard correspondiente
8. El collaborador puede ver su tarea expandiendo su card
9. Fleet muestra tarea en el panel de tareas del colaborador

Efecto colateral: task.assigneeId ahora = collaboratorId (no el userId del owner)
→ La tarea sigue sin aparecer en MyTasks porque assigneeId ≠ user.id
```

---

### FLUJO 4 — Cortana analiza trabajo en curso

```
1. AgentOrchestrator.orchestrate() es invocado (manual o automático)
2. buildContext() se ejecuta:
     a. Lee state.tasks.tasks → filtra t.priority === 'high' → criticalTasks = 0 (siempre, BUG)
     b. Lee state.tasks.tasks → filtra t.dueDate < now → overdueTasks = N (solo si hay dueDates)
     c. Calcula energyLevel por hora del día (9-12 = 'high', 14-16 = 'low', etc.)
     d. contexts.workHub = { criticalTasks: 0, overdueTasks: N, completedToday: M, totalTasks: T }
3. StrategistAgent.shouldActivate(context):
     → criticalTasks > 0? NO (siempre 0)
     → overdueTasks > 0? Depende de tareas con dueDate vencida
     → battery.isCritical? Depende de sensor
     → weather.alerts? Depende de datos externos
4. Si shouldActivate = false → StrategistAgent no se invoca
5. Si shouldActivate = true → analyze(context) ejecuta los 5 patrones
6. Veredicto generado (texto) → sale al UI via OrchestratorDecision
7. Work Hub no consume OrchestratorDecision — el veredicto no aparece en WorkHub.jsx
```

**Resultado:** Cortana trabaja en vacío para el área Work.

---

### FLUJO 5 — Crear orden de trabajo para colaborador

```
1. Usuario navega a Work → Fleet
2. Click "New Work Order" (global) o "Add Order" en CollaboratorCard
3. WorkOrder modal abre con form: title, description, collaboratorId, projectId, area, dueDate, priority
4. Si viene de CollaboratorCard → collaboratorId pre-seteado
5. Submit → dispatch(addWorkOrder({ title, collaboratorId, projectId, ... }))
6. Work order persiste en workOrdersSlice con id = Date.now()
7. Aparece en la lista de work orders del colaborador
8. Usuario puede actualizar progreso con slider:
     → dispatch(setWorkOrderProgress({ id, progress: 75 }))
9. Usuario puede completar:
     → dispatch(setWorkOrderStatus({ id, status: 'completed' }))
10. Al borrar colaborador:
     → dispatch(deleteWorkOrdersByCollaborator(collaboratorId)) → cascade

Desconexión: La work order tiene projectId guardado pero:
- El proyecto no sabe que tiene work orders
- Las tasks del proyecto no tienen workOrderId
- La work order no tiene taskId
```

---

## 7. Qué Falta / Está Roto

### 7.1 Bugs activos (ordenados por severidad)

| ID | Severidad | Descripción | Archivo y línea |
|----|----------|-------------|----------------|
| WORK-BUG-09 | 🔴 CRÍTICO | MyTasks siempre vacío — GatekeeperModal no setea `assigneeId` | `GatekeeperModal.tsx` → `addTask` sin assigneeId |
| WORK-BUG-13 | 🔴 CRÍTICO | `logTime` double-execution — reducer + extraReducer ambos procesan `tasks/logTime` | `tasksSlice.js` líneas ~42 y ~78 |
| WORK-BUG-21 | 🔴 CRÍTICO | `criticalTasks` siempre = 0 — `priority === 'high'` pero tareas usan `level` | `AgentOrchestrator.ts` línea 292 |
| WORK-BUG-14 | 🟠 ALTO | No hay `updateTask` — tareas no editables post-creación | `tasksSlice.js` — reducer ausente |
| WORK-BUG-15 | 🟠 ALTO | `timeEntries[]` se acumula silenciosamente, cero UI | Todos los componentes Work |
| WORK-BUG-01 | 🟠 ALTO | "Weekly Progress" muestra all-time, no semanal | `WorkHub.jsx` — calculo de progreso |
| WORK-BUG-04 | 🟠 ALTO | Tareas en project card no editables — solo visibles | `Projects.jsx` |
| WORK-BUG-07 | 🟠 MEDIO | Panel "deleted tasks" visible sin acción de restaurar | `ProjectDetails.jsx` |
| WORK-BUG-06 | 🟡 BAJO | `isLoading` en projectsSlice nunca se activa | `projectsSlice.js` |
| WORK-BUG-02 | 🟡 BAJO | "Today's Focus" no filtra por fecha — es por prioridad | `WorkHub.jsx` |

### 7.2 Funcionalidades ausentes

| ID | Funcionalidad faltante | Impacto |
|----|----------------------|---------|
| GAP-01 | Panel de horas registradas (`timeEntries`) | El dato existe pero es invisible |
| GAP-02 | Edición de tareas post-creación (`updateTask`) | Correcciones imposibles sin borrar y recrear |
| GAP-03 | Filtro temporal real en "Weekly Progress" | KPI engañoso en WorkHub |
| GAP-04 | Filtro por fecha en "Today's Focus" | No hay diferenciación de agenda diaria |
| GAP-05 | Cortana integrada en WorkHub.jsx | Veredictos generados pero no consumidos |
| GAP-06 | Restore de tarea eliminada | Panel de deleted tasks sin utilidad |
| GAP-07 | Vínculo de work order → tarea | Órdenes de trabajo aisladas |
| GAP-08 | Horas estimadas vs registradas por proyecto | Seguimiento de esfuerzo imposible |
| GAP-09 | Notificaciones de tarea próxima a vencer | Sin alertas proactivas al usuario |
| GAP-10 | Exportar datos de proyecto / trabajo | Sin salida de datos |

---

## 8. CSS y Consistencia Visual

### 8.1 WorkHub.css

- Usa variables CSS del sistema (`--bg-primary`, `--accent-blue`, `--text-primary`).
- Skeleton animado con `@keyframes shimmer` — consistente con Personal Hub.
- El progress bar usa `width: ${percent}%` inline — compatible con todos los navegadores.
- **Inconsistencia**: El nivel 'Critical' en "Today's Focus" usa clase hardcoded `.level-critical` — no hay token de color definido en el sistema de diseño.

### 8.2 Projects.css

- Cards con `box-shadow` definido directamente (no variable) — inconsistente con el resto del sistema.
- Sección económica con separador visual, diferencias claras personal vs client.
- **Inconsistencia**: Los badges de estado (`active`, `cancelled`, `completed`) usan colores hex inline, no variables CSS.

### 8.3 MyTasks.css

- Muy simple — básicamente una lista de items con acciones.
- Sin indicadores visuales de prioridad ni fecha — consecuencia del bug WORK-BUG-10/11.
- Usa el mismo componente `LazyList` del sistema.

### 8.4 Fleet.css

- El más complejo del área Work — dos columnas, cards expandibles, modal doble.
- `CollaboratorCard` tiene CSS separado — buena práctica de componentización.
- KPI strip usa grid de 3 columnas, bien separado.

### 8.5 ProjectDetails.css

- Robusto — cubre `subscription-timeline`, `priority-chip`, `deleted-tasks-panel`.
- Los chips de prioridad tienen keyframe de entrada — `@keyframes chipIn`. Positivo.
- **Inconsistencia**: el color de los chips de prioridad en ProjectDetails es diferente a los badges de nivel en WorkHub.jsx (ambos representan lo mismo: `level`).

### 8.6 GatekeeperModal.css

- Modal full-overlay con backdrop blur — correcto para flujo de alta importancia.
- Sticky footer con botones back/continue — buena UX.
- Escape key implementado (UX-9 fix). ✅
- Score chip con color dinámico según nivel — positivo.

---

## 9. Irregularidades — Datos y Lógica

| ID | Irregularidad | Detalle |
|----|--------------|---------|
| IRRE-D-01 | Doble esquema de tasks en proyecto | `project.tasks[]` (strings legados) coexiste con `tasksSlice` sin FK — merge por título es frágil |
| IRRE-D-02 | Campo `level` vs campo `priority` | Sistema usa `level` ('Critical' / 'High Velocity' / etc.) en tasks pero skills params y AgentOrchestrator usan `priority` ('low' / 'high') |
| IRRE-D-03 | `timeEntries[]` = black hole | Reducer persiste datos de horas, ningún componente los lee |
| IRRE-D-04 | `logTime` double-execution | Cada `tasks/logTime` action ejecuta dos reducers — datos de horas duplicados desde el inicio |
| IRRE-D-05 | `isLoading` muerto en projectsSlice | Campo existe, nunca cambia — skeleton de Projects siempre depende de otro guard |
| IRRE-D-06 | WorkOrders sin FK hacia tasks | Un work order para un colaborador no puede linkearse a la tarea que representa |
| IRRE-D-07 | Collaborators sin FK hacia tasks | `collaborator.projectIds[]` existe, `collaborator.taskIds[]` no — asignación unidireccional |
| IRRE-D-08 | `completedAt` vs `completedToday` | AgentOrchestrator compara `completedAt` date con today, pero el reducer guarda `completedAt: new Date().toISOString()` — ✅ correcto; pero `completedToday` no distingue si la tarea fue marcada hoy a las 00:01 vs ayer a las 23:59 (timezone no considerado) |
| IRRE-D-09 | `assigneeId` ausente en addTask de GatekeeperModal | Crea la inconsistencia raíz de MyTasks vacío |
| IRRE-D-10 | `project.tasks[]` deduplicado por `title` | Si dos tareas se llaman igual (una en slice, otra en legado), se fusionan incorrectamente |

---

## 10. Irregularidades — Navegación y Acceso

| ID | Irregularidad | Detalle |
|----|--------------|---------|
| IRRE-N-01 | WorkHub no integra Cortana | Cortana genera veredictos estratégicos que nunca llegan al hub principal de Work |
| IRRE-N-02 | Acceso a ProjectDetails via `currentProject` | Si el usuario llega directo por URL hash (#/projects/:id) sin pasar por la lista, `currentProject` podría no estar seteado |
| IRRE-N-03 | "Today's Focus" en WorkHub lleva a... nada | Las tareas en el panel no son clickeables — no navegan a ningún detalle |
| IRRE-N-04 | Botón "My Tasks" en WorkHub navega a página siempre vacía | Resultado de WORK-BUG-09 |
| IRRE-N-05 | GatekeeperModal: si no hay proyectos, redirige via `window.location.hash` | Mix de routing hash manual con el router de la app — inconsistente |
| IRRE-N-06 | Fleet no tiene tab/link en WorkHub | El KPI strip de Fleet no es accesible desde la vista hub sin conocer el layout |

---

## 11. Irregularidades — IA y Cortana

| ID | Irregularidad | Detalle |
|----|--------------|---------|
| IRRE-IA-01 | Cortana ciega a tareas críticas | `priority === 'high'` siempre 0 — campo incorrecto leído en buildContext |
| IRRE-IA-02 | Cortana no lee proyectos | AgentContext.workHub solo tiene 4 números — proyectos invisibles para la IA |
| IRRE-IA-03 | Energía basada solo en hora del día | `energyLevel` ignora `sleepHours`, `steps`, `fatigueLevelEstimate` del sensorData que sí existe en context |
| IRRE-IA-04 | Cortana no tiene memoria de acciones pasadas | Cada `orchestrate()` es apátrida — no recuerda si el usuario ya fue alertado |
| IRRE-IA-05 | Veredicto no se muestra en WorkHub | OrchestratorDecision existe pero WorkHub no lo consume |
| IRRE-IA-06 | Skills `sync_calendar` / `open_calendar` en WorkHub sin implementar | Manifesto registrado, handlers ausentes |
| IRRE-IA-07 | Skill `add_task` crea tarea sin scoring GatekeeperModal | Bypasea el flujo de priorización — el nivel del sistema no se calcula |
| IRRE-IA-08 | `log_time` via skill activa doble bug | El dispatch del skill no tiene workaround para el double-execution |

---

## 12. Irregularidades — Work vs Personal Cross-Hub

| ID | Irregularidad | Detalle |
|----|--------------|---------|
| IRRE-X-01 | PersonalHub usa `todos` slice; WorkHub usa `tasks` slice | Dos sistemas de items de acción paralelos sin puente |
| IRRE-X-02 | GatekeeperModal solo en Work | Personal no tiene flujo equivalente de priorización (GAP conocido) |
| IRRE-X-03 | AgentContext.personalHub richísimo vs workHub pobrítico | personalHub tiene 7 campos; workHub solo 4 — asimetría de inteligencia |
| IRRE-X-04 | FinanceHub automáticamente conectado a Projects via auto-dispatch | Personal no tiene equivalente de tracking económico cross-hub |
| IRRE-X-05 | `timeEntries` no conectados a Finance | Horas trabajadas podría alimentar valorización de proyecto, pero no hay flujo |
| IRRE-X-06 | Cortana en Work usa hora del día para energía; VitalsAgent en Personal usa checkin | Métricas de energía divergentes entre hubs |

---

## 13. Irregularidades — Omnibar y Skills

| ID | Irregularidad | Detalle |
|----|--------------|---------|
| IRRE-O-01 | `create_project` param `priority` enum no matchea sistema | `'low/medium/high/critical'` vs `level` nominal |
| IRRE-O-02 | `add_task` param `priority` enum no matchea sistema | Mismo problema — 3 valores vs 5 niveles nominales |
| IRRE-O-03 | `add_task` no setea `assigneeId` | Tarea creada via Omnibar no aparece en MyTasks como las de GatekeeperModal (consistente en el bug, inconsistente en el producto) |
| IRRE-O-04 | `log_time` via Omnibar activa double-execution | Bug heredado del slice |
| IRRE-O-05 | `sync_calendar` y `open_calendar` registrados pero sin handler | Skills declarados sin ejecutor — posible warning en runtime |
| IRRE-O-06 | Skills de Work no retornan `level` calculado | Tareas creadas por Omnibar carecen del nivel de prioridad ATHENEA |
| IRRE-O-07 | GatekeeperModal no conectado a Omnibar | No hay skill que abra el Gatekeeper via Omnibar — los flujos son paralelos e incompatibles |

---

## 14. Tabla de Recomendaciones por Módulo

| Módulo | Problema | Recomendación | Severidad | Esfuerzo |
|--------|---------|--------------|-----------|---------|
| `tasksSlice.js` | `logTime` double-execution | Eliminar el bloque `extraReducers` que re-maneja `'tasks/logTime'` — el reducer ya lo cubre | 🔴 Crítico | XS (< 10 líneas) |
| `tasksSlice.js` | Sin `updateTask` | Agregar reducer `updateTask(state, action)` que merge por id | 🟠 Alto | S (< 30 líneas) |
| `GatekeeperModal.tsx` | Sin `assigneeId` | Agregar `assigneeId: currentUser?.id` al payload de `addTask()` cuando `user` existe | 🔴 Crítico | XS (2 líneas) |
| `AgentOrchestrator.ts` | `priority === 'high'` incorrecto | Cambiar a `t.level === 'Critical' \|\| t.level === 'High Velocity'` | 🔴 Crítico | XS (1 línea) |
| `WorkHub.jsx` | "Weekly Progress" sin filtro | Filtrar `completedTasksCount` y `totalTasksCount` por rango de semana actual | 🟠 Alto | S |
| `WorkHub.jsx` | "Today's Focus" sin filtro de fecha | Agregar `&& isToday(task.dueDate)` o equivalente como segunda capa (primary sort = level) | 🟠 Medio | S |
| `WorkHub.jsx` | Integrar veredicto Cortana | Consumir `OrchestratorDecision` del store/context y mostrar strip de veredicto | 🟠 Alto | M |
| `ProjectDetails.jsx` | Restore de tarea eliminada | Agregar acción de restaurar en el panel "deleted tasks" | 🟠 Medio | S |
| `tasksSlice.js` | `timeEntries` invisible | Agregar vista de horas en ProjectDetails.jsx (tabla de entradas) | 🟠 Medio | M |
| `StrategistAgent.ts` | Solo 4 inputs de Work | Expandir AgentContext.workHub con `activeProjectsCount`, `loggedHoursToday`, `topTask` | 🟠 Medio | M |
| `skills.ts` | `priority` enum incorrecto | Cambiar a `level` con enum: `'Critical' \| 'High Velocity' \| 'Standard' \| 'Quick Win' \| 'Background'` | 🟠 Alto | XS |
| `Fleet.jsx` | Panel de tareas de colaboradores vacío en single-person | Documentar comportamiento esperado para modo single vs modo team | 🟡 Bajo | XS |
| `projectsSlice.js` | `project.tasks[]` legado | Plan de migración: convertir strings a taskIds FK o deprecar | 🟡 Bajo | L (migración) |
| `workOrdersSlice.js` | WorkOrders sin `taskId` | Agregar campo `taskId?: string` opcional al schema para vincular WO con tarea | 🟡 Bajo | S |
| `GatekeeperModal.tsx` | No abre desde Omnibar | Registrar skill `open_gatekeeper` en skills.ts | 🟡 Bajo | S |

---

## 15. Veredicto Work Hub

El área Work de ATHENEA es la más ambiciosa del sistema y, al mismo tiempo, la que acumula la mayor densidad de bugs silenciosos. Tiene una arquitectura correctamente separada (tareas, proyectos, órdenes de trabajo, colaboradores en slices independientes), un flujo de entrada de tareas sofisticado (GatekeeperModal con scoring cognitivo real), y una integración financiera automática genuinamente útil (un proyecto con cuota dispara registros en Finance sin intervención manual). El núcleo funciona.

Sin embargo, tres bugs críticos convergen para vaciar de significado la experiencia del usuario en modo individual: las tareas creadas nunca aparecen en "My Tasks" (sin assigneeId), el tiempo registrado siempre se duplica (double-execution en logTime), y la IA estratégica (Cortana) está ciegamente apagada porque lee el campo incorrecto para identificar trabajo urgente. Estos tres fallos pueden corregirse cada uno con menos de 5 líneas de código.

El mayor problema estructural es la coexistencia del array legado `project.tasks[]` (strings) con el slice moderno de `tasksSlice`, vinculados únicamente por coincidencia de título. Esta decisión técnica de transición complicará cualquier feature que dependa de la relación tarea-proyecto en el futuro. Requiere un plan de migración, no un parche. En paralelo, los `timeEntries[]` son una fuente de datos valiosa completamente desperdiciada: el reducer los almacena correctamente, nadie en la UI los lee, y las horas registradas podrían alimentar tanto la inteligencia de Cortana como el seguimiento económico de proyectos cliente.

El área Work está a 3 fixes de ser funcional y a 10 features de ser excelente.

---

*Fin del inventario — ningún archivo fue modificado durante esta auditoría.*
