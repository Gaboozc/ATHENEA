/**
 * FASE 3.1: War Room View
 * 
 * Intelligence deep-dive component that shows the internal debate
 * between agents in real-time. This is a debug/advanced view
 * allowing users to see how decisions are made.
 */

import React, { useState, useEffect } from 'react';
import { useSelector } from 'react-redux';
import './WarRoomView.css';

interface AgentDialogueEntry {
  agentType: string;
  agentName: string;
  statement: string;
  timestamp: number;
  tone: 'neutral' | 'insistent' | 'defensive' | 'override' | 'hostile';
  inResponseTo?: string;
}

interface ConflictMemoryEntry {
  id: string;
  agents: [string, string];
  topic: string;
  occurrences: number;
  lastOccurrence: number;
  needsResolution: boolean;
}

export const WarRoomView: React.FC = () => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'dialogue' | 'conflicts'>('dialogue');
  
  const agentDialogue = useSelector((state: any) => state.aiMemory?.agentDialogue?.recentDialogues || []);
  const conflictMemory = useSelector((state: any) => state.aiMemory?.conflictMemory?.conflicts || []);
  const needsIntervention = useSelector((state: any) => state.aiMemory?.conflictMemory?.needsUserIntervention || false);
  const lastSession = useSelector((state: any) => state.aiMemory?.agentDialogue?.lastWarRoomSession || 0);

  const [currentDecision, setCurrentDecision] = useState<any>(null);

  // Reactively update decision when panel opens or lastSession changes in Redux.
  // No interval — Redux drives updates; orchestrator is queried on-demand only.
  useEffect(() => {
    if (!isExpanded) return;
    try {
      // @ts-ignore
      const { getAgentOrchestrator } = require('../../modules/intelligence/agents/AgentOrchestrator');
      const orchestrator = getAgentOrchestrator();
      if (orchestrator) {
        setCurrentDecision(orchestrator.getLastDecision());
      }
    } catch (e) {
      // Orchestrator not available
    }
  }, [isExpanded, lastSession]);

  const getAgentColor = (agentType: string): string => {
    switch (agentType) {
      case 'strategist':
        return '#00A8FF';
      case 'auditor':
        return '#FFD700';
      case 'vitals':
        return '#00FF41';
      default:
        return '#667EEA';
    }
  };

  const getToneIcon = (tone: string): string => {
    switch (tone) {
      case 'hostile':
        return '⚠️';
      case 'override':
        return '🛑';
      case 'insistent':
        return '❗';
      case 'defensive':
        return '🛡️';
      default:
        return '💬';
    }
  };

  const formatTimestamp = (timestamp: number): string => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };

  const getTimeSinceLastSession = (): string => {
    if (!lastSession) return 'No session';
    const seconds = Math.floor((Date.now() - lastSession) / 1000);
    if (seconds < 60) return `${seconds}s ago`;
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    return `${hours}h ago`;
  };

  return (
    <div className={`war-room-container${isExpanded ? ' is-expanded' : ''}`}>
      <button
        className={`war-room-toggle ${needsIntervention ? 'needs-attention' : ''}`}
        onClick={() => setIsExpanded(!isExpanded)}
        title="Thought Stream - Internal Debate Log"
      >
        <span className="war-room-icon">🎯</span>
        <span className="war-room-label">Thought Stream</span>
        {needsIntervention && <span className="attention-badge">!</span>}
      </button>

      {isExpanded && (
        <div className="war-room-panel">
          <div className="war-room-header">
            <h3>🏛️ Agent War Room / Thought Stream</h3>
            <div className="war-room-meta">
              <span className="session-time">Last Session: {getTimeSinceLastSession()}</span>
              <button className="close-btn" onClick={() => setIsExpanded(false)}>✕</button>
            </div>
          </div>

          <div className="war-room-legend" aria-label="Agent color legend">
            <span style={{ color: '#00A8FF' }}>Cortana</span>
            <span style={{ color: '#FFD700' }}>Jarvis</span>
            <span style={{ color: '#00FF41' }}>SHODAN</span>
          </div>

          <div className="war-room-tabs">
            <button
              className={`tab-btn ${activeTab === 'dialogue' ? 'active' : ''}`}
              onClick={() => setActiveTab('dialogue')}
            >
              💬 Dialogue Log
              {agentDialogue.length > 0 && <span className="count-badge">{agentDialogue.length}</span>}
            </button>
            <button
              className={`tab-btn ${activeTab === 'conflicts' ? 'active' : ''}`}
              onClick={() => setActiveTab('conflicts')}
            >
              ⚔️ Conflict Memory
              {conflictMemory.length > 0 && <span className="count-badge">{conflictMemory.length}</span>}
            </button>
          </div>

          <div className="war-room-content">
            {activeTab === 'dialogue' && (
              <div className="dialogue-log">
                {currentDecision && (
                  <div className="current-decision-banner">
                    <div className="decision-status">
                      <span className="status-label">Current Decision:</span>
                      <span className="lead-agent" style={{ color: getAgentColor(currentDecision.leadAgent) }}>
                        {currentDecision.leadAgent.toUpperCase()}
                      </span>
                      {currentDecision.vetoActivated && <span className="veto-badge">VETO ACTIVE</span>}
                    </div>
                    <div className="decision-verdict">{currentDecision.finalVerdict}</div>
                  </div>
                )}

                {agentDialogue.length === 0 ? (
                  <div className="war-room-empty-state">
                    <p>No agent dialogue recorded yet.</p>
                    <p className="war-room-hint">Open Omnibar to trigger multi-agent analysis.</p>
                  </div>
                ) : (
                  <div className="dialogue-entries">
                    {agentDialogue.map((entry: AgentDialogueEntry, idx: number) => (
                      <div
                        key={`${entry.timestamp}-${idx}`}
                        className={`dialogue-entry tone-${entry.tone}`}
                        style={{ borderLeftColor: getAgentColor(entry.agentType) }}
                      >
                        <div className="entry-header">
                          <span className="agent-name" style={{ color: getAgentColor(entry.agentType) }}>
                            {getToneIcon(entry.tone)} {entry.agentName}
                          </span>
                          <span className="entry-time">{formatTimestamp(entry.timestamp)}</span>
                        </div>
                        <div className="entry-statement">{entry.statement}</div>
                        {entry.inResponseTo && (
                          <div className="entry-response-to">
                            ↳ in response to {entry.inResponseTo}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {activeTab === 'conflicts' && (
              <div className="conflict-memory">
                {needsIntervention && (
                  <div className="intervention-alert">
                    <div className="alert-icon">⚠️</div>
                    <div className="alert-content">
                      <div className="alert-title">Fallo de Sincronizacion</div>
                      <div className="alert-text">
                        Senor, mis agentes no llegan a un consenso sobre sus finanzas. Desea establecer una Directiva Primaria?
                      </div>
                    </div>
                  </div>
                )}

                {conflictMemory.length === 0 ? (
                  <div className="war-room-empty-state">
                    <p>No recurring conflicts recorded.</p>
                    <p className="war-room-hint">Agents are operating in harmony.</p>
                  </div>
                ) : (
                  <div className="conflict-entries">
                    {conflictMemory.map((conflict: ConflictMemoryEntry) => (
                      <div
                        key={conflict.id}
                        className={`conflict-entry ${conflict.needsResolution ? 'needs-resolution' : ''}`}
                      >
                        <div className="conflict-header">
                          <div className="conflict-agents">
                            <span style={{ color: getAgentColor(conflict.agents[0]) }}>
                              {conflict.agents[0].toUpperCase()}
                            </span>
                            <span className="vs-separator">⚔️</span>
                            <span style={{ color: getAgentColor(conflict.agents[1]) }}>
                              {conflict.agents[1].toUpperCase()}
                            </span>
                          </div>
                          <span className="conflict-count">{conflict.occurrences}x</span>
                        </div>
                        <div className="conflict-topic">{conflict.topic}</div>
                        <div className="conflict-meta">
                          <span className="conflict-time">
                            Last: {formatTimestamp(conflict.lastOccurrence)}
                          </span>
                          {conflict.needsResolution && (
                            <span className="resolution-badge">Needs Resolution</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
