// Simple example of loading Monaco Editor from a local path or remotely
// If you're not bundling, you could do something like:
(async () => {
    // NOTE: This approach requires you to serve the monaco files in your app.
    // For quick setups, users often copy node_modules/monaco-editor/min/vs into a local folder (e.g. ./vendor/vs).
    const monacoLoaderScript = document.createElement('script');
    monacoLoaderScript.src = './vs/loader.js'; // Path to your local vs/loader.js
    document.body.appendChild(monacoLoaderScript);
  
    monacoLoaderScript.onload = () => {
      // Must configure base path so Monaco can find its internal scripts
      require.config({ paths: { 'vs': './vs' } });
      require(['vs/editor/editor.main'], function(monaco) {
        const editorContainer = document.getElementById('editor');
        const editorInstance = monaco.editor.create(editorContainer, {
          value: `// Press Enter in the editor to re-run this code.
  
  const slides = [
    {
      init(scene) {
        // Slide A: Red cube
        const geometry = new THREE.BoxGeometry();
        const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        const cube = new THREE.Mesh(geometry, material);
        scene.add(cube);
        return { cube };
      },
      transitionIn({ cube }) {
        gsap.fromTo(cube.scale, { x:0, y:0, z:0 }, { duration: 1, x:1, y:1, z:1 });
      },
      transitionOut({ cube }) {
        gsap.to(cube.position, { duration: 1, x: 2 });
      }
    },
    {
      init(scene) {
        // Slide B: Green sphere
        const geometry = new THREE.SphereGeometry(0.5, 32, 32);
        const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
        const sphere = new THREE.Mesh(geometry, material);
        sphere.position.x = -2;
        scene.add(sphere);
        return { sphere };
      },
      transitionIn({ sphere }) {
        gsap.fromTo(sphere.scale, { x:0, y:0, z:0 }, { duration: 1, x:1, y:1, z:1 });
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
  
        // Now set up Three.js + GSAP in the right pane
        const rendererCanvas = document.getElementById('threeCanvas');
        const renderer = new THREE.WebGLRenderer({ canvas: rendererCanvas });
        renderer.setPixelRatio(window.devicePixelRatio);
        const { clientWidth, clientHeight } = rendererCanvas;
        renderer.setSize(clientWidth, clientHeight);
  
        const scene = new THREE.Scene();
        const camera = new THREE.PerspectiveCamera(75, clientWidth / clientHeight, 0.1, 100);
        camera.position.z = 3;
  
        function animate() {
          requestAnimationFrame(animate);
          renderer.render(scene, camera);
        }
        animate();
  
        let slidesArray = [];
        let slideData = [];
        let currentSlideIndex = 0;
  
        function runUserCode(code) {
          // Clear scene
          while(scene.children.length > 0) {
            scene.remove(scene.children[0]);
          }
          slidesArray = [];
          slideData = [];
          currentSlideIndex = 0;
  
          try {
            // Evaluate user code in a sandboxed function
            const userFn = new Function('THREE', 'gsap', 'scene', 'playSlides', code);
            userFn(THREE, gsap, scene, playSlides);
          } catch (err) {
            console.error('User Code Error:', err);
          }
        }
  
        function playSlides(slides) {
          slidesArray = slides;
          slideData = slides.map(slide => null);
  
          // init all slides
          slidesArray.forEach((slide, idx) => {
            slideData[idx] = slide.init(scene);
          });
  
          // transition in first
          transitionInSlide(0);
        }
  
        function transitionInSlide(index) {
          if (slidesArray[index] && slidesArray[index].transitionIn) {
            slidesArray[index].transitionIn(slideData[index]);
          }
        }
  
        function transitionOutSlide(index) {
          if (slidesArray[index] && slidesArray[index].transitionOut) {
            slidesArray[index].transitionOut(slideData[index]);
          }
        }
  
        // Key handling
        document.addEventListener('keydown', (e) => {
          if (e.key === 'Enter') {
            const userCode = editorInstance.getValue();
            runUserCode(userCode);
          } else if (e.key === 'ArrowRight') {
            // Move to next slide
            transitionOutSlide(currentSlideIndex);
            currentSlideIndex = (currentSlideIndex + 1) % slidesArray.length;
            transitionInSlide(currentSlideIndex);
          } else if (e.key === 'ArrowLeft') {
            // Move to previous slide
            transitionOutSlide(currentSlideIndex);
            currentSlideIndex = (currentSlideIndex - 1 + slidesArray.length) % slidesArray.length;
            transitionInSlide(currentSlideIndex);
          }
        });
  
        // On initial load
        runUserCode(editorInstance.getValue());
      });
    };
  })();
  
  // If using a bundler, you would import from 'monaco-editor' instead of the loader approach above.