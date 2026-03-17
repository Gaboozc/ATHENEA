# ATHENEA - README Tecnico Completo

## 1. Que es ATHENEA

ATHENEA en este workspace es un ecosistema multi-capa para operacion personal/tactica con:

- Frontend principal React + Vite (carpeta `scope`)
- Estado global Redux Toolkit + redux-persist
- Motor de inteligencia conversacional y multi-agente
- Integracion web, desktop (Electron), Android (Capacitor) y un backend Node/Express separado

El sistema esta centrado en 3 hubs funcionales:

- WorkHub
- PersonalHub
- FinanceHub

Tambien incluye un Command Center de IA (Omnibar + pagina Intelligence), sensores de dispositivo, sync de Google Calendar y trazabilidad de acciones.

---

## 2. Arquitectura General

## 2.1 Capas

1. UI/Presentacion
- React components + pages + CSS
- Router hash basado en `src/routes.jsx`

2. Estado y dominio
- Redux store en `store/index.js`
- Slices legacy en `store/slices/*.js`
- Slices de IA/sensores en `src/store/slices/*.ts`

3. Inteligencia
- `src/modules/intelligence/*`
- PersonaEngine, AgentOrchestrator, Bridge, skills, parser, proactive engines

4. Integraciones externas
- Google Calendar OAuth + API
- Capacitor plugins (speech, device, network, geolocation, haptics, local notifications)
- OpenAI/Groq (si se configura clave)
- OpenClaw Gateway (opcional, por env)

5. Entornos de ejecucion
- Web (Vite)
- Desktop (Electron)
- Android (Capacitor)
- Backend separado (`wirescope-backend`)
- Mobile RN separado (`wirescope-mobile`)

## 2.2 Flujo de alto nivel

1. Usuario interactua con UI (Omnibar, paginas de hub, etc).
2. Se dispara accion Redux o llamada al modulo de inteligencia.
3. Middlewares observan y registran telemetria de sesion.
4. Reducers actualizan estado persistido.
5. Modulos de IA/sensores generan recomendaciones, dialogo, alertas o acciones sugeridas.

---

## 3. Frontend

## 3.1 Stack principal

- React 18
- Vite 4
- React Router DOM (hash router)
- Redux Toolkit + React Redux
- redux-persist
- Vitest

Scripts clave (scope/package.json):

- `npm run dev` o `npm run start`: desarrollo
- `npm run build`: build web
- `npm run electron-dev`: abrir app desktop
- `npm run electron-pack`: empaquetar Electron
- `npm run test`: pruebas

## 3.2 Rutas principales

Definidas en `src/routes.jsx`:

- `/dashboard`
- `/work`
- `/personal`
- `/finance`
- `/finance/history`
- `/finance/goals`
- `/finance/budgeting`
- `/identity`
- `/todos`
- `/payments`
- `/projects`
- `/projects/:id`
- `/settings`
- `/intelligence`
- `/fleet`
- `/my-tasks`
- `/notifications`
- `/profile`
- `/notes`
- `/calendar`
- `/stats`

## 3.3 Inicializacion global

`src/components/AppInitializer.jsx` inicializa en bootstrap:

- Achievements
- TacticalObserver
- DeviceMonitor
- InterceptionEngine
- HealthMonitor
- BlackBox
- WeatherSync
- PreFlightBriefing
- AusterityProtocol
- AgentOrchestrator
- ShadowChronos
- Warmup ONNX embeddings para skills
- Consumo de acciones pendientes del widget nativo

---

## 4. Estado Global y Slices

Store principal: `store/index.js`

Reducers registrados:

- users
- auth
- organizations
- projects
- notes
- calendar
- todos
- payments
- routines
- budget
- collaborators
- workOrders
- stats
- tasks
- aiMemory
- userSettings
- userIdentity
- sensorData
- app
- goals
- budgetCycle

Middlewares:

- aiObserverMiddleware
- actionHistoryMiddleware
- budgetGuardMiddleware
- financeDeletionAuditMiddleware

Persistencia:

- Key: `athenea-root`
- Persist en local storage de casi todos los slices de negocio + IA/sensores.

