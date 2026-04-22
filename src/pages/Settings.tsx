import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useLanguage } from "../context/LanguageContext";
import { updateUserSettings } from "../store/slices/userSettingsSlice";
import { isElectron } from "../services/ElectronService";
import { SyncQRModal } from "../components/Sync/SyncQRModal";
import { SyncImportModal } from "../components/Sync/SyncImportModal";
import { resetAllData, exportDataBeforeReset } from "../services/ResetService";
import { showToast } from "../components/Toast";
import "./Settings.css";

type AIProvider = "ollama" | "openai" | "groq";

type ConnectionStatus = {
  ok: boolean;
} | null;

const defaultBaseUrlByProvider: Record<AIProvider, string> = {
  ollama: "http://localhost:11434",
  openai: "https://api.openai.com/v1",
  groq: "https://api.groq.com/openai/v1",
};

const defaultModelByProvider: Record<AIProvider, string> = {
  ollama: "llama3.2:3b",
  openai: "gpt-4o-mini",
  groq: "llama-3.1-8b-instant",
};

export const Settings = () => {
  const dispatch = useDispatch();
  const { language: uiLanguage, setLanguage, t } = useLanguage();
  const settings = useSelector((s: any) => s.userSettings || {});

  const initialProvider = (settings.aiProvider || "ollama") as AIProvider;

  const [provider, setProvider] = useState<AIProvider>(initialProvider);
  const [baseUrl, setBaseUrl] = useState(
    settings.aiBaseUrl || defaultBaseUrlByProvider[initialProvider]
  );
  const [model, setModel] = useState(
    settings.aiModel || defaultModelByProvider[initialProvider]
  );
  const [theme, setTheme] = useState(settings.theme || "neon");
  const [autoLaunch, setAutoLaunch] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>(null);
  const [showSyncModal, setShowSyncModal] = useState(false);
  const [showImportModal, setShowImportModal] = useState(false);

  useEffect(() => {
    if (isElectron() && (window as any).electronAPI?.getAutoLaunch) {
      (window as any).electronAPI
        .getAutoLaunch()
        .then((enabled: boolean) => setAutoLaunch(!!enabled))
        .catch(() => {
          // noop
        });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("athenea.settings.visualPreset", theme);
    dispatch(updateUserSettings({ theme }));
  }, [dispatch, theme]);

  const handleProviderChange = (value: AIProvider) => {
    setProvider(value);
    setBaseUrl(defaultBaseUrlByProvider[value]);
    setModel(defaultModelByProvider[value]);
    setConnectionStatus(null);
  };

  const handleSaveAI = () => {
    const safeBaseUrl = baseUrl.trim();
    const safeModel = model.trim();

    dispatch(
      updateUserSettings({
        aiProvider: provider,
        aiBaseUrl: safeBaseUrl,
        aiModel: safeModel,
      })
    );

    localStorage.setItem("athenea.llm.provider", provider);
    localStorage.setItem("athenea.llm.base_url", safeBaseUrl);
    localStorage.setItem("athenea.llm.model", safeModel);
    window.dispatchEvent(new CustomEvent("athenea:llm-config-updated"));

    showToast(t("AI configuration saved"), "success");
  };

  const handleTestConnection = async () => {
    const safeBaseUrl = baseUrl.trim().replace(/\/$/, "");
    setConnectionStatus(null);

    try {
      const res = await fetch(`${safeBaseUrl}/api/tags`, {
        signal: AbortSignal.timeout(3000),
      });
      setConnectionStatus({ ok: res.ok });
    } catch {
      setConnectionStatus({ ok: false });
    }
  };

  const handleSetLanguage = (lang: "es" | "en") => {
    setLanguage(lang);
    dispatch(updateUserSettings({ language: lang }));
  };

  return (
    <div className="settings-container">
      <h1 className="settings-page-title">{t("Settings")}</h1>
      <p className="settings-page-subtitle">
        {t("ATHENEA — personal, local and private.")}
      </p>

      <div className="settings-section">
        <h2 className="settings-section-title">{t("AI and Agent Intelligence")}</h2>
        <p className="settings-section-desc">
          {t("Configure local Ollama to activate Cortana, Jarvis and SHODAN with real AI.")}
        </p>

        <div className="settings-field">
          <label>{t("Provider")}</label>
          <select
            value={provider}
            onChange={(e) => handleProviderChange(e.target.value as AIProvider)}
          >
            <option value="ollama">Ollama (local)</option>
            <option value="openai">OpenAI</option>
            <option value="groq">Groq</option>
          </select>
        </div>

        <div className="settings-field">
          <label>{t("Base URL")}</label>
          <input
            type="text"
            value={baseUrl}
            onChange={(e) => setBaseUrl(e.target.value)}
            placeholder="http://localhost:11434"
          />
        </div>

        <div className="settings-field">
          <label>{t("Model")}</label>
          <input
            type="text"
            value={model}
            onChange={(e) => setModel(e.target.value)}
            placeholder="llama3.2:3b"
          />
        </div>

        <div className="settings-actions">
          <button className="settings-btn primary" onClick={handleSaveAI}>
            {t("Save")}
          </button>
          <button className="settings-btn secondary" onClick={handleTestConnection}>
            {t("Test connection")}
          </button>
        </div>

        {connectionStatus && (
          <div className={`settings-status ${connectionStatus.ok ? "ok" : "error"}`}>
            {connectionStatus.ok ? `✓ ${t("Connected")}` : `✗ ${t("Connection failed")}`}
          </div>
        )}
      </div>

      <div className="settings-section">
        <h2 className="settings-section-title">{t("Settings visual preset")}</h2>

        <div className="settings-field">
          <label>{t("Theme")}</label>
          <div className="settings-theme-toggle">
            <button
              className={theme === "neon" ? "active" : ""}
              onClick={() => setTheme("neon")}
            >
              {t("Neon")}
            </button>
            <button
              className={theme === "minimal" ? "active" : ""}
              onClick={() => setTheme("minimal")}
            >
              {t("Minimal")}
            </button>
          </div>
        </div>

        <div className="settings-field">
          <label>{t("Language")}</label>
          <div className="settings-lang-toggle">
            <button
              className={uiLanguage === "es" ? "active" : ""}
              onClick={() => handleSetLanguage("es")}
            >
              {t("Spanish")}
            </button>
            <button
              className={uiLanguage === "en" ? "active" : ""}
              onClick={() => handleSetLanguage("en")}
            >
              {t("English")}
            </button>
          </div>
          <small>
            {t("Current language")}: {uiLanguage === "es" ? t("Spanish") : t("English")}
          </small>
        </div>
      </div>

      {isElectron() && (
        <div className="settings-section">
          <h2 className="settings-section-title">{t("System startup")}</h2>

          <div className="settings-field">
            <div className="settings-toggle-row">
              <div>
                <label>{t("Iniciar ATHENEA con Windows")}</label>
                <small>{t("ATHENEA abrira automaticamente cuando enciendas tu PC.")}</small>
              </div>
              <input
                type="checkbox"
                checked={autoLaunch}
                onChange={async (e) => {
                  const val = e.target.checked;
                  setAutoLaunch(val);
                  if ((window as any).electronAPI?.setAutoLaunch) {
                    await (window as any).electronAPI.setAutoLaunch(val);
                  }
                }}
              />
            </div>
          </div>
        </div>
      )}

      {isElectron() && (
        <div className="settings-section">
          <h2 className="settings-section-title">{t("Synchronization")}</h2>
          <p className="settings-section-desc">
            {t("Transfer your data to your mobile over local WiFi. Both devices must be on the same network.")}
          </p>
          <button className="settings-btn primary" onClick={() => setShowSyncModal(true)}>
            {t("Sync with mobile")}
          </button>
        </div>
      )}

      {!isElectron() && (
        <div className="settings-section">
          <h2 className="settings-section-title">{t("Synchronization")}</h2>
          <p className="settings-section-desc">
            {t("Import your data from desktop by scanning the QR code.")}
          </p>
          <button className="settings-btn primary" onClick={() => setShowImportModal(true)}>
            {t("Scan desktop QR")}
          </button>
        </div>
      )}

      <div className="settings-section danger">
        <h2 className="settings-section-title danger">{t("Data & Privacy")}</h2>
        <p className="settings-section-desc">
          {t("Export your data before deleting all local information. This is recommended before sharing or distributing ATHENEA.")}
        </p>

        <div className="settings-actions">
          <button className="settings-btn secondary" onClick={exportDataBeforeReset}>
            {t("Export backup")}
          </button>
          <button
            className="settings-btn danger"
            onClick={() => {
              if (window.confirm(t("⚠️ This action will erase all local data from this device. Continue?"))) {
                resetAllData();
                window.location.reload();
              }
            }}
          >
            {t("Reset all local data")}
          </button>
        </div>
      </div>

      {showSyncModal && <SyncQRModal onClose={() => setShowSyncModal(false)} />}
      {showImportModal && <SyncImportModal onClose={() => setShowImportModal(false)} />}
    </div>
  );
};

export default Settings;
