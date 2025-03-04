/**
 * Render Window Management in Main Process
 * Handles creating and managing invisible windows for rendering slides
 */

const { BrowserWindow, ipcMain } = require('electron');
const path = require('path');
// Remove uuid dependency and use a simple ID generator instead
// const { v4: uuidv4 } = require('uuid');

// Simple ID generator function to replace uuid
function generateId() {
  return 'rw_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
}

// Map of render windows by ID
const renderWindows = new Map();

// Track if handlers are already set up
let handlersInitialized = false;

/**
 * Create a new invisible render window
 * @param {Object} options - Window options
 * @param {number} options.width - Window width
 * @param {number} options.height - Window height
 * @returns {Promise<string>} ID of the created window
 */
function createRenderWindow(options = {}) {
  return new Promise((resolve, reject) => {
    try {
      // Use the simpler ID generator instead of uuidv4()
      const id = generateId();
      const width = options.width || 1920;
      const height = options.height || 1080;
      
      console.log(`Creating render window (${id}) with dimensions ${width}x${height}`);
      
      // Create offscreen window with exact dimensions
      const win = new BrowserWindow({
        width: width,
        height: height,
        show: false, // Keep window hidden
        webPreferences: {
          preload: path.join(__dirname, '../preload/render-window-preload.js'),
          nodeIntegration: false,
          contextIsolation: true,
          offscreen: true, // Render offscreen for better performance
          webSecurity: false // Allow loading local resources
        }
      });
      
      // Debug event listeners
      win.webContents.on('console-message', (_, level, message) => {
        console.log(`Render window ${id} console: ${message}`);
      });
      
      win.webContents.on('did-start-loading', () => {
        console.log(`Render window ${id} started loading`);
      });
      
      // Store window with its resolvers for IPC callbacks
      renderWindows.set(id, {
        window: win,
        pendingCallbacks: new Map()
      });
      
      // Fix: Use the correct path to index.html (root of the project)
      const indexPath = path.join(__dirname, '../../index.html');
      console.log(`Loading index.html from: ${indexPath}`);
      
      // Load the renderer with a hash parameter to identify as render window
      win.loadFile(indexPath, {
        hash: `renderWindow&id=${id}`
      });
      
      // Log errors for debugging
      win.webContents.on('did-fail-load', (e, code, desc, validatedURL) => {
        console.error(`Failed to load: ${validatedURL}`);
        console.error(`Error: ${code} - ${desc}`);
        reject(new Error(`Failed to load render window: ${desc}`));
        closeRenderWindow(id);
      });
      
      // Add timeout for loading
      const loadTimeout = setTimeout(() => {
        console.error(`Render window ${id} load timeout`);
        reject(new Error('Render window load timeout'));
        closeRenderWindow(id);
      }, 15000); // 15 second timeout
      
      // Resolve once window is ready and clear the timeout
      win.webContents.once('did-finish-load', () => {
        clearTimeout(loadTimeout);
        console.log(`Render window ${id} created at ${width}x${height}`);
        
        // Short delay before resolving to ensure window is fully initialized
        setTimeout(() => resolve(id), 500);
      });
      
    } catch (err) {
      console.error('Error creating render window:', err);
      reject(err);
    }
  });
}

/**
 * Close and clean up a render window
 * @param {string} id - ID of the window to close
 */
function closeRenderWindow(id) {
  if (renderWindows.has(id)) {
    const { window, pendingCallbacks } = renderWindows.get(id);
    
    // Reject any pending callbacks
    pendingCallbacks.forEach((callback) => {
      callback.reject(new Error('Render window was closed'));
    });
    
    // Close the window
    window.destroy();
    renderWindows.delete(id);
    console.log(`Render window ${id} closed`);
    return true;
  }
  return false;
}

/**
 * Transfer media data to the render window
 * @param {string} id - Window ID
 * @param {Array} mediaData - Media data array
 */
function transferMediaToRenderWindow(id, mediaData) {
  return new Promise((resolve, reject) => {
    if (!renderWindows.has(id)) {
      return reject(new Error(`Render window ${id} not found`));
    }
    
    const { window } = renderWindows.get(id);
    window.webContents.send('transfer-media', mediaData);
    resolve(true);
  });
}

/**
 * Load slides in the render window
 * @param {string} id - Window ID
 * @param {string} code - Editor code
 */
function loadSlidesInRenderWindow(id, code) {
  return new Promise((resolve, reject) => {
    if (!renderWindows.has(id)) {
      return reject(new Error(`Render window ${id} not found`));
    }
    
    const { window, pendingCallbacks } = renderWindows.get(id);
    
    // Create callback promise handler
    const callbackId = generateId();
    pendingCallbacks.set(callbackId, { resolve, reject });
    
    // Set up one-time response handler
    ipcMain.once('slides-loaded', (event, result) => {
      if (pendingCallbacks.has(callbackId)) {
        pendingCallbacks.delete(callbackId);
        resolve(result);
      }
    });
    
    // Send request to render window
    window.webContents.send('load-slides', code);
  });
}

/**
 * Render a slide in the render window
 * @param {string} id - Window ID
 * @param {number} slideIndex - Index of slide to render
 */
function renderSlideInWindow(id, slideIndex) {
  return new Promise((resolve, reject) => {
    if (!renderWindows.has(id)) {
      return reject(new Error(`Render window ${id} not found`));
    }
    
    const { window, pendingCallbacks } = renderWindows.get(id);
    
    // Create callback promise handler
    const callbackId = generateId();
    pendingCallbacks.set(callbackId, { resolve, reject });
    
    // Set up one-time response handler
    ipcMain.once('slide-rendered', (event, result) => {
      if (pendingCallbacks.has(callbackId)) {
        pendingCallbacks.delete(callbackId);
        resolve(result);
      }
    });
    
    // Send request to render window
    window.webContents.send('render-slide', slideIndex);
  });
}

/**
 * Capture screenshot in render window
 * @param {string} id - Window ID
 * @param {Object} options - Screenshot options
 */
function captureRenderWindowScreenshot(id, options) {
  return new Promise((resolve, reject) => {
    if (!renderWindows.has(id)) {
      return reject(new Error(`Render window ${id} not found`));
    }
    
    const { window } = renderWindows.get(id);
    
    window.webContents.capturePage().then(image => {
      resolve(image.toDataURL());
    }).catch(err => {
      reject(err);
    });
  });
}

/**
 * Setup IPC handlers for render window management
 */
function setupIpcHandlers() {
  // Skip if handlers are already initialized
  if (handlersInitialized) {
    console.log('Render window IPC handlers already initialized, skipping.');
    return;
  }
  
  console.log('Setting up render window IPC handlers');
  
  // Handler for capturing screenshots
  ipcMain.handle('capture-render-window-screenshot', async (event, options) => {
    // Find the window ID based on webContents ID
    let windowId = null;
    
    for (const [id, data] of renderWindows.entries()) {
      if (data.window.webContents.id === event.sender.id) {
        windowId = id;
        break;
      }
    }
    
    if (!windowId) {
      throw new Error('Window ID not found for this renderer');
    }
    
    return await captureRenderWindowScreenshot(windowId, options);
  });
  
  // Mark as initialized
  handlersInitialized = true;
}

module.exports = {
  createRenderWindow,
  closeRenderWindow,
  transferMediaToRenderWindow,
  loadSlidesInRenderWindow,
  renderSlideInWindow,
  setupIpcHandlers
};