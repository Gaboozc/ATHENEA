# Auditoria Tecnica - ATHENEA (`single-person`)

## 1. Resumen Ejecutivo
- Fecha de auditoria: 2026-03-08
- Branch auditado: `single-person`
- Commit remoto actual: `3f63c7d` (`origin/single-person`)
- Estado local al momento de auditar: hay cambios sin commit encima del ultimo push (9 archivos modificados, enfocados en Omnibar/mic/inteligencia)

Estado general del proyecto:
- Aplicacion web compila: `npm run build` OK.
- Tests unitarios existentes: `npm run test -- --run` OK (1 archivo, 5 tests).
- APK Android compila: `gradlew assembleDebug` OK.
- Instalacion por ADB previamente validada en dispositivo: OK (instalada correctamente antes de esta auditoria).
- Funcionalidad IA/autonomia: implementada a nivel de UI/bridge, pero con inconsistencias importantes en mapeo de acciones Redux.

## 2. Metodologia de Verificacion
Se reviso con evidencia directa:
- Git: branch, commit, status.
- Build/test: Vite, Vitest, Gradle Android.
- Codigo fuente critico: Omnibar, useIntelligence, Bridge, parser/smartResolver, calendar sync, widget bridge, store/slices.
- Diagnostico de workspace: `get_errors`.

## 3. Inventario Tecnico Implementado (Hecho)

### 3.1 Stack y arquitectura
- Frontend: React 18 + Vite + TypeScript/JS mixto.
- Estado: Redux Toolkit + redux-persist (`store/index.js`).
- Mobile: Capacitor Android (`@capacitor/android`).
- Notificaciones locales: `@capacitor/local-notifications`.
- Voz nativa (agregado): `@capacitor-community/speech-recognition`.

### 3.2 Modulo de Inteligencia (hecho)
Implementado en `src/modules/intelligence/`:
- `Bridge.ts`: analiza prompt, selecciona skill, arma `reduxAction`, construye artifact.
- `skills.ts`: manifiesto de skills por hub (Work, Personal, Finance + cross-hub).
- `useIntelligence.ts`: auto-dispatch por confianza (>=90) + fallback a canvas.
- `utils/parser.ts`: extraccion de parametros.
- `utils/smartResolver.ts`: resolucion inteligente de fechas/IDs/categoria/prioridad/monto.
- `utils/audioFeedback.ts`: earcons (success/error) con Web Audio API.
- `components/IntelligenceCanvas.tsx`: capa de confirmacion manual.

### 3.3 Omnibar (hecho)
- `src/components/Omnibar/Omnibar.tsx`:
  - Input texto + flujo autonomo.
  - Boton mic + speech flow.
  - Toasts de feedback.
- `src/components/Omnibar/useOmnibar.ts`: estado global de apertura/cierre.
- `src/components/Omnibar/FloatingOmnibarFab.css`: FAB de acceso rapido (reposicionado hacia arriba en cambios locales).

### 3.4 Google Calendar Sync (hecho)
- Servicio OAuth/API: `src/services/googleCalendar.ts`.
- Thunk de sincronizacion: `store/slices/calendarSlice.js` (`syncExternalEvents`).
- Integracion en Omnibar/AppInitializer para disparo de sync.

### 3.5 Widget Android nativo (hecho)
- `WidgetBridgePlugin.java`: puente Capacitor <-> SharedPreferences/widget.
- `AtheneaWidgetProvider.java`: render de widget y pending intents.
- `AtheneaWidgetActionReceiver.java`: acciones del widget.
- Layout y recursos widget: XML/drawables en `android/app/src/main/res/...`.
- Registro en `AndroidManifest.xml`.

### 3.6 Pipeline GitHub Actions (hecho)
- `/.github/workflows/build-apk.yml` (debug build).
- `/.github/workflows/build-release-apk.yml` (release build con secrets).

## 4. Lo que Funciona Correctamente (validado)

### 4.1 Build y pruebas
- `npm run build` -> OK.
- `npm run test -- --run` -> OK (5/5 tests).
- `android/gradlew assembleDebug` -> OK.

