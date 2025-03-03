/**
 * Export Renderer for Animotion
 * Ultra-simplified approach using direct document screenshots
 */

class ExportRenderer {
  constructor() {
    this.width = 1920; // Default export width (Full HD)
    this.height = 1080; // Default export height (16:9 ratio)
    this.slideData = [];
    this.mediaData = [];
    this.renderingSpace = null;
    this.renderContainer = null;
    this.renderer = null;
    this.scene = null;
    this.camera = null;
  }

  /**
   * Initialize the renderer with the given dimensions
   */
  initialize(width, height) {
    this.width = width || this.width;
    this.height = height || this.height;
    
    console.log(`Initializing export renderer at ${this.width}x${this.height}`);
    
    // Create a dedicated full-page renderer - MUST be in the viewport to render correctly
    this.renderingSpace = document.createElement('div');
    this.renderingSpace.id = 'export-render-space';
    this.renderingSpace.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: #000000;
      z-index: 99999;
      display: none;
      overflow: hidden;
    `;
    document.body.appendChild(this.renderingSpace);
    
    // Create an aspect-ratio-preserving container
    this.renderContainer = document.createElement('div');
    this.renderContainer.id = 'export-render-container';
    this.renderContainer.style.cssText = `
      position: absolute;
      top: 50%;
      left: 50%;
      width: ${this.width}px;
      height: ${this.height}px;
      transform: translate(-50%, -50%);
      background: #000000;
      overflow: hidden;
    `;
    this.renderingSpace.appendChild(this.renderContainer);
    
    // Create a canvas for Three.js content
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    canvas.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
    `;
    this.renderContainer.appendChild(canvas);
    
    // Set up Three.js renderer
    this.renderer = new THREE.WebGLRenderer({
      canvas,
      antialias: true,
      alpha: true,
      preserveDrawingBuffer: true
    });
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x000000, 0.9);
    
    // Create scene and camera
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(75, this.width / this.height, 0.1, 100);
    this.camera.position.z = 3;
    
    // Add a debug indicator with dimensions
    this.debugIndicator = document.createElement('div');
    this.debugIndicator.style.cssText = `
      position: absolute;
      bottom: 10px;
      right: 10px;
      background-color: rgba(255, 0, 0, 0.5);
      color: white;
      padding: 5px;
      border-radius: 3px;
      font-size: 12px;
      z-index: 100000;
    `;
    this.debugIndicator.textContent = `EXPORT ${this.width}×${this.height}`;
    this.renderContainer.appendChild(this.debugIndicator);
    
