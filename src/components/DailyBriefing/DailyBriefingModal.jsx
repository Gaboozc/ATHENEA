import { useEffect, useMemo, useRef, useState } from 'react';
import { useSelector } from 'react-redux';
import { useDailyBriefing } from '../../hooks/useDailyBriefing';
import { speak, stopSpeaking, cleanTextForTTS } from '../../services/VoiceboxService';

const AGENT_ACCENTS = {
  Cortana: '#667eea',
  SHODAN: 'var(--color-success)',
  Jarvis: 'var(--color-warning)',
};

export function DailyBriefingModal({ isOpen, onClose }) {
  const identity = useSelector((s) => s.userSettings || s.userIdentity || {});
  const agentAliases = identity.agentAliases || {};
  const preferredName = identity.preferredName || '';
  const agentNames = identity.agentNames || {};
  const cortanaName = agentNames?.cortana || 'Agent 1';
  const jarvisName = agentNames?.jarvis || 'Agent 2';
  const shodanName = agentNames?.shodan || 'Agent 3';
  const cortanaCallsMe = agentAliases?.cortana || preferredName || 'Operador';
  const jarvisCallsMe = agentAliases?.jarvis || preferredName || 'Operador';
  const shodanCallsMe = agentAliases?.shodan || preferredName || 'Operador';

  const {
    step,
    messages,
    isLoading,
    startBriefing,
    sendUserMessage,
    completeBriefing,
    resetConversation,
    STEP,
  } = useDailyBriefing();

  const [input, setInput] = useState('');
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!isOpen) {
      hasStarted.current = false;
      setInput('');
      resetConversation();
      return;
    }
    if (!hasStarted.current) {
      hasStarted.current = true;
      startBriefing();
    }
  }, [isOpen]);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last || last.role !== 'agent' || !last.content) return;
    const text = cleanTextForTTS(last.content);
    const rawAgent = String(last.agent || '').toLowerCase();
    const agent = rawAgent.includes(String(jarvisName).toLowerCase()) || rawAgent.includes('jarvis')
      ? 'jarvis'
      : rawAgent.includes(String(shodanName).toLowerCase()) || rawAgent.includes('shodan')
        ? 'shodan'
        : 'cortana';
    speak(text, agent);
  }, [jarvisName, messages, shodanName]);

  useEffect(() => {
    if (!isOpen) stopSpeaking();
  }, [isOpen]);

  const canFinish = useMemo(
    () => step === STEP.CORTANA_2 || step === STEP.DONE,
    [STEP.CORTANA_2, STEP.DONE, step]
  );

  const operatorAliasByStep =
    step === STEP.SHODAN
      ? shodanCallsMe
      : step === STEP.JARVIS
        ? jarvisCallsMe
        : cortanaCallsMe;

  const handleSubmit = async (e) => {
    e.preventDefault();
    await sendUserMessage(input);
    setInput('');
  };

  const handleClose = () => {
    if (canFinish && step !== STEP.DONE) {
      completeBriefing();
    }
    onClose?.();
  };

  const handleFinish = () => {
    if (step !== STEP.DONE) {
      completeBriefing();
    }
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      onClick={handleClose}
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(5, 8, 16, 0.90)',
        backdropFilter: 'blur(4px)',
        zIndex: 1100,
        display: 'grid',
        placeItems: 'center',
        padding: '16px',
      }}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          width: 'min(760px, 100%)',
          maxHeight: '90vh',
          overflow: 'hidden',
          borderRadius: 'var(--radius-xl, 18px)',
          background: 'var(--bg-surface, #111827)',
          color: 'var(--text-primary, #e5e7eb)',
          border: '1px solid var(--border-default, rgba(148, 163, 184, 0.28))',
          boxShadow: '0 24px 50px rgba(2, 6, 23, 0.55)',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '14px 16px',
            borderBottom: '1px solid var(--border-subtle, rgba(148, 163, 184, 0.2))',
          }}
        >
          <div>
            <p
              style={{
                fontSize: 'var(--text-sm)',
                fontWeight: 600,
                color: 'var(--text-primary)',
                margin: 0,
                fontFamily: 'var(--font-mono)',
                letterSpacing: '0.06em',
              }}
            >
              DAILY BRIEFING
            </p>
            <p
              style={{
                fontSize: 'var(--text-xs)',
                color: 'var(--text-tertiary)',
                margin: '2px 0 0',
                textTransform: 'capitalize',
              }}
            >
              {new Date().toLocaleDateString('es-MX', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
              })}
            </p>
          </div>
          {step === STEP.DONE && (
            <button
              type="button"
              onClick={handleClose}
              style={{
                border: '1px solid var(--border-default, rgba(148, 163, 184, 0.3))',
                background: 'transparent',
                color: 'var(--text-secondary, #cbd5e1)',
                borderRadius: 'var(--radius-md, 10px)',
                padding: '8px 10px',
                cursor: 'pointer',
              }}
            >
              Close
            </button>
          )}
        </header>

        <div style={{ padding: '14px 16px', overflowY: 'auto', flex: 1 }}>
          {messages.map((msg, idx) => (
            <div
              key={`${msg.createdAt || idx}-${idx}`}
              style={{
                display: 'flex',
                justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                marginBottom: '10px',
              }}
            >
              <div
                style={{
                  maxWidth: '86%',
                  padding: '10px 12px',
                  borderRadius: '12px',
                  background:
                    msg.role === 'user'
                      ? 'linear-gradient(180deg, var(--color-primary, #0ea5e9) 0%, #0369a1 100%)'
                      : 'var(--bg-elevated, rgba(30, 41, 59, 0.85))',
                  border:
                    msg.role === 'user'
                      ? '1px solid rgba(125, 211, 252, 0.5)'
                      : '1px solid var(--border-subtle, rgba(148, 163, 184, 0.22))',
                }}
              >
                {msg.agent && (
                  <div
                    style={{
                      fontSize: '0.72rem',
                      marginBottom: '4px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      color: AGENT_ACCENTS[msg.agent] || 'var(--text-secondary, #94a3b8)',
                      fontWeight: 600,
                    }}
                  >
                    <span aria-hidden="true">{msg.agent === 'Cortana' ? '🧿' : msg.agent === 'SHODAN' ? '👁️' : '🤖'}</span>
                    <span>{msg.agent}</span>
                  </div>
                )}
                <div style={{ lineHeight: 1.45 }}>{msg.content}</div>
              </div>
            </div>
          ))}

          {isLoading && (
            <div style={{ opacity: 0.8, fontSize: '0.9rem' }}>Thinking...</div>
          )}
        </div>

        <footer
          style={{
            borderTop: '1px solid var(--border-subtle, rgba(148, 163, 184, 0.2))',
            padding: '12px 16px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
          }}
        >
          {canFinish ? (
            <button
              type="button"
              onClick={handleFinish}
              style={{
                marginLeft: 'auto',
                border: 'none',
                borderRadius: 'var(--radius-md, 10px)',
                background: 'linear-gradient(180deg, #10b981 0%, #047857 100%)',
                color: '#ecfeff',
                padding: '10px 14px',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Empezar el día →
            </button>
          ) : (
            <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '10px', width: '100%' }}>
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={`Responde aquí, ${operatorAliasByStep}...`}
                disabled={isLoading}
                style={{
                  flex: 1,
                  minWidth: 0,
                  borderRadius: 'var(--radius-md, 10px)',
                  border: '1px solid var(--border-default, rgba(148, 163, 184, 0.35))',
                  background: 'var(--bg-base, rgba(15, 23, 42, 0.72))',
                  color: 'var(--text-primary, #e5e7eb)',
                  padding: '10px 12px',
                }}
              />
              <button
                type="submit"
                disabled={!input.trim() || isLoading}
                aria-label="Enviar"
                style={{
                  border: 'none',
                  borderRadius: 'var(--radius-md, 10px)',
                  background: 'linear-gradient(180deg, var(--color-primary, #38bdf8) 0%, #0284c7 100%)',
                  color: 'var(--text-on-primary, #ecfeff)',
                  padding: '10px 12px',
                  fontWeight: 600,
                  cursor: 'pointer',
                  opacity: !input.trim() || isLoading ? 0.55 : 1,
                }}
              >
                →
              </button>
            </form>
          )}
        </footer>
      </div>
    </div>
  );
}

export default DailyBriefingModal;
