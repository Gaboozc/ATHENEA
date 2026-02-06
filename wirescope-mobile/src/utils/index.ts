// Utility functions
export * from './validation';

// Constants
export const APP_CONFIG = {
  API_BASE_URL: __DEV__ ? 'http://localhost:3000/api' : 'https://api.wirescope.com',
  WEBSOCKET_URL: __DEV__ ? 'ws://localhost:3001' : 'wss://ws.wirescope.com',
  AUTH0_DOMAIN: 'your-auth0-domain.auth0.com',
  AUTH0_CLIENT_ID: 'your-auth0-client-id',
} as const;

export const STORAGE_KEYS = {
  AUTH_TOKEN: '@wirescope/auth_token',
  REFRESH_TOKEN: '@wirescope/refresh_token',
  USER_PROFILE: '@wirescope/user_profile',
  OFFLINE_DATA: '@wirescope/offline_data',
} as const;

export const POINT_TYPES = [
  { key: 'data', label: 'Data', color: '#2196F3' },
  { key: 'voice', label: 'Voice', color: '#4CAF50' },
  { key: 'video', label: 'Video', color: '#FF9800' },
  { key: 'power', label: 'Power', color: '#F44336' },
  { key: 'fiber', label: 'Fiber', color: '#9C27B0' },
] as const;

export const POINT_CATEGORIES = [
  { key: 'Cat5e', label: 'Cat 5e' },
  { key: 'Cat6', label: 'Cat 6' },
  { key: 'Cat6a', label: 'Cat 6a' },
  { key: 'Cat7', label: 'Cat 7' },
  { key: 'Fiber', label: 'Fiber Optic' },
  { key: 'Coax', label: 'Coaxial' },
] as const;

export const POINT_STATUSES = [
  { key: 'planned', label: 'Planned', color: 'secondary' },
  { key: 'installed', label: 'Installed', color: 'warning' },
  { key: 'tested', label: 'Tested', color: 'info' },
  { key: 'certified', label: 'Certified', color: 'success' },
  { key: 'failed', label: 'Failed', color: 'error' },
] as const;

// Helper functions
export const formatDate = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
};

export const formatDateTime = (date: Date | string): string => {
  const d = new Date(date);
  return d.toLocaleString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export const generateId = (): string => {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};