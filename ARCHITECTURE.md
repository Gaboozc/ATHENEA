# ATHENEA — Architecture Map
> Generado por auditoría estática. Actualizar cuando cambien dependencias críticas.

## God Nodes — Archivos con más conexiones
| Módulo | Conexiones | Rol |
|--------|-----------|-----|
| `aiMemorySlice` | 9 imports | Hub central de memoria de agentes |
| `LLMClient.ts` | 5 imports | Bottleneck de inferencia LLM |
| `personaEngine.ts` | 5 imports | Motor de respuesta central |
| `AgentOrchestrator.ts` | ~4 imports | Coordinador del enjambre |
| `FastPathMatcher` | ~4 imports | Routing de inferencia |

God node más crítico: `personaEngine.ts` — importa AgentOrchestrator + LLMClient + 
aiMemorySlice, y es importado por Bridge, useIntelligence y componentes UI.

## Capas Arquitectónicas (8 capas)

[UI]          Omnibar → ProactiveHUD → WarRoomView
     ↓
[Hook]        useIntelligence.ts
     ↓
[Bridge]      Bridge.ts (router de 3 capas)
     ↓
[Inference]   FastPath (<1ms) → ONNX (~100ms) → OpenClaw (~400ms)
     ↓
[Agents]      AgentOrchestrator → [Cortana, Jarvis, SHODAN]
     ↓
[Persona]     personaEngine.ts
     ↓
[Data]        BlackBox + ExternalDataService + LLMClient
     ↓
[Redux]       aiMemorySlice + 20+ slices + 5 middlewares

## Dependencias Críticas

Omnibar → useIntelligence → Bridge → personaEngine
                                         ↓
                                  AgentOrchestrator
                                  ├─ StrategistAgent (Cortana, peso 0.7)
                                  ├─ AuditorAgent   (Jarvis, peso 0.85)
                                  └─ VitalsAgent    (SHODAN, peso 1.0 VETO)
                                         ↓
                                  LLMClient ← localStorage (riesgo)
                                         ↓
                                  aiMemorySlice (Redux)

Riesgo circular resuelto: AgentOrchestrator ↔ ActionBridge usa EventBus como desacoplador.

## Huecos de Cobertura — Sin manejo de error

| Archivo | Severidad | Problema |
|---------|-----------|----------|
| `useIntelligence.ts` | ALTA | Promise chain sin try/catch |
| `EventBus.ts` | MEDIA | Un fallo en subscriber rompe a todos |
| `BlackBox.ts` | MEDIA | localStorage sin validación |
| `widgetBridge.ts` | MEDIA | Sin error handling |
| `usePersona.ts` | MEDIA | Hook sin error handling |
| `ghostWrite.ts` | BAJA | Operaciones de draft sin protección |

## Huecos de Cobertura — Sin loading state

Más críticos:
- `LLMClient.ts` — llamado frecuentemente, sin feedback de progreso → silently fails
- `ExternalDataService.ts` — fallos de API no aislados → rompe decisiones de agentes

## Estadísticas del Proyecto

| Métrica | Valor |
|---------|-------|
| Archivos TS/TSX en scope | ~49 |
| Módulo intelligence | 31 archivos (~8,000 líneas) |
| Componentes UI | 16 archivos |
| Archivos con test | 3 (cobertura muy baja) |
| Slices Redux | 20+ slices + 5 middlewares |
| Líneas totales estimadas | ~12,500 |

## Reglas de trabajo derivadas del mapa

- Cualquier cambio en `personaEngine.ts` requiere validar Bridge, useIntelligence y 
  componentes UI antes de commitear
- Cambios en `aiMemorySlice` impactan los 3 agentes simultáneamente — testear los 3
- `LLMClient.ts` es bottleneck — cualquier cambio puede afectar latencia percibida
- `EventBus.ts` no tiene aislamiento — un subscriber roto puede romper toda la cadena
- `BlackBox.ts` lee localStorage sin validación — nunca asumir que el dato existe
- El redesign de Identity/Profile toca: personaEngine, AgentOrchestrator, Omnibar, 
  ProactiveHUD, LanguageContext y routes — no es cambio aislado

---
