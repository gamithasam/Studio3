const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemFonts: () => ipcRenderer.invoke('get-system-fonts'),
  setTitleBarOverlay: (options) => ipcRenderer.invoke('set-titlebar-overlay', options)
});