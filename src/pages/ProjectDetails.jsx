
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import { deleteProject, updateProject } from '../store/slices/projectsSlice';
import './ProjectDetails.css';
import React, { useState } from 'react';
import PdfInAppViewer from '../components/PdfInAppViewer';
import TrackingSheetOverlay from '../components/TrackingSheetOverlay';

export const ProjectDetails = () => {
  // Spreadsheet Maestro: obtener entidades relacionadas a este proyecto
  const { points: masterPoints = [] } = useSelector((state) => state.pointsMaster || {});
  const { floorPlans = [] } = useSelector((state) => state.floorPlans || {});
  const { history: pointsHistory = [] } = useSelector((state) => state.pointsStatusHistory || {});
  const { modDocs = [] } = useSelector((state) => state.modDocsRegistry || {});
  const { hardware = [] } = useSelector((state) => state.hardwareInventory || {});
  const { materials = [] } = useSelector((state) => state.materialsUsage || {});
  const { commRooms = [] } = useSelector((state) => state.commRooms || {});
  const { dailyReports = [] } = useSelector((state) => state.dailyReports || {});
  const { approvals = [] } = useSelector((state) => state.approvalsLog || {});
  const { notifications = [] } = useSelector((state) => state.notificationsQueue || {});
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const project = useSelector((state) => 
    state.projects.projects.find((p) => p.id === id)
  );

  const [uploading, setUploading] = useState(false);
  const [newPlanName, setNewPlanName] = useState('');
  const [editPlanId, setEditPlanId] = useState(null);
  const [editPlanName, setEditPlanName] = useState('');
  const [selectedPlan, setSelectedPlan] = useState(null);

  // Filtros avanzados para Spreadsheet Maestro
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    search: '',
    status: 'all',
    plan: 'all',
    material: '',
    quantityMin: '',
    quantityMax: '',
    building: '',
    sector: '',
  });

  // Modal de edición de proyecto
  const [showEditModal, setShowEditModal] = useState(false);
  const [editForm, setEditForm] = useState({
    name: '',
    description: '',
    clientName: '',
    siteAddress: '',
    status: 'planning',
    startDate: '',
    completionPercentage: 0,
    totalPoints: 0,
    completedPoints: 0,
  });

  const openEditModal = () => {
    setEditForm({
      name: project.name || '',
      description: project.description || '',
      clientName: project.clientName || '',
      siteAddress: project.siteAddress || '',
      status: project.status || 'planning',
      startDate: project.startDate || '',
      completionPercentage: project.completionPercentage || 0,
      totalPoints: project.totalPoints || 0,
      completedPoints: project.completedPoints || 0,
    });
    setShowEditModal(true);
  };

  const updateProgressPoints = (field, value) => {
    const numValue = Math.max(0, parseInt(value) || 0);
    let newForm = { ...editForm };
    
    if (field === 'totalPoints') {
      newForm.totalPoints = numValue;
      // Si los puntos completados exceden el nuevo total, ajustarlos
      if (newForm.completedPoints > numValue) {
        newForm.completedPoints = numValue;
      }
    } else if (field === 'completedPoints') {
      // No permitir que los completados excedan el total
      newForm.completedPoints = Math.min(numValue, editForm.totalPoints);
    }
    
    // Calcular el porcentaje automáticamente
    if (newForm.totalPoints > 0) {
      newForm.completionPercentage = Math.round((newForm.completedPoints / newForm.totalPoints) * 100);
    } else {
      newForm.completionPercentage = 0;
    }
    
    setEditForm(newForm);
  };

  const handleEditSubmit = (e) => {
    e.preventDefault();
    dispatch(updateProject({ id: project.id, ...editForm }));
    setShowEditModal(false);
  };

  const applyFilters = (pts) => {
    return pts
      .filter(pt => {
        if (filters.status !== 'all' && pt.status !== filters.status) return false;
        if (filters.plan !== 'all' && (pt.planId || '') !== filters.plan) return false;
        if (filters.search && !(pt.label || '').toLowerCase().includes(filters.search.toLowerCase()) && !(pt.area || '').toLowerCase().includes(filters.search.toLowerCase())) return false;
        if (filters.building && !(pt.building || '').toLowerCase().includes(filters.building.toLowerCase())) return false;
        if (filters.sector && !(pt.area || '').toLowerCase().includes(filters.sector.toLowerCase())) return false;
        if (filters.material) {
          const mats = materials.filter(m => m.pointId === pt.id);
          const hasMat = mats.some(m => (m.materialType || '').toLowerCase().includes(filters.material.toLowerCase()));
          if (!hasMat) return false;
          if (filters.quantityMin || filters.quantityMax) {
            const total = mats.reduce((acc, m) => acc + (parseFloat(m.quantityUsed) || 0), 0);
            if (filters.quantityMin && total < parseFloat(filters.quantityMin)) return false;
            if (filters.quantityMax && total > parseFloat(filters.quantityMax)) return false;
          }
        }
        return true;
      });
  };

  const clearFilters = () => {
    setFilters({
      search: '',
      status: 'all',
      plan: 'all',
      material: '',
      quantityMin: '',
      quantityMax: '',
      building: '',
      sector: '',
    });
  };

  if (!project) {
    return (
      <div className="not-found">
        <h2>Project not found</h2>
        <button onClick={() => navigate('/projects')}>Back to Projects</button>
      </div>
    );
  }

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

  const handleDelete = () => {
    if (confirm('Are you sure you want to delete this project?')) {
      dispatch(deleteProject(id));
      navigate('/projects');
    }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file || file.type !== 'application/pdf') {
      alert('Please select a valid PDF file');
      return;
    }
    setUploading(true);
    
    try {
      const reader = new FileReader();
      reader.onload = (ev) => {
        const base64 = ev.target.result;
        
        // Verify the base64 string is valid
        if (!base64 || !base64.startsWith('data:application/pdf')) {
          alert('Error: Invalid PDF format');
          setUploading(false);
          return;
        }
        
        const plan = {
          id: Date.now().toString(),
          name: newPlanName || file.name,
          data: base64,
          marks: [],
        };
        const updated = {
          ...project,
          floorplans: [...(project.floorplans || []), plan],
        };
        dispatch(updateProject({ id: project.id, floorplans: updated.floorplans }));
        setNewPlanName('');
        setUploading(false);
        alert(`✅ ${file.name} uploaded successfully!`);
      };
      
      reader.onerror = () => {
        alert('Error reading file. Please try again.');
        setUploading(false);
      };
      
      reader.readAsDataURL(file);
    } catch (error) {
      alert('Error uploading file: ' + error.message);
      setUploading(false);
    }
  };

  const handleDeletePlan = (planId) => {
    if (!window.confirm('Delete this floor plan?')) return;
    const updated = {
      ...project,
      floorplans: (project.floorplans || []).filter(p => p.id !== planId),
    };
    dispatch(updateProject({ id: project.id, floorplans: updated.floorplans }));
    if (selectedPlan && selectedPlan.id === planId) setSelectedPlan(null);
  };

  const handleEditPlanName = (planId) => {
    setEditPlanId(planId);
    const plan = (project.floorplans || []).find(p => p.id === planId);
    setEditPlanName(plan?.name || '');
  };

  const handleSavePlanName = (planId) => {
    const updated = {
      ...project,
      floorplans: (project.floorplans || []).map(p =>
        p.id === planId ? { ...p, name: editPlanName } : p
      ),
    };
    dispatch(updateProject({ id: project.id, floorplans: updated.floorplans }));
    setEditPlanId(null);
    setEditPlanName('');
  };

  return (
    <div className="project-details-container">

      <div className="details-header">
        <button className="back-btn" onClick={() => navigate('/projects')}>
          ← Back
        </button>
        <div className="header-actions">
          <button className="btn-secondary" onClick={openEditModal}>✏️ Edit</button>
          <button className="btn-danger" onClick={handleDelete}>
            🗑️ Delete
          </button>
        </div>
      </div>



      <div className="project-title-section">
        <h1>{project.name}</h1>
        <span 
          className="status-badge"
          style={{ backgroundColor: getStatusColor(project.status) }}
        >
          {project.status.split('-').map(w => 
            w.charAt(0).toUpperCase() + w.slice(1)
          ).join(' ')}
        </span>
      </div>

      <p className="project-description">{project.description}</p>

      <div className="details-grid">
        <div className="detail-card">
          <h3>📋 Project Information</h3>
          <div className="detail-items">
            <div className="detail-item">
              <span className="label">Client</span>
              <span className="value">{project.clientName}</span>
            </div>
            <div className="detail-item">
              <span className="label">Location</span>
              <span className="value">{project.siteAddress}</span>
            </div>
            <div className="detail-item">
              <span className="label">Start Date</span>
              <span className="value">
                {new Date(project.startDate).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>

        <div className="detail-card">
          <h3>📊 Progress</h3>
          <div className="progress-large">
            <div className="progress-circle">
              <span className="percentage">{project.completionPercentage}%</span>
            </div>
            <div className="progress-stats">
              <div className="stat">
                <span className="stat-value">{project.totalPoints}</span>
                <span className="stat-label">Total Points</span>
              </div>
              <div className="stat">
                <span className="stat-value">{project.completedPoints}</span>
                <span className="stat-label">Completed</span>
              </div>
              <div className="stat">
                <span className="stat-value">
                  {project.totalPoints - project.completedPoints}
                </span>
                <span className="stat-label">Remaining</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="actions-section">
        <button 
          className="btn-large btn-primary"
          onClick={() => navigate(`/projects/${id}/floorplan`)}
        >
          🗺️ View Floor Plan
        </button>
      </div>

  <div className="floorplans-section">
        <h3>📑 Floor Plans (PDF)</h3>
        <form className="upload-form" onSubmit={e => e.preventDefault()}>
          <input
            type="text"
            placeholder="Plan name (optional)"
            value={newPlanName}
            onChange={e => setNewPlanName(e.target.value)}
            style={{ marginRight: 8 }}
          />
          <input
            type="file"
            accept="application/pdf"
            onChange={handleFileUpload}
            disabled={uploading}
          />
        </form>
        <ul className="floorplans-list">
          {(project.floorplans || []).map(plan => (
            <li key={plan.id} className="floorplan-item">
              {editPlanId === plan.id ? (
                <>
                  <input
                    type="text"
                    value={editPlanName}
                    onChange={e => setEditPlanName(e.target.value)}
                    style={{ marginRight: 8 }}
                  />
                  <button onClick={() => handleSavePlanName(plan.id)}>💾 Save</button>
                  <button onClick={() => setEditPlanId(null)}>Cancel</button>
                </>
              ) : (
                <>
                  <span
                    className="plan-link"
                    style={{ cursor: 'pointer', color: '#4299e1', textDecoration: 'underline', marginRight: 8 }}
                    onClick={() => setSelectedPlan(plan)}
                  >
                    {plan.name}
                  </span>
                  <button onClick={() => handleEditPlanName(plan.id)}>✏️</button>
                  <button onClick={() => handleDeletePlan(plan.id)}>🗑️</button>
                </>
              )}
            </li>
          ))}
        </ul>
        {selectedPlan && (
          <div className="pdf-viewer-modal" onClick={() => setSelectedPlan(null)}>
            <div className="pdf-viewer" onClick={e => e.stopPropagation()}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h4 style={{ margin: 0 }}>{selectedPlan.name}</h4>
                <div style={{ display: 'flex', gap: '8px' }}>
                  {/* In-app viewer controls are rendered inside PdfInAppViewer below (zoom/page) */}
                  <a
                    href={selectedPlan.data}
                    download={selectedPlan.name}
                    style={{
                      padding: '8px 16px',
                      background: '#4299e1',
                      color: 'white',
                      borderRadius: '6px',
                      textDecoration: 'none',
                      fontSize: '14px',
                      fontWeight: 600
                    }}
                  >
                    📥 Download
                  </a>
                  <button
                    onClick={() => {
                      try {
                        // Create a blob from base64
                        const base64Data = selectedPlan.data.split(',')[1];
                        const byteCharacters = atob(base64Data);
                        const byteNumbers = new Array(byteCharacters.length);
                        for (let i = 0; i < byteCharacters.length; i++) {
                          byteNumbers[i] = byteCharacters.charCodeAt(i);
                        }
                        const byteArray = new Uint8Array(byteNumbers);
                        const blob = new Blob([byteArray], { type: 'application/pdf' });
                        const blobUrl = URL.createObjectURL(blob);
                        
                        // Open in new window
                        window.open(blobUrl, '_blank');
                        
                        // Clean up after a delay
                        setTimeout(() => URL.revokeObjectURL(blobUrl), 1000);
                      } catch (error) {
                        alert('Error opening PDF: ' + error.message + '\n\nTry downloading instead.');
                      }
                    }}
                    style={{
                      padding: '8px 16px',
                      background: '#48bb78',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    🔍 Open in New Tab
                  </button>
                  <button
                    onClick={() => setSelectedPlan(null)}
                    style={{
                      padding: '8px 16px',
                      background: '#f56565',
                      color: 'white',
                      border: 'none',
                      borderRadius: '6px',
                      fontSize: '14px',
                      fontWeight: 600,
                      cursor: 'pointer'
                    }}
                  >
                    ✖️ Close
                  </button>
                </div>
              </div>
              <PdfInAppViewer dataUrl={selectedPlan.data}>
                {/* Tracking sheet overlay positioned above the rendered canvas */}
                <TrackingSheetOverlay
                  plan={selectedPlan}
                  projectId={project.id}
                  onUpdateMarks={marks => {
                    const updated = {
                      ...project,
                      floorplans: (project.floorplans || []).map(p =>
                        p.id === selectedPlan.id ? { ...p, marks } : p
                      ),
                    };
                    dispatch(updateProject({ id: project.id, floorplans: updated.floorplans }));
                  }}
                />
              </PdfInAppViewer>
            </div>
          </div>
        )}
      </div>

      {/* Spreadsheet Maestro - Excel-like tracking (editable y debajo de planos) */}
      <div className="spreadsheet-maestro-section">
        <h2>📑 Spreadsheet Maestro (Tracking)</h2>
        {/* Botón de filtros avanzados */}
        <div className="spreadsheet-controls">
          <button className="btn-filters" onClick={() => setShowFilters(true)}>
            🔍 Filtros avanzados
          </button>
          {(filters.search || filters.status !== 'all' || filters.plan !== 'all' || filters.material || filters.building || filters.sector) && (
            <button className="btn-clear-filters" onClick={clearFilters}>
              ✖ Limpiar filtros
            </button>
          )}
        </div>
        {/* Formulario para agregar punto */}
        <form className="spreadsheet-add" onSubmit={e => {
          e.preventDefault();
          if (!e.target.label.value) return;
          dispatch({
            type: 'pointsMaster/addPoint',
            payload: {
              id: Date.now().toString(),
              projectId: project.id,
              label: e.target.label.value,
              status: e.target.status.value,
              technician: '',
              leadTech: '',
              createdDate: new Date().toISOString(),
              certifiedDate: '',
            }
          });
          e.target.reset();
        }}>
          <input name="label" placeholder="Punto" required />
          <select name="status" defaultValue="not-started">
            <option value="not-started">No iniciado</option>
            <option value="in-progress">En progreso</option>
            <option value="problem">Problema</option>
            <option value="pull">Cable jalado</option>
            <option value="Certified">Certificado</option>
          </select>
          <button type="submit">➕ Agregar punto</button>
        </form>
        <div style={{ overflowX: 'auto', marginBottom: 24 }}>
          <table className="spreadsheet-table">
            <thead>
              <tr>
                <th>Punto</th>
                <th>Plano</th>
                <th>Area</th>
                <th>Estado</th>
                <th>Material usado</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {applyFilters(masterPoints.filter(pt => pt.projectId === project.id))
                .map(pt => {
                const planLocal = (project.floorplans || []).find(fp => fp.id === pt.planId);
                const planMaster = floorPlans.find(fp => fp.id === pt.planId || fp.projectId === project.id);
                const planLabel = planLocal ? (planLocal.name || 'Plano') : (planMaster ? `${planMaster.building || ''} ${planMaster.floor || ''}`.trim() : '-');
                const mats = materials.filter(m => m.pointId === pt.id);
                const totalMaterial = mats.reduce((acc, m) => acc + (parseFloat(m.quantityUsed) || 0), 0);
                return (
                  <tr key={pt.id}>
                    <td><input value={pt.label} onChange={e => dispatch({ type: 'pointsMaster/updatePoint', payload: { ...pt, label: e.target.value } })} /></td>
                    <td>
                      <select
                        value={pt.planId || ''}
                        onChange={e => dispatch({ type: 'pointsMaster/updatePoint', payload: { ...pt, planId: e.target.value } })}
                      >
                        <option value="">Sin plano</option>
                        {(project.floorplans || []).map(fp => (
                          <option key={`local-${fp.id}`} value={fp.id}>{fp.name}</option>
                        ))}
                        {floorPlans
                          .filter(fp => !project.floorplans?.some(l => l.id === fp.id))
                          .map(fp => (
                            <option key={`master-${fp.id}`} value={fp.id}>{`${fp.building || ''} ${fp.floor || ''}`.trim()}</option>
                          ))}
                      </select>
                    </td>
                    <td>
                      <input
                        value={pt.area || ''}
                        onChange={e => dispatch({ type: 'pointsMaster/updatePoint', payload: { ...pt, area: e.target.value } })}
                        placeholder="Área (ej. Sala 101)"
                      />
                    </td>
                    <td>
                      <select value={pt.status} onChange={e => dispatch({ type: 'pointsMaster/updatePoint', payload: { ...pt, status: e.target.value } })}>
                        <option value="not-started">No iniciado</option>
                        <option value="in-progress">En progreso</option>
                        <option value="problem">Problema</option>
                        <option value="pull">Cable jalado</option>
                        <option value="Certified">Certificado</option>
                      </select>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                        {/* Lista de materiales agregados */}
                        {mats.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginBottom: 4 }}>
                            {mats.map(m => (
                              <span 
                                key={m.id}
                                style={{ 
                                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                                  color: 'white',
                                  padding: '4px 8px',
                                  borderRadius: '6px',
                                  fontSize: '12px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: 4
                                }}
                              >
                                {m.materialType}: {m.quantityUsed}
                                <button
                                  onClick={() => dispatch({ type: 'materialsUsage/deleteMaterial', payload: m.id })}
                                  style={{ 
                                    background: 'rgba(255,255,255,0.2)',
                                    border: 'none',
                                    color: 'white',
                                    cursor: 'pointer',
                                    padding: '0 4px',
                                    borderRadius: '3px',
                                    fontSize: '10px'
                                  }}
                                >
                                  ✕
                                </button>
                              </span>
                            ))}
                          </div>
                        )}
                        {/* Form agregar material: texto + cantidad */}
                        <form onSubmit={ev => {
                          ev.preventDefault();
                          const qty = parseFloat(ev.target.qty.value);
                          const type = ev.target.material.value.trim();
                          if (!type || isNaN(qty) || qty <= 0) return;
                          dispatch({
                            type: 'materialsUsage/addMaterial',
                            payload: {
                              id: Date.now().toString(),
                              projectId: project.id,
                              pointId: pt.id,
                              materialType: type,
                              quantityUsed: qty,
                              unit: 'u',
                              technician: '',
                              dateUsed: new Date().toISOString().slice(0,10),
                              cost: 0,
                            }
                          });
                          ev.target.reset();
                        }} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <input name="material" placeholder="Material" style={{ width: 120 }} />
                          <input name="qty" type="number" step="0.1" min="0" placeholder="Cant." style={{ width: 80 }} />
                          <button type="submit">Agregar</button>
                        </form>
                      </div>
                    </td>
                    <td><button style={{ color: '#f56565' }} onClick={() => dispatch({ type: 'pointsMaster/deletePoint', payload: pt.id })}>🗑️</button></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p style={{ fontSize: 13, color: '#888' }}>Esta tabla resume el tracking informativo de todos los puntos del proyecto, enlazando planos, historial, hardware, materiales, comm rooms, modificaciones, reportes, aprobaciones y notificaciones.</p>
      </div>

      {/* Modal de filtros avanzados */}
      {showFilters && (
        <div className="modal-overlay" onClick={() => setShowFilters(false)}>
          <div className="modal modal-filters" onClick={e => e.stopPropagation()}>
            <h2>🔍 Filtros avanzados</h2>
            <div className="filter-form">
              <div className="form-group">
                <label>Buscar por punto o área</label>
                <input
                  type="text"
                  placeholder="Ej. 12345, Sala 101"
                  value={filters.search}
                  onChange={e => setFilters({ ...filters, search: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select value={filters.status} onChange={e => setFilters({ ...filters, status: e.target.value })}>
                  <option value="all">Todos</option>
                  <option value="not-started">No iniciado</option>
                  <option value="in-progress">En progreso</option>
                  <option value="problem">Problema</option>
                  <option value="pull">Cable jalado</option>
                  <option value="Certified">Certificado</option>
                </select>
              </div>
              <div className="form-group">
                <label>Plano</label>
                <select value={filters.plan} onChange={e => setFilters({ ...filters, plan: e.target.value })}>
                  <option value="all">Todos los planos</option>
                  {(project.floorplans || []).map(fp => (
                    <option key={`pf-${fp.id}`} value={fp.id}>{fp.name}</option>
                  ))}
                  {floorPlans
                    .filter(fp => !project.floorplans?.some(l => l.id === fp.id))
                    .map(fp => (
                      <option key={`mf-${fp.id}`} value={fp.id}>{`${fp.building || ''} ${fp.floor || ''}`.trim() || 'Plano'}</option>
                    ))}
                </select>
              </div>
              <div className="form-group">
                <label>Edificio</label>
                <input
                  type="text"
                  placeholder="Ej. Edificio A"
                  value={filters.building}
                  onChange={e => setFilters({ ...filters, building: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Sector / Área</label>
                <input
                  type="text"
                  placeholder="Ej. Piso 15, Oficina 101"
                  value={filters.sector}
                  onChange={e => setFilters({ ...filters, sector: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Material</label>
                <input
                  type="text"
                  placeholder="Ej. Cable, Fibra"
                  value={filters.material}
                  onChange={e => setFilters({ ...filters, material: e.target.value })}
                />
              </div>
              {filters.material && (
                <div className="form-group-row">
                  <div className="form-group">
                    <label>Cantidad mínima</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Min"
                      value={filters.quantityMin}
                      onChange={e => setFilters({ ...filters, quantityMin: e.target.value })}
                    />
                  </div>
                  <div className="form-group">
                    <label>Cantidad máxima</label>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="Max"
                      value={filters.quantityMax}
                      onChange={e => setFilters({ ...filters, quantityMax: e.target.value })}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="modal-actions">
              <button className="btn-cancel" onClick={() => setShowFilters(false)}>Cerrar</button>
              <button className="btn-clear" onClick={clearFilters}>Limpiar todo</button>
              <button className="btn-primary" onClick={() => setShowFilters(false)}>Aplicar</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de edición de proyecto */}
      {showEditModal && (
        <div className="modal-overlay" onClick={() => setShowEditModal(false)}>
          <div className="modal modal-edit-project" onClick={e => e.stopPropagation()}>
            <h2>✏️ Editar Proyecto</h2>
            <form onSubmit={handleEditSubmit} className="edit-project-form">
              <div className="form-group">
                <label>Nombre del proyecto</label>
                <input
                  type="text"
                  value={editForm.name}
                  onChange={e => setEditForm({ ...editForm, name: e.target.value })}
                  required
                />
              </div>
              <div className="form-group">
                <label>Descripción</label>
                <textarea
                  value={editForm.description}
                  onChange={e => setEditForm({ ...editForm, description: e.target.value })}
                  rows="3"
                />
              </div>
              <div className="form-group">
                <label>Cliente</label>
                <input
                  type="text"
                  value={editForm.clientName}
                  onChange={e => setEditForm({ ...editForm, clientName: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Ubicación</label>
                <input
                  type="text"
                  value={editForm.siteAddress}
                  onChange={e => setEditForm({ ...editForm, siteAddress: e.target.value })}
                />
              </div>
              <div className="form-group">
                <label>Estado</label>
                <select
                  value={editForm.status}
                  onChange={e => setEditForm({ ...editForm, status: e.target.value })}
                >
                  <option value="planning">Planning</option>
                  <option value="in-progress">In Progress</option>
                  <option value="completed">Completed</option>
                </select>
              </div>
              <div className="form-group">
                <label>Fecha de inicio</label>
                <input
                  type="date"
                  value={editForm.startDate}
                  onChange={e => setEditForm({ ...editForm, startDate: e.target.value })}
                />
              </div>
              
              <div className="form-group-row">
                <div className="form-group">
                  <label>Porcentaje de progreso (%)</label>
                  <input
                    type="number"
                    min="0"
                    max="100"
                    value={editForm.completionPercentage}
                    readOnly
                    disabled
                    style={{ backgroundColor: '#f7fafc', cursor: 'not-allowed' }}
                    title="Se calcula automáticamente según los puntos"
                  />
                </div>
                <div className="form-group">
                  <label>Total de puntos</label>
                  <input
                    type="number"
                    min="0"
                    value={editForm.totalPoints}
                    onChange={e => updateProgressPoints('totalPoints', e.target.value)}
                  />
                </div>
                <div className="form-group">
                  <label>Puntos completados</label>
                  <input
                    type="number"
                    min="0"
                    max={editForm.totalPoints}
                    value={editForm.completedPoints}
                    onChange={e => updateProgressPoints('completedPoints', e.target.value)}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" className="btn-cancel" onClick={() => setShowEditModal(false)}>Cancelar</button>
                <button type="submit" className="btn-primary">Guardar cambios</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

