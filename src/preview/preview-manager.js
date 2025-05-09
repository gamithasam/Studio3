/**
 * Preview Manager - Handles 3D scene setup and rendering
 */
import studio from '@theatre/studio'
import { getProject } from '@theatre/core'

export default class PreviewManager {
  constructor(appState) {
    this.canvas = document.getElementById('threeCanvas');
    this.preview = document.getElementById('preview');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrame = null;
    this.isPlaying = false;
    
    // Theatre.js properties
    this.theatreProject = null;
    this.theatreSheet = null;
    this.theatreObjects = new Map(); // Track objects added to Theatre.js
    this.sceneObserver = null; // Observer for scene children changes
    
    // Store reference to app state
    this.appState = appState;
    
    // Default aspect ratio (will be updated from app state)
    this.aspectRatio = {
      width: 16,
      height: 9
    };

    // Add zoom level tracking
    this.zoomLevel = 1;
    this.zoomMin = 0.25; // Changed from 0.5 to allow 25% zoom
    this.zoomMax = 4.0;  // Changed from 2.5 to allow 300% and 400% zoom
    this.zoomStep = 0.25;
  }
  
  init() {
    // Update aspect ratio from app state if available
    if (this.appState && this.appState.getState('aspectRatio')) {
      this.aspectRatio = this.appState.getState('aspectRatio');
    }
    
    // Clear Theatre.js data from localStorage on startup
    this.clearTheatreJsLocalStorage();
    
    // Set up Three.js
    this.renderer = new THREE.WebGLRenderer({ 
      canvas: this.canvas,
      alpha: true  // Make background transparent to show 2D content behind
    });
    this.renderer.setClearColor(0x000000, 0.9);  // Slightly transparent background
    this.renderer.setPixelRatio(window.devicePixelRatio);
    
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.canvas.clientWidth / this.canvas.clientHeight, 0.1, 100);
    this.camera.position.z = 3;
    
    // Create container for Theatre.js UI
    this.createTheatreContainer();
    
    // Initialize Theatre.js with custom container and disable autosave
    studio.initialize({
      container: document.getElementById('theatre-container'),
      autosave: false
    });
    
    // Create a new project with autosave disabled, without specifying a state
    // This allows Theatre.js to create a default state structure
    this.theatreProject = getProject('Studio3 Project', {
      autosave: false,
      // Don't specify state, let Theatre.js handle default initialization
    });
    
    this.theatreSheet = this.theatreProject.sheet('Scene');
    
    // Register camera with Theatre.js
    this.registerObjectWithTheatre(this.camera, 'camera');
    
    // Setup observer to detect user-added objects
    this.setupSceneObserver();
    
    this.startAnimation();
    window.addEventListener('resize', this.handleResize.bind(this));
    
    // Subscribe to aspect ratio changes
    if (this.appState && this.appState.eventBus) {
      this.appState.eventBus.on('state:aspectRatio', this.handleAspectRatioChange.bind(this));
    }
    
