// Main renderer code for the Animotion application

import { Water } from 'three/addons/objects/Water.js';
import { Sky } from 'three/addons/objects/Sky.js';
import ProjectManager from './project-manager.js';
import MediaAutocompleteProvider from './media-autocomplete.js';
import ExportRenderer from './export-renderer.js';

window.Water = Water;
window.Sky = Sky;

require.config({ paths: { 'vs': './vs' } });

require(['vs/editor/editor.main'], function(monaco) {
  // Create project manager instance
  const projectManager = new ProjectManager();
  // Expose media loading function to the global scope
  projectManager.exposeMediaToRenderer();
  let mediaAutocompleteProvider;
  
  // Initialize view mode buttons
  const codeOnlyBtn = document.getElementById('codeOnlyBtn');
  const splitBtn = document.getElementById('splitBtn');
  const previewOnlyBtn = document.getElementById('previewOnlyBtn');
  const addMediaBtn = document.getElementById('addMediaBtn');

  // Initialize resize handles
  const horizontalResizeHandle = document.getElementById('resizeHandle');
  const verticalResizeHandle = document.getElementById('panelResizeHandle');
  const editorSection = document.querySelector('.editor-section');
  const previewSection = document.getElementById('preview');
  const container = document.querySelector('.container');
  
  // Panel elements
  const mediaPanel = document.getElementById('mediaPanel');
  const slidesPanel = document.getElementById('slidesPanel');
  const leftPanelContainer = document.getElementById('leftPanelContainer');
  const sidebarToggle = document.getElementById('sidebarToggle');

  // Set up horizontal resize functionality
  let isHorizontalResizing = false;

  horizontalResizeHandle.addEventListener('mousedown', (e) => {
    isHorizontalResizing = true;
    horizontalResizeHandle.classList.add('active');
    document.addEventListener('mousemove', handleHorizontalResize);
    document.addEventListener('mouseup', stopHorizontalResize);
    e.preventDefault();
  });

  function handleHorizontalResize(e) {
    if (!isHorizontalResizing) return;
    
    const containerRect = document.querySelector('.editor-preview-container').getBoundingClientRect();
    const containerWidth = containerRect.width;
    
    // Calculate the position relative to the container's left edge
    const offsetX = e.clientX - containerRect.left;
    
    // Calculate percentage (clamped between 20% and 80%)
    const percentage = Math.max(20, Math.min(80, (offsetX / containerWidth) * 100));
    
    // Set editor width as percentage
    editorSection.style.width = `${percentage}%`;
    
    // Save preference
    localStorage.setItem('editorWidthPercentage', percentage);
    
    // Force Monaco editor to update its layout
    if (window.editorInstance) {
      window.editorInstance.layout();
    }
  }

  function stopHorizontalResize() {
    if (!isHorizontalResizing) return;
    
    isHorizontalResizing = false;
    horizontalResizeHandle.classList.remove('active');
    document.removeEventListener('mousemove', handleHorizontalResize);
    document.removeEventListener('mouseup', stopHorizontalResize);
  }
  
  // Set up vertical panel resize functionality
  let isVerticalResizing = false;

  verticalResizeHandle.addEventListener('mousedown', (e) => {
    isVerticalResizing = true;
    verticalResizeHandle.classList.add('active');
    document.addEventListener('mousemove', handleVerticalResize);
    document.addEventListener('mouseup', stopVerticalResize);
    e.preventDefault();
  });

  function handleVerticalResize(e) {
    if (!isVerticalResizing) return;
    
    const leftPanelRect = leftPanelContainer.getBoundingClientRect();
    const totalHeight = leftPanelRect.height;
    
    // Calculate the position relative to the panel's top edge
    const offsetY = e.clientY - leftPanelRect.top;
    
    // Calculate percentage (clamped between 20% and 80%)
    const percentage = Math.max(20, Math.min(80, (offsetY / totalHeight) * 100));
    
    // Set panel heights
    mediaPanel.style.height = `${percentage}%`;
    slidesPanel.style.height = `calc(100% - ${percentage}% - 6px)`; // Subtract the resize handle height
    
    // Save preference
    localStorage.setItem('mediaPanelHeightPercentage', percentage);
  }

  function stopVerticalResize() {
    if (!isVerticalResizing) return;
    
    isVerticalResizing = false;
    verticalResizeHandle.classList.remove('active');
    document.removeEventListener('mousemove', handleVerticalResize);
    document.removeEventListener('mouseup', stopVerticalResize);
  }

  // View mode switching
  function setViewMode(mode) {
    // Remove all mode classes first
    container.classList.remove('code-only', 'split', 'preview-only');
    
    // Add the appropriate class
    container.classList.add(mode);
    
    // Update button states
    codeOnlyBtn.classList.remove('active');
    splitBtn.classList.remove('active');
    previewOnlyBtn.classList.remove('active');
    
    // Activate the appropriate button
    switch (mode) {
      case 'code-only':
        codeOnlyBtn.classList.add('active');
        break;
      case 'preview-only':
        previewOnlyBtn.classList.add('active');
        break;
      default:
        splitBtn.classList.add('active');
        break;
    }
    
    // Save preference
    localStorage.setItem('viewMode', mode);
    
    // Force editor layout update after mode change
    setTimeout(() => {
      if (window.editorInstance) {
        window.editorInstance.layout();
      }
    }, 100);
  }

  // Attach click handlers to view mode buttons
  codeOnlyBtn.addEventListener('click', () => setViewMode('code-only'));
  splitBtn.addEventListener('click', () => setViewMode('split'));
  previewOnlyBtn.addEventListener('click', () => setViewMode('preview-only'));
  
  // Add media button click handler
  addMediaBtn.addEventListener('click', async () => {
    const result = await window.electronAPI.selectMediaFiles();
    if (!result.canceled && result.mediaFiles) {
      projectManager.importMediaFiles(result.mediaFiles);
    }
  });

  // Handle window resize events
  window.addEventListener('resize', () => {
    if (window.editorInstance) {
      window.editorInstance.layout();
    }
  });

  // Initialize layout from saved preferences
  function initLayout() {
    // Set view mode from saved preference or default to split
    const savedViewMode = localStorage.getItem('viewMode') || 'split';
    setViewMode(savedViewMode);
    
    // Set editor width if in split mode
    if (savedViewMode === 'split') {
      const savedPercentage = localStorage.getItem('editorWidthPercentage');
      if (savedPercentage) {
        editorSection.style.width = `${savedPercentage}%`;
      } else {
        editorSection.style.width = '50%';
      }
    }
    
    // Set panel heights
    const savedMediaPanelHeight = localStorage.getItem('mediaPanelHeightPercentage');
    if (savedMediaPanelHeight) {
      mediaPanel.style.height = `${savedMediaPanelHeight}%`;
      slidesPanel.style.height = `calc(100% - ${savedMediaPanelHeight}% - 6px)`;
    } else {
      mediaPanel.style.height = '50%';
      slidesPanel.style.height = 'calc(50% - 6px)';
    }
    
    // Set left panel collapse state
    const leftPanelCollapsed = localStorage.getItem('leftPanelCollapsed') === 'true';
    if (leftPanelCollapsed) {
      leftPanelContainer.classList.add('collapsed');
    } else {
      leftPanelContainer.classList.remove('collapsed');
    }
  }

  // Create the Monaco Editor in the left pane
  const editorContainer = document.getElementById('editor');
  const editorInstance = monaco.editor.create(editorContainer, {
    value: `// Modify the code and press Enter or click Play to run it.
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

  // Make editorInstance available globally
  window.editorInstance = editorInstance;

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
  let originalCode = editorInstance.getValue();
  const allSlidesTab = document.getElementById('allSlidesTab');
  const oneSlideTab = document.getElementById('oneSlideTab');
  let showSingleSlide = false;

  // Parse out the slides from the user's code:
  function getSlidesArray(code) {
    // Use greedy matching to capture entire slides array
    const match = code.match(/const\s+slides\s*=\s*\[([\s\S]*)\];/);
    if (!match) return [];
  
    const slidesContent = match[1].trim();
    let slides = [];
    let bracketCount = 0;
    let currentSlide = [];
    let inString = false;
  
    for (let i = 0; i < slidesContent.length; i++) {
      const char = slidesContent[i];
      
      // Handle string literals to ignore brackets inside strings
      if (char === '"' || char === "'" || char === '`') {
        inString = !inString;
        currentSlide.push(char);
        continue;
      }
  
      if (!inString) {
        if (char === '{') {
          if (bracketCount === 0) currentSlide = [];
          bracketCount++;
        }
        else if (char === '}') {
          bracketCount--;
        }
      }
  
      currentSlide.push(char);
  
      if (bracketCount === 0 && char === '}') {
        slides.push({
          index: slides.length,
          code: currentSlide.join('').trim()
        });
        currentSlide = [];
        // Skip comma between slides
        while (slidesContent[i + 1] === ',' || slidesContent[i + 1] === '\n') i++;
      }
    }
  
    return slides;
  }

  // Add this helper function to merge one-slide updates into the overall code
  function mergeOneSlideChanges() {
    let oneSlideCode = editorInstance.getValue();
    // Remove surrounding parentheses if present
    if (oneSlideCode.startsWith('(') && oneSlideCode.endsWith(')')) {
      oneSlideCode = oneSlideCode.slice(1, -1);
    }
    let freshSlides = getSlidesArray(originalCode);
    if (freshSlides.length > currentSlideIndex) {
      freshSlides[currentSlideIndex].code = oneSlideCode;
    }
    // Rebuild the slides array content
    const rebuiltSlides = freshSlides.map(sl => sl.code).join(',\n');
    // Replace the original slides array with the updated content
    originalCode = originalCode.replace(
      /(const\s+slides\s*=\s*\[)[\s\S]*(\];)/,
      `$1\n${rebuiltSlides}\n$2`
    );
  }

  // Toggle tabs
  allSlidesTab.addEventListener('click', () => {
    if (showSingleSlide) {
      // Merge any one-slide changes into the overall code before switching
      mergeOneSlideChanges();
    }
    showSingleSlide = false;
    editorInstance.setValue(originalCode);
    allSlidesTab.classList.add('active');
    oneSlideTab.classList.remove('active');
  });

  oneSlideTab.addEventListener('click', () => {
    // If we're coming from "all slides" mode, update the master code.
    if (!showSingleSlide) {
      originalCode = editorInstance.getValue();
    }
    
    showSingleSlide = true;
    const freshSlides = getSlidesArray(originalCode);
    if (freshSlides.length > currentSlideIndex) {
      editorInstance.setValue(`(${freshSlides[currentSlideIndex].code})`);
    } else {
      editorInstance.setValue('// Slide content not found');
    }
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

  // Slide handling variables
  let slidesArray = [];
  let slideData = [];
  let currentSlideIndex = 0;
  let isPlaying = false;
  let playInterval = null;
  
  // Optimized animation function that conditionally renders based on focus and presentation state
  function animate() {
    // Pause rendering if slides are playing
    if (!isPlaying) {
      resizeRenderer();
      renderer.render(scene, camera);
    }
    requestAnimationFrame(animate);
  }
  animate();

  // UI Elements
  const slidesList = document.getElementById('slidesList');
  const addSlideBtn = document.getElementById('addSlideBtn');
  const toolbarAddSlideBtn = document.getElementById('toolbarAddSlideBtn');
  const playBtn = document.getElementById('playBtn');
  const slidesContent = document.getElementById('slidesContent');

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

        if (showSingleSlide) {
          const freshSlides = getSlidesArray(originalCode);
          
          if (freshSlides.length > index) {
            editorInstance.setValue(`(${freshSlides[currentSlideIndex].code})`);
          } else {
            editorInstance.setValue('// Slide content not found');
          }
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

  // Make the toolbar button also add a new slide
  toolbarAddSlideBtn.addEventListener('click', () => {
    // Use the same code as for the panel button
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

  // Updated play functionality to open a new window instead of toggling fullscreen
  playBtn.addEventListener('click', togglePlay);

  // Add a paused overlay to show when preview is paused
  function createPausedOverlay() {
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
    
    document.getElementById('preview').appendChild(pausedOverlay);
    return pausedOverlay;
  }

  const pausedOverlay = createPausedOverlay();

  // Update the togglePlay function to show/hide the paused overlay
  function togglePlay() {
    isPlaying = !isPlaying;
    
    if (isPlaying) {
      // Show paused overlay when starting presentation
      pausedOverlay.style.display = 'flex';
      
      // Reset to first slide if needed
      if (currentSlideIndex !== 0) {
        transitionOutSlide(currentSlideIndex);
        currentSlideIndex = 0;
        transitionInSlide(currentSlideIndex);
        updateSlidesThumbnails();
      }
      
      // Get the current code to send to the presentation window
      const userCode = originalCode;
      
      // Open the presentation window without data in URL
      const presentationWindow = window.open(
        `presentation.html`, 
        'presentation',
        'fullscreen=yes,menubar=no,toolbar=no,location=no'
      );
      
      if (presentationWindow) {
        // Set up message listener for events from presentation window
        window.addEventListener('message', function handlePresentationMessage(e) {
          if (e.data.type === 'presentation-closed') {
            isPlaying = false;
            pausedOverlay.style.display = 'none'; // Hide overlay when presentation is closed
            window.removeEventListener('message', handlePresentationMessage);
          } else if (e.data.type === 'presentation-ready') {
            // When the presentation window signals it's ready, send the slide data and media data
            const mediaData = projectManager.getAllMediaData(); // Get all media data
            presentationWindow.postMessage({
              type: 'slide-data',
              code: userCode,
              media: mediaData
            }, '*');
          }
        });
        
        // Keep reference to the window
        window.presentationWindow = presentationWindow;
        
        // Focus on the presentation window
        presentationWindow.focus();
      } else {
        // If we couldn't open the window (e.g., popup blocked)
        alert('Failed to open presentation. Please allow popups for this site.');
        isPlaying = false;
        pausedOverlay.style.display = 'none'; // Hide overlay if presentation fails to open
      }
    } else {
      // Hide paused overlay when stopping presentation
      pausedOverlay.style.display = 'none';
      
      // Close the presentation window if it exists
      if (window.presentationWindow && !window.presentationWindow.closed) {
        window.presentationWindow.close();
      }
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
      // Don't toggle play state; instead update the presentation window
      if (window.presentationWindow && !window.presentationWindow.closed) {
        window.presentationWindow.postMessage({
          type: 'slide-update',
          code: code
        }, '*');
      }
    }

    // Update the master copy to the current editor code
    originalCode = code;
    
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
  
      // Initialize slide with access to both 3D scene and 2D container
      slideData[idx] = slide.init({
        scene,
        container: slideContainer
      });
      slideData[idx]._container = slideContainer;
      
      // Process any media references in the slide container
      projectManager.processMediaReferences(slideContainer);
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

  // Make overlay2D clickable:
  overlay2D.style.pointerEvents = 'auto';

  // New bottom pane logic
  const bottomPane = document.getElementById('bottomPane');
  const closeBottomPane = document.getElementById('closeBottomPane');
  const fontInput = document.getElementById('fontInput');
  const fontSizeInput = document.getElementById('fontSizeInput');
  const colorInput = document.getElementById('colorInput');
  const fontWeightInput = document.getElementById('fontWeightInput');

  closeBottomPane.addEventListener('click', () => {
    bottomPane.classList.remove('visible');
    if (lastClickedElement) {
        lastClickedElement.classList.remove('selected-element');
        lastClickedElement = null;
    }
  });

  // Track last clicked element for property updates
  let lastClickedElement = null;
  // Store element metadata for code updates
  let elementMetadata = null;

  // Get a unique path for an element in the DOM
  function getElementPath(element) {
    // Find which slide container this element belongs to
    const slideContainer = element.closest('[data-slide-container]');
    if (!slideContainer) return null;
    
    const slideIndex = parseInt(slideContainer.getAttribute('data-slide-container').replace('slide-', ''));
    
    // Get element's content and tag as identifiers
    const textContent = element.textContent.trim();
    const tagName = element.tagName.toLowerCase();
    
    return { 
      slideIndex, 
      element,
      tagName,
      textContent: textContent.substring(0, 30), // First 30 chars for identification
      innerHTML: element.innerHTML
    };
  }

  // Find the right variable name or HTML pattern for the element in the slide code
  function findElementVariableInCode(slideCode, elementInfo) {
    if (!elementInfo) return null;
    
    const { tagName, textContent } = elementInfo;
    
    // Check for elements that might be created via innerHTML
    if (slideCode.includes('innerHTML') || slideCode.includes('insertAdjacentHTML')) {
      // Find potential container variables that might contain our element
      const containerVars = [];
      const containerRegex = /const\s+(\w+)\s*=\s*document\.createElement\(['"]div['"]\)/g;
      let match;
      while ((match = containerRegex.exec(slideCode)) !== null) {
        containerVars.push(match[1]);
      }
      
      // Check if any container's innerHTML contains our element
      for (const container of containerVars) {
        // Look for innerHTML assignments
        const htmlRegex = new RegExp(`${container}\\.innerHTML\\s*=\\s*[\`'"]([\\s\\S]*?)[\`'"]`, 'g');
        const htmlMatch = htmlRegex.exec(slideCode);
        
        if (htmlMatch && htmlMatch[1]) {
          const htmlContent = htmlMatch[1];
          
          // Check if our element's tag and some content appear in this HTML
          if (htmlContent.includes(`<${tagName}`) && 
              (textContent.length === 0 || htmlContent.includes(textContent.substring(0, Math.min(10, textContent.length))))) {
            
            // First check if the element is referenced later via querySelector
            const querySelectorRegex = new RegExp(
              `(\\w+)\\s*:\\s*${container}\\.querySelector\\(['"]${tagName}['"]\\)`, 'g'
            );
            const querySelectorMatch = querySelectorRegex.exec(slideCode);
            
            if (querySelectorMatch) {
              // Return the variable name used in the return object
              return {
                type: 'querySelector',
                containerVar: container,
                elementVar: querySelectorMatch[1],
                htmlContent: htmlContent
              };
            }
            
            // For elements that might be part of a querySelectorAll
            if (tagName === 'li') {
              const querySelectorAllRegex = new RegExp(
                `(\\w+)\\s*:\\s*Array\\.from\\(${container}\\.querySelectorAll\\(['"]li['"]\\)\\)`, 'g'
              );
              const querySelectorAllMatch = querySelectorAllRegex.exec(slideCode);
              
              if (querySelectorAllMatch) {
                return {
                  type: 'querySelectorAll',
                  containerVar: container,
                  elementVar: querySelectorAllMatch[1],
                  htmlContent: htmlContent
                };
              }
            }
            
            // If no querySelector reference, just reference the HTML directly
            return {
              type: 'innerHTML',
              containerVar: container,
              htmlContent: htmlContent
            };
          }
        }
      }
    }
    
    // Try to find it in the return object for directly created elements
    const returnMatch = slideCode.match(/return\s*{([^}]*)}/);
    if (returnMatch) {
      const returnVars = returnMatch[1]
        .split(',')
        .map(v => v.trim())
        .filter(v => v.length > 0);
      
      // Potential variable names based on tag type
      const tagNameMap = {
        'h1': ['title', 'heading', 'mainTitle'],
        'h2': ['subtitle', 'subheading', 'author', 'title'],
        'p': ['description', 'text', 'paragraph'],
        'li': ['item', 'listItem']
      };
      
      const possibleNames = tagNameMap[tagName] || [];
      
      for (const varDef of returnVars) {
        const parts = varDef.split(':');
        if (parts.length !== 2) continue;
        
        const varName = parts[0].trim();
        
        // Match by content assignment
        if (textContent && slideCode.includes(`${varName}.textContent = '${textContent}'`) || 
            slideCode.includes(`${varName}.textContent = "${textContent}"`)) {
          return { type: 'direct', elementVar: varName };
        }
        
        // Match by common variable names
        if (possibleNames.some(name => varName === name)) {
          return { type: 'direct', elementVar: varName };
        }
      }
    }
    
    // Look for direct variable declarations
    const varDeclarationRegex = new RegExp(`const\\s+(\\w+)\\s*=\\s*document\\.createElement\\(['"]${tagName}['"]\\)`, 'g');
    const varMatch = varDeclarationRegex.exec(slideCode);
    if (varMatch) {
      return { type: 'direct', elementVar: varMatch[1] };
    }
    
    return null;
  }

  // Update the code based on element style changes
  function updateCodeWithStyleChanges(elementInfo, styleChanges) {
    if (!elementInfo) return;
    
    const { slideIndex, tagName, textContent } = elementInfo;
    const slides = getSlidesArray(originalCode);
    const slideCode = slides[slideIndex]?.code;
    
    if (!slideCode) return;
    
    console.log(`Updating style for ${tagName} with content "${textContent}" in slide ${slideIndex+1}`);
    
    let updatedSlideCode = slideCode;
    let codeWasUpdated = false;
    
    // SIMPLIFIED APPROACH: Directly look for innerHTML containing our element 
    if (tagName) {
      // First, try to find innerHTML assignments that might contain our element
      const innerHTMLRegex = /(\w+)\.innerHTML\s*=\s*(`|'|")([\s\S]*?)\2/g;
      let match;
      
      while ((match = innerHTMLRegex.exec(slideCode)) !== null) {
        const containerVar = match[1];
        const quoteType = match[2];
        let htmlContent = match[3];
        
        console.log(`Found innerHTML in ${containerVar}`);
        
        // Look for our element in the HTML content
        // Create a pattern that matches our tag with a style attribute
        const elementPattern = new RegExp(
          `(<${tagName}[^>]*?)(style=["']([^"']*)["'])([^>]*?>)([\\s\\S]*?)</${tagName}>`, 
          'g'
        );
        
        let elementMatch;
        let updatedHtmlContent = htmlContent;
        
        while ((elementMatch = elementPattern.exec(htmlContent)) !== null) {
          // Check if this is our element by comparing content
          const elementContent = elementMatch[5].trim();
          
          if (!textContent || elementContent.includes(textContent.substring(0, Math.min(10, textContent.length)))) {
            console.log(`Found matching ${tagName} with content: "${elementContent}"`);
            
            // Extract current style
            let styleAttr = elementMatch[3];
            let styleUpdated = false;
            
            for (const [styleProp, styleValue] of Object.entries(styleChanges)) {
              console.log(`Updating ${styleProp} to ${styleValue}`);
              // Look for existing property in style attribute
              const propRegex = new RegExp(`(${styleProp})\\s*:\\s*([^;]*?)(;|$)`, 'g');
              const propMatch = propRegex.exec(styleAttr);
              
              if (propMatch) {
                // Replace existing property value
                styleAttr = styleAttr.replace(propRegex, `$1: ${styleValue}$3`);
                styleUpdated = true;
              } else {
                // Add new property to style attribute
                styleAttr += `${styleAttr.endsWith(';') ? ' ' : '; '}${styleProp}: ${styleValue};`;
                styleUpdated = true;
              }
            }
            
            if (styleUpdated) {
              // Replace the style attribute with updated one
              const updatedElement = `${elementMatch[1]}style="${styleAttr}"${elementMatch[4]}${elementMatch[5]}</${tagName}>`;
              updatedHtmlContent = updatedHtmlContent.replace(elementMatch[0], updatedElement);
            }
          }
        }
        
        if (updatedHtmlContent !== htmlContent) {
          // Update the innerHTML in code
          const fullMatch = `${containerVar}.innerHTML = ${quoteType}${htmlContent}${quoteType}`;
          const replacement = `${containerVar}.innerHTML = ${quoteType}${updatedHtmlContent}${quoteType}`;
          
          updatedSlideCode = updatedSlideCode.replace(fullMatch, replacement);
          codeWasUpdated = true;
          console.log(`- Updated HTML style attribute in ${containerVar}.innerHTML`);
        }
      }
    }
    
    // Apply code updates if we made any changes
    if (codeWasUpdated) {
      slides[slideIndex].code = updatedSlideCode;
      const rebuiltSlides = slides.map(sl => sl.code).join(',\n');
      originalCode = originalCode.replace(
        /(const\s+slides\s*=\s*\[)[\s\S]*(\];)/,
        `$1\n${rebuiltSlides}\n$2`
      );
      
      // Update the editor if we're in the appropriate mode
      if (showSingleSlide && currentSlideIndex === slideIndex) {
        editorInstance.setValue(`(${updatedSlideCode})`);
      } else if (!showSingleSlide) {
        editorInstance.setValue(originalCode);
      }
      
      console.log('Code updated successfully!');
    } else {
      console.warn('No code updates were made. Could not find matching pattern.');
      
      // Additional debug information
      console.log('Element info:', JSON.stringify({
        slideIndex,
        tagName,
        textContent: textContent?.substring(0, 30),
      }));
      console.log('Style changes:', styleChanges);
    }
  }

  // Listen for clicks on 2D elements
  overlay2D.addEventListener('click', (e) => {
    const element = e.target;
    // Example check: only show pane if a text element is clicked
    if (element.tagName === 'H1' || element.tagName === 'H2' || element.tagName === 'P' || element.tagName === 'LI') {
        e.stopPropagation();
        
        // Check if the clicked element belongs to the current slide
        const slideContainer = element.closest('[data-slide-container]');
        if (slideContainer && slideContainer === slideData[currentSlideIndex]._container) {
            // Remove highlight from previously selected element, if any
            if (lastClickedElement) {
                lastClickedElement.classList.remove('selected-element');
            }
            // Set and highlight the currently clicked element
            lastClickedElement = element;
            lastClickedElement.classList.add('selected-element');

            // Store element metadata for code updates
            elementMetadata = getElementPath(element);

            // Show existing properties
            fontInput.value = window.getComputedStyle(element).fontFamily.replace(/['"]/g, '');
            fontSizeInput.value = parseInt(window.getComputedStyle(element).fontSize);
            colorInput.value = rgbToHex(window.getComputedStyle(element).color);
            fontWeightInput.value = window.getComputedStyle(element).fontWeight;
            document.getElementById('colorPicker').value = rgbToHex(window.getComputedStyle(element).color);
            
            // Open the pane
            bottomPane.classList.add('visible');
        }
    }
  });

  document.addEventListener('click', (e) => {
    // If the clicked element is not a text element (or within bottomPane), deselect the element.
    if (!e.target.closest('h1, h2, p, li') && !e.target.closest('#bottomPane')) {
        if (lastClickedElement) {
            lastClickedElement.classList.remove('selected-element');
            lastClickedElement = null;
            elementMetadata = null;
        }
        bottomPane.classList.remove('visible');
    }
  });

// Add this helper function to convert RGB to Hex
function rgbToHex(rgb) {
    // If it's already a hex value, return it
    if (rgb.startsWith('#')) return rgb;
    
    // Extract RGB values
    const rgbValues = rgb.match(/\d+/g);
    if (!rgbValues) return '#ffffff';
    
    const r = parseInt(rgbValues[0]);
    const g = parseInt(rgbValues[1]);
    const b = parseInt(rgbValues[2]);
    
    return '#' + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

  // Reflect property changes in real-time and update code
  function updateElementProperties() {
    if (!lastClickedElement) return;
    
    const newColor = document.getElementById('colorInput').value;
    const newFontFamily = fontInput.value;
    const newFontSize = fontSizeInput.value + 'px';
    const newFontWeight = fontWeightInput.value;
    
    const styleChanges = {};
    
    // Only update if values are valid
    if (newFontFamily) {
        lastClickedElement.style.fontFamily = newFontFamily;
        styleChanges['font-family'] = `"${newFontFamily}"`;
    }
    
    if (parseInt(fontSizeInput.value) > 0) {
        lastClickedElement.style.fontSize = newFontSize;
        styleChanges['font-size'] = newFontSize;
    }
    
    if (/^#[0-9A-F]{6}$/i.test(newColor)) {
        lastClickedElement.style.color = newColor;
        styleChanges['color'] = newColor;
    }
    
    if (newFontWeight !== 'inherit') {
        lastClickedElement.style.fontWeight = newFontWeight;
        styleChanges['font-weight'] = newFontWeight;
    }
    
    // Update the code
    if (Object.keys(styleChanges).length > 0) {
      updateCodeWithStyleChanges(elementMetadata, styleChanges);
    }
  }

  fontInput.addEventListener('input', updateElementProperties);
  fontSizeInput.addEventListener('input', updateElementProperties);
  colorInput.addEventListener('input', updateElementProperties);
  fontWeightInput.addEventListener('change', updateElementProperties);

  // Handle color picker input
  document.getElementById('colorPicker').addEventListener('input', (e) => {
    const newColor = e.target.value;
    document.getElementById('colorInput').value = newColor;
    updateElementProperties(); // Trigger the update immediately
  });

  document.getElementById('colorInput').addEventListener('input', (e) => {
      const newColor = e.target.value;
      if (/^#[0-9A-F]{6}$/i.test(newColor)) {
          document.getElementById('colorPicker').value = newColor;
          updateElementProperties(); // Trigger the update when valid hex color is entered
      }
  });

  // Make elements draggable and update positions in code
  let isDragging = false;
  let dragElement = null;
  let initialX, initialY;
  let initialElementX, initialElementY;
  let dragThreshold = 5; // Pixels to move before considered a drag vs a click

  // Handle element drag functionality
  function initDraggable() {
    // Add mouse events to the 2D overlay for dragging
    overlay2D.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', updateDrag);
    document.addEventListener('mouseup', endDrag);
    
    // Double-click should reset position
    overlay2D.addEventListener('dblclick', resetElementPosition);
  }

  function startDrag(e) {
    // Only start dragging on text elements and make sure it's in the current slide
    const element = e.target;
    if (!isEditableElement(element)) return;
    
    const slideContainer = element.closest('[data-slide-container]');
    if (!slideContainer || slideContainer !== slideData[currentSlideIndex]._container) return;

    // Mark this element as selected
    if (lastClickedElement) {
      lastClickedElement.classList.remove('selected-element');
    }
    
    lastClickedElement = element;
    element.classList.add('selected-element');
    elementMetadata = getElementPath(element);
    showBottomPane(element);
    
    // Store initial positions
    initialX = e.clientX;
    initialY = e.clientY;
    
    // Get current position, whether it's in transform, top/left, or margin
    const style = window.getComputedStyle(element);
    initialElementX = parseInt(style.left) || 0;
    initialElementY = parseInt(style.top) || 0;
    
    // Check if element has any position set
    if (style.position === 'static') {
      // Make element positioned if it's not already
      element.style.position = 'relative';
      initialElementX = 0;
      initialElementY = 0;
    }
    
    // Set up for drag operation
    dragElement = element;
    isDragging = false; // Start with false, will set to true after threshold
    
    // Add dragging class for visual feedback
    element.classList.add('dragging');
    
    e.preventDefault();
    e.stopPropagation();
  }

  function updateDrag(e) {
    if (!dragElement) return;
    
    // Calculate distance moved
    const dx = e.clientX - initialX;
    const dy = e.clientY - initialY;
    
    // Only start actual dragging after threshold
    if (!isDragging && (Math.abs(dx) > dragThreshold || Math.abs(dy) > dragThreshold)) {
      isDragging = true;
    }
    
    if (isDragging) {
      // Update element position
      dragElement.style.left = `${initialElementX + dx}px`;
      dragElement.style.top = `${initialElementY + dy}px`;
      
      // Show position feedback
      showPositionFeedback(dragElement, initialElementX + dx, initialElementY + dy);
    }
  }

  function endDrag(e) {
    if (dragElement) {
      dragElement.classList.remove('dragging');
      
      if (isDragging) {
        // Calculate final position
        const dx = e.clientX - initialX;
        const dy = e.clientY - initialY;
        const newX = initialElementX + dx;
        const newY = initialElementY + dy;
        
        // Hide position feedback
        hidePositionFeedback();
        
        // Update the code with new position
        updateElementPositionInCode(dragElement, newX, newY);
        
        // Prevent click event from triggering
        e.preventDefault();
        e.stopPropagation();
      }
      
      dragElement = null;
      isDragging = false;
    }
  }

  // Check if an element is one we want to make draggable
  function isEditableElement(element) {
    const editableTags = ['H1', 'H2', 'H3', 'P', 'SPAN', 'DIV', 'LI', 'UL', 'OL'];
    return editableTags.includes(element.tagName);
  }

  // Show a position indicator during drag
  function showPositionFeedback(element, x, y) {
    let positionDisplay = document.getElementById('position-display');
    
    if (!positionDisplay) {
      positionDisplay = document.createElement('div');
      positionDisplay.id = 'position-display';
      positionDisplay.style.cssText = `
        position: absolute;
        background: rgba(0,0,0,0.7);
        color: white;
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        pointer-events: none;
        z-index: 1000;
      `;
      document.body.appendChild(positionDisplay);
    }
    
    // Position the indicator near the element
    const rect = element.getBoundingClientRect();
    positionDisplay.style.left = `${rect.right + 10}px`;
    positionDisplay.style.top = `${rect.top}px`;
    positionDisplay.textContent = `X: ${Math.round(x)}px, Y: ${Math.round(y)}px`;
    positionDisplay.style.display = 'block';
  }

  function hidePositionFeedback() {
    const positionDisplay = document.getElementById('position-display');
    if (positionDisplay) {
      positionDisplay.style.display = 'none';
    }
  }

  // Double-click to reset position
  function resetElementPosition(e) {
    if (!isEditableElement(e.target)) return;
    
    const element = e.target;
    element.style.left = '';
    element.style.top = '';
    
    // Update the code to remove position
    updateElementPositionInCode(element, null, null);
  }

  // Show the bottom pane with the element's current properties
  function showBottomPane(element) {
    // Show existing properties
    fontInput.value = window.getComputedStyle(element).fontFamily.replace(/['"]/g, '');
    fontSizeInput.value = parseInt(window.getComputedStyle(element).fontSize);
    colorInput.value = rgbToHex(window.getComputedStyle(element).color);
    fontWeightInput.value = window.getComputedStyle(element).fontWeight;
    document.getElementById('colorPicker').value = rgbToHex(window.getComputedStyle(element).color);
    
    // Open the pane
    bottomPane.classList.add('visible');
  }

  // Update the code with new element position
  function updateElementPositionInCode(element, x, y) {
    const elementInfo = getElementPath(element);
    if (!elementInfo) return;
    
    const { slideIndex, tagName, textContent } = elementInfo;
    const slides = getSlidesArray(originalCode);
    const slideCode = slides[slideIndex]?.code;
    
    if (!slideCode) return;
    
    console.log(`Updating position for ${tagName} with content "${textContent}" in slide ${slideIndex+1}`);
    
    let updatedSlideCode = slideCode;
    let codeWasUpdated = false;
    
    // Position can be updated in several ways:
    
    // 1. For elements in innerHTML, update the style attribute
    const innerHTMLRegex = /(\w+)\.innerHTML\s*=\s*(`|'|")([\s\S]*?)\2/g;
    let match;
    
    while ((match = innerHTMLRegex.exec(slideCode)) !== null) {
      const containerVar = match[1];
      const quoteType = match[2];
      let htmlContent = match[3];
      
      // Look for our element in the HTML content
      const elementPattern = new RegExp(
        `(<${tagName}[^>]*?)(style=["']([^"']*)["'])?([^>]*?>)([\\s\\S]*?)</${tagName}>`, 
        'g'
      );
      
      let elementMatch;
      let updatedHtmlContent = htmlContent;
      
      while ((elementMatch = elementPattern.exec(htmlContent)) !== null) {
        const elementContent = elementMatch[5].trim();
        
        if (!textContent || elementContent.includes(textContent.substring(0, Math.min(10, textContent.length)))) {
          console.log(`Found matching ${tagName} in innerHTML`);
          
          // Extract current style or create new style attribute
          let styleAttr = elementMatch[3] || '';
          
          if (x !== null && y !== null) {
            // Update position properties
            styleAttr = updatePositionInStyle(styleAttr, x, y);
          } else {
            // Remove position properties
            styleAttr = removePositionFromStyle(styleAttr);
          }
          
          // Rebuild the element with updated style
          let updatedElement;
          if (elementMatch[2]) {
            // If element already has a style attribute
            updatedElement = `${elementMatch[1]}style="${styleAttr}"${elementMatch[4]}${elementMatch[5]}</${tagName}>`;
          } else {
            // If element doesn't have a style attribute yet
            updatedElement = `${elementMatch[1]}style="${styleAttr}" ${elementMatch[4]}${elementMatch[5]}</${tagName}>`;
          }
          
          updatedHtmlContent = updatedHtmlContent.replace(elementMatch[0], updatedElement);
        }
      }
      
      if (updatedHtmlContent !== htmlContent) {
        // Update the innerHTML in code
        const fullMatch = `${containerVar}.innerHTML = ${quoteType}${htmlContent}${quoteType}`;
        const replacement = `${containerVar}.innerHTML = ${quoteType}${updatedHtmlContent}${quoteType}`;
        
        updatedSlideCode = updatedSlideCode.replace(fullMatch, replacement);
        codeWasUpdated = true;
        console.log(`- Updated position in HTML style attribute`);
      }
    }
    
    // 2. For direct elements with cssText, update the cssText
    const cssTextRegex = /(\w+)\.style\.cssText\s*=\s*(['"`])([\s\S]*?)\2/g;
    
    while ((match = cssTextRegex.exec(slideCode)) !== null) {
      const elementVar = match[1];
      const quoteType = match[2];
      let cssText = match[3];
      
      // Check if this is likely our element by looking for variables related to the element type
      const tagNameMap = {
        'h1': ['title', 'heading', 'mainTitle'],
        'h2': ['subtitle', 'subheading', 'author'],
        'p': ['description', 'text', 'paragraph'],
        'li': ['item', 'listItem']
      };
      
      const possibleNames = tagNameMap[tagName] || [];
      
      if (possibleNames.includes(elementVar) || 
          slideCode.includes(`const ${elementVar} = document.createElement('${tagName}')`)) {
        
        console.log(`Found matching variable: ${elementVar}`);
        
        if (x !== null && y !== null) {
          // Update position in cssText
          cssText = updatePositionInStyle(cssText, x, y);
        } else {
          // Remove position from cssText
          cssText = removePositionFromStyle(cssText);
        }
        
        // Update the cssText in code
        const fullMatch = `${elementVar}.style.cssText = ${quoteType}${match[3]}${quoteType}`;
        const replacement = `${elementVar}.style.cssText = ${quoteType}${cssText}${quoteType}`;
        
        updatedSlideCode = updatedSlideCode.replace(fullMatch, replacement);
        codeWasUpdated = true;
        console.log(`- Updated position in cssText`);
      }
    }
    
    // Apply code updates if we made any changes
    if (codeWasUpdated) {
      slides[slideIndex].code = updatedSlideCode;
      const rebuiltSlides = slides.map(sl => sl.code).join(',\n');
      originalCode = originalCode.replace(
        /(const\s+slides\s*=\s*\[)[\s\S]*(\];)/,
        `$1\n${rebuiltSlides}\n$2`
      );
      
      // Update the editor
      if (showSingleSlide && currentSlideIndex === slideIndex) {
        editorInstance.setValue(`(${updatedSlideCode})`);
      } else if (!showSingleSlide) {
        editorInstance.setValue(originalCode);
      }
      
      console.log('Position updated in code successfully!');
    } else {
      console.warn('Could not update position in code');
    }
  }

  // Update position properties in a style string
  function updatePositionInStyle(styleStr, x, y) {
    // First make sure the position is explicitly set
    if (!styleStr.includes('position:')) {
      styleStr = `position: relative; ${styleStr}`;
    }
    
    // Update or add left property
    if (styleStr.includes('left:')) {
      styleStr = styleStr.replace(/left:\s*[^;]*;?/, `left: ${x}px; `);
    } else {
      styleStr += `left: ${x}px; `;
    }
    
    // Update or add top property
    if (styleStr.includes('top:')) {
      styleStr = styleStr.replace(/top:\s*[^;]*;?/, `top: ${y}px; `);
    } else {
      styleStr += `top: ${y}px; `;
    }
    
    return styleStr;
  }

  // Remove position properties from a style string
  function removePositionFromStyle(styleStr) {
    return styleStr
      .replace(/left:\s*[^;]*;?\s*/g, '')
      .replace(/top:\s*[^;]*;?\s*/g, '')
      .replace(/position:\s*[^;]*;?\s*/g, '');
  }

  // Initialize draggable functionality
  initDraggable();

  // Add CSS for dragging
  const dragStyles = document.createElement('style');
  dragStyles.textContent = `
    .dragging {
      cursor: move !important;
      opacity: 0.8;
      outline: 2px dashed #007bff;
    }
    .selected-element {
      outline: 2px solid #007bff;
    }
    [data-slide-container] h1, [data-slide-container] h2, 
    [data-slide-container] p, [data-slide-container] li {
      cursor: pointer;
      position: relative;
    }
  `;
  document.head.appendChild(dragStyles);

  // Run the initial code automatically on load
  initLayout();
  runUserCode(editorInstance.getValue());

  // Add this to expose editor content to window for ProjectManager
  window.getCurrentEditorContent = function() {
    return editorInstance ? editorInstance.getValue() : '';
  };

  // Replace the separate collapse/expand functions with a single toggle
  sidebarToggle.addEventListener('click', () => {
    const isCollapsed = leftPanelContainer.classList.toggle('collapsed');
    // Save state
    localStorage.setItem('leftPanelCollapsed', isCollapsed);
  });

  // Add event listener for project loaded event
  document.addEventListener('project-loaded', (e) => {
    if (e.detail && e.detail.editorContent) {
      editorInstance.setValue(e.detail.editorContent);
      originalCode = e.detail.editorContent;  // Add window focus/blur events to optimize performance
      runUserCode(e.detail.editorContent);
    }
  });

  // Initialize the media autocomplete provider when editor is ready
  mediaAutocompleteProvider = new MediaAutocompleteProvider(monaco, projectManager);

  // Create export progress overlay
  function createExportProgressOverlay() {
    const overlay = document.createElement('div');
    overlay.id = 'export-progress-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-family: sans-serif;
    `;
    
    const content = document.createElement('div');
    content.style.cssText = `
      background: #222;
      border-radius: 8px;
      padding: 20px;
      max-width: 400px;
      width: 80%;
      text-align: center;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Exporting Slides';
    title.style.margin = '0 0 20px 0';
    
    const message = document.createElement('div');
    message.id = 'export-message';
    message.textContent = 'Preparing...';
    message.style.marginBottom = '15px';
    
    const progressContainer = document.createElement('div');
    progressContainer.style.cssText = `
      background: #333;
      height: 20px;
      border-radius: 10px;
      overflow: hidden;
      margin-bottom: 15px;
    `;
    
    const progressBar = document.createElement('div');
    progressBar.id = 'export-progress-bar';
    progressBar.style.cssText = `
      height: 100%;
      width: 0%;
      background: #4CAF50;
      transition: width 0.3s ease;
    `;
    
    progressContainer.appendChild(progressBar);
    
    content.appendChild(title);
    content.appendChild(message);
    content.appendChild(progressContainer);
    
    overlay.appendChild(content);
    document.body.appendChild(overlay);
    
    return {
      show: () => { overlay.style.display = 'flex'; },
      hide: () => { overlay.style.display = 'none'; },
      updateProgress: (percent, msg) => {
        progressBar.style.width = `${percent}%`;
        if (msg) message.textContent = msg;
      }
    };
  }
  
  const exportProgress = createExportProgressOverlay();
  
  // Create resolution selector dialog
  function createResolutionSelectorDialog() {
    const overlay = document.createElement('div');
    overlay.id = 'resolution-selector-overlay';
    overlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.7);
      z-index: 10000;
      display: none;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      color: white;
      font-family: sans-serif;
    `;
    
    const dialog = document.createElement('div');
    dialog.style.cssText = `
      background: #222;
      border-radius: 8px;
      padding: 20px;
      max-width: 500px;
      width: 90%;
    `;
    
    const title = document.createElement('h3');
    title.textContent = 'Select Export Resolution';
    title.style.margin = '0 0 20px 0';
    title.style.textAlign = 'center';
    
    const description = document.createElement('p');
    description.textContent = 'Choose an aspect ratio and resolution for the exported PNG files:';
    description.style.marginBottom = '20px';
    
    const optionsContainer = document.createElement('div');
    optionsContainer.style.cssText = `
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
      margin-bottom: 20px;
    `;
    
    // Define common export resolutions
    const resolutionOptions = [
      { label: '16:9 Full HD (1920×1080)', width: 1920, height: 1080 },
      { label: '16:9 HD (1280×720)', width: 1280, height: 720 },
      { label: '4:3 XGA (1024×768)', width: 1024, height: 768 },
      { label: '4:3 SXGA (1400×1050)', width: 1400, height: 1050 },
      { label: '16:10 WXGA (1280×800)', width: 1280, height: 800 },
      { label: 'Square (1080×1080)', width: 1080, height: 1080 }
    ];
    
    // Last selected resolution (default to Full HD)
    let selectedResolution = localStorage.getItem('exportResolution') ? 
      JSON.parse(localStorage.getItem('exportResolution')) : 
      { width: 1920, height: 1080 };
    
    // Create option buttons
    resolutionOptions.forEach(option => {
      const optionBtn = document.createElement('button');
      optionBtn.textContent = option.label;
      optionBtn.style.cssText = `
        background: #333;
        border: 2px solid #555;
        color: white;
        padding: 12px;
        border-radius: 4px;
        cursor: pointer;
        text-align: center;
        transition: background 0.2s, border-color 0.2s;
      `;
      
      // Highlight the selected option
      if (selectedResolution.width === option.width && selectedResolution.height === option.height) {
        optionBtn.style.background = '#4c7baf';
        optionBtn.style.borderColor = '#6ca0e0';
      }
      
      optionBtn.addEventListener('mouseenter', () => {
        if (!(selectedResolution.width === option.width && selectedResolution.height === option.height)) {
          optionBtn.style.background = '#444';
        }
      });
      
      optionBtn.addEventListener('mouseleave', () => {
        if (!(selectedResolution.width === option.width && selectedResolution.height === option.height)) {
          optionBtn.style.background = '#333';
        }
      });
      
      optionBtn.addEventListener('click', () => {
        // Update selected state for all buttons
        optionsContainer.querySelectorAll('button').forEach(btn => {
          btn.style.background = '#333';
          btn.style.borderColor = '#555';
        });
        
        // Highlight this button
        optionBtn.style.background = '#4c7baf';
        optionBtn.style.borderColor = '#6ca0e0';
        
        // Update selected resolution
        selectedResolution = { width: option.width, height: option.height };
        
        // If custom option, show the custom inputs
        customInputs.style.display = 'none';
      });
      
      optionsContainer.appendChild(optionBtn);
    });
    
    // Add custom resolution option
    const customOption = document.createElement('button');
    customOption.textContent = 'Custom Resolution';
    customOption.style.cssText = `
      background: #333;
      border: 2px solid #555;
      color: white;
      padding: 12px;
      border-radius: 4px;
      cursor: pointer;
      text-align: center;
      grid-column: span 2;
      transition: background 0.2s, border-color 0.2s;
    `;
    
    customOption.addEventListener('mouseenter', () => {
      if (!customInputs.style.display || customInputs.style.display === 'none') {
        customOption.style.background = '#444';
      }
    });
    
    customOption.addEventListener('mouseleave', () => {
      if (!customInputs.style.display || customInputs.style.display === 'none') {
        customOption.style.background = '#333';
      }
    });
    
    customOption.addEventListener('click', () => {
      // Update selected state for all buttons
      optionsContainer.querySelectorAll('button').forEach(btn => {
        btn.style.background = '#333';
        btn.style.borderColor = '#555';
      });
      
      // Highlight this button
      customOption.style.background = '#4c7baf';
      customOption.style.borderColor = '#6ca0e0';
      
      // Show custom inputs
      customInputs.style.display = 'flex';
      
      // Focus on the width input
      widthInput.focus();
      
      // Update selected resolution from input values
      selectedResolution = { 
        width: parseInt(widthInput.value) || 1920, 
        height: parseInt(heightInput.value) || 1080 
      };
    });
    
    optionsContainer.appendChild(customOption);
    
    // Custom resolution inputs
    const customInputs = document.createElement('div');
    customInputs.style.cssText = `
      display: none;
      flex-direction: row;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 20px;
      gap: 10px;
    `;
    
    // Width input
    const widthLabel = document.createElement('label');
    widthLabel.textContent = 'Width:';
    widthLabel.style.flexBasis = '15%';
    
    const widthInput = document.createElement('input');
    widthInput.type = 'number';
    widthInput.min = '320';
    widthInput.max = '3840';
    widthInput.value = selectedResolution.width;
    widthInput.style.cssText = `
      flex: 1;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #555;
      background: #333;
      color: white;
    `;
    
    widthInput.addEventListener('input', () => {
      selectedResolution.width = parseInt(widthInput.value) || 1920;
    });
    
    // Height input
    const heightLabel = document.createElement('label');
    heightLabel.textContent = 'Height:';
    heightLabel.style.flexBasis = '15%';
    
    const heightInput = document.createElement('input');
    heightInput.type = 'number';
    heightInput.min = '240';
    heightInput.max = '2160';
    heightInput.value = selectedResolution.height;
    heightInput.style.cssText = `
      flex: 1;
      padding: 8px;
      border-radius: 4px;
      border: 1px solid #555;
      background: #333;
      color: white;
    `;
    
    heightInput.addEventListener('input', () => {
      selectedResolution.height = parseInt(heightInput.value) || 1080;
    });
    
    customInputs.appendChild(widthLabel);
    customInputs.appendChild(widthInput);
    customInputs.appendChild(heightLabel);
    customInputs.appendChild(heightInput);
    
    // Create action buttons
    const actionButtons = document.createElement('div');
    actionButtons.style.cssText = `
      display: flex;
      justify-content: flex-end;
      gap: 10px;
      margin-top: 20px;
    `;
    
    const cancelButton = document.createElement('button');
    cancelButton.textContent = 'Cancel';
    cancelButton.style.cssText = `
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      background: #444;
      color: white;
      cursor: pointer;
    `;
    
    const confirmButton = document.createElement('button');
    confirmButton.textContent = 'Export';
    confirmButton.style.cssText = `
      padding: 10px 20px;
      border: none;
      border-radius: 4px;
      background: #4CAF50;
      color: white;
      cursor: pointer;
    `;
    
    actionButtons.appendChild(cancelButton);
    actionButtons.appendChild(confirmButton);
    
    // Assemble dialog
    dialog.appendChild(title);
    dialog.appendChild(description);
    dialog.appendChild(optionsContainer);
    dialog.appendChild(customInputs);
    dialog.appendChild(actionButtons);
    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
    
    // Return control handlers
    return {
      show: (outputDir) => {
        return new Promise((resolve, reject) => {
          overlay.style.display = 'flex';
          
          cancelButton.onclick = () => {
            overlay.style.display = 'none';
            resolve(null);
          };
          
          confirmButton.onclick = () => {
            overlay.style.display = 'none';
            
            // Save selected resolution for next time
            localStorage.setItem('exportResolution', JSON.stringify(selectedResolution));
            
            resolve({
              outputDir,
              width: selectedResolution.width,
              height: selectedResolution.height
            });
          };
          
          // Check if a custom resolution was previously selected
          if (!resolutionOptions.some(option => 
            option.width === selectedResolution.width && 
            option.height === selectedResolution.height)
          ) {
            customOption.click();
          }
        });
      },
      hide: () => { overlay.style.display = 'none'; }
    };
  }
  
  const resolutionSelector = createResolutionSelectorDialog();
  
  // Handle export to PNG
  window.electronAPI.onExportToPNG(async ({ outputDir }) => {
    try {
      // First, show the resolution selector
      const exportConfig = await resolutionSelector.show(outputDir);
      
      // If user canceled, exit early
      if (!exportConfig) return;
      
      // Show export progress overlay
      exportProgress.show();
      exportProgress.updateProgress(0, 'Initializing export...');
      
      // Get current editor content and media data
      const editorContent = originalCode;
      const mediaData = projectManager.getAllMediaData();
      
      // Initialize the export renderer with selected dimensions
      const exporter = new ExportRenderer();
      exporter.initialize(exportConfig.width, exportConfig.height);
      
      // Log export resolution
      console.log(`Exporting slides at ${exportConfig.width}×${exportConfig.height}`);
      exportProgress.updateProgress(5, `Preparing ${exportConfig.width}×${exportConfig.height} export...`);
      
      // Load slides data
      const slideCount = exporter.loadSlideData(editorContent, mediaData);
      if (slideCount === 0) {
        throw new Error('No slides found in the presentation.');
      }
      
      exportProgress.updateProgress(10, `Found ${slideCount} slides to export.`);
      
      // Export all slides with progress updates
      const slides = await exporter.exportAllSlides(progress => {
        const percent = 10 + ((progress.current / progress.total) * 85);
        exportProgress.updateProgress(percent, progress.message);
      });
      
      // Save all slides to the output directory
      exportProgress.updateProgress(95, 'Saving files...');
      
      const successCount = await saveExportedSlides(slides, exportConfig.outputDir);
      
      // Clean up export renderer resources
      exporter.destroy();
      
      // Show success message with file count
      exportProgress.updateProgress(100, `Successfully exported ${successCount} slides!`);
      setTimeout(() => {
        exportProgress.hide();
      }, 2000);
      
    } catch (error) {
      console.error('Export error:', error);
      exportProgress.updateProgress(100, `Error: ${error.message}`);
      setTimeout(() => {
        exportProgress.hide();
      }, 3000);
    }
  });
  
  // Helper function to save exported slides to disk
  async function saveExportedSlides(slides, outputDir) {
    let successCount = 0;
    
    for (const slide of slides) {
      if (slide.success) {
        const fileName = `slide_${String(slide.index + 1).padStart(2, '0')}.png`;
        const filePath = `${outputDir}/${fileName}`;
        
        try {
          const result = await window.electronAPI.saveExportedPNG(filePath, slide.data);
          if (result.success) {
            successCount++;
          } else {
            console.error(`Failed to save slide ${slide.index + 1}: ${result.error}`);
          }
        } catch (error) {
          console.error(`Error saving slide ${slide.index + 1}:`, error);
        }
      }
    }
    
    return successCount;
  }
});

// Add window focus/blur events to optimize performance
window.addEventListener('focus', () => {
  // Resume animation when window is focused
  if (window.editorInstance) {
    window.editorInstance.layout();
  }
});

window.addEventListener('blur', () => {
  // When window loses focus, make sure we're not doing unnecessary rendering
  // The animate function will check isPlaying and document.hasFocus()
});

// Cleanup function for presentation window
function cleanupPresentationWindow() {
  if (window.presentationWindow && !window.presentationWindow.closed) {
    window.presentationWindow.close();
  }
  isPlaying = false;
}

// Add event listener for before unload to clean up presentation window
window.addEventListener('beforeunload', cleanupPresentationWindow);

document.addEventListener('DOMContentLoaded', () => {
  // This enables the native system title bar to be customized in Electron
  if (window.electronAPI && window.electronAPI.setTitleBarOverlay) {
    window.electronAPI.setTitleBarOverlay({
      color: '#333333',
      symbolColor: '#ffffff',
      height: 40
    });
  }
});

window.electronAPI.getSystemFonts().then(fonts => {
  const fontList = document.getElementById('fontList');
  fontList.innerHTML = '';
  
  fonts.forEach(font => {
      const option = document.createElement('option');
      option.value = font;
      option.textContent = font;
      fontList.appendChild(option);
  });
});