# Reporte Omnibar y ATHENEA con OpenClaw

Fecha: 2026-03-09

## 1. Omnibar - Estado actual de funcionamiento

### 1.1 Como esta funcionando hoy

- Activacion global por `Ctrl+K` o `Cmd+K`.
- Abre como modal flotante con tabs por hub: `WorkHub`, `PersonalHub`, `FinanceHub`.
- Acepta comandos por texto y por voz.
- Procesa comandos con la arquitectura hibrida del Bridge.
- Ejecuta acciones automaticamente cuando la confianza es alta (>= 90).
- Si faltan parametros o la confianza no alcanza, muestra canvas de confirmacion.
- Registra historial de acciones y muestra feedback con toasts y audio.

### 1.2 Funcionalidades implementadas

- UI premium del Omnibar:
  - Overlay con blur.
  - Contenedor con gradiente y jerarquia visual.
  - Tabs con color por hub.
  - Estados visuales de foco, hover y loading.
- Input inteligente:
  - Campo de texto con placeholder segun hub.
  - Boton de envio con estado de carga.
- Voz:
  - Flujo nativo Android con `@capacitor-community/speech-recognition`.
  - `partialResults` en tiempo real.
  - Modo silencioso (`popup: false`).
  - Timeout de sesion y limpieza de listeners.
  - Fallback web con `SpeechRecognition` cuando no es nativo.
- Integracion IA:
  - Conecta con `useIntelligence` y `Bridge`.
  - Soporta auto-ejecucion por confianza.
  - Soporta confirmacion manual con `IntelligenceCanvas`.
- Proactividad:
  - Muestra `Dynamic Insights` por hub.
  - Muestra sugerencias de skills relevantes por contexto.
- Trazabilidad:
  - Guarda acciones en `actionHistoryStore`.
  - Soporta callback `onActionExecuted`.

### 1.3 Problemas actuales del Omnibar

#### Criticos

1. Varias acciones generadas por IA no mutan Redux por desalineacion de `action type` vs reducers reales.
2. La experiencia de voz puede ser inconsistente si hay errores de sesion concurrente o limpieza incompleta en escenarios borde.

#### Altos

1. Primer uso de ONNX puede introducir latencia visible por carga inicial del modelo.
2. Al faltar parametros, la experiencia depende de que el canvas cubra correctamente todos los casos de formulario.
3. En entorno Android, no siempre hay herramientas de diagnostico listas (`adb` fuera de PATH en una de las sesiones), lo que limita trazas de runtime.

#### Medios

1. Tamano de bundle elevado por runtime ONNX.
2. Ajustes finos pendientes en thresholds de confianza para minimizar falsos positivos/negativos.
3. Cobertura de testing automatizado aun baja para flujos IA/voz end-to-end.

## 2. ATHENEA + OpenClaw - Estado actual

### 2.1 Como esta funcionando la integracion hoy

ATHENEA ya opera en modo hibrido local con 4 capas:

1. `FAST_PATH` (regex): rapido para casos comunes.
2. `SMART_PATH` (ONNX): matching semantico offline.
3. `OPENCLAW_GATEWAY` (opcional): solo entra si esta configurado `VITE_OPENCLAW_GATEWAY_URL`.
4. `FALLBACK` (keywords): ultima red de seguridad.

Situacion real actual:

- Fast Path: funcionando.
- Smart Path ONNX: funcionando.
- OpenClaw Gateway: implementado en codigo, pero depende de configuracion externa.
- Fallback: funcionando.

### 2.2 Funcionalidades actuales de ATHENEA con la arquitectura hibrida

- Inferencia local offline para gran parte de los comandos.
- Seleccion de skill por score de confianza.
- Extraccion de parametros y enriquecimiento contextual.
- Generacion de artifact previo a ejecucion.
- Ejecucion autonoma para alta confianza.
- Confirmacion manual cuando faltan datos o hay ambiguedad.
- Sugerencias contextuales por hora/dia/estado del hub.

### 2.3 Problemas y brechas de ATHENEA + OpenClaw

#### Ya detectados

1. OpenClaw no esta al 100 porque la capa gateway depende de variables y despliegue externo que aun no estan completos en runtime.
2. Varias skills tienen mapeos de accion no alineados con reducers reales.
3. Hay rutas de resolucion en smart resolver que requieren ajuste para algunos dominios (por ejemplo pagos/fechas en escenarios especificos).
4. Falta mayor cobertura de pruebas automatizadas para validar flujo completo IA -> accion Redux -> estado esperado.

#### Configuracion que falta para operar OpenClaw completo

