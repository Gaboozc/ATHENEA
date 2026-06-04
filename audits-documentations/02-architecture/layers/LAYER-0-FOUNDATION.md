# Capa 0 — Foundation (Infraestructura Base) ✅

## Qué es esta capa
La base sobre la que todo lo demás se construye. Sin esta capa, la app no puede ni arrancar.

## Estado: COMPLETA

## Qué se hizo

### Proyecto y Build
- [x] Vite + React 18 configurado
- [x] TypeScript parcial (store/, slices de TS coexisten con JSX)
- [x] ESLint configurado
- [x] `npm run build` → 0 errores, ~4.5s

### Redux Store
- [x] Redux Toolkit configurado
- [x] Redux Persist con `persist:athenea-root` en localStorage
- [x] 18 slices activos: auth, projects, organizations, notes, calendar, todos, payments, routines, budget, collaborators, workOrders, stats, tasks, goals, budgetCycle, checkins, journal, focus
- [x] Middleware de serialización configurado (ignora redux-persist)

### Capacitor / Android
- [x] `capacitor.config.ts` — appId: `com.athenea.app`, webDir: `dist`
- [x] AndroidManifest.xml — permisos INTERNET + RECORD_AUDIO
- [x] `android/app/build.gradle` — signingConfig con env vars

### CI/CD
- [x] `.github/workflows/build-apk.yml` — build debug
- [x] `.github/workflows/build-release-apk.yml` — build release firmado con keystore
- [x] GitHub Secrets necesarios: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`

## Archivos clave
- `store/index.ts` — store + persist config
- `store/slices/` — todos los reducers
- `capacitor.config.ts`
- `android/app/build.gradle`
- `vite.config.js`
- `package.json`
