// Modify the code and press Enter or click Play to run it.
  // This example defines slides that can mix 2D and 3D content freely.
  
  const slides = [
    {
          init({ scene, container }) {
            // Create text overlay
            const title = document.createElement('h1');
            title.textContent = 'OceanGraphics Dataset Presentation';
            title.style.cssText = 'color: white; opacity: 0; position: absolute; top: 20px; width: 100%; text-align: center;';
            
            const infoText = document.createElement('div');
            infoText.innerHTML = '<p>Exploring 60+ years of oceanographic data and predictive analysis</p>';
            infoText.style.cssText = 'color: white; opacity: 0; position: absolute; bottom: 20px; width: 100%; text-align: center;';
            
            container.appendChild(title);
            container.appendChild(infoText);
      
            // Create sun vector
            const sun = new THREE.Vector3();
            
            // Water setup
            const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
            const water = new Water(
              waterGeometry,
              {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load('media/waternormals.jpg', function (texture) {
                  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                }),
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7,
                fog: false
              }
            );
            
            water.rotation.x = -Math.PI / 2;
            
            // Raise the water level to -1 so the cube will be partially submerged
            water.position.y = -1;
            scene.add(water);
            
            // Sky setup
            const sky = new Sky();
            sky.scale.setScalar(10000);
            scene.add(sky);
            
            // Sky parameters
            const skyUniforms = sky.material.uniforms;
            skyUniforms['turbidity'].value = 10;
            skyUniforms['rayleigh'].value = 2;
            skyUniforms['mieCoefficient'].value = 0.005;
            skyUniforms['mieDirectionalG'].value = 0.8;
            
            // Set sun position
            const parameters = {
              elevation: 2, // Increased elevation for better lighting
              azimuth: 180
            };
            
            const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
            const theta = THREE.MathUtils.degToRad(parameters.azimuth);
            sun.setFromSphericalCoords(1, phi, theta);
            
            sky.material.uniforms['sunPosition'].value.copy(sun);
            water.material.uniforms['sunDirection'].value.copy(sun).normalize();
            
            // Create a more reflective floating cube
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshStandardMaterial({ 
              color: 0x049ef4, 
              roughness: 0.1, // Lower roughness for more reflections
              metalness: 0.8  // Higher metalness for more reflections
            });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(0, 0, 0);
            scene.add(cube);
            
            // Add stronger lighting
            const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
            directionalLight.position.set(sun.x, sun.y, sun.z);
            scene.add(directionalLight);
            
            // Add a point light near the cube for better reflections
            const pointLight = new THREE.PointLight(0xffffff, 1, 10);
            pointLight.position.set(0, 2, 2);
            scene.add(pointLight);
            
            // Find the camera in the scene
            let sceneCamera;
            scene.traverse(object => {
              if(object.type === 'PerspectiveCamera') {
                sceneCamera = object;
              }
            });
            
            // Store original camera position to restore later
            const originalCameraPosition = sceneCamera ? 
              { x: sceneCamera.position.x, y: sceneCamera.position.y, z: sceneCamera.position.z } : 
              { x: 0, y: 0, z: 3 };
                
            // Reposition camera if found
            if (sceneCamera) {
              sceneCamera.position.set(3, 3, 5); // Closer camera position to see reflections better
              sceneCamera.lookAt(0, 0, 0);
            }
            
            // Store animation frame ID for cleanup
            const state = { 
              waterTime: 0,
              animationFrameId: null
            };
            
            // Start water animation immediately after initialization
            const animate = () => {
              // Water animation
              if (water && water.material && water.material.uniforms['time']) {
                state.waterTime += 1.0 / 60.0;
                water.material.uniforms['time'].value = state.waterTime;
              }
              
              state.animationFrameId = requestAnimationFrame(animate);
            };
            
            // Start animation right away
            animate();
            
            return { 
              water, 
              cube, 
              title, 
              infoText, 
              sky, 
              sun,
              ambientLight, 
              directionalLight,
              pointLight,
              state,
              sceneCamera,
              originalCameraPosition,
              animate
            };
          },
          
          transitionIn({ water, cube, title, infoText, state, sceneCamera, pointLight }) {
            // Fade in text elements
            gsap.to(title, { duration: 1, opacity: 1, delay: 0.5 });
            gsap.to(infoText, { duration: 1, opacity: 1, delay: 1 });
            
            // Animate cube
            gsap.from(cube.position, { 
              duration: 2, 
              y: -10, 
              ease: "elastic.out(1, 0.5)" 
            });
            
            gsap.from(cube.rotation, { 
              duration: 2, 
              x: Math.PI * 2, 
              y: Math.PI * 2, 
              ease: "power2.out" 
            });
            
            // Animate point light for dramatic effect
            gsap.to(pointLight, {
              intensity: 1.5,
              distance: 15,
              duration: 2
            });
            
            // Set up cube and light animation
            const cubeAnimate = () => {
              // Cube animation - adjusted to clearly show submersion
              // Range is now from -1.2 to +1.2, which will intersect with water at y=-1
              const time = performance.now() * 0.001;
              if (cube) {
                cube.position.y = Math.sin(time * 0.5) * 1.2; // Slower, wider oscillation
                cube.rotation.x = time * 0.5;
                cube.rotation.z = time * 0.51;
              }
              
              // Animate point light to follow cube for better reflections
              if (pointLight) {
                pointLight.position.y = cube.position.y + 2;
                pointLight.intensity = 1 + Math.sin(time) * 0.3; // Subtle intensity variation
              }
              
              state.cubeAnimationFrameId = requestAnimationFrame(cubeAnimate);
            };
            
            cubeAnimate();
            
            // Camera animation if camera was found
            if (sceneCamera) {
              gsap.to(sceneCamera.position, {
                duration: 20,
                x: -3,
                y: 4,
                z: 5,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
              });
            }
          },
          
          transitionOut({ water, cube, title, infoText, sky, ambientLight, directionalLight, pointLight, state, sceneCamera, originalCameraPosition }) {
            // First, ensure the cube, text, and cube animation are completely gone before transitioning
            // Cancel cube animation immediately
            if (state.cubeAnimationFrameId) {
              cancelAnimationFrame(state.cubeAnimationFrameId);
              state.cubeAnimationFrameId = null;
            }
            
            // Immediately hide the cube and text
            gsap.set([title, infoText], { opacity: 0 });
            gsap.set(cube.position, { y: -10 }); // Move cube below water level
            
            // Dive into the water effect for transition - camera moves towards and below the water
            if (sceneCamera) {
              gsap.killTweensOf(sceneCamera.position);
              gsap.to(sceneCamera.position, {
                duration: 2,
                x: 0,
                y: -3,  // Move below the water surface (y = -1)
                z: 0,
                ease: "power2.in",
              });
            }
            
            // Keep water animation running during transition
            // It will be cleaned up after the transition is complete
            
            // Cleanup happens after camera dive effect
            gsap.delayedCall(1.8, () => {
              // Cancel water animation frame
              if (state.animationFrameId) {
                cancelAnimationFrame(state.animationFrameId);
                state.animationFrameId = null;
              }
              
              // Clean up resources
              cube.geometry.dispose();
              cube.material.dispose();
              if (cube.parent) cube.parent.remove(cube);
              
              water.material.dispose();
              water.geometry.dispose();
              if (water.parent) water.parent.remove(water);
              
              sky.material.dispose();
              if (sky.parent) sky.parent.remove(sky);
              
              if (ambientLight.parent) ambientLight.parent.remove(ambientLight);
              if (directionalLight.parent) directionalLight.parent.remove(directionalLight);
              if (pointLight.parent) pointLight.parent.remove(pointLight);
            });
          }
        },
    {
          init({ scene, container }) {
            // Reuse components from first slide
            // Create sun vector
            const sun = new THREE.Vector3();
            
            // Water setup
            const waterGeometry = new THREE.PlaneGeometry(10000, 10000);
            const water = new Water(
              waterGeometry,
              {
                textureWidth: 512,
                textureHeight: 512,
                waterNormals: new THREE.TextureLoader().load('media/waternormals.jpg', function (texture) {
                  texture.wrapS = texture.wrapT = THREE.RepeatWrapping;
                }),
                sunDirection: new THREE.Vector3(),
                sunColor: 0xffffff,
                waterColor: 0x001e0f,
                distortionScale: 3.7,
                fog: false
              }
            );
            
            water.rotation.x = -Math.PI / 2;
            water.position.y = -1;
            scene.add(water);
            
            // Sky setup
            const sky = new Sky();
            sky.scale.setScalar(10000);
            scene.add(sky);
            
            // Sky parameters
            const skyUniforms = sky.material.uniforms;
            skyUniforms['turbidity'].value = 10;
            skyUniforms['rayleigh'].value = 2;
            skyUniforms['mieCoefficient'].value = 0.005;
            skyUniforms['mieDirectionalG'].value = 0.8;
            
            // Set sun position
            const parameters = {
              elevation: 2,
              azimuth: 180
            };
            
            const phi = THREE.MathUtils.degToRad(90 - parameters.elevation);
            const theta = THREE.MathUtils.degToRad(parameters.azimuth);
            sun.setFromSphericalCoords(1, phi, theta);
            
            sky.material.uniforms['sunPosition'].value.copy(sun);
            water.material.uniforms['sunDirection'].value.copy(sun).normalize();
            
            // Add stronger lighting
            const ambientLight = new THREE.AmbientLight(0x404040, 1.2);
            scene.add(ambientLight);
            
            const directionalLight = new THREE.DirectionalLight(0xffffff, 1.5);
            directionalLight.position.set(sun.x, sun.y, sun.z);
            scene.add(directionalLight);
            
            // Find the camera in the scene
            let sceneCamera;
            scene.traverse(object => {
              if(object.type === 'PerspectiveCamera') {
                sceneCamera = object;
              }
            });
            
            // Store original camera position to restore later
            const originalCameraPosition = sceneCamera ? 
              { x: sceneCamera.position.x, y: sceneCamera.position.y, z: sceneCamera.position.z } : 
              { x: 0, y: 0, z: 3 };
                
            // Position camera for this slide
            if (sceneCamera) {
              sceneCamera.position.set(0, 3, 7); // Different angle to show team members
              sceneCamera.lookAt(0, 0, 0);
            }
            
            // Create team members overlay container
            const teamContainer = document.createElement('div');
            teamContainer.style.cssText = `
                position: absolute;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                opacity: 0; /* Start hidden */
            `;
            container.appendChild(teamContainer);
    
            // Title for team section
            const title = document.createElement('h1');
            title.textContent = 'Our Team';
            title.style.cssText = `
                color: white;
                font-size: 42px;
                margin-bottom: 50px;
                text-align: center;
                opacity: 0;
                text-shadow: 0 0 15px rgba(0, 0, 0, 0.8), 0 0 10px rgba(0, 0, 0, 0.8);
                font-weight: bold;
            `;
            teamContainer.appendChild(title);
    
            // Team members flexbox container
            const membersContainer = document.createElement('div');
            membersContainer.style.cssText = `
                display: flex;
                justify-content: space-around;
                width: 90%;
                max-width: 1200px;
            `;
            teamContainer.appendChild(membersContainer);
    
            // Team member data
            const teamMembers = [
                {
                    name: "Gamitha\n Samarasingha",
                    id: "KIC-HNDCSAI-242F-013"
                },
                {
                    name: "Thathsara\n Manamperi",
                    id: "KIC-HNDCSAI-242F-025"
                },
                {
                    name: "Thisumi\n Wijesinghe",
                    id: "KIC-HNDCSAI-242F-007"
                }
            ];
    
            // Create member cards
            const memberCards = [];
            teamMembers.forEach((member, index) => {
            const card = document.createElement('div');
            card.style.cssText = `
                background: rgba(0, 20, 50, 0.8); /* Darker, more opaque background */
                border: 2px solid rgba(100, 224, 255, 0.5);
                border-radius: 15px;
                width: 28%;
                padding: 30px 20px;
                display: flex;
                flex-direction: column;
                align-items: center;
                box-shadow: 0 10px 25px rgba(0, 0, 0, 0.5);
                backdrop-filter: blur(10px);
                transform: translateY(50px);
                opacity: 0;
                margin: 0 2%;
            `;
    
            // Name with good visibility
            const name = document.createElement('h2');
            name.textContent = member.name;
            name.style.cssText = `
                color: white;
                margin: 15px 0 10px 0;
                font-size: 28px;
                text-align: center;
                font-weight: bold;
                text-shadow: 0 0 10px rgba(0, 0, 0, 0.8), 0 0 5px rgba(0, 0, 0, 0.8);
                white-space: pre-line; /* Ensure text wraps to the next line */
                word-wrap: break-word; /* Force text to wrap */
            `;
    
            // Student ID
            const id = document.createElement('p');
            id.textContent = `${member.id}`;
            id.style.cssText = `
                color: rgba(255, 255, 255, 0.8);
                font-size: 18px;
                margin: 5px 0;
                text-shadow: 0 0 8px rgba(0, 0, 0, 0.8);
            `;
    
            // Assemble card
            card.appendChild(name);
            card.appendChild(id);
            membersContainer.appendChild(card);
    
            memberCards.push(card);
            });
            
            // State for water animation
            const state = { 
              waterTime: 0,
              animationFrameId: null
            };
            
            // Start water animation immediately
            const animate = () => {
              if (water && water.material && water.material.uniforms['time']) {
                state.waterTime += 1.0 / 60.0;
                water.material.uniforms['time'].value = state.waterTime;
              }
              
              state.animationFrameId = requestAnimationFrame(animate);
            };
            
            animate();
            
            return { 
              water, 
              title, 
              sky, 
              sun,
              ambientLight, 
              directionalLight,
              state,
              sceneCamera,
              originalCameraPosition,
              memberCards,
              teamContainer
            };
          },
          
          transitionIn({ water, title, state, sceneCamera, memberCards, teamContainer }) {
            // First fade in the container with a slight delay to ensure previous slide is transitioned out
            gsap.to(teamContainer, { 
              duration: 0.8, 
              opacity: 1, 
              delay: 0.5 
            });
            
            // Fade in title
            gsap.to(title, { duration: 1, opacity: 1, delay: 1 });
            
            // Staggered animation for member cards with more delay between them
            gsap.to(memberCards, { 
              duration: 1, 
              opacity: 1, 
              y: 0, 
              stagger: 0.5, // Increased stagger time for better separation
              delay: 1.5,   // Start after title is visible
              ease: "back.out(1.5)" 
            });
            
            // Camera subtle movement
            if (sceneCamera) {
              gsap.to(sceneCamera.position, {
                duration: 15,
                x: 2,
                ease: "sine.inOut",
                yoyo: true,
                repeat: -1
              });
            }
          },
          
          transitionOut({ water, title, sky, ambientLight, directionalLight, state, sceneCamera, originalCameraPosition, teamContainer }) {
            // Fade out team container
            gsap.to(teamContainer, { 
              duration: 0.8, 
              opacity: 0,
              y: -50
            });
            
            // Move camera position for transition
            if (sceneCamera) {
              gsap.killTweensOf(sceneCamera.position);
              gsap.to(sceneCamera.position, {
                duration: 1.5,
                x: 0,
                y: -3, // Move below the water
                z: 0,
                ease: "power2.in",
              });
            }
            
            // Cleanup happens after transition
            gsap.delayedCall(1.5, () => {
              // Cancel animation frame
              if (state.animationFrameId) {
                cancelAnimationFrame(state.animationFrameId);
                state.animationFrameId = null;
              }
              
              // Clean up resources
              water.material.dispose();
              water.geometry.dispose();
              if (water.parent) water.parent.remove(water);
              
              sky.material.dispose();
              if (sky.parent) sky.parent.remove(sky);
              
              if (ambientLight.parent) ambientLight.parent.remove(ambientLight);
              if (directionalLight.parent) directionalLight.parent.remove(directionalLight);
            });
          }
        },
    {
          init({ container }) {
            // Create main container with underwater effect
            const slide = document.createElement('div');
            slide.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #0a4975 0%, #031c40 100%);
              color: white;
              display: flex;
              flex-direction: column;
              align-items: center;
              opacity: 0;
              overflow: hidden;
            `;
            container.appendChild(slide);
            
            // Add underwater light rays
            const rays = document.createElement('div');
            rays.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: radial-gradient(ellipse at top, rgba(100, 224, 255, 0.2) 0%, rgba(3, 28, 64, 0) 70%);
              opacity: 0;
              pointer-events: none;
            `;
            slide.appendChild(rays);
            
            // Content container
            const content = document.createElement('div');
            content.style.cssText = `
              width: 90%;
              max-width: 1000px;
              padding: 40px;
              position: relative;
              z-index: 1;
            `;
            
            // Title with light glow effect
            const title = document.createElement('h1');
            title.textContent = 'Research Questions';
            title.style.cssText = `
              text-align: center;
              margin-bottom: 50px;
              opacity: 0;
              transform: translateY(-30px);
              text-shadow: 0 0 10px rgba(100, 224, 255, 0.8);
              font-size: 42px;
            `;
            content.appendChild(title);
            
            // Create 3D card container
            const cardContainer = document.createElement('div');
            cardContainer.style.cssText = `
              position: relative;
              width: 100%;
              height: 500px;
              perspective: 1000px;
            `;
            content.appendChild(cardContainer);
            
            // Create 3 research question cards
            const cards = [];
            const questions = [
              {
                title: "Relationship Analysis",
                content: "Is there a significant correlation between water salinity and temperature in ocean environments?"
              },
              {
                title: "Prediction Models",
                content: "Can we accurately predict water temperature using salinity measurements and machine learning techniques?"
              }
            ];
            
            questions.forEach((question, index) => {
              const card = document.createElement('div');
              card.className = 'question-card';
              card.style.cssText = `
                position: absolute;
                width: 80%;
                max-width: 600px;
                height: 200px;
                left: 50%;
                top: ${110 + index * 160}px;
                transform: translateX(-50%) scale(0.8);
                background: rgba(255, 255, 255, 0.1);
                border: 1px solid rgba(100, 224, 255, 0.3);
                border-radius: 15px;
                padding: 25px;
                box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 20px rgba(100, 224, 255, 0.2);
                backdrop-filter: blur(5px);
                opacity: 0;
              `;
              
              // Add glow effect border
              const glow = document.createElement('div');
              glow.style.cssText = `
                position: absolute;
                top: -3px;
                left: -3px;
                right: -3px;
                bottom: -3px;
                border-radius: 17px;
                background: transparent;
                border: 2px solid rgba(100, 224, 255, 0);
                box-shadow: 0 0 15px rgba(100, 224, 255, 0);
                pointer-events: none;
                z-index: -1;
              `;
              card.appendChild(glow);
              
              const cardNumber = document.createElement('div');
              cardNumber.textContent = (index + 1).toString();
              cardNumber.style.cssText = `
                position: absolute;
                top: -20px;
                left: -20px;
                width: 40px;
                height: 40px;
                background: #64e0ff;
                color: #031c40;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
                font-weight: bold;
                font-size: 24px;
                box-shadow: 0 0 10px rgba(100, 224, 255, 0.5);
              `;
              
              const cardTitle = document.createElement('h2');
              cardTitle.textContent = question.title;
              cardTitle.style.cssText = `
                color: #64e0ff;
                margin-bottom: 15px;
                font-size: 28px;
                position: relative;
              `;
              
              const cardContent = document.createElement('p');
              cardContent.textContent = question.content;
              cardContent.style.cssText = `
                font-size: 22px;
                line-height: 1.5;
                position: relative;
              `;
              
              card.appendChild(cardNumber);
              card.appendChild(cardTitle);
              card.appendChild(cardContent);
              cardContainer.appendChild(card);
              cards.push({ card, glow });
            });
            
            // Add floating particles for underwater effect
            const particlesContainer = document.createElement('div');
            particlesContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 0;
            `;
            
            // Create 30 floating particles
            for (let i = 0; i < 30; i++) {
              const particle = document.createElement('div');
              const size = Math.random() * 6 + 2;
              const x = Math.random() * 100;
              const y = Math.random() * 100;
              const duration = Math.random() * 15 + 10;
              const delay = Math.random() * 5;
              
              particle.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                width: ${size}px;
                height: ${size}px;
                background: rgba(255, 255, 255, 0.5);
                border-radius: 50%;
                filter: blur(1px);
                opacity: 0;
              `;
              
              particlesContainer.appendChild(particle);
              
              // Animate particles
              gsap.to(particle, {
                y: -50 - Math.random() * 100,
                x: (Math.random() * 40) - 20,
                opacity: 0.7,
                duration: duration,
                delay: delay,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                onStart: () => {
                  gsap.set(particle, { opacity: 0.7 });
                }
              });
            }
            
            slide.appendChild(particlesContainer);
            slide.appendChild(content);
                  
            return { slide, rays, title, cards };
          },
          
          transitionIn({ slide, rays, title, cards }) {
            // Fade in the slide
            gsap.to(slide, { 
              opacity: 1, 
              duration: 1 
            });
            
            // Animate light rays
            gsap.to(rays, {
              opacity: 0.8,
              duration: 2,
              ease: "power1.inOut"
            });
            
            // Animate title
            gsap.to(title, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.3,
              ease: "back.out"
            });
            
            // Each card appears with a spotlight effect and then stays visible
            cards.forEach((item, index) => {
              const delay = 1.5 + index * 2; // Longer delay between cards
              
              // Initial card appearance
              gsap.to(item.card, {
                opacity: 1,
                scale: 1,
                duration: 0.8,
                delay: delay,
                ease: "back.out(1.4)",
              });
              
              // Highlight glow for each card in sequence
              gsap.to(item.glow, {
                borderColor: "rgba(100, 224, 255, 0.8)",
                boxShadow: "0 0 25px rgba(100, 224, 255, 0.5)",
                duration: 0.8,
                delay: delay + 0.5,
                ease: "power2.inOut",
              });
              
              // Dim previous card when next one appears (except for the last card)
              if (index < cards.length - 1) {
                gsap.to(item.glow, {
                  borderColor: "rgba(100, 224, 255, 0.1)",
                  boxShadow: "0 0 15px rgba(100, 224, 255, 0.1)",
                  duration: 0.8,
                  delay: delay + 3, // Time before dimming
                  ease: "power2.inOut"
                });
              }
              
              // Add subtle animated movement
              gsap.to(item.card, {
                y: "+=10",
                duration: 2,
                delay: delay,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
              });
            });
          },
          
          transitionOut({ slide, cards }) {
            // Stop all animations
            cards.forEach(item => {
              gsap.killTweensOf(item.card);
              gsap.killTweensOf(item.glow);
            });
            
            // Create a wave-like effect as cards move off-screen
            cards.forEach((item, index) => {
              const delay = 0.1 * index;
              
              gsap.to(item.card, {
                x: window.innerWidth,
                rotateZ: 10,
                opacity: 0,
                duration: 0.8,
                delay: delay,
                ease: "power2.in"
              });
            });
            
            // Fade out the whole slide
            gsap.to(slide, {
              opacity: 0,
              duration: 0.5,
              delay: 0.6
            });
          }
        },
    {
          init({ container }) {
            // Create main container with underwater effect
            const slide = document.createElement('div');
            slide.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(145deg, #0a4975 0%, #031c40 100%);
              color: white;
              display: flex;
              flex-direction: column;
              align-items: center;
              opacity: 0;
              overflow: hidden;
            `;
            container.appendChild(slide);
            
            // Add underwater light rays
            const rays = document.createElement('div');
            rays.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: radial-gradient(ellipse at top, rgba(100, 224, 255, 0.15) 0%, rgba(3, 28, 64, 0) 70%);
              opacity: 0;
              pointer-events: none;
            `;
            slide.appendChild(rays);
            
            // Content container with centered content
            const content = document.createElement('div');
            content.style.cssText = `
              position: relative;
              width: 80%;
              max-width: 1000px;
              height: 100%;
              display: flex;
              flex-direction: column;
              justify-content: center;
              align-items: center;
              z-index: 2;
            `;
            
            // Title with light glow effect
            const title = document.createElement('h1');
            title.textContent = 'Presentation Outline';
            title.style.cssText = `
              font-size: 46px;
              margin-bottom: 60px;
              text-align: center;
              opacity: 0;
              transform: translateY(-30px);
              color: white;
              font-weight: bold;
              text-shadow: 0 0 15px rgba(0, 150, 255, 0.7);
            `;
            content.appendChild(title);
            
            // Create outline container
            const outlineContainer = document.createElement('div');
            outlineContainer.style.cssText = `
              width: 80%;
              background: rgba(0, 30, 60, 0.7);
              border-radius: 20px;
              padding: 40px;
              box-shadow: 0 10px 30px rgba(0, 0, 0, 0.3), 0 0 30px rgba(100, 224, 255, 0.2);
              backdrop-filter: blur(10px);
              border: 1px solid rgba(100, 224, 255, 0.3);
              opacity: 0;
              transform: scale(0.9);
            `;
            
            // Create outline items
            const outlineItems = [
              "Data Exploration and Analysis",
              "Model Fitting and Results",
              "Model Performance Comparison"
            ];
            
            const outlineItemsContainer = document.createElement('div');
            outlineItemsContainer.style.cssText = `
              display: flex;
              flex-direction: column;
              gap: 30px;
            `;
            
            const outlineElements = [];
            
            outlineItems.forEach((item, index) => {
              const itemContainer = document.createElement('div');
              itemContainer.style.cssText = `
                display: flex;
                align-items: center;
                opacity: 0;
                transform: translateX(-20px);
              `;
              
              // Bullet point / number
              const bulletPoint = document.createElement('div');
              bulletPoint.textContent = (index + 1).toString();
              bulletPoint.style.cssText = `
                width: 50px;
                height: 50px;
                border-radius: 50%;
                background: rgba(100, 224, 255, 0.2);
                border: 2px solid rgba(100, 224, 255, 0.6);
                display: flex;
                align-items: center;
                justify-content: center;
                margin-right: 25px;
                font-size: 24px;
                font-weight: bold;
                color: #64e0ff;
                box-shadow: 0 0 15px rgba(100, 224, 255, 0.3);
              `;
              
              // Item text
              const itemText = document.createElement('h2');
              itemText.textContent = item;
              itemText.style.cssText = `
                font-size: 32px;
                font-weight: bold;
                margin: 0;
                color: white;
                text-shadow: 0 0 10px rgba(0, 0, 0, 0.5);
              `;
              
              // Assemble item
              itemContainer.appendChild(bulletPoint);
              itemContainer.appendChild(itemText);
              outlineItemsContainer.appendChild(itemContainer);
              
              outlineElements.push(itemContainer);
            });
            
            outlineContainer.appendChild(outlineItemsContainer);
            content.appendChild(outlineContainer);
            
            // Add floating particles for underwater effect
            const particlesContainer = document.createElement('div');
            particlesContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 1;
            `;
            
            // Create floating particles (like plankton or small bubbles)
            for (let i = 0; i < 40; i++) {
              const particle = document.createElement('div');
              const size = Math.random() * 6 + 2;
              const x = Math.random() * 100;
              const y = Math.random() * 100;
              const duration = Math.random() * 15 + 10;
              const delay = Math.random() * 5;
              const opacity = Math.random() * 0.4 + 0.3;
              
              particle.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                width: ${size}px;
                height: ${size}px;
                background: rgba(255, 255, 255, ${opacity});
                border-radius: 50%;
                filter: blur(1px);
                opacity: 0;
              `;
              
              particlesContainer.appendChild(particle);
              
              // Animate particles
              gsap.to(particle, {
                y: `-=${Math.random() * 100 + 50}`,
                x: `+=${(Math.random() * 50) - 25}`,
                opacity: opacity,
                duration: duration,
                delay: delay,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut"
              });
            }
            
            slide.appendChild(particlesContainer);
            slide.appendChild(content);
            
            return { slide, rays, title, outlineContainer, outlineElements };
          },
          
          transitionIn({ slide, rays, title, outlineContainer, outlineElements }) {
            // Fade in the slide
            gsap.to(slide, { 
              opacity: 1, 
              duration: 1 
            });
            
            // Animate light rays
            gsap.to(rays, {
              opacity: 0.8,
              duration: 2,
              ease: "power1.inOut"
            });
            
            // Animate title
            gsap.to(title, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.3,
              ease: "back.out"
            });
            
            // Animate container
            gsap.to(outlineContainer, {
              opacity: 1,
              scale: 1,
              duration: 1,
              delay: 0.7,
              ease: "back.out(1.2)"
            });
            
            // Staggered animation for outline items
            gsap.to(outlineElements, {
              opacity: 1,
              x: 0,
              duration: 0.8,
              stagger: 0.5,
              delay: 1.2,
              ease: "back.out"
            });
          },
          
          transitionOut({ slide, rays, title, outlineContainer, outlineElements }) {
            // Fade out all elements
            gsap.to([...outlineElements, outlineContainer, title, rays], {
              opacity: 0,
              duration: 0.5,
              stagger: 0.1
            });
            
            // Create a water ripple transition effect
            const rippleContainer = document.createElement('div');
            rippleContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 100;
              pointer-events: none;
            `;
            slide.appendChild(rippleContainer);
            
            // Create ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0);
              width: 100px;
              height: 100px;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(100, 224, 255, 0.4) 30%, rgba(3, 28, 64, 0) 70%);
              border-radius: 50%;
              z-index: 10;
              opacity: 0.8;
            `;
            rippleContainer.appendChild(ripple);
            
            // Animate ripple effect
            gsap.to(ripple, {
              scale: 12,
              opacity: 0,
              duration: 1.2,
              ease: "power3.out",
              onComplete: () => {
                // Final fade of entire slide
                gsap.to(slide, {
                  opacity: 0,
                  duration: 0.3
                });
              }
            });
          }
        },
        {
          init({ container }) {
            const slide = document.createElement('div');
            slide.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #0a4975 0%, #031c40 100%);
              color: white;
              opacity: 0;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            `;
            
            // Create bubbles effect for background
            const bubbles = document.createElement('div');
            bubbles.style.cssText = `
              position: absolute;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 0;
            `;
            
            // Generate 40 random bubbles
            for (let i = 0; i < 40; i++) {
              const size = Math.random() * 20 + 5;
              const bubble = document.createElement('div');
              bubble.style.cssText = `
                position: absolute;
                bottom: -${size * 2}px;
                left: ${Math.random() * 100}%;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
                opacity: 0;
                transform: translateY(0);
              `;
              bubbles.appendChild(bubble);
              
              // Animate bubbles rising
              const duration = (Math.random() * 10) + 15;
              const delay = Math.random() * 20;
              
              gsap.to(bubble, {
                y: `-=${window.innerHeight + size * 2}`,
                x: `+=${(Math.random() * 100) - 50}`,
                opacity: 0.7,
                duration: duration,
                delay: delay,
                repeat: -1,
                ease: "power1.inOut",
                onStart: () => {
                  gsap.set(bubble, { opacity: 0.7 });
                }
              });
            }
            
            slide.appendChild(bubbles);
            
            // Add underwater light rays effect
            const rays = document.createElement('div');
            rays.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: radial-gradient(ellipse at center, rgba(100, 224, 255, 0.15) 0%, rgba(3, 28, 64, 0) 70%);
              opacity: 0;
              pointer-events: none;
            `;
            slide.appendChild(rays);
            
            // Content container - simple centered title
            const content = document.createElement('div');
            content.style.cssText = `
              position: relative;
              z-index: 1;
              text-align: center;
              opacity: 0;
              transform: translateY(20px);
            `;
            
            // Just the title - large and prominent
            const title = document.createElement('h1');
            title.textContent = 'Data Exploration & Analysis';
            title.style.cssText = `
              font-size: 64px;
              font-weight: bold;
              color: white;
              text-shadow: 0 0 20px rgba(100, 224, 255, 0.6);
              margin: 0;
              padding: 0;
            `;
            
            content.appendChild(title);
            slide.appendChild(content);
            container.appendChild(slide);
            
            return { slide, content, bubbles, rays };
          },
          
          transitionIn({ slide, content, rays }) {
            // Fade in slide
            gsap.to(slide, {
              opacity: 1,
              duration: 1
            });
            
            // Animate light rays
            gsap.to(rays, {
              opacity: 0.8,
              duration: 2,
              ease: "power1.inOut"
            });
            
            // Animate title with slight bounce effect
            gsap.to(content, {
              opacity: 1,
              y: 0,
              duration: 1.2,
              delay: 0.5,
              ease: "back.out(1.2)"
            });
            
            // Add subtle pulse animation to the title
            const title = content.querySelector('h1');
            gsap.to(title, {
              textShadow: "0 0 30px rgba(100, 224, 255, 0.9)",
              repeat: -1,
              yoyo: true,
              duration: 2,
              delay: 1.5
            });
          },
          
          transitionOut({ slide, content, bubbles }) {
            // Stop any ongoing animations
            gsap.killTweensOf(content.querySelector('h1'));
            
            // Create a water ripple transition effect
            const rippleContainer = document.createElement('div');
            rippleContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 100;
              pointer-events: none;
            `;
            slide.appendChild(rippleContainer);
            
            // Create main ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0);
              width: 100px;
              height: 100px;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(100, 224, 255, 0.4) 30%, rgba(3, 28, 64, 0) 70%);
              border-radius: 50%;
              z-index: 10;
              opacity: 0.8;
            `;
            rippleContainer.appendChild(ripple);
            
            // Animate content out
            gsap.to(content, {
              scale: 0.9,
              opacity: 0,
              duration: 0.5,
              ease: "power2.in"
            });
            
            // Stop bubbles animation
            gsap.killTweensOf(bubbles.childNodes);
            
            // Animate ripple effect
            gsap.to(ripple, {
              scale: 15,
              opacity: 0,
              duration: 1.5,
              ease: "power3.out",
              onComplete: () => {
                // Final fade of entire slide
                gsap.to(slide, {
                  opacity: 0,
                  duration: 0.3
                });
              }
            });
          }
        },
        {
          init({ scene, container }) {
            // Create main container with a dark ocean gradient
            const slide = document.createElement('div');
            slide.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; background: linear-gradient(135deg, #0a4975 0%, #031c40 100%); color: white; display: flex; flex-direction: column; align-items: center; opacity: 0;';
            container.appendChild(slide);
            
            // Add particle system for bubble effect
            const particleContainer = document.createElement('div');
            particleContainer.style.cssText = 'position: absolute; top: 0; left: 0; width: 100%; height: 100%; overflow: hidden; pointer-events: none;';
            slide.appendChild(particleContainer);
            
            // Generate bubbles
            for (let i = 0; i < 50; i++) {
              const bubble = document.createElement('div');
              const size = Math.random() * 15 + 5;
              const startX = Math.random() * 100;
              const duration = Math.random() * 10 + 10;
              const delay = Math.random() * 15;
              
              bubble.style.cssText = `
                position: absolute;
                left: ${startX}%;
                bottom: -${size}px;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.8), rgba(255, 255, 255, 0.1));
                opacity: 0;
                transform: translateY(0);
                pointer-events: none;
              `;
              
              particleContainer.appendChild(bubble);
              
              // Animate each bubble
              gsap.to(bubble, {
                y: -window.innerHeight - size,
                opacity: 0.7,
                duration: duration,
                delay: delay,
                ease: "power1.inOut",
                repeat: -1,
                onStart: () => {
                  gsap.set(bubble, { opacity: 0.7 });
                }
              });
            }
            
            // Content area
            const content = document.createElement('div');
            content.style.cssText = 'width: 80%; max-width: 1000px; text-align: center; padding: 40px; position: relative; z-index: 1;';
            
            // Create title with wave effect
            const titleContainer = document.createElement('div');
            titleContainer.style.cssText = 'margin-bottom: 60px; position: relative; overflow: hidden; padding: 20px 0;';
            
            const title = document.createElement('h1');
            title.textContent = 'OceanGraphics Dataset';
            title.style.cssText = 'font-size: 52px; opacity: 0; transform: translateY(-50px);';
            
            titleContainer.appendChild(title);
            content.appendChild(titleContainer);
            
            // Create flexible container for dataset info and visualization
            const flexContainer = document.createElement('div');
            flexContainer.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-top: 30px;';
            
            // Dataset highlights
            const datasetInfo = document.createElement('div');
            datasetInfo.style.cssText = 'text-align: left; width: 45%; opacity: 0; transform: translateX(-50px);';
            datasetInfo.innerHTML = `
              <h3 style="color: #64e0ff; margin-bottom: 25px; font-size: 30px;">Dataset Highlights:</h3>
              <ul style="font-size: 24px; line-height: 1.7;" id="dataset-list">
                <li style="opacity: 0; transform: translateX(-20px);">Longest oceanographic time series (1949-present)</li>
                <li style="opacity: 0; transform: translateX(-20px);">Over 50,000 sampling stations worldwide</li>
                <li style="opacity: 0; transform: translateX(-20px);">Most complete marine dataset available</li>
                <li style="opacity: 0; transform: translateX(-20px);">60+ years of consistent measurements</li>
              </ul>
            `;
            
            // Replace globe with ocean image container
            const oceanVisualization = document.createElement('div');
            oceanVisualization.style.cssText = 'width: 50%; height: 350px; position: relative; border-radius: 15px; overflow: hidden;';
            
            // Create a static ocean image instead of dynamically loaded globe
            const oceanImage = document.createElement('div');
            oceanImage.style.cssText = `
              width: 100%;
              height: 100%;
              background-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA4MDAgNjAwIj4KICA8ZGVmcz4KICAgIDxsaW5lYXJHcmFkaWVudCBpZD0ib2NlYW5HcmFkaWVudCIgeDE9IjAlIiB5MT0iMCUiIHgyPSIwJSIgeTI9IjEwMCUiPgogICAgICA8c3RvcCBvZmZzZXQ9IjAlIiBzdHlsZT0ic3RvcC1jb2xvcjojMDI3MGIyO3N0b3Atb3BhY2l0eToxIiAvPgogICAgICA8c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiMwMDFFNjA7c3RvcC1vcGFjaXR5OjEiIC8+CiAgICA8L2xpbmVhckdyYWRpZW50PgogIDwvZGVmcz4KICA8cmVjdCB3aWR0aD0iODAwIiBoZWlnaHQ9IjYwMCIgZmlsbD0idXJsKCNvY2VhbkdyYWRpZW50KSIgLz4KICA8Y2lyY2xlIGN4PSI0MDAiIGN5PSIzMDAiIHI9IjE4MCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjNjRlMGZmIiBzdHJva2Utd2lkdGg9IjIiIHN0cm9rZS1kYXNoYXJyYXk9IjEwLDUiIC8+CiAgPGNpcmNsZSBjeD0iNDAwIiBjeT0iMzAwIiByPSIxNTAiIGZpbGw9Im5vbmUiIHN0cm9rZT0iIzY0ZTBmZiIgc3Ryb2tlLXdpZHRoPSIyIiAvPgogIDxjaXJjbGUgY3g9IjQwMCIgY3k9IjMwMCIgcj0iODAiIGZpbGw9IiM2NGUwZmYiIGZpbGwtb3BhY2l0eT0iMC4yIiBzdHJva2U9IiM2NGUwZmYiIHN0cm9rZS13aWR0aD0iMiIgLz4KICA8IS0tIFNpbXVsYXRlIGRhdGEgcG9pbnRzIC0tPgogIDxnIGZpbGw9IiM2NGUwZmYiPgogICAgPGNpcmNsZSBjeD0iMzUwIiBjeT0iMjUwIiByPSIzIiAvPgogICAgPGNpcmxlIGN4PSI0MjAiIGN5PSIzNTAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSIyNTAiIGN5PSIzMDAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSI1MDAiIGN5PSIyODAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSI0NTAiIGN5PSI0MDAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSIzODAiIGN5PSIyMDAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSIzMDAiIGN5PSIzODAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSI0NzAiIGN5PSIzMjAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSIzMzAiIGN5PSIzNDAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSI0MzAiIGN5PSIyNzAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSIyODAiIGN5PSIyNDAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSI1MzAiIGN5PSIzNTAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSI0MDAiIGN5PSI0MzAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSIzNTAiIGN5PSIxODAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSI0ODAiIGN5PSI0MjAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSIyMjAiIGN5PSIzMjAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSI1NTAiIGN5PSIzMDAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSIzNzAiIGN5PSI0NTAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSI0NTAiIGN5PSIyMjAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSIzMTAiIGN5PSI0MDAiIHI9IjMiIC8+CiAgICA8Y2lyY2xlIGN4PSI1MDAiIGN5PSIzNDAiIHI9IjMiIC8+CiAgIDwvZz4KICA8dGV4dCB4PSI0MDAiIHk9IjMwMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjIwIiBmb250LXdlaWdodD0iYm9sZCI+T2NlYW5HcmFwaGljczwvdGV4dD4KICA8dGV4dCB4PSI0MDAiIHk9IjMzMCIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZG9taW5hbnQtYmFzZWxpbmU9Im1pZGRsZSIgZmlsbD0id2hpdGUiIGZvbnQtZmFtaWx5PSJzYW5zLXNlcmlmIiBmb250LXNpemU9IjE0Ij5HbG9iYWwgU2FtcGxpbmcgTG9jYXRpb25zPC90ZXh0Pgo8L3N2Zz4=');
              background-size: cover;
              background-position: center;
              border-radius: 15px;
              opacity: 0;
              box-shadow: 0 5px 20px rgba(0, 0, 0, 0.3);
            `;
            
            // Add data points overlay that simulates the sampling points
            const dataPoints = document.createElement('div');
            dataPoints.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              pointer-events: none;
              opacity: 0;
            `;
            
            // Create animated data points to simulate the sampling locations
            for (let i = 0; i < 50; i++) {
              const point = document.createElement('div');
              const size = Math.random() * 4 + 2;
              const x = Math.random() * 90 + 5; // Keep points within boundaries
              const y = Math.random() * 90 + 5;
              
              point.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                width: ${size}px;
                height: ${size}px;
                background: #64e0ff;
                border-radius: 50%;
                box-shadow: 0 0 8px #64e0ff;
                transform: scale(0);
              `;
              
              dataPoints.appendChild(point);
              
              // Animate each data point with a random delay
              gsap.to(point, {
                scale: 1,
                duration: 0.5,
                delay: 1.5 + Math.random() * 2, // Random delay for each point
                ease: "back.out"
              });
              
              // Add pulsing effect
              gsap.to(point, {
                boxShadow: "0 0 15px #64e0ff",
                repeat: -1,
                yoyo: true,
                duration: 1.5 + Math.random(),
                delay: 2 + Math.random() * 2
              });
            }
            
            oceanVisualization.appendChild(oceanImage);
            oceanVisualization.appendChild(dataPoints);
            
            flexContainer.appendChild(datasetInfo);
            flexContainer.appendChild(oceanVisualization);
            content.appendChild(flexContainer);
            
            slide.appendChild(content);
            
            // Get references to elements
            const listItems = datasetInfo.querySelectorAll('li');
            
            return { 
              slide, 
              title,
              datasetInfo,
              listItems,
              oceanImage,
              dataPoints
            };
          },
          
          transitionIn({ 
            slide, 
            title, 
            datasetInfo, 
            listItems, 
            oceanImage,
            dataPoints
          }) {
            // Fade in main slide
            gsap.to(slide, { 
              opacity: 1, 
              duration: 1 
            });
            
            // Animate title with more pronounced effect since it's the only header now
            gsap.to(title, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.3,
              ease: "back.out(1.7)"
            });
            
            // Animate dataset info
            gsap.to(datasetInfo, {
              opacity: 1,
              x: 0,
              duration: 0.8,
              delay: 0.7,
              ease: "power2.out"
            });
            
            // Staggered animation for list items
            gsap.to(listItems, {
              opacity: 1,
              x: 0,
              duration: 0.6,
              stagger: 0.15,
              delay: 1,
              ease: "power2.out"
            });
            
            // Animate ocean image
            gsap.to(oceanImage, {
              opacity: 1,
              duration: 1,
              delay: 1.2
            });
            
            // Animate data points container
            gsap.to(dataPoints, {
              opacity: 1,
              duration: 1, 
              delay: 1.5
            });
            
            // Simulate rotating effect on the visualization
            gsap.to(oceanImage, {
              backgroundPosition: "center right",
              duration: 20,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut"
            });
          },
          
          transitionOut({ slide }) {
            // Create zoom effect as if we're zooming into the visualization
            gsap.to(slide, { 
              opacity: 0,
              scale: 2,
              duration: 1,
              ease: "power2.in" 
            });
          }
        },
        
        {
          init({ container }) {
            const slide = document.createElement('div');
            slide.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #0a4975 0%, #031c40 100%);
              color: white;
              opacity: 0;
              overflow: hidden;
            `;
            
            // Create bubbles effect for background
            const bubbles = document.createElement('div');
            bubbles.style.cssText = `
              position: absolute;
              width: 100%;
              height: 100%;
              pointer-events: none;
            `;
            
            // Generate 40 random bubbles
            for (let i = 0; i < 40; i++) {
              const size = Math.random() * 20 + 5;
              const bubble = document.createElement('div');
              bubble.style.cssText = `
                position: absolute;
                bottom: -${size * 2}px;
                left: ${Math.random() * 100}%;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
                opacity: 0;
                transform: translateY(0);
              `;
              bubbles.appendChild(bubble);
              
              // Animate bubbles rising
              const duration = (Math.random() * 10) + 15;
              const delay = Math.random() * 20;
              
              gsap.to(bubble, {
                y: `-=${window.innerHeight + size * 2}`,
                x: `+=${(Math.random() * 100) - 50}`,
                opacity: 0.7,
                duration: duration,
                delay: delay,
                repeat: -1,
                ease: "power1.inOut",
                onStart: () => {
                  gsap.set(bubble, { opacity: 0.7 });
                }
              });
            }
            
            slide.appendChild(bubbles);
            
            // Content container with centered layout
            const content = document.createElement('div');
            content.style.cssText = `
              position: relative;
              width: 90%;
              height: 90%;
              margin: 2% auto;
              display: flex;
              flex-direction: column;
              align-items: center;
              z-index: 1;
            `;
            
            // Header
            const header = document.createElement('div');
            header.style.cssText = `
              width: 100%;
              text-align: center;
              padding: 20px;
              margin-bottom: 40px;
            `;
            
            const title = document.createElement('h1');
            title.textContent = 'Data Exploration';
            title.style.cssText = `
              font-size: 42px;
              margin-bottom: 10px;
              opacity: 0;
              transform: translateY(-20px);
              text-shadow: 0 0 10px rgba(100, 224, 255, 0.5);
            `;
            
            const subtitle = document.createElement('p');
            subtitle.innerHTML = 'Temperature and Salinity Patterns in <span style="color: #64e0ff;">60+ Years</span> of Ocean Data';
            subtitle.style.cssText = `
              font-size: 22px;
              opacity: 0;
            `;
            
            header.appendChild(title);
            header.appendChild(subtitle);
            content.appendChild(header);
            
            // Charts container - using flex to center content better
            const chartsContainer = document.createElement('div');
            chartsContainer.style.cssText = `
              display: flex;
              justify-content: center;
              align-items: center;
              gap: 50px;
              width: 100%;
              margin: 20px auto;
            `;
            
            // Temperature chart container
            const tempChartContainer = document.createElement('div');
            tempChartContainer.style.cssText = `
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 20px;
              width: 45%;
              max-width: 500px;
              opacity: 0;
              transform: translateY(30px);
            `;
            
            const tempChartHeader = document.createElement('div');
            tempChartHeader.innerHTML = `
              <h2 style="color: #64e0ff; margin-bottom: 10px; font-size: 24px;">Temperature Distribution</h2>
              <div class="temp-stats" style="display: flex; justify-content: space-around; margin-bottom: 15px;">
                <div style="text-align: center;">
                  <span style="font-size: 16px;">Range</span>
                  <div style="font-size: 24px; color: #64e0ff;">-2°C to 30°C</div>
                </div>
                <div style="text-align: center;">
                  <span style="font-size: 16px;">Mean</span>
                  <div style="font-size: 24px; color: #64e0ff;">12.8°C</div>
                </div>
                <div style="text-align: center;">
                  <span style="font-size: 16px;">Median</span>
                  <div style="font-size: 24px; color: #64e0ff;">11.2°C</div>
                </div>
              </div>
            `;
            
            // Add image instead of canvas
            const tempChartImage = document.createElement('img');
            tempChartImage.src = "media/temp.png";
            tempChartImage.alt = "Temperature Distribution Histogram";
            tempChartImage.style.cssText = `
              width: 100%;
              height: auto;
              border-radius: 8px;
              opacity: 0;
            `;
            
            tempChartContainer.appendChild(tempChartHeader);
            tempChartContainer.appendChild(tempChartImage);
            chartsContainer.appendChild(tempChartContainer);
            
            // Salinity chart container
            const salinityChartContainer = document.createElement('div');
            salinityChartContainer.style.cssText = `
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 20px;
              width: 45%;
              max-width: 500px;
              opacity: 0;
              transform: translateY(30px);
            `;
            
            const salinityChartHeader = document.createElement('div');
            salinityChartHeader.innerHTML = `
              <h2 style="color: #ff9e64; margin-bottom: 10px; font-size: 24px;">Salinity Distribution</h2>
              <div class="salinity-stats" style="display: flex; justify-content: space-around; margin-bottom: 15px;">
                <div style="text-align: center;">
                  <span style="font-size: 16px;">Range</span>
                  <div style="font-size: 24px; color: #ff9e64;">30-40 PSU</div>
                </div>
                <div style="text-align: center;">
                  <span style="font-size: 16px;">Mean</span>
                  <div style="font-size: 24px; color: #ff9e64;">34.8 PSU</div>
                </div>
                <div style="text-align: center;">
                  <span style="font-size: 16px;">Median</span>
                  <div style="font-size: 24px; color: #ff9e64;">35.1 PSU</div>
                </div>
              </div>
            `;
            
            // Add image instead of canvas
            const salinityChartImage = document.createElement('img');
            salinityChartImage.src = "media/sal.png";
            salinityChartImage.alt = "Salinity Distribution Histogram";
            salinityChartImage.style.cssText = `
              width: 100%;
              height: auto;
              border-radius: 8px;
              opacity: 0;
            `;
            
            salinityChartContainer.appendChild(salinityChartHeader);
            salinityChartContainer.appendChild(salinityChartImage);
            chartsContainer.appendChild(salinityChartContainer);
            
            content.appendChild(chartsContainer);
            
            slide.appendChild(content);
            container.appendChild(slide);
            
            return { 
              slide, 
              title,
              subtitle, 
              tempChartContainer,
              tempChartImage, 
              salinityChartContainer,
              salinityChartImage,
              content,
              bubbles
            };
          },
          
          transitionIn({ 
            slide, 
            title,
            subtitle,
            tempChartContainer,
            tempChartImage, 
            salinityChartContainer,
            salinityChartImage
          }) {
            // Fade in slide
            gsap.to(slide, {
              opacity: 1,
              duration: 1
            });
            
            // Animate title
            gsap.to(title, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.3
            });
            
            // Animate subtitle
            gsap.to(subtitle, {
              opacity: 1,
              duration: 1,
              delay: 0.6
            });
            
            // Temp chart container
            gsap.to(tempChartContainer, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 1
            });
            
            // Temp chart image
            gsap.to(tempChartImage, {
              opacity: 1,
              duration: 1.2,
              delay: 1.2
            });
            
            // Salinity chart container
            gsap.to(salinityChartContainer, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 1.5
            });
            
            // Salinity chart image
            gsap.to(salinityChartImage, {
              opacity: 1,
              duration: 1.2,
              delay: 1.7
            });
          },
          
          transitionOut({ 
            slide, 
            content,
            bubbles
          }) {
            // Create a water ripple transition effect
            const rippleContainer = document.createElement('div');
            rippleContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 100;
              pointer-events: none;
            `;
            slide.appendChild(rippleContainer);
            
            // Create main ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0);
              width: 100px;
              height: 100px;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(100, 224, 255, 0.4) 30%, rgba(3, 28, 64, 0) 70%);
              border-radius: 50%;
              z-index: 10;
              opacity: 0.8;
            `;
            rippleContainer.appendChild(ripple);
            
            // Animate content out
            gsap.to(content, {
              scale: 0.9,
              opacity: 0,
              duration: 0.5,
              ease: "power2.in"
            });
            
            // Stop bubbles animation
            gsap.killTweensOf(bubbles.childNodes);
            
            // Animate ripple effect
            gsap.to(ripple, {
              scale: 15,
              opacity: 0,
              duration: 1.5,
              ease: "power3.out",
              onComplete: () => {
                // Final fade of entire slide
                gsap.to(slide, {
                  opacity: 0,
                  duration: 0.3
                });
              }
            });
          }
        },
      
        // Final slide: Restore styled plot container but without analysis text
        {
          init({ container }) {
            const slide = document.createElement('div');
            slide.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #0a4975 0%, #031c40 100%);
              color: white;
              opacity: 0;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            `;
            
            // Create bubbles effect for background
            const bubbles = document.createElement('div');
            bubbles.style.cssText = `
              position: absolute;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 0;
            `;
            
            // Generate 40 random bubbles
            for (let i = 0; i < 40; i++) {
              const size = Math.random() * 20 + 5;
              const bubble = document.createElement('div');
              bubble.style.cssText = `
                position: absolute;
                bottom: -${size * 2}px;
                left: ${Math.random() * 100}%;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
                opacity: 0;
                transform: translateY(0);
              `;
              bubbles.appendChild(bubble);
              
              // Animate bubbles rising
              const duration = (Math.random() * 10) + 15;
              const delay = Math.random() * 20;
              
              gsap.to(bubble, {
                y: `-=${window.innerHeight + size * 2}`,
                x: `+=${(Math.random() * 100) - 50}`,
                opacity: 0.7,
                duration: duration,
                delay: delay,
                repeat: -1,
                ease: "power1.inOut",
                onStart: () => {
                  gsap.set(bubble, { opacity: 0.7 });
                }
              });
            }
            
            slide.appendChild(bubbles);
            
            // Content container
            const content = document.createElement('div');
            content.style.cssText = `
              position: relative;
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              z-index: 1;
            `;
            
            // Header
            const header = document.createElement('div');
            header.style.cssText = `
              width: 100%;
              text-align: center;
              padding: 30px 0;
            `;
            
            const title = document.createElement('h1');
            title.textContent = 'Relationship Analysis';
            title.style.cssText = `
              font-size: 42px;
              margin-bottom: 15px;
              opacity: 0;
              transform: translateY(-20px);
              text-shadow: 0 0 15px rgba(100, 224, 255, 0.5);
              color: white;
            `;
            
            const subtitle = document.createElement('p');
            subtitle.innerHTML = 'Correlation between <span style="color: #64e0ff;">Water Temperature</span> and <span style="color: #ff9e64;">Salinity</span>';
            subtitle.style.cssText = `
              font-size: 26px;
              opacity: 0;
              margin-bottom: 30px;
            `;
            
            header.appendChild(title);
            header.appendChild(subtitle);
            content.appendChild(header);
            
            // Plot container - RESTORED styling with background and border
            const plotContainer = document.createElement('div');
            plotContainer.style.cssText = `
              width: 80%;
              max-width: 900px;
              height: 600px;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
              border: 1px solid rgba(100, 224, 255, 0.2);
              opacity: 0;
              transform: translateY(30px);
              position: relative;
              overflow: hidden;
            `;
            
            // Placeholder for the scatter plot image
            const plotImage = document.createElement('img');
            plotImage.style.cssText = `
              max-width: 100%;
              max-height: 100%;
              border-radius: 10px;
              opacity: 0;
              transform: scale(0.95);
              transition: transform 0.3s ease;
            `;
            plotImage.alt = "Scatter plot of Water Temperature vs Salinity";
            plotImage.src = "media/tempVsal.png";
            
            // Add loading state until image is provided
            const loadingText = document.createElement('div');
            loadingText.textContent = "Scatter Plot: Water Temperature vs Salinity"; 
            loadingText.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: rgba(255, 255, 255, 0.7);
              font-size: 20px;
              text-align: center;
            `;
            
            plotContainer.appendChild(loadingText);
            plotContainer.appendChild(plotImage);
            content.appendChild(plotContainer);
            slide.appendChild(content);
            container.appendChild(slide);
            
            // Apply image event listeners
            plotImage.onload = function() {
              loadingText.style.display = 'none';
              gsap.to(plotImage, {
                opacity: 1,
                scale: 1
              });
            };
            
            plotImage.onerror = function() {
              loadingText.textContent = "Image failed to load. Please check the URL.";
              loadingText.style.color = "#ff6b6b";
            };
            
            return { 
              slide, 
              title,
              subtitle, 
              plotContainer,
              plotImage,
              content,
              bubbles
            };
          },
          
          transitionIn({ 
            slide, 
            title,
            subtitle,
            plotContainer,
            plotImage
          }) {
            // Fade in slide
            gsap.to(slide, {
              opacity: 1,
              duration: 1
            });
            
            // Animate title
            gsap.to(title, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.3
            });
            
            // Animate subtitle
            gsap.to(subtitle, {
              opacity: 1,
              duration: 1,
              delay: 0.6
            });
            
            // Animate plot container
            gsap.to(plotContainer, {
              opacity: 1,
              y: 0,
              duration: 1.2,
              delay: 1
            });
            
            // If image is already loaded, make sure it's visible
            if (plotImage.complete) {
              gsap.set(plotImage, { opacity: 1, scale: 1 });
            }
          },
          
          transitionOut({ 
            slide, 
            content,
            bubbles
          }) {
            // Create a water ripple transition effect
            const rippleContainer = document.createElement('div');
            rippleContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 100;
              pointer-events: none;
            `;
            slide.appendChild(rippleContainer);
            
            // Create main ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0);
              width: 100px;
              height: 100px;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(100, 224, 255, 0.4) 30%, rgba(3, 28, 64, 0) 70%);
              border-radius: 50%;
              z-index: 10;
              opacity: 0.8;
            `;
            rippleContainer.appendChild(ripple);
            
            // Animate content out
            gsap.to(content, {
              scale: 0.9,
              opacity: 0,
              duration: 0.5,
              ease: "power2.in"
            });
            
            // Stop bubbles animation
            gsap.killTweensOf(bubbles.childNodes);
            
            // Animate ripple effect
            gsap.to(ripple, {
              scale: 15,
              opacity: 0,
              duration: 1.5,
              ease: "power3.out",
              onComplete: () => {
                // Final fade of entire slide
                gsap.to(slide, {
                  opacity: 0,
                  duration: 0.3
                });
              }
            });
          }
        },
    {
          init({ container }) {
            const slide = document.createElement('div');
            slide.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #0a4975 0%, #031c40 100%);
              color: white;
              opacity: 0;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            `;
            
            // Create bubbles effect for background
            const bubbles = document.createElement('div');
            bubbles.style.cssText = `
              position: absolute;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 0;
            `;
            
            // Generate 40 random bubbles
            for (let i = 0; i < 40; i++) {
              const size = Math.random() * 20 + 5;
              const bubble = document.createElement('div');
              bubble.style.cssText = `
                position: absolute;
                bottom: -${size * 2}px;
                left: ${Math.random() * 100}%;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
                opacity: 0;
                transform: translateY(0);
              `;
              bubbles.appendChild(bubble);
              
              // Animate bubbles rising
              const duration = (Math.random() * 10) + 15;
              const delay = Math.random() * 20;
              
              gsap.to(bubble, {
                y: `-=${window.innerHeight + size * 2}`,
                x: `+=${(Math.random() * 100) - 50}`,
                opacity: 0.7,
                duration: duration,
                delay: delay,
                repeat: -1,
                ease: "power1.inOut",
                onStart: () => {
                  gsap.set(bubble, { opacity: 0.7 });
                }
              });
            }
            
            slide.appendChild(bubbles);
            
            // Content container
            const content = document.createElement('div');
            content.style.cssText = `
              position: relative;
              width: 100%;
              height: 100%;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              z-index: 1;
            `;
            
            // Header
            const header = document.createElement('div');
            header.style.cssText = `
              width: 100%;
              text-align: center;
              padding: 30px 0;
            `;
            
            const title = document.createElement('h1');
            title.textContent = 'Correlation Analysis';
            title.style.cssText = `
              font-size: 42px;
              margin-bottom: 15px;
              opacity: 0;
              transform: translateY(-20px);
              text-shadow: 0 0 15px rgba(100, 224, 255, 0.5);
              color: white;
            `;
            
            const subtitle = document.createElement('p');
            subtitle.textContent = 'Pearson Correlation Coefficient';
            subtitle.style.cssText = `
              font-size: 26px;
              opacity: 0;
              margin-bottom: 30px;
              color: #64e0ff;
            `;
            
            header.appendChild(title);
            header.appendChild(subtitle);
            content.appendChild(header);
            
            // Main container for correlation visualization - MODIFIED to center matrix
            const correlationContainer = document.createElement('div');
            correlationContainer.style.cssText = `
              width: 80%;
              max-width: 900px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              opacity: 0;
              transform: translateY(30px);
            `;
            
            // Matrix visual container
            const matrixVisual = document.createElement('div');
            matrixVisual.style.cssText = `
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 40px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
              border: 1px solid rgba(100, 224, 255, 0.2);
              width: 100%;
              max-width: 700px;
              position: relative;
              overflow: hidden;
            `;
            
            // Create the correlation matrix visualization
            const matrixTable = document.createElement('table');
            matrixTable.style.cssText = `
              border-collapse: separate;
              border-spacing: 4px;
              margin: 0 auto;
              width: 100%;
              max-width: 600px;
            `;
            
            // Table header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            const emptyHeader = document.createElement('th');
            emptyHeader.style.cssText = `
              padding: 15px;
              font-size: 18px;
              color: white;
            `;
            
            const temperatureHeader = document.createElement('th');
            temperatureHeader.textContent = 'Water Temperature (°C)';
            temperatureHeader.style.cssText = `
              padding: 15px;
              font-size: 18px;
              color: #64e0ff;
              text-align: center;
            `;
            
            const salinityHeader = document.createElement('th');
            salinityHeader.textContent = 'Salinity (PSU)';
            salinityHeader.style.cssText = `
              padding: 15px;
              font-size: 18px;
              color: #ff9e64;
              text-align: center;
            `;
            
            headerRow.appendChild(emptyHeader);
            headerRow.appendChild(temperatureHeader);
            headerRow.appendChild(salinityHeader);
            thead.appendChild(headerRow);
            matrixTable.appendChild(thead);
            
            // Table body
            const tbody = document.createElement('tbody');
            
            // Temperature row
            const tempRow = document.createElement('tr');
            
            const tempLabel = document.createElement('td');
            tempLabel.textContent = 'Water Temperature (°C)';
            tempLabel.style.cssText = `
              padding: 15px;
              font-size: 18px;
              color: #64e0ff;
              text-align: right;
              font-weight: bold;
            `;
            
            const tempTempCell = document.createElement('td');
            tempTempCell.textContent = '1.00';
            tempTempCell.style.cssText = `
              padding: 15px;
              font-size: 24px;
              background: rgba(100, 224, 255, 0.3);
              text-align: center;
              border-radius: 10px;
              color: white;
              font-weight: bold;
              opacity: 0;
            `;
            
            const tempSalinityCell = document.createElement('td');
            tempSalinityCell.textContent = '-0.31';
            tempSalinityCell.style.cssText = `
              padding: 15px;
              font-size: 24px;
              background: rgba(255, 158, 100, 0.15);
              text-align: center;
              border-radius: 10px;
              color: white;
              font-weight: bold;
              opacity: 0;
            `;
            
            tempRow.appendChild(tempLabel);
            tempRow.appendChild(tempTempCell);
            tempRow.appendChild(tempSalinityCell);
            tbody.appendChild(tempRow);
            
            // Salinity row
            const salinityRow = document.createElement('tr');
            
            const salinityLabel = document.createElement('td');
            salinityLabel.textContent = 'Salinity (PSU)';
            salinityLabel.style.cssText = `
              padding: 15px;
              font-size: 18px;
              color: #ff9e64;
              text-align: right;
              font-weight: bold;
            `;
            
            const salinityTempCell = document.createElement('td');
            salinityTempCell.textContent = '-0.31';
            salinityTempCell.style.cssText = `
              padding: 15px;
              font-size: 24px;
              background: rgba(100, 224, 255, 0.15);
              text-align: center;
              border-radius: 10px;
              color: white;
              font-weight: bold;
              opacity: 0;
            `;
            
            const salinitySalinityCell = document.createElement('td');
            salinitySalinityCell.textContent = '1.00';
            salinitySalinityCell.style.cssText = `
              padding: 15px;
              font-size: 24px;
              background: rgba(255, 158, 100, 0.3);
              text-align: center;
              border-radius: 10px;
              color: white;
              font-weight: bold;
              opacity: 0;
            `;
            
            salinityRow.appendChild(salinityLabel);
            salinityRow.appendChild(salinityTempCell);
            salinityRow.appendChild(salinitySalinityCell);
            tbody.appendChild(salinityRow);
            
            matrixTable.appendChild(tbody);
            matrixVisual.appendChild(matrixTable);
            
            // REMOVED: Interpretation section has been removed
            
            correlationContainer.appendChild(matrixVisual);
            content.appendChild(correlationContainer);
            
            slide.appendChild(content);
            container.appendChild(slide);
            
            // Store matrix cells for animation
            const matrixCells = [tempTempCell, tempSalinityCell, salinityTempCell, salinitySalinityCell];
            
            return { 
              slide, 
              title,
              subtitle,
              correlationContainer,
              matrixCells,
              content,
              bubbles
            };
          },
          
          transitionIn({ 
            slide, 
            title,
            subtitle,
            correlationContainer,
            matrixCells
          }) {
            // Fade in slide
            gsap.to(slide, {
              opacity: 1,
              duration: 1
            });
            
            // Animate title
            gsap.to(title, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.3,
              ease: "back.out"
            });
            
            // Animate subtitle
            gsap.to(subtitle, {
              opacity: 1,
              duration: 0.8,
              delay: 0.6
            });
            
            // Animate correlation container
            gsap.to(correlationContainer, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.8
            });
            
            // Animate matrix cells with staggered effect
            gsap.to(matrixCells, {
              opacity: 1,
              scale: [0.7, 1.1, 1],
              duration: 0.6,
              stagger: 0.15,
              delay: 1.2
            });
            
            // Highlight the correlation value of interest with a special animation
            const correlationCells = [matrixCells[1], matrixCells[2]]; // The -0.31 values
            
            gsap.timeline({delay: 2.5})
              .to(correlationCells, {
                backgroundColor: 'rgba(255, 158, 100, 0.4)',
                boxShadow: '0 0 15px rgba(255, 158, 100, 0.5)',
                duration: 0.5
              })
              .to(correlationCells, {
                backgroundColor: 'rgba(255, 158, 100, 0.15)', 
                boxShadow: 'none',
                duration: 0.5,
                delay: 0.5
              })
              .to(correlationCells, {
                backgroundColor: 'rgba(255, 158, 100, 0.4)',
                boxShadow: '0 0 15px rgba(255, 158, 100, 0.5)',
                duration: 0.5
              })
              .to(correlationCells, {
                backgroundColor: 'rgba(255, 158, 100, 0.15)', 
                boxShadow: 'none',
                duration: 0.5
              });
            
            // REMOVED: Interpretation animation code has been removed
          },
          
          transitionOut({ 
            slide, 
            content,
            bubbles
          }) {
            // Create a water ripple transition effect
            const rippleContainer = document.createElement('div');
            rippleContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 100;
              pointer-events: none;
            `;
            slide.appendChild(rippleContainer);
            
            // Create main ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0);
              width: 100px;
              height: 100px;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(100, 224, 255, 0.4) 30%, rgba(3, 28, 64, 0) 70%);
              border-radius: 50%;
              z-index: 10;
              opacity: 0.8;
            `;
            rippleContainer.appendChild(ripple);
            
            // Animate content out
            gsap.to(content, {
              scale: 0.9,
              opacity: 0,
              duration: 0.5,
              ease: "power2.in"
            });
            
            // Stop bubbles animation
            gsap.killTweensOf(bubbles.childNodes);
            
            // Animate ripple effect
            gsap.to(ripple, {
              scale: 15,
              opacity: 0,
              duration: 1.5,
              ease: "power3.out",
              onComplete: () => {
                // Final fade of entire slide
                gsap.to(slide, {
                  opacity: 0,
                  duration: 0.3
                });
              }
            });
          }
        },
        {
          init({ container }) {
            const slide = document.createElement('div');
            slide.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #0a4975 0%, #031c40 100%);
              color: white;
              opacity: 0;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            `;
            
            // Create bubbles effect for background
            const bubbles = document.createElement('div');
            bubbles.style.cssText = `
              position: absolute;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 0;
            `;
            
            // Generate 40 random bubbles
            for (let i = 0; i < 40; i++) {
              const size = Math.random() * 20 + 5;
              const bubble = document.createElement('div');
              bubble.style.cssText = `
                position: absolute;
                bottom: -${size * 2}px;
                left: ${Math.random() * 100}%;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
                opacity: 0;
                transform: translateY(0);
              `;
              bubbles.appendChild(bubble);
              
              // Animate bubbles rising
              const duration = (Math.random() * 10) + 15;
              const delay = Math.random() * 20;
              
              gsap.to(bubble, {
                y: `-=${window.innerHeight + size * 2}`,
                x: `+=${(Math.random() * 100) - 50}`,
                opacity: 0.7,
                duration: duration,
                delay: delay,
                repeat: -1,
                ease: "power1.inOut",
                onStart: () => {
                  gsap.set(bubble, { opacity: 0.7 });
                }
              });
            }
            
            slide.appendChild(bubbles);
            
            // Add underwater light rays effect
            const rays = document.createElement('div');
            rays.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: radial-gradient(ellipse at center, rgba(100, 224, 255, 0.15) 0%, rgba(3, 28, 64, 0) 70%);
              opacity: 0;
              pointer-events: none;
            `;
            slide.appendChild(rays);
            
            // Content container - simple centered title
            const content = document.createElement('div');
            content.style.cssText = `
              position: relative;
              z-index: 1;
              text-align: center;
              opacity: 0;
              transform: translateY(20px);
            `;
            
            // Just the title - large and prominent
            const title = document.createElement('h1');
            title.textContent = 'Model Fitting & Results';
            title.style.cssText = `
              font-size: 64px;
              font-weight: bold;
              color: white;
              text-shadow: 0 0 20px rgba(100, 224, 255, 0.6);
              margin: 0;
              padding: 0;
            `;
            
            content.appendChild(title);
            slide.appendChild(content);
            container.appendChild(slide);
            
            return { slide, content, bubbles, rays };
          },
          
          transitionIn({ slide, content, rays }) {
            // Fade in slide
            gsap.to(slide, {
              opacity: 1,
              duration: 1
            });
            
            // Animate light rays
            gsap.to(rays, {
              opacity: 0.8,
              duration: 2,
              ease: "power1.inOut"
            });
            
            // Animate title with slight bounce effect
            gsap.to(content, {
              opacity: 1,
              y: 0,
              duration: 1.2,
              delay: 0.5,
              ease: "back.out(1.2)"
            });
            
            // Add subtle pulse animation to the title
            const title = content.querySelector('h1');
            gsap.to(title, {
              textShadow: "0 0 30px rgba(100, 224, 255, 0.9)",
              repeat: -1,
              yoyo: true,
              duration: 2,
              delay: 1.5
            });
          },
          
          transitionOut({ slide, content, bubbles }) {
            // Stop any ongoing animations
            gsap.killTweensOf(content.querySelector('h1'));
            
            // Create a water ripple transition effect
            const rippleContainer = document.createElement('div');
            rippleContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 100;
              pointer-events: none;
            `;
            slide.appendChild(rippleContainer);
            
            // Create main ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0);
              width: 100px;
              height: 100px;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(100, 224, 255, 0.4) 30%, rgba(3, 28, 64, 0) 70%);
              border-radius: 50%;
              z-index: 10;
              opacity: 0.8;
            `;
            rippleContainer.appendChild(ripple);
            
            // Animate content out
            gsap.to(content, {
              scale: 0.9,
              opacity: 0,
              duration: 0.5,
              ease: "power2.in"
            });
            
            // Stop bubbles animation
            gsap.killTweensOf(bubbles.childNodes);
            
            // Animate ripple effect
            gsap.to(ripple, {
              scale: 15,
              opacity: 0,
              duration: 1.5,
              ease: "power3.out",
              onComplete: () => {
                // Final fade of entire slide
                gsap.to(slide, {
                  opacity: 0,
                  duration: 0.3
                });
              }
            });
          }
        },
        {
          init({ container }) {
            const slide = document.createElement('div');
            slide.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #0a4975 0%, #031c40 100%);
              color: white;
              opacity: 0;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            `;
            
            // Create bubbles effect for background
            const bubbles = document.createElement('div');
            bubbles.style.cssText = `
              position: absolute;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 0;
            `;
            
            // Generate 40 random bubbles
            for (let i = 0; i < 40; i++) {
              const size = Math.random() * 20 + 5;
              const bubble = document.createElement('div');
              bubble.style.cssText = `
                position: absolute;
                bottom: -${size * 2}px;
                left: ${Math.random() * 100}%;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
                opacity: 0;
                transform: translateY(0);
              `;
              bubbles.appendChild(bubble);
              
              // Animate bubbles rising
              const duration = (Math.random() * 10) + 15;
              const delay = Math.random() * 20;
              
              gsap.to(bubble, {
                y: `-=${window.innerHeight + size * 2}`,
                x: `+=${(Math.random() * 100) - 50}`,
                opacity: 0.7,
                duration: duration,
                delay: delay,
                repeat: -1,
                ease: "power1.inOut",
                onStart: () => {
                  gsap.set(bubble, { opacity: 0.7 });
                }
              });
            }
            
            slide.appendChild(bubbles);
            
            // Add underwater light rays effect
            const rays = document.createElement('div');
            rays.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: radial-gradient(ellipse at center, rgba(100, 224, 255, 0.15) 0%, rgba(3, 28, 64, 0) 70%);
              opacity: 0;
              pointer-events: none;
            `;
            slide.appendChild(rays);
            
            // Content container with flex layout
            const content = document.createElement('div');
            content.style.cssText = `
              position: relative;
              width: 90%;
              max-width: 1200px;
              z-index: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              opacity: 0;
            `;
            
            // Header
            const header = document.createElement('div');
            header.style.cssText = `
              width: 100%;
              text-align: center;
              margin-bottom: 30px;
            `;
            
            const title = document.createElement('h1');
            title.textContent = 'Model Fitting & Results';
            title.style.cssText = `
              font-size: 42px;
              margin-bottom: 15px;
              opacity: 0;
              transform: translateY(-20px);
              text-shadow: 0 0 15px rgba(100, 224, 255, 0.6);
              color: white;
            `;
            
            const subtitle = document.createElement('p');
            subtitle.textContent = 'Linear Regression';
            subtitle.style.cssText = `
              font-size: 28px;
              opacity: 0;
              margin-bottom: 30px;
              color: #64e0ff;
            `;
            
            header.appendChild(title);
            header.appendChild(subtitle);
            content.appendChild(header);
            
            // Main content with two columns: plot and results
            const mainContent = document.createElement('div');
            mainContent.style.cssText = `
              width: 100%;
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
              gap: 30px;
            `;
            
            // Plot container
            const plotContainer = document.createElement('div');
            plotContainer.style.cssText = `
              flex: 1;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
              border: 1px solid rgba(100, 224, 255, 0.2);
              opacity: 0;
              transform: translateY(20px);
              position: relative;
              max-width: 650px;
              height: 450px;
            `;
            
            // Placeholder for the linear regression plot image
            const plotImage = document.createElement('img');
            plotImage.style.cssText = `
              max-width: 100%;
              max-height: 100%;
              border-radius: 10px;
              opacity: 0;
              transform: scale(0.95);
              transition: transform 0.3s ease;
            `;
            plotImage.alt = "Linear Regression: Water Temperature vs Salinity";
            plotImage.src = "media/tempVsal_Regression.png";
            
            // Add loading state until image is provided
            const loadingText = document.createElement('div');
            loadingText.textContent = "Linear Regression Plot"; 
            loadingText.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: rgba(255, 255, 255, 0.7);
              font-size: 20px;
              text-align: center;
            `;
            
            plotContainer.appendChild(loadingText);
            plotContainer.appendChild(plotImage);
            
            // Results container
            const resultsContainer = document.createElement('div');
            resultsContainer.style.cssText = `
              flex: 1;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 30px;
              box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
              border: 1px solid rgba(100, 224, 255, 0.2);
              opacity: 0;
              transform: translateY(20px);
              max-width: 450px;
            `;
            
            // Results header
            const resultsHeader = document.createElement('h2');
            resultsHeader.textContent = 'Model Statistics';
            resultsHeader.style.cssText = `
              color: white;
              font-size: 28px;
              margin-bottom: 25px;
              text-align: center;
              text-shadow: 0 0 10px rgba(100, 224, 255, 0.3);
            `;
            resultsContainer.appendChild(resultsHeader);
            
            // Regression equation - Updated with non-rounded values and better styling
            const equationContainer = document.createElement('div');
            equationContainer.style.cssText = `
              background: rgba(0, 0, 0, 0.2);
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 30px;
              border-left: 4px solid #64e0ff;
            `;
            
            const equationLabel = document.createElement('div');
            equationLabel.textContent = 'Regression Equation';
            equationLabel.style.cssText = `
              color: #64e0ff;
              font-size: 18px;
              margin-bottom: 15px;
              font-weight: bold;
            `;
            
            // Updated equation with precise values
            const equation = document.createElement('div');
            equation.innerHTML = 'Water Temperature = <span style="color: #64e0ff;">188.68117474575996</span> - <span style="color: #ff9e64;">5.2576955</span> × Salinity';
            equation.style.cssText = `
              color: white;
              font-size: 24px;
              text-align: center;
              font-weight: bold;
              line-height: 1.5;
            `;
            
            equationContainer.appendChild(equationLabel);
            equationContainer.appendChild(equation);
            resultsContainer.appendChild(equationContainer);
            
            // Performance stats container - SIMPLIFIED with only key statistics
            const statsContainer = document.createElement('div');
            statsContainer.style.cssText = `
              display: flex;
              flex-direction: column;
              gap: 20px;
              margin-top: 20px;
            `;
            
            // Function to create a stat item
            const createStat = (label, value, color) => {
              const statItem = document.createElement('div');
              statItem.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: 15px;
              `;
              
              const statLabel = document.createElement('div');
              statLabel.textContent = label;
              statLabel.style.cssText = `
                font-size: 22px;
                color: white;
              `;
              
              const statValue = document.createElement('div');
              statValue.textContent = value;
              statValue.style.cssText = `
                font-size: 24px;
                font-weight: bold;
                color: ${color};
                text-shadow: 0 0 10px rgba(${color === '#64e0ff' ? '100, 224, 255' : '255, 158, 100'}, 0.3);
              `;
              
              statItem.appendChild(statLabel);
              statItem.appendChild(statValue);
              return statItem;
            };
            
            // Add only R-squared and MSE statistics - REMOVED Root MSE and Standard Error
            statsContainer.appendChild(createStat('R-squared', '0.3303452191320939', '#64e0ff'));
            statsContainer.appendChild(createStat('Mean Squared Error', '11.309419488493134', '#ff9e64'));
            
            resultsContainer.appendChild(statsContainer);
            
            // REMOVED: Interpretation section has been removed
            
            mainContent.appendChild(plotContainer);
            mainContent.appendChild(resultsContainer);
            content.appendChild(mainContent);
            
            slide.appendChild(content);
            container.appendChild(slide);
            
            // Apply image event listeners
            plotImage.onload = function() {
              loadingText.style.display = 'none';
              gsap.to(plotImage, {
                opacity: 1,
                scale: 1,
                duration: 0.8
              });
            };
            
            plotImage.onerror = function() {
              loadingText.textContent = "Please update regression plot URL";
              loadingText.style.color = "#ff6b6b";
            };
            
            return { 
              slide, 
              title,
              subtitle,
              content,
              plotContainer,
              plotImage,
              resultsContainer,
              equationSpan: equation.querySelectorAll('span'),
              bubbles,
              rays
            };
          },
          
          transitionIn({ 
            slide, 
            title,
            subtitle,
            content,
            plotContainer,
            resultsContainer,
            equationSpan,
            rays
          }) {
            // Fade in slide
            gsap.to(slide, {
              opacity: 1,
              duration: 1
            });
            
            // Animate light rays
            gsap.to(rays, {
              opacity: 0.8,
              duration: 1.5,
              ease: "power1.inOut"
            });
            
            // Animate content container
            gsap.to(content, {
              opacity: 1,
              duration: 1
            });
            
            // Animate title
            gsap.to(title, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.3,
              ease: "back.out"
            });
            
            // Animate subtitle
            gsap.to(subtitle, {
              opacity: 1,
              duration: 1,
              delay: 0.5
            });
            
            // Animate plot container
            gsap.to(plotContainer, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.7,
              ease: "back.out(1.2)"
            });
            
            // Animate results container with slight delay after plot
            gsap.to(resultsContainer, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 1,
              ease: "back.out(1.2)"
            });
            
            // Animate stats with staggered effect
            const statItems = resultsContainer.querySelectorAll('div[style*="display: flex; justify-content: space-between"]');
            gsap.fromTo(
              statItems,
              { opacity: 0, x: -20 },
              { 
                opacity: 1, 
                x: 0, 
                duration: 0.6, 
                stagger: 0.15, 
                delay: 1.2, 
                ease: "power2.out" 
              }
            );
            
            // MODIFIED: Highlight equation numbers permanently (no yoyo effect)
            gsap.fromTo(
              equationSpan,
              { opacity: 0.3, textShadow: "0 0 0px rgba(255, 255, 255, 0)" },
              { 
                opacity: 1,
                textShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
                duration: 1, 
                stagger: 0.5, 
                delay: 1.5,
                ease: "power2.out"
                // removed repeat and yoyo to keep highlight permanent
              }
            );
          },
          
          transitionOut({ 
            slide, 
            content,
            bubbles
          }) {
            // Create a water ripple transition effect
            const rippleContainer = document.createElement('div');
            rippleContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 100;
              pointer-events: none;
            `;
            slide.appendChild(rippleContainer);
            
            // Create main ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0);
              width: 100px;
              height: 100px;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(100, 224, 255, 0.4) 30%, rgba(3, 28, 64, 0) 70%);
              border-radius: 50%;
              z-index: 10;
              opacity: 0.8;
            `;
            rippleContainer.appendChild(ripple);
            
            // Animate content out
            gsap.to(content, {
              scale: 0.9,
              opacity: 0,
              duration: 0.5,
              ease: "power2.in"
            });
            
            // Stop bubbles animation
            gsap.killTweensOf(bubbles.childNodes);
            
            // Animate ripple effect
            gsap.to(ripple, {
              scale: 15,
              opacity: 0,
              duration: 1.5,
              ease: "power3.out",
              onComplete: () => {
                // Final fade of entire slide
                gsap.to(slide, {
                  opacity: 0,
                  duration: 0.3
                });
              }
            });
          }
        },
        {
          init({ container }) {
            const slide = document.createElement('div');
            slide.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #0a4975 0%, #031c40 100%);
              color: white;
              opacity: 0;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            `;
            
            // Create bubbles effect for background
            const bubbles = document.createElement('div');
            bubbles.style.cssText = `
              position: absolute;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 0;
            `;
            
            // Generate 40 random bubbles
            for (let i = 0; i < 40; i++) {
              const size = Math.random() * 20 + 5;
              const bubble = document.createElement('div');
              bubble.style.cssText = `
                position: absolute;
                bottom: -${size * 2}px;
                left: ${Math.random() * 100}%;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
                opacity: 0;
                transform: translateY(0);
              `;
              bubbles.appendChild(bubble);
              
              // Animate bubbles rising
              const duration = (Math.random() * 10) + 15;
              const delay = Math.random() * 20;
              
              gsap.to(bubble, {
                y: `-=${window.innerHeight + size * 2}`,
                x: `+=${(Math.random() * 100) - 50}`,
                opacity: 0.7,
                duration: duration,
                delay: delay,
                repeat: -1,
                ease: "power1.inOut",
                onStart: () => {
                  gsap.set(bubble, { opacity: 0.7 });
                }
              });
            }
            
            slide.appendChild(bubbles);
            
            // Add underwater light rays effect
            const rays = document.createElement('div');
            rays.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: radial-gradient(ellipse at center, rgba(100, 224, 255, 0.15) 0%, rgba(3, 28, 64, 0) 70%);
              opacity: 0;
              pointer-events: none;
            `;
            slide.appendChild(rays);
            
            // Content container with flex layout
            const content = document.createElement('div');
            content.style.cssText = `
              position: relative;
              width: 90%;
              max-width: 1200px;
              z-index: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              opacity: 0;
            `;
            
            // Header
            const header = document.createElement('div');
            header.style.cssText = `
              width: 100%;
              text-align: center;
              margin-bottom: 30px;
            `;
            
            const title = document.createElement('h1');
            title.textContent = 'Model Fitting & Results';
            title.style.cssText = `
              font-size: 42px;
              margin-bottom: 15px;
              opacity: 0;
              transform: translateY(-20px);
              text-shadow: 0 0 15px rgba(100, 224, 255, 0.6);
              color: white;
            `;
            
            const subtitle = document.createElement('p');
            subtitle.textContent = 'Polynomial Regression';
            subtitle.style.cssText = `
              font-size: 28px;
              opacity: 0;
              margin-bottom: 30px;
              color: #64e0ff;
            `;
            
            header.appendChild(title);
            header.appendChild(subtitle);
            content.appendChild(header);
            
            // Main content with two columns: plot and results
            const mainContent = document.createElement('div');
            mainContent.style.cssText = `
              width: 100%;
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
              gap: 30px;
            `;
            
            // Plot container
            const plotContainer = document.createElement('div');
            plotContainer.style.cssText = `
              flex: 1;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
              border: 1px solid rgba(100, 224, 255, 0.2);
              opacity: 0;
              transform: translateY(20px);
              position: relative;
              max-width: 650px;
              height: 450px;
            `;
            
            // Placeholder for the polynomial regression plot image
            const plotImage = document.createElement('img');
            plotImage.style.cssText = `
              max-width: 100%;
              max-height: 100%;
              border-radius: 10px;
              opacity: 0;
              transform: scale(0.95);
              transition: transform 0.3s ease;
            `;
            plotImage.alt = "Polynomial Regression: Water Temperature vs Salinity";
            plotImage.src = "media/tempVsal_PolyRegression.png";
            
            // Add loading state until image is provided
            const loadingText = document.createElement('div');
            loadingText.textContent = "Polynomial Regression Plot"; 
            loadingText.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: rgba(255, 255, 255, 0.7);
              font-size: 20px;
              text-align: center;
            `;
            
            plotContainer.appendChild(loadingText);
            plotContainer.appendChild(plotImage);
            
            // Results container
            const resultsContainer = document.createElement('div');
            resultsContainer.style.cssText = `
              flex: 1;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 30px;
              box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
              border: 1px solid rgba(100, 224, 255, 0.2);
              opacity: 0;
              transform: translateY(20px);
              max-width: 450px;
            `;
            
            // Results header
            const resultsHeader = document.createElement('h2');
            resultsHeader.textContent = 'Model Statistics';
            resultsHeader.style.cssText = `
              color: white;
              font-size: 28px;
              margin-bottom: 25px;
              text-align: center;
              text-shadow: 0 0 10px rgba(100, 224, 255, 0.3);
            `;
            resultsContainer.appendChild(resultsHeader);
            
            // Polynomial regression equation
            const equationContainer = document.createElement('div');
            equationContainer.style.cssText = `
              background: rgba(0, 0, 0, 0.2);
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 30px;
              border-left: 4px solid #64e0ff;
            `;
            
            const equationLabel = document.createElement('div');
            equationLabel.textContent = 'Regression Equation';
            equationLabel.style.cssText = `
              color: #64e0ff;
              font-size: 18px;
              margin-bottom: 15px;
              font-weight: bold;
            `;
            
            // Polynomial equation with terms
            const equation = document.createElement('div');
            equation.innerHTML = 'Temp = - <span style="color: #64e0ff;">300716.0124395484</span> + <span style="color: #ff9e64;">2.67110045e+04</span> × Sal - <span style="color: #ff9e64;">-7.90565645e+02</span> × Sal<sup>2</sup> + <span style="color: #ff9e64;">7.79678857e+00</span> × Sal<sup>3</sup>';
            equation.style.cssText = `
              color: white;
              font-size: 24px;
              text-align: center;
              font-weight: bold;
              line-height: 1.5;
            `;
            
            equationContainer.appendChild(equationLabel);
            equationContainer.appendChild(equation);
            resultsContainer.appendChild(equationContainer);
            
            // Performance stats container
            const statsContainer = document.createElement('div');
            statsContainer.style.cssText = `
              display: flex;
              flex-direction: column;
              gap: 20px;
              margin-top: 20px;
            `;
            
            // Function to create a stat item
            const createStat = (label, value, color) => {
              const statItem = document.createElement('div');
              statItem.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: 15px;
              `;
              
              const statLabel = document.createElement('div');
              statLabel.textContent = label;
              statLabel.style.cssText = `
                font-size: 22px;
                color: white;
              `;
              
              const statValue = document.createElement('div');
              statValue.textContent = value;
              statValue.style.cssText = `
                font-size: 24px;
                font-weight: bold;
                color: ${color};
                text-shadow: 0 0 10px rgba(${color === '#64e0ff' ? '100, 224, 255' : '255, 158, 100'}, 0.3);
              `;
              
              statItem.appendChild(statLabel);
              statItem.appendChild(statValue);
              return statItem;
            };
            
            // Add only R-squared and MSE statistics
            statsContainer.appendChild(createStat('R-squared', '0.45068763171409365', '#64e0ff'));
            statsContainer.appendChild(createStat('Mean Squared Error', '9.277024790461974', '#ff9e64'));
            
            resultsContainer.appendChild(statsContainer);
            
            mainContent.appendChild(plotContainer);
            mainContent.appendChild(resultsContainer);
            content.appendChild(mainContent);
            
            slide.appendChild(content);
            container.appendChild(slide);
            
            // Apply image event listeners
            plotImage.onload = function() {
              loadingText.style.display = 'none';
              gsap.to(plotImage, {
                opacity: 1,
                scale: 1,
                duration: 0.8
              });
            };
            
            plotImage.onerror = function() {
              loadingText.textContent = "Please update regression plot URL";
              loadingText.style.color = "#ff6b6b";
            };
            
            return { 
              slide, 
              title,
              subtitle,
              content,
              plotContainer,
              plotImage,
              resultsContainer,
              equationSpan: equation.querySelectorAll('span'),
              bubbles,
              rays
            };
          },
          
          transitionIn({ 
            slide, 
            title,
            subtitle,
            content,
            plotContainer,
            resultsContainer,
            equationSpan,
            rays
          }) {
            // Fade in slide
            gsap.to(slide, {
              opacity: 1,
              duration: 1
            });
            
            // Animate light rays
            gsap.to(rays, {
              opacity: 0.8,
              duration: 1.5,
              ease: "power1.inOut"
            });
            
            // Animate content container
            gsap.to(content, {
              opacity: 1,
              duration: 1
            });
            
            // Animate title
            gsap.to(title, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.3,
              ease: "back.out"
            });
            
            // Animate subtitle
            gsap.to(subtitle, {
              opacity: 1,
              duration: 1,
              delay: 0.5
            });
            
            // Animate plot container
            gsap.to(plotContainer, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.7,
              ease: "back.out(1.2)"
            });
            
            // Animate results container with slight delay after plot
            gsap.to(resultsContainer, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 1,
              ease: "back.out(1.2)"
            });
            
            // Animate stats with staggered effect
            const statItems = resultsContainer.querySelectorAll('div[style*="display: flex; justify-content: space-between"]');
            gsap.fromTo(
              statItems,
              { opacity: 0, x: -20 },
              { 
                opacity: 1, 
                x: 0, 
                duration: 0.6, 
                stagger: 0.15, 
                delay: 1.2, 
                ease: "power2.out" 
              }
            );
            
            // Highlight equation numbers permanently
            gsap.fromTo(
              equationSpan,
              { opacity: 0.3, textShadow: "0 0 0px rgba(255, 255, 255, 0)" },
              { 
                opacity: 1,
                textShadow: "0 0 10px rgba(255, 255, 255, 0.5)",
                duration: 1, 
                stagger: 0.5, 
                delay: 1.5,
                ease: "power2.out"
              }
            );
          },
          
          transitionOut({ 
            slide, 
            content,
            bubbles
          }) {
            // Create a water ripple transition effect
            const rippleContainer = document.createElement('div');
            rippleContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 100;
              pointer-events: none;
            `;
            slide.appendChild(rippleContainer);
            
            // Create main ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0);
              width: 100px;
              height: 100px;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(100, 224, 255, 0.4) 30%, rgba(3, 28, 64, 0) 70%);
              border-radius: 50%;
              z-index: 10;
              opacity: 0.8;
            `;
            rippleContainer.appendChild(ripple);
            
            // Animate content out
            gsap.to(content, {
              scale: 0.9,
              opacity: 0,
              duration: 0.5,
              ease: "power2.in"
            });
            
            // Stop bubbles animation
            gsap.killTweensOf(bubbles.childNodes);
            
            // Animate ripple effect
            gsap.to(ripple, {
              scale: 15,
              opacity: 0,
              duration: 1.5,
              ease: "power3.out",
              onComplete: () => {
                // Final fade of entire slide
                gsap.to(slide, {
                  opacity: 0,
                  duration: 0.3
                });
              }
            });
          }
        },
        
        // MODIFIED: Random Forest Regression slide (with added plot)
        {
          init({ container }) {
            const slide = document.createElement('div');
            slide.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #0a4975 0%, #031c40 100%);
              color: white;
              opacity: 0;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            `;
            
            // Create bubbles effect for background
            const bubbles = document.createElement('div');
            bubbles.style.cssText = `
              position: absolute;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 0;
            `;
            
            // Generate 40 random bubbles
            for (let i = 0; i < 40; i++) {
              const size = Math.random() * 20 + 5;
              const bubble = document.createElement('div');
              bubble.style.cssText = `
                position: absolute;
                bottom: -${size * 2}px;
                left: ${Math.random() * 100}%;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
                opacity: 0;
                transform: translateY(0);
              `;
              bubbles.appendChild(bubble);
              
              // Animate bubbles rising
              const duration = (Math.random() * 10) + 15;
              const delay = Math.random() * 20;
              
              gsap.to(bubble, {
                y: `-=${window.innerHeight + size * 2}`,
                x: `+=${(Math.random() * 100) - 50}`,
                opacity: 0.7,
                duration: duration,
                delay: delay,
                repeat: -1,
                ease: "power1.inOut",
                onStart: () => {
                  gsap.set(bubble, { opacity: 0.7 });
                }
              });
            }
            
            slide.appendChild(bubbles);
            
            // Add underwater light rays effect
            const rays = document.createElement('div');
            rays.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: radial-gradient(ellipse at center, rgba(100, 224, 255, 0.15) 0%, rgba(3, 28, 64, 0) 70%);
              opacity: 0;
              pointer-events: none;
            `;
            slide.appendChild(rays);
            
            // Content container with flex layout
            const content = document.createElement('div');
            content.style.cssText = `
              position: relative;
              width: 90%;
              max-width: 1200px;
              z-index: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              opacity: 0;
            `;
            
            // Header
            const header = document.createElement('div');
            header.style.cssText = `
              width: 100%;
              text-align: center;
              margin-bottom: 30px;
            `;
            
            const title = document.createElement('h1');
            title.textContent = 'Model Fitting & Results';
            title.style.cssText = `
              font-size: 42px;
              margin-bottom: 15px;
              opacity: 0;
              transform: translateY(-20px);
              text-shadow: 0 0 15px rgba(100, 224, 255, 0.6);
              color: white;
            `;
            
            const subtitle = document.createElement('p');
            subtitle.textContent = 'Random Forest Regression';
            subtitle.style.cssText = `
              font-size: 28px;
              opacity: 0;
              margin-bottom: 30px;
              color: #64e0ff;
            `;
            
            header.appendChild(title);
            header.appendChild(subtitle);
            content.appendChild(header);
            
            // Main content with two columns: plot and results
            const mainContent = document.createElement('div');
            mainContent.style.cssText = `
              width: 100%;
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
              gap: 30px;
            `;
            
            // Plot container
            const plotContainer = document.createElement('div');
            plotContainer.style.cssText = `
              flex: 1;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
              border: 1px solid rgba(100, 224, 255, 0.2);
              opacity: 0;
              transform: translateY(20px);
              position: relative;
              max-width: 650px;
              height: 450px;
            `;
            
            // Placeholder for the random forest regression plot image
            const plotImage = document.createElement('img');
            plotImage.style.cssText = `
              max-width: 100%;
              max-height: 100%;
              border-radius: 10px;
              opacity: 0;
              transform: scale(0.95);
              transition: transform 0.3s ease;
            `;
            plotImage.alt = "Random Forest Regression: Water Temperature vs Salinity";
            plotImage.src = "media/tempVsal_RF.png";
            
            // Add loading state until image is provided
            const loadingText = document.createElement('div');
            loadingText.textContent = "Random Forest Regression Plot"; 
            loadingText.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: rgba(255, 255, 255, 0.7);
              font-size: 20px;
              text-align: center;
            `;
            
            plotContainer.appendChild(loadingText);
            plotContainer.appendChild(plotImage);
            
            // Results container
            const resultsContainer = document.createElement('div');
            resultsContainer.style.cssText = `
              flex: 1;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 30px;
              box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
              border: 1px solid rgba(100, 224, 255, 0.2);
              opacity: 0;
              transform: translateY(20px);
              max-width: 450px;
            `;
            
            // Results header
            const resultsHeader = document.createElement('h2');
            resultsHeader.textContent = 'Model Statistics';
            resultsHeader.style.cssText = `
              color: white;
              font-size: 28px;
              margin-bottom: 25px;
              text-align: center;
              text-shadow: 0 0 10px rgba(100, 224, 255, 0.3);
            `;
            resultsContainer.appendChild(resultsHeader);
            
            // Model parameters container
            const parametersContainer = document.createElement('div');
            parametersContainer.style.cssText = `
              background: rgba(0, 0, 0, 0.2);
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 30px;
              border-left: 4px solid #64e0ff;
            `;
            
            const parametersLabel = document.createElement('div');
            parametersLabel.textContent = 'Model Parameters';
            parametersLabel.style.cssText = `
              color: #64e0ff;
              font-size: 18px;
              margin-bottom: 15px;
              font-weight: bold;
            `;
            
            // Key parameters for random forest
            const parameters = document.createElement('div');
            parameters.style.cssText = `
              display: flex;
              justify-content: space-between;
              align-items: center;
            `;
            
            const paramName = document.createElement('span');
            paramName.textContent = 'Number of Trees';
            paramName.style.cssText = `
              color: white;
              font-size: 22px;
            `;
            
            const paramValue = document.createElement('span');
            paramValue.textContent = '100';
            paramValue.style.cssText = `
              color: #ff9e64;
              font-size: 22px;
              font-weight: bold;
            `;
            
            parameters.appendChild(paramName);
            parameters.appendChild(paramValue);
            
            parametersContainer.appendChild(parametersLabel);
            parametersContainer.appendChild(parameters);
            resultsContainer.appendChild(parametersContainer);
            
            // Performance stats container
            const statsContainer = document.createElement('div');
            statsContainer.style.cssText = `
              display: flex;
              flex-direction: column;
              gap: 20px;
              margin-top: 20px;
            `;
            
            // Function to create a stat item
            const createStat = (label, value, color) => {
              const statItem = document.createElement('div');
              statItem.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: 15px;
              `;
              
              const statLabel = document.createElement('div');
              statLabel.textContent = label;
              statLabel.style.cssText = `
                font-size: 22px;
                color: white;
              `;
              
              const statValue = document.createElement('div');
              statValue.textContent = value;
              statValue.style.cssText = `
                font-size: 24px;
                font-weight: bold;
                color: ${color};
                text-shadow: 0 0 10px rgba(${color === '#64e0ff' ? '100, 224, 255' : '255, 158, 100'}, 0.3);
              `;
              
              statItem.appendChild(statLabel);
              statItem.appendChild(statValue);
              return statItem;
            };
            
            // Add R-squared and MSE statistics
            statsContainer.appendChild(createStat('R-squared', '0.4810371520765472', '#64e0ff'));
            statsContainer.appendChild(createStat('Mean Squared Error', '8.764468967880225', '#ff9e64'));
            
            resultsContainer.appendChild(statsContainer);
            
            mainContent.appendChild(plotContainer);
            mainContent.appendChild(resultsContainer);
            content.appendChild(mainContent);
            
            slide.appendChild(content);
            container.appendChild(slide);
            
            // Apply image event listeners
            plotImage.onload = function() {
              loadingText.style.display = 'none';
              gsap.to(plotImage, {
                opacity: 1,
                scale: 1,
                duration: 0.8
              });
            };
            
            plotImage.onerror = function() {
              loadingText.textContent = "Please update regression plot URL";
              loadingText.style.color = "#ff6b6b";
            };
            
            return { 
              slide, 
              title,
              subtitle,
              content,
              plotContainer,
              plotImage,
              resultsContainer,
              parameters,
              bubbles,
              rays
            };
          },
          
          transitionIn({ 
            slide, 
            title,
            subtitle,
            content,
            plotContainer,
            resultsContainer,
            parameters,
            rays
          }) {
            // Fade in slide
            gsap.to(slide, {
              opacity: 1,
              duration: 1
            });
            
            // Animate light rays
            gsap.to(rays, {
              opacity: 0.8,
              duration: 1.5,
              ease: "power1.inOut"
            });
            
            // Animate content container
            gsap.to(content, {
              opacity: 1,
              duration: 1
            });
            
            // Animate title
            gsap.to(title, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.3,
              ease: "back.out"
            });
            
            // Animate subtitle
            gsap.to(subtitle, {
              opacity: 1,
              duration: 1,
              delay: 0.5
            });
            
            // Animate plot container
            gsap.to(plotContainer, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.7,
              ease: "back.out(1.2)"
            });
            
            // Animate results container with slight delay after plot
            gsap.to(resultsContainer, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 1,
              ease: "back.out(1.2)"
            });
            
            // Animate parameters with highlight
            gsap.fromTo(
              parameters,
              { opacity: 0, x: -20 },
              { 
                opacity: 1, 
                x: 0, 
                duration: 0.8,
                delay: 1.2,
                ease: "power2.out"
              }
            );
            
            // Highlight parameters value
            gsap.fromTo(
              parameters.querySelector('span:nth-child(2)'),
              { textShadow: "0 0 0px rgba(255, 158, 100, 0)" },
              { 
                textShadow: "0 0 10px rgba(255, 158, 100, 0.5)",
                duration: 1.2,
                delay: 1.5,
                ease: "power2.out"
              }
            );
            
            // Animate stats with staggered effect
            const statItems = resultsContainer.querySelectorAll('div[style*="display: flex; justify-content: space-between"]');
            gsap.fromTo(
              statItems,
              { opacity: 0, x: -20 },
              { 
                opacity: 1, 
                x: 0, 
                duration: 0.6, 
                stagger: 0.15, 
                delay: 1.2, 
                ease: "power2.out" 
              }
            );
          },
          
          transitionOut({ 
            slide, 
            content,
            bubbles
          }) {
            // Create a water ripple transition effect
            const rippleContainer = document.createElement('div');
            rippleContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 100;
              pointer-events: none;
            `;
            slide.appendChild(rippleContainer);
            
            // Create main ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0);
              width: 100px;
              height: 100px;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(100, 224, 255, 0.4) 30%, rgba(3, 28, 64, 0) 70%);
              border-radius: 50%;
              z-index: 10;
              opacity: 0.8;
            `;
            rippleContainer.appendChild(ripple);
            
            // Animate content out
            gsap.to(content, {
              scale: 0.9,
              opacity: 0,
              duration: 0.5,
              ease: "power2.in"
            });
            
            // Stop bubbles animation
            gsap.killTweensOf(bubbles.childNodes);
            
            // Animate ripple effect
            gsap.to(ripple, {
              scale: 15,
              opacity: 0,
              duration: 1.5,
              ease: "power3.out",
              onComplete: () => {
                // Final fade of entire slide
                gsap.to(slide, {
                  opacity: 0,
                  duration: 0.3
                });
              }
            });
          }
        },
    
        // NEW SLIDE: KNN Regression slide
        {
          init({ container }) {
            const slide = document.createElement('div');
            slide.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #0a4975 0%, #031c40 100%);
              color: white;
              opacity: 0;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            `;
            
            // Create bubbles effect for background
            const bubbles = document.createElement('div');
            bubbles.style.cssText = `
              position: absolute;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 0;
            `;
            
            // Generate 40 random bubbles
            for (let i = 0; i < 40; i++) {
              const size = Math.random() * 20 + 5;
              const bubble = document.createElement('div');
              bubble.style.cssText = `
                position: absolute;
                bottom: -${size * 2}px;
                left: ${Math.random() * 100}%;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
                opacity: 0;
                transform: translateY(0);
              `;
              bubbles.appendChild(bubble);
              
              // Animate bubbles rising
              const duration = (Math.random() * 10) + 15;
              const delay = Math.random() * 20;
              
              gsap.to(bubble, {
                y: `-=${window.innerHeight + size * 2}`,
                x: `+=${(Math.random() * 100) - 50}`,
                opacity: 0.7,
                duration: duration,
                delay: delay,
                repeat: -1,
                ease: "power1.inOut",
                onStart: () => {
                  gsap.set(bubble, { opacity: 0.7 });
                }
              });
            }
            
            slide.appendChild(bubbles);
            
            // Add underwater light rays effect
            const rays = document.createElement('div');
            rays.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: radial-gradient(ellipse at center, rgba(100, 224, 255, 0.15) 0%, rgba(3, 28, 64, 0) 70%);
              opacity: 0;
              pointer-events: none;
            `;
            slide.appendChild(rays);
            
            // Content container with flex layout
            const content = document.createElement('div');
            content.style.cssText = `
              position: relative;
              width: 90%;
              max-width: 1200px;
              z-index: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              opacity: 0;
            `;
            
            // Header
            const header = document.createElement('div');
            header.style.cssText = `
              width: 100%;
              text-align: center;
              margin-bottom: 30px;
            `;
            
            const title = document.createElement('h1');
            title.textContent = 'Model Fitting & Results';
            title.style.cssText = `
              font-size: 42px;
              margin-bottom: 15px;
              opacity: 0;
              transform: translateY(-20px);
              text-shadow: 0 0 15px rgba(100, 224, 255, 0.6);
              color: white;
            `;
            
            const subtitle = document.createElement('p');
            subtitle.textContent = 'KNN Regression';
            subtitle.style.cssText = `
              font-size: 28px;
              opacity: 0;
              margin-bottom: 30px;
              color: #64e0ff;
            `;
            
            header.appendChild(title);
            header.appendChild(subtitle);
            content.appendChild(header);
            
            // Main content with two columns: plot and results
            const mainContent = document.createElement('div');
            mainContent.style.cssText = `
              width: 100%;
              display: flex;
              flex-direction: row;
              justify-content: space-between;
              align-items: center;
              gap: 30px;
            `;
            
            // Plot container
            const plotContainer = document.createElement('div');
            plotContainer.style.cssText = `
              flex: 1;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 20px;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
              box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
              border: 1px solid rgba(100, 224, 255, 0.2);
              opacity: 0;
              transform: translateY(20px);
              position: relative;
              max-width: 650px;
              height: 450px;
            `;
            
            // Placeholder for the KNN regression plot image
            const plotImage = document.createElement('img');
            plotImage.style.cssText = `
              max-width: 100%;
              max-height: 100%;
              border-radius: 10px;
              opacity: 0;
              transform: scale(0.95);
              transition: transform 0.3s ease;
            `;
            plotImage.alt = "KNN Regression: Water Temperature vs Salinity";
            plotImage.src = "media/tempVsal_KNN.png";
            
            // Add loading state until image is provided
            const loadingText = document.createElement('div');
            loadingText.textContent = "KNN Regression Plot"; 
            loadingText.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%);
              color: rgba(255, 255, 255, 0.7);
              font-size: 20px;
              text-align: center;
            `;
            
            plotContainer.appendChild(loadingText);
            plotContainer.appendChild(plotImage);
            
            // Results container
            const resultsContainer = document.createElement('div');
            resultsContainer.style.cssText = `
              flex: 1;
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 30px;
              box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
              border: 1px solid rgba(100, 224, 255, 0.2);
              opacity: 0;
              transform: translateY(20px);
              max-width: 450px;
            `;
            
            // Results header
            const resultsHeader = document.createElement('h2');
            resultsHeader.textContent = 'Model Statistics';
            resultsHeader.style.cssText = `
              color: white;
              font-size: 28px;
              margin-bottom: 25px;
              text-align: center;
              text-shadow: 0 0 10px rgba(100, 224, 255, 0.3);
            `;
            resultsContainer.appendChild(resultsHeader);
            
            // Model parameters container
            const parametersContainer = document.createElement('div');
            parametersContainer.style.cssText = `
              background: rgba(0, 0, 0, 0.2);
              border-radius: 10px;
              padding: 20px;
              margin-bottom: 30px;
              border-left: 4px solid #64e0ff;
            `;
            
            const parametersLabel = document.createElement('div');
            parametersLabel.textContent = 'Model Parameters';
            parametersLabel.style.cssText = `
              color: #64e0ff;
              font-size: 18px;
              margin-bottom: 15px;
              font-weight: bold;
            `;
            
            // Key parameters for KNN
            const parameters = document.createElement('div');
            parameters.style.cssText = `
              display: flex;
              justify-content: space-between;
              align-items: center;
            `;
            
            const paramName = document.createElement('span');
            paramName.textContent = 'Number of Neighbors';
            paramName.style.cssText = `
              color: white;
              font-size: 22px;
            `;
            
            const paramValue = document.createElement('span');
            paramValue.textContent = '10';
            paramValue.style.cssText = `
              color: #ff9e64;
              font-size: 22px;
              font-weight: bold;
            `;
            
            parameters.appendChild(paramName);
            parameters.appendChild(paramValue);
            
            parametersContainer.appendChild(parametersLabel);
            parametersContainer.appendChild(parameters);
            resultsContainer.appendChild(parametersContainer);
            
            // Performance stats container
            const statsContainer = document.createElement('div');
            statsContainer.style.cssText = `
              display: flex;
              flex-direction: column;
              gap: 20px;
              margin-top: 20px;
            `;
            
            // Function to create a stat item
            const createStat = (label, value, color) => {
              const statItem = document.createElement('div');
              statItem.style.cssText = `
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
                padding-bottom: 15px;
              `;
              
              const statLabel = document.createElement('div');
              statLabel.textContent = label;
              statLabel.style.cssText = `
                font-size: 22px;
                color: white;
              `;
              
              const statValue = document.createElement('div');
              statValue.textContent = value;
              statValue.style.cssText = `
                font-size: 24px;
                font-weight: bold;
                color: ${color};
                text-shadow: 0 0 10px rgba(${color === '#64e0ff' ? '100, 224, 255' : '255, 158, 100'}, 0.3);
              `;
              
              statItem.appendChild(statLabel);
              statItem.appendChild(statValue);
              return statItem;
            };
            
            // Add R-squared and MSE statistics
            statsContainer.appendChild(createStat('R-squared', '0.4336956716832886', '#64e0ff'));
            statsContainer.appendChild(createStat('Mean Squared Error', '9.563992358543878', '#ff9e64'));
  
            resultsContainer.appendChild(statsContainer);
            
            mainContent.appendChild(plotContainer);
            mainContent.appendChild(resultsContainer);
            content.appendChild(mainContent);
            
            slide.appendChild(content);
            container.appendChild(slide);
            
            // Apply image event listeners
            plotImage.onload = function() {
              loadingText.style.display = 'none';
              gsap.to(plotImage, {
                opacity: 1,
                scale: 1,
                duration: 0.8
              });
            };
            
            plotImage.onerror = function() {
              loadingText.textContent = "Please update regression plot URL";
              loadingText.style.color = "#ff6b6b";
            };
            
            return { 
              slide, 
              title,
              subtitle,
              content,
              plotContainer,
              plotImage,
              resultsContainer,
              parameters,
              bubbles,
              rays
            };
          },
          
          transitionIn({ 
            slide, 
            title,
            subtitle,
            content,
            plotContainer,
            resultsContainer,
            parameters,
            rays
          }) {
            // Fade in slide
            gsap.to(slide, {
              opacity: 1,
              duration: 1
            });
            
            // Animate light rays
            gsap.to(rays, {
              opacity: 0.8,
              duration: 1.5,
              ease: "power1.inOut"
            });
            
            // Animate content container
            gsap.to(content, {
              opacity: 1,
              duration: 1
            });
            
            // Animate title
            gsap.to(title, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.3,
              ease: "back.out"
            });
            
            // Animate subtitle
            gsap.to(subtitle, {
              opacity: 1,
              duration: 1,
              delay: 0.5
            });
            
            // Animate plot container
            gsap.to(plotContainer, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.7,
              ease: "back.out(1.2)"
            });
            
            // Animate results container with slight delay after plot
            gsap.to(resultsContainer, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 1,
              ease: "back.out(1.2)"
            });
            
            // Animate parameters with highlight
            gsap.fromTo(
              parameters,
              { opacity: 0, x: -20 },
              { 
                opacity: 1, 
                x: 0, 
                duration: 0.8,
                delay: 1.2,
                ease: "power2.out"
              }
            );
            
            // Highlight parameters value
            gsap.fromTo(
              parameters.querySelector('span:nth-child(2)'),
              { textShadow: "0 0 0px rgba(255, 158, 100, 0)" },
              { 
                textShadow: "0 0 10px rgba(255, 158, 100, 0.5)",
                duration: 1.2,
                delay: 1.5,
                ease: "power2.out"
              }
            );
            
            // Animate stats with staggered effect
            const statItems = resultsContainer.querySelectorAll('div[style*="display: flex; justify-content: space-between"]');
            gsap.fromTo(
              statItems,
              { opacity: 0, x: -20 },
              { 
                opacity: 1, 
                x: 0, 
                duration: 0.6, 
                stagger: 0.15, 
                delay: 1.2, 
                ease: "power2.out" 
              }
            );
          },
          
          transitionOut({ 
            slide, 
            content,
            bubbles
          }) {
            // Create a water ripple transition effect
            const rippleContainer = document.createElement('div');
            rippleContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 100;
              pointer-events: none;
            `;
            slide.appendChild(rippleContainer);
            
            // Create main ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0);
              width: 100px;
              height: 100px;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(100, 224, 255, 0.4) 30%, rgba(3, 28, 64, 0) 70%);
              border-radius: 50%;
              z-index: 10;
              opacity: 0.8;
            `;
            rippleContainer.appendChild(ripple);
            
            // Animate content out
            gsap.to(content, {
              scale: 0.9,
              opacity: 0,
              duration: 0.5,
              ease: "power2.in"
            });
            
            // Stop bubbles animation
            gsap.killTweensOf(bubbles.childNodes);
            
            // Animate ripple effect
            gsap.to(ripple, {
              scale: 15,
              opacity: 0,
              duration: 1.5,
              ease: "power3.out",
              onComplete: () => {
                // Final fade of entire slide
                gsap.to(slide, {
                  opacity: 0,
                  duration: 0.3
                });
              }
            });
          }
        },
    
        // NEW SLIDE: Model Performance Comparison
        {
          init({ container }) {
            const slide = document.createElement('div');
            slide.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #0a4975 0%, #031c40 100%);
              color: white;
              opacity: 0;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            `;
            
            // Create bubbles effect for background
            const bubbles = document.createElement('div');
            bubbles.style.cssText = `
              position: absolute;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 0;
            `;
            
            // Generate 40 random bubbles
            for (let i = 0; i < 40; i++) {
              const size = Math.random() * 20 + 5;
              const bubble = document.createElement('div');
              bubble.style.cssText = `
                position: absolute;
                bottom: -${size * 2}px;
                left: ${Math.random() * 100}%;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
                opacity: 0;
                transform: translateY(0);
              `;
              bubbles.appendChild(bubble);
              
              // Animate bubbles rising
              const duration = (Math.random() * 10) + 15;
              const delay = Math.random() * 20;
              
              gsap.to(bubble, {
                y: `-=${window.innerHeight + size * 2}`,
                x: `+=${(Math.random() * 100) - 50}`,
                opacity: 0.7,
                duration: duration,
                delay: delay,
                repeat: -1,
                ease: "power1.inOut",
                onStart: () => {
                  gsap.set(bubble, { opacity: 0.7 });
                }
              });
            }
            
            slide.appendChild(bubbles);
            
            // Add underwater light rays effect
            const rays = document.createElement('div');
            rays.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: radial-gradient(ellipse at center, rgba(100, 224, 255, 0.15) 0%, rgba(3, 28, 64, 0) 70%);
              opacity: 0;
              pointer-events: none;
            `;
            slide.appendChild(rays);
            
            // Content container
            const content = document.createElement('div');
            content.style.cssText = `
              position: relative;
              width: 90%;
              max-width: 1000px;
              z-index: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              opacity: 0;
            `;
            
            // Header
            const header = document.createElement('div');
            header.style.cssText = `
              width: 100%;
              text-align: center;
              margin-bottom: 40px;
            `;
            
            const title = document.createElement('h1');
            title.textContent = 'Model Performance Comparison';
            title.style.cssText = `
              font-size: 42px;
              margin-bottom: 15px;
              opacity: 0;
              transform: translateY(-20px);
              text-shadow: 0 0 15px rgba(100, 224, 255, 0.6);
              color: white;
            `;
            
            const subtitle = document.createElement('p');
            subtitle.textContent = 'Comparing Regression Models for Temperature Prediction';
            subtitle.style.cssText = `
              font-size: 24px;
              opacity: 0;
              margin-bottom: 10px;
              color: #64e0ff;
            `;
            
            header.appendChild(title);
            header.appendChild(subtitle);
            content.appendChild(header);
            
            // Comparison table container
            const tableContainer = document.createElement('div');
            tableContainer.style.cssText = `
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 30px;
              box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
              border: 1px solid rgba(100, 224, 255, 0.2);
              opacity: 0;
              transform: translateY(20px);
              width: 100%;
            `;
            
            // Create comparison table
            const table = document.createElement('table');
            table.style.cssText = `
              width: 100%;
              border-collapse: separate;
              border-spacing: 0 8px;
              color: white;
            `;
            
            // Table header
            const thead = document.createElement('thead');
            const headerRow = document.createElement('tr');
            
            const createHeaderCell = (text, width) => {
              const th = document.createElement('th');
              th.textContent = text;
              th.style.cssText = `
                padding: 15px 10px;
                font-size: 22px;
                font-weight: bold;
                color: #64e0ff;
                text-align: center;
                border-bottom: 2px solid rgba(100, 224, 255, 0.5);
                width: ${width};
              `;
              return th;
            };
            
            headerRow.appendChild(createHeaderCell('Model', '25%'));
            headerRow.appendChild(createHeaderCell('R-Squared', '25%'));
            headerRow.appendChild(createHeaderCell('Mean Squared Error', '25%'));
            headerRow.appendChild(createHeaderCell('Performance Rank', '25%'));
            
            thead.appendChild(headerRow);
            table.appendChild(thead);
            
            // Table body
            const tbody = document.createElement('tbody');
            
            // Model data
            const modelData = [
              {
                name: 'Linear Regression',
                rSquared: 0.3303452191320939,
                mse: 11.309419488493134,
                rank: 4
              },
              {
                name: 'KNN Regression',
                rSquared: 0.4336956716832886,
                mse: 9.563992358543878,
                rank: 3
              },
              {
                name: 'Polynomial Regression',
                rSquared: 0.45068763171409365,
                mse: 9.277024790461974,
                rank: 2
              },
              {
                name: 'Random Forest',
                rSquared: 0.4810371520765472,
                mse: 8.764468967880225,
                rank: 1,
                isBest: true
              }
            ];
            
            // Create table rows
            const modelElements = [];
            
            modelData.forEach((model, index) => {
              const row = document.createElement('tr');
              row.style.cssText = `
                background: rgba(${model.isBest ? '100, 224, 255, 0.15' : '255, 255, 255, 0.05'});
                transform: translateX(-20px);
                opacity: 0;
                ${model.isBest ? 'border-left: 4px solid #64e0ff;' : ''}
              `;
              
              // Create cell for model name
              const nameCell = document.createElement('td');
              nameCell.textContent = model.name;
              nameCell.style.cssText = `
                padding: 18px 20px;
                font-size: 20px;
                font-weight: ${model.isBest ? 'bold' : 'normal'};
                color: ${model.isBest ? '#64e0ff' : 'white'};
                border-radius: ${index === 0 ? '10px 0 0 10px' : '0'};
                text-align: left;
              `;
              row.appendChild(nameCell);
              
              // Create cell for R-squared
              const rSquaredCell = document.createElement('td');
              rSquaredCell.textContent = model.rSquared.toFixed(3);
              rSquaredCell.style.cssText = `
                padding: 18px 20px;
                font-size: 20px;
                font-weight: ${model.isBest ? 'bold' : 'normal'};
                color: ${model.isBest ? '#64e0ff' : 'white'};
                text-align: center;
              `;
              row.appendChild(rSquaredCell);
              
              // Create cell for MSE
              const mseCell = document.createElement('td');
              mseCell.textContent = model.mse.toFixed(2);
              mseCell.style.cssText = `
                padding: 18px 20px;
                font-size: 20px;
                font-weight: ${model.isBest ? 'bold' : 'normal'};
                color: ${model.isBest ? '#64e0ff' : 'white'};
                text-align: center;
              `;
              row.appendChild(mseCell);
              
              // Create cell for rank
              const rankCell = document.createElement('td');
              rankCell.textContent = `#${model.rank}${model.isBest ? ' (Best)' : ''}`;
              rankCell.style.cssText = `
                padding: 18px 20px;
                font-size: 20px;
                font-weight: ${model.isBest ? 'bold' : 'normal'};
                color: ${model.isBest ? '#64e0ff' : 'white'};
                border-radius: ${index === 0 ? '0 10px 10px 0' : '0'};
                text-align: center;
              `;
              row.appendChild(rankCell);
              
              tbody.appendChild(row);
              modelElements.push(row);
            });
            
            table.appendChild(tbody);
            tableContainer.appendChild(table);
            content.appendChild(tableContainer);
            
            // REMOVED: Conclusion container and related elements
            
            slide.appendChild(content);
            container.appendChild(slide);
            
            return { 
              slide,
              title,
              subtitle,
              tableContainer,
              modelElements,
              content,
              bubbles,
              rays
            };
          },
          
          transitionIn({ 
            slide,
            title,
            subtitle,
            tableContainer,
            modelElements,
            content,
            rays
          }) {
            // Fade in slide
            gsap.to(slide, {
              opacity: 1,
              duration: 1
            });
            
            // Animate light rays
            gsap.to(rays, {
              opacity: 0.8,
              duration: 1.5,
              ease: "power1.inOut"
            });
            
            // Animate content container
            gsap.to(content, {
              opacity: 1,
              duration: 1
            });
            
            // Animate title
            gsap.to(title, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.3,
              ease: "back.out"
            });
            
            // Animate subtitle
            gsap.to(subtitle, {
              opacity: 1,
              duration: 1,
              delay: 0.5
            });
            
            // Animate table container
            gsap.to(tableContainer, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.7,
              ease: "back.out(1.2)"
            });
            
            // Animate model rows with staggered effect
            gsap.to(modelElements, {
              opacity: 1,
              x: 0,
              duration: 0.6,
              stagger: 0.15,
              delay: 1.2,
              ease: "power2.out"
            });
            
            // Highlight the best model row
            gsap.to(modelElements[3], {
              boxShadow: "0 0 15px rgba(100, 224, 255, 0.3)",
              duration: 1,
              delay: 2.4,
              repeat: 1,
              yoyo: true
            });
            
            // REMOVED: Animation code for the conclusion container
          },
          
          transitionOut({ 
            slide, 
            content,
            bubbles
          }) {
            // Create a water ripple transition effect
            const rippleContainer = document.createElement('div');
            rippleContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 100;
              pointer-events: none;
            `;
            slide.appendChild(rippleContainer);
            
            // Create main ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0);
              width: 100px;
              height: 100px;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(100, 224, 255, 0.4) 30%, rgba(3, 28, 64, 0) 70%);
              border-radius: 50%;
              z-index: 10;
              opacity: 0.8;
            `;
            rippleContainer.appendChild(ripple);
            
            // Animate content out
            gsap.to(content, {
              scale: 0.9,
              opacity: 0,
              duration: 0.5,
              ease: "power2.in"
            });
            
            // Stop bubbles animation
            gsap.killTweensOf(bubbles.childNodes);
            
            // Animate ripple effect
            gsap.to(ripple, {
              scale: 15,
              opacity: 0,
              duration: 1.5,
              ease: "power3.out",
              onComplete: () => {
                // Final fade of entire slide
                gsap.to(slide, {
                  opacity: 0,
                  duration: 0.3
                });
              }
            });
          }
        },
    
        // NEW SLIDE: Conclusion slide
        {
          init({ container }) {
            const slide = document.createElement('div');
            slide.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #0a4975 0%, #031c40 100%);
              color: white;
              opacity: 0;
              overflow: hidden;
              display: flex;
              flex-direction: column;
              align-items: center;
              justify-content: center;
            `;
            
            // Create bubbles effect for background
            const bubbles = document.createElement('div');
            bubbles.style.cssText = `
              position: absolute;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 0;
            `;
            
            // Generate 40 random bubbles
            for (let i = 0; i < 40; i++) {
              const size = Math.random() * 20 + 5;
              const bubble = document.createElement('div');
              bubble.style.cssText = `
                position: absolute;
                bottom: -${size * 2}px;
                left: ${Math.random() * 100}%;
                width: ${size}px;
                height: ${size}px;
                border-radius: 50%;
                background: radial-gradient(circle at 30% 30%, rgba(255, 255, 255, 0.3), rgba(255, 255, 255, 0.05));
                opacity: 0;
                transform: translateY(0);
              `;
              bubbles.appendChild(bubble);
              
              // Animate bubbles rising
              const duration = (Math.random() * 10) + 15;
              const delay = Math.random() * 20;
              
              gsap.to(bubble, {
                y: `-=${window.innerHeight + size * 2}`,
                x: `+=${(Math.random() * 100) - 50}`,
                opacity: 0.7,
                duration: duration,
                delay: delay,
                repeat: -1,
                ease: "power1.inOut",
                onStart: () => {
                  gsap.set(bubble, { opacity: 0.7 });
                }
              });
            }
            
            slide.appendChild(bubbles);
            
            // Add underwater light rays effect
            const rays = document.createElement('div');
            rays.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: radial-gradient(ellipse at center, rgba(100, 224, 255, 0.15) 0%, rgba(3, 28, 64, 0) 70%);
              opacity: 0;
              pointer-events: none;
            `;
            slide.appendChild(rays);
            
            // Content container
            const content = document.createElement('div');
            content.style.cssText = `
              position: relative;
              width: 90%;
              max-width: 1000px;
              z-index: 1;
              display: flex;
              flex-direction: column;
              align-items: center;
              opacity: 0;
            `;
            
            // Header
            const header = document.createElement('div');
            header.style.cssText = `
              width: 100%;
              text-align: center;
              margin-bottom: 60px;
            `;
            
            const title = document.createElement('h1');
            title.textContent = 'Conclusion';
            title.style.cssText = `
              font-size: 52px;
              margin-bottom: 15px;
              opacity: 0;
              transform: translateY(-20px);
              text-shadow: 0 0 15px rgba(100, 224, 255, 0.6);
              color: white;
            `;
            
            header.appendChild(title);
            content.appendChild(header);
            
            // Create questions section
            const questionsContainer = document.createElement('div');
            questionsContainer.style.cssText = `
              width: 100%;
              display: flex;
              flex-direction: column;
              gap: 40px;
            `;
            
            // First research question
            const questionBox1 = document.createElement('div');
            questionBox1.style.cssText = `
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 30px 35px;
              box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
              border: 1px solid rgba(100, 224, 255, 0.3);
              opacity: 0;
              transform: translateY(20px);
              width: 100%;
              text-align: center;
            `;
            
            const question1 = document.createElement('h2');
            question1.innerHTML = 'Is there a significant correlation between water salinity<br>and temperature in ocean environments?';
            question1.style.cssText = `
              font-size: 32px;
              color: #64e0ff;
              margin: 0;
            `;
            
            questionBox1.appendChild(question1);
            
            // Second research question
            const questionBox2 = document.createElement('div');
            questionBox2.style.cssText = `
              background: rgba(255, 255, 255, 0.1);
              border-radius: 15px;
              padding: 30px 35px;
              box-shadow: 0 5px 20px rgba(0, 0, 0, 0.2);
              border: 1px solid rgba(100, 224, 255, 0.3);
              opacity: 0;
              transform: translateY(20px);
              width: 100%;
              text-align: center;
            `;
            
            const question2 = document.createElement('h2');
            question2.innerHTML = 'Can we accurately predict water temperature using<br>salinity measurements and machine learning techniques?';
            question2.style.cssText = `
              font-size: 32px;
              color: #64e0ff;
              margin: 0;
            `;
            
            questionBox2.appendChild(question2);
            
            // Add questions to container
            questionsContainer.appendChild(questionBox1);
            questionsContainer.appendChild(questionBox2);
            
            content.appendChild(questionsContainer);
            slide.appendChild(content);
            container.appendChild(slide);
            
            return { 
              slide,
              title,
              questionBoxes: [questionBox1, questionBox2],
              content,
              bubbles,
              rays
            };
          },
          
          transitionIn({ 
            slide,
            title,
            questionBoxes,
            content,
            rays
          }) {
            // Fade in slide
            gsap.to(slide, {
              opacity: 1,
              duration: 1
            });
            
            // Animate light rays
            gsap.to(rays, {
              opacity: 0.8,
              duration: 1.5,
              ease: "power1.inOut"
            });
            
            // Animate content container
            gsap.to(content, {
              opacity: 1,
              duration: 1
            });
            
            // Animate title
            gsap.to(title, {
              opacity: 1,
              y: 0,
              duration: 1,
              delay: 0.5,
              ease: "back.out"
            });
            
            // Animate question boxes with staggered animation
            gsap.to(questionBoxes, {
              opacity: 1,
              y: 0,
              duration: 1,
              stagger: 0.8,
              delay: 1.2,
              ease: "back.out(1.2)"
            });
            
            // Add pulsing highlight effect to question boxes
            questionBoxes.forEach((box, index) => {
              gsap.to(box, {
                boxShadow: "0 0 25px rgba(100, 224, 255, 0.5)",
                duration: 1.5,
                delay: 2.2 + index * 0.8,
                repeat: 1,
                yoyo: true
              });
            });
          },
          
          transitionOut({ 
            slide, 
            content,
            bubbles
          }) {
            // Create a final water ripple transition effect
            const rippleContainer = document.createElement('div');
            rippleContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 100;
              pointer-events: none;
            `;
            slide.appendChild(rippleContainer);
            
            // Create main ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0);
              width: 100px;
              height: 100px;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(100, 224, 255, 0.4) 30%, rgba(3, 28, 64, 0) 70%);
              border-radius: 50%;
              z-index: 10;
              opacity: 0.8;
            `;
            rippleContainer.appendChild(ripple);
            
            // Animate content out
            gsap.to(content, {
              scale: 0.9,
              opacity: 0,
              duration: 0.5,
              ease: "power2.in"
            });
            
            // Stop bubbles animation
            gsap.killTweensOf(bubbles.childNodes);
            
            // Animate ripple effect
            gsap.to(ripple, {
              scale: 15,
              opacity: 0,
              duration: 1.5,
              ease: "power3.out",
              onComplete: () => {
                // Final fade of entire slide
                gsap.to(slide, {
                  opacity: 0,
                  duration: 0.3
                });
              }
            });
          }
        },
        // New Q&A slide with distinct styling
        {
          init({ container }) {
            const slide = document.createElement('div');
            slide.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #001428 0%, #000a14 100%);
              color: white;
              opacity: 0;
              overflow: hidden;
            `;
            
            // Create deep ocean light beam effect
            const lightBeam = document.createElement('div');
            lightBeam.style.cssText = `
              position: absolute;
              top: -100px;
              left: 50%;
              transform: translateX(-50%) rotate(15deg);
              width: 300px;
              height: 1000px;
              background: linear-gradient(to bottom, rgba(100, 224, 255, 0.15) 0%, rgba(3, 28, 64, 0) 80%);
              opacity: 0;
              filter: blur(20px);
              z-index: 1;
            `;
            
            // Create second light beam for crossed effect
            const lightBeam2 = document.createElement('div');
            lightBeam2.style.cssText = `
              position: absolute;
              top: -100px;
              left: 50%;
              transform: translateX(-50%) rotate(-15deg);
              width: 300px;
              height: 1000px;
              background: linear-gradient(to bottom, rgba(100, 224, 255, 0.15) 0%, rgba(3, 28, 64, 0) 80%);
              opacity: 0;
              filter: blur(20px);
              z-index: 1;
            `;
            
            // Create floating particles for deep ocean effect
            const particlesContainer = document.createElement('div');
            particlesContainer.style.cssText = `
              position: absolute;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 2;
            `;
            
            // Generate smaller, slow-moving particles (like plankton)
            for (let i = 0; i < 50; i++) {
              const particle = document.createElement('div');
              const size = Math.random() * 3 + 1;
              const x = Math.random() * 100;
              const y = Math.random() * 100;
              const duration = Math.random() * 30 + 20;
              const delay = Math.random() * 10;
              
              particle.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                width: ${size}px;
                height: ${size}px;
                background: rgba(255, 255, 255, ${0.2 + Math.random() * 0.2});
                border-radius: 50%;
                filter: blur(1px);
                opacity: 0;
              `;
              
              particlesContainer.appendChild(particle);
              
              // Animate particles with very slow movement to create deep ocean feel
              gsap.to(particle, {
                y: `+=${(Math.random() * 40) - 20}`,
                x: `+=${(Math.random() * 40) - 20}`,
                opacity: 0.7,
                duration: duration,
                delay: delay,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                onStart: () => {
                  particle.style.opacity = 0.1 + Math.random() * 0.3;
                }
              });
            }
            
            // Content container for centered Q&A
            const contentContainer = document.createElement('div');
            contentContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 3;
            `;
            
            // Create title with special styling
            const title = document.createElement('h1');
            title.textContent = 'Q&A';
            title.style.cssText = `
              font-size: 100px;
              font-weight: bold;
              color: rgba(255, 255, 255, 0.95);
              text-shadow: 0 0 30px rgba(100, 224, 255, 0.8), 0 0 60px rgba(100, 224, 255, 0.4);
              opacity: 0;
              transform: scale(1.2);
              letter-spacing: 10px;
              font-family: sans-serif;
            `;
            
            // Create circular glow background
            const glowBackground = document.createElement('div');
            glowBackground.style.cssText = `
              position: absolute;
              width: 400px;
              height: 400px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(100, 224, 255, 0.1) 0%, rgba(0, 20, 40, 0) 70%);
              z-index: -1;
              opacity: 0;
              transform: scale(0.8);
            `;
            
            contentContainer.appendChild(glowBackground);
            contentContainer.appendChild(title);
            
            slide.appendChild(lightBeam);
            slide.appendChild(lightBeam2);
            slide.appendChild(particlesContainer);
            slide.appendChild(contentContainer);
            container.appendChild(slide);
            
            return { 
              slide, 
              title, 
              glowBackground, 
              lightBeam,
              lightBeam2,
              particles: particlesContainer.childNodes,
              contentContainer
            };
          },
          
          transitionIn({ 
            slide, 
            title, 
            glowBackground, 
            lightBeam,
            lightBeam2,
            particles,
            contentContainer
          }) {
            // Fade in slide with a longer duration for smoother transition
            gsap.to(slide, {
              opacity: 1,
              duration: 1.5
            });
            
            // Animate light beams with delayed appearance
            gsap.to(lightBeam, {
              opacity: 0.7,
              duration: 2,
              delay: 0.5,
              ease: "power1.inOut"
            });
            
            gsap.to(lightBeam2, {
              opacity: 0.5,
              duration: 2.5,
              delay: 0.8,
              ease: "power1.inOut"
            });
            
            // Subtle rotation of light beams for dynamic effect
            gsap.to(lightBeam, {
              rotate: "12deg",
              duration: 25,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut"
            });
            
            gsap.to(lightBeam2, {
              rotate: "-17deg",
              duration: 20,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut"
            });
            
            // Animate glow background
            gsap.to(glowBackground, {
              opacity: 1,
              scale: 1,
              duration: 2,
              delay: 0.5,
              ease: "power2.out"
            });
            
            // Pulsing animation for the glow
            gsap.to(glowBackground, {
              scale: 1.2,
              opacity: 0.7,
              duration: 3,
              delay: 2,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut"
            });
            
            // Animate title - scale from larger to normal with fade in
            gsap.to(title, {
              opacity: 1,
              scale: 1,
              duration: 1.5,
              delay: 1,
              ease: "back.out(1.2)"
            });
            
            // Add subtle floating animation to title
            gsap.to(title, {
              y: "-=10",
              duration: 4,
              delay: 2.5,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut"
            });
          },
          
          // Q&A slide's transitionOut function - updated with connecting animation
          transitionOut({ 
            slide, 
            title, 
            glowBackground, 
            lightBeam,
            lightBeam2,
            particles,
            contentContainer
          }) {
            // Stop all ongoing animations
            gsap.killTweensOf([title, glowBackground, lightBeam, lightBeam2]);
            gsap.killTweensOf(particles);
            
            // Create a water ripple transition effect that connects to next slide
            const rippleContainer = document.createElement('div');
            rippleContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              z-index: 100;
              pointer-events: none;
            `;
            slide.appendChild(rippleContainer);
            
            // Create main ripple effect
            const ripple = document.createElement('div');
            ripple.style.cssText = `
              position: absolute;
              top: 50%;
              left: 50%;
              transform: translate(-50%, -50%) scale(0);
              width: 100px;
              height: 100px;
              background: radial-gradient(circle, rgba(255, 255, 255, 0.8) 0%, rgba(100, 224, 255, 0.4) 30%, rgba(3, 28, 64, 0) 70%);
              border-radius: 50%;
              z-index: 10;
              opacity: 0.8;
            `;
            rippleContainer.appendChild(ripple);
            
            // Animate title to transform toward next slide's position
            gsap.to(title, {
              opacity: 0,
              scale: 0.8,
              y: "+=20",
              duration: 0.8,
              ease: "power2.in"
            });
            
            // Morph the glow rather than just fading it
            gsap.to(glowBackground, {
              opacity: 0.5,
              scale: 1.2,
              duration: 0.8,
              ease: "power1.in"
            });
            
            // Keep light beams partially visible to connect with next slide
            gsap.to([lightBeam, lightBeam2], {
              opacity: 0.3,
              width: "400px",
              duration: 0.8,
              ease: "power1.in"
            });
            
            // Animate ripple effect to expand
            gsap.to(ripple, {
              scale: 8,
              opacity: 0.6,
              duration: 1.2,
              ease: "power3.out"
            });
            
            // Final fade out with shorter duration to connect with next slide
            gsap.to(slide, {
              opacity: 0,
              duration: 0.6,
              delay: 0.8,
              ease: "power2.in"
            });
          }
        },
        // New thank you slide with distinct styling
        {
          init({ container }) {
            const slide = document.createElement('div');
            slide.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              background: linear-gradient(135deg, #001428 0%, #000a14 100%);
              color: white;
              opacity: 0;
              overflow: hidden;
            `;
            
            // Create deep ocean light beam effect
            const lightBeam = document.createElement('div');
            lightBeam.style.cssText = `
              position: absolute;
              top: -100px;
              left: 50%;
              transform: translateX(-50%) rotate(15deg);
              width: 300px;
              height: 1000px;
              background: linear-gradient(to bottom, rgba(100, 224, 255, 0.15) 0%, rgba(3, 28, 64, 0) 80%);
              opacity: 0;
              filter: blur(20px);
              z-index: 1;
            `;
            
            // Create second light beam for crossed effect
            const lightBeam2 = document.createElement('div');
            lightBeam2.style.cssText = `
              position: absolute;
              top: -100px;
              left: 50%;
              transform: translateX(-50%) rotate(-15deg);
              width: 300px;
              height: 1000px;
              background: linear-gradient(to bottom, rgba(100, 224, 255, 0.15) 0%, rgba(3, 28, 64, 0) 80%);
              opacity: 0;
              filter: blur(20px);
              z-index: 1;
            `;
            
            // Create floating particles for deep ocean effect
            const particlesContainer = document.createElement('div');
            particlesContainer.style.cssText = `
              position: absolute;
              width: 100%;
              height: 100%;
              pointer-events: none;
              z-index: 2;
            `;
            
            // Generate smaller, slow-moving particles (like plankton)
            for (let i = 0; i < 50; i++) {
              const particle = document.createElement('div');
              const size = Math.random() * 3 + 1;
              const x = Math.random() * 100;
              const y = Math.random() * 100;
              const duration = Math.random() * 30 + 20;
              const delay = Math.random() * 10;
              
              particle.style.cssText = `
                position: absolute;
                left: ${x}%;
                top: ${y}%;
                width: ${size}px;
                height: ${size}px;
                background: rgba(255, 255, 255, ${0.2 + Math.random() * 0.2});
                border-radius: 50%;
                filter: blur(1px);
                opacity: 0;
              `;
              
              particlesContainer.appendChild(particle);
              
              // Animate particles with very slow movement to create deep ocean feel
              gsap.to(particle, {
                y: `+=${(Math.random() * 40) - 20}`,
                x: `+=${(Math.random() * 40) - 20}`,
                opacity: 0.7,
                duration: duration,
                delay: delay,
                repeat: -1,
                yoyo: true,
                ease: "sine.inOut",
                onStart: () => {
                  particle.style.opacity = 0.1 + Math.random() * 0.3;
                }
              });
            }
            
            // Content container for centered Q&A
            const contentContainer = document.createElement('div');
            contentContainer.style.cssText = `
              position: absolute;
              top: 0;
              left: 0;
              width: 100%;
              height: 100%;
              display: flex;
              align-items: center;
              justify-content: center;
              z-index: 3;
            `;
            
            // Create title with special styling
            const title = document.createElement('h1');
            title.textContent = 'Thank You!';
            title.style.cssText = `
              font-size: 100px;
              font-weight: bold;
              color: rgba(255, 255, 255, 0.95);
              text-shadow: 0 0 30px rgba(100, 224, 255, 0.8), 0 0 60px rgba(100, 224, 255, 0.4);
              opacity: 0;
              transform: scale(1.2);
              letter-spacing: 10px;
              font-family: sans-serif;
            `;
            
            // Create circular glow background
            const glowBackground = document.createElement('div');
            glowBackground.style.cssText = `
              position: absolute;
              width: 400px;
              height: 400px;
              border-radius: 50%;
              background: radial-gradient(circle, rgba(100, 224, 255, 0.1) 0%, rgba(0, 20, 40, 0) 70%);
              z-index: -1;
              opacity: 0;
              transform: scale(0.8);
            `;
            
            contentContainer.appendChild(glowBackground);
            contentContainer.appendChild(title);
            
            slide.appendChild(lightBeam);
            slide.appendChild(lightBeam2);
            slide.appendChild(particlesContainer);
            slide.appendChild(contentContainer);
            container.appendChild(slide);
            
            return { 
              slide, 
              title, 
              glowBackground, 
              lightBeam,
              lightBeam2,
              particles: particlesContainer.childNodes,
              contentContainer
            };
          },
          
          // Thank You slide's transitionIn function - updated to connect with previous slide
          transitionIn({ 
            slide, 
            title, 
            glowBackground, 
            lightBeam,
            lightBeam2,
            particles,
            contentContainer
          }) {
            // Start with particle visibility
            particles.forEach(particle => {
              gsap.set(particle, { opacity: 0.1 + Math.random() * 0.3 });
            });
            
            // Start with light beams partially visible (continuing from previous slide)
            gsap.set([lightBeam, lightBeam2], { 
              opacity: 0.3,
              width: "400px" 
            });
            
            // Set glow starting from previous slide end state
            gsap.set(glowBackground, {
              opacity: 0.5,
              scale: 1.2
            });
            
            // Fade in slide with a smoother transition
            gsap.to(slide, {
              opacity: 1,
              duration: 1
            });
            
            // Animate light beams with continuation feeling
            gsap.to(lightBeam, {
              opacity: 0.7,
              width: "300px",
              duration: 1.5,
              ease: "power1.out"
            });
            
            gsap.to(lightBeam2, {
              opacity: 0.5,
              width: "300px", 
              duration: 1.8,
              ease: "power1.out"
            });
            
            // Add subtle rotation of light beams
            gsap.to(lightBeam, {
              rotate: "12deg",
              duration: 25,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut"
            });
            
            gsap.to(lightBeam2, {
              rotate: "-17deg",
              duration: 20,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut"
            });
            
            // Animate glow background with smoother continuation
            gsap.to(glowBackground, {
              opacity: 1,
              scale: 1,
              duration: 1.5,
              ease: "power2.out"
            });
            
            // Pulsing animation for the glow
            gsap.to(glowBackground, {
              scale: 1.2,
              opacity: 0.7,
              duration: 3,
              delay: 1.5,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut"
            });
            
            // Animate title with a continuation feeling
            // Start from a different position than the Q&A title ended
            gsap.set(title, {
              opacity: 0,
              scale: 0.8,
              y: "-=30" 
            });
            
            // Animate to normal position
            gsap.to(title, {
              opacity: 1,
              scale: 1,
              y: "+=30",
              duration: 1.5,
              ease: "back.out(1.2)"
            });
            
            // Add subtle floating animation to title
            gsap.to(title, {
              y: "-=10",
              duration: 4,
              delay: 2,
              repeat: -1,
              yoyo: true,
              ease: "sine.inOut"
            });
          },
          
          transitionOut({ 
            slide, 
            title, 
            glowBackground, 
            lightBeam,
            lightBeam2,
            particles,
            contentContainer
          }) {
            // Stop all ongoing animations
            gsap.killTweensOf([title, glowBackground, lightBeam, lightBeam2]);
            gsap.killTweensOf(particles);
            
            // Fade out title with slight scale up
            gsap.to(title, {
              opacity: 0,
              scale: 1.1,
              y: "-=20",
              duration: 1,
              ease: "power2.in"
            });
            
            // Fade out glow
            gsap.to(glowBackground, {
              opacity: 0,
              scale: 1.5,
              duration: 1.2,
              ease: "power2.in"
            });
            
            // Increase intensity of light beams and then fade
            gsap.to([lightBeam, lightBeam2], {
              opacity: 0.9,
              width: "500px",
              duration: 0.8,
              ease: "power1.in",
              onComplete: () => {
                gsap.to([lightBeam, lightBeam2], {
                  opacity: 0,
                  duration: 0.5
                });
              }
            });
            
            // Final fade out of the slide
            gsap.to(slide, {
              opacity: 0,
              duration: 1,
              delay: 0.8,
              ease: "power2.in"
            });
          }
        }
    ];
    
    playSlides(slides);