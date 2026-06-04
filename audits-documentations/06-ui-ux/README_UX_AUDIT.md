# AUDITORÍA UX — ATHENEA
> Análisis de flujos, interacción y experiencia · Rama `single-person` · Marzo 2026

---

## MAPA DE FLUJOS CRÍTICOS

---

### Flujo A — Primera vez que el usuario abre la app

**Pasos:**
1. App carga → `main.jsx` → `AppInitializer` monta todos los módulos de inteligencia silenciosamente
2. Redux `PersistGate` rehidrata datos (pantalla vacía hasta que termina)
3. Router redirige `/` → `/dashboard` automáticamente
4. `AppInitializer` dispara `runWelcomeOnboardingToast()` → aparece toast: *"Welcome to ATHENEA. Tap the floating logo to open Omnibar."*
5. Dashboard renderiza con datos vacíos (skeletons activos tras UI-10)
6. FAB (logo flotante) aparece en esquina inferior derecha

**Clicks necesarios:** 0 — todo automático  
**Problema 1:** El único onboarding real es un toast de 5.2 segundos. Nada explica qué son los 3 hubs, qué son los 3 agentes ni cómo navegar. Si el usuario no lo lee en esos segundos, desaparece para siempre (flag en `localStorage` ya marcado).  
**Problema 2:** El ProactiveHUD tiene `getWelcomeOnboardingInsight()` con instrucciones más ricas, pero el usuario tiene que abrir el Omnibar primero — que es exactamente lo que no sabe hacer.  
**Problema 3:** `PersistGate` no tiene loading fallback visible — si Redux tarda en rehidratar, el usuario ve pantalla vacía sin señal.  
**Problema 4:** El ProactiveHUD solo aparece cuando el chat está vacío y `currentResponse` existe — en primera sesión puede no tener sugerencias útiles.  
**Severidad:** 🔴 bloquea — el 100% de usuarios nuevos llegan a una pantalla vacía sin guía de uso.

---

### Flujo B — Crear una tarea desde cero

**Ruta 1 — MyTasks → GatekeeperModal**
1. Abrir dropdown "Work" → clic "My Tasks" (2 clicks)
2. En MyTasks no hay botón "Crear tarea" — la lista solo muestra tareas asignadas
3. GatekeeperModal se activa con `window.dispatchEvent(new Event("athenea:gatekeeper:open"))` — **no hay ningún botón en la UI que dispare esto**

**Ruta 2 — Omnibar texto**
1. Clic en FAB (1 click) → Omnibar abre
2. Escribir "Add task [nombre]" → Enter
3. Si confianza ≥ 90%: auto-ejecuta y muestra bubble de confirmación
4. Si necesita confirmación: muestra IntelligenceCanvas con formulario embebido en chat

**Ruta 3 — Omnibar voz**
1. Clic en FAB → Omnibar → clic en botón voz → hablar
2. Auto-ejecuta o pide parámetros faltantes por speech synthesis
3. Respuesta de voz puede estar en inglés aunque el usuario esté en español

**Ruta 4 — WorkHub**
1. Dropdown Work → Work Hub → botones "Go to My Tasks" / "Go to Projects"
2. Lleva a páginas de listado sin creación directa desde el hub

**Clicks necesarios:**
- Omnibar texto: **mínimo 2** (FAB + Enter)
- MyTasks/UI directa: **imposible** — ningún botón expone el GatekeeperModal
- WorkHub: solo navegación, sin CTA de creación

**Problema 1:** El GatekeeperModal — el flujo formal con scoring de prioridad 7-factor — no tiene punto de entrada visible en ninguna parte de la UI. Para todos los efectos prácticos, esta función no existe para el usuario.  
**Problema 2:** La ruta Omnibar requiere conocer el lenguaje natural correcto. No hay ejemplos visibles de qué frases funcionan.  
**Problema 3:** En MyTasks no hay botón "Nueva tarea" — la página más lógica para crearlas.  
**Severidad:** 🔴 bloquea — la funcionalidad más central del sistema no tiene entrada visible.

---

### Flujo C — Registrar un gasto

