import { useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { useTasks } from '../context/TasksContext';
import { useLanguage } from '../context/LanguageContext';
import './AuditDetail.css';

export const AuditDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { tasks } = useTasks();
  const { projects } = useSelector((state) => state.projects);
  const { organizations, workstreams, currentOrgId } = useSelector(
    (state) => state.organizations
  );
  const { users } = useSelector((state) => state.users);
  const [lightboxSrc, setLightboxSrc] = useState('');

  const task = tasks.find((entry) => entry.id === id);
  const project = projects.find((entry) => entry.id === task?.projectId);
  const workstream = workstreams.find(
    (stream) => stream.orgId === currentOrgId && stream.id === project?.workstreamId
  );
  const currentOrg = organizations.find((entry) => entry.id === currentOrgId);
  const worker = users.find((entry) => entry.id === task?.assigneeId);

  const failedQuestion = useMemo(() => {
    if (!task) return '';
    return (
      task.metadata?.failedQuestion ||
      task.metadata?.questions?.[0] ||
      t('No audit details')
    );
  }, [task, t]);

  const failedAnswer = useMemo(() => {
    if (!task) return '';
    return (
      task.metadata?.failedAnswer ||
      task.metadata?.answer ||
      t('No answer recorded')
    );
  }, [task, t]);

  if (!task) {
    return (
      <div className="audit-detail-container">
        <div className="audit-detail-card">
          <h2>{t('Audit not found')}</h2>
          <button type="button" className="tactical-button" onClick={() => navigate('/dashboard')}>
            {t('Back')}
          </button>
        </div>
      </div>
    );
  }

  const createdAt = task.createdAt ? new Date(task.createdAt).toLocaleString() : 'TBD';
  const resolvedAt = task.metadata?.resolvedAt
    ? new Date(task.metadata.resolvedAt).toLocaleString()
    : t('Unresolved');
  const photos = Array.isArray(task.metadata?.photos) ? task.metadata.photos : [];
  const workerNote = task.metadata?.workerNote || '';
  const resolutionNote = task.metadata?.resolutionNote || '';

  return (
    <div className="audit-detail-container">
      <div className="audit-detail-card">
        <header className="audit-detail-header">
          <div>
            <span className="audit-detail-kicker">{t('Incident Report')}</span>
            <h1>{t('Incident Report')} - #{task.id}</h1>
            <div className="audit-detail-report-id">{t('Report ID')}: REF-{task.id}</div>
          </div>
          <div className="audit-detail-actions">
            {currentOrg?.logoUrl ? (
              <img
                className="audit-detail-logo-image"
                src={currentOrg.logoUrl}
                alt={t('Organization Logo')}
              />
            ) : (
              <div className="audit-detail-logo" aria-hidden="true">
                ATHENEA
              </div>
            )}
            <button type="button" className="tactical-button" onClick={() => window.print()}>
              {t('Print Report')}
            </button>
            <button type="button" className="tactical-button" onClick={() => navigate(-1)}>
              {t('Back')}
            </button>
          </div>
        </header>

        <section className="audit-detail-grid">
          <div className="audit-detail-panel">
            <h2>{t('Context')}</h2>
            <div className="audit-detail-row">
              <span>{t('Workstream')}</span>
              <strong>{workstream?.label || t('Unknown')}</strong>
            </div>
            <div className="audit-detail-row">
              <span>{t('Project')}</span>
              <strong>{project?.name || t('Unknown')}</strong>
            </div>
            <div className="audit-detail-row">
              <span>{t('Worker')}</span>
              <strong>{worker?.name || t('Unassigned')}</strong>
            </div>
            <div className="audit-detail-row">
              <span>{t('Date/Time')}</span>
              <strong>{createdAt}</strong>
            </div>
          </div>

          <div className="audit-detail-panel">
            <h2>{t('Conflict')}</h2>
            <div className="audit-detail-block">
              <div className="audit-detail-label">{t('Failed Question')}</div>
              <div className="audit-detail-text">{failedQuestion}</div>
            </div>
            <div className="audit-detail-block">
              <div className="audit-detail-label">{t('Answer')}</div>
              <div className="audit-detail-text">{failedAnswer}</div>
            </div>
          </div>

          <div className="audit-detail-panel">
            <h2>{t('Resolution Log')}</h2>
            <div className="audit-detail-row">
              <span>{t('Resolved By')}</span>
              <strong>{task.metadata?.resolvedBy || t('Unresolved')}</strong>
            </div>
            <div className="audit-detail-row">
              <span>{t('Resolved At')}</span>
              <strong>{resolvedAt}</strong>
            </div>
            {resolutionNote && (
              <div className="audit-detail-block resolution-note">
                <div className="audit-detail-label">{t('Resolution Note')}</div>
                <div className="audit-detail-text">{resolutionNote}</div>
              </div>
            )}
            <div className="audit-detail-status">
              {t('Status')}: {task.status}
            </div>
          </div>
        </section>

        <section className="audit-detail-panel evidence-panel">
          <h2>{t('Media & Evidence')}</h2>
          {photos.length === 0 && !workerNote ? (
            <div className="audit-detail-empty">{t('No evidence attached.')}</div>
          ) : (
            <>
              {photos.length > 0 && (
                <div className="evidence-grid">
                  {photos.map((photo, index) => (
                    <button
                      type="button"
                      key={`${task.id}-photo-${index}`}
                      className="evidence-item"
                      onClick={() => setLightboxSrc(photo)}
                    >
                      <img src={photo} alt={`Evidence ${index + 1}`} />
                    </button>
                  ))}
                </div>
              )}
              {workerNote && (
                <div className="worker-note">
                  <div className="worker-note-title">{t('Worker Note')}</div>
                  <p>{workerNote}</p>
                </div>
              )}
            </>
          )}
        </section>
        <footer className="audit-detail-footer">
          {t('Generated automatically by ATHENEA - Operational Governance System')}
          <div className="audit-detail-page-numbers" aria-hidden="true" />
        </footer>
      </div>
      {lightboxSrc && (
        <div
          className="lightbox-overlay"
          role="dialog"
          aria-modal="true"
          onClick={() => setLightboxSrc('')}
        >
          <div className="lightbox-content" onClick={(event) => event.stopPropagation()}>
            <button
              type="button"
              className="lightbox-close"
              onClick={() => setLightboxSrc('')}
            >
              {t('Close')}
            </button>
            <img src={lightboxSrc} alt={t('Evidence')} />
          </div>
        </div>
      )}
    </div>
  );
};
