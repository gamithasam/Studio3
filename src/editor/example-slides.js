/**
 * Example slides code for new presentations
 */

export const exampleSlidesCode = `// Modify the code and press Enter or click Play to run it.
// This example defines slides that can mix 2D and 3D content freely.

const slides = [
  {
    init({ scene, container }) {
      // Slide 1: Title with floating 3D cube
      const title = document.createElement('h1');
      title.textContent = 'Welcome to Studio3';
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
                Studio3 combines beautiful design with powerful functionality,<br>
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
