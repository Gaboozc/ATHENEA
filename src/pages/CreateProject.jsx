import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addProject } from '../store/slices/projectsSlice';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import './CreateProject.css';

export const CreateProject = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: currentUser, role: currentRole } = useCurrentUser();
  const { users } = useSelector((state) => state.users);
  const pmUsers = users.filter(u => u.role === 'pm');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientName: '',
    siteAddress: '',
    startDate: '',
    pmId: '',
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear error when user types
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
  };

  const validate = () => {
    const newErrors = {};
    if (!formData.name.trim()) newErrors.name = 'Project name is required';
    if (!formData.clientName.trim()) newErrors.clientName = 'Client name is required';
    if (!formData.siteAddress.trim()) newErrors.siteAddress = 'Site address is required';
    if (!formData.startDate) newErrors.startDate = 'Start date is required';
    // Super Admin must assign a PM
    if (currentRole === 'super-admin' && !formData.pmId) newErrors.pmId = 'Please assign a PM';
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    // Ensure PM-created projects are associated to the creating PM
    const payload = {
      ...formData,
      ...(currentRole === 'pm' && currentUser?.id ? { pmId: currentUser.id } : {}),
    };

    dispatch(addProject(payload));
    alert('✅ Project created successfully!');
    navigate('/projects');
  };

  return (
    <div className="create-project-container">
      <div className="create-project-card">
        <div className="create-header">
          <button className="back-btn" onClick={() => navigate('/projects')}>
            ← Back
          </button>
          <h1>Create New Project</h1>
        </div>

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label htmlFor="name">Project Name *</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder="e.g., Office Building Network Installation"
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">Description</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder="Brief description of the project"
              rows="4"
            />
          </div>

            {currentRole === 'super-admin' && (
              <div className="form-group">
                <label htmlFor="pmId">Assign Project Manager *</label>
                <select
                  id="pmId"
                  name="pmId"
                  value={formData.pmId}
                  onChange={handleChange}
                  className={errors.pmId ? 'error' : ''}
                >
                  <option value="">Select PM</option>
                  {pmUsers.map(pm => (
                    <option key={pm.id} value={pm.id}>{pm.name}</option>
                  ))}
                </select>
                {errors.pmId && <span className="error-text">{errors.pmId}</span>}
              </div>
            )}

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientName">Client Name *</label>
              <input
                id="clientName"
                name="clientName"
                type="text"
                value={formData.clientName}
                onChange={handleChange}
                placeholder="e.g., ABC Corporation"
                className={errors.clientName ? 'error' : ''}
              />
              {errors.clientName && <span className="error-text">{errors.clientName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="startDate">Start Date *</label>
              <input
                id="startDate"
                name="startDate"
                type="date"
                value={formData.startDate}
                onChange={handleChange}
                className={errors.startDate ? 'error' : ''}
              />
              {errors.startDate && <span className="error-text">{errors.startDate}</span>}
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="siteAddress">Site Address *</label>
            <input
              id="siteAddress"
              name="siteAddress"
              type="text"
              value={formData.siteAddress}
              onChange={handleChange}
              placeholder="e.g., 123 Main Street, New York, NY 10001"
              className={errors.siteAddress ? 'error' : ''}
            />
            {errors.siteAddress && <span className="error-text">{errors.siteAddress}</span>}
          </div>

          <div className="form-actions">
            <button 
              type="button" 
              className="btn-cancel"
              onClick={() => navigate('/projects')}
            >
              Cancel
            </button>
            <button type="submit" className="btn-submit">
              ✅ Create Project
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
