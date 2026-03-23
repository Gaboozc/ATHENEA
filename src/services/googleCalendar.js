const TOKEN_KEY = 'athenea.google.token';
const REFRESH_TOKEN_KEY = 'athenea.google.refresh_token';
const TOKEN_EXPIRY_KEY = 'athenea.google.token_expiry';

// ── Token storage ─────────────────────────────────────────────────────────────

export const getGoogleToken = () => {
  try { return localStorage.getItem(TOKEN_KEY); } catch { return null; }
};

export const setGoogleToken = (token, expiresInSeconds = 3600) => {
  try {
    localStorage.setItem(TOKEN_KEY, token);
    const expiresAt = Date.now() + (expiresInSeconds - 60) * 1000; // 1 min early
    localStorage.setItem(TOKEN_EXPIRY_KEY, String(expiresAt));
  } catch { /* ignore */ }
};

export const setGoogleRefreshToken = (refreshToken) => {
  try { localStorage.setItem(REFRESH_TOKEN_KEY, refreshToken); } catch { /* ignore */ }
};

export const getGoogleRefreshToken = () => {
  try { return localStorage.getItem(REFRESH_TOKEN_KEY); } catch { return null; }
};

export const clearGoogleToken = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
  } catch { /* ignore */ }
};

export const clearAllGoogleTokens = () => {
  try {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(TOKEN_EXPIRY_KEY);
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  } catch { /* ignore */ }
};

// ── Token expiry check ────────────────────────────────────────────────────────

export const isTokenExpired = () => {
  try {
    const expiry = localStorage.getItem(TOKEN_EXPIRY_KEY);
    if (!expiry) return true; // no expiry stored → assume expired
    return Date.now() >= Number(expiry);
  } catch {
    return true;
  }
};

// ── Silent token refresh ──────────────────────────────────────────────────────

export const refreshAccessToken = async () => {
  const refreshToken = getGoogleRefreshToken();
  if (!refreshToken) {
    const err = new Error('No refresh token available. Re-authenticate with Google.');
    err.code = 'NEED_AUTH';
    throw err;
  }

  const clientId = import.meta?.env?.VITE_GOOGLE_CLIENT_ID || '';
  if (!clientId) {
    const err = new Error('VITE_GOOGLE_CLIENT_ID not configured.');
    err.code = 'MISSING_CONFIG';
    throw err;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    grant_type: 'refresh_token',
    refresh_token: refreshToken,
  });

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: body.toString(),
  });

  if (!res.ok) {
    clearAllGoogleTokens();
    const err = new Error('Token refresh failed. Re-authenticate with Google.');
    err.code = 'REFRESH_FAILED';
    throw err;
  }

  const data = await res.json();
  setGoogleToken(data.access_token, data.expires_in || 3600);
  // Google may rotate the refresh token
  if (data.refresh_token) {
    setGoogleRefreshToken(data.refresh_token);
  }
  return data.access_token;
};

// ── Ensure valid token (refresh if needed) ────────────────────────────────────

const ensureValidToken = async () => {
  if (isTokenExpired()) {
    return refreshAccessToken();
  }
  return getGoogleToken();
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
  if (forceInteractiveAuth || !getGoogleToken()) {
    const err = new Error('Google Calendar no conectado. Conecta tu cuenta primero.');
    err.code = 'NEED_AUTH';
    throw err;
  }

  // Silently refresh if token is expired
  let token;
  try {
    token = await ensureValidToken();
  } catch (refreshErr) {
    throw refreshErr;
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
    // Hard expiry — clear tokens and ask user to re-auth
    clearAllGoogleTokens();
    const err = new Error('Token de Google expirado. Vuelve a conectar.');
    err.code = 'TOKEN_EXPIRED';
    throw err;
  }

  if (!res.ok) {
    throw new Error(`Google Calendar API error: ${res.status} ${res.statusText}`);
  }

  return res.json();
};
