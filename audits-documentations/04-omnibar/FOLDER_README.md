# 04 — Omnibar

The Omnibar is ATHENEA's primary interaction surface — a floating modal that accepts natural language, voice input, and displays AI responses with executable actions.

## Documents in this folder

| File | Description |
|------|-------------|
| [INTEGRATION_GUIDE.md](INTEGRATION_GUIDE.md) | How to integrate the Omnibar component |
| [OMNIBAR_AUDIT.md](OMNIBAR_AUDIT.md) | Full feature audit |
| [OMNIBAR_INTEGRATION_SUMMARY.md](OMNIBAR_INTEGRATION_SUMMARY.md) | Integration summary |

## Component Location

```
scope/src/components/Omnibar/
├── Omnibar.tsx          ← Main component (~1100 lines)
├── Omnibar.css          ← Styles
├── useOmnibar.ts        ← Open/close state hook
├── ActionChips.tsx      ← Quick action suggestions
├── InterceptCard.tsx    ← Proactive intercept UI
├── ProactiveHUD.tsx     ← Heads-up display
├── WarRoomView.tsx      ← Advanced mode view
└── FloatingOmnibarFab.jsx ← FAB trigger button
```

## Key Features

| Feature | Status | Notes |
|---------|--------|-------|
| Natural language → action | ✅ | Via AgentOrchestrator skill matching |
| Voice input (native) | ✅ | Capacitor SpeechRecognition |
| Hub tabs (Work/Finance/Personal) | ✅ | Routes to correct agent |
| Chat history persistence | ✅ | Saved to `aiMemory.omnibarChatHistory` |
| Skill suggestion chips | ✅ | Shown when input is empty |
| Canvas artifact forms | ✅ | Forms for skill execution |
| Advanced War Room mode | ✅ | Toggle via `advancedMode` in settings |
| Proactive intercept | ✅ | `InterceptCard` for agent alerts |

## Known Fixed Bugs

### OMNI-FIX (2026-03-23)
**Problem**: Opening the Omnibar would immediately show a task creation form.
**Root cause**: Chat history was persisted to Redux including messages with `artifact` (forms). On re-open, the form was restored.
**Fix**: Filter messages with `artifact` when saving AND restoring history. Also reset `activeInsight` and `activeInsightArtifact` on open.

```ts
// On open — restore text-only messages
setChatMessages(savedChatHistory.filter((m) => !m.artifact));
// On close — save text-only messages
dispatch(updateOmnibarChatHistory(
  chatMessages.filter((m) => !m.artifact).slice(-20)
));
```

## Opening the Omnibar

```ts
// From anywhere in the app
import { useOmnibar } from '../components/Omnibar/useOmnibar';
const { openOmnibar } = useOmnibar();
openOmnibar('WorkHub'); // or 'FinanceHub' | 'PersonalHub'

// With a pre-filled prompt
openOmnibar('WorkHub', 'add task buy groceries tomorrow');
```

## Widget Integration

Widget actions (taps on Android home screen widgets) route through `useAppWidgetSync.ts` → `onAction` callback → `openOmnibarExternally()`.
