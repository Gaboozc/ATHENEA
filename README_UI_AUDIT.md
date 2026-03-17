# ANÁLISIS UI/UX — ATHENEA FRONTEND
> Estado actual · Rama `single-person` · Marzo 2026

---

## PANTALLAS

| Ruta | Componente | Estado |
|------|-----------|--------|
| `/dashboard` | `Dashboard.jsx` | Funcional, datos reales |
| `/work` | `WorkHub.jsx` | Funcional |
| `/personal` | `PersonalHub.jsx` | Funcional |
| `/finance` | `FinanceHub.jsx` | Funcional (CSS bug menor) |
| `/finance/history` | `FinanceHistory.jsx` | Funcional |
| `/finance/goals` | `FinanceGoals.jsx` | Funcional |
| `/finance/budgeting` | `FinanceBudgeting.jsx` | Funcional |
| `/identity` | `IdentityHub.jsx` | Funcional, tema visual diferente |
| `/todos` | `Todos.jsx` | Funcional |
| `/payments` | `Payments.jsx` | Funcional |
| `/projects` | `Projects.jsx` | Funcional |
| `/projects/:id` | `ProjectDetails.jsx` | Funcional |
| `/notes` | `Notes.jsx` | Funcional |
| `/calendar` | `Calendar.jsx` | Funcional |
| `/intelligence` | `Intelligence.jsx` | Funcional |
| `/fleet` | `Fleet.jsx` | Funcional |
| `/my-tasks` | `MyTasks.jsx` | Funcional |
| `/notifications` | `Notifications.jsx` | Funcional |
| `/profile` | `Profile.jsx` | **INCOMPLETO** — solo 3 campos read-only |
| `/settings` | `Settings.tsx` | Funcional pero **tema blanco roto** |
| `/stats` | `StatsPage.jsx` | Funcional pero **texto invisible** |

**Total: 21 páginas únicas** (4 sub-rutas de finance). Todas se montan bajo `<Layout>` con router hash (`#/`).

---

## SISTEMA DE DISEÑO

### Paleta de colores — estado actual (fragmentado)

Hay **5 temas visuales distintos** conviviendo en la misma app:

| Tema | Usado en | Fondo | Acento |
|------|----------|-------|--------|
| **Dark Noir** (principal) | Dashboard, WorkHub, PersonalHub, FinanceHub, Omnibar | `#0b0b0b` / `#0f2235` | `#d4af37` gold / `#1ec9ff` cyan |
| **Dark Navy** (variante) | FinanceHistory, FinanceGoals, FinanceBudgeting | `#18181b` / `#27272a` | `#a1a1aa` muted |
| **Identity Glass** | IdentityHub | `linear-gradient(135deg, #0f1419, #1a1f2e)` | blur effects |
| **Settings Light** | Settings.tsx | `#f4f8ff` (BLANCO) | `#0e2144` |
| **Stats Ambiguo** | StatsPage | `#0b0b0b` header pero `color: #1a1a1a` en texto | mixto |

### Tokens de diseño — AUSENTES

- **Ningún archivo de tokens globales** existe. El único bloque `:root` con variables CSS está dentro de `src/components/Omnibar/Omnibar.css` y solo lo lee el Omnibar.
- `src/index.css` no define ninguna variable custom property.
- Los valores `#d4af37`, `#1ec9ff`, `#0f2235`, `#0b0b0b`, `#27272a`, `#c9cdd2` se repiten literalmente en ~15 archivos CSS sin compartir ninguna fuente.

### Tipografía — fragmentada en 4 familias

| Fuente | Dónde |
|--------|-------|
| `system-ui, -apple-system` | `body` (index.css) |
| `"Consolas", "Courier New", monospace` | Dashboard, GatekeeperModal (explícito en CSS) |
| `'Inter', sans-serif` | IdentityHub |
| Fira Mono (implícito) | Nombres de agentes en Omnibar |

---

## EVALUACIÓN POR SECCIÓN

