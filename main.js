const { app, BrowserWindow, ipcMain, Menu, dialog } = require('electron');
const path = require('path');
const fontList = require('font-list');
const fs = require('fs');

let mainWindow;
let currentProjectPath = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 720,
    titleBarStyle: 'hidden', // or 'customButtonsOnHover' on macOS
    titleBarOverlay: {
      color: '#333333',
      symbolColor: '#ffffff',
      height: 40
    },
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, 'index.html'));
  createMenu();
}

function createMenu() {
  const isMac = process.platform === 'darwin';
  const template = [
    // { role: 'appMenu' }
    ...(isMac ? [{
      label: app.name,
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        { role: 'services' },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' }
      ]
    }] : []),
    // { role: 'fileMenu' }
    {
      label: 'File',
      submenu: [
        {
          label: 'New Project',
          accelerator: 'CmdOrCtrl+N',
          click: () => {
            mainWindow.webContents.send('new-project');
            currentProjectPath = null;
          }
        },
        {
          label: 'Open...',
          accelerator: 'CmdOrCtrl+O',
          click: async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog({
              filters: [{ name: 'Animotion Presentations', extensions: ['hime'] }],
              properties: ['openFile']
            });
            
            if (!canceled && filePaths.length > 0) {
              currentProjectPath = filePaths[0];
              const fileData = fs.readFileSync(filePaths[0], 'utf8');
              mainWindow.webContents.send('project-opened', { filePath: filePaths[0], data: fileData });
            }
          }
        },
        {
          label: 'Save',
          accelerator: 'CmdOrCtrl+S',
          click: async () => {
            if (currentProjectPath) {
              mainWindow.webContents.send('save-project', { filePath: currentProjectPath });
            } else {
              // No current project path, use Save As instead
              const { canceled, filePath } = await dialog.showSaveDialog({
                filters: [{ name: 'Animotion Presentations', extensions: ['hime'] }]
              });
              
              if (!canceled && filePath) {
                currentProjectPath = filePath;
                mainWindow.webContents.send('save-project', { filePath });
              }
            }
          }
        },
        {
          label: 'Save As...',
          accelerator: 'Shift+CmdOrCtrl+S',
          click: async () => {
            const { canceled, filePath } = await dialog.showSaveDialog({
              filters: [{ name: 'Animotion Presentations', extensions: ['hime'] }]
            });
            
            if (!canceled && filePath) {
              currentProjectPath = filePath;
              mainWindow.webContents.send('save-project', { filePath });
            }
          }
        },
        { type: 'separator' },
        isMac ? { role: 'close' } : { role: 'quit' }
      ]
    },
    // { role: 'editMenu' }
    {
      label: 'Edit',
      submenu: [
        { role: 'undo' },
        { role: 'redo' },
        { type: 'separator' },
        { role: 'cut' },
        { role: 'copy' },
        { role: 'paste' },
        ...(isMac ? [
          { role: 'delete' },
          { role: 'selectAll' },
          { type: 'separator' },
        ] : [
          { role: 'delete' },
          { type: 'separator' },
          { role: 'selectAll' }
        ])
      ]
    },
    // { role: 'viewMenu' }
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
    },
    {
      label: 'Media',
      submenu: [
        {
          label: 'Import Media...',
          click: async () => {
            const { canceled, filePaths } = await dialog.showOpenDialog({
              filters: [
                { name: 'Media Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'mp3', 'wav'] }
              ],
              properties: ['openFile', 'multiSelections']
            });
            
            if (!canceled && filePaths.length > 0) {
              const mediaFiles = [];
              
              for (const filePath of filePaths) {
                const fileData = fs.readFileSync(filePath);
                const fileName = path.basename(filePath);
                
                mediaFiles.push({
                  name: fileName,
                  data: fileData.toString('base64'),
                  type: path.extname(filePath).substring(1)
                });
              }
              
              mainWindow.webContents.send('media-imported', mediaFiles);
            }
          }
        }
      ]
    }
  ];
  
  const menu = Menu.buildFromTemplate(template);
  Menu.setApplicationMenu(menu);
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

ipcMain.handle('set-titlebar-overlay', (event, options) => {
  const win = BrowserWindow.fromWebContents(event.sender);
  if (win) {
    win.setTitleBarOverlay(options);
  }
});

ipcMain.handle('save-project-file', async (event, { filePath, data }) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data), 'utf8');
    return { success: true };
  } catch (error) {
    console.error('Error saving project:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('select-media-files', async () => {
  const { canceled, filePaths } = await dialog.showOpenDialog({
    filters: [
      { name: 'Media Files', extensions: ['jpg', 'jpeg', 'png', 'gif', 'mp4', 'mov', 'mp3', 'wav'] }
    ],
    properties: ['openFile', 'multiSelections']
  });
  
  if (canceled) {
    return { canceled: true };
  }
  
  const mediaFiles = [];
  
  for (const filePath of filePaths) {
    const fileData = fs.readFileSync(filePath);
    const fileName = path.basename(filePath);
    
    mediaFiles.push({
      name: fileName,
      data: fileData.toString('base64'),
      type: path.extname(filePath).substring(1)
    });
  }
  
  return { canceled: false, mediaFiles };
});