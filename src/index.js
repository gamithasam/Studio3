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
  
  // Handle properties panel toggling with class adjustments
  const bottomPane = document.getElementById('bottomPane');
  const preview = document.getElementById('preview');
  const editorSection = document.querySelector('.editor-section');
  
  // Toggle classes for properties panel
  const togglePropertiesPanel = (isVisible) => {
    if (isVisible) {
      preview.classList.add('with-properties');
      editorSection.classList.add('with-properties');
    } else {
      preview.classList.remove('with-properties');
      editorSection.classList.remove('with-properties');
    }
  };
  
  // Observer to detect when properties panel becomes visible
  const observer = new MutationObserver((mutations) => {
    mutations.forEach((mutation) => {
      if (mutation.attributeName === 'class') {
        togglePropertiesPanel(bottomPane.classList.contains('visible'));
      }
    });
  });
  
  observer.observe(bottomPane, { attributes: true });
  
  // Initial check
  togglePropertiesPanel(bottomPane.classList.contains('visible'));
});
