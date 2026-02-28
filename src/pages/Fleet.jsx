import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import {
  addCollaborator,
  updateCollaborator,
  deleteCollaborator,
  setCollaboratorStatus,
} from '../store/slices/collaboratorsSlice';
import {
  addWorkOrder,
  updateWorkOrder,
  deleteWorkOrder,
  setWorkOrderStatus,
  setWorkOrderProgress,
} from '../store/slices/workOrdersSlice';
import './Fleet.css';

export const Fleet = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const { collaborators } = useSelector((state) => state.collaborators);
  const { workOrders } = useSelector((state) => state.workOrders);
  
  const [showCollaboratorModal, setShowCollaboratorModal] = useState(false);
  const [showWorkOrderModal, setShowWorkOrderModal] = useState(false);
  const [editingCollaborator, setEditingCollaborator] = useState(null);
  const [editingWorkOrder, setEditingWorkOrder] = useState(null);
  
  const [collaboratorForm, setCollaboratorForm] = useState({
    name: '',
    email: '',
    area: '',
    role: '',
    phone: '',
  });
  
  const [workOrderForm, setWorkOrderForm] = useState({
    title: '',
    description: '',
    collaboratorId: '',
    area: '',
    dueDate: '',
    priority: 'medium',
  });

  const activeCollaborators = useMemo(() => {
    return (collaborators || []).filter((c) => c.status === 'active');
  }, [collaborators]);

  const activeWorkOrders = useMemo(() => {
    return (workOrders || []).filter((wo) => wo.status !== 'completed');
  }, [workOrders]);

  const handleOpenCollaboratorModal = (collab = null) => {
    if (collab) {
      setEditingCollaborator(collab);
      setCollaboratorForm({
        name: collab.name,
        email: collab.email,
        area: collab.area || '',
        role: collab.role || '',
        phone: collab.phone || '',
      });
    } else {
      setEditingCollaborator(null);
      setCollaboratorForm({
        name: '',
        email: '',
        area: '',
        role: '',
        phone: '',
      });
    }
    setShowCollaboratorModal(true);
  };

  const handleSaveCollaborator = () => {
    if (!collaboratorForm.name.trim() || !collaboratorForm.email.trim()) return;
    
    if (editingCollaborator) {
      dispatch(updateCollaborator({
        id: editingCollaborator.id,
        updates: collaboratorForm,
      }));
    } else {
      dispatch(addCollaborator(collaboratorForm));
    }
    setShowCollaboratorModal(false);
  };

  const handleDeleteCollaborator = (id) => {
    if (!confirm(t('Delete this collaborator?'))) return;
    dispatch(deleteCollaborator({ id }));
  };

  const handleOpenWorkOrderModal = (order = null) => {
    if (order) {
      setEditingWorkOrder(order);
      setWorkOrderForm({
        title: order.title,
        description: order.description || '',
        collaboratorId: order.collaboratorId,
        area: order.area || '',
        dueDate: order.dueDate || '',
        priority: order.priority || 'medium',
      });
    } else {
      setEditingWorkOrder(null);
      setWorkOrderForm({
        title: '',
        description: '',
        collaboratorId: '',
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
        updates: workOrderForm,
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

  return (
    <div className="fleet-container">
      <header className="fleet-header">
        <h1>{t('Collaborators')}</h1>
        <p>{t('Track external collaborators and their assigned work orders.')}</p>
      </header>

      <section className="fleet-layout">
        {/* Panel de Colaboradores */}
        <div className="fleet-roster">
          <div className="fleet-section-header">
            <h2>{t('Collaborators')}</h2>
            <button
              className="fleet-add-btn"
              onClick={() => handleOpenCollaboratorModal()}
            >
              + {t('Add Collaborator')}
            </button>
          </div>

          {activeCollaborators.length === 0 ? (
            <div className="fleet-empty">{t('No collaborators yet.')}</div>
          ) : (
            <div className="fleet-grid">
              {activeCollaborators.map((collab) => (
                <div key={collab.id} className="fleet-card">
                  <div className="fleet-title">
                    <h3>{collab.name}</h3>
                    <span className="fleet-id">{collab.email}</span>
                  </div>
                  {collab.area && (
                    <div className="fleet-load">
                      <span className="fleet-load-label">{t('Area')}</span>
                      <span className="fleet-load-value">{collab.area}</span>
                    </div>
                  )}
                  {collab.role && (
                    <div className="fleet-load">
                      <span className="fleet-load-label">{t('Role')}</span>
                      <span className="fleet-load-value">{collab.role}</span>
                    </div>
                  )}
                  <div className="fleet-card-actions">
                    <button onClick={() => handleOpenCollaboratorModal(collab)}>
                      {t('Edit')}
                    </button>
                    <button onClick={() => handleDeleteCollaborator(collab.id)}>
                      {t('Delete')}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Panel de Órdenes de Trabajo */}
        <div className="fleet-backlog">
          <div className="fleet-section-header">
            <h2>{t('Work Orders')}</h2>
            <button
              className="fleet-add-btn"
              onClick={() => handleOpenWorkOrderModal()}
              disabled={activeCollaborators.length === 0}
            >
              + {t('New Order')}
            </button>
          </div>

          {activeWorkOrders.length === 0 ? (
            <div className="fleet-empty">{t('No active work orders.')}</div>
          ) : (
            <div className="fleet-backlog-list">
              {activeWorkOrders.map((order) => {
                const collab = collaborators.find((c) => c.id === order.collaboratorId);
                return (
                  <div key={order.id} className="fleet-task-card">
                    <div className="fleet-task-header">
                      <h3>{order.title}</h3>
                      <span className={`fleet-priority fleet-priority-${order.priority}`}>
                        {t(order.priority)}
                      </span>
                    </div>
                    {order.description && (
                      <p className="fleet-task-meta">{order.description}</p>
                    )}
                    <div className="fleet-task-info">
                      <span><strong>{t('Assigned to')}:</strong> {collab?.name || t('Unknown')}</span>
                      {order.area && <span><strong>{t('Area')}:</strong> {order.area}</span>}
                      {order.dueDate && (
                        <span>
                          <strong>{t('Due')}:</strong>{' '}
                          {new Date(order.dueDate).toLocaleDateString()}
                        </span>
                      )}
                    </div>
                    <div className="fleet-progress">
                      <label>
                        {t('Progress')}: {order.progress || 0}%
                        <input
                          type="range"
                          min="0"
                          max="100"
                          value={order.progress || 0}
                          onChange={(e) => handleUpdateProgress(order.id, e.target.value)}
                        />
                      </label>
                    </div>
                    <div className="fleet-card-actions">
                      <button onClick={() => handleOpenWorkOrderModal(order)}>
                        {t('Edit')}
                      </button>
                      <button onClick={() => handleCompleteWorkOrder(order.id)}>
                        {t('Complete')}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </section>

      {/* Modal Colaborador */}
      {showCollaboratorModal && (
        <div className="modal-overlay" onClick={() => setShowCollaboratorModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingCollaborator ? t('Edit Collaborator') : t('Add Collaborator')}</h2>
            <div className="modal-form">
              <label>
                {t('Name')}*
                <input
                  type="text"
                  value={collaboratorForm.name}
                  onChange={(e) =>
                    setCollaboratorForm({ ...collaboratorForm, name: e.target.value })
                  }
                />
              </label>
              <label>
                {t('Email')}*
                <input
                  type="email"
                  value={collaboratorForm.email}
                  onChange={(e) =>
                    setCollaboratorForm({ ...collaboratorForm, email: e.target.value })
                  }
                />
              </label>
              <label>
                {t('Area')}
                <input
                  type="text"
                  value={collaboratorForm.area}
                  onChange={(e) =>
                    setCollaboratorForm({ ...collaboratorForm, area: e.target.value })
                  }
                />
              </label>
              <label>
                {t('Role')}
                <input
                  type="text"
                  value={collaboratorForm.role}
                  onChange={(e) =>
                    setCollaboratorForm({ ...collaboratorForm, role: e.target.value })
                  }
                />
              </label>
              <label>
                {t('Phone')}
                <input
                  type="tel"
                  value={collaboratorForm.phone}
                  onChange={(e) =>
                    setCollaboratorForm({ ...collaboratorForm, phone: e.target.value })
                  }
                />
              </label>
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowCollaboratorModal(false)}>{t('Cancel')}</button>
              <button onClick={handleSaveCollaborator}>{t('Save')}</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Orden de Trabajo */}
      {showWorkOrderModal && (
        <div className="modal-overlay" onClick={() => setShowWorkOrderModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>{editingWorkOrder ? t('Edit Work Order') : t('New Work Order')}</h2>
            <div className="modal-form">
              <label>
                {t('Title')}*
                <input
                  type="text"
                  value={workOrderForm.title}
                  onChange={(e) =>
                    setWorkOrderForm({ ...workOrderForm, title: e.target.value })
                  }
                />
              </label>
              <label>
                {t('Description')}
                <textarea
                  value={workOrderForm.description}
                  onChange={(e) =>
                    setWorkOrderForm({ ...workOrderForm, description: e.target.value })
                  }
                />
              </label>
              <label>
                {t('Assign to')}*
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
                {t('Area')}
                <input
                  type="text"
                  value={workOrderForm.area}
                  onChange={(e) =>
                    setWorkOrderForm({ ...workOrderForm, area: e.target.value })
                  }
                />
              </label>
              <label>
                {t('Due Date')}
                <input
                  type="date"
                  value={workOrderForm.dueDate}
                  onChange={(e) =>
                    setWorkOrderForm({ ...workOrderForm, dueDate: e.target.value })
                  }
                />
              </label>
              <label>
                {t('Priority')}
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
            </div>
            <div className="modal-actions">
              <button onClick={() => setShowWorkOrderModal(false)}>{t('Cancel')}</button>
              <button onClick={handleSaveWorkOrder}>{t('Save')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
