/**
 * Slide Manager - Handles slide rendering, transitions, and navigation
 */

export default class SlideManager {
  constructor() {
    this.slidesArray = [];
    this.slideData = [];
    this.currentSlideIndex = 0;
    this.overlay2D = null;
    this.scene = null;
    this.slidesList = document.getElementById('slidesList');
    
    // Default aspect ratio (will be updated from app state)
    this.aspectRatio = {
      width: 16,
      height: 9
    };
    
    // Create the 2D overlay for slide content
    this._createOverlay();
    
    // Listen for window resize events
    window.addEventListener('resize', this.handleResize.bind(this));
  }
  
  init(scene, appState) {
    this.scene = scene;
    
    // Store reference to app state if provided
    this.appState = appState;
    
    // Update aspect ratio from app state if available
    if (this.appState && this.appState.getState('aspectRatio')) {
      this.aspectRatio = this.appState.getState('aspectRatio');
      this.resizeOverlay();
    }
    
    // Subscribe to aspect ratio changes
    if (this.appState && this.appState.eventBus) {
      this.appState.eventBus.on('state:aspectRatio', this.handleAspectRatioChange.bind(this));
    }
    
    return this;
  }
  
  _createOverlay() {
    // Create a container for 2D content
    this.overlay2D = document.createElement('div');
    this.overlay2D.id = '2d-overlay';
    this.overlay2D.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      pointer-events: none;
      z-index: 1;
    `;
    document.getElementById('preview').appendChild(this.overlay2D);
    
    // Make overlay2D clickable
    this.overlay2D.style.pointerEvents = 'auto';
    
    // Initial resize
    setTimeout(() => this.resizeOverlay(), 0);
  }
  
  handleResize() {
    this.resizeOverlay();
  }
  
  handleAspectRatioChange(data) {
    if (data && data.value) {
      this.aspectRatio = data.value;
      this.resizeOverlay();
    }
  }
  
  resizeOverlay() {
    const preview = document.getElementById('preview');
    if (!preview || !this.overlay2D) return;
    
    const previewRect = preview.getBoundingClientRect();
    let newWidth, newHeight;
    
    // Calculate dimensions based on the current aspect ratio
    const aspectRatioValue = this.aspectRatio.width / this.aspectRatio.height;
    
    if (previewRect.width / previewRect.height > aspectRatioValue) {
      // Width is limiting factor
      newHeight = previewRect.height;
      newWidth = newHeight * aspectRatioValue;
    } else {
      // Height is limiting factor
      newWidth = previewRect.width;
      newHeight = newWidth / aspectRatioValue;
    }
    
    // Apply the calculated size to the overlay
    this.overlay2D.style.width = `${newWidth}px`;
    this.overlay2D.style.height = `${newHeight}px`;
    this.overlay2D.style.position = 'absolute';
    this.overlay2D.style.left = '50%';
    this.overlay2D.style.top = '50%';
    this.overlay2D.style.transform = 'translate(-50%, -50%)';
    
    // Update each slide container to match the overlay size
    this.slidesArray.forEach((_, idx) => {
      const container = this.getSlideContainer(idx);
      if (container) {
        container.style.width = '100%';
        container.style.height = '100%';
      }
    });
  }
  
  loadSlides(slides, projectManager) {
    // Clear previous slides
    this.slidesArray = slides;
    this.slideData = slides.map(() => null);
    this.currentSlideIndex = 0;
  
    // Initialize each slide with both scene and container access
    this.slidesArray.forEach((slide, idx) => {
      // Create a container for this slide's 2D content
      const slideContainer = document.createElement('div');
      slideContainer.setAttribute('data-slide-container', `slide-${idx}`);
      slideContainer.style.cssText = `
        display: none;
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
      `;
      this.overlay2D.appendChild(slideContainer);
  
      // Initialize slide with access to both 3D scene and 2D container
      this.slideData[idx] = slide.init({
        scene: this.scene,
        container: slideContainer
      });
      this.slideData[idx]._container = slideContainer;
      
      // Process any media references if a project manager is provided
      if (projectManager) {
        projectManager.processMediaReferences(slideContainer);
      }
    });
  
    this.updateSlidesThumbnails();
    this.transitionInSlide(0);
    
    return this.slidesArray.length;
  }
  
  updateSlidesThumbnails() {
    this.slidesList.innerHTML = '';
    this.slidesArray.forEach((_, index) => {
      const thumbnail = document.createElement('div');
      thumbnail.className = `slide-thumbnail${index === this.currentSlideIndex ? ' active' : ''}`;
      thumbnail.textContent = `Slide ${index + 1}`;
      thumbnail.onclick = () => {
        this.transitionOutSlide(this.currentSlideIndex);
        this.currentSlideIndex = index;
        this.transitionInSlide(this.currentSlideIndex);
        this.updateSlidesThumbnails();

        // Notify any listeners of slide change
        document.dispatchEvent(new CustomEvent('slide-changed', { 
          detail: { slideIndex: this.currentSlideIndex } 
        }));
      };
      this.slidesList.appendChild(thumbnail);
    });
  }
  
  transitionInSlide(index) {
    const slide = this.slidesArray[index];
    const data = this.slideData[index];
    
    if (!slide || !data) return;

    // Show current slide's 2D container
    data._container.style.display = 'flex';

    if (slide.transitionIn) {
      slide.transitionIn(data);
    }
    
    this.updateSlidesThumbnails();
  }

  transitionOutSlide(index) {
    const slide = this.slidesArray[index];
    const data = this.slideData[index];
    
    if (!slide || !data) return;

    if (slide.transitionOut) {
      slide.transitionOut(data);
    }

    // Hide 2D container after transition
    setTimeout(() => {
      data._container.style.display = 'none';
    }, 1000);
  }
  
  nextSlide() {
    if (this.slidesArray.length === 0) return;
    
    this.transitionOutSlide(this.currentSlideIndex);
    this.currentSlideIndex = (this.currentSlideIndex + 1) % this.slidesArray.length;
    this.transitionInSlide(this.currentSlideIndex);
    
    // Notify any listeners of slide change
    document.dispatchEvent(new CustomEvent('slide-changed', { 
      detail: { slideIndex: this.currentSlideIndex } 
    }));
    
    return this.currentSlideIndex;
  }
  
  prevSlide() {
    if (this.slidesArray.length === 0) return;
    
    this.transitionOutSlide(this.currentSlideIndex);
    this.currentSlideIndex = (this.currentSlideIndex - 1 + this.slidesArray.length) % this.slidesArray.length;
    this.transitionInSlide(this.currentSlideIndex);
    
    // Notify any listeners of slide change
    document.dispatchEvent(new CustomEvent('slide-changed', { 
      detail: { slideIndex: this.currentSlideIndex } 
    }));
    
    return this.currentSlideIndex;
  }
  
  getCurrentSlideIndex() {
    return this.currentSlideIndex;
  }
  
  getSlidesArray() {
    return this.slidesArray;
  }
  
  getSlideContainer(index) {
    if (index >= 0 && index < this.slideData.length) {
      return this.slideData[index]?._container || null;
    }
    return null;
  }
  
  // Returns slide container for the current slide
  getCurrentSlideContainer() {
    return this.getSlideContainer(this.currentSlideIndex);
  }
  
  // Get the 2D overlay element for attaching UI elements
  getOverlay() {
    return this.overlay2D;
  }
  
  // Clean up any resources
  destroy() {
    // Remove window resize listener
    window.removeEventListener('resize', this.handleResize.bind(this));
    
    // Unsubscribe from aspect ratio changes
    if (this.appState && this.appState.eventBus) {
      this.appState.eventBus.clear('state:aspectRatio');
    }
    
    // Remove all slide containers
    if (this.overlay2D) {
      while (this.overlay2D.firstChild) {
        this.overlay2D.removeChild(this.overlay2D.firstChild);
      }
    }
    
    // Clean up slide data that might have THREE.js objects
    if (this.slideData) {
      this.slideData.forEach(data => {
        if (data && typeof data === 'object') {
          Object.values(data).forEach(value => {
            if (value && value.geometry) value.geometry.dispose();
            if (value && value.material) value.material.dispose();
            if (value && value.parent) value.parent.remove(value);
          });
        }
      });
    }
    
    // Clear arrays
    this.slidesArray = [];
    this.slideData = [];
  }
}
