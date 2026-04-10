import { useEffect, useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import "./Settings.css";
import { useLanguage } from "../context/LanguageContext";
import {
  expelMember,
  setCurrentOrg,
  updateOrganizationBranding
} from "../../store/slices/organizationsSlice";
import { setVoiceLanguage, updateUserSettings } from "../store/slices/userSettingsSlice";
import type { VoiceLanguage } from "../store/slices/userSettingsSlice";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useTasks } from "../context/TasksContext";
import { getPlanLimits } from "../utils/planLimits";
import { useDataExport } from "../hooks/useDataExport";
import { cacheManager } from "../utils/cacheManager";
import { IdentityPanel } from "../components/settings/IdentityPanel";
import { llmClient, getLLMConfigSync } from "../services/LLMClient";

const INVITES_STORAGE_KEY = "athenea.invites";
const ACCESS_DENIED_KEY = "athenea.accessDenied";
const CREATOR_USER_ID = "1";

const EXPIRY_OPTIONS = [
  { label: "24h", hours: 24 },
  { label: "48h", hours: 48 },
  { label: "7d", hours: 168 }
];

const buildToken = () =>
  Math.random().toString(36).slice(2, 10).toUpperCase() +
  Math.random().toString(36).slice(2, 6).toUpperCase();

const defaultBaseUrlByProvider = {
  ollama: "http://localhost:11434/v1",
  openai: "https://api.openai.com/v1",
  groq: "https://api.groq.com/openai/v1",
} as const;

const defaultModelByProvider = {
  ollama: "llama3.2:3b",
  openai: "gpt-4o-mini",
  groq: "llama-3.1-8b-instant",
} as const;

