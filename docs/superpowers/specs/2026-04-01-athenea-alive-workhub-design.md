# Athenea — "Alive" Intelligence + WorkHub Command Center

**Date:** 2026-04-01  
**Status:** Approved by user  
**Scope:** Two parallel improvements — making Athenea feel genuinely intelligent, and upgrading WorkHub from navigation page to command center.

---

## Problem Statement

### Intelligence Problems
1. **Persona bleed:** Calling "Cortana" explicitly can result in SHODAN responding because the LLM's `[CONTROL:X]` mechanism overrides the user's explicit intent.
2. **No conversation memory:** Each message arrives at the LLM stateless. `conversationHistory[]` exists in `Bridge.ts` but is never passed to `callLLM()`. The model has no memory of what was said 2 messages ago.
3. **Responses appear all at once:** 1-2 second wait then full text — feels like a machine, not a conversation.

### WorkHub Problems
4. **Navigation-only page:** 4 buttons to go elsewhere, 2 stat numbers. No actionable content.
5. **No urgency visibility:** Overdue tasks and today's deadlines are invisible until navigating to My Tasks.
6. **No inline actions:** Cannot complete or start a task without leaving WorkHub.

---

## Architecture

### Affected Files
- `src/modules/intelligence/personaEngine.ts` — persona lock + streaming
- `src/modules/intelligence/Bridge.ts` — memory injection + stale comment fix
- `src/pages/WorkHub.jsx` — full UI redesign
- `src/modules/intelligence/agents/AgentOrchestrator.ts` — require() → import fix

---

## Section 1 — Persona Lock with Field Note

### Behavior
When `detectPersonaFromPrompt()` returns a non-null persona (user explicitly named an agent):

1. **Persona lock activates.** The system prompt changes to hard-lock mode:
   - `"Eres [Agent]. TÚ eres el único que responde. El mecanismo [CONTROL:X] está desactivado para este mensaje. Los otros agentes NO pueden tomar el control."`
2. **`[CONTROL:X]` parsing is skipped** for this call — the extracted tag is ignored even if the LLM emits one.
3. **Critical alert exception:** If ANY of these hard thresholds are exceeded, the non-primary agent may append exactly one line prefixed with `⚠️ [AgentName]:`:
   - Battery < 5%
   - Sleep hours registered < 4 (from `sensorData.health.sleepHours`)
   - Budget exceeded > 150% of limit
   - 5+ overdue tasks (for SHODAN field note only)

### What does NOT change
- When no agent is named explicitly, the orchestrator's existing behavior is unchanged.
- The `[CONTROL:X]` mechanism still works for non-explicit calls.

### Implementation touch points
- `personaEngine.ts` → `queryDomainAdvisor()`: add `isPersonaLocked: boolean` parameter
- `personaEngine.ts` → `generateResponseWithLLM()`: add `isPersonaLocked` guard before `[CONTROL:X]` parsing
- `Bridge.ts` → `handleConversationalQuestion()`: pass `explicitPersona !== null` as lock flag

---

## Section 2 — Conversation Memory (3 layers, Groq-optimized)

### Layer 1 — Session history (resets on Omnibar close)
The last 8 messages from the current Omnibar session are passed as the real `messages[]` array to the LLM — not injected as text into the system prompt.

```
messages: [
  { role: "system", content: systemPrompt },
  { role: "user",   content: "cortana cómo voy con el proyecto Alpha?" },
  { role: "assistant", content: "Alpha tiene 2 tareas vencidas..." },
  { role: "user",   content: "y cuál debería atacar primero?" },   ← current
]
```

**Storage:** React state in Omnibar component (already exists as `chatMessages[]`). Map to `{ role, content }` before sending.  
**Token budget:** ~800 tokens max for 8 messages.

### Layer 2 — Live data snapshot (always fresh)
`buildContextualSystemPrompt()` already exists but is not wired into the main `queryDomainAdvisor()` → `callLLM()` path consistently. Wire it properly so every LLM call receives:
- Overdue tasks (titles, count)
- Budget status (spent / limit)
- Today's routines (completed / total)
- Last check-in energy level

**Token budget:** max 400 tokens. Already implemented — just needs consistent connection.

### Layer 3 — Persistent memory across sessions (agentMemory in Redux)
`agentMemory.cortana/jarvis/shodan.recentContext` and `.patterns[]` already exist in `aiMemorySlice.ts`. Two missing pieces:

**Write:** When Omnibar closes (`isOpen` goes false), generate a 1-2 sentence summary of the session and dispatch `updateAgentMemory()` for the active agent.

**Read:** Already wired into `buildContextualSystemPrompt()` — just needs the write side to populate it.

**Format injected into system prompt:**
```
Lo que recuerdas del usuario: mencionó proyecto Alpha como crítico, lleva 2 días con fatiga alta.
Patrones observados: abre WorkHub los lunes, pregunta sobre budget los viernes.
```

**Token budget:** max 200 tokens.

### Total overhead per call
| Layer | Tokens | Latency on Groq |
|-------|--------|-----------------|
| Session history (8 msgs) | ~800 | +200ms |
| Live snapshot | ~400 | +50ms |
| Persistent memory | ~200 | +30ms |
| **Total** | **~1,400** | **+280ms max** |

Groq free tier handles this comfortably (131K context, 30 req/min).

### Session history storage
The `chatMessages[]` array in `Omnibar.tsx` is already the source of truth. On submit, pass the last 8 messages (excluding typing indicators) as `conversationHistory` to `sendPrompt()` → `intelligenceBridge.processPrompt()` → `queryDomainAdvisor()`.

