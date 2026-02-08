import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { updatePoint, deletePoint } from '../store/slices/pointsSlice';
import { useLanguage } from '../context/LanguageContext';
import './PointDetails.css';

export const PointDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { t } = useLanguage();
  
  const point = useSelector((state) => 
    state.points.points.find((p) => p.id === id)
  );

  if (!point) {
    return (
      <div className="not-found">
        <h2>{t('Point not found')}</h2>
        <button onClick={() => navigate(-1)}>{t('Go Back')}</button>
      </div>
    );
  }

  const getTypeColor = (type) => {
    switch (type) {
      case 'data': return '#4299e1';
      case 'power': return '#48bb78';
      case 'fiber': return '#ed8936';
      default: return '#a0aec0';
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed': return '#48bb78';
      case 'in-progress': return '#4299e1';
      case 'pending': return '#ed8936';
      default: return '#a0aec0';
    }
  };

  const handleStatusChange = (newStatus) => {
    dispatch(updatePoint({ id: point.id, status: newStatus }));
  };

  const handleDelete = () => {
    if (confirm(t('Are you sure you want to delete this point?'))) {
      dispatch(deletePoint(id));
      navigate(-1);
    }
  };

  return (
    <div className="point-details-container">
      <div className="point-header">
        <button className="back-btn" onClick={() => navigate(-1)}>
          ← {t('Back')}
        </button>
        <button className="btn-danger" onClick={handleDelete}>
          🗑️ {t('Delete Point')}
        </button>
      </div>

      <div className="point-card">
        <div className="point-title">
          <div 
            className="point-indicator"
            style={{ backgroundColor: getTypeColor(point.type) }}
          />
          <h1>{point.pointNumber}</h1>
          <span 
            className="status-badge"
            style={{ backgroundColor: getStatusColor(point.status) }}
          >
            {point.status.split('-').map(w => 
              w.charAt(0).toUpperCase() + w.slice(1)
            ).join(' ')}
          </span>
        </div>

        <div className="point-info-grid">
          <div className="info-section">
            <h3>📋 {t('General Information')}</h3>
            <div className="info-items">
              <div className="info-row">
                <span className="label">{t('Point Number:')}</span>
                <span className="value">{point.pointNumber}</span>
              </div>
              <div className="info-row">
                <span className="label">{t('Type:')}</span>
                <span className="value" style={{ color: getTypeColor(point.type) }}>
                  {point.type.charAt(0).toUpperCase() + point.type.slice(1)}
                </span>
              </div>
              <div className="info-row">
                <span className="label">{t('Category:')}</span>
                <span className="value">
                  {point.category.charAt(0).toUpperCase() + point.category.slice(1)}
                </span>
              </div>
              <div className="info-row">
                <span className="label">{t('Status:')}</span>
                <span className="value" style={{ color: getStatusColor(point.status) }}>
                  {point.status.split('-').map(w => 
                    w.charAt(0).toUpperCase() + w.slice(1)
                  ).join(' ')}
                </span>
              </div>
            </div>
          </div>

          <div className="info-section">
            <h3>📍 {t('Location')}</h3>
            <div className="info-items">
              <div className="info-row">
                <span className="label">{t('X Coordinate:')}</span>
                <span className="value">{Math.round(point.x)}</span>
              </div>
              <div className="info-row">
                <span className="label">{t('Y Coordinate:')}</span>
                <span className="value">{Math.round(point.y)}</span>
              </div>
            </div>
          </div>
        </div>

        {point.description && (
          <div className="description-section">
            <h3>📝 {t('Description')}</h3>
            <p>{point.description}</p>
          </div>
        )}

        <div className="status-actions">
          <h3>🔄 {t('Update Status')}</h3>
          <div className="status-buttons">
            <button
              className={`status-btn ${point.status === 'pending' ? 'active' : ''}`}
              style={{ borderColor: '#ed8936' }}
              onClick={() => handleStatusChange('pending')}
            >
              ⏳ {t('Pending')}
            </button>
            <button
              className={`status-btn ${point.status === 'in-progress' ? 'active' : ''}`}
              style={{ borderColor: '#4299e1' }}
              onClick={() => handleStatusChange('in-progress')}
            >
              🔨 {t('In Progress')}
            </button>
            <button
              className={`status-btn ${point.status === 'completed' ? 'active' : ''}`}
              style={{ borderColor: '#48bb78' }}
              onClick={() => handleStatusChange('completed')}
            >
              ✅ {t('Completed')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