---

## 5. Inteligencia: Como funciona realmente hoy

## 5.1 Modulos nucleares

- `Bridge.ts`: entrada principal de prompts
- `skills.ts`: registro declarativo de skills, keywords y parametros
- `parser.ts`: extraccion de parametros
- `openclawAdapter.ts`: mapeo skill -> action Redux valida
- `useIntelligence.ts`: hook de ejecucion (auto o con confirmacion)
- `personaEngine.ts`: respuestas/persona con contexto
- `agents/*`: swarm multi-agente (Cortana/Jarvis/SHODAN)

## 5.2 Comportamiento actual del Bridge

En `Bridge.processPrompt(...)` actualmente todo prompt entra por ruta conversacional:

- Determina hub por keywords o hub actual
- Responde via `handleConversationalQuestion(...)`
- Devuelve artifact tipo texto
- No ejecuta skill/action de forma directa desde Bridge en ese camino

Esto implica que el motor esta fuertemente orientado a respuesta de agente y razonamiento contextual.

## 5.3 Hook de ejecucion y auto-dispatch

`useIntelligence.ts` mantiene logica de auto-ejecucion:

- Umbral `AUTO_EXECUTE_THRESHOLD = 90`
- Requiere:
  - confidence >= 90
  - `allRequiredParamsPresent === true`
  - `response.reduxAction`
- Si cumple: pasa por `openclawAdapter` y dispatch Redux
- Si no cumple: muestra canvas/confirmacion

Nota tecnica: la capacidad de auto-dispatch existe en hook + adapter, pero depende de que el Bridge devuelva `reduxAction` util para ese prompt.

---

## 6. Agentes: Nombres, rol y reglas

Sistema en `src/modules/intelligence/agents`.

Tipos de agente:

- strategist
- auditor
- vitals

Nombres visibles definidos por orquestador:

- strategist -> Cortana
- auditor -> Jarvis
- vitals -> SHODAN

## 6.1 Cortana (StrategistAgent)

Funcion:

- Gestion tactica de tiempo, energia y productividad
- Reordena foco segun tareas criticas, vencidas, clima y bateria

Activa cuando:

- Hay tareas criticas o vencidas
- Bateria critica
- Alertas de clima

Prioridad:

- LOW/MEDIUM/HIGH/CRITICAL segun carga y condiciones

## 6.2 Jarvis (AuditorAgent)

Funcion:

- Proteccion financiera y control de gasto
- Evalua budget status, austeridad, gasto reciente y volatilidad de mercado

Activa cuando:

- Presupuesto no esta on-track
- Austerity protocol activo
- Hay gastos recientes
- Hay alertas de mercado

Prioridad:

- LOW/MEDIUM/HIGH/CRITICAL

## 6.3 SHODAN (VitalsAgent)

Funcion:

- Proteccion de salud/energia (sueño, fatiga, actividad, bateria)
- Puede emitir VETO

Activa cuando:

- Sueño bajo
- Fatiga alta
- Bateria critica
- Actividad fisica muy baja

VETO:

- Solo cuando flag de produccion esta habilitado
- Gate: `localStorage.Production_Ready_Flag === 'true'` o `VITE_PRODUCTION_READY_FLAG=true`

## 6.4 Resolucion de conflictos

`AgentOrchestrator` aplica:

- VETO manda sobre todo
- Luego CRITICAL > HIGH > MEDIUM > LOW
- Desempate por peso:
  - vitals: 1.0
  - auditor: 0.85
  - strategist: 0.7

Registra en `aiMemory`:

- Dialogo entre agentes
- Conflictos detectados

---

## 7. Skills y Parametros (Inventario completo)

Fuente: `src/modules/intelligence/skills.ts`

## 7.1 WorkHub

### Skill: create_project
- Nombre: Create Project
- Keywords: project, create project, new project, start project, begin project, collaborator, colaborador
- Accion declarada: `projects/create`
- Parametros:
  - title: string, requerido, validacion 3-100 chars
  - description: string, opcional
  - dueDate: date, opcional
  - priority: select [low, medium, high, critical], opcional

