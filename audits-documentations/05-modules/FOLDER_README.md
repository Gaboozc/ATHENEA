# 05 — Feature Modules

ATHENEA is organized into three main hubs, each with dedicated sub-modules.

## Subfolders

| Folder | Hub | Modules |
|--------|-----|---------|
| [finance/](finance/) | Finance Hub | Wallets, Expenses, Goals, Debts, Payments |
| [work/](work/) | Work Hub | Tasks, Projects, Focus, Collaborators |
| [personal/](personal/) | Personal Hub | Journal, Routines, Habits, Check-ins |
| [calendar/](calendar/) | Calendar | Events, Google Calendar sync |

## Module Architecture Pattern

Each module follows this pattern:

```
src/pages/[ModulePage].jsx       ← UI component
src/pages/[ModulePage].css       ← Module-specific styles
src/store/slices/[module]Slice.ts ← Redux slice
```

### Empty State Pattern

All modules use `<EmptyState>` from `src/components/EmptyState/` when data arrays are empty:

```jsx
import EmptyState from '../components/EmptyState/EmptyState';

{items.length === 0 && (
  <EmptyState
    icon="📭"
    title="No hay tareas"
    message="Crea tu primera tarea para comenzar"
    ctaLabel="+ Nueva tarea"
    onCta={() => setShowForm(true)}
  />
)}
```

## Hub → Agent Mapping

```
Work Hub    → Cortana (productivity strategist)
Finance Hub → Jarvis  (financial auditor)
Personal Hub → SHODAN (wellbeing monitor)
```
