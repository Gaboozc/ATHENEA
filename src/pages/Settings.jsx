import React, { useState } from 'react';
import { useDataExport } from '../hooks/useDataExport';
import { cacheManager } from '../utils/cacheManager';
import { IdentityPanel } from '../components/settings/IdentityPanel';
import { simulateInterceptedNotification } from '../services/notificationListenerBridge';
import { getActionBridge } from '../modules/actions/ActionBridge';
import { getNeuralKey, setNeuralKey, getNeuralProvider, setNeuralProvider } from '../modules/intelligence/neuralAccess';
import { useLanguage } from '../context/LanguageContext';
import './Settings.css';

/**
 * User Core & Telemetry
 * Immersive control center for Identity Core + outbound webhook telemetry.
 */
const Settings = () => {
  const { language, setLanguage } = useLanguage();
  const { exportToJSON, exportToPDF, importFromJSON } = useDataExport();
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);

  // AI / Neural settings
  const [aiProvider, setAiProvider] = useState(() => getNeuralProvider());
  const [aiKey, setAiKey] = useState(() => getNeuralKey());
  const [aiKeyVisible, setAiKeyVisible] = useState(false);
  const [aiTestStatus, setAiTestStatus] = useState(null); // null | 'testing' | 'ok' | 'error'

  const handleSaveAI = () => {
    setNeuralProvider(aiProvider);
    setNeuralKey(aiKey);
    showMessage('✓ Configuración de IA guardada');
  };

  const handleTestAI = async () => {
    const key = aiKey.trim();
    if (!key) { showMessage('Ingresa tu API key primero', 'error'); return; }
    setAiTestStatus('testing');
    try {
      const url = aiProvider === 'groq'
        ? 'https://api.groq.com/openai/v1/models'
        : 'https://api.openai.com/v1/models';
      const res = await fetch(url, { headers: { Authorization: `Bearer ${key}` } });
      setAiTestStatus(res.ok ? 'ok' : 'error');
      showMessage(res.ok ? '✓ Conexión exitosa — IA activa' : `✗ Error ${res.status}: clave inválida`, res.ok ? 'success' : 'error');
    } catch {
      setAiTestStatus('error');
      showMessage('✗ No se pudo conectar al proveedor de IA', 'error');
    }
  };

  const isProductionReadyFlagEnabled = () => {
    if (typeof window !== 'undefined' && window.localStorage) {
      return window.localStorage.getItem('Production_Ready_Flag') === 'true';
    }
    return String(import.meta.env.VITE_PRODUCTION_READY_FLAG || '').toLowerCase() === 'true';
  };

  const canShowDebugConsole = isProductionReadyFlagEnabled();

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type });
    setTimeout(() => setMessage(null), 4000);
  };

  const handleExportJSON = () => {
    exportToJSON();
    showMessage('✓ Data exported as JSON successfully');
  };

  const handleExportPDF = () => {
    exportToPDF();
    showMessage('✓ Complete backup PDF generated successfully');
  };

  const handleImport = () => {
    if (!importText.trim()) {
      showMessage('Please paste your backup JSON code', 'error');
      return;
    }

    const result = importFromJSON(importText);

    if (result.success) {
      const { data } = result;
      // Build the persist:athenea-root entry from the backup data
      const SLICES = ['auth', 'projects', 'organizations', 'notes', 'calendar',
        'todos', 'payments', 'routines', 'budget', 'collaborators', 'workOrders',
        'stats', 'tasks', 'goals'];
      try {
        const existing = JSON.parse(localStorage.getItem('persist:athenea-root') || '{}');
        SLICES.forEach((key) => {
          if (data[key] !== undefined) {
            existing[key] = JSON.stringify(data[key]);
          }
        });
        localStorage.setItem('persist:athenea-root', JSON.stringify(existing));
        const counts = [
          data.projects?.projects?.length && `${data.projects.projects.length} proyectos`,
          data.tasks?.length && `${data.tasks.length} tareas`,
          data.notes?.notes?.length && `${data.notes.notes.length} notas`,
          data.todos?.todos?.length && `${data.todos.todos.length} todos`,
          data.payments?.payments?.length && `${data.payments.payments.length} pagos`,
        ].filter(Boolean).join(', ');
        showMessage(`✓ Importado: ${counts || 'datos restaurados'}. Recargando…`, 'success');
        setTimeout(() => window.location.reload(), 1800);
      } catch (err) {
        showMessage(`✗ Error escribiendo datos: ${err.message}`, 'error');
      }
    } else {
      showMessage(`✗ Import failed: ${result.error}`, 'error');
    }
  };

  const handleClearAll = () => {
    if (window.confirm('⚠️ WARNING: This will DELETE ALL your data permanently. Are you absolutely sure?')) {
      if (window.confirm('Last chance! This action CANNOT be undone. Continue?')) {
        const result = cacheManager.clearAllData();
        if (result.success) {
          showMessage('All data cleared. Reloading...', 'success');
          setTimeout(() => window.location.reload(), 1500);
        } else {
          showMessage(`Error: ${result.message}`, 'error');
        }
      }
    }
  };

  const handleBackupBeforeClear = () => {
    const result = cacheManager.createBackupBeforeClear();
    if (result.success) {
      showMessage('✓ Backup created! Check your downloads', 'success');
    } else {
      showMessage(`Error: ${result.message}`, 'error');
    }
  };

  const handleSimulateBankIntercept = async () => {
    await simulateInterceptedNotification({
      packageName: 'sim.test',
      appName: 'Simulated App',
      title: 'Notificacion simulada',
      text: 'Evento de prueba sin monto',
    });
    showMessage('Simulacion enviada al pipeline de intercepcion.', 'success');
  };

  const handleRefreshDebugLogs = () => {
    const logs = getActionBridge().getActionLog();
    setDebugLogs(logs.slice(-20).reverse());
  };

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>🧠 Neural Core</h1>
        <p>ATHENEA personal, local y privada. Sin nube multiusuario.</p>
      </div>

      {message && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
        </div>
      )}

      <div className="settings-section">
        <IdentityPanel />
      </div>

      {/* ── Idioma ───────────────────────────────────────────────────────── */}
      <div className="settings-section">
        <h2 className="settings-section-title">🌐 Idioma / Language</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
          <select
            className="settings-select"
            value={language}
            onChange={(e) => setLanguage(e.target.value)}
            style={{ maxWidth: 200 }}
          >
            <option value="en">English</option>
            <option value="es">Español</option>
          </select>
          <span style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
            {language === 'es' ? 'La interfaz está en Español' : 'Interface is in English'}
          </span>
        </div>
      </div>

      {/* ── Inteligencia Artificial ──────────────────────────────────────── */}
      <div className="settings-section">
        <h2 className="settings-section-title">🤖 Inteligencia Artificial</h2>
        <p className="settings-section-desc">
          Configura tu API key para activar los agentes Cortana, Jarvis y SHODAN con IA real.
        </p>

        <div style={{ display: 'grid', gap: '0.75rem', maxWidth: 480 }}>
          <label style={{ display: 'grid', gap: 4 }}>
            <span className="settings-label">Proveedor</span>
            <select
              className="settings-select"
              value={aiProvider}
              onChange={(e) => setAiProvider(e.target.value)}
            >
              <option value="openai">OpenAI (GPT-4o-mini)</option>
              <option value="groq">Groq (Llama 3.1 — gratis)</option>
            </select>
          </label>

          <label style={{ display: 'grid', gap: 4 }}>
            <span className="settings-label">API Key</span>
            <div style={{ display: 'flex', gap: 8 }}>
              <input
                type={aiKeyVisible ? 'text' : 'password'}
                className="settings-input"
                value={aiKey}
                onChange={(e) => setAiKey(e.target.value)}
                placeholder={aiProvider === 'groq' ? 'gsk_...' : 'sk-...'}
                style={{ flex: 1 }}
              />
              <button
                type="button"
                className="settings-button secondary"
                style={{ padding: '0 12px', minWidth: 44 }}
                onClick={() => setAiKeyVisible((v) => !v)}
              >
                {aiKeyVisible ? '🙈' : '👁'}
              </button>
            </div>
          </label>

          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button className="settings-button primary" onClick={handleSaveAI}>
              Guardar
            </button>
            <button
              className="settings-button secondary"
              onClick={handleTestAI}
              disabled={aiTestStatus === 'testing'}
            >
              {aiTestStatus === 'testing' ? '⏳ Probando…' :
               aiTestStatus === 'ok'      ? '✓ Conectado' :
               aiTestStatus === 'error'   ? '✗ Reintentar' :
                                            'Probar conexión'}
            </button>
          </div>

          <p style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', margin: 0 }}>
            {aiProvider === 'groq'
              ? 'Groq es gratuito. Obtén tu key en console.groq.com'
              : 'OpenAI requiere créditos. Obtén tu key en platform.openai.com'}
          </p>
        </div>
      </div>

      {canShowDebugConsole && (
        <div className="settings-section advanced-system-core">
          <button
            className="advanced-core-toggle"
            type="button"
            aria-expanded={debugOpen}
            onClick={() => setDebugOpen((prev) => !prev)}
          >
            <span>Debug Console</span>
            <span>{debugOpen ? '−' : '+'}</span>
          </button>

          {debugOpen && (
            <div className="import-section" style={{ marginTop: '1rem' }}>
              <h3>Simulation & Internal Logs</h3>
              <p className="help-text">
                Herramientas internas movidas fuera de la Omnibar principal.
              </p>
              <div className="settings-actions">
                <button className="settings-button secondary" onClick={handleSimulateBankIntercept}>
                  Simular Banco
                </button>
                <button className="settings-button secondary" onClick={handleRefreshDebugLogs}>
                  Refrescar ActionBridge Log
                </button>
              </div>

              <textarea
                className="import-textarea"
                readOnly
                value={JSON.stringify(debugLogs, null, 2)}
                rows={8}
                placeholder="No debug logs yet..."
              />
            </div>
          )}
        </div>
      )}

      {/* Advanced System Core (collapsed by default) */}
      <div className="settings-section advanced-system-core">
        <button
          className="advanced-core-toggle"
          type="button"
          aria-expanded={advancedOpen}
          onClick={() => setAdvancedOpen((prev) => !prev)}
        >
          <span>Advanced System Core</span>
          <span>{advancedOpen ? '−' : '+'}</span>
        </button>

        {advancedOpen && (
          <>
            <div className="import-section" style={{ marginTop: '1.25rem', borderTop: 'none', paddingTop: 0 }}>
              <h3>📥 Data Backup & Restore</h3>
              <p className="help-text">
                Export or recover full state snapshots.
              </p>

              <div className="settings-actions">
                <button className="settings-button primary" onClick={handleExportPDF}>
                  📄 Export Complete PDF Backup
                </button>
                <button className="settings-button secondary" onClick={handleExportJSON}>
                  💾 Export JSON Backup
                </button>
              </div>

              <textarea
                className="import-textarea"
                value={importText}
                onChange={(e) => setImportText(e.target.value)}
                placeholder="Paste your backup JSON here..."
                rows={6}
              />
              <button
                className="settings-button primary"
                onClick={handleImport}
                disabled={!importText.trim()}
              >
                Import & Restore Data
              </button>
            </div>

            <div className="settings-section danger-zone" style={{ marginTop: '1rem', marginBottom: 0 }}>
              <h2>⚠️ Danger Zone</h2>
              <p className="section-description">
                Irreversible actions. Proceed with caution.
              </p>

              <div className="settings-actions">
                <button className="settings-button secondary" onClick={handleBackupBeforeClear}>
                  💾 Create Emergency Backup
                </button>
                <button className="settings-button danger" onClick={handleClearAll}>
                  🔥 Clear All Data (Cannot Undo!)
                </button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Settings;