---

## Section 3 — Response Streaming

### Behavior
`callLLM()` in `personaEngine.ts` gains a streaming mode:
- Adds `stream: true` to the request body
- Reads `response.body` as `ReadableStream`, parsing SSE chunks
- Calls `onToken(chunk: string)` callback for each delta
- Returns full text on completion (fallback: non-streaming if `onToken` not provided)

Both Groq and OpenAI APIs support this with identical SSE format.

### UX change in Omnibar
When agent is responding:
1. Agent bubble appears immediately with a blinking cursor `▌`
2. Text fills in token by token
3. `isLoading` stays true until stream ends
4. Voice button and submit disabled during stream (already handled by `isLoading`)

**Time to first letter:** ~300ms (down from ~1.5s). This is the change that makes Athenea feel alive.

### Implementation touch points
- `personaEngine.ts` → `callLLM()`: add optional `onToken?: (chunk: string) => void` param, add streaming branch
- `useIntelligence.ts` → `sendPrompt()`: accept and thread `onToken` callback
- `Omnibar.tsx` → `handleSubmitPrompt()`: create agent message bubble immediately, update text incrementally via `onToken`

### Fallback
If `ReadableStream` is not available (old Android WebView), falls back to non-streaming call silently. No error shown.

---

## Section 4 — WorkHub Command Center

### New layout structure
```
WorkHub
├── Situation Report (4 stat pills)
├── Cortana Briefing (existing, unchanged)
├── Daily Standup (existing, unchanged)
├── Action List (replaces Today's Focus)
├── Active Projects (improved)
└── Navigation buttons (existing, unchanged)
```

### Situation Report (replaces 2-stat block)
Four pills, color-coded by urgency:

| Stat | Color when > 0 | Color when 0 |
|------|---------------|-------------|
| Overdue | 🔴 red | gray |
| Due Today | 🟡 amber | gray |
| In Progress | 🔵 blue | gray |
| Done This Week | green (always) | gray |

### Action List (replaces Today's Focus)
**Sort order:** overdue first (by how many days late), then due today, then by priority level, then by creation date.

**Per task row:**
- Urgency indicator: `⚠️` (overdue), `🕐` (due today), nothing (future)
- Task title (clickable → navigates to project or `/my-tasks`)
- Priority badge (existing `level-*` CSS classes, unchanged)
- Due date text: "Vencida ayer", "Vence hoy 18:00", "Mañana", "15 abr"
- `[✓]` button → dispatches `tasks/completeTask` or `tasks/updateTask` with `status: 'Completed'`
- `[▶]` button → dispatches `tasks/updateTask` with `status: 'In Progress'` (hidden if already in progress)

**Limit:** 7 tasks visible. "Ver todas →" link to `/my-tasks` below.

**Inline action dispatch:** Uses `useDispatch` directly in WorkHub — no navigation required.

### Active Projects (minor improvement)
Each project card shows the single most urgent open task beneath the project name:
```
📁 Athenea v2    [Active]
   └─ Fix auth bug — vence hoy
```
If no open tasks: `└─ Sin tareas abiertas` in gray.
Max 3 projects shown (unchanged).

---

## Section 5 — Technical Coherence Fixes

### 5a — Remove `require()` from ES modules
**Files:** `personaEngine.ts` lines ~458, ~546  
**Fix:** Replace `require('./agents/AgentOrchestrator')` with the singleton import `import { getAgentOrchestrator } from './agents/AgentOrchestrator'` that is already used elsewhere in the same file's constructor area.

### 5b — Stale comment in Bridge.ts
**File:** `Bridge.ts` line ~185  
**Fix:** Update comment from `// threshold 70` to `// threshold 90` to match the constant.

### 5c — Raise max_tokens from 240 to 380
**File:** `personaEngine.ts` → `callLLM()`  
**Reason:** With 3-layer context, the model occasionally truncates mid-response at 240 tokens. 380 tokens ≈ 5-6 sentences — concise but complete.

---

## Data Flow (after changes)

```
User types "Cortana, ¿cómo voy con Alpha?"
    ↓
Omnibar.handleSubmitPrompt()
    ↓ passes last 8 chatMessages as conversationHistory
useIntelligence.sendPrompt()
    ↓
Bridge.processPrompt()
    ├── detectPersonaFromPrompt() → "cortana" (explicit)
    ├── trySkillFirstRoute() → null (conversational question)
    └── handleConversationalQuestion(isPersonaLocked=true)
            ↓
        personaEngine.queryDomainAdvisor(
            persona="cortana",
            isPersonaLocked=true,
            conversationHistory=[...8 msgs],
            systemPrompt=[lock prompt + live snapshot + persistent memory]
        )
            ↓
        callLLM(onToken=cb) → streaming
            ↓
        Omnibar updates bubble token by token
```

---

## What is NOT in scope
- Dark mode
- Collaborative features (shared projects)
- ONNX model loading on Web Worker
- Virtual scrolling for large lists
- Test coverage improvements

These are valid but separate projects.

---

## Success Criteria
1. Calling "Cortana" always results in Cortana's voice — SHODAN can only add a field note, never take over
2. In the same Omnibar session, asking "y la anterior?" gets a coherent answer referencing what was just said
3. Reopening Athenea next day, Cortana can reference something from the previous session
4. First visible character of response appears within 400ms on Groq
5. WorkHub shows overdue tasks with red indicator without navigating away
6. Can mark a task as done from WorkHub in one tap
