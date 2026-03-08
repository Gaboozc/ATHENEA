const GOOGLE_GIS_SRC = 'https://accounts.google.com/gsi/client';
const GOOGLE_CALENDAR_SCOPE = 'https://www.googleapis.com/auth/calendar.readonly';
const TOKEN_STORAGE_KEY = 'athenea_google_calendar_token';

export interface GoogleCalendarEvent {
  id: string;
  status?: string;
  summary?: string;
  description?: string;
  location?: string;
  start?: { date?: string; dateTime?: string; timeZone?: string };
  end?: { date?: string; dateTime?: string; timeZone?: string };
  htmlLink?: string;
  updated?: string;
  creator?: { email?: string };
  organizer?: { email?: string };
}

export interface GoogleCalendarListResponse {
  items: GoogleCalendarEvent[];
  nextSyncToken?: string;
}

interface StoredToken {
  accessToken: string;
  expiresAt: number;
}

let scriptLoadPromise: Promise<void> | null = null;
let tokenClient: any = null;

function readClientId(): string | null {
  const value = (import.meta as any)?.env?.VITE_GOOGLE_CLIENT_ID;
  return typeof value === 'string' && value.trim() ? value.trim() : null;
}

function loadStoredToken(): StoredToken | null {
  try {
    const raw = window.localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (!parsed?.accessToken || !parsed?.expiresAt) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveStoredToken(token: StoredToken): void {
  window.localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(token));
}

function clearStoredToken(): void {
  window.localStorage.removeItem(TOKEN_STORAGE_KEY);
}

async function ensureGoogleIdentityScript(): Promise<void> {
  if (typeof window === 'undefined') {
    throw new Error('Google Calendar auth is only available in browser environments.');
  }

  if ((window as any).google?.accounts?.oauth2) return;
  if (scriptLoadPromise) return scriptLoadPromise;

  scriptLoadPromise = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = GOOGLE_GIS_SRC;
    script.async = true;
    script.defer = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error('Failed to load Google Identity Services script.'));
    document.head.appendChild(script);
  });

  return scriptLoadPromise;
}

async function requestAccessToken(interactive = false): Promise<string> {
  const clientId = readClientId();
  if (!clientId) {
    throw new Error('Missing VITE_GOOGLE_CLIENT_ID. Add it to your environment before syncing Google Calendar.');
  }

  const stored = loadStoredToken();
  if (stored && stored.expiresAt > Date.now() + 15_000) {
    return stored.accessToken;
  }

  await ensureGoogleIdentityScript();

  return new Promise<string>((resolve, reject) => {
    tokenClient = (window as any).google.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GOOGLE_CALENDAR_SCOPE,
      callback: (response: any) => {
        if (response?.error || !response?.access_token) {
          reject(new Error(response?.error || 'Google OAuth token response was invalid.'));
          return;
        }

        const expiresAt = Date.now() + Number(response.expires_in || 3600) * 1000;
        saveStoredToken({ accessToken: response.access_token, expiresAt });
        resolve(response.access_token);
      }
    });

    tokenClient.requestAccessToken({ prompt: interactive ? 'consent' : '' });
  });
}

export async function connectGoogleCalendar(): Promise<void> {
  await requestAccessToken(true);
}

export function disconnectGoogleCalendar(): void {
  clearStoredToken();
}

export function isGoogleCalendarConnected(): boolean {
  const stored = loadStoredToken();
  return Boolean(stored && stored.expiresAt > Date.now() + 15_000);
}

export async function listGoogleCalendarEvents(options?: {
  timeMin?: string;
  timeMax?: string;
  maxResults?: number;
  forceInteractiveAuth?: boolean;
}): Promise<GoogleCalendarListResponse> {
  const token = await requestAccessToken(Boolean(options?.forceInteractiveAuth));
  const params = new URLSearchParams({
    singleEvents: 'true',
    orderBy: 'startTime',
    maxResults: String(options?.maxResults || 50),
    timeMin: options?.timeMin || new Date().toISOString()
  });

  if (options?.timeMax) {
    params.set('timeMax', options.timeMax);
  }

  const response = await fetch(`https://www.googleapis.com/calendar/v3/calendars/primary/events?${params.toString()}`, {
    headers: {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json'
    }
  });

  if (response.status === 401) {
    clearStoredToken();
    throw new Error('Google Calendar authorization expired. Run sync again to reconnect.');
  }

  if (!response.ok) {
    const body = await response.text();
    throw new Error(`Google Calendar API error (${response.status}): ${body}`);
  }

  const payload = await response.json();
  return {
    items: Array.isArray(payload?.items) ? payload.items : [],
    nextSyncToken: payload?.nextSyncToken
  };
}
