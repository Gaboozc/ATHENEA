import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setPreferredName,
  setTitle,
  setAgentAliases,
  setAgentNames,
  setMissionBio,
  setWorkingHours,
  setGeofencing,
  setWeatherPreferences,
  setTimezone,
  setOccupation,
  setMainGoal,
  setFinancialContext,
  setAdditionalContext,
} from '../store/slices/userSettingsSlice';
import { useLanguage } from '../context/LanguageContext';
import './IdentityHub.css';

const AGENTS = [
  { key: 'cortana', defaultName: 'Cortana', role: 'Estratega de productividad', color: '#667eea', icon: '🧿' },
  { key: 'jarvis',  defaultName: 'Jarvis',  role: 'Auditor financiero',         color: '#f3c54a', icon: '🤖' },
  { key: 'shodan',  defaultName: 'SHODAN',  role: 'Monitor de bienestar',       color: '#41d467', icon: '👁️' },
];

const FINANCIAL_CONTEXTS = [
  { value: '',          label: 'Prefiero no especificar' },
  { value: 'growth',    label: 'En crecimiento — priorizando ingresos' },
  { value: 'saving',    label: 'Ahorro agresivo — reduciendo gastos' },
  { value: 'stable',    label: 'Estable — manteniendo balance' },
  { value: 'recovery',  label: 'Recuperación financiera' },
  { value: 'investing', label: 'Inversión — construyendo patrimonio' },
];