### Dashboard `/dashboard`
- **Bien:** Secciones claras (widget compacto, notas recientes, recordatorios, workflow health). Empty states presentes. Responsive con `isMobile` + `matchMedia`.
- **Problema:** Font monospace (`Consolas`) en todo el contenedor — lectura más lenta que una sans-serif para texto contextual.
- **Problema:** `DashboardWidget` usa grid de 4 columnas — en móvil <480px puede colapsar mal (revisar breakpoints).

### WorkHub, PersonalHub `/work`, `/personal`
- Estructura idéntica (copy-paste de componentes y CSS). Funcionales pero sin diferenciación visual entre hubs.
- Botones de navegación en WorkHub no tienen estado `active` visible.

### FinanceHub `/finance` y sub-páginas
- Hub principal funciona bien. Formularios inline para categoría/gasto son prácticos.
- **CSS BUG** en `FinanceHub.css`: la clase `.financehub-stat-saldo` comienza su bloque `{}` dentro del cierre del bloque `.financehub-stat strong`. El borde dorado y box-shadow de la tarjeta de saldo **no se aplican**.
- Sub-páginas (History, Goals, Budgeting) usan `FinanceSections.css` con tercer tema distinto (`#18181b`, `#3f3f46`) — gap visual con FinanceHub.

### IdentityHub `/identity`
- Contenido completo y bien estructurado (8+ campos de perfil de operador, aliases, geofencing, tono de voz).
- **Problema mayor:** Diseño completamente diferente al resto — gradiente diagonal, `backdrop-filter: blur`, `Inter`, animaciones `slideDown/fadeIn`. Parece otra app.
- No enlazada desde Navbar desktop — solo accesible en menú móvil o URL directa `#/identity`.

### Profile `/profile`
- **INCOMPLETO:** Muestra solo `username`, `role`, `tenant`. Tres campos read-only, sin edición, sin avatar, sin enlace a IdentityHub.
- La página de identidad real está en `/identity` pero el enlace "Profile" lleva aquí — confunde al usuario.

### Settings `/settings`
- **ROTO VISUALMENTE:** Fondo blanco `#f4f8ff` — jarring en una dark app. Paneles blancos con texto azul oscuro `#0e2144`.
- Funcionalidad correcta (org management, invites, voice language selector).
- No accesible desde navbar desktop.

### StatsPage `/stats`
- **BUG DE ACCESIBILIDAD:** `.stats-header h1` tiene `color: #1a1a1a` sobre fondo oscuro — título casi invisible.
- XP/level system bien pensado, achievements grid funcional.
- No accesible desde navbar desktop.

### Intelligence `/intelligence`
- Bien integrada con aiMemory slice. Filtros por hub y severidad. Feed de action history.
- Botón "Run in Omnibar" conecta correctamente.

### Calendar `/calendar`
- Vista mensual completa con modal de eventos y overlay de agente (`useAgentCalendar`).
- La ruta `/inbox` redirige aquí — semánticamente confuso.

### GatekeeperModal
- Modal de 3 pasos para crear tareas con scoring de prioridad (7 factores → score normalizado 0-14).
- Triggered vía `window.dispatchEvent(new Event("athenea:gatekeeper:open"))` — acoplamiento global mediante DOM events.
- CSS consistente con el tema dark principal (único modal que sí usa `#0f2235` + Consolas).

---

## OMNIBAR

- **FloatingOmnibarFab:** Draggable 82×82px, posición persiste en `localStorage`, long-press (1s) oculta. Bien implementado.
- **Chat bubbles:** Sistema completo — usuario derecha (gradiente azul), agente izquierda (navy oscuro + borde), header con icono + nombre de persona, typing dots animados.
- **ProactiveHUD:** Se muestra cuando el chat está vacío; carga `ActionChips` desde `ActionBridge` basado en persona dominante + intercepción + buffer predictivo. Integración correcta.
- **WarRoomView:** Panel colapsable de debug que muestra diálogos de agentes y conflict memory. Poll cada 3s cuando expandido — potencial drain de rendimiento si siempre visible.
- **Voice button:** Implementado con estados `--listening` (pulse), `--processing`, `--error` y status bar en CSS.
- **`:root` CSS variables** definidas solo aquí — no compartidas con resto de app.

