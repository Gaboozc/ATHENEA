import { useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { hasPermission } from '../utils/permissions';
import './Projects.css';

export const Projects = () => {
  const navigate = useNavigate();
  const { projects } = useSelector((state) => state.projects);
  const { user: currentUser, role: currentRole } = useCurrentUser();

  // Filtrar proyectos según el rol
  const filteredProjects = projects.filter(project => {
    // Super Admin ve todos los proyectos
    if (currentRole === 'super-admin') return true;
    
    // PM solo ve sus proyectos asignados
    if (currentRole === 'pm') {
      return project.pmId === currentUser.id;
    }
    
    // Otros roles ven todos (por ahora)
    return true;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'completed':
        return '#48bb78';
      case 'in-progress':
        return '#4299e1';
      case 'planning':
        return '#ed8936';
      default:
        return '#a0aec0';
    }
  };

  const getStatusLabel = (status) => {
    return status.split('-').map(word => 
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  };

  return (
    <div className="projects-container">
      <div className="projects-header">
        <div>
          <h1>Projects</h1>
          <p>Manage your cable installation projects</p>
        </div>
        {hasPermission(currentRole, 'projects', 'create') && (
          <button 
            className="btn-primary"
            onClick={() => navigate('/projects/create')}
          >
            ➕ New Project
          </button>
        )}
      </div>

      <div className="projects-grid">
        {filteredProjects.map((project) => (
          <div 
            key={project.id} 
            className="project-card"
            onClick={() => navigate(`/projects/${project.id}`)}
          >
            <div className="project-card-header">
              <h3>{project.name}</h3>
              <span 
                className="status-badge"
                style={{ backgroundColor: getStatusColor(project.status) }}
              >
                {getStatusLabel(project.status)}
              </span>
            </div>

            <p className="project-description">{project.description}</p>

            <div className="project-info">
              <div className="info-item">
                <span className="info-label">Client:</span>
                <span className="info-value">{project.clientName}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Location:</span>
                <span className="info-value">{project.siteAddress}</span>
              </div>
              <div className="info-item">
                <span className="info-label">Start Date:</span>
                <span className="info-value">
                  {new Date(project.startDate).toLocaleDateString()}
                </span>
              </div>
            </div>

            <div className="progress-section">
              <div className="progress-header">
                <span>Progress</span>
                <span className="progress-percentage">
                  {project.completionPercentage}%
                </span>
              </div>
              <div className="progress-bar">
                <div 
                  className="progress-fill"
                  style={{ width: `${project.completionPercentage}%` }}
                />
              </div>
              <div className="points-info">
                {project.completedPoints} / {project.totalPoints} points completed
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProjects.length === 0 && (
        <div className="empty-state">
          <p>No projects yet</p>
          <button 
            className="btn-primary"
            onClick={() => navigate('/projects/create')}
          >
            Create your first project
          </button>
        </div>
      )}
    </div>
  );
};
