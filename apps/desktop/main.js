const { app, BrowserWindow, Menu, dialog } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 1024,
    minHeight: 768,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      // Enable local storage persistence
      partition: 'persist:dinesmart-staff'
    },
    icon: path.join(__dirname, 'icon.ico'),
    show: false // Wait for ready-to-show
  });

  // Load the application
  // During development, it loads the local Vite server.
  // In production, it loads your live Staff Portal URL.
  // UPDATE THIS URL TO YOUR ACTUAL PRODUCTION DOMAIN:
  const targetUrl = isDev 
    ? 'http://localhost:5174' 
    : 'https://dinesmart-staff-production.up.railway.app'; // <--- Update to your actual render/railway URL

  mainWindow.loadURL(targetUrl).catch((err) => {
    console.error('Failed to load URL:', err);
    dialog.showErrorBox(
      'Connection Error', 
      `Failed to connect to the DineSmart server at ${targetUrl}.\n\nPlease ensure you are connected to the internet and the server is running.`
    );
  });

  // Gracefully show the window when it's ready
  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize();
    mainWindow.show();
  });

  // Build the native menu
  const template = [
    {
      label: 'DineSmart',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    },
    {
      label: 'View',
      submenu: [
        { role: 'reload' },
        { role: 'forceReload' },
        { role: 'toggleDevTools' },
        { type: 'separator' },
        { role: 'resetZoom' },
        { role: 'zoomIn' },
        { role: 'zoomOut' },
        { type: 'separator' },
        { role: 'togglefullscreen' }
      ]
    }
  ];

  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
});