### Skill: add_task
- Nombre: Add Task
- Keywords: add, task, do, create, todo, to do, need to, project task
- Accion declarada: `tasks/add`
- Parametros:
  - title: string, requerido, validacion 3-200 chars
  - projectId: string, opcional
  - priority: select [low, medium, high], opcional
  - dueDate: date, opcional
  - estimatedHours: number, opcional

### Skill: log_time
- Nombre: Log Work Time
- Keywords: log, spent, hours, worked, time, record
- Accion declarada: `tasks/logTime`
- Parametros:
  - taskId: string, requerido
  - hoursWorked: number, requerido
  - notes: string, opcional

## 7.2 PersonalHub

### Skill: create_note
- Nombre: Create Note
- Keywords: note, remember, write, create, save, jot, personal note, to do note
- Accion declarada: `notes/create`
- Parametros:
  - title: string, requerido, validacion 3-150 chars
  - content: textarea, requerido
  - tags: string, opcional
  - category: select [personal, work, ideas, important, other], opcional

### Skill: add_reminder
- Nombre: Set Reminder
- Keywords: reminder, set reminder, remind, remember, wake up, alarm, alert, notification, schedule reminder
- Accion declarada: `tasks/addTask`
- Parametros:
  - title: string, requerido
  - dueDate: date, requerido
  - priority: select [low, medium, high], opcional

### Skill: add_todo
- Nombre: Add Todo Item
- Keywords: todo, to-do, to do, add, personal, list, item, routine, rutina
- Accion declarada: `todos/add`
- Parametros:
  - text: string, requerido
  - priority: select [low, medium, high], opcional

## 7.3 FinanceHub

### Skill: record_expense
- Nombre: Record Expense
- Keywords: spent, expense, cost, paid, bill, charge, money, spend, draw, finance, financial, budgeting
- Accion declarada: `payments/addExpense`
- Parametros:
  - description: string, requerido, validacion 3-200 chars
  - amount: number, requerido
  - category: select [food, transport, utilities, entertainment, business, other], requerido
  - date: date, opcional
  - paymentMethod: select [cash, credit, debit, transfer, other], opcional

### Skill: record_income
- Nombre: Record Income
- Keywords: earned, income, received, payment, salary, revenue
- Accion declarada: `payments/addIncome`
- Parametros:
  - description: string, requerido
  - amount: number, requerido
  - source: select [freelance, salary, investment, gift, other], requerido
  - date: date, opcional

### Skill: set_budget
- Nombre: Set Budget
- Keywords: budget, budgeting, budget limit, monthly budget, set budget, presupuesto, limite de presupuesto, establecer presupuesto, finance budget
- Accion declarada: `payments/setBudget`
- Parametros:
  - category: select [food, transport, utilities, entertainment, business, other], requerido
  - limit: number, requerido
  - period: select [weekly, monthly, quarterly, yearly], opcional

### Skill: query_budget_status
- Nombre: Consulta Inteligente de Gasto
- Keywords: puedo gastar, puedo comprar, tengo para, me alcanza, can i spend, should i spend, do i have budget, cuanto tengo, cuanto me queda, budget check, verificar presupuesto, analizar gasto, jarvis puedo, jarvis cuanto, puedo gastar el
- Accion declarada: `agent/query`
- Parametros:
  - amount: number, opcional

## 7.4 Cross-Hub

### Skill: search
- Nombre: Search
- Keywords: search, find, look, where is, find me
- Accion declarada: `intelligence/search`
- Parametros:
  - query: string, requerido
  - scope: select [all, notes, tasks, expenses, projects], opcional

### Skill: sync_calendar
- Nombre: Sync Calendar
- Keywords: sync calendar, sync my calendar, google calendar, calendar sync, update calendar
- Accion declarada: `calendar/syncExternalEvents`
- Parametros:
  - forceInteractiveAuth: boolean, opcional