---

## NAVEGACIÓN

### Desktop Navbar
- 3 grupos dropdown: **Work** (WorkHub, Projects, MyTasks, Fleet), **Personal** (PersonalHub, Notes, Todos, Routines), **Finance** (FinanceHub, History, Goals, Budgeting)
- Calendar: enlace directo
- Bell icon: badge con count de items ≤7 días
- **Ausentes del navbar desktop:** Identity, Profile, Settings, Stats — solo accesibles vía menú móvil o URL directa
- **Problema:** Botón de marca (dashboard) no tiene estado `is-active` cuando estás en `/dashboard`
- **Problema:** Inline styles hardcodeados directamente en el `<nav>` JSX (`background: '#0b0b0b'`, `borderBottom: '2px solid #27272a'`) — bypass del sistema CSS

### Navbar mobile
- Hamburger → overlay full-screen con accordion. Identity y Settings sí aparecen aquí.
- Inconsistencia: en desktop no hay acceso a Settings desde la UI.

### Router
- `createHashRouter` — todas las URLs tienen prefijo `#/`
- `/inbox` → redirect a `/calendar` (semánticamente incorrecto)
- `/budgeting` → redirect a `/finance/budgeting` (legacy URL)

---

## FEEDBACK DEL SISTEMA

### Toast (`Toast.jsx`)
- Singleton global, llamable desde cualquier módulo con `showToast(msg, type, duration, icon)`.
- **CSS BUG en `Toast.css`:** Las clases `.toast-success`, `.toast-error`, `.toast-warning`, `.toast-info` están definidas **dos veces** en el mismo archivo. El primer set (pasteles claros: verde/rojo/amarillo/azul) es **código muerto** — sobreescrito inmediatamente por el segundo set (temas dark ATHENEA). El archivo tiene ~30 líneas de CSS inefectivo.

### ReminderToasts (`ReminderToasts.jsx`)
- Sistema separado del Toast global. Monitorea notas, todos y pagos; dispara toasts en días `[7, 3, 1, 0, -1]` respecto de la fecha de vencimiento.
- Persiste qué toasts ya se mostraron en `localStorage` bajo clave `athenea.reminder_toasts`.
- Tiene navegación: clic en el toast navega a la ruta correspondiente.

### Loading / Error states
- No se observó ningún componente global de loading/skeleton. Cada página renderiza vacío hasta que Redux tiene datos.
- `GatekeeperModal` sí tiene `isSaving` + `saveError` + `saveSuccess` states.

---

## INTERACTIVIDAD Y ANIMACIONES

**Lo que existe:**
- `FloatingOmnibarFab` — drag suave con constricción a viewport bounds; pulse animation cuando hay alertas
- `Omnibar` — chat typing dots (`@keyframes bounce`), voice pulse (`@keyframes pulse`)
- `IdentityHub` — `@keyframes slideDown` + `@keyframes fadeIn` en cards y form
- `GatekeeperModal` — multi-step con progress indicator visual (3 pasos)
- Todos progress bar — inline `width` style → transición implícita en 5 pasos (0/25/50/75/100%)
- Navbar mobile — overlay full-screen (sin animación de entrada visible)
- Dropdown navbar desktop — aparece/desaparece sin transición (inmediato)

**Lo que falta:**
- Sin skeleton loaders para estados de carga inicial
- Sin transición de entrada/salida en dropdowns de Navbar
- Sin page transition entre rutas
- Sin feedback visual de "guardando..." genérico (solo en GatekeeperModal)
- Sin hover transitions en botones de la mayoría de páginas (solo IdentityHub tiene hover con `transition`)
- Formularios inline (FinanceHub, PersonalHub) no tienen animación de expansión

---

## DEUDA VISUAL (priorizada)

