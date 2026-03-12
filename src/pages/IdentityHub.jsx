import React, { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  setFirstName,
  setLastName,
  setPreferredName,
  setTitle,
  setAgentAliases,
  setMissionBio,
  setWorkingHours,
  setGeofencing,
  setVoiceTone,
  setWeatherPreferences
} from '../store/slices/userSettingsSlice';
import './IdentityHub.css';

/**
 * Identity Hub - Operator Profile & Voice Protocol Configuration
 * ATHENEA learns who her operator is and how to address them
 */
export const IdentityHub = () => {
  const dispatch = useDispatch();
  const userSettings = useSelector((state) => state.userSettings);

  // Local form state
  const [formData, setFormData] = useState({
    firstName: userSettings.firstName,
    lastName: userSettings.lastName,
    preferredName: userSettings.preferredName,
    title: userSettings.title,
    jarvisAlias: userSettings.agentAliases?.jarvis || 'Sir',
    cortanaAlias: userSettings.agentAliases?.cortana || 'Chief',
    shodanAlias: userSettings.agentAliases?.shodan || 'Insect',
    missionBio: userSettings.missionBio,
    workStartTime: userSettings.workingHours.start,
    workEndTime: userSettings.workingHours.end,
    voiceTone: userSettings.voiceTone,
    homeLatitude: userSettings.geofencing?.home?.latitude ?? '',
    homeLongitude: userSettings.geofencing?.home?.longitude ?? '',
    workLatitude: userSettings.geofencing?.work?.latitude ?? '',
    workLongitude: userSettings.geofencing?.work?.longitude ?? '',
  });

  const [saved, setSaved] = useState(false);

  const weatherPrefs = userSettings.weatherPreferences || {};

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSave = () => {
    dispatch(setFirstName(formData.firstName));
    dispatch(setLastName(formData.lastName));
    dispatch(setPreferredName(formData.preferredName));
    dispatch(setTitle(formData.title));
    dispatch(setAgentAliases({
      jarvis: formData.jarvisAlias,
      cortana: formData.cortanaAlias,
      shodan: formData.shodanAlias,
    }));
    dispatch(setMissionBio(formData.missionBio));
    dispatch(
      setWorkingHours({
        start: formData.workStartTime,
        end: formData.workEndTime
      })
    );
    dispatch(setVoiceTone(formData.voiceTone));
    dispatch(
      setGeofencing({
        home: {
          latitude:
            formData.homeLatitude === '' || Number.isNaN(Number(formData.homeLatitude))
              ? null
              : Number(formData.homeLatitude),
          longitude:
            formData.homeLongitude === '' || Number.isNaN(Number(formData.homeLongitude))
              ? null
              : Number(formData.homeLongitude),
        },
        work: {
          latitude:
            formData.workLatitude === '' || Number.isNaN(Number(formData.workLatitude))
              ? null
              : Number(formData.workLatitude),
          longitude:
            formData.workLongitude === '' || Number.isNaN(Number(formData.workLongitude))
              ? null
              : Number(formData.workLongitude),
        },
      })
    );

    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  const isFormDirty =
    formData.firstName !== userSettings.firstName ||
    formData.lastName !== userSettings.lastName ||
    formData.preferredName !== userSettings.preferredName ||
    formData.title !== userSettings.title ||
    formData.jarvisAlias !== (userSettings.agentAliases?.jarvis || 'Sir') ||
    formData.cortanaAlias !== (userSettings.agentAliases?.cortana || 'Chief') ||
    formData.shodanAlias !== (userSettings.agentAliases?.shodan || 'Insect') ||
    formData.missionBio !== userSettings.missionBio ||
    formData.workStartTime !== userSettings.workingHours.start ||
    formData.workEndTime !== userSettings.workingHours.end ||
    formData.voiceTone !== userSettings.voiceTone ||
    Number(formData.homeLatitude || 0) !== Number(userSettings.geofencing?.home?.latitude || 0) ||
    Number(formData.homeLongitude || 0) !== Number(userSettings.geofencing?.home?.longitude || 0) ||
    Number(formData.workLatitude || 0) !== Number(userSettings.geofencing?.work?.latitude || 0) ||
    Number(formData.workLongitude || 0) !== Number(userSettings.geofencing?.work?.longitude || 0);

  const fullName = formData.firstName || 'Operador';

  return (
    <div className="identity-hub">
      <div className="identity-header">
        <h1>Protocolo de Identidad</h1>
        <p className="subtitle">
          ATHENEA aprenderá quién eres y cómo dirigirse a ti
        </p>
      </div>

      <div className="identity-container">
        {/* Profile Card */}
        <section className="identity-section profile-section">
          <h2>Perfil del Operador</h2>
          <div className="profile-preview">
            <div className="preview-card">
              <p className="preview-greeting">
                Buenos días, <span className="title-label">{formData.title}</span>&nbsp;
                <span className="name-label">{formData.preferredName || fullName}</span>
              </p>
              <p className="preview-mission">
                {formData.missionBio || 'Tu misión aquí...'}
              </p>
            </div>
          </div>

          <div className="form-group form-row-2">
            <div className="form-field">
              <label htmlFor="firstName">Nombre</label>
              <input
                id="firstName"
                type="text"
                name="firstName"
                value={formData.firstName}
                onChange={handleInputChange}
                placeholder="Ej: Juan"
              />
            </div>
            <div className="form-field">
              <label htmlFor="lastName">Apellido</label>
              <input
                id="lastName"
                type="text"
                name="lastName"
                value={formData.lastName}
                onChange={handleInputChange}
                placeholder="Ej: García"
              />
            </div>
          </div>

          <div className="form-group form-row-2">
            <div className="form-field">
              <label htmlFor="title">Título / Rango</label>
              <select
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
              >
                <option value="Señor">Señor</option>
                <option value="Señora">Señora</option>
                <option value="Jefe">Jefe</option>
                <option value="Comandante">Comandante</option>
                <option value="Director">Director</option>
                <option value="Ingeniero">Ingeniero</option>
                <option value="Doctor">Doctor</option>
                <option value="Profesor">Profesor</option>
              </select>
            </div>
            <div className="form-field">
              <label htmlFor="preferredName">
                Nombre Preferido
                <span className="helper">(Cómo ATHENEA te llamará)</span>
              </label>
              <input
                id="preferredName"
                type="text"
                name="preferredName"
                value={formData.preferredName}
                onChange={handleInputChange}
                placeholder={formData.firstName || 'Tu nombre aquí'}
              />
            </div>
          </div>

          <div className="form-group">
            <label>Forma de llamarte por agente</label>
            <p className="helper-text">
              Define cómo te llama cada agente según su origen: Jarvis (Iron Man), Cortana (Halo), SHODAN (System Shock).
            </p>
            <div className="form-row-3">
              <div className="form-field">
                <label htmlFor="jarvisAlias">Jarvis</label>
                <input
                  id="jarvisAlias"
                  type="text"
                  name="jarvisAlias"
                  value={formData.jarvisAlias}
                  onChange={handleInputChange}
                  placeholder="Sir"
                />
              </div>
              <div className="form-field">
                <label htmlFor="cortanaAlias">Cortana</label>
                <input
                  id="cortanaAlias"
                  type="text"
                  name="cortanaAlias"
                  value={formData.cortanaAlias}
                  onChange={handleInputChange}
                  placeholder="Chief"
                />
              </div>
              <div className="form-field">
                <label htmlFor="shodanAlias">SHODAN</label>
                <input
                  id="shodanAlias"
                  type="text"
                  name="shodanAlias"
                  value={formData.shodanAlias}
                  onChange={handleInputChange}
                  placeholder="Insect"
                />
              </div>
            </div>
          </div>

          <div className="form-group">
            <div className="form-field full-width">
              <label htmlFor="missionBio">Misión / Objetivos Actuales</label>
              <textarea
                id="missionBio"
                name="missionBio"
                value={formData.missionBio}
                onChange={handleInputChange}
                placeholder="Describe tus objetivos actuales: ahorro, productividad, expansión, etc. ATHENEA usará esto para priorizar consejos."
                rows={5}
              />
            </div>
          </div>
        </section>

        {/* Working Hours & Voice Protocol */}
        <section className="identity-section config-section">
          <h2>Configuración de Comportamiento</h2>

          <div className="form-group form-row-2">
            <div className="form-field">
              <label htmlFor="workStartTime">Hora de Inicio Laboral</label>
              <input
                id="workStartTime"
                type="time"
                name="workStartTime"
                value={formData.workStartTime}
                onChange={handleInputChange}
              />
            </div>
            <div className="form-field">
              <label htmlFor="workEndTime">Hora de Fin Laboral</label>
              <input
                id="workEndTime"
                type="time"
                name="workEndTime"
                value={formData.workEndTime}
                onChange={handleInputChange}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="voiceTone">Protocolo de Voz / Tono</label>
            <p className="helper-text">
              Selecciona cómo ATHENEA debe comunicarse contigo
            </p>
            <div className="voice-toggle">
              <div
                className={`voice-option ${
                  formData.voiceTone === 'jarvis' ? 'active' : ''
                }`}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    voiceTone: 'jarvis'
                  }))
                }
              >
                <div className="voice-icon">🎩</div>
                <div className="voice-name">JARVIS</div>
                <div className="voice-description">
                  Formal & Refinado
                </div>
                <div className="voice-detail">
                  Eficiencia, optimización de recursos
                </div>
              </div>

              <div
                className={`voice-option ${
                  formData.voiceTone === 'cortana' ? 'active' : ''
                }`}
                onClick={() =>
                  setFormData((prev) => ({
                    ...prev,
                    voiceTone: 'cortana'
                  }))
                }
              >
                <div className="voice-icon">⚡</div>
                <div className="voice-name">CORTANA</div>
                <div className="voice-description">
                  Táctico & Empático
                </div>
                <div className="voice-detail">
                  Misión, bienestar, conexión directa
                </div>
              </div>
            </div>
          </div>

          {/* Geofencing Section */}
          <div className="form-group">
            <label>🛰️ Zonas de Operación (Geofencing)</label>
            <p className="helper-text">
              Define las coordenadas de tu casa y tu trabajo. ATHENEA sabrá dónde estás.
            </p>
            <div className="geofencing-grid">
              <div className="geofencing-zone">
                <h4>Casa</h4>
                <div className="form-row-2">
                  <div className="form-field">
                    <label htmlFor="homeLatitude">Latitud</label>
                    <input
                      id="homeLatitude"
                      type="number"
                      name="homeLatitude"
                      step="0.0001"
                      value={formData.homeLatitude}
                      onChange={handleInputChange}
                      placeholder="Ej: 40.7128"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="homeLongitude">Longitud</label>
                    <input
                      id="homeLongitude"
                      type="number"
                      name="homeLongitude"
                      step="0.0001"
                      value={formData.homeLongitude}
                      onChange={handleInputChange}
                      placeholder="Ej: -74.0060"
                    />
                  </div>
                </div>
              </div>
              
              <div className="geofencing-zone">
                <h4>Trabajo</h4>
                <div className="form-row-2">
                  <div className="form-field">
                    <label htmlFor="workLatitude">Latitud</label>
                    <input
                      id="workLatitude"
                      type="number"
                      name="workLatitude"
                      step="0.0001"
                      value={formData.workLatitude}
                      onChange={handleInputChange}
                      placeholder="Ej: 40.7480"
                    />
                  </div>
                  <div className="form-field">
                    <label htmlFor="workLongitude">Longitud</label>
                    <input
                      id="workLongitude"
                      type="number"
                      name="workLongitude"
                      step="0.0001"
                      value={formData.workLongitude}
                      onChange={handleInputChange}
                      placeholder="Ej: -73.9680"
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="protocol-info">
            <p className="info-title">💡 Protocolo Activo</p>
            <p className="info-text">
              ATHENEA reconocerá a &quot;<span className="accent">
                {formData.title} {formData.preferredName || fullName}
              </span>&quot; usando el protocolo <span className="accent">
                {formData.voiceTone.toUpperCase()}
              </span>.
            </p>
            <p className="info-text">
              Jarvis te dirá &quot;<span className="accent">{formData.jarvisAlias || 'Sir'}</span>&quot;, 
              Cortana te dirá &quot;<span className="accent">{formData.cortanaAlias || 'Chief'}</span>&quot; y 
              SHODAN te dirá &quot;<span className="accent">{formData.shodanAlias || 'Insect'}</span>&quot;.
            </p>
            {formData.missionBio && (
              <p className="info-text">
                Tu misión de &quot;<span className="accent">{formData.missionBio.substring(0, 40)}</span>...&quot; guiará sus sugerencias.
              </p>
            )}
          </div>
        </section>

        <section className="identity-section external-data-section">
          <h2>🌤️ Clima Automático del Teléfono</h2>
          <p className="helper-text">
            ATHENEA usará la ubicación del dispositivo para obtener clima automáticamente, sin API key manual.
          </p>

          <div className="protocol-info" style={{ marginTop: '0.5rem' }}>
            <p className="info-title">📱 Samsung Galaxy S24 Ultra - Modo recomendado</p>
            <p className="info-text">
              El sistema consulta clima por geolocalización del teléfono y sincroniza alertas en segundo plano.
            </p>
            <p className="info-text">
              Proveedor activo: <span className="accent">device-auto</span> (sin configuración manual).
            </p>
          </div>

          <div className="form-group">
            <label>
              <input
                type="checkbox"
                checked={weatherPrefs.enableWeatherAlerts ?? true}
                onChange={(e) =>
                  dispatch(
                    setWeatherPreferences({
                      ...weatherPrefs,
                      apiProvider: 'device-auto',
                      apiKey: '',
                      enableWeatherAlerts: e.target.checked
                    })
                  )
                }
              />
              Activar alertas climáticas automáticas
            </label>
          </div>

          <div className="weather-alert-config">
            <h4>Configuración de Alertas</h4>
            <div className="form-row-3">
              <div className="form-field">
                <label htmlFor="rainAlert">Lluvia (horas previas)</label>
                <input
                  id="rainAlert"
                  type="number"
                  min="1"
                  max="12"
                  value={weatherPrefs.alertOn?.rainIn || 3}
                  onChange={(e) =>
                    dispatch(
                      setWeatherPreferences({
                        ...weatherPrefs,
                        alertOn: {
                          ...weatherPrefs.alertOn,
                          rainIn: Number(e.target.value)
                        }
                      })
                    )
                  }
                />
              </div>
              <div className="form-field">
                <label htmlFor="windAlert">Viento crítico (m/s)</label>
                <input
                  id="windAlert"
                  type="number"
                  min="5"
                  max="30"
                  value={weatherPrefs.alertOn?.windSpeed || 15}
                  onChange={(e) =>
                    dispatch(
                      setWeatherPreferences({
                        ...weatherPrefs,
                        alertOn: {
                          ...weatherPrefs.alertOn,
                          windSpeed: Number(e.target.value)
                        }
                      })
                    )
                  }
                />
              </div>
              <div className="form-field">
                <label>
                  <input
                    type="checkbox"
                    checked={weatherPrefs.alertOn?.extremeTemp ?? true}
                    onChange={(e) =>
                      dispatch(
                        setWeatherPreferences({
                          ...weatherPrefs,
                          alertOn: {
                            ...weatherPrefs.alertOn,
                            extremeTemp: e.target.checked
                          }
                        })
                      )
                    }
                  />
                  Alertar temperaturas extremas
                </label>
              </div>
            </div>
          </div>
        </section>
      </div>

      {/* Save Button */}
      <div className="identity-footer">
        <button
          className={`btn-save ${saved ? 'saved' : ''} ${
            !isFormDirty ? 'disabled' : ''
          }`}
          onClick={handleSave}
          disabled={!isFormDirty}
        >
          {saved ? '✓ Identidad Guardada' : 'Guardar Identidad'}
        </button>
      </div>
    </div>
  );
};
