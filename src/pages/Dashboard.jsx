
import { useSelector, useDispatch } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import './Dashboard.css';
import { hasPermission } from '../utils/permissions';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { setDemoUser, clearDemoUser } from '../store/slices/authSlice';

export const Dashboard = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { projects: allProjects } = useSelector((state) => state.projects);
  const { points } = useSelector((state) => state.points);
  const { user, role: currentRole, isDemo } = useCurrentUser();
  
  const users = useSelector((state) => state.users?.users || []);
  const { entries: inventoryItems = [] } = useSelector((state) => state.inventory || {});
  const { entries: productionEntries = [] } = useSelector((state) => state.production || {});

  // Filtrar proyectos según el rol
  const projects = allProjects.filter(project => {
    // Super Admin ve todos los proyectos
    if (currentRole === 'super-admin') return true;
    
    // PM solo ve sus proyectos asignados
    if (currentRole === 'pm') {
      return project.pmId === user.id;
    }
    
    // Otros roles ven todos (por ahora)
    return true;
  });

  // Slices maestros (Spreadsheet Maestro)
  const { projects: masterProjects = [] } = useSelector((state) => state.projectsMaster || {});
  const { floorPlans = [] } = useSelector((state) => state.floorPlans || {});
  const { points: masterPoints = [] } = useSelector((state) => state.pointsMaster || {});
  const { history: pointsHistory = [] } = useSelector((state) => state.pointsStatusHistory || {});
  const { modDocs = [] } = useSelector((state) => state.modDocsRegistry || {});
  const { hardware = [] } = useSelector((state) => state.hardwareInventory || {});
  const { materials = [] } = useSelector((state) => state.materialsUsage || {});
  const { commRooms = [] } = useSelector((state) => state.commRooms || {});
  const { dailyReports = [] } = useSelector((state) => state.dailyReports || {});
  const { users: accessUsers = [] } = useSelector((state) => state.usersAccess || {});
  const { approvals = [] } = useSelector((state) => state.approvalsLog || {});
  const { notifications = [] } = useSelector((state) => state.notificationsQueue || {});

  // Calculate statistics
  const totalProjects = projects.length;
  const activeProjects = projects.filter(p => p.status === 'in-progress').length;
  const completedProjects = projects.filter(p => p.status === 'completed').length;
  const totalPoints = points.length;
  const completedPoints = points.filter(p => p.status === 'completed').length;
  const pendingPoints = points.filter(p => p.status === 'pending').length;
  
    // New module statistics
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.active).length;
    const warehouseItems = inventoryItems.filter(i => i.location === 'warehouse').length;
    const lowStockItems = inventoryItems.filter(i => i.location === 'warehouse' && i.quantity <= i.minStock).length;
    const activeTasks = productionEntries.filter(e => e.status === 'in-progress').length;
    const overdueTasks = productionEntries.filter(e => 
      e.status !== 'completed' && new Date(e.dueDate) < new Date()
    ).length;

  // Maestro stats
  const maestroStats = [
    { label: 'Proyectos (Maestro)', value: masterProjects.length, icon: '🏢', color: '#667eea' },
    { label: 'Planos', value: floorPlans.length, icon: '📄', color: '#4299e1' },
    { label: 'Puntos (Maestro)', value: masterPoints.length, icon: '📍', color: '#ed8936' },
    { label: 'Historial de Puntos', value: pointsHistory.length, icon: '🕓', color: '#f6ad55' },
    { label: 'ModDocs', value: modDocs.length, icon: '📝', color: '#38b2ac' },
    { label: 'Hardware', value: hardware.length, icon: '💻', color: '#805ad5' },
    { label: 'Materiales', value: materials.length, icon: '🧰', color: '#48bb78' },
    { label: 'Comm Rooms', value: commRooms.length, icon: '🏬', color: '#f56565' },
    { label: 'Reportes Diario', value: dailyReports.length, icon: '📆', color: '#ed64a6' },
    { label: 'Usuarios (Acceso)', value: accessUsers.length, icon: '👤', color: '#9f7aea' },
    { label: 'Aprobaciones', value: approvals.length, icon: '✅', color: '#ecc94b' },
    { label: 'Notificaciones', value: notifications.length, icon: '🔔', color: '#4fd1c5' },
  ];

  const recentProjects = projects.slice(0, 3);
  
  // Technician: My tasks (today & upcoming)
  const myTasks = productionEntries
    .filter(e => e.userId === user?.id)
    .sort((a,b) => new Date(a.dueDate) - new Date(b.dueDate));
  const todayISO = new Date().toISOString().split('T')[0];
  const myTasksToday = myTasks.filter(t => t.dueDate === todayISO && t.status !== 'completed');

  const roles = [
    { value: 'super-admin', label: 'Super Admin', color: '#9333ea' },
    { value: 'pm', label: 'Project Manager (PM 1)', color: '#667eea', userId: '2' },
    { value: 'pm-2', label: 'Project Manager (PM 2)', color: '#667eea', userId: '3' },
    { value: 'supervisor', label: 'Supervisor', color: '#4299e1' },
    { value: 'lead-technician', label: 'Lead Technician', color: '#48bb78' },
    { value: 'technician', label: 'Technician', color: '#ed8836' },
  ];

  // Compute current role value (including pm-2 if user is PM 2)
  const getCurrentRoleValue = () => {
    if (currentRole === 'pm' && user?.id === '3') return 'pm-2';
    return currentRole;
  };

  // Handler para simular roles con usuario completo
  const handleRoleSimulation = (roleValue) => {
    // Special handling for PM selection with specific users
    const roleConfig = roles.find(r => r.value === roleValue);
    let sampleUser;
    
    if (roleConfig?.userId) {
      // Use specific user by ID
      sampleUser = users.find(u => u.id === roleConfig.userId);
    } else {
      // Find first user with the role (strip -2, -3 suffix for finding)
      const baseRole = roleValue.replace(/-\d+$/, '');
      sampleUser = users.find(u => u.role === baseRole);
    }
    
    const demoUserData = sampleUser || {
      id: 'demo-' + roleValue,
      name: `Demo ${roleValue.replace('-', ' ')}`,
      email: `demo-${roleValue}@wirescope.com`,
      role: roleValue.replace(/-\d+$/, ''), // Clean role name
      active: true,
      projectId: '1', // Proyecto por defecto
    };
    
    dispatch(setDemoUser({ user: demoUserData, role: demoUserData.role }));
  };

  const resetRoleSimulation = () => {
    dispatch(clearDemoUser());
  };

  return (
    <div className="dashboard-container">
      {/* Role Simulator Panel - ALWAYS FIRST */}
      <div className="role-simulator" style={{
        background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
        color: 'white',
        padding: '20px',
        borderRadius: '12px',
        marginBottom: '24px',
        boxShadow: '0 10px 30px rgba(102, 126, 234, 0.3)',
        border: isDemo ? '3px solid #fc8181' : 'none'
      }}>
        <h3 style={{ margin: '0 0 16px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
          🎭 Role Simulator
          {isDemo && (
            <span style={{
              marginLeft: '8px',
              background: '#fc8181',
              padding: '4px 12px',
              borderRadius: '6px',
              fontSize: '12px',
              fontWeight: 700,
              animation: 'pulse 2s infinite'
            }}>
              DEMO MODE
            </span>
          )}
          {isDemo && (
            <>
              <button 
                onClick={resetRoleSimulation}
                style={{
                  marginLeft: 'auto',
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                ↩️ Reset to Real Role
              </button>
              <button
                onClick={() => {
                  if (window.confirm('This will reset demo data (local storage) and reload the app. Proceed?')) {
                    try {
                      localStorage.clear();
                    } catch {}
                    window.location.reload();
                  }
                }}
                style={{
                  marginLeft: 8,
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  color: 'white',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 600
                }}
              >
                🧹 Reset Demo Data
              </button>
            </>
          )}
        </h3>
        <p style={{ fontSize: '14px', marginBottom: '4px', opacity: 0.9 }}>
          Test the app from different user perspectives. Current role: <strong>{roles.find(r => r.value === currentRole)?.label || currentRole}</strong>
          {isDemo && <span style={{ marginLeft: 8, fontSize: '11px', opacity: 0.7 }}>(Simulating: {user.name})</span>}
        </p>
        <div style={{ fontSize: '12px', opacity: 0.85, marginBottom: '12px', padding: '8px', background: 'rgba(255,255,255,0.1)', borderRadius: '6px' }}>
          <strong>Responsibilities:</strong>{' '}
          {currentRole === 'super-admin' ? '👑 Global oversight, assign PMs, distribute personnel across all projects' :
           currentRole === 'pm' ? '📊 Manage assigned projects, approve Lead Techs, create projects, full project control' :
           currentRole === 'supervisor' ? '📋 Create tasks, propose Lead Techs (needs PM approval), manage execution' :
           currentRole === 'lead-technician' ? '👨‍💼 Distribute tasks to team, monitor progress, manage group' :
           '👷 Complete assigned tasks, view group tasks, mark as done'}
        </div>
        <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
          {roles.map(role => {
            const activeRoleValue = getCurrentRoleValue();
            const isActive = activeRoleValue === role.value;
            return (
              <button
                key={role.value}
                onClick={() => handleRoleSimulation(role.value)}
                style={{
                  background: isActive ? 'white' : 'rgba(255,255,255,0.2)',
                  color: isActive ? role.color : 'white',
                  border: isActive ? `2px solid ${role.color}` : 'none',
                  padding: '10px 20px',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: '600',
                  transition: 'all 0.2s',
                  transform: isActive ? 'scale(1.05)' : 'scale(1)',
                  boxShadow: isActive ? '0 4px 12px rgba(0,0,0,0.2)' : 'none'
                }}
              >
                {role.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Group Info Section - For PM, Technician and Lead Technician */}
      {(currentRole === 'pm' || currentRole === 'technician' || currentRole === 'lead-technician') && hasPermission(currentRole, 'users', 'viewGroupInfo') && (
        (() => {
          // Find current user
          const currentUser = users.find(u => u.id === user?.id);
          
          // PM can view all groups in their projects
          if (currentRole === 'pm') {
            const pmProjects = projects.filter(p => p.pmId === currentUser?.id);
            return (
              <div className="pm-groups-overview" style={{
                background: 'linear-gradient(135deg, #ebf8ff 0%, #e6fffa 100%)',
                border: '2px solid #667eea',
                borderRadius: 12,
                padding: 20,
                marginBottom: 24,
                boxShadow: '0 4px 16px rgba(102, 126, 234, 0.15)'
              }}>
                <h3 style={{ marginBottom: 16, color: '#667eea', display: 'flex', alignItems: 'center', gap: 8 }}>
                  <span>👥</span> Your Project Teams Overview
                </h3>
                {pmProjects.map(project => {
                  const projectUsers = users.filter(u => u.projectId === project.id);
                  const leadTechs = projectUsers.filter(u => u.role === 'lead-technician');
                  const techs = projectUsers.filter(u => u.role === 'technician');
                  const supervisors = projectUsers.filter(u => u.role === 'supervisor');
                  
                  return (
                    <div key={project.id} style={{
                      background: 'white',
                      padding: 16,
                      borderRadius: 10,
                      marginBottom: 12,
                      border: '1px solid #e2e8f0'
                    }}>
                      <h4 style={{ marginBottom: 12, color: '#2d3748' }}>📁 {project.name}</h4>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, fontSize: 14 }}>
                        <div>
                          <strong>Supervisors:</strong> {supervisors.length}
                          {supervisors.length > 0 && (
                            <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>
                              {supervisors.map(s => s.name).join(', ')}
                            </div>
                          )}
                        </div>
                        <div>
                          <strong>Lead Techs:</strong> {leadTechs.length}
                          {leadTechs.length > 0 && (
                            <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>
                              {leadTechs.map(l => `${l.name} (${l.groupId || 'No group'})`).join(', ')}
                            </div>
                          )}
                        </div>
                        <div>
                          <strong>Technicians:</strong> {techs.length}
                          {techs.length > 0 && (
                            <div style={{ fontSize: 12, color: '#718096', marginTop: 4 }}>
                              {techs.map(t => `${t.name} (${t.groupId || 'No group'})`).join(', ')}
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
                {pmProjects.length === 0 && (
                  <p style={{ color: '#718096', textAlign: 'center', marginTop: 12 }}>
                    No projects assigned yet.
                  </p>
                )}
              </div>
            );
          }
          
          // For Technician and Lead Technician
          // Find lead tech for the same project
          const leadTech = users.find(u => u.role === 'lead-technician' && u.projectId === currentUser?.projectId);
          // Find all technicians in the same project (group)
          const groupMembers = users.filter(u => u.role === 'technician' && u.projectId === currentUser?.projectId);
          // Find all tasks for the group (by projectId)
          const groupTasks = productionEntries.filter(e => e.projectId === currentUser?.projectId);
          // Helper to get technician name by userId
          const getTechName = (id) => {
            const tech = users.find(u => u.id === id);
            return tech ? tech.name : 'Unassigned';
          };
          // Mark task as done handler
          const handleMarkDone = (taskId) => {
            dispatch({ type: 'production/updateStatus', payload: { id: taskId, status: 'completed' } });
          };
          
          const isLeadTech = currentRole === 'lead-technician';
          
          return (
            <div className="technician-group-info" style={{
              background: isLeadTech ? 'linear-gradient(135deg, #e6fffa 0%, #f0fff4 100%)' : '#f7fafc',
              border: isLeadTech ? '2px solid #48bb78' : '1px solid #e2e8f0',
              borderRadius: 12,
              padding: 16,
              marginBottom: 24,
              boxShadow: '0 4px 16px rgba(0,0,0,0.04)'
            }}>
              <h3 style={{ marginBottom: 8 }}>
                {isLeadTech ? '👨‍💼 Your Team (Lead)' : '👷‍♂️ Your Group Assignment'}
              </h3>
              <div style={{ marginBottom: 8 }}>
                <strong>Project Group:</strong> {currentUser?.projectId ? `Project ${currentUser.projectId}` : 'N/A'}
              </div>
              {!isLeadTech && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Lead Technician (Task Distributor):</strong> {leadTech ? leadTech.name : 'N/A'}
                </div>
              )}
              {isLeadTech && (
                <div style={{ marginBottom: 8 }}>
                  <strong>Your Role:</strong> Lead Technician - You distribute tasks to your team
                </div>
              )}
              <div style={{ marginBottom: 8 }}>
                <strong>Group Members:</strong> {groupMembers.length > 0 ? groupMembers.map(m => m.name).join(', ') : 'N/A'}
              </div>
              <div>
                <strong>{isLeadTech ? 'Team Tasks:' : 'Group Tasks:'}</strong>
                {groupTasks.length > 0 ? (
                  <ul style={{ marginTop: 4 }}>
                    {groupTasks.map(task => (
                      <li key={task.id} style={{ marginBottom: 8, display: 'flex', alignItems: 'center', gap: 8 }}>
                        <span style={{ fontWeight: 600 }}>{task.taskName}</span>
                        <span style={{ color: '#718096' }}>({task.status})</span>
                        <span style={{ color: '#4299e1', fontSize: 12 }}>Assigned to: {getTechName(task.userId)}</span>
                        {task.userId === currentUser?.id && task.status !== 'completed' && !isLeadTech && (
                          <button
                            style={{ marginLeft: 8, padding: '2px 8px', borderRadius: 6, background: '#48bb78', color: 'white', border: 'none', cursor: 'pointer', fontSize: 12 }}
                            onClick={() => handleMarkDone(task.id)}
                          >
                            Mark as Done
                          </button>
                        )}
                      </li>
                    ))}
                  </ul>
                ) : (
                  <span style={{ marginLeft: 8 }}>No tasks assigned to your group.</span>
                )}
              </div>
            </div>
          );
        })()
      )}

      {/* Access Overview for current role */}
      <div className="access-overview" style={{
        background: '#fff',
        border: '1px solid #e2e8f0',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        boxShadow: '0 10px 30px rgba(0,0,0,0.04)'
      }}>
        <h3 style={{ marginBottom: 8 }}>🔐 Access Overview</h3>
        <p style={{ color: '#718096', marginBottom: 12 }}>What this role can access right now:</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: 12 }}>
          {[
            { label: 'Projects', can: hasPermission(currentRole, 'projects', 'viewAssigned') || hasPermission(currentRole, 'projects', 'viewAll') },
            { label: 'Create Project', can: hasPermission(currentRole, 'projects', 'create') },
            { label: 'Users Page', can: hasPermission(currentRole, 'users', 'viewAll') || hasPermission(currentRole, 'users', 'viewTeam') },
            { label: 'View Group Info', can: hasPermission(currentRole, 'dashboard', 'viewGroupInfo') },
            { label: 'Create Tasks', can: hasPermission(currentRole, 'production', 'createTask') },
            { label: 'Assign Tasks to Team', can: hasPermission(currentRole, 'production', 'assignTask') },
            { label: 'Assign Lead Tech', can: hasPermission(currentRole, 'projects', 'assignLeadTech') },
            { label: 'Approve Lead Assignment', can: hasPermission(currentRole, 'approvals', 'approveLeadAssignment') },
            { label: 'Inventory', can: hasPermission(currentRole, 'inventory', 'viewProject') || hasPermission(currentRole, 'inventory', 'viewAll') },
            { label: 'Points', can: hasPermission(currentRole, 'points', 'viewOwn') || hasPermission(currentRole, 'points', 'viewGroup') || hasPermission(currentRole, 'points', 'viewAll') },
          ].map(item => (
            <div key={item.label} style={{
              padding: '10px 12px',
              borderRadius: 10,
              border: '1px solid #edf2f7',
              background: item.can ? 'linear-gradient(135deg, #e6fffa 0%, #f0fff4 100%)' : '#f7fafc',
              color: item.can ? '#2f855a' : '#a0aec0',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontWeight: 600
            }}>
              <span>{item.can ? '✅' : '🚫'}</span>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="dashboard-header">
        <div>
          <h1>Welcome back, {user?.name || 'User'}! 👋</h1>
          <p>Here's what's happening with your projects today</p>
        </div>
      </div>

      {/* Statistics Cards - Solo KPIs globales */}
      <div className="stats-grid">
        <div className="stat-card" style={{ borderTop: '4px solid #667eea' }}>
          <div className="stat-icon" style={{ background: 'rgba(102, 126, 234, 0.1)' }}>
            📊
          </div>
          <div className="stat-content">
            <h3>{totalProjects}</h3>
            <p>Total Projects</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #4299e1' }}>
          <div className="stat-icon" style={{ background: 'rgba(66, 153, 225, 0.1)' }}>
            🔨
          </div>
          <div className="stat-content">
            <h3>{activeProjects}</h3>
            <p>Active Projects</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #48bb78' }}>
          <div className="stat-icon" style={{ background: 'rgba(72, 187, 120, 0.1)' }}>
            ✅
          </div>
          <div className="stat-content">
            <h3>{completedProjects}</h3>
            <p>Completed</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #ed8936' }}>
          <div className="stat-icon" style={{ background: 'rgba(237, 137, 54, 0.1)' }}>
            📍
          </div>
          <div className="stat-content">
            <h3>{totalPoints}</h3>
            <p>Total Points</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #9f7aea' }}>
          <div className="stat-icon" style={{ background: 'rgba(159, 122, 234, 0.1)' }}>
            👥
          </div>
          <div className="stat-content">
            <h3>{activeUsers}</h3>
            <p>Active Users</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #38b2ac' }}>
          <div className="stat-icon" style={{ background: 'rgba(56, 178, 172, 0.1)' }}>
            📦
          </div>
          <div className="stat-content">
            <h3>{warehouseItems}</h3>
            <p>Warehouse Items</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #f56565' }}>
          <div className="stat-icon" style={{ background: 'rgba(245, 101, 101, 0.1)' }}>
            ⚠️
          </div>
          <div className="stat-content">
            <h3>{lowStockItems}</h3>
            <p>Low Stock Alerts</p>
          </div>
        </div>
        <div className="stat-card" style={{ borderTop: '4px solid #4299e1' }}>
          <div className="stat-icon" style={{ background: 'rgba(66, 153, 225, 0.1)' }}>
            🔧
          </div>
          <div className="stat-content">
            <h3>{activeTasks}</h3>
            <p>Active Tasks</p>
          </div>
        </div>
      </div>

      {/* Progress Overview */}
      <div className="progress-overview">
        <h2>📊 Overall Progress</h2>
        <div className="progress-cards">
          <div className="progress-card">
            <div className="progress-info">
              <span className="progress-label">Points Completed</span>
              <span className="progress-value">
                {completedPoints} / {totalPoints}
              </span>
            </div>
            <div className="progress-bar-large">
              <div 
                className="progress-fill-large"
                style={{ 
                  width: `${totalPoints > 0 ? (completedPoints / totalPoints * 100) : 0}%`,
                  background: 'linear-gradient(90deg, #48bb78 0%, #38a169 100%)'
                }}
              />
            </div>
          </div>

          <div className="progress-card">
            <div className="progress-info">
              <span className="progress-label">Points Pending</span>
              <span className="progress-value">
                {pendingPoints} / {totalPoints}
              </span>
            </div>
            <div className="progress-bar-large">
              <div 
                className="progress-fill-large"
                style={{ 
                  width: `${totalPoints > 0 ? (pendingPoints / totalPoints * 100) : 0}%`,
                  background: 'linear-gradient(90deg, #ed8936 0%, #dd6b20 100%)'
                }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Recent Projects */}
      <div className="recent-projects">
        <div className="section-header">
          <h2>🚀 Recent Projects</h2>
          <button 
            className="btn-view-all"
            onClick={() => navigate('/projects')}
          >
            View All →
          </button>
        </div>

        {recentProjects.length > 0 ? (
          <div className="projects-list">
            {recentProjects.map((project) => (
              <div 
                key={project.id} 
                className="project-item"
                onClick={() => navigate(`/projects/${project.id}`)}
              >
                <div className="project-item-header">
                  <h3>{project.name}</h3>
                  <span 
                    className="status-pill"
                    style={{
                      background: project.status === 'completed' ? '#48bb78' :
                                project.status === 'in-progress' ? '#4299e1' : '#ed8936'
                    }}
                  >
                    {project.status.replace('-', ' ')}
                  </span>
                </div>
                <p className="project-client">👤 {project.clientName}</p>
                <div className="project-progress">
                  <div className="progress-bar-mini">
                    <div 
                      className="progress-fill-mini"
                      style={{ width: `${project.completionPercentage}%` }}
                    />
                  </div>
                  <span className="progress-percent">{project.completionPercentage}%</span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="empty-state-small">
            <p>No projects yet</p>
            <button 
              className="btn-create-first"
              onClick={() => navigate('/projects/create')}
            >
              Create your first project
            </button>
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <h2>⚡ Quick Actions</h2>
        <div className="action-buttons">
          {hasPermission(currentRole, 'projects', 'create') && (
            <button 
              className="action-btn"
              onClick={() => navigate('/projects/create')}
              style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
            >
              <span className="action-icon">➕</span>
              <div className="action-text">
                <strong>New Project</strong>
                <small>Create a new cable project</small>
              </div>
            </button>
          )}

          {hasPermission(currentRole, 'projects', 'view') && (
            <button 
              className="action-btn"
              onClick={() => navigate('/projects')}
              style={{ background: 'linear-gradient(135deg, #4299e1 0%, #3182ce 100%)' }}
            >
              <span className="action-icon">📋</span>
              <div className="action-text">
                <strong>View All Projects</strong>
                <small>Manage your projects</small>
              </div>
            </button>
          )}

          {hasPermission(currentRole, 'users', 'view') && (
            <button 
              className="action-btn"
              onClick={() => navigate('/users')}
              style={{ background: 'linear-gradient(135deg, #9f7aea 0%, #805ad5 100%)' }}
            >
              <span className="action-icon">👥</span>
              <div className="action-text">
                <strong>Manage Users</strong>
                <small>View team and roles</small>
              </div>
            </button>
          )}

          {hasPermission(currentRole, 'inventory', 'view') && (
            <button 
              className="action-btn"
              onClick={() => navigate('/inventory')}
              style={{ background: 'linear-gradient(135deg, #38b2ac 0%, #319795 100%)' }}
            >
              <span className="action-icon">📦</span>
              <div className="action-text">
                <strong>Check Inventory</strong>
                <small>Warehouse & project stock</small>
              </div>
            </button>
          )}

          {hasPermission(currentRole, 'production', 'view') && (
            <button 
              className="action-btn"
              onClick={() => navigate('/production')}
              style={{ background: 'linear-gradient(135deg, #f6ad55 0%, #ed8936 100%)' }}
            >
              <span className="action-icon">🔧</span>
              <div className="action-text">
                <strong>Production Tracking</strong>
                <small>Monitor task progress</small>
              </div>
            </button>
          )}
          </div>
        </div>

        {/* My Tasks (Technician) */}
        {currentRole === 'technician' && (
          <div className="my-tasks" style={{ marginTop: 24 }}>
            <h2>🧰 My Tasks</h2>
            {myTasks.length === 0 ? (
              <div className="empty-state-small">
                <p>No tasks assigned yet</p>
              </div>
            ) : (
              <>
                {myTasksToday.length > 0 && (
                  <div style={{ marginBottom: 12 }}>
                    <h3 style={{ margin: '8px 0' }}>Today</h3>
                    <div className="tasks-list" style={{ display: 'grid', gap: 12 }}>
                      {myTasksToday.slice(0, 5).map(task => (
                        <div key={task.id} className="task-row" style={{
                          background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12,
                          display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center'
                        }}>
                          <div>
                            <div style={{ fontWeight: 600 }}>{task.taskName}</div>
                            <div style={{ fontSize: 12, color: '#718096' }}>Due: {task.dueDate} • Status: {task.status.replace('-', ' ')}</div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                            <div className="progress-bar-mini" style={{ width: 120 }}>
                              <div className="progress-fill-mini" style={{ width: `${task.progress}%` }} />
                            </div>
                            <span style={{ fontSize: 12, fontWeight: 600 }}>{task.progress}%</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                <div>
                  <h3 style={{ margin: '8px 0' }}>Upcoming</h3>
                  <div className="tasks-list" style={{ display: 'grid', gap: 12 }}>
                    {myTasks.filter(t => t.dueDate !== todayISO && t.status !== 'completed').slice(0, 5).map(task => (
                      <div key={task.id} className="task-row" style={{
                        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 10, padding: 12,
                        display: 'grid', gridTemplateColumns: '1fr auto', alignItems: 'center'
                      }}>
                        <div>
                          <div style={{ fontWeight: 600 }}>{task.taskName}</div>
                          <div style={{ fontSize: 12, color: '#718096' }}>Due: {task.dueDate} • Status: {task.status.replace('-', ' ')}</div>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div className="progress-bar-mini" style={{ width: 120 }}>
                            <div className="progress-fill-mini" style={{ width: `${task.progress}%` }} />
                          </div>
                          <span style={{ fontSize: 12, fontWeight: 600 }}>{task.progress}%</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </>
            )}
          </div>
        )}

        {/* Alerts Section */}
        {(lowStockItems > 0 || overdueTasks > 0) && (
          <div className="alerts-section">
            <h2>🔔 Alerts & Notifications</h2>
            <div className="alerts-list">
              {lowStockItems > 0 && (
                <div className="alert-item alert-warning">
                  <span className="alert-icon">⚠️</span>
                  <div className="alert-content">
                    <strong>Low Stock Alert</strong>
                    <p>{lowStockItems} item{lowStockItems > 1 ? 's' : ''} running low in warehouse</p>
                  </div>
                  <button 
                    className="alert-action"
                    onClick={() => navigate('/inventory')}
                  >
                    View →
                  </button>
                </div>
              )}
              {overdueTasks > 0 && (
                <div className="alert-item alert-danger">
                  <span className="alert-icon">🚨</span>
                  <div className="alert-content">
                    <strong>Overdue Tasks</strong>
                    <p>{overdueTasks} task{overdueTasks > 1 ? 's' : ''} past due date</p>
                  </div>
                  <button 
                    className="alert-action"
                    onClick={() => navigate('/production')}
                  >
                    View →
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
    </div>
  );
};