### Skill: open_calendar
- Nombre: Open Calendar
- Keywords: calendar, open calendar, show calendar, ver calendario, abrir calendario, show me friday, viernes, lunes, martes, miercoles, jueves, sabado, domingo, agenda, this week, semana
- Accion declarada: `navigation/openCalendar`
- Parametros:
  - targetDate: date, opcional

---

## 8. Mapeo a Redux real (OpenClaw Adapter)

`src/modules/intelligence/adapters/openclawAdapter.ts` corrige acciones declaradas a acciones reales de reducers.

Ejemplos de correccion:

- `projects/create` -> `projects/addProject`
- `tasks/add` -> `tasks/addTask`
- `notes/create` -> `notes/addNote`
- `todos/add` -> `todos/addTodo`
- `payments/addExpense` -> `payments/recordExpense`
- `payments/addIncome` -> `payments/recordIncome`
- `intelligence/search` -> `intelligence/executeSearch`

Transformaciones de payload:

- Fechas naturales -> ISO
- Montos (`$1,500`, `50k`) -> numero
- Tags CSV -> string[]
- Recordatorios se guardan como task con `isReminder: true`

Acciones validadas contra whitelist interna antes de dispatch.

Skills extra soportadas en adapter (no registradas en `skills.ts`):

- `pay_debt` -> `payments/markAsPaid`
- `create_event` -> `calendar/addEvent`

---

## 9. Omnibar, voz y feedback

`src/components/Omnibar/Omnibar.tsx`:

- Chat inline usuario/agente
- Hub selector (Work/Personal/Finance)
- Integracion con `useIntelligence`
- Toasts de estado
- Soporte voz:
  - Nativo Capacitor `@capacitor-community/speech-recognition`
  - Fallback Web Speech API en navegador

Audio feedback (`audioFeedback.ts`):

- success tone
- error tone
- processing tone

Action history:

- Registro en localStorage y en `aiMemory` via middleware

---

## 10. Sensores y contexto fisico

`src/modules/sensors/DeviceMonitor.ts`:

- Captura bateria (Battery API)
- Estado de red (Capacitor Network)
- Geolocalizacion (Capacitor Geolocation)
- Info de dispositivo (Capacitor Device)
- Actualizacion periodica (cada 5 min)
- Dispatch a `sensorDataSlice`

`sensorDataSlice.ts` guarda:

- battery: level/isCharging/isCritical
- network: type/isConnected
- location: lat/lng/accuracy/currentZone
- device: platform/osVersion/model
- health: steps/sleepHours/heartRate/fatigueLevelEstimate

---

## 11. Integraciones externas

## 11.1 Google Calendar

`src/services/googleCalendar.ts`:

- Carga GIS script
- OAuth token flow (client side)
- Persist token en localStorage
- Lee eventos de Google Calendar API v3

Env requerido:

- `VITE_GOOGLE_CLIENT_ID`

## 11.2 Neural providers

Configuracion via env + localStorage:

- `VITE_NEURAL_PROVIDER` (openai | groq)
- `VITE_NEURAL_API_KEY`

PersonaEngine/Orchestrator pueden consultar LLM para enriquecer respuesta.

## 11.3 OpenClaw Gateway (opcional)

Bridge contempla llamada remota si existe URL configurada:

- `VITE_OPENCLAW_GATEWAY_URL`
- `VITE_OPENCLAW_API_KEY`

## 11.4 Widget bridge

`src/services/widgetBridge.ts`:

- Envia estado al widget nativo (`updateWidgetState`)
- Consume accion pendiente (`consumePendingAction`)
- Permite abrir omnibar, voz, completar tarea, sync calendar desde widget

---

## 12. Backend (wirescope-backend)

Backend separado en `scope/wirescope-backend` (Node/Express).

Stack backend:

- Express
- PostgreSQL + Knex
- Redis
- JWT/Auth0
- Socket.io
- AWS S3
- Swagger

Scripts backend:

- `npm run dev`
- `npm start`
- `npm run db:migrate`
- `npm run db:seed`
- `npm test`

Rol backend:

- API multiusuario empresarial
- Autenticacion/autorizacion
- Persistencia central
- Realtime y archivos

