const { app, BrowserWindow, shell, ipcMain, Tray, Menu, nativeImage } = require('electron');
const path = require('path');
const http = require('http');
const os = require('os');

let mainWindow = null;
let tray = null;
let syncServer = null;
let syncData = null;

function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name] || []) {
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Auto-inicio con Windows
function setupAutoLaunch() {
  // Solo en producción (evita registrar auto-inicio en electron-dev)
  if (!app.isPackaged || process.env.NODE_ENV === 'development') return;

  app.setLoginItemSettings({
    openAtLogin: true,
    openAsHidden: false,
    name: 'ATHENEA',
    args: []
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 900,
    minWidth: 800,
    minHeight: 600,
    title: 'ATHENEA',
    // Usar el icono multi-resolucion para Windows
    icon: path.join(__dirname, 'src', 'assets', 'img', 'athenea.ico'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'electron-preload.js'),
      // Permitir conexiones a Ollama local
      webSecurity: false,
    },
    // Sin frame nativo — ATHENEA tiene su propio diseño
    frame: true,
    backgroundColor: '#0a0d12',
    show: false, // No mostrar hasta que cargue
  });

  // Cargar la app
  const isDev = process.env.NODE_ENV === 'development';
  if (isDev) {
    mainWindow.loadURL('http://localhost:3000');
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, 'dist', 'index.html'));
  }

  // Mostrar cuando esté listo (evita flash blanco)
  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  // Al cerrar → minimizar al tray en lugar de cerrar
  mainWindow.on('close', (e) => {
    if (!app.isQuitting) {
      e.preventDefault();
      mainWindow.hide();
    }
  });
}

function createTray() {
  // Ícono del tray
  const iconPath = path.join(__dirname, 'src', 'assets', 'img', 'athenea.ico');
  const icon = nativeImage.createFromPath(iconPath);
  tray = new Tray(icon);

  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Abrir ATHENEA',
      click: () => {
        mainWindow.show();
        mainWindow.focus();
      }
    },
    {
      label: 'Daily Briefing',
      click: async () => {
        mainWindow.show();
        mainWindow.focus();
        try {
          const onboardingDone = await mainWindow.webContents.executeJavaScript(
            "localStorage.getItem('athenea.onboarding.completed') === 'true'"
          );
          if (onboardingDone) {
            mainWindow.webContents.send('open-briefing');
          }
        } catch {
          // Ignore: if onboarding state can't be read, skip briefing open.
        }
      }
    },
    {
      label: 'Iniciar con Windows',
      type: 'checkbox',
      checked: app.getLoginItemSettings().openAtLogin,
      click: (menuItem) => {
        app.setLoginItemSettings({
          openAtLogin: menuItem.checked,
          openAsHidden: false,
          name: 'ATHENEA',
          args: []
        });
      }
    },
    { type: 'separator' },
    {
      label: 'Salir',
      click: () => {
        app.isQuitting = true;
        app.quit();
      }
    }
  ]);

  tray.setToolTip('ATHENEA');
  tray.setContextMenu(contextMenu);

  // Doble clic en tray → abrir ventana
  tray.on('double-click', () => {
    mainWindow.show();
    mainWindow.focus();
  });
}

// Comando para abrir URLs externas (Spotify, Chrome, etc.)
ipcMain.handle('open-external', async (event, url) => {
  await shell.openExternal(url);
  return true;
});

// Comando para abrir apps del sistema
ipcMain.handle('open-app', async (event, appName) => {
  const { exec } = require('child_process');
  const handlers = {
    spotify: () => shell.openExternal('spotify:'),
    youtube: () => shell.openExternal('https://youtube.com'),
    chrome: () => exec('start chrome'),
    explorer: () => exec('explorer'),
    calculator: () => exec('calc'),
    notepad: () => exec('notepad'),
  };
  const normalizedName = String(appName || '').toLowerCase();
  const handler = handlers[normalizedName];
  if (handler) {
    await handler();
    return true;
  }
  if (String(appName || '').startsWith('http')) {
    await shell.openExternal(appName);
    return true;
  }
  return false;
});

ipcMain.handle('set-auto-launch', async (event, enable) => {
  app.setLoginItemSettings({
    openAtLogin: !!enable,
    openAsHidden: false,
    name: 'ATHENEA',
    args: []
  });
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('get-auto-launch', async () => {
  return app.getLoginItemSettings().openAtLogin;
});

ipcMain.handle('start-sync-server', async (event, data) => {
  if (syncServer) {
    syncServer.close();
    syncServer = null;
  }

  syncData = data;
  const port = 7432;
  const ip = getLocalIP();

  syncServer = http.createServer((req, res) => {
    if (req.url === '/sync') {
      res.writeHead(200, {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
      });
      res.end(syncData || '{}');
      return;
    }

    res.writeHead(404);
    res.end('Not found');
  });

  await new Promise((resolve) => {
    syncServer.listen(port, '0.0.0.0', resolve);
  });

  return { ip, port, url: `http://${ip}:${port}/sync` };
});

ipcMain.handle('stop-sync-server', async () => {
  if (syncServer) {
    await new Promise((resolve) => syncServer.close(resolve));
    syncServer = null;
    syncData = null;
  }
  return true;
});

app.whenReady().then(() => {
  createWindow();
  createTray();
  setupAutoLaunch();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    // No cerrar — solo minimizar al tray
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  if (syncServer) {
    syncServer.close();
    syncServer = null;
    syncData = null;
  }
  app.isQuitting = true;
});
