# Redux Integration Guide for Omnibar & Intelligence Module

## Overview

This guide shows how to connect the Intelligence Module's skills to your Redux store, allowing Omnibar actions to update real application state.

## Current State

Today:
- ✅ Intelligence Module can analyze user prompts
- ✅ Skills system identifies what to do
- ✅ Canvas artifacts show preview
- ⚠️ **Actions only update local state, not Redux**

Tomorrow:
- ✅ When user confirms, Redux actions dispatch
- ✅ Store updates with real data
- ✅ All components subscribed to Redux re-render
- ✅ Changes persist to localStorage

---

## Architecture: Skill → Redux Action

```
User Input
   ↓
Bridge.analyzeIntent()
   ↓
Match Skill (e.g., "create_project")
   ↓
Extract Parameters (e.g., name: "Website Redesign")
   ↓
Generate Canvas Artifact (form preview)
   ↓
User Confirms
   ↓
buildReduxAction(skillName, parameters)  ← THIS PART
   ↓
dispatch(action)
   ↓
Reducer updates store
   ↓
All subscribed components re-render
   ↓
Toast shows success
```

---

## Step 1: Update Skills to Include Redux Action Builders

**File**: `/src/modules/intelligence/skills.ts`

Add an `actionBuilder` property to each skill:

```typescript
// BEFORE
export const SKILLS = {
  create_project: {
    id: 'create_project',
    name: 'Create Project',
    keywords: ['create', 'project', 'new'],
    parameters: [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'string', required: false },
    ],
  },
  // ...
};

// AFTER
export const SKILLS = {
  create_project: {
    id: 'create_project',
    name: 'Create Project',
    keywords: ['create', 'project', 'new'],
    parameters: [
      { name: 'name', type: 'string', required: true },
      { name: 'description', type: 'string', required: false },
    ],
    // ✨ NEW: Redux action builder
    actionBuilder: (parameters) => ({
      type: 'projects/addProject',
      payload: {
        id: Date.now(), // or use UUID
        name: parameters.name,
        description: parameters.description || '',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    }),
  },
  // ...
};
```

---

## Step 2: Add Redux Action Builders to All Skills

Example for each hub:

### WorkHub Skills

```typescript
export const SKILLS = {
  // Work: Create Project
  create_project: {
    // ... existing config ...
    actionBuilder: (params) => ({
      type: 'projects/addProject',
      payload: {
        id: Date.now(),
        name: params.name,
        description: params.description || '',
        status: 'active',
        createdAt: new Date().toISOString(),
      },
    }),
  },

  // Work: Add Task
  add_task: {
    // ... existing config ...
    actionBuilder: (params) => ({
      type: 'tasks/addTask',
      payload: {
        id: Date.now(),
        projectId: params.projectId,
        title: params.title,
        description: params.description || '',
        dueDate: params.dueDate || null,
        priority: params.priority || 'medium',
        status: 'open',
        createdAt: new Date().toISOString(),
      },
    }),
  },

  // Work: Log Time
  log_time: {
    // ... existing config ...
    actionBuilder: (params) => ({
      type: 'timeLogs/addTimeLog',
      payload: {
        id: Date.now(),
        taskId: params.taskId,
        duration: params.duration || 0, // in minutes
        description: params.description || '',
        date: params.date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
    }),
  },
};
```

### PersonalHub Skills

```typescript
{
  // Personal: Create Note
  create_note: {
    // ... existing config ...
    actionBuilder: (params) => ({
      type: 'notes/addNote',
      payload: {
        id: Date.now(),
        title: params.title,
        content: params.content || '',
        tags: params.tags || [],
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    }),
  },

  // Personal: Add Reminder
  add_reminder: {
    // ... existing config ...
    actionBuilder: (params) => ({
      type: 'reminders/addReminder',
      payload: {
        id: Date.now(),
        title: params.title,
        description: params.description || '',
        dueDate: params.dueDate,
        dueTime: params.dueTime || '09:00',
        priority: params.priority || 'medium',
        status: 'pending',
        createdAt: new Date().toISOString(),
      },
    }),
  },

  // Personal: Add Todo
  add_todo: {
    // ... existing config ...
    actionBuilder: (params) => ({
      type: 'todos/addTodo',
      payload: {
        id: Date.now(),
        text: params.text,
        completed: false,
        dueDate: params.dueDate || null,
        priority: params.priority || 'medium',
        createdAt: new Date().toISOString(),
      },
    }),
  },
}
```

### FinanceHub Skills

