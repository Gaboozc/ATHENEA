/**
 * MemoryService — Memoria persistente de ATHENEA
 *
 * Gestiona dos capas de memoria:
 *   1. Memoria episódica: hechos clave sobre el usuario (Capacitor Preferences / localStorage)
 *   2. Historial de conversación: leído desde Redux (aiMemory.omnibarChatHistory)
 *
 * Patrón de storage idéntico al usado en neuralAccess.ts:25-45.
 * En plataforma nativa usa Capacitor Preferences.
 * En web cae silenciosamente a localStorage.
 */

// ─── Storage helpers (mismo patrón que neuralAccess.ts) ───────────────────────

async function capPrefsGet(key) {
  try {
    if (!window?.Capacitor?.isNativePlatform?.()) return null;
    const { Preferences } = await import('@capacitor/preferences');
    const { value } = await Preferences.get({ key });
    return value;
  } catch {
    return null;
  }
}

async function capPrefsSet(key, value) {
  try {
    if (!window?.Capacitor?.isNativePlatform?.()) return false;
    const { Preferences } = await import('@capacitor/preferences');
    await Preferences.set({ key, value });
    return true;
  } catch {
    return false;
  }
}

async function storageGet(key) {
  const native = await capPrefsGet(key);
  return native !== null ? native : localStorage.getItem(key);
}

async function storageSet(key, value) {
  const saved = await capPrefsSet(key, value);
  if (!saved) localStorage.setItem(key, value);
}

// ─── Claves de almacenamiento ─────────────────────────────────────────────────

const KEYS = {
  EPISODIC:     'athenea_episodic_memory',
  LAST_SESSION: 'athenea_last_session',
};

const MAX_EPISODIC_ENTRIES = 50;

// ─── Memoria episódica ────────────────────────────────────────────────────────

/**
 * Guarda un hecho importante en memoria episódica.
 * Deduplica por key — el valor más reciente reemplaza al anterior.
 *
 * @param {string} key   Identificador del hecho (ej: 'mood_note', 'scheduled_event')
 * @param {string} value Contenido del hecho (max 200 chars)
 */
async function saveEpisodicFact(key, value) {
  try {
    const raw = await storageGet(KEYS.EPISODIC);
    let facts = [];
    try { facts = JSON.parse(raw || '[]'); } catch { facts = []; }

    // Dedup: remover entrada anterior con la misma key
    facts = facts.filter(f => f.key !== key);

    // Insertar nueva entrada
    facts.push({ key, value: String(value).slice(0, 200), timestamp: Date.now() });

    // Mantener solo las más recientes
    if (facts.length > MAX_EPISODIC_ENTRIES) {
      facts = facts.slice(-MAX_EPISODIC_ENTRIES);
    }

    await storageSet(KEYS.EPISODIC, JSON.stringify(facts));
  } catch (err) {
    console.warn('[MemoryService] saveEpisodicFact error:', err);
  }
}

/**
 * Retorna todos los hechos episódicos formateados como bullet list.
 * @returns {Promise<string>} String formateado o '' si no hay hechos.
 */
async function getEpisodicFacts() {
  try {
    const raw = await storageGet(KEYS.EPISODIC);
    if (!raw) return '';
    const facts = JSON.parse(raw);
    if (!Array.isArray(facts) || facts.length === 0) return '';
    return facts.map(f => `• [${f.key}]: ${f.value}`).join('\n');
  } catch {
    return '';
  }
}

/**
 * Elimina hechos episódicos más antiguos que N días.
 * @param {number} daysOld  Default: 7
 */
async function clearOldEpisodicFacts(daysOld = 7) {
  try {
    const raw = await storageGet(KEYS.EPISODIC);
    if (!raw) return;
    const cutoff = Date.now() - daysOld * 86_400_000;
    let facts = JSON.parse(raw || '[]');
    facts = facts.filter(f => f.timestamp > cutoff);
    await storageSet(KEYS.EPISODIC, JSON.stringify(facts));
  } catch {
    /* silencioso */
  }
}

// ─── Historial de conversación ────────────────────────────────────────────────

