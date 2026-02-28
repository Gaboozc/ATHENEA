import React, { useState } from 'react';
import './CollaboratorCard.css';

const CollaboratorCard = ({ 
  collaborator, 
  onEdit, 
  onDelete, 
  projectCount, 
  orderCount,
  completedCount 
}) => {
  const [isFlipped, setIsFlipped] = useState(false);

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
      <div className={`collaborator-card ${isFlipped ? 'is-flipped' : ''}`}>
        {/* ===== FRONT SIDE ===== */}
        <div className="card-inner card-front">
          {/* Background Image */}
          <div className="card-img">
            <svg xmlns="http://www.w3.org/2000/svg" width="100%" viewBox="0 0 540 450">
              <defs>
                <linearGradient id={`grad-${collaborator.id}`} gradientUnits="userSpaceOnUse" x1="0" x2="0" y1="0" y2="100%">
                  <stop offset="0" stopColor="#ffffff" />
                  <stop offset="1" stopColor="#1ec9ff" stopOpacity="0.3" />
                </linearGradient>
                <pattern patternUnits="userSpaceOnUse" id={`pattern-${collaborator.id}`} width="300" height="250" x="0" y="0" viewBox="0 0 1080 900">
                  <g fillOpacity="0.1">
                    <polygon fill="#1ec9ff" points="90 150 0 300 180 300" />
                    <polygon fill="#1ec9ff" points="90 150 180 0 0 0" />
                    <polygon fill="#d4af37" points="270 150 360 0 180 0" />
                    <polygon fill="#c9cdd2" points="450 150 360 300 540 300" />
                  </g>
                </pattern>
              </defs>
              <rect fill="#0f2235" width="540" height="450" />
              <rect x="0" y="0" fill={`url(#grad-${collaborator.id})`} width="100%" height="100%" />
              <rect x="0" y="0" fill={`url(#pattern-${collaborator.id})`} width="100%" height="100%" />
            </svg>
          </div>

          {/* Avatar Circle */}
          <div 
            className="card-avatar" 
            style={{ backgroundColor: getAvatarColor(collaborator.name) }}
          >
            <span className="card-avatar-text">{getInitials(collaborator.name)}</span>
          </div>

          {/* Content */}
          <div className="card-content">
            <div className="card-title">{collaborator.name}</div>
            <div className="card-subtitle">{collaborator.role || collaborator.area || 'Collaborator'}</div>

            {/* Stats Row */}
            <div className="card-stats-row">
              <div className="stat">
                <span className="stat-num">{projectCount}</span>
                <span className="stat-label">Projects</span>
              </div>
              <div className="stat">
                <span className="stat-num">{orderCount}</span>
                <span className="stat-label">Orders</span>
              </div>
              <div className="stat">
                <span className="stat-num">{completedCount}</span>
                <span className="stat-label">Completed</span>
              </div>
            </div>

            {/* Buttons */}
            <div className="card-buttons">
              <button 
                className="card-button card-button-outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(true);
                }}
              >
                Details
              </button>
              <button 
                className="card-button card-button-solid"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsFlipped(true);
                }}
              >
                More
              </button>
            </div>
          </div>
        </div>

        {/* ===== BACK SIDE ===== */}
        <div className="card-inner card-back">
          {/* Terminal-style Tools */}
          <div className="card-tools">
            <div className="tool-circle tool-red"></div>
            <div className="tool-circle tool-yellow"></div>
            <div className="tool-circle tool-green"></div>
          </div>

          {/* Back Content */}
          <div className="card-back-content">
            <div className="back-section">
              <h4 className="back-title">Contact</h4>
              <div className="back-line">
                <span className="back-label">Email:</span>
                <span className="back-value">{collaborator.email}</span>
              </div>
              {collaborator.phone && (
                <div className="back-line">
                  <span className="back-label">Phone:</span>
                  <span className="back-value">{collaborator.phone}</span>
                </div>
              )}
              {collaborator.area && (
                <div className="back-line">
                  <span className="back-label">Area:</span>
                  <span className="back-value">{collaborator.area}</span>
                </div>
              )}
            </div>

            <div className="back-section">
              <h4 className="back-title">Summary</h4>
              <div className="back-line">
                <span className="back-label">Projects:</span>
                <span className="back-value">{projectCount}</span>
              </div>
              <div className="back-line">
                <span className="back-label">Active Orders:</span>
                <span className="back-value">{orderCount}</span>
              </div>
              <div className="back-line">
                <span className="back-label">Completed:</span>
                <span className="back-value">{completedCount}</span>
              </div>
            </div>
          </div>

          {/* Back Buttons */}
          <div className="back-buttons">
            <button 
              className="back-button back-button-edit"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(collaborator);
              }}
            >
              Edit
            </button>
            <button 
              className="back-button back-button-delete"
              onClick={(e) => {
                e.stopPropagation();
                if (confirm('Delete this collaborator?')) {
                  onDelete(collaborator.id);
                }
              }}
            >
              Delete
            </button>
          </div>

          {/* Close Button */}
          <button 
            className="back-close"
            onClick={(e) => {
              e.stopPropagation();
              setIsFlipped(false);
            }}
          >
            ←
          </button>
        </div>
      </div>
    </div>
  );
};

export default CollaboratorCard;
