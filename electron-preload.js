const { contextBridge, ipcRenderer } = require('electron');

// Exponer APIs seguras a React
contextBridge.exposeInMainWorld('electronAPI', {
  // Abrir URLs externas (Spotify, YouTube, etc.)
  openExternal: (url) => ipcRenderer.invoke('open-external', url),

  // Abrir apps del sistema
  openApp: (appName) => ipcRenderer.invoke('open-app', appName),

  // Auto-inicio con Windows
  setAutoLaunch: (enable) => ipcRenderer.invoke('set-auto-launch', enable),
  getAutoLaunch: () => ipcRenderer.invoke('get-auto-launch'),

  // Sync desktop-mobile por red local
  startSyncServer: (data) => ipcRenderer.invoke('start-sync-server', data),
  stopSyncServer: () => ipcRenderer.invoke('stop-sync-server'),

  // Detectar si estamos en Electron
  isElectron: true,

  // Escuchar eventos desde el main process
  onOpenBriefing: (callback) => {
    ipcRenderer.on('open-briefing', callback);
    return () => ipcRenderer.removeListener('open-briefing', callback);
  }
});
