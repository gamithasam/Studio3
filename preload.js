const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  getSystemFonts: () => ipcRenderer.invoke('get-system-fonts'),
  setTitleBarOverlay: (options) => ipcRenderer.invoke('set-titlebar-overlay', options),
  
  // File operations
  saveProjectFile: (filePath, data) => ipcRenderer.invoke('save-project-file', { filePath, data }),
  selectMediaFiles: () => ipcRenderer.invoke('select-media-files'),
  saveExportedPNG: (filePath, data) => ipcRenderer.invoke('save-exported-png', { filePath, data }),
  
  // Screenshot capture
  captureElement: (rect) => ipcRenderer.invoke('capture-element', rect),
  
  // Event listeners
  onNewProject: (callback) => ipcRenderer.on('new-project', callback),
  onProjectOpened: (callback) => ipcRenderer.on('project-opened', (_, value) => callback(value)),
  onSaveProject: (callback) => ipcRenderer.on('save-project', (_, value) => callback(value)),
  onMediaImported: (callback) => ipcRenderer.on('media-imported', (_, value) => callback(value)),
  onExportToPNG: (callback) => ipcRenderer.on('export-to-png', (_, value) => callback(value))
});