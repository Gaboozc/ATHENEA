import React, { useEffect, useRef, useState } from 'react';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker.mjs?url';

pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;

export function PdfInAppViewer({ dataUrl, initialPage = 1, height = 600, children }) {
  const containerRef = useRef(null);
  const stageRef = useRef(null);
  const canvasRef = useRef(null);
  const [pdfDoc, setPdfDoc] = useState(null);
  const [numPages, setNumPages] = useState(0);
  const [pageNumber, setPageNumber] = useState(initialPage);
  const [zoom, setZoom] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [zoomInput, setZoomInput] = useState('100');
  const [adding, setAdding] = useState(false);
  const [pendingMarkState, setPendingMarkState] = useState(null);

  const toUint8Array = (dataUrlStr) => {
    try {
      const base64 = (dataUrlStr || '').split(',')[1];
      const binary = atob(base64);
      const len = binary.length;
      const bytes = new Uint8Array(len);
      for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
      return bytes;
    } catch (_) {
      return null;
    }
  };

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    setError('');
    setPdfDoc(null);
    setNumPages(0);
    setPageNumber(initialPage);
    try {
      const bytes = toUint8Array(dataUrl);
      if (!bytes) throw new Error('Invalid PDF data');
      const task = pdfjsLib.getDocument({ data: bytes });
      task.promise
        .then((doc) => {
          if (cancelled) return;
          setPdfDoc(doc);
          setNumPages(doc.numPages || 0);
          setLoading(false);
        })
        .catch((err) => {
          if (cancelled) return;
          setError(err?.message || 'Failed to load PDF');
          setLoading(false);
        });
    } catch (e) {
      setError(e?.message || 'Failed to read PDF');
      setLoading(false);
    }
    return () => { cancelled = true; };
  }, [dataUrl, initialPage]);

  const renderTaskRef = useRef(null);

  const renderPage = async () => {
    if (!pdfDoc || !containerRef.current || !canvasRef.current) return;
    const page = await pdfDoc.getPage(pageNumber);
    const rect = containerRef.current.getBoundingClientRect();
    const baseViewport = page.getViewport({ scale: 1 });
    const fitScale = Math.min(
      rect.width / baseViewport.width,
      height / baseViewport.height
    );

    // Split zoom: render up to maxRenderZoom; beyond that, apply CSS scaling to stage to avoid giant canvases
    const maxRenderZoom = 2; // render up to 2x of fit; the rest via CSS
    const effectiveZoom = Math.max(0.1, Math.min(zoom, maxRenderZoom));
    const cssScale = zoom / effectiveZoom;

    const dpr = Math.min(window.devicePixelRatio || 1, 2); // cap DPR to keep memory sane
    let renderScale = Math.max(0.1, fitScale * effectiveZoom);
    let viewport = page.getViewport({ scale: renderScale * dpr });

    // Cap maximum pixel area to avoid black tiles on some GPUs/browsers
    const MAX_PIXELS = 16000000; // 16 MP
    let pixelArea = Math.floor(viewport.width) * Math.floor(viewport.height);
    if (pixelArea > MAX_PIXELS) {
      const factor = Math.sqrt(MAX_PIXELS / pixelArea);
      renderScale = renderScale * factor;
      viewport = page.getViewport({ scale: renderScale * dpr });
    }

    const canvas = canvasRef.current;
    const context = canvas.getContext('2d', { alpha: false });

    // Set internal pixel buffer to viewport size
    canvas.width = Math.floor(viewport.width);
    canvas.height = Math.floor(viewport.height);

    // Match CSS size (in CSS pixels, not device pixels)
    const cssWidth = Math.floor(viewport.width / dpr);
    const cssHeight = Math.floor(viewport.height / dpr);
    canvas.style.width = `${cssWidth}px`;
    canvas.style.height = `${cssHeight}px`;

    if (stageRef.current) {
      stageRef.current.style.width = `${cssWidth}px`;
      stageRef.current.style.height = `${cssHeight}px`;
      stageRef.current.style.transformOrigin = 'top left';
      stageRef.current.style.transform = `scale(${cssScale})`;
    }

    // Ensure white background to avoid black flashes on partially painted frames
    context.save();
    context.fillStyle = '#ffffff';
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();

    // Cancel any in-flight render before starting a new one
    if (renderTaskRef.current && typeof renderTaskRef.current.cancel === 'function') {
      try { renderTaskRef.current.cancel(); } catch (_) {}
    }

    const task = page.render({ canvasContext: context, viewport, intent: 'display' });
    renderTaskRef.current = task;
    try {
      await task.promise;
    } catch (e) {
      // Ignore cancellation, rethrow others
      if ((e && e.name) !== 'RenderingCancelledException') {
        // eslint-disable-next-line no-console
        console.error('PDF render error:', e);
      }
    } finally {
      if (renderTaskRef.current === task) renderTaskRef.current = null;
    }
  };

  useEffect(() => { renderPage(); }, [pdfDoc, pageNumber, zoom]);
  useEffect(() => {
    // Sync input field with zoom percentage when zoom changes externally
    setZoomInput(String(Math.round(zoom * 100)));
  }, [zoom]);
  useEffect(() => {
    const onResize = () => renderPage();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, [pdfDoc, pageNumber, zoom]);

  const canPrev = pageNumber > 1;
  const canNext = pageNumber < numPages;
  const presets = [50, 75, 100, 125, 150, 200, 300, 400, 600, 800];
  const currentPct = Math.round(zoom * 100);
  const selectValue = presets.includes(currentPct) ? String(currentPct) : 'custom';

  const commitZoomFromInput = () => {
    const raw = parseInt(String(zoomInput).replace(/[^0-9]/g, ''), 10);
    if (isNaN(raw)) { setZoomInput(String(Math.round(zoom * 100))); return; }
    const clamped = Math.min(800, Math.max(25, raw));
    setZoom(clamped / 100);
    setZoomInput(String(clamped));
  };

  return (
    <div style={{ width: '100%' }}>
      <div className="pdf-toolbar" style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16, background: '#f7fafc', padding: '12px 20px', borderRadius: 8, boxShadow: '0 2px 8px rgba(102, 126, 234, 0.08)' }}>
        <button onClick={() => canPrev && setPageNumber(p => p - 1)} disabled={!canPrev} style={{ padding: '6px 10px' }}>◀ Prev</button>
        <span style={{ fontSize: 13, color: '#4a5568' }}>Page {pageNumber} / {numPages || '—'}</span>
        <button onClick={() => canNext && setPageNumber(p => p + 1)} disabled={!canNext} style={{ padding: '6px 10px' }}>Next ▶</button>
        <div style={{ width: 1, height: 20, background: '#e2e8f0', margin: '0 8px' }} />
        <label style={{ fontSize: 13, color: '#4a5568' }}>Zoom:</label>
        <select
          value={selectValue}
          onChange={e => {
            const val = e.target.value;
            if (val === 'custom') return;
            const pct = parseInt(val, 10);
            if (!isNaN(pct)) setZoom(pct / 100);
          }}
          style={{ padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}
        >
          {presets.map(p => (
            <option key={p} value={String(p)}>{p}%</option>
          ))}
          <option value="custom">Custom</option>
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <input
            type="number"
            min={25}
            max={800}
            step={5}
            value={zoomInput}
            onChange={e => setZoomInput(e.target.value)}
            onBlur={commitZoomFromInput}
            onKeyDown={e => { if (e.key === 'Enter') commitZoomFromInput(); }}
            style={{ width: 72, padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0' }}
          />
          <span style={{ fontSize: 13, color: '#718096' }}>%</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <button
            className="btn-add-point"
            style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: 'white', border: 'none', padding: '8px 18px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer', transition: 'all 0.3s ease', boxShadow: '0 2px 6px rgba(102, 126, 234, 0.18)' }}
            onClick={() => setAdding(a => !a)}
          >
            ➕ Add point
          </button>
          {adding && (
            <select
              style={{ marginLeft: 8, padding: '6px 8px', borderRadius: 6, border: '1px solid #e2e8f0', fontWeight: 600 }}
              defaultValue=""
              onChange={e => {
                if (e.target.value) {
                  setPendingMarkState(e.target.value);
                }
              }}
            >
              <option value="" disabled>Select status</option>
              <option value="not-started">Not started</option>
              <option value="in-progress">In progress</option>
              <option value="problem">Problem</option>
              <option value="pull">Cable pulled</option>
              <option value="done">Completed</option>
            </select>
          )}
        </div>
      </div>

      <div ref={containerRef} style={{ position: 'relative', width: '100%', height, background: '#f7fafc', borderRadius: 8, border: '1px solid #e2e8f0', overflow: 'auto', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loading && <div style={{ color: '#718096' }}>Loading PDF…</div>}
        {error && <div style={{ color: '#e53e3e' }}>Error: {error}</div>}
        {!loading && !error && (
          <div ref={stageRef} style={{ position: 'relative' }}>
            <canvas ref={canvasRef} style={{ display: 'block' }} />
            <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0 }}>
              {typeof children === 'function'
                ? children({ adding, setAdding, pendingMarkState, setPendingMarkState, zoom })
                : children}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default PdfInAppViewer;
