import React, { useState } from 'react';
import {
  getNeuralKey,
  getNeuralProvider,
  setNeuralKey,
  setNeuralProvider,
} from '../../modules/intelligence/neuralAccess';
import type { NeuralProvider } from '../../modules/intelligence/neuralAccess';
import './IdentityPanel.css';

const LLM_PROVIDER_OPTIONS = [
  { value: 'openai', label: 'OpenAI' },
  { value: 'groq', label: 'Groq' },
];

export const IdentityPanel: React.FC = () => {
  const [formData, setFormData] = useState({
    llmProvider: getNeuralProvider(),
    llmApiKey: getNeuralKey(),
  });
  const [saved, setSaved] = useState(false);

  const handleField = (key: 'llmProvider' | 'llmApiKey', value: string) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = () => {
    setNeuralProvider(formData.llmProvider as NeuralProvider);
    setNeuralKey(formData.llmApiKey);
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div className="identity-panel">
      <div className="identity-panel-header">
        <h2>Neural Access</h2>
        <p>Configuracion local y privada del acceso directo al cerebro de ATHENEA.</p>
      </div>

      <div className="identity-preview">
        <span className="identity-preview-kicker">Direct Neural Link</span>
        <p className="identity-preview-line">Nada se guarda fuera del dispositivo.</p>
      </div>

      <div className="identity-grid">
        <label className="identity-field identity-field-full">
          <span>Provider</span>
          <select
            value={formData.llmProvider}
            onChange={(e) => handleField('llmProvider', e.target.value)}
          >
            {LLM_PROVIDER_OPTIONS.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
        </label>

        <label className="identity-field identity-field-full">
          <span>Neural Key</span>
          <input
            type="password"
            value={formData.llmApiKey}
            onChange={(e) => handleField('llmApiKey', e.target.value)}
            placeholder="sk-..."
            autoComplete="off"
          />
          <small className="identity-help-text">
            Se guarda solo en localStorage local. Solo se usa para peticiones directas al proveedor elegido.
          </small>
        </label>
      </div>

      <div className="identity-actions">
        <button type="button" className="identity-save-btn" onClick={handleSave}>
          Save Neural Access
        </button>
        {saved && <span className="identity-saved">Saved</span>}
      </div>
    </div>
  );
};

export default IdentityPanel;
