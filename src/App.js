import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CodeEditor from './components/CodeEditor';
import SlidePreview from './components/SlidePreview';
import Toolbar from './components/Toolbar';
import SlideNavigation from './components/SlideNavigation';
import PresentationMode from './components/PresentationMode';
import TemplateSelector from './components/TemplateSelector';
import VisualSlideEditor from './components/VisualSlideEditor';
import { slideTemplates } from './data/slideTemplates';

const INITIAL_SLIDES = [
  {
    id: 1,
    title: 'Welcome to Studio3',
    code: slideTemplates.titleSlide,
    elements: [], // For visual editor
    content: null
  }
];

function App() {
  const [viewMode, setViewMode] = useState('design'); // 'design', 'code', 'preview', 'split'
  const [slides, setSlides] = useState(INITIAL_SLIDES);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const currentSlide = slides[currentSlideIndex];

  // Generate slide code from visual elements
  const generateSlideCode = (elements) => {
    if (!elements || elements.length === 0) {
      return `{
  init({ scene, container }) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = \`
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
    \`;
    container.appendChild(wrapper);
    return { wrapper };
  },
  transitionIn({ wrapper }) {
    gsap.to(wrapper, { opacity: 1, duration: 0.5 });
  },
  transitionOut({ wrapper }) {
    gsap.to(wrapper, { opacity: 0, duration: 0.3 });
  }
}`;
    }

    const elementCreation = elements.map((el, index) => {
      const { type, content, style, animation, animationOrder = index } = el;
      const varName = `element_${el.id}`;
      
      let elementCode = '';
      
      switch (type) {
        case 'text':
        case 'heading':
          elementCode = `
    const ${varName} = document.createElement('${type === 'heading' ? 'h1' : 'p'}');
    ${varName}.textContent = '${content || (type === 'heading' ? 'Heading' : 'Text')}';
    ${varName}.style.cssText = \`
      position: absolute;
      left: ${el.x || 50}px;
      top: ${el.y || 50}px;
      width: ${el.width || 200}px;
      height: ${el.height || 'auto'}px;
      font-size: ${style?.fontSize || (type === 'heading' ? '48px' : '16px')};
      font-weight: ${style?.fontWeight || (type === 'heading' ? 'bold' : 'normal')};
      color: ${style?.color || '#ffffff'};
      background-color: ${style?.backgroundColor || 'transparent'};
      border-radius: ${style?.borderRadius || '4px'};
      padding: 8px;
      transform: rotate(${el.rotation || 0}deg);
      z-index: ${el.zIndex || 1};
      opacity: 0;
    \`;
    wrapper.appendChild(${varName});`;
          break;
          
        case 'rectangle':
        case 'circle':
        case 'triangle':
          elementCode = `
    const ${varName} = document.createElement('div');
    ${varName}.style.cssText = \`
      position: absolute;
      left: ${el.x || 50}px;
      top: ${el.y || 50}px;
      width: ${el.width || 100}px;
      height: ${el.height || 100}px;
      background-color: ${style?.backgroundColor || '#3b82f6'};
      border-radius: ${type === 'circle' ? '50%' : (style?.borderRadius || '4px')};
      ${type === 'triangle' ? 'clip-path: polygon(50% 0%, 0% 100%, 100% 100%);' : ''}
      transform: rotate(${el.rotation || 0}deg);
      z-index: ${el.zIndex || 1};
      opacity: 0;
    \`;
    wrapper.appendChild(${varName});`;
          break;
          
        case 'gradient-rect':
          elementCode = `
    const ${varName} = document.createElement('div');
    ${varName}.style.cssText = \`
      position: absolute;
      left: ${el.x || 50}px;
      top: ${el.y || 50}px;
      width: ${el.width || 100}px;
      height: ${el.height || 100}px;
      background: ${style?.background || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'};
      border-radius: ${style?.borderRadius || '8px'};
      transform: rotate(${el.rotation || 0}deg);
      z-index: ${el.zIndex || 1};
      opacity: 0;
    \`;
    wrapper.appendChild(${varName});`;
          break;
          
        case 'image':
          elementCode = `
    const ${varName} = document.createElement('img');
    ${varName}.src = '${content || '/api/placeholder/200/150'}';
    ${varName}.alt = 'Image';
    ${varName}.style.cssText = \`
      position: absolute;
      left: ${el.x || 50}px;
      top: ${el.y || 50}px;
      width: ${el.width || 200}px;
      height: ${el.height || 150}px;
      object-fit: cover;
      border-radius: ${style?.borderRadius || '4px'};
      transform: rotate(${el.rotation || 0}deg);
      z-index: ${el.zIndex || 1};
      opacity: 0;
    \`;
    wrapper.appendChild(${varName});`;
          break;
      }
      
      return elementCode;
    }).join('\n');

    const returnObject = elements.map(el => `element_${el.id}`).join(', ');
    
    const animationCode = elements
      .sort((a, b) => (a.animationOrder || 0) - (b.animationOrder || 0))
      .map((el, index) => {
        const varName = `element_${el.id}`;
        const delay = index * 0.2;
        
        return `
    gsap.to(${varName}, {
      opacity: 1,
      duration: 0.6,
      delay: ${delay},
      ease: "power2.out"
    });`;
      }).join('\n');

    return `{
  init({ scene, container }) {
    const wrapper = document.createElement('div');
    wrapper.style.cssText = \`
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      position: relative;
    \`;
    container.appendChild(wrapper);
    ${elementCreation}
    
    return { wrapper${returnObject ? ', ' + returnObject : ''} };
  },
  transitionIn({ wrapper${returnObject ? ', ' + returnObject : ''} }) {
    gsap.to(wrapper, { opacity: 1, duration: 0.3 });${animationCode}
  },
  transitionOut({ wrapper${returnObject ? ', ' + returnObject : ''} }) {
    gsap.to(wrapper, { opacity: 0, duration: 0.3 });
  }
}`;
  };

  // Mode synchronization effect - ensures data consistency when switching modes
  useEffect(() => {
    if (!currentSlide) return;
    
    const syncModeData = () => {
      const updatedSlides = [...slides];
      const slideToUpdate = { ...currentSlide };
      
      // When switching to design mode, ensure elements are synced from code if needed
      if (viewMode === 'design') {
        if (!slideToUpdate.elements || slideToUpdate.elements.length === 0) {
          if (slideToUpdate.code && slideToUpdate.code.trim() !== '') {
            console.log('🔄 Syncing elements from code for design mode');
            slideToUpdate.elements = parseCodeToElements(slideToUpdate.code);
            updatedSlides[currentSlideIndex] = slideToUpdate;
            setSlides(updatedSlides);
          }
        }
      }
      
      // When switching to code or preview mode, ensure code is up to date from elements
      if ((viewMode === 'code' || viewMode === 'preview') && slideToUpdate.elements && slideToUpdate.elements.length > 0) {
        const generatedCode = generateSlideCode(slideToUpdate.elements);
        if (slideToUpdate.code !== generatedCode) {
          console.log('🔄 Syncing code from elements for code/preview mode');
          slideToUpdate.code = generatedCode;
          updatedSlides[currentSlideIndex] = slideToUpdate;
          setSlides(updatedSlides);
        }
      }
    };
    
    syncModeData();
  }, [viewMode, currentSlideIndex]); // React to mode changes and slide changes

  // Listen for Electron menu events
  useEffect(() => {
    const handleMenuEvent = (event, data) => {
      switch (event.type) {
        case 'menu-view-mode':
          setViewMode(data);
          break;
        case 'menu-start-presentation':
          setIsPresentationMode(true);
          break;
        case 'menu-new-presentation':
          setSlides(INITIAL_SLIDES);
          setCurrentSlideIndex(0);
          break;
        default:
          break;
      }
    };

    // Mock event listener for web development
    if (window.electronAPI) {
      window.electronAPI.onMenuEvent(handleMenuEvent);
    }

    return () => {
      if (window.electronAPI) {
        window.electronAPI.removeMenuListener(handleMenuEvent);
      }
    };
  }, []);

  // Parse code to extract visual elements
  const parseCodeToElements = (code) => {
    const elements = [];
    
    // Parse text elements
    const textMatches = code.match(/<div[^>]*className="[^"]*slide-text[^"]*"[^>]*>(.*?)<\/div>/gs);
    if (textMatches) {
      textMatches.forEach((match, index) => {
        const content = match.replace(/<[^>]+>/g, '').trim();
        const styleMatch = match.match(/style="([^"]*)"/);
        const style = styleMatch ? styleMatch[1] : '';
        
        // Extract position and styling
        const leftMatch = style.match(/left:\s*([^;]+)/);
        const topMatch = style.match(/top:\s*([^;]+)/);
        const fontSizeMatch = style.match(/font-size:\s*([^;]+)/);
        const colorMatch = style.match(/color:\s*([^;]+)/);
        
        elements.push({
          id: `text-${Date.now()}-${index}`,
          type: 'text',
          content,
          x: leftMatch ? parseInt(leftMatch[1]) : 50,
          y: topMatch ? parseInt(topMatch[1]) : 50 + (index * 60),
          fontSize: fontSizeMatch ? parseInt(fontSizeMatch[1]) : 24,
          color: colorMatch ? colorMatch[1] : '#ffffff',
          fontFamily: 'Arial',
          fontWeight: 'normal'
        });
      });
    }
    
    // Parse image elements
    const imageMatches = code.match(/<img[^>]*src="([^"]*)"[^>]*>/gs);
    if (imageMatches) {
      imageMatches.forEach((match, index) => {
        const srcMatch = match.match(/src="([^"]*)"/);
        const styleMatch = match.match(/style="([^"]*)"/);
        const style = styleMatch ? styleMatch[1] : '';
        
        const leftMatch = style.match(/left:\s*([^;]+)/);
        const topMatch = style.match(/top:\s*([^;]+)/);
        const widthMatch = style.match(/width:\s*([^;]+)/);
        const heightMatch = style.match(/height:\s*([^;]+)/);
        
        elements.push({
          id: `image-${Date.now()}-${index}`,
          type: 'image',
          src: srcMatch ? srcMatch[1] : '',
          x: leftMatch ? parseInt(leftMatch[1]) : 100,
          y: topMatch ? parseInt(topMatch[1]) : 100 + (index * 120),
          width: widthMatch ? parseInt(widthMatch[1]) : 200,
          height: heightMatch ? parseInt(heightMatch[1]) : 150
        });
      });
    }
    
    return elements;
  };

  const updateSlideCode = (code) => {
    const updatedSlides = [...slides];
    const elements = parseCodeToElements(code);
    
    updatedSlides[currentSlideIndex] = {
      ...updatedSlides[currentSlideIndex],
      code,
      elements // Sync elements from parsed code
    };
    setSlides(updatedSlides);
    console.log('🔄 Code updated, elements synced:', elements);
  };

  const updateSlideVisual = (slideData) => {
    const updatedSlides = [...slides];
    
    // Generate code from elements if elements exist
    if (slideData.elements && slideData.elements.length > 0) {
      const generatedCode = generateSlideCode(slideData.elements);
      slideData = { ...slideData, code: generatedCode };
    }
    
    updatedSlides[currentSlideIndex] = slideData;
    setSlides(updatedSlides);
    console.log('🎨 Visual updated, code synced:', slideData.code);
  };

  const addSlide = () => {
    setShowTemplateSelector(true);
  };

  const addSlideWithTemplate = (templateCode) => {
    const newSlide = {
      id: Date.now(),
      title: `Slide ${slides.length + 1}`,
      code: templateCode,
      elements: [], // For visual editor
      content: null
    };
    setSlides([...slides, newSlide]);
    setCurrentSlideIndex(slides.length);
  };

  const deleteSlide = (index) => {
    if (slides.length > 1) {
      const updatedSlides = slides.filter((_, i) => i !== index);
      setSlides(updatedSlides);
      if (currentSlideIndex >= updatedSlides.length) {
        setCurrentSlideIndex(updatedSlides.length - 1);
      }
    }
  };

  const duplicateSlide = (index) => {
    const slideToClone = slides[index];
    const newSlide = {
      ...slideToClone,
      id: Date.now(),
      title: `${slideToClone.title} (Copy)`
    };
    const updatedSlides = [...slides];
    updatedSlides.splice(index + 1, 0, newSlide);
    setSlides(updatedSlides);
    setCurrentSlideIndex(index + 1);
  };

  if (isPresentationMode) {
    return (
      <PresentationMode
        slides={slides}
        onExit={() => setIsPresentationMode(false)}
      />
    );
  }

  return (
    <div className="h-screen bg-darker text-white flex flex-col overflow-hidden">
      <Toolbar
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        onStartPresentation={() => setIsPresentationMode(true)}
        onAddSlide={addSlide}
        theme={theme}
        onThemeChange={setTheme}
      />
      
      <div data-testid="main-content" className="flex-1 flex overflow-hidden">
        <SlideNavigation
          slides={slides}
          currentSlideIndex={currentSlideIndex}
          onSlideSelect={setCurrentSlideIndex}
          onDeleteSlide={deleteSlide}
          onDuplicateSlide={duplicateSlide}
        />

        <div className="flex-1 flex overflow-hidden">
          <AnimatePresence mode="wait">
            {viewMode === 'design' && (
              <motion.div
                key="visual-editor"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                transition={{ duration: 0.3 }}
                className="w-full"
              >
                <VisualSlideEditor
                  data-testid="visual-editor"
                  slide={currentSlide}
                  onChange={updateSlideVisual}
                />
              </motion.div>
            )}

            {(viewMode === 'code' || viewMode === 'split') && (
              <motion.div
                key="code-editor"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className={`bg-dark border-r border-gray-700 ${
                  viewMode === 'split' ? 'w-1/2' : 'w-full'
                }`}
              >
                <CodeEditor
                  data-testid="code-editor"
                  code={currentSlide?.code || ''}
                  onChange={updateSlideCode}
                  theme={theme}
                />
              </motion.div>
            )}

            {(viewMode === 'preview' || viewMode === 'split') && (
              <motion.div
                key="slide-preview"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.2 }}
                className={`bg-gray-900 ${
                  viewMode === 'split' ? 'w-1/2' : 'w-full'
                }`}
              >
                <SlidePreview
                  data-testid="slide-preview"
                  code={currentSlide?.code || ''}
                  slideIndex={currentSlideIndex}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <TemplateSelector
        isOpen={showTemplateSelector}
        onClose={() => setShowTemplateSelector(false)}
        onSelectTemplate={addSlideWithTemplate}
      />
    </div>
  );
}

export default App;
