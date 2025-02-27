// Presentation View Script

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

  // Get slide data from main window
  try {
    // Request slide code from parent window
    const params = new URLSearchParams(window.location.search);
    const slideDataJson = params.get('slideData');
    
    if (slideDataJson) {
      const slideInfo = JSON.parse(decodeURIComponent(slideDataJson));
      evaluateUserCode(slideInfo.code);
    } else {
      console.error("No slide data provided");
      overlay2D.innerHTML = '<h1 style="color:white">No slide data available</h1>';
    }
  } catch (error) {
    console.error("Error initializing presentation:", error);
    overlay2D.innerHTML = '<h1 style="color:white">Error loading slides</h1>';
  }

  // Animation loop
  function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  // Window resize handler
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Keyboard navigation
  window.addEventListener('keydown', (e) => {
    if (isTransitioning) return;
    
    if (e.key === 'ArrowRight' || e.key === 'Space') {
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

  // Navigate to next slide
  function nextSlide() {
    if (!slidesArray.length || isTransitioning) return;
    
    isTransitioning = true;
    transitionOutSlide(currentSlideIndex, () => {
      currentSlideIndex = (currentSlideIndex + 1) % slidesArray.length;
      transitionInSlide(currentSlideIndex);
      isTransitioning = false;
    });
  }

  // Navigate to previous slide
  function prevSlide() {
    if (!slidesArray.length || isTransitioning) return;
    
    isTransitioning = true;
    transitionOutSlide(currentSlideIndex, () => {
      currentSlideIndex = (currentSlideIndex - 1 + slidesArray.length) % slidesArray.length;
      transitionInSlide(currentSlideIndex);
      isTransitioning = false;
    });
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
        slide.transitionOut(data);
      }
    } catch (error) {
      console.error(`Error in transitionOut for slide ${index}:`, error);
    }

    // Hide 2D container after transition with timeout
    setTimeout(() => {
      data._container.style.display = 'none';
      if (callback) callback();
    }, 1000);
  }

  // Handle window events
  window.addEventListener('message', (event) => {
    if (event.data.type === 'slide-update') {
      evaluateUserCode(event.data.code);
    }
  });
})();
