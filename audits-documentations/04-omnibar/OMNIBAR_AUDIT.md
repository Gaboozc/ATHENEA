# OMNIBAR_AUDIT.md
# Estado actual del sistema Omnibar — ATHENEA

> **Fecha:** 2026-03-20 | **Modelo:** Claude Sonnet 4.6
> **Archivos auditados:** 13 | **Líneas revisadas:** ~3,200

---

## MAPA DEL SISTEMA

### Archivos activos

| Archivo | Líneas | Rol |
|---------|--------|-----|
| `Omnibar.tsx` | ~1,090 | Componente principal — chat, voz, hubs, skills |
| `useOmnibar.ts` | 119 | Estado global con `useSyncExternalStore` (sin Redux) |
| `WarRoomView.tsx` | 248 | War Room / Thought Stream (solo `advancedMode`) |
| `ProactiveHUD.tsx` | 107 | HUD proactivo con contexto del agente activo |
| `ActionChips.tsx` | 37 | Chips de acción contextual del HUD |
| `FloatingOmnibarFab.jsx` | 279 | FAB flotante draggable |
| `FABShowToggle.jsx` | 68 | Botón para revelar FAB cuando está oculto |
| `InterceptCard.tsx` | 90 | Tarjeta de interceptación de notificaciones (conectada) |
| `Omnibar.css` | 787 | Estilos principales |

### Archivos deprecados / archivados

| Archivo | Estado |
|---------|--------|
| `Omnibar.new.css` | Deprecated — no importado, puede eliminarse |
| `INTEGRATION_GUIDE.md` | Deprecated — puede eliminarse |
| `_archive/Omnibar.light-theme.css` | Archivado — nadie lo referencia |

### Árbol de dependencias

```
Layout.jsx
  ├── <FloatingOmnibarFab>    → useOmnibar (openOmnibar)
  ├── <FABShowToggle>         → localStorage + custom event
  └── <Omnibar>               → useOmnibar (isOpen, closeOmnibar)
        ├── useIntelligence(selectedHub)
        ├── <InterceptCard>   (cuando hay latestActionable en Redux)
        ├── <ProactiveHUD>
        │     ├── usePersona()
        │     ├── getActionBridge()
        │     └── <ActionChips>
        ├── <WarRoomView>     (solo advancedMode)
        └── <IntelligenceCanvas>
```

---

## LO QUE ESTÁ BIEN

### `useOmnibar.ts` — estado global sin Redux
`useSyncExternalStore` sobre un singleton module-level. Sin overhead de Redux,
sin Context, sin prop drilling. La función `openOmnibarExternally()` permite abrir
el Omnibar desde fuera de React (notificaciones nativas). Optimización de igualdad
en `setGlobalState` evita notificaciones cuando el estado no cambia.

### `FloatingOmnibarFab.jsx` — drag & drop robusto
- Dead zone de 5px antes de considerar drag (distingue click de arrastre)
- Long-press 1s para ocultar/mostrar el FAB
- Posición persistida en localStorage con parse seguro
- `constrainPosition` mantiene el FAB en bounds tras rotación de pantalla
- `resize` handler previene que el FAB quede fuera de viewport
- Cleanup correcto de `longPressTimerRef` en unmount

### `FABShowToggle.jsx` — comunicación cross-component limpia
Coordinación con `FloatingOmnibarFab` vía custom event `athenea:fab-toggled`
sin props ni Context. Los dos componentes son completamente independientes.

### Sistema de voz — 4 estados completos
Path nativo (Capacitor) y path web (Web Speech API) bien separados.

**Path nativo:**
- Verificación de disponibilidad antes de pedir permiso
- `partialResults` con debounce 1.5s, reiniciado en cada partial
- `listeningState → stopped` activa submit inmediato cancelando el debounce
- Timeout escape de 10s si `listeningState` nunca dispara
- `nativeVoiceInFlightRef` previene sesiones concurrentes

**Path web:**
- `voiceStateRef` evita closure stale en `recognition.onend`
- Permiso verificado con `getUserMedia` antes de iniciar

**4 estados visuales:** idle → listening (pulso rojo) → processing (ámbar) → error (rojo).
Auto-clear de error tras 3 segundos.

### Chat bubbles — calidad visual
- Animación `bubblePop` (0.18s) en cada mensaje nuevo
- Indicador de typing con 3 puntos animados con `animation-delay` escalonado
- User bubbles (derecha, azul) / agent bubbles (izquierda, oscuro con borde)
- `chat-agent-header` con icono + nombre en monospace
- Scroll suave automático al último mensaje via `chatEndRef`

