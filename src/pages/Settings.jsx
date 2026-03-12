import React, { useState } from 'react';
import { useDataExport } from '../hooks/useDataExport';
import { cacheManager } from '../utils/cacheManager';
import { IdentityPanel } from '../components/settings/IdentityPanel';
import { simulateInterceptedNotification } from '../services/notificationListenerBridge';
import { getActionBridge } from '../modules/actions/ActionBridge';
import './Settings.css';

/**
 * User Core & Telemetry
 * Immersive control center for Identity Core + outbound webhook telemetry.
 */
const Settings = () => {
  const { exportToJSON, exportToPDF, importFromJSON } = useDataExport();
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState(null);
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [debugOpen, setDebugOpen] = useState(false);
  const [debugLogs, setDebugLogs] = useState([]);

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
      // Import data into Redux store
      Object.keys(result.data).forEach((key) => {
        // Dispatch actions to restore each slice
        // This would need to be implemented per slice
        // For now, we'll just save to localStorage and reload
      });
      
      showMessage('✓ Data imported successfully! Reloading app...', 'success');
      setTimeout(() => window.location.reload(), 1500);
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
