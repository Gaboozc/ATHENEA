import React, { useState } from 'react';
import { getLLMConfigSync } from '../../services/LLMClient';
import './IdentityPanel.css';

const LLM_PROVIDER_OPTIONS = [
  { value: 'ollama', label: 'Ollama' },
];

const DEFAULT_BASE_URL: Record<'ollama' | 'openai' | 'groq', string> = {
  ollama: 'http://localhost:11434/v1',
  openai: 'https://api.openai.com/v1',
  groq: 'https://api.groq.com/openai/v1',
};

const DEFAULT_MODEL: Record<'ollama' | 'openai' | 'groq', string> = {
  ollama: 'llama3.2:3b',
  openai: 'gpt-4o-mini',
  groq: 'llama-3.1-8b-instant',
};

export const IdentityPanel: React.FC = () => {
  const initial = getLLMConfigSync();
  const [formData, setFormData] = useState({
    llmProvider: 'ollama' as const,
    llmBaseUrl: initial.provider === 'ollama' ? initial.baseUrl : DEFAULT_BASE_URL.ollama,
    llmModel: initial.provider === 'ollama' ? initial.model : DEFAULT_MODEL.ollama,
    llmApiKey: initial.apiKey,
  });
  const [saved, setSaved] = useState(false);

  const handleField = (
    key: 'llmProvider' | 'llmBaseUrl' | 'llmModel' | 'llmApiKey',
    value: string
  ) => {
    setFormData((prev) => ({ ...prev, [key]: value }));
    setSaved(false);
  };

  const handleSave = async () => {
    const provider = formData.llmProvider as 'ollama' | 'openai' | 'groq';
    localStorage.setItem('athenea.llm.provider', provider);
    localStorage.setItem('athenea.llm.base_url', (formData.llmBaseUrl || DEFAULT_BASE_URL[provider]).trim());
    localStorage.setItem('athenea.llm.model', (formData.llmModel || DEFAULT_MODEL[provider]).trim());
    localStorage.setItem('athenea.neural.key', formData.llmApiKey.trim());

    window.dispatchEvent(new CustomEvent('athenea:neural-key-updated', { detail: { hasKey: !!formData.llmApiKey.trim() } }));
    window.dispatchEvent(new CustomEvent('athenea:llm-config-updated'));

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
          <select value={formData.llmProvider} disabled>
            {LLM_PROVIDER_OPTIONS.map((provider) => (
              <option key={provider.value} value={provider.value}>
                {provider.label}
              </option>
            ))}
          </select>
        </label>

        <label className="identity-field identity-field-full">
          <span>Base URL</span>
          <input
            type="text"
            value={formData.llmBaseUrl}
            onChange={(e) => handleField('llmBaseUrl', e.target.value)}
            placeholder={DEFAULT_BASE_URL[formData.llmProvider as 'ollama' | 'openai' | 'groq']}
            autoComplete="off"
          />
        </label>

        <label className="identity-field identity-field-full">
          <span>Model</span>
          <input
            type="text"
            value={formData.llmModel}
            onChange={(e) => handleField('llmModel', e.target.value)}
            placeholder={DEFAULT_MODEL[formData.llmProvider as 'ollama' | 'openai' | 'groq']}
            autoComplete="off"
          />
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
