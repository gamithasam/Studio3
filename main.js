const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const fontList = require('font-list');

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    }
  });

  win.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

ipcMain.handle('get-system-fonts', async () => {
  try {
    const fonts = await fontList.getFonts();
    return fonts.map(font => font.replace(/"/g, ''));
  } catch (error) {
    console.error('Error fetching fonts:', error);
    return [];
  }
});