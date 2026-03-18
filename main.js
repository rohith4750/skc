const { app, BrowserWindow, shell } = require('electron');
const path = require('path');

let mainWindow;
let splash;

function createSplashScreen() {
  splash = new BrowserWindow({
    width: 500,
    height: 300,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true
    }
  });

  // Simple inline HTML for splash screen
  splash.loadURL(`data:text/html;charset=utf-8,
    <style>
      body { font-family: sans-serif; background: #fff; display: flex; flex-direction: column; justify-content: center; align-items: center; border-radius: 10px; border: 1px solid #ddd; }
      h1 { color: #c2410c; margin-bottom: 5px; }
      p { color: #666; font-size: 14px; }
      .loader { border: 4px solid #f3f3f3; border-top: 4px solid #c2410c; border-radius: 50%; width: 30px; height: 30px; animation: spin 1s linear infinite; margin-top: 10px; }
      @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    </style>
    <body>
      <h1>SKC Caterers</h1>
      <p>Initializing Desktop App...</p>
      <div class="loader"></div>
    </body>
  `);
}

function createMainWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    show: false, // Don't show until ready-to-show
    title: 'SKC Caterers',
    icon: path.join(__dirname, 'public/images/logo-dark.png'),
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  // Load the hosted URL
  const targetUrl = 'https://www.skccaterers.in';
  mainWindow.loadURL(targetUrl);

  // Handle loading failures (offline status)
  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`Page failed to load: ${errorDescription} (${errorCode})`);
    // Load offline fallback if not a cancellation or specific ignore-able error
    if (errorCode !== -3) { // -3 is aborted
       mainWindow.loadFile(path.join(__dirname, 'offline.html'));
    }
  });

  // Show window when content is loaded
  mainWindow.once('ready-to-show', () => {
    if (splash) {
      splash.close();
    }
    mainWindow.show();
    mainWindow.maximize();
  });

  // Open external links in the default browser
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('https://www.skccaterers.in')) {
      return { action: 'allow' };
    }
    shell.openExternal(url);
    return { action: 'deny' };
  });

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// App lifecycle
app.on('ready', () => {
  createSplashScreen();
  createMainWindow();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (mainWindow === null) {
    createMainWindow();
  }
});
