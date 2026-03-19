const TOKEN_KEY = 'athenea.google.token';

export const getGoogleToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};

export const setGoogleToken = (token) => {
  try { localStorage.setItem(TOKEN_KEY, token); } catch { /* ignore */ }
};

export const clearGoogleToken = () => {
  try { localStorage.removeItem(TOKEN_KEY); } catch { /* ignore */ }
};

/**
 * Fetches events from Google Calendar primary calendar.
 * Called by calendarSlice.syncExternalEvents thunk.
 */
export const listGoogleCalendarEvents = async ({
  timeMin,
  timeMax,
  maxResults = 100,
  forceInteractiveAuth = false,
} = {}) => {
  const token = getGoogleToken();

  if (!token || forceInteractiveAuth) {
    const err = new Error('Google Calendar no conectado. Conecta tu cuenta primero.');
    err.code = 'NEED_AUTH';
    throw err;
  }

  const params = new URLSearchParams({
    timeMin,
    timeMax,
    maxResults: String(maxResults),
    singleEvents: 'true',
    orderBy: 'startTime',
  });

  const res = await fetch(
    `https://www.googleapis.com/calendar/v3/calendars/primary/events?${params}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (res.status === 401) {
    clearGoogleToken();
    const err = new Error('Token de Google expirado. Vuelve a conectar.');
    err.code = 'TOKEN_EXPIRED';
    throw err;
  }

  if (!res.ok) {
    throw new Error(`Google Calendar API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
};
