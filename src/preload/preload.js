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
  
  // Render window APIs
  createRenderWindow: (options) => ipcRenderer.invoke('create-render-window', options),
  closeRenderWindow: (id) => ipcRenderer.invoke('close-render-window', id),
  transferMediaToRenderWindow: (id, mediaData) => ipcRenderer.invoke('transfer-media-to-render-window', id, mediaData),
  loadSlidesInRenderWindow: (id, code) => ipcRenderer.invoke('load-slides-in-render-window', id, code),
  renderSlideInWindow: (id, slideIndex) => ipcRenderer.invoke('render-slide-in-window', id, slideIndex),
  
  // Event listeners
  onNewProject: (callback) => ipcRenderer.on('new-project', callback),
  onProjectOpened: (callback) => ipcRenderer.on('project-opened', (_, value) => callback(value)),
  onSaveProject: (callback) => ipcRenderer.on('save-project', (_, value) => callback(value)),
  onMediaImported: (callback) => ipcRenderer.on('media-imported', (_, value) => callback(value)),
  onExportToPNG: (callback) => ipcRenderer.on('export-to-png', (_, value) => callback(value)),
  onPrepareForCapture: (callback) => ipcRenderer.on('prepare-for-capture', (_, value) => callback(value)),
  onCaptureComplete: (callback) => ipcRenderer.on('capture-complete', callback)
});

contextBridge.exposeInMainWorld('electron', {
  // Add a listener for aspect ratio changes
  onAspectRatioChanged: (callback) => {
    ipcRenderer.on('aspect-ratio-changed', (_, data) => callback(data));
    
    // Return a cleanup function
    return () => {
      ipcRenderer.removeAllListeners('aspect-ratio-changed');
    };
  },
  
  // Add a listener for view mode changes
  onSetViewMode: (callback) => ipcRenderer.on('set-view-mode', (_, mode) => callback(mode))
});