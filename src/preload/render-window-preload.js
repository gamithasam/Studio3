/**
 * Preload script for the invisible render window
 * Sets up IPC communication between the main process and render window
 */

const { contextBridge, ipcRenderer } = require('electron');

console.log('Render window preload script loaded');

// Expose protected methods that allow the render window to communicate with the main process
contextBridge.exposeInMainWorld('renderWindowAPI', {
  // Receive media data from main window
  onTransferMedia: (callback) => {
    ipcRenderer.on('transfer-media', (event, mediaData) => callback(mediaData));
  },
  
  // Load slides from code
  onLoadSlides: (callback) => {
    ipcRenderer.on('load-slides', async (event, code) => {
      const result = await callback(code);
      ipcRenderer.send('slides-loaded', result);
    });
  },
  
  // Render specific slide
  onRenderSlide: (callback) => {
    ipcRenderer.on('render-slide', async (event, index) => {
      const result = await callback(index);
      ipcRenderer.send('slide-rendered', result);
    });
  },
  
  // Capture a screenshot
  captureScreenshot: async (options) => {
    return await ipcRenderer.invoke('capture-render-window-screenshot', options);
  },
  
  // Add a simple verification method
  verify: () => {
    console.log('Render window API verified');
    return { success: true, timestamp: Date.now() };
  }
});

// Log when the window hash indicates this is a render window
window.addEventListener('DOMContentLoaded', () => {
  if (window.location.hash.includes('renderWindow')) {
    console.log('Render window detected via hash parameter');
  }
});