**Ruta 1 — FinanceHub directo**
1. Dropdown Finance → Finance Hub (2 clicks)
2. Scroll hasta sección "Add Category" o "Add Expense"
3. Llenar form inline: monto, categoría, fecha, nota (4 campos)
4. Submit → gasto guardado, form resetea silenciosamente (sin toast)

**Ruta 2 — Omnibar**
1. Clic FAB → Omnibar
2. Escribir "Add expense 50 groceries" o similar
3. Si hay skill mapeado: auto-ejecuta o muestra canvas

**Ruta 3 — Payments (pagos recurrentes)**
1. Dropdown Finance → Payments (2 clicks)
2. Llenar form: nombre, monto, moneda, frecuencia, fecha, notas (6 campos)
3. Submit → pago guardado

**Clicks necesarios:** FinanceHub directo: **4-6**  
**Problema 1:** La distinción entre "expense" (gasto puntual en budget) y "payment" (pago recurrente) no está explicada en ningún lugar. Dos conceptos separados, dos formularios, dos slices de Redux.  
**Problema 2:** No hay indicación de que el Omnibar puede registrar gastos por voz.  
**Problema 3:** Para agregar un gasto hay que crear primero una categoría. Si no hay categorías, el select de `expenseCategory` está vacío y el submit falla silenciosamente — sin mensaje de error visible.  
**Severidad:** 🟠 frustra — flujo funciona pero tiene un bloqueo silencioso para usuarios sin categorías.

---

### Flujo D — Hablar con un agente

**Pasos:**
1. Clic en FAB → Omnibar abre
2. ProactiveHUD aparece si chat está vacío y `currentResponse` existe
3. Usuario escribe texto → Enter
4. Sistema elige agente automáticamente: Cortana (Work), Jarvis (Finance), SHODAN (Personal)
5. Escribir "cortana", "jarvis" o "shodan" en el texto fuerza ese agente
6. Respuesta aparece como burbuja con ícono 🧿/🤖/👁️ y nombre del agente

**Problema 1:** La selección del hub (Work/Personal/Finance) no dice que cambiar el hub cambia el agente. La conexión hub↔agente nunca se explica.  
**Problema 2:** El routing por nombre (escribir "cortana:" para forzar agente) es invisible — sin hint, placeholder ni documentación inline.  
**Problema 3:** El ProactiveHUD muestra "arc-pulse", "swarm-dots" y texto de briefing sin identificar quién habla. No hay nombre de agente en el HUD, solo colores que el usuario no conoce.  
**Problema 4:** El WarRoomView ("🎯 Thought Stream") está visible en el Omnibar para cualquier usuario. Muestra terminología técnica interna (VETO ACTIVE, agentes "hostiles", "Fallo de Sincronizacion", "Directiva Primaria") que rompe la ilusión de asistente cohesivo.  
**Severidad:** 🟠 frustra — el usuario puede usar el sistema pero no entiende qué está pasando ni a quién le habla.

---

### Flujo E — Revisar estado del día

**Secciones visibles en Dashboard:**
1. Header estático — "ATHENEA Personal Assistant"
2. DashboardWidget — 4 métricas (active projects, pending tasks, pending todos, upcoming payments)
3. Recent Notes — últimas 3 notas con preview truncado a 140 chars
4. Reminders — items ordenados por días restantes
5. Workflow Health — score %, label, 4 métricas de tareas
6. Project Workstreams — al final, requiere scroll

**Problema 1:** Dashboard no da una respuesta clara a "¿qué hago primero?". 6 secciones en paralelo sin jerarquía de urgencia. Reminders están debajo de Recent Notes — items con vencimiento hoy son menos visibles que una nota sin urgencia.  
**Problema 2:** El widget de 4 métricas no distingue qué es crítico. "3 pending tasks" y "8 pending tasks" tienen el mismo peso visual.  
**Problema 3:** Ningún CTA conecta la métrica con la acción. No hay button que diga "tienes 2 pagos venciendo hoy → ir a Payments".  
**Problema 4:** El PreFlight Briefing (generado en AppInitializer) no se muestra en el Dashboard sino solo dentro del Omnibar.  
**Severidad:** 🟡 confunde — el dashboard informa pero no orienta.

---

