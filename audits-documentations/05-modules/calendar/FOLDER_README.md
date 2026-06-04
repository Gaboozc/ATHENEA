# 05 / Calendar Module

## Documents in this folder

| File | Description |
|------|-------------|
| [README_CALENDAR_AUDIT.md](README_CALENDAR_AUDIT.md) | Full calendar module audit |

## Features

| Feature | Status |
|---------|--------|
| Local events creation | ✅ |
| Google Calendar OAuth connect | ✅ |
| Bi-directional sync | ✅ |
| Event categories | ✅ |
| Day / Week / Month views | ✅ |
| Finance day summary overlay | ✅ |

## Google Calendar Setup

OAuth uses the web Client ID (stored in `.env`):
```
VITE_GOOGLE_CLIENT_ID=your-client-id.apps.googleusercontent.com
```

### For personal use (single device)
- Add `https://localhost` to authorized JavaScript origins in Google Cloud Console
- The Client ID is per-app, not per-user — each person uses their own Google account

### For Play Store distribution
- Add Android OAuth client with SHA-1 of release keystore
- Publish the OAuth app in Google Cloud Console (required for >100 test users)

## Sync Hook

```ts
// useGoogleCalendar.js
const { login, disconnect, sync, isConnected, lastSyncAt } = useGoogleCalendar();
```

External calendar observer (`useExternalCalendarObserver`) polls for sync every 30 minutes while app is open.

## CalendarSlice — Key Actions

| Action | Description |
|--------|-------------|
| `addEvent` | Add local event |
| `updateEvent` | Modify existing event |
| `deleteEvent` | Remove event |
| `syncExternalEvents` | Import Google Calendar events (AsyncThunk) |
| `setGoogleCalendarConnected` | Toggle connection state |
