const { app, BrowserWindow, ipcMain, Menu, dialog, desktopCapturer } = require('electron');
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
      preload: path.join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    }
  });

  mainWindow.loadFile(path.join(__dirname, '../../index.html'));
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
        {
          label: 'Export',
          submenu: [
            {
              label: 'Export to PNG',
              click: async () => {
                // Prompt for a directory to save the exported PNG files
                const { canceled, filePaths } = await dialog.showOpenDialog({
                  properties: ['openDirectory', 'createDirectory']
                });
                
                if (!canceled && filePaths.length > 0) {
                  mainWindow.webContents.send('export-to-png', { outputDir: filePaths[0] });
                }
              }
            }
          ]
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

// Add handler for window creation
app.on('web-contents-created', (event, contents) => {
  contents.on('new-window', (event, url) => {
    // Allow opening the presentation window
    if (url.includes('presentation.html')) {
      // Let it open, but configure the new window
      event.newGuest = new BrowserWindow({
        fullscreen: true,
        webPreferences: {
          nodeIntegration: false,
          contextIsolation: true,
          enableRemoteModule: false,
          preload: path.join(__dirname, 'preload.js')
        }
      });
    }
  });
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

// Add a new IPC handler for saving exported PNG files
ipcMain.handle('save-exported-png', async (event, { filePath, data }) => {
  try {
    // Remove the data URL prefix to get just the base64 data
    const base64Data = data.replace(/^data:image\/png;base64,/, '');
    
    // Write the file to disk
    fs.writeFileSync(filePath, Buffer.from(base64Data, 'base64'));
    
    return { success: true, filePath };
  } catch (error) {
    console.error('Error saving PNG:', error);
    return { success: false, error: error.message };
  }
});

// Simplify the screen capture handler
ipcMain.handle('capture-element', async (event, rect) => {
  try {
    console.log(`Capturing element at x:${rect.x}, y:${rect.y}, width:${rect.width}, height:${rect.height}`);
    
    // Get the source window
    const win = BrowserWindow.fromWebContents(event.sender);
    
    if (!win) {
      throw new Error('Could not find window for screenshot');
    }
    
    // Short wait to ensure render is complete
    await new Promise(resolve => setTimeout(resolve, 100));
    
    // Take a direct screenshot with no intermediate steps
    const image = await win.webContents.capturePage({
      x: Math.max(0, Math.floor(rect.x)),
      y: Math.max(0, Math.floor(rect.y)),
      width: Math.min(Math.ceil(rect.width), win.getBounds().width),
      height: Math.min(Math.ceil(rect.height), win.getBounds().height)
    });
    
    if (!image || image.isEmpty()) {
      throw new Error('Captured image is empty');
    }
    
    const size = image.getSize();
    console.log(`Screenshot captured successfully: ${size.width}x${size.height}`);
    
    // Return as data URL
    return `data:image/png;base64,${image.toPNG().toString('base64')}`;
  } catch (error) {
    console.error('Error capturing element:', error);
    
    // Try again with a different approach
    try {
      // Fallback to full window capture and crop
      const win = BrowserWindow.fromWebContents(event.sender);
      const image = await win.webContents.capturePage();
      
      // Crop to the desired region
      const nativeImage = require('electron').nativeImage;
      const croppedImage = nativeImage.createFromBuffer(
        image.toBitmap(), { width: image.getSize().width, height: image.getSize().height }
      ).crop({
        x: Math.max(0, rect.x),
        y: Math.max(0, rect.y),
        width: Math.min(rect.width, image.getSize().width - rect.x),
        height: Math.min(rect.height, image.getSize().height - rect.y)
      });
      
      return `data:image/png;base64,${croppedImage.toPNG().toString('base64')}`;
    } catch (fallbackError) {
      console.error('Fallback capture also failed:', fallbackError);
      throw error;
    }
  }
});