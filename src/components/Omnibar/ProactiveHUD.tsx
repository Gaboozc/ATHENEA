import React, { useEffect, useMemo, useState } from 'react';
import { useSelector, useStore } from 'react-redux';
import { usePersona } from '../../modules/intelligence/hooks/usePersona';
import { getActionBridge } from '../../modules/actions/ActionBridge';
import ActionChips, { type ActionChipItem } from './ActionChips';
import './ProactiveHUD.css';

interface ProactiveHUDProps {
  onApplySuggestion?: (suggestion: string) => void;
}

export const ProactiveHUD: React.FC<ProactiveHUDProps> = ({ onApplySuggestion }) => {
  const store = useStore();
  const { currentResponse, generateResponse, isGenerating } = usePersona();
  const latestIntercept = useSelector((state: any) => state.aiMemory?.interception?.latestActionable);
  const predictiveBuffer = useSelector((state: any) => state.aiMemory?.predictiveBuffer);
  const tasks = useSelector((state: any) => state.tasks?.tasks || []);
  const [lastCommandFeedback, setLastCommandFeedback] = useState('');

  useEffect(() => {
    getActionBridge().initialize(store as any);
  }, [store]);

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
    setLastCommandFeedback(`Comando ejecutado: ${confirmation}`);
    setTimeout(() => setLastCommandFeedback(''), 2800);

    if (onApplySuggestion && currentResponse?.suggestion) {
      onApplySuggestion(currentResponse.suggestion);
    }

    void generateResponse();
  };

  if (!currentResponse) return null;

  const neuralMessage = currentResponse.briefing || currentResponse.greeting || currentResponse.suggestion;
  const responder = currentResponse.responderPersona;

  /* FIX UX-8 — mapear persona a info visible para el usuario */
  const AGENT_INFO: Record<string, { icon: string; name: string; role: string }> = {
    cortana: { icon: '🧿', name: 'Cortana', role: 'Estrategia & trabajo' },
    jarvis:  { icon: '🤖', name: 'Jarvis',  role: 'Finanzas & control'  },
    shodan:  { icon: '👁️', name: 'SHODAN',  role: 'Salud & energía'     },
    swarm:   { icon: '🎯', name: 'ATHENEA', role: 'Sistema'              },
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
          <span className="swarm-dot swarm-dot-blue"  title={`Cortana${responder === 'cortana' ? ' — activa' : ' — en espera'}`} />
          <span className="swarm-dot swarm-dot-gold"  title={`Jarvis${responder === 'jarvis'   ? ' — activo' : ' — en espera'}`} />
          <span className="swarm-dot swarm-dot-green" title={`SHODAN${responder === 'shodan'   ? ' — activo' : ' — en espera'}`} />
        </div>
      </div>

      <div className="hud-container">
        <div className="hud-section neural-response">
          <p className="neural-message-text">{neuralMessage}</p>
        </div>

        <ActionChips chips={chips} onExecute={executeChip} disabled={isGenerating} />

        {lastCommandFeedback && (
          <div className="hud-command-feedback">{lastCommandFeedback}</div>
        )}
      </div>

      {/* FIX UX-8 — hint de comandos cuando HUD está activo */}
      <p className="hud-hint">
        Escribe en lenguaje natural · <code>cortana:</code> Work · <code>jarvis:</code> Finanzas · <code>shodan:</code> Salud
      </p>
    </div>
  );
};
