import React, { useState, useEffect } from 'react';
import './FABShowToggle.css';

/**
 * Permanent Small Toggle Button for FAB Visibility
 * - Only visible when FAB is hidden
 * - Allows user to unhide the FAB
 * - Located in bottom-right corner as small pill button
 */
export const FABShowToggle = () => {
  const [isHidden, setIsHidden] = useState(false);

  // Check localStorage on mount and when storage changes
  useEffect(() => {
    const checkHidden = () => {
      try {
        const hidden = localStorage.getItem('athenea.fab.hidden');
        setIsHidden(hidden === 'true');
      } catch (e) {
        console.warn('Failed to check FAB hidden state:', e);
      }
    };

    // Initial check
    checkHidden();

    // Listen for storage changes (from other tabs/components)
    window.addEventListener('storage', checkHidden);
    
    // Custom event listener for same-tab updates
    const handleFabToggle = () => checkHidden();
    window.addEventListener('athenea:fab-toggled', handleFabToggle);

    return () => {
      window.removeEventListener('storage', checkHidden);
      window.removeEventListener('athenea:fab-toggled', handleFabToggle);
    };
  }, []);

  const handleShowFab = () => {
    try {
      localStorage.setItem('athenea.fab.hidden', 'false');
      setIsHidden(false);
      // Dispatch custom event to notify other components
      window.dispatchEvent(new Event('athenea:fab-toggled'));
    } catch (e) {
      console.warn('Failed to show FAB:', e);
    }
  };

  // Only render when FAB is hidden
  if (!isHidden) {
    return null;
  }

  return (
    <button
      type="button"
      className="fab-show-toggle"
      onClick={handleShowFab}
      aria-label="Show Athenea Button"
      title="Show Athenea"
    >
      <span className="fab-show-toggle-icon">✦</span>
      <span className="fab-show-toggle-text">ATHENEA</span>
    </button>
  );
};
