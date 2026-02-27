import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useDispatch, useSelector } from 'react-redux';
import {
  addWorkstream,
  removeWorkstream,
  setWorkstreamEnabled,
  updateWorkstreamLabel
} from '../store/slices/organizationsSlice';
import { useLanguage } from '../context/LanguageContext';
import './Workstreams.css';

export const Workstreams = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { workstreams } = useSelector((state) => state.organizations);
  const [draftNameByTeam, setDraftNameByTeam] = useState({});
  const [newAreaName, setNewAreaName] = useState('');

  const handleToggle = (stream) => {
    dispatch(
      setWorkstreamEnabled({
        id: stream.id,
        enabled: !stream.enabled
      })
    );
  };

  const handleCreateArea = () => {
    const name = newAreaName.trim();
    if (!name) return;
    const baseId = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/(^-|-$)/g, '');
    const candidate = baseId || `area-${Date.now()}`;
    const exists = workstreams.some((stream) => stream.id === candidate);
    const id = exists ? `${candidate}-${Date.now()}` : candidate;
    dispatch(addWorkstream({ id, label: name }));
    setNewAreaName('');
  };

  const handleSaveLabel = (stream) => {
    const nextLabel = (draftNameByTeam[stream.id] || '').trim();
    if (!nextLabel || nextLabel === stream.label) return;
    dispatch(updateWorkstreamLabel({ id: stream.id, label: nextLabel }));
  };

  const handleRemoveArea = (stream) => {
    if (!confirm(`${t('Delete')} "${stream.label}"?`)) return;
    dispatch(removeWorkstream({ id: stream.id }));
  };

  return (
    <div className="workstreams-container">
      <header className="workstreams-header">
        <h1>{t('Work Areas')}</h1>
        <p>{t('Organize your projects by area or category.')}</p>
      </header>

      <section className="workstreams-grid">
        <div className="workstream-card workstream-create">
          <div className="workstream-title">
            <span>{t('Create Work Area')}</span>
          </div>
          <label className="workstream-meta workstream-label">
            {t('Area name')}
            <input
              type="text"
              value={newAreaName}
              onChange={(event) => setNewAreaName(event.target.value)}
              placeholder={t('Enter area name')}
            />
          </label>
          <button
            type="button"
            className="workstream-add"
            onClick={handleCreateArea}
            disabled={!newAreaName.trim()}
          >
            {t('Create')}
          </button>
        </div>

        {workstreams.length === 0 && (
          <div className="workstreams-empty">{t('No work areas configured yet.')}</div>
        )}

        {workstreams.map((stream) => (
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
                />
              </label>
            </div>
            <p className="workstream-meta">{t('Area ID:')} {stream.id}</p>
            <button
              type="button"
              className="workstream-projects"
              onClick={(event) => {
                event.stopPropagation();
                navigate(`/workstreams/${stream.id}`);
              }}
            >
              {t('View Projects')}
            </button>
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
                  handleRemoveArea(stream);
                }}
              >
                {t('Remove')}
              </button>
            </div>
          </div>
        ))}
      </section>
    </div>
  );
};
