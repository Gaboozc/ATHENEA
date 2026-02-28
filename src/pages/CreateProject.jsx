import { useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { addProject } from '../store/slices/projectsSlice';
import { useNavigate } from 'react-router-dom';
import { useCurrentUser } from '../hooks/useCurrentUser';
import { useLanguage } from '../context/LanguageContext';
import './CreateProject.css';

export const CreateProject = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user: currentUser, role: currentRole } = useCurrentUser();

  const { t } = useLanguage();
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    clientName: '',
    siteAddress: '',
    startDate: '',
    endDate: '',
    maintenancePlan: '',
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
    if (!formData.name.trim()) newErrors.name = t('Project name is required');
    if (!formData.clientName.trim()) newErrors.clientName = t('Client name is required');
    if (!formData.siteAddress.trim()) newErrors.siteAddress = t('Site address is required');
    if (!formData.startDate) newErrors.startDate = t('Start date is required');
    return newErrors;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const newErrors = validate();
    
    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    dispatch(addProject(formData));
    alert(t('Project created successfully.'));
    navigate('/projects');
  };

  return (
    <div className="create-project-container">
      <div className="create-project-card">
        <div className="create-header">
          <button className="back-btn" onClick={() => navigate('/projects')}>
            ← {t('Back')}
          </button>
          <h1>{t('Create New Project')}</h1>
        </div>

        <form onSubmit={handleSubmit} className="project-form">
          <div className="form-group">
            <label htmlFor="name">{t('Project Name *')}</label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              placeholder={t('e.g., Office Building Network Installation')}
              className={errors.name ? 'error' : ''}
            />
            {errors.name && <span className="error-text">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label htmlFor="description">{t('Description')}</label>
            <textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleChange}
              placeholder={t('Brief description of the project')}
              rows="4"
            />
          </div>

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="clientName">{t('Client Name *')}</label>
              <input
                id="clientName"
                name="clientName"
                type="text"
                value={formData.clientName}
                onChange={handleChange}
                placeholder={t('e.g., ABC Corporation')}
                className={errors.clientName ? 'error' : ''}
              />
              {errors.clientName && <span className="error-text">{errors.clientName}</span>}
            </div>

            <div className="form-group">
              <label htmlFor="startDate">{t('Start Date *')}</label>
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

          <div className="form-row">
            <div className="form-group">
              <label htmlFor="endDate">{t('Completion Date')}</label>
              <input
                id="endDate"
                name="endDate"
                type="date"
                value={formData.endDate}
                onChange={handleChange}
              />
            </div>
            <div className="form-group">
              <label htmlFor="maintenancePlan">{t('Maintenance Plan')}</label>
              <input
                id="maintenancePlan"
                name="maintenancePlan"
                type="text"
                value={formData.maintenancePlan}
                onChange={handleChange}
                placeholder={t('e.g., Monthly maintenance cadence')}
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="siteAddress">{t('Site Address *')}</label>
            <input
              id="siteAddress"
              name="siteAddress"
              type="text"
              value={formData.siteAddress}
              onChange={handleChange}
              placeholder={t('e.g., 123 Main Street, New York, NY 10001')}
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
              {t('Cancel')}
            </button>
            <button type="submit" className="btn-submit">
              ✅ {t('Create Project')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
