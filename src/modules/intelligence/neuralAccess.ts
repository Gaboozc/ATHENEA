export type NeuralProvider = 'openai' | 'groq';

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
  return String(value || '').toLowerCase() === 'groq' ? 'groq' : 'openai';
}

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

export function getNeuralKey(): string {
  const envKey = readEnvValue(ENV_NEURAL_API_KEY);
  if (typeof localStorage === 'undefined') return envKey;

  const localKey = String(localStorage.getItem(NEURAL_API_KEY) || '').trim();
  return localKey || envKey;
}

export function setNeuralKey(apiKey: string): void {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(NEURAL_API_KEY, String(apiKey || '').trim());
}
