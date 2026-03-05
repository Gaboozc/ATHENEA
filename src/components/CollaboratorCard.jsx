import React from 'react';
import { useLanguage } from '../context/LanguageContext';
import './CollaboratorCard.css';

const CollaboratorCard = ({ 
  collaborator, 
  onEdit, 
  projectCount, 
  orderCount,
  completedCount 
}) => {
  const { t } = useLanguage();

  const getInitials = (name) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const getAvatarColor = (name) => {
    const colors = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#FFA07A', '#98D8C8', '#F7DC6F', '#BB8FCE', '#85C1E2'];
    const charCode = name.charCodeAt(0);
    return colors[charCode % colors.length];
  };

  return (
    <div className="collaborator-card-wrapper">
      <div className="collaborator-card">
        <div className="card-header">
          <div
            className="card-avatar"
            style={{ backgroundColor: getAvatarColor(collaborator.name) }}
          >
            <span className="card-avatar-text">{getInitials(collaborator.name)}</span>
          </div>
          <div className="card-header-info">
            <div className="card-title">{collaborator.name}</div>
            <div className="card-subtitle">{collaborator.role || collaborator.area || t('Collaborators')}</div>
          </div>
        </div>

        <div className="card-chip-row">
          {collaborator.area && <span className="card-chip">{collaborator.area}</span>}
          {collaborator.role && <span className="card-chip">{collaborator.role}</span>}
        </div>

        <div className="card-back-content">
          <div className="back-line">
            <span className="back-label">{t('Email')}:</span>
            <span className="back-value">{collaborator.email}</span>
          </div>
          {collaborator.phone && (
            <div className="back-line">
              <span className="back-label">{t('Phone')}:</span>
              <span className="back-value">{collaborator.phone}</span>
            </div>
          )}
          {collaborator.area && (
            <div className="back-line">
              <span className="back-label">{t('Area')}:</span>
              <span className="back-value">{collaborator.area}</span>
            </div>
          )}
        </div>

        <div className="card-stats-row">
          <div className="stat">
            <span className="stat-num">{projectCount}</span>
            <span className="stat-label">{t('Projects')}</span>
          </div>
          <div className="stat">
            <span className="stat-num">{orderCount}</span>
            <span className="stat-label">{t('Active Orders')}</span>
          </div>
          <div className="stat">
            <span className="stat-num">{completedCount}</span>
            <span className="stat-label">{t('Completed')}</span>
          </div>
        </div>

        <div className="back-buttons">
          <button
            className="back-button back-button-edit"
            onClick={(e) => {
              e.stopPropagation();
              onEdit(collaborator);
            }}
          >
            {t('Edit')}
          </button>
        </div>

      </div>
    </div>
  );
};

export default CollaboratorCard;
