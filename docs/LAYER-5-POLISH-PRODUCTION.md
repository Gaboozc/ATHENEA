# Capa 5 — Polish & Production (APK firmado + i18n completo) 🔲

## Qué es esta capa
La app está pulida, completa en ambos idiomas, y el APK está firmado y listo para distribución.

## Estado: PENDIENTE

## Plan

### i18n Completo
- [x] **Settings.jsx** — 20+ strings hardcodeadas en español/inglés → t() (AI section, backup, danger zone)
- [x] **Intelligence.jsx** — mensajes en español → t(), time stamps, filtros de hub/severity
- [x] **Journal.jsx** — autosave indicator `Guardando…/Guardado` → t()
- [x] **AgentOrchestrator** — strings de diálogo interno en español → inglés
- [x] **LanguageContext** — +55 claves nuevas en dict `es`
- [x] **Navbar** — language toggle title/aria-label corregido; `t('Settings')`, `t('Statistics')`, `t('Identity')` en tooltips
- [x] **Calendar** — mes/año con `toLocaleDateString()` localizado; DAYS_OF_WEEK ya usaba `t(day)` ✅; `Monthly view` / `Agenda view` traducidos
- [x] **Notes** — `title={t(color.label)}` en color picker
- [x] **Color labels** — `Blue/Gold/Green/Orange/Red/Purple/Pink/Gray` en es dict
- [ ] Verificar EN/ES mode al 100% (test manual)

### Visual Polish
- [x] **Transiciones entre páginas** — `page-enter` (fade+slide 0.18s) en `.app-content > *`, dispara en cada route change por `key={pathname}`
- [x] **Focus-visible global** — outline cyan 2px en todos los elementos focusables (accesibilidad teclado)
- [x] **Botones** — transition global en hover/active/disabled; active scale(0.97) para feedback táctil
- [x] **Inputs/selects/textareas** — border-color + box-shadow transition en focus (cyan glow)
- [x] **Links** — transition opacity/color
- [ ] Loading states en formularios de submit (en progreso natural por Skeleton existente)
- [ ] Dark mode — ya es el único tema ✅

### Performance
- [x] **manualChunks en vite.config.js** — index.js 1,498 KB → 387 KB (74% reducción)
  - vendor-react: 196 KB, vendor-redux: 31 KB, vendor-ml: 814 KB (@xenova/transformers — inherente), vendor-pdf: 447 KB
- [x] Preload de rutas críticas (Dashboard, WorkHub, FinanceHub) — `window.load` + 1.5s delay en routes.jsx
- [ ] Optimizar imágenes y assets

### APK Producción
- [ ] Generar keystore: `keytool -genkey -v -keystore athenea.jks -alias athenea -keyalg RSA -keysize 2048 -validity 10000`
- [ ] Codificar: `base64 -i athenea.jks | pbcopy`
- [ ] Configurar GitHub Secrets: `KEYSTORE_BASE64`, `KEYSTORE_PASSWORD`, `KEY_ALIAS`, `KEY_PASSWORD`
- [ ] Push tag `v1.0.0` → trigger release workflow automático
- [ ] Verificar APK firmado en GitHub Actions artifacts

### PWA
- [x] **`public/manifest.json`** — name, icons, theme_color, shortcuts (WorkHub, FinanceHub)
- [x] **`public/sw.js`** — Service Worker: cache-first assets, network-first navigation, offline fallback
- [x] **`index.html`** — `<link rel="manifest">`, `theme-color`, apple-touch-icon
- [x] **`main.jsx`** — registro del SW en window `load`
- [ ] Install banner en Chrome/Safari (automático con manifest correcto)

### Testing final
- [ ] `npm run build` → 0 errores
- [ ] Chrome DevTools 375px → layout correcto en todos los hubs
- [ ] Settings → configurar API key → agente responde en Omnibar
- [ ] Calendar → conectar Google → eventos con badge "Google" visibles
- [ ] Crash intencional → ErrorBoundary muestra fallback

## Archivos clave
- `android/app/build.gradle` — signingConfig ✅
- `.github/workflows/build-release-apk.yml` ✅
- `src/context/LanguageContext.jsx` — agregar 300+ claves
- `vite.config.js` — manualChunks para dividir bundle