export const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const voiceLanguage = useSelector((state: any) => state.userSettings?.voiceLanguage ?? 'auto') as VoiceLanguage;
  /* FIX UX-4 */
  const advancedMode = useSelector((state: any) => state.userSettings?.advancedMode ?? false);
  const { user, role } = useCurrentUser();
  const { clearAssignmentsForUser } = useTasks();
  const {
    organizations,
    memberships,
    currentOrgId,
    workstreams,
    teamMemberships
  } = useSelector((state: any) => state.organizations);

  const currentOrg = organizations.find((org: any) => org.id === currentOrgId);
  const planId = currentOrg?.planId || currentOrg?.plan;
  const planLimits = getPlanLimits(planId);
  const planName = planLimits.label;
  const planPrice = currentOrg?.planPrice ?? planLimits.price;
  const memberCount = memberships.filter((entry: any) => entry.orgId === currentOrgId).length;
  const resolvedMemberCount = memberCount || 1;
  const workerLimit = currentOrg?.workerLimit ?? planLimits.workers;
  const workerLimitReached =
    workerLimit !== null && workerLimit !== undefined && resolvedMemberCount >= workerLimit;
  const membership = memberships.find(
    (entry: any) => entry.userId === user?.id && entry.orgId === currentOrgId
  );
  const roleKey = (role || "").toLowerCase();
  const isAdmin = roleKey === "admin" || roleKey === "super-admin";
  const profileUser = user;
  const assignedRole = role || membership?.role || "-";

  const myTeams = useMemo(() => {
    if (!user?.id || !currentOrgId) return [];
    const teamIds = teamMemberships
      .filter(
        (entry: any) => entry.orgId === currentOrgId && entry.userId === user.id
      )
      .map((entry: any) => entry.teamId);
    const teams = workstreams.filter(
      (team: any) => team.orgId === currentOrgId && teamIds.includes(team.id)
    );
    return teams
      .map((team: any) => team.label || team.name)
      .filter(Boolean)
      .sort((a: string, b: string) => a.localeCompare(b));
  }, [currentOrgId, teamMemberships, user?.id, workstreams]);

  const [invites, setInvites] = useState<any[]>([]);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteExpiry, setInviteExpiry] = useState(EXPIRY_OPTIONS[0].label);
  const [brandName, setBrandName] = useState(currentOrg?.name || "");
  const [brandColor, setBrandColor] = useState(currentOrg?.brandColor || "#1ec9ff");
  const [logoUrl, setLogoUrl] = useState(currentOrg?.logoUrl || "");
  /* FIX UX-6 — feedback de guardado inline */
  const [savedField, setSavedField] = useState<string | null>(null);
  const [visualPreset, setVisualPreset] = useState<'neon' | 'minimal'>(() => {
    const stored = localStorage.getItem('athenea.settings.visualPreset');
    return stored === 'minimal' ? 'minimal' : 'neon';
  });
  const markSaved = (key: string) => {
    setSavedField(key);
    setTimeout(() => setSavedField(null), 1500);
  };

  useEffect(() => {
    localStorage.setItem('athenea.settings.visualPreset', visualPreset);
  }, [visualPreset]);

  // AI / Neural settings
  const [aiProvider] = useState<'ollama'>('ollama');
  const [aiBaseUrl, setAiBaseUrl] = useState(() => getLLMConfigSync().baseUrl);
  const [aiModel, setAiModel] = useState(() => getLLMConfigSync().model);
  const [aiKey, setAiKey] = useState(() => getLLMConfigSync().apiKey);
  const [aiTestStatus, setAiTestStatus] = useState<null | 'testing' | 'ok' | 'error'>(null);
  const [aiMessage, setAiMessage] = useState<{ text: string; type: string } | null>(null);
  const showAiMessage = (text: string, type = 'success') => {
    setAiMessage({ text, type });
    setTimeout(() => setAiMessage(null), 4000);
  };
  const handleSaveAI = async () => {
    const safeBaseUrl = (aiBaseUrl || defaultBaseUrlByProvider[aiProvider]).trim();
    const safeModel = (aiModel || defaultModelByProvider[aiProvider]).trim();
    const safeKey = aiKey.trim();

    localStorage.setItem('athenea.llm.provider', aiProvider);
    localStorage.setItem('athenea.llm.base_url', safeBaseUrl);
    localStorage.setItem('athenea.llm.model', safeModel);
    localStorage.setItem('athenea.neural.key', safeKey);

    window.dispatchEvent(new CustomEvent('athenea:neural-key-updated', { detail: { hasKey: !!safeKey } }));
    window.dispatchEvent(new CustomEvent('athenea:llm-config-updated'));

    showAiMessage(t('AI configuration saved'));
  };

  const handleTestAI = async () => {
    const safeBaseUrl = (aiBaseUrl || defaultBaseUrlByProvider[aiProvider]).trim();
    const safeModel = (aiModel || defaultModelByProvider[aiProvider]).trim();
    const safeKey = aiKey.trim();

    localStorage.setItem('athenea.llm.provider', aiProvider);
    localStorage.setItem('athenea.llm.base_url', safeBaseUrl);
    localStorage.setItem('athenea.llm.model', safeModel);
    localStorage.setItem('athenea.neural.key', safeKey);

    if (aiProvider !== 'ollama' && !safeKey) {
      showAiMessage(t('Enter your API key first'), 'error');
      return;
    }

    setAiTestStatus('testing');
    try {
      const ok = await llmClient.testConnection();
      setAiTestStatus(ok ? 'ok' : 'error');
      showAiMessage(ok ? t('Connection successful — AI active') : t('Could not connect to AI provider'), ok ? 'success' : 'error');
    } catch {
      setAiTestStatus('error');
      showAiMessage(t('Could not connect to AI provider'), 'error');
    }
  };

  // Data export/import
  const { exportToJSON, exportToPDF, importFromJSON } = useDataExport();
  const [importText, setImportText] = useState('');
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const handleExportJSON = () => exportToJSON();
  const handleExportPDF = () => exportToPDF();
  const handleImport = () => {
    if (!importText.trim()) return;
    const result = importFromJSON(importText);
    if (result.success) {
      const SLICES = ['auth', 'projects', 'organizations', 'notes', 'calendar',
        'todos', 'payments', 'routines', 'budget', 'collaborators', 'workOrders',
        'stats', 'tasks', 'goals'];
      const existing = JSON.parse(localStorage.getItem('persist:athenea-root') || '{}');
      SLICES.forEach((key) => {
        if ((result.data as any)[key] !== undefined) existing[key] = JSON.stringify((result.data as any)[key]);
      });
      localStorage.setItem('persist:athenea-root', JSON.stringify(existing));
      setTimeout(() => window.location.reload(), 1200);
    }
  };
  const handleClearAll = () => {
    if (window.confirm('⚠️ This will DELETE ALL data permanently. Are you sure?')) {
      if (window.confirm('Last chance — this CANNOT be undone. Continue?')) {
        cacheManager.clearAllData();
        setTimeout(() => window.location.reload(), 1500);
      }
    }
  };

  useEffect(() => {
    const stored = localStorage.getItem(INVITES_STORAGE_KEY);
    if (!stored) return;
    try {
      const parsed = JSON.parse(stored);
      if (Array.isArray(parsed)) {
        setInvites(parsed);
      }
    } catch (error) {
      console.error("Failed to load invites", error);
    }
  }, []);

  useEffect(() => {
    localStorage.setItem(INVITES_STORAGE_KEY, JSON.stringify(invites));
  }, [invites]);

  useEffect(() => {
    setBrandName(currentOrg?.name || "");
    setBrandColor(currentOrg?.brandColor || "#1ec9ff");
    setLogoUrl(currentOrg?.logoUrl || "");
  }, [currentOrg]);

  const orgOptions = user
    ? memberships
        .filter((entry: any) => entry.userId === user.id && entry.status === "active")
        .map((entry: any) => organizations.find((org: any) => org.id === entry.orgId))
        .filter(Boolean)
    : [];

  const orgMembers = useMemo(
    () =>
      memberships
        .filter((entry: any) => entry.orgId === currentOrgId)
        .map((entry: any) => ({
          ...entry,
          user: { id: entry.userId, name: entry.userId }
        })),
    [currentOrgId, memberships]
  );

  const handleOrgSwitch = (orgId: string) => {
    dispatch(setCurrentOrg(orgId));
    window.location.reload();
  };

  const handleCreateInvite = () => {
    if (!currentOrgId || !inviteEmail.trim()) return;
    const expiry = EXPIRY_OPTIONS.find((entry) => entry.label === inviteExpiry);
    const expiresAt = new Date(Date.now() + (expiry?.hours || 24) * 3600000).toISOString();
    setInvites((prev) => [
      {
        id: Date.now().toString(),
        orgId: currentOrgId,
        email: inviteEmail.trim(),
        token: buildToken(),
        expiresAt,
        createdAt: new Date().toISOString()
      },
      ...prev
    ]);
    setInviteEmail("");
  };

  const handleBrandSave = () => {
    if (!currentOrgId) return;
    dispatch(
      updateOrganizationBranding({
        orgId: currentOrgId,
        name: brandName,
        brandColor,
        logoUrl
      })
    );
  };

  const handleExpel = (userId: string) => {
    if (!currentOrgId) return;
    if (userId === CREATOR_USER_ID) return;
    dispatch(expelMember({ orgId: currentOrgId, userId }));
    clearAssignmentsForUser(userId);
    if (userId === profileUser?.id) {
      localStorage.setItem(ACCESS_DENIED_KEY, "expelled");
      navigate("/awaiting-command", { state: { reason: "expelled" } });
    }
  };

  return (
    <div className={`settings-page ${visualPreset === 'minimal' ? 'settings-theme-b' : 'settings-theme-a'}`}>
      <header className="settings-header">
        <div className="settings-header-top">
          <div>
            <h1>{t("Settings")}</h1>
            <p>{t("Identity & Governance")}</p>
          </div>
          <div className="settings-theme-toggle" role="group" aria-label="Settings visual preset">
            <button
              type="button"
              className={`settings-theme-btn ${visualPreset === 'neon' ? 'is-active' : ''}`}
              onClick={() => setVisualPreset('neon')}
            >
              Neon
            </button>
            <button
              type="button"
              className={`settings-theme-btn ${visualPreset === 'minimal' ? 'is-active' : ''}`}
              onClick={() => setVisualPreset('minimal')}
            >
              Minimal
            </button>
          </div>
        </div>
      </header>

      <section className="settings-card">
        <h2>{t("My Profile")}</h2>
        <div className="settings-profile">
          <div className="settings-avatar">
            {(profileUser?.name || "?").slice(0, 2).toUpperCase()}
          </div>
          <div className="settings-profile-info">
            <div>
              <span>{t("Name")}</span>
              <strong>{profileUser?.name || "-"}</strong>
            </div>
            <div>
              <span>{t("Email")}</span>
              <strong>{profileUser?.email || "-"}</strong>
            </div>
            <div>
              <span>{t("Role")}</span>
              <strong>
                <span className="settings-badge">{t(assignedRole)}</span>
              </strong>
            </div>
          </div>
        </div>

        <div className="settings-section">
          <h3>{t("My Teams")}</h3>
          <div className="settings-team-list">
            {myTeams.map((team) => (
              <span key={team} className="settings-team-pill">
                {team}
              </span>
            ))}
            {myTeams.length === 0 && (
              <div className="settings-empty">{t("No teams assigned.")}</div>
            )}
          </div>
        </div>
      </section>

      <section className="settings-card">
        <h2>{t("My Organizations")}</h2>
        <div className="settings-list">
          {orgOptions.map((org: any) => (
            <div key={org.id} className="settings-row settings-row-compact">
              <span>{org.name}</span>
              <button
                type="button"
                className="settings-action"
                onClick={() => handleOrgSwitch(org.id)}
                disabled={org.id === currentOrgId}
              >
                {org.id === currentOrgId ? t("Active") : t("Switch")}
              </button>
            </div>
          ))}
          {orgOptions.length === 0 && (
            <div className="settings-empty">{t("No organizations joined.")}</div>
          )}
        </div>
      </section>

      {isAdmin && (
        <section className="settings-card">
          <h2>{t("Company Settings")}</h2>
          <div className="settings-list">
            <label className="settings-row settings-row-column">
              <span>{t("Company name")}</span>
              <input
                type="text"
                value={brandName}
                onChange={(event) => setBrandName(event.target.value)}
              />
            </label>
            <label className="settings-row settings-row-column">
              <span>{t("Brand color")}</span>
              <input
                type="text"
                value={brandColor}
                onChange={(event) => setBrandColor(event.target.value)}
              />
            </label>
            <label className="settings-row settings-row-column">
              <span>{t("Logo URL")}</span>
              <input
                type="text"
                value={logoUrl}
                onChange={(event) => setLogoUrl(event.target.value)}
              />
            </label>
            <button type="button" className="settings-action" onClick={handleBrandSave}>
              {t("Save branding")}
            </button>
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="settings-card">
          <h2>{t("Billing")}</h2>
          <div className="settings-list">
            <div className="settings-row settings-row-compact">
              <span>{t("Current Plan")}</span>
              <strong>{planName}</strong>
            </div>
            <div className="settings-row settings-row-compact">
              <span>{t("Fixed Monthly Total")}</span>
              <strong>${planPrice}</strong>
            </div>
          </div>
        </section>
      )}

      {isAdmin && (
        <section className="settings-card">
          <h2>{t("Security & Roster")}</h2>
          <div className="settings-section">
            <h3>{t("Invite System")}</h3>
            <div className="settings-invite">
              <input
                type="email"
                placeholder={t("Invite email")}
                value={inviteEmail}
                onChange={(event) => setInviteEmail(event.target.value)}
              />
              <select
                value={inviteExpiry}
                onChange={(event) => setInviteExpiry(event.target.value)}
              >
                {EXPIRY_OPTIONS.map((option) => (
                  <option key={option.label} value={option.label}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="settings-action"
                onClick={handleCreateInvite}
                disabled={!inviteEmail.trim() || !currentOrgId || workerLimitReached}
              >
                {t("Send Invite")}
              </button>
            </div>
            {workerLimitReached && (
              <div className="settings-empty">
                {t("Upgrade to add more workers.")}
              </div>
            )}
            <div className="settings-invite-list">
              {invites
                .filter((invite) => invite.orgId === currentOrgId)
                .map((invite) => (
                  <div key={invite.id} className="settings-invite-item">
                    <span>{invite.email}</span>
                    <span>{t("Expires")}: {new Date(invite.expiresAt).toLocaleString()}</span>
                  </div>
                ))}
              {invites.filter((invite) => invite.orgId === currentOrgId).length === 0 && (
                <div className="settings-empty">{t("No active invites.")}</div>
              )}
            </div>
          </div>

          {/* FIX UX-4 — Voice Language */}
          <div className="settings-section">
            <h3>🎙 {t("Voice Language")} {savedField === 'voiceLanguage' && <span className="settings-saved-indicator">✓ Guardado</span>}</h3>
            <div className="settings-row settings-chip-row">
              {(['auto', 'en-US', 'es-MX', 'es-ES'] as VoiceLanguage[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={`settings-action${voiceLanguage === lang ? ' is-active' : ''}`}
                  onClick={() => { dispatch(setVoiceLanguage(lang)); markSaved('voiceLanguage'); }}
                >
                  {lang === 'auto' ? t('Auto (system)') : lang}
                </button>
              ))}
            </div>
          </div>

          {/* FIX UX-4 — Modo avanzado */}
          <div className="settings-section">
            <h3>🔧 {t("Modo avanzado")} {savedField === 'advancedMode' && <span className="settings-saved-indicator">✓ Guardado</span>}</h3>
            <label className="settings-advanced-toggle">
              <input
                type="checkbox"
                checked={advancedMode}
                onChange={(e) => {
                  dispatch(updateUserSettings({ advancedMode: e.target.checked }));
                  markSaved('advancedMode');
                }}
              />
              <span>{t('Mostrar diagnóstico de agentes en el Omnibar')}</span>
            </label>
            {advancedMode && (
              <p className="settings-advanced-hint">
                Activa el panel "Thought Stream" (WarRoomView) dentro del Omnibar.
                Útil para depurar el comportamiento de los agentes.
              </p>
            )}
          </div>

          <div className="settings-section">
            <h3>{t("Tenant Roster")}</h3>
            <div className="settings-list">
              {orgMembers.map((entry) => {
                const isCreator = entry.userId === CREATOR_USER_ID;
                return (
                  <div key={entry.id} className="settings-row settings-row-compact">
                    <span>{entry.user?.name || entry.userId}</span>
                    <button
                      type="button"
                      className={`settings-action${isCreator ? "" : " is-danger"}`}
                      onClick={() => handleExpel(entry.userId)}
                      disabled={isCreator}
                    >
                      {isCreator ? t("Protected") : t("Expel")}
                    </button>
                  </div>
                );
              })}
              {orgMembers.length === 0 && (
                <div className="settings-empty">{t("No members in this tenant.")}</div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* ── Identity ─────────────────────────────────────────────────────── */}
      <section className="settings-card">
        <IdentityPanel />
      </section>

      {/* ── AI / Neural ──────────────────────────────────────────────────── */}
      <section className="settings-card">
        <h2>🤖 {t("Artificial Intelligence")}</h2>
        <p className="settings-card-subtitle">
          {t("Configure local Ollama to activate Cortana, Jarvis and SHODAN with real AI.")}
        </p>
        {aiMessage && (
          <div className={`settings-message ${aiMessage.type}`}>
            {aiMessage.text}
          </div>
        )}
        <div className="settings-form-grid">
          <label className="settings-field">
            <span>{t("Provider")}</span>
            <input
              type="text"
              className="settings-input settings-input-readonly"
              value="Ollama (local)"
              readOnly
            />
          </label>
          <label className="settings-field">
            <span>{t("Base URL")}</span>
            <input
              type="text"
              className="settings-input"
              value={aiBaseUrl}
              onChange={(e) => setAiBaseUrl(e.target.value)}
              placeholder={defaultBaseUrlByProvider[aiProvider]}
            />
          </label>
          <label className="settings-field">
            <span>{t("Model")}</span>
            <input
              type="text"
              className="settings-input"
              value={aiModel}
              onChange={(e) => setAiModel(e.target.value)}
              placeholder={defaultModelByProvider[aiProvider]}
            />
          </label>
          <div className="settings-actions-inline">
            <button type="button" className="settings-action" onClick={handleSaveAI}>{t("Save")}</button>
            <button type="button" className="settings-action" onClick={handleTestAI} disabled={aiTestStatus === 'testing'}>
              {aiTestStatus === 'testing' ? `⏳ ${t("Testing…")}` :
               aiTestStatus === 'ok'      ? `✓ ${t("Connected")}` :
               aiTestStatus === 'error'   ? `✗ ${t("Retry")}` :
               t("Test connection")}
            </button>
          </div>
        </div>
      </section>

      {/* ── Data Backup & Restore ─────────────────────────────────────────── */}
      <section className="settings-card">
        <h2>
          <button
            type="button"
            className="settings-toggle-button"
            onClick={() => setAdvancedOpen((v) => !v)}
          >
            💾 {t("Backup & Restore")} {advancedOpen ? '−' : '+'}
          </button>
        </h2>
        {advancedOpen && (
          <div className="settings-advanced-body">
            <div className="settings-export-actions">
              <button type="button" className="settings-action" onClick={handleExportPDF}>📄 {t("Export PDF")}</button>
              <button type="button" className="settings-action" onClick={handleExportJSON}>💾 {t("Export JSON")}</button>
            </div>
            <textarea
              className="settings-import-textarea"
              value={importText}
              onChange={(e) => setImportText(e.target.value)}
              placeholder={t("Paste your backup JSON here…")}
            />
            <button type="button" className="settings-action" onClick={handleImport} disabled={!importText.trim()}>
              {t("Import & Restore")}
            </button>
            <div className="settings-danger-divider">
              <button type="button" className="settings-action is-danger-solid" onClick={handleClearAll}>
                🔥 {t("Clear All Data")}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default Settings;