| Prioridad | Problema | Archivos afectados |
|-----------|---------|-------------------|
| 🔴 CRÍTICO | Settings tiene fondo **blanco** en app oscura | `src/pages/Settings.css` |
| 🔴 CRÍTICO | StatsPage título `color: #1a1a1a` — **texto invisible** sobre fondo oscuro | `src/pages/StatsPage.css` |
| 🔴 ALTO | 5 temas visuales distintos — app fragmentada | todos los `.css` de páginas |
| 🔴 ALTO | **Cero tokens de diseño globales** — 40+ hex hardcoded repetidos | todos los `.css` |
| 🟠 MEDIO | FinanceHub CSS bug: `.financehub-stat-saldo` nunca se aplica | `src/pages/FinanceHub.css` |
| 🟠 MEDIO | Toast.css tiene ~30 líneas de código CSS muerto | `src/components/Toast/Toast.css` |
| 🟠 MEDIO | Navbar inline styles en JSX (no en CSS) | `src/components/Navbar.jsx` |
| 🟠 MEDIO | 4 familias tipográficas distintas sin jerarquía definida | Dashboard.css, IdentityHub.css, index.css |
| 🟡 BAJO | Sidebar.jsx + GlobalSearch.jsx — **componentes huérfanos** (código muerto) | `src/components/Sidebar.jsx`, `src/components/GlobalSearch.jsx` |
| 🟡 BAJO | Profile.jsx — página casi vacía que confunde con IdentityHub | `src/pages/Profile.jsx` |
| 🟡 BAJO | Identity/Settings/Stats no accesibles desde navbar desktop | `src/components/Navbar.jsx` |
| 🟡 BAJO | Dashboard usa fuente monospace para texto contextual | `src/pages/Dashboard.css` |
| 🟡 BAJO | `/inbox` redirige a `/calendar` sin lógica de inbox real | `src/routes.jsx` |
| 🟡 BAJO | WarRoomView poll 3s incluso cuando no hay cambios | `src/components/Omnibar/WarRoomView.tsx` |

---

## RECOMENDACIONES PRIORITARIAS

### 1. Crear `src/styles/tokens.css` con variables globales
Define `:root` con los ~15 valores base (`--bg-base`, `--bg-card`, `--border`, `--accent-gold`, `--accent-cyan`, `--text-primary`, `--text-muted`) y reemplaza hardcode. Es el cambio más impactante y facilita todo lo demás.

### 2. Corregir Settings.css — dark theme
Cambiar `--core-bg: #f4f8ff` por `#0b0b0b` y adaptar los colores de panel. Una pantalla blanca en una dark app es la inconsistencia más visible.

### 3. Corregir StatsPage.css — fix de accesibilidad
`.stats-header h1 { color: #1a1a1a }` → `color: #d4af37` o `#c9cdd2`. El título del sistema de XP es invisible ahora mismo.

### 4. Unificar IdentityHub al tema principal
Reemplazar el gradiente de fondo, el blur y la fuente Inter por el esquema `#0f2235`/`#0b0b0b` principal. Actualmente se siente como otra app.

### 5. Corregir bug CSS en FinanceHub.css
Mover el bloque de `.financehub-stat-saldo` fuera del cierre erróneo para que el borde y sombra dorados de la tarjeta de saldo se apliquen.

### 6. Agregar Identity / Settings / Stats al navbar desktop
Estos perfiles son parte del flujo operativo pero son invisibles en desktop. Añadir como grupo "Sistema" o como iconos en la barra derecha.

### 7. Eliminar código muerto
Borrar o conectar `Sidebar.jsx` + `GlobalSearch.jsx`. Si no hay plan inmediato: eliminar. Limpiar el primer bloque de clases en `Toast.css` (pasteles que nunca se ven).

### 8. Reemplazar inline styles del Navbar por clases CSS
Mover `background`, `borderBottom`, `padding` del `<nav>` JSX a `Navbar.css`. Mejora mantenibilidad y permite override desde tokens.

### 9. Completar o redirigir Profile.jsx
Expandir con avatar + enlace directo a IdentityHub, o directamente hacer que `/profile` redirija a `/identity`. La separación actual confunde.

### 10. Implementar skeleton loaders globales
Un componente `<Skeleton>` reutilizable para estados de carga inicial de las páginas. Elimina el efecto de "pantalla vacía que aparece de golpe" al navegar.

---

**Análisis completo — listo para proponer mejoras.**
