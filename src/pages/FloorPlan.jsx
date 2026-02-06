import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useSelector, useDispatch } from 'react-redux';
import PdfInAppViewer from '../components/PdfInAppViewer';
import TrackingSheetOverlay from '../components/TrackingSheetOverlay';
import { updateProject } from '../store/slices/projectsSlice';
import './FloorPlan.css';

export const FloorPlan = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const project = useSelector((state) => 
    state.projects.projects.find((p) => p.id === id)
  );
  const floorplans = project?.floorplans || [];
  const [selectedId, setSelectedId] = useState('');
  // Always select first available floorplan if none selected
  const selectedPlan = floorplans.find(p => p.id === selectedId) || floorplans[0] || null;

  // If project not found, show not found
  if (!project) {
    return (
      <div className="not-found">
        <h2>Project not found</h2>
        <button onClick={() => navigate('/projects')}>Back to Projects</button>
      </div>
    );
  }
  // If project exists but no floorplans, show message
  if (floorplans.length === 0) {
    return (
      <div className="legend" style={{ marginTop: 12 }}>
        <div>No floor plans uploaded yet. Go to Project Details to upload a PDF.</div>
      </div>
    );
  }

  return (
    <div className="floorplan-container">
      <div className="floorplan-header">
        <button className="back-btn" onClick={() => navigate(`/projects/${id}`)}>
          ← Back
        </button>
        <h1>{project.name} - Floor Plans</h1>
        <div className="header-actions"></div>
      </div>
      {/* Plan selector */}
      {floorplans.length > 0 ? (
        <div className="controls" style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <label style={{ fontWeight: 600 }}>Select plan:</label>
          <select value={selectedId} onChange={e => setSelectedId(e.target.value)}>
            {floorplans.map(fp => (
              <option key={fp.id} value={fp.id}>{fp.name}</option>
            ))}
          </select>
        </div>
      ) : (
        <div className="legend" style={{ marginTop: 12 }}>
          <div>No floor plans uploaded yet. Go to Project Details to upload a PDF.</div>
        </div>
      )}

      {/* PDF viewer with overlay marks */}
      {selectedPlan && (
        <div style={{ marginTop: 12 }}>
          <PdfInAppViewer dataUrl={selectedPlan.data}>
            {(props) => (
              <TrackingSheetOverlay
                plan={selectedPlan}
                projectId={project.id}
                zoom={props.zoom}
                adding={props.adding}
                setAdding={props.setAdding}
                pendingMarkState={props.pendingMarkState}
                setPendingMarkState={props.setPendingMarkState}
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
            )}
          </PdfInAppViewer>
        </div>
      )}
    </div>
  );
};
