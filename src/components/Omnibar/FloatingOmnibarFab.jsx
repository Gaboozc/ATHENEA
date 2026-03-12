import React, { useState, useRef, useEffect } from 'react';
import { useOmnibar } from './useOmnibar';
import athenaLogo from '../../assets/img/Athena-logo.png';
import './FloatingOmnibarFab.css';

/**
 * Floating Action Button (FAB) for ATHENEA Omnibar
 * Features:
 * - Draggable across viewport (touch + mouse)
 * - Position persisted to localStorage
 * - Long-press (1s) to toggle visibility
 * - Constraint to viewport bounds
 */
export const FloatingOmnibarFab = ({ highInsightsCount = 0 }) => {
  const { openOmnibar } = useOmnibar();
  const buttonRef = useRef(null);
  const FAB_SIZE = 82;
  const FAB_MARGIN = 12;
  const FAB_TOP_SAFE = 72;
  const FAB_BOTTOM_SAFE = 92;

  const getDefaultPosition = () => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;
    return {
      x: Math.max(FAB_MARGIN, viewportWidth - FAB_SIZE - FAB_MARGIN),
      y: Math.max(FAB_TOP_SAFE, viewportHeight - FAB_SIZE - FAB_BOTTOM_SAFE),
    };
  };

  const constrainPosition = (x, y) => {
    const viewportWidth = window.innerWidth;
    const viewportHeight = window.innerHeight;

    return {
      x: Math.max(FAB_MARGIN, Math.min(x, viewportWidth - FAB_SIZE - FAB_MARGIN)),
      y: Math.max(FAB_TOP_SAFE, Math.min(y, viewportHeight - FAB_SIZE - FAB_MARGIN)),
    };
  };

  const [position, setPosition] = useState(getDefaultPosition);
  const [isDragging, setIsDragging] = useState(false);
  const [isHidden, setIsHidden] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const longPressTimerRef = useRef(null);
  const isClickRef = useRef(false);

  // Load position from localStorage on mount
  useEffect(() => {
    try {
      const saved = localStorage.getItem('athenea.fab.position');
      if (saved) {
        const parsed = JSON.parse(saved);
        const safe = constrainPosition(Number(parsed?.x || 0), Number(parsed?.y || 0));
        setPosition(safe);
      } else {
        setPosition(getDefaultPosition());
      }
      const hidden = localStorage.getItem('athenea.fab.hidden');
      setIsHidden(hidden === 'true');
    } catch (e) {
      console.warn('Failed to load FAB position from localStorage:', e);
    }

    // Listen for visibility changes from FABShowToggle
    const handleFabToggle = () => {
      try {
        const hidden = localStorage.getItem('athenea.fab.hidden');
        setIsHidden(hidden === 'true');
      } catch (e) {
        console.warn('Failed to sync FAB hidden state:', e);
      }
    };

    window.addEventListener('athenea:fab-toggled', handleFabToggle);
    return () => {
      window.removeEventListener('athenea:fab-toggled', handleFabToggle);
    };
  }, []);

  // Keep FAB visible after orientation/viewport changes.
  useEffect(() => {
    const handleResize = () => {
      setPosition((prev) => constrainPosition(prev.x, prev.y));
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Save position to localStorage whenever it changes
  useEffect(() => {
    try {
      localStorage.setItem('athenea.fab.position', JSON.stringify(position));
    } catch (e) {
      console.warn('Failed to save FAB position to localStorage:', e);
    }
  }, [position]);

  // Save hidden state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem('athenea.fab.hidden', String(isHidden));
      // Notify other components (FABShowToggle) that fab visibility changed
      window.dispatchEvent(new Event('athenea:fab-toggled'));
    } catch (e) {
      console.warn('Failed to save FAB hidden state to localStorage:', e);
    }
  }, [isHidden]);

  useEffect(() => {
    return () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
    };
  }, []);

  const handleMouseDown = (e) => {
    // Prevent text selection during drag
    e.preventDefault();
    
    isClickRef.current = true;

    // Start long-press timer for hide toggle
    longPressTimerRef.current = setTimeout(() => {
      setIsHidden(prev => !prev);
      isClickRef.current = false;
    }, 1000);

    // Start dragging
    setIsDragging(true);
    setDragStart({
      x: e.clientX - position.x,
      y: e.clientY - position.y
    });
  };

  const handleTouchStart = (e) => {
    const touch = e.touches[0];
    
    isClickRef.current = true;

    // Start long-press timer for hide toggle
    longPressTimerRef.current = setTimeout(() => {
      setIsHidden(prev => !prev);
      isClickRef.current = false;
    }, 1000);

    // Start dragging
    setIsDragging(true);
    setDragStart({
      x: touch.clientX - position.x,
      y: touch.clientY - position.y
    });
  };

  useEffect(() => {
    if (!isDragging) return;

    const DEAD_ZONE = 5; // pixels allowed before considering it a drag
    let hasMoved = false;

    const handleMouseMove = (e) => {
      const newX = e.clientX - dragStart.x;
      const newY = e.clientY - dragStart.y;
      
      // Check if movement exceeds dead zone
      const distMoved = Math.sqrt(
        Math.pow(newX - position.x, 2) + 
        Math.pow(newY - position.y, 2)
      );
      
      if (distMoved > DEAD_ZONE) {
        hasMoved = true;
        isClickRef.current = false;
      }

      if (hasMoved) {
        // Constrain to viewport bounds
        const constrainedPos = constrainPosition(newX, newY);
        setPosition(constrainedPos);
      }
    };

    const handleMouseUp = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setIsDragging(false);
      hasMoved = false;
    };

    const handleTouchMove = (e) => {
      const touch = e.touches[0];
      const newX = touch.clientX - dragStart.x;
      const newY = touch.clientY - dragStart.y;

      // Check if movement exceeds dead zone
      const distMoved = Math.sqrt(
        Math.pow(newX - position.x, 2) + 
        Math.pow(newY - position.y, 2)
      );
      
      if (distMoved > DEAD_ZONE) {
        hasMoved = true;
        isClickRef.current = false;
      }

      if (hasMoved) {
        e.preventDefault();
        // Constrain to viewport bounds
        const constrainedPos = constrainPosition(newX, newY);
        setPosition(constrainedPos);
      }
    };

    const handleTouchEnd = () => {
      if (longPressTimerRef.current) {
        clearTimeout(longPressTimerRef.current);
        longPressTimerRef.current = null;
      }
      setIsDragging(false);
      hasMoved = false;
    };

    // Attach listeners to window to capture outside movements
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('touchend', handleTouchEnd);
    };
  }, [isDragging, dragStart, position]);

  const handleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    
    // Only open if not dragging and is a click (not long press)
    if (!isDragging && isClickRef.current) {
      openOmnibar();
    }
  };

  if (isHidden) {
    return null;
  }

  return (
    <button
      ref={buttonRef}
      type="button"
      className={`omnibar-fab ${highInsightsCount > 0 ? 'has-alert' : ''}`}
      onClick={handleClick}
      onMouseDown={handleMouseDown}
      onTouchStart={handleTouchStart}
      aria-label="Open Athenea Omnibar"
      style={{
        transform: `translate(${position.x}px, ${position.y}px)`,
        cursor: isDragging ? 'grabbing' : 'grab'
      }}
      title="Drag to move · Long-press to hide"
    >
      <img className="omnibar-fab-logo" src={athenaLogo} alt="Athenea" />
      {highInsightsCount > 0 && (
        <span className="omnibar-fab-badge">{highInsightsCount > 9 ? '9+' : highInsightsCount}</span>
      )}
    </button>
  );
};
