const { app, BrowserWindow } = require('electron');
const isDev = require('electron-is-dev');
const path = require('path');
const { spawn } = require('child_process');
let mainWindow;
let serverProcess;

// Функция для запуска Next.js сервера
function startServer() {
  const nextApp = isDev 
    ? 'npm'
    : path.join(process.resourcesPath, 'app/node_modules/.bin/next');
  
  const args = isDev 
    ? ['run', 'dev'] 
    : ['start'];

  serverProcess = spawn(nextApp, args, {
    stdio: 'pipe',
    shell: true
  });

  serverProcess.stdout.on('data', (data) => {
    console.log(`Next.js: ${data}`);
  });

  serverProcess.stderr.on('data', (data) => {
    console.error(`Next.js Error: ${data}`);
  });
}

function createWindow() {
  // Создаем окно браузера
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  // Загружаем приложение
  const startUrl = isDev
    ? 'http://localhost:3000'
    : 'http://localhost:3000';

  // Ждем 2 секунды, чтобы сервер успел запуститься
  setTimeout(() => {
    mainWindow.loadURL(startUrl);
  }, 2000);

  // Открываем DevTools в режиме разработки
  if (isDev) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.on('ready', () => {
  startServer();
  createWindow();
});

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

app.on('before-quit', () => {
  if (serverProcess) {
    serverProcess.kill();
  }
}); 