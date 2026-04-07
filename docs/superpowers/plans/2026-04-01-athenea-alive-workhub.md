# Athenea Alive + WorkHub Command Center — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Athenea feel genuinely alive — persona lock, 3-layer memory, token streaming — and upgrade WorkHub from navigation page to actionable command center.

**Architecture:** Five independent layers each with a clear boundary: (1) `callLLM()` gains history + streaming params, becoming the foundation; (2) persona lock hardens the system prompt before the LLM call; (3) memory wiring threads `chatMessages[]` from Omnibar all the way to `callLLM()`; (4) streaming threads an `onToken` callback the same path; (5) WorkHub gets new memos and inline dispatch, independent of intelligence changes.

**Tech Stack:** TypeScript (strict where existing), React 18, Redux Toolkit, Groq/OpenAI SSE, Vite 5, React Router v6.

---

## File Map

| File | Change |
|------|--------|
| `src/modules/intelligence/personaEngine.ts` | Fix `require()` × 2; raise `max_tokens`; add `isPersonaLocked` + history + streaming to `queryDomainAdvisor()` + `callLLM()` |
| `src/modules/intelligence/Bridge.ts` | Fix stale comment; pass `isPersonaLocked`; pass `conversationHistory` and `onToken` through to `queryDomainAdvisor()` |
| `src/modules/intelligence/types.ts` | Add `conversationHistory` field to `IntelligenceRequest` |
| `src/modules/intelligence/useIntelligence.ts` | Accept `onToken` callback in `sendPrompt()` options; thread it to `processPrompt()` |
| `src/components/Omnibar/Omnibar.tsx` | Pass last-8-messages as `conversationHistory`; create streaming bubble; fill with `onToken`; write session summary to `agentMemory` on close |
| `src/pages/WorkHub.jsx` | 4 stat pills; Action List with inline ✓/▶; Active Projects with urgent-task preview |

---

## Task 1 — Technical Coherence Fixes

**Files:**
- Modify: `src/modules/intelligence/personaEngine.ts` (lines ~458, ~546, ~976)
- Modify: `src/modules/intelligence/Bridge.ts` (line ~185)

These are isolated one-liner fixes. No new logic. Do them first so later tasks build on clean code.

- [ ] **Step 1.1 — Fix first `require()` in personaEngine.ts**

  Open `src/modules/intelligence/personaEngine.ts`. Find the block around line 456–474 (inside `generateResponse()`):
  ```typescript
  // @ts-ignore
  const { getAgentOrchestrator } = require('./agents/AgentOrchestrator');
  const orchestrator = getAgentOrchestrator();
  ```
  Replace with:
  ```typescript
  const orchestrator = getAgentOrchestrator();
  ```
  The `getAgentOrchestrator` singleton import is already at the top of `personaEngine.ts`? Actually no — it is imported in `Bridge.ts` but NOT in `personaEngine.ts`. Add the import at the top of `personaEngine.ts`, after the existing imports:
  ```typescript
  import { getAgentOrchestrator } from './agents/AgentOrchestrator';
  ```
  Then remove the `require()` line and the `// @ts-ignore` comment above it.

- [ ] **Step 1.2 — Fix second `require()` in personaEngine.ts**

  Find the second require block around line 544–553 (inside `generateResponseWithLLM()`):
  ```typescript
  // @ts-ignore - runtime singleton accessor
  const { getAgentOrchestrator } = require('./agents/AgentOrchestrator');
  const orchestrator = getAgentOrchestrator();
  ```
  Replace with:
  ```typescript
  const orchestrator = getAgentOrchestrator();
  ```
  (The import added in Step 1.1 covers both usages.)

- [ ] **Step 1.3 — Raise max_tokens from 240 to 380**

  In `callLLM()` (~line 976):
  ```typescript
  // Before
  max_tokens: 240,
  // After
  max_tokens: 380,
  ```

- [ ] **Step 1.4 — Fix stale comment in Bridge.ts**

  In `Bridge.ts` line ~185:
  ```typescript
  // Before
  // The useIntelligence hook will auto-execute (threshold 70) or show Canvas.
  // After
  // The useIntelligence hook will auto-execute (threshold 90) or show Canvas.
  ```

- [ ] **Step 1.5 — Verify build still compiles**

  ```bash
  cd scope && npm run build 2>&1 | tail -20
  ```
  Expected: build completes, no new TypeScript errors related to `getAgentOrchestrator`.

- [ ] **Step 1.6 — Commit**

  ```bash
  git add src/modules/intelligence/personaEngine.ts src/modules/intelligence/Bridge.ts
  git commit -m "fix: replace require() with ES import in personaEngine, raise max_tokens to 380, fix stale threshold comment"
  ```

---

## Task 2 — Extend callLLM() for History and Streaming

**Files:**
- Modify: `src/modules/intelligence/personaEngine.ts` (`callLLM()` only)

`callLLM()` is the single choke-point for all LLM calls. Add two optional parameters here and all callers gain the capability with zero friction.

- [ ] **Step 2.1 — Replace `callLLM()` signature and body**

  Find the existing `callLLM()` method at line ~955. Replace the entire method with:

  ```typescript
  private async callLLM(
    config: LLMConfig,
    systemPrompt: string,
    userPrompt: string,
    options?: {
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
      onToken?: (chunk: string) => void;
    }
  ): Promise<string> {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15000);

    const endpoint =
      config.provider === 'groq'
        ? 'https://api.groq.com/openai/v1/chat/completions'
        : 'https://api.openai.com/v1/chat/completions';

    const model = config.provider === 'groq' ? 'llama-3.1-8b-instant' : 'gpt-4o-mini';

    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...(options?.conversationHistory ?? []),
      { role: 'user' as const, content: userPrompt },
    ];

    const useStreaming = typeof options?.onToken === 'function';

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${config.apiKey}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.65,
          max_tokens: 380,
          stream: useStreaming,
          messages,
        }),
        signal: controller.signal,
      });

      if (!response.ok) {
        throw new Error(`LLM request failed: ${response.status}`);
      }

      if (useStreaming && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullText = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const raw = decoder.decode(value, { stream: true });
          for (const line of raw.split('\n')) {
            const trimmed = line.trim();
            if (!trimmed.startsWith('data: ')) continue;
            const data = trimmed.slice(6);
            if (data === '[DONE]') break;
            try {
              const json = JSON.parse(data);
              const token: string = json?.choices?.[0]?.delta?.content ?? '';
              if (token) {
                fullText += token;
                options!.onToken!(token);
              }
            } catch {
              // malformed SSE chunk — skip
            }
          }
        }

        if (!fullText) throw new Error('Empty streaming response');
        return fullText;
      }

      // Non-streaming path (fallback or when onToken not provided)
      const json = await response.json();
      const content = String(json?.choices?.[0]?.message?.content ?? '').trim();
      if (!content) throw new Error('Empty LLM content');
      return content;
    } finally {
      clearTimeout(timeout);
    }
  }
  ```