### 4.2 Integracion Android base
- APK debug se genera correctamente.
- Instalacion via ADB (flujo ya probado en sesion) funciona.
- Manifest incluye receivers/widget y MainActivity registra plugin de widget.

### 4.3 Flujo de calendario (infraestructura)
- Thunk `calendar/syncExternalEvents` existe y actualiza estado `calendar.events`.
- Mapeo de eventos de Google a formato interno implementado.
- Manejo de token expirado y errores API implementado.

### 4.4 Flujo de voz (estado de codigo actual)
- Existe soporte Web Speech API.
- Existe fallback nativo Capacitor (cambios locales actuales).
- Plugin nativo instalado y sincronizado con Android.
- Android build sigue pasando tras integrar plugin.

## 5. Lo que Funciona con Condiciones

### 5.1 Google Calendar OAuth
Condiciones obligatorias:
- Debe existir `VITE_GOOGLE_CLIENT_ID` en `.env`.
- Debe estar configurado OAuth Client en Google Cloud.

Estado real ahora:
- `.env` ausente en workspace auditado.
- Resultado: en estado actual, sync con Google no puede autenticarse en runtime hasta configurar ese valor.

### 5.2 Autonomia IA
- Mecanismo de confianza y auto-ejecucion existe.
- Pero su efectividad depende de que el `action type` generado por cada skill tenga reducer real.
- Hoy hay varias skills cuyo action no coincide con Redux handlers reales.

## 6. No Funciona Apropiadamente (bugs/inconsistencias)

### 6.1 Mismatch entre `skills.action` y reducers reales (principal)
En `skills.ts` hay acciones que se despachan pero no tienen handler equivalente en slices:

- `projects/create` (skill) vs reducer real esperado por slice: `projects/addProject`.
- `tasks/add` vs `tasks/addTask`.
- `tasks/logTime` (sin handler en tasksSlice).
- `notes/create` vs `notes/addNote`.
- `todos/add` vs `todos/addTodo`.
- `payments/addExpense` (sin handler especifico en paymentsSlice).
- `payments/addIncome` (sin handler especifico en paymentsSlice).
- `payments/setBudget` (sin handler en paymentsSlice/budgetSlice con ese type).
- `intelligence/search` (no hay reducer/epic/thunk asociado).

Impacto:
- La IA puede "creer" que ejecuto una accion (toast/historial), pero Redux no muta estado en varios casos.
- Esto afecta directamente la promesa de "autonomous flow" end-to-end.

### 6.2 `smartResolver.resolvePaymentId` usa ruta de estado incorrecta
- Implementacion consulta `state.finance?.finances`.
- Store real usa `payments` slice (`state.payments.payments`).
- Resultado: resolucion automatica de `paymentId` probablemente falla siempre.

### 6.3 `resolveSmartDate` en enriquecimiento no cubre fechas faltantes
- `enrichParameters` llama `resolveSmartDate(undefined, context)` cuando no habia fecha.
- `resolveSmartDate` retorna `undefined` si no recibe `dateString`.
- Resultado: no infiere fecha solo desde contexto en ese camino; depende de la extraccion previa.

### 6.4 Semantica reminder/tarea no unificada
- Se movio reminder a `tasks/addTask` (cambio local) para evitar crear proyectos por error.
- Esto mejora ejecucion, pero el dominio "reminder" como entidad separada no existe formalmente.
- Puede generar UX inconsistente (recordatorio termina siendo tarea con campos de tarea).

## 7. No Funciona en lo Absoluto (hard failures actuales)

### 7.1 Conexion Google Calendar sin configurar OAuth
- Sin `VITE_GOOGLE_CLIENT_ID`, la conexion falla por diseno.
- Error esperado: `Missing VITE_GOOGLE_CLIENT_ID...`.

### 7.2 Skills sin handler Redux
Estas skills, en su estado actual, no ejecutan mutacion real (disparan type inexistente):
- `create_project` (action actual: `projects/create`).
- `add_task` (action actual: `tasks/add`).
- `log_time`.
- `create_note` (action actual: `notes/create`).
- `add_todo` (action actual: `todos/add`).
- `record_expense`.
- `record_income`.
- `set_budget`.
- `search`.

