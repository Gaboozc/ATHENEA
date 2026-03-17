/* FIX UX-9 — Unified modal close pattern */
import { useEffect } from 'react';

const useModalClose = (onClose: () => void) => {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) onClose();
  };

  return { handleBackdropClick };
};

export default useModalClose;
