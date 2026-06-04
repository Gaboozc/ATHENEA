# Capa 3 — Functionality (Cada Sección Funcionando) 🔧

## Qué es esta capa
Cada sección de la app funciona correctamente, se conecta a los datos reales del store, y el sistema de idiomas es consistente en toda la app.

## Estado: ✅ COMPLETADA

---

## Sistema de Idiomas (i18n) ✅ COMPLETADO

- [x] **DailyCheckin** — `useLanguage` + claves + CSS overflow fix
- [x] **HabitTracker** — `useLanguage` + locale dinámico (es-ES / en-US)
- [x] **PersonalHub** — `t('Quick Capture')`
- [x] **WorkHub** — `t('Create priority task')`, `t('New task')`, Cortana gating
- [x] **FinanceHub** — health labels en inglés, Jarvis verdict key
- [x] **MyTasks** — `t('New task')`
- [x] **FinanceGoals** — action history string en inglés
- [x] **StatsPage** — `useLanguage` + todas las strings
- [x] **Login** — `useLanguage` + todas las strings
- [x] **IdentityHub** — `useLanguage` + ~40 strings
- [x] **LanguageContext** — ~130 claves nuevas añadidas (es + en dicts)
- [x] **ErrorBoundary** — strings en inglés
- [x] **Calendar, Notes, Todos, Projects** — ya usan `t()` correctamente (auditado)

---

## Estabilidad / APK ✅ COMPLETADO

- [x] **ErrorBoundary** — `getDerivedStateFromError` + `componentDidCatch` + fallback UI
- [x] **Layout.jsx** — ErrorBoundary alrededor de Navbar, Outlet (key=pathname), Omnibar
- [x] **routes.jsx** — `React.lazy` + `Suspense` en todas las rutas (30 páginas)
- [x] **capacitor.config.ts** — `appId: 'com.athenea.app'`, `webDir: 'dist'`
- [x] **AndroidManifest.xml** — permisos INTERNET + RECORD_AUDIO presentes
- [x] **android/app/build.gradle** — `signingConfigs.release` desde env vars

---

## Funcionalidad conectada ✅ COMPLETADO

- [x] **Google Calendar sync** — `useGoogleCalendar.js`, `googleCalendar.js`, `@react-oauth/google`
- [x] **Calendar.jsx** — connect/sync/disconnect UI bar
- [x] **Settings** — API key AI (OpenAI/Groq), selector idioma, import/export datos reales
- [x] **StatsPage** — datos reales de todos los slices (tasks, todos, focus, journal, checkins, goals)
- [x] **neuralAccess.ts** — `getNeuralKey()`, `setNeuralKey()`, `getNeuralProvider()`
- [x] **Login** — setup pantalla única sin email/password
- [x] **routes.jsx** — `/register` y `/awaiting-command` → redirect `/dashboard`

---

## Items completados en cierre de Capa 3

- [x] **DailyStandup** — 11 translation keys añadidas al `es` dict
- [x] **HabitTracker** — ya usa `completedDates` reales del slice; confirmado correcto
- [x] **FinanceHub** — `t('Saldo Libre')` → `t('Free Balance')`, `t('Salud Financiera')` → `t('Financial Health')`
- [x] **SpendingCharts** — acepta prop `selectedMonth` del hub, donut refleja mes seleccionado
- [x] **SpendingCharts keys** — `'Spending Charts'`, `'No expenses recorded yet.'`, `'Other'` añadidas

---

## APK Build Checklist

1. `npm run build` → 0 errores ✅
2. Configurar secrets en GitHub Actions: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`
3. `npx cap sync android`
4. Android Studio → Build → Generate Signed Bundle/APK
   — O: `./gradlew bundleRelease` desde `android/`
