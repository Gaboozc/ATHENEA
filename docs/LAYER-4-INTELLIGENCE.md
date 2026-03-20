# Capa 4 — Intelligence (Agentes AI + Integraciones) 🔧

## Qué es esta capa
Los agentes AI (Cortana, Jarvis, SHODAN) responden con LLM real. Google Calendar sincroniza eventos. El sistema proactivo genera briefings y alertas.

## Estado: 🔧 EN PROGRESO — Infraestructura 100% lista, configuración externa pendiente

---

## Infraestructura AI ✅ COMPLETA

- [x] **AgentOrchestrator** — Multi-agente (Cortana/Jarvis/SHODAN), `callLLM()` llama OpenAI/Groq real
- [x] **neuralAccess.ts** — `getNeuralKey()` / `setNeuralKey()` / `getNeuralProvider()` / `setNeuralProvider()`
- [x] **initializeAgentOrchestrator(store)** — llamado en `AppInitializer.jsx` línea 69
- [x] **openclawAdapter** — 15+ skill IDs mapeados a Redux actions
- [x] **EventBus** — rompe dependencia circular; `orchestrator:decision` → ActionBridge
- [x] **ActionBridge** — listener wired en AppInitializer
- [x] **Proactive evaluator** — `orchestrator.evaluate()` con debounce 5min en AppInitializer
- [x] **AgentOrchestrator strings** — corregidas de español a inglés (dialogue, conflict, synthesis)

---

## Omnibar ✅ COMPLETO

- [x] **Badge "IA activa"** (cyan) / **"Modo offline"** (gris) — `getNeuralKey()` → Omnibar.tsx líneas 811-815
- [x] **sendPrompt()** → `useIntelligence` → openclawAdapter → Redux dispatch
- [x] **Voice input** — nativo (Capacitor) + WebSpeech API fallback
- [x] **Chat bubbles** — respuestas de agente por hub (Cortana/Jarvis/SHODAN)
- [x] **WarRoomView** — sólo visible en `advancedMode`

---

## Cortana (Work Agent) ✅ COMPLETO

- [x] WorkHub Cortana banner — `lastVerdict` gateado por `getNeuralKey()` + timestamp < 30min
- [x] Responde en Omnibar con contexto WorkHub
- [x] `orchestrate()` → `setLastVerdict` en Redux → banner visible en WorkHub

---

## Jarvis (Finance Agent) ✅ COMPLETO

- [x] FinanceHub panel `jarvis-briefing` — muestra `lastVerdict` del agente `auditor`
- [x] Gateado por `isJarvisVerdict && isJarvisRecent`

---

## SHODAN (Intelligence Agent) ✅ COMPLETO

- [x] Intelligence page — `useProactiveInsights()` + `useActionHistory()`
- [x] Analytics engine — system health, priority distribution, throughput, project health

---

## Google Calendar ✅ COMPLETO (requiere configuración externa)

- [x] `src/services/googleCalendar.js` — llama a Google Calendar API
- [x] `src/hooks/useGoogleCalendar.js` — flujo OAuth con token
- [x] `Calendar.jsx` — barra conectar/sync/desconectar
- [ ] **Pendiente usuario**: configurar `VITE_GOOGLE_CLIENT_ID` en Google Cloud Console
- [ ] **Pendiente usuario**: probar con cuenta real

---

## Notificaciones Proactivas

- [x] **ReminderToasts.jsx** — alertas de pagos/todos (existe en `src/components/`)
- [x] **PreFlightBriefing** — briefing diario generado en AppInitializer
- [x] **WelcomeOnboarding** — toast de bienvenida
- [ ] NativeReminderNotifications — notificaciones nativas Android (opcional Layer 5)
- [ ] Notification listener bridge para SMS bancarios (opcional Layer 5)

---

## Prerequisitos para activar LLM real

1. Ir a **Settings** → sección AI
2. Seleccionar provider: OpenAI o Groq
3. Pegar API key
4. Omnibar mostrará badge "IA activa" en cyan

---

## Build Status

- `npm run build` → ✅ 0 errores (6.56s, 701 módulos)
