/**
 * Preview Manager - Handles 3D scene setup and rendering
 */
import studio from '@theatre/studio'
import { getProject } from '@theatre/core'

export default class PreviewManager {
  constructor() {
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
  }
  
  init() {
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
    
    // Initialize Theatre.js with custom container
    studio.initialize({
      container: document.getElementById('theatre-container')
    });
    
    // Set up mutation observer to contain Theatre.js UI
    this.setupTheatreContainment();
    
    this.theatreProject = getProject('Studio3 Project');
    this.theatreSheet = this.theatreProject.sheet('Scene');
    
    // Register camera with Theatre.js
    this.registerObjectWithTheatre(this.camera, 'camera');
    
    // Setup observer to detect user-added objects
    this.setupSceneObserver();
    
    this.startAnimation();
    window.addEventListener('resize', this.handleResize.bind(this));
    
    return this.scene;
  }
  
  handleResize() {
    this.resizeRenderer();
  }
  
  resizeRenderer() {
    let newWidth, newHeight;
    if (document.fullscreenElement) {
      const previewRect = this.preview.getBoundingClientRect();
      // Calculate dimensions based on a fixed 16:9 ratio. We'll choose the largest size that fits
      newWidth = Math.min(previewRect.width, previewRect.height * (16 / 9));
      newHeight = newWidth / (16 / 9);
    } else {
      newWidth = this.canvas.clientWidth;
      newHeight = this.canvas.clientHeight;
    }
    if (this.canvas.width !== newWidth || this.canvas.height !== newHeight) {
      this.renderer.setSize(newWidth, newHeight, false);
      this.camera.aspect = newWidth / newHeight;
      this.camera.updateProjectionMatrix();
    }
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
      overflow: hidden;
      contain: strict;
    `;
    
    // Add CSS to constrain Theatre.js UI
    const style = document.createElement('style');
    style.textContent = `
      /* Global rule to capture Theatre.js elements anywhere */
      body > div[class*="theatre-"],
      body > div[id*="theatre-"],
      body > div[class*="Theatre"],
      body > div[data-sheet],
      body > div[data-sequence-editor],
      body > div[data-dock],
      body > .theatre-widget-root,
      body > .theatre-popover-container,
      body > .theatre-flyout-container {
        display: none !important; /* Hide any Theatre elements outside our container */
      }
      
      /* Base Theatre container */
      #theatre-container {
        overflow: hidden !important;
        contain: strict !important;
      }

