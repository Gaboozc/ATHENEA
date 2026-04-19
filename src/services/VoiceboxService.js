const VOICEBOX_BASE = 'http://localhost:8000';

const VOICE_PROFILES = {
  cortana: 'd7f8f865-37c1-4e68-918e-9a4e2b4a73ad',
  jarvis: 'e4936a18-71ea-44ab-aa86-c9c97486386e',
  shodan: '8d5e442e-562a-4a69-82b9-f0b5e272cb8a',
};

let currentAudio = null;
let isSpeaking = false;

export const isVoiceboxAvailable = async () => {
  try {
    const res = await fetch(`${VOICEBOX_BASE}/`, {
      signal: AbortSignal.timeout(2000),
    });
    return res.ok;
  } catch {
    return false;
  }
};

export const speak = async (text, agent = 'cortana') => {
  if (!text?.trim()) return false;
  if (localStorage.getItem('athenea.tts.enabled') === 'false') return false;

  stopSpeaking();

  const profileId = VOICE_PROFILES[String(agent).toLowerCase()] || VOICE_PROFILES.cortana;

  try {
    const res = await fetch(`${VOICEBOX_BASE}/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: text.trim(),
        profile_id: profileId,
        language: 'es',
      }),
    });

    if (!res.ok) throw new Error(`Voicebox ${res.status}`);

    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    currentAudio = new Audio(url);
    isSpeaking = true;

    currentAudio.onended = () => {
      isSpeaking = false;
      URL.revokeObjectURL(url);
      currentAudio = null;
    };

    currentAudio.onerror = () => {
      isSpeaking = false;
      currentAudio = null;
      URL.revokeObjectURL(url);
    };

    await currentAudio.play();
    return true;
  } catch (err) {
    console.warn('VoiceboxService:', err);
    isSpeaking = false;
    return false;
  }
};

export const stopSpeaking = () => {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  isSpeaking = false;
};

export const getIsSpeaking = () => isSpeaking;

export const cleanTextForTTS = (text) => {
  return (text || '')
    .replace(/\*\*/g, '')
    .replace(/\*/g, '')
    .replace(/#{1,6}\s/g, '')
    .replace(/→/g, '')
    .replace(/[^\w\s.,!?;:áéíóúñüÁÉÍÓÚÑÜ¿¡-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
    .substring(0, 400);
};