```typescript
{
  // Finance: Record Expense
  record_expense: {
    // ... existing config ...
    actionBuilder: (params) => ({
      type: 'payments/addTransaction',
      payload: {
        id: Date.now(),
        type: 'expense',
        amount: params.amount,
        currency: params.currency || 'USD',
        category: params.category,
        description: params.description || '',
        date: params.date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
    }),
  },

  // Finance: Record Income
  record_income: {
    // ... existing config ...
    actionBuilder: (params) => ({
      type: 'payments/addTransaction',
      payload: {
        id: Date.now(),
        type: 'income',
        amount: params.amount,
        currency: params.currency || 'USD',
        category: params.category,
        description: params.description || '',
        date: params.date || new Date().toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
    }),
  },

  // Finance: Set Budget
  set_budget: {
    // ... existing config ...
    actionBuilder: (params) => ({
      type: 'budgets/setBudget',
      payload: {
        id: Date.now(),
        category: params.category,
        amount: params.amount,
        currency: params.currency || 'USD',
        period: params.period || 'monthly',
        createdAt: new Date().toISOString(),
      },
    }),
  },
}
```

---

## Step 3: Update Omnibar to Dispatch Redux Actions

**File**: `/src/components/Omnibar/Omnibar.tsx`

Modify the confirm action handler:

```typescript
// In Omnibar.tsx

const handleConfirmAction = async () => {
  try {
    setIsConfirming(true);

    const { skill, parameters } = currentResponse;
    const skillConfig = SKILLS[skill];

    // ✨ Build Redux action from skill config
    if (skillConfig.actionBuilder) {
      const action = skillConfig.actionBuilder(parameters);

      // Dispatch to Redux
      dispatch(action);

      // Call parent callback with success result
      onActionExecuted({
        success: true,
        skill: skillConfig.name,
        message: `${skillConfig.name} created successfully`,
        action: action, // Include action for additional processing
      });
    } else {
      // Fallback if no actionBuilder defined
      onActionExecuted({
        success: false,
        error: 'Skill does not support Redux integration yet',
      });
    }

    // Close Omnibar after confirmation
    closeOmnibar();
  } catch (error) {
    console.error('Error executing action:', error);
    onActionExecuted({
      success: false,
      error: error.message,
    });
  } finally {
    setIsConfirming(false);
  }
};
```

---

## Step 4: Update useIntelligence Hook

**File**: `/src/modules/intelligence/useIntelligence.ts`

```typescript
import { useDispatch } from 'react-redux';
import { SKILLS } from './skills';

export const useIntelligence = () => {
  const dispatch = useDispatch();
  
  const confirmAction = async (skillName, parameters) => {
    try {
      const skillConfig = SKILLS[skillName];
      
      if (!skillConfig?.actionBuilder) {
        throw new Error(`Skill "${skillName}" does not support Redux actions`);
      }

      // Build and dispatch action
      const action = skillConfig.actionBuilder(parameters);
      dispatch(action);

      return {
        success: true,
        action,
        message: `${skillConfig.name} executed successfully`,
      };
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  };

  return {
    // ... existing returns ...
    confirmAction,
  };
};
```

---

## Step 5: Test Redux Integration

### Manual Test Flow

1. **Open DevTools**
   - F12 → Redux DevTools tab (if installed)
   - Or React DevTools → look at store

2. **Open Omnibar** (Ctrl+K)

3. **Submit Command**
   - Type: "Create a project called Website Redesign"
   - Submit prompt

4. **Confirm Action**
   - Review canvas artifact form
   - Click "Confirm"

5. **Check Redux**
   - Watch Redux DevTools show new action
   - Action type: `projects/addProject`
   - Payload includes project data

6. **Verify UI Update**
   - Go to Projects page
   - New project should appear in list
   - Toast shows success message

---

## Step 6: Add Redux DevTools Support (Optional)

**File**: `/src/store.js`

If using Redux DevTools:

```javascript
import { configureStore } from '@reduxjs/toolkit';
import { composeWithDevTools } from 'redux-devtools-extension';

const store = configureStore(
  { 
    reducer: { /* your reducers */ },
    // DevTools will automatically track all dispatches
  },
  composeWithDevTools() // Optional but helpful for debugging
);

export default store;
```

---

## Step 7: Handle Edge Cases

### Validate Parameters Before Action

```typescript
// In skills.ts, add parameter validation

const validateProjectParams = (params) => {
  if (!params.name || params.name.trim() === '') {
    throw new Error('Project name is required');
  }
  if (params.name.length > 100) {
    throw new Error('Project name must be less than 100 characters');
  }
  return true;
};

// In action builder:
actionBuilder: (params) => {
  validateProjectParams(params);
  return {
    type: 'projects/addProject',
    payload: { /* ... */ },
  };
}
```

### Handle Async Operations

For skills that need API calls:

```typescript
// Use middleware or thunk pattern

export const createProjectAsync = (name, description) => async (dispatch) => {
  dispatch({ type: 'projects/loading' });
  
  try {
    const response = await api.post('/projects', { name, description });
    dispatch({
      type: 'projects/addProject',
      payload: response.data,
    });
  } catch (error) {
    dispatch({
      type: 'projects/error',
      payload: error.message,
    });
  }
};

// Then in skill:
actionBuilder: (params) => 
  createProjectAsync(params.name, params.description)
```

---

## Full Example: Complete Flow

### 1. User opens Omnibar and types:
```
"Create a project called Website Redesign due next Friday"
```

