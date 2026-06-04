# ATHENEA — Documentation Index
> Last updated: 2026-03-23 | Status: Layer 4 Intelligence (Active Development)

## What is ATHENEA?

ATHENEA is a local-first, single-user AI-powered personal operating system built with React + Vite + Capacitor for Android. It integrates three specialized AI agents (Cortana, Jarvis, SHODAN) that proactively manage productivity, finance, and personal wellbeing.

---

## Documentation Map

| Folder | Area | Key Docs |
|--------|------|----------|
| [01-overview/](01-overview/) | Project overview, quick start, feature list | README, QUICK_START, FEATURES |
| [02-architecture/](02-architecture/) | System layers, Redux store, Intelligence module | LAYERS, REDUX_GUIDE, INTELLIGENCE_MODULE |
| [03-ai-agents/](03-ai-agents/) | Cortana / Jarvis / SHODAN specs, autonomous flow | AGENTS, AUTONOMOUS_FLOW, EXAMPLES |
| [04-omnibar/](04-omnibar/) | Omnibar component, integration, audit | INTEGRATION_GUIDE, AUDIT, SUMMARY |
| [05-modules/](05-modules/) | Feature modules per domain | finance/, work/, personal/, calendar/ |
| [06-ui-ux/](06-ui-ux/) | UI/UX audit, design system | UI_AUDIT, UX_AUDIT |
| [07-android-deployment/](07-android-deployment/) | APK build, signing, installation | APK_BUILD_GUIDE, APK_SETUP |
| [08-integrations/](08-integrations/) | API keys, OpenClaw, server setup | API_KEY_SETUP, OPENCLAW, SERVER |
| [09-audits/](09-audits/) | Project audits, status reports | GENERAL_AUDIT, COMPLETE_STATUS |
| [10-web/](10-web/) | Web deployment guide | WEB_GUIDE |

---

## Project Status (2026-03-23)

```
Layer 0 — Foundation          ✅ Complete
Layer 1 — Structure           ✅ Complete
Layer 2 — UI/UX               ✅ Complete
Layer 3 — Functionality       ✅ Complete
Layer 4 — Intelligence (AI)   🔧 Active — agents wired, APK pending signature
Layer 5 — Polish & Production 🔲 Next
```

### Completed This Sprint
- ✅ 9 native Android widgets wired (DailyFocus, FinanceSnapshot, etc.)
- ✅ MyTasks 5-bug fix (looping, focus stealing, views, level badge, collaborators)
- ✅ Identity Hub complete redesign (agent names, timezone, context injection)
- ✅ Notification system redesigned (native tray + in-app history)
- ✅ Omnibar form-restore bug fixed (artifacts filtered from history)

### Pending
- ⚠️ APK keystore signing (required for Play Store)
- ⚠️ Empty states in Journal, MyTasks, Todos
- ⚠️ Google Calendar Client ID configuration

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Frontend | React 18 + Vite + TypeScript |
| State | Redux Toolkit (16+ slices) |
| Mobile | Capacitor 6 (Android) |
| AI | OpenAI / Groq via `neuralAccess.ts` |
| Notifications | @capacitor/local-notifications |
| Calendar | Google Calendar API (OAuth 2.0) |
| Styling | CSS Variables (dark theme) |

---

## Key Files Quick Reference

| File | Purpose |
|------|---------|
| `scope/src/modules/intelligence/agents/AgentOrchestrator.ts` | Central AI routing, buildAgentContext() |
| `scope/src/store/slices/userSettingsSlice.ts` | User identity, agent names, context |
| `scope/src/components/Omnibar/Omnibar.tsx` | Main AI interaction interface |
| `scope/src/hooks/useAppWidgetSync.ts` | Redux → Android widgets bridge |
| `scope/src/modules/intelligence/notificationEngine.ts` | Native + in-app notifications |
| `scope/android/app/src/main/java/com/athenea/app/MainActivity.java` | Capacitor plugin registration |
| `scope/capacitor.config.ts` | App ID: com.athenea.app |