- [ ] **Step 2.2 — Verify TypeScript compiles**

  ```bash
  cd scope && npx tsc --noEmit 2>&1 | grep personaEngine
  ```
  Expected: no errors on `personaEngine.ts`.

- [ ] **Step 2.3 — Commit**

  ```bash
  git add src/modules/intelligence/personaEngine.ts
  git commit -m "feat: extend callLLM() to accept conversation history and SSE streaming callback"
  ```

---

## Task 3 — Persona Lock with Field Note

**Files:**
- Modify: `src/modules/intelligence/personaEngine.ts` (`queryDomainAdvisor()` only)
- Modify: `src/modules/intelligence/Bridge.ts` (`handleConversationalQuestion()` — persona lock propagation)

When the user explicitly calls an agent by name, the system prompt is hardened so the LLM cannot switch responders. A field note from another agent is still allowed under critical life-safety thresholds.

- [ ] **Step 3.1 — Add `isPersonaLocked` to `queryDomainAdvisor()`**

  Find the `queryDomainAdvisor()` signature at line ~750:
  ```typescript
  async queryDomainAdvisor(
    userPrompt: string,
    domainContext: {
      hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub';
      summary: string;
      facts: Record<string, unknown>;
    },
    requestedPersona: 'jarvis' | 'cortana' | 'shodan'
  ): Promise<string>
  ```
  Replace with:
  ```typescript
  async queryDomainAdvisor(
    userPrompt: string,
    domainContext: {
      hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub';
      summary: string;
      facts: Record<string, unknown>;
    },
    requestedPersona: 'jarvis' | 'cortana' | 'shodan',
    options?: {
      isPersonaLocked?: boolean;
      conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
      onToken?: (chunk: string) => void;
    }
  ): Promise<string>
  ```

