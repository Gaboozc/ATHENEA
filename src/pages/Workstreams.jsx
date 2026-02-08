import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import {
  addTeamMember,
  removeTeamMember,
  setWorkstreamEnabled,
  setWorkstreamPermissions
} from '../store/slices/organizationsSlice';
import { useLanguage } from '../context/LanguageContext';
import './Workstreams.css';

const ROLE_OPTIONS = ['Engineer', 'Sales', 'Manager'];

export const Workstreams = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const { workstreams, currentOrgId, teamMemberships } = useSelector(
    (state) => state.organizations
  );
  const { users } = useSelector((state) => state.users);
  const [searchByTeam, setSearchByTeam] = useState({});
  const [selectedByTeam, setSelectedByTeam] = useState({});
  const scopedWorkstreams = useMemo(() => {
    if (!currentOrgId) return [];
    return workstreams.filter((stream) => stream.orgId === currentOrgId);
  }, [currentOrgId, workstreams]);
  const activeUsers = useMemo(() => users.filter((user) => user.active), [users]);

  const handleToggle = (stream) => {
    if (!currentOrgId) return;
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

  const handleAddMember = (teamId) => {
    if (!currentOrgId) return;
    const userId = selectedByTeam[teamId];
    if (!userId) return;
    dispatch(addTeamMember({ orgId: currentOrgId, teamId, userId }));
    setSelectedByTeam((prev) => ({ ...prev, [teamId]: '' }));
  };

  const handleRemoveMember = (teamId, userId) => {
    if (!currentOrgId) return;
    dispatch(removeTeamMember({ orgId: currentOrgId, teamId, userId }));
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
          {scopedWorkstreams.map((stream) => (
            <div key={stream.id} className="workstream-card">
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
                  />
                </label>
              </div>
              <p className="workstream-meta">{t('Category ID:')} {stream.id}</p>
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
                      />
                      <input
                        type="checkbox"
                        checked={stream.permissions?.action?.includes(role)}
                        onChange={() => handlePermissionToggle(stream, role, 'action')}
                      />
                    </div>
                  ))}
                </div>
                {stream.id === 'management' && (
                  <p className="workstream-note">
                    {t('Management team has full read/write access across teams.')}
                  </p>
                )}
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
                  />
                  <select
                    value={selectedByTeam[stream.id] || ''}
                    onChange={(event) =>
                      setSelectedByTeam((prev) => ({
                        ...prev,
                        [stream.id]: event.target.value
                      }))
                    }
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
