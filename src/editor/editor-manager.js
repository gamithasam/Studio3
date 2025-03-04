/**
 * Editor Manager - Handles Monaco editor setup and interactions
 */

export default class EditorManager {
  constructor() {
    this.editorInstance = null;
    this.originalCode = '';
    this.currentSlideIndex = 0;
    this.showSingleSlide = false;
    
    // Tab elements
    this.allSlidesTab = document.getElementById('allSlidesTab');
    this.oneSlideTab = document.getElementById('oneSlideTab');
    
    // Run code callback
    this.runCodeCallback = null;
  }
  
  async init(monaco, runCodeCallback) {
    this.runCodeCallback = runCodeCallback;
    await this.initEditor(monaco);
    this.setupTabSwitching();
    this.setupKeyEvents();
    return this.editorInstance;
  }
  
  async initEditor(monaco) {
    // Create the Monaco Editor
    const editorContainer = document.getElementById('editor');
    this.editorInstance = monaco.editor.create(editorContainer, {
      value: this.getDefaultEditorContent(),
      language: 'javascript',
      automaticLayout: true,
      theme: 'vs-dark'
    });
    
    // Store original code
    this.originalCode = this.editorInstance.getValue();
    
    // Make editor instance available globally
    window.editorInstance = this.editorInstance;
    
    // Add editor content accessor to window
    window.getCurrentEditorContent = () => this.editorInstance ? this.editorInstance.getValue() : '';
    
    return this.editorInstance;
  }
  
  getDefaultEditorContent() {
    return `// Modify the code and press Enter or click Play to run it.
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

playSlides(slides);`;
  }
  
  setupTabSwitching() {
    // Toggle tabs
    this.allSlidesTab.addEventListener('click', () => {
      if (this.showSingleSlide) {
        // Merge any one-slide changes into the overall code before switching
        this.mergeOneSlideChanges();
      }
      this.showSingleSlide = false;
      this.editorInstance.setValue(this.originalCode);
      this.allSlidesTab.classList.add('active');
      this.oneSlideTab.classList.remove('active');
    });

    this.oneSlideTab.addEventListener('click', () => {
      // If we're coming from "all slides" mode, update the master code.
      if (!this.showSingleSlide) {
        this.originalCode = this.editorInstance.getValue();
      }
      
      this.showSingleSlide = true;
      const slides = this.getSlidesArray(this.originalCode);
      if (slides.length > this.currentSlideIndex) {
        this.editorInstance.setValue(`(${slides[this.currentSlideIndex].code})`);
      } else {
        this.editorInstance.setValue('// Slide content not found');
      }
      this.oneSlideTab.classList.add('active');
      this.allSlidesTab.classList.remove('active');
    });
  }
  
  mergeOneSlideChanges() {
    let oneSlideCode = this.editorInstance.getValue();
    // Remove surrounding parentheses if present
    if (oneSlideCode.startsWith('(') && oneSlideCode.endsWith(')')) {
      oneSlideCode = oneSlideCode.slice(1, -1);
    }
    let slides = this.getSlidesArray(this.originalCode);
    if (slides.length > this.currentSlideIndex) {
      slides[this.currentSlideIndex].code = oneSlideCode;
    }
    // Rebuild the slides array content
    const rebuiltSlides = slides.map(sl => sl.code).join(',\n');
    // Replace the original slides array with the updated content
    this.originalCode = this.originalCode.replace(
      /(const\s+slides\s*=\s*\[)[\s\S]*(\];)/,
      `$1\n${rebuiltSlides}\n$2`
    );
  }
  
