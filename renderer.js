// This file sets up the Monaco Editor in the left pane and Three.js with GSAP on the right pane.
// The user code is executed on pressing Enter or clicking Play.

require.config({ paths: { 'vs': './vs' } });

require(['vs/editor/editor.main'], function(monaco) {
  // Create the Monaco Editor in the left pane
  const editorContainer = document.getElementById('editor');
  const editorInstance = monaco.editor.create(editorContainer, {
    value: `// Modify the code and press Enter or click Play to run it.
// This example defines slides that can mix 2D and 3D content freely.

// Modify the code and press Enter or click Play to run it.
// This example defines slides that can mix 2D and 3D content freely.

const slides = [
  {
    init({ scene, container }) {
      // Slide 1: Title with floating 3D cube
      const title = document.createElement('h1');
      title.textContent = 'Welcome to Animotion';
      title.style.cssText = 'color: white; opacity: 0; position: relative;';
      
      const subtitle = document.createElement('h2');
      subtitle.textContent = 'Mix 2D and 3D Content Freely!';
      subtitle.style.cssText = 'color: #888; opacity: 0; position: relative;';
      
      container.appendChild(title);
      container.appendChild(subtitle);
      
      // Add a floating 3D cube
      const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
      const material = new THREE.MeshBasicMaterial({ color: 0x6495ED });
      const cube = new THREE.Mesh(geometry, material);
      cube.position.set(-2, 1, 0);
      scene.add(cube);
      
      return { title, subtitle, cube };
    },
    transitionIn({ title, subtitle, cube }) {
      // Animate 2D elements
      gsap.to(title, { duration: 1, opacity: 1, y: 20 });
      gsap.to(subtitle, { duration: 1, opacity: 1, y: 20, delay: 0.5 });
      
      // Animate 3D elements
      gsap.to(cube.position, { 
        duration: 2,
        x: 2,
        ease: "power1.inOut",
        repeat: -1,
        yoyo: true
      });
      gsap.to(cube.rotation, {
        duration: 3,
        y: Math.PI * 2,
        repeat: -1,
        ease: "none"
      });
    },
    transitionOut({ title, subtitle, cube }) {
      gsap.to([title, subtitle], { duration: 0.5, opacity: 0, y: -20 });
      gsap.to(cube.position, { duration: 0.5, y: -2, onComplete: () => {
          cube.geometry.dispose();
          cube.material.dispose();
          cube.parent.remove(cube);
      }});
    }
  },
  {
    init({ scene, container }) {
      // Slide 2: Content with 3D visualization
      const content = document.createElement('div');
      content.style.cssText = 'position: relative; padding: 20px;';
      content.innerHTML = \`
        <h2 style="color: white; opacity: 0">Key Features</h2>
        <ul style="color: white; font-size: 1.5em">
          <li style="opacity: 0">Mix 2D and 3D content ✨</li>
          <li style="opacity: 0">Smooth transitions 🎭</li>
          <li style="opacity: 0">Easy to customize 🎨</li>
        </ul>
      \`;
      container.appendChild(content);
      
      // Create a 3D visualization
      const group = new THREE.Group();
      const shapes = [];
      const colors = [0xff0000, 0x00ff00, 0x0000ff];
      
      for(let i = 0; i < 3; i++) {
        const geometry = new THREE.SphereGeometry(0.2, 16, 16);
        const material = new THREE.MeshBasicMaterial({ color: colors[i] });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.set(1.5, 0.5 - i * 0.5, 0);
        group.add(sphere);
        shapes.push(sphere);
      }
      
      scene.add(group);
      
      return {
        title: content.querySelector('h2'),
        items: Array.from(content.querySelectorAll('li')),
        shapes,
        group
      };
    },
    transitionIn({ title, items, shapes, group }) {
      // Animate 2D elements
      gsap.to(title, { duration: 0.5, opacity: 1 });
      gsap.to(items, {
        duration: 0.5,
        opacity: 1,
        x: 20,
        stagger: 0.2
      });
      
      // Animate 3D elements
      shapes.forEach((sphere, i) => {
        gsap.from(sphere.position, {
          duration: 1,
          x: -2,
          delay: i * 0.2,
          ease: "back.out"
        });
      });
      
      // Continuous rotation animation
      gsap.to(group.rotation, {
        duration: 4,
        y: Math.PI * 2,
        repeat: -1,
        ease: "none"
      });
    },
    transitionOut({ title, items, shapes, group }) {
      gsap.to([title, ...items], { duration: 0.5, opacity: 0 });
      gsap.to(shapes.map(s => s.position), {
          duration: 0.5,
          x: 3,
          stagger: 0.1,
          onComplete: () => {
              shapes.forEach(sphere => {
                  sphere.geometry.dispose();
                  sphere.material.dispose();
                  sphere.parent.remove(sphere);
              });
              group.parent.remove(group);
          }
      });
    }
  },
  {
    init({ scene, container }) {
        // Slide 3: Pure Text with Dynamic Typography
        const wrapper = document.createElement('div');
        wrapper.style.cssText = \`
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            text-align: center;
            padding: 40px;
            color: white;
        \`;
        
        const quote = document.createElement('div');
        quote.innerHTML = \`
            <h1 style="font-size: 3em; opacity: 0; transform: translateY(20px); margin-bottom: 30px;">
                "Design is not just what it looks like and feels like.<br>Design is how it works."
            </h1>
            <h2 style="font-size: 1.5em; opacity: 0; transform: translateY(20px); color: #888;">
                — Steve Jobs
            </h2>
            <p style="font-size: 1.2em; opacity: 0; transform: translateY(20px); margin-top: 50px; color: #666;">
                Animotion combines beautiful design with powerful functionality,<br>
                creating presentations that truly stand out.
            </p>
        \`;
        
        wrapper.appendChild(quote);
        container.appendChild(wrapper);
        
        return {
            title: quote.querySelector('h1'),
            author: quote.querySelector('h2'),
            description: quote.querySelector('p')
        };
    },
    transitionIn({ title, author, description }) {
        gsap.to(title, {
            duration: 1,
            opacity: 1,
            y: 0,
            ease: "power2.out"
        });
        gsap.to(author, {
            duration: 1,
            opacity: 1,
            y: 0,
            delay: 0.5,
            ease: "power2.out"
        });
        gsap.to(description, {
            duration: 1,
            opacity: 1,
            y: 0,
            delay: 1,
            ease: "power2.out"
        });
    },
    transitionOut({ title, author, description }) {
        gsap.to([title, author, description], {
            duration: 0.5,
            opacity: 0,
            y: -20,
            stagger: 0.1
        });
    }
  },
  {
    init({ scene, container }) {
      // Create a particle system with a burst of particles
      const particleCount = 10000;
      const positions = new Float32Array(particleCount * 3);
      for (let i = 0; i < particleCount; i++) {
        // Spread particles in a large cube
        positions[i * 3 + 0] = (Math.random() - 0.5) * 50;
        positions[i * 3 + 1] = (Math.random() - 0.5) * 50;
        positions[i * 3 + 2] = (Math.random() - 0.5) * 50;
      }
      const particleGeometry = new THREE.BufferGeometry();
      particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
      
      // Create a PointsMaterial with transparency and an initial opacity of zero (for fade in)
      const particleMaterial = new THREE.PointsMaterial({
        color: 0xffffff,
        size: 0.1,
        transparent: true,
        opacity: 0
      });
      const particleSystem = new THREE.Points(particleGeometry, particleMaterial);
      scene.add(particleSystem);

      // Create a canvas texture to generate a title image
      const canvas = document.createElement('canvas');
      canvas.width = 512;
      canvas.height = 256;
      const ctx = canvas.getContext('2d');
      // Clear background (optional transparent background)
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      // Style the title text for a "reveal" effect
      ctx.font = 'bold 48px Arial';
      ctx.fillStyle = '#ff6600';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText("INSANELY AMAZING", canvas.width / 2, canvas.height / 2);

      const titleTexture = new THREE.CanvasTexture(canvas);
      // Create a plane geometry for the title; adjust size as needed
      const titleGeometry = new THREE.PlaneGeometry(10, 5);
      const titleMaterial = new THREE.MeshBasicMaterial({
        map: titleTexture,
        transparent: true,
        opacity: 0 // Start hidden; will fade in
      });
      const titleMesh = new THREE.Mesh(titleGeometry, titleMaterial);
      // Position the title in front of the particles
      titleMesh.position.set(0, 0, 5);
      scene.add(titleMesh);

      return { particleSystem, titleMesh };
    },
    transitionIn({ particleSystem, titleMesh }) {
      // Animate the particle system: fade particles in and add a gentle rotation
      gsap.fromTo(
        particleSystem.material,
        { opacity: 0 },
        { duration: 2, opacity: 1, ease: "power2.out" }
      );
      gsap.to(particleSystem.rotation, {
        duration: 5,
        x: Math.PI * 2,
        y: Math.PI * 2,
        ease: "power1.inOut",
        repeat: -1
      });

      // Reveal the title with a slight delay for dramatic effect
      gsap.to(titleMesh.material, {
        duration: 2,
        opacity: 1,
        delay: 1,
        ease: "power2.out"
      });
    },
    transitionOut({ particleSystem, titleMesh }) {
      // Fade out the particle system and the title
      gsap.to(particleSystem.material, { duration: 1, opacity: 0, ease: "power2.in" });
      gsap.to(titleMesh.material, { duration: 1, opacity: 0, ease: "power2.in" });
    }
  }
];

playSlides(slides);
    `,
    language: 'javascript',
    automaticLayout: true,
    theme: 'vs-dark'
  });

  // Create a container for 2D content
  const overlay2D = document.createElement('div');
  overlay2D.id = '2d-overlay';
  overlay2D.style.cssText = `
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
  document.getElementById('preview').appendChild(overlay2D);

  // Store the original code and set up tab elements
  const originalCode = editorInstance.getValue();
  const allSlidesTab = document.getElementById('allSlidesTab');
  const oneSlideTab = document.getElementById('oneSlideTab');
  let showSingleSlide = false;

  // Parse out the slides from the user’s code:
  function getSlidesArray(code) {
    const match = code.match(/const\s+slides\s*=\s*\[([\s\S]*?)\];/);
    if (!match) return [];
  
    const slidesContent = match[1].trim();
    let slides = [];
    let bracketCount = 0;
    let startIndex = -1;
  
    for (let i = 0; i < slidesContent.length; i++) {
      if (slidesContent[i] === '{') {
        if (bracketCount === 0) {
          startIndex = i;
        }
        bracketCount++;
      } else if (slidesContent[i] === '}') {
        bracketCount--;
        if (bracketCount === 0 && startIndex >= 0) {
          const slideCode = slidesContent.slice(startIndex, i + 1).trim();
          slides.push(slideCode);
          startIndex = -1;
        }
      }
    }
  
    return slides.map((code, index) => ({ index, code }));
  }

  // Capture slides from the original code
  const parsedSlides = getSlidesArray(originalCode);

  // Toggle tabs
  allSlidesTab.addEventListener('click', () => {
    showSingleSlide = false;
    editorInstance.setValue(originalCode);
    allSlidesTab.classList.add('active');
    oneSlideTab.classList.remove('active');
  });

  oneSlideTab.addEventListener('click', () => {
    showSingleSlide = true;
    // If there's a current slide selected, show it; else just show the first
    const slide = parsedSlides[currentSlideIndex] ? parsedSlides[currentSlideIndex].code : '';
    // Wrap the slide snippet in parentheses so it is interpreted as an object literal expression.
    editorInstance.setValue(`(${slide})`);
    oneSlideTab.classList.add('active');
    allSlidesTab.classList.remove('active');
  });

  // Set up Three.js in the right pane
  const canvas = document.getElementById('threeCanvas');
  const renderer = new THREE.WebGLRenderer({ 
    canvas,
    alpha: true  // Make background transparent to show 2D content behind
  });
  renderer.setClearColor(0x000000, 0.9);  // Slightly transparent background
  renderer.setPixelRatio(window.devicePixelRatio);
  
  const preview = document.getElementById('preview');

  // Resize renderer: use the canvas element's client size when not in full screen.
  // When in full screen, enforce a 16:9 aspect ratio so the preview isn't stretched.
  function resizeRenderer() {
    let newWidth, newHeight;
    if (document.fullscreenElement) {
      const previewRect = preview.getBoundingClientRect();
      // Calculate dimensions based on a fixed 16:9 ratio. We'll choose the largest size that fits
      newWidth = Math.min(previewRect.width, previewRect.height * (16 / 9));
      newHeight = newWidth / (16 / 9);
    } else {
      newWidth = canvas.clientWidth;
      newHeight = canvas.clientHeight;
    }
    if (canvas.width !== newWidth || canvas.height !== newHeight) {
      renderer.setSize(newWidth, newHeight, false);
      camera.aspect = newWidth / newHeight;
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
  const slidesContent = document.getElementById('slidesContent');
  const expandButton = document.getElementById('expandButton');

  // Collapse panel functionality
  collapseButton.addEventListener('click', () => {
    slidesPanel.style.width = '40px';
    slidesContent.style.display = 'none';
    expandButton.classList.remove('hidden');
  });

  expandButton.addEventListener('click', () => {
    slidesPanel.style.width = '200px';
    slidesContent.style.display = 'flex';
    expandButton.classList.add('hidden');
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
      
        // If in single-slide mode, update editor content with proper wrapping
        if (showSingleSlide && parsedSlides[index]) {
          editorInstance.setValue(`(${parsedSlides[index].code})`);
        }
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

  // Updated play functionality to toggle full screen on the preview
  playBtn.addEventListener('click', togglePlay);

  function togglePlay() {
    isPlaying = !isPlaying;
    
    if (isPlaying) {
        // Reset to first slide
        if (currentSlideIndex !== 0) {
            transitionOutSlide(currentSlideIndex);
            currentSlideIndex = 0;
            transitionInSlide(currentSlideIndex);
            updateSlidesThumbnails();
        }
        
        // Enter fullscreen
        if (preview.requestFullscreen) {
            preview.requestFullscreen();
        } else if (preview.webkitRequestFullscreen) {
            preview.webkitRequestFullscreen();
        } else if (preview.msRequestFullscreen) {
            preview.msRequestFullscreen();
        }
        
        // Start automatic slide progression
        // playInterval = setInterval(() => {
        //     transitionOutSlide(currentSlideIndex);
        //     currentSlideIndex = (currentSlideIndex + 1) % slidesArray.length;
        //     transitionInSlide(currentSlideIndex);
        //     updateSlidesThumbnails();
        // }, 3000); // Change slide every 3 seconds
    } else {
        // Exit fullscreen
        if (document.fullscreenElement) {
            document.exitFullscreen();
        }
        clearInterval(playInterval);
    }
  }

  // Set up key event handling to run code or change slides and exit full screen on Esc.
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && document.fullscreenElement) {
      document.exitFullscreen();
      if (isPlaying) {
        // Stop slide playback and update play button text when exiting full screen.
        clearInterval(playInterval);
        isPlaying = false;
      }
    } else if (e.key === 'Enter') {
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

  // Function to run user code from the editor in a sandboxed function
  function runUserCode(code) {
    if (isPlaying) {
      togglePlay();
    }
    
    // Clear both 3D scene and 2D overlay
    while (scene.children.length > 0) {
      scene.remove(scene.children[0]);
    }
    overlay2D.innerHTML = '';
    
    slidesArray = [];
    slideData = [];
    currentSlideIndex = 0;

    try {
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

    // Initialize each slide with both scene and container access
    slidesArray.forEach((slide, idx) => {
      // Create a container for this slide's 2D content
      const slideContainer = document.createElement('div');
      slideContainer.style.cssText = `
        display: none;
        width: 100%;
        height: 100%;
        position: absolute;
        top: 0;
        left: 0;
      `;
      overlay2D.appendChild(slideContainer);

      // Initialize slide with access to both 3D scene and 2D container
      slideData[idx] = slide.init({
        scene,
        container: slideContainer
      });
      slideData[idx]._container = slideContainer;
    });

    updateSlidesThumbnails();
    transitionInSlide(0);
  }

  function transitionInSlide(index) {
    const slide = slidesArray[index];
    const data = slideData[index];
    
    if (!slide || !data) return;

    // Show current slide's 2D container
    data._container.style.display = 'flex';

    if (slide.transitionIn) {
      slide.transitionIn(data);
    }
    
    updateSlidesThumbnails();
  }

  function transitionOutSlide(index) {
    const slide = slidesArray[index];
    const data = slideData[index];
    
    if (!slide || !data) return;

    if (slide.transitionOut) {
      slide.transitionOut(data);
    }

    // Hide 2D container after transition
    setTimeout(() => {
      data._container.style.display = 'none';
    }, 1000);
  }

  // Run the initial code automatically on load
  runUserCode(editorInstance.getValue());
});