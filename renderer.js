// This file sets up the Monaco Editor in the left pane and Three.js with GSAP on the right pane.
// The user code is executed on pressing Enter or clicking Play.

require.config({ paths: { 'vs': './vs' } });

require(['vs/editor/editor.main'], function(monaco) {
  // Create the Monaco Editor in the left pane
  const editorContainer = document.getElementById('editor');
  const editorInstance = monaco.editor.create(editorContainer, {
    value: `// Modify the code and press Enter or click Play to run it.
// This example defines two slides with basic animations.

const slides = [
  {
    init(scene) {
      // Slide 1: Red Cube
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
      return { cube };
    },
    transitionIn({ cube }) {
      gsap.fromTo(cube.scale, { x: 0, y: 0, z: 0 }, { duration: 1, x: 1, y: 1, z: 1 });
    },
    transitionOut({ cube }) {
      gsap.to(cube.position, { duration: 1, x: 2 });
    }
  },
  {
    init(scene) {
      // Slide 2: Green Sphere
      const geometry = new THREE.SphereGeometry(0.5, 32, 32);
      const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
      const sphere = new THREE.Mesh(geometry, material);
      sphere.position.x = -2;
      scene.add(sphere);
      return { sphere };
    },
    transitionIn({ sphere }) {
      gsap.fromTo(sphere.scale, { x: 0, y: 0, z: 0 }, { duration: 1, x: 1, y: 1, z: 1 });
    },
    transitionOut({ sphere }) {
      gsap.to(sphere.position, { duration: 1, x: 2 });
    }
  }
];

playSlides(slides);
    `,
    language: 'javascript',
    automaticLayout: true,
    theme: 'vs-dark'
  });

  // Set up Three.js in the right pane
  const canvas = document.getElementById('threeCanvas');
  const renderer = new THREE.WebGLRenderer({ canvas });
  renderer.setPixelRatio(window.devicePixelRatio);
  
  function resizeRenderer() {
    const width = canvas.clientWidth;
    const height = canvas.clientHeight;
    if (canvas.width !== width || canvas.height !== height) {
      renderer.setSize(width, height, false);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
    }
  }
  
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(75, canvas.clientWidth / canvas.clientHeight, 0.1, 100);
  camera.position.z = 3;

  function animate() {
    resizeRenderer();
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
  }
  animate();

  // Slide handling variables
  let slidesArray = [];
  let slideData = [];
  let currentSlideIndex = 0;
  let isPlaying = false;
  let playInterval = null;

  // UI Elements
  const slidesPanel = document.getElementById('slidesPanel');
  const collapseButton = document.getElementById('collapseButton');
  const slidesList = document.getElementById('slidesList');
  const addSlideBtn = document.getElementById('addSlideBtn');
  const playBtn = document.getElementById('playBtn');

  // Collapse panel functionality
  collapseButton.addEventListener('click', () => {
    slidesPanel.style.width = slidesPanel.style.width === '40px' ? '200px' : '40px';
    collapseButton.textContent = slidesPanel.style.width === '40px' ? '▶' : '◀';
  });

  // Update slides thumbnails
  function updateSlidesThumbnails() {
    slidesList.innerHTML = '';
    slidesArray.forEach((_, index) => {
      const thumbnail = document.createElement('div');
      thumbnail.className = `slide-thumbnail${index === currentSlideIndex ? ' active' : ''}`;
      thumbnail.textContent = `Slide ${index + 1}`;
      thumbnail.onclick = () => {
        transitionOutSlide(currentSlideIndex);
        currentSlideIndex = index;
        transitionInSlide(currentSlideIndex);
        updateSlidesThumbnails();
      };
      slidesList.appendChild(thumbnail);
    });
  }

  // Add new slide functionality
  addSlideBtn.addEventListener('click', () => {
    const currentCode = editorInstance.getValue();
    const newSlideTemplate = `
    {
      init(scene) {
        // New Slide
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0x0000ff });
        const mesh = new THREE.Mesh(geometry, material);
        scene.add(mesh);
        return { mesh };
      },
      transitionIn({ mesh }) {
        gsap.fromTo(mesh.scale, { x: 0, y: 0, z: 0 }, { duration: 1, x: 1, y: 1, z: 1 });
      },
      transitionOut({ mesh }) {
        gsap.to(mesh.position, { duration: 1, x: 2 });
      }
    }`;
    
    // Insert new slide into the code
    const lastBracketIndex = currentCode.lastIndexOf(']');
    const newCode = currentCode.slice(0, lastBracketIndex) +
      (slidesArray.length > 0 ? ',' : '') +
      newSlideTemplate +
      currentCode.slice(lastBracketIndex);
    
    editorInstance.setValue(newCode);
    runUserCode(newCode);
  });

  // Play functionality
  playBtn.addEventListener('click', togglePlay);

  function togglePlay() {
    isPlaying = !isPlaying;
    playBtn.textContent = isPlaying ? '⏸ Pause' : '▶ Play';
    
    if (isPlaying) {
      playInterval = setInterval(() => {
        transitionOutSlide(currentSlideIndex);
        currentSlideIndex = (currentSlideIndex + 1) % slidesArray.length;
        transitionInSlide(currentSlideIndex);
        updateSlidesThumbnails();
      }, 3000); // Change slide every 3 seconds
    } else {
      clearInterval(playInterval);
    }
  }

  // Function to run user code from the editor in a sandboxed function
  function runUserCode(code) {
    // Stop playing if active
    if (isPlaying) {
      togglePlay();
    }
    
    // Clear the scene
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }
    slidesArray = [];
    slideData = [];
    currentSlideIndex = 0;

    try {
      // Create a new function to evaluate the user code.
      const userFn = new Function('THREE', 'gsap', 'scene', 'playSlides', code);
      userFn(THREE, gsap, scene, playSlides);
    } catch (err) {
      console.error('User Code Error:', err);
    }
  }

  // Expose playSlides to the user code
  function playSlides(slides) {
    slidesArray = slides;
    slideData = slides.map(() => null);

    // Initialize each slide
    slidesArray.forEach((slide, idx) => {
      slideData[idx] = slide.init(scene);
    });

    // Update the slides thumbnails
    updateSlidesThumbnails();

    // Start with the first slide
    transitionInSlide(0);
  }

  function transitionInSlide(index) {
    if (slidesArray[index] && slidesArray[index].transitionIn) {
      slidesArray[index].transitionIn(slideData[index]);
    }
    updateSlidesThumbnails();
  }

  function transitionOutSlide(index) {
    if (slidesArray[index] && slidesArray[index].transitionOut) {
      slidesArray[index].transitionOut(slideData[index]);
    }
  }

  // Set up key event handling to run code or change slides
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') {
      // Run/re-run the code when Enter is pressed
      const userCode = editorInstance.getValue();
      runUserCode(userCode);
    } else if (e.key === 'ArrowRight') {
      // Move to next slide
      if (slidesArray.length > 0) {
        transitionOutSlide(currentSlideIndex);
        currentSlideIndex = (currentSlideIndex + 1) % slidesArray.length;
        transitionInSlide(currentSlideIndex);
      }
    } else if (e.key === 'ArrowLeft') {
      // Move to previous slide
      if (slidesArray.length > 0) {
        transitionOutSlide(currentSlideIndex);
        currentSlideIndex = (currentSlideIndex - 1 + slidesArray.length) % slidesArray.length;
        transitionInSlide(currentSlideIndex);
      }
    }
  });

  // Run the initial code automatically on load
  runUserCode(editorInstance.getValue());
});