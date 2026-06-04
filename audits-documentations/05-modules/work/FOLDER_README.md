# 05 / Work Module

Managed by **Cortana** 🧿 (Productivity Strategist).

## Documents in this folder

| File | Description |
|------|-------------|
| [README_WORK_AUDIT.md](README_WORK_AUDIT.md) | Full work module audit |

## Sub-modules

| Module | Slice | Key Features |
|--------|-------|-------------|
| Tasks | `tasksSlice` | Tasks + subtasks + sub-subtasks, 3 levels deep |
| Projects | `projectsSlice` | Projects with members and task assignment |
| Focus | `focusSlice` | Pomodoro sessions, deep work tracking |
| Collaborators | `collaboratorsSlice` | Team members for task assignment |

## MyTasks Views

MyTasks supports 4 views:
- **Lista** — hierarchical list with expand/collapse
- **Kanban** — columns by status (Todo / In Progress / Done)
- **Tabla** — spreadsheet-style editable table
- **Gantt** — timeline view with date ranges

## Task Level System

Tasks have 3 levels set by the Gatekeeper questionnaire (NOT manually editable):
- `critical` — urgent, high-impact
- `high-velocity` — important, time-sensitive
- `backlog` — low priority, future work

> ⚠️ Level badges are **read-only** in the UI. They are set exclusively via the Gatekeeper questionnaire when creating a task.

## Collaborator Assignment

Tasks, subtasks, and sub-subtasks can be assigned to collaborators via `<AssigneeSelect>`. If no collaborators exist, the selector shows "No collaborators" message.

## Cortana Context Injection
`mainGoal` from `userSettingsSlice` is injected into Cortana's system prompt — tasks aligned to the goal are prioritized in AI recommendations.
