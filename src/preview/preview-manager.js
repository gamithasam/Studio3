/**
 * Preview Manager - Handles 3D scene setup and rendering
 */

export default class PreviewManager {
  constructor(appState) {
    this.canvas = document.getElementById('threeCanvas');
    this.preview = document.getElementById('preview');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrame = null;
    this.isPlaying = false;
    
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
    
    // Dispose of renderer
    if (this.renderer) {
      this.renderer.dispose();
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