1. Definir y verificar `VITE_OPENCLAW_GATEWAY_URL`.
2. Definir `VITE_OPENCLAW_API_KEY` (si aplica).
3. Levantar y asegurar gateway OpenClaw accesible desde ATHENEA.
4. Alinear autenticacion/token del gateway con configuracion real de OpenClaw.
5. Verificar contrato de request/response del endpoint `/agent` con casos reales.

### 2.4 FASE 2.3 - Filtro Tactico (cerrada)

Implementado en esta iteracion:

1. `NotificationAnalyzer.ts` con reglas tacticas por patron:
  - Finanzas: deteccion por moneda/pago/retiro + extraccion de monto y comercio.
  - Agenda: deteccion por reunion/hoy a las/link/cita + extraccion de temporalidad.
2. Priorizacion por contexto:
  - En modo `focused`, solo interrupciones `critical` llegan a la UI.
  - Con bateria critica (<10%), se bloquea todo salvo `critical`.
  - Si comercio detectado coincide con `knownCommerceKeywords` y hay zona activa, sube prioridad.
3. UI dedicada:
  - Nueva `InterceptCard.tsx` en `ProactiveHUD` con acciones `[EJECUTAR PROTOCOLO]` y `[DESCARTAR]`.
4. Integracion de voz PersonaEngine:
  - Saludo tactico actualizado a: "Señor, he interceptado un movimiento en su cuenta de [Banco]. ¿Actualizamos el Hub de Finanzas?".

### 2.5 FASE 2.4 - Caja Negra y Aprendizaje de Patrones (cerrada)

Implementado en esta iteracion:

1. Behavioral Database local persistente:
  - Nuevo modulo `src/modules/intelligence/BlackBox.ts`.
  - Guarda frecuencia de apertura de Hubs por dia/hora.
  - Guarda tiempo de respuesta promedio a `InterceptCard`.
  - Guarda correlacion productividad vs bateria/zona.
2. Pattern Recognition Engine:
  - Deteccion de rutina `FinanceHub` tras interceptacion bancaria.
  - Deteccion de rutina `HOME -> tareas de descanso`.
  - Deteccion de rutina `Lunes mañana -> WorkHub`.
3. Proactive Pre-loading:
  - Nuevo `predictiveBuffer` en `aiMemorySlice`.
  - BlackBox publica prediccion (`nextHub`, `priority`, `reason`) en tiempo real.
  - `ProactiveHUD` muestra sugerencia de prioridad alta antes de accion del usuario.
4. PersonaEngine Evolution:
  - Saludo contextual usa memoria predictiva.
  - Si patron alto de lunes/trabajo: "Señor, basándome en sus últimos lunes, he preparado el entorno de trabajo...".

Estado de validacion:
- Build web OK tras integracion de BlackBox.
- Sin errores de diagnostico en archivos modificados de 2.4.

## 3. Que falta para estar al 100

### 3.1 Omnibar al 100

1. Cerrar desalineaciones de `action types` para que toda accion inferida muta estado real.
2. Reforzar estabilidad del flujo de voz en casos borde y sesiones interrumpidas.
3. Reducir latencia de primer uso ONNX (precarga o estrategia lazy mas fina).
4. Completar testing automatizado de:
   - texto,
   - voz,
   - auto-ejecucion,
   - confirmacion manual,
   - errores y recoveries.

### 3.2 ATHENEA + OpenClaw al 100

1. Completar despliegue/configuracion de gateway OpenClaw en entorno operativo.
2. Validar autenticacion segura del gateway de punta a punta.
3. Confirmar que capa 3 (gateway) responde con skill/confianza en todos los casos complejos esperados.
4. Alinear completamente skill mapping con Redux reducers reales.
5. Ejecutar QA integral en dispositivo Android y Web con evidencias reproducibles.

## 4. Nivel de completitud estimado

- Omnibar (UI + UX + flujo base): alto, funcional en produccion controlada.
- Inteligencia local (FastPath + ONNX): alto, funcional.
- OpenClaw gateway remoto: parcial, listo en codigo pero no plenamente operacional sin configuracion final.
- Flujo autonomo end-to-end total: parcial-alto, limitado por mapeos Redux y pendientes de gateway/testing.

## 5. Conclusion ejecutiva

El Omnibar ya funciona bien para uso real con entrada por texto/voz, inferencia hibrida y confirmacion inteligente. La base de ATHENEA con OpenClaw esta bien planteada y parcialmente operativa: el modo local hibrido funciona, pero para llegar al 100 falta cerrar la capa gateway en entorno real, terminar la alineacion de acciones Redux y completar validacion end-to-end automatizada y en dispositivo.
