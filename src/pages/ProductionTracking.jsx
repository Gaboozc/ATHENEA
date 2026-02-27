import { useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import {
  addProductionEntry,
  updateProductionEntry,
  deleteProductionEntry,
  updateProgress,
  updateStatus,
  bulkAssignEntries,
  bulkUpdateStatus
} from '../store/slices/productionSlice';
import './ProductionTracking.css';
import { useCurrentUser } from '../hooks/useCurrentUser';

export const ProductionTracking = () => {
  const dispatch = useDispatch();
  const { entries } = useSelector((state) => state.production);
  const { projects } = useSelector((state) => state.projects);
  const { users } = useSelector((state) => state.users);
  const { user: currentUser } = useCurrentUser();

  // Single-user mode: todos los permisos habilitados
  const canCreate = true;
  const canAssign = true;
  const canEditAny = true;
  const canDeleteAny = true;
  const canEditOwn = true;
  const canViewAll = true;
  const canViewGroup = true;
  const canBulkStatus = true;

  const [showModal, setShowModal] = useState(false);
  const [showProgressModal, setShowProgressModal] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [selectedEntry, setSelectedEntry] = useState(null);
  
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterUser, setFilterUser] = useState('all');
  const [sortBy, setSortBy] = useState('dueDate');
  const [todayOnly, setTodayOnly] = useState(false);
  const [filterPM, setFilterPM] = useState('all'); // Super Admin: filter by PM

  // Assign modal state (for supervisor/lead-tech)
  const [showAssignModal, setShowAssignModal] = useState(false);
  const [entryToAssign, setEntryToAssign] = useState(null);
  const [assigneeId, setAssigneeId] = useState('');

  // Bulk selection state
  const [selectedIds, setSelectedIds] = useState([]);
  const [bulkStatus, setBulkStatus] = useState('in-progress');

  const [formData, setFormData] = useState({
    projectId: '',
    userId: '',
    taskName: '',
    description: '',
    status: 'pending',
    priority: 'medium',
    startDate: '',
    dueDate: '',
    hoursEstimated: 0,
    notes: ''
  });

  const [progressData, setProgressData] = useState({
    hoursWorked: 0,
    progress: 0,
    notes: ''
  });

  const STATUSES = [
    { value: 'pending', label: 'Pending', color: '#718096' },
    { value: 'in-progress', label: 'In Progress', color: '#4299e1' },
    { value: 'completed', label: 'Completed', color: '#48bb78' },
    { value: 'blocked', label: 'Blocked', color: '#f56565' }
  ];

  const PRIORITIES = [
    { value: 'low', label: 'Low', color: '#718096' },
    { value: 'medium', label: 'Medium', color: '#ed8936' },
    { value: 'high', label: 'High', color: '#f56565' }
  ];

  // Single-user mode: todas las entradas son visibles
  const scopedEntries = entries;

  // Filter and sort entries
  const filteredEntries = scopedEntries
    .filter(entry => {
      if (filterStatus !== 'all' && entry.status !== filterStatus) return false;
      if (filterProject !== 'all' && entry.projectId !== filterProject) return false;
      if (filterUser !== 'all' && entry.userId !== filterUser) return false;
      if (todayOnly) {
        const today = new Date().toISOString().split('T')[0];
        return entry.dueDate === today;
      }
      return true;
    })
    .sort((a, b) => {
      if (sortBy === 'dueDate') {
        return new Date(a.dueDate) - new Date(b.dueDate);
      }
      if (sortBy === 'priority') {
        const priorityOrder = { high: 0, medium: 1, low: 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      }
      if (sortBy === 'progress') {
        return b.progress - a.progress;
      }
      if (sortBy === 'pm') {
        const getPMName = (projectId) => {
          const project = projects.find(p => p.id === projectId);
          const pm = project ? users.find(u => u.id === project.pmId) : null;
          return pm?.name || '';
        };
        return getPMName(a.projectId).localeCompare(getPMName(b.projectId));
      }
      return 0;
    });

  // Calculate statistics (scoped to what the user can see)
  const stats = {
    total: scopedEntries.length,
    pending: scopedEntries.filter(e => e.status === 'pending').length,
    inProgress: scopedEntries.filter(e => e.status === 'in-progress').length,
    completed: scopedEntries.filter(e => e.status === 'completed').length,
    blocked: scopedEntries.filter(e => e.status === 'blocked').length,
    overdue: scopedEntries.filter(e => 
      e.status !== 'completed' && new Date(e.dueDate) < new Date()
    ).length,
    totalHoursEstimated: scopedEntries.reduce((sum, e) => sum + e.hoursEstimated, 0),
    totalHoursWorked: scopedEntries.reduce((sum, e) => sum + e.hoursWorked, 0)
  };

  const openAddModal = () => {
    if (!canCreate) return; // guard
    setEditMode(false);
    setFormData({
      projectId: '',
      userId: '',
      taskName: '',
      description: '',
      status: 'pending',
      priority: 'medium',
      startDate: '',
      dueDate: '',
      hoursEstimated: 0,
      notes: ''
    });
    setShowModal(true);
  };

  const openEditModal = (entry) => {
    const isOwn = entry.userId === currentUser?.id;
    if (!canEditAny && !(isOwn && canEditOwn)) return; // guard
    setEditMode(true);
    setFormData({
      id: entry.id,
      projectId: entry.projectId,
      userId: entry.userId,
      taskName: entry.taskName,
      description: entry.description,
      status: entry.status,
      priority: entry.priority,
      startDate: entry.startDate,
      dueDate: entry.dueDate,
      hoursEstimated: entry.hoursEstimated,
      notes: entry.notes
    });
    setShowModal(true);
  };

  const openProgressModal = (entry) => {
    const isOwn = entry.userId === currentUser?.id;
    if (!(isOwn && canEditOwn) && !canEditAny) return; // guard
    setSelectedEntry(entry);
    setProgressData({
      hoursWorked: entry.hoursWorked,
      progress: entry.progress,
      notes: entry.notes
    });
    setShowProgressModal(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (editMode) {
      dispatch(updateProductionEntry(formData));
    } else {
      if (!canCreate) return;
      dispatch(addProductionEntry(formData));
    }
    setShowModal(false);
  };

  const handleProgressUpdate = (e) => {
    e.preventDefault();
    dispatch(updateProgress({
      id: selectedEntry.id,
      ...progressData
    }));
    setShowProgressModal(false);
  };

  const handleStatusChange = (entry, newStatus) => {
    const isOwn = entry.userId === currentUser?.id;
    if (!canEditAny && !(isOwn && canEditOwn)) return;
    dispatch(updateStatus({ id: entry.id, status: newStatus }));
  };

  const handleDelete = (entryId) => {
    if (!canDeleteAny) return;
    if (window.confirm('Are you sure you want to delete this task?')) {
      dispatch(deleteProductionEntry(entryId));
    }
  };

  // Open assign modal
  const openAssignModal = (entry) => {
    if (!canAssign) return;
    setEntryToAssign(entry);
    setAssigneeId('');
    setShowAssignModal(true);
  };

  const handleAssign = (e) => {
    e.preventDefault();
    if (!entryToAssign || !assigneeId) return;
    dispatch(updateProductionEntry({ id: entryToAssign.id, userId: assigneeId }));
    setShowAssignModal(false);
    setEntryToAssign(null);
    setAssigneeId('');
  };

  // Bulk selection helpers
  const toggleSelect = (id) => {
    if (!canAssign) return;
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);
  };
  const toggleSelectAllVisible = () => {
    if (!canAssign) return;
    const visibleIds = filteredEntries.map(e => e.id);
    const allSelected = visibleIds.every(id => selectedIds.includes(id));
    setSelectedIds(allSelected ? selectedIds.filter(id => !visibleIds.includes(id)) : Array.from(new Set([...selectedIds, ...visibleIds])));
  };
  const clearSelection = () => setSelectedIds([]);

  // Bulk assign (require same project)
  const bulkAssign = () => {
    if (!canAssign || selectedIds.length === 0 || !assigneeId) return;
    const selectedEntries = filteredEntries.filter(e => selectedIds.includes(e.id));
    const projectIds = Array.from(new Set(selectedEntries.map(e => e.projectId)));
    if (projectIds.length !== 1) {
      alert('Please select tasks from a single project to bulk-assign.');
      return;
    }
    dispatch(bulkAssignEntries({ entryIds: selectedIds, userId: assigneeId }));
    clearSelection();
    setAssigneeId('');
  };

  const applyBulkStatus = () => {
    if (!canBulkStatus || selectedIds.length === 0 || !bulkStatus) return;
    dispatch(bulkUpdateStatus({ entryIds: selectedIds, status: bulkStatus }));
    clearSelection();
  };

  const getProjectName = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    return project ? project.name : 'Unknown Project';
  };

  const getPMNameByProject = (projectId) => {
    const project = projects.find(p => p.id === projectId);
    if (!project) return '—';
    const pm = users.find(u => u.id === project.pmId);
    return pm ? pm.name : '—';
  };

  const getUserName = (userId) => {
    const user = users.find(u => u.id === userId);
    return user ? user.name : 'Unknown User';
  };

  const isOverdue = (entry) => {
    return entry.status !== 'completed' && new Date(entry.dueDate) < new Date();
  };

  return (
    <div className="production-tracking-container">
      <div className="production-header">
        <h1>🔧 Production Tracking</h1>
        {canCreate && (
          <button className="btn-add" onClick={openAddModal}>
            + Add Task
          </button>
        )}
      </div>

      {/* Statistics Cards */}
      <div className="production-stats">
        <div className="stat-card">
          <div className="stat-icon">📋</div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">Total Tasks</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏳</div>
          <div className="stat-content">
            <div className="stat-value">{stats.pending}</div>
            <div className="stat-label">Pending</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🚀</div>
          <div className="stat-content">
            <div className="stat-value">{stats.inProgress}</div>
            <div className="stat-label">In Progress</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">✅</div>
          <div className="stat-content">
            <div className="stat-value">{stats.completed}</div>
            <div className="stat-label">Completed</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⚠️</div>
          <div className="stat-content">
            <div className="stat-value">{stats.overdue}</div>
            <div className="stat-label">Overdue</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">⏰</div>
          <div className="stat-content">
            <div className="stat-value">{stats.totalHoursWorked}h / {stats.totalHoursEstimated}h</div>
            <div className="stat-label">Hours Worked</div>
          </div>
        </div>
      </div>

      {/* Filters and Sort */}
      <div className="production-filters">
        <div className="filter-group">
          <label>Status:</label>
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            {STATUSES.map(status => (
              <option key={status.value} value={status.value}>{status.label}</option>
            ))}
          </select>
        </div>
        <div className="filter-group">
          <label>Scope:</label>
          <select value={todayOnly ? 'today' : 'all'} onChange={(e) => setTodayOnly(e.target.value === 'today')}>
            <option value="all">All Dates</option>
            <option value="today">Due Today</option>
          </select>
        </div>
        {(canViewAll || canViewGroup) && (
          <>
            {currentRole === 'super-admin' && (
              <div className="filter-group">
                <label>PM:</label>
                <select value={filterPM} onChange={(e) => setFilterPM(e.target.value)}>
                  <option value="all">All PMs</option>
                  {users.filter(u => u.role === 'pm').map(pm => (
                    <option key={pm.id} value={pm.id}>{pm.name}</option>
                  ))}
                </select>
              </div>
            )}
            <div className="filter-group">
              <label>Project:</label>
              <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)}>
                <option value="all">All Projects</option>
                {projects
                  .filter(p => filterPM === 'all' ? true : p.pmId === filterPM)
                  .map(project => (
                  <option key={project.id} value={project.id}>{project.name}</option>
                ))}
              </select>
            </div>
            <div className="filter-group">
              <label>User:</label>
              <select value={filterUser} onChange={(e) => setFilterUser(e.target.value)}>
                <option value="all">All Users</option>
                {users.map(user => (
                  <option key={user.id} value={user.id}>{user.name}</option>
                ))}
              </select>
            </div>
          </>
        )}
        <div className="filter-group">
          <label>Sort By:</label>
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="dueDate">Due Date</option>
            <option value="priority">Priority</option>
            <option value="progress">Progress</option>
            {currentRole === 'super-admin' && (<option value="pm">PM</option>)}
          </select>
        </div>
      </div>

      {/* Bulk toolbar */}
      {(canAssign || canBulkStatus) && selectedIds.length > 0 && (
        <div style={{
          background: '#fff', border: '2px solid #e2e8f0', borderRadius: 12, padding: 12,
          display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12
        }}>
          <strong>{selectedIds.length} selected</strong>
          {canAssign && (
            <>
              <select
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                style={{ padding: '8px 12px', border: '2px solid #e2e8f0', borderRadius: 8 }}
              >
                <option value="">Assign to…</option>
                {users
                  .filter(u => ['lead-technician','technician'].includes(u.role))
                  .map(u => (
                    <option key={u.id} value={u.id}>{u.name} ({u.role.replace('-', ' ')})</option>
                  ))}
              </select>
              <button className="btn-submit" type="button" onClick={bulkAssign}>Assign Selected</button>
            </>
          )}

          {canBulkStatus && (
            <>
              <select
                value={bulkStatus}
                onChange={(e) => setBulkStatus(e.target.value)}
                style={{ padding: '8px 12px', border: '2px solid #e2e8f0', borderRadius: 8 }}
              >
                {STATUSES.map(s => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              <button className="btn-submit" type="button" onClick={applyBulkStatus}>Set Status</button>
            </>
          )}
          <button className="btn-cancel" type="button" onClick={clearSelection}>Clear</button>
        </div>
      )}

      {/* Production Table */}
      <div className="production-table-wrapper">
        <table className="production-table">
          <thead>
            <tr>
              {canAssign && (
                <th>
                  <input type="checkbox" onChange={toggleSelectAllVisible} checked={filteredEntries.length > 0 && filteredEntries.every(e => selectedIds.includes(e.id))} />
                </th>
              )}
              <th>Task</th>
              <th>Project</th>
              {currentRole === 'super-admin' && <th>PM</th>}
              <th>Assigned To</th>
              <th>Status</th>
              <th>Priority</th>
              <th>Progress</th>
              <th>Hours</th>
              <th>Start Date</th>
              <th>Due Date</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <tr>
                <td colSpan={canAssign ? 11 : 10} style={{ textAlign: 'center', padding: '40px' }}>
                  No tasks found
                </td>
              </tr>
            ) : (
              filteredEntries.map(entry => (
                <tr key={entry.id} className={isOverdue(entry) ? 'overdue-row' : ''}>
                  {canAssign && (
                    <td>
                      <input type="checkbox" checked={selectedIds.includes(entry.id)} onChange={() => toggleSelect(entry.id)} />
                    </td>
                  )}
                  <td>
                    <div className="task-name">{entry.taskName}</div>
                    <div className="task-description">{entry.description}</div>
                  </td>
                  <td>{getProjectName(entry.projectId)}</td>
                  {currentRole === 'super-admin' && (
                    <td>{getPMNameByProject(entry.projectId)}</td>
                  )}
                  <td>{getUserName(entry.userId)}</td>
                  <td>
                    <select
                      className={`status-badge status-${entry.status}`}
                      value={entry.status}
                      onChange={(e) => handleStatusChange(entry, e.target.value)}
                      disabled={!canEditAny && !(entry.userId === currentUser?.id && canEditOwn)}
                    >
                      {STATUSES.map(status => (
                        <option key={status.value} value={status.value}>
                          {status.label}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span className={`priority-badge priority-${entry.priority}`}>
                      {entry.priority.charAt(0).toUpperCase() + entry.priority.slice(1)}
                    </span>
                  </td>
                  <td>
                    <div className="progress-container">
                      <div className="progress-bar">
                        <div
                          className="progress-fill"
                          style={{ width: `${entry.progress}%` }}
                        ></div>
                      </div>
                      <span className="progress-text">{entry.progress}%</span>
                    </div>
                  </td>
                  <td>
                    <div className="hours-info">
                      {entry.hoursWorked}h / {entry.hoursEstimated}h
                    </div>
                  </td>
                  <td>{entry.startDate}</td>
                  <td className={isOverdue(entry) ? 'overdue-date' : ''}>
                    {entry.dueDate}
                    {isOverdue(entry) && <span className="overdue-badge">⚠️ Overdue</span>}
                  </td>
                  <td>
                    <div className="action-buttons">
                      {(canEditAny || (entry.userId === currentUser?.id && canEditOwn)) && (
                        <button
                          className="btn-action btn-progress"
                          onClick={() => openProgressModal(entry)}
                          title="Update Progress"
                        >
                          📊
                        </button>
                      )}
                      {(canEditAny || (entry.userId === currentUser?.id && canEditOwn)) && (
                        <button
                          className="btn-action btn-edit"
                          onClick={() => openEditModal(entry)}
                          title="Edit"
                        >
                          ✏️
                        </button>
                      )}
                      {canAssign && (
                        <button
                          className="btn-action btn-edit"
                          onClick={() => openAssignModal(entry)}
                          title="Assign to team member"
                        >
                          👤
                        </button>
                      )}
                      {canDeleteAny && (
                        <button
                          className="btn-action btn-delete"
                          onClick={() => handleDelete(entry.id)}
                          title="Delete"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add/Edit Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>{editMode ? 'Edit Task' : 'Add New Task'}</h2>
              <button className="modal-close" onClick={() => setShowModal(false)}>×</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-grid">
                <div className="form-group">
                  <label>Task Name *</label>
                  <input
                    type="text"
                    value={formData.taskName}
                    onChange={(e) => setFormData({ ...formData, taskName: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group full-width">
                  <label>Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows="3"
                  ></textarea>
                </div>
                <div className="form-group">
                  <label>Project *</label>
                  <select
                    value={formData.projectId}
                    onChange={(e) => setFormData({ ...formData, projectId: e.target.value, userId: '' })}
                    required
                  >
                    <option value="">Select Project</option>
                    {projects
                      .filter(p => {
                        if (currentRole === 'super-admin') return filterPM === 'all' ? true : p.pmId === filterPM;
                        if (currentRole === 'pm') return p.pmId === currentUser?.id;
                        if (['supervisor','lead-technician'].includes(currentRole)) return p.id === currentUser?.projectId;
                        return false;
                      })
                      .map(project => (
                        <option key={project.id} value={project.id}>{project.name}</option>
                      ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Assign To *</label>
                  <select
                    value={formData.userId}
                    onChange={(e) => setFormData({ ...formData, userId: e.target.value })}
                    required
                  >
                    <option value="">Select User</option>
                    {(() => {
                      const eligibleRoles = (currentRole === 'super-admin' || currentRole === 'pm')
                        ? ['supervisor','lead-technician','technician']
                        : ['lead-technician','technician'];
                      const candidates = users
                        .filter(u => eligibleRoles.includes(u.role))
                        .filter(u => formData.projectId ? u.projectId === formData.projectId : true);
                      if (candidates.length === 0 && formData.projectId) {
                        return <option value="" disabled>No eligible users in this project</option>;
                      }
                      return candidates.map(user => (
                        <option key={user.id} value={user.id}>{user.name}</option>
                      ));
                    })()}
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value })}
                  >
                    {STATUSES.map(status => (
                      <option key={status.value} value={status.value}>{status.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Priority</label>
                  <select
                    value={formData.priority}
                    onChange={(e) => setFormData({ ...formData, priority: e.target.value })}
                  >
                    {PRIORITIES.map(priority => (
                      <option key={priority.value} value={priority.value}>{priority.label}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Start Date *</label>
                  <input
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Due Date *</label>
                  <input
                    type="date"
                    value={formData.dueDate}
                    onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label>Estimated Hours</label>
                  <input
                    type="number"
                    value={formData.hoursEstimated}
                    onChange={(e) => setFormData({ ...formData, hoursEstimated: parseInt(e.target.value) || 0 })}
                    min="0"
                  />
                </div>
                <div className="form-group full-width">
                  <label>Notes</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    rows="2"
                  ></textarea>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  {editMode ? 'Update Task' : 'Add Task'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Progress Update Modal */}
      {showProgressModal && selectedEntry && (
        <div className="modal-overlay" onClick={() => setShowProgressModal(false)}>
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>📊 Update Progress</h2>
              <button className="modal-close" onClick={() => setShowProgressModal(false)}>×</button>
            </div>
            <div className="modal-task-info">
              <h3>{selectedEntry.taskName}</h3>
              <p>{getProjectName(selectedEntry.projectId)} • {getUserName(selectedEntry.userId)}</p>
            </div>
            <form onSubmit={handleProgressUpdate}>
              <div className="form-group">
                <label>Hours Worked</label>
                <input
                  type="number"
                  value={progressData.hoursWorked}
                  onChange={(e) => setProgressData({ ...progressData, hoursWorked: parseInt(e.target.value) || 0 })}
                  min="0"
                  max={selectedEntry.hoursEstimated * 2}
                />
                <small>Estimated: {selectedEntry.hoursEstimated}h</small>
              </div>
              <div className="form-group">
                <label>Progress (%)</label>
                <input
                  type="range"
                  value={progressData.progress}
                  onChange={(e) => setProgressData({ ...progressData, progress: parseInt(e.target.value) })}
                  min="0"
                  max="100"
                  step="5"
                />
                <div className="progress-value">{progressData.progress}%</div>
              </div>
              <div className="form-group">
                <label>Progress Notes</label>
                <textarea
                  value={progressData.notes}
                  onChange={(e) => setProgressData({ ...progressData, notes: e.target.value })}
                  rows="3"
                  placeholder="Add notes about the progress..."
                ></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowProgressModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Update Progress
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Assign Modal */}
      {showAssignModal && entryToAssign && (
        <div className="modal-overlay" onClick={() => setShowAssignModal(false)}>
          <div className="modal modal-small" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>👤 Assign Task</h2>
              <button className="modal-close" onClick={() => setShowAssignModal(false)}>×</button>
            </div>
            <div className="modal-task-info">
              <h3>{entryToAssign.taskName}</h3>
              <p>Project: {getProjectName(entryToAssign.projectId)}</p>
            </div>
            <form onSubmit={handleAssign}>
              <div className="form-group">
                <label>Assign to</label>
                <select
                  value={assigneeId}
                  onChange={(e) => setAssigneeId(e.target.value)}
                  required
                >
                  <option value="">Select user</option>
                  {users
                    .filter(u => u.projectId === entryToAssign.projectId && ['lead-technician','technician'].includes(u.role))
                    .map(u => (
                      <option key={u.id} value={u.id}>{u.name} ({u.role.replace('-', ' ')})</option>
                    ))}
                </select>
                <small>Only team members in this project are listed.</small>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowAssignModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn-submit">
                  Assign
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
