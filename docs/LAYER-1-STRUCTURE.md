# Capa 1 — Structure (Navegación y Layout) ✅

## Qué es esta capa
Estructura visible de la app: cómo se navega, cómo se organiza el layout, y qué pasa cuando algo falla.

## Estado: COMPLETA

## Qué se hizo

### Routing
- [x] Hash-based routing con `createHashRouter` (funciona en APK)
- [x] 30 rutas lazy-loaded con React.lazy + Suspense
- [x] PageLoader (Skeleton) como fallback de carga
- [x] `/login` → setup first-time (single-user, sin auth real)
- [x] `/register`, `/awaiting-command` → redirect a `/dashboard`
- [x] AppRouteError component para errores de ruta

### Layout
- [x] `Layout.jsx` con `<Navbar>` + `<Outlet>` + `<Omnibar>`
- [x] `ErrorBoundary` envolviendo cada sección por separado (Navbar, Outlet, Omnibar)
- [x] `ErrorBoundary key={location.pathname}` — cada ruta es independiente

### Navbar
- [x] 3 grupos dropdown: Work, Personal, Finance
- [x] Badges de notificaciones (pagos/todos/notas con fecha próxima)
- [x] Toggle de idioma EN/ES integrado
- [x] Responsive mobile menu con hamburger
- [x] Links: Calendar, Notifications, Settings, Stats, Identity, Profile

### Login (single-user setup)
- [x] Si hay perfil → redirect a `/dashboard`
- [x] Si es primera vez → formulario de nombre → dispatch `loginUser`

## Archivos clave
- `src/routes.jsx`
- `src/pages/Layout.jsx`
- `src/components/Navbar.jsx`
- `src/pages/Login.jsx`
- `src/components/ErrorBoundary/ErrorBoundary.jsx`