### 2. Bridge analyzes:
```javascript
{
  skill: 'create_project',
  confidence: 0.95,
  parameters: {
    name: 'Website Redesign',
    dueDate: '2024-01-19', // parsed from "next Friday"
  }
}
```

### 3. Canvas artifact generated:
```jsx
<Form>
  <Field label="Project Name" value="Website Redesign" />
  <Field label="Description" value="" />
  <Field label="Due Date" value="2024-01-19" />
  <Button>Confirm</Button>
</Form>
```

### 4. User clicks Confirm:
```javascript
// Redux action created:
{
  type: 'projects/addProject',
  payload: {
    id: 1705698000000,
    name: 'Website Redesign',
    description: '',
    dueDate: '2024-01-19',
    status: 'active',
    createdAt: '2024-01-12T14:30:00Z',
  }
}

// Dispatched to Redux
dispatch(action);
```

### 5. Reducer processes:
```javascript
// In projects reducer
case 'projects/addProject':
  return {
    ...state,
    projects: [
      ...state.projects,
      action.payload,
    ]
  };
```

### 6. UI updates automatically:
```jsx
// Projects page component (subscribed to store)
const projects = useSelector(state => state.projects.projects);

// Re-renders and shows new project in list
```

### 7. Toast notifies user:
```javascript
// In handleOmnibarActionExecuted callback:
showToast('Project created successfully', 'success');
```

---

## Checklist: Redux Integration

- [ ] Add `actionBuilder` to all skills in `skills.ts`
- [ ] Update Omnibar to use `dispatch()`
- [ ] Update `useIntelligence` hook with `confirmAction`
- [ ] Test: Ctrl+K → "Create project test" → Confirm
- [ ] Verify Redux DevTools shows action dispatch
- [ ] Check Projects page shows new project
- [ ] Verify toast notification appears
- [ ] Test with 2-3 different skills
- [ ] Test error handling (invalid parameters)
- [ ] Test on mobile (if applicable)

---

## Redux Type Definitions (TypeScript)

```typescript
// src/modules/intelligence/types.ts

export interface ReduxAction {
  type: string;
  payload: any;
  meta?: {
    skillName: string;
    timestamp: number;
  };
}

export interface SkillManifest {
  id: string;
  name: string;
  hub: 'WorkHub' | 'PersonalHub' | 'FinanceHub';
  keywords: string[];
  parameters: Parameter[];
  actionBuilder: (params: Record<string, any>) => ReduxAction; // ← NEW
}

export interface IntelligenceRequest {
  prompt: string;
  hub?: 'WorkHub' | 'PersonalHub' | 'FinanceHub';
}

export interface IntelligenceResponse {
  skill: string;
  confidence: number;
  reasoning: string;
  parameters: Record<string, any>;
  artifact?: CanvasArtifact;
  action?: ReduxAction; // ← NEW
}
```

---

## Performance Considerations

### Action Dispatch Optimization

```typescript
// Batch multiple actions
const handleMultipleActions = (skills) => {
  const actions = skills.map(skill => 
    SKILLS[skill.name].actionBuilder(skill.parameters)
  );
  
  // Dispatch all at once (if reducer supports it)
  dispatch(batchActions(actions));
};
```

### Avoid Redundant Renders

```typescript
// Use useCallback to prevent unnecessary re-renders
const handleConfirm = useCallback((skillName, params) => {
  const action = SKILLS[skillName].actionBuilder(params);
  dispatch(action);
}, [dispatch]);
```

### Track Action History

```typescript
// In reducer:
const reducers = {
  addProject(state, action) {
    state.projects.push(action.payload);
    // Track for undo/redo
    state.history.push({
      action: action.type,
      timestamp: Date.now(),
      undo: () => { /* ... */ }
    });
  }
};
```

---

## Next: Advanced Features

Once basic Redux integration works, consider:

1. **Undo/Redo System**
   - Track action history
   - Provide undo button in toast
   - Revert state on user request

2. **Offline Sync**
   - Queue actions while offline
   - Persist to localStorage
   - Sync when connection restored
   - Show "Syncing..." in toast

3. **Batch Operations**
   - Execute multiple skills in sequence
   - "Create project AND add task AND log time"
   - Progress tracking

4. **Skill Chaining**
   - "Create project" → auto "add task" → auto "set reminder"
   - Workflow automation

---

## Troubleshooting Redux Integration

**Action not dispatching?**
- ✓ Verify `actionBuilder` exists in skill config
- ✓ Check Redux DevTools for dispatch payload
- ✓ Ensure reducer case exists for action type
- ✓ Check for typos in action type name

**Data not updating?**
- ✓ Verify reducer returns new state object
- ✓ Check store subscription (useSelector)
- ✓ Look for immutability violations
- ✓ Test with Redux DevTools time-travel

**Performance issues?**
- ✓ Use Redux DevTools to find slow reducers
- ✓ Memoize selectors with reselect
- ✓ Batch actions instead of single dispatches
- ✓ Check for middleware bottlenecks

---

**Ready to integrate Redux? Let's do it! 🚀**
