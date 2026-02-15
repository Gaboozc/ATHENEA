import { useSelector, useDispatch } from 'react-redux';
import { useState } from 'react';
import { addUser, updateUser, deleteUser, setSelectedUser } from '../store/slices/usersSlice';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { hasPermission } from '../utils/permissions';
import { useLanguage } from '../context/LanguageContext';
import './Users.css';

const ROLES = [
  { value: 'super-admin', label: 'Super Admin' },
  { value: 'pm', label: 'Project Manager' },
  { value: 'supervisor', label: 'Supervisor' },
  { value: 'lead-technician', label: 'Lead Technician' },
  { value: 'technician', label: 'Technician' },
];

export const Users = () => {
  const dispatch = useDispatch();
  const { users, selectedUser } = useSelector((state) => state.users);
  const { organizations, memberships, currentOrgId } = useSelector(
    (state) => state.organizations
  );
  const { user: currentUser, role: currentRole } = useCurrentUser();
  const { t } = useLanguage();
  const [showModal, setShowModal] = useState(false);
  const { projects } = useSelector((state) => state.projects);
  const [form, setForm] = useState({ name: '', email: '', role: 'technician', projectId: '', groupId: '' });
  const [editMode, setEditMode] = useState(false);
  const [viewMode, setViewMode] = useState('list'); // 'list', 'groups', 'cards'
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterProject, setFilterProject] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState([]);

  const currentOrg = organizations.find((org) => org.id === currentOrgId);
  const workerLimit = currentOrg?.workerLimit;
  const membershipCount = memberships.filter(
    (entry) => entry.orgId === currentOrgId
  ).length;
  const fallbackCount = users.filter((entry) => entry.orgId === currentOrgId).length;
  const memberCount = membershipCount || fallbackCount;
  const workerLimitReached =
    typeof workerLimit === 'number' && workerLimit > 0 && memberCount >= workerLimit;
  
  // Determinar vista según rol
  const isSuperAdmin = currentRole === 'super-admin';
  const isPM = currentRole === 'pm';
  const isSupervisor = currentRole === 'supervisor';

  // Limit visible projects by role: PM only sees own, Supervisor sees their current project
  const visibleProjects = projects.filter(p => {
    if (isSuperAdmin) return true;
    if (isPM) return p.pmId === currentUser.id;
    if (isSupervisor) return currentUser.projectId ? p.id === currentUser.projectId : false;
    return false;
  });

  // Filtrar usuarios según permisos y filtros
  const filteredUsers = users.filter(u => {
    // Filtro por permisos
    if (isSuperAdmin) {
      // Super Admin ve todos
    } else if (isPM) {
      // PM ve todos los usuarios para poder asignarlos a sus proyectos
      // Puede ver: Supervisors, Lead Techs, Technicians (no otros PMs ni Super Admins)
      if (['super-admin', 'pm'].includes(u.role)) {
        // No puede ver otros PMs ni Super Admins
        return false;
      }
    } else if (isSupervisor) {
      // Supervisor ve supervisor, lead tech y technician
      if (!['supervisor', 'lead-technician', 'technician'].includes(u.role)) return false;
    }
    
    // Filtro por búsqueda
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      const matchesSearch = 
        u.name.toLowerCase().includes(search) ||
        u.email.toLowerCase().includes(search) ||
        (u.groupId && u.groupId.toLowerCase().includes(search));
      if (!matchesSearch) return false;
    }
    
    // Filtro por rol
    if (filterRole !== 'all' && u.role !== filterRole) return false;
    
    // Filtro por proyecto
    if (filterProject !== 'all' && u.projectId !== filterProject) return false;
    
    // Filtro por estado
    if (filterStatus === 'active' && !u.active) return false;
    if (filterStatus === 'inactive' && u.active) return false;
    
    return true;
  });

  // Estadísticas
  const stats = {
    total: filteredUsers.length,
    active: filteredUsers.filter(u => u.active).length,
    inactive: filteredUsers.filter(u => !u.active).length,
    byRole: ROLES.reduce((acc, role) => {
      acc[role.value] = filteredUsers.filter(u => u.role === role.value).length;
      return acc;
    }, {}),
  };

  const openAddModal = () => {
    setForm({ name: '', email: '', role: 'technician', projectId: '', groupId: '' });
    setEditMode(false);
    setShowModal(true);
  };

  const openEditModal = (user) => {
    setForm({
      name: user.name,
      email: user.email,
      role: user.role,
      id: user.id,
      projectId: user.projectId || '',
      groupId: user.groupId || ''
    });
    setEditMode(true);
    setShowModal(true);
  };
  
  // Agrupar usuarios por proyecto y grupo
  const usersByProject = users.reduce((acc, user) => {
    const projectId = user.projectId || 'unassigned';
    if (!acc[projectId]) acc[projectId] = [];
    acc[projectId].push(user);
    return acc;
  }, {});
  
  // Obtener grupos únicos por proyecto
  const getGroupsByProject = (projectId) => {
    const projectUsers = users.filter(u => u.projectId === projectId);
    const groups = {};
    projectUsers.forEach(user => {
      const groupId = user.groupId || 'unassigned';
      if (!groups[groupId]) {
        groups[groupId] = {
          id: groupId,
          leadTech: projectUsers.find(u => u.role === 'lead-technician' && u.groupId === groupId),
          technicians: []
        };
      }
      if (user.role === 'technician') {
        groups[groupId].technicians.push(user);
      }
    });
    return groups;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim()) return;
    
    // Preparar datos del usuario
    let userData = { ...form };

    // Defense-in-depth: PM can only assign users to their own projects
    if (isPM && userData.projectId) {
      const proj = projects.find(p => p.id === userData.projectId);
      if (!proj || proj.pmId !== currentUser.id) {
        alert(t('You can only assign users to your own projects.'));
        return;
      }
    }
    
    // Si es Supervisor asignando Lead Tech, marca como pendiente de aprobación del PM
    if (isSupervisor && form.role === 'lead-technician') {
      userData.pendingApproval = true;
      userData.approved = false;
    }
    
    // Si es PM o Super Admin asignando Lead Tech, aprueba directamente
    if ((isPM || isSuperAdmin) && form.role === 'lead-technician') {
      userData.pendingApproval = false;
      userData.approved = true;
    }
    
    if (editMode) {
      dispatch(updateUser(userData));
    } else {
      dispatch(addUser(userData));
    }
    setShowModal(false);
  };

  const handleDelete = (id) => {
    const userToDelete = users.find(u => u.id === id);
    
    // Prevent deleting Super Admin
    if (userToDelete?.role === 'super-admin') {
      alert(t('Cannot delete Super Admin.'));
      return;
    }
    
    // Supervisors cannot delete PMs or other Super Admins
    if (isSupervisor && ['pm', 'super-admin'].includes(userToDelete?.role)) {
      alert(t('You do not have permission to delete this user.'));
      return;
    }
    
    if (window.confirm(t('Delete this user?'))) {
      dispatch(deleteUser(id));
    }
  };

  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const toggleSelectAll = () => {
    if (selectedUsers.length === filteredUsers.length) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(filteredUsers.map(u => u.id));
    }
  };

  const handleBulkActivate = () => {
    selectedUsers.forEach(id => {
      const user = users.find(u => u.id === id);
      if (user && !user.active) {
        dispatch(updateUser({ ...user, active: true }));
      }
    });
    setSelectedUsers([]);
  };

  const handleBulkDeactivate = () => {
    selectedUsers.forEach(id => {
      const user = users.find(u => u.id === id);
      if (user && user.active) {
        dispatch(updateUser({ ...user, active: false }));
      }
    });
    setSelectedUsers([]);
  };

  const exportToCSV = () => {
    const headers = ['Name', 'Email', 'Role', 'Project', 'Group', 'Status'];
    const rows = filteredUsers.map(u => [
      u.name,
      u.email,
      ROLES.find(r => r.value === u.role)?.label || u.role,
      projects.find(p => p.id === u.projectId)?.name || '-',
      u.groupId || '-',
      u.active ? 'Active' : 'Inactive'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
  };

  return (
    <div className="users-container">
      <div className="users-header">
        <div>
          <h1>{(isSuperAdmin || isPM) ? t('👥 Users & Project Management') : t('👥 Team Groups & Assignment')}</h1>
          <p style={{ color: '#718096', fontSize: '14px', marginTop: '4px' }}>
            {isSuperAdmin && t('Manage all users across all projects and assign PMs.')}
            {isPM && t('Manage users in your assigned projects.')}
            {isSupervisor && t('Create groups and assign team members.')}
          </p>
        </div>
        <button
          className="btn-primary"
          onClick={openAddModal}
          disabled={workerLimitReached}
          title={workerLimitReached ? t('Upgrade Required') : ''}
        >
          ➕ {t('Add User')}
        </button>
      </div>

      {/* Statistics Cards */}
      <div className="users-stats">
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            👥
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.total}</div>
            <div className="stat-label">{t('Total Users')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #48bb78 0%, #38a169 100%)' }}>
            ✅
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.active}</div>
            <div className="stat-label">{t('Active')}</div>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #f56565 0%, #e53e3e 100%)' }}>
            ❌
          </div>
          <div className="stat-content">
            <div className="stat-value">{stats.inactive}</div>
            <div className="stat-label">{t('Inactive')}</div>
          </div>
        </div>
        {ROLES.slice(0, 3).map(role => (
          <div key={role.value} className="stat-card">
            <div className="stat-icon" style={{ background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)' }}>
              {role.value === 'super-admin' ? '👑' : role.value === 'pm' ? '📊' : '👨‍💼'}
            </div>
            <div className="stat-content">
              <div className="stat-value">{stats.byRole[role.value] || 0}</div>
              <div className="stat-label">{role.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Pending Lead Tech Approvals - Solo para PM */}
      {isPM && (
        (() => {
          // Filtrar usuarios que necesitan aprobación de Lead Tech
          // Por ahora, consideramos pendientes a los Lead Techs que están en proyectos del PM pero sin aprobar
          const pendingLeadTechs = users.filter(u => 
            u.role === 'lead-technician' && 
            u.projectId &&
            projects.find(p => p.id === u.projectId && p.pmId === currentUser.id) &&
            u.pendingApproval // Este campo lo agregamos cuando el supervisor asigna
          );

          if (pendingLeadTechs.length === 0) return null;

          const handleApprove = (userId) => {
            const user = users.find(u => u.id === userId);
            if (user) {
              dispatch(updateUser({ ...user, pendingApproval: false, approved: true }));
            }
          };

          const handleReject = (userId) => {
            const user = users.find(u => u.id === userId);
            if (user) {
              dispatch(updateUser({ ...user, role: 'technician', pendingApproval: false }));
            }
          };

          return (
            <div style={{
              background: 'linear-gradient(135deg, #fff5f5 0%, #fed7e2 100%)',
              border: '2px solid #fc8181',
              borderRadius: 12,
              padding: 20,
              marginBottom: 24
            }}>
              <h3 style={{ marginBottom: 16, color: '#c53030', display: 'flex', alignItems: 'center', gap: 8 }}>
                <span>⚠️</span> {t('Pending Lead Technician Approvals')} ({pendingLeadTechs.length})
              </h3>
              <p style={{ fontSize: 14, color: '#742a2a', marginBottom: 16 }}>
                {t('The following technicians have been proposed as Lead Technicians by supervisors. Review and approve or reject.')}
              </p>
              <div style={{ display: 'grid', gap: 12 }}>
                {pendingLeadTechs.map(user => {
                  const project = projects.find(p => p.id === user.projectId);
                  return (
                    <div key={user.id} style={{
                      background: 'white',
                      padding: 16,
                      borderRadius: 10,
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid #feb2b2'
                    }}>
                      <div>
                        <strong style={{ fontSize: 16, color: '#2d3748' }}>{user.name}</strong>
                        <div style={{ fontSize: 13, color: '#718096', marginTop: 4 }}>
                          {user.email} • {t('Project:')} {project?.name || t('N/A')} • {t('Group:')} {user.groupId || t('N/A')}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 8 }}>
                        <button
                          onClick={() => handleApprove(user.id)}
                          style={{
                            padding: '8px 20px',
                            background: '#48bb78',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: 14
                          }}
                        >
                          ✅ {t('Approve')}
                        </button>
                        <button
                          onClick={() => handleReject(user.id)}
                          style={{
                            padding: '8px 20px',
                            background: '#f56565',
                            color: 'white',
                            border: 'none',
                            borderRadius: 8,
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: 14
                          }}
                        >
                          ❌ {t('Reject')}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })()
      )}

      {/* Filters and Search */}
      <div className="users-filters">
        <div className="filter-left">
          <div className="search-box">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              placeholder={t('Search by name, email, or group...')}
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="search-input"
            />
            {searchTerm && (
              <button className="clear-search" onClick={() => setSearchTerm('')}>✕</button>
            )}
          </div>
          
          <select value={filterRole} onChange={(e) => setFilterRole(e.target.value)} className="filter-select">
            <option value="all">{t('All Roles')}</option>
            {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
          
          <select value={filterProject} onChange={(e) => setFilterProject(e.target.value)} className="filter-select">
            <option value="all">{t('All Projects')}</option>
            {visibleProjects.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
          </select>
          
          <select value={filterStatus} onChange={(e) => setFilterStatus(e.target.value)} className="filter-select">
            <option value="all">{t('All Status')}</option>
            <option value="active">{t('Active Only')}</option>
            <option value="inactive">{t('Inactive Only')}</option>
          </select>
        </div>

        <div className="filter-right">
          {(isSuperAdmin || isPM || isSupervisor) && (
            <>
              <button 
                className={viewMode === 'list' ? 'btn-view-active' : 'btn-view'}
                onClick={() => setViewMode('list')}
                title={t('List View')}
              >
                📋
              </button>
              <button 
                className={viewMode === 'cards' ? 'btn-view-active' : 'btn-view'}
                onClick={() => setViewMode('cards')}
                title={t('Cards View')}
              >
                🃏
              </button>
              <button 
                className={viewMode === 'groups' ? 'btn-view-active' : 'btn-view'}
                onClick={() => setViewMode('groups')}
                title={t('Groups View')}
              >
                👥
              </button>
            </>
          )}
          <button className="btn-export" onClick={exportToCSV} title={t('Export to CSV')}>
            📥 {t('Export')}
          </button>
        </div>
      </div>

      {/* Bulk Actions */}
      {selectedUsers.length > 0 && (
        <div className="bulk-actions">
          <span className="bulk-count">{selectedUsers.length} {t('selected')}</span>
          <button className="btn-bulk" onClick={handleBulkActivate}>✅ {t('Activate')}</button>
          <button className="btn-bulk" onClick={handleBulkDeactivate}>❌ {t('Deactivate')}</button>
          <button className="btn-bulk" onClick={() => setSelectedUsers([])}>{t('Clear')}</button>
        </div>
      )}

      {/* Super Admin / PM View - Lista de usuarios */}
      {(isSuperAdmin || isPM) && viewMode === 'list' && (
        <div className="users-table-wrapper">
          <table className="users-table">
            <thead>
              <tr>
                <th style={{ width: '40px' }}>
                  <input
                    type="checkbox"
                    checked={selectedUsers.length === filteredUsers.length && filteredUsers.length > 0}
                    onChange={toggleSelectAll}
                  />
                </th>
                <th>{t('Name')}</th>
                <th>{t('Email')}</th>
                <th>{t('Role')}</th>
                <th>{t('Project')}</th>
                <th>{t('Group')}</th>
                <th>{t('Status')}</th>
                <th>{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="8" style={{ textAlign: 'center', padding: '40px', color: '#718096' }}>
                    {t('No users found. Try adjusting your filters.')}
                  </td>
                </tr>
              ) : (
                filteredUsers.map(user => (
                  <tr key={user.id}>
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => toggleUserSelection(user.id)}
                      />
                    </td>
                    <td>
                      <strong>{user.name}</strong>
                      {user.pendingApproval && (
                        <span style={{
                          marginLeft: 8,
                          padding: '2px 8px',
                          background: '#fed7d7',
                          color: '#c53030',
                          borderRadius: 4,
                          fontSize: 11,
                          fontWeight: 600
                        }}>
                          ⚠️ {t('Pending Approval')}
                        </span>
                      )}
                    </td>
                    <td>{user.email}</td>
                    <td>
                      <span className={`role-badge role-${user.role}`}>
                        {ROLES.find(r => r.value === user.role)?.label}
                      </span>
                    </td>
                    <td>{projects.find(p => p.id === user.projectId)?.name || '-'}</td>
                    <td>{user.groupId || '-'}</td>
                    <td>
                      <span className={`status-badge ${user.active ? 'status-active' : 'status-inactive'}`}>
                        {user.active ? `✅ ${t('Active')}` : `❌ ${t('Inactive')}`}
                      </span>
                    </td>
                    <td className="action-buttons">
                      <button className="btn-edit" onClick={() => openEditModal(user)} title={t('Edit')}>✏️</button>
                      <button className="btn-delete" onClick={() => handleDelete(user.id)} title={t('Delete')}>🗑️</button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* Cards View */}
      {(isSuperAdmin || isPM) && viewMode === 'cards' && (
        <div className="users-cards-grid">
          {filteredUsers.length === 0 ? (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '40px', color: '#718096' }}>
              {t('No users found. Try adjusting your filters.')}
            </div>
          ) : (
            filteredUsers.map(user => (
              <div key={user.id} className="user-card">
                <div className="user-card-header">
                  <div className="user-avatar">
                    {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                  </div>
                  <div className="user-card-info">
                    <h3>{user.name}</h3>
                    <p>{user.email}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={selectedUsers.includes(user.id)}
                    onChange={() => toggleUserSelection(user.id)}
                    className="user-card-checkbox"
                  />
                </div>
                <div className="user-card-body">
                  <div className="user-card-row">
                    <span className="label">{t('Role:')}</span>
                    <span className={`role-badge role-${user.role}`}>
                      {ROLES.find(r => r.value === user.role)?.label}
                    </span>
                  </div>
                  <div className="user-card-row">
                    <span className="label">{t('Project:')}</span>
                    <span>{projects.find(p => p.id === user.projectId)?.name || '-'}</span>
                  </div>
                  <div className="user-card-row">
                    <span className="label">{t('Group:')}</span>
                    <span>{user.groupId || '-'}</span>
                  </div>
                  <div className="user-card-row">
                    <span className="label">{t('Status:')}</span>
                    <span className={`status-badge ${user.active ? 'status-active' : 'status-inactive'}`}>
                      {user.active ? `✅ ${t('Active')}` : `❌ ${t('Inactive')}`}
                    </span>
                  </div>
                </div>
                <div className="user-card-actions">
                  <button className="btn-edit" onClick={() => openEditModal(user)}>
                    ✏️ {t('Edit')}
                  </button>
                  <button className="btn-delete" onClick={() => handleDelete(user.id)}>
                    🗑️ {t('Delete')}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Supervisor View - Vista por proyectos y grupos */}
      {isSupervisor && viewMode === 'list' && (
        <>
          <div style={{ marginBottom: '16px', padding: '12px', background: '#e6fffa', borderRadius: '8px', border: '1px solid #48bb78' }}>
            <strong>{t('Supervisor View:')}</strong> {t('Create groups, assign Lead Techs, and distribute technicians into groups.')}
          </div>
          <table className="users-table">
            <thead>
              <tr>
                <th>{t('Name')}</th>
                <th>{t('Email')}</th>
                <th>{t('Role')}</th>
                <th>{t('Project')}</th>
                <th>{t('Group')}</th>
                <th>{t('Actions')}</th>
              </tr>
            </thead>
            <tbody>
              {users.filter(u => ['supervisor', 'lead-technician', 'technician'].includes(u.role)).map(user => (
                <tr key={user.id}>
                  <td>{user.name}</td>
                  <td>{user.email}</td>
                  <td><span className={`role-badge role-${user.role}`}>{ROLES.find(r => r.value === user.role)?.label}</span></td>
                  <td>{projects.find(p => p.id === user.projectId)?.name || '-'}</td>
                  <td>{user.groupId || '-'}</td>
                  <td>
                    <button className="btn-edit" onClick={() => openEditModal(user)}>{t('Assign Group')}</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </>
      )}

      {/* Super Admin / PM Groups View */}
      {(isSuperAdmin || isPM) && viewMode === 'groups' && (
        <>
          <div style={{ marginBottom: '16px', padding: '12px', background: '#f7fafc', borderRadius: '8px', border: '1px solid #667eea' }}>
            <strong>{isSuperAdmin ? t('Super Admin') : t('PM')} {t('Groups View:')}</strong> {t('Overview of')} {isSuperAdmin ? t('all') : t('your')} {t('teams organized by project and group. Monitor team structure and assignments.')}
          </div>
          {projects
            .filter(project => {
              if (isSuperAdmin) return true;
              if (isPM) return project.pmId === currentUser.id;
              return false;
            })
            .map(project => {
            const groups = getGroupsByProject(project.id);
            return (
              <div key={project.id} style={{ marginBottom: '24px', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginBottom: '16px', color: '#667eea' }}>📁 {project.name}</h3>
                {Object.entries(groups).map(([groupId, group]) => (
                  <div key={groupId} style={{ marginBottom: '16px', padding: '12px', background: '#f7fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ marginBottom: '8px' }}>
                      👥 {t('Group')} {groupId === 'unassigned' ? t('(Unassigned)') : groupId}
                    </h4>
                    {group.leadTech && (
                      <div style={{ marginBottom: '8px', padding: '8px', background: '#e6fffa', borderRadius: '6px' }}>
                        <strong>👨‍💼 {t('Lead Tech:')}</strong> {group.leadTech.name} ({group.leadTech.email})
                        <button 
                          className="btn-edit" 
                          onClick={() => openEditModal(group.leadTech)}
                          style={{ marginLeft: '8px', fontSize: '12px' }}
                        >
                          {t('Edit')}
                        </button>
                      </div>
                    )}
                    <div style={{ marginLeft: '16px' }}>
                      <strong>{t('Technicians:')}</strong>
                      {group.technicians.length > 0 ? (
                        <ul style={{ marginTop: '4px' }}>
                          {group.technicians.map(tech => (
                            <li key={tech.id}>
                              {tech.name} ({tech.email})
                              <button 
                                className="btn-edit" 
                                onClick={() => openEditModal(tech)}
                                style={{ marginLeft: '8px', fontSize: '12px' }}
                              >
                                {t('Edit')}
                              </button>
                            </li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ color: '#718096', marginTop: '4px' }}>{t('No technicians assigned')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </>
      )}

      {/* Supervisor Groups View */}
      {isSupervisor && viewMode === 'groups' && (
        <>
          <div style={{ marginBottom: '16px', padding: '12px', background: '#e6fffa', borderRadius: '8px', border: '1px solid #48bb78' }}>
            <strong>{t('Supervisor Groups View:')}</strong> {t('Organize teams by project and group. Assign Lead Techs and technicians.')}
          </div>
          {projects.map(project => {
            const groups = getGroupsByProject(project.id);
            return (
              <div key={project.id} style={{ marginBottom: '24px', padding: '16px', background: '#fff', borderRadius: '12px', border: '1px solid #e2e8f0' }}>
                <h3 style={{ marginBottom: '16px', color: '#667eea' }}>📁 {project.name}</h3>
                {Object.entries(groups).map(([groupId, group]) => (
                  <div key={groupId} style={{ marginBottom: '16px', padding: '12px', background: '#f7fafc', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                    <h4 style={{ marginBottom: '8px' }}>
                      👥 {t('Group')} {groupId === 'unassigned' ? t('(Unassigned)') : groupId}
                    </h4>
                    {group.leadTech && (
                      <div style={{ marginBottom: '8px', padding: '8px', background: '#e6fffa', borderRadius: '6px' }}>
                        <strong>👨‍💼 {t('Lead Tech:')}</strong> {group.leadTech.name} ({group.leadTech.email})
                      </div>
                    )}
                    <div style={{ marginLeft: '16px' }}>
                      <strong>{t('Technicians:')}</strong>
                      {group.technicians.length > 0 ? (
                        <ul style={{ marginTop: '4px' }}>
                          {group.technicians.map(tech => (
                            <li key={tech.id}>{tech.name} ({tech.email})</li>
                          ))}
                        </ul>
                      ) : (
                        <p style={{ color: '#718096', marginTop: '4px' }}>{t('No technicians assigned')}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            );
          })}
        </>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <h2>{editMode ? t('Edit User') : t('Add User')}</h2>
            <form onSubmit={handleSubmit} className="user-form">
              <div className="form-group">
                <label>{t('Name')}</label>
                <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('Email')}</label>
                <input type="email" value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} required />
              </div>
              <div className="form-group">
                <label>{t('Role')}</label>
                <select value={form.role} onChange={e => setForm({ ...form, role: e.target.value })}>
                  {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                </select>
              </div>
              <div className="form-group">
                <label>{t('Project Assignment')}</label>
                <select
                  value={form.projectId}
                  onChange={e => setForm({ ...form, projectId: e.target.value })}
                  required={form.role !== 'super-admin'}
                  disabled={visibleProjects.length === 0}
                >
                  <option value="">{visibleProjects.length ? t('Select Project') : t('No projects available')}</option>
                  {visibleProjects.map(p => (
                    <option key={p.id} value={p.id}>{p.name}</option>
                  ))}
                </select>
                {form.role === 'super-admin' && (
                  <small style={{ color: '#718096' }}>
                    {t('Optional for Admin — assign if you want to scope admin actions to a project.')}
                  </small>
                )}
              </div>
              
              {/* Group Assignment - Solo para Lead Tech y Technician */}
              {(form.role === 'lead-technician' || form.role === 'technician') && (
                <div className="form-group">
                  <label>{t('Group ID')} {form.role === 'lead-technician' ? t('(Lead will manage this group)') : t('(Assign to group)')}</label>
                  <input 
                    type="text" 
                    value={form.groupId} 
                    onChange={e => setForm({ ...form, groupId: e.target.value })}
                    placeholder={t('e.g., Group-A, Team-1')}
                  />
                  <small style={{ color: '#718096' }}>
                    {form.role === 'lead-technician' 
                      ? t('This Lead Tech will distribute tasks to technicians in this group.')
                      : t('Assign this technician to a group for task distribution.')}
                  </small>
                </div>
              )}
              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowModal(false)}>{t('Cancel')}</button>
                <button type="submit" className="btn-primary">{editMode ? t('Update') : t('Add')}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
