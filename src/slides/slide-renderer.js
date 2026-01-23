/**
 * Slide Renderer - Handles rendering individual slides
 */

export default class SlideRenderer {
  constructor(scene, camera, renderer, container) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.container = container;
    this.currentSlide = null;
    this.currentSlideData = null;
    this.animationMixers = [];
  }
  
  async renderSlide(slideObj, mediaData = {}) {
    // Clear previous slide
    this.clearSlide();
    
    if (!slideObj || typeof slideObj.init !== 'function') {
      console.error('Invalid slide object');
      return false;
    }
    
    try {
      // Initialize the slide with scene and container
      this.currentSlide = slideObj;
      
      // Process any media in the container
      if (typeof mediaData === 'object' && Object.keys(mediaData).length > 0) {
        // Set up media elements
        this.setupMediaElements(this.container, mediaData);
      }
      
      // Call the slide's init function
      this.currentSlideData = this.currentSlide.init({
        scene: this.scene,
        container: this.container
      });
      
      // Store container reference
      if (this.currentSlideData) {
        this.currentSlideData._container = this.container;
      }
      
      // Call transition in function if available
      if (typeof this.currentSlide.transitionIn === 'function') {
        this.currentSlide.transitionIn(this.currentSlideData);
      }
      
      return true;
    } catch (err) {
      console.error('Error rendering slide:', err);
      return false;
    }
  }
  
  clearSlide() {
    // Clear previous animations
    this.animationMixers.forEach(mixer => {
      mixer.stopAllAction();
    });
    this.animationMixers = [];
    
    // Clear the scene of all objects
    while (this.scene.children.length > 0) {
      const obj = this.scene.children[0];
      this.disposeObject(obj);
      this.scene.remove(obj);
    }
    
    // Clear the container
    if (this.container) {
      this.container.innerHTML = '';
    }
    
    // Reset references
    this.currentSlide = null;
    this.currentSlideData = null;
  }
  
  disposeObject(obj) {
    if (obj.geometry) {
      obj.geometry.dispose();
    }
    
    if (obj.material) {
      if (Array.isArray(obj.material)) {
        obj.material.forEach(material => material.dispose());
      } else {
        obj.material.dispose();
      }
    }
    
    // Handle textures
    if (obj.material && obj.material.map) {
      obj.material.map.dispose();
    }
    
    // Handle children
    if (obj.children && obj.children.length > 0) {
      obj.children.forEach(child => this.disposeObject(child));
    }
  }
  
  setupMediaElements(container, mediaData) {
    if (!container || !mediaData) return;
    
    // Create function to replace media references in the DOM
    const processMediaReferences = (element) => {
      // Process <img> tags
      const images = element.querySelectorAll('img[data-media-id]');
      images.forEach(img => {
        const mediaId = img.getAttribute('data-media-id');
        if (mediaData[mediaId]) {
          img.src = mediaData[mediaId].data;
        }
      });
      
      // Process <video> tags
      const videos = element.querySelectorAll('video[data-media-id]');
      videos.forEach(video => {
        const mediaId = video.getAttribute('data-media-id');
        if (mediaData[mediaId]) {
          video.src = mediaData[mediaId].data;
          
          // Set muted attribute for autoplay to work
          if (video.autoplay) {
            video.muted = true;
          }
        }
      });
      
      // Process background images in style attributes
      const elementsWithBgImages = element.querySelectorAll('[style*="background-image"][data-media-id]');
      elementsWithBgImages.forEach(el => {
        const mediaId = el.getAttribute('data-media-id');
        if (mediaData[mediaId]) {
          el.style.backgroundImage = `url(${mediaData[mediaId].data})`;
        }
      });
    };
    
    // Process the container and its children
    processMediaReferences(container);
  }
  
  transitionOut() {
    if (!this.currentSlide || !this.currentSlideData) return;
    
    if (typeof this.currentSlide.transitionOut === 'function') {
      try {
        this.currentSlide.transitionOut(this.currentSlideData);
      } catch (err) {
        console.error('Error in transition out:', err);
      }
    }
  }
  
  // Update animations each frame if needed
  update(deltaTime) {
    // Update any animation mixers
    this.animationMixers.forEach(mixer => {
      mixer.update(deltaTime);
    });
  }
}
