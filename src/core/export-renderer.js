/**
 * Export Renderer for Animotion
 * Uses Electron's native screenshot capability for exact exports
 */

class ExportRenderer {
    constructor() {
      this.width = 1920;
      this.height = 1080;
      this.slideData = [];
      this.mediaData = [];
      this.renderingSpace = null;
      this.renderContainer = null;
      this.renderer = null;
      this.scene = null;
      this.camera = null;
      this.electronCapture = 'electron' in window;
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
      
      // Add a small indicator label during export (will be removed in final screenshots)
      this.debugIndicator = document.createElement('div');
      this.debugIndicator.id = 'debug-indicator';
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
        
        console.log(`ExportRenderer: Loaded ${this.slideData.length} slides from code`);
        return this.slideData.length;
      } catch (err) {
        console.error('Error loading slides for export:', err);
        return 0;
      }
    }
    
    /**
     * Get the loaded slide data
     * @returns {Array} The array of slides
     */
    getSlideData() {
      return this.slideData;
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
        
        // Create a slide container - keep it simple without added styles
        const slideContainer = document.createElement('div');
        slideContainer.style.cssText = `
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          overflow: visible;
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
          try {
            slide.transitionIn(slideState);
            
            // Force-complete all animations immediately
            gsap.globalTimeline.timeScale(100);
            await new Promise(resolve => setTimeout(resolve, 1000));
            gsap.globalTimeline.timeScale(1);
          } catch (e) {
            console.error('Error during transition:', e);
          }
        }
        
        // Make sure all elements have maximum visibility without changing positions
        this.ensureAllElementsVisible(slideContainer);
        
        // Render the 3D scene
        console.log('Rendering 3D scene...');
        this.renderer.render(this.scene, this.camera);
        
        // Wait for rendering to stabilize naturally, but don't modify the DOM structure
        console.log('Waiting for stable render...');
        await new Promise(resolve => setTimeout(resolve, 800));
        
        // Hide the debug indicator for the screenshot
        if (this.debugIndicator) {
          this.debugIndicator.style.display = 'none';
        }
        
        // Take the screenshot without any DOM modifications
        console.log('Taking screenshot...');
        let screenshot = null;
        
        try {
          console.log('Using Electron native screenshot');
          const rect = this.renderContainer.getBoundingClientRect();
          console.log(`Capture rect: x=${rect.left}, y=${rect.top}, w=${rect.width}, h=${rect.height}`);
          
          screenshot = await window.electronAPI.captureElement({
            x: Math.round(rect.left),
            y: Math.round(rect.top),
            width: Math.round(rect.width),
            height: Math.round(rect.height)
          });
          console.log('Screenshot captured successfully');
        } catch (err) {
          console.error('Screenshot capture failed:', err);
          screenshot = await this.captureScreenshot();
        }
        
        // Show the debug indicator again for next slides
        if (this.debugIndicator) {
          this.debugIndicator.style.display = 'block';
        }
        
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
     * Ensure all elements are visible without changing positions
     */
    ensureAllElementsVisible(container) {
      // Simple visibility fixes without position changes
      const allElements = container.querySelectorAll('*');
      allElements.forEach(el => {
        // Only set opacity and visibility but don't change positioning
        el.style.opacity = '1';
        el.style.visibility = 'visible';
        
        // For text elements with no color, ensure they're visible
        if (el.textContent && el.textContent.trim() && !el.children.length) {
          const style = window.getComputedStyle(el);
          if (style.color === 'transparent' || style.color === 'rgba(0, 0, 0, 0)') {
            el.style.color = '#ffffff';
          }
        }
      });
    }
  
    /**
     * Capture a screenshot of the current render - simplified version
     */
    async captureScreenshot() {
      try {
        if (window.html2canvas) {
          console.log('Using html2canvas fallback');
          const canvas = await html2canvas(this.renderContainer, {
            backgroundColor: null,
            scale: 1,
            allowTaint: true,
            useCORS: true,
            logging: false
          });
          return canvas.toDataURL('image/png');
        }
      } catch (error) {
        console.error('Screenshot failed:', error);
      }
      
      // Last resort: manual canvas capture
      return this.captureCanvasScreenshot();
    }
  
    /**
     * Create screenshot by drawing elements to canvas manually
     */
    captureCanvasScreenshot() {
      console.log('Starting manual canvas capture');
      
      // Create canvas with exact dimensions
      const canvas = document.createElement('canvas');
      canvas.width = this.width;
      canvas.height = this.height;
      const ctx = canvas.getContext('2d');
      
      // Clear with black background
      ctx.fillStyle = '#000000';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      
      try {
        // Try a more direct approach - render the Three.js scene directly to our canvas
        console.log('Drawing WebGL scene directly');
        this.renderer.render(this.scene, this.camera);
        const threeCanvas = this.renderer.domElement;
        
        // Draw the Three.js canvas content to our export canvas
        ctx.drawImage(threeCanvas, 0, 0, canvas.width, canvas.height);
        
        // Add attempt to screenshot with html2canvas - this can sometimes work better
        if (window.html2canvas) {
          window.html2canvas(this.renderContainer, {
            canvas: canvas,
            backgroundColor: null,
            useCORS: true,
            logging: true,
            removeContainer: false,
          }).catch(err => console.log('Secondary html2canvas failed:', err));
        }
        
        // Then try to draw HTML elements on top
        this.drawElementsToCanvas(this.renderContainer, ctx);
        
      } catch (e) {
        console.error('Error during canvas capture:', e);
      }
      
      // Final step - try to grab pixel data from the render container directly
      try {
        // Position the canvas element exactly over the render container
        const rect = this.renderContainer.getBoundingClientRect();
        canvas.style.position = 'absolute';
        canvas.style.top = rect.top + 'px';
        canvas.style.left = rect.left + 'px';
        canvas.style.zIndex = '999999';
        document.body.appendChild(canvas);
        
        // Let the browser render one more frame with our canvas
        setTimeout(() => {
          document.body.removeChild(canvas);
        }, 100);
        
      } catch (e) {
        console.error('Error during final canvas positioning:', e);
      }
      
      console.log('Manual canvas capture completed');
      return canvas.toDataURL('image/png');
    }
    
    /**
     * Draw HTML elements to canvas - improved version
     */
    drawElementsToCanvas(element, ctx) {
      console.log('Drawing HTML elements to canvas');
      
      // Draw backgrounds and text of all elements
      const traverseElements = (el, parentOpacity = 1) => {
        if (!el || !el.childNodes) return;
        
        // Process element itself if it's an element node
        if (el.nodeType === 1) { // ELEMENT_NODE
          const rect = el.getBoundingClientRect();
          const containerRect = this.renderContainer.getBoundingClientRect();
          
          // Calculate position relative to container
          const x = rect.left - containerRect.left;
          const y = rect.top - containerRect.top;
          const w = rect.width;
          const h = rect.height;
          
          // Skip elements outside the container or with no dimensions
          if (w <= 0 || h <= 0 || x + w < 0 || y + h < 0 || x > this.width || y > this.height) {
            return;
          }
          
          const style = window.getComputedStyle(el);
          const opacity = parseFloat(style.opacity) * parentOpacity;
          
          // Skip completely transparent elements
          if (opacity <= 0) return;
          
          // Set global alpha for this element
          ctx.globalAlpha = opacity;
          
          // Draw background if it has one
          if (style.backgroundColor && style.backgroundColor !== 'rgba(0, 0, 0, 0)') {
            try {
              ctx.fillStyle = style.backgroundColor;
              ctx.fillRect(x, y, w, h);
            } catch (e) {
              console.error('Error drawing background:', e);
            }
          }
          
          // Draw borders if present
          if (parseInt(style.borderWidth) > 0 && style.borderStyle !== 'none') {
            try {
              ctx.strokeStyle = style.borderColor;
              ctx.lineWidth = parseInt(style.borderWidth);
              ctx.strokeRect(x, y, w, h);
            } catch (e) {
              console.error('Error drawing border:', e);
            }
          }
          
          // Draw text content if it's a text element with no children
          if (el.textContent && !el.hasChildNodes()) {
            try {
              const fontSize = parseInt(style.fontSize);
              const fontFamily = style.fontFamily.split(',')[0].replace(/['"]/g, '').trim();
              
              ctx.fillStyle = style.color;
              ctx.font = `${style.fontWeight} ${fontSize}px ${fontFamily}, sans-serif`;
              ctx.textBaseline = 'top';
              
              let textX = x;
              // Handle text alignment
              if (style.textAlign === 'center') {
                textX += w / 2;
                ctx.textAlign = 'center';
              } else if (style.textAlign === 'right') {
                textX += w;
                ctx.textAlign = 'right';
              } else {
                ctx.textAlign = 'left';
              }
              
              // Apply padding
              const paddingLeft = parseInt(style.paddingLeft) || 0;
              const paddingTop = parseInt(style.paddingTop) || 0;
              
              ctx.fillText(el.textContent, textX + paddingLeft, y + paddingTop);
            } catch (e) {
              console.error('Error drawing text:', e);
            }
          }
        }
        
        // Recursively process children
        Array.from(el.childNodes).forEach(child => {
          if (child.nodeType === 1) { // Only process element nodes
            const style = window.getComputedStyle(el);
            traverseElements(child, parseFloat(style.opacity) * parentOpacity);
          }
        });
      };
      
      // Start traversal from the container
      traverseElements(element);
      
      // Reset global alpha
      ctx.globalAlpha = 1;
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
