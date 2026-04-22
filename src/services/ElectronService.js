// Detectar si estamos corriendo en Electron
export const isElectron = () => {
  return !!(window.electronAPI?.isElectron);
};

// Abrir URL externa (Spotify, YouTube, etc.)
export const openExternal = async (url) => {
  if (isElectron()) {
    return window.electronAPI.openExternal(url);
  }
  // Fallback web
  window.open(url, '_blank');
  return true;
};

// Abrir app del sistema por nombre
export const openApp = async (appName) => {
  if (isElectron()) {
    return window.electronAPI.openApp(appName);
  }
  // Fallback web
  const webFallbacks = {
    spotify: 'https://open.spotify.com',
    youtube: 'https://youtube.com',
    chrome: 'https://google.com',
  };
  const url = webFallbacks[appName.toLowerCase()];
  if (url) window.open(url, '_blank');
  return false;
};

// Escuchar el evento de abrir briefing desde el tray
export const onOpenBriefing = (callback) => {
  if (isElectron() && window.electronAPI?.onOpenBriefing) {
    return window.electronAPI.onOpenBriefing(callback);
  }
  return () => {};
};

export const startSyncServer = async (data) => {
  if (isElectron() && window.electronAPI?.startSyncServer) {
    return window.electronAPI.startSyncServer(data);
  }
  return null;
};

export const stopSyncServer = async () => {
  if (isElectron() && window.electronAPI?.stopSyncServer) {
    return window.electronAPI.stopSyncServer();
  }
  return true;
};
