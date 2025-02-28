// Presentation View Script
import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';

// Make Water and Sky available globally
window.Water = Water;
window.Sky = Sky;

(async function() {
  // Elements
  const canvas = document.getElementById('presentationCanvas');
  const overlay2D = document.getElementById('overlay-2d');

  // Set up Three.js
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
  renderer.setClearColor(0x000000, 1);
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.z = 3;

  // Variables for slides
  let slidesArray = [];
  let slideData = [];
  let currentSlideIndex = 0;
  let isTransitioning = false;
  
  // Media storage
  const mediaStore = {};

  // Show loading message
  overlay2D.innerHTML = '<h1 style="color:white">Loading presentation...</h1>';

  // Request slide data from parent window
  try {
    // Signal to parent window that we're ready to receive data
    if (window.opener) {
      window.opener.postMessage({ type: 'presentation-ready' }, '*');
    } else {
      overlay2D.innerHTML = '<h1 style="color:white">Error: No parent window found</h1>';
    }
  } catch (error) {
    console.error("Error requesting slide data:", error);
    overlay2D.innerHTML = '<h1 style="color:white">Error loading slides</h1>';
  }

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  // Process received media data
  function processMediaData(media) {
    if (!media || !Array.isArray(media) || media.length === 0) return;
    
    media.forEach(item => {
      mediaStore[item.id] = item;
      // Create an element in the document head for loading media
      const mediaElement = document.createElement(
        item.type === 'mp4' || item.type === 'mov' ? 'video' : 
        item.type === 'mp3' || item.type === 'wav' ? 'audio' : 
        'img'
      );
      
      mediaElement.id = `media-${item.id}`;
      mediaElement.style.display = 'none';
      mediaElement.src = `data:${getMimeType(item.type)};base64,${item.data}`;
      document.head.appendChild(mediaElement);
    });
    
    // Expose a global helper function to get media elements
    window.getMediaElement = function(id) {
      return document.getElementById(`media-${id}`);
    };
    
    // Set up THREE.js texture interceptor for media paths
    setupTextureInterceptor();
  }

  // Setup THREE.js texture loader interceptor
  function setupTextureInterceptor() {
    // Save the original TextureLoader.load method
    const originalTextureLoader = THREE.TextureLoader.prototype.load;
    
    // Override the TextureLoader.load method to intercept media paths
    THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {
      // Check if this is a media reference
      if (typeof url === 'string' && url.startsWith('media/')) {
        const mediaId = url.replace('media/', '');
        const mediaItem = mediaStore[mediaId];
        
        if (mediaItem) {
          // Replace with data URL
          url = `data:${getMimeType(mediaItem.type)};base64,${mediaItem.data}`;
          // FIX: Correct the syntax error in the log message
          console.log(`Intercepted media path ${mediaId}, using data URL instead`);
        } else {
          console.warn(`Media item not found: ${mediaId}`);
        }
      }
      
      // Call the original method with potentially modified URL
      return originalTextureLoader.call(this, url, onLoad, onProgress, onError);
    };
  }

  // Helper function to get MIME type
  function getMimeType(extension) {
    const mimeTypes = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'mp4': 'video/mp4',
      'mov': 'video/quicktime',
      'mp3': 'audio/mpeg',
      'wav': 'audio/wav'
    };
    return mimeTypes[extension] || 'application/octet-stream';
  }
  
  // Add global media loading function for direct access from slide code
  window.loadMediaFromProject = function(mediaPath) {
    if (!mediaPath || !mediaPath.startsWith('media/')) {
      return null;
    }
    
    const mediaId = mediaPath.replace('media/', '');
    const mediaItem = mediaStore[mediaId];
    
    if (!mediaItem) {
      console.warn(`Media item not found: ${mediaId}`);
      return null;
    }
    
    return `data:${getMimeType(mediaItem.type)};base64,${mediaItem.data}`;
  };

  // Process media references in HTML
  function processMediaReferences(container) {
    if (!container) return;
    
    // Find all elements with data-media-id attribute
    const mediaElements = container.querySelectorAll('[data-media-id]');
    
    mediaElements.forEach(element => {
      const mediaId = element.getAttribute('data-media-id');
      if (mediaStore[mediaId]) {
        const item = mediaStore[mediaId];
        
        if (element.tagName === 'IMG') {
          element.src = `data:${getMimeType(item.type)};base64,${item.data}`;
        } else if (element.tagName === 'VIDEO') {
          element.src = `data:${getMimeType(item.type)};base64,${item.data}`;
          element.controls = true;
        } else if (element.tagName === 'AUDIO') {
          element.src = `data:${getMimeType(item.type)};base64,${item.data}`;
          element.controls = true;
        } else if (element.style.backgroundImage) {
          element.style.backgroundImage = `url(data:${getMimeType(item.type)};base64,${item.data})`;
        }
      }
    });
  }

  // Window resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (isTransitioning) return;
    
    if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'Space') {
      nextSlide();
    } else if (e.key === 'ArrowLeft') {
      prevSlide();
    } else if (e.key === 'Escape') {
      exitPresentation();
    }
  });

  function exitPresentation() {
    if (window.opener && !window.opener.closed) {
      window.opener.postMessage({ type: 'presentation-closed' }, '*');
    }
    window.close();
  }

  // Improved slide navigation with overlapping transitions
  function nextSlide() {
    if (!slidesArray.length || isTransitioning) return;
    
    isTransitioning = true;
    const nextIndex = (currentSlideIndex + 1) % slidesArray.length;
    
    // Make sure the next slide is ready but not visible
    prepareSlide(nextIndex);
    
    // Start transitioning out the current slide
    transitionOutSlide(currentSlideIndex, () => {
      // Start transition in of next slide immediately, with overlap
      transitionInSlide(nextIndex);
      currentSlideIndex = nextIndex;
      isTransitioning = false;
    });
  }

  // Navigate to previous slide with same overlapping pattern
  function prevSlide() {
    if (!slidesArray.length || isTransitioning) return;
    
    isTransitioning = true;
    const prevIndex = (currentSlideIndex - 1 + slidesArray.length) % slidesArray.length;
    
    // Make sure the previous slide is ready but not visible
    prepareSlide(prevIndex);
    
    // Start transitioning out the current slide
    transitionOutSlide(currentSlideIndex, () => {
      // Start transition in of previous slide immediately
      transitionInSlide(prevIndex);
      currentSlideIndex = prevIndex;
      isTransitioning = false;
    });
  }

  // Prepare a slide container for display without animation
  function prepareSlide(index) {
    const data = slideData[index];
    if (!data) return;
    
    // Make visible but fully transparent
    data._container.style.display = 'flex';
    data._container.style.opacity = '0';
  }

  // Evaluate user code
  function evaluateUserCode(code) {
    // Clear scene and overlay
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }
    overlay2D.innerHTML = '';
    
    try {
      const userFn = new Function('THREE', 'gsap', 'scene', 'playSlides', code);
      userFn(THREE, gsap, scene, playSlides);
    } catch (err) {
      console.error('User Code Error:', err);
      overlay2D.innerHTML = `<h1 style="color:red">Error: ${err.message}</h1>`;
    }
  }

  // Implementation of playSlides function that gets called from user code
  function playSlides(slides) {
    slidesArray = slides;
    slideData = slides.map(() => null);
  
    // Initialize each slide with both scene and container access
    slidesArray.forEach((slide, idx) => {
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
      overlay2D.appendChild(slideContainer);
  
      try {
        // Initialize slide with access to both 3D scene and 2D container
        slideData[idx] = slide.init({
          scene,
          container: slideContainer
        });
        slideData[idx]._container = slideContainer;
        
        // Process any media references in the slide container
        processMediaReferences(slideContainer);
      } catch (error) {
        console.error(`Error initializing slide ${idx}:`, error);
      }
    });
  
    // Show first slide
    transitionInSlide(0);
  }

  function transitionInSlide(index) {
    const slide = slidesArray[index];
    const data = slideData[index];
    
    if (!slide || !data) return;

    // Remove any temporary opacity setting
    data._container.style.removeProperty('opacity');

    // Show current slide's 2D container
    data._container.style.display = 'flex';

    try {
      if (slide.transitionIn) {
        slide.transitionIn(data);
      }
    } catch (error) {
      console.error(`Error in transitionIn for slide ${index}:`, error);
    }
  }

  function transitionOutSlide(index, callback) {
    const slide = slidesArray[index];
    const data = slideData[index];
    
    if (!slide || !data) {
      if (callback) callback();
      return;
    }

    try {
      if (slide.transitionOut) {
        // Start transition out and call the callback after a short delay
        slide.transitionOut(data);
        
        // We use a shorter timeout to create some overlap between transitions
        setTimeout(() => {
          if (callback) callback();
        }, 500); // Half a second overlap
      } else {
        // If there's no transition, call the callback immediately
        if (callback) callback();
      }
    } catch (error) {
      console.error(`Error in transitionOut for slide ${index}:`, error);
      // Still call the callback to prevent getting stuck
      if (callback) callback();
    }

    // Clean up the slide after transition completes
    setTimeout(() => {
      data._container.style.display = 'none';
    }, 1000); // Full cleanup delay
  }

  // Handle window events
  window.addEventListener('message', (event) => {
    if (event.data.type === 'slide-update') {
      evaluateUserCode(event.data.code);
    } else if (event.data.type === 'slide-data') {
      // Process media data if available
      if (event.data.media) {
        processMediaData(event.data.media);
      }
      
      // Initial slide data received
      overlay2D.innerHTML = ''; // Clear loading message
      evaluateUserCode(event.data.code);
    }
  });
})();