### Flujo F — Cambiar configuración de voz

**Pasos:**
1. Clic en ícono ⚙ en navbar desktop → `/settings` (1 click)
2. Scroll para encontrar el selector de idioma de voz
3. El selector está entre webhooks y danger zone, sin sección de "Voz" claramente separada

**Clicks necesarios:** 2 (navbar + scroll/encontrar)  
**Problema 1:** No hay ninguna indicación en el Omnibar de que existe un selector de idioma de voz. El usuario que habla en español y recibe reconocimiento incorrecto no sabe que puede fijarlo.  
**Problema 2:** El label del selector (`Voice Language`) está en inglés incluso si la app está en español.  
**Problema 3:** El selector está perdido entre gestión de organización, invites, webhooks y danger zone sin agrupación lógica de "preferencias de comunicación".  
**Severidad:** 🟡 confunde — funciona pero es muy difícil de descubrir.

---

### Flujo G — Navegar entre hubs

**Desktop:**
1. Clic dropdown "Work" / "Personal" / "Finance" → menú → clic item (2 clicks entre hubs)
2. El link activo tiene `is-active` solo cuando el dropdown está abierto — no hay indicador persistente

**Mobile:**
1. Clic hamburger (1) → expand grupo (1) → clic item (1) = 3 clicks

**Problema 1:** No hay breadcrumb ni indicador persistente de en qué grupo está el usuario. El `is-active` en links del dropdown se ve solo cuando el dropdown está abierto.  
**Problema 2:** En mobile, el texto del hamburger menu no da pista del contenido — el usuario tiene que expandir cada grupo para descubrir las opciones.  
**Clicks necesarios:** Desktop: 2 / Mobile: 3  
**Severidad:** 🟡 confunde — navegación funcional pero sin orientación persistente.

---

## JERARQUÍA DE INFORMACIÓN

### Dashboard
- **Primer foco visual:** Título + 4 métricas widget — correcto
- **Compite demasiado:** 6 secciones al mismo nivel jerárquico
- **Prioridad invertida:** Reminders (urgentes) cargan en DOM después de Recent Notes (arbitrarias)
- **CTAs:** "View all notes" y "View" en reminders son terciarios, sin peso
- **Scroll requerido:** Workflow Health y Project Streams — las métricas de salud del trabajo están escondidas

### WorkHub
- **Primer foco:** 2 stats cards + 3 botones de navegación
- **Problema:** El hub es casi un índice sin contenido accionable propio
- **"Today Focus" al fondo:** Las 3 tareas más críticas están al final de la grilla, después de Progress — prioridad invertida

### PersonalHub
- **Estructura idéntica a WorkHub** — misma plantilla, diferente data
- **Botón "Go to Inbox"** navega a `/inbox` → redirect silencioso a `/calendar` — confunde

### FinanceHub
- **Primer foco:** 4 stats de saldo — correcto para página financiera
- **Sin CTA de alerta:** Saldo Libre negativo no sugiere ninguna acción
- **Budget section:** Formularios de categoría y gasto tienen igual peso visual — el usuario no sabe cuál es el flujo primario

### Intelligence `/intelligence`
- **Mayor densidad de información de la app:** System Health %, Priority Distribution, Project Health, Throughput, feed de insights, historial de acciones — todo simultáneo
- **El feed de insights proactivos** (corazón de la página) compite visualmente con métricas de analytics
- **Excepción positiva:** El botón "Run in Omnibar" en cada insight es uno de los CTAs más claros de toda la app

### Calendar
- **Vista mensual estándar** — familiar y orientable
- **Day Detail modal** con overlay de agente no tiene indicador visual en los días que lo tienen — el usuario no sabe hacer clic

---

## VACÍOS DE FEEDBACK

