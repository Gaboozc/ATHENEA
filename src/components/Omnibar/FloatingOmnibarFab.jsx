import React, { useState, useRef, useEffect } from 'react';
import { useOmnibar } from './useOmnibar';
import { useLanguage } from '../../context/LanguageContext';
import athenaLogo from '../../assets/img/Athena-logo.png';
import './FloatingOmnibarFab.css';

const FAB_SIZE = 82;
const FAB_MARGIN = 12;
const FAB_TOP_SAFE = 72;
const LONG_PRESS_MS = 900;
const DRAG_THRESHOLD = 8; // px before we consider it a drag

const constrainPosition = (x, y) => ({
  x: Math.max(FAB_MARGIN, Math.min(x, window.innerWidth - FAB_SIZE - FAB_MARGIN)),
  y: Math.max(FAB_TOP_SAFE, Math.min(y, window.innerHeight - FAB_SIZE - FAB_MARGIN)),
});

const getDefaultPosition = () =>
  constrainPosition(
    window.innerWidth - FAB_SIZE - FAB_MARGIN,
    window.innerHeight - FAB_SIZE - 92
  );

export const FloatingOmnibarFab = ({ highInsightsCount = 0 }) => {
  const { openOmnibar } = useOmnibar();
  const { t } = useLanguage();
  const buttonRef = useRef(null);

  const [position, setPosition] = useState(getDefaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isHidden, setIsHidden] = useState(false);

  // Pointer tracking refs — all synchronous, no React render cycle needed
  const pointerOrigin = useRef({ x: 0, y: 0 });   // pointer coords on pointerdown
  const posOrigin = useRef({ x: 0, y: 0 });         // fab position on pointerdown
  const hasDragged = useRef(false);
  const longPressTimer = useRef(null);
  const longPressFired = useRef(false);

  // Load persisted position + hidden state on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('athenea.fab.position');
      if (saved) {
        const parsed = JSON.parse(saved);
        setPosition(constrainPosition(Number(parsed?.x ?? 0), Number(parsed?.y ?? 0)));
      } else {
        setPosition(getDefaultPosition());
      }
      setIsHidden(localStorage.getItem('athenea.fab.hidden') === 'true');
    } catch { /* ignore */ }

    const onFabToggle = () => {
      setIsHidden(localStorage.getItem('athenea.fab.hidden') === 'true');
    };
    const onOpenOmnibar = () => openOmnibar();

    window.addEventListener('athenea:fab-toggled', onFabToggle);
    window.addEventListener('athenea:open-omnibar', onOpenOmnibar);
    return () => {
      window.removeEventListener('athenea:fab-toggled', onFabToggle);
      window.removeEventListener('athenea:open-omnibar', onOpenOmnibar);
    };
  }, [openOmnibar]);

  // Constrain on resize
  useEffect(() => {
    const onResize = () => setPosition(prev => constrainPosition(prev.x, prev.y));
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  // Persist position
  useEffect(() => {
    try { localStorage.setItem('athenea.fab.position', JSON.stringify(position)); } catch { /* ignore */ }
  }, [position]);

  // Persist hidden state
  useEffect(() => {
    try {
      localStorage.setItem('athenea.fab.hidden', String(isHidden));
      window.dispatchEvent(new Event('athenea:fab-toggled'));
    } catch { /* ignore */ }
  }, [isHidden]);

  const clearLongPress = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  const handlePointerDown = (e) => {
    // Only handle primary button (left click / first touch)
    if (e.button !== undefined && e.button !== 0) return;

    e.currentTarget.setPointerCapture(e.pointerId);

    hasDragged.current = false;
    longPressFired.current = false;
    pointerOrigin.current = { x: e.clientX, y: e.clientY };
    posOrigin.current = { ...position };

    setIsDragging(false);

    longPressTimer.current = setTimeout(() => {
      if (!hasDragged.current) {
        longPressFired.current = true;
        setIsHidden(prev => !prev);
      }
    }, LONG_PRESS_MS);
  };

  const handlePointerMove = (e) => {
    if (!e.currentTarget.hasPointerCapture(e.pointerId)) return;

    const dx = e.clientX - pointerOrigin.current.x;
    const dy = e.clientY - pointerOrigin.current.y;
    const dist = Math.sqrt(dx * dx + dy * dy);

    if (dist > DRAG_THRESHOLD) {
      hasDragged.current = true;
      clearLongPress();
      setIsDragging(true);
      setPosition(constrainPosition(posOrigin.current.x + dx, posOrigin.current.y + dy));
    }
  };

  const handlePointerUp = (e) => {
    clearLongPress();
    e.currentTarget.releasePointerCapture(e.pointerId);
    setIsDragging(false);

    // It was a clean tap/click — open the omnibar
    if (!hasDragged.current && !longPressFired.current) {
      openOmnibar();
    }

    hasDragged.current = false;
    longPressFired.current = false;
  };

  // Cleanup long press timer on unmount
  useEffect(() => () => clearLongPress(), []);

  if (isHidden) return null;

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`omnibar-fab ${highInsightsCount > 0 ? 'has-alert' : ''}`}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      aria-label="Open Athenea Omnibar"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab',
      }}
      title={t('fab.tooltip')}
    >
      <img className="omnibar-fab-logo" src={athenaLogo} alt="Athenea" />
      {highInsightsCount > 0 && (
        <span className="omnibar-fab-badge">{highInsightsCount > 9 ? '9+' : highInsightsCount}</span>
      )}
    </button>
  );
};
