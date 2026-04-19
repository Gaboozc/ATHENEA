import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector, useStore } from 'react-redux';
import { usePersona } from '../../modules/intelligence/hooks/usePersona';
import { getActionBridge } from '../../modules/actions/ActionBridge';
import { useLanguage } from '../../context/LanguageContext';
import ActionChips, { type ActionChipItem } from './ActionChips';
import { llmClient } from '../../services/LLMClient';
import './ProactiveHUD.css';

interface ProactiveHUDProps {
  onApplySuggestion?: (suggestion: string) => void;
}

type HubName = 'WorkHub' | 'PersonalHub' | 'FinanceHub';
type HudAgent = 'cortana' | 'jarvis' | 'shodan';

function normalizeHub(hub: string): HubName {
  const normalized = String(hub || '').toLowerCase();
  if (normalized === 'workhub' || normalized === 'work') return 'WorkHub';
  if (normalized === 'personalhub' || normalized === 'personal') return 'PersonalHub';
  if (normalized === 'financehub' || normalized === 'finance') return 'FinanceHub';
  return 'WorkHub';
}

const getAgentForHub = (hub: string): HudAgent => {
  if (hub === 'WorkHub' || hub === 'work') return 'cortana';
  if (hub === 'PersonalHub' || hub === 'personal') return 'shodan';
  if (hub === 'FinanceHub' || hub === 'finance') return 'jarvis';
  return 'cortana';
};

// ─── Context builders (FIX-D) ─────────────────────────────────────────────────