### Hub tabs — diferenciación cromática
Work → azul | Personal → rosa | Finance → verde. Con `box-shadow` de color correspondiente.

### WarRoomView gateado
`{advancedMode && <WarRoomView />}` — solo visible para usuarios que activaron
Advanced Mode en Settings. Los usuarios normales no ven el debate interno de agentes.

### handleConfirmAction — 3 paths cubiertos
1. Insight proactivo con su propia acción
2. Calendar sync (caso especial `forceInteractiveAuth`)
3. Skill genérico vía `confirmAction(formData)` de `useIntelligence`
Cada path registra en `actionHistoryStore` y notifica al Layout via `onActionExecuted`.

### InterceptCard — ahora conectada
El componente intercepta notificaciones de apps (PayPal, WhatsApp, Google Calendar)
detectadas por el sistema de IA. Se muestra en el estado vacío del Omnibar cuando
`state.aiMemory.interception.latestActionable !== null` y `actionType !== 'none'`.
El handler ejecuta la acción llevando la intención al input del hub correspondiente,
el discard limpia el intercept vía `clearLatestActionableIntercept()` del slice.

---

## FIXES APLICADOS EN ESTA SESIÓN

### FIX-1 — CSS toast residual eliminado
`Omnibar.css` tenía los estilos del sistema de toast local eliminado por OMNI-FIX-8
(`.toast`, `.toast.success`, `.toast.error`, `.toast.info`, `@keyframes slideInToast`).
Esos estilos podían sobreescribir por cascada los del ToastContainer global cuando
el Omnibar estaba abierto. Eliminados.

### FIX-2 — `shortcutsByHub` memoizado
El objeto con 9 shortcuts se re-creaba en cada render (incluyendo cada keystroke).
Ahora está envuelto en `useMemo([language])` — solo se re-crea si cambia el idioma.

### FIX-3 — Chat se limpia al cambiar de hub
Los tabs de WorkHub / PersonalHub / FinanceHub ahora incluyen `setChatMessages([])`.
Antes el usuario veía mensajes de Cortana mientras estaba en el tab de Jarvis.

### FIX-4 — renderMarkdown soporta `*italic*` con asterisco simple
Añadido lookbehind regex `(?<!\*)\*(?!\*)` para capturar el asterisco simple
sin interferir con `**bold**`. Los LLMs usan `*italic*` frecuentemente.

### FIX-5 — ~358 líneas de CSS muerto eliminadas
- 12 clases marcadas OMNI-CLEAN-3 (`.omnibar-results`, `.omnibar-reasoning`,
  `.reasoning-flex`, `.confidence-badge`, `.reasoning-text`, `.insight-list`,
  `.insight-card`, `.insight-badge`, `.insight-hub`, `.insight-description`,
  `.insight-actions`, `.insight-action-btn`) — eliminadas
- `.omnibar-artifact` (clase huérfana — JSX usa `.chat-artifact`) — eliminada
- Block `.toast` / `@keyframes slideInToast` — eliminado
- CSS de 1145 líneas → 787 líneas

### FIX-6 — Stale closure en persistencia del historial
El `useEffect([isOpen])` accedía a `chatMessages` sin tenerlo en las deps,
capturando el valor en el momento de montar (posiblemente vacío).
Solución: `chatMessagesRef` actualizado vía `useEffect([chatMessages])`,
el efecto de cierre usa `chatMessagesRef.current.slice(-20)`.

### FIX-7 — Chat max-height adaptable al viewport
`max-height: 340px` fijo → `max-height: clamp(200px, 40vh, 420px)`.
En tablets y desktop 1440p había espacio desperdiciado; en mobile con teclado
340px era demasiado y el artifact quedaba oculto.

### FIX-8 — iOS safe area en el overlay
`padding-top: 60px` → `padding-top: max(60px, env(safe-area-inset-top, 60px))`.
En iPhone con notch o Dynamic Island el modal ya no queda detrás del área del sistema.

### FIX-9 — Footer con shortcuts de teclado
El footer pasó de mostrar solo el nombre del agente a mostrar también
`Enter enviar · Esc cerrar` con estilos `<kbd>` en monospace.
Igual que todos los command palettes profesionales (Spotlight, Raycast, Linear).

---

## PENDIENTES