| Acción | ¿Feedback? | Problema |
|--------|-----------|---------|
| Crear tarea vía Omnibar (auto-execute) | ✅ Toast global + burbuja de chat | — |
| Crear tarea vía GatekeeperModal | ⚠️ Estado interno del modal | Sin toast persistente después del cierre |
| Guardar IdentityHub | ✅ Banner "Saved" 3s | — |
| Agregar nota | ❌ Modal cierra, nota aparece | Sin confirmación explícita |
| Agregar todo | ❌ Form resetea | Sin confirmación |
| Agregar payment | ❌ Form resetea | Sin confirmación |
| Marcar payment como "Paid" | ❌ Cambia estado visual | Sin confirmación |
| Agregar gasto en FinanceHub | ❌ Form resetea silenciosamente | Sin confirmación |
| Eliminar nota/todo/payment | ⚠️ `confirm()` nativo del browser | No puede deshacer después |
| Eliminar proyecto | ⚠️ `confirm()` + botón "Restore" existe | Restaurar es la excepción positiva |
| Guardar Settings | ❌ Sin indicación de guardado | Cambios se despachan en `onChange` — sin botón "Save" explícito |
| Cambiar idioma de voz | ❌ Select despacha a Redux sin feedback | El usuario no sabe si se guardó |
| Cambiar idioma de app EN/ES | ✅ App cambia inmediatamente | — |
| Error en GatekeeperModal | ✅ `saveError` en modal | — |
| Error en Omnibar (no entendido) | ✅ Burbuja con ⚠️ | — |
| Voice: error de reconocimiento | ✅ Estado error + mensaje | Se auto-limpia en 3s |
| Carga inicial (PersistGate) | ❌ Sin spinner ni indicación | Pantalla vacía |
| Omnibar necesita parámetros faltantes | ✅ Speech synthesis + toast text | Respuesta de voz puede estar en inglés para usuario en español |

**Patrón sistémico:** Las acciones CRUD en páginas directas (Notes, Todos, Payments, FinanceHub) no tienen toast de confirmación. Solo las acciones ejecutadas vía Omnibar pasan por el callback `onActionExecuted` que dispara el toast global. Hay dos circuitos de feedback completamente desconectados.

---

## FEATURES INVISIBLES

| Feature | Por qué es invisible | Impacto |
|---------|---------------------|---------|
| **GatekeeperModal** | Solo se activa vía `window.dispatchEvent(new Event("athenea:gatekeeper:open"))` — ningún botón en la UI lo abre | 🔴 Crítico |
| **Routing de agente por nombre** | Escribir "cortana", "jarvis" o "shodan" en el texto fuerza ese agente. Sin placeholder ni hint. | 🟠 Alto |
| **Long-press en FAB** (1 segundo) | Oculta el FAB permanentemente. Sin tooltip, sin hint visual. Si desaparece, el usuario no sabe cómo recuperarlo. | 🟠 Medio |
| **PreFlight Briefing** | Se genera en AppInitializer al arranque pero solo visible dentro del ProactiveHUD en el Omnibar | 🟠 Alto |
| **Scoring de prioridad** (7 factores, 0-14) | Solo visible en GatekeeperModal step 3 — que es inaccesible. El score existe en los datos pero nunca se explica. | 🟠 Alto |
| **ActionChips del ProactiveHUD** | Botones de acción directa generados por ActionBridge, visibles en el HUD — pero el HUD solo aparece si `currentResponse` existe | 🟠 Alto |
| **Calendar Google Sync** | `syncExternalEvents` es skill del Omnibar — solo discoverable si el ProactiveHUD lo sugiere | 🟠 Alto |
| **Geofencing en IdentityHub** | Configuración lat/lon para "home" y "work" — sin mapa, sin explicación de para qué sirve | 🟡 Medio |
| **Working Hours en IdentityHub** | Rango de horas laborales — sin explicación de cómo los agentes usan esa información | 🟡 Medio |
| **Ghost Write Draft** | Al abrir modal de nota, establece draft en módulo de inteligencia para asistencia contextual — el usuario no sabe que hay un agente leyendo lo que escribe | 🟡 Bajo |
| **ShadowChronos** | Módulo de análisis de tendencias activo en background — sin representación en UI | 🟡 Bajo |
| **WarRoomView** | Panel de debug visible en el Omnibar para todos los usuarios — el usuario puede encontrarlo pero no entiende qué es | 🟡 Bajo (para usuario final) |

---

## INCONSISTENCIAS DE INTERACCIÓN

### Crear elementos — 4 patrones distintos

