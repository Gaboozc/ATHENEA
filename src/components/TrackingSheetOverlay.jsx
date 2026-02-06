import React, { useRef, useState } from 'react';

function TrackingSheetOverlay({ plan, projectId, onUpdateMarks, adding, setAdding, pendingMarkState, setPendingMarkState, zoom = 1 }) {
  const [dragId, setDragId] = useState(null);
  const overlayRef = useRef();
  const [newMark, setNewMark] = useState({ x: 0, y: 0 });

  const MARK_STATES = [
    { value: 'not-started', label: 'Not started', color: '#a0aec0' },
    { value: 'in-progress', label: 'In progress', color: '#4299e1' },
    { value: 'problem', label: 'Problem', color: '#f56565' },
    { value: 'pull', label: 'Cable pulled', color: '#805ad5' },
    { value: 'done', label: 'Completed', color: '#48bb78' },
  ];

  const handleOverlayClick = (e) => {
  if (!adding || !pendingMarkState) return;
  const rect = overlayRef.current.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;
    const mark = {
      id: Date.now().toString(),
      x,
      y,
      state: pendingMarkState,
      label: '',
    };
    onUpdateMarks([...(plan.marks || []), mark]);
    setAdding(false);
    setPendingMarkState(null);
  };

  const handleAddMark = (state) => {
    const mark = {
      id: Date.now().toString(),
      x: newMark.x,
      y: newMark.y,
      state,
      label: '',
    };
    onUpdateMarks([...(plan.marks || []), mark]);
    setAdding(false);
    setNewMark({ x: 0, y: 0 });
  };

  const handleStartDrag = (id, e) => {
    setDragId(id);
  };

  const handleDrag = (e) => {
    if (!dragId) return;
    const rect = overlayRef.current.getBoundingClientRect();
    const dx = ((e.clientX - rect.left) / rect.width) * 100;
    const dy = ((e.clientY - rect.top) / rect.height) * 100;
    onUpdateMarks((plan.marks || []).map(m =>
      m.id === dragId ? { ...m, x: dx, y: dy } : m
    ));
  };

  const handleEndDrag = () => {
    setDragId(null);
  };

  const handleChangeState = (id, state) => {
    onUpdateMarks((plan.marks || []).map(m =>
      m.id === id ? { ...m, state } : m
    ));
  };

  const handleDeleteMark = (id) => {
    onUpdateMarks((plan.marks || []).filter(m => m.id !== id));
  };

  return (
    <div
      ref={overlayRef}
      className="tracking-sheet-overlay"
      style={{ position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', pointerEvents: 'auto' }}
      onClick={handleOverlayClick}
      onMouseMove={handleDrag}
      onMouseUp={handleEndDrag}
    >
      {(plan.marks || []).map(mark => {
  const stateObj = MARK_STATES.find(s => s.value === mark.state);
  const scaledSize = 32; // Always same size regardless of zoom
        return (
          <div
            key={mark.id}
            className="tracking-mark"
            style={{
              position: 'absolute',
              left: `${mark.x}%`,
              top: `${mark.y}%`,
              transform: 'translate(-50%, -50%)',
              background: stateObj?.color || '#a0aec0',
              color: '#fff',
              borderRadius: '50%',
              width: scaledSize,
              height: scaledSize,
              fontSize: `${scaledSize * 0.7}px`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              zIndex: 10,
              boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
              border: '2px solid #fff',
            }}
            onMouseDown={e => handleStartDrag(mark.id, e)}
          >
            <span title={stateObj?.label}>{stateObj?.label?.charAt(0) || '?'}</span>
            <div className="mark-actions" style={{ position: 'absolute', top: scaledSize + 4, left: '50%', transform: 'translateX(-50%)', background: '#fff', color: '#222', borderRadius: 6, boxShadow: '0 2px 8px rgba(0,0,0,0.12)', padding: 4, display: 'flex', gap: 4 }}>
              <select value={mark.state} onChange={e => handleChangeState(mark.id, e.target.value)}>
                {MARK_STATES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
              <button onClick={() => handleDeleteMark(mark.id)} style={{ color: '#f56565', border: 'none', background: 'none', cursor: 'pointer' }}>🗑️</button>
            </div>
          </div>
        );
      })}
      {adding && (
        <div
          style={{
            position: 'absolute', left: 0, top: 0, width: '100%', height: '100%', zIndex: 20,
            pointerEvents: 'none',
          }}
        >
          {/* Mark will be placed on click, then show dropdown in toolbar */}
        </div>
      )}

    </div>
  );
}
export default TrackingSheetOverlay;