/**
 * Lee el historial de conversación desde Redux (aiMemory.omnibarChatHistory)
 * y lo convierte al formato de mensajes que espera la API de Groq/OpenAI.
 *
 * Es síncrono porque lee directamente del estado de Redux.
 *
 * @param {object} store  Redux store (pasado como parámetro para evitar acoplamiento)
 * @returns {Array<{role: 'user'|'assistant', content: string}>}
 */
function getHistory(store) {
  try {
    const state = store?.getState?.();
    const chatHistory = state?.aiMemory?.omnibarChatHistory;
    if (!Array.isArray(chatHistory) || chatHistory.length === 0) return [];

    return chatHistory
      .filter(m => m.text && !m.artifact)
      .map(m => ({
        role: m.role === 'user' ? 'user' : 'assistant',
        content: String(m.text),
      }));
  } catch {
    return [];
  }
}

// ─── Session tracking ─────────────────────────────────────────────────────────

/**
 * Guarda el timestamp de la sesión actual.
 */
async function saveLastSession() {
  await storageSet(KEYS.LAST_SESSION, String(Date.now()));
}

/**
 * Retorna el timestamp de la última sesión, o null si no existe.
 * @returns {Promise<number|null>}
 */
async function getLastSession() {
  try {
    const raw = await storageGet(KEYS.LAST_SESSION);
    if (!raw) return null;
    const ts = Number(raw);
    return isFinite(ts) ? ts : null;
  } catch {
    return null;
  }
}

// ─── Memory snapshot (para system prompt dinámico) ────────────────────────────

/**
 * Construye un snapshot completo de lo que ATHENEA sabe del usuario.
 * Combina el perfil de userSettings (Redux) con los hechos episódicos.
 *
 * Este string se inyecta en el system prompt de cada llamada a Groq.
 *
 * @param {object} store  Redux store
 * @returns {Promise<string>}
 */
async function getMemorySnapshot(store) {
  try {
    const state = store?.getState?.();
    const s = state?.userSettings ?? {};

    // Perfil del usuario (omitir campos vacíos)
    const profileLines = [];
    const nombre = s.preferredName || s.firstName;
    if (nombre)                profileLines.push(`Usuario: ${nombre}`);
    if (s.occupation)          profileLines.push(`Ocupación: ${s.occupation}`);
    if (s.mainGoal)            profileLines.push(`Meta actual: ${s.mainGoal}`);
    if (s.financialContext)    profileLines.push(`Contexto financiero: ${s.financialContext}`);
    if (s.additionalContext)   profileLines.push(`Contexto adicional: ${s.additionalContext}`);
    if (s.timezone)            profileLines.push(`Zona horaria: ${s.timezone}`);
    if (s.workingHours?.start && s.workingHours?.end) {
      profileLines.push(`Horario laboral: ${s.workingHours.start} - ${s.workingHours.end}`);
    }

    // Hechos episódicos
    const episodic = await getEpisodicFacts();

    // Última sesión
    const lastTs = await getLastSession();
    const lastSessionLine = lastTs
      ? `Última sesión: ${new Date(lastTs).toLocaleString('es-MX')}`
      : '';

    // Memoria por agente (de Redux aiMemory)
    const agentMemory = state?.aiMemory?.agentMemory ?? {};
    const agentLines = [];
    for (const [agentKey, mem] of Object.entries(agentMemory)) {
      if (mem?.recentContext) {
        const label = agentKey === 'cortana' ? 'Cortana' : agentKey === 'jarvis' ? 'Jarvis' : 'SHODAN';
        agentLines.push(`Contexto reciente de ${label}: ${mem.recentContext}`);
      }
    }

    const sections = [
      profileLines.length > 0 ? profileLines.join('\n') : '',
      episodic ? `Hechos recordados:\n${episodic}` : '',
      agentLines.length > 0 ? agentLines.join('\n') : '',
      lastSessionLine,
    ].filter(Boolean);

    return sections.join('\n\n');
  } catch (err) {
    console.warn('[MemoryService] getMemorySnapshot error:', err);
    return '';
  }
}

// ─── Export ───────────────────────────────────────────────────────────────────

export const MemoryService = {
  saveEpisodicFact,
  getEpisodicFacts,
  clearOldEpisodicFacts,
  getHistory,
  saveLastSession,
  getLastSession,
  getMemorySnapshot,
};