| Qué crear | Patrón | Posición del trigger |
|-----------|--------|---------------------|
| Nota | Modal overlay con formulario | Botón en header de página |
| Todo | Form inline siempre visible | Header de página |
| Payment | Form inline siempre visible | Header de página |
| **Tarea** | GatekeeperModal 3 pasos | **Sin entrada visual en la UI** |
| Proyecto | Modal overlay | Botón en header de Projects |
| Evento calendario | Modal overlay | Clic en celda del día |
| Categoría/Gasto FinanceHub | Form inline siempre visible | Body de FinanceHub |
| Rutina | Form inline siempre visible | Body de PersonalHub |

El usuario no puede predecir qué tipo de interacción tendrá. No hay patrón unificado.

### Eliminar elementos — 2 patrones

- Notes, Todos, Payments: `confirm()` nativo del browser (cuadro del SO)
- Proyectos: botón "Cancel" (no elimina, cancela) + botón "Delete" separado con `confirm()`

### Cerrar modales — comportamientos distintos

| Modal | Botón ✕ | Clic fuera | Tecla Escape |
|-------|---------|-----------|-------------|
| Notes | "Cancel" explícito | No cierra | No detectado |
| Calendar | ✕ en header | Sí cierra | No detectado |
| GatekeeperModal | ✕ en header | No cierra | No detectado |
| Omnibar | Sin ✕ prominente | Sí cierra | No detectado |

### Mensajes de éxito/error — 4 mecanismos distintos

1. Toast global (esquina, auto-dismiss) — solo para acciones vía Omnibar
2. Banner inline en página — solo en IdentityHub
3. Texto de error en modal — solo en GatekeeperModal
4. Sin confirmación — Notes, Todos, Payments, FinanceHub

### Estado activo en Navbar — incompleto

- Dashboard home button: `is-active` siempre visible ✅
- Links dentro de dropdowns: `is-active` visible solo cuando el dropdown está abierto ❌
- System icons (Settings/Stats/Identity): `is-active` siempre visible ✅
- El grupo activo (Work/Personal/Finance) nunca está indicado sin abrir el dropdown ❌

---

## CARGA COGNITIVA ALTA

### GatekeeperModal — terminología abstracta en 3 pasos

- **Step 3:** 7 checkboxes con preguntas como "Does this block others from progressing?", "What is the urgency if deferred 48h?" — sin contexto de por qué importan
- Los 5 niveles de prioridad ("Critical", "High Velocity", "Steady Flow", "Low Friction", "Backlog") son terminología interna no explicada en ningún lugar de la UI antes de llegar al modal
- El score se calcula en tiempo real (0-14) pero el usuario no entiende la relación entre sus respuestas y el nivel resultante hasta que lo ve

### FinanceHub — 2 conceptos financieros sin diferenciación

"Category + Expense" (presupuesto mensual por categoría) vs. "Payments" (obligaciones recurrentes) son conceptos distintos en páginas distintas y sin guía de cuándo usar cada uno.

### IdentityHub — 16+ campos en una sola página, sin guardado parcial

- 8 secciones: Basic Info → Agent Aliases → Mission Bio → Working Hours → Voice Tone → Weather Prefs → Geofencing → Protocol Info
- Si el usuario edita algo en el medio tiene que scrollear hasta el botón Save al final
- "Agent Aliases" (Jarvis=Sir, Cortana=Chief, SHODAN=Insect) no tiene ninguna explicación de por qué existe o qué efecto tiene

### Intelligence `/intelligence` — máxima densidad de datos

La página muestra simultáneamente: System Health %, Priority Distribution, Project Health, Throughput, feed de insights filtrable e historial de acciones. Todo al mismo nivel. No hay un resumen de "la cosa más importante ahora mismo".

### Projects — formulario de creación con 14+ campos

Solo `name` es obligatorio pero los campos opcionales no están claramente marcados. El usuario no sabe cuáles puede omitir.

---

## PROBLEMAS MÓVIL vs DESKTOP

