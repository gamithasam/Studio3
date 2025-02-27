const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemFonts: () => ipcRenderer.invoke('get-system-fonts'),
  setTitleBarOverlay: (options) => ipcRenderer.invoke('set-titlebar-overlay', options),
  
  // File operations
  saveProjectFile: (filePath, data) => ipcRenderer.invoke('save-project-file', { filePath, data }),
  selectMediaFiles: () => ipcRenderer.invoke('select-media-files'),
  
  // Event listeners
  onNewProject: (callback) => ipcRenderer.on('new-project', callback),
  onProjectOpened: (callback) => ipcRenderer.on('project-opened', (_, value) => callback(value)),
  onSaveProject: (callback) => ipcRenderer.on('save-project', (_, value) => callback(value)),
  onMediaImported: (callback) => ipcRenderer.on('media-imported', (_, value) => callback(value))
});