  getSlidesArray(code) {
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
        while (i + 1 < slidesContent.length && (slidesContent[i + 1] === ',' || slidesContent[i + 1] === '\n')) i++;
      }
    }
  
    return slides;
  }
  
  setupKeyEvents() {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') {
        const userCode = this.editorInstance.getValue();
        // Save it as the new original code
        this.originalCode = userCode;
        // Run the code using the provided callback
        if (this.runCodeCallback) {
          this.runCodeCallback(userCode);
        }
      }
    });
  }
  
  setCurrentSlideIndex(index) {
    this.currentSlideIndex = index;
    
    // If in single slide mode, update editor content
    if (this.showSingleSlide) {
      const slides = this.getSlidesArray(this.originalCode);
      
      if (slides.length > index) {
        this.editorInstance.setValue(`(${slides[index].code})`);
      } else {
        this.editorInstance.setValue('// Slide content not found');
      }
    }
  }
  
  getCurrentSlideIndex() {
    return this.currentSlideIndex;
  }
  
  getOriginalCode() {
    return this.originalCode;
  }
  
  setOriginalCode(code) {
    this.originalCode = code;
    if (!this.showSingleSlide) {
      this.editorInstance.setValue(code);
    }
  }
  
  updateElementPositionInCode(elementInfo, x, y) {
    if (!elementInfo) return;
    
    const { slideIndex, tagName, textContent } = elementInfo;
    const slides = this.getSlidesArray(this.originalCode);
    const slideCode = slides[slideIndex]?.code;
    
    if (!slideCode) return;
    
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
            styleAttr = this._updatePositionInStyle(styleAttr, x, y);
          } else {
            // Remove position properties
            styleAttr = this._removePositionFromStyle(styleAttr);
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
          cssText = this._updatePositionInStyle(cssText, x, y);
        } else {
          // Remove position from cssText
          cssText = this._removePositionFromStyle(cssText);
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
      this.originalCode = this.originalCode.replace(
        /(const\s+slides\s*=\s*\[)[\s\S]*(\];)/,
        `$1\n${rebuiltSlides}\n$2`
      );
      
      // Update the editor
      if (this.showSingleSlide && this.currentSlideIndex === slideIndex) {
        this.editorInstance.setValue(`(${updatedSlideCode})`);
      } else if (!this.showSingleSlide) {
        this.editorInstance.setValue(this.originalCode);
      }
      
      console.log('Position updated in code successfully!');
      return true;
    } else {
      console.warn('Could not update position in code');
      return false;
    }
  }
  
  updateElementStyleInCode(elementInfo, styleChanges) {
    if (!elementInfo) return;
    
    const { slideIndex, tagName, textContent } = elementInfo;
    const slides = this.getSlidesArray(this.originalCode);
    const slideCode = slides[slideIndex]?.code;
    
    if (!slideCode) return;
    
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
            // Extract current style
            let styleAttr = elementMatch[3];
            let styleUpdated = false;
            
            for (const [styleProp, styleValue] of Object.entries(styleChanges)) {
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
        }
      }

      // Also look for elements with cssText
      const cssTextRegex = /(\w+)\.style\.cssText\s*=\s*(['"`])([\s\S]*?)\2/g;
      
      while ((match = cssTextRegex.exec(slideCode)) !== null) {
        const elementVar = match[1];
        const quoteType = match[2];
        let cssText = match[3];
        
        // Check if this is likely our element
        const tagNameMap = {
          'h1': ['title', 'heading', 'mainTitle'],
          'h2': ['subtitle', 'subheading', 'author'],
          'p': ['description', 'text', 'paragraph'],
          'li': ['item', 'listItem']
        };
        
        const possibleNames = tagNameMap[tagName] || [];
        
        if (possibleNames.includes(elementVar) || 
            slideCode.includes(`const ${elementVar} = document.createElement('${tagName}')`)) {
          
          let styleUpdated = false;
          
          for (const [styleProp, styleValue] of Object.entries(styleChanges)) {
            // Look for existing property in cssText
            const propRegex = new RegExp(`(${styleProp})\\s*:\\s*([^;]*?)(;|$)`, 'g');
            const propMatch = propRegex.exec(cssText);
            
            if (propMatch) {
              // Replace existing property value
              cssText = cssText.replace(propRegex, `$1: ${styleValue}$3`);
              styleUpdated = true;
            } else {
              // Add new property to cssText
              cssText += `${cssText.endsWith(';') ? ' ' : '; '}${styleProp}: ${styleValue};`;
              styleUpdated = true;
            }
          }
          
          if (styleUpdated) {
            // Update the cssText in code
            const fullMatch = `${elementVar}.style.cssText = ${quoteType}${match[3]}${quoteType}`;
            const replacement = `${elementVar}.style.cssText = ${quoteType}${cssText}${quoteType}`;
            
            updatedSlideCode = updatedSlideCode.replace(fullMatch, replacement);
            codeWasUpdated = true;
          }
        }
      }
    }
    
    // Apply code updates if we made any changes
    if (codeWasUpdated) {
      slides[slideIndex].code = updatedSlideCode;
      const rebuiltSlides = slides.map(sl => sl.code).join(',\n');
      this.originalCode = this.originalCode.replace(
        /(const\s+slides\s*=\s*\[)[\s\S]*(\];)/,
        `$1\n${rebuiltSlides}\n$2`
      );
      
      // Update the editor
      if (this.showSingleSlide && this.currentSlideIndex === slideIndex) {
        this.editorInstance.setValue(`(${updatedSlideCode})`);
      } else if (!this.showSingleSlide) {
        this.editorInstance.setValue(this.originalCode);
      }
    }
  }

  // Helper method to update position in a style string
  _updatePositionInStyle(styleStr, x, y) {
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
  
  // Helper method to remove position properties from a style string
  _removePositionFromStyle(styleStr) {
    return styleStr
      .replace(/left:\s*[^;]*;?\s*/g, '')
      .replace(/top:\s*[^;]*;?\s*/g, '')
      .replace(/position:\s*[^;]*;?\s*/g, '');
  }
}