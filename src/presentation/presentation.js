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
    // Use high-resolution timestamps to calculate smoother animation deltas if needed
    const now = performance.now();
    
    // Schedule the next frame immediately for smoother animations
    const animationId = requestAnimationFrame(animate);
    
    // Render the scene
    renderer.render(scene, camera);
  }
  animate();

  // Process received media data
  function processMediaData(media) {
    if (!media || !Array.isArray(media) || media.length === 0) return;
    
    media.forEach(item => {
      // Use item.id as the key directly AND store with media/ prefix for easier lookup
      mediaStore[item.id] = item;
      mediaStore[`media/${item.id}`] = item; // Add with media/ prefix for direct matching
      
      console.log(`Loaded media: ${item.id} (${item.type})`);
      
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
      // Handle both 'id' and 'media/id' formats
      const cleanId = id.startsWith('media/') ? id.substring(6) : id;
      return document.getElementById(`media-${cleanId}`);
    };
    
    // Set up interceptors for all media references
    setupMediaInterceptors();
  }

  // Setup comprehensive media interceptors
  function setupMediaInterceptors() {
    // 1. Override THREE.TextureLoader for 3D textures
    setupTextureInterceptor();
    
    // 2. Override Image constructor for any dynamically created images
    setupImageInterceptor();
    
    // 3. Override fetch and XMLHttpRequest for any other media loading methods
    setupFetchInterceptor();
    
    console.log("All media interceptors have been set up");
  }

  // Setup THREE.js texture loader interceptor
  function setupTextureInterceptor() {
    // Save the original TextureLoader.load method
    const originalTextureLoader = THREE.TextureLoader.prototype.load;
    
    // Override the TextureLoader.load method to intercept media paths
    THREE.TextureLoader.prototype.load = function(url, onLoad, onProgress, onError) {
      // Check if this is a media reference
      const interceptedUrl = interceptMediaPath(url);
      
      if (interceptedUrl !== url) {
        console.log(`TextureLoader: Intercepted ${url} → ${interceptedUrl.substring(0, 50)}...`);
        url = interceptedUrl;
      }
      
      // Call the original method with potentially modified URL
      return originalTextureLoader.call(this, url, onLoad, onProgress, onError);
    };
  }
  
  // Setup Image constructor interceptor
  function setupImageInterceptor() {
    // Save references to original methods
    const originalImageSrc = Object.getOwnPropertyDescriptor(HTMLImageElement.prototype, 'src');
    
    // Override the src setter for Image objects
    Object.defineProperty(HTMLImageElement.prototype, 'src', {
      set: function(url) {
        const interceptedUrl = interceptMediaPath(url);
        
        if (interceptedUrl !== url) {
          console.log(`Image.src: Intercepted ${url} → ${interceptedUrl.substring(0, 50)}...`);
          originalImageSrc.set.call(this, interceptedUrl);
        } else {
          originalImageSrc.set.call(this, url);
        }
      },
      get: originalImageSrc.get
    });
  }
  
  // Setup fetch and XMLHttpRequest interceptors
  function setupFetchInterceptor() {
    // Save original fetch
    const originalFetch = window.fetch;
    
    // Override fetch
    window.fetch = function(url, options) {
      if (typeof url === 'string') {
        const interceptedUrl = interceptMediaPath(url);
        
        if (interceptedUrl !== url) {
          console.log(`fetch: Intercepted ${url} → ${interceptedUrl.substring(0, 50)}...`);
          return originalFetch.call(this, interceptedUrl, options);
        }
      }
      
      return originalFetch.call(this, url, options);
    };
    
    // Save original XMLHttpRequest open
    const originalOpen = XMLHttpRequest.prototype.open;
    
    // Override XMLHttpRequest.open
    XMLHttpRequest.prototype.open = function(method, url, async, user, password) {
      if (typeof url === 'string') {
        const interceptedUrl = interceptMediaPath(url);
        
        if (interceptedUrl !== url) {
          console.log(`XMLHttpRequest: Intercepted ${url} → ${interceptedUrl.substring(0, 50)}...`);
          return originalOpen.call(this, method, interceptedUrl, async, user, password);
        }
      }
      
      return originalOpen.call(this, method, url, async, user, password);
    };
  }
  
  // Core function to intercept and process media paths
  function interceptMediaPath(url) {
    if (!url || typeof url !== 'string') return url;
    
    // Check if url starts with media/ or contains /media/
    const isMediaPath = url.startsWith('media/') || url.includes('/media/');
    if (!isMediaPath) return url;
    
    let mediaId;
    if (url.startsWith('media/')) {
      mediaId = url;
    } else {
      const parts = url.split('/media/');
      mediaId = 'media/' + parts[parts.length - 1];
    }
    
    // First try with the exact path
    let mediaItem = mediaStore[mediaId];
    
    // If not found, try extracting just the filename
    if (!mediaItem) {
      const fileName = mediaId.split('/').pop();
      mediaItem = mediaStore[fileName] || mediaStore[`media/${fileName}`];
    }
    
    if (mediaItem) {
      // Return data URL
      return `data:${getMimeType(mediaItem.type)};base64,${mediaItem.data}`;
    }
    
    console.warn(`Media not found: ${mediaId}`);
    return url;
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
    return interceptMediaPath(mediaPath);
  };

  // Process media references in HTML
  function processMediaReferences(container) {
    if (!container) return;
    
    // Process all image, video, and audio elements
    const mediaElementSelectors = 'img[src], video[src], audio[src], [style*="background-image"]';
    const mediaElements = container.querySelectorAll(mediaElementSelectors);
    
    mediaElements.forEach(element => {
      // Process elements with explicit media path in src
      if (element.hasAttribute('src')) {
        const src = element.getAttribute('src');
        if (src && (src.startsWith('media/') || src.includes('/media/'))) {
          const interceptedUrl = interceptMediaPath(src);
          if (interceptedUrl !== src) {
            console.log(`processMediaReferences: Updating ${element.tagName} src from ${src} to data URL`);
            element.setAttribute('src', interceptedUrl);
          }
        }
      }
      
      // Process elements with background-image in style
      if (element.style && element.style.backgroundImage) {
        const bgImage = element.style.backgroundImage;
        if (bgImage.includes('media/') || bgImage.includes('/media/')) {
          const urlMatch = bgImage.match(/url\(['"]?(.*?)['"]?\)/);
          if (urlMatch && urlMatch[1]) {
            const originalUrl = urlMatch[1];
            const interceptedUrl = interceptMediaPath(originalUrl);
            if (interceptedUrl !== originalUrl) {
              console.log(`processMediaReferences: Updating backgroundImage from ${originalUrl} to data URL`);
              element.style.backgroundImage = `url(${interceptedUrl})`;
            }
          }
        }
      }
      
      // Also check data-media-id attribute for backward compatibility
      if (element.hasAttribute('data-media-id')) {
        const mediaId = element.getAttribute('data-media-id');
        const mediaItem = mediaStore[mediaId] || mediaStore[`media/${mediaId}`];
        
        if (mediaItem) {
          console.log(`Processing element with data-media-id: ${mediaId}`);
          if (element.tagName === 'IMG') {
            element.src = `data:${getMimeType(mediaItem.type)};base64,${mediaItem.data}`;
          } else if (element.tagName === 'VIDEO') {
            element.src = `data:${getMimeType(mediaItem.type)};base64,${mediaItem.data}`;
            element.controls = true;
          } else if (element.tagName === 'AUDIO') {
            element.src = `data:${getMimeType(mediaItem.type)};base64,${mediaItem.data}`;
            element.controls = true;
          } else if (element.style.backgroundImage) {
            element.style.backgroundImage = `url(data:${getMimeType(mediaItem.type)};base64,${mediaItem.data})`;
          }
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
    
    // Better preparation sequence for next slide
    requestHighQualityFrame(() => {
      prepareSlide(nextIndex);
      
      // First start exiting the current slide
      transitionOutSlide(currentSlideIndex, () => {
        // Then transition in the next slide after the outgoing transition has started
        requestHighQualityFrame(() => {
          transitionInSlide(nextIndex);
          currentSlideIndex = nextIndex;
          isTransitioning = false;
          
          // Preload the next slide in the sequence for even smoother transitions
          preloadNextSlide();
        });
      });
    });
  }

  // Similarly update the prevSlide function
  function prevSlide() {
    if (!slidesArray.length || isTransitioning) return;
    
    isTransitioning = true;
    const prevIndex = (currentSlideIndex - 1 + slidesArray.length) % slidesArray.length;
    
    requestHighQualityFrame(() => {
      prepareSlide(prevIndex);
      
      transitionOutSlide(currentSlideIndex, () => {
        requestHighQualityFrame(() => {
          transitionInSlide(prevIndex);
          currentSlideIndex = prevIndex;
          isTransitioning = false;
        });
      });
    });
  }

  // Prepare a slide container for display without animation
  function prepareSlide(index) {
    const data = slideData[index];
    if (!data) return;
    
    // Make visible but fully transparent
    data._container.style.display = 'flex';
    data._container.style.opacity = '0';
    
    // Force layout calculation to ensure the browser processes the new elements
    data._container.offsetHeight; // This triggers a reflow
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

  // Improved transition handling
  function transitionInSlide(index) {
    const slide = slidesArray[index];
    const data = slideData[index];
    
    if (!slide || !data) return;

    // Remove any temporary opacity setting
    data._container.style.removeProperty('opacity');

    // Make sure container is shown before transition
    data._container.style.display = 'flex';

    // Request animation frame to ensure the DOM has been updated before animating
    requestAnimationFrame(() => {
      try {
        if (slide.transitionIn) {
          slide.transitionIn(data);
        }
      } catch (error) {
        console.error(`Error in transitionIn for slide ${index}:`, error);
      }
    });
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
        
        // Use a shorter timeout to create some overlap between transitions
        // This creates a smoother experience between slides
        setTimeout(() => {
          if (callback) callback();
        }, 300); // Shorter overlap for faster transitions
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
    // Use a slightly longer delay to ensure transitions have fully completed
    setTimeout(() => {
      data._container.style.display = 'none';
    }, 1200); // Give more time for transitions to complete
  }

  // Add an additional function for preloading next slide resources
  function preloadNextSlide() {
    if (!slidesArray.length) return;
    
    const nextIndex = (currentSlideIndex + 1) % slidesArray.length;
    prepareSlide(nextIndex);
  }

  // Request a high-quality animation frame
  function requestHighQualityFrame(callback) {
    // Use setTimeout with 0 delay to break out of the current task
    setTimeout(() => {
      // Then use requestAnimationFrame for the next visual update
      requestAnimationFrame(() => {
        callback();
      });
    }, 0);
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
