const { app, BrowserWindow, Menu } = require('electron');
const path = require('path');
const isDev = require('electron-is-dev');
const { spawn } = require('child_process');

let mainWindow;
let backendProcess;

// Backend sunucusunu başlat
function startBackend() {
  const backendPath = isDev 
    ? path.join(__dirname, '../../backend') 
    : path.join(process.resourcesPath, 'backend');
  
  const pythonCmd = process.platform === 'win32' ? 'python' : 'python3';
  
  backendProcess = spawn(pythonCmd, ['-m', 'uvicorn', 'main:app', '--host', '127.0.0.1', '--port', '8000'], {
    cwd: backendPath,
    stdio: 'pipe'
  });

  backendProcess.stdout.on('data', (data) => {
    console.log(`Backend: ${data}`);
  });

  backendProcess.stderr.on('data', (data) => {
    console.log(`Backend Error: ${data}`);
  });

  backendProcess.on('close', (code) => {
    console.log(`Backend process exited with code ${code}`);
  });
}

function createWindow() {
  // Ana pencereyi oluştur
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 700,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false,
      webSecurity: true
    },
    icon: path.join(__dirname, 'favicon.ico'),
    show: false, // Başlangıçta gizli
    titleBarStyle: 'default',
    title: "Reddy's Cafe - Cafe Yönetim Sistemi"
  });

  // Backend başladıktan sonra frontend'i yükle
  setTimeout(() => {
    const startUrl = isDev 
      ? 'http://localhost:3000' 
      : `file://${path.join(__dirname, '../build/index.html')}`;
    
    mainWindow.loadURL(startUrl);
    
    // Pencereyi göster
    mainWindow.once('ready-to-show', () => {
      mainWindow.show();
      
      // Development modunda DevTools'u aç
      if (isDev) {
        // mainWindow.webContents.openDevTools();
      }
    });
  }, 3000); // Backend'in başlaması için bekle

  // Pencere kapatıldığında
  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

// Menü çubuğunu kaldır (opsiyonel)
app.whenReady().then(() => {
  Menu.setApplicationMenu(null);
  
  // Backend'i başlat
  startBackend();
  
  // Ana pencereyi oluştur
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

// Tüm pencereler kapatıldığında uygulamayı kapat
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// Uygulama kapatılırken backend'i de kapat
app.on('before-quit', () => {
  if (backendProcess) {
    backendProcess.kill();
  }
});

// macOS için
app.on('activate', () => {
  if (mainWindow === null) {
    createWindow();
  }
}); 