- [ ] **Step 3.2 — Inject lock preamble into system prompt**

  Inside `queryDomainAdvisor()`, just before the `if (requestedPersona === 'cortana')` block that builds `systemPrompt`, add:

  ```typescript
  const lockPreamble = options?.isPersonaLocked
    ? `Eres ${personaLabel}. TÚ eres el único que responde. El mecanismo [CONTROL:X] está desactivado para este mensaje. Los otros agentes NO pueden tomar el control.\n`
    : '';
  ```

  Then prepend `lockPreamble` to each persona's system prompt. The Cortana block currently is:
  ```typescript
  systemPrompt = [
    `Eres Cortana, el agente estratégico de ATHENEA. Asistes a ${addressee}.`,
    ...
  ].filter(Boolean).join('\n');
  ```
  Change to:
  ```typescript
  systemPrompt = [
    lockPreamble,
    `Eres Cortana, el agente estratégico de ATHENEA. Asistes a ${addressee}.`,
    ...
  ].filter(Boolean).join('\n');
  ```
  Apply the same `lockPreamble` prepend to the SHODAN and Jarvis blocks (same pattern — just add `lockPreamble,` as first array element in each persona's array).

- [ ] **Step 3.3 — Thread options to callLLM()**

  At the bottom of `queryDomainAdvisor()`, the existing call is:
  ```typescript
  return await this.callLLM(llmConfig, systemPrompt, userPromptStr);
  ```
  Replace with:
  ```typescript
  return await this.callLLM(llmConfig, systemPrompt, userPromptStr, {
    conversationHistory: options?.conversationHistory,
    onToken: options?.onToken,
  });
  ```

- [ ] **Step 3.4 — Append field note if critical thresholds exceeded**

  Still inside `queryDomainAdvisor()`, after the try/catch that produces the answer, add the field note logic. Replace the existing:

  ```typescript
  try {
    return await this.callLLM(llmConfig, systemPrompt, userPromptStr, {
      conversationHistory: options?.conversationHistory,
      onToken: options?.onToken,
    });
  } catch {
    return '';
  }
  ```

  With:

  ```typescript
  let answer = '';
  try {
    answer = await this.callLLM(llmConfig, systemPrompt, userPromptStr, {
      conversationHistory: options?.conversationHistory,
      onToken: options?.onToken,
    });
  } catch {
    return '';
  }

  // Field note: critical threshold exception — one line from another agent appended
  if (options?.isPersonaLocked && answer) {
    const state = this.store?.getState?.() as any;
    const batteryLevel: number = state?.sensorData?.battery?.level ?? 100;
    const sleepHours: number = state?.sensorData?.health?.sleepHours ?? 8;
    const budgets: any[] = state?.finance?.budgets ?? [];
    const overdueTasks: number = (() => {
      const tasks: any[] = state?.tasks?.tasks ?? [];
      return tasks.filter((t) => {
        const due = new Date(t?.dueDate || '').getTime();
        return !t?.completed && t?.status !== 'Completed' &&
          Number.isFinite(due) && due > 0 && due < Date.now();
      }).length;
    })();
    const budgetExceededPct: number = budgets.reduce((acc, b) => {
      if (!b?.limit || b.limit <= 0) return acc;
      return Math.max(acc, ((b.spent ?? 0) / b.limit) * 100);
    }, 0);

    const fieldNotes: string[] = [];
    if (batteryLevel < 5) {
      fieldNotes.push(`⚠️ Jarvis: Batería al ${batteryLevel}% — autonomía crítica.`);
    }
    if (sleepHours < 4) {
      fieldNotes.push(`⚠️ SHODAN: ${sleepHours}h de sueño detectadas — rendimiento cognitivo comprometido.`);
    }
    if (budgetExceededPct > 150) {
      fieldNotes.push(`⚠️ Jarvis: Presupuesto al ${Math.round(budgetExceededPct)}% — límite superado.`);
    }
    if (requestedPersona !== 'shodan' && overdueTasks >= 5) {
      fieldNotes.push(`⚠️ SHODAN: ${overdueTasks} tareas vencidas detectadas.`);
    }

    if (fieldNotes.length > 0) {
      answer = `${answer}\n${fieldNotes[0]}`; // append only the most critical note
    }
  }

  return answer;
  ```

- [ ] **Step 3.5 — Pass `isPersonaLocked` from Bridge.ts**

  In `Bridge.ts`, `handleConversationalQuestion()` already detects `explicitPersona` at line ~652. Find all three call sites for `queryDomainAdvisor()` (lines ~807, ~822, ~840) and add the options object.

  All three currently look like:
  ```typescript
  const llmAnswer = await getPersonaEngine().queryDomainAdvisor(
    request.userPrompt,
    { hub, summary, facts },
    persona
  );
  ```
  Change all three to:
  ```typescript
  const llmAnswer = await getPersonaEngine().queryDomainAdvisor(
    request.userPrompt,
    { hub, summary, facts },
    persona,
    { isPersonaLocked: explicitPersona !== null }
  );
  ```

- [ ] **Step 3.6 — Manual verification**

  Start the dev server: `cd scope && npm run dev`

  Open Athenea → open Omnibar → type "Cortana, cómo voy con mis tareas?" → verify:
  - Response bubble says "Cortana" (🧿 icon), not SHODAN
  - Response does NOT start with `[CONTROL:...]` visible text
  - If you have < 5 battery (hard to test manually), the field note check runs silently

- [ ] **Step 3.7 — Commit**

  ```bash
  git add src/modules/intelligence/personaEngine.ts src/modules/intelligence/Bridge.ts
  git commit -m "feat: persona lock — hard-lock system prompt when user explicitly names an agent, with critical field-note exception"
  ```

---

## Task 4 — Conversation Memory (3 Layers)

**Files:**
- Modify: `src/modules/intelligence/types.ts` (add field to `IntelligenceRequest`)
- Modify: `src/modules/intelligence/useIntelligence.ts` (thread history from component)
- Modify: `src/modules/intelligence/Bridge.ts` (thread to `queryDomainAdvisor()`)
- Modify: `src/components/Omnibar/Omnibar.tsx` (pass history; write session summary on close)

The `chatMessages[]` array in Omnibar is the source of truth. We map its last 8 non-artifact messages to `{role, content}` pairs and pass them all the way to `callLLM()` as the real `messages[]` array. Persistent memory (`agentMemory`) is written as a 1-sentence summary when the Omnibar closes.

- [ ] **Step 4.1 — Add `conversationHistory` to `IntelligenceRequest`**

  In `src/modules/intelligence/types.ts`, find the `IntelligenceRequest` interface (line 49):
  ```typescript
  export interface IntelligenceRequest {
    id: string;
    userPrompt: string;
    context?: {
      currentHub: 'WorkHub' | 'PersonalHub' | 'FinanceHub';
      selectedProject?: string;
      selectedNote?: string;
    };
    timestamp: number;
  }
  ```
  Replace with:
  ```typescript
  export interface IntelligenceRequest {
    id: string;
    userPrompt: string;
    context?: {
      currentHub: 'WorkHub' | 'PersonalHub' | 'FinanceHub';
      selectedProject?: string;
      selectedNote?: string;
    };
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
    timestamp: number;
  }
  ```

- [ ] **Step 4.2 — Thread history through Bridge.processPrompt()**

  In `Bridge.ts`, `processPrompt()` at line ~173 builds a request and calls `handleConversationalQuestion()`. The method signature of `handleConversationalQuestion()` is:
  ```typescript
  private async handleConversationalQuestion(
    request: IntelligenceRequest,
    hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub',
    selectedSkill: SkillManifest | null,
    confidence: number,
    inferenceLayer: InferenceLayer,
    reduxGetState: () => any
  ): Promise<IntelligenceResponse>
  ```
  The `request` object already carries `conversationHistory` (from Step 4.1), so no signature change is needed here — we just read `request.conversationHistory` where we call `queryDomainAdvisor()`.

  In `handleConversationalQuestion()`, find all three `queryDomainAdvisor()` call sites (from Task 3, Step 3.5). They currently pass `{ isPersonaLocked: explicitPersona !== null }`. Update all three to also pass `conversationHistory`:

  ```typescript
  const llmAnswer = await getPersonaEngine().queryDomainAdvisor(
    request.userPrompt,
    { hub, summary, facts },
    persona,
    {
      isPersonaLocked: explicitPersona !== null,
      conversationHistory: request.conversationHistory,
    }
  );
  ```
  Apply this change to all three call sites.

- [ ] **Step 4.3 — Thread onToken through Bridge**

  We need to pass `onToken` from the outside world to `handleConversationalQuestion()` → `queryDomainAdvisor()`. The cleanest approach: add `onToken` to the `IntelligenceRequest` context — but that would pollute the type. Instead, add it as an optional parameter on `processPrompt()`.

  In `Bridge.ts`, change `processPrompt()` signature from:
  ```typescript
  async processPrompt(
    request: IntelligenceRequest,
    reduxGetState: () => any,
    reduxDispatch: (action: ReduxAction) => void
  ): Promise<IntelligenceResponse>
  ```
  To:
  ```typescript
  async processPrompt(
    request: IntelligenceRequest,
    reduxGetState: () => any,
    reduxDispatch: (action: ReduxAction) => void,
    onToken?: (chunk: string) => void
  ): Promise<IntelligenceResponse>
  ```

  Then thread `onToken` down to `handleConversationalQuestion()`. Change `handleConversationalQuestion()` signature (add `onToken?: (chunk: string) => void` as last parameter), and inside it, add `onToken` to the options passed to `queryDomainAdvisor()`:

  ```typescript
  {
    isPersonaLocked: explicitPersona !== null,
    conversationHistory: request.conversationHistory,
    onToken,
  }
  ```

  Update the call to `handleConversationalQuestion()` inside `processPrompt()` (~line 195) to pass the new parameter:
  ```typescript
  return await this.handleConversationalQuestion(
    request,
    hub,
    null,
    100,
    InferenceLayer.FAST_PATH,
    reduxGetState,
    onToken
  );
  ```

- [ ] **Step 4.4 — Thread from useIntelligence.sendPrompt()**

  In `src/modules/intelligence/useIntelligence.ts`, find the `sendPrompt` options type (line ~28):
  ```typescript
  options?: { autoExecute?: boolean }
  ```
  Change to:
  ```typescript
  options?: { autoExecute?: boolean; onToken?: (chunk: string) => void }
  ```

  Then find the call to `intelligenceBridge.processPrompt()` (~line 100):
  ```typescript
  const response = await intelligenceBridge.processPrompt(
    request,
    () => storeState,
    dispatch as any
  );
  ```
  Change to:
  ```typescript
  const response = await intelligenceBridge.processPrompt(
    request,
    () => storeState,
    dispatch as any,
    options?.onToken
  );
  ```

- [ ] **Step 4.5 — Build the history in Omnibar and pass to sendPrompt()**

  In `src/components/Omnibar/Omnibar.tsx`, find `handleSubmitPrompt()` (line ~316). It currently calls:
  ```typescript
  const result = await sendPrompt(userText, selectedHub, { autoExecute: true });
  ```

  Before this call, build the conversation history from the last 8 chat messages (excluding the one just added, excluding artifact messages):
  ```typescript
  const historyMessages = chatMessages
    .filter((m) => !m.artifact)
    .slice(-8)
    .map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.text,
    }));
  ```

  Add `conversationHistory` to the request by updating `sendPrompt`'s options object. But `sendPrompt` currently doesn't accept `conversationHistory` as an option — that's on the `IntelligenceRequest`. We need to pass it through `sendPrompt`. 

  The cleanest path: add `conversationHistory` to the options accepted by `sendPrompt`:
  ```typescript
  options?: { 
    autoExecute?: boolean; 
    onToken?: (chunk: string) => void;
    conversationHistory?: Array<{ role: 'user' | 'assistant'; content: string }>;
  }
  ```
  And in `useIntelligence.sendPrompt()`, attach it to the `IntelligenceRequest`:
  ```typescript
  const request: IntelligenceRequest = {
    id: `req_${Date.now()}`,
    userPrompt: prompt,
    context: {
      currentHub: hub || initialHub || 'WorkHub'
    },
    conversationHistory: options?.conversationHistory,
    timestamp: Date.now()
  };
  ```

  Back in Omnibar, update the call:
  ```typescript
  const result = await sendPrompt(userText, selectedHub, {
    autoExecute: true,
    conversationHistory: historyMessages,
  });
  ```

- [ ] **Step 4.6 — Write session summary to agentMemory on Omnibar close**

  In `Omnibar.tsx`, find the existing `useEffect` that runs on `isOpen` change (~line 220). The existing `else` branch (when `isOpen` goes false) saves `chatMessagesRef.current` to `updateOmnibarChatHistory`. Add the session summary write after that, inside the same `else` block:

  ```typescript
  } else {
    // existing: save chat history
    if (chatMessagesRef.current.length > 0) {
      dispatch(updateOmnibarChatHistory(
        chatMessagesRef.current.filter((m: any) => !m.artifact).slice(-20)
      ));
    }

    // NEW: write session summary to agentMemory if there was a conversation
    const sessionMsgs = chatMessagesRef.current.filter((m) => !m.artifact);
    if (sessionMsgs.length >= 2) {
      // Detect which agent was primary in this session
      const agentMsgs = sessionMsgs.filter((m) => m.role === 'agent');
      const lastAgent = agentMsgs[agentMsgs.length - 1];
      const agentName = lastAgent?.agentName?.toLowerCase();
      const agent: 'cortana' | 'jarvis' | 'shodan' =
        agentName?.includes('jarvis') ? 'jarvis'
        : agentName?.includes('shodan') ? 'shodan'
        : 'cortana';

      // Build a 1-sentence summary: last user question + last agent answer
      const lastUserMsg = [...sessionMsgs].reverse().find((m) => m.role === 'user');
      const lastAgentMsg = [...sessionMsgs].reverse().find((m) => m.role === 'agent');
      if (lastUserMsg && lastAgentMsg) {
        const summary = `Usuario preguntó: "${lastUserMsg.text.slice(0, 80)}". Respuesta clave: "${lastAgentMsg.text.slice(0, 120)}".`;
        dispatch(updateAgentMemory({
          agent,
          recentContext: summary,
          lastSeen: new Date().toISOString(),
        }));
      }
    }
  }
  ```

  Add the `updateAgentMemory` import at the top of Omnibar.tsx. The existing import line is:
  ```typescript
  import { updateOmnibarChatHistory, clearLatestActionableIntercept } from '../../store/slices/aiMemorySlice';
  ```
  Change to:
  ```typescript
  import { updateOmnibarChatHistory, clearLatestActionableIntercept, updateAgentMemory } from '../../store/slices/aiMemorySlice';
  ```

- [ ] **Step 4.7 — Verify memory is wired**

  ```bash
  cd scope && npx tsc --noEmit 2>&1 | grep -E "types.ts|Bridge.ts|useIntelligence|Omnibar"
  ```
  Expected: no new type errors.

  Manual test: open Omnibar, type "cortana qué tareas tengo?", get response, type "y cuál primero?" — the second response should reference context from the first message.

- [ ] **Step 4.8 — Commit**

  ```bash
  git add src/modules/intelligence/types.ts src/modules/intelligence/Bridge.ts src/modules/intelligence/useIntelligence.ts src/components/Omnibar/Omnibar.tsx
  git commit -m "feat: 3-layer conversation memory — session history wired to LLM, persistent agentMemory written on Omnibar close"
  ```

---

## Task 5 — Response Streaming UI

**Files:**
- Modify: `src/components/Omnibar/Omnibar.tsx` (streaming bubble; `handleSubmitPrompt()`)

The infrastructure is ready from Tasks 2–4. This task wires the streaming callback into the chat UI so text appears token by token.

- [ ] **Step 5.1 — Add streaming state to Omnibar**

  In `Omnibar.tsx`, after the existing `const [chatMessages, setChatMessages] = useState<ChatMessage[]>([])` (line ~152), add:

  ```typescript
  const [streamingMsgId, setStreamingMsgId] = useState<string | null>(null);
  ```

- [ ] **Step 5.2 — Rewrite handleSubmitPrompt() to stream**

  Find `handleSubmitPrompt()` (line ~316). The user bubble creation (lines ~321–329) stays the same. Replace the `sendPrompt` call and everything after it with:

  ```typescript
  // Create agent placeholder bubble immediately
  const agentBubbleId = `a_${Date.now()}`;
  const agent = getAgentInfoFromPersona(null, selectedHub, userText);
  const placeholderMsg: ChatMessage = {
    id: agentBubbleId,
    role: 'agent',
    agentName: agent.name,
    agentIcon: agent.icon,
    text: '',          // will fill via streaming
    timestamp: Date.now(),
  };
  setChatMessages((prev) => [...prev, placeholderMsg]);
  setStreamingMsgId(agentBubbleId);

  // Build history from messages BEFORE the user message was added
  const historyMessages = chatMessages
    .filter((m) => !m.artifact)
    .slice(-8)
    .map((m) => ({
      role: (m.role === 'user' ? 'user' : 'assistant') as 'user' | 'assistant',
      content: m.text,
    }));

  // onToken: append each token to the placeholder bubble
  const onToken = (chunk: string) => {
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === agentBubbleId ? { ...m, text: m.text + chunk } : m
      )
    );
  };

  const result = await sendPrompt(userText, selectedHub, {
    autoExecute: true,
    conversationHistory: historyMessages,
    onToken,
  });

  setStreamingMsgId(null);

  // If the response was a skill execution (not conversational), replace the streaming bubble
  if (result.executed) {
    const skillName = result.response?.reasoning.matchedSkill?.name || t('Action');
    const params = result.response?.reduxAction?.payload;
    const detail = params?.title || params?.text || params?.description || '';
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === agentBubbleId
          ? {
              ...m,
              text: language === 'es'
                ? `✅ **${skillName}** ejecutado${detail ? `: _${detail}_` : ''}.`
                : `✅ **${skillName}** executed${detail ? `: _${detail}_` : ''}.`,
            }
          : m
      )
    );

    actionHistoryStore.recordAction({
      type: 'user-command',
      hub: selectedHub,
      actionType: skillName,
      reduxActionType: result.response?.reduxAction?.type || '',
      description: `Auto-executed: ${skillName}`,
      payload: params,
      success: true,
    });
  } else if (result.needsConfirmation && result.response?.artifact) {
    const artifact = result.response.artifact;
    if (artifact.type !== 'text') {
      // Replace placeholder with artifact bubble for form-based skills
      setChatMessages((prev) =>
        prev.map((m) =>
          m.id === agentBubbleId
            ? {
                ...m,
                text: result.response?.userMessage || `${t('I need some details for')} **${result.response?.reasoning.matchedSkill?.name}**.`,
                artifact,
              }
            : m
        )
      );
    }
    // If artifact.type === 'text', the text is already streamed — no replacement needed.
    // Dismiss any pending Canvas.
    if (artifact.type === 'text') cancelAction();
  } else if (!result.response?.success) {
    playErrorSound();
    setChatMessages((prev) =>
      prev.map((m) =>
        m.id === agentBubbleId
          ? { ...m, text: result.response?.userMessage || t('Something went wrong.') }
          : m
      )
    );
  }
  ```

  > **Note:** The existing code after `sendPrompt` (the long if/else for executed / needsConfirmation / error) is replaced entirely by the block above. Remove the old block.

- [ ] **Step 5.3 — Add blinking cursor CSS to agent bubble while streaming**

  In the JSX that renders agent bubbles (find the `{msg.role === 'agent' &&` block, ~line 1038), the text is currently rendered as:
  ```tsx
  <span dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.text) }} />
  ```
  Wrap this so a blinking cursor appears while the message is the active streaming one:
  ```tsx
  <span
    dangerouslySetInnerHTML={{
      __html: renderMarkdown(msg.text) +
        (streamingMsgId === msg.id ? '<span class="omnibar-stream-cursor">▌</span>' : ''),
    }}
  />
  ```

- [ ] **Step 5.4 — Add cursor CSS**

  In `src/components/Omnibar/Omnibar.css`, add at the end:
  ```css
  .omnibar-stream-cursor {
    display: inline-block;
    animation: omnibar-blink 0.7s step-start infinite;
  }
  @keyframes omnibar-blink {
    50% { opacity: 0; }
  }
  ```

- [ ] **Step 5.5 — Manual streaming verification**

  In browser DevTools → Network tab, filter by "groq". Open Omnibar, ask "cortana resumen del día". Observe:
  - Agent bubble appears within ~300ms
  - Text fills in word by word
  - Blinking cursor visible during stream
  - Cursor disappears when stream ends

- [ ] **Step 5.6 — Commit**

  ```bash
  git add src/components/Omnibar/Omnibar.tsx src/components/Omnibar/Omnibar.css
  git commit -m "feat: response streaming — agent bubble appears immediately, text fills token-by-token with blinking cursor"
  ```

---

## Task 6 — WorkHub Command Center

**Files:**
- Modify: `src/pages/WorkHub.jsx`
- Modify: `src/pages/WorkHub.css`

Fully self-contained — no intelligence changes needed. Uses `useDispatch` directly and reads from the same Redux state the page already subscribes to.

- [ ] **Step 6.1 — Add missing imports to WorkHub.jsx**

  At the top of `WorkHub.jsx`, the current imports include `useSelector` but NOT `useDispatch`. Add it:
  ```jsx
  import { useMemo, useState, useEffect } from 'react';
  import { useSelector, useDispatch } from 'react-redux';
  import { useTasks } from '../context/TasksContext';
  import { useLanguage } from '../context/LanguageContext';
  import { useNavigate } from 'react-router-dom';
  import { Skeleton } from '../components/Skeleton/Skeleton';
  import { getNeuralKeySync } from '../modules/intelligence/neuralAccess';
  import { DailyStandup } from '../components/DailyStandup/DailyStandup';
  import EmptyState from '../components/EmptyState/EmptyState';
  import './WorkHub.css';
  ```

  Add dispatch inside the component, after `const navigate`:
  ```jsx
  const dispatch = useDispatch();
  ```

- [ ] **Step 6.2 — Add computed stats for the 4 pills**

  After the existing `const pendingTasks` and `const progressTotal` block, add:

  ```jsx
  const now = new Date();

  const overdueTasks = useMemo(
    () => (tasks || []).filter((t) => {
      const due = new Date(t?.dueDate || '').getTime();
      return !t?.completed &&
        t?.status !== 'Completed' &&
        Number.isFinite(due) && due > 0 && due < Date.now();
    }),
    [tasks]
  );

  const dueTodayTasks = useMemo(
    () => (tasks || []).filter((t) => {
      const due = new Date(t?.dueDate || '');
      const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
      const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
      return !t?.completed &&
        t?.status !== 'Completed' &&
        due >= todayStart && due <= todayEnd;
    }),
    [tasks]
  );

  const startOfWeekForDone = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  const doneThisWeek = useMemo(
    () => (tasks || []).filter((t) =>
      (t?.status === 'Completed' || t?.completed === true) &&
      t?.updatedAt && new Date(t.updatedAt) >= startOfWeekForDone
    ),
    [tasks, startOfWeekForDone]
  );
  ```

- [ ] **Step 6.3 — Build the Action List (sorted tasks with inline dispatch)**

  Add this computed value after the stats from Step 6.2:

  ```jsx
  const actionListTasks = useMemo(() => {
    const open = (tasks || []).filter(
      (t) => !t?.completed && t?.status !== 'Completed'
    );
    const levelOrder = ['Critical', 'High Velocity', 'Steady Flow', 'Low Friction', 'Backlog'];

    return [...open]
      .sort((a, b) => {
        const aDue = new Date(a?.dueDate || '').getTime();
        const bDue = new Date(b?.dueDate || '').getTime();
        const aOverdue = Number.isFinite(aDue) && aDue > 0 && aDue < Date.now();
        const bOverdue = Number.isFinite(bDue) && bDue > 0 && bDue < Date.now();
        const aToday = (() => {
          const s = new Date(); s.setHours(0,0,0,0);
          const e = new Date(); e.setHours(23,59,59,999);
          return Number.isFinite(aDue) && aDue >= s.getTime() && aDue <= e.getTime();
        })();
        const bToday = (() => {
          const s = new Date(); s.setHours(0,0,0,0);
          const e = new Date(); e.setHours(23,59,59,999);
          return Number.isFinite(bDue) && bDue >= s.getTime() && bDue <= e.getTime();
        })();
        // overdue first (most days late first), then today, then by level, then by date
        if (aOverdue !== bOverdue) return aOverdue ? -1 : 1;
        if (aToday !== bToday) return aToday ? -1 : 1;
        const levelA = levelOrder.indexOf(a?.level); const levelB = levelOrder.indexOf(b?.level);
        if (levelA !== levelB) return (levelA === -1 ? 999 : levelA) - (levelB === -1 ? 999 : levelB);
        const safeDueA = Number.isFinite(aDue) && aDue > 0 ? aDue : Number.MAX_SAFE_INTEGER;
        const safeDueB = Number.isFinite(bDue) && bDue > 0 ? bDue : Number.MAX_SAFE_INTEGER;
        return safeDueA - safeDueB;
      })
      .slice(0, 7);
  }, [tasks]);
  ```

  Add a helper to format due date text, after `actionListTasks`:

  ```jsx
  const formatDueText = (dueDate) => {
    if (!dueDate) return null;
    const due = new Date(dueDate);
    if (!Number.isFinite(due.getTime())) return null;
    const now = new Date();
    const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
    const todayEnd = new Date(); todayEnd.setHours(23, 59, 59, 999);
    const tomorrowStart = new Date(todayStart); tomorrowStart.setDate(tomorrowStart.getDate() + 1);
    const tomorrowEnd = new Date(todayEnd); tomorrowEnd.setDate(tomorrowEnd.getDate() + 1);
    const yesterdayStart = new Date(todayStart); yesterdayStart.setDate(yesterdayStart.getDate() - 1);
    if (due < todayStart) {
      const daysLate = Math.floor((todayStart.getTime() - due.getTime()) / 86400000);
      return daysLate === 1 ? t('Due yesterday') : `${t('Overdue')} ${daysLate}d`;
    }
    if (due >= todayStart && due <= todayEnd) {
      return `${t('Due today')} ${due.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    if (due >= tomorrowStart && due <= tomorrowEnd) return t('Tomorrow');
    return due.toLocaleDateString([], { day: 'numeric', month: 'short' });
  };
  ```

- [ ] **Step 6.4 — Add urgent task preview to Active Projects**

  Add a computed map (projectId → most urgent open task):

  ```jsx
  const projectUrgentTask = useMemo(() => {
    const map = {};
    const levelOrder = ['Critical', 'High Velocity', 'Steady Flow', 'Low Friction', 'Backlog'];
    (projects || []).forEach((proj) => {
      const open = (tasks || []).filter(
        (t) => t?.projectId === proj.id && !t?.completed && t?.status !== 'Completed'
      );
      if (open.length === 0) { map[proj.id] = null; return; }
      open.sort((a, b) => {
        const aDue = new Date(a?.dueDate || '').getTime();
        const bDue = new Date(b?.dueDate || '').getTime();
        const safeDueA = Number.isFinite(aDue) && aDue > 0 ? aDue : Number.MAX_SAFE_INTEGER;
        const safeDueB = Number.isFinite(bDue) && bDue > 0 ? bDue : Number.MAX_SAFE_INTEGER;
        if (safeDueA !== safeDueB) return safeDueA - safeDueB;
        return (levelOrder.indexOf(a?.level) ?? 9) - (levelOrder.indexOf(b?.level) ?? 9);
      });
      map[proj.id] = open[0];
    });
    return map;
  }, [projects, tasks]);
  ```

- [ ] **Step 6.5 — Replace the JSX**

  Replace the entire `return (...)` block in WorkHub.jsx with:

  ```jsx
  return (
    <div className="workhub-container">
      <header className="workhub-header">
        <div>
          <h1>{t('Work Hub')}</h1>
          <p>{t('Everything related to your daily programming work.')}</p>
        </div>
      </header>

      {lastVerdict && getNeuralKeySync() && (Date.now() - lastVerdict.timestamp < 30 * 60 * 1000) && (
        <div className="cortana-briefing">
          <span className="cortana-icon">🧿</span>
          <div className="cortana-content">
            <span className="cortana-label">Cortana</span>
            <p className="cortana-message">{lastVerdict.summary || lastVerdict.text}</p>
          </div>
        </div>
      )}

      {showStandup && (
        <DailyStandup onDismiss={() => setShowStandup(false)} />
      )}

      {/* Situation Report — 4 stat pills */}
      <section className="workhub-sitrep">
        <div className={`workhub-sitrep-pill ${overdueTasks.length > 0 ? 'sitrep-red' : 'sitrep-gray'}`}>
          <span className="sitrep-value">{isReady ? overdueTasks.length : '—'}</span>
          <span className="sitrep-label">{t('Overdue')}</span>
        </div>
        <div className={`workhub-sitrep-pill ${dueTodayTasks.length > 0 ? 'sitrep-amber' : 'sitrep-gray'}`}>
          <span className="sitrep-value">{isReady ? dueTodayTasks.length : '—'}</span>
          <span className="sitrep-label">{t('Due Today')}</span>
        </div>
        <div className={`workhub-sitrep-pill ${inProgressTasks.length > 0 ? 'sitrep-blue' : 'sitrep-gray'}`}>
          <span className="sitrep-value">{isReady ? inProgressTasks.length : '—'}</span>
          <span className="sitrep-label">{t('In Progress')}</span>
        </div>
        <div className="workhub-sitrep-pill sitrep-green">
          <span className="sitrep-value">{isReady ? doneThisWeek.length : '—'}</span>
          <span className="sitrep-label">{t('Done This Week')}</span>
        </div>
      </section>

      {/* Action List */}
      <section className="workhub-card workhub-action-list">
        <h2>{t('Action List')}</h2>
        {actionListTasks.length === 0 ? (
          <EmptyState icon="📋" message={t('No tasks yet.')} ctaLabel={`+ ${t('New task')}`} onCta={openGatekeeper} />
        ) : (
          <>
            <ul>
              {actionListTasks.map((task) => {
                const due = new Date(task?.dueDate || '').getTime();
                const isOverdue = Number.isFinite(due) && due > 0 && due < Date.now();
                const isToday = (() => {
                  const s = new Date(); s.setHours(0,0,0,0);
                  const e = new Date(); e.setHours(23,59,59,999);
                  return Number.isFinite(due) && due >= s.getTime() && due <= e.getTime();
                })();
                const dueText = formatDueText(task?.dueDate);
                return (
                  <li key={task.id} className={`workhub-action-item${isOverdue ? ' action-overdue' : isToday ? ' action-today' : ''}`}>
                    <span className="action-urgency">
                      {isOverdue ? '⚠️' : isToday ? '🕐' : ''}
                    </span>
                    <span
                      className="action-title"
                      onClick={() => task.projectId ? navigate(`/projects/${task.projectId}`) : navigate('/my-tasks')}
                    >
                      {task.title}
                    </span>
                    <span className={`workhub-pill level-${(task.level || 'standard').toLowerCase().replace(/\s+/g, '-')}`}>
                      {task.level || 'Standard'}
                    </span>
                    {dueText && <span className={`action-due${isOverdue ? ' action-due--overdue' : ''}`}>{dueText}</span>}
                    <div className="action-buttons">
                      {task.status !== 'In Progress' && (
                        <button
                          className="action-btn action-btn--start"
                          title={t('Start')}
                          onClick={() => dispatch({ type: 'tasks/updateTask', payload: { id: task.id, status: 'In Progress' } })}
                        >
                          ▶
                        </button>
                      )}
                      <button
                        className="action-btn action-btn--done"
                        title={t('Complete')}
                        onClick={() => dispatch({ type: 'tasks/updateTask', payload: { id: task.id, status: 'Completed', completed: true } })}
                      >
                        ✓
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            <a className="workhub-see-all" onClick={() => navigate('/my-tasks')}>{t('See all')} →</a>
          </>
        )}
      </section>

      {/* Active Projects with urgent task preview */}
      <section className="workhub-card">
        <h2>{t('Active Projects')}</h2>
        {activeProjects.length === 0 ? (
          <div className="workhub-empty-block">
            <div className="workhub-empty">{t('No active projects.')}</div>
            <button className="workhub-inline-action" onClick={() => navigate('/projects')}>{t('Go to Projects')}</button>
          </div>
        ) : (
          <ul>
            {activeProjects.slice(0, 3).map((project) => {
              const urgentTask = projectUrgentTask[project.id];
              return (
                <li key={project.id} className="workhub-project-item">
                  <div className="project-header-row">
                    <span>📁 {project.name}</span>
                    <span className="workhub-pill">{t(project.status || 'Active')}</span>
                  </div>
                  <div className="project-urgent-task">
                    {urgentTask
                      ? <span>└─ {urgentTask.title}{urgentTask.dueDate ? ` — ${formatDueText(urgentTask.dueDate)}` : ''}</span>
                      : <span className="project-no-tasks">└─ {t('No open tasks')}</span>
                    }
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      <section className="workhub-actions">
        <button onClick={() => navigate('/my-tasks')}>{t('Go to My Tasks')}</button>
        <button onClick={() => navigate('/projects')}>{t('Go to Projects')}</button>
        <button onClick={() => navigate('/fleet')}>{t('Go to Collaborators')}</button>
        <button
          className="workhub-btn-gatekeeper"
          onClick={() => window.dispatchEvent(new CustomEvent('athenea:gatekeeper:open'))}
        >
          🎯 {t('Create priority task')}
        </button>
      </section>
    </div>
  );
  ```

  > **Remove** the `startOfWeek`, `tasksThisWeek`, `completedThisWeek`, `weeklyProgress`, and old `sortedTasks`/`todayFocus` memos — they are replaced by the new computed values. The Weekly Progress card is removed from the layout (it was inside `workhub-grid` which we no longer use).

- [ ] **Step 6.6 — Add CSS for new components**

  In `src/pages/WorkHub.css`, add at the end:

  ```css
  /* ── Situation Report pills ─────────────────── */
  .workhub-sitrep {
    display: flex;
    gap: 0.75rem;
    margin-bottom: 1.25rem;
    flex-wrap: wrap;
  }
  .workhub-sitrep-pill {
    flex: 1 1 0;
    min-width: 4.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: 0.6rem 0.75rem;
    border-radius: 0.5rem;
    font-size: 0.8rem;
  }
  .sitrep-value { font-size: 1.5rem; font-weight: 700; line-height: 1; }
  .sitrep-label { margin-top: 0.2rem; opacity: 0.8; text-align: center; }
  .sitrep-red    { background: rgba(239, 68, 68, 0.15); color: #ef4444; }
  .sitrep-amber  { background: rgba(245, 158, 11, 0.15); color: #f59e0b; }
  .sitrep-blue   { background: rgba(59, 130, 246, 0.15); color: #3b82f6; }
  .sitrep-green  { background: rgba(34, 197, 94, 0.15); color: #22c55e; }
  .sitrep-gray   { background: rgba(100, 100, 100, 0.1); color: var(--text-secondary, #888); }

  /* ── Action List ────────────────────────────── */
  .workhub-action-list ul { list-style: none; padding: 0; margin: 0; }
  .workhub-action-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.55rem 0;
    border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.06));
    flex-wrap: wrap;
  }
  .workhub-action-item:last-child { border-bottom: none; }
  .action-overdue { border-left: 3px solid #ef4444; padding-left: 0.5rem; }
  .action-today   { border-left: 3px solid #f59e0b; padding-left: 0.5rem; }
  .action-urgency { width: 1.4rem; text-align: center; flex-shrink: 0; }
  .action-title {
    flex: 1 1 8rem;
    cursor: pointer;
    font-size: 0.875rem;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  .action-title:hover { text-decoration: underline; }
  .action-due { font-size: 0.75rem; opacity: 0.7; white-space: nowrap; }
  .action-due--overdue { color: #ef4444; opacity: 1; font-weight: 600; }
  .action-buttons { display: flex; gap: 0.35rem; flex-shrink: 0; }
  .action-btn {
    width: 1.75rem; height: 1.75rem;
    border-radius: 0.35rem;
    border: 1px solid var(--border, rgba(255,255,255,0.12));
    background: transparent;
    cursor: pointer;
    font-size: 0.85rem;
    display: flex; align-items: center; justify-content: center;
    transition: background 0.15s;
  }
  .action-btn--done:hover  { background: rgba(34,197,94,0.2); }
  .action-btn--start:hover { background: rgba(59,130,246,0.2); }
  .workhub-see-all {
    display: block;
    margin-top: 0.75rem;
    font-size: 0.8rem;
    opacity: 0.7;
    cursor: pointer;
    text-align: right;
  }
  .workhub-see-all:hover { opacity: 1; }

  /* ── Active Projects with task preview ─────── */
  .workhub-project-item { padding: 0.5rem 0; border-bottom: 1px solid var(--border-subtle, rgba(255,255,255,0.06)); }
  .workhub-project-item:last-child { border-bottom: none; }
  .project-header-row { display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; }
  .project-urgent-task { font-size: 0.78rem; opacity: 0.65; margin-top: 0.2rem; padding-left: 0.5rem; }
  .project-no-tasks { font-style: italic; }
  ```

- [ ] **Step 6.7 — Verify the WorkHub Redux action type**

  The inline ▶ and ✓ buttons dispatch `{ type: 'tasks/updateTask', payload: { id, status } }`. Verify this is the correct action type:

  ```bash
  grep -n "updateTask\|'tasks/" "c:/Users/gazav/OneDrive/Desktop/Athenea/scope/src/store/slices/tasksSlice.js" | head -20
  ```

  If the actual action type is different (e.g. `tasks/editTask`), update the two `dispatch()` calls in Step 6.5 to match.

- [ ] **Step 6.8 — Manual verification**

  Open WorkHub:
  - 4 stat pills visible with correct counts (red if overdue, gray if zero)
  - Action List shows tasks sorted: overdue first with ⚠️, today with 🕐
  - Clicking ✓ on a task marks it complete (disappears from list on next render)
  - Clicking ▶ on a non-in-progress task makes it "In Progress"
  - Active Projects show the most urgent open task beneath each project name

- [ ] **Step 6.9 — Commit**

  ```bash
  git add src/pages/WorkHub.jsx src/pages/WorkHub.css
  git commit -m "feat: WorkHub command center — 4 stat pills, Action List with inline task dispatch, Active Projects with urgent task preview"
  ```

---

## Self-Review

### Spec Coverage

| Spec section | Covered by |
|---|---|
| Persona lock hard preamble | Task 3, Step 3.2 |
| Skip [CONTROL:X] when locked | Task 3 — lock preamble instructs LLM directly; `queryDomainAdvisor()` never calls `extractControlTag()` so no parsing needed |
| Critical alert field note | Task 3, Step 3.4 |
| Session history (8 msgs) as real messages[] | Task 4, Steps 4.1–4.5 |
| Live data snapshot (buildContextualSystemPrompt) | Already wired in `queryDomainAdvisor()` via `contextBlock` — no new work |
| Persistent agentMemory write on close | Task 4, Step 4.6 |
| Streaming: onToken callback in callLLM | Task 2 |
| Streaming: bubble appears immediately | Task 5, Step 5.2 |
| Blinking cursor | Task 5, Step 5.3–5.4 |
| 4 stat pills | Task 6, Step 6.2 + 6.5 |
| Action List with sort order | Task 6, Step 6.3 + 6.5 |
| Inline ✓ / ▶ dispatch | Task 6, Step 6.5 |
| Active Projects urgent task | Task 6, Step 6.4 + 6.5 |
| require() fix | Task 1, Steps 1.1–1.2 |
| Stale comment fix | Task 1, Step 1.4 |
| max_tokens 240→380 | Task 1, Step 1.3 |

### Type Consistency Check

- `conversationHistory` typed as `Array<{ role: 'user' | 'assistant'; content: string }>` in types.ts (Step 4.1), useIntelligence.ts (Step 4.4), and callLLM options (Task 2) — consistent.
- `onToken?: (chunk: string) => void` used in callLLM (Task 2), queryDomainAdvisor options (Task 3.3), handleConversationalQuestion (Task 4.3), processPrompt (Task 4.3), sendPrompt options (Task 4.4) — consistent.
- `isPersonaLocked?: boolean` used only in queryDomainAdvisor options (Task 3.1–3.5) — consistent.
- WorkHub dispatches `{ type: 'tasks/updateTask', payload: { id, status } }` — Step 6.7 verifies this matches the actual slice.

### No Placeholders

All steps contain exact code. No TBDs.
