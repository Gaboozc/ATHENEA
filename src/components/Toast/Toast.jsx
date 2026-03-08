import { useState, useEffect } from 'react';
import './Toast.css';

/**
 * Toast Component
 * 
 * Lightweight notification system for user feedback.
 * - Auto-dismisses after 3 seconds
 * - Stacks vertically
 * - Supports success, error, warning, info types
 */

let toastId = 0;
let toastQueue = [];
const toastListeners = new Set();

function notifyToastListeners() {
  const snapshot = [...toastQueue];
  toastListeners.forEach((listener) => listener(snapshot));
}

function dismissToast(id) {
  toastQueue = toastQueue.filter((toast) => toast.id !== id);
  notifyToastListeners();
}

export const showToast = (message, type = 'success', duration = 3000, icon = null) => {
  const id = ++toastId;
  const toast = { id, message, type, icon, duration };

  toastQueue = [...toastQueue, toast];
  notifyToastListeners();

  window.setTimeout(() => {
    dismissToast(id);
  }, duration);

  return id;
};

/**
 * useToasts Hook
 * Manages toast notifications across the app
 */
export const useToasts = () => {
  const [toasts, setToasts] = useState([...toastQueue]);

  useEffect(() => {
    const handleToastUpdate = (nextToasts) => {
      setToasts(nextToasts);
    };

    toastListeners.add(handleToastUpdate);
    return () => toastListeners.delete(handleToastUpdate);
  }, []);

  return {
    success: (msg, duration, icon) => showToast(msg, 'success', duration, icon),
    error: (msg, duration, icon) => showToast(msg, 'error', duration, icon),
    warning: (msg, duration, icon) => showToast(msg, 'warning', duration, icon),
    info: (msg, duration, icon) => showToast(msg, 'info', duration, icon),
  };
};

/**
 * Toast Container Component
 * 
 * Renders all active toasts. Place this once in your root layout.
 * 
 * Usage:
 * ```jsx
 * import { ToastContainer } from '@/components/Toast';
 * 
 * export function App() {
 *   return (
 *     <>
 *       <Layout />
 *       <ToastContainer />
 *     </>
 *   );
 * }
 * ```
 */
export const ToastContainer = () => {
  const [toasts, setToasts] = useState([...toastQueue]);

  useEffect(() => {
    const handleToastUpdate = (nextToasts) => {
      setToasts(nextToasts);
    };

    toastListeners.add(handleToastUpdate);
    return () => toastListeners.delete(handleToastUpdate);
  }, []);

  return (
    <div className="toast-container">
      {toasts.map(toast => (
        <ToastItem
          key={toast.id}
          {...toast}
          onDismiss={() => dismissToast(toast.id)}
        />
      ))}
    </div>
  );
};

/**
 * Individual Toast Item
 */
const ToastItem = ({ id, message, type, icon, onDismiss }) => {
  useEffect(() => {
    const timer = setTimeout(onDismiss, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  const typeConfig = {
    success: { icon: '✓', bgClass: 'toast-success' },
    error: { icon: '✕', bgClass: 'toast-error' },
    warning: { icon: '⚠', bgClass: 'toast-warning' },
    info: { icon: 'ℹ', bgClass: 'toast-info' },
  };

  const config = typeConfig[type] || typeConfig.info;

  return (
    <div className={`toast ${config.bgClass} toast-enter`}>
      <span className="toast-icon">{icon || config.icon}</span>
      <span className="toast-message">{message}</span>
      <button type="button" className="toast-close" onClick={onDismiss}>x</button>
    </div>
  );
};

export default ToastContainer;
