import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  addTeamMember,
  addWorkstream,
  removeTeamMember,
  removeWorkstream,
  setWorkstreamEnabled,
  setWorkstreamLead,
  setWorkstreamPermissions,
  setWorkstreamRules,
  updateWorkstreamLabel
} from '../store/slices/organizationsSlice';
import { useLanguage } from '../context/LanguageContext';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { getPlanLimits } from '../utils/planLimits';
import './Workstreams.css';

const ROLE_OPTIONS = ['Worker', 'Manager', 'Admin'];

export const Workstreams = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { role } = useCurrentUser();
  const { organizations, workstreams, currentOrgId, teamMemberships, memberships } = useSelector(
    (state) => state.organizations
  );
  const { users } = useSelector((state) => state.users);
  const [searchByTeam, setSearchByTeam] = useState({});
  const [selectedByTeam, setSelectedByTeam] = useState({});
  const [draftNameByTeam, setDraftNameByTeam] = useState({});
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamLead, setNewTeamLead] = useState('');
  const roleKey = (role || '').toLowerCase();
  const isAdmin = roleKey === 'admin' || roleKey === 'super-admin';
  const scopedWorkstreams = useMemo(() => {
    if (!currentOrgId) return [];
    return workstreams.filter((stream) => stream.orgId === currentOrgId);
  }, [currentOrgId, workstreams]);
  const currentOrg = useMemo(
    () => organizations.find((org) => org.id === currentOrgId),
    [currentOrgId, organizations]
  );
  const planLimits = getPlanLimits(currentOrg?.planId || currentOrg?.plan);
  const workstreamLimitReached =
    planLimits.workstreams !== null && scopedWorkstreams.length >= planLimits.workstreams;
  const activeUsers = useMemo(() => users.filter((user) => user.active), [users]);
  const orgMemberIds = useMemo(() => {
    if (!currentOrgId || !Array.isArray(memberships)) return [];
    return memberships
      .filter((entry) => entry.orgId === currentOrgId)
      .map((entry) => entry.userId);
  }, [currentOrgId, memberships]);
  const orgUsers = useMemo(() => {
    if (orgMemberIds.length === 0) return activeUsers;
    return activeUsers.filter((user) => orgMemberIds.includes(user.id));
  }, [activeUsers, orgMemberIds]);
  const leadById = useMemo(() => {
    return orgUsers.reduce((acc, user) => {
      acc[user.id] = user;
      return acc;
    }, {});
  }, [orgUsers]);

  const handleToggle = (stream) => {
    if (!currentOrgId) return;
    if (!isAdmin) return;
    dispatch(
      setWorkstreamEnabled({
        orgId: currentOrgId,
        id: stream.id,
        enabled: !stream.enabled
      })
    );
  };

  const handlePermissionToggle = (stream, role, permission) => {
    if (!currentOrgId) return;
    if (!isAdmin) return;
    const current = stream.permissions?.[permission] || [];
    const next = current.includes(role)
      ? current.filter((entry) => entry !== role)
      : [...current, role];
    dispatch(
      setWorkstreamPermissions({
        orgId: currentOrgId,
        id: stream.id,
        permissions: {
          view: permission === 'view' ? next : stream.permissions?.view || [],
          action: permission === 'action' ? next : stream.permissions?.action || []
        }
      })
    );
  };

  const handleRuleToggle = (stream, ruleKey) => {
    if (!currentOrgId) return;
    if (!isAdmin) return;
    dispatch(
      setWorkstreamRules({
        orgId: currentOrgId,
        id: stream.id,
        rules: {
          [ruleKey]: !stream[ruleKey]
        }
      })
    );
  };

  const handleAddMember = (teamId) => {
    if (!currentOrgId) return;
    if (!isAdmin) return;
    const userId = selectedByTeam[teamId];
    if (!userId) return;
    dispatch(addTeamMember({ orgId: currentOrgId, teamId, userId }));
    setSelectedByTeam((prev) => ({ ...prev, [teamId]: '' }));
  };

  const handleRemoveMember = (teamId, userId) => {
    if (!currentOrgId) return;
    if (!isAdmin) return;
    dispatch(removeTeamMember({ orgId: currentOrgId, teamId, userId }));
  };

  const handleCreateTeam = () => {
    if (!currentOrgId || !isAdmin) return;
    const name = newTeamName.trim();
    if (!name) return;
    const baseId = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const candidate = baseId || `team-${Date.now()}`;
    const exists = scopedWorkstreams.some((stream) => stream.id === candidate);
    const id = exists ? `${candidate}-${Date.now()}` : candidate;
    dispatch(addWorkstream({ orgId: currentOrgId, id, label: name, leadId: newTeamLead || null }));
    setNewTeamName('');
    setNewTeamLead('');
  };

  const handleSaveLabel = (stream) => {
    if (!currentOrgId || !isAdmin) return;
    const nextLabel = (draftNameByTeam[stream.id] || '').trim();
    if (!nextLabel || nextLabel === stream.label) return;
    dispatch(updateWorkstreamLabel({ orgId: currentOrgId, id: stream.id, label: nextLabel }));
  };

  const handleRemoveTeam = (stream) => {
    if (!currentOrgId || !isAdmin) return;
    dispatch(removeWorkstream({ orgId: currentOrgId, id: stream.id }));
  };

  const handleLeadChange = (stream, leadId) => {
    if (!currentOrgId || !isAdmin) return;
    dispatch(setWorkstreamLead({ orgId: currentOrgId, id: stream.id, leadId }));
  };

  return (
    <div className="workstreams-container">
      <header className="workstreams-header">
        <h1>{t('Workstreams')}</h1>
        <p>{t('Global categories aligned to Gatekeeper intake.')}</p>
      </header>

      {!currentOrgId ? (
        <div className="workstreams-empty">{t('Select an organization to manage workstreams.')}</div>
      ) : (
        <section className="workstreams-grid">
          {isAdmin && (
            <div className="workstream-card workstream-create">
              <div className="workstream-title">
                <span>{t('Create Workstream')}</span>
              </div>
              <label className="workstream-meta workstream-label">
                {t('Workstream name')}
                <input
                  type="text"
                  value={newTeamName}
                  onChange={(event) => setNewTeamName(event.target.value)}
                  placeholder={t('Enter workstream name')}
                />
              </label>
              <label className="workstream-meta workstream-label">
                {t('Lead')}
                <select
                  value={newTeamLead}
                  onChange={(event) => setNewTeamLead(event.target.value)}
                >
                  <option value="">{t('No lead assigned')}</option>
                  {orgUsers.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
                    </option>
                  ))}
                </select>
              </label>
              <button
                type="button"
                className="workstream-add"
                onClick={handleCreateTeam}
                disabled={!newTeamName.trim() || workstreamLimitReached}
              >
                {t('Create')}
              </button>
              {workstreamLimitReached && (
                <div className="workstreams-upgrade">
                  {t('Upgrade to add more workstreams.')}
                </div>
              )}
            </div>
          )}
          {scopedWorkstreams.length === 0 && !isAdmin && (
            <div className="workstreams-empty">{t('No workstreams configured yet.')}</div>
          )}
          {scopedWorkstreams.map((stream) => (
            <div
              key={stream.id}
              className="workstream-card is-clickable"
              onClick={() => navigate(`/workstreams/${stream.id}`)}
            >
              <div className="workstream-title">
                <span>{stream.label}</span>
                <label className="workstream-toggle">
                  <span className={`workstream-status${stream.enabled ? ' is-active' : ''}`}>
                    {stream.enabled ? t('Active') : t('Inactive')}
                  </span>
                  <input
                    type="checkbox"
                    checked={stream.enabled}
                    onChange={() => handleToggle(stream)}
                    onClick={(event) => event.stopPropagation()}
                    disabled={!isAdmin}
                  />
                </label>
              </div>
              <p className="workstream-meta">{t('Category ID:')} {stream.id}</p>
              <div className="workstream-lead">
                <span>{t('Lead')}:</span>
                <span>
                  {stream.leadId && leadById[stream.leadId]
                    ? leadById[stream.leadId].name
                    : t('No lead assigned')}
                </span>
              </div>
              {isAdmin && (
                <label className="workstream-meta workstream-label">
                  {t('Assign Lead')}
                  <select
                    value={stream.leadId || ''}
                    onChange={(event) => handleLeadChange(stream, event.target.value)}
                    onClick={(event) => event.stopPropagation()}
                  >
                    <option value="">{t('No lead assigned')}</option>
                    {orgUsers.map((user) => (
                      <option key={user.id} value={user.id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </label>
              )}
              <button
                type="button"
                className="workstream-projects"
                onClick={(event) => {
                  event.stopPropagation();
                  navigate(`/workstreams/${stream.id}`);
                }}
              >
                {t('Command Center')}
              </button>
              {isAdmin && (
                <div className="workstream-edit">
                  <input
                    type="text"
                    value={draftNameByTeam[stream.id] ?? stream.label}
                    onChange={(event) =>
                      setDraftNameByTeam((prev) => ({
                        ...prev,
                        [stream.id]: event.target.value
                      }))
                    }
                    onClick={(event) => event.stopPropagation()}
                  />
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleSaveLabel(stream);
                    }}
                  >
                    {t('Save')}
                  </button>
                  <button
                    type="button"
                    onClick={(event) => {
                      event.stopPropagation();
                      handleRemoveTeam(stream);
                    }}
                  >
                    {t('Remove')}
                  </button>
                </div>
              )}
              <div className="workstream-roles">
                <span className="workstream-roles-label">{t('Role access')}</span>
                <div className="workstream-roles-grid">
                  <span className="workstream-roles-head" />
                  <span className="workstream-roles-head">{t('View')}</span>
                  <span className="workstream-roles-head">{t('Action')}</span>
                  {ROLE_OPTIONS.map((role) => (
                    <div key={role} className="workstream-roles-row">
                      <span>{t(role)}</span>
                      <input
                        type="checkbox"
                        checked={stream.permissions?.view?.includes(role)}
                        onChange={() => handlePermissionToggle(stream, role, 'view')}
                        disabled={!isAdmin}
                      />
                      <input
                        type="checkbox"
                        checked={stream.permissions?.action?.includes(role)}
                        onChange={() => handlePermissionToggle(stream, role, 'action')}
                        disabled={!isAdmin}
                      />
                    </div>
                  ))}
                </div>
              </div>
              <div className="workstream-rules">
                <span className="workstream-roles-label">{t('Rules')}</span>
                <div className="workstream-rules-list">
                  <label className="workstream-rule">
                    <span>{t('Require Manager Approval')}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(stream.require_manager_approval)}
                      onChange={() => handleRuleToggle(stream, 'require_manager_approval')}
                      disabled={!isAdmin}
                    />
                  </label>
                  <label className="workstream-rule">
                    <span>{t('Allow Worker Self-Assign')}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(stream.allow_worker_self_assign)}
                      onChange={() => handleRuleToggle(stream, 'allow_worker_self_assign')}
                      disabled={!isAdmin}
                    />
                  </label>
                  <label className="workstream-rule">
                    <span>{t('Strict Dispatch')}</span>
                    <input
                      type="checkbox"
                      checked={Boolean(stream.strict_dispatch)}
                      onChange={() => handleRuleToggle(stream, 'strict_dispatch')}
                      disabled={!isAdmin}
                    />
                  </label>
                </div>
                <p className="workstream-note">
                  {t('Rules update instantly for this workstream.')}
                </p>
              </div>
              <div className="workstream-roster">
                <span className="workstream-roles-label">{t('Team Roster')}</span>
                <div className="workstream-roster-controls">
                  <input
                    type="text"
                    placeholder={t('Search members')}
                    value={searchByTeam[stream.id] || ''}
                    onChange={(event) =>
                      setSearchByTeam((prev) => ({
                        ...prev,
                        [stream.id]: event.target.value
                      }))
                    }
                    disabled={!isAdmin}
                  />
                  <select
                    value={selectedByTeam[stream.id] || ''}
                    onChange={(event) =>
                      setSelectedByTeam((prev) => ({
                        ...prev,
                        [stream.id]: event.target.value
                      }))
                    }
                    disabled={!isAdmin}
                  >
                    <option value="">{t('Select member')}</option>
                    {activeUsers
                      .filter((user) => {
                        const query = (searchByTeam[stream.id] || '').toLowerCase();
                        return (
                          !query ||
                          user.name.toLowerCase().includes(query) ||
                          user.email.toLowerCase().includes(query)
                        );
                      })
                      .map((user) => (
                        <option key={user.id} value={user.id}>
                          {user.name}
                        </option>
                      ))}
                  </select>
                  <button
                    type="button"
                    className="workstream-add"
                    onClick={() => handleAddMember(stream.id)}
                    disabled={!selectedByTeam[stream.id]}
                  >
                    {t('Add to team')}
                  </button>
                </div>
                <div className="workstream-roster-list">
                  {teamMemberships
                    .filter(
                      (entry) => entry.orgId === currentOrgId && entry.teamId === stream.id
                    )
                    .map((entry) => {
                      const member = users.find((user) => user.id === entry.userId);
                      if (!member) return null;
                      return (
                        <div key={entry.id} className="workstream-roster-item">
                          <span>{member.name}</span>
                          <button
                            type="button"
                            onClick={() => handleRemoveMember(stream.id, member.id)}
                            disabled={!isAdmin}
                          >
                            {t('Remove')}
                          </button>
                        </div>
                      );
                    })}
                  {teamMemberships.filter(
                    (entry) => entry.orgId === currentOrgId && entry.teamId === stream.id
                  ).length === 0 && (
                    <div className="workstream-note">{t('No team members assigned.')}</div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </section>
      )}
    </div>
  );
};