Nota: el frontend `scope` tambien soporta modo local/single-person en varias funciones.

---

## 13. Desktop, Android y Mobile

## 13.1 Desktop (Electron)

`electron-main.cjs`:

- Crea ventana BrowserWindow
- Carga `dist/index.html`
- Usa preload y context isolation

## 13.2 Android (Capacitor)

`capacitor.config.ts`:

- appId: `com.athenea.app`
- appName: `ATHENEA`
- webDir: `dist`

Android gradle:

- namespace/applicationId `com.athenea.app`
- release build configurado
- soporte plugin google-services si existe `google-services.json`

## 13.3 Mobile RN separado

`wirescope-mobile` es una app React Native independiente, con su propio store y ciclo de build.

---

## 14. Variables de entorno (scope/.env.example)

Principales:

- `BASENAME`
- `VITE_GOOGLE_CLIENT_ID`
- `VITE_API_BASE_URL`
- `VITE_API_VERSION`
- `VITE_ENABLE_PROACTIVE_INSIGHTS`
- `VITE_ENABLE_VOICE_COMMANDS`
- `VITE_ENABLE_AUTONOMOUS_EXECUTION`
- `VITE_ENABLE_AUDIO_FEEDBACK`
- `VITE_NEURAL_PROVIDER`
- `VITE_NEURAL_API_KEY`
- `VITE_DEBUG_MODE`
- `VITE_SHOW_DEV_TOOLS`

Opcionales comentadas:

- OpenClaw API URL/API KEY
- Analytics/Sentry

---

## 15. Interconectividad por seccion

## 15.1 WorkHub

Consume principalmente:

- tasks slice
- projects slice
- calendar slice
- strategist reasoning

Interconecta con:

- Omnibar para comandos
- Intelligence page para insights
- sync calendar

## 15.2 PersonalHub

Consume:

- notes slice
- todos slice
- routines slice
- vitals context

Interconecta con:

- recordatorios (como tasks con flag)
- voz/omnibar
- patrones de bienestar en agentes

## 15.3 FinanceHub

Consume:

- payments slice
- budget/budgetCycle/goals
- auditor reasoning

Interconecta con:

- query budget skill (agent/query)
- austerity protocol
- market/weather signals via blackbox

---

## 16. Estado actual y consideraciones tecnicas

1. Hay coexistencia de arquitectura declarativa de skills/acciones y una ruta conversacional dominante en Bridge.
2. El adapter contiene el mapeo robusto a reducers reales y validacion de action types.
3. ActionBridge existe para acciones fisicas (haptics/notificaciones/redireccion), pero su ejecucion desde orchestrator esta temporalmente deshabilitada en comentarios para evitar dependencia circular.
4. El sistema esta preparado para modos:
   - conversacional
   - asistido con formulario
   - autonomo (si la respuesta trae accion valida)

---

## 17. Checklist de operacion

1. Instalar dependencias en `scope`.
2. Configurar `.env` desde `.env.example`.
3. Definir `VITE_GOOGLE_CLIENT_ID` si se usara calendario.
4. Ejecutar `npm run dev`.
5. Verificar inicializacion en consola (ONNX warmup, observers, monitors).
6. Probar Omnibar:
   - texto
   - voz
   - cambio de hub
7. Revisar pagina `/intelligence` para historial e insights.

---

## 18. Mapa rapido de archivos clave

- Frontend entry: `src/main.jsx`
- Router: `src/routes.jsx`
- Bootstrap runtime: `src/components/AppInitializer.jsx`
- Store root: `store/index.js`
- Intelligence bridge: `src/modules/intelligence/Bridge.ts`
- Skills registry: `src/modules/intelligence/skills.ts`
- Adapter: `src/modules/intelligence/adapters/openclawAdapter.ts`
- Omnibar: `src/components/Omnibar/Omnibar.tsx`
- Sensors: `src/modules/sensors/DeviceMonitor.ts`
- Calendar integration: `src/services/googleCalendar.ts`
- Backend docs: `wirescope-backend/README.md`

---

Documento generado para servir como referencia tecnica integral de ATHENEA en este workspace.