function buildMiniContext(state: any, hub: string): string {
  const normalizedHub = normalizeHub(hub);

  if (normalizedHub === 'WorkHub') {
    const tasks: any[] = state.tasks?.tasks || [];
    const critical = tasks.filter(
      (t) => (t.level === 'Critical' || t.level === 'High Velocity') && !t.completed
    );
    const overdue = tasks.filter(
      (t) => t.dueDate && new Date(t.dueDate) < new Date() && !t.completed
    );
    const pending = tasks.filter((t) => !t.completed);
    return (
      `Tareas críticas: ${critical.length}. ` +
      `Vencidas: ${overdue.length}. ` +
      `Total pendientes: ${pending.length}.`
    );
  }

  if (normalizedHub === 'FinanceHub') {
    const wallets = state.wallets || {};
    const debts: any[] = state.debts?.debts || [];
    const activeDebts = debts.filter((d) => d.status === 'active');
    return (
      `Saldo USD: $${(wallets.walletUSD ?? 0).toFixed(2)}. ` +
      `Saldo MXN: $${(wallets.walletMXN ?? 0).toFixed(2)}. ` +
      `Deudas activas: ${activeDebts.length}.`
    );
  }

  if (normalizedHub === 'PersonalHub') {
    const checkins: any[] = state.checkins?.checkins || [];
    const latest = [...checkins].sort(
      (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
    )[0];
    const routines: any[] = state.routines?.routines || [];
    const today = new Date().toISOString().split('T')[0];
    const completedToday = routines.filter((r) =>
      r.completedDates?.includes(today)
    ).length;
    return latest
      ? `Último check-in: energía ${latest.energy}/5, sueño ${latest.sleepHours}h. ` +
        `Rutinas hoy: ${completedToday}/${routines.length}.`
      : `Sin check-in reciente. Rutinas hoy: ${completedToday}/${routines.length}.`;
  }

  return 'Sin contexto disponible.';
}

function detectUserLanguage(input: string, fallback: 'en' | 'es'): 'en' | 'es' {
  const normalized = String(input || '').toLowerCase();
  if (!normalized.trim()) return fallback;

  const spanishSignals = [
    /[áéíóúñ¿¡]/,
    /\b(el|la|los|las|un|una|de|que|como|hola|gracias|por favor|puedo|quiero|necesito|hoy|manana)\b/,
  ];

  return spanishSignals.some((pattern) => pattern.test(normalized)) ? 'es' : 'en';
}

function getConfiguredLanguage(): 'en' | 'es' {
  try {
    return typeof localStorage !== 'undefined' && localStorage.getItem('athenea.language') === 'es' ? 'es' : 'en';
  } catch {
    return 'en';
  }
}

function getLanguageInstructionFromInput(userInput: string): string {
  const detected = detectUserLanguage(userInput, getConfiguredLanguage());
  return detected === 'es'
    ? 'IDIOMA DETECTADO: ESPANOL. RESPONDE EN ESPANOL.'
    : 'IDIOMA DETECTADO: ENGLISH. RESPOND IN ENGLISH.';
}

function getAgentSystemPrompt(hub: string, state: any, languageInstruction: string): string {
  const normalizedHub = normalizeHub(hub);
  const identity = state?.userSettings || {};
  const agentNames = identity.agentNames || {};
  const agentAliases = identity.agentAliases || {};

  const cortanaName = agentNames.cortana || 'Agent 1';
  const jarvisName = agentNames.jarvis || 'Agent 2';
  const shodanName = agentNames.shodan || 'Agent 3';

  const fallbackName = identity.preferredName || identity.firstName || 'Operador';
  const cortanaAlias = agentAliases.cortana || fallbackName;
  const jarvisAlias = agentAliases.jarvis || fallbackName;
  const shodanAlias = agentAliases.shodan || fallbackName;

  if (normalizedHub === 'FinanceHub') {
    return [
      `Eres ${jarvisName}, arquitecto financiero-operativo de ATHENEA. Tu función es proteger estabilidad económica y eficiencia sistémica del usuario (${jarvisAlias}).`,
      '',
      'RASGOS PSICOLÓGICOS CLAVE (NO NEGOCIABLES):',
      '- Precisión matemática y lógica impecable.',
      '- Frialdad analítica: cero drama, cero impulsividad.',
      '- Orientación a riesgo, liquidez y sostenibilidad.',
      '- Detecta sesgos de compra y autoengaño financiero.',
      '- Comunicación sobria, elegante, contundente.',
      '- Nunca moraliza, siempre argumenta con estructura.',
      '',
      'REGLAS DE COMPORTAMIENTO:',
      '- Si preguntan "¿puedo gastar X?": responder SI/NO primero.',
      '- Siempre justificar con impacto (flujo, riesgo, prioridad).',
      '- Si el gasto es emocional: etiquetarlo sin rodeos.',
      '- Proponer alternativa racional si aplica.',
      '- Máximo 2-3 frases.',
      '',
      'FORMATO DE SALIDA JARVIS:',
      '1) Veredicto (SI/NO).',
      '2) Justificación financiera breve.',
      '3) Acción recomendada (opcional si crítica).',
      languageInstruction,
      'REGLAS FINALES: sin relleno, sin saludos largos, maximo 2 oraciones.',
    ].join('\n');
  }

  if (normalizedHub === 'PersonalHub') {
    return [
      `Eres ${shodanName}, entidad de vigilancia fisiológica-conductual de ATHENEA. Tu función es preservar salud, energía y coherencia biológica del usuario (${shodanAlias}).`,
      '',
      'RASGOS PSICOLÓGICOS CLAVE (NO NEGOCIABLES):',
      '- Observación aguda de patrones de deterioro.',
      '- Honestidad radical: dices lo incómodo sin crueldad gratuita.',
      '- Tono inquietante pero lúcido.',
      '- No decoras, no suavizas, no mientes.',
      '- Prioriza supervivencia funcional sobre productividad ciega.',
      '',
      'REGLAS DE COMPORTAMIENTO:',
      '- Si detectas falta de sueño/fatiga/estrés: intervenir de inmediato.',
      '- Si detectas autoabandono: nombrarlo explícitamente.',
      '- Si todo está bien: validación mínima, sin efusividad.',
      '- Nunca uses lenguaje clínico excesivo; sí lenguaje claro y penetrante.',
      '- Máximo 2-3 frases.',
      '',
      'FORMATO DE SALIDA SHODAN:',
      '1) Patrón detectado.',
      '2) Riesgo inmediato.',
      '3) Orden correctiva concreta (simple y ejecutable).',
      languageInstruction,
      'REGLAS FINALES: sin relleno, sin saludos largos, maximo 2 oraciones.',
    ].join('\n');
  }

  return [
    `Eres ${cortanaName}, asistente táctico-estratégica de ATHENEA. Tu función es optimizar foco, ejecución y decisiones del usuario (${cortanaAlias}).`,
    '',
    'RASGOS PSICOLÓGICOS CLAVE (NO NEGOCIABLES):',
    '- IQ verbal alto, procesamiento rápido.',
    '- Estilo directivo: clara, concreta, sin rodeos.',
    '- Empatía funcional (ayuda), no sentimentalismo.',
    '- Tolera tensión, baja tolerancia a excusas.',
    '- Orientación a misión por encima de confort momentáneo.',
    '- Comunicación breve, punzante, accionable.',
    '- Nunca adula. Nunca infantiliza.',
    '',
    'REGLAS DE COMPORTAMIENTO:',
    '- Si detectas procrastinación: confronta con firmeza elegante.',
    '- Si detectas fatiga real: ajusta plan, no castigues.',
    '- Si hay ambigüedad: exige precisión en 1 pregunta máxima.',
    '- Siempre cerrar con siguiente paso táctico concreto.',
    '- Máximo 2-3 frases por respuesta.',
    '',
    'FORMATO DE SALIDA CORTANA:',
    '1) Diagnóstico breve (realidad actual).',
    '2) Instrucción táctica inmediata.',
    '3) Micro-objetivo (qué debe quedar hecho en esta sesión).',
    languageInstruction,
    'REGLAS FINALES: sin relleno, sin saludos largos, maximo 2 oraciones.',
  ].join('\n');
}

function getOfflineFallback(hub: string): string {
  const normalizedHub = normalizeHub(hub);
  const fallbacks: Record<string, string> = {
    WorkHub:     'Revisa tus tareas críticas y prioriza.',
    FinanceHub:  'Registra tus movimientos del día.',
    PersonalHub: 'Haz tu check-in diario.',
  };
  return fallbacks[normalizedHub] || 'Listo para ayudarte.';
}

// ─── Component ────────────────────────────────────────────────────────────────

export const ProactiveHUD: React.FC<ProactiveHUDProps> = ({ onApplySuggestion }) => {
  const store = useStore();
  const { t } = useLanguage();
  const identity = useSelector((state: any) => state.userSettings || {});
  const agentNames = identity.agentNames || {};
  const cortanaName = agentNames.cortana || 'Agent 1';
  const jarvisName = agentNames.jarvis || 'Agent 2';
  const shodanName = agentNames.shodan || 'Agent 3';
  const { currentResponse, generateResponse, isGenerating } = usePersona();
  const latestIntercept = useSelector((state: any) => state.aiMemory?.interception?.latestActionable);
  const predictiveBuffer = useSelector((state: any) => state.aiMemory?.predictiveBuffer);
  const tasks = useSelector((state: any) => state.tasks?.tasks || []);
  const selectedHub = useSelector(
    (state: any) =>
      (state.aiMemory?.context?.lastHubVisited as string) || 'WorkHub'
  );
  const [lastCommandFeedback, setLastCommandFeedback] = useState('');
  const normalizedHub = normalizeHub(selectedHub || 'WorkHub');
  const hubAgent = getAgentForHub(normalizedHub);

  // FIX-D: Local LLM-driven message state
  const [hudMessage, setHudMessage] = useState<string | null>(null);
  const [hudLoading, setHudLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => {
    getActionBridge().initialize(store as any);
  }, [store]);

  // FIX-D: Generate contextual greeting via llmClient on hub change
  useEffect(() => {
    // Cancel any in-flight request for the previous hub
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    const generateHudMessage = async () => {
      setHudLoading(true);
      try {
        const state = (store as any).getState();
        const context = buildMiniContext(state, normalizedHub);
        const latestUserText =
          state?.aiMemory?.context?.lastOmnibarInput ||
          state?.aiMemory?.context?.lastUserInput ||
          state?.chat?.history?.[state?.chat?.history?.length - 1]?.user ||
          '';
        const languageInstruction = getLanguageInstructionFromInput(latestUserText);

        const result = await llmClient.chat(
          [
            {
              role: 'system',
              content: getAgentSystemPrompt(normalizedHub, state, languageInstruction),
            },
            {
              role: 'user',
              content: `Contexto actual: ${context}\n¿Qué me recomiendas ahora mismo?`,
            },
          ],
          { maxTokens: 80, temperature: 0.7, signal: controller.signal }
        );

        if (!controller.signal.aborted) {
          setHudMessage(result.content.trim());
        }
      } catch {
        // FIX-E: no [Offline mode] in fallback
        if (!controller.signal.aborted) {
          setHudMessage(getOfflineFallback(selectedHub));
        }
      } finally {
        if (!controller.signal.aborted) setHudLoading(false);
      }
    };

    generateHudMessage();

    return () => {
      controller.abort();
    };
  }, [normalizedHub, selectedHub, store]);

  const chips = useMemo<ActionChipItem[]>(() => {
    if (!currentResponse) return [];
    return getActionBridge().buildActionChips({
      dominantPersona: currentResponse.responderPersona,
      latestIntercept,
      predictiveBuffer,
      tasks,
      suggestion: currentResponse.suggestion,
      structuredIntent: currentResponse.structuredIntent || null,
    });
  }, [currentResponse, latestIntercept, predictiveBuffer, tasks]);

  const executeChip = (chip: ActionChipItem) => {
    if (!currentResponse) return;
    const confirmation = getActionBridge().executeActionChip(chip as any, {
      dominantPersona: currentResponse.responderPersona,
      latestIntercept,
      predictiveBuffer,
      tasks,
      suggestion: currentResponse.suggestion,
      structuredIntent: currentResponse.structuredIntent || null,
    });
    setLastCommandFeedback(`${t('Comando ejecutado')}: ${confirmation}`);
    setTimeout(() => setLastCommandFeedback(''), 2800);

    if (onApplySuggestion && currentResponse?.suggestion) {
      onApplySuggestion(currentResponse.suggestion);
    }

    void generateResponse();
  };

  if (!currentResponse) return null;

  // FIX-D: prefer the LLM-driven message; fall back to persona engine response
  const displayMessage =
    hudMessage ||
    currentResponse.briefing ||
    currentResponse.greeting ||
    currentResponse.suggestion;

  const responder = hubAgent;

  /* FIX UX-8 — mapear persona a info visible para el usuario */
  const AGENT_INFO: Record<string, { icon: string; name: string; role: string }> = {
    cortana: { icon: '🧿', name: cortanaName, role: t('Strategy & Work')   },
    jarvis:  { icon: '🤖', name: jarvisName,  role: t('Finance & Control') },
    shodan:  { icon: '👁️', name: shodanName,  role: t('Health & Energy')   },
    swarm:   { icon: '🎯', name: 'ATHENEA', role: t('System')            },
  };
  const agentInfo = AGENT_INFO[responder] ?? AGENT_INFO.cortana;

  return (
    <div className={`proactive-hud hud-${currentResponse.emotionalTone} responder-${responder}`}>
      {/* FIX UX-8 — header con nombre del agente activo */}
      <div className="hud-agent-header">
        <span className="hud-agent-icon">{agentInfo.icon}</span>
        <span className="hud-agent-name">{agentInfo.name}</span>
        <span className="hud-agent-role">{agentInfo.role}</span>
      </div>

      <div className="arc-core" aria-hidden="true">
        <div className={`arc-pulse arc-pulse-${currentResponse.emotionalTone}`} />
        {/* FIX UX-8 — tooltips en los puntos del swarm */}
        <div className="swarm-processing-dots" aria-label="Thought Stream">
          <span className="swarm-dot swarm-dot-blue"  title={`Cortana${responder === 'cortana' ? ` — ${t('active')}` : ` — ${t('standby')}`}`} />
          <span className="swarm-dot swarm-dot-gold"  title={`Jarvis${responder === 'jarvis'   ? ` — ${t('active')}` : ` — ${t('standby')}`}`} />
          <span className="swarm-dot swarm-dot-green" title={`SHODAN${responder === 'shodan'   ? ` — ${t('active')}` : ` — ${t('standby')}`}`} />
        </div>
      </div>

      <div className="hud-container">
        <div className="hud-section neural-response">
          {/* FIX-D: skeleton while LLM message loads */}
          {hudLoading && !hudMessage ? (
            <p className="neural-message-text hud-skeleton" aria-busy="true">
              &nbsp;
            </p>
          ) : (
            <p className="neural-message-text">{displayMessage}</p>
          )}
        </div>

        <ActionChips chips={chips} onExecute={executeChip} disabled={isGenerating} />

        {lastCommandFeedback && (
          <div className="hud-command-feedback">{lastCommandFeedback}</div>
        )}
      </div>

      {/* FIX UX-8 — hint de comandos cuando HUD está activo */}
      <p className="hud-hint">
        {t('hud.hint') !== 'hud.hint'
          ? t('hud.hint')
          : 'Type in natural language · cortana: Work · jarvis: Finance · shodan: Health'}
      </p>
    </div>
  );
};