Nota:
- `sync_calendar` si tiene handler (`calendar/syncExternalEvents`).
- `add_reminder` en cambios locales se ajusto a `tasks/addTask` y si tendria mutacion real.

## 8. Matriz de Estado por Area

### 8.1 Core App
- Routing general: Implementado.
- Redux persistencia: Implementado.
- Build web: Funciona.
- Build Android: Funciona.

### 8.2 Omnibar/IA
- UI Omnibar: Funciona.
- Canvas confirmacion: Funciona.
- Auto-dispatch confianza: Parcial (depende de action mapping).
- Sonidos earcons: Implementado; validacion runtime en dispositivo pendiente tras ultimos cambios.
- Mic web: Implementado.
- Mic Android nativo (fallback): Implementado en codigo + plugin; validacion final en dispositivo pendiente tras patch local.

### 8.3 Google Calendar
- Servicio OAuth/API: Implementado.
- Sync thunk: Implementado.
- Configuracion actual del entorno: Incompleta (`.env` faltante).

### 8.4 Widget Android
- Provider/receiver/plugin: Implementado.
- Bridge JS: Implementado.
- Registro manifest: Implementado.
- Validacion funcional integral en dispositivo: parcial (infra OK, pruebas de interaccion completa no documentadas en esta auditoria).

### 8.5 CI/CD
- Workflows de build: Implementados.
- `build-release-apk.yml`: VS Code marca warnings de contexto `secrets`; esto suele ser falso positivo del validador local YAML, no necesariamente fallo real en GitHub Actions.

## 9. Estado Git del Branch al Momento
- Remoto (`origin/single-person`) en commit `3f63c7d`.
- Cambios locales sin commit en:
  - `android/app/capacitor.build.gradle`
  - `android/capacitor.settings.gradle`
  - `package.json`
  - `package-lock.json`
  - `src/components/Omnibar/FloatingOmnibarFab.css`
  - `src/components/Omnibar/Omnibar.tsx`
  - `src/modules/intelligence/Bridge.ts`
  - `src/modules/intelligence/skills.ts`

Interpretacion:
- El estado real de trabajo contiene fixes recientes que aun no estan en GitHub.

## 10. Riesgos Tecnicos Prioritarios

### Critico
1. Mapeo de `skills.action` vs reducers incompatibles en multiples skills.
2. Dependencia de OAuth sin `.env` configurado (calendario no conectable en runtime).

### Alto
3. Resolver de pagos con ruta de estado incorrecta.
4. Falta de pruebas automatizadas del modulo IA (solo hay tests de `priorityEngine`).

### Medio
5. Flujo de reminder acoplado a tasks sin modelo dedicado.
6. Warnings Gradle de deprecacion (no rompe hoy, si en futuras versiones).

## 11. Recomendaciones (orden de ejecucion)

1. Corregir action mapping de todas las skills a action types existentes (o agregar `extraReducers` para los types actuales).
2. Definir contrato unico de dominio para reminder (o mantenerlo como task pero consistente en UI/labels).
3. Corregir `smartResolver`:
   - `resolvePaymentId` -> usar `state.payments.payments`.
   - inferencia de fecha cuando `dateString` venga vacio.
4. Agregar pruebas del modulo IA:
   - matching de skills,
   - extraccion/validacion de parametros,
   - dispatch real sobre store.
5. Configurar `.env` con `VITE_GOOGLE_CLIENT_ID` y probar flujo Google end-to-end en dispositivo.
6. Commit/push de los fixes locales actuales para no perder divergencia con remoto.

## 12. Conclusiones
ATHENEA en `single-person` tiene una base tecnica robusta (build/test/android/widget/infra IA) y un avance fuerte en autonomia y UX. Sin embargo, hoy existe una brecha funcional central: varias acciones de IA no mutan Redux por desalineacion de `action types`. Eso impide considerar el flujo autonomo como "100% operativo" en produccion.

Con los ajustes de mapeo y configuracion OAuth, el sistema puede pasar de "infra implementada" a "ejecucion end-to-end confiable".
