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
import { setVoiceLanguage } from "../store/slices/userSettingsSlice";
import type { VoiceLanguage } from "../store/slices/userSettingsSlice";
import { useCurrentUser } from "../hooks/useCurrentUser";
import { useTasks } from "../context/TasksContext";
import { getPlanLimits } from "../utils/planLimits";

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

export const Settings = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const voiceLanguage = useSelector((state: any) => state.userSettings?.voiceLanguage ?? 'auto') as VoiceLanguage;
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
    <div className="settings-page">
      <header className="settings-header">
        <h1>{t("Settings")}</h1>
        <p>{t("Identity & Governance")}</p>
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

          {/* FIX 6.7: Voice Language Selector */}
          <div className="settings-section">
            <h3>🎙 {t("Voice Language")}</h3>
            <div className="settings-row" style={{ flexWrap: 'wrap', gap: 8 }}>
              {(['auto', 'en-US', 'es-MX', 'es-ES'] as VoiceLanguage[]).map((lang) => (
                <button
                  key={lang}
                  type="button"
                  className={`settings-action${voiceLanguage === lang ? ' is-active' : ''}`}
                  onClick={() => dispatch(setVoiceLanguage(lang))}
                >
                  {lang === 'auto' ? t('Auto (system)') : lang}
                </button>
              ))}
            </div>
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
    </div>
  );
};
