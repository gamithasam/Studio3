import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, X, Grid } from 'lucide-react';

const PresentationMode = ({ slides, onExit }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [showOverview, setShowOverview] = useState(false);
  const [renderedSlides, setRenderedSlides] = useState([]);

  // Render all slides when component mounts
  useEffect(() => {
    const rendered = slides.map((slide, index) => {
      try {
        const transformedCode = transformSlideCode(slide.code);
        const slideFunction = new Function(
          'React',
          'motion',
          'useState',
          'useEffect',
          `
          const { useState, useEffect } = React;
          ${transformedCode}
          return Slide;
          `
        );
        const SlideComponent = slideFunction(React, motion, useState, useEffect);
        return <SlideComponent key={index} />;
      } catch (err) {
        return (
          <div key={index} className="h-full flex items-center justify-center">
            <div className="text-red-400 text-center">
              <div className="text-2xl mb-4">⚠️ Error in Slide {index + 1}</div>
              <div className="text-sm opacity-75">{err.message}</div>
            </div>
          </div>
        );
      }
    });
    setRenderedSlides(rendered);
  }, [slides]);

  // Keyboard navigation
  const handleKeyPress = useCallback((event) => {
    switch (event.key) {
      case 'ArrowRight':
      case ' ':
        event.preventDefault();
        nextSlide();
        break;
      case 'ArrowLeft':
        event.preventDefault();
        prevSlide();
        break;
      case 'Escape':
        event.preventDefault();
        onExit();
        break;
      case 'g':
        event.preventDefault();
        setShowOverview(!showOverview);
        break;
      case 'Home':
        event.preventDefault();
        setCurrentSlideIndex(0);
        break;
      case 'End':
        event.preventDefault();
        setCurrentSlideIndex(slides.length - 1);
        break;
      default:
        // Handle number keys for direct navigation
        const num = parseInt(event.key);
        if (num >= 1 && num <= slides.length) {
          event.preventDefault();
          setCurrentSlideIndex(num - 1);
        }
        break;
    }
  }, [showOverview, slides.length, onExit]);

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress);
    return () => document.removeEventListener('keydown', handleKeyPress);
  }, [handleKeyPress]);

  const nextSlide = () => {
    if (currentSlideIndex < slides.length - 1) {
      setCurrentSlideIndex(currentSlideIndex + 1);
    }
  };

  const prevSlide = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(currentSlideIndex - 1);
    }
  };

  const goToSlide = (index) => {
    setCurrentSlideIndex(index);
    setShowOverview(false);
  };

  const transformSlideCode = (code) => {
    let transformed = code;
    
    // Transform JSX-like syntax to React.createElement calls
    transformed = transformed.replace(
      /<(\w+)([^>]*?)\/>/g,
      (match, tagName, attributes) => {
        const props = parseAttributes(attributes);
        return `React.createElement('${tagName}', ${props})`;
      }
    );
    
    transformed = transformed.replace(
      /<(\w+)([^>]*?)>(.*?)<\/\1>/gs,
      (match, tagName, attributes, children) => {
        const props = parseAttributes(attributes);
        const transformedChildren = transformChildren(children);
        return `React.createElement('${tagName}', ${props}, ${transformedChildren})`;
      }
    );
    
    return transformed;
  };

  const parseAttributes = (attributeString) => {
    if (!attributeString.trim()) return 'null';
    
    const attributes = {};
    const attrRegex = /(\w+)=(?:{([^}]+)}|"([^"]+)"|'([^']+)')/g;
    let match;
    
    while ((match = attrRegex.exec(attributeString)) !== null) {
      const [, name, jsValue, doubleQuotedValue, singleQuotedValue] = match;
      
      if (jsValue) {
        if (name === 'style') {
          attributes[name] = `{${jsValue}}`;
        } else if (name === 'className') {
          attributes[name] = `\`${jsValue}\``;
        } else {
          attributes[name] = jsValue;
        }
      } else {
        const value = doubleQuotedValue || singleQuotedValue;
        attributes[name] = `"${value}"`;
      }
    }
    
    if (Object.keys(attributes).length === 0) return 'null';
    
    const props = Object.entries(attributes)
      .map(([key, value]) => `${key}: ${value}`)
      .join(', ');
    
    return `{ ${props} }`;
  };

  const transformChildren = (children) => {
    if (!children.trim()) return '';
    
    if (children.includes('<')) {
      return transformSlideCode(children);
    }
    
    if (children.includes('{') && children.includes('}')) {
      return children;
    }
    
    return `"${children.trim()}"`;
  };

  if (showOverview) {
    return (
      <div className="fixed inset-0 bg-black z-50 flex flex-col">
        {/* Overview Header */}
        <div className="p-6 flex items-center justify-between">
          <h1 className="text-white text-2xl font-bold">Slide Overview</h1>
          <div className="flex items-center space-x-4">
            <span className="text-gray-400">Press 'G' to toggle overview</span>
            <button
              onClick={() => setShowOverview(false)}
              className="text-gray-400 hover:text-white p-2"
            >
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Overview Grid */}
        <div className="flex-1 p-6 overflow-auto">
          <div className="grid grid-cols-4 gap-6">
            {slides.map((slide, index) => (
              <motion.div
                key={slide.id}
                className={`aspect-video rounded-lg border-2 cursor-pointer transition-all ${
                  index === currentSlideIndex
                    ? 'border-blue-500 bg-blue-900/20'
                    : 'border-gray-600 bg-gray-800 hover:border-gray-500'
                }`}
                onClick={() => goToSlide(index)}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <div className="w-full h-full relative overflow-hidden rounded-lg">
                  <div className="absolute top-2 left-2 bg-black/50 text-white text-xs px-2 py-1 rounded">
                    {index + 1}
                  </div>
                  <div className="w-full h-full transform scale-25 origin-top-left">
                    <div style={{ width: '400%', height: '400%' }}>
                      {renderedSlides[index]}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Presentation Controls */}
      <div className="absolute top-4 right-4 z-10 flex items-center space-x-2">
        <motion.button
          onClick={() => setShowOverview(true)}
          className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
          whileTap={{ scale: 0.95 }}
          title="Show overview (G)"
        >
          <Grid size={20} />
        </motion.button>
        <motion.button
          onClick={onExit}
          className="p-2 bg-black/50 text-white rounded-lg hover:bg-black/70 transition-colors"
          whileTap={{ scale: 0.95 }}
          title="Exit presentation (Esc)"
        >
          <X size={20} />
        </motion.button>
      </div>

      {/* Slide Counter */}
      <div className="absolute bottom-4 right-4 z-10 bg-black/50 text-white px-3 py-1 rounded-lg text-sm">
        {currentSlideIndex + 1} / {slides.length}
      </div>

      {/* Navigation Arrows */}
      {currentSlideIndex > 0 && (
        <motion.button
          onClick={prevSlide}
          className="absolute left-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
        >
          <ChevronLeft size={24} />
        </motion.button>
      )}

      {currentSlideIndex < slides.length - 1 && (
        <motion.button
          onClick={nextSlide}
          className="absolute right-4 top-1/2 -translate-y-1/2 z-10 p-3 bg-black/50 text-white rounded-full hover:bg-black/70 transition-colors"
          whileTap={{ scale: 0.95 }}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 20 }}
        >
          <ChevronRight size={24} />
        </motion.button>
      )}

      {/* Main Slide Area */}
      <div className="flex-1 relative overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlideIndex}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
            className="w-full h-full"
          >
            {renderedSlides[currentSlideIndex]}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Keyboard Shortcuts Help */}
      <div className="absolute bottom-4 left-4 z-10 text-xs text-gray-400 space-y-1">
        <div>← → Space: Navigate</div>
        <div>G: Overview • Esc: Exit</div>
        <div>1-9: Jump to slide</div>
      </div>
    </div>
  );
};

export default PresentationMode;
