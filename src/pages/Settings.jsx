import React, { useState, useEffect } from 'react';
import { useDataExport } from '../hooks/useDataExport';
import { cacheManager } from '../utils/cacheManager';
import { useDispatch } from 'react-redux';
import './Settings.css';

/**
 * Settings Page with Cache Management and Data Export/Import
 */
const Settings = () => {
  const dispatch = useDispatch();
  const { exportToJSON, exportToPDF, importFromJSON } = useDataExport();
  const [cacheStats, setCacheStats] = useState(null);
  const [importText, setImportText] = useState('');
  const [message, setMessage] = useState(null);

  useEffect(() => {
    refreshCacheStats();
  }, []);

  const refreshCacheStats = () => {
    const stats = cacheManager.getCacheStats();
    setCacheStats(stats);
  };

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

  const handleOptimizeStorage = () => {
    const result = cacheManager.optimizeStorage();
    if (result.success) {
      showMessage(`✓ Storage optimized! Saved ${(result.bytesSaved / 1024).toFixed(2)} KB`, 'success');
      refreshCacheStats();
    } else {
      showMessage(`Error: ${result.message}`, 'error');
    }
  };

  const handleClearOldCache = () => {
    const result = cacheManager.clearOldCache(30);
    if (result.success) {
      showMessage(`✓ Cleared ${result.clearedCount} old cache items`, 'success');
      refreshCacheStats();
    } else {
      showMessage(`Error: ${result.message}`, 'error');
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

  return (
    <div className="settings-page">
      <div className="settings-header">
        <h1>⚙️ Settings</h1>
        <p>Manage your app data, cache, and preferences</p>
      </div>

      {message && (
        <div className={`settings-message ${message.type}`}>
          {message.text}
        </div>
      )}

      {/* Storage Stats */}
      {cacheStats && (
        <div className="settings-section">
          <h2>💾 Storage Information</h2>
          <div className="storage-stats">
            <div className="storage-info">
              <div className="storage-bar">
                <div 
                  className="storage-fill" 
                  style={{ width: `${Math.min(cacheStats.usagePercent, 100)}%` }}
                ></div>
              </div>
              <div className="storage-text">
                <span>{cacheStats.totalSize.mb} MB used</span>
                <span>{cacheStats.usagePercent}% of {cacheStats.limit.mb} MB</span>
              </div>
            </div>
            <div className="storage-details">
              <div className="detail-item">
                <span className="detail-label">Total Items:</span>
                <span className="detail-value">{cacheStats.itemCount}</span>
              </div>
              <div className="detail-item">
                <span className="detail-label">Size:</span>
                <span className="detail-value">{cacheStats.totalSize.kb} KB</span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Data Export/Import */}
      <div className="settings-section">
        <h2>📥 Data Backup & Restore</h2>
        <p className="section-description">
          Create backups of all your data for safekeeping or device migration
        </p>
        
        <div className="settings-actions">
          <button className="settings-button primary" onClick={handleExportPDF}>
            📄 Export Complete PDF Backup
          </button>
          <button className="settings-button secondary" onClick={handleExportJSON}>
            💾 Export JSON Backup
          </button>
        </div>

        <div className="import-section">
          <h3>📤 Restore from Backup</h3>
          <p className="help-text">
            Paste your JSON backup code below (from PDF or JSON file)
          </p>
          <textarea
            className="import-textarea"
            value={importText}
            onChange={(e) => setImportText(e.target.value)}
            placeholder='Paste your backup JSON here...'
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
      </div>

      {/* Cache Management */}
      <div className="settings-section">
        <h2>🧹 Cache Management</h2>
        <p className="section-description">
          Optimize storage and clear unnecessary cache
        </p>
        
        <div className="settings-actions">
          <button className="settings-button secondary" onClick={handleOptimizeStorage}>
            ✨ Optimize Storage
          </button>
          <button className="settings-button secondary" onClick={handleClearOldCache}>
            🗑️ Clear Old Cache (30+ days)
          </button>
          <button className="settings-button secondary" onClick={() => {
            refreshCacheStats();
            showMessage('✓ Stats refreshed', 'success');
          }}>
            🔄 Refresh Stats
          </button>
        </div>
      </div>

      {/* Danger Zone */}
      <div className="settings-section danger-zone">
        <h2>⚠️ Danger Zone</h2>
        <p className="section-description">
          Irreversible actions - proceed with caution
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

      {/* App Info */}
      <div className="settings-section">
        <h2>ℹ️ App Information</h2>
        <div className="app-info">
          <div className="info-row">
            <span className="info-label">Version:</span>
            <span className="info-value">1.0.0</span>
          </div>
          <div className="info-row">
            <span className="info-label">Platform:</span>
            <span className="info-value">Web / Mobile (Offline)</span>
          </div>
          <div className="info-row">
            <span className="info-label">Storage:</span>
            <span className="info-value">localStorage</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings;
