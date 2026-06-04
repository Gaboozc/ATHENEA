# Omnibar & Toast Integration Guide

> ⚠️ **AVISO DE DESACTUALIZACIÓN** (OMNI-CLEAN-5 — 2026-03-20)
>
> Esta guía está parcialmente desactualizada:
> - **Ctrl+K NO está implementado** en el código actual
> - El Omnibar se abre via `FloatingOmnibarFab` (click) o `openOmnibarExternally(prompt, requestVoice)`
> - El Layout de ejemplo en esta guía no refleja el Layout actual
> - Ver `Omnibar.tsx` y `useOmnibar.ts` para la implementación actual

## Overview
This guide shows you how to integrate the **Omnibar** (global command palette) and **Toast notifications** into your ATHENEA application.

## Step 1: Update Layout.jsx

Replace the existing `GlobalSearch` implementation with `Omnibar`:

```jsx
// src/pages/Layout.jsx

import { Outlet } from "react-router-dom"
import { useState, useEffect } from "react"
import ScrollToTop from "../components/ScrollToTop"
import { Navbar } from "../components/Navbar"
import { GatekeeperModal } from "../components/modals/GatekeeperModal"
import { ReminderToasts } from "../components/ReminderToasts"
import NativeReminderNotifications from "../components/NativeReminderNotifications"

// ✨ NEW: Omnibar & Toast Imports
import { Omnibar } from "../components/Omnibar"
import { useOmnibar } from "../components/Omnibar/useOmnibar"
import { ToastContainer, showToast } from "../components/Toast"

export const Layout = () => {
    const { isOpen } = useOmnibar();

    // ✨ Handle Omnibar action execution
    const handleOmnibarActionExecuted = (result) => {
        if (result.success) {
            showToast(
                `${result.skill} executed successfully`,
                'success',
                3000,
                '✓'
            );
        } else {
            showToast(
                `Error: ${result.error}`,
                'error',
                3000,
                '✕'
            );
        }
    };

    return (
        <ScrollToTop>
            <Navbar />
            <div className="app-shell">
                <main className="app-content">
                    <Outlet />
                </main>
            </div>
            <GatekeeperModal />
            <ReminderToasts />
            <NativeReminderNotifications />
            
            {/* ✨ Omnibar Component (Ctrl+K to open) */}
            <Omnibar 
                defaultHub="WorkHub" 
                onActionExecuted={handleOmnibarActionExecuted}
            />
            
            {/* ✨ Toast Notification Container */}
            <ToastContainer />
        </ScrollToTop>
    )
}
```

## Step 2: Import Omnibar CSS

Update your main CSS or index.css to include Omnibar styling:

```css
/* src/index.css or your main stylesheet */

/* Import Omnibar styles */
@import './components/Omnibar/Omnibar.css';

/* Import Toast styles */
@import './components/Toast/Toast.css';
```

Alternatively, if using CSS modules or imports in Layout.jsx:

```jsx
import '../components/Omnibar/Omnibar.css';
import '../components/Toast/Toast.css';
```

## Step 3: Usage Examples

### Using Toasts Programmatically

You can trigger toasts anywhere in your app using the `showToast` function:

```jsx
import { showToast } from '@/components/Toast';

// Success notification
showToast('Task created successfully!', 'success');

// Error notification
showToast('Failed to save changes', 'error');

// Warning notification
showToast('Please review before submitting', 'warning');

// Info notification
showToast('New updates available', 'info');

// Custom duration (ms)
showToast('Quick message', 'success', 1500);

// With custom icon
showToast('Action completed', 'success', 3000, '🎉');
```

### Using the Toast Hook

In any component:

```jsx
import { useToasts } from '@/components/Toast';

export function MyComponent() {
  const toast = useToasts();

  const handleClick = () => {
    toast.success('Operation completed!');
    // or
    toast.error('Something went wrong');
    // or
    toast.warning('This action cannot be undone');
    // or
    toast.info('For your information...');
  };

  return <button onClick={handleClick}>Click me</button>;
}
```

### Omnibar Usage (Ctrl+K)

The Omnibar is now accessible globally:

1. Press **Ctrl+K** (Windows/Linux) or **Cmd+K** (Mac)
2. Type your command in natural language:
   - "Create a project called Website Redesign"
   - "Add task: Review design mockups"
   - "Record expense $50.00 for coffee"
   - "Add note about meeting notes"
3. Select a suggested skill or press Enter
4. Confirm the action when the artifact preview shows
5. Toast notification will appear on completion

## Step 4: Keyboard Shortcuts

