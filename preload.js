const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemFonts: () => ipcRenderer.invoke('get-system-fonts')
});