    return this.scene;
  }
  
  handleResize() {
    this.resizeRenderer();
  }
  
  handleAspectRatioChange(data) {
    if (data && data.value) {
      this.aspectRatio = data.value;
      this.resizeRenderer();
    }
  }
  
  resizeRenderer() {
    const previewRect = this.preview.getBoundingClientRect();
    
    // Calculate aspect ratio
    const aspectRatioValue = this.aspectRatio.width / this.aspectRatio.height;
    
    // Calculate base dimensions based on aspect ratio
    // Use a constant target area rather than fixed width
    const targetArea = 1280 * 720; // Target area in pixels (approximately 921,600 px)
    const baseWidth = Math.sqrt(targetArea * aspectRatioValue);
    const baseHeight = baseWidth / aspectRatioValue;
    
    // Apply zoom factor to get actual dimensions
    const zoomedWidth = baseWidth * this.zoomLevel;
    const zoomedHeight = zoomedWidth / aspectRatioValue;
    
    // Set the renderer to the zoomed size
    this.renderer.setSize(zoomedWidth, zoomedHeight, false);
    
    // Update camera aspect ratio (should stay constant)
    this.camera.aspect = aspectRatioValue;
    this.camera.updateProjectionMatrix();
    
    // Center the canvas in the container
    this.canvas.style.position = 'absolute';
    this.canvas.style.left = '50%';
    this.canvas.style.top = '50%';
    this.canvas.style.transform = 'translate(-50%, -50%)';
    this.canvas.style.width = `${zoomedWidth}px`;
    this.canvas.style.height = `${zoomedHeight}px`;
    
    // Set a neutral background color
    this.preview.style.backgroundColor = '#222222';
  }
  
  startAnimation() {
    // Optimized animation function that conditionally renders
    const animate = () => {
      // Update Three.js objects from Theatre.js values
      this.theatreObjects.forEach(({ threeObject, theatreObject }) => {
        if (!threeObject || !theatreObject) return;
        
        try {
          const values = theatreObject.value;
          
          if (values.position && threeObject.position) {
            threeObject.position.set(
              values.position.x,
              values.position.y,
              values.position.z
            );
          }
          
          if (values.rotation && threeObject.rotation) {
            threeObject.rotation.set(
              values.rotation.x,
              values.rotation.y,
              values.rotation.z
            );
          }
          
          if (values.scale && threeObject.scale) {
            threeObject.scale.set(
              values.scale.x,
              values.scale.y,
              values.scale.z
            );
          }
          
          // Handle other properties
          if (values.intensity !== undefined && threeObject.intensity !== undefined) {
            threeObject.intensity = values.intensity;
          }
          
          if (values.color && threeObject.color) {
            threeObject.color.setRGB(
              values.color.r,
              values.color.g,
              values.color.b
            );
          }
        } catch (error) {
          console.warn(`Error updating object with Theatre.js: ${error.message}`);
        }
      });
      
      // Only update renderer if not in play mode
      if (!this.isPlaying) {
        this.resizeRenderer();
        this.renderer.render(this.scene, this.camera);
      }
      this.animationFrame = requestAnimationFrame(animate);
    };
    
    animate();
  }
  
  pauseAnimation() {
    this.isPlaying = true;
  }
  
  resumeAnimation() {
    this.isPlaying = false;
  }
  
  createPausedOverlay() {
    const pausedOverlay = document.createElement('div');
    pausedOverlay.id = 'preview-paused-overlay';
    pausedOverlay.innerHTML = '<div>PREVIEW PAUSED</div><div>Slideshow running in separate window</div>';
    pausedOverlay.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background-color: rgba(0, 0, 0, 0.7);
      color: white;
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      z-index: 10;
      font-family: sans-serif;
      text-align: center;
    `;
    pausedOverlay.querySelector('div:first-child').style.cssText = `
      font-size: 24px;
      font-weight: bold;
      margin-bottom: 10px;
    `;
    pausedOverlay.querySelector('div:last-child').style.cssText = `
      font-size: 14px;
      opacity: 0.8;
    `;
    
    this.preview.appendChild(pausedOverlay);
    return pausedOverlay;
  }
  
  getRenderer() {
    return this.renderer;
  }
  
  getCamera() {
    return this.camera;
  }
  
  getScene() {
    return this.scene;
  }
  
  // Create a container for Theatre.js UI within the preview pane
  createTheatreContainer() {
    const container = document.createElement('div');
    container.id = 'theatre-container';
    container.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      pointer-events: none;
      z-index: 1000;
    `;
    
    // Add CSS to constrain Theatre.js UI
    const style = document.createElement('style');
    style.textContent = `
      #theatre-container .theatre-widget-root {
        position: absolute !important;
        bottom: 0 !important;
        right: 0 !important;
        width: 100% !important;
        max-height: 40% !important;
        pointer-events: auto !important;
      }
      
      #theatre-container .theatre-toolbar {
        position: absolute !important;
        top: 10px !important;
        right: 10px !important;
        pointer-events: auto !important;
      }

      #theatre-container .theatre-docking-layer {
        pointer-event: auto !important;
      }
      
      #theatre-container .theatre-panel {
        max-height: calc(100% - 20px) !important;
        max-width: calc(100% - 20px) !important;
        pointer-events: auto !important;
      }
    `;
    
    document.head.appendChild(style);
    this.preview.appendChild(container);
  }
  
  // Setup observer to watch for scene changes
  setupSceneObserver() {
    // Keep track of objects we've already seen by UUID
    this.observedObjects = new Set();
    
    // Create a handler for when objects are added
    this.sceneChangeHandler = () => {
      // Only scan if we're not currently scanning
      if (!this.isScanning) {
        this.scanSceneForNewObjects();
      }
    };
    
    // Set up a MutationObserver to detect when objects are added to the scene
    const observer = new MutationObserver(mutations => {
      // Check if any of the mutations involve the scene or its children
      const shouldScan = mutations.some(mutation => {
        return this.scene.contains(mutation.target) || mutation.target === this.scene;
      });
      
      if (shouldScan) {
        this.sceneChangeHandler();
      }
    });
    
    // Do an initial scan after a short delay to let the scene initialize
    setTimeout(() => this.scanSceneForNewObjects(), 500);
    
    // Setup custom function to intercept object additions to the scene
    const originalAdd = this.scene.add;
    this.scene.add = (...objects) => {
      const result = originalAdd.apply(this.scene, objects);
      this.sceneChangeHandler();
      return result;
    };
    
    // No need for frequent interval scanning - we'll use the above approaches instead
    // Only do occasional checks in case we miss something
    this.sceneCheckInterval = setInterval(() => {
      this.scanSceneForNewObjects();
    }, 5000); // Reduced from every 1 second to every 5 seconds
    
    return observer;
  }
  
  // Scan the scene for objects not yet registered with Theatre.js
  scanSceneForNewObjects() {
    // Flag to prevent concurrent scanning
    this.isScanning = true;
    
    // Counter for generating IDs if needed
    if (!this.objectIdCounter) {
      this.objectIdCounter = 0;
    }
    
    const processObject = (obj, prefix = '') => {
      // Skip if it's the camera - we handle that separately
      if (obj === this.camera) return;
      
      // Use UUID for stable identification across scans
      const objUuid = obj.uuid;
      
      // Skip if we've already processed this object
      if (this.observedObjects.has(objUuid)) return;
      
      // Mark as observed
      this.observedObjects.add(objUuid);
      
      // Generate a consistent ID based on type and name if available
      let shortId;
      if (obj.name) {
        shortId = obj.name;
      } else if (obj.type) {
        shortId = `${obj.type}_${this.objectIdCounter++}`;
      } else {
        shortId = `obj_${objUuid.substring(0, 8)}`;
      }
      
      const objectId = prefix + shortId;
      
      // Ensure ID is not too long for Theatre.js (max 64 chars)
      const finalObjectId = objectId.length > 60 ? objectId.substring(0, 60) : objectId;
      
      // Register animatable objects
      if (obj.visible !== undefined && (obj.position || obj.rotation || obj.scale)) {
        // Check if we already have this object registered by another ID
        let alreadyRegistered = false;
        this.theatreObjects.forEach((value) => {
          if (value.threeObject === obj) {
            alreadyRegistered = true;
          }
        });
        
        if (!alreadyRegistered) {
          this.registerObjectWithTheatre(obj, finalObjectId);
        }
      }
      
      // Process children recursively
      if (obj.children && obj.children.length > 0) {
        obj.children.forEach((child, index) => {
          processObject(child, `${prefix}c${index}_`);
        });
      }
    };
    
    // Process all direct scene children
    if (this.scene && this.scene.children) {
      this.scene.children.forEach((obj, index) => {
        if (obj !== this.camera) {
          processObject(obj, `obj${index}_`);
        }
      });
    }
    
    // Done scanning
    this.isScanning = false;
  }
  
  // Register a Three.js object with Theatre.js for animation control
  registerObjectWithTheatre(object, objectId) {
    // Skip objects without proper properties
    if (!object.position || !object.rotation) {
      return null;
    }
    
    console.log(`Registering object with Theatre.js: ${objectId}`);
    
    // Define props based on object type
    const props = {
      position: {
        x: object.position.x,
        y: object.position.y, 
        z: object.position.z
      },
      rotation: {
        x: object.rotation.x,
        y: object.rotation.y,
        z: object.rotation.z
      }
    };
    
    // Add scale if available
    if (object.scale) {
      props.scale = {
        x: object.scale.x ?? 1,
        y: object.scale.y ?? 1,
        z: object.scale.z ?? 1
      };
    }
    
    // Add other properties based on object type
    if (object.intensity !== undefined) {
      props.intensity = object.intensity;
    }
    
    if (object.color !== undefined && object.color.r !== undefined) {
      props.color = {
        r: object.color.r,
        g: object.color.g,
        b: object.color.b
      };
    }
    
    // Create Theatre.js object with non-persistent state
    const theatreObject = this.theatreSheet.object(objectId, props, {
      reconfigure: true  // Always reconfigure with current values instead of using saved state
    });

    // Store reference to the object and the initial values
    this.theatreObjects.set(objectId, {
      threeObject: object,
      theatreObject: theatreObject,
      initialValues: JSON.parse(JSON.stringify(props)) // Store initial values for reset
    });

    return theatreObject;
  }

  // Remove an object from Theatre.js control
  unregisterObjectFromTheatre(objectId) {
    if (this.theatreObjects.has(objectId)) {
      this.theatreObjects.delete(objectId);
    }
  }

  // Show Theatre.js UI
  showTheatreUI() {
    studio.ui.show();
  }

  // Hide Theatre.js UI
  hideTheatreUI() {
    studio.ui.hide();
  }
  
  // Clear Theatre.js data from localStorage
  clearTheatreJsLocalStorage() {
    // Clear any Theatre.js related items from localStorage
    Object.keys(localStorage).forEach(key => {
      if (key.includes('theatre') || key.includes('Theatre')) {
        localStorage.removeItem(key);
      }
    });
    console.log('Cleared Theatre.js data from localStorage');
  }
  
  // Reset Theatre.js state to initial values
  resetTheatreState() {
    // Reset the entire Theatre.js project state
    if (this.theatreProject) {
      this.theatreProject.ready.then(() => {
        // Re-create the sheet without specifying state
        this.theatreSheet = this.theatreProject.sheet('Scene');
        
        // Re-register all objects with their current values
        const objectsToRestore = new Map(this.theatreObjects);
        this.theatreObjects.clear();
        
        objectsToRestore.forEach(({threeObject}, objectId) => {
          if (threeObject) {
            this.registerObjectWithTheatre(threeObject, objectId);
          }
        });
        
        console.log('Reset Theatre.js state to initial values');
      });
    }
  }
  
  // Clean up resources when no longer needed
  destroy() {
    // Clear any Theatre.js localStorage data on shutdown
    this.clearTheatreJsLocalStorage();
    
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
    }
    
    // Clear intervals
    if (this.sceneCheckInterval) {
      clearInterval(this.sceneCheckInterval);
    }
    
    // Clear the scene
    while(this.scene.children.length > 0) { 
      const object = this.scene.children[0];
      if (object.geometry) object.geometry.dispose();
      if (object.material) object.material.dispose();
      this.scene.remove(object); 
    }
    
    // Clean up Theatre.js
    this.theatreObjects.clear();
    studio.ui.hide();
    
    // Dispose of renderer
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Remove theatre container
    const container = document.getElementById('theatre-container');
    if (container) {
      container.remove();
    }

    // Restore original scene.add method if we modified it
    if (this.scene && this.scene.add && this.scene.add !== THREE.Object3D.prototype.add) {
      this.scene.add = THREE.Object3D.prototype.add;
    }
    
    // Unsubscribe from events
    if (this.appState && this.appState.eventBus) {
      this.appState.eventBus.clear('state:aspectRatio');
    }
  }

  // Update setZoom to clamp to valid range and return actual zoom level applied
  setZoom(level, slideManager) {
    // Clamp zoom level to valid range
    this.zoomLevel = Math.max(this.zoomMin, Math.min(this.zoomMax, level));
    
    // Apply zoom by resizing
    this.resizeRenderer();
    
    // Update the slide manager if provided
    if (slideManager) {
      slideManager.updateZoomLevel(this.zoomLevel);
    }
    
    console.log(`Zoom level set to: ${this.zoomLevel.toFixed(2)}x`);
    
    // Return current zoom level
    return this.zoomLevel;
  }
}
