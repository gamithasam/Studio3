// Main entry point for the Animotion application

import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import MainRenderer from './src/core/main-renderer.js';

// Make Three.js add-ons available globally 
window.Water = Water;
window.Sky = Sky;

// Initialize the application when the DOM is ready
document.addEventListener('DOMContentLoaded', async () => {
  // Create and initialize the main renderer
  const mainRenderer = new MainRenderer();
  await mainRenderer.init();
  
  // Set up the native system title bar for Electron
  if (window.electronAPI && window.electronAPI.setTitleBarOverlay) {
    window.electronAPI.setTitleBarOverlay({
      color: '#333333',
      symbolColor: '#ffffff',
      height: 40
    });
  }
});