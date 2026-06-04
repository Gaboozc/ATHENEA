# 02 — Architecture

## Documents in this folder

| File | Description |
|------|-------------|
| [LAYERS.md](LAYERS.md) | Progressive development layers (0–5) |
| [REDUX_INTEGRATION_GUIDE.md](REDUX_INTEGRATION_GUIDE.md) | Redux store structure and slice guide |
| [INTELLIGENCE_MODULE.md](INTELLIGENCE_MODULE.md) | AI intelligence module architecture |

## System Architecture

```
┌──────────────────────────────────────────────────────┐
│  ATHENEA — System Architecture                       │
├──────────────────────────────────────────────────────┤
│                                                      │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐  │
│  │  Work Hub   │  │Finance Hub  │  │Personal Hub │  │
│  │  MyTasks    │  │  Wallets    │  │  Journal    │  │
│  │  Projects   │  │  Expenses   │  │  Routines   │  │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘  │
│         └────────────────┼────────────────┘          │
│                          ▼                           │
│              ┌───────────────────────┐               │
│              │     Redux Store       │               │
│              │  16+ slices / persist │               │
│              └───────────┬───────────┘               │
│                          ▼                           │
│         ┌────────────────────────────────┐           │
│         │       AgentOrchestrator        │           │
│         │  buildAgentContext() → LLM API │           │
│         └────────┬──────────┬────────────┘           │
│                  ▼          ▼                        │
│           ┌──────────┐  ┌──────────────────────┐    │
│           │  Omnibar │  │  NotificationEngine  │    │
│           │ (active) │  │  (native + in-app)   │    │
│           └──────────┘  └──────────────────────┘    │
│                                                      │
│         ┌────────────────────────────────┐           │
│         │      Capacitor Layer           │           │
│         │  LocalNotifications · Prefs    │           │
│         │  Geolocation · Widgets (9)     │           │
│         └────────────────────────────────┘           │
└──────────────────────────────────────────────────────┘
```

## Redux Store — Slice Map

| Slice | State Key | Purpose |
|-------|-----------|---------|
| `userSettingsSlice` | `userSettings` | Identity, agent names, timezone, context |
| `tasksSlice` | `tasks` | Tasks, subtasks, sub-subtasks |
| `projectsSlice` | `projects` | Projects + members |
| `focusSlice` | `focus` | Focus sessions, Pomodoro |
| `walletsSlice` | `wallets` | Crypto/fiat wallets |
| `expensesSlice` | `expenses` | Expense tracking |
| `goalsSlice` | `goals` | Financial goals |
| `calendarSlice` | `calendar` | Events + Google Calendar sync |
| `routinesSlice` | `routines` | Daily routine habits |
| `journalSlice` | `journal` | Journal entries |
| `checkinsSlice` | `checkins` | Daily mood check-ins |
| `notificationsSlice` | `notifications` | In-app notification history |
| `collaboratorsSlice` | `collaborators` | Team collaborators |
| `aiMemorySlice` | `aiMemory` | Omnibar chat history, intercepts |

## Key Design Decisions

- **Local-first**: No cloud backend. Data in device via `redux-persist` + Capacitor Preferences.
- **Single user**: No auth flow. Name stored in localStorage → redirects to `/dashboard`.
- **AI as middleware**: Agents don't store data — they read Redux state and dispatch actions.
- **Context injection**: `buildAgentContext()` in AgentOrchestrator reads `userSettings` (occupation, mainGoal, financialContext, timezone) and injects into every LLM system prompt.
