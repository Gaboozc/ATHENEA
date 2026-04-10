export type NeuralProvider = 'ollama' | 'openai' | 'groq';

const NEURAL_PROVIDER_KEY = 'athenea.neural.provider';
const NEURAL_API_KEY = 'athenea.neural.key';
const ENV_NEURAL_PROVIDER = 'VITE_NEURAL_PROVIDER';
const ENV_NEURAL_API_KEY = 'VITE_NEURAL_API_KEY';

function readEnvValue(name: string): string {
  try {
    const env = import.meta?.env as Record<string, string | boolean | undefined>;
    return String(env?.[name] || '').trim();
  } catch {
    return '';
  }
}

function normalizeProvider(value: string): NeuralProvider {
  const normalized = String(value || '').toLowerCase();
  if (normalized === 'groq') return 'groq';
  if (normalized === 'openai') return 'openai';
  return 'ollama';
}

// ── Capacitor Preferences helper (native builds only) ─────────────────────────
// Guard runs BEFORE the dynamic import so Vite/Rollup never bundles the module
// in web builds and import-analysis doesn't fail.

async function capPrefsGet(key: string): Promise<string | null> {
  try {
    if (!(window as any).Capacitor?.isNativePlatform?.()) return null;
    const { Preferences } = await import('@capacitor/preferences');
    const { value } = await Preferences.get({ key });
    return value;
  } catch {
    return null;
  }
}

async function capPrefsSet(key: string, value: string): Promise<boolean> {
  try {
    if (!(window as any).Capacitor?.isNativePlatform?.()) return false;
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key, value });
    return true;
  } catch {
    return false;
  }
}

// ── Provider (non-sensitive — stays synchronous) ───────────────────────────────

export function getNeuralProvider(): NeuralProvider {
  const envProvider = normalizeProvider(readEnvValue(ENV_NEURAL_PROVIDER));
  if (typeof localStorage === 'undefined') return envProvider;

  const stored = String(localStorage.getItem(NEURAL_PROVIDER_KEY) || '').trim();
  if (!stored) return envProvider;
  return normalizeProvider(stored);
}

export function setNeuralProvider(provider: NeuralProvider): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(NEURAL_PROVIDER_KEY, provider);
}

// ── In-memory cache (populated by initNeuralKey on app mount) ─────────────────

let _keyCache = '';

/** Call once during app bootstrap to populate the in-memory key cache. */
export async function initNeuralKey(): Promise<void> {
  _keyCache = await getNeuralKeyAsync();
}

// ── API key — async version (full fallback chain) ─────────────────────────────

export async function getNeuralKeyAsync(): Promise<string> {
  // 1. Environment variable (most secure for CI/server)
  const envKey = readEnvValue(ENV_NEURAL_API_KEY);
  if (envKey) return envKey;

  // 2. Capacitor Preferences (Android native only)
  const capKey = await capPrefsGet(NEURAL_API_KEY);
  if (capKey) return capKey;

  // 3. sessionStorage (web — cleared on tab/app close)
  if (typeof sessionStorage !== 'undefined') {
    const sessKey = String(sessionStorage.getItem(NEURAL_API_KEY) || '').trim();
    if (sessKey) return sessKey;
  }

  // 4. localStorage legacy migration
  if (typeof localStorage !== 'undefined') {
    const localKey = String(localStorage.getItem(NEURAL_API_KEY) || '').trim();
    if (localKey) {
      if (typeof sessionStorage !== 'undefined') {
        sessionStorage.setItem(NEURAL_API_KEY, localKey);
      }
      localStorage.removeItem(NEURAL_API_KEY);
      return localKey;
    }
  }

  return '';
}

// ── Synchronous key read (uses in-memory cache populated by initNeuralKey) ────

/** Returns the cached key synchronously. Requires initNeuralKey() to have run. */
export function getNeuralKey(): string {
  return _keyCache || readEnvValue(ENV_NEURAL_API_KEY);
}

/** @deprecated Alias for getNeuralKey() — both are now synchronous via cache. */
export function getNeuralKeySync(): string {
  return getNeuralKey();
}

// ── API key write ──────────────────────────────────────────────────────────────

export async function setNeuralKey(apiKey: string): Promise<void> {
  const trimmed = String(apiKey || '').trim();

  // Update cache immediately so sync reads reflect the new value
  _keyCache = trimmed;

  // Notify all components that depend on the key
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('athenea:neural-key-updated', { detail: { hasKey: !!trimmed } }));
  }

  // 1. Try Capacitor Preferences (native builds)
  const savedToNative = await capPrefsSet(NEURAL_API_KEY, trimmed);

  // 2. Fall back to sessionStorage
  if (!savedToNative && typeof sessionStorage !== 'undefined') {
    sessionStorage.setItem(NEURAL_API_KEY, trimmed);
  }

  // Ensure no stale copy remains in localStorage
  if (typeof localStorage !== 'undefined') {
    localStorage.removeItem(NEURAL_API_KEY);
  }
}