| Aspecto | Desktop | Mobile | Severidad |
|---------|---------|--------|-----------|
| Acceso a Settings | 1 click (ícono ⚙ navbar) | 2 clicks (hamburger + link) | 🟡 Menor |
| Acceso a Identity | 1 click (ícono 🪪 navbar) | 2 clicks (hamburger + link) | 🟡 Menor |
| **Acceso a Stats** | 1 click (ícono 📊 navbar) | **Ausente — no está en menú mobile** | 🔴 Bloqueante |
| Navegación entre hubs | 2 clicks | 3 clicks | 🟡 Acumulativo |
| FAB draggable | Mouse drag fluido | Touch drag implementado | ✅ Funcional |
| FAB long-press hide | Soportado | Soportado | Sin discoverability en ambos |
| Menú mobile overlay | N/A | Sin animación de entrada — aparece/desaparece abrupt | 🟡 Visual |
| Touch targets en Todos | N/A | Botones "Done"/"Delete" sin `min-height: 44px` explícito | 🟠 Potencial |
| Profile en navbar | Ausente | Ausente | 🟡 Página huérfana |

**Nota crítica — Stats en mobile:** `/stats` no aparece en el menú mobile (`navbar-mobile-group` tiene Calendar, Settings, Identity pero no Stats). Un usuario que usa la app principalmente en Android nunca puede acceder a sus logros sin escribir la URL directamente.

---

## RELACIÓN USUARIO-AGENTE

### ¿Sabe el usuario que hay 3 agentes con roles distintos?
**No.** Ninguna pantalla, tooltip ni onboarding explica "Cortana maneja Work, Jarvis maneja Finance, SHODAN maneja Personal". La lógica existe en el código pero es invisible para el usuario.

### ¿Sabe a cuál hablarle?
**No directamente.** El sistema elige automáticamente por hub. El usuario observa que "a veces responde uno a veces otro" sin entender por qué. El routing por nombre ("cortana:", "jarvis:") es una feature invisible.

### ¿Las respuestas se sienten como conversación?
**Parcialmente.** El chat bubble con nombre, ícono y markdown está bien diseñado. El problema es la auto-ejecución: si el comando tiene ≥90% confianza, la tarea se crea antes de confirmar. Para un usuario técnico es eficiente; para el resto puede sentirse como "la app hizo algo que no pedí explícitamente".

### ¿El ProactiveHUD es comprensible?
**No suficientemente.** Elementos del HUD:
- 3 puntos animados (azul, dorado, verde) — representa los 3 agentes, pero sin leyenda ni explicación
- "arc-pulse" animado — decorativo, sin significado explicado
- Texto de "neural message" — el briefing del agente activo, sin identificar quién habla
- "ActionChips" — botones con prompts pre-generados

Un usuario nuevo ve una animación abstracta con puntos de colores, un texto genérico y botones con labels que parecen pre-escritos. No sabe qué generó esas sugerencias ni por qué.

### ¿El WarRoomView debería ser visible al usuario final?
**No en su forma actual.** El toggle "🎯 Thought Stream" en el Omnibar muestra:
- `Lead Agent: STRATEGIST` / `VETO ACTIVE`
- `"Fallo de Sincronizacion — mis agentes no llegan a un consenso sobre sus finanzas"`
- Historial con tones `hostile`, `override`, `defensive`

Esta es información de debug interno que rompe la ilusión de un asistente cohesivo y unificado. Un usuario que ve "VETO ACTIVE" o "SHODAN debatiendo hostilmente con JARVIS sobre sus finanzas" puede perder confianza en el sistema.

### ¿El usuario sabe dar comandos en lenguaje natural?
**Implícitamente, no.** El placeholder del input no muestra ejemplos. El ProactiveHUD sí tiene `suggestedPrompt` clickeable — el mejor mecanismo de discoverability disponible — pero solo si el HUD tiene datos. En la primera sesión puede no tener sugerencias relevantes aún.

---

## HALLAZGOS CRÍTICOS (TOP 5)

### 1. El GatekeeperModal no tiene punto de entrada visible
🔴 La funcionalidad más sofisticada del sistema — creación de tareas con scoring de prioridad 7-factor — no tiene ningún botón en la UI. Se activa solo con `window.dispatchEvent(new Event("athenea:gatekeeper:open"))`. Para todos los efectos prácticos, esta función no existe para el usuario.

