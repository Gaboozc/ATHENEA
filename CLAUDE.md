# ATHENEA — Guía de rutas para Claude Code

## Estructura del proyecto

  Athenea/                    ← RAÍZ (aquí abre Claude Code)
  ├── scope/                  ← CÓDIGO FUENTE de ATHENEA
  │   ├── src/                ← React + TypeScript
  │   ├── store/              ← Redux slices
  │   ├── android/            ← Capacitor Android
  │   ├── package.json        ← dependencias
  │   └── vite.config.js      ← configuración Vite
  ├── athenea-ds/             ← Design system
  │   └── src/                ← tokens, components
  ├── audits-documentations/  ← Documentación
  └── CLAUDE.md               ← este archivo

## Reglas críticas

1. SIEMPRE ejecutar `cd scope` antes de cualquier comando npm
2. El comando correcto es: `cd scope && npm run build`
3. NUNCA hacer `cd scope/scope` — eso no existe
4. El design system está en `../athenea-ds/` relativo a scope/
5. Los archivos de la app están en `scope/src/`
6. Los slices de Redux están en `scope/store/`

## Comandos correctos

  # Build
  cd scope && npm run build

  # Dev server
  cd scope && npm run dev

  # Sync Android
  cd scope && npx cap sync android

  # Build APK
  cd scope/android && ./gradlew assembleDebug

## Stack

- React 18 + Vite + TypeScript
- Redux Toolkit + redux-persist
- Capacitor 6 (Android + iOS futuro)
- Ollama local como LLM (llama3.2:3b)
- Design system: athenea-ds/

## Arquitectura del proyecto
Lee `ARCHITECTURE.md` antes de modificar cualquier archivo.

God nodes críticos (tocar con precaución extrema):
- personaEngine.ts — motor central, conecta agentes + LLM + memoria + UI
- aiMemorySlice — hub de memoria, impacta los 3 agentes
- LLMClient.ts — bottleneck de inferencia, cambios afectan latencia

Regla de oro: si el archivo que vas a editar aparece en ARCHITECTURE.md como god node
o dependencia crítica, detente y describe el cambio primero antes de ejecutarlo.
