/**
 * Preview Manager - Handles 3D scene setup and rendering
 */

export default class PreviewManager {
  constructor() {
    this.canvas = document.getElementById('threeCanvas');
    this.preview = document.getElementById('preview');
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.animationFrame = null;
    this.isPlaying = false;
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
}