### 2. Cero onboarding real — la app empieza muda
🔴 Un toast de 5 segundos que desaparece para siempre es insuficiente para una app con 3 agentes, 3 hubs, 21 rutas y un sistema de comandos en lenguaje natural. El usuario llega al dashboard vacío, ve métricas en cero y no sabe qué hacer. La primera acción posible no es obvia.

### 3. Dos circuitos de feedback desconectados
🟠 Las acciones CRUD directas (Notes, Todos, Payments, FinanceHub expenses) no emiten ningún feedback visual de éxito. Solo las acciones vía Omnibar pasan por el callback que dispara el toast global. El usuario no puede confirmar visualmente que su nota o pago se guardó.

### 4. El WarRoomView está expuesto al usuario final
🟠 Un panel de debug con terminología técnica interna (veto, orquestador, agente hostil, sincronización fallida, directiva primaria) es visible para cualquier usuario en el Omnibar. Daña la ilusión de asistente cohesivo y puede generar desconfianza activa.

### 5. Stats no existe en mobile
🔴 La página `/stats` con el sistema de XP, logros y gamificación — diseñada para motivación y retención — no tiene entrada en el menú mobile. Un usuario que usa la app principalmente en Android nunca puede acceder a sus logros.

---

## OPORTUNIDADES (TOP 5)

### 1. Un botón visible "Nueva Tarea" que abra el GatekeeperModal
Añadir un `<button onClick={() => window.dispatchEvent(new Event("athenea:gatekeeper:open"))}` en MyTasks, DashboardWidget y WorkHub desbloquea el flujo de creación más potente sin ningún cambio architectural. **Esfuerzo mínimo, impacto máximo.**

### 2. Reemplazar el toast único con micro-onboarding de 3 steps
Al primer uso: modal o banner en el Dashboard con 3 highlights: "Work / Personal / Finance hubs", "La esfera flotante es tu asistente", "Habla en lenguaje natural". Dismissable, nunca vuelve. Transforma la primera impresión sin rediseñar nada.

### 3. Toast de confirmación universal para acciones CRUD
Conectar los reducers de Notes, Todos, Payments y FinanceHub al mismo `showToast` ya disponible en el Layout elimina la inconsistencia de feedback. Patrón: middleware de Redux o listener que detecta acciones exitosas y emite toast. **Un cambio, fix sistémico.**

### 4. Añadir Stats al menú mobile
Una sola línea de JSX en el bloque `navbar-mobile-group` del Navbar recupera una feature de retención completa para el 100% de usuarios mobile. El link existe en desktop, solo falta en mobile.

### 5. Etiquetar el ProactiveHUD con el agente activo y ocultar WarRoomView por defecto
Añadir el nombre del agente como header del HUD convierte "animación abstracta con puntos" en "Cortana está lista". Mover WarRoomView detrás de un toggle en Settings (`advancedMode: true`) o a una ruta `/debug` protege la experiencia del usuario final sin eliminar la herramienta de desarrollo.

---

## RESUMEN DE SEVERIDADES

| Categoría | 🔴 Bloquea | 🟠 Frustra | 🟡 Confunde |
|-----------|-----------|-----------|------------|
| Flujos críticos | A, B | C, D | E, F, G |
| Jerarquía de info | — | Intelligence | Dashboard, WorkHub, Calendar |
| Feedback vacíos | PersistGate, CRUD pages | Settings save, gasto sin categoría | GatekeeperModal post-close |
| Features invisibles | GatekeeperModal | Agent routing, PreFlight, ActionChips | Geofencing, Working Hours |
| Inconsistencias | — | 4 patrones de creación, 3 de cierre | Estado activo navbar |
| Carga cognitiva | — | GatekeeperModal, FinanceHub conceptos | IdentityHub, Intelligence, Projects form |
| Mobile | Stats inexistente | Touch targets | Menú sin animación |
| Relación agente | — | WarRoomView expuesto, auto-execute | ProactiveHUD sin contexto |

---

> Auditoría completada. **8 áreas evaluadas, 5 hallazgos críticos, 5 oportunidades de alto ROI identificadas.**
> Próximo paso: priorizar e implementar en orden de impacto vs. esfuerzo.