### Omnibar Shortcuts
- **Ctrl+K / Cmd+K**: Open/Close Omnibar
- **Escape**: Close Omnibar
- **Tab**: Switch between hubs (Work → Personal → Finance)
- **Enter**: Submit prompt or confirm action
- **Esc** (in input): Close Omnibar

## Architecture

```
┌─────────────────────────────────────────┐
│          Layout.jsx (Root)              │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │   Omnibar Component              │   │
│  │  ┌────────────────────────────┐  │   │
│  │  │ useOmnibar Hook (Ctrl+K)   │  │   │
│  │  └────────────────────────────┘  │   │
│  │  ┌────────────────────────────┐  │   │
│  │  │ useIntelligence Hook       │  │   │
│  │  │ - sendPrompt()             │  │   │
│  │  │ - confirmAction()          │  │   │
│  │  └────────────────────────────┘  │   │
│  └──────────────────────────────────┘   │
│                                         │
│  ┌──────────────────────────────────┐   │
│  │   ToastContainer                 │   │
│  │  ┌────────────────────────────┐  │   │
│  │  │ Toast items (stacked)      │  │   │
│  │  │ - success, error, warning  │  │   │
│  │  │ - auto-dismiss (3s)        │  │   │
│  │  └────────────────────────────┘  │   │
│  └──────────────────────────────────┘   │
│                                         │
│  <Outlet /> (All pages)                 │
│  ┌──────────────────────────────────┐   │
│  │ WorkHub / PersonalHub /          │   │
│  │ FinanceHub / etc.                │   │
│  └──────────────────────────────────┘   │
└─────────────────────────────────────────┘
```

## Data Flow

### User performs action in Omnibar:

```
1. User opens Omnibar (Ctrl+K)
2. Types natural language prompt
   ↓
3. useIntelligence.sendPrompt()
   - Bridge analyzes intent
   - Parser extracts parameters
   - Skill is matched
   ↓
4. IntelligenceCanvas shows artifact preview
   (e.g., Form to confirm new task)
   ↓
5. User clicks "Confirm"
   - handleOmnibarActionExecuted() is called
   - Redux dispatch executes skill action
   - Data updates in store
   ↓
6. Toast notification appears
   - "Task created successfully!"
   ↓
7. Omnibar closes automatically
```

## Files Reference

- **Component**: `/src/components/Omnibar/Omnibar.tsx`
- **Hook**: `/src/components/Omnibar/useOmnibar.ts`
- **Styles**: `/src/components/Omnibar/Omnibar.css`
- **Toast Component**: `/src/components/Toast/Toast.jsx`
- **Toast Styles**: `/src/components/Toast/Toast.css`
- **Intelligence Module**: `/src/modules/intelligence/`

## Customization

### Change Default Hub

```jsx
<Omnibar defaultHub="FinanceHub" onActionExecuted={handleAction} />
// Options: "WorkHub", "PersonalHub", "FinanceHub"
```

### Customize Toast Appearance

Edit `Toast.css` to match your design system:
- Colors: `toast-success`, `toast-error`, `toast-warning`, `toast-info`
- Position: `.toast-container` (top-right by default)
- Duration: Change in `Toast.jsx` (currently 3000ms)

### Add More Toasts Globally

In any component:

```jsx
import { showToast } from '@/components/Toast';

const handleSave = async () => {
  try {
    await saveData();
    showToast('Saved successfully!', 'success');
  } catch (error) {
    showToast(`Error: ${error.message}`, 'error');
  }
};
```

## Next Steps

1. Update Layout.jsx with the code above
2. Import Toast and Omnibar CSS files
3. Test Ctrl+K to open Omnibar
4. Try creating a task: "Create task: Review design"
5. Confirm action and watch toast notification appear
6. Extend skills in `/src/modules/intelligence/skills.ts` as needed

## Troubleshooting

**Omnibar not opening?**
- Check that `useOmnibar` hook is properly initialized in Layout
- Verify Ctrl+K event listener is attached (check browser dev tools)
- Ensure `isOpen` state is being read by Omnibar component

**Toast not showing?**
- Verify `ToastContainer` is rendered in Layout
- Check that `showToast` is being called from correct import
- Inspect `.toast-container` in browser dev tools
- Verify z-index (should be 10000)

**Canvas not showing artifact?**
- Check that `useIntelligence` hook returns proper response
- Verify Bridge.processPrompt() is executing
- Check console for errors in artifact generation

## Next Phase: Offline Sync

When ready, the Toast system can be extended to:
- Show "Syncing..." during offline operations
- Display "Synced!" when connection is restored
- Queue failed actions for retry with toast feedback
