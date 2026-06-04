# 01 — Project Overview

ATHENEA is a local-first personal operating system for Android. No backend required — all data lives on-device via Redux Persist + Capacitor Preferences.

## Documents in this folder

| File | Description |
|------|-------------|
| [README.md](README.md) | Original project README (template base) |
| [README.es.md](README.es.md) | Spanish version |
| [QUICK_START.md](QUICK_START.md) | Get up and running in 5 minutes |
| [FEATURES_IMPLEMENTED.md](FEATURES_IMPLEMENTED.md) | Complete list of implemented features |
| [NUEVAS_FUNCIONALIDADES.md](NUEVAS_FUNCIONALIDADES.md) | New features changelog |

## Core Concept

```
User → Omnibar (natural language) → AgentOrchestrator → Skill execution → Redux dispatch
                                  ↓
                    Proactive notifications (native Android tray)
```

Three AI agents operate in parallel:
- **Cortana** 🧿 — Productivity strategist (Work hub)
- **Jarvis** 🤖 — Financial auditor (Finance hub)
- **SHODAN** 👁️ — Wellbeing monitor (Personal hub)

## Quick Entry Points

| Command | Purpose |
|---------|---------|
| `cd scope && npm run dev` | Web dev server |
| `npm run build && npx cap sync android` | Sync to Android |
| Open Android Studio → Run | Deploy to device/emulator |

## Current State (2026-03-23)

- **App ID**: `com.athenea.app`
- **Build**: ✅ 0 errors
- **Layer**: 4 — Intelligence (active)
- **APK**: ⚠️ Pending keystore signing
- **Fases completadas**: 9/10
