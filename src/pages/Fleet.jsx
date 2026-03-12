import { useMemo, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useLanguage } from '../context/LanguageContext';
import { useTasks } from '../context/TasksContext';
import CollaboratorCard from '../components/CollaboratorCard';
import {
  addCollaborator,
  updateCollaborator,
  deleteCollaborator,
} from '../../store/slices/collaboratorsSlice';
import {
  addWorkOrder,
  updateWorkOrder,
  deleteWorkOrdersByCollaborator,
  setWorkOrderStatus,
  setWorkOrderProgress,
} from '../../store/slices/workOrdersSlice';
import './Fleet.css';

export const Fleet = () => {
  const dispatch = useDispatch();
  const { t } = useLanguage();
  const { tasks, updateTaskAssignment, updateTaskStatus } = useTasks();
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

  const closedProjects = useMemo(() => {
    return (projects || []).filter((p) => p.status === 'cancelled' || p.status === 'completed');
  }, [projects]);

  const activeCollaborators = useMemo(() => {
    return (collaborators || []).filter((c) => c.status === 'active');
  }, [collaborators]);

  const completedWorkOrdersCount = useMemo(() => {
    return (workOrders || []).filter((wo) => wo.status === 'completed').length;
  }, [workOrders]);

  const activeWorkOrdersCount = useMemo(() => {
    return (workOrders || []).filter((wo) => wo.status !== 'completed').length;
  }, [workOrders]);

  const collaboratorTasks = useMemo(() => {
    const activeCollaboratorIds = new Set((activeCollaborators || []).map((collab) => collab.id));
    return (tasks || []).filter((task) => task.assigneeId && activeCollaboratorIds.has(task.assigneeId));
  }, [activeCollaborators, tasks]);

  const unassignedTasks = useMemo(() => {
    return (tasks || []).filter((task) => !task.assigneeId && String(task.status || '').toLowerCase() !== 'completed');
  }, [tasks]);

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

  const handleAssignTaskToCollaborator = (taskId, collaboratorId) => {
    if (!taskId || !collaboratorId) return;
    updateTaskAssignment(taskId, collaboratorId);
  };

  const handleCompleteCollaboratorTask = (taskId) => {
    if (!taskId) return;
    updateTaskStatus(taskId, 'Completed');
  };

  const handleProjectsSelectionChange = (event) => {
    const selectedIds = Array.from(event.target.selectedOptions).map((option) => option.value);
    setCollaboratorForm({ ...collaboratorForm, projectIds: selectedIds });
  };

  return (
    <div className="fleet-container">
      <header className="fleet-header">
        <h1>{t('Collaborators')}</h1>
        <p>{t('Track external collaborators and their assigned work orders.')}</p>
      </header>

      <section className="fleet-kpi-strip">
        <article className="fleet-kpi-card">
          <span className="fleet-kpi-label">{t('Collaborators')}</span>
          <strong className="fleet-kpi-value">{activeCollaborators.length}</strong>
        </article>
        <article className="fleet-kpi-card">
          <span className="fleet-kpi-label">{t('Active Orders')}</span>
          <strong className="fleet-kpi-value">{activeWorkOrdersCount}</strong>
        </article>
        <article className="fleet-kpi-card">
          <span className="fleet-kpi-label">{t('Completed')}</span>
          <strong className="fleet-kpi-value">{completedWorkOrdersCount}</strong>
        </article>
        <article className="fleet-kpi-card">
          <span className="fleet-kpi-label">{t('Active Projects')}</span>
          <strong className="fleet-kpi-value">{activeProjects.length}</strong>
        </article>
      </section>

      <section className="fleet-full-width fleet-tasks-panel">
        <div className="fleet-section-header">
          <h2>{t('Collaborator Tasks')}</h2>
          <span>{collaboratorTasks.length} {t('Assigned')}</span>
        </div>

        {unassignedTasks.length > 0 && activeCollaborators.length > 0 && (
          <div className="fleet-task-assigner">
            <h3>{t('Assign pending tasks')}</h3>
            <div className="fleet-task-assigner-grid">
              {unassignedTasks.slice(0, 8).map((task) => (
                <div key={task.id} className="fleet-task-row">
                  <div className="fleet-task-row-main">
                    <strong>{task.title}</strong>
                    <span>{task.projectName || t('No project')}</span>
                  </div>
                  <select
                    defaultValue=""
                    onChange={(event) => handleAssignTaskToCollaborator(task.id, event.target.value)}
                  >
                    <option value="">{t('Assign to')}</option>
                    {activeCollaborators.map((collab) => (
                      <option key={collab.id} value={collab.id}>
                        {collab.name}
                      </option>
                    ))}
                  </select>
                </div>
              ))}
            </div>
          </div>
        )}

        {collaboratorTasks.length === 0 ? (
          <div className="fleet-empty-state compact">
            <h3>{t('No collaborator tasks assigned yet.')}</h3>
          </div>
        ) : (
          <div className="fleet-task-assigner-grid">
            {collaboratorTasks.map((task) => {
              const assignee = activeCollaborators.find((collab) => collab.id === task.assigneeId);
              const isCompleted = String(task.status || '').toLowerCase() === 'completed';
              return (
                <div key={task.id} className="fleet-task-row">
                  <div className="fleet-task-row-main">
                    <strong>{task.title}</strong>
                    <span>
                      {(assignee?.name || t('Unassigned'))} · {task.projectName || t('No project')} · {task.status || 'Active'}
                    </span>
                  </div>
                  <button
                    type="button"
                    className="fleet-task-complete"
                    disabled={isCompleted}
                    onClick={() => handleCompleteCollaboratorTask(task.id)}
                  >
                    {isCompleted ? t('Completed') : t('Mark Completed')}
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </section>

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
          <div className="fleet-collaborators-grid">
            {activeCollaborators.map((collab) => {
              const collabOrders = getCollaboratorWorkOrders(collab.id);
              const collabProjects = getCollaboratorProjects(collab.id);
              const activeOrders = collabOrders.filter((wo) => wo.status !== 'completed');
              const completedOrders = collabOrders.filter((wo) => wo.status === 'completed');

              return (
                <CollaboratorCard
                  key={collab.id}
                  collaborator={collab}
                  onEdit={handleOpenCollaboratorModal}
                  onDelete={handleDeleteCollaborator}
                  projectCount={collabProjects.length}
                  orderCount={activeOrders.length}
                  completedCount={completedOrders.length}
                />
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
                  {(projects || []).length === 0 ? (
                    <p className="modal-empty-message">{t('No projects available. Create a project first.')}</p>
                  ) : (
                    <label>
                      <span className="modal-label">{t('Projects (multi-select)')}</span>
                      <select
                        multiple
                        className="modal-projects-select"
                        value={collaboratorForm.projectIds || []}
                        onChange={handleProjectsSelectionChange}
                        size={Math.min(Math.max((projects || []).length, 4), 10)}
                      >
                        {activeProjects.length > 0 && (
                          <optgroup label={t('Active Projects')}>
                            {activeProjects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                        {closedProjects.length > 0 && (
                          <optgroup label={t('Closed / Cancelled Projects')}>
                            {closedProjects.map((project) => (
                              <option key={project.id} value={project.id}>
                                {project.name}
                              </option>
                            ))}
                          </optgroup>
                        )}
                      </select>
                    </label>
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
