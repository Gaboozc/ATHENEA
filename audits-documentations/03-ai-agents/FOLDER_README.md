# 03 — AI Agents

## Documents in this folder

| File | Description |
|------|-------------|
| [AGENTS.md](AGENTS.md) | Agent specs from ai-specs-main |
| [AI_SPECS_README.md](AI_SPECS_README.md) | AI specs project overview |
| [AUTONOMOUS_FLOW_GUIDE.md](AUTONOMOUS_FLOW_GUIDE.md) | How autonomous agent decisions work |
| [AUTONOMOUS_EXAMPLES.md](AUTONOMOUS_EXAMPLES.md) | Real examples of agent interactions |

## The Three Agents

### 🧿 Cortana — Productivity Strategist
- **Hub**: Work
- **Triggered by**: Task mentions, deadlines, work context
- **Context used**: `occupation`, `mainGoal`, `workingHours`, `timezone`
- **Key behaviors**:
  - Prioritizes tasks aligned to `mainGoal`
  - Respects `workingHours` for work alerts
  - Uses `agentNames.cortana` as display name
  - Addresses user as `agentAliases.cortana`

### 🤖 Jarvis — Financial Auditor
- **Hub**: Finance
- **Triggered by**: Expense patterns, wallet balances, debt alerts
- **Context used**: `financialContext`, `additionalContext`
- **Key behaviors**:
  - Adjusts recommendations based on `financialContext` (growth/saving/stable/recovery/investing)
  - Generates proactive spending alerts
  - Uses `agentNames.jarvis` as display name

### 👁️ SHODAN — Wellbeing Monitor
- **Hub**: Personal
- **Triggered by**: Journal patterns, routine completion, mood check-ins
- **Context used**: `additionalContext`, geofencing zones
- **Key behaviors**:
  - Monitors routine completion streaks
  - Cross-references location (home/work) with activity
  - Uses `agentNames.shodan` as display name

## Agent Data Flow

```
User opens app
      ↓
AppInitializer.ts
      ↓ (every 15 min or on hub change)
AgentOrchestrator.evaluateProactively()
      ↓
buildAgentContext() — reads userSettings from Redux
      ↓
LLM API (OpenAI / Groq via neuralAccess.ts)
      ↓
PersonaResponse { briefing, suggestion, emotionalTone, agency }
      ↓
NotificationEngine.sendTacticalNotification()
      ↓  ↓
Native Android tray   Redux notificationsSlice
```

## Skill System

Skills are pre-defined actions the agents can execute via natural language in the Omnibar:

| Skill | Agent | Action |
|-------|-------|--------|
| Add Task | Cortana | Dispatches `tasks/add` |
| Complete Task | Cortana | Dispatches `tasks/complete` |
| Add Expense | Jarvis | Dispatches `expenses/add` |
| Log Mood | SHODAN | Dispatches `checkins/add` |
| Start Focus | Cortana | Dispatches `focus/start` |
| Add Journal Entry | SHODAN | Dispatches `journal/add` |

## Persona Customization

Users can rename agents and set custom aliases in Identity Hub:
```ts
// userSettingsSlice state
agentNames: { cortana: 'Max', jarvis: 'Alfred', shodan: 'Oracle' }
agentAliases: { cortana: 'Chief', jarvis: 'Sir', shodan: 'Insect' }
```

These are injected into every system prompt automatically via `buildAgentContext()`.