      /* Ensure all Theatre.js elements stay where they belong */
      #theatre-container * {
        transform: none !important;
        position: relative !important;
        max-width: 100% !important;
        max-height: 100% !important;
      }
      
      /* Reset position for key containers that need to be absolutely positioned */
      #theatre-container .theatre-widget-root,
      #theatre-container .theatre-toolbar,
      #theatre-container .theatre-panel,
      #theatre-container .theatre-popover-container,
      #theatre-container .theatre-flyout-container {
        position: absolute !important;
      }

      /* Main widget root */
      #theatre-container .theatre-widget-root {
        bottom: 0 !important;
        left: 0 !important;
        right: 0 !important;
        width: 100% !important;
        max-height: 40% !important;
        pointer-events: auto !important;
        overflow: auto !important;
      }
      
      /* Toolbar */
      #theatre-container .theatre-toolbar {
        top: 10px !important;
        right: 10px !important;
        left: auto !important;
        pointer-events: auto !important;
        max-width: calc(100% - 20px) !important;
      }
      
      /* Other containers */
      #theatre-container .theatre-popover-container,
      #theatre-container .theatre-flyout-container,
      #theatre-container div[data-position],
      #theatre-container div[data-popper-reference-hidden] {
        inset: auto !important;
        max-width: calc(100% - 20px) !important;
        max-height: calc(100% - 20px) !important;
        overflow: auto !important;
        top: auto !important;
        left: auto !important;
        right: 10px !important;
        bottom: 10px !important;
        margin: 0 !important;
        transform: none !important;
      }
      
      #preview #theatre-container .theatre-panel,
      #preview [class*="theatre-"] {
        max-height: calc(100% - 20px) !important;
        max-width: calc(100% - 20px) !important;
        overflow: auto !important;
      }
    `;
    
    document.head.appendChild(style);
    this.preview.appendChild(container);
  }
  
  // Setup observer to watch for scene changes
  setupSceneObserver() {
    // Use a periodic function to check for new objects
    this.sceneCheckInterval = setInterval(() => {
      this.scanSceneForNewObjects();
    }, 1000); // Check every second
    
    // Also scan at the beginning
    setTimeout(() => this.scanSceneForNewObjects(), 100);
  }
  
  // Scan the scene for objects not yet registered with Theatre.js
  scanSceneForNewObjects() {
    // Counter for generating shorter IDs
    if (!this.objectIdCounter) {
      this.objectIdCounter = 0;
    }
    
    const processObject = (obj, prefix = '') => {
      // Generate shorter object ID
      // Instead of full UUID, use type + counter or truncated ID
      const shortId = obj.name || 
                     (obj.type ? `${obj.type}_${this.objectIdCounter++}` : 
                     (obj.uuid ? `obj_${obj.uuid.substring(0, 8)}` : `obj_${this.objectIdCounter++}`));
      
      const objectId = prefix + shortId;
      
      // Make sure our ID is not too long for Theatre.js (max 64 chars)
      const finalObjectId = objectId.length > 60 ? objectId.substring(0, 60) : objectId;
      
      // Skip if already registered
      if (!this.theatreObjects.has(finalObjectId) && obj !== this.camera) {
        // Register visible objects that can be animated
        if (obj.visible !== undefined && 
            (obj.position || obj.rotation || obj.scale)) {
          this.registerObjectWithTheatre(obj, finalObjectId);
        }
      }
      
      // Process children recursively
      if (obj.children) {
        obj.children.forEach((child, index) => {
          // Keep child prefixes short
          processObject(child, `${prefix}c${index}_`);
        });
      }
    };
    
    // Process all scene children
    this.scene.children.forEach((obj, index) => {
      if (obj !== this.camera) { // Skip camera as it's already registered
        processObject(obj, `obj${index}_`);
      }
    });
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
    
    // Create Theatre.js object
    const theatreObject = this.theatreSheet.object(objectId, props);

    // Store reference to the object
    this.theatreObjects.set(objectId, {
      threeObject: object,
      theatreObject: theatreObject
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
  
  // Setup MutationObserver to ensure Theatre.js UI stays in our container
  setupTheatreContainment() {
    // Create observer to watch for Theatre.js elements outside our container
    const observer = new MutationObserver((mutations) => {
      mutations.forEach(mutation => {
        if (mutation.addedNodes.length) {
          mutation.addedNodes.forEach(node => {
            // Check if it's a Theatre.js element outside our container
            if (node.nodeType === Node.ELEMENT_NODE) {
              const isTheatreElement = 
                (node.className && typeof node.className === 'string' && 
                 (node.className.includes('theatre') || node.className.includes('Theatre'))) ||
                (node.id && typeof node.id === 'string' && 
                 node.id.includes('theatre')) ||
                node.hasAttribute('data-sheet') ||
                node.hasAttribute('data-sequence-editor') ||
                node.hasAttribute('data-dock');
              
              // If it's a Theatre element outside our container, move it in
              if (isTheatreElement && !this.preview.contains(node)) {
                console.log('Moving Theatre.js element back to container:', node);
                
                // First try to make it fit
                node.style.position = 'absolute';
                node.style.maxWidth = 'calc(100% - 20px)';
                node.style.maxHeight = 'calc(100% - 20px)';
                node.style.overflow = 'auto';
                node.style.transform = 'none';
                
                // Move it inside our container
                const theatreContainer = document.getElementById('theatre-container');
                if (theatreContainer) {
                  theatreContainer.appendChild(node);
                }
              }
            }
          });
        }
      });
    });
    
    // Start observing the entire document
    observer.observe(document.body, { 
      childList: true, 
      subtree: true 
    });
    
    // Store for cleanup
    this.theatreObserver = observer;
  }
  
  // Clean up resources when no longer needed
  destroy() {
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
    
    // Clean up observers
    if (this.theatreObserver) {
      this.theatreObserver.disconnect();
    }
  }
}
