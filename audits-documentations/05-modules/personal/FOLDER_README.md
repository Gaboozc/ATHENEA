# 05 / Personal Module

Managed by **SHODAN** 👁️ (Wellbeing Monitor).

## Documents in this folder

| File | Description |
|------|-------------|
| [README_PERSONAL_AUDIT.md](README_PERSONAL_AUDIT.md) | Full personal module audit |

## Sub-modules

| Module | Slice | Key Features |
|--------|-------|-------------|
| Journal | `journalSlice` | Daily entries, mood tags, search |
| Routines | `routinesSlice` | Daily habit tracking, streak counting |
| Check-ins | `checkinsSlice` | Mood/energy daily check-in |
| Notes | `notesSlice` | Quick notes with reminder dates |
| Todos | `todosSlice` | Simple personal todo list |

## Geofencing Integration

`DeviceMonitor.ts` reads `userSettings.geofencing` (home/work lat+lng+radius) and uses the Haversine formula to determine the user's current zone. SHODAN uses this context when generating wellbeing insights.

```ts
// DeviceMonitor.resolveZone() reads:
state.userSettings.geofencing.home = { lat, lng, radius }
state.userSettings.geofencing.work = { lat, lng, radius }
```

## Native Notifications (Personal)

Notes with `reminderDate` trigger native Android notifications at 9AM on:
- 7 days before
- 3 days before
- 1 day before
- Day of reminder

## SHODAN Context

SHODAN monitors patterns across journal entries, routine completions, and check-in moods. Generates alerts when:
- Routine streak broken (3+ days)
- Mood consistently low
- Journal shows stress keywords
