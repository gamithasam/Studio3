import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CodeEditor from './components/CodeEditor';
import SlidePreview from './components/SlidePreview';
import Toolbar from './components/Toolbar';
import SlideNavigation from './components/SlideNavigation';
import PresentationMode from './components/PresentationMode';
import TemplateSelector from './components/TemplateSelector';
import { slideTemplates } from './data/slideTemplates';

const INITIAL_SLIDES = [
  {
    id: 1,
    title: 'Welcome to Studio3',
    code: slideTemplates.titleSlide,
    content: null
  }
];

function App() {
  const [viewMode, setViewMode] = useState('split'); // 'code', 'preview', 'split'
  const [slides, setSlides] = useState(INITIAL_SLIDES);
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isPresentationMode, setIsPresentationMode] = useState(false);
  const [theme, setTheme] = useState('dark');
  const [showTemplateSelector, setShowTemplateSelector] = useState(false);

  const currentSlide = slides[currentSlideIndex];

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

  const updateSlideCode = (code) => {
    const updatedSlides = [...slides];
    updatedSlides[currentSlideIndex] = {
      ...updatedSlides[currentSlideIndex],
      code
    };
    setSlides(updatedSlides);
  };

  const addSlide = () => {
    setShowTemplateSelector(true);
  };

  const addSlideWithTemplate = (templateCode) => {
    const newSlide = {
      id: Date.now(),
      title: `Slide ${slides.length + 1}`,
      code: templateCode,
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