| ID | Descripción | Prioridad | Dónde |
|----|-------------|-----------|-------|
| BUG-4 | `aiObserver/omnibarOpened|closed|hubVisited|inputChanged` — dispatches sin reducer, payload se pierde silenciosamente | 🟡 | `Omnibar.tsx` líneas 233–252 |
| BUG-7 | "tap here to close" — vocabulario touch, incorrecto en desktop | 🟢 | `Omnibar.tsx` línea 860 |
| UX-3 | `lastCommandFeedback` hardcodeado en español en ProactiveHUD | 🟢 | `ProactiveHUD.tsx` línea 46 |
| UX-4 | FAB `title="Drag to move · Long-press to hide"` sin traducir | 🟢 | `FloatingOmnibarFab.jsx` línea 270 |
| UX-5 | `"UI v2"` hardcodeado en el header | 🟢 | `Omnibar.tsx` línea 847 |
| UX-6 | Onboarding hint solo aparece en WorkHub, no en Personal/Finance | 🟢 | `Omnibar.tsx` línea 818 |
| CLEAN | `Omnibar.new.css` + `INTEGRATION_GUIDE.md` + `_archive/` — pueden eliminarse | 🟢 | directorio Omnibar |

---

## TABLA COMPLETA DE IMPLEMENTACIONES

| ID | Descripción | Archivo(s) | Estado |
|----|-------------|-----------|--------|
| OMNI-FIX-1 | actionHistory/record reducer | `aiMemorySlice.ts` | ✅ |
| OMNI-FIX-2 | Persistir chat Omnibar en Redux | `aiMemorySlice.ts`, `Omnibar.tsx` | ✅ |
| OMNI-FIX-3 | require() → useSelector en WarRoom | `WarRoomView.tsx` | ✅ |
| OMNI-FIX-4 | advancedMode toggle en Settings | `userSettingsSlice.ts`, `Settings.jsx` | ✅ |
| OMNI-FIX-5 | Markdown renderizado en chat | `Omnibar.tsx`, `Omnibar.css` | ✅ |
| OMNI-FIX-6 | Escape para cerrar Omnibar | `Omnibar.tsx` | ✅ |
| OMNI-FIX-7 | Closure stale en voz (voiceStateRef) | `Omnibar.tsx` | ✅ |
| OMNI-FIX-8 | Unificar sistemas de toast | `Omnibar.tsx` | ✅ |
| OMNI-FIX-9 | agentInfo memoizado con useMemo | `Omnibar.tsx` | ✅ |
| OMNI-FIX-10 | Onboarding hint con lenguaje natural | `Omnibar.tsx` | ✅ |
| OMNI-PERF-1 | Debounce 300ms en keystroke Redux | `Omnibar.tsx` | ✅ |
| OMNI-PERF-2 | hasNeuralKey memoizado | `Omnibar.tsx` | ✅ |
| OMNI-PERF-3 | Animación spin solo en hover | `Omnibar.css` | ✅ |
| OMNI-A11Y-1 | ARIA role/dialog/live attrs | `Omnibar.tsx` | ✅ |
| OMNI-CLEAN-1 | Archivar Omnibar.new.css | `_archive/` | ✅ |
| OMNI-CLEAN-2 | Eliminar código muerto en JSX | `Omnibar.tsx` | ✅ |
| OMNI-CLEAN-3 | Eliminar CSS sin uso | `Omnibar.css` | ✅ |
| OMNI-CLEAN-4 | Skill click sin emoji en input | `Omnibar.tsx` | ✅ |
| OMNI-CLEAN-5 | Deprecar INTEGRATION_GUIDE.md | `INTEGRATION_GUIDE.md` | ✅ |
| PERSONA-1 | System prompts profundos por agente | `AgentOrchestrator.ts` | ✅ |
| PERSONA-2 | Contexto dinámico del store por agente | `AgentOrchestrator.ts` | ✅ |
| PERSONA-3 | Memoria episódica (write + read) | `AgentOrchestrator.ts` | ✅ |
| PERSONA-4 | Tono offline diferenciado por agente | `Bridge.ts` | ✅ |
| FIX-1 | CSS toast residual eliminado | `Omnibar.css` | ✅ |
| FIX-2 | shortcutsByHub useMemo | `Omnibar.tsx` | ✅ |
| FIX-3 | Chat limpio al cambiar hub | `Omnibar.tsx` | ✅ |
| FIX-4 | *italic* con asterisco simple | `Omnibar.tsx` | ✅ |
| FIX-5 | ~358 líneas CSS muerto eliminadas | `Omnibar.css` | ✅ |
| FIX-6 | Stale closure en persistencia chat | `Omnibar.tsx` | ✅ |
| FIX-7 | Chat max-height adaptable | `Omnibar.css` | ✅ |
| FIX-8 | iOS safe area en overlay | `Omnibar.css` | ✅ |
| FIX-9 | Footer con shortcuts de teclado | `Omnibar.tsx`, `Omnibar.css` | ✅ |
| INTERCEPT | InterceptCard conectada al store | `Omnibar.tsx` | ✅ |