export const IdentityHub = () => {
  const dispatch  = useDispatch();
  const { t, language, setLanguage } = useLanguage();
  const s = useSelector((state) => state.userSettings);
  const weatherPrefs = s.weatherPreferences || {};

  /* ── Local form state ── */
  const [form, setForm] = useState({
    preferredName:    s.preferredName    || '',
    title:            s.title            || '',
    timezone:         s.timezone         || 'America/Mexico_City',
    occupation:       s.occupation       || '',
    mainGoal:         s.mainGoal         || '',
    financialContext: s.financialContext || '',
    additionalContext: s.additionalContext || '',
    missionBio:       s.missionBio       || '',
    workStart:        s.workingHours?.start || '08:00',
    workEnd:          s.workingHours?.end   || '18:00',
    agentNames: {
      cortana: s.agentNames?.cortana || '',
      jarvis:  s.agentNames?.jarvis  || '',
      shodan:  s.agentNames?.shodan  || '',
    },
    agentAliases: {
      cortana: s.agentAliases?.cortana || 'Chief',
      jarvis:  s.agentAliases?.jarvis  || 'Sir',
      shodan:  s.agentAliases?.shodan  || 'Insect',
    },
    homeLatitude:  s.geofencing?.home?.latitude  ?? '',
    homeLongitude: s.geofencing?.home?.longitude ?? '',
    workLatitude:  s.geofencing?.work?.latitude  ?? '',
    workLongitude: s.geofencing?.work?.longitude ?? '',
  });

  const [saved, setSaved] = useState(false);
  const [currentTime, setCurrentTime] = useState('');

  /* ── Auto-detect timezone on mount ── */
  useEffect(() => {
    const detected = Intl.DateTimeFormat().resolvedOptions().timeZone;
    if (detected) set('timezone', detected);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Live clock ── */
  useEffect(() => {
    const fmt = () =>
      new Date().toLocaleTimeString([], {
        hour: '2-digit',
        minute: '2-digit',
        timeZone: form.timezone || undefined,
      });
    setCurrentTime(fmt());
    const iv = setInterval(() => setCurrentTime(fmt()), 30_000);
    return () => clearInterval(iv);
  }, [form.timezone]);

  const set = (key, value) => setForm((prev) => ({ ...prev, [key]: value }));
  const setAgentField = (group, agentKey, value) =>
    setForm((prev) => ({ ...prev, [group]: { ...prev[group], [agentKey]: value } }));

  /* ── Save ── */
  const handleSave = () => {
    dispatch(setPreferredName(form.preferredName));
    dispatch(setTitle(form.title));
    dispatch(setTimezone(form.timezone));
    dispatch(setOccupation(form.occupation));
    dispatch(setMainGoal(form.mainGoal));
    dispatch(setFinancialContext(form.financialContext));
    dispatch(setAdditionalContext(form.additionalContext));
    dispatch(setMissionBio(form.missionBio));
    dispatch(setWorkingHours({ start: form.workStart, end: form.workEnd }));
    dispatch(setAgentNames(form.agentNames));
    dispatch(setAgentAliases(form.agentAliases));
    dispatch(setGeofencing({
      home: {
        latitude:  form.homeLatitude  === '' ? null : Number(form.homeLatitude),
        longitude: form.homeLongitude === '' ? null : Number(form.homeLongitude),
      },
      work: {
        latitude:  form.workLatitude  === '' ? null : Number(form.workLatitude),
        longitude: form.workLongitude === '' ? null : Number(form.workLongitude),
      },
    }));
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  /* ── Dirty check ── */
  const isDirty =
    form.preferredName    !== (s.preferredName    || '') ||
    form.title            !== (s.title            || '') ||
    form.timezone         !== (s.timezone         || 'America/Mexico_City') ||
    form.occupation       !== (s.occupation       || '') ||
    form.mainGoal         !== (s.mainGoal         || '') ||
    form.financialContext !== (s.financialContext || '') ||
    form.additionalContext !== (s.additionalContext || '') ||
    form.workStart        !== (s.workingHours?.start || '08:00') ||
    form.workEnd          !== (s.workingHours?.end   || '18:00') ||
    form.agentNames.cortana !== (s.agentNames?.cortana || '') ||
    form.agentNames.jarvis  !== (s.agentNames?.jarvis  || '') ||
    form.agentNames.shodan  !== (s.agentNames?.shodan  || '') ||
    form.agentAliases.cortana !== (s.agentAliases?.cortana || 'Chief') ||
    form.agentAliases.jarvis  !== (s.agentAliases?.jarvis  || 'Sir') ||
    form.agentAliases.shodan  !== (s.agentAliases?.shodan  || 'Insect') ||
    Number(form.homeLatitude  || 0) !== Number(s.geofencing?.home?.latitude  || 0) ||
    Number(form.homeLongitude || 0) !== Number(s.geofencing?.home?.longitude || 0) ||
    Number(form.workLatitude  || 0) !== Number(s.geofencing?.work?.latitude  || 0) ||
    Number(form.workLongitude || 0) !== Number(s.geofencing?.work?.longitude || 0);

  /* ── "Use my location" helper ── */
  const useMyLocation = (zone) => {
    if (!('geolocation' in navigator)) return;
    navigator.geolocation.getCurrentPosition((pos) => {
      const lat = pos.coords.latitude.toFixed(6);
      const lng = pos.coords.longitude.toFixed(6);
      if (zone === 'home') {
        setForm((prev) => ({ ...prev, homeLatitude: lat, homeLongitude: lng }));
      } else {
        setForm((prev) => ({ ...prev, workLatitude: lat, workLongitude: lng }));
      }
    });
  };

  return (
    <div className="identity-hub">
      <div className="identity-header">
        <h1>{t('Identity Protocol')}</h1>
        <p className="subtitle">{t('ATHENEA will learn who you are and how to address you')}</p>
      </div>

      <div className="identity-layout">

        {/* ══ SECCIÓN 1 — Identidad básica ══════════════════════════════════ */}
        <section className="identity-section">
          <h2>👤 {t('Basic Identity')}</h2>

          <div className="identity-field">
            <label>{t('How do you want ATHENEA to call you?')}</label>
            <small>{t('All 3 agents use this name when addressing you')}</small>
            <input
              type="text"
              placeholder="Ej: Alex, Jefe, Dr. García…"
              value={form.preferredName}
              onChange={(e) => set('preferredName', e.target.value)}
              maxLength={30}
            />
          </div>

          <div className="identity-field">
            <label>{t('Title or rank')} <span className="identity-optional">({t('optional')})</span></label>
            <small>{t('Appears in the dashboard greeting')}</small>
            <input
              type="text"
              placeholder="Ej: CEO, Freelancer, Estudiante, Comandante…"
              value={form.title}
              onChange={(e) => set('title', e.target.value)}
              maxLength={40}
            />
          </div>

          <div className="identity-field">
            <label>
              {t('Time zone')}
              <span className="identity-optional">({t('auto-detected')})</span>
            </label>
            <div className="timezone-display">
              <span className="timezone-clock">{currentTime}</span>
              <span className="timezone-name">{form.timezone}</span>
            </div>
            <small>{t('Affects how agents interpret dates and times')}</small>
          </div>

          <div className="identity-field">
            <label>{t('Agent language')}</label>
            <div className="identity-toggle-group">
              <button
                type="button"
                className={language === 'es' ? 'active' : ''}
                onClick={() => setLanguage('es')}
              >
                🇲🇽 Español
              </button>
              <button
                type="button"
                className={language === 'en' ? 'active' : ''}
                onClick={() => setLanguage('en')}
              >
                🇺🇸 English
              </button>
            </div>
          </div>
        </section>

        {/* ══ SECCIÓN 2 — Agentes ═══════════════════════════════════════════ */}
        <section className="identity-section">
          <h2>🤖 {t('Your agents')}</h2>
          <p className="identity-section-desc">
            {t('Customize the name of each agent and how they call you. Changes affect all system responses.')}
          </p>

          {AGENTS.map((agent) => (
            <div
              key={agent.key}
              className="identity-agent-card"
              style={{ borderLeft: `3px solid ${agent.color}` }}
            >
              <div className="agent-card-header">
                <span className="agent-icon">{agent.icon}</span>
                <div>
                  <span className="agent-default-name">
                  {form.agentNames[agent.key] || agent.defaultName}
                </span>
                  <span className="agent-role">{agent.role}</span>
                </div>
              </div>
              <div className="agent-card-fields">
                <div className="identity-field agent-field">
                  <label>{t('Agent name')}</label>
                  <input
                    type="text"
                    placeholder={agent.defaultName}
                    value={form.agentNames[agent.key]}
                    onChange={(e) => setAgentField('agentNames', agent.key, e.target.value)}
                    maxLength={20}
                  />
                  <small>{t('How you call it')}</small>
                </div>
                <div className="identity-field agent-field">
                  <label>{t('Calls you')}</label>
                  <input
                    type="text"
                    placeholder="Ej: Jefe, Sir, Comandante…"
                    value={form.agentAliases[agent.key]}
                    onChange={(e) => setAgentField('agentAliases', agent.key, e.target.value)}
                    maxLength={20}
                  />
                  <small>{t('How the agent addresses you')}</small>
                </div>
              </div>
            </div>
          ))}
        </section>

        {/* ══ SECCIÓN 3 — Contexto personal ════════════════════════════════ */}
        <section className="identity-section identity-context-section">
          <h2>🧠 {t('Agent context')}</h2>
          <p className="identity-section-desc">
            {t('This information is injected into each agent\'s context. The more precise, the better the advice.')}
          </p>

          <div className="identity-field">
            <label>{t('What do you do?')}</label>
            <input
              type="text"
              placeholder="Ej: Desarrollador freelance, Gerente de ventas…"
              value={form.occupation}
              onChange={(e) => set('occupation', e.target.value)}
              maxLength={80}
            />
          </div>

          <div className="identity-field">
            <label>{t('Main goal this month')}</label>
            <input
              type="text"
              placeholder="Ej: Aumentar ingresos 20%, terminar proyecto X…"
              value={form.mainGoal}
              onChange={(e) => set('mainGoal', e.target.value)}
              maxLength={120}
            />
            <small>{t('Cortana prioritizes tasks aligned to this goal')}</small>
          </div>

          <div className="identity-field">
            <label>{t('Financial context')}</label>
            <select
              value={form.financialContext}
              onChange={(e) => set('financialContext', e.target.value)}
            >
              {FINANCIAL_CONTEXTS.map((fc) => (
                <option key={fc.value} value={fc.value}>{fc.label}</option>
              ))}
            </select>
            <small>{t('Jarvis adjusts recommendations based on this')}</small>
          </div>

          <div className="identity-field">
            <label>{t('Anything else agents should know?')}</label>
            <textarea
              placeholder={t('Additional context: frequent travel, family situation, specific restrictions, etc.')}
              value={form.additionalContext}
              onChange={(e) => set('additionalContext', e.target.value)}
              maxLength={300}
              rows={3}
            />
            <small className="identity-char-count">{form.additionalContext.length}/300</small>
          </div>
        </section>

        {/* ══ SECCIÓN 4 — Horario de trabajo ═══════════════════════════════ */}
        <section className="identity-section">
          <h2>⏰ {t('Work schedule')}</h2>
          <p className="identity-section-desc">
            {t('Cortana won\'t disturb you outside this schedule with work alerts.')}
          </p>
          <div className="schedule-row">
            <div className="schedule-field">
              <label>{t('Start')}</label>
              <input
                type="time"
                value={form.workStart}
                onChange={(e) => set('workStart', e.target.value)}
              />
            </div>
            <span className="schedule-separator">→</span>
            <div className="schedule-field">
              <label>{t('End')}</label>
              <input
                type="time"
                value={form.workEnd}
                onChange={(e) => set('workEnd', e.target.value)}
              />
            </div>
          </div>
        </section>

        {/* ══ SECCIÓN 5 — Geofencing (conectado a DeviceMonitor) ════════════ */}
        <section className="identity-section">
          <h2>📍 {t('Operation zones')}</h2>
          <p className="identity-section-desc">
            {t('ATHENEA detects if you\'re at home or at work. Cortana adjusts context based on your location.')}
          </p>

          {['home', 'work'].map((zone) => {
            const latKey = zone === 'home' ? 'homeLatitude'  : 'workLatitude';
            const lngKey = zone === 'home' ? 'homeLongitude' : 'workLongitude';
            const label  = zone === 'home' ? t('Home zone') : t('Work zone');
            return (
              <div key={zone} className="geofencing-zone">
                <div className="geofencing-zone-header">
                  <h4>{label}</h4>
                  <button
                    type="button"
                    className="geo-locate-btn"
                    onClick={() => useMyLocation(zone)}
                    title={t('Use my current location')}
                  >
                    🎯 {t('Use my location')}
                  </button>
                </div>
                <div className="form-row-2">
                  <div className="identity-field">
                    <label>{t('Latitude')}</label>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Ej: 19.4326"
                      value={form[latKey]}
                      onChange={(e) => set(latKey, e.target.value)}
                    />
                  </div>
                  <div className="identity-field">
                    <label>{t('Longitude')}</label>
                    <input
                      type="number"
                      step="0.0001"
                      placeholder="Ej: -99.1332"
                      value={form[lngKey]}
                      onChange={(e) => set(lngKey, e.target.value)}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </section>

        {/* ══ Weather (mantener existente, full-width) ══════════════════════ */}
        <section className="identity-section identity-weather-section">
          <h2>🌤️ {t('Automatic Phone Weather')}</h2>
          <p className="identity-section-desc">
            {t('ATHENEA will use device location for weather automatically, no manual API key needed.')}
          </p>
          <div className="form-group">
            <label className="identity-checkbox-label">
              <input
                type="checkbox"
                checked={weatherPrefs.enableWeatherAlerts ?? true}
                onChange={(e) =>
                  dispatch(setWeatherPreferences({
                    ...weatherPrefs,
                    apiProvider: 'device-auto',
                    apiKey: '',
                    enableWeatherAlerts: e.target.checked,
                  }))
                }
              />
              {t('Enable automatic weather alerts')}
            </label>
          </div>
          <div className="weather-alert-config">
            <div className="form-row-3">
              <div className="identity-field">
                <label>{t('Rain (hours ahead)')}</label>
                <input
                  type="number" min="1" max="12"
                  value={weatherPrefs.alertOn?.rainIn || 3}
                  onChange={(e) =>
                    dispatch(setWeatherPreferences({
                      ...weatherPrefs,
                      alertOn: { ...weatherPrefs.alertOn, rainIn: Number(e.target.value) },
                    }))
                  }
                />
              </div>
              <div className="identity-field">
                <label>{t('Critical wind (m/s)')}</label>
                <input
                  type="number" min="5" max="30"
                  value={weatherPrefs.alertOn?.windSpeed || 15}
                  onChange={(e) =>
                    dispatch(setWeatherPreferences({
                      ...weatherPrefs,
                      alertOn: { ...weatherPrefs.alertOn, windSpeed: Number(e.target.value) },
                    }))
                  }
                />
              </div>
              <div className="identity-field">
                <label className="identity-checkbox-label">
                  <input
                    type="checkbox"
                    checked={weatherPrefs.alertOn?.extremeTemp ?? true}
                    onChange={(e) =>
                      dispatch(setWeatherPreferences({
                        ...weatherPrefs,
                        alertOn: { ...weatherPrefs.alertOn, extremeTemp: e.target.checked },
                      }))
                    }
                  />
                  {t('Alert extreme temperatures')}
                </label>
              </div>
            </div>
          </div>
        </section>

      </div>{/* end identity-layout */}

      {/* ── Save button ── */}
      <div className="identity-footer">
        <button
          className={`btn-save${saved ? ' saved' : ''}${!isDirty ? ' disabled' : ''}`}
          onClick={handleSave}
          disabled={!isDirty}
        >
          {saved ? `✓ ${t('Identity Saved')}` : t('Save Identity')}
        </button>
      </div>
    </div>
  );
};
