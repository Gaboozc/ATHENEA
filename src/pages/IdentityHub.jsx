import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import athenaLogo from '../assets/img/Athena-logo.png';
import { showToast } from '../components/Toast/Toast';
import { updateUserSettings } from '../store/slices/userSettingsSlice';
import { useLanguage } from '../context/LanguageContext';
import './IdentityHub.css';

const AGENT_DEFAULTS = [
  {
    key: 'cortana',
    defaultName: 'Cortana',
    role: 'Estratega de productividad',
    color: '#667eea',
    icon: '🧿',
    hub: 'Work',
  },
  {
    key: 'jarvis',
    defaultName: 'Jarvis',
    role: 'Auditor financiero',
    color: '#ffb700',
    icon: '🤖',
    hub: 'Finance',
  },
  {
    key: 'shodan',
    defaultName: 'SHODAN',
    role: 'Monitor de bienestar',
    color: '#00e5a0',
    icon: '👁',
    hub: 'Personal',
  },
];

const ONBOARDING_KEY = 'athenea.onboarding.completed';

export const IdentityHub = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const settings = useSelector((s) => s.userSettings || {});
  const { t, language: appLanguage, setLanguage: setAppLanguage } = useLanguage();

  const [fullName, setFullName] = useState(settings.fullName || '');
  const [preferredName, setPreferredName] = useState(settings.preferredName || '');
  const [occupation, setOccupation] = useState(settings.occupation || '');
  const [mainGoal, setMainGoal] = useState(settings.mainGoal || '');
  const [language, setLanguage] = useState(settings.language || appLanguage || 'en');
  const [agentNames, setAgentNames] = useState(settings.agentNames || {});
  const [agentAliases, setAgentAliases] = useState(settings.agentAliases || {});
  const [additionalContext, setAdditionalContext] = useState(settings.additionalContext || '');

  const handleSave = () => {
    dispatch(
      updateUserSettings({
        fullName,
        preferredName,
        occupation,
        mainGoal,
        language,
        agentNames,
        agentAliases,
        additionalContext,
      })
    );
    localStorage.setItem(ONBOARDING_KEY, 'true');
    setAppLanguage(language);
    showToast(t('Identidad guardada'), 'success');
    setTimeout(() => navigate('/'), 500);
  };

  const handleLanguageChange = (nextLanguage) => {
    setLanguage(nextLanguage);
    setAppLanguage(nextLanguage);
  };

  return (
    <div className="identity-container">
      <h1 className="identity-page-title">{t('Identity Protocol')}</h1>
      <p className="identity-page-subtitle">
        {t('ATHENEA aprendera como deben hablarte tus agentes.')}
      </p>

      <div className="identity-section identity-personal">
        <div className="identity-watermark" aria-hidden="true">
          <img src={athenaLogo} alt="" />
        </div>

        <h2 className="identity-section-title">{t('Identidad del Operador')}</h2>

        <div className="identity-fields-grid">
          <div className="identity-field">
            <label>{t('Nombre completo')}</label>
            <input
              type="text"
              placeholder={t('Ej: Juan García')}
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
            />
          </div>

          <div className="identity-field">
            <label>{t('Como quieres que te llamen?')}</label>
            <small>{t('Nombre que usan los 3 agentes')}</small>
            <input
              type="text"
              placeholder="Ej: Juan, Doc, Jefe..."
              value={preferredName}
              onChange={(e) => setPreferredName(e.target.value)}
            />
          </div>

          <div className="identity-field">
            <label>{t('Ocupacion')}</label>
            <input
              type="text"
              placeholder="Ej: Desarrollador, CEO..."
              value={occupation}
              onChange={(e) => setOccupation(e.target.value)}
            />
          </div>

          <div className="identity-field">
            <label>{t('Objetivo principal este mes')}</label>
            <small>{t('Cortana prioriza tareas alineadas a esto')}</small>
            <input
              type="text"
              placeholder="Ej: Lanzar mi primer producto..."
              value={mainGoal}
              onChange={(e) => setMainGoal(e.target.value)}
            />
          </div>

          <div className="identity-field">
            <label>{t('Idioma de los agentes')}</label>
            <div className="identity-lang-toggle">
              <button
                type="button"
                className={language === 'es' ? 'active' : ''}
                onClick={() => handleLanguageChange('es')}
              >
                {t('Español')}
              </button>
              <button
                type="button"
                className={language === 'en' ? 'active' : ''}
                onClick={() => handleLanguageChange('en')}
              >
                {t('English')}
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="identity-section">
        <h2 className="identity-section-title">{t('Tus agentes')}</h2>
        <p className="identity-section-desc">
          {t('Personaliza el nombre de cada agente y como te llaman. Los cambios afectan el Omnibar, el briefing y todos los sistemas.')}
        </p>

        <div className="identity-agents-grid">
          {AGENT_DEFAULTS.map((agent) => (
            <div
              key={agent.key}
              className="identity-agent-card"
              style={{ borderTop: `2px solid ${agent.color}` }}
            >
              <div className="agent-card-top">
                <div
                  className="agent-card-icon-wrap"
                  style={{ background: `${agent.color}15` }}
                >
                  <span className="agent-icon">{agent.icon}</span>
                </div>
                <div>
                  <span
                    className="agent-hub-badge"
                    style={{
                      color: agent.color,
                      background: `${agent.color}15`,
                      border: `1px solid ${agent.color}30`,
                    }}
                  >
                    {agent.hub}
                  </span>
                </div>
              </div>

              <div className="agent-status">
                <span className="athenea-status-dot live" />
                <span className="agent-status-text">{t('Activo')}</span>
              </div>

              <p className="agent-role-text">{agent.role}</p>

              <div className="agent-inline-fields">
                <div className="agent-inline-field">
                  <label>{t('Nombre del agente')}</label>
                  <input
                    type="text"
                    placeholder={agent.defaultName}
                    value={agentNames[agent.key] || ''}
                    onChange={(e) =>
                      setAgentNames({
                        ...agentNames,
                        [agent.key]: e.target.value,
                      })
                    }
                  />
                  <small>{t('Como tu lo llamas')}</small>
                </div>

                <div className="agent-inline-field">
                  <label>{t('Te llama a ti')}</label>
                  <input
                    type="text"
                    placeholder="Ej: Juan, Doc, Jefe..."
                    value={agentAliases[agent.key] || ''}
                    onChange={(e) =>
                      setAgentAliases({
                        ...agentAliases,
                        [agent.key]: e.target.value,
                      })
                    }
                  />
                  <small>{t('Como el agente te habla')}</small>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="identity-section">
        <h2 className="identity-section-title">{t('Contexto para los agentes')}</h2>
        <p className="identity-section-desc">
          {t('Informacion adicional que los agentes usan para darte mejores consejos. Proyectos actuales, situacion personal, restricciones especificas.')}
        </p>

        <textarea
          className="identity-context-textarea"
          placeholder={
            t('Ej: Tengo 2 proyectos freelance activos,\nun cliente dificil esta semana, y estoy en modo\nahorro agresivo este mes...')
          }
          value={additionalContext}
          onChange={(e) => setAdditionalContext(e.target.value)}
          maxLength={500}
          rows={4}
        />
        <small className="identity-char-count">{additionalContext.length}/500</small>
      </div>

      <button className="identity-save-btn" onClick={handleSave}>
        {t('Guardar identidad')}
      </button>
    </div>
  );
};