    return this;
  }
  
  /**
   * Load slides data from user code
   */
  loadSlideData(code, mediaData) {
    this.mediaData = mediaData || [];
    this.slideData = [];
    
    try {
      // Create simple function to capture slides array
      const playSlides = (slides) => {
        this.slideData = slides;
      };
      
      // Register media loading function for slide code to use
      window.loadMediaFromProject = (path) => {
        if (!path || !path.startsWith('media/')) return null;
        
        const fileName = path.replace('media/', '');
        const mediaItem = this.mediaData.find(m => m.name === fileName);
        
        if (mediaItem) {
          return `data:image/${mediaItem.type};base64,${mediaItem.data}`;
        }
        return null;
      };
      
      // Execute the user code to extract slides
      const executeFunction = new Function('THREE', 'gsap', 'scene', 'playSlides', code);
      executeFunction(THREE, gsap, new THREE.Scene(), playSlides);
      
      return this.slideData.length;
    } catch (err) {
      console.error('Error loading slides for export:', err);
      return 0;
    }
  }
  
  /**
   * Process a slide to set up its content for rendering
   */
  async renderSlide(index) {
    if (index < 0 || index >= this.slideData.length) {
      throw new Error(`Invalid slide index: ${index}`);
    }
    
    console.log(`Rendering slide ${index + 1} of ${this.slideData.length}`);
    
    try {
      // Clear previous content
      while(this.scene.children.length > 0) { 
        this.scene.remove(this.scene.children[0]); 
      }
      
      // Clear the container except for the canvas and debug indicator
      const children = Array.from(this.renderContainer.children);
      children.forEach(child => {
        if (child !== this.renderer.domElement && child !== this.debugIndicator) {
          child.remove();
        }
      });
      
      // Show the rendering space
      this.renderingSpace.style.display = 'block';
      
      // Create a slide container
      const slideContainer = document.createElement('div');
      slideContainer.style.cssText = `
        position: absolute;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        pointer-events: none;
      `;
      this.renderContainer.appendChild(slideContainer);
      
      // Initialize the slide
      console.log('Initializing slide...');
      const slide = this.slideData[index];
      const slideState = slide.init({
        scene: this.scene, 
        container: slideContainer
      });
      
      // Process any media references (images, etc.)
      this.processMediaReferences(slideContainer);
      
      // Run the transition in animation to show all elements
      if (slide.transitionIn) {
        console.log('Running transitionIn...');
        slide.transitionIn(slideState);
        
        // Force-complete all animations immediately
        gsap.globalTimeline.timeScale(100);
        await new Promise(resolve => setTimeout(resolve, 500));
        gsap.globalTimeline.timeScale(1);
      }
      
      // Ensure all elements are visible
      this.ensureVisibility(slideContainer);
      
      // Render the 3D scene once
      console.log('Rendering 3D scene...');
      this.renderer.render(this.scene, this.camera);
      
      // Wait for any remaining rendering to complete
      console.log('Waiting for stable render...');
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Take a screenshot of the rendering container
      console.log('Taking screenshot...');
      const screenshot = await this.captureScreenshot();
      
      return screenshot;
    } catch (error) {
      console.error(`Error rendering slide ${index}:`, error);
      throw error;
    } finally {
      // Hide the rendering space
      this.renderingSpace.style.display = 'none';
      
      // Clean up GSAP animations
      gsap.globalTimeline.clear();
    }
  }
  
  /**
   * Process any media references in elements
   */
  processMediaReferences(element) {
    if (!element) return;
    
    // Process images with media/ src
    const images = element.querySelectorAll('img[src^="media/"]');
    images.forEach(img => {
      const mediaPath = img.getAttribute('src');
      const fileName = mediaPath.replace('media/', '');
      const mediaItem = this.mediaData.find(m => m.name === fileName);
      
      if (mediaItem) {
        img.src = `data:image/${mediaItem.type};base64,${mediaItem.data}`;
      }
    });
    
    // Process background images in style attributes
    const elementsWithStyle = element.querySelectorAll('*[style*="background"]');
    elementsWithStyle.forEach(el => {
      const style = el.getAttribute('style') || '';
      if (style.includes('media/')) {
        const urlMatch = style.match(/url\(['"]?(media\/[^'")]+)['"]?\)/);
        if (urlMatch && urlMatch[1]) {
          const fileName = urlMatch[1].replace('media/', '');
          const mediaItem = this.mediaData.find(m => m.name === fileName);
          if (mediaItem) {
            const newStyle = style.replace(
              urlMatch[0], 
              `url(data:image/${mediaItem.type};base64,${mediaItem.data})`
            );
            el.setAttribute('style', newStyle);
          }
        }
      }
    });
  }
  
  /**
   * Make sure everything is fully visible
   */
  ensureVisibility(container) {
    // Force all elements to be visible
    const allElements = container.querySelectorAll('*');
    allElements.forEach(el => {
      // Force full opacity and visibility
      el.style.setProperty('opacity', '1', 'important');
      el.style.setProperty('visibility', 'visible', 'important');
      
      // Make sure nothing is hidden
      const computedStyle = window.getComputedStyle(el);
      if (computedStyle.display === 'none') {
        if (el.tagName === 'SPAN') {
          el.style.setProperty('display', 'inline', 'important');
        } else {
          el.style.setProperty('display', 'block', 'important');
        }
      }
    });
  }
  
  /**
   * Capture a screenshot of the current render
   */
  async captureScreenshot() {
    try {
      // First attempt: Use html2canvas if available
      if (window.html2canvas) {
        try {
          console.log('Using html2canvas for screenshot');
          const canvas = await html2canvas(this.renderContainer, {
            backgroundColor: null,
            scale: 1,
            allowTaint: true,
            useCORS: true,
            logging: false,
            width: this.width,
            height: this.height
          });
          
          return canvas.toDataURL('image/png');
        } catch (error) {
          console.error('html2canvas failed:', error);
        }
      }
      
      // Second attempt: Use createImageBitmap + canvas approach
      try {
        console.log('Using createImageBitmap approach');
        
        // Get screenshot using browser's built-in capabilities if available
        if (window.createImageBitmap) {
          const bitmap = await createImageBitmap(this.renderContainer);
          
          const canvas = document.createElement('canvas');
          canvas.width = this.width;
          canvas.height = this.height;
          const ctx = canvas.getContext('2d');
          
          ctx.drawImage(bitmap, 0, 0);
          bitmap.close();
          
          return canvas.toDataURL('image/png');
        }
      } catch (error) {
        console.error('createImageBitmap approach failed:', error);
      }
      
      // Last resort: Use canvas drawImage directly
      return this.captureCanvasScreenshot();
    } catch (error) {
      console.error('All screenshot methods failed:', error);
      // Return blank image as last resort
      return this.createBlankCanvas();
    }
  }
  
  /**
   * Create screenshot by drawing elements to canvas manually
   */
  captureCanvasScreenshot() {
    console.log('Using manual canvas capture approach');
    
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');
    
    // First, draw the WebGL canvas
    ctx.drawImage(this.renderer.domElement, 0, 0);
    
    // Then try to draw HTML elements recursively
    this.drawElementsToCanvas(this.renderContainer, ctx);
    
    return canvas.toDataURL('image/png');
  }
  
  /**
   * Draw HTML elements to canvas - simplified version
   */
  drawElementsToCanvas(element, ctx) {
    // Simple draw function that only handles text and rectangles
    const elems = element.querySelectorAll('*');
    
    elems.forEach(el => {
      const rect = el.getBoundingClientRect();
      const containerRect = this.renderContainer.getBoundingClientRect();
      
      // Calculate position relative to container
      const x = rect.left - containerRect.left;
      const y = rect.top - containerRect.top;
      const w = rect.width;
      const h = rect.height;
      
      // Skip elements outside the container or with no dimensions
      if (w <= 0 || h <= 0 || 
          x + w < 0 || y + h < 0 || 
          x > this.width || y > this.height) {
        return;
      }
      
      const style = window.getComputedStyle(el);
      
      // Draw background if it has one
      if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
        ctx.fillStyle = style.backgroundColor;
        ctx.fillRect(x, y, w, h);
      }
      
      // Draw text content if it's a simple text element
      if (el.textContent && !el.children.length) {
        ctx.font = `${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
        ctx.fillStyle = style.color;
        ctx.textBaseline = 'top';
        ctx.fillText(el.textContent, x, y);
      }
    });
  }
  
  /**
   * Create a blank canvas as absolute last resort
   */
  createBlankCanvas() {
    const canvas = document.createElement('canvas');
    canvas.width = this.width;
    canvas.height = this.height;
    const ctx = canvas.getContext('2d');
    
    // Fill with black
    ctx.fillStyle = '#000000';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Add error text
    ctx.fillStyle = '#ff0000';
    ctx.font = '24px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Screenshot Failed - See Console', canvas.width / 2, canvas.height / 2);
    
    return canvas.toDataURL('image/png');
  }
  
  /**
   * Export all slides as PNG images
   */
  async exportAllSlides(progressCallback = null) {
    const result = [];
    
    for (let i = 0; i < this.slideData.length; i++) {
      if (progressCallback) {
        progressCallback({
          current: i + 1,
          total: this.slideData.length,
          message: `Rendering slide ${i + 1} of ${this.slideData.length}...`
        });
      }
      
      try {
        const png = await this.renderSlide(i);
        result.push({
          index: i,
          data: png,
          success: true
        });
      } catch (err) {
        console.error(`Error exporting slide ${i}:`, err);
        result.push({
          index: i,
          success: false,
          error: err.message
        });
      }
    }
    
    return result;
  }
  
  /**
   * Clean up resources when done
   */
  destroy() {
    // Clean up animations
    gsap.globalTimeline.clear();
    
    // Clean up Three.js resources
    if (this.renderer) {
      this.renderer.dispose();
    }
    
    // Remove the rendering space
    if (this.renderingSpace) {
      this.renderingSpace.remove();
    }
    
    // Clear references
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.renderingSpace = null;
    this.renderContainer = null;
    this.slideData = [];
  }
}

export default ExportRenderer;
