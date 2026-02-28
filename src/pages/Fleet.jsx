import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import {
  addCollaborator,
  updateCollaborator,
  deleteCollaborator,
} from '../store/slices/collaboratorsSlice';
import {
  addWorkOrder,
  updateWorkOrder,
  deleteWorkOrdersByCollaborator,
  setWorkOrderStatus,
  setWorkOrderProgress,
} from '../store/slices/workOrdersSlice';
import './Fleet.css';

export const Fleet = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const { collaborators } = useSelector((state) => state.collaborators);
  const { workOrders } = useSelector((state) => state.workOrders);
  const { projects } = useSelector((state) => state.projects);
  
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState(null);
  const [expandedCollabId, setExpandedCollabId] = useState(null);
  
  const [collaboratorForm, setCollaboratorForm] = useState({
    name: '',
    email: '',
    area: '',
    role: '',
    phone: '',
    projectIds: [],
  });
  
  const [workOrderForm, setWorkOrderForm] = useState({
    title: '',
    description: '',
    collaboratorId: '',
    projectId: '',
    area: '',
    dueDate: '',
    priority: 'medium',
  });

  const activeProjects = useMemo(() => {
    return (projects || []).filter((p) => p.status !== 'cancelled');
  }, [projects]);

  const activeCollaborators = useMemo(() => {
    return (collaborators || []).filter((c) => c.status === 'active');
  }, [collaborators]);

  const getCollaboratorWorkOrders = (collabId) => {
    return (workOrders || []).filter((wo) => wo.collaboratorId === collabId);
  };

  const getCollaboratorProjects = (collabId) => {
    const collab = collaborators?.find((c) => c.id === collabId);
    if (!collab || !collab.projectIds || collab.projectIds.length === 0) return [];
    return (projects || []).filter((p) => (collab.projectIds || []).includes(p.id));
  };

  const toggleCollaboratorExpand = (collabId) => {
    setExpandedCollabId(expandedCollabId === collabId ? null : collabId);
  };

  const handleOpenCollaboratorModal = (collab = null) => {
    if (collab) {
      setEditingCollaborator(collab);
      setCollaboratorForm({
        name: collab.name,
        email: collab.email,
        area: collab.area || '',
        role: collab.role || '',
        phone: collab.phone || '',
        projectIds: collab.projectIds || [],
      });
    } else {
      setEditingCollaborator(null);
      setCollaboratorForm({
        name: '',
        email: '',
        area: '',
        role: '',
        phone: '',
        projectIds: [],
      });
    }
    setShowCollaboratorModal(true);
  };

  const handleSaveCollaborator = () => {
    if (!collaboratorForm.name.trim() || !collaboratorForm.email.trim()) return;
    
    if (editingCollaborator) {
      dispatch(updateCollaborator({
        id: editingCollaborator.id,
        ...collaboratorForm,
      }));
    } else {
      dispatch(addCollaborator(collaboratorForm));
    }
    setShowCollaboratorModal(false);
  };

  const handleDeleteCollaborator = (id) => {
    if (!confirm(t('Delete this collaborator?'))) return;
    dispatch(deleteWorkOrdersByCollaborator(id));
    dispatch(deleteCollaborator(id));
  };

  const handleOpenWorkOrderModal = (order = null, preselectedCollabId = null) => {
    if (order) {
      setEditingWorkOrder(order);
      setWorkOrderForm({
        title: order.title,
        description: order.description || '',
        collaboratorId: order.collaboratorId,
        projectId: order.projectId || '',
        area: order.area || '',
        dueDate: order.dueDate || '',
        priority: order.priority || 'medium',
      });
    } else {
      setEditingWorkOrder(null);
      setWorkOrderForm({
        title: '',
        description: '',
        collaboratorId: preselectedCollabId || '',
        projectId: '',
        area: '',
        dueDate: '',
        priority: 'medium',
      });
    }
    setShowWorkOrderModal(true);
  };

  const handleSaveWorkOrder = () => {
    if (!workOrderForm.title.trim() || !workOrderForm.collaboratorId) return;
    
    if (editingWorkOrder) {
      dispatch(updateWorkOrder({
        id: editingWorkOrder.id,
        ...workOrderForm,
      }));
    } else {
      dispatch(addWorkOrder(workOrderForm));
    }
    setShowWorkOrderModal(false);
  };

  const handleUpdateProgress = (id, progress) => {
    dispatch(setWorkOrderProgress({ id, progress: parseInt(progress) }));
  };

  const handleCompleteWorkOrder = (id) => {
    dispatch(setWorkOrderStatus({ id, status: 'completed' }));
  };

  const handleToggleProjectInCollaborator = (projectId) => {
    const currentIds = collaboratorForm.projectIds || [];
    const newIds = currentIds.includes(projectId)
      ? currentIds.filter((id) => id !== projectId)
      : [...currentIds, projectId];
    setCollaboratorForm({ ...collaboratorForm, projectIds: newIds });
  };

  return (
    <div className="fleet-container">
      <header className="fleet-header">
        <h1>{t('Collaborators')}</h1>
        <p>{t('Track external collaborators and their assigned work orders.')}</p>
      </header>

      <section className="fleet-full-width">
        <div className="fleet-section-header">
          <h2>{t('Collaborators')}</h2>
          <button
            className="fleet-add-btn"
            onClick={() => handleOpenCollaboratorModal()}
          >
            + {t('New Collaborator')}
          </button>
        </div>

        {activeCollaborators.length === 0 ? (
          <div className="fleet-empty-state">
            <div className="empty-icon">👥</div>
            <h3>{t('No collaborators yet.')}</h3>
            <p>{t('Add external collaborators to track their work and projects.')}</p>
            <button
              className="fleet-add-btn-primary"
              onClick={() => handleOpenCollaboratorModal()}
            >
              + {t('New Collaborator')}
            </button>
          </div>
        ) : (
          <div className="fleet-collaborators-list">
            {activeCollaborators.map((collab) => {
              const isExpanded = expandedCollabId === collab.id;
              const collabOrders = getCollaboratorWorkOrders(collab.id);
              const collabProjects = getCollaboratorProjects(collab.id);
              const activeOrders = collabOrders.filter((wo) => wo.status !== 'completed');
              const completedOrders = collabOrders.filter((wo) => wo.status === 'completed');

              return (
                <div key={collab.id} className={`fleet-collab-item${isExpanded ? ' is-expanded' : ''}`}>
                  <div 
                    className="fleet-collab-header"
                    onClick={() => toggleCollaboratorExpand(collab.id)}
                  >
                    <div className="fleet-collab-main">
                      <div className="fleet-collab-avatar">
                        {collab.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="fleet-collab-info">
                        <h3>{collab.name}</h3>
                        <span className="fleet-collab-email">{collab.email}</span>
                        {collab.role && (
                          <span className="fleet-collab-role">{collab.role}</span>
                        )}
                      </div>
                    </div>
                    <div className="fleet-collab-stats">
                      <div className="fleet-stat">
                        <span className="fleet-stat-value">{collabProjects.length}</span>
                        <span className="fleet-stat-label">{t('Projects')}</span>
                      </div>
                      <div className="fleet-stat">
                        <span className="fleet-stat-value">{activeOrders.length}</span>
                        <span className="fleet-stat-label">{t('Active Orders')}</span>
                      </div>
                      <div className="fleet-stat">
                        <span className="fleet-stat-value">{completedOrders.length}</span>
                        <span className="fleet-stat-label">{t('Completed')}</span>
                      </div>
                    </div>
                    <button className="fleet-expand-btn">
                      <svg 
                        viewBox="0 0 24 24" 
                        fill="none" 
                        stroke="currentColor" 
                        strokeWidth={2}
                        style={{ 
                          transform: isExpanded ? 'rotate(180deg)' : 'rotate(0deg)',
                          transition: 'transform 0.2s ease'
                        }}
                      >
                        <polyline points="6 9 12 15 18 9" />
                      </svg>
                    </button>
                  </div>

                  {isExpanded && (
                    <div className="fleet-collab-details">
                      <div className="fleet-details-grid">
                        {/* Contact Information */}
                        <div className="fleet-detail-section">
                          <h4>{t('Contact Information')}</h4>
                          <div className="fleet-detail-items">
                            <div className="fleet-detail-item">
                              <span className="fleet-detail-label">{t('Email')}:</span>
                              <span>{collab.email}</span>
                            </div>
                            {collab.phone && (
                              <div className="fleet-detail-item">
                                <span className="fleet-detail-label">{t('Phone')}:</span>
                                <span>{collab.phone}</span>
                              </div>
                            )}
                            {collab.area && (
                              <div className="fleet-detail-item">
                                <span className="fleet-detail-label">{t('Area')}:</span>
                                <span>{collab.area}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Associated Projects */}
                        <div className="fleet-detail-section">
                          <h4>{t('Associated Projects')}</h4>
                          {collabProjects.length === 0 ? (
                            <p className="fleet-detail-empty">{t('No projects associated')}</p>
                          ) : (
                            <div className="fleet-projects-list">
                              {collabProjects.map((project) => (
                                <div key={project.id} className="fleet-project-chip">
                                  <span>{project.name}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>

                        {/* Work Orders */}
                        <div className="fleet-detail-section fleet-detail-full">
                          <div className="fleet-detail-header">
                            <h4>{t('Work Orders')}</h4>
                            <button
                              className="fleet-add-btn-small"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenWorkOrderModal(null, collab.id);
                              }}
                            >
                              + {t('New Order')}
                            </button>
                          </div>
                          {collabOrders.length === 0 ? (
                            <p className="fleet-detail-empty">{t('No work orders yet')}</p>
                          ) : (
                            <div className="fleet-orders-grid">
                              {collabOrders.map((order) => {
                                const project = (projects || []).find((p) => p.id === order.projectId);
                                return (
                                  <div key={order.id} className="fleet-order-card">
                                    <div className="fleet-order-header">
                                      <h5>{order.title}</h5>
                                      <span className={`fleet-priority fleet-priority-${order.priority}`}>
                                        {t(order.priority)}
                                      </span>
                                    </div>
                                    {order.description && (
                                      <p className="fleet-order-desc">{order.description}</p>
                                    )}
                                    <div className="fleet-order-meta">
                                      {project && (
                                        <span className="fleet-order-project">
                                          📁 {project.name}
                                        </span>
                                      )}
                                      {order.dueDate && (
                                        <span className="fleet-order-due">
                                          📅 {new Date(order.dueDate).toLocaleDateString()}
                                        </span>
                                      )}
                                    </div>
                                    {order.status !== 'completed' && (
                                      <div className="fleet-order-progress">
                                        <div className="fleet-progress-header">
                                          <span>{t('Progress')}</span>
                                          <span>{order.progress || 0}%</span>
                                        </div>
                                        <input
                                          type="range"
                                          min="0"
                                          max="100"
                                          value={order.progress || 0}
                                          onChange={(e) => handleUpdateProgress(order.id, e.target.value)}
                                          onClick={(e) => e.stopPropagation()}
                                        />
                                      </div>
                                    )}
                                    <div className="fleet-order-actions">
                                      <button 
                                        onClick={(e) => {
                                          e.stopPropagation();
                                          handleOpenWorkOrderModal(order);
                                        }}
                                      >
                                        {t('Edit')}
                                      </button>
                                      {order.status !== 'completed' && (
                                        <button 
                                          onClick={(e) => {
                                            e.stopPropagation();
                                            handleCompleteWorkOrder(order.id);
                                          }}
                                          className="fleet-btn-complete"
                                        >
                                          {t('Complete')}
                                        </button>
                                      )}
                                      {order.status === 'completed' && (
                                        <span className="fleet-status-completed">✓ {t('Completed')}</span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="fleet-collab-actions">
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleOpenCollaboratorModal(collab);
                          }}
                          className="fleet-btn-edit"
                        >
                          {t('Edit')} {collab.name}
                        </button>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDeleteCollaborator(collab.id);
                          }}
                          className="fleet-btn-delete"
                        >
                          {t('Delete')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Colaborador */}
      {showCollaboratorModal && (
        <div className="modal-overlay" onClick={() => setShowCollaboratorModal(false)}>
          <div className="modal-content modal-large" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingCollaborator ? t('Edit Collaborator') : t('New Collaborator')}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowCollaboratorModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-form">
                <div className="modal-section">
                  <h3>{t('Basic Information')}</h3>
                  <div className="modal-form-grid">
                    <label className="modal-field-full">
                      <span className="modal-label">{t('Name')}*</span>
                      <input
                        type="text"
                        value={collaboratorForm.name}
                        onChange={(e) =>
                          setCollaboratorForm({ ...collaboratorForm, name: e.target.value })
                        }
                        placeholder={t('Enter full name')}
                      />
                    </label>
                    <label>
                      <span className="modal-label">{t('Email')}*</span>
                      <input
                        type="email"
                        value={collaboratorForm.email}
                        onChange={(e) =>
                          setCollaboratorForm({ ...collaboratorForm, email: e.target.value })
                        }
                        placeholder={t('email@example.com')}
                      />
                    </label>
                    <label>
                      <span className="modal-label">{t('Phone')}</span>
                      <input
                        type="tel"
                        value={collaboratorForm.phone}
                        onChange={(e) =>
                          setCollaboratorForm({ ...collaboratorForm, phone: e.target.value })
                        }
                        placeholder="+1 (555) 000-0000"
                      />
                    </label>
                    <label>
                      <span className="modal-label">{t('Role')}</span>
                      <input
                        type="text"
                        value={collaboratorForm.role}
                        onChange={(e) =>
                          setCollaboratorForm({ ...collaboratorForm, role: e.target.value })
                        }
                        placeholder={t('e.g., Developer, Designer')}
                      />
                    </label>
                    <label>
                      <span className="modal-label">{t('Area')}</span>
                      <input
                        type="text"
                        value={collaboratorForm.area}
                        onChange={(e) =>
                          setCollaboratorForm({ ...collaboratorForm, area: e.target.value })
                        }
                        placeholder={t('e.g., Frontend, Backend')}
                      />
                    </label>
                  </div>
                </div>

                <div className="modal-section">
                  <h3>{t('Associated Projects')}</h3>
                  {activeProjects.length === 0 ? (
                    <p className="modal-empty-message">{t('No projects available. Create a project first.')}</p>
                  ) : (
                    <div className="modal-projects-checkboxes">
                      {activeProjects.map((project) => (
                        <label key={project.id} className="modal-checkbox-item">
                          <input
                            type="checkbox"
                            checked={(collaboratorForm.projectIds || []).includes(project.id)}
                            onChange={() => handleToggleProjectInCollaborator(project.id)}
                          />
                          <span>{project.name}</span>
                        </label>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCollaboratorModal(false)} className="modal-btn-cancel">
                {t('Cancel')}
              </button>
              <button 
                onClick={handleSaveCollaborator}
                className="modal-btn-save"
                disabled={!collaboratorForm.name.trim() || !collaboratorForm.email.trim()}
              >
                {t('Save')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Orden de Trabajo */}
      {showWorkOrderModal && (
        <div className="modal-overlay" onClick={() => setShowWorkOrderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editingWorkOrder ? t('Edit Work Order') : t('New Work Order')}</h2>
              <button 
                className="modal-close"
                onClick={() => setShowWorkOrderModal(false)}
              >
                ×
              </button>
            </div>
            <div className="modal-body">
              <div className="modal-form">
                <label>
                  <span className="modal-label">{t('Title')}*</span>
                  <input
                    type="text"
                    value={workOrderForm.title}
                    onChange={(e) =>
                      setWorkOrderForm({ ...workOrderForm, title: e.target.value })
                    }
                    placeholder={t('Enter work order title')}
                  />
                </label>
                <label>
                  <span className="modal-label">{t('Description')}</span>
                  <textarea
                    value={workOrderForm.description}
                    onChange={(e) =>
                      setWorkOrderForm({ ...workOrderForm, description: e.target.value })
                    }
                    placeholder={t('Describe the work to be done')}
                    rows={3}
                  />
                </label>
                <div className="modal-form-grid">
                  <label>
                    <span className="modal-label">{t('Assign to')}*</span>
                    <select
                      value={workOrderForm.collaboratorId}
                      onChange={(e) =>
                        setWorkOrderForm({ ...workOrderForm, collaboratorId: e.target.value })
                      }
                    >
                      <option value="">{t('Select collaborator')}</option>
                      {activeCollaborators.map((collab) => (
                        <option key={collab.id} value={collab.id}>
                          {collab.name}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    <span className="modal-label">{t('Project')}</span>
                    <select
                      value={workOrderForm.projectId}
                      onChange={(e) =>
                        setWorkOrderForm({ ...workOrderForm, projectId: e.target.value })
                      }
                    >
                      <option value="">{t('Select project (optional)')}</option>
                      {activeProjects.map((project) => (
                        <option key={project.id} value={project.id}>
                          {project.name}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <div className="modal-form-grid">
                  <label>
                    <span className="modal-label">{t('Priority')}</span>
                    <select
                      value={workOrderForm.priority}
                      onChange={(e) =>
                        setWorkOrderForm({ ...workOrderForm, priority: e.target.value })
                      }
                    >
                      <option value="low">{t('low')}</option>
                      <option value="medium">{t('medium')}</option>
                      <option value="high">{t('high')}</option>
                    </select>
                  </label>
                  <label>
                    <span className="modal-label">{t('Due Date')}</span>
                    <input
                      type="date"
                      value={workOrderForm.dueDate}
                      onChange={(e) =>
                        setWorkOrderForm({ ...workOrderForm, dueDate: e.target.value })
                      }
                    />
                  </label>
                </div>
                <label>
                  <span className="modal-label">{t('Area')}</span>
                  <input
                    type="text"
                    value={workOrderForm.area}
                    onChange={(e) =>
                      setWorkOrderForm({ ...workOrderForm, area: e.target.value })
                    }
                    placeholder={t('e.g., Frontend, Backend')}
                  />
                </label>
              </div>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowWorkOrderModal(false)} className="modal-btn-cancel">
                {t('Cancel')}
              </button>
              <button 
                onClick={handleSaveWorkOrder}
                className="modal-btn-save"
                disabled={!workOrderForm.title.trim() || !workOrderForm.collaboratorId}
              >
                {t('Save')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
