import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Copy, Trash2 } from 'lucide-react';

const SlideNavigation = ({ 
  slides, 
  currentSlideIndex, 
  onSlideSelect, 
  onDeleteSlide, 
  onDuplicateSlide 
}) => {
  const [contextMenu, setContextMenu] = useState({ visible: false, x: 0, y: 0, slideIndex: -1 });

  const handleContextMenu = (e, slideIndex) => {
    e.preventDefault();
    setContextMenu({
      visible: true,
      x: e.clientX,
      y: e.clientY,
      slideIndex
    });
  };

  const handleCloseContextMenu = () => {
    setContextMenu({ visible: false, x: 0, y: 0, slideIndex: -1 });
  };

  const handleMenuAction = (action) => {
    const { slideIndex } = contextMenu;
    
    switch (action) {
      case 'duplicate':
        onDuplicateSlide(slideIndex);
        break;
      case 'delete':
        onDeleteSlide(slideIndex);
        break;
      default:
        break;
    }
    
    handleCloseContextMenu();
  };

  // Create a thumbnail preview of the slide
  const generateThumbnail = (slide, index) => {
    const isActive = index === currentSlideIndex;
    
    return (
      <motion.div
        key={slide.id}
        layoutId={`slide-${slide.id}`}
        className={`w-full aspect-video rounded-lg border-2 cursor-pointer transition-all relative group ${
          isActive 
            ? 'border-blue-500 bg-blue-900/20' 
            : 'border-gray-600 bg-gray-800 hover:border-gray-500'
        }`}
        onClick={() => onSlideSelect(index)}
        onContextMenu={(e) => handleContextMenu(e, index)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Slide Number */}
        <div className={`absolute top-2 left-2 text-xs font-medium px-2 py-1 rounded ${
          isActive ? 'bg-blue-500 text-white' : 'bg-gray-700 text-gray-300'
        }`}>
          {index + 1}
        </div>

        {/* Menu Button */}
        <button
          className="absolute top-2 right-2 p-1 rounded opacity-0 group-hover:opacity-100 transition-opacity bg-gray-700 hover:bg-gray-600"
          onClick={(e) => {
            e.stopPropagation();
            handleContextMenu(e, index);
          }}
        >
          <MoreHorizontal size={12} className="text-gray-300" />
        </button>

        {/* Thumbnail Content */}
        <div className="w-full h-full p-3 flex flex-col justify-center items-center text-center">
          <div className={`text-xs font-medium mb-1 ${
            isActive ? 'text-blue-200' : 'text-gray-400'
          }`}>
            {slide.title}
          </div>
          
          {/* Mini preview based on slide content */}
          <div className="flex-1 w-full flex items-center justify-center">
            {slide.code && slide.code.includes('gradient-to-br from-blue') && (
              <div className="w-8 h-6 bg-gradient-to-br from-blue-500 to-purple-600 rounded-sm"></div>
            )}
            {slide.code && slide.code.includes('gradient-to-br from-green') && (
              <div className="w-8 h-6 bg-gradient-to-br from-green-500 to-teal-600 rounded-sm"></div>
            )}
            {slide.code && slide.code.includes('gradient-to-r from-purple') && (
              <div className="w-8 h-6 bg-gradient-to-r from-purple-500 to-pink-600 rounded-sm"></div>
            )}
            {slide.code && slide.code.includes('gradient-to-br from-indigo') && (
              <div className="w-8 h-6 bg-gradient-to-br from-indigo-500 to-blue-600 rounded-sm"></div>
            )}
            {slide.code && slide.code.includes('gradient-to-r from-gray') && (
              <div className="w-8 h-6 bg-gradient-to-r from-gray-600 to-gray-800 rounded-sm"></div>
            )}
            {slide.code && !slide.code.includes('gradient') && (
              <div className="w-8 h-6 bg-gray-600 rounded-sm"></div>
            )}
            {!slide.code && (
              <div className="w-8 h-6 bg-gray-600 rounded-sm"></div>
            )}
          </div>
        </div>

        {/* Active Indicator */}
        {isActive && (
          <motion.div
            layoutId="activeSlide"
            className="absolute inset-0 border-2 border-blue-500 rounded-lg pointer-events-none"
            initial={false}
            transition={{ duration: 0.2 }}
          />
        )}
      </motion.div>
    );
  };

  return (
    <>
      <div data-testid="slide-navigation" className="w-64 bg-darker border-r border-gray-700 flex flex-col">
        <div className="p-4 border-b border-gray-700">
          <h2 className="text-sm font-medium text-gray-300">Slides</h2>
          <p className="text-xs text-gray-500 mt-1">{slides.length} slide{slides.length !== 1 ? 's' : ''}</p>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          <AnimatePresence>
            {slides.map((slide, index) => generateThumbnail(slide, index))}
          </AnimatePresence>
        </div>
      </div>

      {/* Context Menu */}
      <AnimatePresence>
        {contextMenu.visible && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-40"
              onClick={handleCloseContextMenu}
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.1 }}
              className="fixed z-50 bg-gray-800 border border-gray-600 rounded-lg shadow-xl py-2 min-w-[160px]"
              style={{
                left: contextMenu.x,
                top: contextMenu.y,
              }}
            >
              <button
                onClick={() => handleMenuAction('duplicate')}
                className="w-full px-4 py-2 text-left text-sm text-gray-300 hover:bg-gray-700 flex items-center space-x-2"
              >
                <Copy size={14} />
                <span>Duplicate Slide</span>
              </button>
              
              {slides.length > 1 && (
                <button
                  onClick={() => handleMenuAction('delete')}
                  className="w-full px-4 py-2 text-left text-sm text-red-400 hover:bg-gray-700 flex items-center space-x-2"
                >
                  <Trash2 size={14} />
                  <span>Delete Slide</span>
                </button>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

export default SlideNavigation;
