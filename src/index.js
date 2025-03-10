/**
 * Main entry point for Studio3 application
 * Initializes the main renderer with all components
 */

import MainRenderer from './core/main-renderer.js';

document.addEventListener('DOMContentLoaded', async () => {
  // Initialize main renderer
  const renderer = new MainRenderer();
  await renderer.init();
  
  // Set up the native system title bar in Electron environment
  if (window.electronAPI && window.electronAPI.setTitleBarOverlay) {
    window.electronAPI.setTitleBarOverlay({
      color: '#333333',
      symbolColor: '#ffffff',
      height: 40
    });
  }
});
