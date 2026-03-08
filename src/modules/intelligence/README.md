# ATHENEA Intelligence Module

A personal AI assistant intelligence layer for ATHENEA, inspired by **OpenClaw's architecture** but adapted for single-user productivity. The Intelligence Module transforms user natural language prompts into executable Redux actions through a skill-based reasoning engine.

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Core Concepts](#core-concepts)
3. [File Structure](#file-structure)
4. [How It Works](#how-it-works)
5. [Usage Guide](#usage-guide)
6. [Extending the Module](#extending-the-module)
7. [OpenClaw Integration](#openclaw-integration)
8. [Future Enhancements](#future-enhancements)

---

## Architecture Overview

The Intelligence Module follows a **middleware pattern** similar to OpenClaw:

```
┌─────────────────┐
│  User Prompt    │
│  "Add task do   │
│   laundry by 5" │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│   INTELLIGENCE BRIDGE       │
│  (Intent Recognition)       │
└──────────┬──────────────────┘
           │
           ├─→ Intent Analysis (keyword matching)
           ├─→ Skill Selection (find best match)
           ├─→ Parameter Extraction (parse values)
           └─→ Canvas Generation (build preview)
           │
           ▼
┌─────────────────────────────┐
│   CANVAS ARTIFACT           │
│  (Form preview for user)    │
│  ┌─────────────────────────┐│
│  │ ☑ Confirm & Create      ││
│  │ ☐ Cancel                ││
│  └─────────────────────────┘│
└──────────┬──────────────────┘
           │ (User confirmed)
           ▼
┌─────────────────────────────┐
│   REDUX DISPATCH            │
│  Action: "tasks/add"        │
│  Payload: {...}             │
└─────────────────────────────┘
           │
           ▼
┌─────────────────────────────┐
│   STORE UPDATE              │
│  (State mutation)           │
└─────────────────────────────┘
```

---

## Core Concepts

### 1. **Skills**

A _Skill_ is an executable tool mapped to a Redux action. Each skill:

- **ID**: Unique identifier (`create_note`, `record_expense`, etc.)
- **Keywords**: Natural language triggers (`create`, `add`, `note`, etc.)
- **Action**: Redux action type to dispatch (`notes/create`, `payments/addExpense`)
- **Parameters**: Form fields the user must provide
- **Hub**: Associated hub (WorkHub, PersonalHub, FinanceHub)

**Example Skill**:
```typescript
{
  id: 'create_note',
  name: 'Create Note',
  keywords: ['note', 'remember', 'write'],
  action: 'notes/create',
  paramSchema: {
    title: { type: 'string', required: true },
    content: { type: 'textarea', required: true },
    tags: { type: 'string', required: false }
  }
}
```

### 2. **Protocol**

The Intelligence Module uses a **JSON-RPC style protocol** for communication:

**Request** (User → Bridge):
```typescript
interface IntelligenceRequest {
  id: string;              // Unique request ID
  userPrompt: string;      // Raw user input
  context?: {
    currentHub: string;    // Which hub user is in
    selectedProject?: string;
  };
  timestamp: number;
}
```

**Response** (Bridge → UI):
```typescript
interface IntelligenceResponse {
  id: string;              // Matches request ID
  success: boolean;
  reasoning: {
    matchedSkill: SkillManifest;
    confidence: number;    // 0-100
    reasoning: string;     // Explanation
  };
  reduxAction?: ReduxAction;    // Action to execute
  artifact?: CanvasArtifact;    // UI to render
  userMessage: string;          // Message to user
  timestamp: number;
}
```

### 3. **Canvas (Artifacts)**

A _Canvas_ is a dynamic, interactive UI component that previews what will be created **before** the user confirms.

**Canvas Types**:
- `form` - Input form for parameters
- `table` - Display data in table
- `confirm` - Simple yes/no confirmation
- `text` - Text-only message

**Example Canvas**:
```typescript
artifact: {
  type: 'form',
  props: {
    title: 'Create new: Add Task',
    description: 'Please review and confirm',
    fields: [
      {
        id: 'title',
        label: 'Task Title',
        type: 'text',
        value: 'do laundry',
        required: true
      },
      {
        id: 'dueDate',
        label: 'Due Date',
        type: 'date',
        value: '2025-03-15'
      }
    ]
  }
}
```

### 4. **Reasoning Engine**

The Bridge uses simple keyword matching + NLP to:

1. **Analyze Intent** - What does the user want to do?
   - Looks for action keywords: "create", "add", "update", "delete"
   - Matches against skill keywords
   - Calculates confidence (0-100%)

2. **Select Skill** - Which skill does this match?
   - Finds highest-confidence skill
   - Falls back to keyword search if no exact match

3. **Extract Parameters** - What values did they provide?
   - Extracts titles/descriptions from quoted text
   - Parses numbers and dates
   - Matches enum values

4. **Generate Canvas** - Build preview UI
   - Creates form with extracted values
   - Allows user to edit before confirming

---

## File Structure

```
src/modules/intelligence/
├── types.ts                      # Type definitions (Skills, Protocol, Canvas)
├── skills.ts                     # Skills registry (pre-defined skills)
├── Bridge.ts                     # Core reasoning engine
├── useIntelligence.ts            # React hook for integration
├── utils/
│   └── parser.ts                # NLP & parameter extraction
└── components/
    ├── IntelligenceCanvas.tsx   # Canvas UI component
    ├── IntelligenceCanvas.css   # Canvas styling
    └── IntelligenceChat.tsx     # (Coming soon) Chat interface
```

### File Descriptions

**types.ts** (280 lines)
- Defines all TypeScript interfaces
- Skill manifest structure
- Request/response protocol
- Canvas artifact types
- Reasoning engine types

**skills.ts** (350 lines)
- WorkHub skills (create_project, add_task, log_time)
- PersonalHub skills (create_note, add_reminder, add_todo)
- FinanceHub skills (record_expense, record_income, set_budget)
- Skill registry and lookup functions

**Bridge.ts** (250 lines)
- Main intelligence execution engine
- Intent analysis
- Skill selection
- Parameter extraction
- Canvas artifact generation
- Redux action building

**parser.ts** (350 lines)
- Keyword analysis
- Natural language parameter extraction
- Date/number/enum parsing
- Validation utilities

**IntelligenceCanvas.tsx** (400 lines)
- React component for all canvas types
- Form fields, tables, confirmations
- User input handling
- Error display

**useIntelligence.ts** (150 lines)
- React hook for easy integration
- `sendPrompt()` - Send a prompt
- `confirmAction()` - Execute confirmed action
- `cancelAction()` - Cancel preview

---

## How It Works

### Step-by-Step Execution

1. **User Types Prompt**
   ```
   "Add task do laundry by 5pm"
   ```

2. **Bridge Analyzes Intent**
   - Detects keywords: "Add", "task"
   - Matches to skill: `add_task`
   - Confidence: 95%

3. **Extract Parameters**
   - Title: "do laundry"
   - Due: Today at 5pm
   - Priority: medium (default)

4. **Generate Canvas**
   - Form UI with extracted values
   - User can edit/confirm

5. **On User Confirmation**
   - Build Redux action:
     ```tsx
     {
       type: 'tasks/add',
       payload: {
         title: 'do laundry',
         dueDate: '2025-03-07T17:00:00Z',
         priority: 'medium'
       }
     }
     ```
   - Dispatch to store
   - Update UI

6. **Feedback**
   - Task appears in WorkHub
   - Confirmation message shown

---

## Usage Guide

### Using the Hook

```tsx
import { useIntelligence } from '@/modules/intelligence';

function IntelligencePanel() {
  const {
    sendPrompt,
    isLoading,
    currentArtifact,
    lastError,
    confidenceScore,
    confirmAction,
    cancelAction
  } = useIntelligence('WorkHub');

  return (
    <div>
      {/* Input */}
      <input
        placeholder="What do you want to do?"
        onKeyPress={(e) => {
          if (e.key === 'Enter') {
            sendPrompt(e.currentTarget.value);
          }
        }}
      />

      {/* Loading */}
      {isLoading && <p>Thinking...</p>}

      {/* Canvas Preview */}
      {currentArtifact && (
        <IntelligenceCanvas
          artifact={currentArtifact}
          onConfirm={confirmAction}
          onCancel={cancelAction}
          isLoading={isLoading}
        />
      )}

      {/* Error */}
      {lastError && <p className="error">{lastError}</p>}

      {/* Confidence */}
      <p>Confidence: {confidenceScore}%</p>
    </div>
  );
}
```

### Adding a New Skill

1. **Define the Skill** in `skills.ts`:
```typescript
export const myNewSkill: SkillManifest = {
  id: 'my_new_skill',
  name: 'My New Skill',
  description: 'What it does',
  icon: '🎯',
  hub: 'WorkHub',
  keywords: ['keyword1', 'keyword2'],
  action: 'my/action',
  paramSchema: {
    param1: {
      type: 'string',
      required: true,
      description: 'Description'
    }
  }
};
```

2. **Export in Registry**:
```typescript
export const workHubSkills = [
  // ... existing
  myNewSkill
];
```

3. **Create Redux Action** in your store slice:
```typescript
case 'my/action':
  return {
    ...state,
    items: [...state.items, action.payload]
  };
```

4. **Test**:
```
User: "my new skill with param1 value"
Bridge: Matches skill, extracts param1
Canvas: Shows preview
User: Confirms
Redux: Action dispatched
```

---

## Extending the Module

### Future Enhancements

1. **Context Awareness**
   - Remember previous commands
   - Suggest next actions based on history
   - Per-hub context (switch between hubs)

2. **Voice Input**
   - Speech-to-text integration
   - Voice confirmation ("yes", "no")

3. **Smarter NLP**
   - Regex pattern matching for complex inputs
   - Semantic similarity (TF-IDF or embeddings)
   - Named entity recognition

4. **External APIs**
   - Weather API for date-based reminders
   - Calendar sync for due dates
   - Email integration for notifications

5. **Learning**
   - Track user corrections
   - Improve keyword matching over time
   - Personalized suggestions

6. **Chat History**
   - Save previous prompts
   - Replay past actions
   - Undo/redo capabilities

---

## OpenClaw Integration

### How ATHENEA Mirrors OpenClaw

| OpenClaw | ATHENEA Intelligence |
|----------|-----------------|
| Gateway | Bridge (execution engine) |
| Skills | skill.ts registry |
| Protocol | JSON-RPC style messaging |
| Canvas/A2UI | IntelligenceCanvas component |
| Intent Analysis | parser.ts (intent analysis) |
| Channels | Hubs (WorkHub, PersonalHub, FinanceHub) |
| Workspace | Redux store |

### Differences

- **OpenClaw**: Multi-tool, multi-channel assistant
- **ATHENEA**: Single-user productivity assistant
- **OpenClaw**: Server-based (Gateway + Nodes)
- **ATHENEA**: Client-side only (offline-first)
- **OpenClaw**: Advanced NLP/LLM reasoning
- **ATHENEA**: Keyword + regex pattern matching

### Potential OpenClaw Hooks

If integrating with actual OpenClaw later:

1. **Replace Bridge with OpenClaw Agent**
   - Send prompts to OpenClaw gateway
   - Receive reasoning + tool selections
   - Execute same Redux actions

2. **Use OpenClaw Skills**
   - Sync skill definitions from ClawHub
   - Extend with ATHENEA-specific skills
   - Inherit OpenClaw improvements

3. **Canvas Compatibility**
   - OpenClaw A2UI → React components
   - Same artifact structure
   - React wrapper for OpenClaw canvas

---

## Future Roadmap

### Phase 1: ✅ Foundation (Current)
- [x] Type definitions
- [x] Skills registry
- [x] Bridge engine
- [x] Parser utilities
- [x] Canvas component
- [x] React hook

### Phase 2: 🔄 Integration
- [ ] Connect to Intelligence page
- [ ] Chat UI for prompts
- [ ] Conversation history
- [ ] Error handling UI
- [ ] Loading states

### Phase 3: 🚀 Enhancement
- [ ] Voice input
- [ ] Context awareness
- [ ] Smarter NLP
- [ ] Learning system
- [ ] Multi-hub coordination

### Phase 4: 🔌 OpenClaw Integration
- [ ] OpenClaw Gateway connection
- [ ] Hybrid execution (Bridge + Gateway)
- [ ] ClawHub skill sync
- [ ] Advanced reasoning

---

## Testing

### Unit Tests (TODO)

```typescript
// Test intent analysis
test('analyzeIntent detects "add task"', () => {
  const intent = analyzeIntent('add task fix bug');
  expect(intent.matchedSkill.id).toBe('add_task');
  expect(intent.confidence).toBeGreaterThan(80);
});

// Test parameter extraction
test('extracts date from "tomorrow"', () => {
  const params = extractParameters(
    'add task due tomorrow',
    { dueDate: { type: 'date', required: false } }
  );
  expect(params.dueDate).toBeDefined();
});

// Test Canvas rendering
test('generates form artifact for add_task', () => {
  const artifact = buildCanvasArtifact(addTaskSkill, { title: 'test' });
  expect(artifact.type).toBe('form');
  expect(artifact.props.fields).toBeDefined();
});
```

---

## Troubleshooting

### Issue: Skill Not Matching
- **Check**: Keywords spelled correctly
- **Check**: Skill registered in `allSkills`
- **Check**: Confidence score (log `calculateConfidence()`)

### Issue: Parameters Not Extracting
- **Check**: Parameter pattern in `extractParameterValue()`
- **Check**: User input matches expected format
- **Log**: `extractParameters()` output

### Issue: Canvas Not Rendering
- **Check**: Artifact type is valid (`form`, `table`, `confirm`, `text`)
- **Check**: Props have required fields (`title`, `fields`, etc.)
- **Check**: CSS loaded

---

## API Reference

### IntelligenceBridge

```typescript
bridge.processPrompt(request, getState, dispatch): Promise<IntelligenceResponse>
bridge.executeAction(response, dispatch, getState): Promise<void>
bridge.getConversationHistory(): IntelligenceRequest[]
bridge.clearHistory(): void
```

### useIntelligence Hook

```typescript
const {
  sendPrompt,           // (prompt, hub?) => Promise<void>
  isLoading,           // boolean
  currentResponse,     // IntelligenceResponse | null
  currentArtifact,     // CanvasArtifact | null
  lastError,          // string | null
  confidenceScore,    // 0-100
  confirmAction,      // () => Promise<void>
  cancelAction,       // () => void
  clearHistory        // () => void
} = useIntelligence('WorkHub');
```

### Skills Registry

```typescript
getSkillsByHub(hub): SkillManifest[]
getSkillById(id): SkillManifest | undefined
findSkillByKeywords(input): SkillManifest | null
```

---

## Contributing

To add a new skill:

1. Define in `skills.ts`
2. Add Redux action handler
3. Add tests
4. Update this README

---

## License

Part of ATHENEA (MIT). Inspired by OpenClaw.
